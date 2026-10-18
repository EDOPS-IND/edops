import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MailService } from "../notifications/mail.service";

@Module({
  imports: [AuditModule],
  controllers: [AuthController],
  providers: [AuthService, MailService],
  exports: [AuthService, MailService],
})
export class AuthModule {}
