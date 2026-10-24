import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { TenantsModule } from "../tenants/tenants.module";
import { SchoolAdminController } from "./school-admin.controller";
import { SchoolAdminService } from "./school-admin.service";
import { StorageService } from "../content/storage.service";
import { CommunicationRealtimeService } from "./communication-realtime.service";

@Module({
  imports: [TenantsModule, AuditModule, AuthModule],
  controllers: [SchoolAdminController],
  providers: [SchoolAdminService, StorageService, CommunicationRealtimeService],
  exports: [SchoolAdminService, CommunicationRealtimeService],
})
export class SchoolAdminModule {}
