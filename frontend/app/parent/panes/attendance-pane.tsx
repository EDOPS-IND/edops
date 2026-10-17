'use client';
import React from 'react';
import { WardInfo,LeaveApplication } from '../types';
import { RecordList } from '../components/record-list';
export function AttendancePane({selectedWard,leavesList,onOpenLeaveModal}: {selectedWard:WardInfo;leavesList:LeaveApplication[];onOpenLeaveModal:()=>void}) {
  return <div className="space-y-5"><h2 className="text-xl font-bold">Attendance · {selectedWard.name}</h2><button onClick={onOpenLeaveModal}>Apply leave</button><RecordList title="Finalized attendance" rows={selectedWard.data?.attendance || []} columns={[["date","Date"],["period","Period"],["status","Status"]]}/><RecordList title="Leave applications" rows={leavesList.filter(l=>l.studentUserId===selectedWard.studentUserId)} columns={[["leaveType","Type"],["startDate","From"],["endDate","To"],["reason","Reason"],["status","Status"]]}/></div>;
}
