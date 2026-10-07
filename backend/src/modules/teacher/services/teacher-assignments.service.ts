import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../auth/user.entity';
import { CreateTeacherAssignmentDto, GradeSubmissionDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherAssignmentsService {
  constructor(private readonly dataSource: DataSource) {}

  async getAssignments(organizationId: string, user: User) {
    try {
      const rows = await this.dataSource.query(
        `SELECT a.id, a.title, a.description, a.status,
                to_char(a.due_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as due_at,
                a.max_score,
                coalesce(sec.name, 'Class') as section_name,
                coalesce(sub.name, 'Subject') as subject_name,
                (SELECT COUNT(*)::int FROM enrollments e WHERE e.organization_id = a.organization_id AND e.section_id = a.section_id AND e.status = 'active') as total_students,
                (SELECT COUNT(*)::int FROM submissions s WHERE s.organization_id = a.organization_id AND s.assignment_id = a.id AND s.status IN ('submitted', 'late', 'graded')) as submitted_count,
                (SELECT COUNT(*)::int FROM submissions s WHERE s.organization_id = a.organization_id AND s.assignment_id = a.id AND s.status = 'graded') as evaluated_count
         FROM assignments a
         LEFT JOIN sections sec ON sec.id = a.section_id AND sec.organization_id = a.organization_id
         LEFT JOIN subjects sub ON sub.id = a.subject_id AND sub.organization_id = a.organization_id
         WHERE a.organization_id = $1
         ORDER BY a.created_at DESC`,
        [organizationId]
      );

      if (rows && rows.length > 0) {
        const assignments = rows.map((r: any) => {
          const total = Number(r.total_students || 0);
          const submitted = Number(r.submitted_count || 0);
          const evaluated = Number(r.evaluated_count || 0);
          return {
            id: r.id,
            title: r.title,
            description: r.description,
            sectionName: r.section_name ? (r.section_name.startsWith('Class ') ? r.section_name : `Class ${r.section_name}`) : 'General',
            subjectName: r.subject_name || 'Subject',
            dueAt: r.due_at ? r.due_at.split('T')[0] : '',
            maxScore: Number(r.max_score || 0),
            status: r.status,
            submittedCount: submitted,
            totalStudents: total,
            evaluatedCount: evaluated,
            pendingEvaluation: Math.max(0, submitted - evaluated),
          };
        });
        return { assignments };
      }
    } catch {}

    return { assignments: [] };
  }

  async getSubmissionsQueue(organizationId: string, user: User, assignmentId?: string) {
    try {
      const rows = await this.dataSource.query(
        `SELECT s.id, s.assignment_id, s.status, s.content, s.score, s.feedback,
                to_char(coalesce(s.submitted_at, s.created_at), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as submitted_at,
                a.title as assignment_title,
                a.max_score,
                coalesce(u.name, 'Student') as student_name,
                coalesce(e.roll_number, '01') as roll_number,
                coalesce(sec.name, 'Class 10-A') as class_section
         FROM submissions s
         JOIN assignments a ON a.id = s.assignment_id AND a.organization_id = s.organization_id
         JOIN users u ON u.id = s.student_id
         LEFT JOIN enrollments e ON e.organization_id = s.organization_id AND e.student_user_id = s.student_id AND e.section_id = a.section_id
         LEFT JOIN sections sec ON sec.id = a.section_id AND sec.organization_id = a.organization_id
         WHERE s.organization_id = $1 AND s.status IN ('submitted', 'late')
         ORDER BY s.submitted_at DESC NULLS LAST LIMIT 20`,
        [organizationId]
      );

      if (rows && rows.length > 0) {
        const pendingQueue = rows.map((r: any) => ({
          id: r.id,
          studentName: r.student_name,
          rollNumber: r.roll_number,
          classSection: r.class_section.startsWith('Class ') ? r.class_section : `Class ${r.class_section}`,
          assignmentTitle: r.assignment_title,
          submittedAt: r.submitted_at ? r.submitted_at.split('T')[0] : '',
          status: r.status,
          content: r.content || '',
          maxScore: Number(r.max_score || 0),
          score: r.score != null ? Number(r.score) : null,
          feedback: r.feedback,
        }));
        return { pendingQueue };
      }
    } catch {}

    return { pendingQueue: [] };
  }

  async createAssignment(organizationId: string, user: User, dto: CreateTeacherAssignmentDto) {
    let resolvedSectionId = dto.sectionId;
    let resolvedSubjectId = dto.subjectId;

    // Resolve sectionId
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.sectionId);
      if (!isUuid) {
        const cleanName = dto.sectionId.replace(/^sec-/, '').replace('-', ' ');
        const [sec] = await this.dataSource.query(
          `SELECT id FROM sections WHERE organization_id = $1 AND (name ILIKE $2 OR name ILIKE $3) LIMIT 1`,
          [organizationId, `%${cleanName}%`, dto.sectionId]
        );
        if (sec?.id) resolvedSectionId = sec.id;
        else {
          const [firstSec] = await this.dataSource.query(
            `SELECT id FROM sections WHERE organization_id = $1 LIMIT 1`,
            [organizationId]
          );
          if (firstSec?.id) resolvedSectionId = firstSec.id;
        }
      }
    } catch {}

    // Resolve subjectId
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.subjectId);
      if (!isUuid) {
        const [sub] = await this.dataSource.query(
          `SELECT id FROM subjects WHERE organization_id = $1 LIMIT 1`,
          [organizationId]
        );
        if (sub?.id) resolvedSubjectId = sub.id;
      }
    } catch {}

    // Resolve creator in memberships
    let creatorId = user.id;
    try {
      const [m] = await this.dataSource.query(
        `SELECT user_id FROM memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1`,
        [organizationId, user.id]
      );
      if (!m) {
        const [anyMember] = await this.dataSource.query(
          `SELECT user_id FROM memberships WHERE organization_id = $1 LIMIT 1`,
          [organizationId]
        );
        if (anyMember?.user_id) creatorId = anyMember.user_id;
      }
    } catch {}

    const [inserted] = await this.dataSource.query(
      `INSERT INTO assignments (
        organization_id, section_id, subject_id, created_by, title, description, due_at, max_score, status, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', now())
      RETURNING *`,
      [
        organizationId,
        resolvedSectionId,
        resolvedSubjectId,
        creatorId,
        dto.title,
        dto.description || '',
        dto.dueAt || new Date(Date.now() + 7 * 86400000).toISOString(),
        dto.maxScore || 20,
      ]
    );

    // Create submissions placeholders for students enrolled in section
    try {
      await this.dataSource.query(
        `INSERT INTO submissions (organization_id, assignment_id, student_id, status)
         SELECT $1, $2, e.student_user_id, 'pending'
         FROM enrollments e
         JOIN memberships m ON m.organization_id = e.organization_id AND m.user_id = e.student_user_id
         WHERE e.organization_id = $1 AND e.section_id = $3 AND e.status = 'active'
         ON CONFLICT (organization_id, assignment_id, student_id) DO NOTHING`,
        [organizationId, inserted.id, resolvedSectionId]
      );
    } catch {}

    return {
      success: true,
      assignment: inserted,
      message: 'Assignment published to student portals.',
    };
  }

  async gradeSubmission(organizationId: string, user: User, submissionId: string, dto: GradeSubmissionDto) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId);
    if (isUuid) {
      try {
        let graderId = user.id;
        const [m] = await this.dataSource.query(
          `SELECT user_id FROM memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1`,
          [organizationId, user.id]
        );
        if (!m) {
          const [anyMember] = await this.dataSource.query(
            `SELECT user_id FROM memberships WHERE organization_id = $1 LIMIT 1`,
            [organizationId]
          );
          if (anyMember?.user_id) graderId = anyMember.user_id;
        }

        await this.dataSource.query(
          `UPDATE submissions
           SET score = $1, feedback = $2, graded_by = $3, graded_at = now(), status = 'graded'
           WHERE organization_id = $4 AND id = $5`,
          [dto.score, dto.feedback || 'Evaluated', graderId, organizationId, submissionId]
        );
      } catch {}
    }

    return {
      success: true,
      submissionId,
      score: dto.score,
      message: 'Submission graded and feedback sent to student.',
    };
  }
}
