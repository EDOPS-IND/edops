const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { test } = require('node:test');
const { Client } = require('pg');
const { loadConfig } = require('../dist/config');
const { createApp } = require('../dist/app');
const { createDataSource } = require('../dist/database/data-source');
const { bootstrapAdmin } = require('../dist/modules/auth/auth.service');

test('M2 academic structure and provisioning with a non-BYPASSRLS runtime role', { timeout: 120_000 }, async (t) => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl, 'TEST_DATABASE_URL is required');
  assert.match(new URL(databaseUrl).pathname, /\/[^/]+_test$/);
  const suffix = randomBytes(8).toString('hex');
  const schema = `m2_test_${suffix}`;
  const role = `m2_runtime_${suffix}`;
  const secret = randomBytes(48).toString('hex');
  const runtimePassword = randomBytes(24).toString('hex');
  const password = 'Milestone-two-test-password';
  const adminConfig = loadConfig({ ...process.env, NODE_ENV: 'test', DATABASE_URL: databaseUrl,
    DATABASE_SCHEMA: schema, SESSION_SECRET: secret, CORS_ORIGINS: 'http://localhost:3000', TRUST_PROXY: '' });
  const db = new Client({ connectionString: databaseUrl, options: '-c timezone=UTC', ssl: adminConfig.databaseSsl ? { rejectUnauthorized: true } : false });
  await db.connect();
  let app;
  let url;
  let roleCreated = false;
  t.after(async () => {
    try { if (app) await app.close(); }
    finally {
      try {
        await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        if (roleCreated) await db.query(`DROP ROLE "${role}"`);
      } finally { await db.end(); }
    }
  });
  await db.query(`CREATE SCHEMA "${schema}"`);
  await db.query(`SET search_path TO "${schema}"`);
  const source = createDataSource(adminConfig);
  await source.initialize();
  try {
    assert.equal((await source.runMigrations()).length, 6);
    await bootstrapAdmin(source, 'owner@m2.example', password);
  } finally { await source.destroy(); }
  await db.query(`CREATE ROLE "${role}" LOGIN PASSWORD '${runtimePassword}' NOSUPERUSER NOBYPASSRLS`);
  roleCreated = true;
  await db.query(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}";
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "${schema}" TO "${role}"`);
  const runtimeUrl = new URL(databaseUrl);
  runtimeUrl.username = role;
  runtimeUrl.password = runtimePassword;
  const config = { ...adminConfig, databaseUrl: runtimeUrl.toString() };
  async function restart() {
    if (app) await app.close();
    app = await createApp(config);
    await app.listen(0, '127.0.0.1');
    url = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  }
  await restart();

  function browser() {
    return {
      cookie: '', csrf: '',
      async request(method, route, body, status = method === 'POST' ? 201 : 200, headers = {}) {
        const response = await fetch(`${url}/api/v1${route}`, { method,
          headers: { 'Content-Type': 'application/json', Cookie: this.cookie, Origin: 'http://localhost:3000',
            'X-CSRF-Token': this.csrf, 'Idempotency-Key': randomUUID(), ...headers },
          body: body === undefined ? undefined : JSON.stringify(body) });
        for (const cookie of response.headers.getSetCookie()) this.cookie = cookie.split(';')[0];
        const text = await response.text();
        const data = text ? JSON.parse(text) : null;
        if (status !== null) assert.equal(response.status, status, `${method} ${route}: ${text}`);
        if (data?.csrfToken) this.csrf = data.csrfToken;
        return { data, status: response.status, headers: response.headers };
      },
      async init() { await this.request('GET', '/auth/csrf'); return this; },
      async login(email) {
        await this.init();
        return (await this.request('POST', '/auth/login', { email, password }, 200)).data;
      },
    };
  }
  const root = browser();
  await root.login('owner@m2.example');
  async function school(slug) {
    const data = (await root.request('POST', '/platform/organizations', { name: slug, slug, adminEmail: `${slug}@m2.example` })).data;
    const client = await browser().init();
    await client.request('POST', '/auth/invitations/accept', { token: data.invitation.token, password }, 200);
    const profile = await client.login(`${slug}@m2.example`);
    return { id: data.organization.id, client, userId: profile.user.id };
  }
  const a = await school('m2-a');
  const b = await school('m2-b');
  const schoolPath = (org) => `/organizations/${org}`;
  const academicPath = (org, resource) => `${schoolPath(org)}/academics/${resource}`;
  const post = async (resource, body, school = a, status = 201, headers = {}) => (await school.client.request('POST', academicPath(school.id, resource), body, status, headers)).data;
  let yearA, yearB, gradeA, gradeB, subjectA, sectionA, sectionB, batch;
  let teacher, student, student2;
  let enrollment;
  let replayKey;

  await t.test('versioned M1 compatibility and documented M2 routes', async () => {
    assert.equal((await fetch(`${url}/api/health`)).status, 200);
    assert.equal((await fetch(`${url}/api/v1/health`)).status, 200);
    assert.equal((await fetch(`${url}/api/organizations/${a.id}/academics/years`)).status, 404);
    const spec = await (await fetch(`${url}/api/docs-json`)).json();
    const operation = spec.paths['/api/v1/organizations/{organizationId}/academics/years'].post;
    assert.ok(operation.requestBody && operation.responses[201]);
    assert.ok(operation.parameters.some((parameter) => parameter.name === 'Idempotency-Key' && parameter.required));
    assert.deepEqual(operation.security, [{ cookie: [], csrf: [] }]);
    assert.ok(spec.paths['/api/v1/organizations/{organizationId}/invitations/import'].post);
    assert.ok(spec.paths['/api/v1/organizations/{organizationId}/academics/enrollments/{id}/transfer'].post);
    assert.ok(spec.paths['/api/v1/organizations/{organizationId}/academics/my-workspace'].get);
    const cors = await fetch(`${url}/api/v1/auth/login`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'idempotency-key,x-csrf-token' } });
    assert.match(cors.headers.get('access-control-allow-headers'), /Idempotency-Key/);
  });

  await t.test('years and catalogs validate input, preserve partial fields and switch current years atomically', async () => {
    await post('years', { name: 'Invalid', startDate: '2026-02-30', endDate: '2027-04-30' }, a, 400);
    await post('years', { name: 'Invalid', startDate: '2027-06-01', endDate: '2027-04-30' }, a, 400);
    const first = await post('years', { name: '2025-26', startDate: '2025-06-01', endDate: '2026-04-30', isCurrent: true });
    const renamed = (await a.client.request('PATCH', academicPath(a.id, `years/${first.id}`), { name: 'Previous Year' })).data;
    assert.equal(renamed.isCurrent, true);
    await a.client.request('PATCH', academicPath(a.id, `years/${first.id}`), {}, 400);
    await a.client.request('PATCH', academicPath(a.id, `years/${first.id}`), { isCurrent: null }, 400);
    yearA = await post('years', { name: '2026-27', startDate: '2026-06-01', endDate: '2027-04-30', isCurrent: true });
    yearB = await post('years', { name: '2026-27', startDate: '2026-06-01', endDate: '2027-04-30', isCurrent: true }, b);
    assert.equal((await db.query('SELECT count(*)::int AS count FROM academic_years WHERE organization_id = $1 AND is_current', [a.id])).rows[0].count, 1);
    assert.equal((await db.query('SELECT is_current FROM academic_years WHERE id = $1', [first.id])).rows[0].is_current, false);
    gradeA = await post('programs', { name: 'Grade 10', sequenceOrder: 10 });
    gradeB = await post('programs', { name: 'Grade 10', sequenceOrder: 10 }, b);
    const updated = (await a.client.request('PATCH', academicPath(a.id, `programs/${gradeA.id}`), { name: 'Grade Ten' })).data;
    assert.equal(updated.sequenceOrder, 10);
    subjectA = await post('subjects', { name: 'Mathematics', code: ' math ' });
    assert.equal(subjectA.code, 'MATH');
    await post('subjects', { name: 'Duplicate', code: 'math' }, a, 409);
    const list = (await a.client.request('GET', `${academicPath(a.id, 'years')}?limit=1&offset=1`)).data;
    assert.equal(list.items.length, 1);
    assert.equal(list.total, 2);
    await a.client.request('GET', `${academicPath(a.id, 'years')}?limit=101`, undefined, 400);
    await a.client.request('GET', `${academicPath(a.id, 'years')}?role=school_admin`, undefined, 400);
  });

  await t.test('idempotency handles concurrency, conflicting payloads and access rechecks', async () => {
    const key = randomUUID();
    replayKey = key;
    const body = { name: 'Retry Grade', sequenceOrder: 11 };
    await post('programs', body, a, 400, { 'Idempotency-Key': '' });
    const [one, two] = await Promise.all([post('programs', body, a, 201, { 'Idempotency-Key': key }), post('programs', body, a, 201, { 'Idempotency-Key': key })]);
    assert.deepEqual(one, two);
    assert.deepEqual(await post('programs', body, a, 201, { 'Idempotency-Key': key.toUpperCase() }), one);
    await post('programs', { ...body, name: 'Different' }, a, 409, { 'Idempotency-Key': key });
    await post('subjects', { name: 'Different', code: 'OTHER' }, a, 409, { 'Idempotency-Key': key });
    const otherSchool = await post('programs', body, b, 201, { 'Idempotency-Key': key });
    assert.notEqual(otherSchool.id, one.id);
    assert.equal((await db.query("SELECT count(*)::int AS count FROM audit_events WHERE details->'after'->>'id' = $1", [one.id])).rows[0].count, 1);
    await db.query("UPDATE memberships SET status = 'inactive' WHERE organization_id = $1 AND user_id = $2", [a.id, a.userId]);
    await post('programs', body, a, 404, { 'Idempotency-Key': key });
    await db.query("UPDATE memberships SET status = 'active' WHERE organization_id = $1 AND user_id = $2", [a.id, a.userId]);
  });

  await t.test('sections reject foreign-school references and database RLS blocks unscoped queries', async () => {
    await post('sections', { name: '10-A', academicYearId: yearB.id, programId: gradeA.id, capacity: 2 }, a, 404);
    sectionA = await post('sections', { name: '10-A', academicYearId: yearA.id, programId: gradeA.id, capacity: 2 });
    sectionB = await post('sections', { name: '10-B', academicYearId: yearB.id, programId: gradeB.id, capacity: 2 }, b);
    await a.client.request('PATCH', academicPath(a.id, `sections/${sectionB.id}`), { name: 'Intrusion' }, 404);
    await a.client.request('GET', academicPath(b.id, 'years'), undefined, 404);
    await root.request('GET', academicPath(a.id, 'years'), undefined, 404);
    const isolated = new Client({ connectionString: config.databaseUrl, ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
      options: `-c search_path=${schema},public` });
    await isolated.connect();
    try {
      const roleFlags = (await isolated.query('SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user')).rows[0];
      assert.equal(roleFlags.rolsuper, false);
      assert.equal(roleFlags.rolbypassrls, false);
      assert.equal((await isolated.query('SELECT * FROM academic_years')).rowCount, 0);
      await isolated.query('BEGIN');
      await isolated.query("SELECT set_config('app.current_org_id', $1, true)", [a.id]);
      assert.ok((await isolated.query('SELECT * FROM academic_years')).rows.every((row) => row.organization_id === a.id));
      assert.equal((await isolated.query('SELECT * FROM academic_years')).rowCount, 2);
      await assert.rejects(isolated.query('INSERT INTO programs (organization_id, name) VALUES ($1, $2)', [b.id, 'RLS bypass']), { code: '42501' });
      await isolated.query('ROLLBACK');
      assert.equal((await isolated.query('SELECT * FROM academic_years')).rowCount, 0);
      await isolated.query('BEGIN');
      await isolated.query("SELECT set_config('app.current_org_id', $1, true)", [a.id]);
      await assert.rejects(isolated.query('INSERT INTO sections (organization_id, academic_year_id, program_id, name, capacity) VALUES ($1,$2,$3,$4,$5)', [a.id, yearB.id, gradeA.id, 'Foreign FK', 5]), { code: '23503' });
      await isolated.query('ROLLBACK');
    } finally { await isolated.end(); }
  });

  await t.test('bulk invitations are atomic, role-limited and safely replayable without plaintext tokens at rest', async () => {
    await restart();
    const key = randomUUID();
    const records = [{ email: 'teacher@m2.example', role: 'teacher' }, { email: 'student@m2.example', role: 'student' }, { email: 'student2@m2.example', role: 'student' }];
    batch = (await a.client.request('POST', `${schoolPath(a.id)}/invitations/bulk`, { records }, 201, { 'Idempotency-Key': key })).data;
    const replay = (await a.client.request('POST', `${schoolPath(a.id)}/invitations/bulk`, { records }, 201, { 'Idempotency-Key': key })).data;
    assert.deepEqual(batch, replay);
    const stored = (await db.query('SELECT response_ciphertext FROM idempotency_records WHERE key = $1', [key])).rows[0].response_ciphertext;
    assert.ok(!stored.includes(batch.invitations[0].token));
    assert.ok(!Buffer.from(stored, 'base64').toString('utf8').includes(batch.invitations[0].token));
    const status = (await a.client.request('GET', `${schoolPath(a.id)}/invitation-batches/${batch.batchId}`)).data;
    assert.equal(status.invitations.length, 3);
    assert.ok(status.invitations.every((item) => item.status === 'pending' && !('token' in item) && !('tokenHash' in item)));
    await b.client.request('GET', `${schoolPath(b.id)}/invitation-batches/${batch.batchId}`, undefined, 404);
    await a.client.request('POST', `${schoolPath(a.id)}/invitations`, { email: 'promote@m2.example', role: 'school_admin' }, 400);
    await a.client.request('POST', `${schoolPath(a.id)}/invitations/bulk`, { records: [{ email: 'new@m2.example', role: 'teacher' }, records[0]] }, 409);
    assert.equal((await db.query("SELECT * FROM invitations WHERE email = 'new@m2.example'")).rowCount, 0);
    await a.client.request('POST', `${schoolPath(a.id)}/invitations/bulk`, { records: [records[0], { ...records[0], email: ' TEACHER@M2.EXAMPLE ' }] }, 400);
    const people = [];
    for (const invitation of batch.invitations) {
      const client = await browser().init();
      const accepted = (await client.request('POST', '/auth/invitations/accept', { token: invitation.token, password }, 200)).data;
      const profile = await client.login(invitation.email);
      assert.equal(profile.user.isPlatformAdmin, false);
      assert.equal(profile.organizations[0].role, invitation.role);
      people.push({ id: accepted.userId, client });
    }
    [teacher, student, student2] = people;
    await teacher.client.request('GET', academicPath(a.id, 'years'), undefined, 403);
    await student.client.request('POST', `${schoolPath(a.id)}/invitations`, { email: 'intrusion@m2.example', role: 'teacher' }, 403);
  });

  await t.test('CSV parsing, batch status, revocation, expiry and membership updates', async () => {
    const path = `${schoolPath(a.id)}/invitations/import`;
    const imported = (await a.client.request('POST', path, { csv: '\uFEFFemail,role\n"csv@m2.example",teacher\n' })).data;
    const invitation = imported.invitations[0];
    for (const csv of ['role,email\nteacher,x@m2.example', 'email,role\nx@m2.example,school_admin', 'email,role\nx@m2.example,teacher,extra', 'email,role\n"broken', 'email,role\nx@m2.example,teacher\nX@m2.example,student', 'email,role\n' + Array.from({ length: 101 }, (_, index) => `x${index}@m2.example,student`).join('\n')]) {
      await a.client.request('POST', path, { csv }, 400);
    }
    await a.client.request('PATCH', `${schoolPath(a.id)}/invitations/${invitation.id}/revoke`);
    const guest = await browser().init();
    await guest.request('POST', '/auth/invitations/accept', { token: invitation.token, password }, 400);
    await a.client.request('PATCH', `${schoolPath(a.id)}/invitations/${invitation.id}/revoke`, undefined, 409);
    const replacement = (await a.client.request('POST', path, { csv: 'email,role\ncsv@m2.example,teacher' })).data;
    await db.query("UPDATE invitations SET expires_at = now() - interval '1 minute' WHERE id = $1", [replacement.invitations[0].id]);
    const expired = (await a.client.request('GET', `${schoolPath(a.id)}/invitation-batches/${replacement.batchId}`)).data;
    assert.equal(expired.invitations[0].status, 'expired');
    await a.client.request('POST', path, { csv: 'email,role\ncsv@m2.example,teacher' });
    const members = (await a.client.request('GET', `${schoolPath(a.id)}/members?role=teacher`)).data;
    assert.equal(members.total, 1);
    await a.client.request('PATCH', `${schoolPath(a.id)}/members/${teacher.id}`, { status: 'inactive' });
    assert.equal((await teacher.client.request('GET', '/auth/me')).data.organizations.length, 0);
    await a.client.request('PATCH', `${schoolPath(a.id)}/members/${teacher.id}`, { status: 'active' });
    await a.client.request('PATCH', `${schoolPath(a.id)}/members/${teacher.id}`, { status: 'active', role: 'school_admin' }, 400);
    await a.client.request('PATCH', `${schoolPath(a.id)}/members/${a.userId}`, { status: 'inactive' }, 404);
  });

  await t.test('teacher assignment checks school membership, role and active status', async () => {
    await post('teacher-assignments', { sectionId: sectionA.id, subjectId: subjectA.id, teacherUserId: b.userId }, a, 404);
    await post('teacher-assignments', { sectionId: sectionA.id, subjectId: subjectA.id, teacherUserId: student.id }, a, 409);
    const assignment = await post('teacher-assignments', { sectionId: sectionA.id, subjectId: subjectA.id, teacherUserId: teacher.id });
    await post('teacher-assignments', { sectionId: sectionA.id, subjectId: subjectA.id, teacherUserId: teacher.id }, a, 409);
    await a.client.request('PATCH', academicPath(a.id, `teacher-assignments/${assignment.id}`), { teacherUserId: teacher.id });
    await b.client.request('PATCH', academicPath(b.id, `teacher-assignments/${assignment.id}`), { teacherUserId: teacher.id }, 404);
    await a.client.request('PATCH', `${schoolPath(a.id)}/members/${teacher.id}`, { status: 'inactive' });
    await a.client.request('PATCH', academicPath(a.id, `teacher-assignments/${assignment.id}`), { teacherUserId: teacher.id }, 409);
    await a.client.request('PATCH', `${schoolPath(a.id)}/members/${teacher.id}`, { status: 'active' });
    const teacherWorkspace = (await teacher.client.request('GET', academicPath(a.id, 'my-workspace'))).data;
    assert.equal(teacherWorkspace.role, 'teacher');
    assert.deepEqual(teacherWorkspace.assignments.map((item) => [item.sectionName, item.subjectCode]), [['10-A', 'MATH']]);
    assert.equal(teacherWorkspace.students.length, 0);
    await teacher.client.request('GET', academicPath(b.id, 'my-workspace'), undefined, 404);
    const emptyStudentWorkspace = (await student.client.request('GET', academicPath(a.id, 'my-workspace'))).data;
    assert.equal(emptyStudentWorkspace.enrollment, null);
  });

  await t.test('enrollment capacity, unique roll numbers, atomic transfers and withdrawal', async () => {
    await post('enrollments', { studentUserId: teacher.id, sectionId: sectionA.id, rollNumber: '01' }, a, 409);
    enrollment = await post('enrollments', { studentUserId: student.id, sectionId: sectionA.id, rollNumber: '01' });
    await post('enrollments', { studentUserId: student2.id, sectionId: sectionA.id, rollNumber: '01' }, a, 409);
    const other = await post('enrollments', { studentUserId: student2.id, sectionId: sectionA.id, rollNumber: '02' });
    assert.equal(enrollment.academicYearId, yearA.id);
    const teacherWorkspace = (await teacher.client.request('GET', academicPath(a.id, 'my-workspace'))).data;
    assert.deepEqual(teacherWorkspace.students.map((item) => item.email).sort(), ['student2@m2.example', 'student@m2.example']);
    const studentWorkspace = (await student.client.request('GET', academicPath(a.id, 'my-workspace'))).data;
    assert.equal(studentWorkspace.enrollment.sectionName, '10-A');
    assert.equal(studentWorkspace.enrollment.rollNumber, '01');
    assert.deepEqual(studentWorkspace.subjects.map((item) => [item.subjectCode, item.teacherEmail]), [['MATH', 'teacher@m2.example']]);
    await a.client.request('PATCH', academicPath(a.id, `sections/${sectionA.id}`), { capacity: 1 }, 409);
    const target = await post('sections', { name: '10-C', academicYearId: yearA.id, programId: gradeA.id, capacity: 1 });
    await post('enrollments', { studentUserId: student.id, sectionId: target.id, rollNumber: '01' }, a, 409);
    const transferred = await post(`enrollments/${enrollment.id}/transfer`, { sectionId: target.id, rollNumber: '03' });
    assert.equal(transferred.status, 'active');
    assert.equal((await db.query('SELECT status FROM enrollments WHERE id = $1', [enrollment.id])).rows[0].status, 'transferred');
    await post(`enrollments/${other.id}/transfer`, { sectionId: target.id, rollNumber: '04' }, a, 409);
    assert.equal((await db.query('SELECT status FROM enrollments WHERE id = $1', [other.id])).rows[0].status, 'active');
    await a.client.request('PATCH', academicPath(a.id, `enrollments/${transferred.id}`), { rollNumber: '05' });
    await a.client.request('PATCH', academicPath(a.id, `enrollments/${transferred.id}/withdraw`));
    await a.client.request('PATCH', academicPath(a.id, `enrollments/${transferred.id}/withdraw`), undefined, 409);
    await a.client.request('PATCH', academicPath(a.id, `enrollments/${other.id}/withdraw`));
    const results = await Promise.all([
      a.client.request('POST', academicPath(a.id, 'enrollments'), { studentUserId: student.id, sectionId: target.id, rollNumber: '10' }, null),
      a.client.request('POST', academicPath(a.id, 'enrollments'), { studentUserId: student2.id, sectionId: target.id, rollNumber: '11' }, null),
    ]);
    assert.deepEqual(results.map((item) => item.status).sort(), [201, 409]);
  });

  await t.test('domain/audit/idempotency failures roll back together; suspension denies new and replayed work', async () => {
    const key = randomUUID();
    await db.query(`CREATE FUNCTION fail_replay() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.key = '${key}'::uuid THEN RAISE EXCEPTION 'Injected replay failure'; END IF; RETURN NEW; END; $$;
      CREATE TRIGGER fail_replay BEFORE INSERT ON idempotency_records FOR EACH ROW EXECUTE FUNCTION fail_replay()`);
    try {
      await post('programs', { name: 'Rollback Grade' }, a, 500, { 'Idempotency-Key': key });
      assert.equal((await db.query("SELECT * FROM programs WHERE name = 'Rollback Grade'")).rowCount, 0);
      assert.equal((await db.query("SELECT * FROM audit_events WHERE details->'after'->>'name' = 'Rollback Grade'")).rowCount, 0);
    } finally { await db.query('DROP TRIGGER fail_replay ON idempotency_records; DROP FUNCTION fail_replay()'); }
    await root.request('PATCH', `/platform/organizations/${a.id}/status`, { status: 'suspended' });
    await a.client.request('GET', academicPath(a.id, 'years'), undefined, 403);
    await a.client.request('GET', `${schoolPath(a.id)}/members`, undefined, 403);
    await post('programs', { name: 'Retry Grade', sequenceOrder: 11 }, a, 403, { 'Idempotency-Key': replayKey });
    await post('programs', { name: 'Suspended' }, a, 403);
    await b.client.request('GET', academicPath(b.id, 'years'));
    await root.request('PATCH', `/platform/organizations/${a.id}/status`, { status: 'active' });
    const audits = JSON.stringify((await db.query('SELECT * FROM audit_events')).rows);
    assert.ok(!audits.includes(password));
    assert.ok(batch.invitations.every((invitation) => !audits.includes(invitation.token)));
    const enforced = (await db.query("SELECT relname FROM pg_class WHERE relnamespace = $1::regnamespace AND relrowsecurity AND relforcerowsecurity", [schema])).rows;
    assert.equal(enforced.length, 23);
  });

  await t.test('production refuses RLS-bypassing roles and disables Swagger for the restricted runtime role', async () => {
    const production = { ...config, environment: 'production', cookieName: '__Host-edops_session', corsOrigins: ['https://school.example'] };
    await assert.rejects(createApp({ ...production, databaseUrl }), /non-superuser, non-BYPASSRLS/);
    const server = await createApp(production);
    try {
      await server.listen(0, '127.0.0.1');
      const base = `http://127.0.0.1:${server.getHttpServer().address().port}`;
      assert.equal((await fetch(`${base}/api/v1/health`)).status, 200);
      assert.equal((await fetch(`${base}/api/docs`)).status, 404);
    } finally { await server.close(); }
  });
});
