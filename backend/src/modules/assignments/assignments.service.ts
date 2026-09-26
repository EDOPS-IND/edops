import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AcademicListDto } from '../academics/academic.dto';
import { User } from '../auth/user.entity';
import { AuditService } from '../audit/audit.service';
import { ScorecardsService } from '../reports/scorecards.service';
import { TeachingAccess } from './teaching-access.service';
import { AssignmentDto, AssignmentQuery, GradeDto, SubmitDto, UpdateAssignmentDto } from './teaching.dto';
import { Assignment, Submission } from './teaching.entity';
import { OutboxService } from '../notifications/outbox.service';

@Injectable()
export class AssignmentsService {
  constructor(private readonly access: TeachingAccess, private readonly audit: AuditService, private readonly scorecards: ScorecardsService, private readonly outbox: OutboxService) {}

  list(org: string, actor: User, query: AssignmentQuery) {
    return this.access.run(org, actor, null, null, null,
      (manager, role) => this.access.classScope(manager, org, actor, role, query.sectionId, query.subjectId),
      async (manager, role) => {
        const builder = manager.getRepository(Assignment).createQueryBuilder('a')
          .where('a.organization_id=:org AND a.section_id=:section AND a.subject_id=:subject', { org, section: query.sectionId, subject: query.subjectId });
        if (role === 'student') builder.andWhere(`a.status='published' AND EXISTS (SELECT 1 FROM submissions s WHERE s.organization_id=a.organization_id AND s.assignment_id=a.id AND s.student_id=:student)`, { student: actor.id });
        const [items, total] = await builder.orderBy('a.created_at').addOrderBy('a.id').take(query.limit).skip(query.offset).getManyAndCount();
        return { items, total, limit: query.limit, offset: query.offset };
      });
  }

  create(org: string, actor: User, dto: AssignmentDto, key?: string) {
    return this.access.run(org, actor, 'assignment.created', dto, key,
      (manager, role) => this.access.classScope(manager, org, actor, role, dto.sectionId, dto.subjectId, true),
      async (manager) => {
        if (new Date(dto.dueAt).getTime() <= Date.now()) throw new BadRequestException('dueAt must be in the future');
        const row = await manager.getRepository(Assignment).save({ ...dto, dueAt: new Date(dto.dueAt), organizationId: org, createdBy: actor.id });
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'assignment.created', details: { assignmentId: row.id } });
        return row;
      });
  }

  get(org: string, actor: User, id: string) {
    let row: Assignment;
    return this.access.run(org, actor, null, null, null,
      async (manager, role) => { row = await this.access.assignment(manager, org, actor, role, id); }, async () => row);
  }

  update(org: string, actor: User, id: string, dto: UpdateAssignmentDto) {
    let row: Assignment;
    return this.access.run(org, actor, 'assignment.updated', { id, ...dto }, null,
      async (manager, role) => { row = await this.access.assignment(manager, org, actor, role, id, true); },
      async (manager) => {
        if (row.status !== 'draft') throw new ConflictException('Published assignments are immutable');
        const fields = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
        if (!Object.keys(fields).length) throw new BadRequestException('Provide at least one field');
        if (dto.dueAt && new Date(dto.dueAt).getTime() <= Date.now()) throw new BadRequestException('dueAt must be in the future');
        const updated = await manager.getRepository(Assignment).save({ ...row, ...fields, dueAt: dto.dueAt ? new Date(dto.dueAt) : row.dueAt });
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'assignment.updated', details: { assignmentId: id, fields: Object.keys(fields) } });
        return updated;
      });
  }

  publish(org: string, actor: User, id: string, key?: string) {
    let row: Assignment;
    return this.access.run(org, actor, 'assignment.published', { id }, key,
      async (manager, role) => { row = await this.access.assignment(manager, org, actor, role, id, true); },
      async (manager) => {
        if (row.status !== 'draft') throw new ConflictException('Assignment is already published');
        if (row.dueAt.getTime() <= Date.now()) throw new ConflictException('Update the due date before publishing');
        const students = await manager.query(`INSERT INTO submissions (organization_id, assignment_id, student_id)
          SELECT e.organization_id, $3, e.student_user_id FROM enrollments e
          JOIN memberships m ON m.organization_id=e.organization_id AND m.user_id=e.student_user_id
          JOIN users u ON u.id=m.user_id
          WHERE e.organization_id=$1 AND e.section_id=$2 AND e.status='active' AND m.role='student' AND m.status='active' AND u.is_active
          RETURNING id`, [org, row.sectionId, id]);
        if (!students.length) throw new ConflictException('Publish requires at least one active enrolled student');
        const updated = await manager.getRepository(Assignment).save({ ...row, status: 'published' as const, publishedAt: new Date() });
        await this.scorecards.refresh(manager, org, row.sectionId, row.subjectId);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'assignment.published', details: { assignmentId: id, studentCount: students.length } });
        await this.outbox.append(manager, org, actor.id, 'assignment.published', id, row.sectionId, row.subjectId);
        return updated;
      });
  }

  submissions(org: string, actor: User, id: string, query: AcademicListDto) {
    return this.access.run(org, actor, null, null, null,
      async (manager, role) => { await this.access.assignment(manager, org, actor, role, id); },
      async (manager, role) => {
        const [items, total] = await manager.getRepository(Submission).findAndCount({ where: { organizationId: org, assignmentId: id, ...(role === 'student' ? { studentId: actor.id } : {}) }, order: { studentId: 'ASC' }, take: query.limit, skip: query.offset });
        return { items, total, limit: query.limit, offset: query.offset };
      });
  }

  submit(org: string, actor: User, id: string, dto: SubmitDto, key?: string) {
    let assignment: Assignment;
    return this.access.run(org, actor, 'submission.submitted', { id, ...dto }, key,
      async (manager, role) => {
        assignment = await this.access.assignment(manager, org, actor, role, id);
        if (role !== 'student') throw new ForbiddenException('Only students submit their own work');
      }, async (manager) => {
        const repository = manager.getRepository(Submission);
        const row = await repository.findOneByOrFail({ organizationId: org, assignmentId: id, studentId: actor.id });
        if (row.status === 'graded') throw new ConflictException('Graded submissions cannot be replaced');
        const submittedAt = new Date();
        if (row.submittedAt && submittedAt > assignment.dueAt) throw new ConflictException('Cannot resubmit after the deadline');
        const updated = await repository.save({ ...row, content: dto.content, submittedAt, status: submittedAt > assignment.dueAt ? 'late' as const : 'submitted' as const });
        await this.scorecards.refresh(manager, org, assignment.sectionId, assignment.subjectId, actor.id);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'submission.submitted', details: { submissionId: row.id, status: updated.status } });
        return updated;
      });
  }

  grade(org: string, actor: User, id: string, dto: GradeDto) {
    let row: Submission;
    let assignment: Assignment;
    return this.access.run(org, actor, 'submission.graded', { id, ...dto }, null,
      async (manager, role) => {
        const found = await manager.getRepository(Submission).findOneBy({ organizationId: org, id });
        if (!found) throw new NotFoundException('Submission not found');
        row = found;
        assignment = await this.access.assignment(manager, org, actor, role, row.assignmentId, true);
      }, async (manager) => {
        if (!row.submittedAt) throw new ConflictException('Cannot grade pending work');
        if (dto.score > assignment.maxScore) throw new BadRequestException('Score cannot exceed assignment maxScore');
        const updated = await manager.getRepository(Submission).save({ ...row, score: dto.score, feedback: dto.feedback ?? row.feedback, gradedBy: actor.id, gradedAt: new Date(), status: 'graded' as const });
        await this.scorecards.refresh(manager, org, assignment.sectionId, assignment.subjectId, row.studentId);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'submission.graded', details: { submissionId: id, before: row.score, after: dto.score } });
        await this.outbox.append(manager, org, actor.id, 'submission.graded', id, assignment.sectionId, assignment.subjectId);
        return updated;
      });
  }
}
