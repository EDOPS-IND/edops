'use client';
import React,{useState,useEffect} from 'react';
import { getStudentExams } from '../../edops-api';
import { RecordList } from '../../parent/components/record-list';
export function ExamsPane({organizationId}: {organizationId:string}) {
  const [data,setData]=useState<any>(null),[error,setError]=useState('');
  const load=async()=>{setError('');try{setData(await getStudentExams(organizationId));}catch(e){setData(null);setError(e instanceof Error?e.message:'Unable to load exams');}};
  useEffect(()=>{setData(null);load();},[organizationId]);
  return <div className="space-y-5"><h2 className="text-xl font-bold">Exams and published results</h2>{error&&<p role="alert">{error} <button onClick={load}>Retry</button></p>}
    {!data&&!error&&<p>Loading exams…</p>}{data&&<>{!data.upcomingExams.length&&<p>No upcoming exams.</p>}{data.upcomingExams.map((e:any)=><RecordList key={e.id} title={e.name} rows={e.schedule} columns={[["date","Date"],["subject","Subject"],["time","Time"],["maxMarks","Maximum marks"]]}/>)}
      {!data.scorecards.length&&<p>No published scorecards.</p>}{data.scorecards.map((c:any)=><section key={c.id}><RecordList title={`${c.examName} · ${c.term}`} rows={c.subjects} columns={[["subject","Subject"],["marks","Marks"],["max","Maximum"],["grade","Grade"]]}/><p>Total: {c.totalMarks}/{c.maxTotal} · {c.percentage}%</p></section>)}<button onClick={()=>window.print()}>Print saved results</button></>}
  </div>;
}
