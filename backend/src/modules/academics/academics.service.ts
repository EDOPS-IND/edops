import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { SchoolRole } from '../tenants/tenant.entity';
import { SchoolWork } from '../tenants/school-work.service';
import { AcademicRecord, AcademicYear, ClassSubjectAssignment, Enrollment, Program, Section, Subject } from './academic.entity';
import { AcademicListDto, AcademicYearDto, BatchPromotionDto, EnrollmentDto, ProgramDto, SectionDto, SectionListDto, SectionResourceListDto, SubjectDto, TeacherAssignmentDto, TransferEnrollmentDto, UpdateAcademicYearDto, UpdateEnrollmentDto, UpdateProgramDto, UpdateSectionDto, UpdateSubjectDto, UpdateTeacherAssignmentDto } from './academic.dto';
import { DrizzleService } from '../../database/drizzle.service';

const TABLE_NAMES: Record<string, string> = {
  AcademicYear: 'academic_years',
  Program: 'programs',
  Subject: 'subjects',
  Section: 'sections',
  ClassSubjectAssignment: 'class_subject_assignments',
  Enrollment: 'enrollments',
};

@Injectable()
export class AcademicsService {
  constructor(
    private readonly work: SchoolWork,
    private readonly audit: AuditService,
    private readonly drizzle: DrizzleService,
  ) {}

  roleWorkspace(org: string, actor: User) {
    let role: SchoolRole;
    return this.work.run(org, actor, null, null, null, async (manager) => {
      if (role === 'teacher') {
        const assignments = await manager.query(`SELECT assignment.id, section.id AS "sectionId", section.name AS "sectionName",
          subject.id AS "subjectId", subject.name AS "subjectName", subject.code AS "subjectCode"
          FROM class_subject_assignments assignment
          JOIN sections section ON section.id = assignment.section_id AND section.organization_id = assignment.organization_id
          JOIN subjects subject ON subject.id = assignment.subject_id AND subject.organization_id = assignment.organization_id
          WHERE assignment.organization_id = $1 AND assignment.teacher_user_id = $2
          ORDER BY section.name, subject.name`, [org, actor.id]);
        const students = await manager.query(`SELECT DISTINCT user_account.id AS "studentUserId", user_account.email,
          enrollment.section_id AS "sectionId", section.name AS "sectionName", enrollment.roll_number AS "rollNumber"
          FROM enrollments enrollment
          JOIN sections section ON section.id = enrollment.section_id AND section.organization_id = enrollment.organization_id
          JOIN memberships membership ON membership.organization_id = enrollment.organization_id AND membership.user_id = enrollment.student_user_id
            AND membership.role = 'student' AND membership.status = 'active'
          JOIN users user_account ON user_account.id = enrollment.student_user_id AND user_account.is_active
          WHERE enrollment.organization_id = $1 AND enrollment.status = 'active' AND EXISTS (
            SELECT 1 FROM class_subject_assignments assignment WHERE assignment.organization_id = enrollment.organization_id
               AND assignment.section_id = enrollment.section_id AND assignment.teacher_user_id = $2)
          ORDER BY section.name, enrollment.roll_number, user_account.email`, [org, actor.id]);
        return { role: 'teacher' as const, assignments, students };
      }
      if (role === 'student') {
        const [enrollment] = await manager.query(`SELECT enrollment.id, enrollment.section_id AS "sectionId",
          section.name AS "sectionName", enrollment.roll_number AS "rollNumber", program.name AS "programName",
          academic_year.name AS "academicYearName"
          FROM enrollments enrollment
          JOIN sections section ON section.id = enrollment.section_id AND section.organization_id = enrollment.organization_id
          JOIN programs program ON program.id = section.program_id AND program.organization_id = section.organization_id
          JOIN academic_years academic_year ON academic_year.id = enrollment.academic_year_id AND academic_year.organization_id = enrollment.organization_id
          WHERE enrollment.organization_id = $1 AND enrollment.student_user_id = $2 AND enrollment.status = 'active'
          ORDER BY enrollment.created_at DESC LIMIT 1`, [org, actor.id]);
        const subjects = enrollment ? await manager.query(`SELECT subject.id AS "subjectId", subject.name AS "subjectName",
          subject.code AS "subjectCode", user_account.id AS "teacherUserId", user_account.email AS "teacherEmail"
          FROM class_subject_assignments assignment
          JOIN subjects subject ON subject.id = assignment.subject_id AND subject.organization_id = assignment.organization_id
          JOIN memberships membership ON membership.organization_id = assignment.organization_id AND membership.user_id = assignment.teacher_user_id
            AND membership.role = 'teacher' AND membership.status = 'active'
          JOIN users user_account ON user_account.id = assignment.teacher_user_id AND user_account.is_active
          WHERE assignment.organization_id = $1 AND assignment.section_id = $2
          ORDER BY subject.name`, [org, enrollment.sectionId]) : [];
        return { role: 'student' as const, enrollment: enrollment ?? null, subjects };
      }
      if (role === 'parent') {
        const children = await manager.query(`SELECT user_account.id AS "studentUserId",
          COALESCE(NULLIF(user_account.name, ''), split_part(user_account.email, '@', 1)) AS "name",
          user_account.email,
          COALESCE(enrollment.roll_number, '') AS "rollNumber",
          COALESCE(section.name, '') AS "sectionName",
          COALESCE(program.name, '') AS "programName",
          COALESCE((
            SELECT ROUND(AVG(CASE WHEN status = 'present' THEN 100.0 ELSE 0 END)::numeric, 1)
            FROM attendance_records ar
            WHERE ar.organization_id = $1 AND ar.student_id = user_account.id
          ), 0) AS "attendancePct",
          COALESCE((
            SELECT CASE WHEN ar.status = 'present' THEN 'Present' ELSE 'Absent' END
            FROM attendance_records ar
            JOIN attendance_sessions sess ON sess.id = ar.attendance_session_id AND sess.organization_id=ar.organization_id
            WHERE ar.organization_id = $1 AND ar.student_id = user_account.id AND sess.date=CURRENT_DATE AND sess.status='finalized'
            ORDER BY sess.date DESC LIMIT 1
          ), 'Unknown') AS "todayAttendance"
          FROM parent_student_relationships psr
          JOIN users user_account ON user_account.id = psr.student_id AND user_account.is_active
          LEFT JOIN enrollments enrollment ON enrollment.student_user_id = user_account.id AND enrollment.organization_id = $1 AND enrollment.status = 'active'
          LEFT JOIN sections section ON section.id = enrollment.section_id AND section.organization_id = $1
          LEFT JOIN programs program ON program.id = section.program_id AND program.organization_id = $1
          WHERE psr.school_id = $1 AND psr.parent_id = $2 AND psr.verification_status = 'verified' AND psr.status = 'active'
          ORDER BY enrollment.roll_number, user_account.email`, [org, actor.id]);

        const messages = await manager.query(
          `SELECT tm.*, su.name as sender_name, su.email as sender_email
           FROM teacher_messages tm
           LEFT JOIN users su ON su.id = tm.sender_id
           WHERE tm.organization_id = $1 AND (tm.recipient_id = $2 OR tm.sender_id = $2)
           ORDER BY tm.created_at DESC LIMIT 20`,
          [org, actor.id]
        );

        return { role: 'parent' as const, children: children || [], messages: messages || [] };
      }
      return { role } as any;
    }, {
      roles: ['teacher', 'student', 'parent'],
      authorize: async (manager) => {
        const [member] = await manager.query(
          "SELECT role FROM memberships WHERE organization_id = $1 AND user_id = $2 AND status = 'active' LIMIT 1",
          [org, actor.id]
        );
        role = member?.role;
      },
    });
  }

  private getTableName(type: any): string {
    const name = typeof type === 'function' ? type.name : String(type);
    return TABLE_NAMES[name] || name.toLowerCase();
  }

  private async record<T = any>(manager: any, type: any, org: string, id: string): Promise<T> {
    const tableName = this.getTableName(type);
    const [row] = await manager.query(`SELECT * FROM ${tableName} WHERE organization_id = $1 AND id = $2 LIMIT 1`, [org, id]);
    if (!row) throw new NotFoundException('Record not found');
    return row;
  }

  private async saveRecord(manager: any, type: any, row: any, actor: User, action: string, before: any = null) {
    const tableName = this.getTableName(type);
    let result: any;
    if (row.id && before) {
      // Update
      const keys = Object.keys(row).filter((k) => k !== 'id' && k !== 'organizationId' && k !== 'createdAt' && row[k] !== undefined);
      const setClauses: string[] = [];
      const params: any[] = [];
      let idx = 1;
      for (const k of keys) {
        const col = k.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        setClauses.push(`${col} = $${idx++}`);
        params.push(row[k]);
      }
      params.push(row.id);
      params.push(row.organizationId || row.organization_id);
      const [updated] = await manager.query(
        `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx++} RETURNING *`,
        params
      );
      result = updated;
    } else {
      // Insert
      const keys = Object.keys(row).filter((k) => row[k] !== undefined);
      const cols: string[] = [];
      const valPlaceholders: string[] = [];
      const params: any[] = [];
      let idx = 1;
      for (const k of keys) {
        const col = k.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        cols.push(col);
        valPlaceholders.push(`$${idx++}`);
        params.push(row[k]);
      }
      const [inserted] = await manager.query(
        `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${valPlaceholders.join(', ')}) RETURNING *`,
        params
      );
      result = inserted;
    }
    const orgId = result.organization_id || result.organizationId;
    await this.audit.record(manager, { organizationId: orgId, actorId: actor.id, action, details: { before, after: result } });
    return result;
  }

  private fields<T extends object>(dto: T): Partial<T> {
    const entries = Object.entries(dto).filter(([, value]) => value !== undefined);
    if (!entries.length) throw new BadRequestException('Provide at least one supported field');
    return Object.fromEntries(entries) as Partial<T>;
  }

  list(org: string, actor: User, type: any, query: AcademicListDto, filter: Record<string, any> = {}) {
    return this.work.run(org, actor, null, null, null, async (manager) => {
      const tableName = this.getTableName(type);
      const whereClause: string[] = ['organization_id = $1'];
      const params: any[] = [org];
      let paramIdx = 2;

      for (const [key, val] of Object.entries(filter)) {
        if (val !== undefined) {
          const colName = key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
          whereClause.push(`${colName} = $${paramIdx++}`);
          params.push(val);
        }
      }

      const countSql = `SELECT count(*)::int as total FROM ${tableName} WHERE ${whereClause.join(' AND ')}`;
      const selectSql = `SELECT * FROM ${tableName} WHERE ${whereClause.join(' AND ')} ORDER BY created_at ASC, id ASC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;

      const [countRes, items] = await Promise.all([
        manager.query(countSql, params),
        manager.query(selectSql, [...params, query.limit, query.offset]),
      ]);

      const total = countRes[0]?.total ?? 0;
      return { items, total, limit: query.limit, offset: query.offset };
    });
  }

  listSections(org: string, actor: User, query: SectionListDto) {
    return this.list(org, actor, Section, query, query.academicYearId ? { academicYearId: query.academicYearId } : {});
  }

  listSectionRecords(org: string, actor: User, kind: 'assignments' | 'enrollments', query: SectionResourceListDto) {
    const filter = query.sectionId ? { sectionId: query.sectionId } : {};
    return kind === 'assignments' ? this.list(org, actor, ClassSubjectAssignment, query, filter) : this.list(org, actor, Enrollment, query, filter);
  }

  createYear(org: string, actor: User, dto: AcademicYearDto, key?: string) {
    return this.work.run(org, actor, 'academic_year.created', dto, key, async (manager) => {
      if (dto.endDate < dto.startDate) throw new BadRequestException('endDate must be on or after startDate');
      if (dto.isCurrent) await this.clearCurrentYear(manager, org, actor);
      return this.saveRecord(manager, AcademicYear, { ...dto, organizationId: org }, actor, 'academic_year.created');
    });
  }

  private async clearCurrentYear(manager: any, org: string, actor: User, except?: string) {
    const [current] = await manager.query(
      'SELECT * FROM academic_years WHERE organization_id = $1 AND is_current = true LIMIT 1',
      [org]
    );
    if (current && current.id !== except) {
      await this.saveRecord(manager, AcademicYear, { ...current, isCurrent: false }, actor, 'academic_year.updated', current);
    }
  }

  updateYear(org: string, actor: User, id: string, dto: UpdateAcademicYearDto) {
    return this.work.run(org, actor, 'academic_year.updated', dto, null, async (manager) => {
      const before = await this.record(manager, AcademicYear, org, id);
      const row = { ...before, ...this.fields(dto) };
      if (row.endDate < row.startDate || row.end_date < row.start_date) throw new BadRequestException('endDate must be on or after startDate');
      if (row.isCurrent || row.is_current) await this.clearCurrentYear(manager, org, actor, id);
      return this.saveRecord(manager, AcademicYear, row, actor, 'academic_year.updated', before);
    });
  }

  createProgram(org: string, actor: User, dto: ProgramDto, key?: string) {
    return this.work.run(org, actor, 'program.created', dto, key, (manager) => this.saveRecord(manager, Program, { ...dto, organizationId: org }, actor, 'program.created'));
  }

  updateProgram(org: string, actor: User, id: string, dto: UpdateProgramDto) {
    return this.work.run(org, actor, 'program.updated', dto, null, async (manager) => {
      const before = await this.record(manager, Program, org, id);
      return this.saveRecord(manager, Program, { ...before, ...this.fields(dto) }, actor, 'program.updated', before);
    });
  }

  createSubject(org: string, actor: User, dto: SubjectDto, key?: string) {
    return this.work.run(org, actor, 'subject.created', dto, key, (manager) => this.saveRecord(manager, Subject, { ...dto, organizationId: org }, actor, 'subject.created'));
  }

  updateSubject(org: string, actor: User, id: string, dto: UpdateSubjectDto) {
    return this.work.run(org, actor, 'subject.updated', dto, null, async (manager) => {
      const before = await this.record(manager, Subject, org, id);
      return this.saveRecord(manager, Subject, { ...before, ...this.fields(dto) }, actor, 'subject.updated', before);
    });
  }

  createSection(org: string, actor: User, dto: SectionDto, key?: string) {
    return this.work.run(org, actor, 'section.created', dto, key, async (manager) => {
      await this.record(manager, AcademicYear, org, dto.academicYearId);
      await this.record(manager, Program, org, dto.programId);
      return this.saveRecord(manager, Section, { ...dto, organizationId: org }, actor, 'section.created');
    });
  }

  updateSection(org: string, actor: User, id: string, dto: UpdateSectionDto) {
    return this.work.run(org, actor, 'section.updated', dto, null, async (manager) => {
      const before = await this.record(manager, Section, org, id);
      const row = { ...before, ...this.fields(dto) };
      const [countRes] = await manager.query(
        "SELECT count(*)::int AS total FROM enrollments WHERE organization_id = $1 AND section_id = $2 AND status = 'active'",
        [org, id]
      );
      const used = countRes?.total ?? 0;
      if (row.capacity < used) throw new ConflictException('Capacity cannot be below active enrollment count');
      return this.saveRecord(manager, Section, row, actor, 'section.updated', before);
    });
  }

  private async member(manager: any, org: string, userId: string, role: 'teacher' | 'student') {
    const [membership] = await manager.query(
      'SELECT * FROM memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1',
      [org, userId]
    );
    if (!membership) throw new NotFoundException('Member not found');
    const [user] = await manager.query('SELECT is_active FROM users WHERE id = $1 LIMIT 1', [userId]);
    if (membership.role !== role || membership.status !== 'active' || !user?.is_active) {
      throw new ConflictException(`An active ${role} membership and account are required`);
    }
  }

  assignTeacher(org: string, actor: User, dto: TeacherAssignmentDto, key?: string) {
    return this.work.run(org, actor, 'teacher_assignment.created', dto, key, async (manager) => {
      await this.record(manager, Section, org, dto.sectionId);
      await this.record(manager, Subject, org, dto.subjectId);
      await this.member(manager, org, dto.teacherUserId, 'teacher');
      return this.saveRecord(manager, ClassSubjectAssignment, { ...dto, organizationId: org }, actor, 'teacher_assignment.created');
    });
  }

  updateTeacher(org: string, actor: User, id: string, dto: UpdateTeacherAssignmentDto) {
    return this.work.run(org, actor, 'teacher_assignment.updated', dto, null, async (manager) => {
      const before = await this.record(manager, ClassSubjectAssignment, org, id);
      await this.member(manager, org, dto.teacherUserId, 'teacher');
      return this.saveRecord(manager, ClassSubjectAssignment, { ...before, teacherUserId: dto.teacherUserId }, actor, 'teacher_assignment.updated', before);
    });
  }

  private async availableSection(manager: any, org: string, sectionId: string) {
    const section = await this.record(manager, Section, org, sectionId);
    const [countRes] = await manager.query(
      "SELECT count(*)::int AS total FROM enrollments WHERE organization_id = $1 AND section_id = $2 AND status = 'active'",
      [org, sectionId]
    );
    const count = countRes?.total ?? 0;
    if (count >= section.capacity) throw new ConflictException('Section capacity reached');
    return section;
  }

  enroll(org: string, actor: User, dto: EnrollmentDto, key?: string) {
    return this.work.run(org, actor, 'enrollment.created', dto, key, async (manager) => {
      const section = await this.availableSection(manager, org, dto.sectionId);
      await this.member(manager, org, dto.studentUserId, 'student');
      const academicYearId = section.academic_year_id || section.academicYearId;
      return this.saveRecord(manager, Enrollment, { ...dto, organizationId: org, academicYearId }, actor, 'enrollment.created');
    });
  }

  updateEnrollment(org: string, actor: User, id: string, dto: UpdateEnrollmentDto) {
    return this.work.run(org, actor, 'enrollment.updated', dto, null, async (manager) => {
      const before = await this.record(manager, Enrollment, org, id);
      if (before.status !== 'active') throw new ConflictException('Only active enrollments can be updated');
      return this.saveRecord(manager, Enrollment, { ...before, rollNumber: dto.rollNumber }, actor, 'enrollment.updated', before);
    });
  }

  withdraw(org: string, actor: User, id: string) {
    return this.work.run(org, actor, 'enrollment.withdrawn', { id }, null, async (manager) => {
      const before = await this.record(manager, Enrollment, org, id);
      if (before.status !== 'active') throw new ConflictException('Enrollment is not active');
      return this.saveRecord(manager, Enrollment, { ...before, status: 'withdrawn' }, actor, 'enrollment.withdrawn', before);
    });
  }

  transfer(org: string, actor: User, id: string, dto: TransferEnrollmentDto, key?: string) {
    return this.work.run(org, actor, 'enrollment.transferred', { id, ...dto }, key, async (manager) => {
      const before = await this.record(manager, Enrollment, org, id);
      const beforeSectionId = before.section_id || before.sectionId;
      const beforeYearId = before.academic_year_id || before.academicYearId;
      const beforeStudentId = before.student_user_id || before.studentUserId;
      if (before.status !== 'active' || beforeSectionId === dto.sectionId) throw new ConflictException('Transfer requires an active enrollment and a different section');
      const section = await this.availableSection(manager, org, dto.sectionId);
      const sectionYearId = section.academic_year_id || section.academicYearId;
      if (sectionYearId !== beforeYearId) throw new ConflictException('Transfer must stay within the academic year; use new enrollment for year rollover');
      await this.member(manager, org, beforeStudentId, 'student');
      await this.saveRecord(manager, Enrollment, { ...before, status: 'transferred' }, actor, 'enrollment.transferred', before);
      return this.saveRecord(manager, Enrollment, { organizationId: org, studentUserId: beforeStudentId,
        sectionId: section.id, academicYearId: sectionYearId, rollNumber: dto.rollNumber }, actor, 'enrollment.created');
    });
  }

  batchPromote(org: string, actor: User, dto: BatchPromotionDto) {
    return this.work.run(org, actor, 'enrollment.promoted', dto, null, async (manager) => {
      let count = 0;
      if (dto.action === 'graduate') {
        for (const studentId of dto.studentUserIds) {
          await manager.query(
            `UPDATE enrollments SET status = 'graduated'
             WHERE organization_id = $1 AND section_id = $2 AND student_user_id = $3 AND status = 'active'`,
            [org, dto.sourceSectionId, studentId]
          );
          count++;
        }
        return { success: true, count, action: 'graduate' };
      }

      if (!dto.targetSectionId || !dto.targetAcademicYearId) {
        throw new BadRequestException('Target section and academic year are required for promotion');
      }

      await this.availableSection(manager, org, dto.targetSectionId);

      for (const studentId of dto.studentUserIds) {
        await manager.query(
          `UPDATE enrollments SET status = 'completed'
           WHERE organization_id = $1 AND section_id = $2 AND student_user_id = $3 AND status = 'active'`,
          [org, dto.sourceSectionId, studentId]
        );

        const [cntRes] = await manager.query(
          `SELECT COUNT(*)::int as count FROM enrollments WHERE organization_id = $1 AND section_id = $2`,
          [org, dto.targetSectionId]
        );
        const roll = `ROLL-${String((cntRes?.count || 0) + 1).padStart(3, '0')}`;

        await manager.query(
          `INSERT INTO enrollments (organization_id, student_user_id, section_id, academic_year_id, roll_number, status)
           VALUES ($1, $2, $3, $4, $5, 'active')
           ON CONFLICT DO NOTHING`,
          [org, studentId, dto.targetSectionId, dto.targetAcademicYearId, roll]
        );
        count++;
      }

      return { success: true, count, action: 'promote', targetSectionId: dto.targetSectionId };
    });
  }
}
