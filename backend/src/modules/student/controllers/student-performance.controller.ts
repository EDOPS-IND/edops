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
import { StudentPerformanceService } from "../services/student-performance.service";

@ApiTags("Student Command Center")
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId/student", version: "1" })
export class StudentPerformanceController {
  constructor(private readonly performanceService: StudentPerformanceService) {}

  @Get("performance")
  @ApiOperation({
    summary:
      "Get overall academic growth, learning outcomes, competencies, and holistic card",
  })
  getPerformance(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.performanceService.getPerformance(organizationId, req.user?.id);
  }
}
