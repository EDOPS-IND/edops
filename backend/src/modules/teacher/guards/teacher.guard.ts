import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../../../database/drizzle.service';
import { organizations, memberships } from '../../../database/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class TeacherGuard implements CanActivate {
  constructor(private readonly drizzle: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.organizationId;

    if (!user) throw new ForbiddenException('Authentication required');
    if (!orgId) throw new NotFoundException('Organization parameter missing');

    const [org] = await this.drizzle.db.select().from(organizations).where(eq(organizations.id, orgId));
    if (!org || org.status !== 'active') {
      throw new ForbiddenException('School organization is not active or not found');
    }

    if (user.isPlatformAdmin) return true;

    const [membership] = await this.drizzle.db.select().from(memberships).where(
      and(eq(memberships.organizationId, orgId), eq(memberships.userId, user.id))
    );

    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('Active teacher membership required');
    }

    if (membership.role !== 'teacher') {
      throw new ForbiddenException('Only authorized teachers can access this command center');
    }

    request.membership = membership;
    return true;
  }
}
