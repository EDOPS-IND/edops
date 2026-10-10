import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { CreateStudentGoalDto, CreateStudentSupportRequestDto } from '../dto/student.dto';

@Injectable()
export class StudentProgressService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getProgressOverview(organizationId: string, studentUserId: string) {
    const gapsAndStrengths = [
      {
        subject: 'Mathematics',
        strength: 'Polynomials & Linear Equations (92% mastery)',
        needsPractice: 'Quadratic Equations - Word Problems on Speed & Work (64% accuracy)',
        recommendations: [
          'Watch Recorded Lecture: "Quadratic Equations Word Problems Breakdown"',
          'Complete NCERT Exercise 4.3 questions 8-11',
          'Attempt 10 practice questions in Arena Practice Mode',
        ],
      },
      {
        subject: 'Science',
        strength: 'Chemical Reactions & Equations (90% mastery)',
        needsPractice: 'Reflex Actions & Nervous System Diagrams (68% accuracy)',
        recommendations: [
          'Review Chapter 3 Anatomy summary sheet in Study Materials',
          'Practice drawing labeled diagram of human neuron',
        ],
      },
    ];

    const goals = [
      {
        id: 'goal-1',
        title: 'Score 90% or above in Mathematics Mid-Term',
        subject: 'Mathematics',
        currentScore: 84,
        targetScore: 90,
        deadline: 'Oct 20, 2026',
        progressPct: 70,
        status: 'active',
      },
      {
        id: 'goal-2',
        title: 'Maintain 95%+ Attendance across Term 1',
        subject: 'All Subjects',
        currentScore: 94,
        targetScore: 95,
        deadline: 'Nov 30, 2026',
        progressPct: 90,
        status: 'active',
      },
    ];

    const supportRequests = [
      {
        id: 'req-1',
        category: 'academic',
        subject: 'Mathematics',
        description: 'Need extra guidance on applying the quadratic formula when discriminant involves square roots.',
        urgency: 'normal',
        status: 'in_progress',
        response: 'Rahul Sharma: "Let us schedule 15 minutes during tomorrow\'s zero period to go over these examples together."',
        date: 'Oct 04, 2026',
      },
    ];

    return { gapsAndStrengths, goals, supportRequests };
  }

  async createGoal(organizationId: string, studentUserId: string, dto: CreateStudentGoalDto) {
    return {
      success: true,
      message: 'Academic goal created successfully.',
      goal: {
        id: 'goal-created-new',
        ...dto,
        currentScore: 80,
        progressPct: 50,
        status: 'active',
      },
    };
  }

  async createSupportRequest(organizationId: string, studentUserId: string, dto: CreateStudentSupportRequestDto) {
    return {
      success: true,
      message: 'Support request sent to your teacher.',
      request: {
        id: 'req-created-new',
        ...dto,
        status: 'open',
        date: new Date().toISOString(),
      },
    };
  }
}
