import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { QuickAttendanceDto, TeacherApplyLeaveDto, TeacherReviewLeaveDto } from '../dto/teacher.dto';
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

  @Post(['attendance', 'attendance/quick'])
  @ApiOperation({ summary: 'Record and finalize period attendance for assigned class' })
  recordQuick(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: QuickAttendanceDto
  ) {
    return this.attendanceService.recordQuickAttendance(organizationId, req.user, dto);
  }

  @Post('leaves')
  @ApiOperation({ summary: 'Apply for teacher leave (sent to Principal for approval)' })
  applyLeave(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: TeacherApplyLeaveDto
  ) {
    return this.attendanceService.applyLeave(organizationId, req.user, {
      ...dto,
      reason: dto.reason || '',
    });
  }

  @Get('leaves')
  @ApiOperation({ summary: 'Get current teacher leave applications' })
  getMyLeaves(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.attendanceService.getMyLeaves(organizationId, req.user);
  }

  @Get('leaves/student-requests')
  @ApiOperation({ summary: 'Get student leave requests for classes where user is class teacher (<= 2 days)' })
  getStudentLeaveRequests(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.attendanceService.getClassStudentLeaves(organizationId, req.user);
  }

  @Patch('leaves/student-requests/:id/status')
  @ApiOperation({ summary: 'Approve or reject student leave request as class teacher (<= 2 days)' })
  updateStudentLeaveStatus(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: TeacherReviewLeaveDto
  ) {
    return this.attendanceService.updateStudentLeaveStatus(organizationId, req.user, id, dto.status, dto.reviewNotes);
  }
}
