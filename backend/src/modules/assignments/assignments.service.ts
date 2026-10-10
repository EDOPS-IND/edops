import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AcademicListDto } from '../academics/academic.dto';
import { User } from '../auth/user.entity';
import { AuditService } from '../audit/audit.service';
import { ScorecardsService } from '../reports/scorecards.service';
import { TeachingAccess } from './teaching-access.service';
import { AssignmentDto, AssignmentQuery, GradeDto, SubmitDto, UpdateAssignmentDto } from './teaching.dto';
import { OutboxService } from '../notifications/outbox.service';

@Injectable()
export class AssignmentsService {
  constructor(private readonly access: TeachingAccess, private readonly audit: AuditService, private readonly scorecards: ScorecardsService, private readonly outbox: OutboxService) {}

  list(org: string, actor: User, query: AssignmentQuery) {
    return this.access.run(org, actor, null, null, null,
      (manager, role) => this.access.classScope(manager, org, actor, role, query.sectionId, query.subjectId),
      async (manager, role) => {
        const params: any[] = [org, query.sectionId, query.subjectId];
        let studentFilter = '';
        if (role === 'student') {
          params.push(actor.id);
          studentFilter = ` AND a.status = 'published' AND EXISTS (SELECT 1 FROM submissions s WHERE s.organization_id = a.organization_id AND s.assignment_id = a.id AND s.student_id = $${params.length})`;
        }
        const where = `a.organization_id = $1 AND a.section_id = $2 AND a.subject_id = $3${studentFilter}`;
        const [countRes] = await manager.query(`SELECT count(*)::int AS total FROM assignments a WHERE ${where}`, params);
        const items = await manager.query(
          `SELECT * FROM assignments a WHERE ${where} ORDER BY a.created_at ASC, a.id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, query.limit, query.offset]
        );
        return { items, total: countRes.total, limit: query.limit, offset: query.offset };
      });
  }

  create(org: string, actor: User, dto: AssignmentDto, key?: string) {
    return this.access.run(org, actor, 'assignment.created', dto, key,
      (manager, role) => this.access.classScope(manager, org, actor, role, dto.sectionId, dto.subjectId, true),
      async (manager) => {
        if (new Date(dto.dueAt).getTime() <= Date.now()) throw new BadRequestException('dueAt must be in the future');
        const [row] = await manager.query(
          `INSERT INTO assignments (organization_id, section_id, subject_id, created_by, title, description, due_at, max_score, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft') RETURNING *`,
          [org, dto.sectionId, dto.subjectId, actor.id, dto.title, dto.description || '', new Date(dto.dueAt), dto.maxScore]
        );
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'assignment.created', details: { assignmentId: row.id } });
        return row;
      });
  }

  get(org: string, actor: User, id: string) {
    let row: any;
    return this.access.run(org, actor, null, null, null,
      async (manager, role) => { row = await this.access.assignment(manager, org, actor, role, id); }, async () => row);
  }

  update(org: string, actor: User, id: string, dto: UpdateAssignmentDto) {
    let row: any;
    return this.access.run(org, actor, 'assignment.updated', { id, ...dto }, null,
      async (manager, role) => { row = await this.access.assignment(manager, org, actor, role, id, true); },
      async (manager) => {
        if (row.status !== 'draft') throw new ConflictException('Published assignments are immutable');
        const fields = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
        if (!Object.keys(fields).length) throw new BadRequestException('Provide at least one field');
        if (dto.dueAt && new Date(dto.dueAt).getTime() <= Date.now()) throw new BadRequestException('dueAt must be in the future');
        const setClauses: string[] = [];
        const params: any[] = [org, id];
        let idx = 3;
        if (fields.title !== undefined) { setClauses.push(`title = $${idx++}`); params.push(fields.title); }
        if (fields.description !== undefined) { setClauses.push(`description = $${idx++}`); params.push(fields.description); }
        if (fields.dueAt !== undefined) { setClauses.push(`due_at = $${idx++}`); params.push(new Date(fields.dueAt)); }
        if (fields.maxScore !== undefined) { setClauses.push(`max_score = $${idx++}`); params.push(fields.maxScore); }
        const [updated] = await manager.query(
          `UPDATE assignments SET ${setClauses.join(', ')} WHERE organization_id = $1 AND id = $2 RETURNING *`,
          params
        );
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'assignment.updated', details: { assignmentId: id, fields: Object.keys(fields) } });
        return updated;
      });
  }

  publish(org: string, actor: User, id: string, key?: string) {
    let row: any;
    return this.access.run(org, actor, 'assignment.published', { id }, key,
      async (manager, role) => { row = await this.access.assignment(manager, org, actor, role, id, true); },
      async (manager) => {
        if (row.status !== 'draft') throw new ConflictException('Assignment is already published');
        const dueAtTime = new Date(row.due_at || row.dueAt).getTime();
        if (dueAtTime <= Date.now()) throw new ConflictException('Update the due date before publishing');
        const secId = row.section_id || row.sectionId;
        const subjId = row.subject_id || row.subjectId;
        const students = await manager.query(`INSERT INTO submissions (organization_id, assignment_id, student_id)
          SELECT e.organization_id, $3, e.student_user_id FROM enrollments e
          JOIN memberships m ON m.organization_id=e.organization_id AND m.user_id=e.student_user_id
          JOIN users u ON u.id=m.user_id
          WHERE e.organization_id=$1 AND e.section_id=$2 AND e.status='active' AND m.role='student' AND m.status='active' AND u.is_active
          RETURNING id`, [org, secId, id]);
        if (!students.length) throw new ConflictException('Publish requires at least one active enrolled student');
        const [updated] = await manager.query(
          "UPDATE assignments SET status = 'published', published_at = now() WHERE organization_id = $1 AND id = $2 RETURNING *",
          [org, id]
        );
        await this.scorecards.refresh(manager, org, secId, subjId);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'assignment.published', details: { assignmentId: id, studentCount: students.length } });
        await this.outbox.append(manager, org, actor.id, 'assignment.published', id, secId, subjId);
        return updated;
      });
  }

  submissions(org: string, actor: User, id: string, query: AcademicListDto) {
    return this.access.run(org, actor, null, null, null,
      async (manager, role) => { await this.access.assignment(manager, org, actor, role, id); },
      async (manager, role) => {
        const params: any[] = [org, id];
        let studentFilter = '';
        if (role === 'student') {
          params.push(actor.id);
          studentFilter = ` AND student_id = $${params.length}`;
        }
        const where = `organization_id = $1 AND assignment_id = $2${studentFilter}`;
        const [countRes] = await manager.query(`SELECT count(*)::int AS total FROM submissions WHERE ${where}`, params);
        const items = await manager.query(
          `SELECT * FROM submissions WHERE ${where} ORDER BY student_id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, query.limit, query.offset]
        );
        return { items, total: countRes.total, limit: query.limit, offset: query.offset };
      });
  }

  submit(org: string, actor: User, id: string, dto: SubmitDto, key?: string) {
    let assignment: any;
    return this.access.run(org, actor, 'submission.submitted', { id, ...dto }, key,
      async (manager, role) => {
        assignment = await this.access.assignment(manager, org, actor, role, id);
        if (role !== 'student') throw new ForbiddenException('Only students submit their own work');
      }, async (manager) => {
        const [row] = await manager.query('SELECT * FROM submissions WHERE organization_id = $1 AND assignment_id = $2 AND student_id = $3 LIMIT 1', [org, id, actor.id]);
        if (!row) throw new NotFoundException('Submission not found');
        if (row.status === 'graded') throw new ConflictException('Graded submissions cannot be replaced');
        const submittedAt = new Date();
        const dueAt = new Date(assignment.due_at || assignment.dueAt);
        if (row.submitted_at && submittedAt > dueAt) throw new ConflictException('Cannot resubmit after the deadline');
        const status = submittedAt > dueAt ? 'late' : 'submitted';
        const [updated] = await manager.query(
          'UPDATE submissions SET content = $1, submitted_at = $2, status = $3 WHERE organization_id = $4 AND id = $5 RETURNING *',
          [dto.content, submittedAt, status, org, row.id]
        );
        const secId = assignment.section_id || assignment.sectionId;
        const subjId = assignment.subject_id || assignment.subjectId;
        await this.scorecards.refresh(manager, org, secId, subjId, actor.id);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'submission.submitted', details: { submissionId: row.id, status: updated.status } });
        return updated;
      }, undefined, false);
  }

  grade(org: string, actor: User, id: string, dto: GradeDto) {
    let row: any;
    let assignment: any;
    return this.access.run(org, actor, 'submission.graded', { id, ...dto }, null,
      async (manager, role) => {
        const [found] = await manager.query('SELECT * FROM submissions WHERE organization_id = $1 AND id = $2 LIMIT 1', [org, id]);
        if (!found) throw new NotFoundException('Submission not found');
        row = found;
        assignment = await this.access.assignment(manager, org, actor, role, row.assignment_id || row.assignmentId, true);
      }, async (manager) => {
        if (!row.submitted_at) throw new ConflictException('Cannot grade pending work');
        const maxScore = Number(assignment.max_score ?? assignment.maxScore);
        if (dto.score > maxScore) throw new BadRequestException('Score cannot exceed assignment maxScore');
        const [updated] = await manager.query(
          `UPDATE submissions SET score = $1, feedback = $2, graded_by = $3, graded_at = now(), status = 'graded'
           WHERE organization_id = $4 AND id = $5 RETURNING *`,
          [dto.score, dto.feedback ?? row.feedback, actor.id, org, id]
        );
        const secId = assignment.section_id || assignment.sectionId;
        const subjId = assignment.subject_id || assignment.subjectId;
        await this.scorecards.refresh(manager, org, secId, subjId, row.student_id || row.studentId);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'submission.graded', details: { submissionId: id, before: row.score, after: dto.score } });
        await this.outbox.append(manager, org, actor.id, 'submission.graded', id, secId, subjId);
        return updated;
      });
  }
}
