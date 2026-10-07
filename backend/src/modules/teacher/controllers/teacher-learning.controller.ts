import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { CreateStudyMaterialDto, RecordLessonDeliveryDto } from '../dto/teacher.dto';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherLearningService } from '../services/teacher-learning.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherLearningController {
  constructor(private readonly learningService: TeacherLearningService) {}

  @Get('learning')
  @ApiOperation({ summary: 'Get lesson plans, study materials, and delivery reflections' })
  getLearning(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.learningService.getLearningHub(organizationId, req.user);
  }

  @Post('lessons/deliver')
  @ApiOperation({ summary: 'Mark lesson completed with topics covered, participation and reflections' })
  recordDelivery(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordLessonDeliveryDto
  ) {
    return this.learningService.recordDelivery(organizationId, req.user, dto);
  }

  @Post('materials')
  @ApiOperation({ summary: 'Upload and categorize study material for students' })
  uploadMaterial(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStudyMaterialDto
  ) {
    return this.learningService.uploadStudyMaterial(organizationId, req.user, dto);
  }
}
