"use client";

import React from "react";
import { ClipboardCheck, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export function LearningPane() {
  const assignments = [
    { class: "Grade 10-A", subject: "Mathematics", teacher: "Rahul Sharma", assigned: 42, submitted: 38, evaluated: 35, pendingEval: 3, submissionRate: "90.5%", timeliness: "92%" },
    { class: "Grade 10-B", subject: "Mathematics", teacher: "Rahul Sharma", assigned: 40, submitted: 37, evaluated: 37, pendingEval: 0, submissionRate: "92.5%", timeliness: "100%" },
    { class: "Grade 9-A", subject: "Science Lab", teacher: "Dr. Anita Desai", assigned: 40, submitted: 39, evaluated: 39, pendingEval: 0, submissionRate: "97.5%", timeliness: "98%" },
    { class: "Grade 8-B", subject: "Computer Science", teacher: "Sunita Rao", assigned: 40, submitted: 28, evaluated: 25, pendingEval: 3, submissionRate: "70.0%", timeliness: "85%" },
    { class: "Grade 11-A", subject: "English Literature", teacher: "Pooja Verma", assigned: 35, submitted: 34, evaluated: 33, pendingEval: 1, submissionRate: "97.1%", timeliness: "95%" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Metric Overview Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Active Coursework Units</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>142</div>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Across 36 sections</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>On-Time Submission Rate</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#15803D", margin: "4px 0" }}>86.4%</div>
          <div style={{ fontSize: "11px", color: "#166534" }}>Target: &gt;85.0%</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Faculty Evaluation Rate (48h)</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#065F46", margin: "4px 0" }}>94.1%</div>
          <div style={{ fontSize: "11px", color: "#065F46" }}>Exemplary turnaround</div>
        </div>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#92400E", fontWeight: 600 }}>Overdue Evaluations (&gt;48h)</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#B45309", margin: "4px 0" }}>7 Submissions</div>
          <div style={{ fontSize: "11px", color: "#92400E" }}>Flagged in Academic Audit</div>
        </div>
      </div>

      {/* 2. Class-by-Class Execution Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
            Coursework & Assignment Evaluation Timeliness Roster
          </h3>
          <span style={{ fontSize: "12px", color: "#64748B" }}>SLA: 48 hours for teacher return feedback</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 700 }}>
              <th style={{ padding: "12px 16px" }}>Class Section</th>
              <th style={{ padding: "12px 16px" }}>Subject</th>
              <th style={{ padding: "12px 16px" }}>Assigned Faculty</th>
              <th style={{ padding: "12px 16px" }}>Submitted / Assigned</th>
              <th style={{ padding: "12px 16px" }}>Submission Rate</th>
              <th style={{ padding: "12px 16px" }}>Evaluated</th>
              <th style={{ padding: "12px 16px" }}>Pending Evaluation</th>
              <th style={{ padding: "12px 16px" }}>Turnaround SLA</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>{a.class}</td>
                <td style={{ padding: "12px 16px", color: "#334155" }}>{a.subject}</td>
                <td style={{ padding: "12px 16px", color: "#64748B" }}>{a.teacher}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{a.submitted} / {a.assigned}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: parseFloat(a.submissionRate) < 80 ? "#DC2626" : "#15803D" }}>
                  {a.submissionRate}
                </td>
                <td style={{ padding: "12px 16px", color: "#15803D", fontWeight: 600 }}>{a.evaluated}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: a.pendingEval > 0 ? "#D97706" : "#15803D" }}>
                  {a.pendingEval} {a.pendingEval > 0 ? "pending" : "clear"}
                </td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#065F46" }}>{a.timeliness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
