import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
@Injectable()
export class StudentAssessmentsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getAssessments(organizationId: string, studentUserId: string) {
    let liveAssessments: any[] = [];
    try {
      const rows = await this.drizzle.query(
        `SELECT ee.id, ee.title, ee.max_marks, ee.weightage, ee.student_scores,
                to_char(ee.created_at, 'YYYY-MM-DD') as date,
                coalesce(sub.name, 'General') as subject_name
         FROM exam_evaluations ee
         LEFT JOIN subjects sub ON sub.id = ee.subject_id AND sub.organization_id = ee.organization_id
         WHERE ee.organization_id = $1 AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=ee.organization_id AND e.section_id=ee.section_id AND e.student_user_id=$2 AND e.status='active')
         ORDER BY ee.created_at DESC`,
        [organizationId, studentUserId]
      );

      if (rows && rows.length > 0) {
        liveAssessments = rows.map((r: any) => {
          const scoresMap = typeof r.student_scores === 'string' ? JSON.parse(r.student_scores) : (r.student_scores || {});
          const myScore = scoresMap[studentUserId] ?? null;
          const maxM = Number(r.max_marks);

          let grade = null;
          if (myScore !== null) {
            const pct = (Number(myScore) / maxM) * 100;
            grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
          }

          return {
            id: r.id,
            title: r.title,
            type: 'Formative Assessment',
            subject: r.subject_name,
            date: r.date,
            maxMarks: maxM,
            marksObtained: myScore !== null ? Number(myScore) : null,
            status: myScore !== null ? 'published' : 'upcoming',
            grade,
            teacherRemarks: '',
          };
        });
      }
    } catch (error) { throw error; }

    const assessments = liveAssessments;
    return { assessments };
  }
}
