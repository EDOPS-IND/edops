import { MigrationInterface, QueryRunner } from 'typeorm';

export class SchoolPolicySettings1790467200000 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query(`
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS attendance_threshold integer DEFAULT 75;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS workload_threshold integer DEFAULT 30;
    `);
  }

  async down(r: QueryRunner): Promise<void> {
    await r.query(`
      ALTER TABLE organizations DROP COLUMN IF EXISTS attendance_threshold;
      ALTER TABLE organizations DROP COLUMN IF EXISTS workload_threshold;
    `);
  }
}
