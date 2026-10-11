import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrincipalExamTermScope1790208000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE principal_exam_results DROP CONSTRAINT principal_exam_results_organization_id_exam_name_class_name_key');
    await runner.query(`ALTER TABLE principal_exam_results ADD CONSTRAINT principal_exam_results_term_unique
      UNIQUE (organization_id, term, exam_name, class_name, section_name, subject_name, student_user_id)`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE principal_exam_results DROP CONSTRAINT principal_exam_results_term_unique');
    await runner.query(`ALTER TABLE principal_exam_results ADD CONSTRAINT principal_exam_results_organization_id_exam_name_class_name_key
      UNIQUE (organization_id, exam_name, class_name, section_name, subject_name, student_user_id)`);
  }
}
