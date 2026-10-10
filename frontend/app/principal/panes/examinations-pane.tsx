"use client";

import React, { useState } from "react";
import { ExamResultItem } from "../types";
import { Lock, CheckCircle2, ShieldCheck, Award, FileSpreadsheet, Send } from "lucide-react";

export function ExaminationsPane({
  examSchedules = [],
  resultsWorkflow,
  results = [],
  onPublishResults,
  organizationId,
  onNavigate,
}: {
  examSchedules?: any[];
  resultsWorkflow?: any;
  results?: ExamResultItem[];
  onPublishResults?: (examName: string, className: string) => Promise<void>;
  organizationId?: string;
  onNavigate?: (pane: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalExaminations }) => {
      getPrincipalExaminations(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const scheduleList = (liveData?.examSchedules && liveData.examSchedules.length > 0) ? liveData.examSchedules : examSchedules;
  const workflow = liveData?.resultsWorkflow || resultsWorkflow;
  const resultList = (liveData?.results && liveData.results.length > 0) ? liveData.results : results;


  const handlePublish = async (examName: string, className: string) => {
    if (!confirm(`Are you sure you want to approve, publish, and digitally lock results for ${examName} (${className})? Silent alterations will be blocked.`)) {
      return;
    }
    setPublishing(true);
    try {
      await onPublishResults(examName, className);
      alert(`Results for ${examName} (${className}) published and locked successfully.`);
    } catch {
      alert("Failed to publish results.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Results Workflow Verification Pipeline Banner (Section 37) */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>
              Controlled Result Publishing Workflow (Anti-Tamper Lock)
            </h3>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Four-step audit pipeline: Teacher Entered → Dept Verified → Principal Review → Published & Cryptographically Locked
            </span>
          </div>
          <span style={{ background: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
            Audit Chain Active
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { step: "1. Teacher Entry", count: workflow?.totalEntered ?? 0, status: "Evaluations recorded", color: "#2563EB" },
            { step: "2. Dept Verification", count: workflow?.departmentVerified ?? 0, status: "Department verified", color: "#0D9488" },
            { step: "3. Principal Review", count: workflow?.principalReviewed ?? 0, status: "Pending Signoff", color: "#D97706" },
            { step: "4. Published & Locked", count: workflow?.publishedAndLocked ?? 0, status: "Tamper Locked", color: "#15803D" },
          ].map((item, idx) => (
            <div key={idx} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>{item.step}</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: item.color, margin: "2px 0" }}>{item.count}</div>
              <div style={{ fontSize: "11px", color: item.color, fontWeight: 600 }}>{item.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Major Exam Schedules */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px" }}>
        <h4 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>Scheduled Board & Internal Examinations</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {scheduleList.map((ex: any, idx: number) => (
            <div key={idx} style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px", background: "#FFFFFF" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#1E40AF", background: "#EFF6FF", padding: "2px 6px", borderRadius: "4px" }}>
                  {ex.grades}
                </span>
                <span style={{ fontSize: "11px", color: "#15803D", fontWeight: 600 }}>{ex.status}</span>
              </div>
              <h5 style={{ margin: "4px 0", fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>{ex.exam}</h5>
              <div style={{ fontSize: "12px", color: "#64748B" }}>Dates: <b>{ex.dates}</b></div>
              <div style={{ fontSize: "11px", color: "#065F46", marginTop: "6px" }}>Evaluation SLA: {ex.evaluationSla}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Results Verification Roster & Publishing Controls */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
              Periodic Test 2 — Marks Ledger & Publication Approvals
            </h3>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Review student scorecards before authorizing parent and student portal release
            </span>
          </div>

          <button
            onClick={() => handlePublish("Periodic Test 2", "Grade 10")}
            disabled={publishing}
            style={{
              background: "#064E3B",
              color: "#F8E7C9",
              border: "none",
              borderRadius: "8px",
              padding: "8px 18px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: publishing ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Lock size={14} />
            {publishing ? "Publishing..." : "Publish & Lock Grade 10 Results"}
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 700 }}>
              <th style={{ padding: "12px 16px" }}>Student Name</th>
              <th style={{ padding: "12px 16px" }}>Class / Section</th>
              <th style={{ padding: "12px 16px" }}>Subject</th>
              <th style={{ padding: "12px 16px" }}>Score (Obtained / Max)</th>
              <th style={{ padding: "12px 16px" }}>Percentage</th>
              <th style={{ padding: "12px 16px" }}>Board Grade</th>
              <th style={{ padding: "12px 16px" }}>Workflow State</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Tamper Lock</th>
            </tr>
          </thead>
          <tbody>
            {resultList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "24px 16px", textAlign: "center", color: "#64748B" }}>
                  No published exam records found.
                </td>
              </tr>
            ) : (
              resultList.map((r: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>{r.studentName}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{r.className} - {r.sectionName}</td>
                  <td style={{ padding: "12px 16px", color: "#334155" }}>{r.subjectName}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{r.marksObtained} / {r.maxMarks}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: r.percentage < 60 ? "#DC2626" : "#15803D" }}>
                    {r.percentage}%
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>{r.grade}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: r.status === "Published" ? "#DCFCE7" : "#FEF3C7", color: r.status === "Published" ? "#166534" : "#92400E", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    {r.isLocked ? (
                      <span style={{ color: "#15803D", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Lock size={12} /> Locked
                      </span>
                    ) : (
                      <span style={{ color: "#D97706", fontWeight: 600 }}>Pending Lock</span>
                    )}
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
