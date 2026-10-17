import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { defer, lastValueFrom } from 'rxjs';
import { isUUID } from 'class-validator';
import { DrizzleService } from '../database/drizzle.service';

@Injectable()
export class PortalDatabaseInterceptor implements NestInterceptor {
  constructor(private readonly drizzle: DrizzleService) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const org = request.params?.organizationId;
    if (!isUUID(org || '') || !/\/organizations\/[^/]+\/(student|teacher|principal|school-admin)(\/|$)/.test(request.path)) return next.handle();
    return defer(() => this.drizzle.forOrganization(org, () => lastValueFrom(next.handle())));
  }
}
