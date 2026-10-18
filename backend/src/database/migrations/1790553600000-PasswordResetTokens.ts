import { MigrationInterface, QueryRunner } from 'typeorm';

export class PasswordResetTokens1790553600000 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash varchar(64) NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_lookup ON password_reset_tokens(token_hash);
    `);
  }

  async down(r: QueryRunner): Promise<void> {
    await r.query(`
      DROP TABLE IF EXISTS password_reset_tokens;
    `);
  }
}
