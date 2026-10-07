"use client";

import React, { useState } from "react";
import { Users, CalendarCheck, AlertTriangle, ArrowRight, UserCheck } from "lucide-react";

export function AttendancePane({
  onTriggerIntervention,
}: {
  onTriggerIntervention: (studentName: string) => void;
}) {
  const [filterMode, setFilterMode] = useState<"defaulters" | "trends">("defaulters");

  const defaulters = [
    { id: "stu-3", name: "Vikas Kumar", className: "Grade 10-A", roll: "03", attPct: 68.5, daysAbsent: 38, unexcused: 24, guardian: "Suresh Kumar (+91 98765 43210)" },
    { id: "stu-12", name: "Kavita Singh", className: "Grade 9-B", roll: "12", attPct: 71.0, daysAbsent: 34, unexcused: 19, guardian: "Raman Singh (+91 98111 22334)" },
    { id: "stu-19", name: "Anil Joshi", className: "Grade 11-A", roll: "08", attPct: 72.4, daysAbsent: 32, unexcused: 18, guardian: "P. Joshi (+91 98222 33445)" },
    { id: "stu-28", name: "Simran Kaur", className: "Grade 10-C", roll: "22", attPct: 73.8, daysAbsent: 31, unexcused: 15, guardian: "Gurmeet Kaur (+91 98333 44556)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Header Metrics Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Campus Student Attendance</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#15803D", margin: "4px 0" }}>94.2%</div>
          <div style={{ fontSize: "11px", color: "#166534" }}>+0.6% vs previous week</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Faculty Attendance Today</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>96.5%</div>
          <div style={{ fontSize: "11px", color: "#64748B" }}>40 / 42 faculty present</div>
        </div>

        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#991B1B", fontWeight: 600 }}>Below 75% CBSE Threshold</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#DC2626", margin: "4px 0" }}>28 Students</div>
          <div style={{ fontSize: "11px", color: "#991B1B" }}>Risk of board admit card hold</div>
        </div>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#92400E", fontWeight: 600 }}>Pending Class Registers</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#D97706", margin: "4px 0" }}>1 Section</div>
          <div style={{ fontSize: "11px", color: "#92400E" }}>Grade 7-C afternoon roll call</div>
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
            {defaulters.map((d, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>{d.name}</td>
                <td style={{ padding: "12px 16px", color: "#64748B" }}>{d.className} (Roll {d.roll})</td>
                <td style={{ padding: "12px 16px", fontWeight: 800, color: "#DC2626" }}>{d.attPct}%</td>
                <td style={{ padding: "12px 16px", color: "#475569" }}>{d.daysAbsent} days</td>
                <td style={{ padding: "12px 16px", color: "#B91C1C", fontWeight: 600 }}>{d.unexcused} days unexcused</td>
                <td style={{ padding: "12px 16px", color: "#64748B" }}>{d.guardian}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button
                    onClick={() => onTriggerIntervention(d.name)}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
