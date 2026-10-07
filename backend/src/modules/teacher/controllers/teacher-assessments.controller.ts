import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { SubmitAssessmentMarksDto } from '../dto/teacher.dto';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherAssessmentsService } from '../services/teacher-assessments.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherAssessmentsController {
  constructor(private readonly assessmentsService: TeacherAssessmentsService) {}

  @Get('assessments')
  @ApiOperation({ summary: 'Get assessments, tests, quizzes and upcoming exam schedules' })
  getAssessments(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.assessmentsService.getAssessments(organizationId, req.user);
  }

  @Post('assessments/marks')
  @ApiOperation({ summary: 'Submit and optionally lock student assessment marks' })
  submitMarks(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubmitAssessmentMarksDto
  ) {
    return this.assessmentsService.submitMarks(organizationId, req.user, dto);
  }
}
