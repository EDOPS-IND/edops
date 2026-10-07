import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { StudentGuard } from '../guards/student.guard';
import { StudentAssignmentsService } from '../services/student-assignments.service';
import { SubmitAssignmentDto } from '../dto/student.dto';

@ApiTags('Student Command Center')
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/student', version: '1' })
export class StudentAssignmentsController {
  constructor(private readonly assignmentsService: StudentAssignmentsService) {}

  @Get('assignments')
  @ApiOperation({ summary: 'Get student class assignments with status filter' })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'pending', 'submitted', 'evaluated', 'late'] })
  getAssignments(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('status') status: string | undefined,
    @Req() req: AuthenticatedRequest
  ) {
    return this.assignmentsService.getAssignments(organizationId, req.user?.id, status);
  }

  @Post('assignments/:assignmentId/submit')
  @ApiOperation({ summary: 'Submit assignment with text content and optional attachment' })
  submitAssignment(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.assignmentsService.submitAssignment(organizationId, req.user?.id, assignmentId, dto);
  }
}
