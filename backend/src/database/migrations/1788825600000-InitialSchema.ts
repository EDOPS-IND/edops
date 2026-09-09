import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788825600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(254) NOT NULL UNIQUE CHECK (email = lower(btrim(email))),
        password_hash text NOT NULL,
        is_platform_admin boolean NOT NULL DEFAULT false,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE organizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(120) NOT NULL CHECK (length(btrim(name)) > 0),
        slug varchar(63) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
        time_zone varchar(100) NOT NULL DEFAULT 'Asia/Kolkata',
        locale varchar(16) NOT NULL DEFAULT 'en-IN' CHECK (locale IN ('en-IN', 'hi-IN', 'en-US')),
        status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE memberships (
        organization_id uuid NOT NULL REFERENCES organizations(id),
        user_id uuid NOT NULL REFERENCES users(id),
        role varchar(20) NOT NULL CHECK (role IN ('school_admin', 'teacher', 'student', 'parent')),
        status varchar(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (organization_id, user_id)
      );
      CREATE INDEX memberships_user_idx ON memberships(user_id);
      CREATE TABLE invitations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        email varchar(254) NOT NULL CHECK (email = lower(btrim(email))),
        token_hash varchar(64) NOT NULL UNIQUE,
        invited_by uuid NOT NULL REFERENCES users(id),
        expires_at timestamptz NOT NULL,
        accepted_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX invitations_pending_idx ON invitations(organization_id, email) WHERE accepted_at IS NULL;
      CREATE TABLE sessions (
        sid varchar PRIMARY KEY,
        sess json NOT NULL,
        expire timestamp(6) NOT NULL
      );
      CREATE INDEX sessions_expire_idx ON sessions(expire);
      CREATE TABLE audit_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid REFERENCES organizations(id),
        actor_id uuid REFERENCES users(id),
        action varchar(80) NOT NULL,
        details jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX audit_events_organization_idx ON audit_events(organization_id, created_at DESC);
      CREATE FUNCTION protect_audit_events() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Audit events are append-only'; END;
      $$;
      CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON audit_events
        FOR EACH ROW EXECUTE FUNCTION protect_audit_events();
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE audit_events;
      DROP FUNCTION protect_audit_events();
      DROP TABLE sessions, invitations, memberships, organizations, users;
    `);
  }
}
