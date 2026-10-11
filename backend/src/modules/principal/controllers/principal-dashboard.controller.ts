import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../../common/auth.guard";
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
}
