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
import { StudentProgressService } from "../services/student-progress.service";
import {
  StudentReflectionDto,
  CreateStudentGoalDto,
  CreateStudentSupportRequestDto,
} from "../dto/student.dto";

@ApiTags("Student Command Center")
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId/student", version: "1" })
export class StudentProgressController {
  constructor(private readonly progressService: StudentProgressService) {}

  @Get("progress")
  @ApiOperation({
    summary:
      "Get gaps & strengths analysis, personal goals, and support requests",
  })
  getProgressOverview(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.getProgressOverview(
      organizationId,
      req.user?.id,
    );
  }

  @Post("goals")
  @ApiOperation({ summary: "Create student personal academic target goal" })
  createGoal(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateStudentGoalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.createGoal(organizationId, req.user?.id, dto);
  }

  @Post("support-requests")
  @ApiOperation({ summary: "Create student support or doubt request" })
  createSupportRequest(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateStudentSupportRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.createSupportRequest(
      organizationId,
      req.user?.id,
      dto,
    );
  }
  @Post('progress/reflection')
  saveReflection(@Param('organizationId',ParseUUIDPipe) org:string,@Req() req:AuthenticatedRequest,@Body() dto:StudentReflectionDto) {return this.progressService.saveReflection(org,req.user.id,dto);}

}
