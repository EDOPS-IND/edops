const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { Client } = require('pg');
const { loadConfig } = require('../dist/config');
const { createApp } = require('../dist/app');
const { createDataSource } = require('../dist/database/data-source');
const { hashPassword } = require('../dist/modules/auth/password');

test('M6 billing and entitlements with real PostgreSQL', { timeout: 120_000 }, async t => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl); assert.match(new URL(databaseUrl).pathname, /\/[^/]+_test$/);
  const suffix = randomBytes(8).toString('hex'), schema = `m6_test_${suffix}`, role = `m6_runtime_${suffix}`;
  const password = 'Milestone-six-test-password', runtimePassword = randomBytes(24).toString('hex');
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
    const sixth = source.migrations.pop();
    assert.equal((await source.runMigrations()).length, 5);
    await db.query("INSERT INTO organizations(name,slug,created_at) VALUES('Legacy','m6-legacy',now()-interval '1 year')");
    source.migrations.push(sixth);
    assert.equal((await source.runMigrations()).length, 1);
    assert.equal((await source.runMigrations()).length, 0);
    assert.equal((await db.query("SELECT * FROM subscriptions")).rowCount,1);
  } finally { await source.destroy(); }
  const org = randomUUID(), otherOrg = randomUUID(), section = randomUUID(), otherSection = randomUUID(), subject = randomUUID(), otherSubject = randomUUID();
  for (const [school,sec,sub,slug] of [[org,section,subject,'m6-a'],[otherOrg,otherSection,otherSubject,'m6-b']]) {
    const year = randomUUID(), program = randomUUID();
    await db.query('INSERT INTO organizations(id,name,slug) VALUES($1,$2,$2)',[school,slug]);
    await db.query("INSERT INTO academic_years(id,organization_id,name,start_date,end_date) VALUES($1,$2,'Year','2025-01-01','2028-12-31')",[year,school]);
    await db.query("INSERT INTO programs(id,organization_id,name) VALUES($1,$2,'Grade 10')",[program,school]);
    await db.query("INSERT INTO sections(id,organization_id,academic_year_id,program_id,name,capacity) VALUES($1,$2,$3,$4,'A',30)",[sec,school,year,program]);
    await db.query("INSERT INTO subjects(id,organization_id,name,code) VALUES($1,$2,'Math','MATH')",[sub,school]);
  }
  const people = {}, hash = await hashPassword(password);
  for (const [name,memberRole,school] of [['admin','school_admin',org],['teacher','teacher',org],['replacement','teacher',org],['student','student',org],['student2','student',org],['parent','parent',org],['foreign','school_admin',otherOrg],['owner',null,null]]) {
    const id = randomUUID(), email = `${name}@m6.example`;
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

  const pbase = '/platform/organizations/'+org;
  const platform = (method,path,body,status,headers) => owner.request(method,path,body,status,headers);
  const planBody = {id:randomUUID(),name:'School basic',amountMinor:12345,maxStudents:3,maxTeachers:2,features:{arena:false,recordings:true,communication:true}};
  const start=new Date(Date.now()-3600_000).toISOString(),end=new Date(Date.now()+29*86400_000).toISOString();
  let plan,invoice,question;
  const subBody=()=>({planId:plan.id,status:'active',periodStart:start,periodEnd:end});
  const overview=()=>platform('GET',pbase+'/billing');

  await t.test('fourteen documented APIs, current guards and school billing isolation',async()=>{
    const spec=await(await fetch(url+'/api/docs-json')).json();
    const guide=readFileSync('docs/MILESTONE-6.md','utf8');let count=0;
    for(const [path,item]of Object.entries(spec.paths))for(const [method,op]of Object.entries(item))if(op.tags.some(t=>['Platform Billing','School Billing'].includes(t))){
      count++;assert.ok(op.responses[method==='post'?201:200]);assert.ok(op.description.length>100);
      assert.deepEqual(op.security,method==='get'?[{cookie:[]}]:[{cookie:[],csrf:[]}]);
      assert.ok(guide.includes(method.toUpperCase()+' '+path.replace('/api/v1/','').replaceAll('{organizationId}',':organizationId').replaceAll('{id}',':id')));
    }
    assert.equal(count,14);assert.equal(spec.info.version,'0.6.0');
    for(const who of [admin,teacher,student,foreign])await who.request('GET','/platform/organizations',undefined,403);
    await teacher.request('GET','/organizations/'+org+'/billing',undefined,403);
    await foreign.request('GET','/organizations/'+org+'/billing',undefined,404);
    await owner.request('GET','/organizations/'+org+'/billing',undefined,404);
    assert.equal((await admin.request('GET','/organizations/'+org+'/billing')).entitlements.implicitTrial,true);
    assert.equal((await overview()).entitlements.maxStudents,500);
    assert.equal((await platform('GET','/platform/organizations')).total,3);
  });
  await t.test('immutable flat-price plans validate money and recover stable-ID retries',async()=>{
    await platform('POST','/plans',planBody,404);
    for(const change of [{amountMinor:1.2},{amountMinor:-1},{currency:'USD'},{features:{arena:true}},{features:{...planBody.features,unknown:true}}])
      await platform('POST','/platform/plans',{...planBody,...change},400);
    plan=await platform('POST','/platform/plans',planBody);
    assert.equal(plan.amountMinor,12345);assert.equal(plan.currency,'INR');
    assert.deepEqual(await platform('POST','/platform/plans',planBody),plan);
    await platform('POST','/platform/plans',{...planBody,amountMinor:999},409);
    await platform('PATCH','/platform/plans/'+plan.id+'/status',{active:false});
    await platform('POST',pbase+'/subscription',subBody(),409);
    await platform('PATCH','/platform/plans/'+plan.id+'/status',{active:true});
  });
  await t.test('subscription changes, feature overrides and replay authorization are enforced',async()=>{
    const body={sectionId:section,subjectId:subject,topic:'Math',difficulty:'easy',questionType:'single_choice',content:{prompt:'One?',options:[{id:'a',text:'1'},{id:'b',text:'2'}]},answerKey:['a'],tags:[],maxScore:1};
    const key=randomUUID();
    question=await teacher.request('POST',base+'/questions',body,201,{'Idempotency-Key':key});
    const subKey=randomUUID();
    const sub=await platform('POST',pbase+'/subscription',subBody(),201,{'Idempotency-Key':subKey});
    assert.deepEqual(await platform('POST',pbase+'/subscription',subBody(),201,{'Idempotency-Key':subKey}),sub);
    assert.equal(sub.entitlements.features.arena,false);
    await teacher.request('GET',base+'/questions?'+query,undefined,403);
    await teacher.request('POST',base+'/questions',body,403,{'Idempotency-Key':key});
    await platform('PATCH',pbase+'/features',{feature:'arena',mode:'enabled'});
    await teacher.request('GET',base+'/questions?'+query);
    await platform('PATCH',pbase+'/features',{feature:'arena',mode:'inherit'});
    await teacher.request('GET',base+'/questions?'+query,undefined,403);
    await platform('PATCH',pbase+'/features',{feature:'recordings',mode:'disabled'});
    await student.request('GET','/organizations/'+org+'/recordings?'+query,undefined,403);
    await platform('PATCH',pbase+'/features',{feature:'communication',mode:'disabled'});
    await student.request('GET','/organizations/'+org+'/notifications',undefined,403);
    await platform('POST',pbase+'/subscription',{...subBody(),status:'past_due'});
    await platform('PATCH',pbase+'/features',{feature:'arena',mode:'enabled'});
    assert.equal((await overview()).entitlements.features.arena,false);
    await student.request('GET','/organizations/'+org+'/teaching/scorecards?'+query);
    await platform('POST',pbase+'/subscription',subBody());
    await platform('POST',pbase+'/subscription',{...subBody(),periodEnd:start},400);
    await platform('POST',pbase+'/subscription',{...subBody(),periodEnd:new Date(Date.now()+90*86400_000).toISOString()},400);
  });
  await t.test('reserved seats prevent concurrent overbooking and reactivation bypass',async()=>{
    const provision='/organizations/'+org;
    const invites=await Promise.allSettled(['first','second'].map(name=>admin.request('POST',provision+'/invitations/bulk',{records:[{email:name+'@m6-reservation.example',role:'student'}]})));
    assert.equal(invites.filter(x=>x.status==='fulfilled').length,1);
    assert.equal((await overview()).usage.pendingStudents,1);
    const tooSmall=await platform('POST','/platform/plans',{...planBody,id:randomUUID(),maxStudents:2});
    await platform('POST',pbase+'/subscription',{...subBody(),planId:tooSmall.id},409);
    await admin.request('PATCH',provision+'/members/'+student2.id,{status:'inactive'});
    await admin.request('POST',provision+'/invitations/bulk',{records:[{email:'third@m6-reservation.example',role:'student'}]});
    await admin.request('PATCH',provision+'/members/'+student2.id,{status:'active'},409);
    const pending=(await db.query("SELECT id FROM invitations WHERE organization_id=$1 AND role='student' AND accepted_at IS NULL",[org])).rows;
    for(const row of pending)await admin.request('PATCH',provision+'/invitations/'+row.id+'/revoke',{});
    await admin.request('PATCH',provision+'/members/'+student2.id,{status:'active'});
    assert.equal((await overview()).usage.pendingStudents,0);
    const invitation=(await admin.request('POST',provision+'/invitations',{email:'acceptance@m6-reservation.example',role:'student'})).invitations[0];
    const csrfResponse=await fetch(url+'/api/v1/auth/csrf');const csrf=(await csrfResponse.json()).csrfToken;
    const cookie=csrfResponse.headers.getSetCookie()[0].split(';')[0];
    const accept=()=>fetch(url+'/api/v1/auth/invitations/accept',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:3000',Cookie:cookie,'X-CSRF-Token':csrf},body:JSON.stringify({token:invitation.token,password:'M6-acceptance-fixture-password'})});
    await platform('POST',pbase+'/subscription',{...subBody(),status:'past_due'});
    assert.equal((await accept()).status,403);
    await platform('POST',pbase+'/subscription',subBody());
    const accepted=await accept();assert.equal(accepted.status,200);const member=await accepted.json();
    assert.equal((await overview()).usage.students,3);assert.equal((await overview()).usage.pendingStudents,0);
    await admin.request('PATCH',provision+'/members/'+member.userId,{status:'inactive'});
  });
  await t.test('invoice snapshots, overlap prevention and repeat-safe manual payment',async()=>{
    const key=randomUUID();
    const results=await Promise.all([1,2].map(()=>platform('POST',pbase+'/invoices',{},201,{'Idempotency-Key':key})));
    assert.deepEqual(results[0],results[1]);invoice=results[0];assert.equal(invoice.amountMinor,12345);
    await platform('POST',pbase+'/invoices',{},409);
    const newer=await platform('POST','/platform/plans',{...planBody,id:randomUUID(),amountMinor:45678});
    await platform('POST',pbase+'/subscription',{...subBody(),planId:newer.id});
    assert.equal((await platform('GET',pbase+'/invoices')).items[0].amountMinor,12345);
    const paid=await platform('PATCH',pbase+'/invoices/'+invoice.id+'/pay',{paymentReference:'fixture-receipt-1'});
    assert.equal(paid.status,'paid');assert.ok(paid.paidAt);assert.equal(paid.id,invoice.id);
    assert.deepEqual(await platform('PATCH',pbase+'/invoices/'+invoice.id+'/pay',{paymentReference:'fixture-receipt-1'}),paid);
    await platform('PATCH',pbase+'/invoices/'+invoice.id+'/pay',{paymentReference:'changed'},409);
    await platform('PATCH',pbase+'/invoices/'+invoice.id+'/void',{},409);
    assert.equal((await admin.request('GET','/organizations/'+org+'/billing/invoices')).items[0].status,'paid');
    await platform('PATCH','/platform/organizations/'+otherOrg+'/invoices/'+invoice.id+'/pay',{paymentReference:'foreign'},404);
    const nextStart=end,nextEnd=new Date(new Date(end).getTime()+30*86400_000).toISOString();
    await platform('POST',pbase+'/subscription',{...subBody(),periodStart:nextStart,periodEnd:nextEnd});
    const next=await platform('POST',pbase+'/invoices',{});
    await platform('PATCH',pbase+'/invoices/'+next.id+'/pay',{paymentReference:'fixture-receipt-1'},409);
    const voided=await platform('PATCH',pbase+'/invoices/'+next.id+'/void',{});
    assert.equal(voided.status,'void');
    assert.deepEqual(await platform('PATCH',pbase+'/invoices/'+next.id+'/void',{}),voided);
    await platform('POST',pbase+'/invoices',{});
    await platform('POST',pbase+'/subscription',subBody());
  });
  await t.test('audit failures roll back billing, including idempotency records',async()=>{
    const before=await overview(),key=randomUUID();
    await db.query("CREATE FUNCTION fail_billing_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action IN ('subscription.updated','invoice.paid') THEN RAISE EXCEPTION 'Injected'; END IF; RETURN NEW; END; $$; CREATE TRIGGER fail_billing_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION fail_billing_audit()");
    try{
      await platform('POST',pbase+'/subscription',{...subBody(),status:'canceled'},500,{'Idempotency-Key':key});
      assert.deepEqual(await overview(),before);
      assert.equal((await db.query('SELECT * FROM idempotency_records WHERE key=$1',[key])).rowCount,0);
      const open=(await db.query("SELECT id FROM invoices WHERE organization_id=$1 AND status='open'",[org])).rows[0];
      await platform('PATCH',pbase+'/invoices/'+open.id+'/pay',{paymentReference:'must-roll-back'},500);
      const unchanged=(await db.query('SELECT status,paid_at,payment_reference FROM invoices WHERE id=$1',[open.id])).rows[0];
      assert.deepEqual(unchanged,{status:'open',paid_at:null,payment_reference:null});
    }finally{await db.query('DROP TRIGGER fail_billing_audit ON audit_events; DROP FUNCTION fail_billing_audit()');}
  });
  await t.test('expiration, suspension, statistics and platform role revocation',async()=>{
    const stats=await platform('GET',pbase+'/statistics');
    assert.equal(stats.paidAmountMinor,'12345');assert.equal(stats.sections,1);assert.equal(stats.usage.students,2);
    assert.ok(!JSON.stringify(stats).includes('email'));assert.ok(!JSON.stringify(stats).includes('answerKey'));
    await db.query("UPDATE subscriptions SET period_start=now()-interval '31 days',period_end=now()-interval '1 day' WHERE organization_id=$1",[org]);
    assert.equal((await overview()).entitlements.entitled,false);
    await teacher.request('GET',base+'/questions?'+query,undefined,403);
    await admin.request('GET','/organizations/'+org+'/billing');
    await platform('POST',pbase+'/subscription',subBody());
    await platform('PATCH','/platform/organizations/'+org+'/status',{status:'suspended'});
    assert.equal((await overview()).entitlements.entitled,false);
    await admin.request('GET','/organizations/'+org+'/billing',undefined,403);
    await platform('GET',pbase+'/statistics');
    await platform('PATCH','/platform/organizations/'+org+'/status',{status:'active'});
    await db.query('UPDATE users SET is_platform_admin=false WHERE id=$1',[owner.id]);
    await platform('GET',pbase+'/billing',undefined,403);
    await db.query('UPDATE users SET is_platform_admin=true WHERE id=$1',[owner.id]);
  });
  await t.test('billing RLS rejects unscoped reads and cross-tenant writes',async()=>{
    const scoped=new Client({connectionString:runtimeUrl.toString(),ssl,options:'-c search_path='+schema});await scoped.connect();
    try{
      for(const table of ['subscriptions','invoices','feature_flags'])assert.equal((await scoped.query('SELECT * FROM '+table)).rowCount,0);
      await scoped.query('BEGIN');await scoped.query("SELECT set_config('app.current_org_id',$1,true)",[org]);
      for(const table of ['subscriptions','invoices','feature_flags']){const rows=(await scoped.query('SELECT organization_id FROM '+table)).rows;assert.ok(rows.length);assert.ok(rows.every(r=>r.organization_id===org));}
      await assert.rejects(scoped.query("INSERT INTO feature_flags(organization_id,feature_key,enabled) VALUES($1,'arena',true)",[otherOrg]),{code:'42501'});
      await scoped.query('ROLLBACK');
      assert.equal((await scoped.query('SELECT * FROM invoices')).rowCount,0);
    }finally{await scoped.end();}
  });
});
