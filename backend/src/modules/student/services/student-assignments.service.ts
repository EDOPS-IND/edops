import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SubmitAssignmentDto } from '../dto/student.dto';

@Injectable()
export class StudentAssignmentsService {
  constructor(private readonly dataSource: DataSource) {}

  async getAssignments(organizationId: string, studentUserId: string, statusFilter?: string) {
    const assignments = [
      {
        id: 'assign-1',
        title: 'Quadratic Equations: Problem Set 3',
        subject: 'Mathematics',
        teacher: 'Rahul Sharma',
        description: 'Complete questions 1 to 15 from NCERT Exercise 4.3 with clear derivation steps.',
        topic: 'Quadratic Equations',
        learningOutcome: 'Solve quadratic equations by quadratic formula and analyze discriminant.',
        dueDate: 'Today, 05:00 PM',
        maxMarks: 20,
        status: 'pending',
        instructions: 'Show all steps clearly. Verify real roots before calculating.',
        submittedAt: null,
        score: null,
        feedback: null,
      },
      {
        id: 'assign-2',
        title: 'Chemical Reactions: Balanced Equations Worksheet',
        subject: 'Science',
        teacher: 'Priya Nair',
        description: 'Balance given 10 chemical equations and classify combination vs displacement.',
        topic: 'Chemical Reactions and Equations',
        learningOutcome: 'Identify reaction types and state conservation of mass laws.',
        dueDate: 'Tomorrow, 08:00 PM',
        maxMarks: 15,
        status: 'pending',
        instructions: 'Include state symbols (s, l, g, aq) for every reaction component.',
        submittedAt: null,
        score: null,
        feedback: null,
      },
      {
        id: 'assign-3',
        title: 'Letter of Complaint: Municipal Corporation',
        subject: 'English',
        teacher: 'Anita Roy',
        description: 'Draft a formal letter highlighting bad road conditions in your locality.',
        topic: 'Formal Letter Writing',
        learningOutcome: 'Compose formal correspondence maintaining tone and standard format.',
        dueDate: 'Oct 02, 2026',
        maxMarks: 10,
        status: 'evaluated',
        submittedAt: 'Oct 01, 2026 07:15 PM',
        score: 9,
        feedback: 'Excellent structure and tone! Watch minor punctuation in paragraph 2.',
      },
      {
        id: 'assign-4',
        title: 'Map Skills: Major Soil Types of India',
        subject: 'Social Science',
        teacher: 'Vikram Joshi',
        description: 'Locate and label alluvial, black, and red soils on an outline map of India.',
        topic: 'Resources and Development',
        learningOutcome: 'Geographical spatial comprehension of Indian soil distributions.',
        dueDate: 'Oct 03, 2026',
        maxMarks: 10,
        status: 'submitted',
        submittedAt: 'Oct 03, 2026 04:30 PM',
        score: null,
        feedback: null,
      },
    ];

    const filtered = statusFilter && statusFilter !== 'all'
      ? assignments.filter((a) => a.status === statusFilter)
      : assignments;

    const summary = {
      totalAssigned: 30,
      submitted: 27,
      pending: 3,
      late: 2,
      completionPct: 90,
      subjectWise: [
        { subject: 'Mathematics', completion: 95 },
        { subject: 'Science', completion: 87 },
        { subject: 'English', completion: 92 },
        { subject: 'Social Science', completion: 88 },
      ],
    };

    return { assignments: filtered, summary };
  }

  async submitAssignment(organizationId: string, studentUserId: string, assignmentId: string, dto: SubmitAssignmentDto) {
    // In a live system, insert into submissions table
    return {
      success: true,
      message: 'Assignment submitted successfully before deadline.',
      submission: {
        id: 'sub-new',
        assignmentId,
        studentId: studentUserId,
        content: dto.content,
        attachmentUrl: dto.attachmentUrl,
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      },
    };
  }
}
