'use client';
import React from 'react';
import { ParentWorkspaceData } from './edops-api';
export function ParentDashboard({children,messages}: {view:'overview'|'children'|'attendance'|'notices';children:ParentWorkspaceData['children'];messages:ParentWorkspaceData['messages']}) {
  return <div className="space-y-4">{!children.length&&<p>No verified children are linked to your account.</p>}{children.map(child=><section key={child.studentUserId} className="bg-white rounded-xl border p-4"><h3>{child.name}</h3><p>{child.sectionName} · {child.rollNumber}</p><p>Attendance: {child.attendancePct==null?'—':`${child.attendancePct}%`} · Today: {child.todayAttendance}</p></section>)}{!messages.length&&<p>No messages.</p>}{messages.map(m=><article key={m.id}><h3>{m.subject}</h3><p>{m.body}</p></article>)}</div>;
}
