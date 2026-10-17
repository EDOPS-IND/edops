import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../common/auth.guard";
import { ApiErrors } from "../../common/api-docs";
import { SchoolEndpoint } from "../../common/school-api-docs";
import {
  AcademicListDto,
  AcademicYearDto,
  BatchPromotionDto,
  EnrollmentDto,
  ProgramDto,
  SectionDto,
  SectionListDto,
  SectionResourceListDto,
  SubjectDto,
  TeacherAssignmentDto,
  TransferEnrollmentDto,
  UpdateAcademicYearDto,
  UpdateEnrollmentDto,
  UpdateProgramDto,
  UpdateSectionDto,
  UpdateSubjectDto,
  UpdateTeacherAssignmentDto,
} from "./academic.dto";
import {
  AcademicYear,
  ClassSubjectAssignment,
  Enrollment,
  Program,
  Section,
  Subject,
} from "./academic.entity";
import { AcademicsService } from "./academics.service";

@ApiTags("Academics")
@ApiParam({
  name: "organizationId",
  format: "uuid",
  description: "School UUID from your active membership.",
})
@Controller({ path: "organizations/:organizationId/academics", version: "1" })
export class AcademicsController {
  constructor(private readonly academics: AcademicsService) {}

  @Get("my-workspace")
  @ApiOperation({
    summary: "Get role-scoped teacher or student academics",
    security: [{ cookie: [] }],
    description:
      "Teachers receive only their own section/subject assignments and active students in those sections. Students receive only their active enrollment and subjects assigned to that section.",
  })
  @ApiOkResponse({ description: "Role-scoped academic workspace." })
  @ApiErrors(401, 403, 404, 429, 500)
  workspace(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academics.roleWorkspace(org, req.user);
  }

  @Get("years")
  @SchoolEndpoint("List academic years", "read", AcademicYear, true)
  years(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: AcademicListDto,
  ) {
    return this.academics.list(org, req.user, AcademicYear, query);
  }
  @Post("years")
  @SchoolEndpoint(
    "Create an academic year",
    "create",
    AcademicYear,
    false,
    "Dates must be valid calendar dates in YYYY-MM-DD format. Setting isCurrent=true clears the previous current year atomically.",
  )
  createYear(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AcademicYearDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.academics.createYear(org, req.user, dto, key);
  }
  @Patch("years/:id")
  @ApiParam({ name: "id", format: "uuid" })
  @SchoolEndpoint(
    "Update an academic year",
    "update",
    AcademicYear,
    false,
    "Omitted fields are preserved. At least one field is required. endDate cannot precede startDate.",
  )
  updateYear(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.academics.updateYear(org, req.user, id, dto);
  }
  @Get("programs")
  @SchoolEndpoint("List grades/programs", "read", Program, true)
  programs(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: AcademicListDto,
  ) {
    return this.academics.list(org, req.user, Program, query);
  }
  @Post("programs")
  @SchoolEndpoint("Create a grade/program", "create", Program)
  createProgram(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ProgramDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.academics.createProgram(org, req.user, dto, key);
  }
  @Patch("programs/:id")
  @ApiParam({ name: "id", format: "uuid" })
  @SchoolEndpoint("Update a grade/program", "update", Program)
  updateProgram(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.academics.updateProgram(org, req.user, id, dto);
  }
  @Get("subjects")
  @SchoolEndpoint("List subjects", "read", Subject, true)
  subjects(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: AcademicListDto,
  ) {
    return this.academics.list(org, req.user, Subject, query);
  }
  @Post("subjects")
  @SchoolEndpoint(
    "Create a subject",
    "create",
    Subject,
    false,
    "Subject codes are trimmed, uppercased and unique per school.",
  )
  createSubject(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubjectDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.academics.createSubject(org, req.user, dto, key);
  }
  @Patch("subjects/:id")
  @ApiParam({ name: "id", format: "uuid" })
  @SchoolEndpoint("Update a subject", "update", Subject)
  updateSubject(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.academics.updateSubject(org, req.user, id, dto);
  }
  @Get("sections")
  @SchoolEndpoint(
    "List sections/classes",
    "read",
    Section,
    true,
    "Optionally filter by academicYearId.",
  )
  sections(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: SectionListDto,
  ) {
    return this.academics.listSections(org, req.user, query);
  }
  @Post("sections")
  @SchoolEndpoint(
    "Create a section/class",
    "create",
    Section,
    false,
    "The year and grade must belong to this school. Names are unique within year and grade.",
  )
  createSection(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SectionDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.academics.createSection(org, req.user, dto, key);
  }
  @Patch("sections/:id")
  @ApiParam({ name: "id", format: "uuid" })
  @SchoolEndpoint(
    "Update section name/capacity",
    "update",
    Section,
    false,
    "Year and grade are immutable here. Capacity cannot be below active enrollments.",
  )
  updateSection(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.academics.updateSection(org, req.user, id, dto);
  }
  @Get("teacher-assignments")
  @SchoolEndpoint(
    "List section/subject teacher assignments",
    "read",
    ClassSubjectAssignment,
    true,
    "Optionally filter by sectionId. One teacher per section/subject.",
  )
  teachers(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: SectionResourceListDto,
  ) {
    return this.academics.listSectionRecords(
      org,
      req.user,
      "assignments",
      query,
    );
  }
  @Post("teacher-assignments")
  @SchoolEndpoint(
    "Assign a teacher to a section and subject",
    "create",
    ClassSubjectAssignment,
    false,
    "Requires an active teacher account and membership in this school.",
  )
  assign(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: TeacherAssignmentDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.academics.assignTeacher(org, req.user, dto, key);
  }
  @Patch("teacher-assignments/:id")
  @ApiParam({ name: "id", format: "uuid" })
  @SchoolEndpoint(
    "Replace the assigned teacher",
    "update",
    ClassSubjectAssignment,
  )
  updateTeacher(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateTeacherAssignmentDto,
  ) {
    return this.academics.updateTeacher(org, req.user, id, dto);
  }
  @Get("enrollments")
  @SchoolEndpoint(
    "List enrollments including historical statuses",
    "read",
    Enrollment,
    true,
    "Optionally filter by sectionId.",
  )
  enrollments(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: SectionResourceListDto,
  ) {
    return this.academics.listSectionRecords(
      org,
      req.user,
      "enrollments",
      query,
    );
  }
  @Post("enrollments")
  @SchoolEndpoint(
    "Enroll a student",
    "create",
    Enrollment,
    false,
    "Derives academicYearId from the section. Enforces capacity, unique active roll number and one active section per student per year.",
  )
  enroll(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: EnrollmentDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.academics.enroll(org, req.user, dto, key);
  }
  @Patch("enrollments/:id")
  @ApiParam({ name: "id", format: "uuid" })
  @SchoolEndpoint(
    "Update an active enrollment roll number",
    "update",
    Enrollment,
  )
  updateEnrollment(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.academics.updateEnrollment(org, req.user, id, dto);
  }
  @Patch("enrollments/:id/withdraw")
  @ApiParam({ name: "id", format: "uuid" })
  @SchoolEndpoint(
    "Withdraw an active enrollment",
    "update",
    Enrollment,
    false,
    "No request body. Retains enrollment history and releases the section seat.",
  )
  withdraw(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.academics.withdraw(org, req.user, id);
  }
  @Post("enrollments/:id/transfer")
  @ApiParam({ name: "id", format: "uuid" })
  @SchoolEndpoint(
    "Transfer a student to another section",
    "create",
    Enrollment,
    false,
    "Same academic year only. Marks the old enrollment transferred and creates the new one in the same transaction. Failure leaves the original enrollment active.",
  )
  transfer(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: TransferEnrollmentDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.academics.transfer(org, req.user, id, dto, key);
  }

  @Post("enrollments/batch-promote")
  @ApiOperation({ summary: "Batch promote or graduate students across academic years" })
  batchPromote(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: BatchPromotionDto,
  ) {
    return this.academics.batchPromote(org, req.user, dto);
  }
}
