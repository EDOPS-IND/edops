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
  CreateEnrichmentProgramDto,
  CreateRemedialProgramDto,
  CreateStudentInterventionDto,
} from "../dto/principal.dto";
import { PrincipalGuard } from "../guards/principal.guard";
import { PrincipalStudentsService } from "../services/principal-students.service";

@ApiTags("Principal Academic Command Center - Students & Interventions")
@ApiParam({ name: "organizationId", format: "uuid" })
@UseGuards(PrincipalGuard)
@Controller({
  path: "organizations/:organizationId/principal/students",
  version: "1",
})
export class PrincipalStudentsController {
  constructor(private readonly service: PrincipalStudentsService) {}

  @Get()
  @ApiOperation({ summary: "Student academic performance cohort list" })
  students(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getStudentsOverview(orgId, req.user);
  }

  @Get("at-risk")
  @ApiOperation({
    summary:
      "At-Risk Attention Engine (Academic Drop, Attendance Defaulters, LO Gaps)",
  })
  atRisk(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getAtRiskStudents(orgId, req.user);
  }

  @Get(":studentId/360")
  @ApiParam({ name: "studentId" })
  @ApiOperation({ summary: "Student 360 Academic Profile 13-tab dossier" })
  student360(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("studentId") studentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getStudent360(orgId, req.user, studentId);
  }

  @Post("interventions")
  @ApiOperation({ summary: "Create Student Academic Intervention Plan" })
  createIntervention(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStudentInterventionDto,
  ) {
    return this.service.createIntervention(orgId, req.user, dto);
  }

  @Post("remedial-programs")
  @ApiOperation({ summary: "Create Remedial Class / Booster Camp program" })
  createRemedial(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRemedialProgramDto,
  ) {
    return this.service.createRemedialProgram(orgId, req.user, dto);
  }

  @Post("enrichment-programs")
  @ApiOperation({ summary: "Create Olympiad & Scholars Enrichment program" })
  createEnrichment(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEnrichmentProgramDto,
  ) {
    return this.service.createEnrichmentProgram(orgId, req.user, dto);
  }
}
