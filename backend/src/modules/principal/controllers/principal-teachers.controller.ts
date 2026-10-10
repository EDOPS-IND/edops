import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../../common/auth.guard";
import {
  AssignTeacherDevelopmentDto,
  RecordTeacherObservationDto,
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
}
