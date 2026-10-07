import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentAttendanceService {
  constructor(private readonly dataSource: DataSource) {}

  async getAttendance(organizationId: string, studentUserId: string) {
    const summary = {
      overallPercentage: 94.0,
      totalWorkingDays: 150,
      presentDays: 141,
      absentDays: 7,
      lateDays: 2,
      leaveDays: 3,
      thresholdPercentage: 75.0,
      isBelowThreshold: false,
    };

    const subjectWise = [
      { subject: 'Mathematics', attended: 57, total: 60, percentage: 95.0, status: 'Good' },
      { subject: 'Science', attended: 53, total: 58, percentage: 91.3, status: 'Good' },
      { subject: 'English', attended: 48, total: 50, percentage: 96.0, status: 'Excellent' },
      { subject: 'Social Science', attended: 46, total: 50, percentage: 92.0, status: 'Good' },
      { subject: 'Hindi', attended: 47, total: 50, percentage: 94.0, status: 'Good' },
      { subject: 'Computer Science', attended: 29, total: 30, percentage: 96.6, status: 'Excellent' },
    ];

    // Calendar log for current month
    const calendarDays = [
      { date: '2026-10-01', status: 'present', remarks: 'Full Day' },
      { date: '2026-10-02', status: 'holiday', remarks: 'Gandhi Jayanti' },
      { date: '2026-10-03', status: 'present', remarks: 'Full Day' },
      { date: '2026-10-04', status: 'holiday', remarks: 'Sunday' },
      { date: '2026-10-05', status: 'present', remarks: 'Full Day' },
      { date: '2026-10-06', status: 'present', remarks: 'Today' },
      { date: '2026-09-29', status: 'present', remarks: 'Full Day' },
      { date: '2026-09-30', status: 'absent', remarks: 'Medical Sick Leave' },
    ];

    return { summary, subjectWise, calendarDays };
  }
}
