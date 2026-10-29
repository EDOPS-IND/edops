import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { hashPassword, tokenHash } from '../auth/password';
import { AcceptInvitationDto, CreateOrganizationDto, UpdateOrganizationDto } from './tenant.dto';
import { OrganizationStatus, SchoolRole } from './tenant.entity';
import { entitlements, seatUsage } from '../billing/entitlements';
import { DrizzleService } from '../../database/drizzle.service';
import { MailService } from '../notifications/mail.service';

@Injectable()
export class TenantsService {
  constructor(
    private readonly audit: AuditService,
    private readonly drizzle: DrizzleService,
    private readonly mail: MailService,
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
      this.mail.sendInvitationEmail(dto.adminEmail, token, 'school_admin', organization.name).catch((err) => {
        console.error(`[ADMIN INVITATION EMAIL FAILED] Could not dispatch to ${dto.adminEmail}:`, err?.message || err);
      });
      await this.audit.record(manager, { organizationId: organization.id, actorId: actor.id, action: 'organization.created' });
      return { organization, invitation: { token, email: dto.adminEmail, expiresAt } };
    });
  }

  async authorizedOrganization(manager: any, id: string, actor: User, lock = false, roles: readonly SchoolRole[] = ['school_admin']) {
    if (actor.isPlatformAdmin) {
      const lockClause = lock ? ' FOR UPDATE' : '';
      const [organization] = await manager.query(`SELECT * FROM organizations WHERE id = $1${lockClause} LIMIT 1`, [id]);
      if (!organization) throw new NotFoundException('Organization not found');
      return organization;
    }
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

  async update(id: string, dto: any, actor: User) {
    return this.drizzle.transaction(async (manager) => {
      const organization = await this.authorizedOrganization(manager, id, actor, true);
      const before = { ...organization };
      
      const mapping: Record<string, string> = {
        name: 'name',
        slug: 'slug',
        code: 'code',
        schoolType: 'school_type',
        board: 'board',
        registrationNumber: 'registration_number',
        affiliationNumber: 'affiliation_number',
        establishedYear: 'established_year',
        addressLine1: 'address_line1',
        addressLine2: 'address_line2',
        city: 'city',
        state: 'state',
        country: 'country',
        pincode: 'pincode',
        officialEmail: 'official_email',
        officialPhone: 'official_phone',
        website: 'website',
        timeZone: 'time_zone',
        locale: 'locale',
      };

      const updates: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      for (const [key, col] of Object.entries(mapping)) {
        if (dto[key] !== undefined) {
          updates.push(`${col} = $${pIdx++}`);
          params.push(dto[key]);
        }
      }

      if (updates.length === 0) {
        throw new BadRequestException('Provide at least one supported setting');
      }

      updates.push('updated_at = NOW()');
      params.push(id);

      const [updated] = await manager.query(
        `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${pIdx} RETURNING *`,
        params
      );

      const after = { ...updated };
      await this.audit.record(manager, { organizationId: id, actorId: actor.id, action: 'organization.updated', details: { before, after } });
      return {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        status: updated.status,
        code: updated.code,
        board: updated.board,
        schoolType: updated.school_type,
        school_type: updated.school_type,
        registrationNumber: updated.registration_number,
        registration_number: updated.registration_number,
        affiliationNumber: updated.affiliation_number,
        affiliation_number: updated.affiliation_number,
        establishedYear: updated.established_year,
        established_year: updated.established_year,
        addressLine1: updated.address_line1,
        address_line1: updated.address_line1,
        addressLine2: updated.address_line2,
        address_line2: updated.address_line2,
        city: updated.city,
        state: updated.state,
        country: updated.country,
        pincode: updated.pincode,
        officialEmail: updated.official_email,
        official_email: updated.official_email,
        officialPhone: updated.official_phone,
        official_phone: updated.official_phone,
        website: updated.website,
        timeZone: updated.time_zone,
        time_zone: updated.time_zone,
        locale: updated.locale,
        updatedAt: updated.updated_at,
        updated_at: updated.updated_at,
      };
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
        `INSERT INTO memberships (organization_id, user_id, role, specialty, employee_id, employment_type, gender, dob)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (organization_id, user_id) DO UPDATE
         SET specialty = COALESCE(EXCLUDED.specialty, memberships.specialty),
             employee_id = COALESCE(EXCLUDED.employee_id, memberships.employee_id),
             employment_type = COALESCE(EXCLUDED.employment_type, memberships.employment_type),
             gender = COALESCE(EXCLUDED.gender, memberships.gender),
             dob = COALESCE(EXCLUDED.dob, memberships.dob)`,
        [
          organization.id,
          userId,
          invitation.role,
          dto.specialty || invitation.specialty || null,
          invitation.employee_id || null,
          invitation.employment_type || null,
          invitation.gender || null,
          invitation.dob || null,
        ]
      );

      if (invitation.gender || invitation.dob) {
        await manager.query(
          `UPDATE users SET gender = COALESCE(gender, $1), dob = COALESCE(dob, $2) WHERE id = $3`,
          [invitation.gender || null, invitation.dob || null, userId]
        );
      }

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
