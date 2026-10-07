import { MigrationInterface, QueryRunner } from 'typeorm';

export class StudentControlCenter1789689600000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      -- 1. Student Academic Target Goals
      CREATE TABLE IF NOT EXISTS student_goals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        student_user_id uuid NOT NULL,
        subject_id uuid,
        title varchar(255) NOT NULL,
        target_score integer NOT NULL CHECK (target_score BETWEEN 1 AND 100),
        current_score integer NOT NULL DEFAULT 0,
        deadline date NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id),
        FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
        FOREIGN KEY (organization_id, student_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_student_goals ON student_goals(organization_id, student_user_id, status);

      -- 2. Student Bookmarks / Saved Resources
      CREATE TABLE IF NOT EXISTS student_bookmarks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        student_user_id uuid NOT NULL,
        resource_id text NOT NULL,
        resource_type varchar(32) NOT NULL CHECK (resource_type IN ('study_material', 'recorded_lecture', 'assignment', 'arena_question')),
        title varchar(255) NOT NULL,
        subject_name varchar(120),
        url text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id),
        UNIQUE (organization_id, student_user_id, resource_type, resource_id),
        FOREIGN KEY (organization_id, student_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_student_bookmarks ON student_bookmarks(organization_id, student_user_id, resource_type);

      -- 3. Student Lecture Video Progress Tracking
      CREATE TABLE IF NOT EXISTS student_lecture_progress (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        student_user_id uuid NOT NULL,
        recording_id uuid NOT NULL,
        last_position_seconds integer NOT NULL DEFAULT 0,
        watched_pct smallint NOT NULL DEFAULT 0 CHECK (watched_pct BETWEEN 0 AND 100),
        is_completed boolean NOT NULL DEFAULT false,
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id),
        UNIQUE (organization_id, student_user_id, recording_id),
        FOREIGN KEY (organization_id, recording_id) REFERENCES recordings(organization_id, id),
        FOREIGN KEY (organization_id, student_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_student_lecture_prog ON student_lecture_progress(organization_id, student_user_id, recording_id);

      -- 4. Student Support & Help Requests (Doubts / Guidance)
      CREATE TABLE IF NOT EXISTS student_support_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        student_user_id uuid NOT NULL,
        category varchar(32) NOT NULL CHECK (category IN ('academic', 'doubt', 'counselling', 'subject_help')),
        subject_id uuid,
        preferred_teacher_id uuid,
        description text NOT NULL,
        urgency varchar(16) NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'urgent')),
        status varchar(24) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        response text,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, id),
        FOREIGN KEY (organization_id, subject_id) REFERENCES subjects(organization_id, id),
        FOREIGN KEY (organization_id, preferred_teacher_id) REFERENCES memberships(organization_id, user_id),
        FOREIGN KEY (organization_id, student_user_id) REFERENCES memberships(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_student_support_req ON student_support_requests(organization_id, student_user_id, status);
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`
      DROP TABLE IF EXISTS student_support_requests;
      DROP TABLE IF EXISTS student_lecture_progress;
      DROP TABLE IF EXISTS student_bookmarks;
      DROP TABLE IF EXISTS student_goals;
    `);
  }
}
