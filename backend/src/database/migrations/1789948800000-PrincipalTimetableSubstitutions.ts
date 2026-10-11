import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrincipalTimetableSubstitutions1789948800000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE principal_timetable_substitutions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES organizations(id),
      timetable_entry_id uuid NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
      event_date date NOT NULL,
      substitute_teacher_user_id uuid NOT NULL REFERENCES users(id),
      impact_note text NOT NULL DEFAULT '',
      created_by uuid NOT NULL REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (organization_id, timetable_entry_id, event_date)
    )`);
    await runner.query(`CREATE INDEX principal_substitutions_org_date_idx ON principal_timetable_substitutions(organization_id, event_date)`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE principal_timetable_substitutions');
  }
}
