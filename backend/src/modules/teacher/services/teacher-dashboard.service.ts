import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { TeacherTimetableService } from './teacher-timetable.service';
import { TeacherClassesService } from './teacher-classes.service';

@Injectable()
export class TeacherDashboardService {
  constructor(private readonly drizzle: DrizzleService,private readonly timetable:TeacherTimetableService,private readonly classes:TeacherClassesService) {}
  async getDashboard(organizationId: string,user:User) {
    const today=await this.timetable.getTodayTimetable(organizationId,user);
    const classes=await this.classes.getMyClasses(organizationId,user);
    const [evaluations]=await this.drizzle.query(`SELECT COUNT(*)::int AS total FROM submissions s JOIN assignments a ON a.id=s.assignment_id AND a.organization_id=s.organization_id WHERE a.organization_id=$1 AND a.created_by=$2 AND s.status IN ('submitted','late')`, [organizationId,user.id]);
    const [students]=await this.drizzle.query(`SELECT COUNT(DISTINCT e.student_user_id)::int AS total FROM enrollments e WHERE e.organization_id=$1 AND e.status='active' AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=e.organization_id AND c.section_id=e.section_id AND c.teacher_user_id=$2)`, [organizationId,user.id]);
    const recentActivity=await this.drizzle.query(`SELECT id,action AS text,created_at AS time FROM audit_events WHERE organization_id=$1 AND actor_id=$2 ORDER BY created_at DESC LIMIT 10`, [organizationId,user.id]);
    const [messages]=await this.drizzle.query(`SELECT COUNT(*)::int AS total FROM teacher_messages WHERE organization_id=$1 AND recipient_id=$2 AND NOT is_read`, [organizationId,user.id]);
    const pendingAttendance=today.slots.filter(s=>!s.attendanceTaken).length;
    return {teacher:{ id:user.id,name:user.name || user.email,email:user.email,primarySubject:classes.classes[0]?.subjectName || '',assignedClassesCount:new Set(classes.classes.map(c=>c.sectionId)).size,totalStudents:students.total },
      kpis:{classesToday:today.slots.length,periodsToday:today.slots.length,studentsToday:students.total,pendingAttendance,pendingEvaluations:evaluations.total,upcomingAssessments:null,curriculumProgress:null,unreadMessages:messages.total},
      nextClass:today.activeSlot,todaySchedule:today.slots.map(s=>({...s,time:`${s.startTime} – ${s.endTime}`,attendanceDone:s.attendanceTaken})),recentActivity,
      attentionRequired:evaluations.total?[{id:'evaluations',type:'evaluation_pending',message:`${evaluations.total} submissions awaiting evaluation`,severity:'warning',action:'Open Evaluation Queue'}]:[] };
  }
}
