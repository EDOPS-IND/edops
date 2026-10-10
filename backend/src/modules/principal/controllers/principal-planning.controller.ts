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
  CreateAcademicPlanDto,
  CreateAcademicTargetDto,
  CreateActionPlanDto,
  RecordAcademicMeetingDto,
} from "../dto/principal.dto";
import { PrincipalGuard } from "../guards/principal.guard";
import { PrincipalPlanningService } from "../services/principal-planning.service";

@ApiTags("Principal Academic Command Center - Planning")
@ApiParam({ name: "organizationId", format: "uuid" })
@UseGuards(PrincipalGuard)
@Controller({
  path: "organizations/:organizationId/principal/planning",
  version: "1",
})
export class PrincipalPlanningController {
  constructor(private readonly service: PrincipalPlanningService) {}

  @Get()
  @ApiOperation({
    summary:
      "Academic Planning Overview (Annual Plans, Targets, Action Plans, Meetings)",
  })
  overview(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getPlanningOverview(orgId, req.user);
  }

  @Post("academic-plans")
  @ApiOperation({ summary: "Create or update Annual Pedagogical Plan" })
  createAcademicPlan(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAcademicPlanDto,
  ) {
    return this.service.createAcademicPlan(orgId, req.user, dto);
  }

  @Post("targets")
  @ApiOperation({ summary: "Create measurable School Academic Target" })
  createTarget(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAcademicTargetDto,
  ) {
    return this.service.createTarget(orgId, req.user, dto);
  }

  @Post("action-plans")
  @ApiOperation({
    summary:
      "Create Academic Action Plan for performance dips or curriculum delays",
  })
  createActionPlan(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateActionPlanDto,
  ) {
    return this.service.createActionPlan(orgId, req.user, dto);
  }

  @Post("review-meetings")
  @ApiOperation({
    summary: "Record Academic Review Meeting proceedings and decisions",
  })
  recordMeeting(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RecordAcademicMeetingDto,
  ) {
    return this.service.recordMeeting(orgId, req.user, dto);
  }
}
