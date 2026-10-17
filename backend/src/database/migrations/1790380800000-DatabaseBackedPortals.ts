import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseBackedPortals1790380800000 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query(`
      CREATE TABLE IF NOT EXISTS user_refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES users(id),token_hash text NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,revoked_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS parent_student_relationships (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),school_id uuid NOT NULL,parent_id uuid NOT NULL,student_id uuid NOT NULL,
        relationship varchar(50) DEFAULT 'Guardian',verification_status varchar(32) DEFAULT 'verified',status varchar(32) DEFAULT 'active',
        created_at timestamptz DEFAULT now(),CONSTRAINT uq_parent_student_rel UNIQUE(school_id,parent_id,student_id)
      );
      ALTER TABLE student_profiles ALTER COLUMN blood_group DROP DEFAULT;
      ALTER TABLE organizations ALTER COLUMN health_score DROP DEFAULT, ALTER COLUMN health_score DROP NOT NULL;
      ALTER TABLE school_departments ALTER COLUMN attendance_rate DROP DEFAULT, ALTER COLUMN attendance_rate DROP NOT NULL;
      ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES school_departments(id) ON DELETE SET NULL;
      ALTER TABLE school_departments ADD COLUMN IF NOT EXISTS location varchar(120);
      ALTER TABLE invitations ADD COLUMN IF NOT EXISTS employee_id varchar(50);
      ALTER TABLE invitations ADD COLUMN IF NOT EXISTS employment_type varchar(50);
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS employee_id varchar(50);
      ALTER TABLE memberships ADD COLUMN IF NOT EXISTS employment_type varchar(50);
      CREATE TABLE student_reflections (
        organization_id uuid NOT NULL REFERENCES organizations(id),student_user_id uuid NOT NULL,
        ratings jsonb NOT NULL,reflection_text text NOT NULL DEFAULT '',improvement_text text NOT NULL DEFAULT '',updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY(organization_id,student_user_id),FOREIGN KEY(organization_id,student_user_id) REFERENCES memberships(organization_id,user_id)
      );
      ALTER TABLE exam_evaluations ADD COLUMN is_locked boolean NOT NULL DEFAULT false;
      ALTER TABLE teacher_messages DROP CONSTRAINT IF EXISTS teacher_messages_recipient_role_check;
      ALTER TABLE teacher_messages ADD CONSTRAINT teacher_messages_recipient_role_check
        CHECK (recipient_role IN ('student','parent','principal','school_admin','teacher'));
      ALTER TABLE principal_parent_queries ADD COLUMN parent_user_id uuid REFERENCES users(id);
      ALTER TABLE principal_parent_queries ADD COLUMN student_user_id uuid REFERENCES users(id);
      CREATE TABLE ptm_bookings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        schedule_id uuid NOT NULL REFERENCES ptm_schedules(id),
        parent_user_id uuid NOT NULL,
        student_user_id uuid NOT NULL,
        teacher_user_id uuid NOT NULL,
        slot_index integer NOT NULL CHECK (slot_index>=0),
        notes text NOT NULL DEFAULT '',
        status varchar(16) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
        created_at timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY (organization_id,parent_user_id) REFERENCES memberships(organization_id,user_id),
        FOREIGN KEY (organization_id,student_user_id) REFERENCES memberships(organization_id,user_id),
        FOREIGN KEY (organization_id,teacher_user_id) REFERENCES memberships(organization_id,user_id)
      );
      CREATE UNIQUE INDEX ptm_teacher_slot ON ptm_bookings(schedule_id,teacher_user_id,slot_index) WHERE status='confirmed';
      CREATE UNIQUE INDEX ptm_parent_slot ON ptm_bookings(schedule_id,parent_user_id,slot_index) WHERE status='confirmed';
      CREATE INDEX parent_queries_owner ON principal_parent_queries(organization_id,parent_user_id,student_user_id);
    `);
  }
  async down(r: QueryRunner): Promise<void> {
    await r.query(`DROP TABLE student_reflections; DROP TABLE user_refresh_tokens; ALTER TABLE exam_evaluations DROP COLUMN is_locked; DROP TABLE ptm_bookings; DROP INDEX parent_queries_owner;
      ALTER TABLE principal_parent_queries DROP COLUMN student_user_id, DROP COLUMN parent_user_id;`);
  }
}
