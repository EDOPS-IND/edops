import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { hashPassword, tokenHash } from '../auth/password';
import { AcceptInvitationDto, CreateOrganizationDto, UpdateOrganizationDto } from './tenant.dto';
import { OrganizationStatus, SchoolRole } from './tenant.entity';
import { entitlements, seatUsage } from '../billing/entitlements';
import { DrizzleService } from '../../database/drizzle.service';

@Injectable()
export class TenantsService {
  constructor(
    private readonly audit: AuditService,
    private readonly drizzle: DrizzleService,
  ) {}

  async create(dto: CreateOrganizationDto, actor: User) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return this.drizzle.transaction(async (manager) => {
      const [organization] = await manager.query(
        `INSERT INTO organizations (name, slug, time_zone, locale)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [dto.name, dto.slug, dto.timeZone, dto.locale]
      );
      await manager.query(
        `INSERT INTO invitations (organization_id, email, token_hash, invited_by, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [organization.id, dto.adminEmail, tokenHash(token), actor.id, expiresAt]
      );
      await this.audit.record(manager, { organizationId: organization.id, actorId: actor.id, action: 'organization.created' });
      return { organization, invitation: { token, email: dto.adminEmail, expiresAt } };
    });
  }

  async authorizedOrganization(manager: any, id: string, actor: User, lock = false, roles: readonly SchoolRole[] = ['school_admin']) {
    const [membership] = await manager.query(
      "SELECT * FROM memberships WHERE organization_id = $1 AND user_id = $2 AND status = 'active' LIMIT 1",
      [id, actor.id]
    );
    if (!membership) throw new NotFoundException('Organization not found');
    if (!roles.includes(membership.role)) throw new ForbiddenException('School role does not permit this operation');
    const lockClause = lock ? ' FOR UPDATE' : '';
    const [organization] = await manager.query(`SELECT * FROM organizations WHERE id = $1${lockClause} LIMIT 1`, [id]);
    if (!organization) throw new NotFoundException('Organization not found');
    if (organization.status !== 'active') throw new ForbiddenException('Organization is suspended');
    return organization;
  }

  get(id: string, actor: User) {
    return this.authorizedOrganization(this.drizzle, id, actor);
  }

  async update(id: string, dto: UpdateOrganizationDto, actor: User) {
    if ([dto.name, dto.timeZone, dto.locale].every((value) => value === undefined)) {
      throw new BadRequestException('Provide at least one supported setting');
    }
    return this.drizzle.transaction(async (manager) => {
      const organization = await this.authorizedOrganization(manager, id, actor, true);
      const before = { name: organization.name, timeZone: organization.time_zone ?? organization.timeZone, locale: organization.locale };
      const name = dto.name !== undefined ? dto.name : organization.name;
      const timeZone = dto.timeZone !== undefined ? dto.timeZone : (organization.time_zone ?? organization.timeZone);
      const locale = dto.locale !== undefined ? dto.locale : organization.locale;
      const [updated] = await manager.query(
        `UPDATE organizations SET name = $1, time_zone = $2, locale = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
        [name, timeZone, locale, id]
      );
      const after = { name: updated.name, timeZone: updated.time_zone ?? updated.timeZone, locale: updated.locale };
      await this.audit.record(manager, { organizationId: id, actorId: actor.id, action: 'organization.updated', details: { before, after } });
      return updated;
    });
  }

  async setStatus(id: string, status: OrganizationStatus, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      const [organization] = await manager.query('SELECT * FROM organizations WHERE id = $1 FOR UPDATE LIMIT 1', [id]);
      if (!organization) throw new NotFoundException('Organization not found');
      const before = organization.status;
      const [updated] = await manager.query(
        'UPDATE organizations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
      );
      await this.audit.record(manager, { organizationId: id, actorId: actor.id, action: 'organization.status_changed', details: { before, after: status } });
      return updated;
    });
  }

  async getInvitationInfo(token: string) {
    if (!token || token.length !== 64) throw new BadRequestException('Valid 64-character invitation token required');
    const [row] = await this.drizzle.query(
      `SELECT i.email, i.name, i.phone, i.specialty, i.role, o.name AS "schoolName", o.slug AS "schoolSlug"
       FROM invitations i
       JOIN organizations o ON o.id = i.organization_id
       WHERE i.token_hash = $1 AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > NOW()
       LIMIT 1`,
      [tokenHash(token)]
    );
    if (!row) throw new NotFoundException('Invitation is invalid, expired, or already accepted');
    return row;
  }

  async acceptInvitation(dto: AcceptInvitationDto, signedInUser: User | null) {
    return this.drizzle.transaction(async (manager) => {
      const [candidate] = await manager.query(
        `SELECT * FROM invitations
         WHERE token_hash = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > NOW()
         LIMIT 1`,
        [tokenHash(dto.token)]
      );
      if (!candidate) throw new BadRequestException('Invitation is invalid, expired, revoked or already accepted');

      // Lock school before invitation, matching school-admin provisioning/revocation lock order.
      const [organization] = await manager.query(
        'SELECT * FROM organizations WHERE id = $1 FOR UPDATE LIMIT 1',
        [candidate.organization_id ?? candidate.organizationId]
      );
      if (!organization || organization.status !== 'active') throw new ForbiddenException('Organization is unavailable');

      const [invitation] = await manager.query(
        `SELECT * FROM invitations
         WHERE token_hash = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > NOW()
         FOR UPDATE LIMIT 1`,
        [tokenHash(dto.token)]
      );
      if (!invitation) throw new BadRequestException('Invitation is invalid, expired, revoked or already accepted');

      await manager.query("SELECT set_config('app.current_org_id', $1, true)", [organization.id]);
      if (['student', 'teacher'].includes(invitation.role)) {
        const e = await entitlements(manager, organization.id), seats = await seatUsage(manager, organization.id);
        if (!e.entitled) throw new ForbiddenException('An active subscription or trial is required');
        const used = invitation.role === 'student' ? seats.students + seats.pendingStudents : seats.teachers + seats.pendingTeachers;
        if (used > (invitation.role === 'student' ? e.maxStudents : e.maxTeachers)) throw new ForbiddenException('Plan seat limit reached');
      }

      const [user] = await manager.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [invitation.email]);
      const fullName = dto.name || invitation.name || user?.name || '';
      const phoneNum = dto.phone || invitation.phone || user?.phone || null;

      let userId: string;
      if (user) {
        if (!user.is_active && !user.isActive || signedInUser?.id !== user.id) {
          throw new ForbiddenException('Sign in with the invited account before accepting');
        }
        if (dto.password !== undefined) throw new BadRequestException('An invitation cannot change an existing password');
        if (fullName || phoneNum) {
          await manager.query(
            'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3',
            [fullName || null, phoneNum, user.id]
          );
        }
        userId = user.id;
      } else {
        if (signedInUser) throw new ForbiddenException('Sign out before creating the invited account');
        if (!dto.password) throw new BadRequestException('A password is required for a new account');
        const passwordHash = await hashPassword(dto.password);
        const [newUser] = await manager.query(
          `INSERT INTO users (email, name, phone, password_hash)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [invitation.email, fullName, phoneNum, passwordHash]
        );
        userId = newUser.id;
      }

      await manager.query(
        `INSERT INTO memberships (organization_id, user_id, role, specialty, employee_id, employment_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (organization_id, user_id) DO UPDATE
         SET specialty = COALESCE(EXCLUDED.specialty, memberships.specialty),
             employee_id = COALESCE(EXCLUDED.employee_id, memberships.employee_id),
             employment_type = COALESCE(EXCLUDED.employment_type, memberships.employment_type)`,
        [organization.id, userId, invitation.role, dto.specialty || invitation.specialty || null, invitation.employee_id || null, invitation.employment_type || null]
      );

      // Auto-enroll student into assigned section
      if (invitation.role === 'student' && invitation.section_id) {
        const [academicYear] = await manager.query(
          'SELECT id FROM academic_years WHERE organization_id = $1 AND is_current = true LIMIT 1',
          [organization.id]
        );
        const yearId = academicYear?.id || (await manager.query('SELECT id FROM academic_years WHERE organization_id = $1 ORDER BY start_date DESC LIMIT 1', [organization.id]))[0]?.id;
        if (yearId) {
          const [cnt] = await manager.query('SELECT COUNT(*)::int as count FROM enrollments WHERE organization_id = $1', [organization.id]);
          const roll = `ROLL-${String((cnt?.count || 0) + 1).padStart(3, '0')}`;
          await manager.query(
            `INSERT INTO enrollments (organization_id, student_user_id, section_id, academic_year_id, roll_number, status)
             VALUES ($1, $2, $3, $4, $5, 'active')
             ON CONFLICT DO NOTHING`,
            [organization.id, userId, invitation.section_id, yearId, roll]
          );
        }
      }

      // Auto-map parent to selected children
      if (invitation.role === 'parent' && invitation.child_student_ids) {
        let childIds: string[] = [];
        try {
          childIds = Array.isArray(invitation.child_student_ids)
            ? invitation.child_student_ids
            : typeof invitation.child_student_ids === 'string'
              ? JSON.parse(invitation.child_student_ids)
              : [];
        } catch {
          childIds = [];
        }
        for (const childId of childIds) {
          if (childId) {
            await manager.query(
              `INSERT INTO parent_student_relationships (school_id, parent_id, student_id, verification_status, status)
               VALUES ($1, $2, $3, 'verified', 'active')
               ON CONFLICT (school_id, parent_id, student_id) DO NOTHING`,
              [organization.id, userId, childId]
            );
          }
        }
      }

      await manager.query('UPDATE invitations SET accepted_at = NOW(), raw_token = NULL WHERE id = $1', [invitation.id]);
      await this.audit.record(manager, {
        organizationId: organization.id, actorId: userId, action: 'invitation.accepted', details: { invitationId: invitation.id },
      });
      return { userId, organizationId: organization.id };
    });
  }
}
