import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../common/auth.guard';
import {
  CreateBroadcastDto,
  CreateDepartmentDto,
  CreateDisciplineIncidentDto,
  CreateFeeStructureDto,
  CreateLeaveRequestDto,
  CreateTimetableEntryDto,
  GrantFeeConcessionDto,
  SendFeeReminderDto,
  UpdateLeaveStatusDto,
  UpdateTimetableEntryDto,
} from './school-admin.dto';
import { SchoolAdminService } from './school-admin.service';

@ApiTags('School Admin Control Center')
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/school-admin', version: '1' })
export class SchoolAdminController {
  constructor(private readonly service: SchoolAdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'School Admin Dashboard & Health Score' })
  dashboard(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getDashboard(orgId, req.user);
  }

  @Get('people/students')
  @ApiOperation({ summary: 'List enrolled students with profile summaries' })
  students(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getStudents(orgId, req.user);
  }

  @Get('people/students/:studentId/360')
  @ApiParam({ name: 'studentId', format: 'uuid' })
  @ApiOperation({ summary: 'Detailed 13-tab student 360 profile dossier' })
  student360(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getStudent360(orgId, req.user, studentId);
  }

  @Get('people/teachers')
  @ApiOperation({ summary: 'List teachers with workload and weekly period distribution' })
  teachers(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getTeachers(orgId, req.user);
  }

  @Get('people/staff')
  @ApiOperation({ summary: 'List administrative and operational school staff' })
  staff(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getStaff(orgId, req.user);
  }

  @Get('people/parents')
  @ApiOperation({ summary: 'List registered parents with ward mappings' })
  parents(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getParents(orgId, req.user);
  }

  @Get('people/departments')
  @ApiOperation({ summary: 'List academic departments with faculty load and syllabus progress' })
  departments(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getDepartments(orgId, req.user);
  }

  @Post('people/departments')
  @ApiOperation({ summary: 'Create new academic department' })
  createDepartment(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.service.createDepartment(orgId, req.user, dto);
  }

  @Get('academics/overview')
  @ApiOperation({ summary: 'Academics overview with capacity check and syllabus' })
  academicsOverview(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getAcademicsOverview(orgId, req.user);
  }

  @Get('timetable')
  @ApiOperation({ summary: 'Timetable matrix schedule with conflict detection' })
  timetable(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.service.getTimetable(orgId, req.user, sectionId);
  }

  @Post('timetable')
  @ApiOperation({ summary: 'Create timetable entry with clash detection' })
  createTimetable(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTimetableEntryDto,
  ) {
    return this.service.createTimetableEntry(orgId, req.user, dto);
  }

  @Patch('timetable/:id')
  @ApiOperation({ summary: 'Update timetable entry with clash detection' })
  updateTimetable(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateTimetableEntryDto,
  ) {
    return this.service.updateTimetableEntry(orgId, req.user, id, dto);
  }

  @Delete('timetable/:id')
  @ApiOperation({ summary: 'Delete timetable entry' })
  deleteTimetable(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deleteTimetableEntry(orgId, req.user, id);
  }

  @Get('attendance/registers')
  @ApiOperation({ summary: 'Daily attendance registers & defaulters desk' })
  attendance(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getAttendanceRegisters(orgId, req.user);
  }

  @Get('leaves')
  @ApiOperation({ summary: 'Student & Faculty leave applications' })
  leaves(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getLeaves(orgId, req.user);
  }

  @Post('leaves')
  @ApiOperation({ summary: 'Submit leave application' })
  createLeave(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.service.createLeaveRequest(orgId, req.user, dto);
  }

  @Patch('leaves/:id/status')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Approve or reject leave request' })
  updateLeaveStatus(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    return this.service.updateLeaveStatus(orgId, req.user, id, dto);
  }

  @Get('finance/overview')
  @ApiOperation({ summary: 'Fee collection metrics, structures & defaulters' })
  finance(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getFinanceOverview(orgId, req.user);
  }

  @Post('finance/structures')
  @ApiOperation({ summary: 'Create grade fee structure' })
  createFeeStructure(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFeeStructureDto,
  ) {
    return this.service.createFeeStructure(orgId, req.user, dto);
  }

  @Post('finance/send-reminder')
  @ApiOperation({ summary: 'Dispatch overdue fee reminder via WhatsApp/SMS' })
  sendFeeReminder(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendFeeReminderDto,
  ) {
    return this.service.sendFeeReminder(orgId, req.user, dto);
  }

  @Post('finance/grant-concession')
  @ApiOperation({ summary: 'Grant audited fee concession to student' })
  grantConcession(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: GrantFeeConcessionDto,
  ) {
    return this.service.grantFeeConcession(orgId, req.user, dto);
  }

  @Get('communication/broadcasts')
  @ApiOperation({ summary: 'List dispatched multi-channel school broadcasts' })
  broadcasts(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getBroadcasts(orgId, req.user);
  }

  @Post('communication/broadcast')
  @ApiOperation({ summary: 'Send multi-channel broadcast notice' })
  createBroadcast(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBroadcastDto,
  ) {
    return this.service.createBroadcast(orgId, req.user, dto);
  }

  @Get('communication/tickets')
  @ApiOperation({ summary: 'List incoming teacher messages and communication tickets' })
  tickets(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getCommunicationTickets(orgId, req.user);
  }

  @Get('operations/overview')
  @ApiOperation({ summary: 'Transport fleet, library circulation, assets and PTMs' })
  operations(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getOperationsOverview(orgId, req.user);
  }

  @Get('governance/overview')
  @ApiOperation({ summary: 'Governance alerts, discipline log and immutable audit trail' })
  governance(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getGovernanceOverview(orgId, req.user);
  }

  @Post('governance/discipline')
  @ApiOperation({ summary: 'Record confidential discipline incident' })
  createDiscipline(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDisciplineIncidentDto,
  ) {
    return this.service.createDisciplineIncident(orgId, req.user, dto);
  }
}
