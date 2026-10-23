import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSchoolAdminReportsNavigation1790553600004 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`DELETE FROM dashboard_items WHERE role = 'school_admin' AND key = 'management.reports'`);
  }

  async down(): Promise<void> {
    // The dashboard now owns analytics; restoring this legacy navigation item is intentionally unsupported.
  }
}
