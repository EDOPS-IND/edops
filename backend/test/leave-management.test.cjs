const assert = require('node:assert/strict');
const { test } = require('node:test');
const { TeacherAttendanceService } = require('../dist/modules/teacher/services/teacher-attendance.service');
const { PrincipalDashboardService } = require('../dist/modules/principal/services/principal-dashboard.service');

test('teacher applyLeave calculates days and stores teacher leave request', async () => {
  const allQueries = [];
  const fakeDrizzle = {
    query: async (sql, params) => {
      allQueries.push({ sql, params });
      return [{
        id: 'leave-1',
        leaveType: params?.[3],
        startDate: params?.[4],
        endDate: params?.[5],
        daysCount: params?.[6],
        reason: params?.[7],
        status: 'pending',
      }];
    },
  };

  const service = new TeacherAttendanceService(fakeDrizzle, {});
  const user = { id: 'teacher-user-1', name: 'John Doe', email: 'john@example.com' };
  const res = await service.applyLeave('org-1', user, {
    leaveType: 'casual',
    startDate: '2026-10-26',
    endDate: '2026-10-27',
    reason: 'Personal work',
  });

  assert.equal(res.id, 'leave-1');
  assert.equal(res.daysCount, 2);
  assert.ok(allQueries.some((q) => q.sql.includes("'teacher'")));
  assert.ok(allQueries.some((q) => q.sql.includes('school_broadcasts') && q.sql.includes("'principal'")));
});

test('teacher applyLeave rejects invalid date range', async () => {
  const service = new TeacherAttendanceService({ query: async () => [] }, {});
  await assert.rejects(
    async () => {
      await service.applyLeave('org-1', { id: 'u1' }, {
        leaveType: 'casual',
        startDate: '2026-10-28',
        endDate: '2026-10-26',
        reason: 'Backwards',
      });
    },
    /End date must not precede start date/
  );
});

test('principal updateLeaveStatus approves leave request with review notes', async () => {
  let executedSql = '';
  let executedParams = [];
  const fakeDrizzle = {
    query: async (sql, params) => {
      executedSql = sql;
      executedParams = params;
      return [{
        id: params[3],
        applicantRole: 'teacher',
        status: params[0],
        reviewNotes: params[2],
        reviewedAt: '2026-10-25T12:00:00Z',
      }];
    },
  };

  const principalService = new PrincipalDashboardService(fakeDrizzle);
  const actor = { id: 'principal-1', name: 'Principal Jane' };
  const result = await principalService.updateLeaveStatus('org-1', actor, 'leave-100', 'approved', 'Approved with substitution');

  assert.equal(result.id, 'leave-100');
  assert.equal(result.status, 'approved');
  assert.equal(result.reviewNotes, 'Approved with substitution');
  assert.equal(executedParams[0], 'approved');
  assert.equal(executedParams[1], 'principal-1');
});

test('markNoticeRead records permanent read receipt in broadcast_reads', async () => {
  let capturedSql = '';
  let capturedParams = [];
  const fakeDrizzle = {
    query: async (sql, params) => {
      capturedSql = sql;
      capturedParams = params;
      if (sql.includes('organizations')) {
        return [{ id: 'org-1', status: 'active', user_id: params[1] }];
      }
      return [{ success: true }];
    },
  };

  const { SchoolAdminService } = require('../dist/modules/school-admin/school-admin.service');
  const service = new SchoolAdminService(fakeDrizzle, {}, {}, {}, {}, {}, {});
  const actor = { id: 'user-42', name: 'Teacher Alex' };
  const res = await service.markNoticeRead('org-1', actor, 'notice-999');

  assert.equal(res.success, true);
  assert.equal(res.noticeId, 'notice-999');
  assert.ok(capturedSql.includes('INSERT INTO broadcast_reads'));
  assert.deepEqual(capturedParams, ['org-1', 'notice-999', 'user-42']);
});

test('markAllNoticesRead marks all visible broadcasts as read permanently', async () => {
  let capturedSql = '';
  let capturedParams = [];
  const fakeDrizzle = {
    query: async (sql, params) => {
      capturedSql = sql;
      capturedParams = params;
      if (sql.includes('organizations')) {
        return [{ id: 'org-1', status: 'active', user_id: params[1] }];
      }
      return [{ success: true }];
    },
  };

  const { SchoolAdminService } = require('../dist/modules/school-admin/school-admin.service');
  const service = new SchoolAdminService(fakeDrizzle, {}, {}, {}, {}, {}, {});
  const actor = { id: 'user-42', name: 'Teacher Alex' };
  const res = await service.markAllNoticesRead('org-1', actor);

  assert.equal(res.success, true);
  assert.ok(capturedSql.includes('INSERT INTO broadcast_reads'));
  assert.ok(capturedSql.includes('FROM school_broadcasts'));
  assert.deepEqual(capturedParams, ['org-1', 'user-42']);
});

