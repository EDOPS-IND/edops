import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../../database/drizzle.service';
import { StudentClassesService } from './student-classes.service';
import { StudentTimetableService } from './student-timetable.service';
import { StudentAssignmentsService } from './student-assignments.service';
import { StudentAttendanceService } from './student-attendance.service';
import { StudentCurriculumService } from './student-curriculum.service';
import { StudentPerformanceService } from './student-performance.service';
import { StudentCommunicationService } from './student-communication.service';

@Injectable()
export class StudentDashboardService {
  constructor(private readonly drizzle: DrizzleService,
    private readonly classes: StudentClassesService, private readonly timetableService: StudentTimetableService,
    private readonly assignments: StudentAssignmentsService, private readonly attendance: StudentAttendanceService,
    private readonly curriculum: StudentCurriculumService, private readonly performance: StudentPerformanceService,
    private readonly communication: StudentCommunicationService) {}

  async getDashboard(organizationId: string, studentUserId: string) {
    const classData = await this.classes.getClassDetails(organizationId, studentUserId);
    const timetableData = await this.timetableService.getTimetable(organizationId, studentUserId);
    const assignmentData = await this.assignments.getAssignments(organizationId, studentUserId);
    const attendanceData = await this.attendance.getAttendance(organizationId, studentUserId);
    const curriculumData = await this.curriculum.getCurriculum(organizationId, studentUserId);
    const performanceData = await this.performance.getPerformance(organizationId, studentUserId);
    const messageData = await this.communication.getMessages(organizationId, studentUserId);
    const [student] = await this.drizzle.query(`SELECT id,name,email FROM users WHERE id=$1`, [studentUserId]);
    const recentActivity = await this.drizzle.query(
      `SELECT id,action AS text,created_at AS time FROM audit_events WHERE organization_id=$1 AND actor_id=$2 ORDER BY created_at DESC LIMIT 10`, [organizationId,studentUserId]);
    const [stats] = await this.drizzle.query(`SELECT COUNT(DISTINCT question_id)::int AS completed FROM arena_attempts WHERE organization_id=$1 AND student_id=$2`, [organizationId,studentUserId]);
    const [org] = await this.drizzle.query(`SELECT time_zone FROM organizations WHERE id=$1`, [organizationId]);
    const day = new Intl.DateTimeFormat('en-US',{ weekday:'long',timeZone:org?.time_zone || 'UTC' }).format(new Date()).toLowerCase();
    const timetable = timetableData.weeklySchedule[day] || [];
    const pendingTasks = assignmentData.assignments.filter(a=>a.status==='pending').map(a=>({ id:a.id,title:a.title,type:'assignment',dueDate:a.dueDate,priority:'normal' }));
    const overallAttendance = attendanceData.summary.overallPercentage;
    return {
      student,studentName:student?.name || student?.email || '',
      enrollment:classData.classInfo ? { ...classData.classInfo,classSection:classData.classInfo.className,totalClassmates:classData.classmates.length } : null,
      kpis:{ overallAttendance,academicAverage:performanceData.overall.currentAverage,improvement:null,
        assignmentCompletion:assignmentData.summary.completionPct,assignmentsPending:assignmentData.summary.pending,curriculumProgress:curriculumData.overallProgress },
      nextClass:null,timetable,recentActivity,pendingTasks,
      attentionRequired:pendingTasks.map(t=>({ ...t,severity:'warning',message:t.title,desc:t.dueDate,action:'View Assignments' })),
      alerts:overallAttendance!=null && overallAttendance<75 ? [{ id:'attendance',type:'warning',title:'Attendance below threshold',message:`Recorded attendance is ${overallAttendance}%.` }] : [],
      recentMessages:messageData.messages.slice(0,5),
      metrics:{ attendanceRate:overallAttendance,xp:null,rank:null,activeAssignments:assignmentData.summary.pending,completedTests:stats.completed },
    };
  }
  async getProfile(organizationId:string,studentUserId:string) {
    const [student]=await this.drizzle.query(`SELECT u.name,u.email,e.roll_number AS "rollNo",sec.name AS "classSection",y.name AS "academicYear",sp.admission_number AS "admissionNo",sp.dob,sp.guardian_name AS "guardianName",sp.guardian_phone AS "guardianPhone",m.status FROM memberships m JOIN users u ON u.id=m.user_id LEFT JOIN student_profiles sp ON sp.organization_id=m.organization_id AND sp.student_user_id=m.user_id LEFT JOIN enrollments e ON e.organization_id=m.organization_id AND e.student_user_id=m.user_id AND e.status='active' LEFT JOIN sections sec ON sec.id=e.section_id AND sec.organization_id=e.organization_id LEFT JOIN academic_years y ON y.id=e.academic_year_id AND y.organization_id=e.organization_id WHERE m.organization_id=$1 AND m.user_id=$2 AND m.role='student'`,[organizationId,studentUserId]);
    return {student:student || null,documents:[]};
  }
  async getCalendar(organizationId:string,studentUserId:string) {
    const assignments=await this.assignments.getAssignments(organizationId,studentUserId);
    const exams=await this.drizzle.query(`SELECT ep.id,ep.exam_name AS title,ep.exam_date AS date,ep.start_time || ' - ' || ep.end_time AS time FROM principal_exam_plans ep WHERE ep.organization_id=$1 AND ep.status='scheduled' AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=ep.organization_id AND e.section_id=ep.section_id AND e.student_user_id=$2 AND e.status='active') ORDER BY ep.exam_date`,[organizationId,studentUserId]);
    return {events:[...assignments.assignments.map(a=>({id:a.id,title:a.title,date:a.dueDate,type:'Deadline',time:'',description:a.description})),...exams.map(e=>({...e,type:'Exam',description:''}))]};
  }

}
