const assert = require('node:assert/strict');
const { test } = require('node:test');
const { AuthController } = require('../dist/modules/auth/auth.controller');
const { AuthService } = require('../dist/modules/auth/auth.service');
const { hashToken } = require('../dist/modules/auth/jwt.util');

test('logout revokes the supplied refresh token and clears its cookie', async () => {
  const steps = [];
  const auth = {
    revokeRefreshToken: async (token, userId) => steps.push(['revoke', token, userId]),
    recordLogout: async () => steps.push(['audit']),
  };
  const controller = new AuthController(auth, { cookieName: 'session', environment: 'test' });
  const response = { clearCookie: (name) => steps.push(['clear', name]) };
  const request = { user: { id: 'user-1' }, cookies: {} };
  await controller.logout({ refreshToken: 'refresh-1' }, request, response);
  assert.deepEqual(steps, [
    ['revoke', 'refresh-1', 'user-1'], ['clear', 'edops_refresh_token'], ['audit'],
  ]);
});

test('refresh token revocation is scoped to the signed-in user', async () => {
  let captured;
  await AuthService.prototype.revokeRefreshToken.call({
    drizzle: { query: async (sql, params) => { captured = { sql, params }; } },
  }, 'refresh-1', 'user-1');
  assert.match(captured.sql, /user_id = \$2/);
  assert.deepEqual(captured.params, [hashToken('refresh-1'), 'user-1']);
});
