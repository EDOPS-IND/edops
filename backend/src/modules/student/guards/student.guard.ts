import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Membership, Organization } from '../../tenants/tenant.entity';
import { Enrollment } from '../../academics/academic.entity';

@Injectable()
export class StudentGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.organizationId;

    if (!user) throw new ForbiddenException('Authentication required');
    if (!orgId) throw new NotFoundException('Organization parameter missing');

    const org = await this.dataSource.getRepository(Organization).findOneBy({ id: orgId });
    if (!org || org.status !== 'active') {
      throw new ForbiddenException('School organization is not active or not found');
    }

    if (user.isPlatformAdmin) return true;

    const membership = await this.dataSource.getRepository(Membership).findOneBy({
      organizationId: orgId,
      userId: user.id,
    });

    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('Active student membership required');
    }

    if (membership.role !== 'student') {
      throw new ForbiddenException('Only enrolled students can access this learning hub');
    }

    // Attach active enrollment if found
    const enrollment = await this.dataSource.getRepository(Enrollment).findOne({
      where: {
        organizationId: orgId,
        studentUserId: user.id,
        status: 'active',
      },
    });

    request.membership = membership;
    request.enrollment = enrollment;
    return true;
  }
}
