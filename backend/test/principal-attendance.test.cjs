const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PrincipalDashboardService } = require('../dist/modules/principal/services/principal-dashboard.service');

test('attendance keeps unrecorded days unknown and derives risk from saved records', async () => {
  const rows = [
    [{ date: '2026-10-11', enrolledStudents: 5, markedRecords: 0, presentRecords: 0, pendingRegisters: 1 }],
    [{ id: 'student-1', name: 'Student', markedRecords: 4, presentRecords: 2, daysAbsent: 2 }],
    [{ date: '2026-10-10', markedRecords: 0, presentRecords: 0 }, { date: '2026-10-11', markedRecords: 4, presentRecords: 3 }],
    [{ id: 'teacher-1', name: 'Teacher', approvedLeave: false, recordedClasses: 1 }],
  ];
  const service = new PrincipalDashboardService({ query: async (_sql, params) => {
    assert.deepEqual(params, ['school-1']);
    return rows.shift();
  } });
  const result = await service.getAttendance('school-1');
  assert.equal(result.studentAttendanceRate, null);
  assert.equal(result.pendingRegisters, 1);
  assert.equal(result.atRisk[0].attendanceRate, 50);
  assert.deepEqual(result.trend.map((day) => day.attendanceRate), [null, 75]);
  assert.equal(result.teachers.length, 1);
});
