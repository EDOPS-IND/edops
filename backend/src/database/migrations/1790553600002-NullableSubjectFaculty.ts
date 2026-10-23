import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableSubjectFaculty1790553600002 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE class_subject_assignments ALTER COLUMN teacher_user_id DROP NOT NULL`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`DELETE FROM class_subject_assignments WHERE teacher_user_id IS NULL`);
    await runner.query(`ALTER TABLE class_subject_assignments ALTER COLUMN teacher_user_id SET NOT NULL`);
  }
}
