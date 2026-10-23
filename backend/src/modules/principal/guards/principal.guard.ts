import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthenticatedRequest } from "../../../common/auth.guard";
import { DrizzleService } from "../../../database/drizzle.service";
import { organizations, memberships } from "../../../database/schema";
import { and, eq } from "drizzle-orm";

export const SCHOOL_ADMIN_EXAM_CREATE = "school_admin_exam_create";
export const AllowSchoolAdminExamCreate = () => SetMetadata(SCHOOL_ADMIN_EXAM_CREATE, true);

@Injectable()
export class PrincipalGuard implements CanActivate {
  constructor(private readonly drizzle: DrizzleService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const orgId =
      typeof request.params.organizationId === "string"
        ? request.params.organizationId
        : String(request.params.organizationId || "");
    const actor = request.user;

    if (!orgId) return true;

    if (actor.isPlatformAdmin) {
      const [org] = await this.drizzle.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId));
      if (!org) throw new NotFoundException("Organization not found");
      return true;
    }

    const [membership] = await this.drizzle.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, orgId),
          eq(memberships.userId, actor.id),
          eq(memberships.status, "active"),
        ),
      );

    if (!membership)
      throw new NotFoundException(
        "Organization not found or membership inactive",
      );

    const schoolAdminExamCreate = this.reflector.getAllAndOverride<boolean>(SCHOOL_ADMIN_EXAM_CREATE, [context.getHandler(), context.getClass()]);
    if (membership.role !== "principal" && !(schoolAdminExamCreate && membership.role === "school_admin")) {
      throw new ForbiddenException(
        "Principal academic leadership access required",
      );
    }

    const [org] = await this.drizzle.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId));
    if (!org) throw new NotFoundException("Organization not found");
    if (org.status !== "active")
      throw new ForbiddenException("School workspace is suspended");

    return true;
  }
}
