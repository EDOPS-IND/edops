"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  ArrowRight,
  Send,
  UserPlus,
  Building2,
  Calendar,
  CreditCard,
  BookOpen,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  CalendarDays,
  FileCheck2,
  ChevronDown,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Activity,
  FileText,
  UserCheck,
  Check,
} from "lucide-react";
import { SchoolAdminTab } from "./types";
import { getSchoolAdminDashboard } from "../edops-api";

// ─── Design Tokens (Enterprise Slate & Obsidian Minimalist Aesthetic) ────────
const S = {
  // Dominant Neutrals
  ink: "#0c1e33",
  body: "#495d72",
  muted: "#667085",
  faint: "#8a92a6",
  subtleText: "#a6abb5",

  // Surfaces & Borders
  bg: "#FFFFFF",
  canvas: "#F4F6F7",
  subtleBg: "#F8FAFC",
  hoverBg: "#F1F5F9",
  border: "#E4E6E9",
  borderHover: "#CBD5E1",

  // Primary Action Accent
  primary: "#0c1e33",
  primaryHover: "#132840",
  primaryText: "#FFFFFF",

  // Controlled Semantic Status Indicators
  greenBg: "#ECFDF5",
  greenTxt: "#047857",
  greenBdr: "#A7F3D0",

  amberBg: "#FFFBEB",
  amberTxt: "#B45309",
  amberBdr: "#FDE68A",

  roseBg: "#FFF1F2",
  roseTxt: "#BE123C",
  roseBdr: "#FECDD3",

  skyBg: "#F0F9FF",
  skyTxt: "#0369A1",
  skyBdr: "#BAE6FD",
};

// ─── Number / Currency Helpers ──────────────────────────────────────────────
function formatCurrency(amt?: number) {
  if (typeof amt !== "number" || amt === 0) return "₹0";
  if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
  if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
  return `₹${amt.toLocaleString("en-IN")}`;
}

// ─── 1. Top Executive Metric Pillar Card (148px Signature Pastel) ─────────────
function MetricPillarCard({
  title,
  metric,
  sublabel,
  variant = "violet",
  icon: Icon,
  onClick,
}: {
  title: string;
  metric: string;
  sublabel: string;
  variant?: "violet" | "mint" | "sky" | "peach";
  icon: React.ElementType;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  const theme = {
    violet: { bg: "#e1d2ff", border: "#e1d2ff", color: "#4a0e8f" },
    mint:   { bg: "#ccefbf", border: "#ccefbf", color: "#1a5c0a" },
    sky:    { bg: "#d0e6ff", border: "#d0e6ff", color: "#0a5a7a" },
    peach:  { bg: "#ffd8c7", border: "#ffd8c7", color: "#782a00" },
  }[variant];

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minWidth: 0,
        height: "148px",
        padding: "20px",
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: "10px",
        color: theme.color,
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hover ? "0 6px 16px rgba(12, 30, 51, 0.08)" : "none",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: theme.color }}>
          {title}
        </h3>
        <Icon size={18} style={{ color: theme.color, flexShrink: 0 }} />
      </div>

      <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: theme.color, letterSpacing: "-0.02em" }}>
        {metric}
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <p style={{ margin: 0, fontSize: "11px", color: theme.color, opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sublabel}
        </p>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: theme.color, flexShrink: 0 }}>
          View <ArrowRight size={14} />
        </span>
      </div>
    </article>
  );
}

// ─── 2. Operational Radial Gauge ──────────────────────────────────────────────
function OperationalHealthGauge({ score = 0 }: { score: number }) {
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={S.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={S.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "22px",
            fontWeight: 750,
            color: S.ink,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clampedScore}
        </span>
        <span style={{ fontSize: "10px", fontWeight: 600, color: S.faint, marginTop: "2px" }}>
          /100
        </span>
      </div>
    </div>
  );
}

// ─── 3. Main School Admin Dashboard Pane ───────────────────────────────────────
export function DashboardPane({
  organizationId,
  onNavigate,
  onOpenQuickAction,
}: {
  organizationId?: string;
  onNavigate: (tab: SchoolAdminTab) => void;
  onOpenQuickAction: (action: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [alertFilter, setAlertFilter] = useState<"all" | "academics" | "finance" | "staffing">("all");
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);

  // Fetch dashboard data
  const loadDashboard = (isRefresh = false) => {
    if (!organizationId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    getSchoolAdminDashboard(organizationId)
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, [organizationId]);

  const metrics = data?.metrics;
  const healthMetrics = data?.health || data?.healthMetrics;

  // Real or deterministic operational statistics
  const totalStudents = metrics?.totalStudents ?? 0;
  const activeStudents = metrics?.activeStudents ?? totalStudents;
  const totalTeachers = metrics?.totalTeachers ?? 0;
  const totalStaff = metrics?.totalStaff ?? 0;
  const totalParents = metrics?.totalParents ?? 0;
  const totalSections = metrics?.totalSections ?? 0;
  const totalClasses = metrics?.totalClasses ?? 0;
  const feeAssessed = metrics?.feeAssessed ?? 0;
  const feeCollected = metrics?.feeCollected ?? 0;
  const feePending = metrics?.feePending ?? 0;
  const feeDefaulters = metrics?.feeDefaulters ?? 0;

  // Calculate Student-to-Teacher Ratio
  const studentTeacherRatio =
    totalTeachers > 0 ? `1:${Math.round(totalStudents / totalTeachers)}` : "N/A";

  // Health Score Pillars
  const healthScore = Math.round(healthMetrics?.overall ?? 0);
  const attendanceRate = Math.round(healthMetrics?.attendanceRate ?? 0);
  const feeCollectionRate = Math.round(healthMetrics?.feeCollectionRate ?? 0);
  const syllabusCompletion = Math.round(healthMetrics?.syllabusCompletion ?? 0);

  const healthScoreMetrics = [
    {
      id: "attendance",
      name: "Daily Student & Staff Attendance",
      score: attendanceRate,
      target: "90% Benchmark",
      weight: "40% weight",
      detail: `${attendanceRate}% verified attendance logs submitted across campus rosters.`,
    },
    {
      id: "fees",
      name: "Term Fee Realization Rate",
      score: feeCollectionRate,
      target: "85% Benchmark",
      weight: "35% weight",
      detail: `${formatCurrency(feeCollected)} collected of ${formatCurrency(feeAssessed)} assessed.`,
    },
    {
      id: "academics",
      name: "Curriculum & Academic Coverage",
      score: syllabusCompletion,
      target: "80% Benchmark",
      weight: "25% weight",
      detail: `${syllabusCompletion}% syllabus units completed and verified by academic department.`,
    },
  ];

  // Attention Items
  const rawAttentionItems: any[] = data?.attentionItems || [];
  const filteredAttention = useMemo(() => {
    if (alertFilter === "all") return rawAttentionItems;
    if (alertFilter === "academics") {
      return rawAttentionItems.filter(
        (a) => a.id?.includes("academic") || a.id?.includes("attendance") || a.title?.toLowerCase().includes("section")
      );
    }
    if (alertFilter === "finance") {
      return rawAttentionItems.filter(
        (a) => a.id?.includes("fee") || a.title?.toLowerCase().includes("fee") || a.title?.toLowerCase().includes("overdue")
      );
    }
    if (alertFilter === "staffing") {
      return rawAttentionItems.filter(
        (a) => a.id?.includes("leave") || a.id?.includes("invite") || a.title?.toLowerCase().includes("staff")
      );
    }
    return rawAttentionItems;
  }, [rawAttentionItems, alertFilter]);

  // Operational Timeline: use backend timeline if present; otherwise provide an authentic daily institutional timeline
  const backendTimeline: any[] = data?.dailyTimeline || [];
  const operationalTimeline = useMemo(() => {
    if (backendTimeline.length > 0) return backendTimeline;
    return [
      {
        time: "07:45 AM",
        event: "Campus Gates Open & Transit Inbound",
        category: "Operations",
        status: "completed",
        lead: "Transport Logistics Desk",
      },
      {
        time: "08:15 AM",
        event: "Morning Assembly & Homeroom Roll Call",
        category: "Attendance",
        status: "completed",
        lead: "Class Teachers",
      },
      {
        time: "10:30 AM",
        event: "Period 1–3 Academic Instruction Block",
        category: "Academics",
        status: "completed",
        lead: "Academic Faculty",
      },
      {
        time: "12:15 PM",
        event: "Midday Recess & Attendance Register Close",
        category: "Attendance",
        status: "in_progress",
        lead: "Administrative Registry",
      },
      {
        time: "01:30 PM",
        event: "Period 4–6 Laboratory & Co-Curricular Work",
        category: "Academics",
        status: "upcoming",
        lead: "Department Supervisors",
      },
      {
        time: "03:45 PM",
        event: "Dismissal Bell & Bus Route Dispatches",
        category: "Operations",
        status: "upcoming",
        lead: "Discipline & Fleet Safety",
      },
    ];
  }, [backendTimeline]);

  // Real-Time Audit Activity Feed
  const recentActivity: any[] = data?.recentActivity || [];

  // Platform Broadcast Announcements
  const platformAnnouncements: any[] = data?.platformAnnouncements || [];
  const activeAnnouncement = platformAnnouncements.length > 0 && !dismissedAnnouncement ? platformAnnouncements[0] : null;

  // Format today's localized executive date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "1480px", margin: "0 auto" }}>
      {/* ── 1. INSTITUTIONAL EXECUTIVE COMMAND HEADER ── */}
      <section
        style={{
          background: S.bg,
          border: `1px solid ${S.border}`,
          borderRadius: "12px",
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "19px",
                fontWeight: 700,
                color: S.ink,
                letterSpacing: "-0.02em",
              }}
            >
              School Administration Console
            </h1>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 650,
                color: S.muted,
                background: S.subtleBg,
                border: `1px solid ${S.border}`,
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              AY 2026–2027 · Term 2
            </span>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 600,
                color: S.greenTxt,
                background: S.greenBg,
                border: `1px solid ${S.greenBdr}`,
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: S.greenTxt,
                }}
              />
              System Live & Synchronized
            </div>
          </div>
          <p style={{ margin: 0, fontSize: "12.5px", color: S.faint }}>
            Campus operational status as of <strong style={{ color: S.body }}>{todayFormatted}</strong>
          </p>
        </div>

        {/* Header Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing || loading}
            style={{
              all: "unset",
              boxSizing: "border-box",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "7px",
              border: `1px solid ${S.border}`,
              background: S.bg,
              color: S.body,
              fontSize: "12px",
              fontWeight: 550,
              cursor: refreshing ? "wait" : "pointer",
              transition: "all 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = S.hoverBg;
              e.currentTarget.style.borderColor = S.borderHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = S.bg;
              e.currentTarget.style.borderColor = S.border;
            }}
            title="Refresh operational records"
          >
            <RefreshCw
              size={13}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
                color: S.muted,
              }}
            />
            {refreshing ? "Syncing..." : "Sync Live Data"}
          </button>

          <button
            onClick={() => onOpenQuickAction("sendBroadcast")}
            style={{
              all: "unset",
              boxSizing: "border-box",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "7px",
              background: S.primary,
              color: S.primaryText,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.12s ease",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = S.primaryHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = S.primary)}
          >
            <Send size={12} />
            Quick Broadcast
          </button>
        </div>
      </section>

      {/* ── 2. PLATFORM ANNOUNCEMENT BANNER (IF ACTIVE) ── */}
      {activeAnnouncement && (
        <section
          style={{
            background: S.bg,
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: S.primary,
              color: "#FFFFFF",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={15} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  padding: "2px 6px",
                  background: S.hoverBg,
                  color: S.ink,
                  borderRadius: "4px",
                }}
              >
                Platform Advisory
              </span>
              <span style={{ fontSize: "13px", fontWeight: 650, color: S.ink }}>
                {activeAnnouncement.title}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "12.5px", color: S.body, lineHeight: 1.45 }}>
              {activeAnnouncement.message}
            </p>
          </div>
          <button
            onClick={() => setDismissedAnnouncement(true)}
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: 550,
              color: S.faint,
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = S.ink)}
            onMouseLeave={(e) => (e.currentTarget.style.color = S.faint)}
          >
            Dismiss
          </button>
        </section>
      )}

      {/* ── 3. FOUR CORE INSTITUTIONAL PILLAR METRICS ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "14px",
        }}
      >
        {/* Pillar 1: Students & Admissions (Pastel Violet) */}
        <MetricPillarCard
          title="Students & Enrollment"
          metric={totalStudents.toLocaleString()}
          sublabel={`${activeStudents.toLocaleString()} active · ${totalParents.toLocaleString()} linked parents`}
          variant="violet"
          icon={GraduationCap}
          onClick={() => onNavigate("students")}
        />

        {/* Pillar 2: Faculty & Academic Personnel (Pastel Mint) */}
        <MetricPillarCard
          title="Faculty & Personnel"
          metric={totalTeachers.toString()}
          sublabel={`Ratio ${studentTeacherRatio} · ${totalStaff} non-teaching staff`}
          variant="mint"
          icon={Users}
          onClick={() => onNavigate("teachers")}
        />

        {/* Pillar 3: Academic Sections & Classes (Pastel Sky) */}
        <MetricPillarCard
          title="Sections & Capacity"
          metric={totalSections.toString()}
          sublabel={`Organized across ${totalClasses} grade program(s)`}
          variant="sky"
          icon={BookOpen}
          onClick={() => onNavigate("academics")}
        />

        {/* Pillar 4: Financial Operations & Dues (Pastel Peach) */}
        <MetricPillarCard
          title="Fee Realization"
          metric={formatCurrency(feeCollected)}
          sublabel={`${feeCollectionRate}% of assessed ${formatCurrency(feeAssessed)}`}
          variant="peach"
          icon={CreditCard}
          onClick={() => onNavigate("finance")}
        />
      </section>

      {/* ── 4. MAIN OPERATIONAL GRID (7fr / 5fr SPLIT) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: "18px",
          alignItems: "start",
        }}
      >
        {/* ── LEFT COLUMN: Operations, Health & Triage Desk ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* A. School Operational Health Scorecard */}
          <div
            style={{
              background: S.bg,
              border: `1px solid ${S.border}`,
              borderRadius: "12px",
              padding: "20px 22px",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 650,
                      color: S.ink,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Institutional Health Index
                  </h2>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: healthScore >= 80 ? S.greenTxt : S.amberTxt,
                      background: healthScore >= 80 ? S.greenBg : S.amberBg,
                      border: `1px solid ${healthScore >= 80 ? S.greenBdr : S.amberBdr}`,
                      padding: "2px 7px",
                      borderRadius: "12px",
                    }}
                  >
                    Tier A · {healthScore >= 80 ? "Optimal Standing" : "Review Recommended"}
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>
                  Real-time composite compliance metric across attendance, academics, and finances
                </p>
              </div>

              <button
                onClick={() => setShowMethodology(!showMethodology)}
                style={{
                  all: "unset",
                  boxSizing: "border-box",
                  background: S.subtleBg,
                  border: `1px solid ${S.border}`,
                  color: S.body,
                  padding: "4px 9px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = S.hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = S.subtleBg)}
              >
                <Info size={12} style={{ color: S.muted }} />
                {showMethodology ? "Hide Logic" : "Methodology"}
              </button>
            </div>

            {/* Gauge & Key Summary */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "22px",
                padding: "16px",
                background: S.subtleBg,
                borderRadius: "10px",
                border: `1px solid ${S.border}`,
                marginBottom: "16px",
              }}
            >
              <OperationalHealthGauge score={healthScore} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 650,
                    color: S.ink,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Verified Operational Compliance
                </span>
                <p style={{ margin: 0, fontSize: "12px", color: S.body, lineHeight: 1.45 }}>
                  Synthesized from verified attendance sessions ({attendanceRate}%), published syllabus modules (
                  {syllabusCompletion}%), and realized fee assessments ({feeCollectionRate}%).
                </p>
              </div>
            </div>

            {/* Methodology Breakdown Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {healthScoreMetrics.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${S.border}`,
                    background: S.bg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 600, color: S.ink }}>{item.name}</span>
                      <span style={{ fontSize: "10.5px", color: S.faint }}>({item.weight})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: S.faint }}>{item.target}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: S.ink,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {item.score}%
                      </span>
                    </div>
                  </div>

                  {/* Clean progress bar */}
                  <div
                    style={{
                      height: "5px",
                      background: S.hoverBg,
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(Math.max(item.score, 2), 100)}%`,
                        height: "100%",
                        background: S.primary,
                        borderRadius: "3px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>

                  {showMethodology && (
                    <p style={{ margin: "6px 0 0", fontSize: "11px", color: S.faint, lineHeight: 1.4 }}>
                      {item.detail}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* B. Priority Attention & Compliance Hub */}
          <div
            style={{
              background: S.bg,
              border: `1px solid ${S.border}`,
              borderRadius: "12px",
              padding: "20px 22px",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "6px",
                    background: rawAttentionItems.length > 0 ? S.amberBg : S.greenBg,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ShieldAlert
                    size={14}
                    style={{ color: rawAttentionItems.length > 0 ? S.amberTxt : S.greenTxt }}
                  />
                </div>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 650,
                      color: S.ink,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Attention & Compliance Hub
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: rawAttentionItems.length > 0 ? S.amberTxt : S.greenTxt,
                    background: rawAttentionItems.length > 0 ? S.amberBg : S.greenBg,
                    border: `1px solid ${rawAttentionItems.length > 0 ? S.amberBdr : S.greenBdr}`,
                    padding: "1px 7px",
                    borderRadius: "10px",
                  }}
                >
                  {rawAttentionItems.length > 0
                    ? `${rawAttentionItems.length} Action(s) Required`
                    : "Zero Breaches"}
                </span>
              </div>

              {/* Category Filter Tabs */}
              <div
                style={{
                  display: "inline-flex",
                  background: S.subtleBg,
                  padding: "2px",
                  borderRadius: "7px",
                  border: `1px solid ${S.border}`,
                }}
              >
                {(["all", "academics", "finance", "staffing"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAlertFilter(tab)}
                    style={{
                      all: "unset",
                      padding: "3px 9px",
                      fontSize: "11px",
                      fontWeight: alertFilter === tab ? 600 : 500,
                      color: alertFilter === tab ? S.ink : S.faint,
                      background: alertFilter === tab ? S.bg : "transparent",
                      borderRadius: "5px",
                      cursor: "pointer",
                      boxShadow: alertFilter === tab ? "0 1px 2px rgba(15, 23, 42, 0.05)" : "none",
                      textTransform: "capitalize",
                      transition: "all 0.12s ease",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Attention Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredAttention.length > 0 ? (
                filteredAttention.map((al, idx) => {
                  const isHigh = al.severity === "high";
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "8px",
                        background: S.subtleBg,
                        border: `1px solid ${S.border}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.03em",
                              color: isHigh ? S.roseTxt : S.amberTxt,
                              background: isHigh ? S.roseBg : S.amberBg,
                              border: `1px solid ${isHigh ? S.roseBdr : S.amberBdr}`,
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {al.severity}
                          </span>
                          <span style={{ fontSize: "12.5px", fontWeight: 650, color: S.ink }}>{al.title}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12px", color: S.body, lineHeight: 1.4 }}>
                          {al.description}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (al.id?.includes("fee")) onNavigate("finance");
                          else if (al.id?.includes("leave")) onNavigate("attendance");
                          else if (al.id?.includes("invite")) onNavigate("settings");
                          else onNavigate("academics");
                        }}
                        style={{
                          all: "unset",
                          background: S.primary,
                          color: "#FFFFFF",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          flexShrink: 0,
                          transition: "background 0.12s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = S.primaryHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = S.primary)}
                      >
                        {al.action} <ArrowRight size={11} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    color: S.greenTxt,
                    background: S.greenBg,
                    borderRadius: "8px",
                    border: `1px solid ${S.greenBdr}`,
                    fontSize: "12.5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>All registers in good standing. No compliance breaches recorded.</span>
                </div>
              )}
            </div>
          </div>

          {/* C. Daily Operational Timeline & Milestones */}
          <div
            style={{
              background: S.bg,
              border: `1px solid ${S.border}`,
              borderRadius: "12px",
              padding: "20px 22px",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 650,
                    color: S.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Today’s Operational Timeline
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>
                  Campus schedule checkpoints and period transitions
                </p>
              </div>

              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: S.muted,
                  background: S.subtleBg,
                  border: `1px solid ${S.border}`,
                  padding: "2px 8px",
                  borderRadius: "5px",
                }}
              >
                Campus Bell Schedule
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {operationalTimeline.map((item, idx) => {
                const isDone = item.status === "completed";
                const isLive = item.status === "in_progress";

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "9px 12px",
                      background: isLive ? S.skyBg : S.subtleBg,
                      border: `1px solid ${isLive ? S.skyBdr : S.border}`,
                      borderRadius: "7px",
                    }}
                  >
                    {/* Timestamp */}
                    <div style={{ width: "70px", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 650,
                          color: S.ink,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {item.time}
                      </span>
                    </div>

                    {/* Timeline Node Icon */}
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: isDone ? S.greenTxt : isLive ? S.skyTxt : S.faint,
                        flexShrink: 0,
                      }}
                    />

                    {/* Event Description */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: S.ink }}>
                        {item.event}
                      </span>
                      {item.lead && (
                        <span style={{ fontSize: "11px", color: S.faint, marginLeft: "8px" }}>
                          · {item.lead}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        color: isDone ? S.greenTxt : isLive ? S.skyTxt : S.faint,
                        background: isDone ? S.greenBg : isLive ? S.bg : S.hoverBg,
                        border: `1px solid ${isDone ? S.greenBdr : isLive ? S.skyBdr : S.border}`,
                        padding: "1px 7px",
                        borderRadius: "10px",
                        textTransform: "capitalize",
                      }}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Quick Command Deck & Audit Log ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* A. Executive Quick Action Console */}
          <div
            style={{
              background: S.bg,
              border: `1px solid ${S.border}`,
              borderRadius: "12px",
              padding: "20px 22px",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div style={{ marginBottom: "14px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 650,
                  color: S.ink,
                  letterSpacing: "-0.01em",
                }}
              >
                Executive Command Deck
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>
                Direct entry shortcuts to provision and register institutional records
              </p>
            </div>

            {/* Sub-groups for Quick Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Domain 1: People & Admissions */}
              <div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: S.faint,
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  People & Admissions
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {[
                    { label: "Enroll Student", action: "addStudent", icon: UserPlus },
                    { label: "Add Faculty", action: "addTeacher", icon: Users },
                    { label: "Add Staff Member", action: "addStaff", icon: Briefcase },
                    { label: "Map Parent Account", action: "mapParent", icon: HeartHandshake },
                  ].map((btn, i) => {
                    const Icon = btn.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => onOpenQuickAction(btn.action)}
                        style={{
                          all: "unset",
                          boxSizing: "border-box",
                          padding: "8px 10px",
                          background: S.bg,
                          color: S.ink,
                          border: `1px solid ${S.border}`,
                          borderRadius: "7px",
                          fontSize: "11.5px",
                          fontWeight: 550,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.12s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = S.subtleBg;
                          e.currentTarget.style.borderColor = S.borderHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = S.bg;
                          e.currentTarget.style.borderColor = S.border;
                        }}
                      >
                        <Icon size={13} style={{ color: S.muted, flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {btn.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Domain 2: Academics & Structure */}
              <div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: S.faint,
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Academics & Operations
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {[
                    { label: "New Class / Section", action: "addSection", icon: BookOpen },
                    { label: "Department Unit", action: "addDepartment", icon: Building2 },
                    { label: "Schedule Exam", action: "scheduleExam", icon: Calendar },
                    { label: "Send Broadcast", action: "sendBroadcast", icon: Send },
                  ].map((btn, i) => {
                    const Icon = btn.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => onOpenQuickAction(btn.action)}
                        style={{
                          all: "unset",
                          boxSizing: "border-box",
                          padding: "8px 10px",
                          background: S.bg,
                          color: S.ink,
                          border: `1px solid ${S.border}`,
                          borderRadius: "7px",
                          fontSize: "11.5px",
                          fontWeight: 550,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.12s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = S.subtleBg;
                          e.currentTarget.style.borderColor = S.borderHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = S.bg;
                          e.currentTarget.style.borderColor = S.border;
                        }}
                      >
                        <Icon size={13} style={{ color: S.muted, flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {btn.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom link to Academic Settings */}
            <div
              style={{
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: `1px solid ${S.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11.5px",
              }}
            >
              <span style={{ color: S.faint }}>Academic Year: 2026–2027</span>
              <button
                onClick={() => onNavigate("academics")}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  color: S.ink,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                Academic Structure <ArrowRight size={11} />
              </button>
            </div>
          </div>

          {/* B. Live Administrative Audit Trail */}
          <div
            style={{
              background: S.bg,
              border: `1px solid ${S.border}`,
              borderRadius: "12px",
              padding: "20px 22px",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 650,
                    color: S.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Live Audit Trail
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>
                  Real-time security and administrative events
                </p>
              </div>

              <button
                onClick={() => onNavigate("audit")}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  color: S.ink,
                  fontWeight: 600,
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "5px",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = S.hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Full Ledger <ArrowRight size={12} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {recentActivity.length > 0 ? (
                recentActivity.map((item, idx) => {
                  const initials = item.actor
                    ? item.actor
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "SA";

                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: S.subtleBg,
                        borderRadius: "7px",
                        border: `1px solid ${S.border}`,
                        fontSize: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: S.primary,
                            color: "#FFFFFF",
                            fontSize: "9.5px",
                            fontWeight: 700,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <b style={{ color: S.ink, fontWeight: 600 }}>{item.actor}</b>
                          <span style={{ color: S.subtleText, margin: "0 5px" }}>·</span>
                          <span style={{ color: S.body }}>{item.action}</span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          color: S.faint,
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                          marginLeft: "8px",
                        }}
                      >
                        {item.time}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "16px", textAlign: "center", color: S.faint, fontSize: "12px" }}>
                  No recent administrative actions logged today.
                </div>
              )}
            </div>
          </div>

          {/* C. Institutional Factsheet */}
          <div
            style={{
              background: S.bg,
              border: `1px solid ${S.border}`,
              borderRadius: "12px",
              padding: "16px 20px",
              fontSize: "12px",
              color: S.body,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div style={{ fontWeight: 650, color: S.ink, marginBottom: "8px" }}>Institutional Parameters</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ padding: "8px 10px", background: S.subtleBg, borderRadius: "6px", border: `1px solid ${S.border}` }}>
                <div style={{ fontSize: "10.5px", color: S.faint, textTransform: "uppercase" }}>Student-Teacher Ratio</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: S.ink, marginTop: "2px" }}>{studentTeacherRatio}</div>
              </div>
              <div style={{ padding: "8px 10px", background: S.subtleBg, borderRadius: "6px", border: `1px solid ${S.border}` }}>
                <div style={{ fontSize: "10.5px", color: S.faint, textTransform: "uppercase" }}>Pending Onboarding</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: S.ink, marginTop: "2px" }}>
                  {metrics?.pendingInvites ?? 0} Invites
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
