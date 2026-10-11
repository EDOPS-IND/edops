import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { User } from '../modules/auth/user.entity';

const PUBLIC = 'edops:public';
const PLATFORM = 'edops:platform';
const REQUIRE_FEATURE = 'edops:require_feature';

export const Public = () => SetMetadata(PUBLIC, true);
export const PlatformAdmin = () => SetMetadata(PLATFORM, true);
export const RequireFeature = (featureKey: string) => SetMetadata(REQUIRE_FEATURE, featureKey);

export interface AuthenticatedRequest extends Request {
  user: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = await this.auth.userFromRequest(request);
    if (!user) throw new UnauthorizedException('Invalid, expired or missing authentication credentials');
    request.user = user;
    if (this.reflector.getAllAndOverride<boolean>(PLATFORM, [context.getHandler(), context.getClass()]) && !user.isPlatformAdmin) {
      throw new ForbiddenException('Platform administrator access required');
    }

    const featureKey = this.reflector.getAllAndOverride<string>(REQUIRE_FEATURE, [context.getHandler(), context.getClass()]);
    if (featureKey && !user.isPlatformAdmin) {
      const rawOrgId = request.params?.organizationId;
      const orgId = typeof rawOrgId === 'string' ? rawOrgId : Array.isArray(rawOrgId) ? rawOrgId[0] : undefined;
      if (orgId) {
        const [membership] = await this.auth.drizzle.query(
          `SELECT role FROM memberships WHERE organization_id = $1 AND user_id = $2 AND status = 'active' LIMIT 1`,
          [orgId, user.id]
        );
        const { requireFeature } = await import('../modules/billing/entitlements');
        await requireFeature(this.auth.drizzle, orgId, featureKey, membership?.role);
      }
    }

    return true;
  }
}
