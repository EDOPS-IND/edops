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
import { RadarPillarsChart, SegmentedDonut, StackedProgressBar } from "../components/telemetry-charts";
import { NoticeBoard } from "../../components/notice-board";
import { getTimeGreeting } from "../../components/greeting-helper";

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
  principalName,
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
  principalName?: string;
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
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "12px",
            minWidth: 0,
            padding: "24px clamp(16px, 3vw, 32px)",
          }}
        >
          {/* Greeting Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "28px", lineHeight: 1 }} aria-hidden="true">
              {getTimeGreeting().icon}
            </span>
            <h1
              id="principal-greeting"
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: 600,
                color: S.navy,
                letterSpacing: "-0.02em",
              }}
            >
              {(() => {
                const name = (principalName || liveData?.principalName || "Principal").replace(/\s*\(Principal\)|\s*\(Admin\)/gi, "").trim();
                return `${getTimeGreeting().greeting}, ${name}!`;
              })()}
            </h1>
          </div>

          {/* Details & Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              color: S.slate,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 600, color: S.navy }}>
              Principal Academic Console
            </span>
            <span style={{ color: "#5c6b80" }}>/</span>
            <span>Academic Year {kpis.activeAcademicYear || "2026–2027"}</span>
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                background: "rgba(12, 30, 51, 0.05)",
                fontSize: "11px",
                fontWeight: 600,
                color: S.navy,
              }}
            >
              All Academic Systems Normal
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
            {/* Academic Health Dossier */}
            <button
              type="button"
              onClick={onOpenHealthModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                border: `1px solid ${S.line}`,
                borderRadius: "6px",
                background: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                color: S.navy,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#98A2B3";
                e.currentTarget.style.background = "#FAF8F5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = S.line;
                e.currentTarget.style.background = "#fff";
              }}
            >
              <HeartPulse size={16} />
              <span>Academic Health Dossier</span>
            </button>

            {/* Live Campus Timetable */}
            <button
              type="button"
              onClick={() => nav("timetable")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                border: `1px solid ${S.line}`,
                borderRadius: "6px",
                background: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                color: S.navy,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#98A2B3";
                e.currentTarget.style.background = "#FAF8F5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = S.line;
                e.currentTarget.style.background = "#fff";
              }}
            >
              <Clock size={16} />
              <span>Live Campus Timetable</span>
            </button>

            {/* Annual Academic Plan */}
            <button
              type="button"
              onClick={() => nav("planning")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                border: `1px solid ${S.navy}`,
                borderRadius: "6px",
                background: S.navy,
                fontSize: "13px",
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#132840")}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <Calendar size={16} />
              <span>Annual Academic Plan</span>
            </button>
          </div>
        </div>

        {/* Dashboard Artwork Illustration */}
        <div className="dashboard-hero-illustration" style={{ flexShrink: 0, width: "251px", height: "196px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src="/studentdashboard.svg"
            alt="Principal Academic Console"
            width={251}
            height={196}
            style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
          />
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
            <span style={{ fontSize: "11px" }}>Across {kpis.totalClasses != null ? kpis.totalClasses : "—"} grades &amp; {kpis.totalSections != null ? kpis.totalSections : "—"} sections</span>
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
            <span style={{ fontSize: "11px" }}>{operations?.teachersTeaching != null ? `${operations.teachersTeaching} active teaching this period` : "Schedule monitored live"}</span>
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
            <span style={{ fontSize: "11px" }}>{execution?.lessonPlansCompleted != null ? `${execution.lessonPlansCompleted} lesson plans delivered` : "Curriculum pacing on track"}</span>
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

          {/* Visual Pedagogical Radar Canvas */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "12px 14px", background: "#f8fafc", borderRadius: "10px", border: `1px solid ${S.border}`, marginBottom: "16px" }}>
            <RadarPillarsChart
              points={[
                { label: "Curriculum", value: healthBreakdown?.curriculumExecution },
                { label: "Assessments", value: healthBreakdown?.assessmentCompletion },
                { label: "Exam Scores", value: healthBreakdown?.studentPerformance },
                { label: "Teacher Activity", value: healthBreakdown?.teacherAcademicActivity },
                { label: "Attendance", value: healthBreakdown?.attendanceRate },
                { label: "Interventions", value: healthBreakdown?.interventionCompletion },
              ]}
              size={150}
            />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: S.slate }}>Overall Health Score</span>
                <span style={{ fontSize: "20px", fontWeight: 800, color: healthScore != null && healthScore >= 80 ? S.greenDk : S.navy }}>
                  {healthScore != null ? `${healthScore}/100` : "—/100"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: S.slate, lineHeight: 1.4 }}>
                {healthScore != null
                  ? "Real-time pedagogical balance across 6 institutional registers."
                  : "Geometric radar will populate automatically as attendance, syllabus logs, and assessment scores are recorded."}
              </p>
            </div>
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

            {/* Real-time schedule session badge */}
            <div style={{ marginTop: "12px", padding: "10px 14px", background: "#f8fafc", border: `1px solid ${S.border}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: S.navy, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: (operations?.classesRunning ?? 0) > 0 ? "#22c55e" : S.slate }} />
                {(operations?.currentPeriod ?? null) !== null
                  ? `Period ${operations.currentPeriod} Live Telemetry`
                  : (operations?.classesRunning ?? 0) > 0
                  ? "Active Instructional Session"
                  : "Campus Timetable Synchronized"}
              </span>
              <span style={{ fontSize: "11px", color: S.slate, fontWeight: 500 }}>
                {(operations?.substitutionsCovered ?? 0) > 0
                  ? `${operations.substitutionsCovered} substitution active`
                  : "Roster on schedule"}
              </span>
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

          {performance?.overallSchoolAverage != null && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: S.slate, marginBottom: "4px" }}>
                <span>Performance Ratio</span>
                <span style={{ fontWeight: 600, color: S.navy }}>{performance.overallSchoolAverage}%</span>
              </div>
              <StackedProgressBar segments={[{ label: "Average", value: performance.overallSchoolAverage, color: S.navy }]} height={5} />
            </div>
          )}

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

          {((execution?.lessonsDelivered ?? 0) > 0 || (execution?.pendingLessonPlans ?? 0) > 0) && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: S.slate, marginBottom: "4px" }}>
                <span>Delivery vs Pending Review</span>
                <span style={{ fontWeight: 600, color: S.greenDk }}>{execution?.lessonsDelivered ?? 0} delivered</span>
              </div>
              <StackedProgressBar
                segments={[
                  { label: "Delivered", value: execution?.lessonsDelivered ?? 0, color: S.greenDk },
                  { label: "Pending", value: execution?.pendingLessonPlans ?? 0, color: "#D97706" },
                ]}
                height={5}
              />
            </div>
          )}

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

          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px", padding: "10px", background: "#f8fafc", borderRadius: "8px", border: `1px solid ${S.border}` }}>
            <SegmentedDonut
              segments={[
                { label: "Published", value: exams?.resultsPublished ?? 0, color: S.greenDk },
                { label: "Locked", value: exams?.resultsLocked ?? 0, color: S.navy },
                { label: "Pending", value: exams?.resultsPending ?? 0, color: "#DC2626" },
              ]}
              size={44}
              strokeWidth={5}
              centerText={exams?.resultsPublished ? `${exams.resultsPublished}` : undefined}
            />
            <div style={{ fontSize: "11px", color: S.slate, lineHeight: 1.4 }}>
              {(exams?.resultsPublished ?? 0) + (exams?.resultsLocked ?? 0) + (exams?.resultsPending ?? 0) > 0
                ? "Breakdown of published, locked, and pending approval results."
                : "No examination results entered yet for this academic year."}
            </div>
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
      {/* Attention Engine: Full Width Executive Banner */}
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

      {/* Dual Activity & Communications Split */}
      <div className="portal-two-col" style={{ gap: "20px" }}>
        {/* Left: Live Academic Activity Log */}
        <div
          style={{
            background: S.white,
            border: `1px solid ${S.border}`,
            borderRadius: "12px",
            padding: "20px 22px",
            boxShadow: "0 1px 2px rgba(12, 30, 51, 0.04)",
            display: "flex",
            flexDirection: "column",
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

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
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

        {/* Right: Official Notice Board Preview */}
        {organizationId && (
          <NoticeBoard
            organizationId={organizationId}
            role="principal"
            isCompact={true}
            style={{ height: "100%", borderRadius: "12px" }}
            onNavigateToFull={() => onNavigateTab ? onNavigateTab("communication") : onNavigate?.("communication")}
          />
        )}
      </div>
    </div>
  );
}
