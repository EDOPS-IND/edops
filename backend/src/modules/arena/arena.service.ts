import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AcademicListDto } from '../academics/academic.dto';
import { TeachingAccess } from '../assignments/teaching-access.service';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { ScorecardsService } from '../reports/scorecards.service';
import { SchoolRole } from '../tenants/tenant.entity';
import { ArenaAttemptDto, ArenaQuery, ArenaQuestionDto, UpdateArenaQuestionDto } from './arena.dto';
import { ArenaAttempt, ArenaQuestion, questionView } from './arena.entity';
import { Queryable } from '../billing/entitlements';
import { DrizzleService } from '../../database/drizzle.service';

@Injectable()
export class ArenaService {
  constructor(
    private readonly access: TeachingAccess,
    private readonly audit: AuditService,
    private readonly scorecards: ScorecardsService,
    private readonly drizzle: DrizzleService,
  ) {}

  private async question(manager: Queryable, org: string, actor: User, role: SchoolRole, id: string, staff = false, history = false) {
    const [row] = await manager.query(
      `SELECT id, organization_id AS "organizationId", section_id AS "sectionId", subject_id AS "subjectId",
              program_id AS "programId", created_by AS "createdBy", chapter, topic, difficulty,
              question_type AS "questionType", content, answer_key AS "answerKey", tags, max_score AS "maxScore",
              status, published_at AS "publishedAt", created_at AS "createdAt"
       FROM arena_questions
       WHERE organization_id = $1 AND id = $2 LIMIT 1`,
      [org, id]
    );
    if (!row) throw new NotFoundException('Question not found');
    await this.access.classScope(manager, org, actor, role, row.sectionId, row.subjectId, staff);
    if (role === 'student' && row.status !== 'published') {
      if (history && row.status === 'archived') {
        const [attempt] = await manager.query(
          'SELECT 1 FROM arena_attempts WHERE organization_id = $1 AND question_id = $2 AND student_id = $3 LIMIT 1',
          [org, id, actor.id]
        );
        if (!attempt) throw new NotFoundException('Question not found');
      } else {
        throw new NotFoundException('Question not found');
      }
    }
    return row;
  }
  private validate(row: Pick<ArenaQuestion, 'content' | 'answerKey' | 'questionType'>) {
    if (row.questionType === 'subjective') {
      if (!row.content.prompt) throw new BadRequestException('Prompt is required for subjective question');
      return;
    }
    const ids = row.content.options ? row.content.options.map(o => o.id) : [];
    if (row.answerKey.some(id => !ids.includes(id)) || (row.questionType === 'single_choice' && row.answerKey.length !== 1)) {
      throw new BadRequestException('Answer key must reference the options; single_choice requires exactly one correct option');
    }
  }
  create(org: string, actor: User, dto: ArenaQuestionDto, key?: string) {
    return this.access.forFeature('arena')(org, actor, 'arena.question.created', dto, key,
      (m, role) => this.access.classScope(m, org, actor, role, dto.sectionId, dto.subjectId, true), async m => {
        this.validate(dto);
        const [row] = await m.query(
          `INSERT INTO arena_questions (organization_id, section_id, subject_id, created_by, chapter, topic, difficulty, question_type, content, answer_key, tags, max_score, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft') RETURNING *`,
          [org, dto.sectionId, dto.subjectId, actor.id, dto.chapter ?? '', dto.topic, dto.difficulty, dto.questionType, JSON.stringify(dto.content), JSON.stringify(dto.answerKey), dto.tags, dto.maxScore]
        );
        await this.audit.record(m, { organizationId: org, actorId: actor.id, action: 'arena.question.created', details: { questionId: row.id } });
        return questionView(row);
      });
  }
  list(org: string, actor: User, query: ArenaQuery) {
    return this.access.forFeature('arena')(org, actor, null, null, null,
      (m, role) => this.access.classScope(m, org, actor, role, query.sectionId, query.subjectId), async (m, role) => {
        const params: any[] = [org, query.sectionId, query.subjectId];
        let filter = '';
        if (role === 'student') filter += " AND status = 'published'";
        for (const field of ['status','difficulty','topic','chapter'] as const) {
          if (query[field]) {
            params.push(query[field]);
            filter += ` AND ${field} = $${params.length}`;
          }
        }
        if (query.tag) {
          params.push(query.tag);
          filter += ` AND $${params.length} = ANY(tags)`;
        }
        const where = `organization_id = $1 AND section_id = $2 AND subject_id = $3${filter}`;
        const [countRes] = await m.query(`SELECT count(*)::int AS total FROM arena_questions WHERE ${where}`, params);
        const items = await m.query(
          `SELECT id, organization_id AS "organizationId", section_id AS "sectionId", subject_id AS "subjectId",
                  program_id AS "programId", created_by AS "createdBy", chapter, topic, difficulty,
                  question_type AS "questionType", content, tags, max_score AS "maxScore",
                  status, published_at AS "publishedAt", created_at AS "createdAt"
           FROM arena_questions WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, query.limit, query.offset]
        );
        return { items: items.map(questionView), total: countRes.total, limit: query.limit, offset: query.offset };
      });
  }
  filters(org: string, actor: User, query: ArenaQuery) {
    return this.access.forFeature('arena')(org, actor, null, null, null,
      (m, role) => this.access.classScope(m, org, actor, role, query.sectionId, query.subjectId), async (m) => {
        const rows = await m.query(
          `SELECT DISTINCT chapter, topic, difficulty FROM arena_questions
           WHERE organization_id = $1 AND section_id = $2 AND subject_id = $3 AND status = 'published'`,
          [org, query.sectionId, query.subjectId]
        );
        const chapters = [...new Set(rows.map((r: any) => r.chapter).filter(Boolean))];
        const topics = [...new Set(rows.map((r: any) => r.topic).filter(Boolean))];
        return { chapters, topics };
      });
  }
  get(org: string, actor: User, id: string, keyOnly = false) {
    let row: any;
    return this.access.forFeature('arena')(org, actor, null, null, null,
      async (m, role) => { row = await this.question(m, org, actor, role, id, keyOnly); },
      async () => keyOnly ? { answerKey: row.answerKey || row.answer_key } : questionView(row));
  }
  update(org: string, actor: User, id: string, dto: UpdateArenaQuestionDto) {
    let row: any;
    return this.access.forFeature('arena')(org, actor, 'arena.question.updated', { id, ...dto }, null,
      async (m, role) => { row = await this.question(m, org, actor, role, id, true); }, async m => {
        if (row.status !== 'draft') throw new ConflictException('Only draft questions can be edited');
        const fields = Object.fromEntries(Object.entries(dto).filter(([,v]) => v !== undefined));
        if (!Object.keys(fields).length) throw new BadRequestException('Provide at least one field');
        const updated = { ...row, ...fields };
        this.validate(updated);
        const setClauses: string[] = [];
        const params: any[] = [org, id];
        let idx = 3;
        if (dto.chapter !== undefined) { setClauses.push(`chapter = $${idx++}`); params.push(dto.chapter); }
        if (dto.topic !== undefined) { setClauses.push(`topic = $${idx++}`); params.push(dto.topic); }
        if (dto.difficulty !== undefined) { setClauses.push(`difficulty = $${idx++}`); params.push(dto.difficulty); }
        if (dto.content !== undefined) { setClauses.push(`content = $${idx++}`); params.push(JSON.stringify(dto.content)); }
        if (dto.answerKey !== undefined) { setClauses.push(`answer_key = $${idx++}`); params.push(JSON.stringify(dto.answerKey)); }
        if (dto.tags !== undefined) { setClauses.push(`tags = $${idx++}`); params.push(dto.tags); }
        if (dto.maxScore !== undefined) { setClauses.push(`max_score = $${idx++}`); params.push(dto.maxScore); }
        const [saved] = await m.query(`UPDATE arena_questions SET ${setClauses.join(', ')} WHERE organization_id = $1 AND id = $2 RETURNING *`, params);
        await this.audit.record(m, { organizationId: org, actorId: actor.id, action: 'arena.question.updated', details: { questionId: id, fields: Object.keys(fields) } });
        return questionView(saved);
      });
  }
  transition(org: string, actor: User, id: string, target: 'published' | 'archived', key: string | undefined | null) {
    let row: any;
    return this.access.forFeature('arena')(org, actor, `arena.question.${target}`, { id }, key,
      async (m, role) => { row = await this.question(m, org, actor, role, id, true); }, async m => {
        if (target === 'archived' && row.status === target) return questionView(row);
        if (target === 'published' && row.status !== 'draft') throw new ConflictException('Only draft questions can be published');
        this.validate(row);
        const [updated] = await m.query(
          `UPDATE arena_questions SET status = $1, published_at = ${target === 'published' ? 'now()' : 'published_at'} WHERE organization_id = $2 AND id = $3 RETURNING *`,
          [target, org, id]
        );
        await this.audit.record(m, { organizationId: org, actorId: actor.id, action: `arena.question.${target}`, details: { questionId: id } });
        return questionView(updated);
      });
  }
  submit(org: string, actor: User, id: string, dto: ArenaAttemptDto, key?: string) {
    let row: any;
    const answer = [...dto.selectedOptionIds].sort();
    return this.access.forFeature('arena')(org, actor, 'arena.attempt.created', { id, selectedOptionIds: answer }, key,
      async (m, role) => {
        row = await this.question(m, org, actor, role, id);
        if (role !== 'student') throw new ForbiddenException('Only enrolled students can submit practice attempts');
      }, async m => {
        let isCorrect = false;
        let score = 0;
        const maxScore = Number(row.maxScore || row.max_score);
        const answerKey = row.answerKey || row.answer_key;
        if (row.questionType === 'subjective') {
          isCorrect = true;
          score = maxScore;
        } else {
          const options = row.content.options ?? [];
          if (answer.some(optId => !options.some((o: any) => o.id === optId)) || (row.questionType === 'single_choice' && answer.length !== 1)) throw new BadRequestException('Select valid options; single_choice requires exactly one');
          isCorrect = answer.length === answerKey.length && answer.every((optId: string) => answerKey.includes(optId));
          score = isCorrect ? maxScore : 0;
        }
        const [attempt] = await m.query(
          `INSERT INTO arena_attempts (organization_id, question_id, student_id, submitted_answer, is_correct, score, max_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [org, id, actor.id, JSON.stringify(answer), isCorrect, score, maxScore]
        );
        await this.scorecards.refresh(m, org, row.sectionId, row.subjectId, actor.id);
        await this.audit.record(m, { organizationId: org, actorId: actor.id, action: 'arena.attempt.created', details: { questionId: id, attemptId: attempt.id } });
        return attempt;
      }, false);
  }
  attempts(org: string, actor: User, id: string, query: AcademicListDto) {
    return this.access.forFeature('arena')(org, actor, null, null, null,
      async (m, role) => { await this.question(m, org, actor, role, id, false, true); }, async (m, role) => {
        const params: any[] = [org, id];
        let studentFilter = '';
        if (role === 'student') {
          params.push(actor.id);
          studentFilter = ` AND student_id = $${params.length}`;
        }
        const where = `organization_id = $1 AND question_id = $2${studentFilter}`;
        const [countRes] = await m.query(`SELECT count(*)::int AS total FROM arena_attempts WHERE ${where}`, params);
        const items = await m.query(
          `SELECT id, organization_id AS "organizationId", question_id AS "questionId", student_id AS "studentId",
                  submitted_answer AS "submittedAnswer", is_correct AS "isCorrect", score, max_score AS "maxScore",
                  created_at AS "createdAt"
           FROM arena_attempts WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, query.limit, query.offset]
        );
        return { items, total: countRes.total, limit: query.limit, offset: query.offset };
      });
  }
  attempt(org: string, actor: User, id: string) {
    let row: any;
    return this.access.forFeature('arena')(org, actor, null, null, null, async (m, role) => {
      const params = [org, id];
      let studentFilter = '';
      if (role === 'student') {
        params.push(actor.id);
        studentFilter = ` AND student_id = $${params.length}`;
      }
      const [found] = await m.query(
        `SELECT id, organization_id AS "organizationId", question_id AS "questionId", student_id AS "studentId",
                submitted_answer AS "submittedAnswer", is_correct AS "isCorrect", score, max_score AS "maxScore",
                created_at AS "createdAt"
         FROM arena_attempts WHERE organization_id = $1 AND id = $2${studentFilter} LIMIT 1`,
        params
      );
      if (!found) throw new NotFoundException('Attempt not found');
      await this.question(m, org, actor, role, found.questionId, false, true);
      row = found;
    }, async () => row);
  }
}
