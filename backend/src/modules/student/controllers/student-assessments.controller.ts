import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../../common/auth.guard";
import { StudentGuard } from "../guards/student.guard";
import { StudentAssessmentsService } from "../services/student-assessments.service";

@ApiTags("Student Command Center")
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId/student", version: "1" })
export class StudentAssessmentsController {
  constructor(private readonly assessmentsService: StudentAssessmentsService) {}

  @Get("assessments")
  @ApiOperation({
    summary: "Get formative assessments, unit tests, and published scores",
  })
  getAssessments(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assessmentsService.getAssessments(organizationId, req.user?.id);
  }
}
