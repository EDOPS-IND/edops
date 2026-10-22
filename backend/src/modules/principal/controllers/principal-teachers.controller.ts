import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../../common/auth.guard";
import {
  AssignTeacherDevelopmentDto,
  RecordTeacherObservationDto,
  PrincipalDepartmentDto,
  PrincipalTeacherLinkDto,
  PrincipalTeacherAssignmentDto,
} from "../dto/principal.dto";
import { PrincipalGuard } from "../guards/principal.guard";
import { PrincipalTeachersService } from "../services/principal-teachers.service";

@ApiTags("Principal Academic Command Center - People & Teachers")
@ApiParam({ name: "organizationId", format: "uuid" })
@UseGuards(PrincipalGuard)
@Controller({
  path: "organizations/:organizationId/principal/teachers",
  version: "1",
})
export class PrincipalTeachersController {
  constructor(private readonly service: PrincipalTeachersService) {}

  @Get()
  @ApiOperation({
    summary:
      "Academic Teacher Management list with calculated workload and compliance",
  })
  teachers(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getTeachersOverview(orgId, req.user);
  }

  @Get(":teacherId/academic-profile")
  @ApiParam({ name: "teacherId", format: "uuid" })
  @ApiOperation({ summary: "Teacher Academic Profile 14-tab dossier" })
  profile(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("teacherId", ParseUUIDPipe) teacherId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getTeacherAcademicProfile(orgId, req.user, teacherId);
  }

  @Post("observations")
  @ApiOperation({
    summary: "Record Classroom Walkthrough / Academic Observation",
  })
  recordObservation(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordTeacherObservationDto,
  ) {
    return this.service.recordObservation(orgId, req.user, dto);
  }

  @Post("development")
  @ApiOperation({
    summary: "Assign Professional Development / CBE Training to Teacher",
  })
  assignDevelopment(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AssignTeacherDevelopmentDto,
  ) {
    return this.service.assignDevelopment(orgId, req.user, dto);
  }

  @Patch("development/:id/complete")
  completeDevelopment(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.completeDevelopment(orgId, id);
  }

  @Post("departments")
  createDepartment(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Body() dto: PrincipalDepartmentDto,
  ) {
    return this.service.createDepartment(orgId, dto.name, dto.code);
  }

  @Post("department-heads")
  assignDepartmentHead(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Body() dto: PrincipalTeacherLinkDto,
  ) {
    return this.service.assignDepartmentHead(
      orgId,
      dto.departmentId,
      dto.teacherUserId,
    );
  }

  @Post("coordinators")
  assignCoordinator(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: PrincipalTeacherLinkDto,
  ) {
    return this.service.assignCoordinator(
      orgId,
      req.user,
      dto.departmentId,
      dto.teacherUserId,
    );
  }

  @Post("assignments")
  assignTeacher(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Body() dto: PrincipalTeacherAssignmentDto,
  ) {
    return this.service.assignTeacher(
      orgId,
      dto.sectionId,
      dto.subjectId,
      dto.teacherUserId,
    );
  }
}
