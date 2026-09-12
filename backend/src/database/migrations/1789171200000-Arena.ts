import { MigrationInterface, QueryRunner } from 'typeorm';

export class Arena1789171200000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE arena_questions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
        section_id uuid NOT NULL, subject_id uuid NOT NULL, created_by uuid NOT NULL,
        topic varchar(100) NOT NULL CHECK (length(btrim(topic))>0),
        difficulty varchar(10) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
        question_type varchar(20) NOT NULL CHECK (question_type IN ('single_choice','multiple_choice')),
        content jsonb NOT NULL CHECK (jsonb_typeof(content)='object'),
        answer_key jsonb NOT NULL CHECK (jsonb_typeof(answer_key)='array' AND jsonb_array_length(answer_key) BETWEEN 1 AND 8),
        tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags)<=10),
        max_score integer NOT NULL CHECK (max_score BETWEEN 1 AND 100),
        status varchar(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
        created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
        UNIQUE (organization_id,id),
        FOREIGN KEY (organization_id,section_id) REFERENCES sections(organization_id,id),
        FOREIGN KEY (organization_id,subject_id) REFERENCES subjects(organization_id,id),
        FOREIGN KEY (organization_id,created_by) REFERENCES memberships(organization_id,user_id)
      );
      CREATE INDEX arena_questions_class_idx ON arena_questions(organization_id,section_id,subject_id,created_at DESC,id);
      CREATE TABLE arena_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
        question_id uuid NOT NULL, student_id uuid NOT NULL,
        submitted_answer jsonb NOT NULL CHECK (jsonb_typeof(submitted_answer)='array' AND jsonb_array_length(submitted_answer) BETWEEN 1 AND 8),
        is_correct boolean NOT NULL, score integer NOT NULL, max_score integer NOT NULL CHECK (max_score BETWEEN 1 AND 100),
        created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
        CHECK (score=CASE WHEN is_correct THEN max_score ELSE 0 END),
        FOREIGN KEY (organization_id,question_id) REFERENCES arena_questions(organization_id,id),
        FOREIGN KEY (organization_id,student_id) REFERENCES memberships(organization_id,user_id)
      );
      CREATE INDEX arena_attempts_question_idx ON arena_attempts(organization_id,question_id,student_id,created_at DESC,id);
      ALTER TABLE scorecards ADD COLUMN arena_attempt_count integer NOT NULL DEFAULT 0 CHECK (arena_attempt_count>=0),
        ADD COLUMN arena_question_count integer NOT NULL DEFAULT 0 CHECK (arena_question_count>=0),
        ADD COLUMN arena_score double precision CHECK (arena_score BETWEEN 0 AND 100);
    `);
    for (const table of ['arena_questions','arena_attempts']) {
      await runner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY; ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;
        CREATE POLICY organization_scope ON ${table}
        USING (organization_id=nullif(current_setting('app.current_org_id',true),'')::uuid)
        WITH CHECK (organization_id=nullif(current_setting('app.current_org_id',true),'')::uuid)`);
    }
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE scorecards DROP COLUMN arena_attempt_count, DROP COLUMN arena_question_count, DROP COLUMN arena_score; DROP TABLE arena_attempts, arena_questions');
  }
}
