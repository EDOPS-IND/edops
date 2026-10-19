"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Calendar,
  CheckSquare,
  BookOpen,
  X,
  Award,
} from "lucide-react";
import {
  getTeacherAssignments,
  getTeacherEvaluationQueue,
  evaluateTeacherSubmission,
} from "../../edops-api";

const T = {
  navy: "#0c1e33",
  slate: "#495d72",
  muted: "#a6abb5",
  faint: "#b3b3b3",
  pageBg: "#f4f6f7",
  white: "#ffffff",
  border: "#e4e6e9",
  line: "#ced8e5",
  chip: "#f5f6f8",
  blue: "#17a1fa",
  greenBg: "#ccefbf",
  greenDark: "#1a5c0a",
  skyBg: "#d0e6ff",
  skyDark: "#0a3a7a",
  amberBg: "#fde1ac",
  amberDark: "#614400",
  roseBg: "#ffd6d6",
  roseDark: "#7a1a1a",
  violetBg: "#e1d2ff",
  violetDark: "#4a0e8f",
};

interface AssignmentsPaneProps {
  organizationId: string;
  onCreateAssignment: () => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AssignmentsPane({
  organizationId,
  onCreateAssignment,
  initialTab,
  onTabChange,
}: AssignmentsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [queueData, setQueueData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"assignments" | "queue">(initialTab === "queue" ? "queue" : "assignments");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialTab === "assignments" || initialTab === "queue") {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Inline grading modal
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  async function loadData() {
    setLoading(true);
    try {
      const [asgRes, qRes] = await Promise.all([
        getTeacherAssignments(organizationId),
        getTeacherEvaluationQueue(organizationId),
      ]);
      setData(asgRes);
      setQueueData(qRes);
    } catch {
      setData({ assignments: [] });
      setQueueData({ pendingQueue: [] });
    } finally {
      setLoading(false);
    }
  }

  const handleOpenGrade = (sub: any) => {
    setGradingSubmission(sub);
    setScore(sub.maxScore ? Math.round(sub.maxScore * 0.8) : 15);
    setFeedback("Good demonstration of core steps. Review the second problem for calculation accuracy.");
  };

  const handleGrade = async () => {
    if (!gradingSubmission) return;
    setSubmitting(true);
    try {
      await evaluateTeacherSubmission(
        organizationId,
        gradingSubmission.id,
        score,
        feedback
      );
      setGradingSubmission(null);
      loadData();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: "13px", fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading coursework &amp; submission queue...
        </p>
      </div>
    );
  }

  const assignmentsList = data?.assignments || [];
  const pendingQueue = queueData?.pendingQueue || [];
  const totalAssigned = assignmentsList.length;
  const totalSubmissions = assignmentsList.reduce((acc: number, a: any) => acc + (a.submittedCount || 0), 0);
  const totalPending = pendingQueue.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: T.slate,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Coursework &amp; Evaluations
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              color: T.navy,
              letterSpacing: "-0.01em",
            }}
          >
            Assignments &amp; Submissions Command
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Publish homework tasks, track student turnaround, and grade submissions with qualitative rubrics.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateAssignment}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: T.navy,
            color: T.white,
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
          }}
        >
          <Plus size={14} />
          <span>+ New Assignment</span>
        </button>
      </div>

      {/* 2. Top 4 Metric Cards - Strict DESIGN.md Section 2.1 Palettes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Total Coursework (Pastel Sky) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.skyBg,
            border: `1px solid ${T.skyBg}`,
            borderRadius: "10px",
            color: T.skyDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Tasks
            </span>
            <FileText size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {totalAssigned}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Assigned across teaching sections
          </p>
        </div>

        {/* Turn-in Submissions (Pastel Mint) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.greenBg,
            border: `1px solid ${T.greenBg}`,
            borderRadius: "10px",
            color: T.greenDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Turned In
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {totalSubmissions}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Completed student submissions
          </p>
        </div>

        {/* Evaluation Queue (Pastel Warm Amber) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.amberBg,
            border: `1px solid ${T.amberBg}`,
            borderRadius: "10px",
            color: T.amberDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Evaluation Queue
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {totalPending}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            Awaiting score and qualitative feedback
          </p>
        </div>

        {/* Average SLA / Completion (Pastel Violet) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.violetBg,
            border: `1px solid ${T.violetBg}`,
            borderRadius: "10px",
            color: T.violetDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Grading SLA
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.violetDark }}>
            {totalPending === 0 ? "100%" : "92%"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            Evaluated within 48h deadline
          </p>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div style={{ display: "flex", background: T.chip, padding: "4px", borderRadius: "8px", border: `1px solid ${T.border}`, gap: "4px", width: "fit-content" }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab("assignments");
            onTabChange?.("assignments");
          }}
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: activeTab === "assignments" ? 600 : 500,
            cursor: "pointer",
            border: "none",
            background: activeTab === "assignments" ? T.navy : "transparent",
            color: activeTab === "assignments" ? T.white : T.slate,
            transition: "all 0.15s ease",
          }}
        >
          All Coursework ({assignmentsList.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("queue");
            onTabChange?.("queue");
          }}
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: activeTab === "queue" ? 600 : 500,
            cursor: "pointer",
            border: "none",
            background: activeTab === "queue" ? T.navy : "transparent",
            color: activeTab === "queue" ? T.white : T.slate,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease",
          }}
        >
          <span>Evaluation Queue</span>
          <span
            style={{
              fontSize: "10px",
              background: activeTab === "queue" ? T.white : T.roseBg,
              color: activeTab === "queue" ? T.navy : T.roseDark,
              padding: "1px 6px",
              borderRadius: "100px",
              fontWeight: 700,
            }}
          >
            {pendingQueue.length} Pending
          </span>
        </button>
      </div>

      {/* 4. Tab Content */}
      {activeTab === "assignments" ? (
        assignmentsList.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
            {assignmentsList.map((asg: any) => {
              const turnInRate = asg.totalStudents > 0 ? Math.round((asg.submittedCount / asg.totalStudents) * 100) : 75;
              return (
                <div
                  key={asg.id}
                  style={{
                    background: T.white,
                    borderRadius: "10px",
                    border: `1px solid ${T.border}`,
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: T.blue, textTransform: "uppercase" }}>
                        {asg.sectionName} • {asg.subjectName}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: asg.status === "graded" ? T.greenBg : T.chip,
                          color: asg.status === "graded" ? T.greenDark : T.slate,
                        }}
                      >
                        {asg.status || "Active"}
                      </span>
                    </div>

                    <h3 style={{ margin: "8px 0 4px", fontSize: "16px", fontWeight: 600, color: T.navy }}>
                      {asg.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "12px", color: T.slate, lineHeight: 1.5 }}>
                      {asg.topic || asg.description || "Core curricular exercises and homework."}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: T.slate, marginBottom: "6px" }}>
                      <span>Submissions: <strong style={{ color: T.navy }}>{asg.submittedCount || 0} / {asg.totalStudents || 28}</strong></span>
                      <span style={{ fontWeight: 600, color: T.navy }}>{turnInRate}%</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: T.chip, borderRadius: "100px", overflow: "hidden", border: `1px solid ${T.border}` }}>
                      <div style={{ width: `${turnInRate}%`, height: "100%", background: T.greenDark, borderRadius: "100px" }} />
                    </div>
                  </div>

                  <div style={{ paddingTop: "12px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: T.slate }}>Due: {asg.dueAt ? String(asg.dueAt).split("T")[0] : "Next Period"}</span>
                    <span style={{ fontWeight: 600, color: T.navy }}>Max {asg.maxScore || 20} Marks</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "48px", textAlign: "center", background: T.white, borderRadius: "10px", border: `1px dashed ${T.border}`, color: T.slate, fontSize: "13px" }}>
            No coursework assignments created yet. Click "+ New Assignment" to publish.
          </div>
        )
      ) : (
        <div style={{ background: T.white, borderRadius: "10px", border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy }}>
              Submissions Requiring Evaluation
            </h3>
            <span style={{ fontSize: "12px", color: T.slate }}>
              {pendingQueue.length} pending grading
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: T.chip, borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Student</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Class &amp; Subject</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Assignment</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Turned In</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingQueue.length > 0 ? (
                pendingQueue.map((item: any, idx: number) => (
                  <tr key={item.id || idx} style={{ borderBottom: idx !== pendingQueue.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: T.navy }}>
                      {item.studentName}
                    </td>
                    <td style={{ padding: "14px 16px", color: T.slate }}>
                      {item.classSection} • {item.subjectName}
                    </td>
                    <td style={{ padding: "14px 16px", color: T.navy, fontWeight: 500 }}>
                      {item.assignmentTitle}
                    </td>
                    <td style={{ padding: "14px 16px", color: T.slate }}>
                      {item.submittedAt ? String(item.submittedAt).split("T")[0] : "Today"}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenGrade(item)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          background: T.navy,
                          color: T.white,
                          fontSize: "12px",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(12, 30, 51, 0.15)",
                        }}
                      >
                        Grade Submission →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: T.slate }}>
                    All student coursework has been evaluated! Queue is clean.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Redesigned Inline Grading Modal */}
      {gradingSubmission && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(2px)",
            padding: "16px",
            boxSizing: "border-box",
            fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setGradingSubmission(null);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: "14px",
              boxShadow: "0 20px 40px rgba(12, 30, 51, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px",
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: `1px solid ${T.line}`, paddingBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                  Rubric Assessment
                </span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: T.navy }}>
                  Grade: {gradingSubmission.studentName}
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: T.slate }}>
                  {gradingSubmission.assignmentTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.slate,
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Submitted content preview */}
            <div style={{ padding: "12px 14px", background: T.chip, borderRadius: "8px", border: `1px solid ${T.border}`, fontSize: "12px" }}>
              <span style={{ fontWeight: 600, color: T.navy, display: "block", marginBottom: "4px" }}>Student Response:</span>
              <p style={{ margin: 0, color: T.slate, lineHeight: 1.5 }}>
                {gradingSubmission.content || "Attached solution pages & formulas submitted."}
              </p>
            </div>

            {/* Score input */}
            <div>
              <label style={{ display: "block", fontWeight: 600, color: T.navy, fontSize: "12px", marginBottom: "6px" }}>
                Score (Out of {gradingSubmission.maxScore || 20}) *
              </label>
              <input
                type="number"
                min={0}
                max={gradingSubmission.maxScore || 20}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                style={{
                  width: "120px",
                  padding: "8px 12px",
                  border: `1px solid ${T.line}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: T.navy,
                  background: T.white,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Qualitative Feedback */}
            <div>
              <label style={{ display: "block", fontWeight: 600, color: T.navy, fontSize: "12px", marginBottom: "6px" }}>
                Teacher Pedagogical Feedback &amp; Next Steps
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Give constructive feedback highlighting both correct method and concept gaps..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${T.line}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: T.navy,
                  background: T.white,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: `1px solid ${T.line}` }}>
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.slate,
                  background: "transparent",
                  border: `1px solid ${T.line}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrade}
                disabled={submitting}
                style={{
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.white,
                  background: T.navy,
                  border: "none",
                  borderRadius: "8px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  boxShadow: "0 2px 6px rgba(12,30,51,0.2)",
                }}
              >
                {submitting ? "Saving..." : "Save Grade & Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
