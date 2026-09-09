import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { InvitationsController, OrganizationsController, PlatformOrganizationsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { SchoolWork } from './school-work.service';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [InvitationsController, OrganizationsController, PlatformOrganizationsController, ProvisioningController],
  providers: [TenantsService, SchoolWork, ProvisioningService],
  exports: [SchoolWork],
})
export class TenantsModule {}
