const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { Client } = require('pg');
const { loadConfig } = require('../dist/config');
const { createApp } = require('../dist/app');
const { createDataSource } = require('../dist/database/data-source');
const { hashPassword } = require('../dist/modules/auth/password');

test('M5 objective Arena with real PostgreSQL and restricted tenant runtime', { timeout: 120_000 }, async t => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl); assert.match(new URL(databaseUrl).pathname, /\/[^/]+_test$/);
  const suffix = randomBytes(8).toString('hex'), schema = `m5_test_${suffix}`, role = `m5_runtime_${suffix}`;
  const password = 'Milestone-five-test-password', runtimePassword = randomBytes(24).toString('hex');
  const config = loadConfig({ ...process.env, NODE_ENV: 'test', DATABASE_URL: databaseUrl, DATABASE_SCHEMA: schema,
    SESSION_SECRET: randomBytes(48).toString('hex'), CORS_ORIGINS: 'http://localhost:3000', TRUST_PROXY: '' });
  const ssl = config.databaseSsl ? { rejectUnauthorized: true } : false;
  const db = new Client({ connectionString: databaseUrl, ssl }); await db.connect();
  let app, createdRole = false;
  t.after(async () => {
    try { if (app) await app.close(); }
    finally {
      try { await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); if (createdRole) await db.query(`DROP ROLE "${role}"`); }
      finally { await db.end(); }
    }
  });
  await db.query(`CREATE SCHEMA "${schema}"; SET search_path TO "${schema}"`);
  const source = createDataSource(config); await source.initialize();
  try {
    const sixth = source.migrations.pop(), fifth = source.migrations.pop();
    assert.equal((await source.runMigrations()).length, 4);
    source.migrations.push(fifth);
    assert.equal((await source.runMigrations()).length, 1);
    source.migrations.push(sixth);
    assert.equal((await source.runMigrations()).length, 1);
    assert.equal((await source.runMigrations()).length, 0);
  } finally { await source.destroy(); }
  const org = randomUUID(), otherOrg = randomUUID(), section = randomUUID(), otherSection = randomUUID(), subject = randomUUID(), otherSubject = randomUUID();
  for (const [school,sec,sub,slug] of [[org,section,subject,'m5-a'],[otherOrg,otherSection,otherSubject,'m5-b']]) {
    const year = randomUUID(), program = randomUUID();
    await db.query('INSERT INTO organizations(id,name,slug) VALUES($1,$2,$2)',[school,slug]);
    await db.query("INSERT INTO academic_years(id,organization_id,name,start_date,end_date) VALUES($1,$2,'Year','2025-01-01','2028-12-31')",[year,school]);
    await db.query("INSERT INTO programs(id,organization_id,name) VALUES($1,$2,'Grade 10')",[program,school]);
    await db.query("INSERT INTO sections(id,organization_id,academic_year_id,program_id,name,capacity) VALUES($1,$2,$3,$4,'A',30)",[sec,school,year,program]);
    await db.query("INSERT INTO subjects(id,organization_id,name,code) VALUES($1,$2,'Math','MATH')",[sub,school]);
  }
  const people = {}, hash = await hashPassword(password);
  for (const [name,memberRole,school] of [['admin','school_admin',org],['teacher','teacher',org],['replacement','teacher',org],['student','student',org],['student2','student',org],['parent','parent',org],['foreign','school_admin',otherOrg],['owner',null,null]]) {
    const id = randomUUID(), email = `${name}@m5.example`;
    await db.query('INSERT INTO users(id,email,password_hash,is_platform_admin) VALUES($1,$2,$3,$4)',[id,email,hash,name==='owner']);
    if (school) await db.query('INSERT INTO memberships(organization_id,user_id,role) VALUES($1,$2,$3)',[school,id,memberRole]);
    people[name] = { id,email };
  }
  const { admin,teacher,replacement,student,student2,parent,foreign,owner } = people;
  await db.query('INSERT INTO class_subject_assignments(organization_id,section_id,subject_id,teacher_user_id) VALUES($1,$2,$3,$4)',[org,section,subject,teacher.id]);
  for (const person of [student,student2]) await db.query('INSERT INTO enrollments(organization_id,student_user_id,section_id,academic_year_id,roll_number) SELECT $1,$2,id,academic_year_id,$4 FROM sections WHERE id=$3',[org,person.id,section,person.id.slice(0,8)]);
  await db.query(`CREATE ROLE "${role}" LOGIN PASSWORD '${runtimePassword}' NOSUPERUSER NOBYPASSRLS`); createdRole = true;
  await db.query(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}"; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA "${schema}" TO "${role}";
    REVOKE UPDATE,DELETE ON arena_attempts FROM "${role}"; REVOKE DELETE ON arena_questions FROM "${role}"`);
  const runtimeUrl = new URL(databaseUrl); runtimeUrl.username = role; runtimeUrl.password = runtimePassword;
  app = await createApp({ ...config,databaseUrl:runtimeUrl.toString() }); await app.listen(0,'127.0.0.1');
  const url = `http://127.0.0.1:${app.getHttpServer().address().port}`, base = `/organizations/${org}/arena`, query = `sectionId=${section}&subjectId=${subject}`;
  for (const person of Object.values(people)) {
    person.cookie = ''; person.csrf = '';
    person.request = async (method,path,body,status=method==='POST'?201:200,headers={}) => {
      const response = await fetch(`${url}/api/v1${path}`, { method, headers: { 'Content-Type':'application/json', Origin:'http://localhost:3000', Cookie:person.cookie, 'X-CSRF-Token':person.csrf, 'Idempotency-Key':randomUUID(), ...headers }, body:body===undefined?undefined:JSON.stringify(body) });
      for (const value of response.headers.getSetCookie()) person.cookie = value.split(';')[0];
      const data = await response.json(); if (data.csrfToken) person.csrf = data.csrfToken;
      assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(data)}`); return data;
    };
    await person.request('GET','/auth/csrf'); await person.request('POST','/auth/login',{ email:person.email,password },200);
  }
  const call = (who,method,path,body,status,headers) => who.request(method,`${base}/${path}`,body,status,headers);
  const report = async () => (await student.request('GET',`/organizations/${org}/teaching/scorecards?${query}`)).items[0];
  const body = { sectionId:section,subjectId:subject,topic:'Integers',difficulty:'easy',questionType:'single_choice',content:{prompt:'2 + 2?',options:[{id:'a',text:'4'},{id:'b',text:'5'},{id:'c',text:'6'}]},answerKey:['a'],tags:['addition'],maxScore:10 };
  let question, multi, attempt;
  const createKey = randomUUID(), publishKey = randomUUID(), attemptKey = randomUUID();

  await t.test('ten documented routes and scorecard schema; no public answer-key field',async () => {
    const spec = await (await fetch(`${url}/api/docs-json`)).json(), guide = readFileSync('docs/MILESTONE-5.md','utf8'); let count = 0;
    for (const [path,item] of Object.entries(spec.paths)) for (const [method,op] of Object.entries(item)) if (op.tags.includes('Arena')) {
      count++; assert.ok(op.responses[method==='post'?201:200]); assert.ok(op.description.length>100);
      assert.deepEqual(op.security,method==='get'?[{cookie:[]}]:[{cookie:[],csrf:[]}]);
      assert.ok(guide.includes(`${method.toUpperCase()} ${path.split('/arena/')[1].replaceAll('{id}',':id')}`));
      if (method==='post') assert.ok(op.parameters.some(p=>p.name==='Idempotency-Key'&&p.required));
    }
    assert.equal(count,10); assert.equal(spec.info.version,'0.6.0');
    assert.equal(spec.components.schemas.ArenaQuestion.properties.answerKey,undefined);
    assert.equal(spec.components.schemas.Scorecard.properties.arenaScore.nullable,true);
    assert.equal((await fetch(`${url}/api/organizations/${org}/arena/questions`)).status,404);
  });
  await t.test('strict structured validation, roles, tenant concealment and draft editing',async () => {
    for (const who of [student,parent]) await call(who,'POST','questions',body,403);
    for (const who of [replacement,foreign,owner]) await call(who,'POST','questions',body,404);
    await call(teacher,'POST','questions',{...body,sectionId:otherSection},404);
    await call(teacher,'POST','questions',{...body,subjectId:otherSubject},404);
    await call(teacher,'POST','questions',body,403,{'X-CSRF-Token':''});
    await call(teacher,'POST','questions',body,400,{'Idempotency-Key':''});
    for (const change of [{answerKey:['z']},{answerKey:['a','b']},{answerKey:['a','a']},{questionType:'coding'},{maxScore:1.5},{maxScore:0},{tags:null},{content:null},{content:{...body.content,answerKey:['a']}},{content:{...body.content,options:[null,null]}},{content:{...body.content,options:[body.content.options[0],body.content.options[0]]}}]) await call(teacher,'POST','questions',{...body,...change},400);
    question = await call(teacher,'POST','questions',body,201,{'Idempotency-Key':createKey});
    assert.equal(question.status,'draft'); assert.equal(question.answerKey,undefined);
    assert.deepEqual(await call(teacher,'POST','questions',body,201,{'Idempotency-Key':createKey}),question);
    assert.equal((await call(student,'GET',`questions?${query}`)).total,0);
    await call(student,'GET',`questions/${question.id}`,undefined,404);
    assert.deepEqual(await call(teacher,'GET',`questions/${question.id}/answer-key`),{answerKey:['a']});
    await call(teacher,'PATCH',`questions/${question.id}`,{},400);
    await call(teacher,'PATCH',`questions/${question.id}`,{topic:null},400);
    await call(teacher,'PATCH',`questions/${question.id}`,{content:{...body.content,options:body.content.options.slice(1)}},400);
    const updated = await call(teacher,'PATCH',`questions/${question.id}`,{topic:'Addition'});
    assert.deepEqual(updated.content,body.content); assert.equal(updated.answerKey,undefined);
  });
  await t.test('publication, answer secrecy, exact objective grading and private histories',async () => {
    await call(teacher,'POST',`questions/${question.id}/publish`,{},201,{'Idempotency-Key':publishKey});
    await call(teacher,'PATCH',`questions/${question.id}`,{answerKey:['b']},409);
    await call(student,'GET',`questions/${question.id}/answer-key`,undefined,403);
    const page = await call(student,'GET',`questions?${query}&topic=Addition&difficulty=easy&tag=addition`);
    assert.equal(page.total,1); assert.ok(!JSON.stringify(page).includes('answerKey'));
    assert.equal((await call(student,'GET',`questions?${query}&status=draft`)).total,0);
    for (const selectedOptionIds of [[],['z'],['a','b'],['a','a']]) await call(student,'POST',`questions/${question.id}/attempts`,{selectedOptionIds},400);
    await call(student,'POST',`questions/${question.id}/attempts`,{selectedOptionIds:['a'],score:10,studentId:student2.id},400);
    await call(teacher,'POST',`questions/${question.id}/attempts`,{selectedOptionIds:['a']},403);
    const wrong = await call(student,'POST',`questions/${question.id}/attempts`,{selectedOptionIds:['b']}); assert.equal(wrong.score,0); assert.equal(wrong.isCorrect,false);
    const results = await Promise.all([1,2].map(()=>call(student,'POST',`questions/${question.id}/attempts`,{selectedOptionIds:['a']},201,{'Idempotency-Key':attemptKey})));
    assert.deepEqual(results[0],results[1]); attempt=results[0]; assert.equal(attempt.score,10); assert.equal(attempt.studentId,student.id);
    await call(student,'POST',`questions/${question.id}/attempts`,{selectedOptionIds:['b']},409,{'Idempotency-Key':attemptKey});
    await call(student2,'GET',`attempts/${attempt.id}`,undefined,404);
    assert.equal((await call(student2,'GET',`questions/${question.id}/attempts`)).total,0);
    assert.equal((await call(student,'GET',`questions/${question.id}/attempts?limit=1`)).total,2);
    assert.equal((await call(teacher,'GET',`questions/${question.id}/attempts`)).total,2);
    assert.equal((await report()).arenaScore,100); assert.equal((await report()).arenaAttemptCount,2);
  });
  await t.test('multiple choice is order-independent, all-or-nothing and scorecards resist repeat inflation',async () => {
    multi = await call(teacher,'POST','questions',{...body,questionType:'multiple_choice',answerKey:['a','c'],maxScore:20});
    await call(teacher,'POST',`questions/${multi.id}/publish`,{});
    assert.equal((await call(student,'POST',`questions/${multi.id}/attempts`,{selectedOptionIds:['a']})).score,0);
    assert.equal((await report()).arenaScore,50);
    assert.equal((await report()).arenaQuestionCount,2);
    const key=randomUUID(); const correct=await call(student,'POST',`questions/${multi.id}/attempts`,{selectedOptionIds:['c','a']},201,{'Idempotency-Key':key});
    assert.equal(correct.score,20); assert.deepEqual(correct.submittedAnswer,['a','c']);
    assert.deepEqual(await call(student,'POST',`questions/${multi.id}/attempts`,{selectedOptionIds:['a','c']},201,{'Idempotency-Key':key}),correct);
    assert.equal((await call(student,'POST',`questions/${multi.id}/attempts`,{selectedOptionIds:['a','b','c']})).score,0);
    assert.equal((await report()).arenaScore,100); assert.equal((await report()).arenaQuestionCount,2); assert.equal((await report()).arenaAttemptCount,5);
    const assignment=await teacher.request('POST',`/organizations/${org}/teaching/assignments`,{sectionId:section,subjectId:subject,title:'Homework',dueAt:new Date(Date.now()+86400_000).toISOString(),maxScore:10});
    await teacher.request('POST',`/organizations/${org}/teaching/assignments/${assignment.id}/publish`,{});
    assert.equal((await report()).arenaScore,100); assert.equal((await report()).assignmentCount,1);
  });
  await t.test('failed audits roll back attempts, scorecards and replay records together',async () => {
    const before=await report(), key=randomUUID();
    await db.query("CREATE FUNCTION fail_arena_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='arena.attempt.created' THEN RAISE EXCEPTION 'Injected failure'; END IF; RETURN NEW; END; $$; CREATE TRIGGER fail_arena_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION fail_arena_audit()");
    try {
      await call(student,'POST',`questions/${question.id}/attempts`,{selectedOptionIds:['a']},500,{'Idempotency-Key':key});
      assert.deepEqual(await report(),before);
      assert.equal((await db.query('SELECT * FROM idempotency_records WHERE key=$1',[key])).rowCount,0);
      assert.equal((await db.query('SELECT * FROM arena_attempts')).rowCount,5);
    } finally { await db.query('DROP TRIGGER fail_arena_audit ON audit_events; DROP FUNCTION fail_arena_audit()'); }
    await call(student,'POST',`questions/${question.id}/attempts`,{selectedOptionIds:['a']},201,{'Idempotency-Key':key});
    const audit=JSON.stringify((await db.query("SELECT details FROM audit_events WHERE action LIKE 'arena.%'")).rows);
    assert.ok(!audit.includes('selectedOptionIds')); assert.ok(!audit.includes('answerKey')); assert.ok(!audit.includes('2 + 2?'));
  });
  await t.test('archive preserves history; current permissions deny stale replays and historical access',async () => {
    const before=await report();
    const archived=await call(teacher,'PATCH',`questions/${question.id}/archive`,{});
    assert.deepEqual(await call(teacher,'PATCH',`questions/${question.id}/archive`,{}),archived);
    await call(student,'POST',`questions/${question.id}/attempts`,{selectedOptionIds:['a']},404,{'Idempotency-Key':attemptKey});
    await call(student,'GET',`questions/${question.id}`,undefined,404);
    assert.equal((await call(student,'GET',`attempts/${attempt.id}`)).id,attempt.id);
    assert.equal((await report()).arenaScore,before.arenaScore);
    await call(teacher,'POST',`questions/${question.id}/publish`,{},201,{'Idempotency-Key':publishKey});
    assert.equal((await call(teacher,'GET',`questions/${question.id}`)).status,'archived');
    await db.query('UPDATE class_subject_assignments SET teacher_user_id=$1 WHERE organization_id=$2',[replacement.id,org]);
    await call(teacher,'POST','questions',body,404,{'Idempotency-Key':createKey});
    await call(teacher,'GET',`questions/${multi.id}/answer-key`,undefined,404);
    await call(replacement,'GET',`questions/${multi.id}/answer-key`);
    await db.query("UPDATE enrollments SET status='withdrawn' WHERE organization_id=$1 AND student_user_id=$2",[org,student.id]);
    await call(student,'GET',`attempts/${attempt.id}`,undefined,404);
    await db.query("UPDATE organizations SET status='suspended' WHERE id=$1",[org]);
    await call(admin,'GET',`questions?${query}`,undefined,403);
    await db.query("UPDATE organizations SET status='active' WHERE id=$1",[org]);
  });
  await t.test('both Arena tables enforce RLS and same-tenant foreign keys',async () => {
    const scoped=new Client({connectionString:runtimeUrl.toString(),ssl,options:`-c search_path=${schema}`}); await scoped.connect();
    try {
      for (const table of ['arena_questions','arena_attempts']) assert.equal((await scoped.query(`SELECT * FROM ${table}`)).rowCount,0);
      await scoped.query('BEGIN'); await scoped.query("SELECT set_config('app.current_org_id',$1,true)",[org]);
      for (const table of ['arena_questions','arena_attempts']) { const rows=(await scoped.query(`SELECT organization_id FROM ${table}`)).rows; assert.ok(rows.length); assert.ok(rows.every(r=>r.organization_id===org)); }
      await assert.rejects(scoped.query("INSERT INTO arena_attempts(organization_id,question_id,student_id,submitted_answer,is_correct,score,max_score) VALUES($1,$2,$3,'[\"a\"]',true,10,10)",[otherOrg,question.id,student.id]),{code:'42501'});
      await scoped.query('ROLLBACK');
      await scoped.query('BEGIN'); await scoped.query("SELECT set_config('app.current_org_id',$1,true)",[otherOrg]);
      await assert.rejects(scoped.query("INSERT INTO arena_attempts(organization_id,question_id,student_id,submitted_answer,is_correct,score,max_score) VALUES($1,$2,$3,'[\"a\"]',true,10,10)",[otherOrg,question.id,foreign.id]),{code:'23503'});
      await scoped.query('ROLLBACK');
      assert.equal((await scoped.query('SELECT * FROM arena_attempts')).rowCount,0);
    } finally { await scoped.end(); }
  });
});
