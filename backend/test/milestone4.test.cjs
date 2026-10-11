const assert = require('node:assert/strict');
const { randomBytes, randomUUID, createHash } = require('node:crypto');
const { createServer } = require('node:http');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { Client } = require('pg');
const { loadConfig } = require('../dist/config');
const { createApp } = require('../dist/app');
const { createDataSource } = require('../dist/database/data-source');
const { hashPassword } = require('../dist/modules/auth/password');
const { OutboxService } = require('../dist/modules/notifications/outbox.service');
const { StorageService } = require('../dist/modules/content/storage.service');

test('M4 outbox, private feeds and recording lifecycle', { timeout: 120_000 }, async (t) => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl); assert.match(new URL(databaseUrl).pathname, /\/[^/]+_test$/);
  const suffix = randomBytes(8).toString('hex'), schema = `m4_test_${suffix}`, role = `m4_runtime_${suffix}`;
  const password = 'M4-local-fixture-password', runtimePassword = randomBytes(24).toString('hex');
  const config = loadConfig({ ...process.env, NODE_ENV: 'test', DATABASE_URL: databaseUrl, DATABASE_SCHEMA: schema,
    SESSION_SECRET: randomBytes(48).toString('hex'), CORS_ORIGINS: 'http://localhost:3000', TRUST_PROXY: '' });
  const ssl = config.databaseSsl ? { rejectUnauthorized: true } : false;
  const db = new Client({ connectionString: databaseUrl, ssl, options: '-c timezone=UTC' });
  await db.connect();
  let app, fixture, roleCreated = false;
  t.after(async () => {
    try { if (app) await app.close(); }
    finally {
      if (fixture) await new Promise((resolve) => fixture.close(resolve));
      try { await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); if (roleCreated) await db.query(`DROP ROLE "${role}"`); }
      finally { await db.end(); }
    }
  });
  await db.query(`CREATE SCHEMA "${schema}"`); await db.query(`SET search_path TO "${schema}"`);
  const source = createDataSource(config); await source.initialize();
  try { assert.equal((await source.runMigrations()).length, 14); assert.equal((await source.runMigrations()).length, 0); }
  finally { await source.destroy(); }
  const org = randomUUID(), otherOrg = randomUUID(), section = randomUUID(), subject = randomUUID(), yearId = randomUUID(), program = randomUUID();
  await db.query("INSERT INTO organizations(id,name,slug,time_zone) VALUES ($1,'School A','m4-a','UTC'),($2,'School B','m4-b','UTC')", [org,otherOrg]);
  const year = new Date().getUTCFullYear();
  await db.query('INSERT INTO academic_years(id,organization_id,name,start_date,end_date) VALUES ($1,$2,$3,$4,$5)', [yearId,org,'Current',`${year-1}-01-01`,`${year+1}-12-31`]);
  await db.query("INSERT INTO programs(id,organization_id,name) VALUES ($1,$2,'Grade 10')", [program,org]);
  await db.query("INSERT INTO sections(id,organization_id,academic_year_id,program_id,name,capacity) VALUES ($1,$2,$3,$4,'10-A',30)", [section,org,yearId,program]);
  await db.query("INSERT INTO subjects(id,organization_id,name,code) VALUES ($1,$2,'Math','MATH')", [subject,org]);
  const people = {}, hash = await hashPassword(password);
  for (const [name,memberRole,school] of [['admin','school_admin',org],['teacher','teacher',org],['replacement','teacher',org],['student','student',org],['student2','student',org],['foreign','school_admin',otherOrg]]) {
    const id=randomUUID(), email=`${name}@m4.example`;
    await db.query('INSERT INTO users(id,email,password_hash) VALUES ($1,$2,$3)', [id,email,hash]);
    await db.query('INSERT INTO memberships(organization_id,user_id,role) VALUES ($1,$2,$3)', [school,id,memberRole]);
    people[name]={id,email};
  }
  const {admin,teacher,replacement,student,student2,foreign}=people;
  await db.query('INSERT INTO class_subject_assignments(organization_id,section_id,subject_id,teacher_user_id) VALUES ($1,$2,$3,$4)', [org,section,subject,teacher.id]);
  for (const [index,person] of [student,student2].entries()) await db.query('INSERT INTO enrollments(organization_id,student_user_id,section_id,academic_year_id,roll_number) VALUES ($1,$2,$3,$4,$5)', [org,person.id,section,yearId,String(index+1)]);
  await db.query(`CREATE ROLE "${role}" LOGIN PASSWORD '${runtimePassword}' NOSUPERUSER NOBYPASSRLS`); roleCreated=true;
  await db.query(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}"; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA "${schema}" TO "${role}"`);
  const runtimeUrl=new URL(databaseUrl);runtimeUrl.username=role;runtimeUrl.password=runtimePassword;

  // HTTP S3 protocol fixture, not an S3 authorization emulator. No real student files or cloud credentials.
  const objects=new Map(); let wrongMetadata=false, wrongRange=false;
  fixture=createServer(async (req,res)=>{
    try {
      const url=new URL(req.url,'http://fixture'), key=url.pathname;
      if(req.method==='PUT') {
        if(objects.has(key)){res.writeHead(412).end();return;}
        const chunks=[];for await(const chunk of req) chunks.push(chunk);const body=Buffer.concat(chunks);
        const checksum=createHash('sha256').update(body).digest('base64');
        if(req.headers['if-none-match']!=='*'||req.headers['x-amz-checksum-sha256']!==checksum){res.writeHead(400).end();return;}
        const version=randomUUID();objects.set(key,{body,version,checksum,type:req.headers['content-type']});res.writeHead(200,{'x-amz-version-id':version}).end();return;
      }
      const row=objects.get(key);
      if(!row||url.searchParams.get('versionId')!==row.version){res.writeHead(404).end();return;}
      const head={'x-amz-version-id':row.version,'x-amz-checksum-sha256':wrongMetadata?'wrong':row.checksum,'content-type':row.type};
      if(req.method==='HEAD'){res.writeHead(200,{...head,'content-length':row.body.length}).end();return;}
      const ranged=!!req.headers.range&&!wrongRange, body=ranged?row.body.subarray(0,32):row.body;
      res.writeHead(ranged?206:200,{...head,'content-length':body.length,...(ranged?{'content-range':`bytes 0-${body.length-1}/${row.body.length}`}:{})}).end(body);
    }catch{res.writeHead(500).end();}
  });
  await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
  const storage={bucket:'test-recordings',region:'us-east-1',endpoint:`http://127.0.0.1:${fixture.address().port}`,accessKeyId:'test-access-key',secretAccessKey:'test-secret-key'};
  app=await createApp({...config,databaseUrl:runtimeUrl.toString(),storage});await app.listen(0,'127.0.0.1');
  const url=`http://127.0.0.1:${app.getHttpServer().address().port}`,base=`/organizations/${org}`,q=`sectionId=${section}&subjectId=${subject}`;
  const outbox=app.get(OutboxService);
  for(const person of Object.values(people)){
    person.cookie='';person.csrf='';
    person.request=async(method,path,body,status=method==='POST'?201:200,headers={})=>{
      const response=await fetch(`${url}/api/v1${path}`,{method,headers:{'Content-Type':'application/json',Origin:'http://localhost:3000',Cookie:person.cookie,'X-CSRF-Token':person.csrf,'Idempotency-Key':randomUUID(),...headers},body:body===undefined?undefined:JSON.stringify(body)});
      for(const value of response.headers.getSetCookie())person.cookie=value.split(';')[0];
      const data=await response.json();if(data.csrfToken)person.csrf=data.csrfToken;
      assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(data)}`);return data;
    };
    await person.request('GET','/auth/csrf');await person.request('POST','/auth/login',{email:person.email,password},200);
  }
  const call=(who,method,path,body,status,headers)=>who.request(method,`${base}/${path}`,body,status,headers);
  let assignment,recording,version,playback;
  const video=Buffer.from('000000186674797069736f6d0000000069736f6d','hex');
  const metadata={sectionId:section,subjectId:subject,title:'Lesson recording',recordedAt:new Date(Date.now()-3600_000).toISOString(),durationSeconds:120,contentType:'video/mp4',sizeBytes:video.length,checksumSha256:createHash('sha256').update(video).digest('base64')};
  const publishKey=randomUUID();

  await t.test('M4 Swagger exposes twelve documented operations without broadening M3',async()=>{
    const spec=await(await fetch(`${url}/api/docs-json`)).json();const guide=readFileSync('docs/MILESTONE-4.md','utf8');let count=0;
    for(const [path,item]of Object.entries(spec.paths))for(const [method,op]of Object.entries(item))if(op.tags.includes('Communication and Recordings')){
      count++;assert.ok(op.responses[method==='post'&&!path.endsWith('upload-url')?201:200]);
      assert.deepEqual(op.security,method==='get'?[{cookie:[]}]:[{cookie:[],csrf:[]}]);
      assert.ok(guide.includes(`${method.toUpperCase()} ${path.split('/{organizationId}/')[1].replaceAll('{id}',':id')}`));
      assert.ok(op.description.length>100);
    }
    assert.equal(count,12);
    assert.equal(spec.components.schemas.Recording.properties.objectKey,undefined);
    for (const [method,action] of [['post','upload-url'],['post','complete'],['get','playback']]) assert.ok(spec.paths[`/api/v1/organizations/{organizationId}/recordings/{id}/${action}`][method].responses[503]);
  });

  await t.test('publication is durable, concurrent workers deliver once and grades stay private',async()=>{
    assignment=await call(teacher,'POST','teaching/assignments',{sectionId:section,subjectId:subject,title:'Homework',dueAt:new Date(Date.now()+86400_000).toISOString(),maxScore:20});
    await call(teacher,'POST',`teaching/assignments/${assignment.id}/publish`,{},201,{'Idempotency-Key':publishKey});
    await call(teacher,'POST',`teaching/assignments/${assignment.id}/publish`,{},201,{'Idempotency-Key':publishKey});
    assert.equal((await call(student,'GET','notifications')).total,0);
    assert.equal((await db.query("SELECT * FROM domain_events WHERE event_type='assignment.published'")).rowCount,1);
    await Promise.all([outbox.drain(org),outbox.drain(org)]);
    assert.equal((await call(student,'GET',`timeline?${q}`)).total,1);
    const inbox=await call(student,'GET','notifications');assert.equal(inbox.unreadCount,1);
    await call(student2,'PATCH',`notifications/${inbox.items[0].id}/read`,{},404);
    await foreign.request('PATCH',`/organizations/${otherOrg}/notifications/${inbox.items[0].id}/read`,{},404);
    const read=await call(student,'PATCH',`notifications/${inbox.items[0].id}/read`,{});
    assert.deepEqual(await call(student,'PATCH',`notifications/${inbox.items[0].id}/read`,{}),read);
    assert.equal((await call(student,'GET','notifications?filter=unread')).total,0);
    const answer=await call(student,'POST',`teaching/assignments/${assignment.id}/submissions`,{content:'Do not copy this answer into notifications'});
    await call(teacher,'PATCH',`teaching/submissions/${answer.id}/grade`,{score:15,feedback:'Private feedback'});
    await outbox.drain(org);
    const own=await call(student,'GET',`timeline?${q}`),other=await call(student2,'GET',`timeline?${q}`);
    assert.equal(own.total,2);assert.equal(other.total,1);
    assert.ok(!JSON.stringify(own).includes('Private feedback'));assert.ok(!JSON.stringify(own).includes('score'));
    await call(replacement,'GET',`timeline?${q}`,undefined,404);
  });

  await t.test('worker retries are bounded, projection rollback is atomic and failed events can be retried',async()=>{
    await db.query(`CREATE FUNCTION fail_notification() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected failure'; END; $$;
      CREATE TRIGGER fail_notification BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION fail_notification()`);
    const session=await call(teacher,'POST','teaching/attendance-sessions',{sectionId:section,subjectId:subject,date:new Date().toISOString().slice(0,10),period:1});
    await call(teacher,'PATCH',`teaching/attendance-sessions/${session.id}/records`,{records:[student,student2].map(p=>({studentId:p.id,status:'present'}))});
    await call(teacher,'POST',`teaching/attendance-sessions/${session.id}/finalize`,{});
    const event=(await db.query("SELECT id FROM domain_events WHERE event_type='attendance.finalized'")).rows[0];
    try{
      for(let attempt=1;attempt<=5;attempt++){
        await db.query('UPDATE domain_events SET available_at=now() WHERE id=$1',[event.id]);
        assert.equal((await outbox.drain(org)).failed,1);
        assert.equal((await db.query('SELECT * FROM timeline_events WHERE event_id=$1',[event.id])).rowCount,0);
      }
      const failed=(await db.query('SELECT attempts,failed_at FROM domain_events WHERE id=$1',[event.id])).rows[0];assert.equal(failed.attempts,5);assert.ok(failed.failed_at);
      assert.deepEqual(await outbox.drain(org),{processed:0,failed:0});
    }finally{await db.query('DROP TRIGGER fail_notification ON notifications; DROP FUNCTION fail_notification()');}
    assert.equal(await outbox.retryFailed(org),1);assert.equal((await outbox.drain(org)).processed,1);
    assert.equal((await db.query('SELECT * FROM notifications WHERE event_id=$1',[event.id])).rowCount,2);
  });

  await t.test('outbox insertion failure rolls back publication and no replay key is retained',async()=>{
    const draft=await call(teacher,'POST','teaching/assignments',{sectionId:section,subjectId:subject,title:'Rollback',dueAt:new Date(Date.now()+86400_000).toISOString(),maxScore:10});
    const key=randomUUID();
    await db.query(`CREATE FUNCTION fail_outbox() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected failure'; END; $$;
      CREATE TRIGGER fail_outbox BEFORE INSERT ON domain_events FOR EACH ROW EXECUTE FUNCTION fail_outbox()`);
    try{
      await call(teacher,'POST',`teaching/assignments/${draft.id}/publish`,{},500,{'Idempotency-Key':key});
      assert.equal((await db.query('SELECT status FROM assignments WHERE id=$1',[draft.id])).rows[0].status,'draft');
      assert.equal((await db.query('SELECT * FROM submissions WHERE assignment_id=$1',[draft.id])).rowCount,0);
      assert.equal((await db.query('SELECT * FROM idempotency_records WHERE key=$1',[key])).rowCount,0);
    }finally{await db.query('DROP TRIGGER fail_outbox ON domain_events; DROP FUNCTION fail_outbox()');}
  });

  await t.test('recording upload signature, metadata verification, immutable version and publication',async()=>{
    const invalidVideo=Buffer.alloc(video.length);
    const invalid=await call(teacher,'POST','recordings',{...metadata,checksumSha256:createHash('sha256').update(invalidVideo).digest('base64')});
    const invalidUpload=await call(teacher,'POST',`recordings/${invalid.id}/upload-url`,{},200);
    const invalidResponse=await fetch(invalidUpload.url,{method:'PUT',headers:invalidUpload.headers,body:invalidVideo});
    assert.equal(invalidResponse.status,200);
    await call(teacher,'POST',`recordings/${invalid.id}/complete`,{versionId:invalidResponse.headers.get('x-amz-version-id')},400);
    await call(student,'POST','recordings',metadata,403);
    await call(teacher,'POST','recordings',{...metadata,sizeBytes:536870913},400);
    await call(teacher,'POST','recordings',{...metadata,objectKey:'foreign/key'},400);
    recording=await call(teacher,'POST','recordings',metadata);
    assert.equal(recording.status,'uploading');assert.equal(recording.objectKey,undefined);
    await call(student,'GET',`recordings/${recording.id}`,undefined,404);
    await call(teacher,'POST',`recordings/${recording.id}/publish`,{},409);
    const upload=await call(teacher,'POST',`recordings/${recording.id}/upload-url`,{},200);
    const signed=new URL(upload.url);const signedHeaders=signed.searchParams.get('X-Amz-SignedHeaders');
    for(const header of ['content-length','content-type','if-none-match','x-amz-checksum-sha256'])assert.ok(signedHeaders.includes(header));
    assert.equal(signed.searchParams.get('X-Amz-Expires'),'300');
    const response=await fetch(upload.url,{method:'PUT',headers:upload.headers,body:video});assert.equal(response.status,200);version=response.headers.get('x-amz-version-id');
    assert.equal((await fetch(upload.url,{method:'PUT',headers:upload.headers,body:video})).status,412);
    wrongMetadata=true;await call(teacher,'POST',`recordings/${recording.id}/complete`,{versionId:version},400);wrongMetadata=false;
    wrongRange=true;await call(teacher,'POST',`recordings/${recording.id}/complete`,{versionId:version},400);wrongRange=false;
    await call(teacher,'POST',`recordings/${recording.id}/complete`,{versionId:'null'},400);
    await call(teacher,'POST',`recordings/${recording.id}/complete`,{versionId:randomUUID()},400);
    const ready=await call(teacher,'POST',`recordings/${recording.id}/complete`,{versionId:version});assert.equal(ready.status,'ready');
    await call(teacher,'PATCH',`recordings/${recording.id}`,{title:'Updated recording'});
    const key=randomUUID();await call(teacher,'POST',`recordings/${recording.id}/publish`,{},201,{'Idempotency-Key':key});
    await call(teacher,'POST',`recordings/${recording.id}/publish`,{},201,{'Idempotency-Key':key});
    await outbox.drain(org);
    assert.equal((await call(student,'GET',`recordings?${q}`)).total,1);
    playback=await call(student,'GET',`recordings/${recording.id}/playback`);assert.equal(new URL(playback.url).searchParams.get('versionId'),version);
    assert.equal(new URL(playback.url).searchParams.get('X-Amz-Expires'),'120');
    assert.deepEqual(Buffer.from(await(await fetch(playback.url)).arrayBuffer()),video);
    await call(teacher,'PATCH',`recordings/${recording.id}`,{title:'Published edit'},409);
    await call(replacement,'GET',`recordings/${recording.id}/playback`,undefined,404);
    await foreign.request('GET',`/organizations/${otherOrg}/recordings/${recording.id}/playback`,undefined,404);
    await call(teacher,'PATCH',`recordings/${recording.id}/archive`,{});
    await call(student,'GET',`recordings/${recording.id}/playback`,undefined,404);
    assert.ok((await call(student,'GET','notifications')).items.every(n=>n.eventType!=='recording.published'));
    assert.ok((await call(student,'GET',`timeline?${q}`)).items.every(n=>n.eventType!=='recording.published'));
    assert.equal((await fetch(playback.url)).status,200); // Previously issued bearer URL cannot be revoked by application state.
  });

  await t.test('storage-disabled mode fails closed and config rejects unsafe origins',async()=>{
    const disabled=new StorageService({...config,storage:undefined});
    await assert.rejects(disabled.upload({}),/not configured/);
    const broken=new StorageService({...config,storage});
    broken.client.config.credentials=async()=>{throw new Error('Credential provider failed');};
    try {
      const stored={...metadata,objectKey:'test.mp4'};
      for (const action of [()=>broken.upload(stored),()=>broken.playback(stored,'test-version')]) await assert.rejects(action,error=>error.getStatus()===503&&!error.message.includes('Credential provider'));
    } finally { broken.onModuleDestroy(); }
    const env={NODE_ENV:'production',DATABASE_URL:databaseUrl,SESSION_SECRET:'x'.repeat(48),CORS_ORIGINS:'https://school.example',S3_BUCKET:'private-recordings',S3_REGION:'us-east-1'};
    assert.throws(()=>loadConfig({...env,S3_ENDPOINT:'http://127.0.0.1:19000'}));
    assert.throws(()=>loadConfig({...env,S3_ACCESS_KEY_ID:'partial'}));
    assert.throws(()=>loadConfig({...env,S3_ENDPOINT:'https://storage.example/path'}));
  });

  await t.test('suspension pauses workers and transfers/revocation remove feed access',async()=>{
    await db.query('UPDATE class_subject_assignments SET teacher_user_id=$1 WHERE organization_id=$2',[replacement.id,org]);
    await call(teacher,'POST',`teaching/assignments/${assignment.id}/publish`,{},404,{'Idempotency-Key':publishKey});
    await call(teacher,'GET',`timeline?${q}`,undefined,404);
    await db.query("UPDATE enrollments SET status='withdrawn' WHERE organization_id=$1 AND student_user_id=$2",[org,student.id]);
    assert.equal((await call(student,'GET','notifications')).total,0);
    await call(student,'GET',`timeline?${q}`,undefined,404);
    await db.query("UPDATE organizations SET status='suspended' WHERE id=$1",[org]);
    assert.deepEqual(await outbox.drain(org),{processed:0,failed:0});await call(admin,'GET','notifications',undefined,403);
    await db.query("UPDATE organizations SET status='active' WHERE id=$1",[org]);
  });

  await t.test('M4 RLS is enforced on all five tables without tenant predicates',async()=>{
    const scoped=new Client({connectionString:runtimeUrl.toString(),ssl,options:`-c search_path=${schema}`});await scoped.connect();
    try{
      for(const table of ['recorded_sessions','domain_events','event_recipients','timeline_events','notifications'])assert.equal((await scoped.query(`SELECT * FROM ${table}`)).rowCount,0);
      await scoped.query('BEGIN');await scoped.query("SELECT set_config('app.current_org_id',$1,true)",[org]);
      for(const table of ['recorded_sessions','domain_events','event_recipients','timeline_events','notifications']){
        const rows=(await scoped.query(`SELECT organization_id FROM ${table}`)).rows;assert.ok(rows.length);assert.ok(rows.every(r=>r.organization_id===org));
      }
      await assert.rejects(scoped.query('INSERT INTO timeline_events(organization_id,event_id) VALUES ($1,$2)',[otherOrg,randomUUID()]),{code:'42501'});
      await scoped.query('ROLLBACK');assert.equal((await scoped.query('SELECT * FROM notifications')).rowCount,0);
    }finally{await scoped.end();}
  });
  await t.test('worker projects events with only its documented database grants',async()=>{
    await db.query(`REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "${schema}" FROM "${role}";
      GRANT SELECT ON organizations,memberships,users,domain_events,event_recipients,timeline_events,notifications TO "${role}";
      GRANT UPDATE ON domain_events TO "${role}";
      GRANT INSERT ON timeline_events,notifications TO "${role}"`);
    const event=randomUUID();
    await db.query("INSERT INTO domain_events(id,organization_id,section_id,subject_id,actor_id,event_type,resource_id) VALUES($1,$2,$3,$4,$5,'assignment.published',$6)",[event,org,section,subject,replacement.id,assignment.id]);
    await db.query('INSERT INTO event_recipients(organization_id,event_id,user_id) VALUES($1,$2,$3)',[org,event,student2.id]);
    assert.deepEqual(await outbox.drain(org),{processed:1,failed:0});
    assert.equal(await outbox.retryFailed(org),0);
    assert.equal((await db.query('SELECT * FROM notifications WHERE event_id=$1',[event])).rowCount,1);
  });
});
