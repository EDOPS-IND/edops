const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PrincipalDashboardService } = require('../dist/modules/principal/services/principal-dashboard.service');

test('learning overview uses saved school records and stays empty without them', async () => {
  const queries = [];
  const service = new PrincipalDashboardService({ query: async (sql, params) => {
    assert.deepEqual(params, ['school-1']);
    queries.push(sql);
    return [];
  } });
  assert.deepEqual(await service.getLearningOverview('school-1'), {
    assignments: [], submissions: [], materials: [], activities: [],
  });
  for (const table of ['assignments', 'submissions', 'teacher_study_materials', 'teacher_lesson_deliveries']) {
    assert.ok(queries.some((sql) => sql.includes(table)), `missing ${table} query`);
  }
});
