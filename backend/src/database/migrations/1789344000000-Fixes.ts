import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fixes1789344000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS invoices_payment_ref_idx`);
    await queryRunner.query(`CREATE UNIQUE INDEX invoices_payment_ref_idx ON invoices(organization_id, payment_reference) WHERE payment_reference IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX attendance_sessions_unique_idx ON attendance_sessions(organization_id, section_id, date, period, subject_id) WHERE subject_id IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX attendance_sessions_unique_null_idx ON attendance_sessions(organization_id, section_id, date, period) WHERE subject_id IS NULL`);
    await queryRunner.query(`CREATE INDEX domain_events_pending_idx ON domain_events(organization_id, available_at, occurred_at) WHERE processed_at IS NULL AND failed_at IS NULL`);
    await queryRunner.query(`CREATE INDEX arena_attempts_student_idx ON arena_attempts(organization_id, student_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX scorecards_section_idx ON scorecards(organization_id, section_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX scorecards_section_idx`);
    await queryRunner.query(`DROP INDEX arena_attempts_student_idx`);
    await queryRunner.query(`DROP INDEX domain_events_pending_idx`);
    await queryRunner.query(`DROP INDEX attendance_sessions_unique_null_idx`);
    await queryRunner.query(`DROP INDEX attendance_sessions_unique_idx`);
    await queryRunner.query(`DROP INDEX IF EXISTS invoices_payment_ref_idx`);
    await queryRunner.query(`CREATE UNIQUE INDEX invoices_payment_ref_idx ON invoices(payment_reference) WHERE payment_reference IS NOT NULL`);
  }
}
