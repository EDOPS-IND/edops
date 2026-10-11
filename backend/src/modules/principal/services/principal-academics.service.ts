import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { ReviewLessonPlanDto, UpdateCurriculumProgressDto } from '../dto/principal.dto';

@Injectable()
export class PrincipalAcademicsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getAcademicsOverview(orgId: string, _actor: User) {
    const manager = this.drizzle;

    // Fetch classes / sections
    const sections = await manager.query(
      `SELECT s.id, s.name, p.name as "programName",
        (SELECT COUNT(*) FROM enrollments e WHERE e.section_id = s.id AND e.organization_id = $1 AND e.status = 'active') as "enrolledCount"
       FROM sections s
       JOIN programs p ON p.id = s.program_id
       WHERE s.organization_id = $1
       ORDER BY p.sequence_order ASC, s.name ASC`,
      [orgId],
    );

    const classesList = sections.map((c: any) => ({
      id: c.id,
      className: c.programName,
      sectionName: c.name,
      displayName: `${c.programName} - ${c.name}`,
      studentCount: Number(c.enrolledCount),
      averageScore: null,
      medianScore: null,
      passRate: null,
      attendanceRate: null,
      assignmentCompletion: null,
      curriculumCompletion: null,
      trend: null,
    }));

    const subjectRows = await manager.query(
      `SELECT s.id, s.name, count(DISTINCT csa.section_id)::int AS "sectionCount",
              string_agg(DISTINCT u.name, ', ') AS "teachers"
       FROM subjects s
       LEFT JOIN class_subject_assignments csa ON csa.subject_id = s.id AND csa.organization_id = s.organization_id
       LEFT JOIN users u ON u.id = csa.teacher_user_id
       WHERE s.organization_id = $1
       GROUP BY s.id, s.name ORDER BY s.name`,
      [orgId],
    );
    const subjects = subjectRows.map((s: any) => ({
      id: s.id,
      name: s.name,
      teacher: s.teachers || 'Unassigned',
      classes: `${s.sectionCount} sections`,
      average: null,
      passRate: null,
      curriculum: null,
      expectedCurriculum: null,
      gap: null,
      status: 'No performance data',
    }));

    const [year] = await manager.query(
      `SELECT start_date FROM academic_years WHERE organization_id = $1 AND is_current = true LIMIT 1`,
      [orgId],
    );
    const currentWeek = year?.start_date
      ? Math.max(0, Math.ceil((Date.now() - new Date(year.start_date).getTime()) / (7 * 86400000)))
      : null;
    const nodeRows = await manager.query(
      `SELECT id, grade, subject_name, unit_name, chapter_name, expected_completion_week,
              actual_completion_percentage, learning_outcomes, competencies, status
       FROM principal_curriculum_nodes WHERE organization_id = $1 ORDER BY grade, subject_name, unit_name, chapter_name`,
      [orgId],
    );
    const curriculumNodes = nodeRows.map((n: any) => {
      // ponytail: linear weekly target; replace with milestones when chapter schedules are stored.
      const expectedProgress = currentWeek === null ? null : Math.min(100, Math.round(currentWeek / Math.max(1, n.expected_completion_week) * 100));
      const actualProgress = Number(n.actual_completion_percentage);
      return {
        id: n.id,
        grade: n.grade,
        subject: n.subject_name,
        unit: n.unit_name,
        chapter: n.chapter_name,
        expectedWeek: n.expected_completion_week,
        expectedProgress,
        actualProgress,
        gap: expectedProgress === null ? null : actualProgress - expectedProgress,
        status: n.status,
        learningOutcomes: n.learning_outcomes || [],
        competency: (n.competencies || []).join(', '),
      };
    });

    const planRows = await manager.query(
      `SELECT id, teacher_name, class_section, subject_name, topic,
              to_char(planned_date, 'YYYY-MM-DD') AS "plannedDate", learning_outcomes,
              teaching_strategy, assessment_method, status, principal_feedback
       FROM principal_lesson_plans WHERE organization_id = $1 ORDER BY planned_date DESC LIMIT 50`,
      [orgId],
    );
    const lessonPlans = planRows.map((p: any) => ({
      id: p.id,
      teacherName: p.teacher_name,
      classSection: p.class_section,
      subject: p.subject_name,
      topic: p.topic,
      plannedDate: p.plannedDate,
      learningOutcomes: p.learning_outcomes,
      teachingStrategy: p.teaching_strategy,
      assessmentMethod: p.assessment_method,
      status: p.status,
      principalFeedback: p.principal_feedback,
    }));

    return {
      classes: classesList,
      subjects,
      curriculumNodes,
      lessonPlans,
    };
  }

  async getClassPerformance(orgId: string, _actor: User, classId: string) {
    return {
      classId,
      name: 'Grade 10-A',
      studentCount: 42,
      averageScore: 78.5,
      passRate: 94.2,
      attendance: 93.8,
      curriculumProgress: 88.0,
      assignmentCompletion: 91.2,
      subjects: [
        { name: 'Mathematics', teacher: 'Rahul Sharma', avg: 72.4, target: 82.0, status: 'Attention' },
        { name: 'Science', teacher: 'Dr. Anita Desai', avg: 86.2, target: 80.0, status: 'Good' },
        { name: 'English', teacher: 'Pooja Verma', avg: 85.0, target: 82.0, status: 'Good' },
        { name: 'Social Science', teacher: 'Vikram Seth', avg: 79.2, target: 80.0, status: 'Stable' },
      ],
      atRiskStudentsCount: 4,
      remedialAssignedCount: 6,
    };
  }

  async updateCurriculumProgress(orgId: string, _actor: User, dto: UpdateCurriculumProgressDto) {
    const manager = this.drizzle;
    const rows = await manager.query(
      `UPDATE principal_curriculum_nodes
       SET actual_completion_percentage = $1, status = $2
       WHERE id = $3 AND organization_id = $4 RETURNING id`,
      [dto.actualCompletionPercentage, dto.status || 'On Track', dto.nodeId, orgId],
    );
    if (!rows.length) throw new NotFoundException('Curriculum chapter not found');
    return { success: true, nodeId: dto.nodeId, progress: dto.actualCompletionPercentage };
  }

  async reviewLessonPlan(orgId: string, actor: User, lessonId: string, dto: ReviewLessonPlanDto) {
    const manager = this.drizzle;
    const rows = await manager.query(
      `UPDATE principal_lesson_plans
       SET status = $1, principal_feedback = $2, reviewed_by = $3, reviewed_at = now()
       WHERE id = $4 AND organization_id = $5 RETURNING id`,
      [dto.status, dto.principalFeedback || '', actor.id, lessonId, orgId],
    );
    if (!rows.length) throw new NotFoundException('Lesson plan not found');
    return { success: true, lessonId, status: dto.status };
  }
}
