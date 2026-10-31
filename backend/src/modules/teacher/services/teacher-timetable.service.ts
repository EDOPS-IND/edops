import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { User } from '../../auth/user.entity';

@Injectable()
export class TeacherTimetableService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getTodayTimetable(organizationId: string, user: User) {
    const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase();
    const dayMap: Record<string, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
    const todayNum = dayMap[today] || 1;

    let slots: any[] = [];
    try {
      slots = await this.drizzle.query(
        `SELECT t.id, t.period_number, t.start_time, t.end_time, t.room_number as room,
                sec.id as section_id, sec.name as section_name,
                sub.id as subject_id, sub.name as subject_name,
                (sec.class_teacher_user_id = $2) as is_class_teacher
         FROM timetable_entries t
         JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = t.organization_id AND y.is_current = true
         JOIN sections sec ON sec.id = t.section_id AND sec.organization_id = t.organization_id
         JOIN subjects sub ON sub.id = t.subject_id AND sub.organization_id = t.organization_id
         LEFT JOIN principal_timetable_substitutions ps ON ps.organization_id = t.organization_id
           AND ps.timetable_entry_id = t.id AND ps.event_date = CURRENT_DATE
         WHERE t.organization_id = $1 AND t.day_of_week = $3
           AND CURRENT_DATE BETWEEN y.start_date AND y.end_date
           AND COALESCE(ps.substitute_teacher_user_id, t.teacher_user_id) = $2
         ORDER BY t.period_number ASC`,
        [organizationId, user?.id, todayNum],
      );
    } catch (error) { throw error; }

    // Query today's finalized attendance sessions
    let markedSet = new Set<string>();
    try {
      const markedSessions = await this.drizzle.query(
        `SELECT section_id, period FROM attendance_sessions
         WHERE organization_id = $1 AND date = CURRENT_DATE AND status = 'finalized'`,
        [organizationId]
      );
      markedSet = new Set((markedSessions || []).map((m: any) => `${m.section_id}_${m.period}`));
    } catch (error) { throw error; }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    function parseMins(t: string | null): number | null {
      if (!t) return null;
      const match = t.match(/^(\d{1,2}):(\d{2})/);
      return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    }

    const mapped = (slots || []).map((s: any) => {
      const isMarked = markedSet.has(`${s.section_id}_${s.period_number}`);
      const startMins = parseMins(s.start_time);
      const endMins = parseMins(s.end_time);

      let slotStatus = s.status || 'upcoming';
      if (isMarked) {
        slotStatus = 'completed';
      } else if (startMins !== null && endMins !== null) {
        if (currentMins >= startMins - 15 && currentMins <= endMins + 30) {
          slotStatus = 'active';
        } else if (currentMins < startMins - 15) {
          slotStatus = 'upcoming';
        } else {
          slotStatus = 'pending';
        }
      } else {
        slotStatus = isMarked ? 'completed' : 'pending';
      }

      const isClassTeacher = Boolean(s.is_class_teacher);
      const canTakeAttendance = Boolean(isClassTeacher && Number(s.period_number) === 1);

      return {
        id: s.id,
        period: Number(s.period_number),
        startTime: s.start_time,
        endTime: s.end_time,
        classSection: s.section_name,
        sectionId: s.section_id,
        subject: s.subject_name,
        room: s.room || null,
        status: slotStatus,
        attendanceTaken: isMarked,
        isClassTeacher,
        canTakeAttendance,
      };
    });

    const activeSlot = mapped.find((s) => s.canTakeAttendance && s.status === 'active' && !s.attendanceTaken)
      || mapped.find((s) => s.canTakeAttendance && s.status === 'pending' && !s.attendanceTaken)
      || null;

    return { day: today, slots: mapped, activeSlot };
  }

  async getWeeklyTimetable(organizationId: string, user: User) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];
    const grid: Record<string, any[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    };

    try {
      const liveEntries = await this.drizzle.query(
        `SELECT t.id, t.day_of_week, t.period_number, t.room_number as room,
                sec.name as section_name, sub.name as subject_name
         FROM timetable_entries t
         JOIN academic_years y ON y.id = t.academic_year_id AND y.organization_id = t.organization_id AND y.is_current = true
         JOIN sections sec ON sec.id = t.section_id AND sec.organization_id = t.organization_id
         JOIN subjects sub ON sub.id = t.subject_id AND sub.organization_id = t.organization_id
         WHERE t.organization_id = $1 AND t.teacher_user_id = $2
         ORDER BY t.day_of_week ASC, t.period_number ASC`,
        [organizationId, user?.id],
      );

      for (const s of liveEntries || []) {
        const dayName = days[Number(s.day_of_week) - 1];
        if (dayName && grid[dayName]) {
          grid[dayName].push({
            id: s.id,
            period: s.period_number,
            class: s.section_name,
            subject: s.subject_name,
            room: s.room || null,
          });
        }
      }
    } catch (error) { throw error; }

    const totalWeekly = Object.values(grid).reduce((sum, list) => sum + list.length, 0);

    return {
      days,
      periods,
      totalWeeklyPeriods: totalWeekly,
      maxWeeklyPeriods: 30,
      grid,
    };
  }
}
