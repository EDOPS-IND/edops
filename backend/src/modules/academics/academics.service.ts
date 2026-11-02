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
          ), NULL) AS "todayAttendance",
          (
            SELECT ROUND(AVG(r.percentage)::numeric, 1)
            FROM principal_exam_results r
            WHERE r.organization_id = $1 AND r.student_user_id = user_account.id AND r.status = 'Published'
          ) AS "aggregateAverage",
          (
            SELECT CASE
              WHEN COUNT(*) = 0 THEN NULL
              WHEN AVG(r.percentage) >= 80 THEN 'Exemplary'
              WHEN AVG(r.percentage) >= 65 THEN 'Good'
              WHEN AVG(r.percentage) >= 40 THEN 'Average'
              ELSE 'Needs Support'
            END
            FROM principal_exam_results r
            WHERE r.organization_id = $1 AND r.student_user_id = user_account.id AND r.status = 'Published'
          ) AS "academicStanding"
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
    return this.work.run(org, actor, null, null, null, async (manager) => {
      const whereClause: string[] = ['s.organization_id = $1'];
      const params: any[] = [org];
      let paramIdx = 2;

      if (query.academicYearId) {
        whereClause.push(`s.academic_year_id = $${paramIdx++}`);
        params.push(query.academicYearId);
      }

      const countSql = `SELECT count(*)::int as total FROM sections s WHERE ${whereClause.join(' AND ')}`;
      const selectSql = `SELECT s.*, p.name as "programName", p.name as "className", CONCAT(p.name, ' ', s.name) as "classSection"
                         FROM sections s
                         LEFT JOIN programs p ON p.id = s.program_id
                         WHERE ${whereClause.join(' AND ')}
                         ORDER BY p.sequence_order ASC, p.name ASC, s.name ASC
                         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;

      const [countRes, items] = await Promise.all([
        manager.query(countSql, params),
        manager.query(selectSql, [...params, query.limit ?? 100, query.offset ?? 0]),
      ]);

      const total = countRes[0]?.total ?? 0;
      return { items, total, limit: query.limit ?? 100, offset: query.offset ?? 0 };
    });
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
      if (dto.classTeacherUserId) {
        const [existing] = await manager.query(
          `SELECT s.name as "sectionName", p.name as "programName"
           FROM sections s
           JOIN programs p ON p.id = s.program_id
           WHERE s.organization_id = $1 AND s.class_teacher_user_id = $2
           LIMIT 1`,
          [org, dto.classTeacherUserId],
        );
        if (existing) {
          throw new ConflictException(
            `Teacher is already assigned as Class Teacher for ${existing.programName || ""} ${existing.sectionName || ""}`.trim(),
          );
        }
      }
      return this.saveRecord(manager, Section, { ...dto, organizationId: org }, actor, 'section.created');
    });
  }

  updateSection(org: string, actor: User, id: string, dto: UpdateSectionDto) {
    return this.work.run(org, actor, 'section.updated', dto, null, async (manager) => {
      const before = await this.record(manager, Section, org, id);
      const row = { ...before, ...this.fields(dto) };
      if (row.classTeacherUserId && row.classTeacherUserId !== before.classTeacherUserId) {
        const [existing] = await manager.query(
          `SELECT s.name as "sectionName", p.name as "programName"
           FROM sections s
           JOIN programs p ON p.id = s.program_id
           WHERE s.organization_id = $1 AND s.class_teacher_user_id = $2 AND s.id != $3
           LIMIT 1`,
          [org, row.classTeacherUserId, id],
        );
        if (existing) {
          throw new ConflictException(
            `Teacher is already assigned as Class Teacher for ${existing.programName || ""} ${existing.sectionName || ""}`.trim(),
          );
        }
      }
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

  async listHolidays(org: string, query: { month?: string; academicYearId?: string }) {
    let sql = `SELECT h.id, to_char(h.date, 'YYYY-MM-DD') as date, h.title, h.holiday_type as "holidayType",
                      h.is_adhoc as "isAdhoc", h.notes, h.created_at as "createdAt",
                      u.name as "declaredByName"
               FROM school_holidays h
               LEFT JOIN users u ON u.id = h.declared_by
               WHERE h.organization_id = $1`;
    const params: any[] = [org];
    if (query.month) {
      params.push(query.month);
      sql += ` AND to_char(h.date, 'YYYY-MM') = $${params.length}`;
    }
    if (query.academicYearId) {
      params.push(query.academicYearId);
      sql += ` AND (h.academic_year_id = $${params.length} OR EXISTS (
        SELECT 1 FROM academic_years y WHERE y.id = $${params.length} AND h.date >= y.start_date AND h.date <= y.end_date
      ))`;
    }
    sql += ` ORDER BY h.date ASC`;

    let examSql = `SELECT DISTINCT ON (ep.exam_name, ep.exam_date)
                          ep.id, ep.exam_name AS title, to_char(ep.exam_date, 'YYYY-MM-DD') AS date,
                          COALESCE(ep.start_time || ' - ' || ep.end_time, 'All Day') AS time,
                          'Exam' AS type,
                          'Official Exam Assessment: ' || ep.exam_name AS description
                   FROM principal_exam_plans ep
                   WHERE ep.organization_id = $1 AND ep.status IN ('scheduled', 'draft', 'published', 'active')`;
    const examParams: any[] = [org];
    if (query.month) {
      examParams.push(query.month);
      examSql += ` AND to_char(ep.exam_date, 'YYYY-MM') = $${examParams.length}`;
    }
    if (query.academicYearId) {
      examParams.push(query.academicYearId);
      examSql += ` AND EXISTS (
        SELECT 1 FROM academic_years y
        LEFT JOIN sections sec ON sec.id = ep.section_id AND sec.organization_id = ep.organization_id
        WHERE y.id = $${examParams.length}
          AND (sec.academic_year_id = y.id OR (ep.exam_date >= y.start_date AND ep.exam_date <= y.end_date))
      )`;
    }
    examSql += ` ORDER BY ep.exam_name, ep.exam_date, ep.start_time ASC`;

    let ptmSql = `SELECT p.id, p.title, to_char(p.event_date, 'YYYY-MM-DD') AS date,
                         COALESCE(p.start_time || ' - ' || p.end_time, 'All Day') AS time,
                         'PTM' AS type,
                         'Scheduled Parent-Teacher Conference' AS description
                  FROM ptm_schedules p
                  WHERE p.organization_id = $1`;
    const ptmParams: any[] = [org];
    if (query.month) {
      ptmParams.push(query.month);
      ptmSql += ` AND to_char(p.event_date, 'YYYY-MM') = $${ptmParams.length}`;
    }
    if (query.academicYearId) {
      ptmParams.push(query.academicYearId);
      ptmSql += ` AND EXISTS (
        SELECT 1 FROM academic_years y
        WHERE y.id = $${ptmParams.length} AND p.event_date >= y.start_date AND p.event_date <= y.end_date
      )`;
    }
    ptmSql += ` ORDER BY p.event_date ASC`;

    const [rows, academicYears, exams, ptms] = await Promise.all([
      this.drizzle.query(sql, params),
      this.drizzle.query(
        `SELECT id, name, to_char(start_date, 'YYYY-MM-DD') as "startDate", to_char(end_date, 'YYYY-MM-DD') as "endDate", is_current as "isCurrent"
         FROM academic_years
         WHERE organization_id = $1
         ORDER BY start_date DESC`,
        [org]
      ),
      this.drizzle.query(examSql, examParams).catch((err) => {
        console.error('[AcademicsService.listHolidays] Exam query failed:', err.message);
        return [];
      }),
      this.drizzle.query(ptmSql, ptmParams).catch((err) => {
        console.error('[AcademicsService.listHolidays] PTM query failed:', err.message);
        return [];
      }),
    ]);
    const events = [...exams, ...ptms];
    return { holidays: rows, academicYears, events };
  }

  async declareHoliday(org: string, actor: User, dto: { date: string; title: string; holidayType?: string; isAdhoc?: boolean; notes?: string; broadcastNotice?: boolean; academicYearId?: string }) {
    if (!dto.date || !dto.title) throw new BadRequestException('Date and title are required');
    const [currentYear] = await this.drizzle.query(
      `SELECT id FROM academic_years WHERE organization_id = $1 AND is_current = true LIMIT 1`,
      [org]
    );

    const [holiday] = await this.drizzle.query(
      `INSERT INTO school_holidays (organization_id, academic_year_id, date, title, holiday_type, is_adhoc, declared_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (organization_id, date) DO UPDATE 
       SET title = EXCLUDED.title, holiday_type = EXCLUDED.holiday_type, is_adhoc = EXCLUDED.is_adhoc, notes = EXCLUDED.notes
       RETURNING id, to_char(date, 'YYYY-MM-DD') as date, title, holiday_type as "holidayType", is_adhoc as "isAdhoc", notes`,
      [org, dto.academicYearId || currentYear?.id || null, dto.date, dto.title.trim(), dto.holidayType || (dto.isAdhoc ? 'adhoc_emergency' : 'gazetted'), Boolean(dto.isAdhoc), actor.id, dto.notes || '']
    );

    if (dto.isAdhoc || dto.broadcastNotice) {
      await this.drizzle.query(
        `INSERT INTO school_broadcasts (organization_id, title, message, channels, target_audience, priority, sent_by, sender_name)
         VALUES ($1, $2, $3, '{"in_app"}', 'all', 'high', $4, $5)`,
        [
          org,
          `School Closed: ${dto.title}`,
          `Official Notice: School will remain closed on ${dto.date} due to ${dto.title}.${dto.notes ? ` Details: ${dto.notes}` : ''}`,
          actor.id,
          actor.name || 'School Administration',
        ]
      ).catch(() => null);
    }

    return holiday;
  }

  async deleteHoliday(org: string, id: string) {
    const [deleted] = await this.drizzle.query(
      `DELETE FROM school_holidays WHERE organization_id = $1 AND id = $2 RETURNING id`,
      [org, id]
    );
    if (!deleted) throw new NotFoundException('Holiday record not found');
    return { success: true, id };
  }
}
