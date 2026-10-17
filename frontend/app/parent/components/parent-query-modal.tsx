'use client';
import React,{useState} from 'react';
import { WardInfo,ParentQuery } from '../types';
export function ParentQueryModal({isOpen,onClose,selectedWard,onSubmitQuery}: {isOpen:boolean;onClose:()=>void;selectedWard:WardInfo;onSubmitQuery:(data:Pick<ParentQuery,'subject'|'queryText'>)=>Promise<void>}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"><form className="bg-white rounded-2xl p-6 space-y-4 w-full max-w-lg" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError('');try{await onSubmitQuery({subject:String(form.get('subject')),queryText:String(form.get('query'))});onClose();}catch(e){setError(e instanceof Error?e.message:'Unable to send query');}finally{setBusy(false);}}}>
    <h2 className="font-bold">Ask school · {selectedWard.name}</h2>{error&&<p role="alert">{error}</p>}
    <label className="block">Subject<input name="subject" required maxLength={100} className="block border p-2 w-full"/></label>
    <label className="block">Query<textarea name="query" required maxLength={8000} className="block border p-2 w-full"/></label><div className="flex gap-4"><button disabled={busy}>{busy?'Saving…':'Send query'}</button><button type="button" onClick={onClose}>Close</button></div>
  </form></div>;
}
