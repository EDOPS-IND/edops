import { randomUUID } from 'node:crypto';
import { AttendanceService } from '../../attendance/attendance.service';
import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
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
    const [section] = await this.drizzle.query(
      `SELECT id, class_teacher_user_id FROM sections WHERE organization_id = $1 AND id = $2`,
      [organizationId, dto.sectionId]
    );
    if (!section) throw new BadRequestException('Class section not found');
    if (section.class_teacher_user_id !== user.id) {
      throw new ForbiddenException('Only the designated Class Teacher can take daily attendance for this section');
    }
    const [holiday] = await this.drizzle.query(
      `SELECT title, is_adhoc FROM school_holidays WHERE organization_id = $1 AND date = $2 LIMIT 1`,
      [organizationId, dto.date]
    );
    if (holiday) {
      throw new BadRequestException(`Cannot record attendance: School is officially closed on ${dto.date} (${holiday.title})`);
    }
    if (dto.period && Number(dto.period) !== 1) {
      throw new BadRequestException('Daily attendance in Indian schools must be recorded during Period 1 (Class Teacher period)');
    }
    const period = 1;

    const [todayRow] = await this.drizzle.query(
      `SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') as today`
    );
    const isToday = dto.date === todayRow?.today;

    let [session]=await this.drizzle.query(`SELECT id,status FROM attendance_sessions WHERE organization_id=$1 AND section_id=$2 AND date=$3 AND period=$4`, [organizationId,dto.sectionId,dto.date,period]);
    if (session) {
      if (!isToday) {
        throw new ConflictException('Past attendance records can only be rectified by School Admin or Principal');
      }
      // Same-day rectification by designated Class Teacher
      await this.attendanceService.mark(organizationId, user, session.id, { records: dto.records });
      return { success: true, sessionId: session.id, markedStudents: dto.records.length, rectified: true };
    }

    session=await this.attendanceService.create(organizationId,user,{sectionId:dto.sectionId,subjectId:dto.subjectId || undefined,date:dto.date,period},randomUUID());
    await this.attendanceService.mark(organizationId,user,session.id,{records:dto.records});
    await this.attendanceService.finalize(organizationId,user,session.id,randomUUID());
    return { success:true,sessionId:session.id,markedStudents:dto.records.length };
  }

  async applyLeave(organizationId: string, user: User, dto: { leaveType: string; startDate: string; endDate: string; reason: string }) {
    if (dto.endDate < dto.startDate) throw new BadRequestException('End date must not precede start date');
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

    const [req] = await this.drizzle.query(
      `INSERT INTO leave_requests (organization_id, user_id, applicant_name, applicant_role, leave_type, start_date, end_date, days_count, reason, status)
       VALUES ($1, $2, $3, 'teacher', $4, $5, $6, $7, $8, 'pending')
       RETURNING id, leave_type as "leaveType", to_char(start_date, 'YYYY-MM-DD') as "startDate", to_char(end_date, 'YYYY-MM-DD') as "endDate", days_count as "daysCount", reason, status, created_at as "submittedAt"`,
      [organizationId, user.id, user.name || user.email, dto.leaveType, dto.startDate, dto.endDate, daysCount, dto.reason || '']
    );

    // Notify Principal immediately via communication outbox
    await this.drizzle.query(
      `INSERT INTO school_broadcasts (organization_id, title, message, channels, target_audience, priority, sent_by, sender_name)
       VALUES ($1, $2, $3, '{"in_app"}', 'principal', 'high', $4, $5)`,
      [
        organizationId,
        'Faculty Leave Application',
        `${user.name || user.email} applied for ${dto.leaveType} leave (${daysCount} days): "${dto.reason || 'Personal leave request'}"`,
        user.id,
        user.name || user.email || 'Teacher',
      ],
    ).catch(() => null);

    return req;
  }

  async getMyLeaves(organizationId: string, user: User) {
    return this.drizzle.query(
      `SELECT id, leave_type as "leaveType", to_char(start_date, 'YYYY-MM-DD') as "startDate",
              to_char(end_date, 'YYYY-MM-DD') as "endDate", days_count as "daysCount",
              reason, status, review_notes as "reviewNotes", created_at as "submittedAt"
       FROM leave_requests
       WHERE organization_id = $1 AND user_id = $2 AND applicant_role = 'teacher'
       ORDER BY created_at DESC`,
      [organizationId, user.id]
    );
  }

  async getClassStudentLeaves(organizationId: string, user: User) {
    return this.drizzle.query(
      `SELECT lr.id, lr.applicant_name as "studentName", lr.user_id as "studentId",
              lr.leave_type as "leaveType", to_char(lr.start_date, 'YYYY-MM-DD') as "startDate",
              to_char(lr.end_date, 'YYYY-MM-DD') as "endDate", lr.days_count as "daysCount",
              lr.reason, lr.status, lr.review_notes as "reviewNotes", lr.created_at as "submittedAt",
              s.name as "sectionName", p.name as "className", e.roll_number as "rollNo"
       FROM leave_requests lr
       JOIN enrollments e ON e.student_user_id = lr.user_id AND e.organization_id = lr.organization_id AND e.status = 'active'
       JOIN sections s ON s.id = e.section_id AND s.organization_id = lr.organization_id
       JOIN programs p ON p.id = s.program_id
       WHERE lr.organization_id = $1 AND lr.applicant_role = 'student'
         AND s.class_teacher_user_id = $2
         AND lr.days_count <= 2
       ORDER BY lr.created_at DESC`,
      [organizationId, user.id]
    );
  }

  async updateStudentLeaveStatus(organizationId: string, user: User, id: string, status: string, reviewNotes?: string) {
    if (!['approved', 'rejected'].includes(status)) throw new BadRequestException('Status must be approved or rejected');
    const [updated] = await this.drizzle.query(
      `UPDATE leave_requests lr
       SET status = $1, reviewed_by = $2, reviewed_at = now(), review_notes = $3
       FROM sections s, enrollments e
       WHERE lr.id = $4 AND lr.organization_id = $5 AND lr.applicant_role = 'student' AND lr.days_count <= 2
         AND e.student_user_id = lr.user_id AND e.organization_id = lr.organization_id AND e.section_id = s.id
         AND s.class_teacher_user_id = $2
       RETURNING lr.id, lr.status, lr.review_notes as "reviewNotes", lr.reviewed_at as "reviewedAt"`,
      [status, user.id, reviewNotes || null, id, organizationId]
    );
    if (!updated) throw new BadRequestException('Could not update leave request. Verify you are the assigned class teacher and request duration is <= 2 days.');
    return updated;
  }

  async getClassRegister(organizationId: string, user: User, sectionId?: string, month?: string) {
    let targetSectionId = sectionId;
    if (!targetSectionId) {
      const [ctSec] = await this.drizzle.query(
        `SELECT id FROM sections WHERE organization_id = $1 AND class_teacher_user_id = $2 LIMIT 1`,
        [organizationId, user.id]
      );
      targetSectionId = ctSec?.id;
    }
    if (!targetSectionId) {
      const [anySec] = await this.drizzle.query(
        `SELECT section_id as id FROM class_subject_assignments WHERE organization_id = $1 AND teacher_user_id = $2 LIMIT 1`,
        [organizationId, user.id]
      );
      targetSectionId = anySec?.id;
    }
    if (!targetSectionId) {
      return { month: month || new Date().toISOString().slice(0, 7), daysCount: 30, students: [], sections: [] };
    }

    const [secInfo] = await this.drizzle.query(
      `SELECT s.id, s.name, (s.class_teacher_user_id = $2) as "isClassTeacher" FROM sections s WHERE s.organization_id = $1 AND s.id = $3`,
      [organizationId, user.id, targetSectionId]
    );

    const availableSections = await this.drizzle.query(
      `SELECT DISTINCT s.id, s.name, (s.class_teacher_user_id = $2) as "isClassTeacher" 
       FROM sections s
       LEFT JOIN class_subject_assignments c ON c.section_id = s.id AND c.organization_id = s.organization_id
       WHERE s.organization_id = $1 AND (s.class_teacher_user_id = $2 OR c.teacher_user_id = $2)
       ORDER BY "isClassTeacher" DESC, s.name ASC`,
      [organizationId, user.id]
    );

    const targetMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7);
    const [yearStr, monthStr] = targetMonth.split('-');
    const yearNum = Number(yearStr);
    const monthNum = Number(monthStr);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const holidays = await this.drizzle.query(
      `SELECT EXTRACT(DAY FROM date)::int as day, to_char(date, 'YYYY-MM-DD') as date, title, holiday_type as "holidayType", is_adhoc as "isAdhoc"
       FROM school_holidays
       WHERE organization_id = $1 AND to_char(date, 'YYYY-MM') = $2`,
      [organizationId, targetMonth]
    );
    const holidayMap = new Map<number, any>();
    (holidays || []).forEach((h: any) => {
      holidayMap.set(h.day, h);
    });

    const daysMeta: Array<{ day: number; dateStr: string; dayOfWeek: string; isSunday: boolean; isHoliday?: boolean; holidayTitle?: string; isAdhoc?: boolean }> = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 1; d <= daysInMonth; d++) {
      const dObj = new Date(yearNum, monthNum - 1, d);
      const dow = dObj.getDay();
      const dateStr = `${targetMonth}-${String(d).padStart(2, '0')}`;
      const hol = holidayMap.get(d);
      daysMeta.push({
        day: d,
        dateStr,
        dayOfWeek: dayNames[dow],
        isSunday: dow === 0,
        isHoliday: Boolean(dow === 0 || hol),
        holidayTitle: hol ? hol.title : dow === 0 ? 'Sunday' : undefined,
        isAdhoc: hol ? hol.isAdhoc : false,
      });
    }

    const studentRows = await this.drizzle.query(
      `SELECT u.id, u.name, e.roll_number as "rollNumber"
       FROM enrollments e
       JOIN users u ON u.id = e.student_user_id
       WHERE e.organization_id = $1 AND e.section_id = $2 AND e.status = 'active'
       ORDER BY e.roll_number ASC, u.name ASC`,
      [organizationId, targetSectionId]
    );

    const records = await this.drizzle.query(
      `SELECT r.student_id as "studentId", EXTRACT(DAY FROM s.date)::int as day, r.status
       FROM attendance_sessions s
       JOIN attendance_records r ON r.attendance_session_id = s.id AND r.organization_id = s.organization_id
       WHERE s.organization_id = $1 AND s.section_id = $2 AND to_char(s.date, 'YYYY-MM') = $3
         AND s.period = 1 AND s.status = 'finalized'`,
      [organizationId, targetSectionId, targetMonth]
    );

    const recordMap = new Map<string, string>();
    (records || []).forEach((r: any) => {
      recordMap.set(`${r.studentId}_${r.day}`, r.status);
    });

    const approvedLeaves = await this.drizzle.query(
      `SELECT u.name as "studentName", e.roll_number as "rollNumber",
              to_char(l.start_date, 'YYYY-MM-DD') as "startDate",
              to_char(l.end_date, 'YYYY-MM-DD') as "endDate",
              l.reason, l.leave_type as "leaveType"
       FROM leave_requests l
       JOIN users u ON u.id = l.user_id
       JOIN enrollments e ON e.student_user_id = u.id AND e.organization_id = l.organization_id AND e.section_id = $2
       WHERE l.organization_id = $1 AND l.status = 'approved'
         AND (to_char(l.start_date, 'YYYY-MM') = $3 OR to_char(l.end_date, 'YYYY-MM') = $3)
       ORDER BY l.start_date ASC`,
      [organizationId, targetSectionId, targetMonth]
    );

    const students = (studentRows || []).map((st: any) => {
      const marks: Record<number, string> = {};
      let pCount = 0;
      let aCount = 0;
      let lCount = 0;

      daysMeta.forEach((dm) => {
        const rawStatus = recordMap.get(`${st.id}_${dm.day}`);
        if (dm.isSunday || dm.isHoliday) {
          marks[dm.day] = 'H';
        } else if (rawStatus === 'present') {
          marks[dm.day] = 'P';
          pCount++;
        } else if (rawStatus === 'absent') {
          marks[dm.day] = 'A';
          aCount++;
        } else if (rawStatus === 'late') {
          marks[dm.day] = 'L';
          lCount++;
          pCount++;
        } else if (rawStatus === 'excused') {
          marks[dm.day] = 'E';
        } else {
          marks[dm.day] = '-';
        }
      });

      const totalRecorded = pCount + aCount;
      const pct = totalRecorded > 0 ? Math.round((pCount / totalRecorded) * 100) : null;

      return {
        id: st.id,
        name: st.name,
        rollNumber: st.rollNumber || '—',
        marks,
        presentCount: pCount,
        absentCount: aCount,
        lateCount: lCount,
        attendancePercentage: pct,
      };
    });

    return {
      month: targetMonth,
      section: secInfo || { id: targetSectionId, name: 'Class Section', isClassTeacher: false },
      sections: availableSections || [],
      days: daysMeta,
      students,
      approvedLeaves: approvedLeaves || [],
      holidays: holidays || [],
    };
  }
}
