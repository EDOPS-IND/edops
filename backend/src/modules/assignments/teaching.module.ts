import { Module } from "@nestjs/common";
import { TenantsModule } from "../tenants/tenants.module";
import { AuditModule } from "../audit/audit.module";
import { AttendanceService } from "../attendance/attendance.service";
import { ScorecardsService } from "../reports/scorecards.service";
import { AssignmentsService } from "./assignments.service";
import { TeachingAccess } from "./teaching-access.service";
import { TeachingController } from "./teaching.controller";
import { TeachingService } from "./teaching.service";
import { OutboxModule } from "../notifications/outbox.service";

@Module({
  imports: [TenantsModule, AuditModule, OutboxModule],
  controllers: [TeachingController],
  providers: [
    TeachingAccess,
    TeachingService,
    AssignmentsService,
    AttendanceService,
    ScorecardsService,
  ],
  exports: [TeachingAccess, ScorecardsService, AssignmentsService, AttendanceService],
})
export class TeachingModule {}
