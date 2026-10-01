import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ClassSubjectAssignment, Enrollment, Section, Subject } from '../academics/academic.entity';
import { User } from '../auth/user.entity';
import { Membership, SchoolRole } from '../tenants/tenant.entity';
import { SchoolWork } from '../tenants/school-work.service';
import { Feature, requireFeature } from '../billing/entitlements';
import { Assignment, AttendanceSession, Submission } from './teaching.entity';

@Injectable()
export class TeachingAccess {
  constructor(private readonly work: SchoolWork) {}

  run<T>(org: string, actor: User, action: string | null, payload: unknown, key: string | undefined | null,
    authorize: (manager: EntityManager, role: SchoolRole) => Promise<void>,
    work: (manager: EntityManager, role: SchoolRole) => Promise<T>, feature?: Feature, lockOrg?: boolean) {
    let role: SchoolRole;
    return this.work.run(org, actor, action, payload, key, (manager) => work(manager, role), {
      roles: ['school_admin', 'teacher', 'student'],
      lockOrg,
      authorize: async (manager) => {
        const member = await manager.getRepository(Membership).findOneBy({ organizationId: org, userId: actor.id });
        role = member!.role;
        await authorize(manager, role);
        if (feature) await requireFeature(manager, org, feature);
      },
    });
  }

  forFeature(feature: Feature) {
    return <T>(org: string, actor: User, action: string | null, payload: unknown, key: string | undefined | null,
      authorize: (m: EntityManager, role: SchoolRole) => Promise<void>, work: (m: EntityManager, role: SchoolRole) => Promise<T>, lockOrg?: boolean) =>
      this.run(org,actor,action,payload,key,authorize,work,feature,lockOrg);
  }

  async classScope(manager: EntityManager, org: string, actor: User, role: SchoolRole, sectionId: string, subjectId: string | null, staff = false) {
    const section = await manager.getRepository(Section).findOneBy({ organizationId: org, id: sectionId });
    if (!section || (subjectId && !await manager.getRepository(Subject).existsBy({ organizationId: org, id: subjectId }))) throw new NotFoundException('Class not found');
    if (role === 'school_admin') return;
    if (role === 'teacher') {
      if (!subjectId || !await manager.getRepository(ClassSubjectAssignment).existsBy({ organizationId: org, sectionId, subjectId, teacherUserId: actor.id })) {
        throw new NotFoundException('Assigned class not found');
      }
      return;
    }
    if (staff) throw new ForbiddenException('Teaching staff access required');
    if (!await manager.getRepository(Enrollment).existsBy({ organizationId: org, sectionId, studentUserId: actor.id, status: 'active' })) {
      throw new NotFoundException('Enrolled class not found');
    }
  }

  async assignment(manager: EntityManager, org: string, actor: User, role: SchoolRole, id: string, staff = false) {
    const row = await manager.getRepository(Assignment).findOneBy({ organizationId: org, id });
    if (!row) throw new NotFoundException('Assignment not found');
    await this.classScope(manager, org, actor, role, row.sectionId, row.subjectId, staff);
    if (role === 'student' && (row.status !== 'published' || !await manager.getRepository(Submission).existsBy({ organizationId: org, assignmentId: id, studentId: actor.id }))) {
      throw new NotFoundException('Assignment not found');
    }
    return row;
  }

  async attendance(manager: EntityManager, org: string, actor: User, role: SchoolRole, id: string, staff = false) {
    const row = await manager.getRepository(AttendanceSession).findOneBy({ organizationId: org, id });
    if (!row) throw new NotFoundException('Attendance session not found');
    await this.classScope(manager, org, actor, role, row.sectionId, row.subjectId, staff);
    if (role === 'student') {
      if (row.status !== 'finalized') throw new NotFoundException('Attendance session not found');
      const [record] = await manager.query('SELECT 1 FROM attendance_records WHERE organization_id=$1 AND attendance_session_id=$2 AND student_id=$3 LIMIT 1', [org, id, actor.id]);
      if (!record) throw new NotFoundException('Attendance session not found');
    }
    return row;
  }
}
