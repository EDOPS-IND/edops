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
  PublishExamResultsDto,
  ReviewQuestionPaperDto,
} from "../dto/principal.dto";
import { PrincipalGuard } from "../guards/principal.guard";
import { PrincipalAssessmentsService } from "../services/principal-assessments.service";

@ApiTags("Principal Academic Command Center - Assessments & Examinations")
@ApiParam({ name: "organizationId", format: "uuid" })
@UseGuards(PrincipalGuard)
@Controller({
  path: "organizations/:organizationId/principal/assessments",
  version: "1",
})
export class PrincipalAssessmentsController {
  constructor(private readonly service: PrincipalAssessmentsService) {}

  @Get()
  @ApiOperation({
    summary: "Assessments overview and Question Paper review pipeline",
  })
  assessments(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getAssessmentsOverview(orgId, req.user);
  }

  @Patch("question-papers/:id/status")
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Approve, review or publish Question Paper" })
  reviewQuestionPaper(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("id") paperId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReviewQuestionPaperDto,
  ) {
    return this.service.reviewQuestionPaper(orgId, req.user, paperId, dto);
  }

  @Get("examinations")
  @ApiOperation({
    summary: "Examinations, Schedules, and Marks Verification Pipeline",
  })
  examinations(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getExaminationsOverview(orgId, req.user);
  }

  @Post("examinations/publish-results")
  @ApiOperation({
    summary: "Controlled Exam Results Publication Approval & Tamper Lock",
  })
  publishResults(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: PublishExamResultsDto,
  ) {
    return this.service.publishResults(orgId, req.user, dto);
  }
}
