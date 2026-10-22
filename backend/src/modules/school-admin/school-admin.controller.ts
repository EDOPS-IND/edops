import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../common/auth.guard';
import {
  BatchFeeReminderDto,
  CreateBroadcastDto,
  CreateCourseworkDto,
  CreateCurriculumNodeDto,
  CreateDepartmentDto,
  CreateDisciplineIncidentDto,
  CreateFeeStructureDto,
  CreateLeaveRequestDto,
  CreateLibraryBookDto,
  CreateSchoolAssetDto,
  CreateTimetableEntryDto,
  CreateTransportVehicleDto,
  GrantFeeConcessionDto,
  RecordOfflinePaymentDto,
  ScheduleExamDto,
  SchedulePtmDto,
  SendFeeReminderDto,
  UpdateLeaveStatusDto,
  UpdateParentChildrenDto,
  UpdateSchoolConfigDto,
  UpdateTeacherEmploymentDto,
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
  students(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
    @Query('search') search?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.service.getStudents(orgId, req.user, {
      limit: Math.min(Math.max(Number(limit) || 50, 1), 100),
      offset: Math.max(Number(offset) || 0, 0),
      search,
      sectionId,
    });
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

  @Patch('people/teachers/:teacherId/employment')
  @ApiOperation({ summary: 'Update teacher employee ID and employment contract type' })
  updateTeacherEmployment(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Body() dto: UpdateTeacherEmploymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateTeacherEmployment(orgId, req.user, teacherId, dto);
  }

  @Get('people/staff')
  @ApiOperation({ summary: 'List administrative and operational school staff' })
  staff(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getStaff(orgId, req.user);
  }

  @Get('people/parents')
  @ApiOperation({ summary: 'List registered parents with ward mappings' })
  parents(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
    @Query('search') search?: string,
  ) {
    return this.service.getParents(orgId, req.user, {
      limit: Math.min(Math.max(Number(limit) || 50, 1), 100),
      offset: Math.max(Number(offset) || 0, 0),
      search,
    });
  }

  @Put('people/parents/:parentId/children')
  @ApiOperation({ summary: 'Update mapped wards for an existing parent' })
  updateParentChildren(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateParentChildrenDto,
  ) {
    return this.service.updateParentChildren(orgId, req.user, parentId, dto.studentUserIds);
  }

  @Get('people/departments')
  @ApiOperation({ summary: 'List academic departments with faculty load and syllabus progress' })
  departments(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getDepartments(orgId, req.user);
  }

  @Get('people/departments/available-subjects')
  @ApiOperation({ summary: 'List all subjects available for department mapping' })
  availableSubjects(@Param('organizationId', ParseUUIDPipe) orgId: string, @Req() req: AuthenticatedRequest) {
    return this.service.getAvailableSubjects(orgId, req.user);
  }

  @Put('people/departments/:departmentId/subjects')
  @ApiOperation({ summary: 'Update subjects mapped to an academic department' })
  updateDepartmentSubjects(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: { subjectIds: string[] },
  ) {
    return this.service.updateDepartmentSubjects(orgId, req.user, departmentId, dto.subjectIds || []);
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

  @Post('curriculum')
  @ApiOperation({ summary: 'Create curriculum chapter node' })
  createCurriculum(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCurriculumNodeDto,
  ) {
    return this.service.createCurriculumNode(orgId, req.user, dto);
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

  @Post('finance/record-payment')
  @ApiOperation({ summary: 'Record counter/offline fee payment' })
  recordPayment(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordOfflinePaymentDto,
  ) {
    return this.service.recordOfflinePayment(orgId, req.user, dto);
  }

  @Post('finance/batch-reminders')
  @ApiOperation({ summary: 'Dispatch batch fee reminders to parents of unpaid students' })
  batchReminders(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: BatchFeeReminderDto,
  ) {
    return this.service.batchSendFeeReminders(orgId, req.user, dto);
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

  @Post('operations/ptm')
  @ApiOperation({ summary: 'Schedule Next PTM Window' })
  schedulePtm(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SchedulePtmDto,
  ) {
    return this.service.createPtmSchedule(orgId, req.user, dto);
  }

  @Post('operations/transport')
  @ApiOperation({ summary: 'Add Transport Vehicle to Fleet' })
  addTransportVehicle(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTransportVehicleDto,
  ) {
    return this.service.createTransportVehicle(orgId, req.user, dto);
  }

  @Post('operations/library')
  @ApiOperation({ summary: 'Add Book to Library Catalog' })
  addLibraryBook(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateLibraryBookDto,
  ) {
    return this.service.createLibraryBook(orgId, req.user, dto);
  }

  @Post('operations/assets')
  @ApiOperation({ summary: 'Add Asset to School Inventory' })
  addAsset(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSchoolAssetDto,
  ) {
    return this.service.createSchoolAsset(orgId, req.user, dto);
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

  @Patch('settings/configuration')
  @ApiOperation({ summary: 'Update school identity, statutory attendance and workload policy configuration' })
  updateSchoolConfiguration(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSchoolConfigDto,
  ) {
    return this.service.updateSchoolConfiguration(orgId, req.user, dto);
  }
  @Get('learning/overview')
  getLearning(@Param('organizationId',ParseUUIDPipe) org:string,@Req() req:AuthenticatedRequest) {return this.service.getLearningOverview(org,req.user);}

  @Post('learning/coursework')
  @ApiOperation({ summary: 'Create and publish coursework assignment' })
  createCoursework(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCourseworkDto,
  ) {
    return this.service.createCoursework(orgId, req.user, dto);
  }

  @Post('learning/exams')
  @ApiOperation({ summary: 'Schedule school examination' })
  scheduleExam(
    @Param('organizationId', ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ScheduleExamDto,
  ) {
    return this.service.scheduleExam(orgId, req.user, dto);
  }
}
