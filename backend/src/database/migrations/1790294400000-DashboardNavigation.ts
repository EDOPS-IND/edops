import { MigrationInterface, QueryRunner } from 'typeorm';
import { dashboardFeatureKey, dashboardSections } from '../../modules/billing/dashboard-navigation';

export class DashboardNavigation1790294400000 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query(`
      CREATE TABLE dashboard_sections (
        organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
        role varchar(20) NOT NULL,
        key varchar(64) NOT NULL,
        label varchar(100) NOT NULL,
        sort_order integer NOT NULL,
        enabled boolean NOT NULL DEFAULT true
      );
      CREATE UNIQUE INDEX dashboard_sections_scope_key ON dashboard_sections
        (coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), role, key);
      CREATE TABLE dashboard_items (
        organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
        role varchar(20) NOT NULL,
        key varchar(64) NOT NULL,
        section_key varchar(64) NOT NULL,
        label varchar(100) NOT NULL,
        feature_key varchar(50) NOT NULL REFERENCES feature_catalog(key),
        sort_order integer NOT NULL,
        enabled boolean NOT NULL DEFAULT true
      );
      CREATE UNIQUE INDEX dashboard_items_scope_key ON dashboard_items
        (coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), role, key);
    `);

    const categories: Record<string, string> = {
      overview: 'administration', people: 'administration', management: 'administration',
      finance_communication: 'finance', operations: 'operations', communication: 'communication',
      account: 'administration', progress: 'academic',
    };
    const positions = new Map<string, number>();
    for (const section of dashboardSections) {
      const sectionPosition = positions.get(section.role) ?? 0;
      positions.set(section.role, sectionPosition + 1);
      await r.query('INSERT INTO dashboard_sections(organization_id,role,key,label,sort_order) VALUES(NULL,$1,$2,$3,$4)',
        [section.role, section.key, section.label, sectionPosition]);
      for (const [position, entry] of section.items.entries()) {
        const [key, label] = entry.split('|');
        const featureKey = dashboardFeatureKey(section.role, section.key, key);
        await r.query(`INSERT INTO feature_catalog(key,category,name,description) VALUES($1,$2,$3,$4) ON CONFLICT(key) DO NOTHING`,
          [featureKey, categories[section.key] ?? 'academic', featureKey.startsWith('nav:') ? `Navigation: ${label}` : label,
            `Dashboard item for ${section.role}: ${section.label} / ${label}`]);
        await r.query('INSERT INTO dashboard_items(organization_id,role,key,section_key,label,feature_key,sort_order) VALUES(NULL,$1,$2,$3,$4,$5,$6)',
          [section.role, `${section.key}.${key}`, section.key, label, featureKey, position]);
      }
    }
  }

  async down(r: QueryRunner): Promise<void> {
    await r.query('DROP TABLE IF EXISTS dashboard_items');
    await r.query('DROP TABLE IF EXISTS dashboard_sections');
    await r.query("DELETE FROM feature_catalog WHERE key LIKE 'nav:%'");
  }
}
