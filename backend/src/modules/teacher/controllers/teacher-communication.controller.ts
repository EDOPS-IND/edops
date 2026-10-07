import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { SendTeacherMessageDto } from '../dto/teacher.dto';
import { TeacherGuard } from '../guards/teacher.guard';
import { TeacherCommunicationService } from '../services/teacher-communication.service';

@ApiTags('Teacher Command Center')
@ApiBearerAuth()
@UseGuards(TeacherGuard)
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teacher', version: '1' })
export class TeacherCommunicationController {
  constructor(private readonly communicationService: TeacherCommunicationService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get teacher in-app inbox and academic announcements' })
  getMessages(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Query('filter') filter?: string
  ) {
    return this.communicationService.getMessages(organizationId, req.user, filter);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send in-app message to student, parent, principal or admin' })
  sendMessage(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendTeacherMessageDto
  ) {
    return this.communicationService.sendMessage(organizationId, req.user, dto);
  }
}
