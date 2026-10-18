"use client";

import React, { useState } from "react";
import { ClassPerformanceItem, SubjectPerformanceItem, CurriculumNodeItem, LessonPlanItem } from "../types";
import { Search, Layers, BookOpen, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare, Award, BookMarked, GraduationCap } from "lucide-react";
import { api, getPrincipalAcademics } from "../../edops-api";

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
  const [loadError, setLoadError] = useState(false);
  const [subTab, setSubTab] = useState<"classes" | "subjects" | "curriculum" | "lesson_plans" | "competencies">(
    (initialTab as any) || "classes"
  );
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (!organizationId) return;
    setLoadError(false);
    getPrincipalAcademics(organizationId)
      .then((data) => setLiveData(data))
      .catch(() => setLoadError(true));
  }, [organizationId]);

  const classList = liveData?.classes && liveData.classes.length > 0 ? liveData.classes : classes;
  const subjectList = liveData?.subjects && liveData.subjects.length > 0 ? liveData.subjects : subjects;
  const nodeList = liveData?.curriculumNodes ?? curriculumNodes;
  const planList = liveData?.lessonPlans ?? lessonPlans;
  const percent = (value: number | null) => (value == null ? "—" : `${value}%`);

  // KPI calculations
  const totalClasses = classList.length;
  const avgScore = totalClasses > 0 ? Math.round(classList.reduce((acc: number, c: any) => acc + (c.averageScore || 0), 0) / totalClasses) : 76;
  const avgPassRate = totalClasses > 0 ? Math.round(classList.reduce((acc: number, c: any) => acc + (c.passRate || 0), 0) / totalClasses) : 92;
  const totalChapters = nodeList.length;

  const handleSendFeedback = async (id: string, status: string) => {
    const text = feedbackInput[id] || "Approved by Principal.";
    try {
      if (onReviewLessonPlan) await onReviewLessonPlan(id, status, text);
      else
        await api(`/organizations/${organizationId}/principal/academics/lesson-plans/${id}/feedback`, {
          method: "POST",
          body: { status, principalFeedback: text },
        });
      setLiveData(await getPrincipalAcademics(organizationId!));
    } catch {
      alert("Could not update the lesson plan. Please try again.");
    }
  };

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
              Active Classes
            </span>
            <Layers size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{totalClasses}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              Sections Tracked Live
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
              School Academic Avg
            </span>
            <Award size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{avgScore}%</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Term Assessment Average
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
              Overall Pass Rate
            </span>
            <CheckCircle2 size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{avgPassRate}%</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Students Meeting Benchmark
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
              Curriculum Units
            </span>
            <BookMarked size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>{totalChapters}</div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              Syllabus Units in Scope
            </div>
          </div>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            color: "#991b1b",
            fontSize: "13px",
          }}
        >
          Could not load academic live data. Please retry.
        </div>
      )}

      {/* Sub Navigation Strip */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "classes", label: "Classes & Sections" },
          { id: "subjects", label: "Subject Performance" },
          { id: "curriculum", label: "Curriculum & Syllabus Gap Engine" },
          { id: "lesson_plans", label: "Lesson Plans & Principal Feedback" },
          { id: "competencies", label: "Competencies & Learning Outcomes" },
        ].map((t) => {
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isActive ? "#0c1e33" : "#e4e6e9",
                background: isActive ? "#0c1e33" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Classes & Sections Tab */}
      {subTab === "classes" && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
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
              {classList.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No classes or sections found.
                  </td>
                </tr>
              ) : (
                classList.map((c: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>
                      {c.displayName || `${c.className || ""} - ${c.sectionName || ""}`}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{c.studentCount} students</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: c.averageScore < 75 ? "#dc2626" : "#1e293b" }}>
                      {percent(c.averageScore)}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#15803d" }}>{percent(c.passRate)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: c.attendanceRate < 90 ? "#d97706" : "#475569" }}>
                      {percent(c.attendanceRate)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{percent(c.assignmentCompletion)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0c1e33" }}>{percent(c.curriculumCompletion)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: c.trend === "Requires intervention" ? "#fee2e2" : c.trend === "Improving" ? "#dcfce7" : "#f1f5f9",
                          color: c.trend === "Requires intervention" ? "#991b1b" : c.trend === "Improving" ? "#166534" : "#475569",
                        }}
                      >
                        {c.trend || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => onNavigateClass && onNavigateClass(c.id)}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e4e6e9",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#0c1e33",
                          cursor: "pointer",
                        }}
                      >
                        Inspect Class
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Subjects Performance Tab */}
      {subTab === "subjects" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {subjectList.length === 0 ? (
            <div style={{ padding: "24px", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9" }}>
              No subjects found for this school.
            </div>
          ) : (
            subjectList.map((sub: any, idx: number) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "18px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{sub.name}</h4>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      Faculty Lead: <b>{sub.teacher}</b> · Classes: {sub.classes}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: sub.status === "Needs Attention" ? "#fef3c7" : "#dcfce7",
                      color: sub.status === "Needs Attention" ? "#92400e" : "#166534",
                    }}
                  >
                    {sub.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "14px", fontSize: "12px" }}>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>Subject Avg</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", marginTop: "2px" }}>{percent(sub.average)}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>Curriculum</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#0c1e33", marginTop: "2px" }}>{percent(sub.curriculum)}</div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>Syllabus Gap</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: sub.gap < 0 ? "#dc2626" : "#15803d", marginTop: "2px" }}>
                      {sub.gap == null ? "—" : sub.gap > 0 ? `+${sub.gap}%` : `${sub.gap}%`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Curriculum Gap Engine Tab */}
      {subTab === "curriculum" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {nodeList.length === 0 ? (
            <div style={{ padding: "24px", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9" }}>
              No curriculum chapters have been mapped for this school yet.
            </div>
          ) : (
            nodeList.map((node: CurriculumNodeItem, idx: number) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#0c1e33",
                        background: "#f1f5f9",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 600,
                      }}
                    >
                      {node.grade} · {node.subject}
                    </span>
                    <h4 style={{ margin: "6px 0 2px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                      {node.unit} — {node.chapter}
                    </h4>
                  </div>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: node.gap < -5 ? "#fee2e2" : "#dcfce7",
                      color: node.gap < -5 ? "#991b1b" : "#166534",
                    }}
                  >
                    {node.status} (Gap: {percent(node.gap)})
                  </span>
                </div>

                <div style={{ margin: "12px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                    <span>
                      Expected Timeline: <b>Week {node.expectedWeek} ({percent(node.expectedProgress)})</b>
                    </span>
                    <span>
                      Actual Delivered: <b>{node.actualProgress}%</b>
                    </span>
                  </div>
                  <div style={{ height: "6px", width: "100%", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, node.actualProgress)}%`,
                        background: node.gap < -5 ? "#ef4444" : "#10b981",
                      }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "#475569", marginTop: "8px" }}>
                  <b style={{ color: "#1e293b" }}>Mapped Learning Outcome:</b> {node.learningOutcomes.join(" · ")}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Lesson Plans & Principal Review Tab */}
      {subTab === "lesson_plans" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {planList.length === 0 ? (
            <div style={{ padding: "24px", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9" }}>
              No lesson plans have been submitted for review yet.
            </div>
          ) : (
            planList.map((lp: LessonPlanItem, idx: number) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                      {lp.subject} ({lp.classSection}) — {lp.topic}
                    </h4>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      Teacher: <b>{lp.teacherName}</b> · Planned Date: {lp.plannedDate}
                    </span>
                  </div>
                  <span
                    style={{
                      background: lp.status === "Approved" ? "#dcfce7" : "#fef3c7",
                      color: lp.status === "Approved" ? "#166534" : "#92400e",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {lp.status}
                  </span>
                </div>

                <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px", margin: "10px 0" }}>
                  <div>
                    <b style={{ color: "#1e293b" }}>Target Learning Outcome:</b> {lp.learningOutcomes}
                  </div>
                  <div>
                    <b style={{ color: "#1e293b" }}>Teaching Pedagogy:</b> {lp.teachingStrategy}
                  </div>
                  <div>
                    <b style={{ color: "#1e293b" }}>Formative Assessment:</b> {lp.assessmentMethod}
                  </div>
                  {lp.principalFeedback && (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #dcfce7",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        color: "#166534",
                        marginTop: "6px",
                      }}
                    >
                      <b>Principal Review Note:</b> {lp.principalFeedback}
                    </div>
                  )}
                </div>

                {lp.status !== "Approved" && (
                  <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Add Principal feedback or commendation notes..."
                      value={feedbackInput[lp.id] || ""}
                      onChange={(e) => setFeedbackInput({ ...feedbackInput, [lp.id]: e.target.value })}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                    <button
                      onClick={() => handleSendFeedback(lp.id, "Approved")}
                      style={{
                        background: "#0c1e33",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleSendFeedback(lp.id, "Needs Revision")}
                      style={{
                        background: "#fffbeb",
                        color: "#b45309",
                        border: "1px solid #fcd34d",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Request Revision
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. Competencies & Learning Outcomes Tab */}
      {subTab === "competencies" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {nodeList.length === 0 ? (
            <div style={{ padding: "24px", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9" }}>
              No curriculum learning outcomes or competencies have been registered yet.
            </div>
          ) : (
            nodeList.map((node: CurriculumNodeItem) => (
              <div
                key={node.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "18px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#0c1e33",
                    background: "#f1f5f9",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  {node.grade} · {node.subject}
                </span>
                <h4 style={{ margin: "8px 0 6px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                  {node.chapter}
                </h4>
                <div style={{ fontSize: "12px", color: "#475569", marginBottom: "4px" }}>
                  <b style={{ color: "#1e293b" }}>Competencies:</b> {node.competency || "Standard Pedagogical Competency"}
                </div>
                <div style={{ fontSize: "12px", color: "#475569" }}>
                  <b style={{ color: "#1e293b" }}>Learning Outcomes:</b> {node.learningOutcomes.join(" · ") || "Standard CBSE/State curriculum outcomes"}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
