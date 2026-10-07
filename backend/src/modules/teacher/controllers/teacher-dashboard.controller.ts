import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherDashboardService } from '../services/teacher-dashboard.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherDashboardController {
  constructor(private readonly dashboardService: TeacherDashboardService) {}

  @Get('dashboard')
  @ApiOperation({ summary: "Get Teacher Dashboard overview, today's periods, next class and alerts" })
  getDashboard(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.dashboardService.getDashboard(organizationId, req.user);
  }
}
