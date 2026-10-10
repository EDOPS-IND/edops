import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../auth/user.entity';
import { SchoolRole } from '../tenants/tenant.entity';
import { SchoolWork } from '../tenants/school-work.service';
import { Feature, Queryable, requireFeature } from '../billing/entitlements';

@Injectable()
export class TeachingAccess {
  constructor(private readonly work: SchoolWork) {}

  run<T>(org: string, actor: User, action: string | null, payload: unknown, key: string | undefined | null,
    authorize: (manager: Queryable, role: SchoolRole) => Promise<void>,
    work: (manager: Queryable, role: SchoolRole) => Promise<T>, feature?: Feature, lockOrg?: boolean) {
    let role: SchoolRole;
    return this.work.run(org, actor, action, payload, key, (manager) => work(manager, role), {
      roles: ['school_admin', 'teacher', 'student'],
      lockOrg,
      authorize: async (manager) => {
        const [member] = await manager.query('SELECT role FROM memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1', [org, actor.id]);
        if (!member) throw new NotFoundException('Membership not found');
        role = member.role;
        await authorize(manager, role);
        if (feature) await requireFeature(manager, org, feature);
      },
    });
  }

  forFeature(feature: Feature) {
    return <T>(org: string, actor: User, action: string | null, payload: unknown, key: string | undefined | null,
      authorize: (m: Queryable, role: SchoolRole) => Promise<void>, work: (m: Queryable, role: SchoolRole) => Promise<T>, lockOrg?: boolean) =>
      this.run(org,actor,action,payload,key,authorize,work,feature,lockOrg);
  }

  async classScope(manager: Queryable, org: string, actor: User, role: SchoolRole, sectionId: string, subjectId: string | null, staff = false) {
    const [section] = await manager.query('SELECT id FROM sections WHERE organization_id = $1 AND id = $2 LIMIT 1', [org, sectionId]);
    if (!section) throw new NotFoundException('Class not found');
    if (subjectId) {
      const [subj] = await manager.query('SELECT id FROM subjects WHERE organization_id = $1 AND id = $2 LIMIT 1', [org, subjectId]);
      if (!subj) throw new NotFoundException('Class not found');
    }
    if (role === 'school_admin') return;
    if (role === 'teacher') {
      if (!subjectId) throw new NotFoundException('Assigned class not found');
      const [assigned] = await manager.query(
        'SELECT 1 FROM class_subject_assignments WHERE organization_id = $1 AND section_id = $2 AND subject_id = $3 AND teacher_user_id = $4 LIMIT 1',
        [org, sectionId, subjectId, actor.id]
      );
      if (!assigned) throw new NotFoundException('Assigned class not found');
      return;
    }
    if (staff) throw new ForbiddenException('Teaching staff access required');
    const [enrolled] = await manager.query(
      "SELECT 1 FROM enrollments WHERE organization_id = $1 AND section_id = $2 AND student_user_id = $3 AND status = 'active' LIMIT 1",
      [org, sectionId, actor.id]
    );
    if (!enrolled) throw new NotFoundException('Enrolled class not found');
  }

  async assignment(manager: Queryable, org: string, actor: User, role: SchoolRole, id: string, staff = false) {
    const [row] = await manager.query('SELECT * FROM assignments WHERE organization_id = $1 AND id = $2 LIMIT 1', [org, id]);
    if (!row) throw new NotFoundException('Assignment not found');
    await this.classScope(manager, org, actor, role, row.section_id || row.sectionId, row.subject_id || row.subjectId, staff);
    if (role === 'student') {
      if (row.status !== 'published') throw new NotFoundException('Assignment not found');
      const [sub] = await manager.query('SELECT 1 FROM submissions WHERE organization_id = $1 AND assignment_id = $2 AND student_id = $3 LIMIT 1', [org, id, actor.id]);
      if (!sub) throw new NotFoundException('Assignment not found');
    }
    return row;
  }

  async attendance(manager: Queryable, org: string, actor: User, role: SchoolRole, id: string, staff = false) {
    const [row] = await manager.query('SELECT * FROM attendance_sessions WHERE organization_id = $1 AND id = $2 LIMIT 1', [org, id]);
    if (!row) throw new NotFoundException('Attendance session not found');
    await this.classScope(manager, org, actor, role, row.section_id || row.sectionId, row.subject_id || row.subjectId, staff);
    if (role === 'student') {
      if (row.status !== 'finalized') throw new NotFoundException('Attendance session not found');
      const [record] = await manager.query('SELECT 1 FROM attendance_records WHERE organization_id = $1 AND attendance_session_id = $2 AND student_id = $3 LIMIT 1', [org, id, actor.id]);
      if (!record) throw new NotFoundException('Attendance session not found');
    }
    return row;
  }
}
