import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrincipalObservationClassName1789862400000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE principal_teacher_observations ALTER COLUMN class_name TYPE varchar(255)');
    await runner.query('ALTER TABLE principal_teacher_observations ALTER COLUMN subject_name TYPE varchar(120)');
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE principal_teacher_observations ALTER COLUMN class_name TYPE varchar(60)');
    await runner.query('ALTER TABLE principal_teacher_observations ALTER COLUMN subject_name TYPE varchar(100)');
  }
}
