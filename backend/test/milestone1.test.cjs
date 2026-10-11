const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { Client } = require('pg');
const { loadConfig } = require('../dist/config');
const { createDataSource } = require('../dist/database/data-source');
const { createApp } = require('../dist/app');
const { hashPassword, verifyPassword, tokenHash } = require('../dist/modules/auth/password');

const password = 'Local-test-password-9546';
const origin = 'http://localhost:3000';
const baseEnv = {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://localhost/edops_test',
  SESSION_SECRET: randomBytes(48).toString('hex'), CORS_ORIGINS: origin,
};

test('configuration rejects unsafe or malformed values', () => {
  assert.equal(loadConfig(baseEnv).trustProxy, false);
  assert.equal(loadConfig({ ...baseEnv, NODE_ENV: 'production', CORS_ORIGINS: 'https://school.example' }).cookieName, '__Host-edops_session');
  for (const override of [
    { SESSION_SECRET: 'short' }, { DATABASE_URL: 'https://example.com' },
    { DATABASE_SCHEMA: 'public;drop schema public' }, { PORT: '0' },
    { NODE_ENV: 'invalid' }, { CORS_ORIGINS: '*' }, { CORS_ORIGINS: `${origin}/path` },
    { NODE_ENV: 'production' }, { TRUST_PROXY: 'true' }, { TRUST_PROXY: '1' }, { DATABASE_SSL: 'maybe' },
  ]) assert.throws(() => loadConfig({ ...baseEnv, ...override }));
});

test('password hashing uses unique salts and rejects incorrect credentials', async () => {
  const first = await hashPassword(password);
  assert.notEqual(first, await hashPassword(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('incorrect', first), false);
  assert.equal(await verifyPassword(password, undefined), false);
  assert.equal(await verifyPassword(password, 'malformed'), false);
  assert.ok(!first.includes(password));
});

test('Milestone 1 against PostgreSQL', { timeout: 120_000 }, async (t) => {
  const testUrl = process.env.TEST_DATABASE_URL;
  assert.ok(testUrl, 'Set TEST_DATABASE_URL to a dedicated PostgreSQL database ending in _test');
  assert.match(new URL(testUrl).pathname, /\/[^/]+_test$/);
  const schema = `m1_test_${randomBytes(8).toString('hex')}`;
  const env = {
    ...process.env, ...baseEnv, DATABASE_URL: testUrl, DATABASE_SCHEMA: schema,
    DATABASE_SSL: process.env.DATABASE_SSL ?? 'false', TRUST_PROXY: '',
  };
  const config = loadConfig(env);
  const db = new Client({
    connectionString: testUrl, ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
    options: '-c timezone=UTC',
  });
  await db.connect();
  let app;
  let url;
  t.after(async () => {
    try { if (app) await app.close(); }
    finally {
      try { await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); }
      finally { await db.end(); }
    }
  });
  await db.query(`CREATE SCHEMA "${schema}"`);
  await db.query(`SET search_path TO "${schema}"`);
  const source = createDataSource(config);
  await source.initialize();
  try {
    assert.equal((await source.runMigrations()).length, 14);
    assert.equal((await source.runMigrations()).length, 0);
  } finally { await source.destroy(); }

  async function restart() {
    if (app) await app.close();
    app = await createApp(config);
    await app.listen(0, '127.0.0.1');
    url = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  }

  function browser(cookie = '') {
    return {
      cookie, csrf: '',
      async request(method, route, body, status, headers = {}) {
        const response = await fetch(`${url}/api${route}`, {
          method,
          headers: { 'Content-Type': 'application/json', Origin: origin,
            Cookie: this.cookie, 'X-CSRF-Token': this.csrf, ...headers },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        for (const value of response.headers.getSetCookie()) this.cookie = value.split(';')[0];
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        if (status !== undefined) assert.equal(response.status, status, `${method} ${route}: ${text}`);
        if (data?.csrfToken) this.csrf = data.csrfToken;
        return { status: response.status, data, headers: response.headers };
      },
      async init() { await this.request('GET', '/auth/csrf', undefined, 200); return this; },
      async login(email) {
        await this.init();
        return this.request('POST', '/auth/login', { email, password }, 200);
      },
    };
  }

  const root = browser();
  const a = browser();
  const b = browser();
  let schoolA;
  let schoolB;
  let userA;
  async function school(slug, email = `${slug}@school.example`) {
    return (await root.request('POST', '/platform/organizations', {
      name: slug, slug, adminEmail: email,
    }, 201)).data;
  }
  const accept = (client, invitation, body = { password }, status = 200) =>
    client.request('POST', '/auth/invitations/accept', { token: invitation.token, ...body }, status);

  await t.test('bootstrap CLI creates exactly one platform admin without disclosing the password', () => {
    const run = () => spawnSync(process.execPath, ['dist/bootstrap-admin.js', 'owner@edops.example'], {
      cwd: path.resolve(__dirname, '..'), env, input: `${password}\n`, encoding: 'utf8', timeout: 15_000,
    });
    const first = run();
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /Platform administrator created:/);
    assert.ok(!`${first.stdout}${first.stderr}`.includes(password));
    const second = run();
    assert.equal(second.status, 1);
    assert.match(second.stderr, /already exists/);
  });
  await restart();

  await t.test('OpenAPI and the API guide cover all operations with accurate security and response contracts', async () => {
    const response = await fetch(`${url}/api/docs-json`);
    assert.equal(response.status, 200);
    const spec = await response.json();
    const guide = readFileSync(path.resolve(__dirname, '../docs/API.md'), 'utf8');
    const cookie = [{ cookie: [] }];
    const write = [{ cookie: [], csrf: [] }];
    const operations = [
      ['get', '/api/health', 200, [], ['status', 'database']],
      ['get', '/api/auth/csrf', 200, [], ['csrfToken']],
      ['post', '/api/auth/login', 200, write, ['user', 'organizations', 'csrfToken']],
      ['get', '/api/auth/me', 200, cookie, ['user', 'organizations']],
      ['post', '/api/auth/logout', 204, write, []],
      ['post', '/api/auth/invitations/accept', 200, write, ['userId', 'organizationId']],
      ['post', '/api/platform/organizations', 201, write, ['organization', 'invitation']],
      ['patch', '/api/platform/organizations/{id}/status', 200, write, ['id', 'name', 'slug', 'timeZone', 'locale', 'status', 'createdAt', 'updatedAt']],
      ['get', '/api/organizations/{id}', 200, cookie, ['id', 'name', 'slug', 'timeZone', 'locale', 'status', 'createdAt', 'updatedAt']],
      ['patch', '/api/organizations/{id}', 200, write, ['id', 'name', 'slug', 'timeZone', 'locale', 'status', 'createdAt', 'updatedAt']],
    ];
    assert.equal(Object.entries(spec.paths).filter(([route]) => !route.startsWith('/api/v1/')).flatMap(([, item]) => Object.keys(item)).length, 12);
    assert.equal(spec.components.securitySchemes.cookie.name, 'edops_session');
    assert.equal(spec.components.securitySchemes.cookie.in, 'cookie');
    assert.equal(spec.components.securitySchemes.csrf.name, 'X-CSRF-Token');
    for (const [method, route, success, security, fields] of operations) {
      const operation = spec.paths[route][method];
      assert.ok(operation.summary && operation.description.length > 100, `${method} ${route}`);
      assert.deepEqual(operation.security, security, `${method} ${route} security`);
      assert.ok(operation.responses[429] && operation.responses[500]);
      const result = operation.responses[success];
      assert.ok(result?.description, `${method} ${route} success response`);
      if (success === 204) assert.equal(result.content, undefined);
      else assert.deepEqual(result.content['application/json'].schema.required, fields);
      if (method !== 'get') assert.ok(operation.responses[403] && operation.responses[413]);
      if (route.includes('{id}')) {
        assert.ok(operation.parameters.some((parameter) => parameter.name === 'id' && parameter.required && parameter.schema.format === 'uuid'));
      }
      assert.ok(guide.includes(`${method.toUpperCase()} ${route.replace('{id}', ':id')}`));
    }
    const schemas = spec.components.schemas;
    assert.equal(schemas.LoginDto.properties.password.minLength, 1);
    assert.equal(schemas.AcceptInvitationDto.properties.password.minLength, 12);
    assert.equal(schemas.CreateOrganizationDto.properties.timeZone.default, 'Asia/Kolkata');
    assert.equal(schemas.CreateOrganizationDto.properties.slug.pattern, '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  });

  await t.test('health, Swagger, CSRF, origin restrictions and session rotation', async () => {
    await root.request('GET', '/health', undefined, 200);
    assert.equal((await fetch(`${url}/api/docs`)).status, 200);
    await root.request('GET', '/auth/me', undefined, 401);
    await root.request('POST', '/auth/login', { email: 'owner@edops.example', password }, 403);
    const csrfResponse = await root.request('GET', '/auth/csrf', undefined, 200);
    assert.match(csrfResponse.headers.get('set-cookie'), /HttpOnly/);
    assert.match(csrfResponse.headers.get('set-cookie'), /SameSite=Lax/);
    assert.equal(csrfResponse.headers.get('cache-control'), 'no-store');
    const oldCookie = root.cookie;
    const oldCsrf = root.csrf;
    await root.request('POST', '/auth/login', { email: 'owner@edops.example', password }, 403, { Origin: 'https://evil.example' });
    const login = await root.request('POST', '/auth/login', { email: ' OWNER@EDOPS.EXAMPLE ', password }, 200);
    assert.equal(login.data.user.isPlatformAdmin, true);
    assert.notEqual(root.cookie, oldCookie);
    assert.notEqual(root.csrf, oldCsrf);
    assert.ok(!JSON.stringify(login.data).includes('password'));
    await browser(oldCookie).request('GET', '/auth/me', undefined, 401);
    await root.request('POST', '/platform/organizations', {}, 403, { 'X-CSRF-Token': oldCsrf });
    await root.request('POST', '/auth/login', { email: 'owner@edops.example', password: 'wrong' }, 401);
    await root.request('POST', '/auth/login', { email: 'missing@edops.example', password }, 401);
  });

  await t.test('provision two schools; tokens are hashed and passwords never become profile data', async () => {
    schoolA = await school('school-a');
    schoolB = await school('school-b');
    const stored = (await db.query('SELECT token_hash FROM invitations WHERE organization_id = $1', [schoolA.organization.id])).rows[0];
    assert.equal(stored.token_hash, tokenHash(schoolA.invitation.token));
    assert.notEqual(stored.token_hash, schoolA.invitation.token);
    await a.init();
    userA = (await accept(a, schoolA.invitation)).data.userId;
    await b.init();
    await accept(b, schoolB.invitation);
    const profile = (await a.login('school-a@school.example')).data;
    await b.login('school-b@school.example');
    assert.equal(profile.user.isPlatformAdmin, false);
    assert.equal(profile.organizations.length, 1);
    assert.equal(profile.organizations[0].id, schoolA.organization.id);
    assert.equal(profile.organizations[0].role, 'school_admin');
    assert.equal((await root.request('GET', '/auth/me', undefined, 200)).data.organizations.length, 0);
    await root.request('POST', '/platform/organizations', { name: 'Duplicate', slug: 'school-a', adminEmail: 'duplicate@school.example' }, 409);
  });

  await t.test('tenant IDs do not authorize cross-school access or platform privileges', async () => {
    const own = `/organizations/${schoolA.organization.id}`;
    const other = `/organizations/${schoolB.organization.id}`;
    await a.request('GET', own, undefined, 200);
    await a.request('GET', other, undefined, 404);
    await a.request('PATCH', other, { name: 'Unauthorized change' }, 404);
    await b.request('GET', own, undefined, 404);
    await root.request('GET', own, undefined, 404);
    await a.request('POST', '/platform/organizations', { name: 'No', slug: 'no', adminEmail: 'no@school.example' }, 403);
    await a.request('PATCH', `/platform/organizations/${schoolA.organization.id}/status`, { status: 'suspended' }, 403);
    for (const body of [{ status: 'active' }, { isPlatformAdmin: true }, { role: 'school_admin' }, { tenantId: schoolB.organization.id }, {}, { name: null }, { name: '  ' }, { timeZone: 'not/a-zone' }, { locale: 'unknown' }]) {
      await a.request('PATCH', own, body, 400);
    }
    const updated = await a.request('PATCH', own, { name: '  School A Updated  ', timeZone: 'UTC', locale: 'en-US' }, 200);
    assert.equal(updated.data.name, 'School A Updated');
    assert.equal(updated.data.slug, 'school-a');
    const audit = (await db.query("SELECT details FROM audit_events WHERE organization_id = $1 AND action = 'organization.updated'", [schoolA.organization.id])).rows;
    assert.equal(audit.length, 1);
    assert.equal(audit[0].details.before.name, 'school-a');
    assert.equal(audit[0].details.after.name, 'School A Updated');
  });

  await t.test('suspension, membership changes and account deactivation affect existing sessions', async () => {
    const own = `/organizations/${schoolA.organization.id}`;
    const status = `/platform/organizations/${schoolA.organization.id}/status`;
    await root.request('PATCH', status, { status: 'suspended' }, 200);
    await a.request('GET', own, undefined, 403);
    await a.request('PATCH', own, { name: 'Denied' }, 403);
    await b.request('GET', `/organizations/${schoolB.organization.id}`, undefined, 200);
    await root.request('PATCH', status, { status: 'active' }, 200);
    await a.request('GET', own, undefined, 200);
    await db.query("UPDATE memberships SET role = 'teacher' WHERE user_id = $1", [userA]);
    await a.request('PATCH', own, { name: 'Denied' }, 403);
    await db.query("UPDATE memberships SET role = 'school_admin', status = 'inactive' WHERE user_id = $1", [userA]);
    await a.request('GET', own, undefined, 404);
    assert.equal((await a.request('GET', '/auth/me', undefined, 200)).data.organizations.length, 0);
    await db.query("UPDATE memberships SET status = 'active' WHERE user_id = $1", [userA]);
    await db.query('UPDATE users SET is_active = false WHERE id = $1', [userA]);
    await a.request('GET', '/auth/me', undefined, 401);
    await a.request('POST', '/auth/login', { email: 'school-a@school.example', password }, 401);
    await db.query('UPDATE users SET is_active = true WHERE id = $1', [userA]);
  });

  await t.test('invites are single-use, expiring and blocked for suspended schools', async () => {
    await restart();
    const guest = await browser().init();
    await accept(guest, schoolA.invitation, { password }, 400);
    const expired = await school('expired');
    await db.query("UPDATE invitations SET expires_at = now() - interval '1 minute' WHERE organization_id = $1", [expired.organization.id]);
    await accept(guest, expired.invitation, { password }, 400);
    const suspended = await school('suspended');
    await root.request('PATCH', `/platform/organizations/${suspended.organization.id}/status`, { status: 'suspended' }, 200);
    await accept(guest, suspended.invitation, { password }, 403);
    const concurrent = await school('concurrent');
    const guest2 = await browser().init();
    const responses = await Promise.all([
      guest.request('POST', '/auth/invitations/accept', { token: concurrent.invitation.token, password }),
      guest2.request('POST', '/auth/invitations/accept', { token: concurrent.invitation.token, password }),
    ]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 400]);
    assert.equal((await db.query('SELECT * FROM memberships WHERE organization_id = $1', [concurrent.organization.id])).rowCount, 1);
  });

  await t.test('an invite cannot take over an existing account or reset its password', async () => {
    await restart();
    const extra = await school('additional-campus', 'school-a@school.example');
    const guest = await browser().init();
    await accept(guest, extra.invitation, { password: 'Attacker-password-9546' }, 403);
    await accept(b, extra.invitation, {}, 403);
    await accept(a, extra.invitation, { password }, 400);
    await accept(a, extra.invitation, {});
    const profile = (await a.request('GET', '/auth/me', undefined, 200)).data;
    assert.equal(profile.organizations.length, 2);
    await a.request('GET', `/organizations/${extra.organization.id}`, undefined, 200);
    const stored = (await db.query('SELECT password_hash FROM users WHERE id = $1', [userA])).rows[0];
    assert.equal(await verifyPassword(password, stored.password_hash), true);
    const fresh = await school('fresh');
    await accept(a, fresh.invitation, { password }, 403);
    await accept(guest, fresh.invitation, {}, 400);
    await accept(guest, fresh.invitation, { password: 'short' }, 400);
  });

  await t.test('failed provisioning and failed invitation acceptance roll back all related rows', async () => {
    await restart();
    await db.query(`CREATE FUNCTION fail_provision() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.email = 'fail@school.example' THEN RAISE EXCEPTION 'Injected test failure'; END IF; RETURN NEW; END; $$;
      CREATE TRIGGER fail_provision BEFORE INSERT ON invitations FOR EACH ROW EXECUTE FUNCTION fail_provision();`);
    try {
      const response = await root.request('POST', '/platform/organizations', { name: 'Rollback', slug: 'rollback', adminEmail: 'fail@school.example' }, 500);
      assert.equal(response.data.message, 'Internal server error');
      assert.equal((await db.query("SELECT * FROM organizations WHERE slug = 'rollback'")).rowCount, 0);
    } finally { await db.query('DROP TRIGGER fail_provision ON invitations; DROP FUNCTION fail_provision()'); }
    const failed = await school('failed-acceptance');
    await db.query(`CREATE FUNCTION fail_membership() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Injected test failure'; END; $$;
      CREATE TRIGGER fail_membership BEFORE INSERT ON memberships FOR EACH ROW EXECUTE FUNCTION fail_membership();`);
    try {
      await accept(await browser().init(), failed.invitation, { password }, 500);
      assert.equal((await db.query("SELECT * FROM users WHERE email = 'failed-acceptance@school.example'")).rowCount, 0);
      assert.equal((await db.query('SELECT accepted_at FROM invitations WHERE organization_id = $1', [failed.organization.id])).rows[0].accepted_at, null);
      assert.equal((await db.query("SELECT * FROM audit_events WHERE organization_id = $1 AND action = 'invitation.accepted'", [failed.organization.id])).rowCount, 0);
    } finally { await db.query('DROP TRIGGER fail_membership ON memberships; DROP FUNCTION fail_membership()'); }
  });

  await t.test('audit records reject mutation and exclude passwords, sessions and raw invite tokens', async () => {
    await assert.rejects(db.query("UPDATE audit_events SET action = 'tampered'"), /append-only/);
    await assert.rejects(db.query('DELETE FROM audit_events'), /append-only/);
    const rows = (await db.query('SELECT * FROM audit_events')).rows;
    const serialized = JSON.stringify(rows);
    for (const secret of [password, schoolA.invitation.token, schoolB.invitation.token, root.cookie, root.csrf]) assert.ok(!serialized.includes(secret));
    for (const action of ['user.bootstrap', 'auth.login', 'organization.created', 'organization.updated', 'organization.status_changed', 'invitation.accepted']) {
      assert.ok(rows.some((row) => row.action === action), action);
    }
    await assert.rejects(db.query('INSERT INTO memberships (organization_id, user_id, role) VALUES ($1, $2, $3)', [schoolA.organization.id, userA, 'school_admin']), { code: '23505' });
    await assert.rejects(db.query('INSERT INTO memberships (organization_id, user_id, role) VALUES ($1, $2, $3)', ['00000000-0000-4000-8000-000000000000', userA, 'school_admin']), { code: '23503' });
  });

  await t.test('logout, database expiry, absolute expiry and explicit revocation reject stale cookies', async () => {
    await restart();
    const oldCookie = a.cookie;
    await a.request('POST', '/auth/logout', {}, 204);
    await browser(oldCookie).request('GET', '/auth/me', undefined, 401);
    assert.equal((await db.query("SELECT * FROM audit_events WHERE actor_id = $1 AND action = 'auth.logout'", [userA])).rowCount, 1);
    await a.login('school-a@school.example');
    await db.query("UPDATE sessions SET expire = now() - interval '1 second' WHERE sess->>'userId' = $1", [userA]);
    await a.request('GET', '/auth/me', undefined, 401);
    await a.login('school-a@school.example');
    await db.query("UPDATE sessions SET sess = jsonb_set(sess::jsonb, '{authenticatedAt}', '1')::json WHERE sess->>'userId' = $1", [userA]);
    await a.request('GET', '/auth/me', undefined, 401);
    await a.login('school-a@school.example');
    await db.query("DELETE FROM sessions WHERE sess->>'userId' = $1", [userA]);
    await a.request('GET', '/auth/me', undefined, 401);
  });

  await t.test('login throttling cannot be bypassed with a spoofed forwarded address', async () => {
    await restart();
    const guest = await browser().init();
    for (let i = 0; i < 11; i++) {
      await guest.request('POST', '/auth/login', { email: 'unknown@school.example', password }, i < 10 ? 401 : 429, { 'X-Forwarded-For': `198.51.100.${i + 1}` });
    }
  });
});
