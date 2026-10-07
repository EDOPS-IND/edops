import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { CreateTeacherInterventionDto } from '../dto/teacher.dto';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherStudentsService } from '../services/teacher-students.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherStudentsController {
  constructor(private readonly studentsService: TeacherStudentsService) {}

  @Get('students')
  @ApiOperation({ summary: 'Get student cohorts, at-risk attention radar, top performers and improvement ledger' })
  getStudents(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.studentsService.getStudentsOverview(organizationId, req.user);
  }

  @Get('students/:studentId/360')
  @ApiOperation({ summary: 'Get subject-scoped Student 360 profile for an authorized student' })
  getStudent360(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('studentId') studentId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.studentsService.getStudent360(organizationId, req.user, studentId);
  }

  @Post('interventions')
  @ApiOperation({ summary: 'Create a remedial or support intervention for an at-risk student' })
  createIntervention(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTeacherInterventionDto
  ) {
    return this.studentsService.createIntervention(organizationId, req.user, dto);
  }
}
