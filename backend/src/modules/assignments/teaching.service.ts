import { Injectable, NotFoundException } from '@nestjs/common';
import { AcademicListDto } from '../academics/academic.dto';
import { User } from '../auth/user.entity';
import { AssignmentQuery, ClassQuery, CreateEvaluationDto, UpdateScoresDto } from './teaching.dto';
import { ExamEvaluation } from './teaching.entity';
import { TeachingAccess } from './teaching-access.service';

@Injectable()
export class TeachingService {
  constructor(private readonly access: TeachingAccess) {}

  classes(org: string, actor: User, query: AcademicListDto) {
    return this.access.run(org, actor, null, null, null, async () => {}, async (manager, role) => {
      const where = `c.organization_id=$1 AND ($2='school_admin' OR ($2='teacher' AND c.teacher_user_id=$3)
        OR ($2='student' AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=c.organization_id AND e.section_id=c.section_id AND e.student_user_id=$3 AND e.status='active')))`;
      const params = [org, role, actor.id];
      const [count] = await manager.query(`SELECT count(*)::int AS total FROM class_subject_assignments c WHERE ${where}`, params);
      const items = await manager.query(`SELECT c.section_id AS "sectionId", s.name AS "sectionName", s.academic_year_id AS "academicYearId",
        s.program_id AS "programId", p.name AS "programName",
        c.subject_id AS "subjectId", subject.name AS "subjectName", c.teacher_user_id AS "teacherUserId"
        FROM class_subject_assignments c JOIN sections s ON s.organization_id=c.organization_id AND s.id=c.section_id
        LEFT JOIN programs p ON p.organization_id=s.organization_id AND p.id=s.program_id
        JOIN subjects subject ON subject.organization_id=c.organization_id AND subject.id=c.subject_id
        WHERE ${where} ORDER BY s.name, subject.name, c.id LIMIT $4 OFFSET $5`, [...params, query.limit, query.offset]);
      return { items, total: count.total, limit: query.limit, offset: query.offset };
    });
  }

  roster(org: string, actor: User, query: ClassQuery) {
    return this.access.run(org, actor, null, null, null,
      (manager, role) => this.access.classScope(manager, org, actor, role, query.sectionId, query.subjectId ?? null, true),
      async (manager) => {
        const from = `FROM enrollments e JOIN memberships m ON m.organization_id=e.organization_id AND m.user_id=e.student_user_id
          JOIN users u ON u.id=m.user_id WHERE e.organization_id=$1 AND e.section_id=$2 AND e.status='active'
          AND m.role='student' AND m.status='active' AND u.is_active`;
        const [count] = await manager.query(`SELECT count(*)::int AS total ${from}`, [org, query.sectionId]);
        const items = await manager.query(`SELECT e.student_user_id AS "studentId", e.roll_number AS "rollNumber", u.email, coalesce(nullif(u.name, ''), split_part(u.email, '@', 1)) AS "studentName" ${from}
          ORDER BY e.roll_number, e.student_user_id LIMIT $3 OFFSET $4`, [org, query.sectionId, query.limit, query.offset]);
        return { items, total: count.total, limit: query.limit, offset: query.offset };
      });
  }

  evaluations(org: string, actor: User, query: AssignmentQuery) {
    return this.access.run(org, actor, null, null, null,
      (manager, role) => this.access.classScope(manager, org, actor, role, query.sectionId, query.subjectId),
      async (manager, role) => {
        const items = await manager.getRepository(ExamEvaluation).find({
          where: { organizationId: org, sectionId: query.sectionId, subjectId: query.subjectId },
          order: { createdAt: 'ASC' },
        });
        const mapped = items.map((item) => {
          if (role === 'student') {
            const score = typeof item.studentScores?.[actor.id] === 'number' ? item.studentScores[actor.id] : null;
            return {
              id: item.id,
              organizationId: item.organizationId,
              sectionId: item.sectionId,
              subjectId: item.subjectId,
              title: item.title,
              maxMarks: item.maxMarks,
              weightage: item.weightage,
              myScore: score,
              createdAt: item.createdAt,
            };
          }
          return item;
        });
        return { items: mapped, total: mapped.length, limit: query.limit, offset: query.offset };
      });
  }

  createEvaluation(org: string, actor: User, dto: CreateEvaluationDto) {
    return this.access.run(org, actor, null, null, null,
      (manager, role) => this.access.classScope(manager, org, actor, role, dto.sectionId, dto.subjectId, true),
      async (manager) => {
        const repo = manager.getRepository(ExamEvaluation);
        const item = repo.create({
          organizationId: org,
          sectionId: dto.sectionId,
          subjectId: dto.subjectId,
          title: dto.title,
          maxMarks: dto.maxMarks ?? 100,
          weightage: dto.weightage ?? 20,
          studentScores: {},
        });
        return repo.save(item);
      });
  }

  updateEvaluationScores(org: string, actor: User, id: string, dto: UpdateScoresDto) {
    return this.access.run(org, actor, null, null, null,
      async (manager, role) => {
        const item = await manager.getRepository(ExamEvaluation).findOneBy({ organizationId: org, id });
        if (!item) throw new NotFoundException('Evaluation not found');
        await this.access.classScope(manager, org, actor, role, item.sectionId, item.subjectId, true);
      },
      async (manager) => {
        const repo = manager.getRepository(ExamEvaluation);
        const item = await repo.findOneByOrFail({ organizationId: org, id });
        item.studentScores = { ...(item.studentScores || {}), ...dto.scores };
        return repo.save(item);
      });
  }

  deleteEvaluation(org: string, actor: User, id: string) {
    return this.access.run(org, actor, null, null, null,
      async (manager, role) => {
        const item = await manager.getRepository(ExamEvaluation).findOneBy({ organizationId: org, id });
        if (!item) throw new NotFoundException('Evaluation not found');
        await this.access.classScope(manager, org, actor, role, item.sectionId, item.subjectId, true);
      },
      async (manager) => {
        await manager.getRepository(ExamEvaluation).delete({ organizationId: org, id });
        return { success: true };
      });
  }
}

