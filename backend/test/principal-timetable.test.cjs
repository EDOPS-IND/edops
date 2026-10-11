const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PrincipalTimetableService } = require('../dist/modules/principal/services/principal-timetable.service');
const { SchoolAdminService } = require('../dist/modules/school-admin/school-admin.service');
const { TeacherTimetableService } = require('../dist/modules/teacher/services/teacher-timetable.service');

test('principal timetable returns saved entries and substitutions only', async () => {
  const service = new PrincipalTimetableService(
    { query: async (_sql, params) => { assert.deepEqual(params, ['school-1']); return []; } },
    { getTimetable: async () => ({ entries: [], conflicts: [] }) },
  );
  assert.deepEqual(await service.overview('school-1', { id: 'principal-1' }), {
    entries: [], conflicts: [], substitutions: [], uncovered: [],
  });
});

test('timetable creation rejects teacher, class or room clashes before insert', async () => {
  const queries = [];
  const manager = { query: async (sql) => {
    queries.push(sql);
    if (sql.includes('FROM academic_years')) return [{ id: 'year-1' }];
    if (sql.includes('FROM sections s')) return [{ valid: 1 }];
    if (sql.includes('FROM timetable_entries WHERE organization_id')) return [{ id: 'clash-1' }];
    return [];
  } };
  const service = new SchoolAdminService({ transaction: (run) => run(manager) }, { record: async () => {} });
  service.authorize = async () => ({});
  await assert.rejects(() => service.createTimetableEntry('school-1', { id: 'principal-1' }, {
    sectionId: 'section-1', subjectId: 'subject-1', teacherUserId: 'teacher-1',
    dayOfWeek: 1, periodNumber: 1, startTime: '09:00', endTime: '09:45', roomNumber: 'Room 1',
  }), /already booked/);
  assert.ok(!queries.some((sql) => sql.includes('INSERT INTO timetable_entries')));
});

test('substitute date must match the saved timetable day', async () => {
  const service = new PrincipalTimetableService({ query: async () => [{ dayOfWeek: 1, periodNumber: 1 }] }, {});
  await assert.rejects(() => service.suggestions('school-1', 'entry-1', '2026-10-11'), /Date must match/);
});

test('teacher today timetable reads dated substitutes from saved entries', async () => {
  const queries = [];
  const service = new TeacherTimetableService({ query: async (sql) => { queries.push(sql); return []; } });
  const result = await service.getTodayTimetable('school-1', { id: 'teacher-1' });
  assert.deepEqual(result.slots, []);
  assert.match(queries[0], /principal_timetable_substitutions/);
  assert.match(queries[0], /COALESCE\(ps\.substitute_teacher_user_id, t\.teacher_user_id\)/);
  assert.ok(!queries.some((sql) => sql.includes('teacher_timetable_slots')));
});
