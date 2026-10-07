import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { UpdateTeacherTaskDto } from '../dto/teacher.dto';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherWorkloadReportsService } from '../services/teacher-workload-reports.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherWorkloadReportsController {
  constructor(private readonly workloadService: TeacherWorkloadReportsService) {}

  @Get('workload')
  @ApiOperation({ summary: "Get weekly period workload balance and today's academic tasks" })
  getWorkload(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.workloadService.getWorkloadAndTasks(organizationId, req.user);
  }

  @Patch('tasks/:taskId')
  @ApiOperation({ summary: 'Update academic action item status (pending, completed, snoozed)' })
  updateTask(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('taskId') taskId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateTeacherTaskDto
  ) {
    return this.workloadService.updateTaskStatus(organizationId, req.user, taskId, dto);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get academic calendar milestones, exams, deadlines and PTM dates' })
  getCalendar(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Query('month') month?: string
  ) {
    return this.workloadService.getCalendar(organizationId, req.user, month);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get class learning outcome heatmap and statutory academic report summaries' })
  getReports(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Query('section') section?: string
  ) {
    return this.workloadService.getReportsAndHeatmap(organizationId, req.user, section);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get immutable academic activity audit timeline for teacher' })
  getActivity(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.workloadService.getActivityTimeline(organizationId, req.user);
  }
}
