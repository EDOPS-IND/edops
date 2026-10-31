import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherClassesService } from '../services/teacher-classes.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherClassesController {
  constructor(private readonly classesService: TeacherClassesService) {}

  @Get('classes')
  @ApiOperation({ summary: 'Get list of assigned classes, sections and subject performance summaries' })
  getMyClasses(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.classesService.getMyClasses(organizationId, req.user);
  }

  @Get('classes/lectures')
  @ApiOperation({ summary: 'Get teacher daily classroom lecture logs and study materials' })
  getLectureLogs(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.classesService.getLectureLogs(organizationId, req.user);
  }

  @Post('classes/lectures')
  @ApiOperation({ summary: 'Log a daily class lecture with topics, study materials, homework, and notes' })
  logLecture(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: any
  ) {
    return this.classesService.logLecture(organizationId, req.user, dto);
  }

  @Get('classes/:sectionId')
  @ApiOperation({ summary: 'Get subject-scoped class details, students roster and chapter breakdown' })
  getClassDetails(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('sectionId') sectionId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.classesService.getClassDetails(organizationId, req.user, sectionId);
  }
}
