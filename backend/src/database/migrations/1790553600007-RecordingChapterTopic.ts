import { MigrationInterface, QueryRunner } from "typeorm";

export class RecordingChapterTopic1790553600007 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE recorded_sessions ADD COLUMN IF NOT EXISTS chapter varchar(160)`);
    await runner.query(`ALTER TABLE recorded_sessions ADD COLUMN IF NOT EXISTS topic varchar(200)`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE recorded_sessions DROP COLUMN IF EXISTS topic`);
    await runner.query(`ALTER TABLE recorded_sessions DROP COLUMN IF EXISTS chapter`);
  }
}
