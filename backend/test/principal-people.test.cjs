const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PrincipalTeachersService } = require('../dist/modules/principal/services/principal-teachers.service');

test('People overview is empty without school records and rejects unknown teachers', async () => {
  const service = new PrincipalTeachersService({ query: async () => [] });
  const overview = await service.getTeachersOverview('school-1', {});
  assert.deepEqual(overview.teachers, []);
  assert.deepEqual(overview.departments, []);
  assert.deepEqual(overview.coordinators, []);
  await assert.rejects(() => service.getTeacherAcademicProfile('school-1', {}, 'unknown'), /Active teacher not found/);
  await assert.rejects(() => service.assignTeacher('school-1', 'class-1', 'subject-1', 'unknown'), /Active teacher not found/);
});

test('People overview and dossier use the selected stored teacher', async () => {
  const service = new PrincipalTeachersService({
    query: async (sql) => {
      if (sql.includes('FROM memberships m JOIN users u')) return [{ id: 'teacher-1', name: 'Actual Teacher', email: 'teacher@school.test', department: 'Science', memberSince: '2025-01-01' }];
      if (sql.includes('SELECT csa.id, sec.id AS "sectionId"')) return [{ id: 'assignment-1', sectionId: 'section-1', className: 'Grade 9 - A', subject: 'Science', studentCount: 12 }];
      if (sql.includes('FROM class_subject_assignments csa')) return [{ id: 'assignment-1', teacherUserId: 'teacher-1', teacherName: 'Actual Teacher', sectionId: 'section-1', subjectId: 'subject-1', className: 'Grade 9 - A', subjectName: 'Science' }];
      if (sql.includes('FROM principal_lesson_plans')) return [{ teacherUserId: 'teacher-1', total: 2, completed: 1 }];
      if (sql.includes('SELECT id, observation_date')) return [];
      if (sql.includes('FROM principal_teacher_observations')) return [{ teacherUserId: 'teacher-1', count: 0 }];
      if (sql.includes('FROM timetable_entries')) return [{ teacherUserId: 'teacher-1', count: 4 }];
      return [];
    },
  });
  const overview = await service.getTeachersOverview('school-1', {});
  assert.equal(overview.teachers[0].name, 'Actual Teacher');
  assert.deepEqual(overview.teachers[0].classes, ['Grade 9 - A']);
  assert.equal(overview.teachers[0].weeklyPeriods, 4);
  assert.equal(overview.teachers[0].lessonPlanCompliance, 50);
  const profile = await service.getTeacherAcademicProfile('school-1', {}, 'teacher-1');
  assert.equal(profile.overview.email, 'teacher@school.test');
  assert.equal(profile.workload.studentCount, 12);
});

test('training completion stays scoped to the selected school', async () => {
  let captured;
  const service = new PrincipalTeachersService({ query: async (sql, params) => {
    captured = { sql, params };
    return [{ id: 'training-1' }];
  } });
  await service.completeDevelopment('school-1', 'training-1');
  assert.match(captured.sql, /organization_id = \$1 AND id = \$2/);
  assert.deepEqual(captured.params, ['school-1', 'training-1']);
});
