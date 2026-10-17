'use client';
import React from 'react';

export function RecordList({ title,rows,columns }: { title:string;rows:any[];columns:[string,string][] }) {
  const value=(v:any)=>v==null || v===''?'—':Array.isArray(v)?v.join(', '):String(v);
  return <section className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto"><h3 className="font-bold mb-4">{title}</h3>
    {!rows.length ? <p className="text-sm text-slate-500">No records available.</p> : <table className="w-full text-sm text-left"><thead><tr>{columns.map(([key,label])=><th className="p-2 border-b" key={key}>{label}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={row.id || i}>{columns.map(([key])=><td className="p-2 border-b" key={key}>{value(row[key])}</td>)}</tr>)}</tbody></table>}
  </section>;
}
