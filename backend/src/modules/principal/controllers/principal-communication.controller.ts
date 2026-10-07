import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { CreateAcademicAnnouncementDto, ResolveParentQueryDto } from '../dto/principal.dto';
import { PrincipalGuard } from '../guards/principal.guard';
import { PrincipalCommunicationService } from '../services/principal-communication.service';

@ApiTags('Principal Academic Command Center - Communication & PTM')
@ApiParam({ name: 'organizationId', format: 'uuid' })
@UseGuards(PrincipalGuard)
@Controller({ path: 'organizations/:organizationId/principal/communication', version: '1' })
export class PrincipalCommunicationController {
  constructor(private readonly service: PrincipalCommunicationService) {}

  @Get()
  @ApiOperation({ summary: 'Academic Communication Overview (Inbox, Parent Queries, PTM Schedules)' })
  communication(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getCommunicationOverview(orgId, req.user);
  }

  @Patch('parent-queries/:id')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Resolve or update Parent Academic Query / Complaint' })
  resolveQuery(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('id') queryId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ResolveParentQueryDto,
  ) {
    return this.service.resolveParentQuery(orgId, req.user, queryId, dto);
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create School-wide or Faculty Academic Announcement' })
  createAnnouncement(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAcademicAnnouncementDto,
  ) {
    return this.service.createAnnouncement(orgId, req.user, dto);
  }
}
