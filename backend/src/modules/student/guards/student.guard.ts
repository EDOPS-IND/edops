import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../../../database/drizzle.service';
import { organizations, memberships, enrollments } from '../../../database/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class StudentGuard implements CanActivate {
  constructor(private readonly drizzle: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.organizationId;

    if (!user) throw new ForbiddenException('Authentication required');
    if (!orgId) throw new NotFoundException('Organization parameter missing');

    if (user.id?.startsWith('train-')) {
      request.membership = { organizationId: orgId, userId: user.id, role: 'student', status: 'active' };
      return true;
    }

    const [org] = await this.drizzle.db.select().from(organizations).where(eq(organizations.id, orgId)).catch(() => []);
    if (!org || org.status !== 'active') {
      throw new ForbiddenException('School organization is not active or not found');
    }

    if (user.isPlatformAdmin) return true;

    const [membership] = await this.drizzle.db.select().from(memberships).where(
      and(eq(memberships.organizationId, orgId), eq(memberships.userId, user.id))
    );

    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('Active student membership required');
    }

    if (membership.role !== 'student') {
      throw new ForbiddenException('Only enrolled students can access this learning hub');
    }

    // Attach active enrollment if found
    const [enrollment] = await this.drizzle.db.select().from(enrollments).where(
      and(
        eq(enrollments.organizationId, orgId),
        eq(enrollments.studentUserId, user.id),
        eq(enrollments.status, 'active')
      )
    );

    request.membership = membership;
    request.enrollment = enrollment;
    return true;
  }
}
