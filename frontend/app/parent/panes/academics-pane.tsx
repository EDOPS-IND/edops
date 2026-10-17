'use client';
import React from 'react';
import { WardInfo } from '../types';
import { RecordList } from '../components/record-list';
export function AcademicsPane({selectedWard,onOpenReportModal}: {selectedWard:WardInfo;onOpenReportModal?:()=>void}) {
  return <div className="space-y-5"><h2 className="text-xl font-bold">Academics · {selectedWard.name}</h2><RecordList title="Enrolled subjects" rows={selectedWard.data?.subjects || []} columns={[["name","Subject"],["code","Code"],["teacher","Teacher"]]}/><RecordList title="Published results" rows={selectedWard.data?.results || []} columns={[["exam","Exam"],["subject","Subject"],["score","Marks"],["max","Maximum"],["grade","Grade"]]}/><button onClick={onOpenReportModal}>View report</button></div>;
}
