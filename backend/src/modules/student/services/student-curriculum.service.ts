import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentCurriculumService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getCurriculum(organizationId: string, studentUserId: string) {
    // 1. Fetch student's active enrollment, section and class program
    const [enrollment] = await this.drizzle.query(
      `SELECT e.section_id as "sectionId", sec.name as "sectionName",
              p.name as "programName", e.academic_year_id as "academicYearId"
       FROM enrollments e
       JOIN sections sec ON sec.id = e.section_id AND sec.organization_id = e.organization_id
       LEFT JOIN programs p ON p.id = sec.program_id
       WHERE e.organization_id = $1 AND e.student_user_id = $2 AND e.status = 'active'
       ORDER BY e.created_at DESC LIMIT 1`,
      [organizationId, studentUserId]
    );

    if (!enrollment) {
      return { overallProgress: 0, syllabusPace: 0, subjects: [], className: '', sectionName: '' };
    }

    const programGrade = enrollment.programName || `Class ${enrollment.sectionName}`;
    const sectionGrade = enrollment.sectionName;

    // 2. Fetch all subjects assigned to this student's section
    const enrolledSubjects = await this.drizzle.query(
      `SELECT DISTINCT s.id as "subjectId", s.name as "subjectName", s.code as "subjectCode"
       FROM class_subject_assignments csa
       JOIN subjects s ON s.id = csa.subject_id AND s.organization_id = csa.organization_id
       WHERE csa.organization_id = $1 AND csa.section_id = $2
       ORDER BY s.name`,
      [organizationId, enrollment.sectionId]
    );

    // 3. Fetch all curriculum nodes for this grade
    const nodes = await this.drizzle.query(
      `SELECT n.*, s.name as "subject_name", s.code as "subject_code"
       FROM principal_curriculum_nodes n
       JOIN subjects s ON s.id = n.subject_id AND s.organization_id = n.organization_id
       WHERE n.organization_id = $1
         AND (
           n.grade = $2
           OR n.grade = $3
           OR LOWER(n.grade) = LOWER($2)
           OR LOWER(n.grade) = LOWER($3)
           OR REPLACE(LOWER(n.grade), 'class ', '') = REPLACE(LOWER($2), 'class ', '')
         )
       ORDER BY n.subject_name, n.expected_completion_week ASC, n.created_at ASC`,
      [organizationId, programGrade, sectionGrade]
    );

    // 4. Initialize map for all enrolled subjects so cards are always shown in grid
    const groups = new Map<string, any>();
    for (const sub of enrolledSubjects) {
      groups.set(sub.subjectId, {
        id: sub.subjectId,
        subjectId: sub.subjectId,
        subject: sub.subjectName,
        name: sub.subjectName,
        code: sub.subjectCode,
        chapters: [],
      });
    }

    // 5. Populate nodes into groups
    for (const n of nodes) {
      if (!groups.has(n.subject_id)) {
        groups.set(n.subject_id, {
          id: n.subject_id,
          subjectId: n.subject_id,
          subject: n.subject_name,
          name: n.subject_name,
          code: n.subject_code || 'SUB',
          chapters: [],
        });
      }
      const group = groups.get(n.subject_id);
      const pct = Number(n.actual_completion_percentage) || 0;
      const status = n.status === 'Completed' || pct >= 100
        ? 'Completed'
        : n.status === 'In Progress' || pct > 0
        ? 'In Progress'
        : 'Upcoming';

      group.chapters.push({
        id: n.id,
        number: group.chapters.length + 1,
        title: n.chapter_name,
        unit: n.unit_name || 'General',
        expectedWeek: n.expected_completion_week || 10,
        status,
        progress: pct,
        learningOutcomes: n.learning_outcomes || [],
      });
    }

    // 6. Calculate statistics per subject
    const subjects = [...groups.values()].map((s) => {
      const completed = s.chapters.filter((c: any) => c.status === 'Completed').length;
      const inProgress = s.chapters.filter((c: any) => c.status === 'In Progress').length;
      const upcoming = s.chapters.filter((c: any) => c.status === 'Upcoming').length;
      const total = s.chapters.length;
      const progress = total > 0
        ? Math.round(s.chapters.reduce((sum: number, c: any) => sum + c.progress, 0) / total)
        : 0;

      return {
        ...s,
        progress,
        totalChapters: total,
        completedChapters: completed,
        inProgressChapters: inProgress,
        upcomingChapters: upcoming,
      };
    });

    const totalNodesCount = nodes.length;
    const overallProgress = totalNodesCount > 0
      ? Math.round(nodes.reduce((sum, n) => sum + (Number(n.actual_completion_percentage) || 0), 0) / totalNodesCount)
      : 0;

    return {
      overallProgress,
      syllabusPace: overallProgress,
      className: programGrade,
      sectionName: enrollment.sectionName,
      subjects,
    };
  }
}
