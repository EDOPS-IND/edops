import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DeepPartial, EntityManager, EntityTarget, FindOptionsOrder, FindOptionsWhere } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { Membership, SchoolRole } from '../tenants/tenant.entity';
import { SchoolWork } from '../tenants/school-work.service';
import { AcademicRecord, AcademicYear, ClassSubjectAssignment, Enrollment, Program, Section, Subject } from './academic.entity';
import { AcademicListDto, AcademicYearDto, EnrollmentDto, ProgramDto, SectionDto, SectionListDto, SectionResourceListDto, SubjectDto, TeacherAssignmentDto, TransferEnrollmentDto, UpdateAcademicYearDto, UpdateEnrollmentDto, UpdateProgramDto, UpdateSectionDto, UpdateSubjectDto, UpdateTeacherAssignmentDto } from './academic.dto';

@Injectable()
export class AcademicsService {
  constructor(private readonly work: SchoolWork, private readonly audit: AuditService) {}

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
    }, {
      roles: ['teacher', 'student'],
      authorize: async (manager) => {
        const member = await manager.getRepository(Membership).findOneBy({ organizationId: org, userId: actor.id, status: 'active' });
        role = member!.role;
      },
    });
  }

  private async record<T extends AcademicRecord>(manager: EntityManager, type: EntityTarget<T>, org: string, id: string): Promise<T> {
    const row = await manager.getRepository(type).findOneBy({ organizationId: org, id } as FindOptionsWhere<T>);
    if (!row) throw new NotFoundException('Record not found');
    return row;
  }

  private async save<T extends AcademicRecord>(manager: EntityManager, type: EntityTarget<T>, row: DeepPartial<T>, actor: User, action: string, before: T | null = null) {
    const result = await manager.getRepository(type).save(row);
    await this.audit.record(manager, { organizationId: result.organizationId, actorId: actor.id, action, details: { before, after: result } });
    return result;
  }

  private fields<T extends object>(dto: T): Partial<T> {
    const entries = Object.entries(dto).filter(([, value]) => value !== undefined);
    if (!entries.length) throw new BadRequestException('Provide at least one supported field');
    return Object.fromEntries(entries) as Partial<T>;
  }

  list<T extends AcademicRecord>(org: string, actor: User, type: EntityTarget<T>, query: AcademicListDto, filter: FindOptionsWhere<T> = {}) {
    return this.work.run(org, actor, null, null, null, async (manager) => {
      const [items, total] = await manager.getRepository(type).findAndCount({
        where: { ...filter, organizationId: org } as FindOptionsWhere<T>,
        order: { createdAt: 'ASC', id: 'ASC' } as FindOptionsOrder<T>, take: query.limit, skip: query.offset,
      });
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
      return this.save(manager, AcademicYear, { ...dto, organizationId: org }, actor, 'academic_year.created');
    });
  }

  private async clearCurrentYear(manager: EntityManager, org: string, actor: User, except?: string) {
    const current = await manager.getRepository(AcademicYear).findOneBy({ organizationId: org, isCurrent: true });
    if (current && current.id !== except) await this.save(manager, AcademicYear, { ...current, isCurrent: false }, actor, 'academic_year.updated', current);
  }

  updateYear(org: string, actor: User, id: string, dto: UpdateAcademicYearDto) {
    return this.work.run(org, actor, 'academic_year.updated', dto, null, async (manager) => {
      const before = await this.record(manager, AcademicYear, org, id);
      const row = { ...before, ...this.fields(dto) };
      if (row.endDate < row.startDate) throw new BadRequestException('endDate must be on or after startDate');
      if (row.isCurrent) await this.clearCurrentYear(manager, org, actor, id);
      return this.save(manager, AcademicYear, row, actor, 'academic_year.updated', before);
    });
  }

  createProgram(org: string, actor: User, dto: ProgramDto, key?: string) {
    return this.work.run(org, actor, 'program.created', dto, key, (manager) => this.save(manager, Program, { ...dto, organizationId: org }, actor, 'program.created'));
  }

  updateProgram(org: string, actor: User, id: string, dto: UpdateProgramDto) {
    return this.work.run(org, actor, 'program.updated', dto, null, async (manager) => {
      const before = await this.record(manager, Program, org, id);
      return this.save(manager, Program, { ...before, ...this.fields(dto) }, actor, 'program.updated', before);
    });
  }

  createSubject(org: string, actor: User, dto: SubjectDto, key?: string) {
    return this.work.run(org, actor, 'subject.created', dto, key, (manager) => this.save(manager, Subject, { ...dto, organizationId: org }, actor, 'subject.created'));
  }

  updateSubject(org: string, actor: User, id: string, dto: UpdateSubjectDto) {
    return this.work.run(org, actor, 'subject.updated', dto, null, async (manager) => {
      const before = await this.record(manager, Subject, org, id);
      return this.save(manager, Subject, { ...before, ...this.fields(dto) }, actor, 'subject.updated', before);
    });
  }

  createSection(org: string, actor: User, dto: SectionDto, key?: string) {
    return this.work.run(org, actor, 'section.created', dto, key, async (manager) => {
      await this.record(manager, AcademicYear, org, dto.academicYearId);
      await this.record(manager, Program, org, dto.programId);
      return this.save(manager, Section, { ...dto, organizationId: org }, actor, 'section.created');
    });
  }

  updateSection(org: string, actor: User, id: string, dto: UpdateSectionDto) {
    return this.work.run(org, actor, 'section.updated', dto, null, async (manager) => {
      const before = await this.record(manager, Section, org, id);
      const row = { ...before, ...this.fields(dto) };
      const used = await manager.getRepository(Enrollment).countBy({ organizationId: org, sectionId: id, status: 'active' });
      if (row.capacity < used) throw new ConflictException('Capacity cannot be below active enrollment count');
      return this.save(manager, Section, row, actor, 'section.updated', before);
    });
  }

  private async member(manager: EntityManager, org: string, userId: string, role: 'teacher' | 'student') {
    const membership = await manager.getRepository(Membership).findOneBy({ organizationId: org, userId });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role !== role || membership.status !== 'active' || !await manager.getRepository(User).existsBy({ id: userId, isActive: true })) {
      throw new ConflictException(`An active ${role} membership and account are required`);
    }
  }

  assignTeacher(org: string, actor: User, dto: TeacherAssignmentDto, key?: string) {
    return this.work.run(org, actor, 'teacher_assignment.created', dto, key, async (manager) => {
      await this.record(manager, Section, org, dto.sectionId);
      await this.record(manager, Subject, org, dto.subjectId);
      await this.member(manager, org, dto.teacherUserId, 'teacher');
      return this.save(manager, ClassSubjectAssignment, { ...dto, organizationId: org }, actor, 'teacher_assignment.created');
    });
  }

  updateTeacher(org: string, actor: User, id: string, dto: UpdateTeacherAssignmentDto) {
    return this.work.run(org, actor, 'teacher_assignment.updated', dto, null, async (manager) => {
      const before = await this.record(manager, ClassSubjectAssignment, org, id);
      await this.member(manager, org, dto.teacherUserId, 'teacher');
      return this.save(manager, ClassSubjectAssignment, { ...before, teacherUserId: dto.teacherUserId }, actor, 'teacher_assignment.updated', before);
    });
  }

  private async availableSection(manager: EntityManager, org: string, sectionId: string) {
    const section = await this.record(manager, Section, org, sectionId);
    const count = await manager.getRepository(Enrollment).countBy({ organizationId: org, sectionId, status: 'active' });
    if (count >= section.capacity) throw new ConflictException('Section capacity reached');
    return section;
  }

  enroll(org: string, actor: User, dto: EnrollmentDto, key?: string) {
    return this.work.run(org, actor, 'enrollment.created', dto, key, async (manager) => {
      const section = await this.availableSection(manager, org, dto.sectionId);
      await this.member(manager, org, dto.studentUserId, 'student');
      return this.save(manager, Enrollment, { ...dto, organizationId: org, academicYearId: section.academicYearId }, actor, 'enrollment.created');
    });
  }

  updateEnrollment(org: string, actor: User, id: string, dto: UpdateEnrollmentDto) {
    return this.work.run(org, actor, 'enrollment.updated', dto, null, async (manager) => {
      const before = await this.record(manager, Enrollment, org, id);
      if (before.status !== 'active') throw new ConflictException('Only active enrollments can be updated');
      return this.save(manager, Enrollment, { ...before, rollNumber: dto.rollNumber }, actor, 'enrollment.updated', before);
    });
  }

  withdraw(org: string, actor: User, id: string) {
    return this.work.run(org, actor, 'enrollment.withdrawn', { id }, null, async (manager) => {
      const before = await this.record(manager, Enrollment, org, id);
      if (before.status !== 'active') throw new ConflictException('Enrollment is not active');
      return this.save(manager, Enrollment, { ...before, status: 'withdrawn' }, actor, 'enrollment.withdrawn', before);
    });
  }

  transfer(org: string, actor: User, id: string, dto: TransferEnrollmentDto, key?: string) {
    return this.work.run(org, actor, 'enrollment.transferred', { id, ...dto }, key, async (manager) => {
      const before = await this.record(manager, Enrollment, org, id);
      if (before.status !== 'active' || before.sectionId === dto.sectionId) throw new ConflictException('Transfer requires an active enrollment and a different section');
      const section = await this.availableSection(manager, org, dto.sectionId);
      if (section.academicYearId !== before.academicYearId) throw new ConflictException('Transfer must stay within the academic year; use new enrollment for year rollover');
      await this.member(manager, org, before.studentUserId, 'student');
      await this.save(manager, Enrollment, { ...before, status: 'transferred' }, actor, 'enrollment.transferred', before);
      return this.save(manager, Enrollment, { organizationId: org, studentUserId: before.studentUserId,
        sectionId: section.id, academicYearId: section.academicYearId, rollNumber: dto.rollNumber }, actor, 'enrollment.created');
    });
  }
}
