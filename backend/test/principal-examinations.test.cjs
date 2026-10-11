const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PrincipalAssessmentsService } = require('../dist/modules/principal/services/principal-assessments.service');

test('examination overview has no fallback schedules or results', async () => {
  const service = new PrincipalAssessmentsService({ query: async (_sql, params) => {
    assert.deepEqual(params, ['school-1']); return [];
  } });
  const result = await service.getExaminationsOverview('school-1', {});
  assert.deepEqual(result.plans, []);
  assert.deepEqual(result.results, []);
  assert.deepEqual(result.reportCards, []);
  assert.deepEqual(result.workflow, { entered: 0, verified: 0, approved: 0, published: 0 });
});

test('publishing requires saved approved rows and reports the locked count', async () => {
  const actor = { id: 'principal-1' };
  const dto = { term: '2026', examName: 'Exam', className: 'Grade 10', sectionName: 'A' };
  const empty = new PrincipalAssessmentsService({ transaction: async (run) => run({ query: async () => [] }) });
  await assert.rejects(() => empty.publishResults('school-1', actor, dto), /No saved results/);
  const approved = new PrincipalAssessmentsService({ transaction: async (run) => run({ query: async (sql) =>
    sql.startsWith('SELECT') ? [{ id: 'result-1', status: 'Approved', is_locked: false }] : [{ id: 'result-1' }] }) });
  assert.deepEqual(await approved.publishResults('school-1', actor, dto), { published: 1 });
});

test('import only accepts actual enrolled student scores', async () => {
  const service = new PrincipalAssessmentsService({ transaction: async (run) => run({ query: async (sql) => {
    if (sql.includes('FROM exam_evaluations e')) return [{ title: 'Exam', maxMarks: 50, studentScores: { 'student-1': 42 },
      className: 'Grade 10', sectionName: 'A', subjectName: 'Science', term: '2026', sectionId: 'section-1', yearId: 'year-1' }];
    if (sql.includes('FROM enrollments e')) return [{ id: 'student-1', name: 'Student' }];
    if (sql.includes('INSERT INTO principal_exam_results')) return [{ id: 'result-1' }];
    return [];
  } }) });
  assert.deepEqual(await service.importTeacherMarks('school-1', 'evaluation-1'), { imported: 1 });
});
