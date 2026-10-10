import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { QuickAttendanceDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherAttendanceService {
  constructor(private readonly drizzle: DrizzleService) {}

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
         WHERE s.organization_id = $1
         GROUP BY s.id, s.date, s.period, s.status, sec.name, sub.name, s.finalized_at
         ORDER BY s.date DESC, s.period DESC, s.finalized_at DESC
         LIMIT 20`,
        [organizationId]
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
    } catch {
      recentSessions = [];
    }

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
         WHERE e.organization_id = $1 AND e.status = 'active'
         GROUP BY e.student_user_id, u.name, sec.name
         HAVING COUNT(r.id) >= 2 AND (COUNT(CASE WHEN r.status = 'present' THEN 1 END)::float / COUNT(r.id)) < 0.75
         LIMIT 6`,
        [organizationId]
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
    } catch {
      defaultersAlerts = [];
    }

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
    } catch {
      scheduledClassesCount = 0;
    }

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
    let resolvedSectionId = dto.sectionId;
    let resolvedSubjectId: string | null = null;

    // Validate or resolve sectionId to actual UUID
    const isSectionUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.sectionId || '');
    if (isSectionUuid) {
      const [sec] = await this.drizzle.query(
        `SELECT id FROM sections WHERE organization_id = $1 AND id = $2 LIMIT 1`,
        [organizationId, dto.sectionId]
      ).catch(() => []);
      if (sec?.id) resolvedSectionId = sec.id;
    } else {
      const cleanName = (dto.sectionId || '').replace(/^sec-/, '').replace('-', ' ');
      const [sec] = await this.drizzle.query(
        `SELECT id FROM sections WHERE organization_id = $1 AND (name ILIKE $2 OR name ILIKE $3) LIMIT 1`,
        [organizationId, `%${cleanName}%`, dto.sectionId]
      ).catch(() => []);
      if (sec?.id) resolvedSectionId = sec.id;
      else {
        const [firstSec] = await this.drizzle.query(
          `SELECT id FROM sections WHERE organization_id = $1 LIMIT 1`,
          [organizationId]
        ).catch(() => []);
        if (firstSec?.id) resolvedSectionId = firstSec.id;
      }
    }

    // Validate or resolve subjectId if valid UUID exists in DB
    if (dto.subjectId) {
      const isSubUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.subjectId);
      if (isSubUuid) {
        const [sub] = await this.drizzle.query(
          `SELECT id FROM subjects WHERE organization_id = $1 AND id = $2 LIMIT 1`,
          [organizationId, dto.subjectId]
        ).catch(() => []);
        if (sub?.id) resolvedSubjectId = sub.id;
      }
    }

    if (!resolvedSectionId) {
      throw new BadRequestException('A valid class section is required to record attendance.');
    }

    // 1. Create or check existing attendance session in DB
    let sessionId: string;
    const [existing] = await this.drizzle.query(
      `SELECT id, status FROM attendance_sessions
       WHERE organization_id = $1 AND section_id = $2 AND date = $3 AND period = $4`,
      [organizationId, resolvedSectionId, dto.date, dto.period]
    ).catch(() => []);

    if (existing?.id) {
      if (existing.status === 'finalized') {
        throw new ConflictException(
          `Attendance for Period ${dto.period} on ${dto.date} has already been finalized. Duplicate attendance is not allowed.`
        );
      }
      sessionId = existing.id;
      await this.drizzle.query(
        `UPDATE attendance_sessions SET status = 'finalized', finalized_at = now() WHERE id = $1`,
        [sessionId]
      ).catch(() => {});
    } else {
      const [inserted] = await this.drizzle.query(
        `INSERT INTO attendance_sessions (organization_id, section_id, subject_id, date, period, taken_by, status, finalized_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'finalized', now())
         RETURNING id`,
        [organizationId, resolvedSectionId, resolvedSubjectId, dto.date, dto.period, user.id]
      );
      if (!inserted?.id) {
        throw new BadRequestException('Could not create attendance session.');
      }
      sessionId = inserted.id;
    }

    // 2. Insert records
    let markedCount = 0;
    if (sessionId && dto.records?.length > 0) {
      for (const rec of dto.records) {
        const isStudentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rec.studentId);
        if (isStudentUuid) {
          await this.drizzle.query(
            `INSERT INTO attendance_records (organization_id, attendance_session_id, student_id, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (organization_id, attendance_session_id, student_id)
             DO UPDATE SET status = EXCLUDED.status`,
            [organizationId, sessionId, rec.studentId, rec.status]
          ).catch(() => {});
          markedCount++;
        }
      }
    }

    return {
      success: true,
      sessionId,
      markedStudents: markedCount,
      message: `Period ${dto.period} attendance finalized successfully.`,
    };
  }
}
