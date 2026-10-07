import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { CreateTeacherArenaQuestionDto } from '../dto/teacher.dto';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherArenaService } from '../services/teacher-arena.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherArenaController {
  constructor(private readonly arenaService: TeacherArenaService) {}

  @Get('arena/questions')
  @ApiOperation({ summary: 'Get teacher question bank and Arena challenge questions' })
  getQuestions(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.arenaService.getQuestions(organizationId, req.user);
  }

  @Post('arena/questions')
  @ApiOperation({ summary: 'Create and publish Arena practice question to assigned class' })
  createQuestion(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTeacherArenaQuestionDto
  ) {
    return this.arenaService.createQuestion(organizationId, req.user, dto);
  }

  @Get('arena/analytics')
  @ApiOperation({ summary: 'Get Arena question-level accuracy and topic mastery insights' })
  getAnalytics(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.arenaService.getArenaAnalytics(organizationId, req.user);
  }
}
