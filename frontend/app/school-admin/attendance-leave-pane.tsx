"use client";

import React, { useState } from "react";
import { AttendanceRecord, LeaveRequestRecord } from "./types";
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

export function AttendanceLeavePane() {
  const [subtab, setSubtab] = useState<"register" | "defaulters" | "leave">("register");

  // Sample Daily Attendance Register (§33)
  const [registers, setRegisters] = useState<AttendanceRecord[]>([
    { date: "2026-10-04", grade: "Grade 10", section: "10-A", totalStudents: 42, present: 40, absent: 2, late: 1, onLeave: 0, submittedBy: "Rahul Sharma", status: "Submitted" },
    { date: "2026-10-04", grade: "Grade 10", section: "10-B", totalStudents: 44, present: 41, absent: 3, late: 0, onLeave: 1, submittedBy: "Sunita Rao", status: "Submitted" },
    { date: "2026-10-04", grade: "Grade 10", section: "10-C", totalStudents: 47, present: 0, absent: 0, late: 0, onLeave: 0, submittedBy: "Pooja Malhotra", status: "Pending" }, // Missing submission alert!
    { date: "2026-10-04", grade: "Grade 9", section: "9-A", totalStudents: 38, present: 36, absent: 2, late: 2, onLeave: 0, submittedBy: "Vikram Mehta", status: "Submitted" },
    { date: "2026-10-04", grade: "Grade 9", section: "9-B", totalStudents: 39, present: 38, absent: 1, late: 0, onLeave: 0, submittedBy: "Ananya Sen", status: "Submitted" },
  ]);

  // Leave Requests Queue (§34)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([
    { id: "l-1", applicantType: "Student", applicantName: "Ananya Iyer", detail: "Grade 10-A (Parent: Venkat Iyer)", startDate: "2026-10-05", endDate: "2026-10-06", days: 2, reason: "Severe viral fever (Doctor prescription uploaded)", status: "Pending" },
    { id: "l-2", applicantType: "Teacher", applicantName: "Vikram Mehta", detail: "Social Science PGT · Emp #EMP-T-09", startDate: "2026-10-12", endDate: "2026-10-12", days: 1, reason: "Attending CBSE Curriculum Workshop", status: "Pending" },
    { id: "l-3", applicantType: "Staff", applicantName: "Ramesh Chand", detail: "Transport Fleet Manager", startDate: "2026-10-08", endDate: "2026-10-09", days: 2, reason: "Personal family commitment", status: "Pending" },
  ]);

  const handleLeaveAction = (id: string, action: "Approved" | "Rejected") => {
    setLeaveRequests((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
  };

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2DDD5", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "register", label: "Daily Attendance Register" },
            { id: "defaulters", label: "Low Attendance Defaulters (<75%)" },
            { id: "leave", label: "Leave Approval Desk (3 Pending)" },
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Today's Student Rate</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#064E3B", margin: "4px 0" }}>94.2%</div>
              <span style={{ fontSize: "11.5px", color: "#064E3B", fontWeight: 700 }}>1,338 Present / 1,420 Enrolled</span>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Faculty Attendance</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#064E3B", margin: "4px 0" }}>97.8%</div>
              <span style={{ fontSize: "11.5px", color: "#064E3B", fontWeight: 700 }}>90 Present / 2 on Approved Leave</span>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Missing Registers</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#B45309", margin: "4px 0" }}>1 Section</div>
              <span style={{ fontSize: "11.5px", color: "#B45309", fontWeight: 700 }}>Class 10-C pending teacher submission</span>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Late Arrivals</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#064E3B", margin: "4px 0" }}>14 Students</div>
              <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>Logged at Gate 1 & 2 Security</span>
            </div>
          </div>

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
            {[
              { name: "Ananya Iyer", adm: "ED-2024-042", grade: "10-A", parent: "Venkat Iyer", phone: "+91 98112 34567", pct: 71, daysAbsent: 14 },
              { name: "Kavita Rao", adm: "ED-2024-077", grade: "9-A", parent: "Mohan Rao", phone: "+91 98334 11223", pct: 68, daysAbsent: 16 },
              { name: "Simran Kaur", adm: "ED-2023-104", grade: "11-A", parent: "Harpreet Singh", phone: "+91 98771 99887", pct: 73, daysAbsent: 12 },
            ].map((st, i) => (
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
