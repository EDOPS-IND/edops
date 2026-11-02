import { MigrationInterface, QueryRunner } from 'typeorm';
import { dashboardFeatureKey, dashboardSections } from '../../modules/billing/dashboard-navigation';

export class SingleWordDashboardNavigation1790553600006 implements MigrationInterface {
  async up(r: QueryRunner): Promise<void> {
    await r.query('DELETE FROM dashboard_items WHERE organization_id IS NULL');
    await r.query('DELETE FROM dashboard_sections WHERE organization_id IS NULL');

    const categories: Record<string, string> = {
      overview: 'administration',
      academics: 'academic',
      schedule: 'academic',
      assessment: 'academic',
      communication: 'communication',
      management: 'administration',
    };

    const positions = new Map<string, number>();
    for (const section of dashboardSections) {
      const sectionPosition = positions.get(section.role) ?? 0;
      positions.set(section.role, sectionPosition + 1);

      await r.query(
        'INSERT INTO dashboard_sections(organization_id, role, key, label, sort_order) VALUES(NULL, $1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [section.role, section.key, section.label, sectionPosition * 10],
      );

      for (const [position, entry] of section.items.entries()) {
        const [key, label] = entry.split('|');
        const featureKey = dashboardFeatureKey(section.role, section.key, key);

        await r.query(
          `INSERT INTO feature_catalog(key, category, name, description) VALUES($1, $2, $3, $4) ON CONFLICT(key) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
          [
            featureKey,
            categories[section.key] ?? 'academic',
            featureKey.startsWith('nav:') ? `Navigation: ${label}` : label,
            `Dashboard item for ${section.role}: ${section.label} / ${label}`,
          ],
        );

        await r.query(
          'INSERT INTO dashboard_items(organization_id, role, key, section_key, label, feature_key, sort_order) VALUES(NULL, $1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
          [section.role, `${section.key}.${key}`, section.key, label, featureKey, (position + 1) * 10],
        );
      }
    }
  }

  async down(r: QueryRunner): Promise<void> {
    // No-op
  }
}
