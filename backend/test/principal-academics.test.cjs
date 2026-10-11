const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PrincipalAcademicsService } = require('../dist/modules/principal/services/principal-academics.service');

test('principal academics uses stored records without sample performance scores', async () => {
  const service = new PrincipalAcademicsService({
    query: async (sql) => {
      if (sql.includes('FROM sections s')) return [{ id: 'section-1', name: 'A', programName: 'Grade 10', enrolledCount: '2' }];
      if (sql.includes('FROM subjects s')) return [{ id: 'subject-1', name: 'Mathematics', sectionCount: 1, teachers: 'Teacher One' }];
      if (sql.includes('FROM academic_years')) return [];
      if (sql.includes('FROM principal_curriculum_nodes')) return [{ id: 'node-1', grade: 'Grade 10', subject_name: 'Mathematics', unit_name: 'Algebra', chapter_name: 'Quadratics', expected_completion_week: 12, actual_completion_percentage: 40, learning_outcomes: ['Solve equations'], competencies: ['Application'], status: 'On Track' }];
      if (sql.includes('FROM principal_lesson_plans')) return [{ id: 'plan-1', teacher_name: 'Teacher One', class_section: 'A', subject_name: 'Mathematics', topic: 'Quadratics', plannedDate: '2026-10-11', learning_outcomes: 'Solve equations', teaching_strategy: 'Practice', assessment_method: 'Quiz', status: 'Submitted', principal_feedback: '' }];
      return [];
    },
  });

  const result = await service.getAcademicsOverview('org-1', {});
  assert.equal(result.classes[0].studentCount, 2);
  assert.equal(result.classes[0].averageScore, null);
  assert.equal(result.subjects[0].name, 'Mathematics');
  assert.equal(result.subjects[0].average, null);
  assert.equal(result.curriculumNodes[0].actualProgress, 40);
  assert.equal(result.curriculumNodes[0].expectedProgress, null);
  assert.equal(result.lessonPlans[0].topic, 'Quadratics');
});
