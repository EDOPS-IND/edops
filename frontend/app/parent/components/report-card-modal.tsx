'use client';
import React from 'react';
import { WardInfo } from '../types';
import { RecordList } from './record-list';
export function ReportCardModal({isOpen,onClose,selectedWard}: {isOpen:boolean;onClose:()=>void;selectedWard:WardInfo}) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto"><h2 className="font-bold">Published results · {selectedWard.name}</h2><RecordList title="Report" rows={selectedWard.data?.results || []} columns={[["exam","Exam"],["subject","Subject"],["score","Marks"],["max","Maximum"],["grade","Grade"]]}/><button onClick={()=>window.print()}>Print</button><button onClick={onClose}>Close</button></div></div>;
}
