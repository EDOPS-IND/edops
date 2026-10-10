import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TenantsModule } from "../tenants/tenants.module";
import { SchoolAdminController } from "./school-admin.controller";
import { SchoolAdminService } from "./school-admin.service";

@Module({
  imports: [TenantsModule, AuditModule],
  controllers: [SchoolAdminController],
  providers: [SchoolAdminService],
  exports: [SchoolAdminService],
})
export class SchoolAdminModule {}
