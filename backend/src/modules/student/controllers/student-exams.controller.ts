import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { StudentGuard } from '../guards/student.guard';
import { StudentExamsService } from '../services/student-exams.service';

@ApiTags('Student Command Center')
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/student', version: '1' })
export class StudentExamsController {
  constructor(private readonly examsService: StudentExamsService) {}

  @Get('exams')
  @ApiOperation({ summary: 'Get formal exam schedules and published official scorecards' })
  getExamsAndScorecards(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.examsService.getExamsAndScorecards(organizationId, req.user?.id);
  }
}
