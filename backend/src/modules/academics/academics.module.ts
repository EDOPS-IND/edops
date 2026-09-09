import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AcademicsController } from './academics.controller';
import { AcademicsService } from './academics.service';

@Module({ imports: [AuditModule, TenantsModule], controllers: [AcademicsController], providers: [AcademicsService] })
export class AcademicsModule {}
