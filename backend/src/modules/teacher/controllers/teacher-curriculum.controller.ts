import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherCurriculumService } from '../services/teacher-curriculum.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherCurriculumController {
  constructor(private readonly curriculumService: TeacherCurriculumService) {}

  @Get('curriculum')
  @ApiOperation({ summary: 'Get syllabus chapters, progress gap and learning outcomes matrix' })
  getCurriculum(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Query('sectionId') sectionId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.curriculumService.getCurriculumOverview(organizationId, req.user, sectionId, subjectId);
  }

  @Patch('curriculum/:chapterId/progress')
  @ApiOperation({ summary: 'Update chapter lesson completion progress' })
  updateProgress(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('chapterId') chapterId: string,
    @Req() req: AuthenticatedRequest,
    @Body('completionPct') completionPct: number,
    @Body('status') status?: string,
  ) {
    return this.curriculumService.updateProgress(organizationId, req.user, chapterId, completionPct, status);
  }
}
