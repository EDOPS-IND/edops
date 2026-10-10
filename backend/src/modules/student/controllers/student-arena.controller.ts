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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AuthenticatedRequest } from "../../../common/auth.guard";
import { StudentGuard } from "../guards/student.guard";
import { StudentArenaService } from "../services/student-arena.service";
import { SubmitArenaAttemptDto } from "../dto/student.dto";

@ApiTags("Student Command Center")
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId/student", version: "1" })
export class StudentArenaController {
  constructor(private readonly arenaService: StudentArenaService) {}

  @Get("arena")
  @ApiOperation({
    summary:
      "Get available Arena practice activities, assigned tests, and topic mastery analytics",
  })
  getActivities(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.arenaService.getActivities(organizationId, req.user?.id);
  }

  @Post("arena/:activityId/attempt")
  @ApiOperation({ summary: "Submit attempt for an Arena question activity" })
  submitAttempt(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Param("activityId") activityId: string,
    @Body() dto: SubmitArenaAttemptDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.arenaService.submitAttempt(
      organizationId,
      req.user?.id,
      activityId,
      dto,
    );
  }

  @Post("arena/attempt")
  @ApiOperation({ summary: "Submit attempt for an Arena question activity (fallback)" })
  submitAttemptFallback(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: SubmitArenaAttemptDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.arenaService.submitAttempt(
      organizationId,
      req.user?.id,
      (dto as any).activityId || 'default',
      dto,
    );
  }
}
