import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { ReviewLessonPlanDto, UpdateCurriculumProgressDto } from '../dto/principal.dto';
import { PrincipalGuard } from '../guards/principal.guard';
import { PrincipalAcademicsService } from '../services/principal-academics.service';

@ApiTags('Principal Academic Command Center - Academics & Curriculum')
@ApiParam({ name: 'organizationId', format: 'uuid' })
@UseGuards(PrincipalGuard)
@Controller({ path: 'organizations/:organizationId/principal/academics', version: '1' })
export class PrincipalAcademicsController {
  constructor(private readonly service: PrincipalAcademicsService) {}

  @Get()
  @ApiOperation({ summary: 'Academics overview (Classes, Subjects, Curriculum Gap, Lesson Plans, Substitutions)' })
  academics(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getAcademicsOverview(orgId, req.user);
  }

  @Get('classes/:classId/performance')
  @ApiParam({ name: 'classId' })
  @ApiOperation({ summary: 'Deep dive Class Performance with subject breakdowns and trends' })
  classPerformance(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('classId') classId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getClassPerformance(orgId, req.user, classId);
  }

  @Patch('curriculum/progress')
  @ApiOperation({ summary: 'Update Curriculum chapter completion and status' })
  updateCurriculumProgress(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCurriculumProgressDto,
  ) {
    return this.service.updateCurriculumProgress(orgId, req.user, dto);
  }

  @Post('lesson-plans/:id/feedback')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Submit Principal Feedback and Approval on Lesson Plan' })
  reviewLessonPlan(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('id') lessonId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReviewLessonPlanDto,
  ) {
    return this.service.reviewLessonPlan(orgId, req.user, lessonId, dto);
  }
}
