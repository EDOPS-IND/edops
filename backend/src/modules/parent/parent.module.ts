import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from "@nestjs/common";
import { AuthenticatedRequest } from "../../common/auth.guard";
import { TenantsModule } from "../tenants/tenants.module";
import { ParentService } from "./parent.service";
import { ParentBookingDto, ParentLeaveDto, ParentQueryDto } from "./parent.dto";

@Controller({
  path: "organizations/:organizationId/parent/children/:studentId",
  version: "1",
})
class ParentController {
  constructor(private readonly service: ParentService) {}
  @Get() details(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("studentId", ParseUUIDPipe) child: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.details(org, req.user, child);
  }
  @Post("leaves") leave(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("studentId", ParseUUIDPipe) child: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ParentLeaveDto,
  ) {
    return this.service.leave(org, req.user, child, dto);
  }
  @Post("queries") query(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("studentId", ParseUUIDPipe) child: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ParentQueryDto,
  ) {
    return this.service.query(org, req.user, child, dto);
  }
  @Post("bookings") book(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("studentId", ParseUUIDPipe) child: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ParentBookingDto,
  ) {
    return this.service.book(org, req.user, child, dto);
  }
  @Delete("bookings/:bookingId") cancel(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("studentId", ParseUUIDPipe) child: string,
    @Param("bookingId", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.cancel(org, req.user, child, id);
  }
}
@Module({
  imports: [TenantsModule],
  controllers: [ParentController],
  providers: [ParentService],
})
export class ParentModule {}
