import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { parse } from 'csv-parse/sync';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { tokenHash } from '../auth/password';
import { AcademicListDto } from '../academics/academic.dto';
import { BulkInvitationsDto, MemberInvitationDto, MemberListDto, MembershipStatusDto } from './provisioning.dto';
import { SchoolWork } from './school-work.service';
import { requireSeats } from '../billing/entitlements';
import { MailService } from '../notifications/mail.service';

@Injectable()
export class ProvisioningService {
  constructor(
    private readonly work: SchoolWork,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  async csv(org: string, actor: User, csv: string, key?: string) {
    let records: unknown;
    try {
      records = parse(csv, {
        bom: true, trim: true, skip_empty_lines: true, max_record_size: 1024,
        columns: (header: string[]) => {
          if (header.length !== 2 || header[0] !== 'email' || header[1] !== 'role') throw new Error('Invalid headers');
          return header;
        },
      });
    } catch { throw new BadRequestException('Invalid CSV; use exact email,role headers and two columns on each row'); }
    const dto = plainToInstance(BulkInvitationsDto, { records });
    if ((await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).length) {
      throw new BadRequestException('CSV requires 1-100 records with valid emails and teacher/student roles; no records were imported');
    }
    return this.invite(org, actor, dto.records, key);
  }

  invite(org: string, actor: User, records: MemberInvitationDto[], key?: string) {
    return this.work.run(org, actor, 'invitations.created', records, key, async (manager) => {
      if (new Set(records.map((record) => record.email)).size !== records.length) throw new BadRequestException('Duplicate emails in the batch; no records were imported');
      await requireSeats(manager, org, records.filter(r => r.role === 'student').length, records.filter(r => r.role === 'teacher').length);
      for (const record of records) {
        const [user] = await manager.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [record.email]);
        if (user) {
          const [membership] = await manager.query(
            'SELECT 1 FROM memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1',
            [org, user.id]
          );
          if (membership) {
            throw new ConflictException('A requested person already has a membership; update their school status instead');
          }
        }
        // Expired pending invites can be replaced, but live invites require explicit revocation.
        const [pending] = await manager.query(
          `SELECT id, expires_at AS "expiresAt" FROM invitations 
           WHERE organization_id = $1 AND email = $2 AND accepted_at IS NULL AND revoked_at IS NULL LIMIT 1`,
          [org, record.email]
        );
        if (pending) {
          const expTime = new Date(pending.expiresAt).getTime();
          if (expTime > Date.now()) throw new ConflictException('An active invitation already exists; revoke it before replacing it');
          await manager.query('UPDATE invitations SET revoked_at = NOW() WHERE id = $1', [pending.id]);
          await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'invitation.revoked', details: { invitationId: pending.id, reason: 'expired_replacement' } });
        }
      }
      const [batch] = await manager.query('INSERT INTO invitation_batches (organization_id, created_by, count) VALUES ($1, $2, $3) RETURNING id', [org, actor.id, records.length]);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const invitations = [];
      const [orgData] = await manager.query('SELECT name FROM organizations WHERE id = $1 LIMIT 1', [org]);
      for (const record of records) {
        const token = randomBytes(32).toString('hex');
        const [invitation] = await manager.query(
          `INSERT INTO invitations (organization_id, batch_id, email, role, name, phone, specialty, section_id, child_student_ids, employee_id, employment_type, invited_by, expires_at, token_hash, raw_token)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           RETURNING id, email, role`,
          [
            org,
            batch.id,
            record.email,
            record.role,
            record.name || null,
            record.phone || null,
            record.specialty || null,
            record.sectionId || null,
            record.childStudentIds && record.childStudentIds.length ? JSON.stringify(record.childStudentIds) : null,
            record.employeeId || null,
            record.employmentType || null,
            actor.id,
            expiresAt,
            tokenHash(token),
            token,
          ]
        );
        invitations.push({ id: invitation.id, email: invitation.email, role: invitation.role, token, expiresAt });
        this.mail.sendInvitationEmail(record.email, token, record.role, orgData?.name, record.name).catch(() => {});
      }
      await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'invitations.created', details: { batchId: batch.id, count: records.length } });
      return { batchId: batch.id as string, invitations };
    });
  }

  batches(org: string, actor: User, query: AcademicListDto) {
    return this.work.run(org, actor, null, null, null, async (manager) => {
      const items = await manager.query(`SELECT id, organization_id AS "organizationId", count, created_at AS "createdAt"
        FROM invitation_batches WHERE organization_id = $1 ORDER BY created_at, id LIMIT $2 OFFSET $3`, [org, query.limit, query.offset]);
      const [count] = await manager.query('SELECT count(*)::int AS total FROM invitation_batches WHERE organization_id = $1', [org]);
      return { items, total: count.total, limit: query.limit, offset: query.offset };
    });
  }

  batch(org: string, actor: User, id: string) {
    return this.work.run(org, actor, null, null, null, async (manager) => {
      const [batch] = await manager.query('SELECT id FROM invitation_batches WHERE organization_id = $1 AND id = $2', [org, id]);
      if (!batch) throw new NotFoundException('Batch not found');
      const invitations = await manager.query(`SELECT id, email, role, expires_at AS "expiresAt", accepted_at AS "acceptedAt", revoked_at AS "revokedAt",
        CASE WHEN accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now() THEN raw_token ELSE NULL END AS "token",
        CASE WHEN accepted_at IS NOT NULL THEN 'accepted' WHEN revoked_at IS NOT NULL THEN 'revoked'
        WHEN expires_at <= now() THEN 'expired' ELSE 'pending' END AS status
        FROM invitations WHERE organization_id = $1 AND batch_id = $2 ORDER BY created_at, id`, [org, id]);
      return { batchId: id, invitations };
    });
  }

  revoke(org: string, actor: User, id: string) {
    return this.work.run(org, actor, 'invitation.revoked', { id }, null, async (manager) => {
      const [invitation] = await manager.query(
        'SELECT id, role, accepted_at AS "acceptedAt", revoked_at AS "revokedAt" FROM invitations WHERE organization_id = $1 AND id = $2',
        [org, id]
      );
      if (!invitation || invitation.role === 'school_admin') throw new NotFoundException('Invitation not found');
      if (invitation.acceptedAt || invitation.revokedAt) throw new ConflictException('Invitation is already accepted or revoked');
      await manager.query('UPDATE invitations SET revoked_at = NOW(), raw_token = NULL WHERE id = $1', [id]);
      await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'invitation.revoked', details: { invitationId: id } });
      return { id, status: 'revoked' };
    });
  }

  members(org: string, actor: User, query: MemberListDto) {
    return this.work.run(org, actor, null, null, null, async (manager) => {
      const roles = query.role ? [query.role] : ['teacher', 'student'];
      const [countRes] = await manager.query(
        `SELECT count(*)::int AS total
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.organization_id = $1 AND m.role = ANY($2::text[])`,
        [org, roles]
      );
      const total = countRes?.total ?? 0;
      const items = await manager.query(
        `SELECT m.user_id AS "userId", u.email AS email, m.role AS role,
                m.status AS status, u.is_active AS "accountActive"
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.organization_id = $1 AND m.role = ANY($2::text[])
         ORDER BY m.user_id ASC LIMIT $3 OFFSET $4`,
        [org, roles, query.limit, query.offset]
      );
      return { items, total, limit: query.limit, offset: query.offset };
    });
  }

  updateMember(org: string, actor: User, id: string, dto: MembershipStatusDto) {
    return this.work.run(org, actor, 'membership.updated', { id, ...dto }, null, async (manager) => {
      const [membership] = await manager.query(
        'SELECT role, status FROM memberships WHERE organization_id = $1 AND user_id = $2',
        [org, id]
      );
      if (!membership || !['teacher', 'student'].includes(membership.role)) throw new NotFoundException('Member not found');
      const before = membership.status;
      if (before !== 'active' && dto.status === 'active') await requireSeats(manager, org, membership.role === 'student' ? 1 : 0, membership.role === 'teacher' ? 1 : 0);
      await manager.query(
        'UPDATE memberships SET status = $1 WHERE organization_id = $2 AND user_id = $3',
        [dto.status, org, id]
      );
      await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'membership.updated', details: { userId: id, before, after: dto.status } });
      return { userId: id, role: membership.role, status: dto.status };
    });
  }
}
