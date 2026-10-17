const root=require('node:path').resolve(__dirname, '..');
const assert=require('node:assert/strict');
const {randomUUID,randomBytes}=require('node:crypto');
const {Client}=require(root+'/node_modules/pg');
const {loadConfig}=require(root+'/dist/config');
const {createDataSource}=require(root+'/dist/database/data-source');
const {createApp}=require(root+'/dist/app');
const {DrizzleService}=require(root+'/dist/database/drizzle.service');
const testUrl=process.env.TEST_DATABASE_URL;
if (testUrl) assert.match(new URL(testUrl).pathname,/_test$/);
const schema='truth_test_'+randomBytes(6).toString('hex');
const config=loadConfig({...process.env,NODE_ENV:'test',DATABASE_URL:testUrl || "postgresql://localhost/edops_test",DATABASE_SCHEMA:schema,SESSION_SECRET:randomBytes(48).toString('hex'),CORS_ORIGINS:'http://localhost:3000',TRUST_PROXY:''});
const client=new Client({connectionString:testUrl,ssl:config.databaseSsl?{rejectUnauthorized:true}:false});
let app,failed=0;
async function check(name,fn){try{await fn();console.log('PASS',name);}catch(e){failed++;console.log('FAIL',name,e.message);}}
require('node:test').test('database portals use persisted records and honest empty responses', { skip: !testUrl }, async()=>{
 await client.connect();await client.query(`CREATE SCHEMA "${schema}"`);await client.query(`SET search_path TO "${schema}"`);
 try{
  const source=createDataSource(config);await source.initialize();try{await source.runMigrations();console.log('PASS all migrations on a fresh isolated schema');}finally{await source.destroy();}
  app=await createApp(config);await app.init();const db=app.get(DrizzleService);
  const service=(role,file,name)=>app.get(require(root+`/dist/modules/${role}/services/${file}.service`)[name]);
  const org=randomUUID(),other=randomUUID(),actors={};
  for(const role of ['school_admin','principal','teacher','student','parent']){
    actors[role]={id:randomUUID(),email:`${role}@truth.invalid`,name:`Saved ${role}`,isActive:true,isPlatformAdmin:false};
    await client.query(`INSERT INTO users(id,email,name,password_hash) VALUES($1,$2,$3,'not-a-real-hash')`,[actors[role].id,actors[role].email,actors[role].name]);
  }
  await client.query(`INSERT INTO organizations(id,name,slug) VALUES($1,'Saved school','saved-school'),($2,'Other school','other-school')`,[org,other]);
  for(const [role,actor]of Object.entries(actors))await client.query(`INSERT INTO memberships(organization_id,user_id,role) VALUES($1,$2,$3)`,[org,actor.id,role]);
  const run=fn=>db.forOrganization(org,fn),student=actors.student.id,teacher=actors.teacher;
  const specs=[
    ['student','student-subjects','StudentSubjectsService','getSubjects',[org,student],'subjects'],
    ['student','student-curriculum','StudentCurriculumService','getCurriculum',[org,student],'subjects'],
    ['student','student-classes','StudentClassesService','getClassDetails',[org,student],'classmates'],
    ['student','student-assignments','StudentAssignmentsService','getAssignments',[org,student],'assignments'],
    ['student','student-assessments','StudentAssessmentsService','getAssessments',[org,student],'assessments'],
    ['student','student-exams','StudentExamsService','getExamsAndScorecards',[org,student],'scorecards'],
    ['student','student-resources','StudentResourcesService','getResources',[org,student],'studyMaterials'],
    ['student','student-communication','StudentCommunicationService','getMessages',[org,student],'messages'],
    ['student','student-progress','StudentProgressService','getProgressOverview',[org,student],'goals'],
    ['student','student-arena','StudentArenaService','getActivities',[org,student],'activities'],
    ['student','student-performance','StudentPerformanceService','getPerformance',[org,student],'subjectScores'],
    ['student','student-attendance','StudentAttendanceService','getAttendance',[org,student],'calendarDays'],
    ['student','student-dashboard','StudentDashboardService','getDashboard',[org,student],'timetable'],
    ['teacher','teacher-classes','TeacherClassesService','getMyClasses',[org,teacher],'classes'],
    ['teacher','teacher-students','TeacherStudentsService','getStudentsOverview',[org,teacher],'students'],
    ['teacher','teacher-workload-reports','TeacherWorkloadReportsService','getWorkloadAndTasks',[org,teacher],'tasks'],
    ['teacher','teacher-workload-reports','TeacherWorkloadReportsService','getReportsAndHeatmap',[org,teacher],'students'],
    ['teacher','teacher-workload-reports','TeacherWorkloadReportsService','getCalendar',[org,teacher],'events'],
    ['teacher','teacher-learning','TeacherLearningService','getLearningHub',[org,teacher],'studyMaterials'],
    ['teacher','teacher-curriculum','TeacherCurriculumService','getCurriculumOverview',[org,teacher],'chapters'],
    ['teacher','teacher-assessments','TeacherAssessmentsService','getAssessments',[org,teacher],'assessments'],
    ['teacher','teacher-communication','TeacherCommunicationService','getMessages',[org,teacher],'messages'],
    ['teacher','teacher-dashboard','TeacherDashboardService','getDashboard',[org,teacher],'todaySchedule'],
    ['principal','principal-students','PrincipalStudentsService','getStudentsOverview',[org,actors.principal],'students'],
    ['principal','principal-audit-alerts','PrincipalAuditAlertsService','getAlerts',[org,actors.principal],'alerts'],
    ['principal','principal-audit-alerts','PrincipalAuditAlertsService','getAuditOverview',[org,actors.principal],'classesAudited'],
    ['principal','principal-communication','PrincipalCommunicationService','getCommunicationOverview',[org,actors.principal],'parentQueries'],
  ];
  for(const[role,file,name,method,args,key]of specs)await check(`${name}.${method}: empty database stays empty`,async()=>{
    const result=await run(()=>service(role,file,name)[method](...args));assert.deepEqual(result[key],[]);
  });
  const {SchoolAdminService}=require(root+'/dist/modules/school-admin/school-admin.service'),admin=app.get(SchoolAdminService);
  for(const [method,keys] of [
    ['getDepartments',null],
    ['getAcademicsOverview',['sections','subjects']],['getAttendanceRegisters',['recentSessions','defaulters']],
    ['getFinanceOverview',['structures','dues']],['getLearningOverview',['assignments','exams','results']],
    ['getOperationsOverview',['fleet','library','assets','ptms']],
  ]) await check('school admin '+method+' returns no invented records',async()=>{
    const result=await run(()=>admin[method](org,actors.school_admin));
    if (keys) for(const key of keys) assert.deepEqual(result[key],[],key);
    else assert.deepEqual(result,[]);
  });
  for (const [method,roles] of [['getStudents',['student']],['getTeachers',['teacher']],['getStaff',['principal','school_admin']],['getParents',['parent']]]) await check(`school admin ${method} contains only saved users`,async()=>{
    const result=await run(()=>admin[method](org,actors.school_admin));
    assert.deepEqual(result.map(r=>r.id).sort(),roles.map(r=>actors[r].id).sort());
    for (const row of result) {
      if ('admissionNo' in row) assert.equal(row.admissionNo,null);
      if ('empId' in row) assert.equal(row.empId,null);
      if ('employmentType' in row) assert.equal(row.employmentType,null);
    }
  });
  const year=randomUUID(),program=randomUUID(),section=randomUUID(),subject=randomUUID();
  await client.query(`INSERT INTO academic_years(id,organization_id,name,start_date,end_date,is_current) VALUES($1,$2,'Saved year',CURRENT_DATE-30,CURRENT_DATE+300,true)`,[year,org]);
  await client.query(`INSERT INTO programs(id,organization_id,name) VALUES($1,$2,'Saved program')`,[program,org]);
  await client.query(`INSERT INTO sections(id,organization_id,academic_year_id,program_id,name,capacity) VALUES($1,$2,$3,$4,'Saved section',10)`,[section,org,year,program]);
  await client.query(`INSERT INTO subjects(id,organization_id,name,code) VALUES($1,$2,'Saved subject','SAVED')`,[subject,org]);
  await client.query(`INSERT INTO enrollments(organization_id,student_user_id,section_id,academic_year_id,roll_number) VALUES($1,$2,$3,$4,'07')`,[org,student,section,year]);
  await client.query(`INSERT INTO class_subject_assignments(organization_id,section_id,subject_id,teacher_user_id) VALUES($1,$2,$3,$4)`,[org,section,subject,teacher.id]);
  await check('saved subject replaces empty data',async()=>{const result=await run(()=>service('student','student-subjects','StudentSubjectsService').getSubjects(org,student));assert.equal(result.subjects[0].name,'Saved subject');assert.equal(result.subjects[0].assessmentAverage,null);});
  await check('teacher cannot save scores for a student outside the assigned section',()=>assert.rejects(()=>run(()=>service('teacher','teacher-assessments','TeacherAssessmentsService').submitMarks(org,teacher,{sectionId:section,subjectId:subject,title:'Saved assessment',maxMarks:10,scores:[{studentId:actors.parent.id,score:5}]})),/enrolled student/));
  const progress=service('student','student-progress','StudentProgressService');
  await check('goal and support request persist',async()=>{
    const created=await run(()=>progress.createGoal(org,student,{title:'Saved goal',targetScore:80,deadline:'2030-01-01',subjectId:subject}));assert.match(created.goal.id,/^[a-f0-9-]{36}$/);
    await run(()=>progress.createSupportRequest(org,student,{category:'doubt',subjectId:subject,description:'Saved question'}));
    const result=await run(()=>progress.getProgressOverview(org,student));assert.equal(result.goals[0].title,'Saved goal');assert.equal(result.supportRequests[0].description,'Saved question');
  });
  await check('reflection persists',async()=>{await run(()=>progress.saveReflection(org,student,{cognitive:1,socioEmotional:2,psychomotor:3,creative:4,reflectionText:'Saved reflection',improvementText:'Saved improvement'}));const result=await run(()=>progress.getProgressOverview(org,student));assert.equal(result.selfReflection.reflectionText,'Saved reflection');});
  const arena=service('student','student-arena','StudentArenaService');
  await check('unknown arena questions never produce scores',()=>assert.rejects(()=>run(()=>arena.submitAttempt(org,student,randomUUID(),{submittedAnswer:[0]})),/not found/));
  const q=randomUUID();await client.query(`INSERT INTO arena_questions(id,organization_id,section_id,subject_id,created_by,topic,difficulty,question_type,content,answer_key,max_score,status,published_at) VALUES($1,$2,$3,$4,$5,'Saved topic','easy','single_choice',$6,$7,3,'published',now())`,[q,org,section,subject,teacher.id,JSON.stringify({prompt:'Saved question',options:[{id:'a',text:'One'},{id:'b',text:'Two'}]}),JSON.stringify(['b'])]);
  await check('arena scores come from saved answers and attempts',async()=>{const wrong=await run(()=>arena.submitAttempt(org,student,q,{submittedAnswer:[0]}));assert.equal(wrong.score,0);const correct=await run(()=>arena.submitAttempt(org,student,q,{submittedAnswer:[1]}));assert.equal(correct.score,3);const count=await client.query(`SELECT COUNT(*)::int AS n FROM arena_attempts WHERE question_id=$1`,[q]);assert.equal(count.rows[0].n,2);});
  const auth=app.get(require(root+'/dist/modules/auth/auth.service').AuthService);
  await check('demo credentials cannot authenticate without a saved user',()=>assert.rejects(()=>auth.verifyCredentials('student@edops.com','password123'),/Invalid email or password/));
  await check('refresh token is persisted',async()=>{await auth.createRefreshToken(student);const rows=await client.query(`SELECT COUNT(*)::int AS n FROM user_refresh_tokens WHERE user_id=$1`,[student]);assert.equal(rows.rows[0].n,1);});
  const parentService=app.get(require(root+'/dist/modules/parent/parent.service').ParentService);
  await client.query(`INSERT INTO parent_student_relationships(school_id,parent_id,student_id) VALUES($1,$2,$3)`,[org,actors.parent.id,student]);
  await check('parent records are empty, saved, and scoped to verified children',async()=>{
    const empty=await parentService.details(org,actors.parent,student);assert.deepEqual(empty.results,[]);
    await parentService.leave(org,actors.parent,student,{leaveType:'Medical',startDate:'2030-01-01',endDate:'2030-01-02',reason:'Saved leave'});
    await parentService.query(org,actors.parent,student,{subject:'Saved inquiry',queryText:'Saved parent question'});
    const saved=await parentService.details(org,actors.parent,student);assert.equal(saved.leaves[0].reason,'Saved leave');assert.equal(saved.queries[0].queryText,'Saved parent question');
    await assert.rejects(()=>parentService.details(other,actors.parent,student));
  });
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1`;
  const {signAccessToken} = require(root+'/dist/modules/auth/jwt.util');
  const http = async (role, path) => {
    const token=signAccessToken({sub:actors[role].id,email:actors[role].email,isPlatformAdmin:false});
    const response=await fetch(base+path,{headers:{Authorization:`Bearer ${token}`}});
    return {status:response.status,body:await response.json()};
  };
  for (const [role,path] of [['student','dashboard'],['student','profile'],['student','calendar'],['teacher','dashboard'],['teacher','classes'],['principal','dashboard'],['school_admin','dashboard']]) {
    await check(`${role} ${path} works through authentication and organization scope`,async()=>{
      const response=await http(role,`/organizations/${org}/${role.replace('_','-')}/${path}`);
      assert.equal(response.status,200,JSON.stringify(response.body));
    });
  }
  await check('HTTP rejects cross-school student access',async()=>{
    const response=await http('student',`/organizations/${other}/student/dashboard`);
    assert.equal(response.status,403);
  });
  await check('HTTP parent records match saved child data',async()=>{
    const response=await http('parent',`/organizations/${org}/parent/children/${student}`);
    assert.equal(response.status,200,JSON.stringify(response.body));
    assert.equal(response.body.queries[0].queryText,'Saved parent question');
  });
  assert.equal(failed, 0, "All database source-of-truth checks must pass");
 }finally{if(app)await app.close();await client.query(`DROP SCHEMA "${schema}" CASCADE`);await client.end();}
});
