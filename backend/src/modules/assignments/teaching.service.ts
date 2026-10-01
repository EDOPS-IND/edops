import { Injectable } from '@nestjs/common';
import { AcademicListDto } from '../academics/academic.dto';
import { User } from '../auth/user.entity';
import { ClassQuery } from './teaching.dto';
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
        const items = await manager.query(`SELECT e.student_user_id AS "studentId", e.roll_number AS "rollNumber", u.email ${from}
          ORDER BY e.roll_number, e.student_user_id LIMIT $3 OFFSET $4`, [org, query.sectionId, query.limit, query.offset]);
        return { items, total: count.total, limit: query.limit, offset: query.offset };
      });
  }
}
