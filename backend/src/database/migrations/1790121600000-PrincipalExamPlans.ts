import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrincipalExamPlans1790121600000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE principal_exam_plans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES organizations(id),
      section_id uuid NOT NULL,
      subject_id uuid NOT NULL,
      exam_name varchar(150) NOT NULL,
      term varchar(60) NOT NULL,
      exam_date date NOT NULL,
      start_time time NOT NULL,
      end_time time NOT NULL,
      max_marks numeric(7,2) NOT NULL CHECK (max_marks > 0),
      status varchar(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled')),
      created_by uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CHECK (end_time > start_time),
      UNIQUE (organization_id, exam_name, section_id, subject_id, exam_date),
      FOREIGN KEY (organization_id, section_id) REFERENCES sections(organization_id, id),
      FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
      FOREIGN KEY (organization_id, created_by) REFERENCES memberships(organization_id, user_id)
    )`);
    await runner.query('CREATE INDEX principal_exam_plans_school_date_idx ON principal_exam_plans(organization_id, exam_date)');
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE principal_exam_plans');
  }
}
