import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AcademicListDto } from '../academics/academic.dto';
import { TeachingAccess } from '../assignments/teaching-access.service';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { ScorecardsService } from '../reports/scorecards.service';
import { SchoolRole } from '../tenants/tenant.entity';
import { ArenaAttemptDto, ArenaQuery, ArenaQuestionDto, UpdateArenaQuestionDto } from './arena.dto';
import { ArenaAttempt, ArenaQuestion, questionView } from './arena.entity';

@Injectable()
export class ArenaService {
  constructor(private readonly access: TeachingAccess, private readonly audit: AuditService, private readonly scorecards: ScorecardsService) {}

  private async question(manager: EntityManager, org: string, actor: User, role: SchoolRole, id: string, staff = false, history = false) {
    const row = await manager.getRepository(ArenaQuestion).createQueryBuilder('q').addSelect('q.answerKey')
      .where('q.organization_id=:org AND q.id=:id', { org, id }).getOne();
    if (!row) throw new NotFoundException('Question not found');
    await this.access.classScope(manager, org, actor, role, row.sectionId, row.subjectId, staff);
    if (role === 'student' && row.status !== 'published' && !(history && row.status === 'archived' &&
      await manager.getRepository(ArenaAttempt).existsBy({ organizationId: org, questionId: id, studentId: actor.id }))) throw new NotFoundException('Question not found');
    return row;
  }
  private validate(row: Pick<ArenaQuestion, 'content' | 'answerKey' | 'questionType'>) {
    const ids = row.content.options.map(o => o.id);
    if (row.answerKey.some(id => !ids.includes(id)) || (row.questionType === 'single_choice' && row.answerKey.length !== 1)) {
      throw new BadRequestException('Answer key must reference the options; single_choice requires exactly one correct option');
    }
  }
  create(org: string, actor: User, dto: ArenaQuestionDto, key?: string) {
    return this.access.forFeature('arena')(org, actor, 'arena.question.created', dto, key,
      (m, role) => this.access.classScope(m, org, actor, role, dto.sectionId, dto.subjectId, true), async m => {
        this.validate(dto);
        const row = await m.getRepository(ArenaQuestion).save({ ...dto, organizationId: org, createdBy: actor.id });
        await this.audit.record(m, { organizationId: org, actorId: actor.id, action: 'arena.question.created', details: { questionId: row.id } });
        return questionView(row);
      });
  }
  list(org: string, actor: User, query: ArenaQuery) {
    return this.access.forFeature('arena')(org, actor, null, null, null,
      (m, role) => this.access.classScope(m, org, actor, role, query.sectionId, query.subjectId), async (m, role) => {
        const qb = m.getRepository(ArenaQuestion).createQueryBuilder('q').where('q.organization_id=:org AND q.section_id=:section AND q.subject_id=:subject', { org, section: query.sectionId, subject: query.subjectId });
        if (role === 'student') qb.andWhere("q.status='published'");
        for (const field of ['status','difficulty','topic'] as const) if (query[field]) qb.andWhere(`q.${field}=:${field}`, { [field]: query[field] });
        if (query.tag) qb.andWhere(':tag=ANY(q.tags)', { tag: query.tag });
        const [items, total] = await qb.orderBy('q.created_at','DESC').addOrderBy('q.id','DESC').take(query.limit).skip(query.offset).getManyAndCount();
        return { items: items.map(questionView), total, limit: query.limit, offset: query.offset };
      });
  }
  get(org: string, actor: User, id: string, keyOnly = false) {
    let row: ArenaQuestion;
    return this.access.forFeature('arena')(org, actor, null, null, null,
      async (m, role) => { row = await this.question(m, org, actor, role, id, keyOnly); },
      async () => keyOnly ? { answerKey: row.answerKey } : questionView(row));
  }
  update(org: string, actor: User, id: string, dto: UpdateArenaQuestionDto) {
    let row: ArenaQuestion;
    return this.access.forFeature('arena')(org, actor, 'arena.question.updated', { id, ...dto }, null,
      async (m, role) => { row = await this.question(m, org, actor, role, id, true); }, async m => {
        if (row.status !== 'draft') throw new ConflictException('Only draft questions can be edited');
        const fields = Object.fromEntries(Object.entries(dto).filter(([,v]) => v !== undefined));
        if (!Object.keys(fields).length) throw new BadRequestException('Provide at least one field');
        const updated = { ...row, ...fields };
        this.validate(updated);
        await m.getRepository(ArenaQuestion).save(updated);
        await this.audit.record(m, { organizationId: org, actorId: actor.id, action: 'arena.question.updated', details: { questionId: id, fields: Object.keys(fields) } });
        return questionView(updated);
      });
  }
  transition(org: string, actor: User, id: string, target: 'published' | 'archived', key: string | undefined | null) {
    let row: ArenaQuestion;
    return this.access.forFeature('arena')(org, actor, `arena.question.${target}`, { id }, key,
      async (m, role) => { row = await this.question(m, org, actor, role, id, true); }, async m => {
        if (target === 'archived' && row.status === target) return questionView(row);
        if (target === 'published' && row.status !== 'draft') throw new ConflictException('Only draft questions can be published');
        this.validate(row);
        const updated = await m.getRepository(ArenaQuestion).save({ ...row, status: target, publishedAt: target === 'published' ? new Date() : row.publishedAt });
        await this.audit.record(m, { organizationId: org, actorId: actor.id, action: `arena.question.${target}`, details: { questionId: id } });
        return questionView(updated);
      });
  }
  submit(org: string, actor: User, id: string, dto: ArenaAttemptDto, key?: string) {
    let row: ArenaQuestion;
    const answer = [...dto.selectedOptionIds].sort();
    return this.access.forFeature('arena')(org, actor, 'arena.attempt.created', { id, selectedOptionIds: answer }, key,
      async (m, role) => {
        row = await this.question(m, org, actor, role, id);
        if (role !== 'student') throw new ForbiddenException('Only enrolled students can submit practice attempts');
      }, async m => {
        if (answer.some(id => !row.content.options.some(o => o.id === id)) || (row.questionType === 'single_choice' && answer.length !== 1)) throw new BadRequestException('Select valid options; single_choice requires exactly one');
        const correct = answer.length === row.answerKey.length && answer.every(id => row.answerKey.includes(id));
        const attempt = await m.getRepository(ArenaAttempt).save({ organizationId: org, questionId: id, studentId: actor.id,
          submittedAnswer: answer, isCorrect: correct, score: correct ? row.maxScore : 0, maxScore: row.maxScore });
        await this.scorecards.refresh(m, org, row.sectionId, row.subjectId);
        await this.audit.record(m, { organizationId: org, actorId: actor.id, action: 'arena.attempt.created', details: { questionId: id, attemptId: attempt.id } });
        return attempt;
      });
  }
  attempts(org: string, actor: User, id: string, query: AcademicListDto) {
    return this.access.forFeature('arena')(org, actor, null, null, null,
      async (m, role) => { await this.question(m, org, actor, role, id, false, true); }, async (m, role) => {
        const [items, total] = await m.getRepository(ArenaAttempt).findAndCount({ where: { organizationId: org, questionId: id, ...(role === 'student' ? { studentId: actor.id } : {}) },
          order: { createdAt: 'DESC', id: 'DESC' }, take: query.limit, skip: query.offset });
        return { items, total, limit: query.limit, offset: query.offset };
      });
  }
  attempt(org: string, actor: User, id: string) {
    let row: ArenaAttempt;
    return this.access.forFeature('arena')(org, actor, null, null, null, async (m, role) => {
      const found = await m.getRepository(ArenaAttempt).findOneBy({ organizationId: org, id, ...(role === 'student' ? { studentId: actor.id } : {}) });
      if (!found) throw new NotFoundException('Attempt not found');
      await this.question(m, org, actor, role, found.questionId, false, true);
      row = found;
    }, async () => row);
  }
}
