import { createParamDecorator, ExecutionContext, ForbiddenException, Injectable, CanActivate } from '@nestjs/common';
import { AuthenticatedRequest } from './auth.guard';
import { verifyAccessToken } from '../modules/auth/jwt.util';

export interface RequestTenantContext {
  userId: string;
  email: string;
  isPlatformAdmin: boolean;
  schoolId?: string;
  role?: string;
}

export const CurrentContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestTenantContext => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const payload = verifyAccessToken(authHeader.substring(7));
        return {
          userId: payload.sub,
          email: payload.email,
          isPlatformAdmin: payload.isPlatformAdmin,
          schoolId: payload.schoolId,
          role: payload.role,
        };
      } catch {
        // Fall back to request.user
      }
    }
    return {
      userId: request.user?.id,
      email: request.user?.email,
      isPlatformAdmin: request.user?.isPlatformAdmin ?? false,
    };
  },
);

@Injectable()
export class TenantAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const paramOrgId = request.params?.organizationId || request.params?.schoolId;
    if (!paramOrgId) return true;

    // Platform admin has universal read/write access
    if (request.user?.isPlatformAdmin) return true;

    // Check token claims or active session permissions
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const payload = verifyAccessToken(authHeader.substring(7));
        if (payload.schoolId && payload.schoolId !== paramOrgId) {
          throw new ForbiddenException('Cross-tenant access forbidden');
        }
      } catch (err: any) {
        if (err instanceof ForbiddenException) throw err;
      }
    }
    return true;
  }
}
