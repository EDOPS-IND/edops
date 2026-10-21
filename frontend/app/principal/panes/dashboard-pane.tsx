"use client";

import React from "react";
import {
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  Calendar,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  ArrowRight,
  ClipboardList,
  Activity,
  Plus,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import { PrincipalSchoolKpis, TodayAcademicOperations } from "../types";
import { formatAuditMessage } from "../../components/audit-formatter";

// Unified design tokens strictly matching Student & Teacher Dashboard specification
const S = {
  navy: "#0c1e33",
  slate: "#495d72",
  muted: "#a6abb5",
  faint: "#b3b3b3",
  bg: "#f4f6f7",
  white: "#ffffff",
  border: "#e4e6e9",
  line: "#ced8e5",
  chip: "#f5f6f8",
  blue: "#17a1fa",
  greenBg: "#ccefbf",
  greenDk: "#1a5c0a",
  violetBg: "#e1d2ff",
  violetDk: "#4a0e8f",
  skyBg: "#bae5f5",
  skyDk: "#0a5a7a",
  peachBg: "#ffd8c7",
  peachDk: "#782a00",
};

export function DashboardPane({
  schoolKpis,
  academicHealth,
  todayOperations,
  academicPerformance,
  teachingExecution,
  examinationStatus,
  recentActivity = [],
  onOpenHealthModal,
  onNavigateTab,
  onNavigate,
  onTriggerAction,
  organizationId,
}: {
  schoolKpis?: PrincipalSchoolKpis;
  academicHealth?: { score: number; status: string; breakdown: any };
  todayOperations?: TodayAcademicOperations;
  academicPerformance?: any;
  teachingExecution?: any;
  examinationStatus?: any;
  recentActivity?: any[];
  onOpenHealthModal: () => void;
  onNavigateTab?: (tab: string) => void;
  onNavigate?: (tab: string) => void;
  onTriggerAction?: (actionType: string) => void;
  organizationId?: string;
  onOpenTeacherProfile?: (id: string) => void;
  onOpenStudent360?: (id: string) => void;
}) {
  const [liveData, setLiveData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    import("../../edops-api").then(({ getPrincipalDashboard }) => {
      getPrincipalDashboard(organizationId)
        .then((data) => {
          if (!cancelled) setLiveData(data);
        })
        .catch(() => {
          if (!cancelled) setLoadError(true);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const kpis = liveData?.schoolKpis || schoolKpis || {
    totalStudents: null,
    totalTeachers: null,
    totalClasses: null,
    totalSections: null,
    totalSubjects: null,
    activeAcademicYear: null,
  };

  const healthScore = liveData?.academicHealth?.score ?? academicHealth?.score ?? null;
  const healthBreakdown = liveData?.academicHealth?.breakdown || academicHealth?.breakdown;
  const operations = liveData?.todayOperations || todayOperations;
  const performance = liveData?.academicPerformance || academicPerformance;
  const execution = liveData?.teachingExecution || teachingExecution;
  const exams = liveData?.examinationStatus || examinationStatus;
  const activities = liveData?.recentActivity ?? recentActivity;
  const metric = (value: number | null | undefined, suffix = "") =>
    value == null ? "—" : `${value}${suffix}`;

  const nav = (tab: string) => {
    if (onNavigateTab) onNavigateTab(tab);
    else if (onNavigate) onNavigate(tab);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {loadError && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            color: "#991B1B",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Dashboard data could not be loaded. Please try again or verify backend connectivity.
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          1. HERO BANNER WITH PRINCIPAL SVG ARTWORK
      ═══════════════════════════════════════════════ */}
      <section
        aria-labelledby="principal-greeting"
        style={{
          display: "flex",
          minHeight: "180px",
          overflow: "hidden",
          background: "#eaedf2",
          border: "1px solid #d8dee6",
          borderRadius: "12px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: "6px",
                  background: "#ffffff",
                  color: S.navy,
                  border: "1px solid #ced8e5",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Executive Command
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: "6px",
                  background: S.greenBg,
                  color: S.greenDk,
                }}
              >
                Academic Year {kpis.activeAcademicYear || "2026–2027"}
              </span>
              <span style={{ fontSize: "12px", color: S.slate, fontWeight: 500 }}>
                • Connected Campus Telemetry
              </span>
            </div>

            <h1
              id="principal-greeting"
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                color: S.navy,
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              Principal Academic Command Center
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: "13px",
                lineHeight: 1.5,
                color: S.slate,
                maxWidth: "680px",
              }}
            >
              Institutional pedagogical oversight, faculty workload balancing, syllabus progress, and real-time student outcomes across all active classes.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onOpenHealthModal}
              style={{
                all: "unset",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "7px",
                background: S.navy,
                color: "#ffffff",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(12, 30, 51, 0.12)",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1a365d")}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <HeartPulse size={14} />
              <span>Academic Health Dossier</span>
            </button>

            <button
              type="button"
              onClick={() => nav("timetable")}
              style={{
                all: "unset",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "7px",
                background: "#ffffff",
                border: "1px solid #ced8e5",
                color: S.navy,
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <Clock size={14} />
              <span>Live Campus Timetable</span>
            </button>

            <button
              type="button"
              onClick={() => nav("planning")}
              style={{
                all: "unset",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "7px",
                background: "#ffffff",
                border: "1px solid #ced8e5",
                color: S.navy,
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <Calendar size={14} />
              <span>Annual Academic Plan</span>
            </button>
          </div>
        </div>

        {/* Stylized SVG Administrative Artwork Illustration */}
        <div
          aria-hidden="true"
          style={{
            width: "280px",
            flexShrink: 0,
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 24px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(206,216,229,0.3) 100%)",
            borderLeft: "1px solid #d8dee6",
          }}
          className="lg-artwork"
        >
          <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="25" width="180" height="105" rx="10" fill="#ffffff" stroke="#ced8e5" strokeWidth="2" />
            <rect x="35" y="40" width="50" height="8" rx="4" fill="#0c1e33" />
            <rect x="35" y="55" width="150" height="4" rx="2" fill="#e4e6e9" />
            <rect x="35" y="65" width="120" height="4" rx="2" fill="#e4e6e9" />
            <rect x="35" y="75" width="90" height="4" rx="2" fill="#e4e6e9" />
            <circle cx="160" cy="44" r="14" fill="#ccefbf" stroke="#1a5c0a" strokeWidth="1.5" />
            <path d="M155 44L158 47L166 40" stroke="#1a5c0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="35" y="92" width="60" height="24" rx="6" fill="#e1d2ff" />
            <rect x="42" y="100" width="46" height="8" rx="3" fill="#4a0e8f" />
            <rect x="105" y="92" width="75" height="24" rx="6" fill="#bae5f5" />
            <rect x="115" y="100" width="55" height="8" rx="3" fill="#0a5a7a" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. TOP 4 PASTEL METRIC CARDS (STRICTLY 148PX)
      ═══════════════════════════════════════════════ */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {/* Card 1: Academic Health Index (Pastel Mint) */}
        <article
          onClick={onOpenHealthModal}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: S.greenBg,
            border: `1px solid ${S.greenBg}`,
            borderRadius: "10px",
            color: S.greenDk,
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Academic Health Score
            </span>
            <ShieldCheck size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: S.greenDk }}>
            {metric(healthScore, "/100")}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>
              {healthScore === null ? "Awaiting evaluation" : healthScore >= 80 ? "Optimal Academic Health" : "Intervention Indicated"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              Dossier <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* Card 2: Enrolled Students (Pastel Violet) */}
        <article
          onClick={() => nav("students")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: S.violetBg,
            border: `1px solid ${S.violetBg}`,
            borderRadius: "10px",
            color: S.violetDk,
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Students
            </span>
            <GraduationCap size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: S.violetDk }}>
            {metric(kpis.totalStudents)}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Across {kpis.totalClasses ?? 0} grades &amp; {kpis.totalSections ?? 0} sections</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              Roster <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* Card 3: Teaching Faculty (Pastel Sky) */}
        <article
          onClick={() => nav("people")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: S.skyBg,
            border: `1px solid ${S.skyBg}`,
            borderRadius: "10px",
            color: S.skyDk,
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Faculty Members
            </span>
            <Users size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: S.skyDk }}>
            {metric(kpis.totalTeachers)}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>{operations?.teachersTeaching ?? 0} active teaching this period</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              Faculty <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* Card 4: Syllabus & Curriculum Delivery (Pastel Peach) */}
        <article
          onClick={() => nav("academics")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: S.peachBg,
            border: `1px solid ${S.peachBg}`,
            borderRadius: "10px",
            color: S.peachDk,
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Syllabus Completion
            </span>
            <BookOpen size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: S.peachDk }}>
            {metric(execution?.syllabusCompletion, "%")}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>{execution?.lessonPlansCompleted ?? 0} lesson plans delivered</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              Curriculum <ArrowRight size={13} />
            </span>
          </div>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          3. DUAL STATUS: HEALTH PILLARS & TODAY'S OPERATIONS
      ═══════════════════════════════════════════════ */}
      <div className="portal-split-grid" style={{ gap: "20px" }}>
        {/* Left: Explainable Academic Health Pillars Card */}
        <div
          style={{
            background: S.white,
            border: `1px solid ${S.border}`,
            borderRadius: "12px",
            padding: "22px 24px",
            boxShadow: "0 1px 2px rgba(12, 30, 51, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: S.greenBg,
                  color: S.greenDk,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.navy }}>
                  Academic Health Index Pillars
                </h3>
                <span style={{ fontSize: "12px", color: S.slate }}>
                  6-dimensional verifiable pedagogical performance index
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenHealthModal}
              style={{
                all: "unset",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                color: S.navy,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "6px",
                background: S.chip,
                border: `1px solid ${S.border}`,
              }}
            >
              Open Dossier <ArrowRight size={12} />
            </button>
          </div>

          {/* Pillars List with visual percentage progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Curriculum Execution", value: healthBreakdown?.curriculumExecution, target: "90% target" },
              { label: "Assessment Papers Published", value: healthBreakdown?.assessmentCompletion, target: "Term completion" },
              { label: "Exam Average Score", value: healthBreakdown?.studentPerformance, target: "Cohort average" },
              { label: "Teacher Academic Activity", value: healthBreakdown?.teacherAcademicActivity, target: "Daily log compliance" },
              { label: "Campus Student Attendance", value: healthBreakdown?.attendanceRate, target: "Statutory 75% minimum" },
              { label: "Academic Interventions Completed", value: healthBreakdown?.interventionCompletion, target: "Remedial closure" },
            ].map((p, idx) => {
              const val = typeof p.value === "number" ? Math.min(100, Math.max(0, p.value)) : 0;
              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: 600, color: S.navy }}>{p.label}</span>
                    <span style={{ fontWeight: 700, color: S.navy, fontVariantNumeric: "tabular-nums" }}>
                      {metric(p.value, "%")}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      width: "100%",
                      background: "#eef1f6",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${val}%`,
                        background: val >= 75 ? S.greenDk : val >= 50 ? "#D97706" : "#DC2626",
                        borderRadius: "3px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Today's Academic Operations */}
        <div
          style={{
            background: S.white,
            border: `1px solid ${S.border}`,
            borderRadius: "12px",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 2px rgba(12, 30, 51, 0.04)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.navy }}>
                  Today’s Academic Operations
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.slate }}>
                  Instructional delivery &amp; real-time classroom telemetry
                </p>
              </div>
              <span
                style={{
                  background: S.chip,
                  border: `1px solid ${S.border}`,
                  color: S.navy,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Current Schedule
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "Classes Active", value: operations?.classesRunning, sub: "In-session periods", color: S.navy, bg: S.chip },
                { label: "Faculty Teaching", value: operations?.teachersTeaching, sub: "Teaching roster", color: S.greenDk, bg: "#f0fdf4" },
                { label: "Pending Reviews", value: operations?.pendingReviews, sub: "Lesson plans", color: S.violetDk, bg: "#faf5ff" },
                { label: "Open Alerts", value: operations?.openAlerts, sub: "Requires attention", color: S.peachDk, bg: "#fff7ed" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: stat.bg,
                    border: `1px solid ${S.border}`,
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: S.slate, fontWeight: 600 }}>{stat.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: stat.color, margin: "4px 0 2px" }}>
                    {stat.value ?? "—"}
                  </div>
                  <div style={{ fontSize: "10.5px", color: S.faint }}>{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: `1px solid ${S.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "12px", color: S.slate, fontWeight: 500 }}>
              Synchronized with master timetable
            </span>
            <button
              type="button"
              onClick={() => nav("timetable")}
              style={{
                all: "unset",
                color: S.navy,
                fontSize: "12px",
                fontWeight: 650,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Master Timetable <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          4. CORE DOMAINS: PERFORMANCE, EXECUTION, EXAMINATIONS
      ═══════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Domain 1: Academic Performance */}
        <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: "10px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: S.navy }}>School Academic Performance</h4>
            <button
              type="button"
              onClick={() => nav("academics")}
              style={{ all: "unset", cursor: "pointer", color: S.navy, fontSize: "11.5px", fontWeight: 650 }}
            >
              Details ↗
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Overall Average:</span>
              <span style={{ fontWeight: 700, color: S.navy }}>{metric(performance?.overallSchoolAverage, "%")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Average Assessment Score:</span>
              <span style={{ fontWeight: 700, color: S.navy }}>{metric(performance?.averageAssessmentScore, "%")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Learning Outcome Progress:</span>
              <span style={{ fontWeight: 700, color: S.greenDk }}>{metric(performance?.learningOutcomeAchievement, "%")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Curriculum Completion:</span>
              <span style={{ fontWeight: 700, color: S.navy }}>{metric(performance?.curriculumCompletion, "%")}</span>
            </div>
          </div>
        </div>

        {/* Domain 2: Teaching Execution */}
        <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: "10px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: S.navy }}>Teaching-Learning Execution</h4>
            <button
              type="button"
              onClick={() => nav("learning")}
              style={{ all: "unset", cursor: "pointer", color: S.navy, fontSize: "11.5px", fontWeight: 650 }}
            >
              Details ↗
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Lesson Plans Completed:</span>
              <span style={{ fontWeight: 700, color: S.greenDk }}>{metric(execution?.lessonPlansCompleted)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Lessons Delivered:</span>
              <span style={{ fontWeight: 700, color: S.navy }}>{metric(execution?.lessonsDelivered)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Syllabus Completion:</span>
              <span style={{ fontWeight: 700, color: S.navy }}>{metric(execution?.syllabusCompletion, "%")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Pending Lesson Reviews:</span>
              <span style={{ fontWeight: 700, color: (execution?.pendingLessonPlans ?? 0) > 0 ? "#B45309" : S.greenDk }}>
                {metric(execution?.pendingLessonPlans, " awaiting")}
              </span>
            </div>
          </div>
        </div>

        {/* Domain 3: Examinations & Results */}
        <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: "10px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: S.navy }}>Examinations &amp; Results</h4>
            <button
              type="button"
              onClick={() => nav("examinations")}
              style={{ all: "unset", cursor: "pointer", color: S.navy, fontSize: "11.5px", fontWeight: 650 }}
            >
              Details ↗
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Published Results:</span>
              <span style={{ fontWeight: 700, color: S.greenDk }}>{metric(exams?.resultsPublished, " published")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Results Finalized &amp; Locked:</span>
              <span style={{ fontWeight: 700, color: S.navy }}>{metric(exams?.resultsLocked, " locked")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Pending Principal Approval:</span>
              <span style={{ fontWeight: 700, color: (exams?.resultsPending ?? 0) > 0 ? "#DC2626" : S.greenDk }}>
                {metric(exams?.resultsPending, " records")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: S.slate }}>Papers Evaluated:</span>
              <span style={{ fontWeight: 700, color: S.navy }}>{metric(exams?.papersEvaluated, " evaluated")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          5. ATTENTION ENGINE & LIVE AUDIT TRAIL
      ═══════════════════════════════════════════════ */}
      <div className="portal-split-grid" style={{ gap: "20px" }}>
        {/* Attention Engine */}
        <div
          style={{
            background: S.white,
            border: `1px solid ${S.border}`,
            borderRadius: "12px",
            padding: "20px 22px",
            boxShadow: "0 1px 2px rgba(12, 30, 51, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} color="#D97706" />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: S.navy }}>
                Academic Action Engine &amp; Attention Triggers
              </h3>
            </div>
            <button
              type="button"
              onClick={() => nav("alerts")}
              style={{ all: "unset", cursor: "pointer", color: S.navy, fontSize: "12px", fontWeight: 650 }}
            >
              All Alerts <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(!operations?.openAlerts || operations?.openAlerts === 0) ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  background: S.chip,
                  borderRadius: "8px",
                  border: `1px dashed ${S.border}`,
                  fontSize: "12.5px",
                  color: S.slate,
                }}
              >
                ✓ All academic registers in good standing. No open alerts require principal action.
              </div>
            ) : (
              [{
                title: "Academic Intervention Triggers",
                desc: `${operations.openAlerts} alerts require executive administrative sign-off.`,
                action: "Review Alerts",
                actionType: "alerts",
              }].map((alert) => (
                <div
                  key={alert.actionType}
                  style={{
                    border: "1px solid #FEF3C7",
                    background: "#FFFBEB",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#92400E" }}>{alert.title}</div>
                    <div style={{ fontSize: "12px", color: "#B45309", marginTop: "2px" }}>{alert.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => (onTriggerAction ? onTriggerAction(alert.actionType) : nav(alert.actionType))}
                    style={{
                      background: S.navy,
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "7px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      marginLeft: "12px",
                    }}
                  >
                    {alert.action} ↗
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Academic Activity Log */}
        <div
          style={{
            background: S.white,
            border: `1px solid ${S.border}`,
            borderRadius: "12px",
            padding: "20px 22px",
            boxShadow: "0 1px 2px rgba(12, 30, 51, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: S.navy }}>
              Recent Academic Activity
            </h3>
            <button
              type="button"
              onClick={() => nav("activity")}
              style={{ all: "unset", cursor: "pointer", color: S.navy, fontSize: "12px", fontWeight: 650 }}
            >
              Full Ledger <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activities.length === 0 ? (
              <div style={{ fontSize: "12px", color: S.slate, textAlign: "center", padding: "20px 0" }}>
                {liveData || loadError ? "No recent academic audit events recorded." : "Connecting to audit ledger…"}
              </div>
            ) : (
              activities.slice(0, 6).map((act: any, idx: number) => (
                <div
                  key={act.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontSize: "12px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: S.chip,
                    border: `1px solid ${S.border}`,
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: S.greenDk,
                      marginTop: "5px",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, color: S.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {formatAuditMessage(act.title || act.action, act.details, act.author)}
                    </div>
                    <div style={{ color: S.slate, fontSize: "11px", marginTop: "1px" }}>
                      {act.author || "Faculty"} • {act.time || "Recently"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
