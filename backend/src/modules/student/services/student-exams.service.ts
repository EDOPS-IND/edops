import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentExamsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getExamsAndScorecards(organizationId: string, studentUserId: string) {
    const plans = await this.drizzle.query(
      `SELECT ep.id, ep.exam_name, ep.term, to_char(ep.exam_date,'YYYY-MM-DD') AS date,
        ep.start_time, ep.end_time, ep.max_marks, s.name AS subject
       FROM principal_exam_plans ep JOIN subjects s ON s.id=ep.subject_id AND s.organization_id=ep.organization_id
       WHERE ep.organization_id=$1 AND ep.status='scheduled' AND ep.exam_date>=CURRENT_DATE
       AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=ep.organization_id AND e.section_id=ep.section_id AND e.student_user_id=$2 AND e.status='active')
       ORDER BY ep.exam_date,ep.start_time`, [organizationId, studentUserId]);
    const results = await this.drizzle.query(
      `SELECT * FROM principal_exam_results WHERE organization_id=$1 AND student_user_id=$2 AND status='Published'
       ORDER BY published_at DESC, subject_name`, [organizationId, studentUserId]);
    const examGroups = new Map<string, any>();
    for (const p of plans) {
      const key = JSON.stringify([p.exam_name,p.term]);
      if (!examGroups.has(key)) examGroups.set(key, { id: p.id, name: p.exam_name, term: p.term, status: 'Scheduled', startDate: p.date, endDate: p.date, schedule: [] });
      const exam = examGroups.get(key);
      exam.endDate = p.date;
      exam.schedule.push({ date: p.date, subject: p.subject, time: `${p.start_time} - ${p.end_time}`, maxMarks: Number(p.max_marks) });
    }
    const resultGroups = new Map<string, any>();
    for (const r of results) {
      const key = JSON.stringify([r.exam_name,r.term]);
      if (!resultGroups.has(key)) resultGroups.set(key, { id: r.id, examName: r.exam_name, term: r.term, publishedAt: r.published_at, totalMarks: 0, maxTotal: 0, subjects: [] });
      const card = resultGroups.get(key);
      card.totalMarks += Number(r.marks_obtained);
      card.maxTotal += Number(r.max_marks);
      card.subjects.push({ subject: r.subject_name, marks: Number(r.marks_obtained), max: Number(r.max_marks), percentage: Number(r.percentage), grade: r.grade });
    }
    const scorecards = [...resultGroups.values()].map(c => ({ ...c, percentage: c.maxTotal ? Number((100*c.totalMarks/c.maxTotal).toFixed(1)) : 0 }));
    return { upcomingExams: [...examGroups.values()], scorecards, comparison: null };
  }
}
