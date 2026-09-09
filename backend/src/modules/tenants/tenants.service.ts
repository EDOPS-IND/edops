import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { User } from '../auth/user.entity';
import { hashPassword, tokenHash } from '../auth/password';
import { AcceptInvitationDto, CreateOrganizationDto, UpdateOrganizationDto } from './tenant.dto';
import { Invitation, Membership, Organization, OrganizationStatus } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(private readonly source: DataSource, private readonly audit: AuditService) {}

  async create(dto: CreateOrganizationDto, actor: User) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return this.source.transaction(async (manager) => {
      const organizations = manager.getRepository(Organization);
      const organization = await organizations.save(organizations.create({
        name: dto.name, slug: dto.slug, timeZone: dto.timeZone, locale: dto.locale,
      }));
      await manager.getRepository(Invitation).insert({
        organizationId: organization.id, email: dto.adminEmail, tokenHash: tokenHash(token),
        invitedBy: actor.id, expiresAt,
      });
      await this.audit.record(manager, { organizationId: organization.id, actorId: actor.id, action: 'organization.created' });
      return { organization, invitation: { token, email: dto.adminEmail, expiresAt } };
    });
  }

  async authorizedOrganization(manager: EntityManager, id: string, actor: User, lock = false) {
    const membership = await manager.getRepository(Membership).findOneBy({
      organizationId: id, userId: actor.id, status: 'active',
    });
    if (!membership) throw new NotFoundException('Organization not found');
    if (membership.role !== 'school_admin') throw new ForbiddenException('School administrator access required');
    const organization = await manager.getRepository(Organization).findOne({
      where: { id }, ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!organization) throw new NotFoundException('Organization not found');
    if (organization.status !== 'active') throw new ForbiddenException('Organization is suspended');
    return organization;
  }

  get(id: string, actor: User) {
    return this.authorizedOrganization(this.source.manager, id, actor);
  }

  async update(id: string, dto: UpdateOrganizationDto, actor: User) {
    if ([dto.name, dto.timeZone, dto.locale].every((value) => value === undefined)) {
      throw new BadRequestException('Provide at least one supported setting');
    }
    return this.source.transaction(async (manager) => {
      const organization = await this.authorizedOrganization(manager, id, actor, true);
      const before = { name: organization.name, timeZone: organization.timeZone, locale: organization.locale };
      if (dto.name !== undefined) organization.name = dto.name;
      if (dto.timeZone !== undefined) organization.timeZone = dto.timeZone;
      if (dto.locale !== undefined) organization.locale = dto.locale;
      const updated = await manager.getRepository(Organization).save(organization);
      const after = { name: updated.name, timeZone: updated.timeZone, locale: updated.locale };
      await this.audit.record(manager, { organizationId: id, actorId: actor.id, action: 'organization.updated', details: { before, after } });
      return updated;
    });
  }

  async setStatus(id: string, status: OrganizationStatus, actor: User) {
    return this.source.transaction(async (manager) => {
      const organizations = manager.getRepository(Organization);
      const organization = await organizations.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!organization) throw new NotFoundException('Organization not found');
      const before = organization.status;
      organization.status = status;
      const updated = await organizations.save(organization);
      await this.audit.record(manager, { organizationId: id, actorId: actor.id, action: 'organization.status_changed', details: { before, after: status } });
      return updated;
    });
  }

  async acceptInvitation(dto: AcceptInvitationDto, signedInUser: User | null) {
    return this.source.transaction(async (manager) => {
      const lookup = () => manager.getRepository(Invitation).createQueryBuilder('invitation')
        .where('invitation.token_hash = :hash AND invitation.accepted_at IS NULL AND invitation.revoked_at IS NULL AND invitation.expires_at > now()', { hash: tokenHash(dto.token) });
      const candidate = await lookup().getOne();
      if (!candidate) throw new BadRequestException('Invitation is invalid, expired, revoked or already accepted');
      // Lock school before invitation, matching school-admin provisioning/revocation lock order.
      const organization = await manager.getRepository(Organization).findOne({
        where: { id: candidate.organizationId }, lock: { mode: 'pessimistic_read' },
      });
      if (!organization || organization.status !== 'active') throw new ForbiddenException('Organization is unavailable');
      const invitation = await lookup().setLock('pessimistic_write').getOne();
      if (!invitation) throw new BadRequestException('Invitation is invalid, expired, revoked or already accepted');
      const users = manager.getRepository(User);
      let user = await users.findOneBy({ email: invitation.email });
      if (user) {
        if (!user.isActive || signedInUser?.id !== user.id) {
          throw new ForbiddenException('Sign in with the invited account before accepting');
        }
        if (dto.password !== undefined) throw new BadRequestException('An invitation cannot change an existing password');
      } else {
        if (signedInUser) throw new ForbiddenException('Sign out before creating the invited account');
        if (!dto.password) throw new BadRequestException('A password is required for a new account');
        user = await users.save(users.create({ email: invitation.email, passwordHash: await hashPassword(dto.password) }));
      }
      await manager.getRepository(Membership).insert({
        organizationId: organization.id, userId: user.id, role: invitation.role,
      });
      invitation.acceptedAt = new Date();
      await manager.getRepository(Invitation).save(invitation);
      await this.audit.record(manager, {
        organizationId: organization.id, actorId: user.id, action: 'invitation.accepted', details: { invitationId: invitation.id },
      });
      return { userId: user.id, organizationId: organization.id };
    });
  }
}
