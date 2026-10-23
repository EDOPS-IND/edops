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
import {
  AuthenticatedRequest,
  RequireFeature,
} from "../../../common/auth.guard";
import {
  CreateQuestionPaperDto,
  CreateExamPlanDto,
  CreateExamPlansDto,
  PublishExamResultsDto,
  ReviewExamResultDto,
  ReviewQuestionPaperDto,
  UpdateExamPlanDto,
} from "../dto/principal.dto";
import { AllowSchoolAdminExamCreate, PrincipalGuard } from "../guards/principal.guard";
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
  @RequireFeature("assessments")
  @ApiOperation({
    summary: "Assessments overview and Question Paper review pipeline",
  })
  assessments(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getAssessmentsOverview(orgId, req.user);
  }

  @Post("question-papers")
  @RequireFeature("assessments")
  @ApiOperation({
    summary: "Register or draft Question Paper for blueprint review",
  })
  createQuestionPaper(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateQuestionPaperDto,
  ) {
    return this.service.createQuestionPaper(orgId, req.user, dto);
  }

  @Patch("question-papers/:id/status")
  @RequireFeature("assessments")
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
  @RequireFeature("exams")
  @ApiOperation({
    summary: "Examinations, Schedules, and Marks Verification Pipeline",
  })
  examinations(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.getExaminationsOverview(orgId, req.user);
  }

  @Post("examinations/plans")
  @AllowSchoolAdminExamCreate()
  @RequireFeature("exams")
  createExamPlan(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateExamPlanDto,
  ) {
    return this.service.createExamPlan(orgId, req.user, dto);
  }

  @Post("examinations/plans/bulk")
  @AllowSchoolAdminExamCreate()
  @RequireFeature("exams")
  createExamPlans(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateExamPlansDto,
  ) {
    return this.service.createExamPlans(orgId, req.user, dto);
  }

  @Patch("examinations/plans/:id")
  @RequireFeature("exams")
  updateExamPlan(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateExamPlanDto,
  ) {
    return this.service.updateExamPlan(orgId, id, dto);
  }

  @Post("examinations/evaluations/:id/import")
  @RequireFeature("exams")
  importTeacherMarks(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.importTeacherMarks(orgId, id);
  }

  @Patch("examinations/results/:id")
  @RequireFeature("exams")
  reviewExamResult(
    @Param("organizationId", ParseUUIDPipe) orgId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReviewExamResultDto,
  ) {
    return this.service.reviewExamResult(orgId, id, dto);
  }

  @Post("examinations/publish-results")
  @RequireFeature("exams")
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
