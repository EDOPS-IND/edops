import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { AcademicListDto } from '../academics/academic.dto';
import { User } from '../auth/user.entity';
import { AuditService } from '../audit/audit.service';
import { TeachingAccess } from '../assignments/teaching-access.service';
import { AttendanceDto, AttendanceMarksDto, ClassQuery } from '../assignments/teaching.dto';
import { AttendanceSession } from '../assignments/teaching.entity';
import { ScorecardsService } from '../reports/scorecards.service';
import { OutboxService } from '../notifications/outbox.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly access: TeachingAccess, private readonly audit: AuditService, private readonly scorecards: ScorecardsService, private readonly outbox: OutboxService) {}

  list(org: string, actor: User, query: ClassQuery) {
    return this.access.run(org, actor, null, null, null,
      (manager, role) => this.access.classScope(manager, org, actor, role, query.sectionId, query.subjectId ?? null),
      async (manager, role) => {
        const builder = manager.getRepository(AttendanceSession).createQueryBuilder('a').where({ organizationId: org, sectionId: query.sectionId, subjectId: query.subjectId ?? IsNull() });
        if (role === 'student') builder.andWhere(`a.status='finalized' AND EXISTS (SELECT 1 FROM attendance_records r WHERE r.organization_id=a.organization_id AND r.attendance_session_id=a.id AND r.student_id=:student)`, { student: actor.id });
        const [items, total] = await builder.orderBy('a.date', 'DESC').addOrderBy('a.period').addOrderBy('a.id').take(query.limit).skip(query.offset).getManyAndCount();
        return { items, total, limit: query.limit, offset: query.offset };
      });
  }

  create(org: string, actor: User, dto: AttendanceDto, key?: string) {
    return this.access.run(org, actor, 'attendance.created', dto, key,
      (manager, role) => this.access.classScope(manager, org, actor, role, dto.sectionId, dto.subjectId ?? null, true),
      async (manager) => {
        const [calendar] = await manager.query(`SELECT y.start_date::text AS start, y.end_date::text AS end,
          to_char(clock_timestamp() AT TIME ZONE o.time_zone, 'YYYY-MM-DD') AS today
          FROM sections s JOIN academic_years y ON y.organization_id=s.organization_id AND y.id=s.academic_year_id
          JOIN organizations o ON o.id=s.organization_id WHERE s.organization_id=$1 AND s.id=$2`, [org, dto.sectionId]);
        if (dto.date > calendar.today || dto.date < calendar.start || dto.date > calendar.end) throw new BadRequestException('Attendance date must be within the academic year and not in the future in the school timezone');
        const row = await manager.getRepository(AttendanceSession).save({ ...dto, subjectId: dto.subjectId ?? null, organizationId: org, takenBy: actor.id });
        const students = await manager.query(`INSERT INTO attendance_records (organization_id, attendance_session_id, student_id)
          SELECT e.organization_id, $3, e.student_user_id FROM enrollments e
          JOIN memberships m ON m.organization_id=e.organization_id AND m.user_id=e.student_user_id JOIN users u ON u.id=m.user_id
          WHERE e.organization_id=$1 AND e.section_id=$2 AND e.status='active' AND m.role='student' AND m.status='active' AND u.is_active
          RETURNING id`, [org, dto.sectionId, row.id]);
        if (!students.length) throw new ConflictException('Attendance requires at least one active enrolled student');
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'attendance.created', details: { sessionId: row.id, studentCount: students.length } });
        return row;
      });
  }

  records(org: string, actor: User, id: string, query: AcademicListDto) {
    return this.access.run(org, actor, null, null, null,
      async (manager, role) => { await this.access.attendance(manager, org, actor, role, id); },
      async (manager, role) => {
        const params = [org, id, role === 'student' ? actor.id : null];
        const where = 'organization_id=$1 AND attendance_session_id=$2 AND ($3::uuid IS NULL OR student_id=$3)';
        const [count] = await manager.query(`SELECT count(*)::int AS total FROM attendance_records WHERE ${where}`, params);
        const items = await manager.query(`SELECT id, organization_id AS "organizationId", attendance_session_id AS "attendanceSessionId",
          student_id AS "studentId", status FROM attendance_records WHERE ${where} ORDER BY student_id LIMIT $4 OFFSET $5`, [...params, query.limit, query.offset]);
        return { items, total: count.total, limit: query.limit, offset: query.offset };
      });
  }

  mark(org: string, actor: User, id: string, dto: AttendanceMarksDto) {
    let session: AttendanceSession;
    return this.access.run(org, actor, 'attendance.marked', { id, ...dto }, null,
      async (manager, role) => { session = await this.access.attendance(manager, org, actor, role, id, true); },
      async (manager) => {
        const ids = dto.records.map((record) => record.studentId);
        const before = await manager.query('SELECT student_id AS "studentId", status FROM attendance_records WHERE organization_id=$1 AND attendance_session_id=$2 AND student_id=ANY($3::uuid[]) ORDER BY student_id', [org, id, ids]);
        if (before.length !== ids.length) throw new NotFoundException('A student is not in this attendance snapshot; no marks saved');
        await manager.query(`UPDATE attendance_records r SET status=mark.status FROM jsonb_to_recordset($3::jsonb) AS mark("studentId" uuid, status text)
          WHERE r.organization_id=$1 AND r.attendance_session_id=$2 AND r.student_id=mark."studentId"`, [org, id, JSON.stringify(dto.records)]);
        if (session.status === 'finalized') {
          await this.scorecards.refresh(manager, org, session.sectionId, session.subjectId, dto.records.length === 1 ? dto.records[0].studentId : undefined);
        }
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'attendance.marked', details: { sessionId: id, before, after: dto.records } });
        return session;
      });
  }

  finalize(org: string, actor: User, id: string, key?: string) {
    let session: AttendanceSession;
    return this.access.run(org, actor, 'attendance.finalized', { id }, key,
      async (manager, role) => { session = await this.access.attendance(manager, org, actor, role, id, true); },
      async (manager) => {
        if (session.status !== 'draft') throw new ConflictException('Attendance is already finalized');
        const [pending] = await manager.query('SELECT count(*)::int AS count FROM attendance_records WHERE organization_id=$1 AND attendance_session_id=$2 AND status IS NULL', [org, id]);
        if (pending.count) throw new ConflictException('Mark every student before finalizing attendance');
        const updated = await manager.getRepository(AttendanceSession).save({ ...session, status: 'finalized' as const, finalizedAt: new Date() });
        await this.scorecards.refresh(manager, org, session.sectionId, session.subjectId);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'attendance.finalized', details: { sessionId: id } });
        await this.outbox.append(manager, org, actor.id, 'attendance.finalized', id, session.sectionId, session.subjectId);
        return updated;
      });
  }
}
