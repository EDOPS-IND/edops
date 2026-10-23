import { MigrationInterface, QueryRunner } from "typeorm";

export class SubjectPassingMarks1790553600001 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE principal_exam_plans ADD COLUMN passing_marks numeric(7,2)`);
    await runner.query(`UPDATE principal_exam_plans SET passing_marks = GREATEST(0.01, ROUND(max_marks * 0.33, 2)) WHERE passing_marks IS NULL`);
    await runner.query(`ALTER TABLE principal_exam_plans ALTER COLUMN passing_marks SET NOT NULL`);
    await runner.query(`ALTER TABLE principal_exam_plans ADD CONSTRAINT principal_exam_plans_passing_marks_check CHECK (passing_marks > 0 AND passing_marks <= max_marks)`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE principal_exam_plans DROP CONSTRAINT principal_exam_plans_passing_marks_check`);
    await runner.query(`ALTER TABLE principal_exam_plans DROP COLUMN passing_marks`);
  }
}
