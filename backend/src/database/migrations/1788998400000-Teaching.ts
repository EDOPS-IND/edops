import { MigrationInterface, QueryRunner } from 'typeorm';

export class Teaching1788998400000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        section_id uuid NOT NULL, subject_id uuid NOT NULL, created_by uuid NOT NULL,
        title varchar(200) NOT NULL CHECK (length(btrim(title)) > 0), description varchar(8000) NOT NULL DEFAULT '',
        due_at timestamptz NOT NULL, max_score double precision NOT NULL CHECK (max_score > 0 AND max_score <= 10000),
        status varchar(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
        CHECK ((status = 'published') = (published_at IS NOT NULL)), UNIQUE (organization_id, id),
        FOREIGN KEY (organization_id, section_id) REFERENCES sections(organization_id, id),
        FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
        FOREIGN KEY (organization_id, created_by) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX assignments_class_idx ON assignments(organization_id, section_id, subject_id, created_at, id);
      CREATE TABLE submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        assignment_id uuid NOT NULL, student_id uuid NOT NULL, content varchar(8000), submitted_at timestamptz,
        score double precision CHECK (score >= 0 AND score <= 10000), feedback varchar(4000), graded_by uuid, graded_at timestamptz,
        status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'late', 'graded')),
        created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, id), UNIQUE (organization_id, assignment_id, student_id),
        CHECK ((status = 'pending') = (submitted_at IS NULL)),
        CHECK ((status = 'pending' AND content IS NULL) OR (status <> 'pending' AND length(btrim(content)) > 0)),
        CHECK ((status = 'graded' AND score IS NOT NULL AND graded_by IS NOT NULL AND graded_at IS NOT NULL)
          OR (status <> 'graded' AND score IS NULL AND graded_by IS NULL AND graded_at IS NULL AND feedback IS NULL)),
        FOREIGN KEY (organization_id, assignment_id) REFERENCES assignments(organization_id, id),
        FOREIGN KEY (organization_id, student_id) REFERENCES memberships(organization_id, user_id),
        FOREIGN KEY (organization_id, graded_by) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX submissions_student_idx ON submissions(organization_id, student_id, assignment_id);
      CREATE TABLE attendance_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        section_id uuid NOT NULL, subject_id uuid, date date NOT NULL, period smallint NOT NULL CHECK (period BETWEEN 1 AND 20),
        taken_by uuid NOT NULL, status varchar(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
        finalized_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, id),
        UNIQUE NULLS NOT DISTINCT (organization_id, section_id, subject_id, date, period),
        CHECK ((status = 'finalized') = (finalized_at IS NOT NULL)),
        FOREIGN KEY (organization_id, section_id) REFERENCES sections(organization_id, id),
        FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
        FOREIGN KEY (organization_id, taken_by) REFERENCES memberships(organization_id, user_id)
      );
      CREATE TABLE attendance_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        attendance_session_id uuid NOT NULL, student_id uuid NOT NULL,
        status varchar(16) CHECK (status IN ('present', 'absent', 'late', 'excused')),
        UNIQUE (organization_id, attendance_session_id, student_id),
        FOREIGN KEY (organization_id, attendance_session_id) REFERENCES attendance_sessions(organization_id, id),
        FOREIGN KEY (organization_id, student_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX attendance_records_student_idx ON attendance_records(organization_id, student_id);
      CREATE TABLE scorecards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        student_id uuid NOT NULL, section_id uuid NOT NULL, subject_id uuid,
        term varchar(20) NOT NULL DEFAULT 'academic_year' CHECK (term = 'academic_year'),
        assignment_count integer NOT NULL, submitted_count integer NOT NULL, graded_count integer NOT NULL,
        avg_score double precision, completion_pct double precision, attendance_count integer NOT NULL,
        attended_count integer NOT NULL, attendance_pct double precision, generated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE NULLS NOT DISTINCT (organization_id, student_id, section_id, subject_id),
        FOREIGN KEY (organization_id, section_id) REFERENCES sections(organization_id, id),
        FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
        FOREIGN KEY (organization_id, student_id) REFERENCES memberships(organization_id, user_id)
      );
    `);
    for (const table of ['assignments', 'submissions', 'attendance_sessions', 'attendance_records', 'scorecards']) {
      await runner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
        ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;
        CREATE POLICY organization_scope ON ${table}
        USING (organization_id = nullif(current_setting('app.current_org_id', true), '')::uuid)
        WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), '')::uuid)`);
    }
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE scorecards, attendance_records, attendance_sessions, submissions, assignments');
  }
}
