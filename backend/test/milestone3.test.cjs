const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { Client } = require('pg');
const { loadConfig } = require('../dist/config');
const { createApp } = require('../dist/app');
const { createDataSource } = require('../dist/database/data-source');
const { hashPassword } = require('../dist/modules/auth/password');

test('M3 teaching workflows with real PostgreSQL RLS and transactional scorecards', { timeout: 120_000 }, async (t) => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl);
  assert.match(new URL(databaseUrl).pathname, /\/[^/]+_test$/);
  const suffix = randomBytes(8).toString('hex');
  const schema = `m3_test_${suffix}`;
  const role = `m3_runtime_${suffix}`;
  const password = 'Milestone-three-test-password';
  const runtimePassword = randomBytes(24).toString('hex');
  const config = loadConfig({ ...process.env, NODE_ENV: 'test', DATABASE_URL: databaseUrl, DATABASE_SCHEMA: schema,
    SESSION_SECRET: randomBytes(48).toString('hex'), CORS_ORIGINS: 'http://localhost:3000', TRUST_PROXY: '' });
  const ssl = config.databaseSsl ? { rejectUnauthorized: true } : false;
  const db = new Client({ connectionString: databaseUrl, ssl, options: '-c timezone=UTC' });
  await db.connect();
  let app;
  let createdRole = false;
  t.after(async () => {
    try { if (app) await app.close(); }
    finally {
      try {
        await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        if (createdRole) await db.query(`DROP ROLE "${role}"`);
      } finally { await db.end(); }
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
  const hash = await hashPassword(password);
  const org = randomUUID(), foreignOrg = randomUUID(), section = randomUUID(), otherSection = randomUUID(), foreignSection = randomUUID();
  const subject = randomUUID(), otherSubject = randomUUID(), foreignSubject = randomUUID();
  const year = new Date().getUTCFullYear();
  const today = new Date().toISOString().slice(0, 10);
  for (const [id, name, sections, subjects] of [[org, 'school-a', [section, otherSection], [subject, otherSubject]], [foreignOrg, 'school-b', [foreignSection], [foreignSubject]]]) {
    await db.query("INSERT INTO organizations (id,name,slug,time_zone) VALUES ($1,$2,$2,'UTC')", [id, name]);
    const academicYear = randomUUID(), program = randomUUID();
    await db.query('INSERT INTO academic_years (id,organization_id,name,start_date,end_date) VALUES ($1,$2,$3,$4,$5)', [academicYear, id, 'Current', `${year - 1}-01-01`, `${year + 1}-12-31`]);
    await db.query('INSERT INTO programs (id,organization_id,name) VALUES ($1,$2,$3)', [program, id, 'Grade 10']);
    for (const item of sections) await db.query('INSERT INTO sections (id,organization_id,academic_year_id,program_id,name,capacity) VALUES ($1,$2,$3,$4,$5,50)', [item, id, academicYear, program, item]);
    for (const item of subjects) await db.query('INSERT INTO subjects (id,organization_id,name,code) VALUES ($1,$2,$3,$4)', [item, id, item, item.slice(0, 8)]);
  }
  const people = {};
  for (const [name, membershipRole, school] of [['admin','school_admin',org], ['teacher','teacher',org], ['otherTeacher','teacher',org], ['student','student',org], ['student2','student',org], ['newStudent','student',org], ['parent','parent',org], ['foreignAdmin','school_admin',foreignOrg], ['owner',null,null]]) {
    const id = randomUUID();
    await db.query('INSERT INTO users (id,email,password_hash,is_platform_admin) VALUES ($1,$2,$3,$4)', [id, `${name.toLowerCase()}@m3.example`, hash, name === 'owner']);
    if (school) await db.query('INSERT INTO memberships (organization_id,user_id,role) VALUES ($1,$2,$3)', [school, id, membershipRole]);
    people[name] = { id, email: `${name.toLowerCase()}@m3.example` };
  }
  await db.query('INSERT INTO class_subject_assignments (organization_id,section_id,subject_id,teacher_user_id) VALUES ($1,$2,$3,$4)', [org, section, subject, people.teacher.id]);
  await db.query('INSERT INTO class_subject_assignments (organization_id,section_id,subject_id,teacher_user_id) VALUES ($1,$2,$3,$4)', [org, otherSection, otherSubject, people.otherTeacher.id]);
  async function enroll(person, target = section) {
    await db.query(`INSERT INTO enrollments (organization_id,student_user_id,section_id,academic_year_id,roll_number)
      SELECT organization_id,$2,id,academic_year_id,$4 FROM sections WHERE organization_id=$1 AND id=$3`, [org, person.id, target, person.id.slice(0, 8)]);
  }
  await enroll(people.student);
  await enroll(people.student2);
  await db.query(`CREATE ROLE "${role}" LOGIN PASSWORD '${runtimePassword}' NOSUPERUSER NOBYPASSRLS`);
  createdRole = true;
  await db.query(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}";
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "${schema}" TO "${role}"`);
  const runtimeUrl = new URL(databaseUrl);
  runtimeUrl.username = role;
  runtimeUrl.password = runtimePassword;
  app = await createApp({ ...config, databaseUrl: runtimeUrl.toString() });
  await app.listen(0, '127.0.0.1');
  const url = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  function browser() {
    return {
      cookie: '', csrf: '',
      async request(method, path, body, expected = method === 'POST' ? 201 : 200, headers = {}) {
        const res = await fetch(`${url}/api/v1${path}`, { method, headers: { 'Content-Type': 'application/json',
          Origin: 'http://localhost:3000', Cookie: this.cookie, 'X-CSRF-Token': this.csrf, 'Idempotency-Key': randomUUID(), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
        for (const cookie of res.headers.getSetCookie()) this.cookie = cookie.split(';')[0];
        const data = await res.json();
        if (data.csrfToken) this.csrf = data.csrfToken;
        assert.equal(res.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
        return data;
      },
    };
  }
  for (const person of Object.values(people)) {
    person.client = browser();
    await person.client.request('GET', '/auth/csrf');
    await person.client.request('POST', '/auth/login', { email: person.email, password }, 200);
  }
  const { admin, teacher, otherTeacher, student, student2, newStudent, parent, foreignAdmin, owner } = people;
  const base = `/organizations/${org}/teaching`;
  const foreignBase = `/organizations/${foreignOrg}/teaching`;
  const query = `sectionId=${section}&subjectId=${subject}`;
  const call = (who, method, path, body, status, headers) => who.client.request(method, `${base}/${path}`, body, status, headers);
  const assignmentBody = { sectionId: section, subjectId: subject, title: 'Equations', description: 'Solve and explain.', dueAt: new Date(Date.now() + 86400_000).toISOString(), maxScore: 20 };
  let assignment, secondAssignment, attendance, submission;
  const createKey = randomUUID(), publishKey = randomUUID(), submitKey = randomUUID();

  await t.test('teaching Swagger documents all 16 operations, schemas and security', async () => {
    const spec = await (await fetch(`${url}/api/docs-json`)).json();
    const paths = Object.entries(spec.paths).filter(([path]) => path.includes('/teaching'));
    const guide = readFileSync('docs/MILESTONE-3.md', 'utf8');
    let count = 0;
    for (const [path, item] of paths) for (const [method, operation] of Object.entries(item)) {
      count++;
      assert.ok(operation.summary && operation.description.length > 100);
      assert.deepEqual(operation.security, method === 'get' ? [{ cookie: [] }] : [{ cookie: [], csrf: [] }]);
      assert.ok(operation.responses[method === 'post' ? 201 : 200].content['application/json'].schema);
      assert.ok(guide.includes(`${method.toUpperCase()} ${path.split('/teaching/')[1].replaceAll('{id}', ':id')}`));
      if (method === 'post') assert.ok(operation.parameters.some((p) => p.name === 'Idempotency-Key' && p.required));
    }
    assert.equal(count, 16);
    assert.equal(spec.info.version, '0.6.0');
    assert.equal(spec.components.schemas.Scorecard.properties.avgScore.nullable, true);
    assert.equal((await fetch(`${url}/api/organizations/${org}/teaching/classes`)).status, 404);
  });

  await t.test('class policies deny foreign tenants, parents, platform bypass and other teachers', async () => {
    assert.equal((await call(teacher, 'GET', 'classes')).total, 1);
    assert.equal((await call(student, 'GET', 'classes')).total, 1);
    assert.equal((await call(admin, 'GET', `roster?${query}`)).total, 2);
    await call(student, 'GET', `roster?${query}`, undefined, 403);
    await call(parent, 'GET', 'classes', undefined, 403);
    await call(owner, 'GET', 'classes', undefined, 404);
    await call(foreignAdmin, 'GET', 'classes', undefined, 404);
    await teacher.client.request('GET', `${foreignBase}/classes`, undefined, 404);
    await call(otherTeacher, 'POST', 'assignments', assignmentBody, 404);
    await call(student, 'POST', 'assignments', assignmentBody, 403);
    await call(teacher, 'POST', 'assignments', { ...assignmentBody, sectionId: foreignSection }, 404);
    await call(teacher, 'POST', 'assignments', { ...assignmentBody, subjectId: foreignSubject }, 404);
    await call(teacher, 'POST', 'assignments', assignmentBody, 403, { 'X-CSRF-Token': '' });
    await call(teacher, 'POST', 'assignments', assignmentBody, 400, { 'Idempotency-Key': '' });
    await call(teacher, 'GET', `assignments?sectionId=${section}`, undefined, 400);
    await call(teacher, 'POST', 'assignments', { ...assignmentBody, dueAt: '2026-02-30T12:00:00Z' }, 400);
    await call(teacher, 'POST', 'assignments', { ...assignmentBody, maxScore: 0 }, 400);
    await call(teacher, 'POST', 'assignments', { ...assignmentBody, status: 'published' }, 400);
  });

  await t.test('draft edits preserve omitted fields; publish captures a fixed audience and replays once', async () => {
    assignment = await call(teacher, 'POST', 'assignments', assignmentBody, 201, { 'Idempotency-Key': createKey });
    assert.equal(assignment.status, 'draft');
    assert.equal((await call(student, 'GET', `assignments?${query}`)).total, 0);
    await call(student, 'GET', `assignments/${assignment.id}`, undefined, 404);
    const updated = await call(teacher, 'PATCH', `assignments/${assignment.id}`, { title: 'Updated title' });
    assert.equal(updated.description, assignmentBody.description);
    await call(teacher, 'PATCH', `assignments/${assignment.id}`, {}, 400);
    await call(teacher, 'PATCH', `assignments/${assignment.id}`, { description: null }, 400);
    await call(teacher, 'POST', `assignments/${assignment.id}/publish`, { studentId: student.id }, 400);
    const results = await Promise.all([1, 2].map(() => call(teacher, 'POST', `assignments/${assignment.id}/publish`, {}, 201, { 'Idempotency-Key': publishKey })));
    assert.deepEqual(results[0], results[1]);
    assert.equal(results[0].status, 'published');
    await call(teacher, 'POST', `assignments/${assignment.id}/publish`, {}, 409);
    await call(teacher, 'PATCH', `assignments/${assignment.id}`, { maxScore: 1 }, 409);
    assert.equal((await call(teacher, 'GET', `assignments/${assignment.id}/submissions`)).total, 2);
    const own = await call(student, 'GET', `assignments/${assignment.id}/submissions`);
    assert.equal(own.total, 1);
    assert.equal(own.items[0].studentId, student.id);
    assert.equal(own.items[0].status, 'pending');
    await enroll(newStudent);
    await call(newStudent, 'GET', `assignments/${assignment.id}`, undefined, 404);
    assert.equal((await call(newStudent, 'GET', `assignments?${query}`)).total, 0);
  });

  await t.test('student ownership, idempotent submission, grading and grade corrections', async () => {
    const pending = (await call(student2, 'GET', `assignments/${assignment.id}/submissions`)).items[0];
    await call(teacher, 'PATCH', `submissions/${pending.id}/grade`, { score: 0 }, 409);
    await call(student, 'POST', `assignments/${assignment.id}/submissions`, { content: 'Answer', studentId: student2.id }, 400);
    await call(teacher, 'POST', `assignments/${assignment.id}/submissions`, { content: 'Teacher answer' }, 403);
    const answers = await Promise.all([1, 2].map(() => call(student, 'POST', `assignments/${assignment.id}/submissions`, { content: 'My private answer' }, 201, { 'Idempotency-Key': submitKey })));
    assert.deepEqual(answers[0], answers[1]);
    submission = answers[0];
    await call(student, 'POST', `assignments/${assignment.id}/submissions`, { content: 'Different' }, 409, { 'Idempotency-Key': submitKey });
    await call(otherTeacher, 'PATCH', `submissions/${submission.id}/grade`, { score: 10 }, 404);
    await call(student2, 'PATCH', `submissions/${submission.id}/grade`, { score: 20 }, 403);
    await foreignAdmin.client.request('PATCH', `${foreignBase}/submissions/${submission.id}/grade`, { score: 20 }, 404);
    await call(teacher, 'PATCH', `submissions/${submission.id}/grade`, { score: 21 }, 400);
    const graded = await call(teacher, 'PATCH', `submissions/${submission.id}/grade`, { score: 10, feedback: 'Check step two.' });
    assert.equal(graded.gradedBy, teacher.id);
    assert.equal(graded.status, 'graded');
    let score = (await call(student, 'GET', `scorecards?${query}`)).items[0];
    assert.equal(score.avgScore, 50);
    assert.equal(score.completionPct, 100);
    assert.equal(score.attendancePct, null);
    assert.equal((await call(student2, 'GET', `scorecards?${query}`)).items[0].completionPct, 0);
    await call(student, 'POST', `assignments/${assignment.id}/submissions`, { content: 'Replace graded' }, 409);
    await call(teacher, 'PATCH', `submissions/${submission.id}/grade`, { score: 20 });
    score = (await call(student, 'GET', `scorecards?${query}`)).items[0];
    assert.equal(score.avgScore, 100);
    assert.equal(score.gradedCount, 1);
    assert.equal((await call(student, 'GET', `assignments/${assignment.id}/submissions`)).items[0].feedback, 'Check step two.');
    assert.equal((await call(student2, 'GET', `assignments/${assignment.id}/submissions`)).items[0].content, null);
  });

  await t.test('late submission timestamps and aggregation across different maximum scores', async () => {
    secondAssignment = await call(teacher, 'POST', 'assignments', { ...assignmentBody, maxScore: 100 });
    await call(teacher, 'POST', `assignments/${secondAssignment.id}/publish`, {});
    await db.query("UPDATE assignments SET due_at=now()-interval '1 hour' WHERE id=$1", [secondAssignment.id]);
    const answer = await call(student, 'POST', `assignments/${secondAssignment.id}/submissions`, { content: 'Late answer' });
    assert.equal(answer.status, 'late');
    await call(teacher, 'PATCH', `submissions/${answer.id}/grade`, { score: 50 });
    const report = (await call(student, 'GET', `scorecards?${query}`)).items[0];
    assert.equal(report.avgScore, 75);
    assert.equal(report.assignmentCount, 2);
    assert.equal(report.gradedCount, 2);
  });

  await t.test('attendance snapshots, atomic batches, finalization and student-only visibility', async () => {
    const body = { sectionId: section, subjectId: subject, date: today, period: 1 };
    await call(teacher, 'POST', 'attendance-sessions', { ...body, date: `${year + 1}-01-01` }, 400);
    await call(teacher, 'POST', 'attendance-sessions', { ...body, subjectId: undefined }, 404);
    attendance = await call(teacher, 'POST', 'attendance-sessions', body);
    await call(teacher, 'POST', 'attendance-sessions', body, 409);
    assert.equal((await call(teacher, 'GET', `attendance-sessions/${attendance.id}/records`)).total, 3);
    assert.equal((await call(student, 'GET', `attendance-sessions?${query}`)).total, 0);
    await call(student, 'GET', `attendance-sessions/${attendance.id}/records`, undefined, 404);
    await call(teacher, 'POST', `attendance-sessions/${attendance.id}/finalize`, {}, 409);
    await call(teacher, 'PATCH', `attendance-sessions/${attendance.id}/records`, { records: [{ studentId: student.id, status: 'present' }, { studentId: foreignAdmin.id, status: 'absent' }] }, 404);
    assert.equal((await call(teacher, 'GET', `attendance-sessions/${attendance.id}/records`)).items.find((r) => r.studentId === student.id).status, null);
    await call(teacher, 'PATCH', `attendance-sessions/${attendance.id}/records`, { records: [{ studentId: student.id, status: 'present' }, { studentId: student.id.toUpperCase(), status: 'absent' }] }, 400);
    await call(teacher, 'PATCH', `attendance-sessions/${attendance.id}/records`, { records: [{ studentId: student.id, status: null }] }, 400);
    for (const invalid of [null, 123, { studentId: 123, status: 'present' }]) {
      await call(teacher, 'PATCH', `attendance-sessions/${attendance.id}/records`, { records: [invalid] }, 400);
    }
    await call(teacher, 'PATCH', `attendance-sessions/${attendance.id}/records`, { records: [student, student2, newStudent].map((person) => ({ studentId: person.id, status: person === student2 ? 'excused' : 'present' })) });
    const key = randomUUID();
    const finalized = await call(teacher, 'POST', `attendance-sessions/${attendance.id}/finalize`, {}, 201, { 'Idempotency-Key': key });
    assert.deepEqual(await call(teacher, 'POST', `attendance-sessions/${attendance.id}/finalize`, {}, 201, { 'Idempotency-Key': key }), finalized);
    assert.equal((await call(student, 'GET', `attendance-sessions/${attendance.id}/records`)).total, 1);
    assert.equal((await call(student, 'GET', `scorecards?${query}`)).items[0].attendancePct, 100);
    assert.equal((await call(student2, 'GET', `scorecards?${query}`)).items[0].attendancePct, null);
    await call(student, 'PATCH', `attendance-sessions/${attendance.id}/records`, { records: [{ studentId: student.id, status: 'present' }] }, 403);
    await call(teacher, 'PATCH', `attendance-sessions/${attendance.id}/records`, { records: [{ studentId: student.id, status: 'absent' }] });
    assert.equal((await call(student, 'GET', `scorecards?${query}`)).items[0].attendancePct, 0);
    const next = await call(teacher, 'POST', 'attendance-sessions', { ...body, period: 2 });
    await call(teacher, 'PATCH', `attendance-sessions/${next.id}/records`, { records: [student, student2, newStudent].map((person) => ({ studentId: person.id, status: 'late' })) });
    await call(teacher, 'POST', `attendance-sessions/${next.id}/finalize`, {});
    const score = (await call(student, 'GET', `scorecards?${query}`)).items[0];
    assert.equal(score.attendancePct, 50);
    assert.equal(score.attendanceCount, 2);
    assert.equal(score.avgScore, 75);
    assert.equal(score.assignmentCount, 2);
    const beforeRead = score.generatedAt;
    assert.equal((await call(student, 'GET', `scorecards?${query}`)).items[0].generatedAt, beforeRead);
    const whole = await call(admin, 'POST', 'attendance-sessions', { sectionId: section, date: today, period: 1 });
    await call(teacher, 'GET', `attendance-sessions/${whole.id}/records`, undefined, 404);
    assert.equal((await call(admin, 'GET', `attendance-sessions?sectionId=${section}`)).total, 1);
  });

  await t.test('audit failures roll back grades, attendance corrections, aggregates and replay reservations', async () => {
    const before = (await call(student, 'GET', `scorecards?${query}`)).items[0];
    const key = randomUUID();
    await db.query(`CREATE FUNCTION fail_m3_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.action IN ('submission.graded','attendance.marked','assignment.created') THEN RAISE EXCEPTION 'Injected audit failure'; END IF; RETURN NEW; END; $$;
      CREATE TRIGGER fail_m3_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION fail_m3_audit()`);
    try {
      await call(teacher, 'PATCH', `submissions/${submission.id}/grade`, { score: 0 }, 500);
      await call(teacher, 'PATCH', `attendance-sessions/${attendance.id}/records`, { records: [{ studentId: student.id, status: 'present' }] }, 500);
      await call(teacher, 'POST', 'assignments', { ...assignmentBody, title: 'Must roll back' }, 500, { 'Idempotency-Key': key });
      assert.deepEqual((await call(student, 'GET', `scorecards?${query}`)).items[0], before);
      assert.equal((await db.query('SELECT score FROM submissions WHERE id=$1', [submission.id])).rows[0].score, 20);
      assert.equal((await db.query("SELECT count(*)::int AS count FROM assignments WHERE title='Must roll back'")).rows[0].count, 0);
      assert.equal((await db.query('SELECT * FROM idempotency_records WHERE key=$1', [key])).rowCount, 0);
    } finally { await db.query('DROP TRIGGER fail_m3_audit ON audit_events; DROP FUNCTION fail_m3_audit()'); }
  });

  await t.test('teacher reassignment, enrollment removal and school suspension invalidate replay access', async () => {
    await db.query('UPDATE class_subject_assignments SET teacher_user_id=$1 WHERE organization_id=$2 AND section_id=$3 AND subject_id=$4', [otherTeacher.id, org, section, subject]);
    await call(teacher, 'POST', 'assignments', assignmentBody, 404, { 'Idempotency-Key': createKey });
    await call(teacher, 'POST', `assignments/${assignment.id}/publish`, {}, 404, { 'Idempotency-Key': publishKey });
    await call(otherTeacher, 'GET', `assignments/${assignment.id}`);
    await db.query("UPDATE enrollments SET status='withdrawn' WHERE organization_id=$1 AND student_user_id=$2", [org, student.id]);
    await call(student, 'POST', `assignments/${assignment.id}/submissions`, { content: 'My private answer' }, 404, { 'Idempotency-Key': submitKey });
    await call(student, 'GET', `scorecards?${query}`, undefined, 404);
    await db.query("UPDATE memberships SET status='inactive' WHERE organization_id=$1 AND user_id=$2", [org, otherTeacher.id]);
    await call(otherTeacher, 'GET', `assignments/${assignment.id}`, undefined, 404);
    await db.query("UPDATE organizations SET status='suspended' WHERE id=$1", [org]);
    await call(admin, 'GET', `assignments?${query}`, undefined, 403);
    await call(student2, 'GET', `scorecards?${query}`, undefined, 403);
    await db.query("UPDATE organizations SET status='active' WHERE id=$1", [org]);
  });

  await t.test('all five M3 tables enforce RLS, tenant FKs and clear transaction-local context', async () => {
    const connection = new Client({ connectionString: runtimeUrl.toString(), ssl, options: `-c search_path=${schema}` });
    await connection.connect();
    try {
      for (const table of ['assignments','submissions','attendance_sessions','attendance_records','scorecards']) assert.equal((await connection.query(`SELECT * FROM ${table}`)).rowCount, 0);
      await connection.query('BEGIN');
      await connection.query("SELECT set_config('app.current_org_id',$1,true)", [org]);
      for (const table of ['assignments','submissions','attendance_sessions','attendance_records','scorecards']) {
        const rows = (await connection.query(`SELECT organization_id FROM ${table}`)).rows;
        assert.ok(rows.length > 0);
        assert.ok(rows.every((row) => row.organization_id === org));
      }
      await assert.rejects(connection.query("INSERT INTO assignments (organization_id,section_id,subject_id,created_by,title,due_at,max_score) VALUES ($1,$2,$3,$4,'Foreign',now(),10)", [foreignOrg, foreignSection, foreignSubject, foreignAdmin.id]), { code: '42501' });
      await connection.query('ROLLBACK');
      await connection.query('BEGIN');
      await connection.query("SELECT set_config('app.current_org_id',$1,true)", [org]);
      await assert.rejects(connection.query("INSERT INTO assignments (organization_id,section_id,subject_id,created_by,title,due_at,max_score) VALUES ($1,$2,$3,$4,'Foreign section',now(),10)", [org, foreignSection, subject, admin.id]), { code: '23503' });
      await connection.query('ROLLBACK');
      assert.equal((await connection.query('SELECT * FROM scorecards')).rowCount, 0);
      const audits = JSON.stringify((await db.query('SELECT details FROM audit_events')).rows);
      assert.ok(!audits.includes('My private answer'));
      assert.ok(!audits.includes(password));
    } finally { await connection.end(); }
  });
});
