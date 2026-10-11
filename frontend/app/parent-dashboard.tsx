"use client";

import { ParentWorkspaceData } from "./edops-api";

export function ParentDashboard({ view, children, messages }: {
  view: "overview" | "children" | "attendance" | "notices";
  children: ParentWorkspaceData["children"];
  messages: ParentWorkspaceData["messages"];
}) {
  const showChildren = view === "overview" || view === "children";
  const showAttendance = view === "overview" || view === "attendance";
  const showMessages = view === "overview" || view === "notices";

  return <div className="content-stack parent-hub-dashboard">
    {showChildren && <section className="data-card"><div className="data-head"><h2>Linked children</h2><span className="table-pill">{children.length}</span></div>
      {children.length ? <div className="simple-table">{children.map(child => <div key={child.studentUserId}><b>{child.name || child.email}</b><span>{child.sectionName || child.programName || "No current class"}</span><small>{child.rollNumber ? `Roll ${child.rollNumber}` : child.email}</small></div>)}</div> : <div className="empty-state"><h3>No linked students</h3><p>Ask your school administrator to link your child to this account.</p></div>}
    </section>}
    {showAttendance && <section className="data-card"><div className="data-head"><h2>Attendance</h2><span className="table-pill">Live</span></div>
      {children.length ? <div className="simple-table">{children.map(child => <div key={child.studentUserId}><b>{child.name || child.email}</b><span>Latest status: {child.todayAttendance || "Unknown"}</span><small>Recorded attendance: {Number.isFinite(Number(child.attendancePct)) ? `${child.attendancePct}%` : "Unavailable"}</small></div>)}</div> : <div className="empty-state"><h3>No attendance to show</h3><p>Attendance appears after a student is linked to your account.</p></div>}
    </section>}
    {showMessages && <section className="data-card"><div className="data-head"><h2>School notices</h2><span className="table-pill">{messages.length}</span></div>
      {messages.length ? <div className="simple-table">{messages.map(message => <div key={message.id}><b>{message.subject || "Message"}</b><span>{message.body || ""}</span><small>{message.sender_name || "School"}{message.created_at ? ` · ${new Date(message.created_at).toLocaleDateString()}` : ""}</small></div>)}</div> : <div className="empty-state"><h3>No notices yet</h3><p>Messages sent to your account will appear here.</p></div>}
    </section>}
  </div>;
}
