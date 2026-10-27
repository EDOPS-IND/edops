"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ClassPerformanceItem, SubjectPerformanceItem, CurriculumNodeItem, LessonPlanItem } from "../types";
import {
  Search,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Award,
  BookMarked,
  GraduationCap,
  Plus,
  Clock,
  Sparkles,
  Users,
  ChevronRight,
  Filter,
  X,
  FileCheck2,
} from "lucide-react";
import { api, getPrincipalAcademics } from "../../edops-api";
import { ClassSectionManager } from "../../components/class-command-center";
import { SubjectPerformanceDrawer } from "./subject-performance-drawer";

/* -------------------------------------------------------------------------- */
/* SKELETON LOADERS & EMPTY STATES                                            */
/* -------------------------------------------------------------------------- */

function KpiSkeletonGrid() {
  const cards = [
    { bg: "#E0D3FF" },
    { bg: "#D0EDC0" },
    { bg: "#BCE6F3" },
    { bg: "#FADAC9" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "164px",
            padding: "20px",
            gap: "12px",
            background: c.bg,
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "110px", height: "12px", borderRadius: "4px" }} />
            <div className="edops-skeleton-kpi" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
          </div>
          <div className="edops-skeleton-kpi" style={{ width: "75px", height: "36px", borderRadius: "6px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "140px", height: "10px", borderRadius: "4px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div className="edops-skeleton-kpi" style={{ width: "55px", height: "10px", borderRadius: "4px" }} />
              <div className="edops-skeleton-kpi" style={{ width: "14px", height: "14px", borderRadius: "3px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubjectGridSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "16px",
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E0E5EB",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "60%" }}>
              <div className="edops-skeleton" style={{ height: "14px", width: "50px" }} />
              <div className="edops-skeleton" style={{ height: "18px", width: "120px" }} />
              <div className="edops-skeleton" style={{ height: "12px", width: "70px" }} />
            </div>
            <div className="edops-skeleton" style={{ width: "38px", height: "38px", borderRadius: "8px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="edops-skeleton" style={{ height: "12px", width: "100%" }} />
            <div className="edops-skeleton" style={{ height: "6px", width: "100%", borderRadius: "4px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #E0E5EB" }}>
            <div className="edops-skeleton" style={{ height: "20px", width: "60px" }} />
            <div className="edops-skeleton" style={{ height: "24px", width: "90px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  illustration = "/bee.png",
  title,
  description,
  actionLabel,
  onAction,
}: {
  illustration?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
        background: "#FFFFFF",
        borderRadius: "10px",
        border: "1px solid #E0E5EB",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <img
        src={illustration}
        alt=""
        style={{
          width: illustration === "/noresult.png" ? "120px" : "96px",
          height: "auto",
          maxHeight: "100px",
          objectFit: "contain",
          marginBottom: "16px",
          opacity: 0.95,
        }}
      />
      <b style={{ fontSize: "15px", fontWeight: 700, color: "#0C1E33", marginBottom: "6px" }}>
        {title}
      </b>
      <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B", maxWidth: "440px", lineHeight: 1.55 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: "16px",
            padding: "8px 18px",
            borderRadius: "6px",
            background: "#0C1E33",
            color: "#FFFFFF",
            border: "none",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={14} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [subTab, setSubTab] = useState<"classes" | "subjects" | "curriculum" | "lesson_plans" | "competencies">(
    (initialTab as any) || "classes"
  );
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedCurriculumSubject, setSelectedCurriculumSubject] = useState<string | null>(null);
  const [selectedSubjectForDrawer, setSelectedSubjectForDrawer] = useState<SubjectPerformanceItem | null>(null);

  useEffect(() => {
    if (initialTab) {
      setSubTab(initialTab as any);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    getPrincipalAcademics(organizationId)
      .then((data) => setLiveData(data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [organizationId]);

  const classList = liveData?.classes && liveData.classes.length > 0 ? liveData.classes : classes;
  const subjectList = liveData?.subjects && liveData.subjects.length > 0 ? liveData.subjects : subjects;
  const nodeList = liveData?.curriculumNodes ?? curriculumNodes;
  const planList = liveData?.lessonPlans ?? lessonPlans;
  const percent = (value: number | null) => (value == null ? "—" : `${value}%`);

  // KPI calculations
  const totalClasses = classList.length;
  const scoredClasses = classList.filter((c: any) => c.averageScore != null);
  const avgScore =
    scoredClasses.length > 0
      ? Math.round(scoredClasses.reduce((acc: number, c: any) => acc + Number(c.averageScore), 0) / scoredClasses.length)
      : null;
  const passRateClasses = classList.filter((c: any) => c.passRate != null);
  const avgPassRate =
    passRateClasses.length > 0
      ? Math.round(passRateClasses.reduce((acc: number, c: any) => acc + Number(c.passRate), 0) / passRateClasses.length)
      : null;
  const totalChapters = nodeList.length;

  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    classList.forEach((c: any) => {
      const g = c.className || c.grade || c.displayName;
      if (g) set.add(g.replace(/-.*$/, "").trim());
    });
    nodeList.forEach((n: any) => {
      if (n.grade) set.add(n.grade);
    });
    return Array.from(set);
  }, [classList, nodeList]);

  useEffect(() => {
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
      if (organizationId) {
        setLiveData(await getPrincipalAcademics(organizationId));
      }
    } catch {
      alert("Could not update the lesson plan. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 164px height matching School Admin) */}
      {loading ? (
        <KpiSkeletonGrid />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            width: "100%",
          }}
        >
          {/* Card 1: Active Classes (Pastel Violet) */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#E0D3FF",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#51249A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ACTIVE CLASSES
              </span>
              <Layers size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {totalClasses > 0 ? totalClasses : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                Sections Tracked Live
              </span>
              <div
                onClick={() => setSubTab("classes")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                  Classes
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#51249A" }} />
              </div>
            </div>
          </div>

          {/* Card 2: Academic Average (Pastel Mint Green) */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#D0EDC0",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#305E26", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ACADEMIC AVERAGE
              </span>
              <Award size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {avgScore != null ? `${avgScore}%` : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                {avgScore != null ? "Institutional Assessment Average" : "Awaiting assessments"}
              </span>
              <div
                onClick={() => setSubTab("subjects")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                  Subjects
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#305E26" }} />
              </div>
            </div>
          </div>

          {/* Card 3: Overall Pass Rate (Pastel Sky Blue) */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#BCE6F3",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#265F79", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                OVERALL PASS RATE
              </span>
              <CheckCircle2 size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {avgPassRate != null ? `${avgPassRate}%` : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                {avgPassRate != null ? "Benchmark Progression" : "Awaiting term results"}
              </span>
              <div
                onClick={() => setSubTab("curriculum")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                  Curriculum
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
              </div>
            </div>
          </div>

          {/* Card 4: Curriculum Units (Pastel Warm Peach) */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#FADAC9",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#82401E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                CURRICULUM UNITS
              </span>
              <BookOpen size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {totalChapters > 0 ? totalChapters : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                Syllabus Chapters in Scope
              </span>
              <div
                onClick={() => setSubTab("lesson_plans")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                  Lesson Plans
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#82401E" }} />
              </div>
            </div>
          </div>
        </div>
      )}

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
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%" }}>
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
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                height: "34px",
                padding: "0 16px",
                borderRadius: "8px",
                border: isActive ? "1px solid #0C1E33" : "1px solid #E2E8F0",
                background: isActive ? "#0C1E33" : "#F4F6F8",
                color: isActive ? "#FFFFFF" : "#5A6B7D",
                fontSize: "12px",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                boxShadow: isActive ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#E9EEF4";
                  e.currentTarget.style.color = "#0C1E33";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#F4F6F8";
                  e.currentTarget.style.color = "#5A6B7D";
                }
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
          programs={liveData?.programs || []}
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
        <>
          {loading ? (
            <SubjectGridSkeleton />
          ) : subjectList.length === 0 ? (
            <EmptyState
              illustration="/bee.png"
              title="No Academic Subjects Found"
              description="No subjects have been configured for this institution yet. Create subjects in the School Admin portal to begin tracking performance."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {subjectList.map((sub: any, idx: number) => {
                const secCount = sub.sectionCount ?? (sub.sections?.length || 0);
                const facultyCount = sub.teacherCount ?? (sub.teacher && sub.teacher !== "Unassigned" ? sub.teacher.split(",").length : 0);

                return (
                  <div
                    key={sub.id || idx}
                    onClick={() => setSelectedSubjectForDrawer(sub)}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E0E5EB",
                      borderRadius: "10px",
                      padding: "20px",
                      boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)",
                      cursor: "pointer",
                      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#94A3B8";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(12, 30, 51, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E0E5EB";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(12, 30, 51, 0.04)";
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>{sub.name}</h4>
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: "4px",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                background: sub.isElective ? "#F3E8FF" : "#EFF6FF",
                                color: sub.isElective ? "#7E22CE" : "#1D4ED8",
                              }}
                            >
                              {sub.isElective ? "Elective" : "Core"}
                            </span>
                          </div>
                          <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "3px" }}>
                            {secCount} Sections · {facultyCount} Faculty Assigned
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: sub.status === "Needs Attention" ? "#FEF3C7" : sub.status === "Unassigned" ? "#F1F5F9" : "#DCFCE7",
                            color: sub.status === "Needs Attention" ? "#92400E" : sub.status === "Unassigned" ? "#64748B" : "#166534",
                            border: sub.status === "Unassigned" ? "1px solid #E2E8F0" : "none",
                          }}
                        >
                          {sub.status}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "14px", fontSize: "12px" }}>
                        <div style={{ background: "#F8FAFC", padding: "10px", borderRadius: "6px", border: "1px solid #F1F5F9" }}>
                          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", fontWeight: 600 }}>Avg Score</div>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", marginTop: "3px" }}>{percent(sub.average)}</div>
                        </div>
                        <div style={{ background: "#F8FAFC", padding: "10px", borderRadius: "6px", border: "1px solid #F1F5F9" }}>
                          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", fontWeight: 600 }}>Turn-in</div>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", marginTop: "3px" }}>{percent(sub.assignmentRate)}</div>
                        </div>
                        <div style={{ background: "#F8FAFC", padding: "10px", borderRadius: "6px", border: "1px solid #F1F5F9" }}>
                          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", fontWeight: 600 }}>Curriculum</div>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", marginTop: "3px" }}>{percent(sub.curriculum)}</div>
                        </div>
                        <div style={{ background: "#F8FAFC", padding: "10px", borderRadius: "6px", border: "1px solid #F1F5F9" }}>
                          <div style={{ color: "#64748B", fontSize: "10px", textTransform: "uppercase", fontWeight: 600 }}>Syllabus Gap</div>
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: sub.gap == null ? "#64748B" : sub.gap < -5 ? "#DC2626" : sub.gap < 0 ? "#0C1E33" : "#15803D",
                              marginTop: "3px",
                            }}
                          >
                            {sub.gap == null ? "—" : sub.gap > 0 ? `+${sub.gap}%` : `${sub.gap}%`}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "14px",
                        paddingTop: "12px",
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "12px",
                        color: "#2563EB",
                        fontWeight: 600,
                      }}
                    >
                      <span>Inspect class performance &amp; teachers</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 3. Curriculum Gap Engine Tab */}
      {subTab === "curriculum" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Class Selector Bar */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "12px", overflowX: "auto" }}>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33", whiteSpace: "nowrap" }}>
              Filter Class:
            </span>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", flex: 1 }}>
              {availableGrades.length === 0 ? (
                <span style={{ fontSize: "12px", color: "#64748B" }}>No classes mapped yet.</span>
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
                        border: isSel ? "1px solid #0C1E33" : "1px solid #E2E8F0",
                        background: isSel ? "#0C1E33" : "#F4F6F8",
                        color: isSel ? "#FFFFFF" : "#5A6B7D",
                        fontWeight: isSel ? 600 : 500,
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
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#0C1E33" }}>
                  Curriculum Subjects for {selectedGrade || "All Classes"}
                </span>
                <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                  Click any subject card to inspect chapter-wise pacing
                </span>
              </div>

              {subjectList.length === 0 && nodeList.length === 0 ? (
                <EmptyState
                  illustration="/bee.png"
                  title="No Curriculum Modules Found"
                  description="Curriculum modules and chapters have not been registered yet. Add syllabus chapters in the Academics tab."
                />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                  {(() => {
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
                            background: "#FFFFFF",
                            border: "1px solid #E0E5EB",
                            borderRadius: "10px",
                            padding: "18px 20px",
                            cursor: "pointer",
                            transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                            boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#94A3B8";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(12, 30, 51, 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#E0E5EB";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(12, 30, 51, 0.03)";
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <span style={{ fontSize: "10.5px", color: "#586C82", background: "#F1F5F9", padding: "2px 7px", borderRadius: "4px", fontWeight: 600 }}>
                                {selectedGrade || "All Grades"}
                              </span>
                              <h4 style={{ margin: "8px 0 2px", fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>
                                {subName}
                              </h4>
                            </div>
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: "100px",
                                fontSize: "10.5px",
                                fontWeight: 600,
                                background: behindCount > 0 ? "#FEE2E2" : avgPct >= 100 ? "#DCFCE7" : "#E0F2FE",
                                color: behindCount > 0 ? "#991B1B" : avgPct >= 100 ? "#166534" : "#0284C7",
                              }}
                            >
                              {behindCount > 0 ? `${behindCount} Delayed` : avgPct >= 100 ? "Completed" : "On Track"}
                            </span>
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                              <span style={{ color: "#64748B" }}>{totalCh} Chapters Tracked</span>
                              <span style={{ fontWeight: 600, color: "#0C1E33" }}>{avgPct}% Complete</span>
                            </div>
                            <div style={{ height: "6px", width: "100%", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                              <div
                                style={{
                                  height: "100%",
                                  width: `${avgPct}%`,
                                  background: avgPct >= 100 ? "#10B981" : behindCount > 0 ? "#F59E0B" : "#0C1E33",
                                  borderRadius: "3px",
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ paddingTop: "10px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                              {totalCh === 0 ? "No chapters mapped" : "Audit Timeline & Gaps"}
                            </span>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#0C1E33" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", padding: "14px 18px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>
                    {selectedGrade} — {selectedCurriculumSubject} Syllabus Audit
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                    Chapter-wise delivery timeline, pacing gap, and learning outcome tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCurriculumSubject(null)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: "1px solid #E0E5EB",
                    background: "#F8FAFC",
                    color: "#0C1E33",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
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
                    <EmptyState
                      illustration="/noresult.png"
                      title="No Chapters Found"
                      description={`No chapters are mapped for ${selectedCurriculumSubject} in ${selectedGrade}.`}
                    />
                  );
                }

                return filteredNodes.map((node: CurriculumNodeItem, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E0E5EB",
                      borderRadius: "10px",
                      padding: "18px 20px",
                      boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "#0C1E33", background: "#F1F5F9", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                          {node.grade} · {node.subject} · {node.unit}
                        </span>
                        <h4 style={{ margin: "6px 0 2px", fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>
                          {node.chapter}
                        </h4>
                      </div>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: "100px",
                          fontSize: "10.5px",
                          fontWeight: 600,
                          background: node.gap < -5 ? "#FEE2E2" : "#DCFCE7",
                          color: node.gap < -5 ? "#991B1B" : "#166534",
                        }}
                      >
                        {node.status} (Gap: {percent(node.gap)})
                      </span>
                    </div>

                    <div style={{ margin: "12px 0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", marginBottom: "6px" }}>
                        <span>
                          Expected Timeline: <b>Week {node.expectedWeek} ({percent(node.expectedProgress)})</b>
                        </span>
                        <span>
                          Actual Delivered: <b>{node.actualProgress}%</b>
                        </span>
                      </div>
                      <div style={{ height: "6px", width: "100%", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, node.actualProgress)}%`,
                            background: node.gap < -5 ? "#EF4444" : "#10B981",
                          }}
                        />
                      </div>
                    </div>

                    {node.learningOutcomes && node.learningOutcomes.length > 0 && (
                      <div style={{ fontSize: "12px", color: "#475569", marginTop: "8px" }}>
                        <b style={{ color: "#0C1E33" }}>Mapped Learning Outcome:</b> {node.learningOutcomes.join(" · ")}
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
            <EmptyState
              illustration="/bee.png"
              title="No Lesson Plans Submitted"
              description="No faculty lesson plans are currently pending review or recorded. Teachers can submit daily plans from the Teacher workspace."
            />
          ) : (
            planList.map((lp: LessonPlanItem, idx: number) => (
              <div
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E5EB",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>
                      {lp.subject} ({lp.classSection}) — {lp.topic}
                    </h4>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      Teacher: <b>{lp.teacherName}</b> · Planned Date: {lp.plannedDate}
                    </span>
                  </div>
                  <span
                    style={{
                      background: lp.status === "Approved" ? "#DCFCE7" : "#FEF3C7",
                      color: lp.status === "Approved" ? "#166534" : "#92400E",
                      padding: "2px 8px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {lp.status}
                  </span>
                </div>

                <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px", margin: "10px 0" }}>
                  <div>
                    <b style={{ color: "#0C1E33" }}>Target Learning Outcome:</b> {lp.learningOutcomes}
                  </div>
                  <div>
                    <b style={{ color: "#0C1E33" }}>Teaching Pedagogy:</b> {lp.teachingStrategy}
                  </div>
                  <div>
                    <b style={{ color: "#0C1E33" }}>Formative Assessment:</b> {lp.assessmentMethod}
                  </div>
                  {lp.principalFeedback && (
                    <div
                      style={{
                        background: "#F0FDF4",
                        border: "1px solid #DCFCE7",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    />
                    <button
                      onClick={() => handleSendFeedback(lp.id, "Approved")}
                      style={{
                        background: "#0C1E33",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleSendFeedback(lp.id, "Needs Revision")}
                      style={{
                        background: "#FFFBEB",
                        color: "#B45309",
                        border: "1px solid #FCD34D",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'Poppins', sans-serif",
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
            <EmptyState
              illustration="/bee.png"
              title="No Competencies Registered"
              description="No curriculum learning outcomes or competencies have been registered yet for this institution."
            />
          ) : (
            nodeList.map((node: CurriculumNodeItem) => (
              <div
                key={node.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E5EB",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                }}
              >
                <span
                  style={{
                    fontSize: "10.5px",
                    color: "#586C82",
                    background: "#F1F5F9",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  {node.grade} · {node.subject}
                </span>
                <h4 style={{ margin: "8px 0 6px", fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>
                  {node.chapter}
                </h4>
                <div style={{ fontSize: "12px", color: "#475569", marginBottom: "4px" }}>
                  <b style={{ color: "#0C1E33" }}>Competencies:</b> {node.competency || "Standard Pedagogical Competency"}
                </div>
                <div style={{ fontSize: "12px", color: "#475569" }}>
                  <b style={{ color: "#0C1E33" }}>Learning Outcomes:</b> {node.learningOutcomes.join(" · ") || "Standard CBSE/State curriculum outcomes"}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 6. Subject Performance Right Drawer */}
      {selectedSubjectForDrawer && (
        <SubjectPerformanceDrawer
          subject={selectedSubjectForDrawer}
          onClose={() => setSelectedSubjectForDrawer(null)}
          onOpenTeacherProfile={onOpenTeacherProfile}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
}
