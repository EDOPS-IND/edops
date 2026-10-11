"use client";

import React from "react";
import { getPrincipalDashboard, getPrincipalLearningRoster } from "../../edops-api";

type RosterItem = { id: string; className: string; subjectName: string; teacherName: string; assigned: number; submitted: number; evaluated: number; pendingEvaluation: number };

export function LearningPane({
  organizationId,
}: {
  organizationId?: string;
  onNavigate?: (pane: string) => void;
}) {
  const [liveData, setLiveData] = React.useState<{ teachingExecution: { lessonPlansCompleted: number; syllabusCompletion: number | null; lessonsDelivered: number; pendingEvaluations: number } } | null>(null);
  const [assignments, setAssignments] = React.useState<RosterItem[]>([]);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!organizationId) return;
    Promise.all([getPrincipalDashboard(organizationId), getPrincipalLearningRoster(organizationId)])
      .then(([dashboard, roster]) => { setLiveData(dashboard); setAssignments(roster); })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load coursework"));
  }, [organizationId]);

  const exec = liveData?.teachingExecution;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {error && <p role="alert">{error}</p>}
      {/* 1. Metric Overview Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Published Assignments</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", margin: "4px 0" }}>{liveData ? assignments.length : "—"}</div>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Across active sections</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Syllabus Completion Rate</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#15803D", margin: "4px 0" }}>{exec?.syllabusCompletion == null ? "—" : `${exec.syllabusCompletion}%`}</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Lessons Delivered On-Time</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#065F46", margin: "4px 0" }}>{exec?.lessonsDelivered ?? "—"}</div>
          <div style={{ fontSize: "11px", color: "#065F46" }}>Instructional milestones verified</div>
        </div>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "10px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#92400E", fontWeight: 600 }}>Pending Evaluations</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#B45309", margin: "4px 0" }}>{exec?.pendingEvaluations ?? "—"} Submissions</div>
          <div style={{ fontSize: "11px", color: "#92400E" }}>Flagged in Academic Audit</div>
        </div>
      </div>


      {/* 2. Class-by-Class Execution Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
            Coursework & Assignment Evaluation Timeliness Roster
          </h3>
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
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "24px 16px", textAlign: "center", color: "#64748B" }}>
                  {error ? "Coursework unavailable." : liveData ? "No published coursework assignments." : "Loading coursework…"}
                </td>
              </tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>{a.className}</td>
                  <td style={{ padding: "12px 16px", color: "#334155" }}>{a.subjectName}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{a.teacherName}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{a.submitted} / {a.assigned}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#15803D" }}>
                    {a.assigned ? `${Math.round(100 * a.submitted / a.assigned)}%` : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#15803D", fontWeight: 600 }}>{a.evaluated}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: a.pendingEvaluation > 0 ? "#D97706" : "#15803D" }}>
                    {a.pendingEvaluation} {a.pendingEvaluation > 0 ? "pending" : "clear"}
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
