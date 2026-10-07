import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherTimetableService } from '../services/teacher-timetable.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherTimetableController {
  constructor(private readonly timetableService: TeacherTimetableService) {}

  @Get('timetable/today')
  @ApiOperation({ summary: "Get today's instructional periods, timing, rooms and statuses" })
  getToday(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.timetableService.getTodayTimetable(organizationId, req.user);
  }

  @Get('timetable/weekly')
  @ApiOperation({ summary: 'Get full weekly period timetable grid and workload capacity' })
  getWeekly(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.timetableService.getWeeklyTimetable(organizationId, req.user);
  }
}
