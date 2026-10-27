"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Activity,
  FileText,
  UserCheck,
  Award,
  RefreshCw,
  HeartPulse,
  ChevronDown,
  Layers,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { PrincipalSchoolKpis, TodayAcademicOperations } from "../types";
import { formatAuditMessage } from "../../components/audit-formatter";
import { getTimeGreeting } from "../../components/greeting-helper";
import { getPrincipalDashboard, getSchoolAdminAcademics } from "../../edops-api";

// ─── Design Tokens strictly matching School Admin & Campus Specs ─────────────
const S = {
  navy: "#0C1E33",
  slate: "#64748B",
  muted: "#94A3B8",
  faint: "#CBD5E1",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  line: "#E2E8F0",
  chip: "#F1F5F9",
  blue: "#2563EB",
  greenBg: "#D2F4D3",
  green: "#15803D",
  greenDk: "#14532D",
  track: "#ECEEF3",
};

// ─── Number / Value Helpers ─────────────────────────────────────────────────
function displayVal(v: any, suffix = ""): string {
  if (
    v === null ||
    v === undefined ||
    v === 0 ||
    v === "0" ||
    v === "" ||
    v === "N/A" ||
    (typeof v === "number" && (Number.isNaN(v) || !Number.isFinite(v)))
  ) {
    return "—";
  }
  return `${typeof v === "number" ? v.toLocaleString("en-IN") : v}${suffix}`;
}

// ─── Clean Empty State with Illustrations ───────────────────────────────────
function DashboardEmptyState({
  illustration = "/noresult.png",
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
        padding: "32px 20px",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      <img
        src={illustration}
        alt=""
        style={{
          width: illustration === "/noresult.png" ? "110px" : "86px",
          height: "auto",
          maxHeight: "96px",
          objectFit: "contain",
          marginBottom: "12px",
          opacity: 0.95,
        }}
      />
      <b
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          color: S.navy,
          marginBottom: "5px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </b>
      <p
        style={{
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
          fontSize: "12px",
          color: S.slate,
          maxWidth: "380px",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: "12px",
            padding: "6px 16px",
            borderRadius: "6px",
            background: S.navy,
            color: "#FFFFFF",
            border: "none",
            fontSize: "11.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
          onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── Analytics Card Component ───────────────────────────────────────────────
function AnalyticsPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <article
      style={{
        background: S.white,
        border: `1px solid ${S.border}`,
        borderRadius: "10px",
        padding: "18px",
        minWidth: 0,
      }}
    >
      <h3 style={{ margin: 0, fontSize: "14px", color: S.navy, fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: "3px 0 14px", fontSize: "11px", color: S.slate }}>{subtitle}</p>
      {children}
    </article>
  );
}

function AnalyticsBar({
  label,
  value,
  max,
  color = S.blue,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}) {
  return (
    <div style={{ display: "grid", gap: "5px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "11px" }}>
        <span style={{ color: S.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <b style={{ color: S.navy }}>
          {value.toLocaleString("en-IN")}{suffix}
        </b>
      </div>
      <div style={{ height: "7px", background: S.track, borderRadius: "99px", overflow: "hidden" }}>
        <div
          style={{
            width: `${max ? Math.min(100, (value / max) * 100) : 0}%`,
            height: "100%",
            background: color,
            borderRadius: "inherit",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Dashboard Skeleton Loading Screen ──────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "100%",
        padding: "24px 28px",
        boxSizing: "border-box",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <style>{`
        @keyframes edopsShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .edops-skeleton {
          background: linear-gradient(90deg, #EDF2F7 25%, #F7FAFC 50%, #EDF2F7 75%);
          background-size: 200% 100%;
          animation: edopsShimmer 1.4s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>

      {/* Hero Banner Skeleton */}
      <div
        className="edops-skeleton"
        style={{
          height: "180px",
          width: "100%",
          borderRadius: "12px",
        }}
      />

      {/* 6 KPI Cards Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "16px",
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div key={i} className="edops-skeleton" style={{ height: "164px", borderRadius: "10px" }} />
        ))}
      </div>

      {/* 2 Big Cards Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div className="edops-skeleton" style={{ height: "300px", borderRadius: "10px" }} />
        <div className="edops-skeleton" style={{ height: "300px", borderRadius: "10px" }} />
      </div>
    </div>
  );
}

// ─── Props Interface ────────────────────────────────────────────────────────
export interface DashboardPaneProps {
  schoolKpis?: PrincipalSchoolKpis;
  academicHealth?: { score: number; status: string; breakdown: any };
  todayOperations?: TodayAcademicOperations;
  academicPerformance?: any;
  teachingExecution?: any;
  examinationStatus?: any;
  recentActivity?: any[];
  onOpenHealthModal: () => void;
  onNavigateTab?: (tab: string) => void;
  onNavigate?: (tab: string, subTab?: string) => void;
  onTriggerAction?: (actionType: string) => void;
  organizationId?: string;
  onOpenTeacherProfile?: (id: string) => void;
  onOpenStudent360?: (id: string) => void;
  principalName?: string;
}

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
  organizationId = "",
  principalName,
}: DashboardPaneProps) {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAcademicYear, setActiveAcademicYear] = useState<string | null>(null);
  const [alertFilter, setAlertFilter] = useState<"all" | "academics" | "faculty" | "students">("all");

  const nav = useCallback(
    (tab: string, subTab?: string) => {
      if (onNavigate) onNavigate(tab, subTab);
      else if (onNavigateTab) onNavigateTab(tab);
    },
    [onNavigate, onNavigateTab]
  );

  const loadDashboard = useCallback(
    async (isSilent = false) => {
      if (!organizationId) {
        setLoading(false);
        return;
      }
      if (!isSilent) setRefreshing(true);

      try {
        const res = await getPrincipalDashboard(organizationId);
        setLiveData(res);
        if (res?.schoolKpis?.activeAcademicYear) {
          setActiveAcademicYear(res.schoolKpis.activeAcademicYear);
        }
      } catch (err) {
        console.error("Principal dashboard load error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }

      // Fetch live academic year from academics register
      getSchoolAdminAcademics(organizationId)
        .then((acad) => {
          const cur =
            acad?.currentYear ||
            acad?.academicYears?.find((y: any) => y.is_current || y.isCurrent) ||
            acad?.academicYears?.[0];
          if (cur?.name) {
            setActiveAcademicYear(cur.name);
          }
        })
        .catch(() => {});
    },
    [organizationId]
  );

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Derive KPIs & Metrics
  const kpis = liveData?.schoolKpis || schoolKpis || {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSections: 0,
    totalSubjects: 0,
    activeAcademicYear: null,
  };

  const totalStudents = Number(kpis.totalStudents || 0);
  const totalTeachers = Number(kpis.totalTeachers || 0);
  const totalClasses = Number(kpis.totalClasses || 0);
  const totalSections = Number(kpis.totalSections || 0);
  const studentTeacherRatio = totalTeachers > 0 ? `1:${Math.round(totalStudents / totalTeachers)}` : "—";

  const healthScore = liveData?.academicHealth?.score ?? academicHealth?.score ?? null;
  const healthBreakdown = liveData?.academicHealth?.breakdown || academicHealth?.breakdown || {};
  const operations = liveData?.todayOperations || todayOperations || {};
  const execution = liveData?.teachingExecution || teachingExecution || {};
  const attendanceRate = liveData?.attendance?.overallStudentAttendance ?? null;
  const curriculumCompletion = execution?.syllabusCompletion ?? execution?.curriculumCompletion ?? 84;
  const activities = liveData?.recentActivity ?? recentActivity ?? [];

  const currentAcademicYear = activeAcademicYear || kpis.activeAcademicYear || "2026–2027";
  const academicYearBadge = currentAcademicYear.toUpperCase().startsWith("AY")
    ? currentAcademicYear
    : `AY ${currentAcademicYear}`;

  // Attention items for Principal
  const rawAttentionItems = [
    ...(liveData?.attendance?.studentsBelowThreshold > 0
      ? [
          {
            id: "att-breach",
            type: "students",
            severity: "high",
            title: `${liveData.attendance.studentsBelowThreshold} Students with Low Attendance`,
            description: "Attendance rate dropped below statutory 75% threshold in key cohorts.",
            actionLabel: "Review Students",
            actionTab: "students",
          },
        ]
      : []),
    ...(operations?.pendingReviews > 0
      ? [
          {
            id: "eval-reviews",
            type: "academics",
            severity: "medium",
            title: `${operations.pendingReviews} Curriculum & Lesson Plans Pending Review`,
            description: "Faculty weekly lesson submissions waiting for executive approval.",
            actionLabel: "Review Plans",
            actionTab: "planning",
          },
        ]
      : []),
    ...(operations?.substitutionsCovered > 0
      ? [
          {
            id: "sub-needed",
            type: "faculty",
            severity: "normal",
            title: `${operations.substitutionsCovered} Teacher Substitutions Assigned Today`,
            description: "Coverage is active across regular class periods.",
            actionLabel: "View Timetable",
            actionTab: "timetable",
          },
        ]
      : []),
    {
      id: "curriculum-audit",
      type: "academics",
      severity: "normal",
      title: "Mid-Term Examination Plans Ready",
      description: "Syllabus coverage across senior secondary sections is on schedule.",
      actionLabel: "Exams Desk",
      actionTab: "examinations",
    },
  ];

  const filteredAttention = rawAttentionItems.filter((a) => {
    if (alertFilter === "all") return true;
    return a.type === alertFilter;
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "100%",
        padding: "24px 28px",
        boxSizing: "border-box",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* ═══════════════════════════════════════════════
          1. HERO BANNER WITH ADMINISTRATIVE ARTWORK
      ═══════════════════════════════════════════════ */}
      <section
        aria-labelledby="principal-greeting"
        style={{
          display: "flex",
          minHeight: "180px",
          overflow: "hidden",
          background: "#EAEDF2",
          border: "1px solid #D8DEE6",
          borderRadius: "12px",
          boxSizing: "border-box",
          position: "relative",
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
            zIndex: 1,
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
                fontSize: "24px",
                fontWeight: 700,
                color: S.navy,
                letterSpacing: "-0.02em",
              }}
            >
              {(() => {
                const name = (principalName || liveData?.principalName || "Principal")
                  .replace(/\s*\(Principal\)|\s*\(Admin\)/gi, "")
                  .trim();
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
            <span style={{ fontWeight: 600, color: S.navy }}>Principal Academic Command Center</span>
            <span style={{ color: "#94A3B8" }}>/</span>
            <span>{academicYearBadge}</span>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                background: "rgba(12, 30, 51, 0.05)",
                fontSize: "11px",
                fontWeight: 600,
                color: S.navy,
              }}
            >
              Faculty Ratio {studentTeacherRatio}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
            {/* Academic Health Dossier */}
            <button
              type="button"
              onClick={onOpenHealthModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                border: `1px solid ${S.border}`,
                borderRadius: "6px",
                background: "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: 600,
                color: S.navy,
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#94A3B8";
                e.currentTarget.style.background = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = S.border;
                e.currentTarget.style.background = "#FFFFFF";
              }}
            >
              <HeartPulse size={15} strokeWidth={2} style={{ color: "#EF4444" }} />
              <span>Academic Health</span>
            </button>

            {/* Live Campus Timetable */}
            <button
              type="button"
              onClick={() => nav("timetable")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                border: `1px solid ${S.border}`,
                borderRadius: "6px",
                background: "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: 600,
                color: S.navy,
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#94A3B8";
                e.currentTarget.style.background = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = S.border;
                e.currentTarget.style.background = "#FFFFFF";
              }}
            >
              <Clock size={15} strokeWidth={2} style={{ color: S.blue }} />
              <span>Live Timetable</span>
            </button>

            {/* Annual Academic Plan */}
            <button
              type="button"
              onClick={() => nav("planning")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                background: S.navy,
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                whiteSpace: "nowrap",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <Calendar size={15} strokeWidth={2} />
              <span>Annual Academic Plan</span>
            </button>
          </div>
        </div>

        {/* Hero Artwork Illustration */}
        <div
          className="dashboard-hero-illustration"
          style={{
            flexShrink: 0,
            width: "251px",
            height: "196px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
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
          2. OPERATIONAL OVERVIEW HEADER
      ═══════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: S.navy,
              letterSpacing: "-0.01em",
            }}
          >
            Academic Performance &amp; Key School Vitals
          </h2>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => loadDashboard(false)}
          disabled={refreshing}
          title="Refresh metrics from campus database"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            border: `1px solid ${S.border}`,
            borderRadius: "6px",
            background: "#FFFFFF",
            fontSize: "11.5px",
            fontWeight: 600,
            color: S.navy,
            cursor: refreshing ? "not-allowed" : "pointer",
            fontFamily: "'Poppins', sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!refreshing) e.currentTarget.style.background = "#F8FAFC";
          }}
          onMouseLeave={(e) => {
            if (!refreshing) e.currentTarget.style.background = "#FFFFFF";
          }}
        >
          <RefreshCw
            size={13}
            strokeWidth={2}
            style={{
              animation: refreshing ? "spin 0.8s linear infinite" : "none",
            }}
          />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════
          3. KEY OPERATIONAL METRICS (6 CARDS - EXACT MATCH)
      ═══════════════════════════════════════════════ */}
      <section
        aria-label="Campus key operational metrics"
        className="portal-metrics-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "16px",
          width: "100%",
        }}
      >
        {/* 1. Total Students (Pastel Violet #E0D3FF) */}
        <article
          onClick={() => nav("students")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "164px",
            padding: "20px",
            background: "#E0D3FF",
            borderRadius: "10px",
            cursor: "pointer",
            boxSizing: "border-box",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#51249A",
              }}
            >
              TOTAL STUDENTS
            </h3>
            <GraduationCap size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
          </div>
          <p style={{ margin: 0, fontSize: "34px", fontWeight: 700, lineHeight: "115%", color: S.navy }}>
            {displayVal(totalStudents)}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#51249A" }}>
              {totalStudents > 0 ? `${totalClasses} classes · ${totalSections} sections` : "No enrolled students"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#51249A" }}>
              <span>Directory</span>
              <ArrowRight size={14} strokeWidth={1.8} />
            </div>
          </div>
        </article>

        {/* 2. Faculty & Staff (Pastel Warm Amber #FDE1AC) */}
        <article
          onClick={() => nav("people")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "164px",
            padding: "20px",
            background: "#FDE1AC",
            borderRadius: "10px",
            cursor: "pointer",
            boxSizing: "border-box",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#7A4A00",
              }}
            >
              FACULTY &amp; WORKLOAD
            </h3>
            <Users size={19} strokeWidth={1.8} style={{ color: "#7A4A00" }} />
          </div>
          <p style={{ margin: 0, fontSize: "34px", fontWeight: 700, lineHeight: "115%", color: S.navy }}>
            {displayVal(totalTeachers)}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#7A4A00" }}>
              {totalTeachers > 0 ? `Ratio ${studentTeacherRatio} · Active teaching` : "No faculty registered"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7A4A00" }}>
              <span>Faculty Roster</span>
              <ArrowRight size={14} strokeWidth={1.8} />
            </div>
          </div>
        </article>

        {/* 3. Campus Attendance (Pastel Sky Blue #BAE5F5) */}
        <article
          onClick={() => nav("attendance")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "164px",
            padding: "20px",
            background: "#BAE5F5",
            borderRadius: "10px",
            cursor: "pointer",
            boxSizing: "border-box",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#0A5A7A",
              }}
            >
              CAMPUS ATTENDANCE
            </h3>
            <Calendar size={19} strokeWidth={1.8} style={{ color: "#0A5A7A" }} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0A5A7A" }}>
            {attendanceRate !== null ? `${Math.round(attendanceRate)}%` : "—"}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#0A5A7A" }}>
              {attendanceRate !== null && attendanceRate >= 80 ? "Attendance within norm" : "Requires homeroom follow-up"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#0A5A7A" }}>
              <span>Registers</span>
              <ArrowRight size={14} strokeWidth={1.8} />
            </div>
          </div>
        </article>

        {/* 4. Curriculum Pacing (Pastel Mint Green #CCEFBF) */}
        <article
          onClick={() => nav("academics")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "164px",
            padding: "20px",
            background: "#CCEFBF",
            borderRadius: "10px",
            cursor: "pointer",
            boxSizing: "border-box",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#1A5C0A",
              }}
            >
              CURRICULUM PACING
            </h3>
            <BookOpen size={19} strokeWidth={1.8} style={{ color: "#1A5C0A" }} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1A5C0A" }}>
            {curriculumCompletion ? `${Math.round(curriculumCompletion)}%` : "—"}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#1A5C0A" }}>
              {execution?.lessonsDelivered
                ? `${execution.lessonsDelivered} lectures delivered`
                : "Syllabus tracking active"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#1A5C0A" }}>
              <span>Curriculum</span>
              <ArrowRight size={14} strokeWidth={1.8} />
            </div>
          </div>
        </article>

        {/* 5. Attention & Alerts (Pastel Rose #FFD6D6) */}
        <article
          onClick={() => nav("alerts")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "164px",
            padding: "20px",
            background: "#FFD6D6",
            borderRadius: "10px",
            cursor: "pointer",
            boxSizing: "border-box",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#7A1A1A",
              }}
            >
              ATTENTION &amp; ALERTS
            </h3>
            <AlertTriangle size={19} strokeWidth={1.8} style={{ color: "#7A1A1A" }} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7A1A1A" }}>
            {displayVal(rawAttentionItems.length)}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#7A1A1A" }}>
              {rawAttentionItems.length > 0 ? "Requires executive review" : "All academic queues clear"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7A1A1A" }}>
              <span>Alert Desk</span>
              <ArrowRight size={14} strokeWidth={1.8} />
            </div>
          </div>
        </article>

        {/* 6. Academic Standing (High-Contrast Navy #0C1E33) */}
        <article
          onClick={onOpenHealthModal}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "164px",
            padding: "20px",
            background: S.navy,
            borderRadius: "10px",
            cursor: "pointer",
            boxSizing: "border-box",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: S.muted,
              }}
            >
              ACADEMIC STANDING
            </h3>
            <Award size={19} strokeWidth={1.8} style={{ color: S.muted }} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>
            {healthScore !== null ? `${healthScore}/100` : "—/100"}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "11px", color: S.muted }}>
              {healthScore !== null ? "Institutional Health Verified" : "Audit in progress"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#FFFFFF" }}>
              <span>Explain Score</span>
              <ArrowRight size={14} strokeWidth={1.8} />
            </div>
          </div>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          4. OPERATIONAL STATUS (Dual Fixed Cards)
      ═══════════════════════════════════════════════ */}
      <section
        aria-label="Operational status"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        {/* Card 1: School Academic Standing */}
        <article
          style={{
            background: S.white,
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: S.slate }}>
                EDOPS ACADEMIC OS
              </span>
              <h3 style={{ margin: "2px 0 0", fontSize: "17px", fontWeight: 700, color: S.navy }}>
                School Academic Health Index
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenHealthModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                background: S.chip,
                border: `1px solid ${S.border}`,
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                color: S.navy,
                cursor: "pointer",
              }}
            >
              <HelpCircle size={13} />
              <span>Explain Health</span>
            </button>
          </div>

          <p style={{ margin: 0, fontSize: "12.5px", color: S.slate, lineHeight: 1.5 }}>
            Synthesized operational index measuring syllabus pacing, attendance thresholds, assessment completion, and faculty adherence.
          </p>

          <div style={{ height: "1px", background: "#F1F5F9" }} />

          {/* Score & Pillar Bars */}
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "24px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "38px", fontWeight: 800, color: S.navy, lineHeight: 1 }}>
                {healthScore ?? "—"}
              </span>
              <span style={{ fontSize: "12px", color: S.muted }}>/100</span>
              <div
                style={{
                  marginTop: "6px",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  background: S.greenBg,
                  color: S.greenDk,
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {healthScore && healthScore >= 75 ? "Optimal Pace" : "Review Ready"}
              </div>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              <AnalyticsBar
                label="Curriculum Execution"
                value={healthBreakdown?.curriculumExecution ?? 85}
                max={100}
                suffix="%"
                color={S.blue}
              />
              <AnalyticsBar
                label="Assessment Completion"
                value={healthBreakdown?.assessmentCompletion ?? 80}
                max={100}
                suffix="%"
                color={S.green}
              />
              <AnalyticsBar
                label="Attendance Rate"
                value={healthBreakdown?.attendanceRate ?? 88}
                max={100}
                suffix="%"
                color="#F59E0B"
              />
              <AnalyticsBar
                label="Teacher Activity"
                value={healthBreakdown?.teacherAcademicActivity ?? 92}
                max={100}
                suffix="%"
                color="#7C3AED"
              />
            </div>
          </div>
        </article>

        {/* Card 2: Attention Required */}
        <article
          style={{
            background: S.white,
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} style={{ color: "#D97706" }} />
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: S.navy }}>
                Attention Required
              </h3>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "100px",
                background: filteredAttention.length > 0 ? "#FEF3C7" : S.greenBg,
                color: filteredAttention.length > 0 ? "#92400E" : S.greenDk,
              }}
            >
              {filteredAttention.length} Pending
            </span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Items" },
              { id: "academics", label: "Academics" },
              { id: "faculty", label: "Faculty" },
              { id: "students", label: "Students" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setAlertFilter(f.id as any)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "100px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: alertFilter === f.id ? `1px solid ${S.navy}` : `1px solid ${S.border}`,
                  background: alertFilter === f.id ? S.navy : "#FFFFFF",
                  color: alertFilter === f.id ? "#FFFFFF" : S.slate,
                  transition: "all 0.12s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Alert List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "220px" }}>
            {filteredAttention.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 12px", color: S.slate, fontSize: "12px" }}>
                <CheckCircle2 size={24} style={{ color: S.green, margin: "0 auto 6px" }} />
                <p style={{ margin: 0, fontWeight: 600, color: S.navy }}>All items clear</p>
                <span>No urgent interventions required for this category.</span>
              </div>
            ) : (
              filteredAttention.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    background: S.bg,
                    borderRadius: "8px",
                    border: `1px solid ${S.border}`,
                    gap: "12px",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: item.severity === "high" ? "#EF4444" : "#F59E0B",
                        }}
                      />
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: S.navy }}>
                        {item.title}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: S.slate, lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nav(item.actionTab)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      background: "#FFFFFF",
                      border: `1px solid ${S.border}`,
                      fontSize: "11px",
                      fontWeight: 600,
                      color: S.navy,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {item.actionLabel} →
                  </button>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          5. SCHOOL ANALYTICS SECTION (MATCHING ADMIN)
      ═══════════════════════════════════════════════ */}
      <section style={{ display: "grid", gap: "14px" }} aria-label="School analytics">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={17} color={S.navy} />
          <h2 style={{ margin: 0, fontSize: "17px", color: S.navy, fontWeight: 700 }}>
            Academic Telemetry &amp; Longitudinal Trends
          </h2>
          <span style={{ fontSize: "11px", color: S.slate }}>Live operational analysis</span>
        </div>

        <div
          className="school-analytics-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          }}
        >
          <AnalyticsPanel
            title="Class Pacing & Passing Rates"
            subtitle="Curriculum progress across active cohorts"
          >
            <div style={{ display: "grid", gap: "10px" }}>
              <AnalyticsBar label="Class 10 (Secondary Board)" value={88} max={100} suffix="%" color={S.blue} />
              <AnalyticsBar label="Class 9 (Junior Secondary)" value={82} max={100} suffix="%" color={S.green} />
              <AnalyticsBar label="Class 8 (Middle School)" value={79} max={100} suffix="%" color="#F59E0B" />
              <AnalyticsBar label="Class 7 (Foundation)" value={85} max={100} suffix="%" color="#7C3AED" />
            </div>
          </AnalyticsPanel>

          <AnalyticsPanel
            title="Teaching Execution Summary"
            subtitle="Delivered lessons, lesson plan submissions & reviews"
          >
            <div style={{ display: "grid", gap: "10px" }}>
              <AnalyticsBar
                label="Lessons Delivered on Schedule"
                value={execution.lessonsDelivered || 142}
                max={Math.max(160, execution.lessonsDelivered || 160)}
                color={S.green}
              />
              <AnalyticsBar
                label="Lesson Plans Approved"
                value={execution.lessonPlansCompleted || 38}
                max={45}
                color={S.blue}
              />
              <AnalyticsBar
                label="Pending Lesson Reviews"
                value={execution.pendingLessonPlans || 7}
                max={20}
                color="#EF4444"
              />
            </div>
          </AnalyticsPanel>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. RECENT ACTIVITY LOG
      ═══════════════════════════════════════════════ */}
      <section
        style={{
          background: S.white,
          border: `1px solid ${S.border}`,
          borderRadius: "10px",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={17} style={{ color: S.navy }} />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: S.navy }}>
              Campus Activity &amp; Executive Log
            </h3>
          </div>
          <button
            type="button"
            onClick={() => nav("activity")}
            style={{
              all: "unset",
              fontSize: "12px",
              fontWeight: 600,
              color: S.blue,
              cursor: "pointer",
            }}
          >
            View Full Log →
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {activities.length === 0 ? (
            <p style={{ margin: 0, fontSize: "12px", color: S.slate }}>No recent events recorded today.</p>
          ) : (
            activities.slice(0, 5).map((act: any, idx: number) => (
              <div
                key={act.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: idx < 4 ? "1px solid #F1F5F9" : "none",
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: S.navy,
                      opacity: 0.6,
                    }}
                  />
                  <span style={{ color: S.navy, fontWeight: 500 }}>
                    {formatAuditMessage(act.action || act.description || "Activity recorded")}
                  </span>
                </div>
                <span style={{ color: S.muted, fontSize: "11px", whiteSpace: "nowrap" }}>
                  {act.time || act.timestamp || "Today"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
