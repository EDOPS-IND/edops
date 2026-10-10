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
import { StudentSubjectsService } from "../services/student-subjects.service";

@ApiTags("Student Command Center")
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId/student", version: "1" })
export class StudentSubjectsController {
  constructor(private readonly subjectsService: StudentSubjectsService) {}

  @Get("subjects")
  @ApiOperation({
    summary:
      "Get assigned subjects with attendance, performance, and curriculum stats",
  })
  getSubjects(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.subjectsService.getSubjects(organizationId, req.user?.id);
  }
}
