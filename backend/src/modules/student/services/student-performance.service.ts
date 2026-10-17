import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentPerformanceService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getPerformance(organizationId: string, studentUserId: string) {
    const results = await this.drizzle.query(
      `SELECT subject_name AS subject, marks_obtained AS marks, max_marks AS max, percentage, grade,
        to_char(published_at,'YYYY-MM') AS month
       FROM principal_exam_results WHERE organization_id=$1 AND student_user_id=$2 AND status='Published'
       ORDER BY published_at`, [organizationId, studentUserId]);
    const grouped = new Map<string, number[]>();
    const months = new Map<string, number[]>();
    for (const r of results) {
      if (!grouped.has(r.subject)) grouped.set(r.subject, []);
      grouped.get(r.subject)!.push(Number(r.percentage));
      if (!months.has(r.month)) months.set(r.month, []);
      months.get(r.month)!.push(Number(r.percentage));
    }
    const average = (values: number[]) => values.length ? Number((values.reduce((a,b) => a+b,0)/values.length).toFixed(1)) : null;
    const subjectScores = [...grouped].map(([subject, values]) => ({ subject, score: average(values), target: null, trend: null, status: 'Published' }));
    const monthlyTrends = [...months].map(([month,values]) => ({ month, percentage: average(values) }));
    const currentAverage = average(results.map(r => Number(r.percentage)));
    const [holisticProgress] = await this.drizzle.query(
      `SELECT cognitive_summary AS "cognitiveSummary", affective_summary AS "affectiveSummary",
        socio_emotional_summary AS "socioEmotionalSummary", psychomotor_summary AS "psychomotorSummary", creative_summary AS "creativeSummary", teacher_reflection AS "teacherReflection"
       FROM principal_holistic_progress WHERE organization_id=$1 AND student_user_id=$2 ORDER BY created_at DESC LIMIT 1`, [organizationId, studentUserId]);
    return { overall: { currentAverage, previousAverage: null, targetAverage: null, gap: null, trend: null, growthPercentage: null },
      monthlyTrends, subjectScores, learningOutcomes: [], competencies: [], holisticProgress: holisticProgress || {} };
  }
}
