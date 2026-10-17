import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../../auth/user.entity';

@Injectable()
export class TeacherCurriculumService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getCurriculumOverview(organizationId: string, user: User, sectionId?: string) {
    let conductedLessons = 0;
    try {
      const conductedRes = await this.drizzle.query(
        `SELECT COUNT(*)::int as count FROM teacher_lesson_deliveries
         WHERE organization_id = $1 AND status = 'conducted'`,
        [organizationId]
      );
      conductedLessons = conductedRes?.[0]?.count || 0;
    } catch (error) { throw error; }

    let nodes: any[] = [];
    try {
      nodes = await this.drizzle.query(
        `SELECT * FROM principal_curriculum_nodes
         WHERE organization_id = $1 AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=principal_curriculum_nodes.organization_id AND c.subject_id=principal_curriculum_nodes.subject_id AND c.teacher_user_id=$2)
         ORDER BY created_at ASC`,
        [organizationId,user.id]
      );
    } catch (error) { throw error; }

    let sectionName = '';
    let subjectName = '';
    try {
      if (sectionId) {
        const secRes = await this.drizzle.query(
          `SELECT name FROM sections WHERE organization_id = $1 AND id = $2 LIMIT 1`,
          [organizationId, sectionId]
        );
        if (secRes?.[0]?.name) {
          sectionName = secRes[0].name.startsWith('Class ') ? secRes[0].name : `Class ${secRes[0].name}`;
        }
      } else {
        const secRes = await this.drizzle.query(
          `SELECT sec.name as section_name, sub.name as subject_name
           FROM class_subject_assignments csa
           JOIN sections sec ON sec.id = csa.section_id
           JOIN subjects sub ON sub.id = csa.subject_id
           WHERE csa.organization_id = $1 LIMIT 1`,
          [organizationId]
        );
        if (secRes?.[0]) {
          sectionName = secRes[0].section_name.startsWith('Class ') ? secRes[0].section_name : `Class ${secRes[0].section_name}`;
          subjectName = secRes[0].subject_name || subjectName;
        }
      }
    } catch (error) { throw error; }

    let expectedProgressPct = 0;
    let activeYearName = '';
    try {
      const [yearRow] = await this.drizzle.query(
        `SELECT
           name,
           ROUND(
             LEAST(100.0, GREATEST(0.0,
               (CURRENT_DATE - start_date)::numeric / NULLIF((end_date - start_date)::numeric, 0) * 100.0
             )), 1
           ) as expected_pct
         FROM academic_years
         WHERE organization_id = $1 AND (is_current = true OR start_date <= CURRENT_DATE)
         ORDER BY is_current DESC, start_date DESC
         LIMIT 1`,
        [organizationId]
      );
      if (yearRow) {
        if (yearRow.name) activeYearName = yearRow.name;
        if (yearRow.expected_pct != null) expectedProgressPct = Number(yearRow.expected_pct);
      }
    } catch (error) { throw error; }

    if (nodes && nodes.length > 0) {
      const completedCount = nodes.filter(n => n.status === 'Completed' || n.actual_completion_percentage >= 100).length;
      const inProgressCount = nodes.filter(n => n.status !== 'Completed' && n.actual_completion_percentage > 0).length;
      const totalCount = nodes.length;
      const avgProgress = Math.round(nodes.reduce((acc, n) => acc + (n.actual_completion_percentage || 0), 0) / (totalCount || 1));
      const gapPct = Math.max(0, Number((expectedProgressPct - avgProgress).toFixed(1)));

      return {
        overview: {
          className: sectionName,
          subjectName: subjectName,
          academicYear: activeYearName,
          expectedProgressPct,
          actualProgressPct: avgProgress,
          gapPct,
          totalChapters: totalCount,
          completedChapters: completedCount,
          inProgressChapters: inProgressCount,
          upcomingChapters: Math.max(0, totalCount - completedCount - inProgressCount),
        },
        chapters: nodes.map((n, idx) => ({
          id: n.id,
          sequence: idx + 1,
          name: n.chapter_name || n.unit_name || `Chapter ${idx + 1}`,
          plannedLessons: null,
          completedLessons: null,
          completionPct: n.actual_completion_percentage || 0,
          status: n.status || 'On Track',
          averagePerformance: null,
          learningOutcomes: (n.learning_outcomes || []).map((lo: string, lIdx: number) => ({
            code: `LO-${String(lIdx + 1).padStart(2, '0')}`,
            description: lo,
            achievementPct: null,
          })),
        })),
      };
    }

    return {
      overview: {
        className: sectionName,
        subjectName: subjectName,
        academicYear: activeYearName,
        expectedProgressPct,
        actualProgressPct: 0,
        gapPct: expectedProgressPct,
        totalChapters: 0,
        completedChapters: 0,
        inProgressChapters: 0,
        upcomingChapters: 0,
      },
      chapters: [],
    };
  }

  async updateProgress(organizationId: string, user: User, chapterId: string, completionPct: number) {
    if (!Number.isInteger(completionPct) || completionPct<0 || completionPct>100) throw new BadRequestException('Completion percentage must be between 0 and 100');
    const rows = await this.drizzle.query(`UPDATE principal_curriculum_nodes n SET actual_completion_percentage=LEAST(100,$1),status=CASE WHEN $1>=100 THEN 'Completed' WHEN $1>0 THEN 'On Track' ELSE 'Behind Schedule' END WHERE n.organization_id=$2 AND n.id=$3 AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=n.organization_id AND c.subject_id=n.subject_id AND c.teacher_user_id=$4) RETURNING id`, [completionPct,organizationId,chapterId,user.id]);
    if (!rows.length) throw new NotFoundException('Assigned curriculum chapter not found');
    return { success:true,chapterId,completionPct };
  }
}
