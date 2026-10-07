import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { CreateTeacherAssignmentDto, GradeSubmissionDto } from '../dto/teacher.dto';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherAssignmentsService } from '../services/teacher-assignments.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherAssignmentsController {
  constructor(private readonly assignmentsService: TeacherAssignmentsService) {}

  @Get('assignments')
  @ApiOperation({ summary: 'Get assignments created by teacher and class submission stats' })
  getAssignments(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.assignmentsService.getAssignments(organizationId, req.user);
  }

  @Post('assignments')
  @ApiOperation({ summary: 'Create and publish targeted assignment for class or student subset' })
  createAssignment(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTeacherAssignmentDto
  ) {
    return this.assignmentsService.createAssignment(organizationId, req.user, dto);
  }

  @Get('submissions/queue')
  @ApiOperation({ summary: 'Get submissions awaiting evaluation queue with SLA indicators' })
  getQueue(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.assignmentsService.getSubmissionsQueue(organizationId, req.user);
  }

  @Post('submissions/:submissionId/grade')
  @ApiOperation({ summary: 'Grade a student submission with score, rubric and pedagogical feedback' })
  gradeSubmission(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('submissionId') submissionId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: GradeSubmissionDto
  ) {
    return this.assignmentsService.gradeSubmission(organizationId, req.user, submissionId, dto);
  }
}
