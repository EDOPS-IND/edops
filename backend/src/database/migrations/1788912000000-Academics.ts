import { MigrationInterface, QueryRunner } from 'typeorm';

export class Academics1788912000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE academic_years (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        name varchar(120) NOT NULL CHECK (length(btrim(name)) > 0),
        start_date date NOT NULL, end_date date NOT NULL CHECK (end_date >= start_date),
        is_current boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id), UNIQUE (organization_id, name)
      );
      CREATE UNIQUE INDEX academic_years_current_idx ON academic_years(organization_id) WHERE is_current;
      CREATE TABLE programs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        name varchar(120) NOT NULL CHECK (length(btrim(name)) > 0), sequence_order integer NOT NULL DEFAULT 0 CHECK (sequence_order >= 0),
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, id), UNIQUE (organization_id, name)
      );
      CREATE TABLE subjects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        name varchar(120) NOT NULL CHECK (length(btrim(name)) > 0), code varchar(32) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, id), UNIQUE (organization_id, code)
      );
      CREATE TABLE sections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        academic_year_id uuid NOT NULL, program_id uuid NOT NULL,
        name varchar(120) NOT NULL CHECK (length(btrim(name)) > 0), capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 5000),
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, id), UNIQUE (organization_id, academic_year_id, id),
        UNIQUE (organization_id, academic_year_id, program_id, name),
        FOREIGN KEY (organization_id, academic_year_id) REFERENCES academic_years(organization_id, id),
        FOREIGN KEY (organization_id, program_id) REFERENCES programs(organization_id, id)
      );
      CREATE TABLE class_subject_assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        section_id uuid NOT NULL, subject_id uuid NOT NULL, teacher_user_id uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, section_id, subject_id),
        FOREIGN KEY (organization_id, section_id) REFERENCES sections(organization_id, id),
        FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
        FOREIGN KEY (organization_id, teacher_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX class_assignments_teacher_idx ON class_subject_assignments(organization_id, teacher_user_id);
      CREATE TABLE enrollments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        student_user_id uuid NOT NULL, section_id uuid NOT NULL, academic_year_id uuid NOT NULL,
        roll_number varchar(32) NOT NULL CHECK (length(btrim(roll_number)) > 0),
        status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'withdrawn')),
        created_at timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY (organization_id, section_id) REFERENCES sections(organization_id, id),
        FOREIGN KEY (organization_id, academic_year_id, section_id) REFERENCES sections(organization_id, academic_year_id, id),
        FOREIGN KEY (organization_id, student_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE UNIQUE INDEX enrollments_student_year_idx ON enrollments(organization_id, student_user_id, academic_year_id) WHERE status = 'active';
      CREATE UNIQUE INDEX enrollments_section_roll_idx ON enrollments(organization_id, section_id, roll_number) WHERE status = 'active';
      CREATE INDEX enrollments_section_idx ON enrollments(organization_id, section_id, status);
      CREATE TABLE invitation_batches (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        created_by uuid NOT NULL REFERENCES users(id), count integer NOT NULL CHECK (count BETWEEN 1 AND 100),
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, id)
      );
      ALTER TABLE invitations ADD COLUMN role varchar(20) NOT NULL DEFAULT 'school_admin'
        CHECK (role IN ('school_admin', 'teacher', 'student'));
      ALTER TABLE invitations ADD COLUMN batch_id uuid;
      ALTER TABLE invitations ADD COLUMN revoked_at timestamptz;
      ALTER TABLE invitations ADD CONSTRAINT invitations_batch_fk FOREIGN KEY (organization_id, batch_id)
        REFERENCES invitation_batches(organization_id, id);
      DROP INDEX invitations_pending_idx;
      CREATE UNIQUE INDEX invitations_pending_idx ON invitations(organization_id, email) WHERE accepted_at IS NULL AND revoked_at IS NULL;
      CREATE TABLE idempotency_records (
        organization_id uuid NOT NULL REFERENCES organizations(id), actor_id uuid NOT NULL REFERENCES users(id),
        key uuid NOT NULL, request_hash varchar(64) NOT NULL, response_ciphertext text NOT NULL,
        expires_at timestamptz NOT NULL, PRIMARY KEY (organization_id, actor_id, key)
      );
      CREATE INDEX idempotency_expiry_idx ON idempotency_records(expires_at);
    `);
    // FORCE covers table owners; superuser/BYPASSRLS roles must never be used by the production API.
    for (const table of ['academic_years', 'programs', 'subjects', 'sections', 'class_subject_assignments', 'enrollments', 'invitation_batches', 'idempotency_records']) {
      await runner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
        ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;
        CREATE POLICY organization_scope ON ${table}
        USING (organization_id = nullif(current_setting('app.current_org_id', true), '')::uuid)
        WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), '')::uuid)`);
    }
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`
      DROP TABLE idempotency_records;
      ALTER TABLE invitations DROP CONSTRAINT invitations_batch_fk;
      DROP INDEX invitations_pending_idx;
      ALTER TABLE invitations DROP COLUMN role, DROP COLUMN batch_id, DROP COLUMN revoked_at;
      CREATE UNIQUE INDEX invitations_pending_idx ON invitations(organization_id, email) WHERE accepted_at IS NULL;
      DROP TABLE invitation_batches, enrollments, class_subject_assignments, sections, subjects, programs, academic_years;
    `);
  }
}
