import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TenantsModule } from "../tenants/tenants.module";
import { SchoolAdminModule } from "../school-admin/school-admin.module";

// Controllers
import { PrincipalDashboardController } from "./controllers/principal-dashboard.controller";
import { PrincipalPlanningController } from "./controllers/principal-planning.controller";
import { PrincipalTeachersController } from "./controllers/principal-teachers.controller";
import { PrincipalAcademicsController } from "./controllers/principal-academics.controller";
import { PrincipalAssessmentsController } from "./controllers/principal-assessments.controller";
import { PrincipalStudentsController } from "./controllers/principal-students.controller";
import { PrincipalCommunicationController } from "./controllers/principal-communication.controller";
import { PrincipalAuditAlertsController } from "./controllers/principal-audit-alerts.controller";
import { PrincipalTimetableController } from "./controllers/principal-timetable.controller";

// Services
import { PrincipalDashboardService } from "./services/principal-dashboard.service";
import { PrincipalPlanningService } from "./services/principal-planning.service";
import { PrincipalTeachersService } from "./services/principal-teachers.service";
import { PrincipalAcademicsService } from "./services/principal-academics.service";
import { PrincipalAssessmentsService } from "./services/principal-assessments.service";
import { PrincipalStudentsService } from "./services/principal-students.service";
import { PrincipalCommunicationService } from "./services/principal-communication.service";
import { PrincipalAuditAlertsService } from "./services/principal-audit-alerts.service";
import { PrincipalTimetableService } from "./services/principal-timetable.service";

// Guards
import { PrincipalGuard } from "./guards/principal.guard";

@Module({
  imports: [TenantsModule, AuditModule, SchoolAdminModule],
  controllers: [
    PrincipalDashboardController,
    PrincipalPlanningController,
    PrincipalTeachersController,
    PrincipalAcademicsController,
    PrincipalAssessmentsController,
    PrincipalStudentsController,
    PrincipalCommunicationController,
    PrincipalAuditAlertsController,
    PrincipalTimetableController,
  ],
  providers: [
    PrincipalGuard,
    PrincipalDashboardService,
    PrincipalPlanningService,
    PrincipalTeachersService,
    PrincipalAcademicsService,
    PrincipalAssessmentsService,
    PrincipalStudentsService,
    PrincipalCommunicationService,
    PrincipalAuditAlertsService,
    PrincipalTimetableService,
  ],
  exports: [
    PrincipalDashboardService,
    PrincipalPlanningService,
    PrincipalTeachersService,
    PrincipalAcademicsService,
    PrincipalAssessmentsService,
    PrincipalStudentsService,
    PrincipalCommunicationService,
    PrincipalAuditAlertsService,
  ],
})
export class PrincipalModule {}
