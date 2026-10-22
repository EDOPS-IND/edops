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

test('default school trial plan enables core academic features assessments and exams', async () => {
  const db = {
    query: async sql => {
      if (sql.includes('FROM organizations o')) return [{
        status: 'trialing',
        period_start: new Date(),
        period_end: new Date(Date.now() + 86400000),
        max_students: 500,
        max_teachers: 50,
        features: { arena: true, recordings: true, communication: true },
        implicit_trial: true,
        entitled: true,
      }];
      if (sql.includes('FROM feature_flags')) return [];
      if (sql.includes('FROM feature_overrides')) return [];
      if (sql.includes('FROM feature_catalog')) return [{ key: 'nav:principal:overview:dashboard' }];
      throw new Error(sql);
    },
  };
  const effective = await entitlements(db, 'school', 'principal');
  assert.equal(effective.features.assessments, true);
  assert.equal(effective.features.exams, true);
});
