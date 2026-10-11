require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PrincipalAssessmentsController } = require('../dist/modules/principal/controllers/principal-assessments.controller');
const { entitlements } = require('../dist/modules/billing/entitlements');

test('principal exam routes require exams, while question papers require assessments', () => {
  const feature = method => Reflect.getMetadata('edops:require_feature', PrincipalAssessmentsController.prototype[method]);
  for (const method of ['examinations', 'createExamPlan', 'updateExamPlan', 'importTeacherMarks', 'reviewExamResult', 'publishResults']) {
    assert.equal(feature(method), 'exams');
  }
  for (const method of ['assessments', 'createQuestionPaper', 'reviewQuestionPaper']) {
    assert.equal(feature(method), 'assessments');
  }
});

test('role override is reflected in effective school entitlements', async () => {
  const db = {
    query: async sql => {
      if (sql.includes('FROM organizations o')) return [{ entitled: true, features: { exams: false, assessments: true } }];
      if (sql.includes('FROM feature_flags')) return [];
      if (sql.includes('FROM feature_overrides')) return [{ feature_key: 'exams', role: 'principal', enabled: true }];
      if (sql.includes('FROM feature_catalog')) return [{ key: 'nav:principal:overview:dashboard' }];
      throw new Error(sql);
    },
  };
  assert.equal((await entitlements(db, 'school', 'teacher')).features.exams, false);
  assert.equal((await entitlements(db, 'school', 'principal')).features.exams, true);
  assert.equal((await entitlements(db, 'school', 'principal')).features['nav:principal:overview:dashboard'], true);
});
