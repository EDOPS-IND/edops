"use client";

import React, { useState } from "react";
import { ClassPerformanceItem, SubjectPerformanceItem, CurriculumNodeItem, LessonPlanItem } from "../types";
import { Search, Layers, BookOpen, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare, Award, BookMarked, GraduationCap } from "lucide-react";
import { api, getPrincipalAcademics } from "../../edops-api";
import { ClassSectionManager } from "../../components/class-command-center";

export function AcademicsPane({
  classes = [],
  subjects = [],
  curriculumNodes = [],
  lessonPlans = [],
  onReviewLessonPlan,
  onNavigateClass,
  organizationId,
  initialTab,
  onOpenTeacherProfile,
  onOpenStudent360,
  onTabChange,
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
  onOpenStudent360?: (studentId: string) => void;
  onTabChange?: (tab: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);
  const [subTab, setSubTab] = useState<"classes" | "subjects" | "curriculum" | "lesson_plans" | "competencies">(
    (initialTab as any) || "classes"
  );
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedCurriculumSubject, setSelectedCurriculumSubject] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setSubTab(initialTab as any);
    }
  }, [initialTab]);

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
  const scoredClasses = classList.filter((c: any) => c.averageScore != null);
  const avgScore = scoredClasses.length > 0 ? Math.round(scoredClasses.reduce((acc: number, c: any) => acc + Number(c.averageScore), 0) / scoredClasses.length) : null;
  const passRateClasses = classList.filter((c: any) => c.passRate != null);
  const avgPassRate = passRateClasses.length > 0 ? Math.round(passRateClasses.reduce((acc: number, c: any) => acc + Number(c.passRate), 0) / passRateClasses.length) : null;
  const totalChapters = nodeList.length;

  const availableGrades = React.useMemo(() => {
    const set = new Set<string>();
    classList.forEach((c: any) => {
      const g = c.className || c.grade || c.displayName;
      if (g) set.add(g.replace(/-.*$/, '').trim());
    });
    nodeList.forEach((n: any) => {
      if (n.grade) set.add(n.grade);
    });
    return Array.from(set);
  }, [classList, nodeList]);

  React.useEffect(() => {
    if (availableGrades.length > 0 && !selectedGrade) {
      setSelectedGrade(availableGrades[0]);
    }
  }, [availableGrades, selectedGrade]);

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
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>
              {avgScore != null ? `${avgScore}%` : "—"}
            </div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              {avgScore != null ? "Term Assessment Average" : "No assessment scores recorded yet"}
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
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>
              {avgPassRate != null ? `${avgPassRate}%` : "—"}
            </div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              {avgPassRate != null ? "Students Meeting Benchmark" : "Awaiting term results"}
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
              onClick={() => {
                setSubTab(t.id as any);
                onTabChange?.(t.id);
              }}
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
        <ClassSectionManager
          organizationId={organizationId || ""}
          role="principal"
          sections={classList}
          onRefresh={() => {
            if (organizationId) {
              getPrincipalAcademics(organizationId).then((data) => setLiveData(data));
            }
          }}
          onOpenStudent={(studentId) => {
            if (onOpenStudent360) onOpenStudent360(studentId);
          }}
        />
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
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Class Selector Bar */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "12px", overflowX: "auto" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33", whiteSpace: "nowrap" }}>
              Filter Class:
            </span>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", flex: 1 }}>
              {availableGrades.length === 0 ? (
                <span style={{ fontSize: "12px", color: "#64748b" }}>No classes mapped yet.</span>
              ) : (
                availableGrades.map((g) => {
                  const isSel = selectedGrade === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setSelectedGrade(g);
                        setSelectedCurriculumSubject(null);
                      }}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: isSel ? "2px solid #0c1e33" : "1px solid #e4e6e9",
                        background: isSel ? "#0c1e33" : "#f8fafc",
                        color: isSel ? "#ffffff" : "#0c1e33",
                        fontWeight: isSel ? 700 : 500,
                        fontSize: "12px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {g}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* View Mode A: Subject Grid Cards */}
          {!selectedCurriculumSubject ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0c1e33" }}>
                  Curriculum Subjects for {selectedGrade || "All Classes"}
                </span>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                  Click any subject card to inspect chapter-wise pacing
                </span>
              </div>

              {subjectList.length === 0 && nodeList.length === 0 ? (
                <div style={{ padding: "32px", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9", textAlign: "center" }}>
                  No curriculum modules found for this school.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                  {/* Derive subjects for selectedGrade */}
                  {(() => {
                    // Combine unique subjects from subjectList and nodeList for this grade
                    const subjectNames = Array.from(new Set([
                      ...subjectList.map((s: any) => s.name),
                      ...nodeList.filter((n: any) => !selectedGrade || n.grade === selectedGrade || n.grade === `Class ${selectedGrade}`).map((n: any) => n.subject)
                    ]));

                    return subjectNames.map((subName) => {
                      const gradeNodes = nodeList.filter(
                        (n: any) =>
                          (!selectedGrade || n.grade === selectedGrade || n.grade === `Class ${selectedGrade}`) &&
                          n.subject?.toLowerCase() === subName.toLowerCase()
                      );
                      const totalCh = gradeNodes.length;
                      const avgPct = totalCh > 0
                        ? Math.round(gradeNodes.reduce((acc: number, n: any) => acc + (n.actualProgress || 0), 0) / totalCh)
                        : 0;
                      const behindCount = gradeNodes.filter((n: any) => n.gap < -5).length;

                      return (
                        <div
                          key={subName}
                          onClick={() => setSelectedCurriculumSubject(subName)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e4e6e9",
                            borderRadius: "12px",
                            padding: "18px 20px",
                            cursor: "pointer",
                            transition: "all 0.18s ease",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#0c1e33";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 6px 16px rgba(12,30,51,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e4e6e9";
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <span style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                                {selectedGrade || "All Grades"}
                              </span>
                              <h4 style={{ margin: "8px 0 2px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                                {subName}
                              </h4>
                            </div>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: behindCount > 0 ? "#fee2e2" : avgPct >= 100 ? "#dcfce7" : "#e0f2fe",
                                color: behindCount > 0 ? "#991b1b" : avgPct >= 100 ? "#166534" : "#0284c7",
                              }}
                            >
                              {behindCount > 0 ? `${behindCount} Delayed` : avgPct >= 100 ? "Completed" : "On Track"}
                            </span>
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                              <span style={{ color: "#64748b" }}>{totalCh} Chapters Tracked</span>
                              <span style={{ fontWeight: 700, color: "#0c1e33" }}>{avgPct}% Complete</span>
                            </div>
                            <div style={{ height: "6px", width: "100%", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                              <div
                                style={{
                                  height: "100%",
                                  width: `${avgPct}%`,
                                  background: avgPct >= 100 ? "#10b981" : behindCount > 0 ? "#f59e0b" : "#0c1e33",
                                  borderRadius: "3px",
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ paddingTop: "10px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              {totalCh === 0 ? "No chapters mapped" : "Audit Timeline & Gaps"}
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0c1e33" }}>
                              Inspect Details →
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* View Mode B: Detailed Chapters for Selected Subject */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "14px 18px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0c1e33" }}>
                    {selectedGrade} — {selectedCurriculumSubject} Syllabus Audit
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Chapter-wise delivery timeline, pacing gap, and learning outcome tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCurriculumSubject(null)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e4e6e9",
                    background: "#f8fafc",
                    color: "#0c1e33",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Subject Grid
                </button>
              </div>

              {(() => {
                const filteredNodes = nodeList.filter(
                  (n: any) =>
                    (!selectedGrade || n.grade === selectedGrade || n.grade === `Class ${selectedGrade}`) &&
                    n.subject?.toLowerCase() === selectedCurriculumSubject.toLowerCase()
                );

                if (filteredNodes.length === 0) {
                  return (
                    <div style={{ padding: "28px", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9", textAlign: "center" }}>
                      No chapters mapped for {selectedCurriculumSubject} in {selectedGrade}. Add chapters in School Admin.
                    </div>
                  );
                }

                return filteredNodes.map((node: CurriculumNodeItem, idx: number) => (
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
                        <span style={{ fontSize: "11px", color: "#0c1e33", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                          {node.grade} · {node.subject} · {node.unit}
                        </span>
                        <h4 style={{ margin: "6px 0 2px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                          {node.chapter}
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

                    {node.learningOutcomes && node.learningOutcomes.length > 0 && (
                      <div style={{ fontSize: "12px", color: "#475569", marginTop: "8px" }}>
                        <b style={{ color: "#1e293b" }}>Mapped Learning Outcome:</b> {node.learningOutcomes.join(" · ")}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
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
