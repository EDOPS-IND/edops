import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { StudentGuard } from '../guards/student.guard';
import { StudentResourcesService } from '../services/student-resources.service';
import { ToggleBookmarkDto, UpdateLectureProgressDto } from '../dto/student.dto';

@ApiTags('Student Command Center')
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/student', version: '1' })
export class StudentResourcesController {
  constructor(private readonly resourcesService: StudentResourcesService) {}

  @Get('resources')
  @ApiOperation({ summary: 'Get study materials, recorded lectures, and bookmarks' })
  getResources(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.resourcesService.getResources(organizationId, req.user?.id);
  }

  @Post('resources/lectures/:recordingId/progress')
  @ApiOperation({ summary: 'Update video lecture playback progress' })
  updateLectureProgress(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('recordingId') recordingId: string,
    @Body() dto: UpdateLectureProgressDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.resourcesService.updateLectureProgress(organizationId, req.user?.id, recordingId, dto);
  }

  @Post('resources/bookmarks')
  @ApiOperation({ summary: 'Bookmark or save a learning resource' })
  toggleBookmark(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: ToggleBookmarkDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.resourcesService.toggleBookmark(organizationId, req.user?.id, dto);
  }
}
