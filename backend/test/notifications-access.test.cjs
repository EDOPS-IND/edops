require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TeachingAccess } = require('../dist/modules/assignments/teaching-access.service');

test('TeachingAccess allows principal and parent roles', async () => {
  let capturedRoles = null;
  let capturedAuthorize = null;

  const fakeWork = {
    run: async (org, actor, action, payload, key, work, options) => {
      capturedRoles = options.roles;
      capturedAuthorize = options.authorize;
      return work({});
    },
  };

  const teachingAccess = new TeachingAccess(fakeWork);

  // 1. Verify roles array includes principal and parent
  await teachingAccess.run('org-1', { id: 'u1' }, null, null, null, async () => {}, async () => 'ok');
  assert.ok(capturedRoles.includes('principal'), 'roles should include principal');
  assert.ok(capturedRoles.includes('parent'), 'roles should include parent');
  assert.ok(capturedRoles.includes('school_admin'), 'roles should include school_admin');
  assert.ok(capturedRoles.includes('teacher'), 'roles should include teacher');
  assert.ok(capturedRoles.includes('student'), 'roles should include student');

  // 2. Verify platform admin without school membership is granted school_admin access
  const mockManager = {
    query: async (sql) => {
      if (sql.includes('FROM memberships')) return [];
      return [];
    },
  };

  let authorized = false;
  await teachingAccess.run(
    'org-1',
    { id: 'admin-1', isPlatformAdmin: true },
    null,
    null,
    null,
    async (m, role) => {
      assert.equal(role, 'school_admin');
      authorized = true;
    },
    async () => 'ok'
  );
  await capturedAuthorize(mockManager);
  assert.equal(authorized, true);
});
