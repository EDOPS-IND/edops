import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentCurriculumService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getCurriculum(organizationId: string, studentUserId: string) {
    const nodes = await this.drizzle.query(
      `SELECT n.*, s.code FROM principal_curriculum_nodes n
       JOIN subjects s ON s.id=n.subject_id AND s.organization_id=n.organization_id
       WHERE n.organization_id=$1 AND EXISTS (
         SELECT 1 FROM enrollments e
         JOIN sections sec ON sec.id=e.section_id AND sec.organization_id=e.organization_id
         JOIN academic_years y ON y.id=e.academic_year_id AND y.organization_id=e.organization_id AND y.is_current
         JOIN class_subject_assignments c ON c.organization_id=e.organization_id AND c.section_id=e.section_id
         WHERE e.organization_id=n.organization_id AND e.student_user_id=$2 AND e.status='active'
           AND c.subject_id=n.subject_id AND n.academic_year_id=e.academic_year_id AND (n.grade=sec.name OR n.grade=(SELECT p.name FROM programs p WHERE p.id=sec.program_id) OR n.grade=(SELECT REPLACE(p.name, 'Class ', '') FROM programs p WHERE p.id=sec.program_id)))
       ORDER BY n.subject_name, n.created_at`, [organizationId, studentUserId]);
    const groups = new Map<string, any>();
    for (const n of nodes) {
      if (!groups.has(n.subject_id)) groups.set(n.subject_id, { subject: n.subject_name, name: n.subject_name, code: n.code, chapters: [] });
      const group = groups.get(n.subject_id);
      group.chapters.push({ id: n.id, number: group.chapters.length + 1, title: n.chapter_name,
        status: Number(n.actual_completion_percentage) >= 100 ? 'Completed' : Number(n.actual_completion_percentage) > 0 ? 'In Progress' : 'Not Started',
        progress: Number(n.actual_completion_percentage), learningOutcomes: n.learning_outcomes });
    }
    const subjects = [...groups.values()].map(s => ({ ...s, progress: Math.round(s.chapters.reduce((sum: number, c: any) => sum + c.progress, 0) / s.chapters.length) }));
    const overallProgress = nodes.length ? Math.round(nodes.reduce((sum, n) => sum + Number(n.actual_completion_percentage), 0) / nodes.length) : 0;
    return { overallProgress, syllabusPace: overallProgress, subjects };
  }
}
