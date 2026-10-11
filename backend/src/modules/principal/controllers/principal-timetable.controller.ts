import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest } from '../../../common/auth.guard';
import { CreateTimetableEntryDto, UpdateTimetableEntryDto } from '../../school-admin/school-admin.dto';
import { AssignTimetableSubstituteDto } from '../dto/principal.dto';
import { PrincipalGuard } from '../guards/principal.guard';
import { PrincipalTimetableService } from '../services/principal-timetable.service';

@UseGuards(PrincipalGuard)
@Controller({ path: 'organizations/:organizationId/principal/timetable', version: '1' })
export class PrincipalTimetableController {
  constructor(private readonly service: PrincipalTimetableService) {}

  @Get()
  overview(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.overview(orgId, req.user);
  }

  @Post()
  create(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest, @Body() dto: CreateTimetableEntryDto) {
    return this.service.create(orgId, req.user, dto);
  }

  @Patch(':id')
  update(@Param('organizationId', ParseUUIDPipe) orgId: string, @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest, @Body() dto: UpdateTimetableEntryDto) {
    return this.service.update(orgId, req.user, id, dto);
  }

  @Delete(':id')
  delete(@Param('organizationId', ParseUUIDPipe) orgId: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.service.delete(orgId, req.user, id);
  }

  @Get(':id/suggestions')
  suggestions(@Param('organizationId', ParseUUIDPipe) orgId: string, @Param('id', ParseUUIDPipe) id: string, @Query('date') date: string) {
    return this.service.suggestions(orgId, id, date);
  }

  @Post('substitutions')
  substitute(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest, @Body() dto: AssignTimetableSubstituteDto) {
    return this.service.assignSubstitute(orgId, req.user, dto);
  }
}
