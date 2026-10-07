import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentAssessmentsService {
  constructor(private readonly dataSource: DataSource) {}

  async getAssessments(organizationId: string, studentUserId: string) {
    const assessments = [
      {
        id: 'ass-1',
        title: 'Periodic Test 2 (Mathematics)',
        type: 'Unit Test',
        subject: 'Mathematics',
        date: 'Oct 02, 2026',
        maxMarks: 25,
        marksObtained: 23,
        status: 'published',
        grade: 'A+',
        teacherRemarks: 'Excellent analytical speed and accurate calculations.',
      },
      {
        id: 'ass-2',
        title: 'Science Formative Practical Assessment',
        type: 'Practical & Lab Skills',
        subject: 'Science',
        date: 'Sep 28, 2026',
        maxMarks: 20,
        marksObtained: 18,
        status: 'published',
        grade: 'A',
        teacherRemarks: 'Good laboratory technique and accurate titration reading.',
      },
      {
        id: 'ass-3',
        title: 'English Speaking & Listening Skills (ASL)',
        type: 'Subject Enrichment',
        subject: 'English',
        date: 'Sep 25, 2026',
        maxMarks: 10,
        marksObtained: 8,
        status: 'published',
        grade: 'B+',
        teacherRemarks: 'Confident delivery. Work on voice modulation.',
      },
      {
        id: 'ass-4',
        title: 'Social Science Project: Disaster Management',
        type: 'Project',
        subject: 'Social Science',
        date: 'Oct 14, 2026',
        maxMarks: 20,
        marksObtained: null,
        status: 'upcoming',
        grade: null,
        teacherRemarks: 'Submission due next week.',
      },
    ];

    return { assessments };
  }
}
