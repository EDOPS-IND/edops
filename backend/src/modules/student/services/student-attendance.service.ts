import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentAttendanceService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getAttendance(organizationId: string, studentUserId: string) {
    try {
      const records = await this.drizzle.query(
        `SELECT 
           r.status,
           to_char(s.date, 'YYYY-MM-DD') as session_date,
           s.period,
           coalesce(sub.name, 'General') as subject_name
         FROM attendance_records r
         JOIN attendance_sessions s ON s.id = r.attendance_session_id AND s.organization_id = r.organization_id
         LEFT JOIN subjects sub ON sub.id = s.subject_id AND sub.organization_id = s.organization_id
         WHERE r.organization_id = $1 AND r.student_id = $2 AND s.status='finalized'
         ORDER BY s.date DESC, s.period DESC`,
        [organizationId, studentUserId],
      );

      const totalDays = records.length;
      const presentDays = records.filter((r: any) => r.status === 'present').length;
      const absentDays = records.filter((r: any) => r.status === 'absent').length;
      const lateDays = records.filter((r: any) => r.status === 'late').length;
      const leaveDays = records.filter((r: any) => r.status === 'excused').length;

      const overallPercentage = totalDays > 0
        ? Number((((presentDays + lateDays) / totalDays) * 100).toFixed(1))
        : null;

      const summary = {
        overallPercentage,
        totalWorkingDays: totalDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        thresholdPercentage: 75.0,
        isBelowThreshold: overallPercentage != null && overallPercentage < 75.0,
      };

      // Group subject-wise
      const subjectMap = new Map<string, { attended: number; total: number }>();
      for (const rec of records) {
        const subName = rec.subject_name;
        const curr = subjectMap.get(subName) || { attended: 0, total: 0 };
        curr.total += 1;
        if (rec.status === 'present' || rec.status === 'late') {
          curr.attended += 1;
        }
        subjectMap.set(subName, curr);
      }

      let subjectWise = Array.from(subjectMap.entries()).map(([subject, counts]) => {
        const percentage = Number(((counts.attended / counts.total) * 100).toFixed(1));
        return {
          subject,
          attended: counts.attended,
          total: counts.total,
          percentage,
          status: percentage >= 85 ? 'Excellent' : percentage >= 75 ? 'Good' : 'Defaulter',
        };
      });

      // Calendar log
      const calendarDays = records.slice(0, 15).map((r: any) => ({
        date: r.session_date,
        status: r.status,
        remarks: `Period ${r.period} • ${r.subject_name}`,
      }));

      return { summary, subjectWise, calendarDays };
    } catch (error) { throw error; }
  }
}
