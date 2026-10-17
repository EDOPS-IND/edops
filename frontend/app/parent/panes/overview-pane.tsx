'use client';
import React from 'react';
import { WardInfo,ParentTab } from '../types';
import { RecordList } from '../components/record-list';
export function OverviewPane({selectedWard,onOpenLeaveModal,onOpenQueryModal,onOpenReportModal}: {selectedWard:WardInfo;onNavigateTab:(tab:ParentTab)=>void;onOpenLeaveModal:()=>void;onOpenQueryModal:()=>void;onOpenReportModal:()=>void}) {
  const data=selectedWard.data;
  return <div className="space-y-5"><div className="bg-white p-5 border rounded-2xl"><h2 className="text-xl font-bold">{selectedWard.name}</h2><p>{selectedWard.sectionName || 'No active enrollment'} · Roll: {selectedWard.rollNumber || '—'}</p><p>Attendance: {selectedWard.attendancePct==null?'—':`${selectedWard.attendancePct}%`} · Today: {selectedWard.todayAttendance}</p><div className="flex gap-4 mt-4"><button onClick={onOpenLeaveModal}>Apply leave</button><button onClick={onOpenQueryModal}>Ask school</button><button onClick={onOpenReportModal}>View results</button></div></div>
    <RecordList title="Weekly timetable" rows={data?.timetable || []} columns={[["day","Day (1 = Monday)"],["period","Period"],["subject","Subject"],["teacher","Teacher"],["startTime","Start"],["endTime","End"]]}/>
    <RecordList title="Assignments" rows={data?.assignments || []} columns={[["title","Title"],["subject","Subject"],["dueDate","Due"],["status","Status"]]}/>
  </div>;
}
