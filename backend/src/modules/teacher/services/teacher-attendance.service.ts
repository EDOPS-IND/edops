import { randomUUID } from 'node:crypto';
import { AttendanceService } from '../../attendance/attendance.service';
import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { QuickAttendanceDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherAttendanceService {
  constructor(private readonly drizzle: DrizzleService,private readonly attendanceService:AttendanceService) {}

  async getAttendanceOverview(organizationId: string, user: User) {
    let recentSessions: any[] = [];
    let defaultersAlerts: any[] = [];
    let todaySessionsCount = 0;
    let totalPresent = 0;
    let totalRecords = 0;

    try {
      // 1. Fetch real attendance sessions from database
      const sessionRows = await this.drizzle.query(
        `SELECT 
           s.id,
           to_char(s.date, 'YYYY-MM-DD') as date,
           s.period,
           s.status,
           coalesce(sec.name, 'Class') as class_section,
           coalesce(sub.name, 'General') as subject_name,
           COUNT(CASE WHEN r.status = 'present' THEN 1 END)::int as present_count,
           COUNT(CASE WHEN r.status = 'absent' THEN 1 END)::int as absent_count,
           COUNT(CASE WHEN r.status = 'late' THEN 1 END)::int as late_count
         FROM attendance_sessions s
         LEFT JOIN sections sec ON sec.id = s.section_id AND sec.organization_id = s.organization_id
         LEFT JOIN subjects sub ON sub.id = s.subject_id AND sub.organization_id = s.organization_id
         LEFT JOIN attendance_records r ON r.attendance_session_id = s.id AND r.organization_id = s.organization_id
         WHERE s.organization_id = $1 AND s.taken_by=$2
         GROUP BY s.id, s.date, s.period, s.status, sec.name, sub.name, s.finalized_at
         ORDER BY s.date DESC, s.period DESC, s.finalized_at DESC
         LIMIT 20`,
        [organizationId,user.id]
      );

      if (sessionRows && sessionRows.length > 0) {
        recentSessions = sessionRows.map((row: any) => ({
          id: row.id,
          date: row.date,
          period: Number(row.period),
          classSection: row.class_section.startsWith('Class ') ? row.class_section : `Class ${row.class_section}`,
          subject: row.subject_name,
          present: Number(row.present_count || 0),
          absent: Number(row.absent_count || 0),
          late: Number(row.late_count || 0),
          status: row.status === 'finalized' ? 'Finalized' : 'Draft',
        }));

        const todayStr = new Date().toISOString().split('T')[0];
        const todayRows = recentSessions.filter((s: any) => s.date === todayStr);
        todaySessionsCount = todayRows.length;

        for (const s of recentSessions) {
          totalPresent += s.present;
          totalRecords += (s.present + s.absent + s.late);
        }
      }
    } catch (error) { throw error; }

    try {
      // 2. Fetch real defaulters from database (attendance < 75%)
      const defaulterRows = await this.drizzle.query(
        `SELECT 
           e.student_user_id as id,
           coalesce(u.name, 'Student') as student_name,
           coalesce(sec.name, 'Class') as class_section,
           COUNT(CASE WHEN r.status = 'absent' THEN 1 END)::int as total_absences,
           COUNT(r.id)::int as total_sessions,
           COUNT(CASE WHEN r.status = 'present' THEN 1 END)::int as present_count
         FROM enrollments e
         JOIN users u ON u.id = e.student_user_id
         JOIN sections sec ON sec.id = e.section_id AND sec.organization_id = e.organization_id
         JOIN attendance_records r ON r.student_id = e.student_user_id AND r.organization_id = e.organization_id
         WHERE e.organization_id = $1 AND e.status = 'active' AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=e.organization_id AND c.section_id=e.section_id AND c.teacher_user_id=$2)
         GROUP BY e.student_user_id, u.name, sec.name
         HAVING COUNT(r.id) >= 2 AND (COUNT(CASE WHEN r.status = 'present' THEN 1 END)::float / COUNT(r.id)) < 0.75
         LIMIT 6`,
        [organizationId,user.id]
      );

      if (defaulterRows && defaulterRows.length > 0) {
        defaultersAlerts = defaulterRows.map((d: any) => {
          const pct = Number(((d.present_count / d.total_sessions) * 100).toFixed(1));
          return {
            id: d.id,
            studentName: d.student_name,
            classSection: d.class_section.startsWith('Class ') ? d.class_section : `Class ${d.class_section}`,
            attendancePct: pct,
            totalAbsences: d.total_absences,
            status: pct < 70 ? 'Below CBSE 75% Threshold' : 'Approaching Threshold',
            parentContacted: false,
          };
        });
      }
    } catch (error) { throw error; }

    let scheduledClassesCount = 0;
    try {
      const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase();
      const dayMap: Record<string, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
      const todayNum = dayMap[todayName] || 1;

      const [sched] = await this.drizzle.query(
        `SELECT COUNT(*)::int as count FROM timetable_entries
         WHERE organization_id = $1 AND teacher_user_id = $2 AND day_of_week = $3`,
        [organizationId, user?.id, todayNum]
      );
      scheduledClassesCount = Number(sched?.count || 0);

      if (scheduledClassesCount === 0) {
        const [tts] = await this.drizzle.query(
          `SELECT COUNT(*)::int as count FROM teacher_timetable_slots
           WHERE organization_id = $1 AND teacher_user_id = $2 AND day_of_week = $3`,
          [organizationId, user?.id, todayName]
        );
        scheduledClassesCount = Number(tts?.count || 0);
      }
    } catch (error) { throw error; }

    const classesTotal = Math.max(scheduledClassesCount, todaySessionsCount);
    const classesMarked = todaySessionsCount;
    const pendingMarking = Math.max(0, classesTotal - classesMarked);
    const overallAttendancePct = totalRecords > 0
      ? Number(((totalPresent / totalRecords) * 100).toFixed(1))
      : 0;

    return {
      todayStatus: {
        classesTotal,
        classesMarked,
        pendingMarking,
        overallAttendancePct,
      },
      recentSessions,
      defaultersAlerts,
    };
  }

  async recordQuickAttendance(organizationId: string, user: User, dto: QuickAttendanceDto) {
    let [session]=await this.drizzle.query(`SELECT id,status FROM attendance_sessions WHERE organization_id=$1 AND section_id=$2 AND subject_id IS NOT DISTINCT FROM $3::uuid AND date=$4 AND period=$5`, [organizationId,dto.sectionId,dto.subjectId || null,dto.date,dto.period]);
    if (session?.status==='finalized') throw new ConflictException('This attendance session is already finalized');
    if (!session) session=await this.attendanceService.create(organizationId,user,{sectionId:dto.sectionId,subjectId:dto.subjectId,date:dto.date,period:dto.period},randomUUID());
    await this.attendanceService.mark(organizationId,user,session.id,{records:dto.records});
    await this.attendanceService.finalize(organizationId,user,session.id,randomUUID());
    return { success:true,sessionId:session.id,markedStudents:dto.records.length };
  }
}
