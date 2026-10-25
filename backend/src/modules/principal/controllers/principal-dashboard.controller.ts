import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../../common/auth.guard";
import { PrincipalReviewLeaveDto } from "../dto/principal.dto";
import { PrincipalGuard } from "../guards/principal.guard";
import { PrincipalDashboardService } from "../services/principal-dashboard.service";

@ApiTags("Principal Academic Command Center - Dashboard")
@ApiParam({ name: "organizationId", format: "uuid" })
@UseGuards(PrincipalGuard)
@Controller({ path: "organizations/:organizationId/principal", version: "1" })
export class PrincipalDashboardController {
  constructor(private readonly service: PrincipalDashboardService) {}

  @Get("dashboard")
  @ApiOperation({
    summary: "Principal Home Dashboard KPIs & Daily Academic Operations",
  })
  dashboard(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getDashboard(orgId, req.user);
  }

  @Get("learning-roster")
  @ApiOperation({ summary: "Published coursework and evaluation roster" })
  learningRoster(@Param("organizationId", ParseUUIDPipe) orgId: string) {
    return this.service.getLearningRoster(orgId);
  }

  @Get("learning-overview")
  @ApiOperation({
    summary:
      "Published assignments, submissions, study materials, and lesson activities",
  })
  learningOverview(@Param("organizationId", ParseUUIDPipe) orgId: string) {
    return this.service.getLearningOverview(orgId);
  }

  @Get("attendance")
  @ApiOperation({
    summary:
      "Student attendance, daily trend, register gaps, and faculty activity",
  })
  attendance(@Param("organizationId", ParseUUIDPipe) orgId: string) {
    return this.service.getAttendance(orgId);
  }

  @Get("academic-health")
  @ApiOperation({
    summary: "Explainable Academic Health Score & Factor Drill-down",
  })
  academicHealth(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getAcademicHealth(orgId, req.user);
  }

  @Get("search")
  @ApiOperation({
    summary:
      "Global Academic Search across Students, Teachers, Classes, Subjects",
  })
  search(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Query("q") q: string,
  ) {
    return this.service.globalSearch(orgId, req.user, q);
  }

  @Get("leaves")
  @ApiOperation({
    summary: "Get faculty and escalated student leave requests for Principal review",
  })
  leaves(@Param("organizationId", ParseUUIDPipe) orgId: string) {
    return this.service.getLeaves(orgId);
  }

  @Patch("leaves/:id/status")
  @ApiOperation({
    summary: "Approve or reject a staff or student leave request as Principal",
  })
  updateLeaveStatus(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: PrincipalReviewLeaveDto,
  ) {
    return this.service.updateLeaveStatus(orgId, req.user, id, dto.status, dto.reviewNotes);
  }
}
