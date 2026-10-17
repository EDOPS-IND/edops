'use client';
import { useEffect,useState } from 'react';
export function RequestErrorBanner() {
  const [error,setError]=useState<{message:string;mutation:boolean}|null>(null);
  useEffect(()=>{const listener=(event:Event)=>setError((event as CustomEvent).detail);window.addEventListener('edops:request-error',listener);return()=>window.removeEventListener('edops:request-error',listener);},[]);
  if (!error) return null;
  return <div role="alert" className="fixed top-4 left-4 right-4 z-[2000] bg-red-50 text-red-900 border border-red-200 rounded-xl p-4 shadow-lg flex flex-wrap gap-3 items-center"><span><b>{error.mutation?'Changes could not be saved.':'Data could not be loaded.'}</b> {error.message} {error.mutation?'Please retry from the form.':''}</span>{!error.mutation&&<button className="underline" onClick={()=>window.location.reload()}>Retry</button>}<button className="ml-auto" aria-label="Dismiss error" onClick={()=>setError(null)}>×</button></div>;
}
