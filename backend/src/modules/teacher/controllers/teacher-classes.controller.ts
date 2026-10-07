import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
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
