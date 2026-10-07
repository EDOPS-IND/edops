import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentExamsService {
  constructor(private readonly dataSource: DataSource) {}

  async getExamsAndScorecards(organizationId: string, studentUserId: string) {
    const upcomingExams = [
      {
        id: 'exam-midterm-2026',
        name: 'Mid-Term Examination (Term 1)',
        academicYear: '2026-27',
        startDate: 'Oct 15, 2026',
        endDate: 'Oct 25, 2026',
        status: 'Scheduled',
        schedule: [
          { date: 'Oct 15, 2026', time: '09:30 AM - 12:30 PM', subject: 'Mathematics', room: 'Hall A', maxMarks: 80 },
          { date: 'Oct 17, 2026', time: '09:30 AM - 12:30 PM', subject: 'Science', room: 'Hall A', maxMarks: 80 },
          { date: 'Oct 19, 2026', time: '09:30 AM - 12:30 PM', subject: 'English', room: 'Hall A', maxMarks: 80 },
          { date: 'Oct 21, 2026', time: '09:30 AM - 12:30 PM', subject: 'Social Science', room: 'Hall A', maxMarks: 80 },
          { date: 'Oct 23, 2026', time: '09:30 AM - 12:30 PM', subject: 'Hindi', room: 'Hall A', maxMarks: 80 },
        ],
      },
    ];

    const scorecards = [
      {
        id: 'sc-quarterly-2026',
        examName: 'Quarterly Examination 2026',
        term: 'Term 1',
        status: 'Published',
        publishedAt: 'Aug 28, 2026',
        totalMarks: 415,
        maxTotal: 500,
        percentage: 83.0,
        grade: 'A',
        subjects: [
          { subject: 'Mathematics', max: 100, marks: 84, percentage: 84, grade: 'A', trend: 'up' },
          { subject: 'Science', max: 100, marks: 88, percentage: 88, grade: 'A', trend: 'up' },
          { subject: 'English', max: 100, marks: 79, percentage: 79, grade: 'B+', trend: 'steady' },
          { subject: 'Social Science', max: 100, marks: 81, percentage: 81, grade: 'A', trend: 'up' },
          { subject: 'Hindi', max: 100, marks: 83, percentage: 83, grade: 'A', trend: 'up' },
        ],
        teacherRemarks: 'Good performance across STEM subjects. Encourage more focus on English written expressions.',
      },
      {
        id: 'sc-pt1-2026',
        examName: 'Periodic Test 1',
        term: 'Term 1',
        status: 'Published',
        publishedAt: 'Jul 15, 2026',
        totalMarks: 114,
        maxTotal: 150,
        percentage: 76.0,
        grade: 'B+',
        subjects: [
          { subject: 'Mathematics', max: 30, marks: 22, percentage: 73.3, grade: 'B', trend: 'steady' },
          { subject: 'Science', max: 30, marks: 24, percentage: 80.0, grade: 'A', trend: 'up' },
          { subject: 'English', max: 30, marks: 23, percentage: 76.6, grade: 'B+', trend: 'steady' },
          { subject: 'Social Science', max: 30, marks: 22, percentage: 73.3, grade: 'B', trend: 'steady' },
          { subject: 'Hindi', max: 30, marks: 23, percentage: 76.6, grade: 'B+', trend: 'steady' },
        ],
        teacherRemarks: 'Steady foundation. Regular homework practice advised.',
      },
    ];

    // Growth comparison
    const comparison = {
      previousExam: 'Periodic Test 1 (76%)',
      currentExam: 'Quarterly Examination (83%)',
      improvementPct: 7.0,
      strongestSubject: 'Science (88%)',
      highestGrowthSubject: 'Mathematics (+10.7%)',
    };

    return { upcomingExams, scorecards, comparison };
  }
}
