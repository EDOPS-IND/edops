import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { Membership, Organization } from '../../tenants/tenant.entity';

@Injectable()
export class PrincipalGuard implements CanActivate {
  constructor(private readonly source: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const orgId = typeof request.params.organizationId === 'string' ? request.params.organizationId : String(request.params.organizationId || '');
    const actor = request.user;

    if (!orgId) return true;

    if (actor.isPlatformAdmin) {
      const org = await this.source.getRepository(Organization).findOneBy({ id: orgId });
      if (!org) throw new NotFoundException('Organization not found');
      return true;
    }

    const membership = await this.source.getRepository(Membership).findOneBy({
      organizationId: orgId,
      userId: actor.id,
      status: 'active',
    });

    if (!membership) throw new NotFoundException('Organization not found or membership inactive');

    if (membership.role !== 'principal') {
      throw new ForbiddenException('Principal academic leadership access required');
    }

    const org = await this.source.getRepository(Organization).findOneBy({ id: orgId });
    if (!org) throw new NotFoundException('Organization not found');
    if (org.status !== 'active') throw new ForbiddenException('School workspace is suspended');

    return true;
  }
}
