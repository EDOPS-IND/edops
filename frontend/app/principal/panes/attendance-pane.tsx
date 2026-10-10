"use client";

import React, { useState } from "react";
import { Users, CalendarCheck, AlertTriangle, ArrowRight, UserCheck } from "lucide-react";

export function AttendancePane({
  onTriggerIntervention,
  organizationId,
  onOpenStudent360,
}: {
  onTriggerIntervention?: (studentName: string) => void;
  organizationId?: string;
  onOpenStudent360?: (id: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [filterMode, setFilterMode] = useState<"defaulters" | "trends">("defaulters");

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalDashboard }) => {
      getPrincipalDashboard(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const att = liveData?.attendance;
  const defaulters: any[] = [];


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Header Metrics Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Campus Student Attendance</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#15803D", margin: "4px 0" }}>{att?.overallStudentAttendance == null ? "—" : `${att.overallStudentAttendance}%`}</div>
          <div style={{ fontSize: "11px", color: "#166534" }}>Calculated from active sessions</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Faculty Attendance Today</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>{att?.teacherAttendance == null ? "—" : `${att.teacherAttendance}%`}</div>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Active faculty roster rate</div>
        </div>

        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#991B1B", fontWeight: 600 }}>Below 75% CBSE Threshold</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#DC2626", margin: "4px 0" }}>{att?.studentsBelowThreshold == null ? "—" : `${att.studentsBelowThreshold} Students`}</div>
          <div style={{ fontSize: "11px", color: "#991B1B" }}>Risk of board admit card hold</div>
        </div>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#92400E", fontWeight: 600 }}>Pending Class Registers</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#D97706", margin: "4px 0" }}>{att?.classesMissingAttendance == null ? "—" : `${att.classesMissingAttendance} Sections`}</div>
          <div style={{ fontSize: "11px", color: "#92400E" }}>Awaiting roll call submission</div>
        </div>
      </div>

      {/* 2. Defaulters Desk & Action Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
              Chronic Absenteeism Intervention Desk (&lt;75% Attendance)
            </h3>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Direct drill-down to assign counselor check-ins and academic welfare alerts
            </span>
          </div>
          <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
            Mandatory Board Threshold: 75%
          </span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 700 }}>
              <th style={{ padding: "12px 16px" }}>Student Name</th>
              <th style={{ padding: "12px 16px" }}>Class / Section</th>
              <th style={{ padding: "12px 16px" }}>Attendance Rate</th>
              <th style={{ padding: "12px 16px" }}>Days Absent (Total)</th>
              <th style={{ padding: "12px 16px" }}>Unexcused Absences</th>
              <th style={{ padding: "12px 16px" }}>Guardian Details</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Intervention Action</th>
            </tr>
          </thead>
          <tbody>
            {defaulters.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "24px 16px", textAlign: "center", color: "#64748B" }}>
                  No chronic attendance defaulters detected below threshold.
                </td>
              </tr>
            ) : (
              defaulters.map((d: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>{d.name}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{d.className} (Roll {d.roll})</td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: "#DC2626" }}>{d.attPct}%</td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{d.daysAbsent} days</td>
                  <td style={{ padding: "12px 16px", color: "#B91C1C", fontWeight: 600 }}>{d.unexcused} days unexcused</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{d.guardian}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => onTriggerIntervention && onTriggerIntervention(d.name)}
                      style={{
                        background: "#064E3B",
                        color: "#F8E7C9",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Assign Intervention
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
