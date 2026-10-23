"use client";

import React, { useState, useEffect } from "react";
import { AttendanceRecord, LeaveRequestRecord } from "./types";
import {
  getSchoolAdminAttendance,
  getSchoolAdminLeaves,
  updateSchoolAdminLeaveStatus,
} from "../edops-api";
import { Empty } from "../components/ui";
import {
  CalendarCheck2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  Filter,
  ArrowRight,
  Send,
} from "lucide-react";

export function AttendanceLeavePane({
  organizationId,
  activeTab,
  onTabChange,
}: {
  organizationId?: string;
  activeTab?: "register" | "defaulters" | "leave";
  onTabChange?: (tab: "register" | "defaulters" | "leave") => void;
}) {
  const [subtab, setSubtab] = useState<"register" | "defaulters" | "leave">(activeTab || "register");

  useEffect(() => {
    if (activeTab && activeTab !== subtab) {
      setSubtab(activeTab);
    }
  }, [activeTab]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);

  // Daily Attendance Register
  const [registers, setRegisters] = useState<AttendanceRecord[]>(([] as any[]));

  // Leave Requests Queue
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>(([] as any[]));

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    setRegisters([]);
    setLeaveRequests([]);
    Promise.all([
      getSchoolAdminAttendance(organizationId),
      getSchoolAdminLeaves(organizationId),
    ]).then(([att, lvs]) => {
      setAttendanceData(att);
      if (att.recentSessions && Array.isArray(att.recentSessions)) {
          setRegisters(
            att.recentSessions.map((s: any) => ({
              date: String(s.date).slice(0, 10),
              grade: "Standard",
              section: s.sectionName || "Section",
              totalStudents: Number(s.totalCount || 0),
              present: Number(s.presentCount || 0),
              absent: Number(s.absentCount || 0),
              late: Number(s.lateCount || 0),
              onLeave: 0,
              submittedBy: s.teacherEmail || "Assigned Teacher",
              status: s.status === "finalized" ? "Submitted" : "Pending",
            }))
          );
      }
      if (Array.isArray(lvs)) {
        setLeaveRequests(
          lvs.map((l: any) => ({
            id: l.id,
            applicantType: l.applicant_role ? (l.applicant_role.charAt(0).toUpperCase() + l.applicant_role.slice(1)) : "Student",
            applicantName: l.applicant_name,
            detail: l.applicant_role === "teacher" ? "Faculty Member" : "Student Enrollment",
            startDate: String(l.start_date).slice(0, 10),
            endDate: String(l.end_date).slice(0, 10),
            days: l.days_count || 1,
            reason: l.reason,
            status: l.status ? (l.status.charAt(0).toUpperCase() + l.status.slice(1)) : "Pending",
          }))
        );
      }
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Attendance and leave data could not be loaded.");
    }).finally(() => setLoading(false));
  }, [organizationId]);

  const exportCsv = () => {
    const rows = registers.map((r) => [r.date, r.section, r.totalStudents, r.present, r.absent, r.late, r.status]);
    const csv = [["Date", "Section", "Enrolled", "Present", "Absent", "Late", "Status"], ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-register.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLeaveAction = async (id:string,action:'Approved'|'Rejected') => {
    if (!organizationId) return;
    try {await updateSchoolAdminLeaveStatus(organizationId,id,action.toLowerCase());setLeaveRequests(prev=>prev.map(item=>item.id===id?{...item,status:action}:item));} catch (cause) { setError(cause instanceof Error ? cause.message : "Leave status could not be updated."); }
  };

  return (
    <div className="edops-attendance-pane" style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Selector */}
      <div className="edops-attendance-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e4e6e9", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div className="edops-attendance-tabs" style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "register", label: "Daily Attendance Register" },
            { id: "defaulters", label: "Low Attendance Defaulters (<75%)" },
            { id: "leave", label: `Leave Approval Desk (${leaveRequests.filter(l => l.status === "Pending").length} Pending)` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSubtab(tab.id as any);
                if (onTabChange) onTabChange(tab.id as any);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 700 : 500,
                background: subtab === tab.id ? "#0c1e33" : "transparent",
                color: subtab === tab.id ? "#ffffff" : "#4a5568",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button className="edops-attendance-export" type="button" onClick={exportCsv} disabled={loading || registers.length === 0} style={{ padding: "8px 16px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", opacity: loading || registers.length === 0 ? 0.5 : 1 }}>
          Export Attendance Sheet (CSV)
        </button>
      </div>

      {error && <div role="alert" style={{ color: "#B91C1C", fontSize: "13px" }}>{error}</div>}

      {/* 1. ATTENDANCE REGISTER TAB */}
      {subtab === "register" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Top KPI Summary */}
          {(() => {
            const totalEnrolled = registers.reduce((sum, r) => sum + r.totalStudents, 0);
            const totalPresent = registers.reduce((sum, r) => sum + r.present, 0);
            const totalAbsent = registers.reduce((sum, r) => sum + r.absent, 0);
            const totalLate = registers.reduce((sum, r) => sum + r.late, 0);
            const avgRate = totalEnrolled > 0 ? `${Math.round((totalPresent / totalEnrolled) * 100)}%` : "—";
            const pendingCount = registers.filter((r) => r.status === "Pending").length;
            const submittedCount = registers.filter((r) => r.status === "Submitted").length;

            return (
              <div className="edops-attendance-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                {/* 1. Student Attendance Rate (Pastel Violet) */}
                <article
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "148px",
                    padding: "20px",
                    background: "#e1d2ff",
                    border: "1px solid #e1d2ff",
                    borderRadius: "10px",
                    color: "#4a0e8f",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Today's Student Turnout
                    </span>
                    <CalendarCheck2 size={18} />
                  </div>
                  <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
                    {avgRate}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px" }}>
                      {totalEnrolled > 0 ? `${totalPresent} of ${totalEnrolled} present` : "Recorded daily turnout"}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 600 }}>Real-Time</span>
                  </div>
                </article>

                {/* 2. Registers Submitted (Pastel Mint) */}
                <article
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "148px",
                    padding: "20px",
                    background: "#ccefbf",
                    border: "1px solid #ccefbf",
                    borderRadius: "10px",
                    color: "#1a5c0a",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Registers Submitted
                    </span>
                    <CheckCircle2 size={18} />
                  </div>
                  <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
                    {registers.length > 0 ? `${submittedCount}/${registers.length}` : "—"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px" }}>
                      {registers.length > 0 ? `${Math.round((submittedCount / registers.length) * 100)}% registers finalized` : "No sessions pending"}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 600 }}>Active</span>
                  </div>
                </article>

                {/* 3. Pending Roll Calls (Pastel Sky) */}
                <article
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "148px",
                    padding: "20px",
                    background: "#bae5f5",
                    border: "1px solid #bae5f5",
                    borderRadius: "10px",
                    color: "#0a5a7a",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Pending Roll Calls
                    </span>
                    <Clock size={18} />
                  </div>
                  <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
                    {registers.length > 0 ? pendingCount : 0}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px" }}>
                      {pendingCount > 0 ? "Awaiting teacher roll call" : "All homerooms submitted"}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 600 }}>Register</span>
                  </div>
                </article>

                {/* 4. Absences & Late (Pastel Coral) */}
                <article
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "148px",
                    padding: "20px",
                    background: "#ffd8c7",
                    border: "1px solid #ffd8c7",
                    borderRadius: "10px",
                    color: "#782a00",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Absences &amp; Late
                    </span>
                    <AlertTriangle size={18} />
                  </div>
                  <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#782a00" }}>
                    {totalAbsent}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px" }}>
                      {totalLate} late arrivals registered
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 600 }}>Triage</span>
                  </div>
                </article>
              </div>
            );
          })()}

          {/* Section Attendance Table */}
          <div className="edops-attendance-panel" style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Daily Class Section Attendance Registers</h3>
            <div className="edops-attendance-table" style={{ overflowX: "auto" }}>
            <table className="edops-attendance-grid" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Class & Section</th>
                  <th style={{ padding: "10px" }}>Enrolled</th>
                  <th style={{ padding: "10px" }}>Present</th>
                  <th style={{ padding: "10px" }}>Absent</th>
                  <th style={{ padding: "10px" }}>Late</th>
                  <th style={{ padding: "10px" }}>Register Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "24px" }}>Loading attendance registers…</td></tr>
                ) : registers.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "24px" }}><Empty title="No attendance recorded today" copy="Attendance registers will appear after a teacher submits a roll call." /></td></tr>
                ) : registers.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f4f6f7" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <b style={{ color: "#0c1e33" }}>{r.section}</b>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>Teacher: {r.submittedBy}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>{r.totalStudents}</td>
                    <td style={{ padding: "12px 10px", fontWeight: 700, color: "#047857" }}>{r.present}</td>
                    <td style={{ padding: "12px 10px", fontWeight: 700, color: r.absent > 0 ? "#DC2626" : "var(--muted)" }}>{r.absent}</td>
                    <td style={{ padding: "12px 10px" }}>{r.late} late</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                        background: r.status === "Submitted" ? "#ECFDF5" : "#FEF3C7",
                        color: r.status === "Submitted" ? "#047857" : "#92400E",
                      }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOW ATTENDANCE DEFAULTERS TAB (, : Actionable Loop) */}
      {subtab === "defaulters" && (
        <div className="edops-attendance-panel" style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Students Below Statutory 75% Attendance Mark</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>CBSE exam eligibility threshold alert. Trigger parent escalation notices with 1-click.</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {loading ? <p>Loading defaulters…</p> : (attendanceData?.defaulters && attendanceData.defaulters.length > 0
              ? attendanceData.defaulters.map((d: any) => ({
                  name: d.studentName,
                  adm: `ROLL-${d.rollNumber || "01"}`,
                  grade: d.section || "Grade 10",
                  parent: "Parent Guardian",
                  phone: d.parentPhone || "",
                  pct: d.attendancePct || 0,
                  daysAbsent: d.absentCount || 0,
                }))
              : ([] as any[])
            ).map((st: any, i: number) => (
              <div key={i} className="edops-attendance-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e4e6e9" }}>
                <div>
                  <b style={{ color: "#0c1e33", fontSize: "14px" }}>{st.name}</b> <span style={{ fontSize: "12px", color: "var(--muted)" }}>({st.adm} · Class {st.grade})</span>
                  <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px" }}>
                    Parent: <b>{st.parent}</b> ({st.phone}) · <b>{st.daysAbsent} days absent this term</b>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#B45309" }}>{st.pct}%</div>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>Attendance Rate</span>
                  </div>
                </div>
              </div>
            ))}
            {!loading && (!attendanceData?.defaulters || attendanceData.defaulters.length === 0) && <Empty title="No attendance defaulters" copy="No active student is currently below the 75% threshold." />}
          </div>
        </div>
      )}

      {/* 3. LEAVE APPROVAL DESK TAB */}
      {subtab === "leave" && (
        <div className="edops-attendance-panel" style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Leave Approval Desk</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Student medical leaves & staff casual leave applications awaiting admin verification</p>

          <div style={{ display: "grid", gap: "12px" }}>
            {loading ? <p>Loading leave requests…</p> : leaveRequests.length === 0 ? <Empty title="No leave requests" copy="New student and staff leave applications will appear here." /> : leaveRequests.map((l) => (
              <div key={l.id} className="edops-attendance-row" style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700, background: "#0c1e33", color: "#ffffff" }}>
                      {l.applicantType}
                    </span>
                    <b style={{ color: "#0c1e33", fontSize: "14px" }}>{l.applicantName}</b>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>({l.detail})</span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#334155" }}>
                    Duration: <b>{l.startDate} → {l.endDate} ({l.days} days)</b> · Reason: <em>"{l.reason}"</em>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {l.status === "Pending" ? (
                    <>
                      <button
                        onClick={() => handleLeaveAction(l.id, "Approved")}
                        style={{ padding: "6px 14px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(l.id, "Rejected")}
                        style={{ padding: "6px 14px", background: "#ffffff", border: "1px solid #e4e6e9", color: "#B91C1C", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ fontWeight: 700, color: l.status === "Approved" ? "#047857" : "#B91C1C", fontSize: "12px" }}>
                      {l.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
