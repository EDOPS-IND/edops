import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
  @Get('profile')
  getProfile(@Param('organizationId',ParseUUIDPipe) org:string,@Req() req:AuthenticatedRequest) {return this.dashboardService.getProfile(org,req.user.id);}
  @Patch('profile')
  @ApiOperation({ summary: 'Update student profile details (blood group, address, emergency contact, etc.)' })
  updateProfile(
    @Param('organizationId', ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.dashboardService.updateProfile(org, req.user.id, body);
  }
  @Get('calendar')
  getCalendar(@Param('organizationId',ParseUUIDPipe) org:string,@Req() req:AuthenticatedRequest) {return this.dashboardService.getCalendar(org,req.user.id);}

}
