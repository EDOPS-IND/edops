import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../../auth/user.entity';

@Injectable()
export class TeacherCurriculumService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getCurriculumOverview(organizationId: string, user: User, sectionId?: string, subjectId?: string) {
    let conductedLessons = 0;
    try {
      const conductedRes = await this.drizzle.query(
        `SELECT COUNT(*)::int as count FROM teacher_lesson_deliveries
         WHERE organization_id = $1 AND status = 'conducted'`,
        [organizationId]
      );
      conductedLessons = conductedRes?.[0]?.count || 0;
    } catch (error) { throw error; }

    // Fetch all assigned subjects and sections for this teacher
    const assignedRows = await this.drizzle.query(
      `SELECT DISTINCT s.id as "subjectId", s.name as "subjectName", s.code as "subjectCode",
              sec.id as "sectionId", sec.name as "sectionName", COALESCE(p.name, sec.name) as "grade"
       FROM class_subject_assignments csa
       JOIN subjects s ON s.id = csa.subject_id AND s.organization_id = csa.organization_id
       JOIN sections sec ON sec.id = csa.section_id AND sec.organization_id = csa.organization_id
       LEFT JOIN programs p ON p.id = sec.program_id
       WHERE csa.organization_id = $1 AND csa.teacher_user_id = $2
       ORDER BY s.name, sec.name`,
      [organizationId, user.id]
    );

    let whereClause = `n.organization_id = $1 AND EXISTS (
      SELECT 1 FROM class_subject_assignments c
      WHERE c.organization_id = n.organization_id
        AND c.subject_id = n.subject_id
        AND c.teacher_user_id = $2
    )`;
    const params: any[] = [organizationId, user.id];
    let idx = 3;
    if (subjectId) {
      whereClause += ` AND n.subject_id = $${idx++}`;
      params.push(subjectId);
    }

    let nodes: any[] = [];
    try {
      nodes = await this.drizzle.query(
        `SELECT n.*, s.name as "subject_name", s.code as "subject_code"
         FROM principal_curriculum_nodes n
         JOIN subjects s ON s.id = n.subject_id
         WHERE ${whereClause}
         ORDER BY n.expected_completion_week ASC, n.created_at ASC`,
        params
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
      } else if (assignedRows.length > 0) {
        sectionName = assignedRows[0].sectionName.startsWith('Class ') ? assignedRows[0].sectionName : `Class ${assignedRows[0].sectionName}`;
        subjectName = assignedRows[0].subjectName;
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

    // Map chapters with status & sequencing
    const chapters = nodes.map((n, idx) => {
      const pct = Number(n.actual_completion_percentage) || 0;
      const status = n.status === 'Completed' || pct >= 100
        ? 'Completed'
        : n.status === 'In Progress' || pct > 0
        ? 'In Progress'
        : 'Upcoming';

      return {
        id: n.id,
        sequence: idx + 1,
        name: n.chapter_name || n.unit_name || `Chapter ${idx + 1}`,
        unit: n.unit_name || 'General',
        subjectId: n.subject_id,
        subjectName: n.subject_name,
        subjectCode: n.subject_code,
        grade: n.grade,
        expectedWeek: n.expected_completion_week || 10,
        plannedLessons: null,
        completedLessons: null,
        completionPct: pct,
        status,
        averagePerformance: null,
        learningOutcomes: (n.learning_outcomes || []).map((lo: string, lIdx: number) => ({
          code: `LO-${String(lIdx + 1).padStart(2, '0')}`,
          description: lo,
          achievementPct: null,
        })),
      };
    });

    // Group subjects for grid view
    const subjectMap = new Map<string, any>();
    for (const ar of assignedRows) {
      if (!subjectMap.has(ar.subjectId)) {
        subjectMap.set(ar.subjectId, {
          subjectId: ar.subjectId,
          subjectName: ar.subjectName,
          subjectCode: ar.subjectCode,
          grade: ar.grade,
          sectionName: ar.sectionName,
          sectionId: ar.sectionId,
          chapters: [],
          totalChapters: 0,
          completedChapters: 0,
          inProgressChapters: 0,
          upcomingChapters: 0,
          progressPct: 0,
        });
      }
    }

    for (const ch of chapters) {
      const sub = subjectMap.get(ch.subjectId);
      if (sub) {
        sub.chapters.push(ch);
      }
    }

    const assignedSubjects = [...subjectMap.values()].map((sub) => {
      const total = sub.chapters.length;
      const completed = sub.chapters.filter((c: any) => c.status === 'Completed').length;
      const inProg = sub.chapters.filter((c: any) => c.status === 'In Progress').length;
      const upcoming = sub.chapters.filter((c: any) => c.status === 'Upcoming').length;
      const avg = total > 0 ? Math.round(sub.chapters.reduce((acc: number, c: any) => acc + c.completionPct, 0) / total) : 0;
      return {
        ...sub,
        totalChapters: total,
        completedChapters: completed,
        inProgressChapters: inProg,
        upcomingChapters: upcoming,
        progressPct: avg,
      };
    });

    const completedCount = chapters.filter(c => c.status === 'Completed').length;
    const inProgressCount = chapters.filter(c => c.status === 'In Progress').length;
    const totalCount = chapters.length;
    const avgProgress = totalCount > 0 ? Math.round(chapters.reduce((acc, c) => acc + c.completionPct, 0) / totalCount) : 0;
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
      chapters,
      assignedSubjects,
    };
  }

  async updateProgress(organizationId: string, user: User, chapterId: string, completionPct?: number, status?: string) {
    if (completionPct !== undefined && (!Number.isInteger(completionPct) || completionPct < 0 || completionPct > 100)) {
      throw new BadRequestException('Completion percentage must be between 0 and 100');
    }
    const finalPct = completionPct !== undefined ? completionPct : (status === 'Completed' ? 100 : status === 'In Progress' ? 50 : 0);
    const finalStatus = status || (finalPct >= 100 ? 'Completed' : finalPct > 0 ? 'In Progress' : 'On Track');

    const rows = await this.drizzle.query(
      `UPDATE principal_curriculum_nodes n
       SET actual_completion_percentage = LEAST(100, $1),
           status = $2
       WHERE n.organization_id = $3 AND n.id = $4
         AND EXISTS (
           SELECT 1 FROM class_subject_assignments c
           WHERE c.organization_id = n.organization_id
             AND c.subject_id = n.subject_id
             AND c.teacher_user_id = $5
         )
       RETURNING id, actual_completion_percentage as "completionPct", status`,
      [finalPct, finalStatus, organizationId, chapterId, user.id]
    );
    if (!rows.length) throw new NotFoundException('Assigned curriculum chapter not found');
    return { success: true, chapterId, completionPct: finalPct, status: finalStatus };
  }
}
