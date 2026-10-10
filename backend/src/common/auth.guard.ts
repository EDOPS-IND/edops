import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { User } from '../modules/auth/user.entity';

const PUBLIC = 'edops:public';
const PLATFORM = 'edops:platform';
export const Public = () => SetMetadata(PUBLIC, true);
export const PlatformAdmin = () => SetMetadata(PLATFORM, true);

export interface AuthenticatedRequest extends Request {
  user: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Support JWT Bearer Token directly
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await this.auth.userFromJwt(token);
      if (user) {
        request.user = user;
        if (this.reflector.getAllAndOverride<boolean>(PLATFORM, [context.getHandler(), context.getClass()]) && !user.isPlatformAdmin) {
          throw new ForbiddenException('Platform administrator access required');
        }
        return true;
      }
    }

    const user = await this.auth.currentUser(request.session);
    if (!user) throw new UnauthorizedException('Sign in to continue');
    request.user = user;
    if (this.reflector.getAllAndOverride<boolean>(PLATFORM, [context.getHandler(), context.getClass()]) && !user.isPlatformAdmin) {
      throw new ForbiddenException('Platform administrator access required');
    }
    return true;
  }
}
