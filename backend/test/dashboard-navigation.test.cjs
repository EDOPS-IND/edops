const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dashboardSections, dashboardFeatureKey } = require('../dist/modules/billing/dashboard-navigation');
const { BillingService } = require('../dist/modules/billing/billing.service');

test('every registered dashboard destination has a unique role key', () => {
  const keys = dashboardSections.flatMap(section => section.items.map(entry => `${section.role}.${section.key}.${entry.split('|')[0]}`));
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(new Set(dashboardSections.map(section => section.role)), new Set(['school_admin', 'principal', 'teacher', 'student', 'parent']));
  assert.equal(dashboardFeatureKey('principal', 'assessment', 'assessments'), 'assessments');
  assert.equal(dashboardFeatureKey('principal', 'examinations', 'exam_planning'), 'exams');
});

test('member navigation excludes disabled destinations and sections', async () => {
  const db = { query: async sql => {
    if (sql.includes('FROM memberships m')) return [{ one: 1 }];
    if (sql.includes('FROM dashboard_sections')) return [{ key: 'overview', label: 'Overview', sortOrder: 0, enabled: true }, { key: 'people', label: 'People', sortOrder: 1, enabled: false }];
    if (sql.includes('FROM dashboard_items')) return [
      { key: 'overview.dashboard', sectionKey: 'overview', label: 'Dashboard', featureKey: 'nav:principal:overview:dashboard', sortOrder: 0, enabled: true },
      { key: 'people.workload', sectionKey: 'people', label: 'Workload', featureKey: 'nav:principal:people:workload', sortOrder: 0, enabled: true },
    ];
    if (sql.includes('FROM organizations o')) return [{ entitled: true, features: {} }];
    if (sql.includes('FROM feature_flags')) return [];
    if (sql.includes('FROM feature_overrides')) return [];
    if (sql.includes('FROM feature_catalog')) return [{ key: 'nav:principal:overview:dashboard' }, { key: 'nav:principal:people:workload' }];
    throw new Error(sql);
  }};
  const service = new BillingService(db, {}, {});
  const result = await service.dashboardNavigation('school', { id: 'principal' }, 'principal');
  assert.deepEqual(result.map(section => section.key), ['overview']);
  assert.deepEqual(result[0].items.map(item => item.key), ['overview.dashboard']);
});
