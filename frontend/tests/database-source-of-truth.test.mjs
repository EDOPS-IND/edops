import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../app/edops-api.ts',import.meta.url),'utf8');
const compiled=ts.transpile(source,{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022});
const client=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('empty responses stay empty and failures never become demo data or successful saves',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({classes:[]})});
    assert.deepEqual(await client.getTeacherClasses('school'),{classes:[]});
    globalThis.fetch=async()=>({ok:false,status:503,json:async()=>({message:'Database unavailable'})});
    for(const [name,args] of [
      ['login',['student@edops.com','password123']],['profile',[]],['loadRoleWorkspace',['school']],['loadSchool',['school']],
      ['getPlatformDashboard',[]],['getSchoolAdminStudents',['school']],['getPrincipalStudents',['school']],['getTeacherClasses',['school']],['getStudentExams',['school']],
      ['createPlatformPlan',[{}]],['markTeacherAttendance',['school',{}]],['submitStudentAssignment',['school','assignment',{content:'Work'}]],
      ['submitStudentArenaAttempt',['school','question',{submittedAnswer:[0]}]],['createStudentGoal',['school',{}]],['sendStudentMessage',['school',{}]],
      ['createParentLeave',['school','child',{}]],['bookParentPtm',['school','child',{}]],
    ]) await assert.rejects(()=>client[name](...args),/Database unavailable/,name);
    globalThis.fetch=async()=>{throw new Error('Network unavailable');};
    await assert.rejects(()=>client.getStudentDashboard('school'),/Network unavailable/);
    globalThis.fetch=async()=>({ok:true,status:200,json:async()=>{throw new SyntaxError('Invalid JSON');}});
    await assert.rejects(()=>client.getTeacherClasses('school'),/Invalid JSON/);
    assert.doesNotMatch(source,/demo-jwt|mockStudents|trainingProfiles|getMockSchool/);
  } finally {globalThis.fetch=original;}
});
