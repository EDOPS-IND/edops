import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { StudentGuard } from '../guards/student.guard';
import { StudentAttendanceService } from '../services/student-attendance.service';

@ApiTags('Student Command Center')
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/student', version: '1' })
export class StudentAttendanceController {
  constructor(private readonly attendanceService: StudentAttendanceService) {}

  @Get('attendance')
  @ApiOperation({ summary: 'Get overall attendance %, subject-wise %, monthly calendar, and threshold alert' })
  getAttendance(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.attendanceService.getAttendance(organizationId, req.user?.id);
  }
}
