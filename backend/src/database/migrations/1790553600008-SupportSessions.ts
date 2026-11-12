import { MigrationInterface, QueryRunner } from "typeorm";

export class SupportSessions1790553600008 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE IF NOT EXISTS support_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        platform_user_id uuid NOT NULL REFERENCES users(id),
        reason varchar(255) NOT NULL,
        session_token_hash varchar(64) NOT NULL UNIQUE,
        started_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL,
        ended_at timestamptz,
        end_reason varchar(255),
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS support_sessions_org_idx ON support_sessions(organization_id, started_at DESC);
      CREATE INDEX IF NOT EXISTS support_sessions_actor_idx ON support_sessions(platform_user_id, started_at DESC);
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`DROP TABLE IF EXISTS support_sessions`);
  }
}
