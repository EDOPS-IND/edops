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
import { StudentTimetableService } from "../services/student-timetable.service";

@ApiTags("Student Command Center")
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId/student", version: "1" })
export class StudentTimetableController {
  constructor(private readonly timetableService: StudentTimetableService) {}

  @Get("timetable")
  @ApiOperation({
    summary: "Get weekly timetable schedule and previous classes history",
  })
  getTimetable(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.timetableService.getTimetable(organizationId, req.user?.id);
  }
}
