import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Type,
} from "@nestjs/common";
import { DrizzleService } from "../database/drizzle.service";
import { organizations, memberships } from "../database/schema";
import { and, eq } from "drizzle-orm";

/**
 * Creates a reusable NestJS CanActivate guard for verifying active tenant membership
 * and validating the user's role with platform-admin bypass.
 */
export function createTenantRoleGuard(
  targetRole: string | string[],
  errorMessage = `Only authorized ${Array.isArray(targetRole) ? targetRole.join("/") : targetRole} users can access this resource`
): Type<CanActivate> {
  const allowedRoles = Array.isArray(targetRole) ? targetRole : [targetRole];

  @Injectable()
  class TenantRoleGuardMixin implements CanActivate {
    constructor(protected readonly drizzle: DrizzleService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const orgId = request.params?.organizationId;

      if (!user) throw new ForbiddenException("Authentication required");
      if (!orgId) throw new NotFoundException("Organization parameter missing");

      const [org] = await this.drizzle.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId));

      if (!org || org.status !== "active") {
        throw new ForbiddenException("School organization is not active or not found");
      }

      if (user.isPlatformAdmin) {
        return true;
      }

      const [membership] = await this.drizzle.db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.organizationId, orgId),
            eq(memberships.userId, user.id)
          )
        );

      if (!membership || membership.status !== "active") {
        throw new ForbiddenException(`Active ${allowedRoles[0]} membership required`);
      }

      if (!allowedRoles.includes(membership.role)) {
        throw new ForbiddenException(errorMessage);
      }

      request.membership = membership;
      return true;
    }
  }

  return TenantRoleGuardMixin;
}
