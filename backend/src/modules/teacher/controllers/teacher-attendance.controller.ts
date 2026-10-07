import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { QuickAttendanceDto } from '../dto/teacher.dto';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherAttendanceService } from '../services/teacher-attendance.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherAttendanceController {
  constructor(private readonly attendanceService: TeacherAttendanceService) {}

  @Get('attendance')
  @ApiOperation({ summary: 'Get attendance overview, recent registers and CBSE <75% defaulters alerts' })
  getAttendance(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.attendanceService.getAttendanceOverview(organizationId, req.user);
  }

  @Post('attendance/quick')
  @ApiOperation({ summary: 'Record and finalize period attendance for assigned class' })
  recordQuick(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: QuickAttendanceDto
  ) {
    return this.attendanceService.recordQuickAttendance(organizationId, req.user, dto);
  }
}
