import { MigrationInterface, QueryRunner } from 'typeorm';

export class ArenaAndSpecialty1789430400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE arena_questions ADD COLUMN IF NOT EXISTS program_id uuid`);
    await queryRunner.query(`ALTER TABLE arena_questions ADD COLUMN IF NOT EXISTS chapter varchar(100) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE memberships ADD COLUMN IF NOT EXISTS specialty varchar(100)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE memberships DROP COLUMN IF EXISTS specialty`);
    await queryRunner.query(`ALTER TABLE arena_questions DROP COLUMN IF EXISTS chapter`);
    await queryRunner.query(`ALTER TABLE arena_questions DROP COLUMN IF EXISTS program_id`);
  }
}
