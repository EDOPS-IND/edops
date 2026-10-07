import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SubmitArenaAttemptDto } from '../dto/student.dto';

@Injectable()
export class StudentArenaService {
  constructor(private readonly dataSource: DataSource) {}

  async getActivities(organizationId: string, studentUserId: string) {
    const activities = [
      {
        id: 'arena-act-1',
        title: 'Quadratic Equations Speed Drill',
        subject: 'Mathematics',
        mode: 'practice',
        questionCount: 10,
        durationMinutes: 15,
        availableUntil: 'Oct 18, 2026',
        topic: 'Algebra & Quadratic Equations',
        attemptsAllowed: 'Unlimited',
        attemptsMade: 2,
        bestScore: 90,
        status: 'available',
        questions: [
          {
            id: 'q1',
            question: 'What is the discriminant of the quadratic equation 2x² - 4x + 3 = 0?',
            options: ['-8', '8', '40', '-40'],
            correctIndex: 0,
            explanation: 'D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8. Since D < 0, roots are complex.',
          },
          {
            id: 'q2',
            question: 'If the roots of ax² + bx + c = 0 are equal, then the value of discriminant is:',
            options: ['D > 0', 'D < 0', 'D = 0', 'D ≥ 0'],
            correctIndex: 2,
            explanation: 'Roots are real and equal if and only if b² - 4ac = 0.',
          },
        ],
      },
      {
        id: 'arena-act-2',
        title: 'Chemical Reactions Diagnostic Quiz',
        subject: 'Science',
        mode: 'assigned_test',
        questionCount: 15,
        durationMinutes: 20,
        availableUntil: 'Oct 12, 2026',
        topic: 'Chemical Equations & Redox',
        attemptsAllowed: 1,
        attemptsMade: 1,
        bestScore: 80,
        status: 'completed',
        questions: [],
      },
    ];

    const performance = {
      attemptedCount: 8,
      completedCount: 8,
      averageScore: 78,
      bestScore: 92,
      topicMastery: [
        { topic: 'Algebra (Polynomials & Quadratics)', mastery: 88, status: 'Strong' },
        { topic: 'Real Numbers & Euclid Lemma', mastery: 82, status: 'On Track' },
        { topic: 'Coordinate Geometry', mastery: 71, status: 'Developing' },
        { topic: 'Triangles & Similarity', mastery: 64, status: 'Needs Practice' },
      ],
    };

    return { activities, performance };
  }

  async submitAttempt(organizationId: string, studentUserId: string, activityId: string, dto: SubmitArenaAttemptDto) {
    return {
      success: true,
      message: 'Arena attempt recorded successfully.',
      score: 100,
      maxScore: 100,
      isCorrect: true,
      feedback: 'Great job! You answered accurately in record time.',
    };
  }
}
