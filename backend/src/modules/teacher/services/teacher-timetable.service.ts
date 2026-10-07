import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../auth/user.entity';

@Injectable()
export class TeacherTimetableService {
  constructor(private readonly dataSource: DataSource) {}

  async getTodayTimetable(organizationId: string, user: User) {
    const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase();
    let slots: any[] = [];
    try {
      slots = await this.dataSource.query(
        `SELECT tts.*, sec.name as section_name, sub.name as subject_name
         FROM teacher_timetable_slots tts
         JOIN sections sec ON sec.id = tts.section_id AND sec.organization_id = tts.organization_id
         JOIN subjects sub ON sub.id = tts.subject_id AND sub.organization_id = tts.organization_id
         WHERE tts.organization_id = $1 AND tts.teacher_user_id = $2 AND tts.day_of_week = $3
         ORDER BY tts.period_number ASC`,
        [organizationId, user?.id, today]
      );
    } catch {
      slots = [];
    }

    const mapped = (slots || []).map((s: any) => ({
      period: s.period_number,
      startTime: s.start_time,
      endTime: s.end_time,
      classSection: s.section_name,
      sectionId: s.section_id,
      subject: s.subject_name,
      room: s.room,
      status: s.status || 'upcoming',
      attendanceTaken: false,
      lessonPlanReady: true,
    }));

    return { day: today, slots: mapped };
  }

  async getWeeklyTimetable(organizationId: string, user: User) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const periods = [1, 2, 3, 4, 5, 6, 7];
    const grid: Record<string, any[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    };

    try {
      const allSlots = await this.dataSource.query(
        `SELECT tts.*, sec.name as section_name, sub.name as subject_name
         FROM teacher_timetable_slots tts
         JOIN sections sec ON sec.id = tts.section_id AND sec.organization_id = tts.organization_id
         JOIN subjects sub ON sub.id = tts.subject_id AND sub.organization_id = tts.organization_id
         WHERE tts.organization_id = $1 AND tts.teacher_user_id = $2
         ORDER BY tts.period_number ASC`,
        [organizationId, user?.id]
      );

      if (allSlots && allSlots.length > 0) {
        for (const s of allSlots) {
          const day = (s.day_of_week || '').toLowerCase();
          if (grid[day]) {
            grid[day].push({
              period: s.period_number,
              class: s.section_name,
              subject: s.subject_name,
              room: s.room,
            });
          }
        }
      }
    } catch {}

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
