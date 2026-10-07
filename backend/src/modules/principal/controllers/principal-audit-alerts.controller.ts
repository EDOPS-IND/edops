import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { ResolveAcademicAlertDto } from '../dto/principal.dto';
import { PrincipalGuard } from '../guards/principal.guard';
import { PrincipalAuditAlertsService } from '../services/principal-audit-alerts.service';

@ApiTags('Principal Academic Command Center - Audit & Alerts')
@ApiParam({ name: 'organizationId', format: 'uuid' })
@UseGuards(PrincipalGuard)
@Controller({ path: 'organizations/:organizationId/principal', version: '1' })
export class PrincipalAuditAlertsController {
  constructor(private readonly service: PrincipalAuditAlertsService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'Academic Alert Center (Attention Required items)' })
  alerts(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getAlerts(orgId, req.user);
  }

  @Patch('alerts/:id/resolve')
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Resolve academic alert with resolution notes' })
  resolveAlert(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('id') alertId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ResolveAcademicAlertDto,
  ) {
    return this.service.resolveAlert(orgId, req.user, alertId, dto);
  }

  @Get('academic-audit')
  @ApiOperation({ summary: 'Weekly/Monthly Academic Execution Audit across Classes & Teachers' })
  audit(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getAuditOverview(orgId, req.user);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Academic Reports Catalog & Export Data (School, Teacher, Class, Student)' })
  reports(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getReports(orgId, req.user);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Academic Activity Timeline & Event Audit' })
  activity(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getActivityTimeline(orgId, req.user);
  }
}
