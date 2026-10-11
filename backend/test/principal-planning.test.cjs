const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PrincipalPlanningService } = require('../dist/modules/principal/services/principal-planning.service');

test('planning overview returns stored records only and surfaces database errors', async () => {
  const queries = [];
  const service = new PrincipalPlanningService({ query: async (sql, params) => {
    queries.push({ sql, params });
    return [];
  } });
  assert.deepEqual(await service.getPlanningOverview('school-1', {}), {
    plans: [], targets: [], actionPlans: [], meetings: [],
  });
  assert.equal(queries.length, 4);
  assert.ok(queries.every((item) => item.params[0] === 'school-1'));
  const broken = new PrincipalPlanningService({ query: async () => { throw new Error('database unavailable'); } });
  await assert.rejects(() => broken.getPlanningOverview('school-1', {}), /database unavailable/);
});

test('learning and school targets are saved with their category', async () => {
  let captured;
  const service = new PrincipalPlanningService({ query: async (sql, params) => {
    captured = { sql, params };
    return [{ id: 'target-1' }];
  } });
  await service.createTarget('school-1', {}, {
    title: 'Reading fluency', category: 'Learning', baselineValue: '40%',
    targetValue: '70%', ownerName: 'Teacher A', deadline: '2026-12-01',
  });
  assert.match(captured.sql, /organization_id, title, category/);
  assert.deepEqual(captured.params.slice(0, 3), ['school-1', 'Reading fluency', 'Learning']);
});

test('target progress update is scoped to the school', async () => {
  let captured;
  const service = new PrincipalPlanningService({ query: async (sql, params) => {
    captured = { sql, params };
    return [{ id: 'target-1' }];
  } });
  await service.updateTarget('school-1', 'target-1', { currentValue: '55%', progressPercentage: 50 });
  assert.match(captured.sql, /WHERE organization_id = \$1 AND id = \$2/);
  assert.deepEqual(captured.params, ['school-1', 'target-1', '55%', 50]);
});
