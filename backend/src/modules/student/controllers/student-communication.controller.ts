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
import { StudentCommunicationService } from "../services/student-communication.service";
import { SendStudentMessageDto } from "../dto/student.dto";

@ApiTags("Student Command Center")
@ApiBearerAuth()
@UseGuards(StudentGuard)
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId/student", version: "1" })
export class StudentCommunicationController {
  constructor(private readonly commService: StudentCommunicationService) {}

  @Get("messages")
  @ApiOperation({
    summary: "Get student academic inbox and teachers directory",
  })
  getMessages(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commService.getMessages(organizationId, req.user?.id);
  }

  @Post("messages")
  @ApiOperation({ summary: "Send academic query or doubt to teacher" })
  sendMessage(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Body() dto: SendStudentMessageDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commService.sendMessage(organizationId, req.user?.id, dto);
  }
}
