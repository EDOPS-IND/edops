import { Injectable } from "@nestjs/common";
import { createTenantRoleGuard } from "../../../common/role.guard";

@Injectable()
export class TeacherGuard extends createTenantRoleGuard(
  "teacher",
  "Only authorized teachers can access this command center"
) {}
