import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { StudentGuard } from '../guards/student.guard';
import { StudentCurriculumService } from '../services/student-curriculum.service';

@ApiTags('Student Command Center')
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/student', version: '1' })
export class StudentCurriculumController {
  constructor(private readonly curriculumService: StudentCurriculumService) {}

  @Get('curriculum')
  @ApiOperation({ summary: 'Get chapter-by-chapter curriculum progress, status, and remaining topics' })
  getCurriculum(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.curriculumService.getCurriculum(organizationId, req.user?.id);
  }
}
