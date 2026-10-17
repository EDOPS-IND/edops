'use client';
import React,{useState} from 'react';
import { WardInfo } from '../types';
import { bookParentPtm,cancelParentPtm } from '../../edops-api';
export function PtmPane({selectedWard}: {selectedWard:WardInfo}) {
  const [scheduleId,setScheduleId]=useState(''),[teacherId,setTeacherId]=useState(''),[slotIndex,setSlotIndex]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const schedules=selectedWard.data?.schedules || [],teachers=selectedWard.data?.subjects || [],bookings=selectedWard.data?.bookings || [];
  const selected=schedules.find((s:any)=>s.id===scheduleId);
  const minutes=(v:string)=>{const m=v?.match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):NaN;};
  const count=selected&&selected.duration>0?Math.max(0,Math.floor((minutes(selected.endTime)-minutes(selected.startTime))/selected.duration)):0;
  const time=(m:number)=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const save=async(task:()=>Promise<any>)=>{setBusy(true);setError('');try {await task();await selectedWard.refresh?.();}catch(e){setError(e instanceof Error?e.message:'Unable to save booking');}finally{setBusy(false);}};
  return <div className="space-y-5"><h2 className="text-xl font-bold">Parent-teacher meetings</h2>{error&&<p role="alert">{error}</p>}
    {!schedules.length?<p>No open meeting schedules.</p>:<form className="flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault();save(()=>bookParentPtm(selectedWard.organizationId!,selectedWard.studentUserId,{scheduleId,teacherId,slotIndex,notes:''}));}}>
      <select required value={scheduleId} onChange={e=>{setScheduleId(e.target.value);setSlotIndex(0);}}><option value="">Select meeting</option>{schedules.map((s:any)=><option key={s.id} value={s.id}>{s.title} · {s.date}</option>)}</select>
      <select required value={teacherId} onChange={e=>setTeacherId(e.target.value)}><option value="">Select teacher</option>{teachers.map((t:any)=><option key={t.id} value={t.teacherId}>{t.teacher} · {t.name}</option>)}</select>
      <select value={slotIndex} onChange={e=>setSlotIndex(Number(e.target.value))}>{Array.from({length:Number.isFinite(count)?count:0},(_,i)=><option key={i} value={i}>{time(minutes(selected.startTime)+selected.duration*i)} – {time(minutes(selected.startTime)+selected.duration*(i+1))}</option>)}</select><button disabled={busy||!count}>Book meeting</button></form>}
    <section className="bg-white rounded-2xl border p-5"><h3 className="font-bold">Your bookings</h3>{!bookings.length&&<p>No bookings.</p>}{bookings.map((b:any)=><div key={b.id} className="py-3 border-b">{b.title} · {b.date} · {b.teacherName} · Slot {b.slotIndex+1} · {b.status} {b.status==='confirmed'&&<button disabled={busy} onClick={()=>save(()=>cancelParentPtm(selectedWard.organizationId!,selectedWard.studentUserId,b.id))}>Cancel</button>}</div>)}</section></div>;
}
