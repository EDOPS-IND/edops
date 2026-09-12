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
import { Invitation, Membership } from './tenant.entity';
import { SchoolWork } from './school-work.service';
import { requireSeats } from '../billing/entitlements';

@Injectable()
export class ProvisioningService {
  constructor(private readonly work: SchoolWork, private readonly audit: AuditService) {}

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
      await requireSeats(manager,org,records.filter(r=>r.role==='student').length,records.filter(r=>r.role==='teacher').length);
      for (const record of records) {
        const user = await manager.getRepository(User).findOneBy({ email: record.email });
        if (user && await manager.getRepository(Membership).existsBy({ organizationId: org, userId: user.id })) {
          throw new ConflictException('A requested person already has a membership; update their school status instead');
        }
        // Expired pending invites can be replaced, but live invites require explicit revocation.
        const pending = await manager.getRepository(Invitation).createQueryBuilder('invite')
          .where('invite.organization_id = :org AND invite.email = :email AND invite.accepted_at IS NULL AND invite.revoked_at IS NULL', { org, email: record.email }).getOne();
        if (pending) {
          if (pending.expiresAt.getTime() > Date.now()) throw new ConflictException('An active invitation already exists; revoke it before replacing it');
          pending.revokedAt = new Date();
          await manager.getRepository(Invitation).save(pending);
          await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'invitation.revoked', details: { invitationId: pending.id, reason: 'expired_replacement' } });
        }
      }
      const [batch] = await manager.query('INSERT INTO invitation_batches (organization_id, created_by, count) VALUES ($1, $2, $3) RETURNING id', [org, actor.id, records.length]);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const invitations = [];
      for (const record of records) {
        const token = randomBytes(32).toString('hex');
        const repository = manager.getRepository(Invitation);
        const invitation = await repository.save(repository.create({ organizationId: org, batchId: batch.id,
          email: record.email, role: record.role, invitedBy: actor.id, expiresAt, tokenHash: tokenHash(token) }));
        invitations.push({ id: invitation.id, email: invitation.email, role: invitation.role, token, expiresAt });
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
        CASE WHEN accepted_at IS NOT NULL THEN 'accepted' WHEN revoked_at IS NOT NULL THEN 'revoked'
        WHEN expires_at <= now() THEN 'expired' ELSE 'pending' END AS status
        FROM invitations WHERE organization_id = $1 AND batch_id = $2 ORDER BY created_at, id`, [org, id]);
      return { batchId: id, invitations };
    });
  }

  revoke(org: string, actor: User, id: string) {
    return this.work.run(org, actor, 'invitation.revoked', { id }, null, async (manager) => {
      const repository = manager.getRepository(Invitation);
      const invitation = await repository.findOneBy({ organizationId: org, id });
      if (!invitation || invitation.role === 'school_admin') throw new NotFoundException('Invitation not found');
      if (invitation.acceptedAt || invitation.revokedAt) throw new ConflictException('Invitation is already accepted or revoked');
      invitation.revokedAt = new Date();
      await repository.save(invitation);
      await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'invitation.revoked', details: { invitationId: id } });
      return { id, status: 'revoked' };
    });
  }

  members(org: string, actor: User, query: MemberListDto) {
    return this.work.run(org, actor, null, null, null, async (manager) => {
      const builder = manager.getRepository(Membership).createQueryBuilder('membership')
        .innerJoin(User, 'user', 'user.id = membership.user_id')
        .where('membership.organization_id = :org AND membership.role IN (:...roles)', { org, roles: query.role ? [query.role] : ['teacher', 'student'] });
      const total = await builder.getCount();
      const items = await builder.select(['membership.user_id AS "userId"', 'user.email AS email', 'membership.role AS role',
        'membership.status AS status', 'user.is_active AS "accountActive"'])
        .orderBy('membership.user_id', 'ASC').limit(query.limit).offset(query.offset).getRawMany();
      return { items, total, limit: query.limit, offset: query.offset };
    });
  }

  updateMember(org: string, actor: User, id: string, dto: MembershipStatusDto) {
    return this.work.run(org, actor, 'membership.updated', { id, ...dto }, null, async (manager) => {
      const repository = manager.getRepository(Membership);
      const membership = await repository.findOneBy({ organizationId: org, userId: id });
      if (!membership || !['teacher', 'student'].includes(membership.role)) throw new NotFoundException('Member not found');
      const before = membership.status;
      if (before !== 'active' && dto.status === 'active') await requireSeats(manager,org,membership.role==='student'?1:0,membership.role==='teacher'?1:0);
      membership.status = dto.status;
      await repository.save(membership);
      await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'membership.updated', details: { userId: id, before, after: dto.status } });
      return { userId: id, role: membership.role, status: membership.status };
    });
  }
}
