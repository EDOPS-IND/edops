import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
@Injectable()
export class StudentTimetableService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getTimetable(organizationId: string, studentUserId: string) {
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weeklySchedule: Record<string, any[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    };

    try {
      const [enrollment] = await this.drizzle.query(
        `SELECT e.section_id FROM enrollments e
         JOIN academic_years y ON y.id = e.academic_year_id AND y.organization_id = e.organization_id AND y.is_current = true
         WHERE e.organization_id = $1 AND e.student_user_id = $2 AND e.status = 'active' LIMIT 1`,
        [organizationId, studentUserId],
      );

      const sectionId = enrollment?.section_id;
      if (sectionId) {
        const entries = await this.drizzle.query(
          `SELECT t.id, t.day_of_week, t.period_number, t.start_time, t.end_time, t.room_number,
                  sub.name as "subjectName", COALESCE(u.name, split_part(u.email, '@', 1)) as "teacherName"
           FROM timetable_entries t
           JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = t.organization_id AND y.is_current = true
           JOIN subjects sub ON sub.id = t.subject_id AND sub.organization_id = t.organization_id
           JOIN users u ON u.id = t.teacher_user_id
           WHERE t.organization_id = $1 AND t.section_id = $2
           ORDER BY t.day_of_week, t.period_number`,
          [organizationId, sectionId],
        );

        for (const e of (entries || [])) {
          const dayIndex = Number(e.day_of_week) - 1;
          const dayName = dayNames[dayIndex];
          if (dayName && weeklySchedule[dayName]) {
            weeklySchedule[dayName].push({
              id: e.id,
              period: e.period_number,
              time: `${e.start_time} - ${e.end_time}`,
              subject: e.subjectName,
              teacher: e.teacherName,
              room: e.room_number || 'Classroom',
            });
          }
        }
      }
    } catch (error) { throw error; }

    let previousClasses: any[] = [];
    try {
      const prevRows = await this.drizzle.query(
        `SELECT a.id, a.date, a.period, sub.name as subject, COALESCE(u.name, split_part(u.email, '@', 1)) as teacher,
                ar.status as attendance
         FROM attendance_records ar
         JOIN attendance_sessions a ON a.id = ar.attendance_session_id
         JOIN subjects sub ON sub.id = a.subject_id
         JOIN users u ON u.id = a.taken_by
         WHERE ar.organization_id = $1 AND ar.student_id = $2
         ORDER BY a.date DESC, a.period DESC
         LIMIT 5`,
        [organizationId, studentUserId],
      );
      previousClasses = (prevRows || []).map((r: any) => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        period: r.period,
        subject: r.subject,
        teacher: r.teacher,
        topic: 'Instructional Session Delivered',
        attendance: r.attendance === 'present' ? 'Present' : 'Absent',
        homeworkStatus: 'Completed',
        hasRecording: false,
      }));
    } catch (error) { throw error; }

    return { weeklySchedule, previousClasses };
  }
}
