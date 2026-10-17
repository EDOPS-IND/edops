"use client";

import React, { useState, useEffect } from "react";
import { AttendanceRecord, LeaveRequestRecord } from "./types";
import {
  getSchoolAdminAttendance,
  getSchoolAdminLeaves,
  updateSchoolAdminLeaveStatus,
} from "../edops-api";
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

export function AttendanceLeavePane({ organizationId }: { organizationId?: string }) {
  const [subtab, setSubtab] = useState<"register" | "defaulters" | "leave">("register");

  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);

  // Daily Attendance Register
  const [registers, setRegisters] = useState<AttendanceRecord[]>(([] as any[]));

  // Leave Requests Queue
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>(([] as any[]));

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    Promise.all([
      getSchoolAdminAttendance(organizationId).catch(() => null),
      getSchoolAdminLeaves(organizationId).catch(() => []),
    ]).then(([att, lvs]) => {
      if (att) {
        setAttendanceData(att);
        if (att.recentSessions && Array.isArray(att.recentSessions) && att.recentSessions.length > 0) {
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
      }
      if (lvs && Array.isArray(lvs) && lvs.length > 0) {
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
    }).finally(() => setLoading(false));
  }, [organizationId]);

  const handleLeaveAction = async (id:string,action:'Approved'|'Rejected') => {
    if (!organizationId) return;
    try {await updateSchoolAdminLeaveStatus(organizationId,id,action.toLowerCase());setLeaveRequests(prev=>prev.map(item=>item.id===id?{...item,status:action}:item));} catch {}
  };

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2DDD5", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "register", label: "Daily Attendance Register" },
            { id: "defaulters", label: "Low Attendance Defaulters (<75%)" },
            { id: "leave", label: `Leave Approval Desk (${leaveRequests.filter(l => l.status === "Pending").length} Pending)` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubtab(tab.id as any)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 750 : 600,
                background: subtab === tab.id ? "#064E3B" : "transparent",
                color: subtab === tab.id ? "#F8E7C9" : "#064E3B",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button style={{ padding: "8px 16px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
          Export Attendance Sheet (CSV)
        </button>
      </div>

      {/* 1. ATTENDANCE REGISTER TAB (§33) */}
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Today's Student Rate</span>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: "#064E3B", margin: "4px 0" }}>{avgRate}</div>
                  <span style={{ fontSize: "11.5px", color: "#064E3B", fontWeight: 700 }}>
                    {totalEnrolled > 0 ? `${totalPresent} of ${totalEnrolled} present` : "Recorded class registers below"}
                  </span>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Registers Submitted</span>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: "#064E3B", margin: "4px 0" }}>
                    {registers.length > 0 ? `${submittedCount} / ${registers.length}` : "—"}
                  </div>
                  <span style={{ fontSize: "11.5px", color: "#064E3B", fontWeight: 700 }}>
                    {registers.length > 0 ? `${Math.round((submittedCount / registers.length) * 100)}% completion` : "No active sessions today"}
                  </span>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Pending Registers</span>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: pendingCount > 0 ? "#B45309" : "#064E3B", margin: "4px 0" }}>
                    {registers.length > 0 ? pendingCount : "—"}
                  </div>
                  <span style={{ fontSize: "11.5px", color: pendingCount > 0 ? "#B45309" : "#064E3B", fontWeight: 700 }}>
                    {pendingCount > 0 ? "Teachers yet to submit register" : "All registers up to date"}
                  </span>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Absences & Late Arrivals</span>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: totalAbsent > 0 ? "#DC2626" : "#064E3B", margin: "4px 0" }}>
                    {registers.length > 0 ? totalAbsent : "—"}
                  </div>
                  <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                    {registers.length > 0 ? `${totalLate} late arrivals recorded` : "No gate check-in data available"}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Section Attendance Table */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Daily Class Section Attendance Registers</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Class & Section</th>
                  <th style={{ padding: "10px" }}>Enrolled</th>
                  <th style={{ padding: "10px" }}>Present</th>
                  <th style={{ padding: "10px" }}>Absent</th>
                  <th style={{ padding: "10px" }}>Late / Leave</th>
                  <th style={{ padding: "10px" }}>Register Status</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registers.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #FAF8F5" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <b>{r.section}</b>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>Teacher: {r.submittedBy}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>{r.totalStudents}</td>
                    <td style={{ padding: "12px 10px", fontWeight: 700, color: "#064E3B" }}>{r.present}</td>
                    <td style={{ padding: "12px 10px", fontWeight: 700, color: r.absent > 0 ? "#DC2626" : "var(--muted)" }}>{r.absent}</td>
                    <td style={{ padding: "12px 10px" }}>{r.late} late · {r.onLeave} leave</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                        background: r.status === "Submitted" ? "#ECFDF5" : "#FEF3C7",
                        color: r.status === "Submitted" ? "#064E3B" : "#92400E",
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}>
                      {r.status === "Pending" ? (
                        <button style={{ padding: "4px 8px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          Send Teacher Reminder
                        </button>
                      ) : (
                        <button style={{ padding: "4px 8px", background: "#FAF8F5", border: "1px solid #E2DDD5", color: "#064E3B", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          View Register
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LOW ATTENDANCE DEFAULTERS TAB (§33, §73: Actionable Loop) */}
      {subtab === "defaulters" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Students Below Statutory 75% Attendance Mark</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>CBSE exam eligibility threshold alert. Trigger parent escalation notices with 1-click.</p>
            </div>
            <button style={{ padding: "8px 16px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              Send Batch Warning via WhatsApp
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {(attendanceData?.defaulters && attendanceData.defaulters.length > 0
              ? attendanceData.defaulters.map((d: any) => ({
                  name: d.studentName,
                  adm: `ROLL-${d.rollNumber || "01"}`,
                  grade: d.section || "Grade 10",
                  parent: "Parent Guardian",
                  phone: d.parentPhone || "",
                  pct: d.attendancePct || 0,
                  daysAbsent: d.consecutiveDaysAbsent || 0,
                }))
              : ([] as any[])
            ).map((st: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "#FDF9F0", borderRadius: "8px", border: "1px solid #E5CCA2" }}>
                <div>
                  <b style={{ color: "#064E3B", fontSize: "14px" }}>{st.name}</b> <span style={{ fontSize: "12px", color: "var(--muted)" }}>({st.adm} · Class {st.grade})</span>
                  <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px" }}>
                    Parent: <b>{st.parent}</b> ({st.phone}) · <b>{st.daysAbsent} days absent this term</b>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#B45309" }}>{st.pct}%</div>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>Attendance Rate</span>
                  </div>
                  <button style={{ padding: "6px 12px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    Trigger WhatsApp Notice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LEAVE APPROVAL DESK TAB (§34) */}
      {subtab === "leave" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Leave Approval Desk</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Student medical leaves & staff casual leave applications awaiting admin verification</p>

          <div style={{ display: "grid", gap: "12px" }}>
            {leaveRequests.map((l) => (
              <div key={l.id} style={{ padding: "14px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700, background: "#064E3B", color: "#F8E7C9" }}>
                      {l.applicantType}
                    </span>
                    <b style={{ color: "#064E3B", fontSize: "14px" }}>{l.applicantName}</b>
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
                        style={{ padding: "6px 14px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(l.id, "Rejected")}
                        style={{ padding: "6px 14px", background: "#FAF8F5", border: "1px solid #E2DDD5", color: "#B91C1C", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ fontWeight: 700, color: l.status === "Approved" ? "#064E3B" : "#B91C1C", fontSize: "12px" }}>
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
