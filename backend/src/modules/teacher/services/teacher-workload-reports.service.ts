import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { UpdateTeacherTaskDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherWorkloadReportsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getWorkloadAndTasks(organizationId: string, user: User) {
    const [counts] = await this.drizzle.query(
      `SELECT COUNT(*)::int AS periods,COUNT(*) FILTER (WHERE is_substitution)::int AS substitutions FROM teacher_timetable_slots WHERE organization_id=$1 AND teacher_user_id=$2`, [organizationId,user.id]);
    const [periods] = await this.drizzle.query(`SELECT COUNT(*)::int AS total FROM timetable_entries t JOIN academic_years y ON y.id=t.academic_year_id AND y.organization_id=t.organization_id AND y.is_current WHERE t.organization_id=$1 AND t.teacher_user_id=$2`, [organizationId,user.id]);
    const [roster] = await this.drizzle.query(`SELECT COUNT(DISTINCT c.section_id)::int AS sections,COUNT(DISTINCT e.student_user_id)::int AS students FROM class_subject_assignments c LEFT JOIN enrollments e ON e.organization_id=c.organization_id AND e.section_id=c.section_id AND e.status='active' WHERE c.organization_id=$1 AND c.teacher_user_id=$2`, [organizationId,user.id]);
    const [evaluations] = await this.drizzle.query(`SELECT COUNT(*)::int AS total FROM submissions s JOIN assignments a ON a.id=s.assignment_id AND a.organization_id=s.organization_id WHERE a.organization_id=$1 AND a.created_by=$2 AND s.status IN ('submitted','late')`, [organizationId,user.id]);
    const tasks = await this.drizzle.query(`SELECT id,task_type AS "taskType",title,description,to_char(due_date,'YYYY-MM-DD') AS "dueDate",status,priority FROM teacher_academic_tasks WHERE organization_id=$1 AND teacher_user_id=$2 ORDER BY due_date`, [organizationId,user.id]);
    const weeklyPeriods = Number(periods.total);
    return { workload:{ teachingPeriods:weeklyPeriods,weeklyPeriods,maxPeriods:null,maxWeeklyPeriods:null,preparationPeriods:null,remedialPeriods:null,dutyPeriods:Number(counts.substitutions),totalLoad:weeklyPeriods,
      classesCount:roster.sections,sectionsCount:roster.sections,studentsCount:roster.students,evaluationsPending:evaluations.total,pendingAssignments:tasks.filter(t=>t.taskType==='evaluation'&&t.status==='pending').length,assessmentsThisWeek:null,examDuties:null,additionalResponsibilities:[],status:weeklyPeriods?'Assigned periods':'No periods assigned' },tasks };
  }

  async updateTaskStatus(organizationId: string, user: User, taskId: string, dto: UpdateTeacherTaskDto) {
    const rows = await this.drizzle.query(`UPDATE teacher_academic_tasks SET status=$1 WHERE organization_id=$2 AND id=$3 AND teacher_user_id=$4 RETURNING id`, [dto.status,organizationId,taskId,user.id]);
    if (!rows.length) throw new NotFoundException('Task not found');
    return { success:true,taskId,status:dto.status };
  }

  async getCalendar(organizationId: string, user: User, month?: string) {
    let dbExams: any[] = [];
    try {
      dbExams = await this.drizzle.query(
        `SELECT ep.exam_name AS title, ep.exam_date FROM principal_exam_plans ep
         WHERE ep.organization_id=$1 AND ep.status='scheduled' AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=ep.organization_id AND c.section_id=ep.section_id AND c.subject_id=ep.subject_id AND c.teacher_user_id=$2)
         ORDER BY ep.exam_date LIMIT 100`,
        [organizationId, user.id]
      );
    } catch (error) { throw error; }

    let dbTasks: any[] = [];
    try {
      dbTasks = await this.drizzle.query(
        `SELECT title, due_date FROM teacher_academic_tasks
         WHERE organization_id = $1 AND teacher_user_id = $2
         ORDER BY due_date ASC LIMIT 5`,
        [organizationId, user.id]
      );
    } catch (error) { throw error; }

    let dbPtms: any[] = [];
    try {
      dbPtms = await this.drizzle.query(
        `SELECT title, event_date, start_time, end_time FROM ptm_schedules
         WHERE organization_id = $1
         ORDER BY event_date ASC LIMIT 5`,
        [organizationId]
      );
    } catch (error) { throw error; }

    const events: any[] = [];
    for (const e of dbExams) {
      events.push({
        date: new Date(e.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        title: e.title,
        type: 'Exam',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        description: `Official Exam Assessment for ${e.title}`,
      });
    }
    for (const t of dbTasks) {
      events.push({
        date: new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        title: t.title,
        type: 'Deadline',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        description: `Academic submission deadline: ${t.title}`,
      });
    }
    for (const p of dbPtms) {
      events.push({
        date: new Date(p.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        title: p.title || 'Parent-Teacher Meeting',
        type: 'PTM',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: `Scheduled Parent-Teacher Conference (${p.start_time || ''} - ${p.end_time || ''})`,
      });
    }

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      month: month || 'Current Academic Month',
      stats: {
        exams: `${dbExams.length} Papers`,
        deadlines: `${dbTasks.length} Pending`,
        ptm: dbPtms.length > 0 ? `${dbPtms.length} Scheduled` : '0 Scheduled',
        holidays: '0 Days',
      },
      events,
    };
  }

  async getReportsAndHeatmap(organizationId: string, user: User, sectionId?: string) {
    const rows = await this.drizzle.query(
      `SELECT e.student_user_id AS id,u.name,e.roll_number AS "rollNumber",s.name AS "className",sub.name AS subject,
        AVG(100.0*ss.score/NULLIF(a.max_score,0)) AS avg
       FROM enrollments e JOIN users u ON u.id=e.student_user_id JOIN sections s ON s.id=e.section_id AND s.organization_id=e.organization_id
       JOIN class_subject_assignments c ON c.organization_id=e.organization_id AND c.section_id=e.section_id AND c.teacher_user_id=$2
       JOIN subjects sub ON sub.id=c.subject_id AND sub.organization_id=c.organization_id
       LEFT JOIN assignments a ON a.organization_id=c.organization_id AND a.section_id=c.section_id AND a.subject_id=c.subject_id
       LEFT JOIN submissions ss ON ss.organization_id=a.organization_id AND ss.assignment_id=a.id AND ss.student_id=u.id AND ss.status='graded'
       WHERE e.organization_id=$1 AND e.status='active' AND ($3::uuid IS NULL OR e.section_id=$3)
       GROUP BY e.student_user_id,u.name,e.roll_number,s.name,sub.name ORDER BY s.name,e.roll_number`, [organizationId,user.id,sectionId || null]);
    return { className:rows[0]?.className || '',subjectName:rows[0]?.subject || '',outcomes:[],loDefinitions:[],heatmap:[],students:rows.map(s=>({...s,avg:s.avg==null?null:Number(s.avg),scores:[],status:s.avg==null?'No results':Number(s.avg)>=40?'On Track':'Needs Support'})),summaryReports:[] };
  }

  async getActivityTimeline(organizationId: string, user: User) {
    const list: any[] = [];

    // 1. Deliveries
    try {
      const deliveries = await this.drizzle.query(
        `SELECT id, topics_covered, delivery_date, period_number, created_at
         FROM teacher_lesson_deliveries
         WHERE organization_id = $1 AND teacher_user_id = $2
         ORDER BY created_at DESC LIMIT 5`,
        [organizationId, user.id]
      );
      for (const d of (deliveries || [])) {
        list.push({
          id: d.id,
          action: 'Logged Lesson Delivery & Reflection',
          details: `Conducted Period ${d.period_number}: ${d.topics_covered}`,
          timestamp: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          type: 'lesson',
          badge: 'Teaching',
          color: 'bg-indigo-500',
          created_at: new Date(d.created_at).getTime(),
        });
      }
    } catch (error) { throw error; }

    // 2. Attendance Sessions (using taken_by)
    try {
      const attendance = await this.drizzle.query(
        `SELECT id, date, period, created_at
         FROM attendance_sessions
         WHERE organization_id = $1 AND taken_by = $2
         ORDER BY created_at DESC LIMIT 5`,
        [organizationId, user.id]
      );
      for (const a of (attendance || [])) {
        list.push({
          id: a.id,
          action: 'Marked Period Attendance Register',
          details: `Attendance session recorded for Period ${a.period} on ${a.date}`,
          timestamp: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          type: 'attendance',
          badge: 'Attendance',
          color: 'bg-blue-500',
          created_at: new Date(a.created_at).getTime(),
        });
      }
    } catch (error) { throw error; }

    // 3. Materials
    try {
      const materials = await this.drizzle.query(
        `SELECT id, title, chapter, created_at
         FROM teacher_study_materials
         WHERE organization_id = $1 AND teacher_user_id = $2
         ORDER BY created_at DESC LIMIT 5`,
        [organizationId, user.id]
      );
      for (const m of (materials || [])) {
        list.push({
          id: m.id,
          action: 'Uploaded Course Material',
          details: `Shared study document "${m.title}" for ${m.chapter}`,
          timestamp: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          type: 'material',
          badge: 'Resources',
          color: 'bg-purple-500',
          created_at: new Date(m.created_at).getTime(),
        });
      }
    } catch (error) { throw error; }

    // 4. Teacher Messages sent
    try {
      const messages = await this.drizzle.query(
        `SELECT id, subject_line, body, created_at
         FROM teacher_messages
         WHERE organization_id = $1 AND sender_id = $2
         ORDER BY created_at DESC LIMIT 5`,
        [organizationId, user.id]
      );
      for (const msg of (messages || [])) {
        list.push({
          id: msg.id,
          action: `Sent Academic Message: ${msg.subject_line || 'Direct Message'}`,
          details: msg.body ? (msg.body.length > 80 ? msg.body.substring(0, 77) + '...' : msg.body) : 'Sent message to student/parent',
          timestamp: new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          type: 'communication',
          badge: 'Inbox',
          color: 'bg-emerald-500',
          created_at: new Date(msg.created_at).getTime(),
        });
      }
    } catch (error) { throw error; }

    // 5. Completed Academic Tasks
    try {
      const tasks = await this.drizzle.query(
        `SELECT id, title, description, created_at
         FROM teacher_academic_tasks
         WHERE organization_id = $1 AND teacher_user_id = $2 AND status = 'completed'
         ORDER BY created_at DESC LIMIT 5`,
        [organizationId, user.id]
      );
      for (const t of (tasks || [])) {
        list.push({
          id: t.id,
          action: `Completed Task: ${t.title}`,
          details: t.description || 'Milestone submission marked complete',
          timestamp: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          type: 'task',
          badge: 'Milestone',
          color: 'bg-amber-500',
          created_at: new Date(t.created_at).getTime(),
        });
      }
    } catch (error) { throw error; }

    // Sort list chronologically descending
    list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    return {
      activities: list,
      timeline: list.map(a => ({
        id: a.id,
        time: a.timestamp,
        action: a.action,
        detail: a.details,
        category: a.type,
      })),
    };
  }
}
