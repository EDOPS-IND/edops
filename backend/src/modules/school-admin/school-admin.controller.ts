import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../common/auth.guard";
import {
  AssignSchoolAdminTeacherDto,
  BatchFeeReminderDto,
  BulkCreateCurriculumDto,
  CreateBroadcastDto,
  CreateCourseworkDto,
  CreateCurriculumNodeDto,
  CreateDepartmentDto,
  UpdateDepartmentHodDto,
  UpdateMemberStatusDto,
  CreateDisciplineIncidentDto,
  CreateFeeStructureDto,
  CreateLeaveRequestDto,
  CreateLibraryBookDto,
  CreateSchoolAssetDto,
  CreateSchoolDocumentDto,
  CompleteSchoolDocumentDto,
  CreateTimetableEntryDto,
  CreateTransportVehicleDto,
  DirectAdmitStudentDto,
  BulkImportCsvDto,
  GrantFeeConcessionDto,
  RecordOfflinePaymentDto,
  ReplyCommunicationTicketDto,
  SendDirectCommunicationDto,
  SchedulePtmDto,
  SendFeeReminderDto,
  UpdateLeaveStatusDto,
  UpdateParentChildrenDto,
  UpdateSchoolAdminClassTeacherDto,
  UpdateSchoolConfigDto,
  UpdateCommunicationStatusDto,
  UpdateTeacherEmploymentDto,
  UpdateTimetableEntryDto,
} from "./school-admin.dto";
import { SchoolAdminService } from "./school-admin.service";
import { CommunicationRealtimeService } from "./communication-realtime.service";

@ApiTags("School Admin Control Center")
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({
  path: "organizations/:organizationId/school-admin",
  version: "1",
})
export class SchoolAdminController {
  constructor(private readonly service: SchoolAdminService, private readonly realtime: CommunicationRealtimeService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "School Admin Dashboard & Health Score" })
  dashboard(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getDashboard(orgId, req.user);
  }

  @Get("people/students")
  @ApiOperation({ summary: "List enrolled students with profile summaries" })
  students(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Query("limit") limit = "50",
    @Query("offset") offset = "0",
    @Query("search") search?: string,
    @Query("sectionId") sectionId?: string,
  ) {
    return this.service.getStudents(orgId, req.user, {
      limit: Math.min(Math.max(Number(limit) || 50, 1), 100),
      offset: Math.max(Number(offset) || 0, 0),
      search,
      sectionId,
    });
  }

  @Post("people/students/direct")
  @ApiOperation({
    summary:
      "Directly admit student to roster without sending an invitation email",
  })
  directAdmitStudent(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: DirectAdmitStudentDto,
  ) {
    return this.service.directAdmitStudent(orgId, req.user, dto);
  }

  @Post("people/students/import-csv")
  @ApiOperation({
    summary:
      "Bulk import students from CSV with human-readable Class and Section resolution",
  })
  importStudentsCsv(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: BulkImportCsvDto,
  ) {
    return this.service.bulkImportStudentsCsv(orgId, req.user, dto.csv, dto.directAdmit);
  }

  @Post("people/students/:studentId/send-invite")
  @ApiParam({ name: "studentId", format: "uuid" })
  @ApiOperation({
    summary: "Generate and send an invitation link to an admitted student",
  })
  sendStudentInvite(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("studentId", ParseUUIDPipe) studentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.sendStudentInvite(orgId, req.user, studentId);
  }

  @Get("people/students/:studentId/360")
  @ApiParam({ name: "studentId", format: "uuid" })
  @ApiOperation({ summary: "Detailed 13-tab student 360 profile dossier" })
  student360(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("studentId", ParseUUIDPipe) studentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getStudent360(orgId, req.user, studentId);
  }

  @Get("people/teachers")
  @ApiOperation({
    summary: "List teachers with workload and weekly period distribution",
  })
  teachers(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getTeachers(orgId, req.user);
  }

  @Patch("people/teachers/:teacherId/employment")
  @ApiOperation({
    summary: "Update teacher employee ID and employment contract type",
  })
  updateTeacherEmployment(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("teacherId", ParseUUIDPipe) teacherId: string,
    @Body() dto: UpdateTeacherEmploymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.updateTeacherEmployment(
      orgId,
      req.user,
      teacherId,
      dto,
    );
  }

  @Post("people/teachers/import-csv")
  @ApiOperation({
    summary:
      "Bulk import teachers from CSV with department, employeeId, and employment contract type",
  })
  importTeachersCsv(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: BulkImportCsvDto,
  ) {
    return this.service.bulkImportTeachersCsv(orgId, req.user, dto.csv);
  }

  @Get("people/staff")
  @ApiOperation({ summary: "List administrative and operational school staff" })
  staff(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getStaff(orgId, req.user);
  }

  @Get("people/parents")
  @ApiOperation({ summary: "List registered parents with ward mappings" })
  parents(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Query("limit") limit = "50",
    @Query("offset") offset = "0",
    @Query("search") search?: string,
  ) {
    return this.service.getParents(orgId, req.user, {
      limit: Math.min(Math.max(Number(limit) || 50, 1), 100),
      offset: Math.max(Number(offset) || 0, 0),
      search,
    });
  }

  @Put("people/parents/:parentId/children")
  @ApiOperation({ summary: "Update mapped wards for an existing parent" })
  updateParentChildren(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("parentId", ParseUUIDPipe) parentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateParentChildrenDto,
  ) {
    return this.service.updateParentChildren(
      orgId,
      req.user,
      parentId,
      dto.studentUserIds,
    );
  }

  @Patch("people/members/:userId/status")
  @ApiOperation({ summary: "Update school member status (active, inactive, withdrawn) with automatic parent cascade" })
  updateMemberStatus(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    return this.service.updateMemberStatus(orgId, req.user, userId, dto);
  }

  @Delete("people/members/:userId")
  @ApiOperation({ summary: "Delete school member record completely" })
  deleteMember(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() req: AuthenticatedRequest,
    @Query("role") role?: string,
  ) {
    return this.service.deleteMember(orgId, req.user, userId, role);
  }

  @Get("people/departments")
  @ApiOperation({
    summary:
      "List academic departments with faculty load and syllabus progress",
  })
  departments(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getDepartments(orgId, req.user);
  }

  @Get("people/departments/available-subjects")
  @ApiOperation({
    summary: "List all subjects available for department mapping",
  })
  availableSubjects(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getAvailableSubjects(orgId, req.user);
  }

  @Put("people/departments/:departmentId/subjects")
  @ApiOperation({ summary: "Update subjects mapped to an academic department" })
  updateDepartmentSubjects(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("departmentId", ParseUUIDPipe) departmentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: { subjectIds: string[] },
  ) {
    return this.service.updateDepartmentSubjects(
      orgId,
      req.user,
      departmentId,
      dto.subjectIds || [],
    );
  }

  @Put("people/departments/:departmentId/hod")
  @ApiOperation({ summary: "Assign, update, or remove Head of Department (HOD)" })
  updateDepartmentHod(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("departmentId", ParseUUIDPipe) departmentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateDepartmentHodDto,
  ) {
    return this.service.updateDepartmentHod(
      orgId,
      req.user,
      departmentId,
      dto.teacherId,
    );
  }

  @Delete("people/departments/:departmentId")
  @ApiOperation({ summary: "Delete an academic department and unlink its subjects" })
  deleteDepartment(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("departmentId", ParseUUIDPipe) departmentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deleteDepartment(orgId, req.user, departmentId);
  }

  @Post("people/departments")
  @ApiOperation({ summary: "Create new academic department" })
  createDepartment(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.service.createDepartment(orgId, req.user, dto);
  }

  @Get("academics/overview")
  @ApiOperation({
    summary: "Academics overview with capacity check and syllabus",
  })
  academicsOverview(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getAcademicsOverview(orgId, req.user);
  }

  @Get("academics/sections/:sectionId/overview")
  @ApiOperation({
    summary:
      "Detailed class & section overview with faculty allocation and roster",
  })
  sectionOverview(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getSectionDetail(orgId, req.user, sectionId);
  }

  @Patch("academics/sections/:sectionId/class-teacher")
  @ApiOperation({ summary: "Assign or update class teacher for a section" })
  updateClassTeacher(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSchoolAdminClassTeacherDto,
  ) {
    return this.service.updateClassTeacher(
      orgId,
      req.user,
      sectionId,
      dto.teacherUserId ?? null,
    );
  }

  @Post("academics/sections/:sectionId/assign-teacher")
  @ApiOperation({ summary: "Assign subject teacher to section" })
  assignSectionSubjectTeacher(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AssignSchoolAdminTeacherDto,
  ) {
    return this.service.assignSectionSubjectTeacher(
      orgId,
      req.user,
      sectionId,
      dto.subjectId,
      dto.teacherUserId,
    );
  }

  @Delete("academics/sections/:sectionId/subjects/:subjectId")
  @ApiOperation({ summary: "Remove/unallocate a subject from a class section" })
  removeSectionSubject(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("sectionId", ParseUUIDPipe) sectionId: string,
    @Param("subjectId", ParseUUIDPipe) subjectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.removeSectionSubject(
      orgId,
      req.user,
      sectionId,
      subjectId,
    );
  }

  @Post("curriculum")
  @ApiOperation({ summary: "Create curriculum chapter node" })
  createCurriculum(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCurriculumNodeDto,
  ) {
    return this.service.createCurriculumNode(orgId, req.user, dto);
  }

  @Post("curriculum/bulk")
  @ApiOperation({
    summary:
      "Bulk create or update curriculum chapters for a class and subject",
  })
  bulkCreateCurriculum(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: BulkCreateCurriculumDto,
  ) {
    return this.service.bulkCreateCurriculumNodes(orgId, req.user, dto);
  }

  @Delete("curriculum/:chapterId")
  @ApiOperation({ summary: "Delete a curriculum chapter node" })
  deleteCurriculum(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("chapterId", ParseUUIDPipe) chapterId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deleteCurriculumNode(orgId, req.user, chapterId);
  }

  @Get("timetable")
  @ApiOperation({
    summary: "Timetable matrix schedule with conflict detection",
  })
  timetable(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Query("sectionId") sectionId?: string,
  ) {
    return this.service.getTimetable(orgId, req.user, sectionId);
  }

  @Post("timetable")
  @ApiOperation({ summary: "Create timetable entry with clash detection" })
  createTimetable(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTimetableEntryDto,
  ) {
    return this.service.createTimetableEntry(orgId, req.user, dto);
  }

  @Patch("timetable/:id")
  @ApiOperation({ summary: "Update timetable entry with clash detection" })
  updateTimetable(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateTimetableEntryDto,
  ) {
    return this.service.updateTimetableEntry(orgId, req.user, id, dto);
  }

  @Delete("timetable/:id")
  @ApiOperation({ summary: "Delete timetable entry" })
  deleteTimetable(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.deleteTimetableEntry(orgId, req.user, id);
  }

  @Get("attendance/registers")
  @ApiOperation({ summary: "Daily attendance registers & defaulters desk" })
  attendance(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getAttendanceRegisters(orgId, req.user);
  }

  @Get("leaves")
  @ApiOperation({ summary: "Student & Faculty leave applications" })
  leaves(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getLeaves(orgId, req.user);
  }

  @Post("leaves")
  @ApiOperation({ summary: "Submit leave application" })
  createLeave(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.service.createLeaveRequest(orgId, req.user, dto);
  }

  @Patch("leaves/:id/status")
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOperation({ summary: "Approve or reject leave request" })
  updateLeaveStatus(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    return this.service.updateLeaveStatus(orgId, req.user, id, dto);
  }

  @Get("finance/overview")
  @ApiOperation({ summary: "Fee collection metrics, structures & defaulters" })
  finance(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getFinanceOverview(orgId, req.user);
  }

  @Post("finance/structures")
  @ApiOperation({ summary: "Create grade fee structure" })
  createFeeStructure(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateFeeStructureDto,
  ) {
    return this.service.createFeeStructure(orgId, req.user, dto);
  }

  @Post("finance/send-reminder")
  @ApiOperation({ summary: "Dispatch overdue fee reminder via WhatsApp/SMS" })
  sendFeeReminder(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendFeeReminderDto,
  ) {
    return this.service.sendFeeReminder(orgId, req.user, dto);
  }

  @Post("finance/grant-concession")
  @ApiOperation({ summary: "Grant audited fee concession to student" })
  grantConcession(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: GrantFeeConcessionDto,
  ) {
    return this.service.grantFeeConcession(orgId, req.user, dto);
  }

  @Post("finance/record-payment")
  @ApiOperation({ summary: "Record counter/offline fee payment" })
  recordPayment(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordOfflinePaymentDto,
  ) {
    return this.service.recordOfflinePayment(orgId, req.user, dto);
  }

  @Post("finance/batch-reminders")
  @ApiOperation({
    summary: "Dispatch batch fee reminders to parents of unpaid students",
  })
  batchReminders(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: BatchFeeReminderDto,
  ) {
    return this.service.batchSendFeeReminders(orgId, req.user, dto);
  }

  @Get("communication/broadcasts")
  @ApiOperation({ summary: "List dispatched multi-channel school broadcasts" })
  broadcasts(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getBroadcasts(orgId, req.user);
  }

  @Post("communication/broadcast")
  @ApiOperation({ summary: "Send multi-channel broadcast notice" })
  createBroadcast(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBroadcastDto,
  ) {
    return this.service.createBroadcast(orgId, req.user, dto);
  }

  @Get("communication/events")
  @ApiOperation({ summary: "Stream live communication events" })
  communicationEvents(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    this.realtime.connect(orgId, req.user.id, response);
  }

  @Get("communication/recipients")
  @ApiOperation({ summary: "Search active direct-message recipients" })
  recipients(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Query("role") role?: string,
    @Query("search") search = "",
  ) {
    return this.service.getCommunicationRecipients(orgId, req.user, role, search);
  }

  @Get("communication/conversations")
  @ApiOperation({ summary: "List direct-message conversations" })
  conversations(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getCommunicationConversations(orgId, req.user);
  }

  @Get("communication/conversations/:conversationId")
  @ApiOperation({ summary: "Read a direct-message conversation" })
  conversation(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getCommunicationConversation(orgId, req.user, conversationId);
  }

  @Post("communication/messages")
  @ApiOperation({ summary: "Send a direct message or conversation reply" })
  sendDirectMessage(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendDirectCommunicationDto,
  ) {
    return this.service.sendDirectCommunication(orgId, req.user, dto);
  }

  @Patch("communication/conversations/:conversationId/read")
  @ApiOperation({ summary: "Mark a conversation read" })
  markConversationRead(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.markCommunicationConversationRead(orgId, req.user, conversationId);
  }

  @Patch("communication/conversations/:conversationId/status")
  @ApiOperation({ summary: "Update a conversation status" })
  updateConversationStatus(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCommunicationStatusDto,
  ) {
    return this.service.updateCommunicationStatus(orgId, req.user, conversationId, dto);
  }

  @Get("communication/tickets")
  @ApiOperation({
    summary: "List incoming teacher messages and communication tickets",
  })
  tickets(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getCommunicationTickets(orgId, req.user);
  }

  @Post("communication/tickets/:ticketId/reply")
  @ApiOperation({ summary: "Reply to a communication ticket" })
  replyToTicket(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("ticketId", ParseUUIDPipe) ticketId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReplyCommunicationTicketDto,
  ) {
    return this.service.replyToCommunicationTicket(orgId, req.user, ticketId, dto);
  }

  @Get("operations/overview")
  @ApiOperation({
    summary: "Transport fleet, library circulation, assets and PTMs",
  })
  operations(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getOperationsOverview(orgId, req.user);
  }

  @Post("operations/ptm")
  @ApiOperation({ summary: "Schedule Next PTM Window" })
  schedulePtm(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SchedulePtmDto,
  ) {
    return this.service.createPtmSchedule(orgId, req.user, dto);
  }

  @Post("operations/transport")
  @ApiOperation({ summary: "Add Transport Vehicle to Fleet" })
  addTransportVehicle(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTransportVehicleDto,
  ) {
    return this.service.createTransportVehicle(orgId, req.user, dto);
  }

  @Post("operations/library")
  @ApiOperation({ summary: "Add Book to Library Catalog" })
  addLibraryBook(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateLibraryBookDto,
  ) {
    return this.service.createLibraryBook(orgId, req.user, dto);
  }

  @Post("operations/assets")
  @ApiOperation({ summary: "Add Asset to School Inventory" })
  addAsset(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSchoolAssetDto,
  ) {
    return this.service.createSchoolAsset(orgId, req.user, dto);
  }

  @Get("governance/overview")
  @ApiOperation({
    summary: "Governance alerts, discipline log and immutable audit trail",
  })
  governance(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getGovernanceOverview(orgId, req.user);
  }

  @Post("governance/discipline")
  @ApiOperation({ summary: "Record confidential discipline incident" })
  createDiscipline(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDisciplineIncidentDto,
  ) {
    return this.service.createDisciplineIncident(orgId, req.user, dto);
  }

  @Post("governance/documents")
  @ApiOperation({ summary: "Create a school document upload" })
  createSchoolDocument(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSchoolDocumentDto,
  ) {
    return this.service.createSchoolDocument(orgId, req.user, dto);
  }

  @Post("governance/documents/:documentId/complete")
  @ApiParam({ name: "documentId", format: "uuid" })
  @ApiOperation({ summary: "Complete and verify a school document upload" })
  completeSchoolDocument(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CompleteSchoolDocumentDto,
  ) {
    return this.service.completeSchoolDocument(orgId, req.user, documentId, dto);
  }

  @Get("governance/documents/:documentId/download")
  @ApiParam({ name: "documentId", format: "uuid" })
  @ApiOperation({ summary: "Get a short-lived school document download URL" })
  downloadSchoolDocument(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.downloadSchoolDocument(orgId, req.user, documentId);
  }

  @Patch("settings/configuration")
  @ApiOperation({
    summary:
      "Update school identity, statutory attendance and workload policy configuration",
  })
  updateSchoolConfiguration(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSchoolConfigDto,
  ) {
    return this.service.updateSchoolConfiguration(orgId, req.user, dto);
  }
  @Get("learning/overview")
  getLearning(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getLearningOverview(org, req.user);
  }

  @Post("learning/coursework")
  @ApiOperation({ summary: "Create and publish coursework assignment" })
  createCoursework(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCourseworkDto,
  ) {
    return this.service.createCoursework(orgId, req.user, dto);
  }

}
