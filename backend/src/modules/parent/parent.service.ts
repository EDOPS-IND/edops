import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../auth/user.entity';
import { SchoolWork } from '../tenants/school-work.service';
import { Queryable } from '../billing/entitlements';
import { ParentBookingDto, ParentLeaveDto, ParentQueryDto } from './parent.dto';

@Injectable()
export class ParentService {
  constructor(private readonly work: SchoolWork) {}

  private run<T>(org: string, actor: User, student: string, action: string | null, fn: (m: Queryable, child: any) => Promise<T>) {
    let child: any;
    return this.work.run(org,actor,action,null,null,m=>fn(m,child),{ roles:['parent'],authorize:async m=>{
      const [row] = await m.query(`SELECT u.id,u.name,u.email,COALESCE(sec.name,'') AS section FROM parent_student_relationships psr
        JOIN users u ON u.id=psr.student_id AND u.is_active
        LEFT JOIN enrollments e ON e.organization_id=psr.school_id AND e.student_user_id=u.id AND e.status='active'
        LEFT JOIN sections sec ON sec.organization_id=e.organization_id AND sec.id=e.section_id
        WHERE psr.school_id=$1 AND psr.parent_id=$2 AND psr.student_id=$3 AND psr.verification_status='verified' AND psr.status='active' LIMIT 1`, [org,actor.id,student]);
      if (!row) throw new NotFoundException('Verified child relationship not found');
      child=row;
    }});
  }

  details(org: string, actor: User, student: string) {
    return this.run(org,actor,student,null,async m=>{
      const subjects = await m.query(`SELECT DISTINCT sub.id,sub.name,sub.code,u.name AS teacher,u.id AS "teacherId" FROM enrollments e
        JOIN class_subject_assignments c ON c.organization_id=e.organization_id AND c.section_id=e.section_id
        JOIN subjects sub ON sub.organization_id=c.organization_id AND sub.id=c.subject_id JOIN users u ON u.id=c.teacher_user_id
        WHERE e.organization_id=$1 AND e.student_user_id=$2 AND e.status='active' ORDER BY sub.name`, [org,student]);
      const assignments = await m.query(`SELECT a.id,a.title,a.due_at AS "dueDate",sub.name AS subject,COALESCE(s.status,'pending') AS status FROM assignments a
        JOIN subjects sub ON sub.organization_id=a.organization_id AND sub.id=a.subject_id LEFT JOIN submissions s ON s.organization_id=a.organization_id AND s.assignment_id=a.id AND s.student_id=$2
        WHERE a.organization_id=$1 AND a.status='published' AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=a.organization_id AND e.section_id=a.section_id AND e.student_user_id=$2 AND e.status='active') ORDER BY a.due_at`, [org,student]);
      const attendance = await m.query(`SELECT ats.date,ats.period,r.status FROM attendance_records r JOIN attendance_sessions ats ON ats.organization_id=r.organization_id AND ats.id=r.attendance_session_id WHERE r.organization_id=$1 AND r.student_id=$2 AND ats.status='finalized' ORDER BY ats.date DESC,ats.period`, [org,student]);
      const timetable = await m.query(`SELECT t.id,t.day_of_week AS day,t.period_number AS period,t.start_time AS "startTime",t.end_time AS "endTime",sub.name AS subject,u.name AS teacher,t.room_number AS room FROM timetable_entries t
        JOIN academic_years y ON y.organization_id=t.organization_id AND y.id=t.academic_year_id AND y.is_current
        JOIN subjects sub ON sub.organization_id=t.organization_id AND sub.id=t.subject_id JOIN users u ON u.id=t.teacher_user_id
        WHERE t.organization_id=$1 AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=t.organization_id AND e.section_id=t.section_id AND e.student_user_id=$2 AND e.status='active') ORDER BY t.day_of_week,t.period_number`, [org,student]);
      const results = await m.query(`SELECT id,exam_name AS exam,subject_name AS subject,marks_obtained AS score,max_marks AS max,percentage,grade,published_at AS date FROM principal_exam_results WHERE organization_id=$1 AND student_user_id=$2 AND status='Published' ORDER BY published_at DESC`, [org,student]);
      const fees = await m.query(`SELECT d.id,COALESCE(f.name,'School fee') AS title,d.total_due AS amount,d.amount_paid AS "paidAmount",d.amount_pending AS pending,d.due_date AS "dueDate",d.status FROM student_fee_dues d LEFT JOIN fee_structures f ON f.organization_id=d.organization_id AND f.id=d.fee_structure_id WHERE d.organization_id=$1 AND d.student_user_id=$2 ORDER BY d.due_date DESC`, [org,student]);
      const broadcasts = await m.query(`SELECT id,title AS subject,message AS body,created_at AS date FROM school_broadcasts WHERE organization_id=$1 AND target_audience IN ('all','parents') ORDER BY created_at DESC`, [org]);
      const inbox=await m.query(`SELECT id,subject_line AS subject,body,created_at AS date FROM teacher_messages WHERE organization_id=$1 AND recipient_id=$2 ORDER BY created_at DESC`,[org,actor.id]);
      const notices=[...broadcasts,...inbox];
      const leaves = await m.query(`SELECT id,user_id AS "studentUserId",applicant_name AS "childName",leave_type AS "leaveType",to_char(start_date,'YYYY-MM-DD') AS "startDate",to_char(end_date,'YYYY-MM-DD') AS "endDate",reason,status,created_at AS "submittedAt" FROM leave_requests WHERE organization_id=$1 AND user_id=$2 ORDER BY created_at DESC`, [org,student]);
      const queries = await m.query(`SELECT id,student_user_id AS "studentUserId",student_name AS "childName",subject,query_text AS "queryText",status,resolution_notes AS response,created_at AS "submittedAt" FROM principal_parent_queries WHERE organization_id=$1 AND parent_user_id=$2 AND student_user_id=$3 ORDER BY created_at DESC`, [org,actor.id,student]);
      const schedules = await m.query(`SELECT id,title,to_char(event_date,'YYYY-MM-DD') AS date,start_time AS "startTime",end_time AS "endTime",slot_duration_minutes AS duration,total_slots AS "totalSlots",booked_slots AS "bookedSlots" FROM ptm_schedules WHERE organization_id=$1 AND status='open' AND event_date>=CURRENT_DATE ORDER BY event_date`, [org]);
      const bookings = await m.query(`SELECT b.id,b.schedule_id AS "scheduleId",b.slot_index AS "slotIndex",b.teacher_user_id AS "teacherId",u.name AS "teacherName",s.title,s.event_date AS date,b.status FROM ptm_bookings b JOIN ptm_schedules s ON s.id=b.schedule_id AND s.organization_id=b.organization_id JOIN users u ON u.id=b.teacher_user_id WHERE b.organization_id=$1 AND b.parent_user_id=$2 AND b.student_user_id=$3 ORDER BY s.event_date`, [org,actor.id,student]);
      return { subjects,assignments,attendance,timetable,results,fees,notices,leaves,queries,schedules,bookings };
    });
  }

  leave(org: string, actor: User, student: string, dto: ParentLeaveDto) {
    if (dto.endDate<dto.startDate) throw new BadRequestException('End date must not precede start date');
    return this.run(org,actor,student,'parent.leave.created',async (m,child)=>{
      const [row] = await m.query(`INSERT INTO leave_requests (organization_id,user_id,applicant_name,applicant_role,leave_type,start_date,end_date,days_count,reason) VALUES ($1,$2,$3,'student',$4,$5,$6,($6::date-$5::date)+1,$7) RETURNING *`, [org,student,child.name || child.email,dto.leaveType,dto.startDate,dto.endDate,dto.reason]);
      return row;
    });
  }
  query(org: string, actor: User, student: string, dto: ParentQueryDto) {
    return this.run(org,actor,student,'parent.query.created',async (m,child)=>{
      const [row] = await m.query(`INSERT INTO principal_parent_queries (organization_id,parent_user_id,student_user_id,parent_name,parent_email,student_name,class_section,subject,query_text) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [org,actor.id,student,actor.name || actor.email,actor.email,child.name || child.email,child.section,dto.subject,dto.queryText]);
      return row;
    });
  }
  book(org: string, actor: User, student: string, dto: ParentBookingDto) {
    return this.run(org,actor,student,'parent.ptm.booked',async m=>{
      const [schedule] = await m.query(`SELECT * FROM ptm_schedules WHERE organization_id=$1 AND id=$2 AND status='open' AND event_date>=CURRENT_DATE FOR UPDATE`, [org,dto.scheduleId]);
      if (!schedule) throw new NotFoundException('Open PTM schedule not found');
      const [teacher] = await m.query(`SELECT 1 FROM class_subject_assignments c JOIN enrollments e ON e.organization_id=c.organization_id AND e.section_id=c.section_id WHERE c.organization_id=$1 AND c.teacher_user_id=$2 AND e.student_user_id=$3 AND e.status='active' LIMIT 1`, [org,dto.teacherId,student]);
      if (!teacher) throw new NotFoundException('Assigned teacher not found');
      const mins=(s:string)=>{const match=s.match(/^(\d{1,2}):(\d{2})$/);return match?Number(match[1])*60+Number(match[2]):NaN;};
      const start=mins(schedule.start_time),end=mins(schedule.end_time),duration=Number(schedule.slot_duration_minutes);
      if (!Number.isFinite(start)||!Number.isFinite(end)||duration<=0||start+duration*(dto.slotIndex+1)>end) throw new BadRequestException('Invalid meeting slot');
      const [conflict] = await m.query(`SELECT id FROM ptm_bookings WHERE schedule_id=$1 AND slot_index=$2 AND status='confirmed' AND (teacher_user_id=$3 OR parent_user_id=$4)`, [dto.scheduleId,dto.slotIndex,dto.teacherId,actor.id]);
      if (conflict || schedule.booked_slots>=schedule.total_slots) throw new ConflictException('Meeting slot is no longer available');
      const [row] = await m.query(`INSERT INTO ptm_bookings (organization_id,schedule_id,parent_user_id,student_user_id,teacher_user_id,slot_index,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [org,dto.scheduleId,actor.id,student,dto.teacherId,dto.slotIndex,dto.notes]);
      await m.query(`UPDATE ptm_schedules SET booked_slots=booked_slots+1 WHERE organization_id=$1 AND id=$2`, [org,dto.scheduleId]);
      return row;
    });
  }
  cancel(org: string, actor: User, student: string, id: string) {
    return this.run(org,actor,student,'parent.ptm.cancelled',async m=>{
      const [booking] = await m.query(`UPDATE ptm_bookings SET status='cancelled' WHERE organization_id=$1 AND parent_user_id=$2 AND student_user_id=$3 AND id=$4 AND status='confirmed' RETURNING schedule_id`, [org,actor.id,student,id]);
      if (!booking) throw new NotFoundException('Confirmed booking not found');
      await m.query(`UPDATE ptm_schedules SET booked_slots=GREATEST(0,booked_slots-1) WHERE organization_id=$1 AND id=$2`, [org,booking.schedule_id]);
      return { success:true };
    });
  }
}
