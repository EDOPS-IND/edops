"use client";

import React, { useState } from "react";
import { ClassPerformanceItem, SubjectPerformanceItem, CurriculumNodeItem, LessonPlanItem } from "../types";
import { Search, Layers, BookOpen, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare, Award } from "lucide-react";

export function AcademicsPane({
  classes = [],
  subjects = [],
  curriculumNodes = [],
  lessonPlans = [],
  onReviewLessonPlan,
  onNavigateClass,
  organizationId,
  initialTab,
}: {
  classes?: ClassPerformanceItem[];
  subjects?: SubjectPerformanceItem[];
  curriculumNodes?: CurriculumNodeItem[];
  lessonPlans?: LessonPlanItem[];
  onReviewLessonPlan?: (lessonId: string, status: string, feedback: string) => Promise<void>;
  onNavigateClass?: (classId: string) => void;
  organizationId?: string;
  initialTab?: string;
  onOpenTeacherProfile?: (id: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [subTab, setSubTab] = useState<"classes" | "subjects" | "curriculum" | "lesson_plans" | "competencies">(
    (initialTab as any) || "classes"
  );
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalAcademics }) => {
      getPrincipalAcademics(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const classList = (liveData?.classes && liveData.classes.length > 0) ? liveData.classes : classes;
  const subjectList = (liveData?.subjects && liveData.subjects.length > 0) ? liveData.subjects : subjects;
  const nodeList = (liveData?.curriculumNodes && liveData.curriculumNodes.length > 0) ? liveData.curriculumNodes : curriculumNodes;
  const planList = (liveData?.lessonPlans && liveData.lessonPlans.length > 0) ? liveData.lessonPlans : lessonPlans;


  const handleSendFeedback = async (id: string, status: string) => {
    const text = feedbackInput[id] || "Approved by Principal.";
    await onReviewLessonPlan(id, status, text);
    alert(`Lesson plan marked as ${status}.`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Sub Navigation Strip */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "classes", label: "Classes & Sections" },
          { id: "subjects", label: "Subject Performance" },
          { id: "curriculum", label: "Curriculum & Syllabus Gap Engine" },
          { id: "lesson_plans", label: "Lesson Plans & Principal Feedback" },
          { id: "competencies", label: "Competencies & Learning Outcomes" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: subTab === t.id ? "#064E3B" : "#CBD5E1",
              background: subTab === t.id ? "#064E3B" : "#FFFFFF",
              color: subTab === t.id ? "#F8E7C9" : "#475569",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Classes & Sections Tab */}
      {subTab === "classes" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Class / Section</th>
                <th style={{ padding: "12px 16px" }}>Student Count</th>
                <th style={{ padding: "12px 16px" }}>Average Score</th>
                <th style={{ padding: "12px 16px" }}>Pass Rate</th>
                <th style={{ padding: "12px 16px" }}>Attendance</th>
                <th style={{ padding: "12px 16px" }}>Assignment %</th>
                <th style={{ padding: "12px 16px" }}>Curriculum %</th>
                <th style={{ padding: "12px 16px" }}>Performance Trend</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {classList.map((c: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>
                    {c.displayName || `${c.className || ''} - ${c.sectionName || ''}`}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{c.studentCount} students</td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: c.averageScore < 75 ? "#DC2626" : "#1E293B" }}>
                    {c.averageScore}%
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#15803D" }}>{c.passRate}%</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: c.attendanceRate < 90 ? "#D97706" : "#475569" }}>
                    {c.attendanceRate}%
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{c.assignmentCompletion}%</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#065F46" }}>{c.curriculumCompletion}%</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: c.trend === "Requires intervention" ? "#FEE2E2" : c.trend === "Improving" ? "#DCFCE7" : "#F1F5F9",
                        color: c.trend === "Requires intervention" ? "#991B1B" : c.trend === "Improving" ? "#166534" : "#475569",
                      }}
                    >
                      {c.trend}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => onNavigateClass && onNavigateClass(c.id)}
                      style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", fontWeight: 600, color: "#334155", cursor: "pointer" }}
                    >
                      Inspect Class
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Subjects Performance Tab */}
      {subTab === "subjects" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {subjectList.map((sub: any, idx: number) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>{sub.name}</h4>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Faculty Lead: <b>{sub.teacher}</b> · Classes: {sub.classes}</span>
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: sub.status === "Needs Attention" ? "#FEF3C7" : "#DCFCE7",
                    color: sub.status === "Needs Attention" ? "#92400E" : "#166534",
                  }}
                >
                  {sub.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "12px", fontSize: "12px" }}>
                <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: "6px" }}>
                  <div style={{ color: "#64748B" }}>Subject Average</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#1E293B" }}>{sub.average}%</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: "6px" }}>
                  <div style={{ color: "#64748B" }}>Curriculum Actual</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#065F46" }}>{sub.curriculum}%</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: "6px" }}>
                  <div style={{ color: "#64748B" }}>Syllabus Gap</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: sub.gap < 0 ? "#DC2626" : "#15803D" }}>
                    {sub.gap > 0 ? `+${sub.gap}%` : `${sub.gap}%`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Curriculum Gap Engine Tab */}
      {subTab === "curriculum" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {curriculumNodes.map((node, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#1E40AF", background: "#EFF6FF", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                    {node.grade} · {node.subject}
                  </span>
                  <h4 style={{ margin: "6px 0 2px", fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
                    {node.unit} — {node.chapter}
                  </h4>
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: node.gap < -5 ? "#FEE2E2" : "#DCFCE7",
                    color: node.gap < -5 ? "#991B1B" : "#166534",
                  }}
                >
                  {node.status} (Gap: {node.gap}%)
                </span>
              </div>

              <div style={{ margin: "10px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>
                  <span>Expected Week: <b>Week {node.expectedWeek} ({node.expectedProgress}%)</b></span>
                  <span>Actual Progress: <b>{node.actualProgress}%</b></span>
                </div>
                <div style={{ height: "6px", width: "100%", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${node.actualProgress}%`, background: node.gap < -5 ? "#DC2626" : "#065F46" }} />
                </div>
              </div>

              <div style={{ fontSize: "12px", color: "#475569", marginTop: "8px" }}>
                <b>Mapped Learning Outcome:</b> {node.learningOutcomes.join(" · ")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Lesson Plans & Principal Review Tab */}
      {subTab === "lesson_plans" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {lessonPlans.map((lp, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
                    {lp.subject} ({lp.classSection}) — {lp.topic}
                  </h4>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Teacher: <b>{lp.teacherName}</b> · Planned Date: {lp.plannedDate}</span>
                </div>
                <span style={{ background: lp.status === "Approved" ? "#DCFCE7" : "#FEF3C7", color: lp.status === "Approved" ? "#166534" : "#92400E", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                  {lp.status}
                </span>
              </div>

              <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px", margin: "10px 0" }}>
                <div><b>Target Learning Outcome:</b> {lp.learningOutcomes}</div>
                <div><b>Teaching Pedagogy:</b> {lp.teachingStrategy}</div>
                <div><b>Formative Assessment:</b> {lp.assessmentMethod}</div>
                {lp.principalFeedback && (
                  <div style={{ background: "#F0FDF4", padding: "8px", borderRadius: "6px", color: "#166534", marginTop: "4px" }}>
                    <b>Principal Feedback:</b> {lp.principalFeedback}
                  </div>
                )}
              </div>

              {lp.status !== "Approved" && (
                <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Add Principal feedback notes..."
                    value={feedbackInput[lp.id] || ""}
                    onChange={(e) => setFeedbackInput({ ...feedbackInput, [lp.id]: e.target.value })}
                    style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                  <button
                    onClick={() => handleSendFeedback(lp.id, "Approved")}
                    style={{ background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleSendFeedback(lp.id, "Needs Revision")}
                    style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FCD34D", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Request Revision
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. Competencies & Learning Outcomes Tab */}
      {subTab === "competencies" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {[
            { dim: "Conceptual Understanding", score: 86.4, desc: "Grasp of fundamental mathematical and scientific axioms without rote reliance." },
            { dim: "Application of Knowledge", score: 82.0, desc: "Translating theoretical concepts to laboratory apparatus and real-world problems." },
            { dim: "Critical Problem Solving", score: 79.5, desc: "Formulating multi-step solutions in non-standard unfamiliar scenarios." },
            { dim: "Communication & Expression", score: 88.0, desc: "Structured written clarity in language and scientific notation." },
          ].map((c, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{c.dim}</h4>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#065F46" }}>{c.score}%</span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>{c.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
