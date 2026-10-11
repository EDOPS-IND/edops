import { MigrationInterface, QueryRunner } from 'typeorm';

export class RoleFeatureOverrides1790035200000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      ALTER TABLE feature_overrides ADD COLUMN IF NOT EXISTS role varchar(20);
      ALTER TABLE feature_overrides DROP CONSTRAINT IF EXISTS feature_overrides_organization_id_feature_key_key;
      CREATE UNIQUE INDEX IF NOT EXISTS feature_overrides_org_feature_role_idx 
        ON feature_overrides(organization_id, feature_key, COALESCE(role, 'ALL'));
      CREATE INDEX IF NOT EXISTS idx_feature_overrides_org_role 
        ON feature_overrides(organization_id, role, feature_key);
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`
      DROP INDEX IF EXISTS feature_overrides_org_feature_role_idx;
      DROP INDEX IF EXISTS idx_feature_overrides_org_role;
      ALTER TABLE feature_overrides DROP COLUMN IF EXISTS role;
      ALTER TABLE feature_overrides ADD CONSTRAINT feature_overrides_organization_id_feature_key_key 
        UNIQUE(organization_id, feature_key);
    `);
  }
}
