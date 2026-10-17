'use client';
import React,{useState} from 'react';
import { WardInfo,LeaveApplication } from '../types';
export function ApplyLeaveModal({isOpen,onClose,selectedWard,onApplyLeave}: {isOpen:boolean;onClose:()=>void;selectedWard:WardInfo;onApplyLeave:(data:Pick<LeaveApplication,'leaveType'|'startDate'|'endDate'|'reason'>)=>Promise<void>}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"><form className="bg-white rounded-2xl p-6 space-y-4 w-full max-w-lg" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError('');try{await onApplyLeave({leaveType:String(form.get('type')),startDate:String(form.get('start')),endDate:String(form.get('end')),reason:String(form.get('reason'))});onClose();}catch(e){setError(e instanceof Error?e.message:'Unable to save leave');}finally{setBusy(false);}}}>
    <h2 className="font-bold">Apply leave · {selectedWard.name}</h2>{error&&<p role="alert">{error}</p>}
    <label className="block">Leave type<input name="type" required maxLength={50} className="block border p-2 w-full"/></label>
    <label className="block">From<input name="start" type="date" required className="block border p-2"/></label><label className="block">To<input name="end" type="date" required className="block border p-2"/></label>
    <label className="block">Reason<textarea name="reason" required maxLength={4000} className="block border p-2 w-full"/></label><div className="flex gap-4"><button disabled={busy}>{busy?'Saving…':'Submit leave'}</button><button type="button" onClick={onClose}>Close</button></div>
  </form></div>;
}
