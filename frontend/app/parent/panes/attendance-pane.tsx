"use client";

import React from "react";
import { WardInfo, LeaveApplication } from "../types";
import { CalendarCheck, Clock, Plus, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export function AttendancePane({
  selectedWard,
  leavesList,
  onOpenLeaveModal,
}: {
  selectedWard: WardInfo;
  leavesList: LeaveApplication[];
  onOpenLeaveModal: () => void;
}) {
  const attendance = selectedWard.data?.attendance || [];
  const wardLeaves = leavesList.filter((l) => l.studentUserId === selectedWard.studentUserId);

  const attendanceRate = selectedWard.attendancePct != null ? `${selectedWard.attendancePct}%` : "—";
  const approvedLeaves = wardLeaves.filter((l) => l.status === "approved").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Mint */}
        <div
          style={{
            height: "148px",
            background: "#ccefbf",
            border: "1px solid #b2e49f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a5c0a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Cumulative Attendance
            </span>
            <CheckCircle2 size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{attendanceRate}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              CBSE Benchmark: 75% Required
            </div>
          </div>
        </div>

        {/* Card 2: Violet */}
        <div
          style={{
            height: "148px",
            background: "#e1d2ff",
            border: "1px solid #cdb5ff",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4a0e8f", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Today's Status
            </span>
            <CalendarCheck size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>
              {selectedWard.todayAttendance || "Not Recorded"}
            </div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Live Daily Register Status
            </div>
          </div>
        </div>

        {/* Card 3: Sky */}
        <div
          style={{
            height: "148px",
            background: "#bae5f5",
            border: "1px solid #9ad7ef",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a5a7a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Tracked Sessions
            </span>
            <Clock size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{attendance.length}</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Finalized Class Period Logs
            </div>
          </div>
        </div>

        {/* Card 4: Peach */}
        <div
          style={{
            height: "148px",
            background: "#ffd8c7",
            border: "1px solid #ffbe9f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#782a00", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Leave Applications
            </span>
            <FileText size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>{wardLeaves.length}</div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              {approvedLeaves} Approved by Administration
            </div>
          </div>
        </div>
      </div>

      {/* Leave Applications Table & Apply Button */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e4e6e9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Leave Applications</h3>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
              Official student absence requests and school administration approval status.
            </p>
          </div>
          <button
            onClick={onOpenLeaveModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#0c1e33",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Apply Student Leave
          </button>
        </div>

        {wardLeaves.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
            No leave applications recorded for {selectedWard.name}.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Leave Type</th>
                  <th style={{ padding: "12px 16px" }}>From Date</th>
                  <th style={{ padding: "12px 16px" }}>To Date</th>
                  <th style={{ padding: "12px 16px" }}>Reason</th>
                  <th style={{ padding: "12px 16px" }}>Submitted</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {wardLeaves.map((l) => (
                  <tr
                    key={l.id}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{l.leaveType}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{l.startDate}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{l.endDate}</td>
                    <td style={{ padding: "12px 16px", color: "#334155", maxWidth: "260px" }}>{l.reason}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>
                      {l.submittedAt ? new Date(l.submittedAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: l.status === "approved" ? "#dcfce7" : l.status === "rejected" ? "#fee2e2" : "#fef3c7",
                          color: l.status === "approved" ? "#166534" : l.status === "rejected" ? "#991b1b" : "#92400e",
                          textTransform: "capitalize",
                        }}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Finalized Class Attendance Records */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
            Finalized Attendance Session Records
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
            Period-by-period attendance verified and saved by subject teachers.
          </p>
        </div>

        {attendance.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
            No finalized attendance periods logged yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Class Period</th>
                  <th style={{ padding: "12px 16px" }}>Recorded Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0, 15).map((att: any, idx: number) => {
                  const isPresent = att.status?.toLowerCase().includes("present");
                  const isAbsent = att.status?.toLowerCase().includes("absent");
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                        {att.date ? new Date(att.date).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>Period {att.period}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: isPresent ? "#dcfce7" : isAbsent ? "#fee2e2" : "#fef3c7",
                            color: isPresent ? "#166534" : isAbsent ? "#991b1b" : "#92400e",
                          }}
                        >
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
