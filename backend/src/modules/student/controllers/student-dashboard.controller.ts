import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../../common/auth.guard";
import { StudentGuard } from "../guards/student.guard";
import { StudentDashboardService } from "../services/student-dashboard.service";

@ApiTags("Student Command Center")
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId/student", version: "1" })
export class StudentDashboardController {
  constructor(private readonly dashboardService: StudentDashboardService) {}

  @Get("dashboard")
  @ApiOperation({
    summary:
      "Get Student Dashboard overview, active enrollment, top 4 KPIs, next class and alerts",
  })
  getDashboard(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.dashboardService.getDashboard(organizationId, req.user?.id);
  }
}
