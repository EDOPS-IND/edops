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
  HelpCircle,
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
  Award,
} from "lucide-react";
import { SchoolAdminTab } from "./types";
import { getSchoolAdminDashboard, getSchoolAdminAcademics } from "../edops-api";
import { formatAuditMessage, formatAuditBadge } from "../components/audit-formatter";

// ─── Design Tokens strictly matching Student & Teacher Dashboard specification ──
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
  greenBg: "#d9eed1",
  green: "#61a249",
  greenDk: "#1a5c0a",
  track: "#eceef3",
};

// ─── Number / Currency Helpers ──────────────────────────────────────────────
function formatCurrency(amt?: number) {
  if (typeof amt !== "number" || amt === 0) return "₹0";
  if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
  if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
  return `₹${amt.toLocaleString("en-IN")}`;
}

interface DashboardPaneProps {
  organizationId?: string;
  onNavigate: (tab: SchoolAdminTab) => void;
  onOpenQuickAction: (action: string) => void;
}

export const DashboardPane: React.FC<DashboardPaneProps> = ({
  organizationId = "",
  onNavigate,
  onOpenQuickAction,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeAcademicYear, setActiveAcademicYear] = useState<string | null>(null);
  const [showHealthExplainer, setShowHealthExplainer] = useState(false);
  const [alertFilter, setAlertFilter] = useState<"all" | "academics" | "finance" | "staffing">("all");

  const loadDashboard = () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getSchoolAdminDashboard(organizationId)
      .then((res) => {
        setData(res);
        if (res?.academicYear) {
          setActiveAcademicYear(res.academicYear);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));

    // Fetch live academic year from academics register
    getSchoolAdminAcademics(organizationId)
      .then((acad) => {
        const cur = acad?.currentYear || acad?.academicYears?.find((y: any) => y.is_current || y.isCurrent) || acad?.academicYears?.[0];
        if (cur?.name) {
          setActiveAcademicYear(cur.name);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
  }, [organizationId]);

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: S.slate }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            border: `3px solid ${S.line}`,
            borderTopColor: S.navy,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: "13px", fontWeight: 600, color: S.slate, margin: 0 }}>
          Loading administrative command center...
        </p>
      </div>
    );
  }

  const metrics = data?.metrics;
  const healthMetrics = data?.health || data?.healthMetrics;

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

  const currentAcademicYear = activeAcademicYear || data?.academicYear;
  const academicYearBadge = currentAcademicYear
    ? (currentAcademicYear.toUpperCase().startsWith("AY") ? currentAcademicYear : `AY ${currentAcademicYear}`)
    : "No Academic Year Set";

  const studentTeacherRatio =
    totalTeachers > 0 ? `1:${Math.round(totalStudents / totalTeachers)}` : "N/A";

  const healthScore = typeof healthMetrics?.overall === "number" ? Math.round(healthMetrics.overall) : 0;
  const attendanceRate = typeof healthMetrics?.attendanceRate === "number" ? Math.round(healthMetrics.attendanceRate) : 0;
  const feeCollectionRate = typeof healthMetrics?.feeCollectionRate === "number" ? Math.round(healthMetrics.feeCollectionRate) : 0;
  const syllabusCompletion = typeof healthMetrics?.syllabusCompletion === "number" ? Math.round(healthMetrics.syllabusCompletion) : 0;

  // Live Attention Items from Backend
  const rawAttentionItems: any[] = Array.isArray(data?.attentionItems) ? data.attentionItems : [];

  const filteredAttention = rawAttentionItems.filter((a) => {
    if (alertFilter === "all") return true;
    if (alertFilter === "academics") return a.type === "academics" || a.id?.includes("attendance") || a.title?.toLowerCase().includes("section");
    if (alertFilter === "finance") return a.type === "finance" || a.id?.includes("fee");
    if (alertFilter === "staffing") return a.type === "staffing" || a.id?.includes("leave") || a.title?.toLowerCase().includes("staff");
    return true;
  });

  // Daily Campus Timeline from Backend
  const operationalTimeline: any[] = Array.isArray(data?.dailyTimeline) ? data.dailyTimeline : [];

  // Recent Activity Logs from Backend
  const recentActivity: any[] = Array.isArray(data?.recentActivity) ? data.recentActivity : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ═══════════════════════════════════════════════
          1. HERO BANNER WITH ADMINISTRATIVE ARTWORK
      ═══════════════════════════════════════════════ */}
      <section
        aria-labelledby="admin-greeting"
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
              👋
            </span>
            <h1
              id="admin-greeting"
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: 600,
                color: S.navy,
                letterSpacing: "-0.02em",
              }}
            >
              {(() => {
                const hour = new Date().getHours();
                const timeGreeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
                return `${timeGreeting}, School Administrator!`;
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
              School Administration Console
            </span>
            <span style={{ color: "#5c6b80" }}>/</span>
            <span>Academic Year {currentAcademicYear || "Not Set"}</span>
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
              All Systems Operational
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
            {/* Admit Student */}
            <button
              type="button"
              onClick={() => onOpenQuickAction("addStudent")}
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
              <UserPlus size={16} />
              <span>Admit Student</span>
            </button>

            {/* Fee Collection */}
            <button
              type="button"
              onClick={() => onNavigate("finance")}
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
              <CreditCard size={16} />
              <span>Fee Collection</span>
            </button>

            {/* Broadcast Notice */}
            <button
              type="button"
              onClick={() => onOpenQuickAction("sendBroadcast")}
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
              <Send size={16} />
              <span>Broadcast Notice</span>
            </button>
          </div>
        </div>

        {/* Dashboard Artwork Illustration */}
        <div className="dashboard-hero-illustration" style={{ flexShrink: 0, width: "251px", height: "196px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src="/studentdashboard.svg"
            alt="School Administration"
            width={251}
            height={196}
            style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. OPERATIONAL OVERVIEW HEADER
      ═══════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: S.navy }}>
            School Operational Overview &amp; Key Metrics
          </h2>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "100px",
              background: S.chip,
              fontSize: "10px",
              fontWeight: 600,
              color: S.slate,
              whiteSpace: "nowrap",
            }}
          >
            {academicYearBadge}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "11px", color: S.faint }}>
          Live synchronization with institutional registers
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          3. SIX 6-COLOR METRIC STAT CARDS (Picture-Perfect)
      ═══════════════════════════════════════════════ */}
      <section
        aria-label="Institutional metrics"
        className="portal-metrics-grid"
      >
        {/* 1. Total Students (Pastel Violet) */}
        <article
          onClick={() => onNavigate("students")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "148px",
            padding: "20px",
            background: "#e1d2ff",
            border: "1px solid #e1d2ff",
            borderRadius: "10px",
            color: "#4a0e8f",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>
              Total Students
            </h3>
            <GraduationCap size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
            {totalStudents.toLocaleString()}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {activeStudents.toLocaleString()} active in campus
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#4a0e8f" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 2. Faculty & Staff (Pastel Warm Amber) */}
        <article
          onClick={() => onNavigate("teachers")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "148px",
            padding: "20px",
            background: "#fde1ac",
            border: "1px solid #fde1ac",
            borderRadius: "10px",
            color: "#7a4a00",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>
              Faculty &amp; Staff
            </h3>
            <Users size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7a4a00" }}>
            {totalTeachers + totalStaff}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {totalTeachers} teachers · Ratio {studentTeacherRatio}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7a4a00" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 3. Campus Attendance (Pastel Sky Blue) */}
        <article
          onClick={() => onNavigate("attendance")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "148px",
            padding: "20px",
            background: "#bae5f5",
            border: "1px solid #bae5f5",
            borderRadius: "10px",
            color: "#0a5a7a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>
              Campus Attendance
            </h3>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
            {attendanceRate}%
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {attendanceRate >= 85 ? "Optimal attendance pace" : "Requires homeroom follow-up"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#0a5a7a" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 4. Fee Realization (Pastel Mint Green) */}
        <article
          onClick={() => onNavigate("finance")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "148px",
            padding: "20px",
            background: "#ccefbf",
            border: "1px solid #ccefbf",
            borderRadius: "10px",
            color: "#1a5c0a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>
              Fee Realization
            </h3>
            <CreditCard size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
            {feeCollectionRate}%
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {formatCurrency(feeCollected)} of {formatCurrency(feeAssessed)}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#1a5c0a" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 5. Fee Defaulters (Pastel Rose / Coral) */}
        <article
          onClick={() => onNavigate("finance")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "148px",
            padding: "20px",
            background: "#ffd6d6",
            border: "1px solid #ffd6d6",
            borderRadius: "10px",
            color: "#7a1a1a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>
              Fee Defaulters
            </h3>
            <ShieldAlert size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7a1a1a" }}>
            {feeDefaulters}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {formatCurrency(feePending)} overdue collections
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7a1a1a" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 6. Campus Health Score (Navy High-Contrast) */}
        <article
          onClick={() => setShowHealthExplainer(!showHealthExplainer)}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            height: "148px",
            padding: "20px",
            background: S.navy,
            border: `1px solid ${S.navy}`,
            borderRadius: "10px",
            color: S.muted,
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>
              Institutional Standing
            </h3>
            <Award size={18} color={S.muted} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#fff" }}>
            {healthScore}/100
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: S.muted }}>
              Verified compliance register
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#fff" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          4. OPERATIONAL STATUS (Dual Cards 1.2fr / 1.8fr)
      ═══════════════════════════════════════════════ */}
      <section
        aria-label="Operational status"
        className="portal-split-grid"
      >
        {/* Card 1: Institutional Standing */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "24px",
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <p style={{ margin: 0, fontSize: "10px", fontWeight: 600, color: S.slate }}>EDOPS</p>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: S.navy }}>
                Institutional Standing
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowHealthExplainer(!showHealthExplainer)}
              style={{
                all: "unset",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                fontWeight: 600,
                color: S.navy,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Explain Score <HelpCircle size={15} />
            </button>
          </div>

          <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5, color: S.slate }}>
            Deterministic metric score synthesized from verified attendance logs, fee realization, and academic delivery.
          </p>

          <div style={{ height: "1px", background: "#f2f2f2" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "80px", flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 600, lineHeight: 1, color: S.navy }}>
                {healthScore}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: S.slate }}>/100</p>
            </div>
            <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
              <span
                style={{
                  padding: "5px 9px",
                  borderRadius: "100px",
                  background: S.chip,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: S.navy,
                }}
              >
                {healthScore >= 80
                  ? "Tier A · Excellent Health"
                  : healthScore >= 60
                  ? "Tier B · Good Standing"
                  : healthScore > 0
                  ? "Tier C · Attention Needed"
                  : "Setup Required · No Data Yet"}
              </span>
              <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.6, color: S.slate }}>
                Verified attendance ({attendanceRate}%), term fee realization ({feeCollectionRate}%), and curriculum pacing ({syllabusCompletion}%) live in campus registers.
              </p>
            </div>
          </div>

          {showHealthExplainer && (
            <div
              style={{
                background: S.chip,
                border: `1px solid ${S.border}`,
                borderRadius: "8px",
                padding: "14px 16px",
                fontSize: "12px",
                color: S.slate,
              }}
            >
              <b style={{ color: S.navy }}>Verified metric pillars:</b>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                <div>• Attendance Turnout: <b>{attendanceRate}%</b> (40% weight)</div>
                <div>• Fee Realization: <b>{feeCollectionRate}%</b> (35% weight)</div>
                <div>• Syllabus Delivery: <b>{syllabusCompletion}%</b> (25% weight)</div>
                <div>• Student-Teacher Ratio: <b>{studentTeacherRatio}</b></div>
              </div>
            </div>
          )}
        </article>

        {/* Card 2: Attention Required */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "24px",
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <CheckCircle2 size={19} color={S.navy} />
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: S.navy }}>
                Attention Required
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Category Filter Pills */}
              <div style={{ display: "flex", background: S.chip, padding: "2px", borderRadius: "8px", gap: "2px" }}>
                {(["all", "academics", "finance", "staffing"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAlertFilter(cat)}
                    style={{
                      all: "unset",
                      padding: "3px 9px",
                      fontSize: "11px",
                      fontWeight: alertFilter === cat ? 600 : 500,
                      color: alertFilter === cat ? "#ffffff" : S.slate,
                      background: alertFilter === cat ? S.navy : "transparent",
                      borderRadius: "6px",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span
                style={{
                  padding: "5px 9px",
                  borderRadius: "100px",
                  background: filteredAttention.length > 0 ? "#FFFAEB" : S.greenBg,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: filteredAttention.length > 0 ? "#B54708" : S.green,
                }}
              >
                {filteredAttention.length > 0 ? `${filteredAttention.length} Notice(s)` : "All Clear"}
              </span>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: "13px", lineHeight: "normal", color: S.slate }}>
            Click any notice to open the corresponding administrative workflow.
          </p>

          {filteredAttention.length > 0 ? (
            <div style={{ display: "grid", gap: "10px" }}>
              {filteredAttention.map((al: any, idx: number) => {
                const isHigh = al.severity === "high" || al.severity === "critical";
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "6px",
                      background: S.chip,
                      border: `1px solid ${isHigh ? "#FECDCA" : "#FEDF89"}`,
                      display: "grid",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: isHigh ? "#B42318" : "#B54708",
                            background: isHigh ? "#FEF3F2" : "#FFFAEB",
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {isHigh ? "High" : "Notice"}
                        </span>
                        <b style={{ fontSize: "13px", color: S.navy }}>{al.title}</b>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: S.slate, lineHeight: 1.4 }}>
                      {al.description || al.desc || al.message}
                    </p>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (al.type === "finance" || al.id?.includes("fee") || al.id?.includes("fees")) onNavigate("finance");
                          else if (al.type === "staffing" || al.id?.includes("leave")) onNavigate("attendance");
                          else if (al.id?.includes("invite") || al.id?.includes("invites")) onNavigate("staff");
                          else onNavigate("academics");
                        }}
                        style={{
                          background: S.navy,
                          border: "none",
                          color: "#FFFFFF",
                          padding: "5px 12px",
                          borderRadius: "6px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {al.action || "Take Action"} ↗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                padding: "20px",
                borderRadius: "6px",
                background: S.greenBg,
                color: S.greenDk,
              }}
            >
              <CheckCircle2 size={26} color={S.green} style={{ flexShrink: 0 }} />
              <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "5px", minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
                  All administrative registers are verified.
                </p>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5 }}>
                  No pending compliance breaches, unsubmitted registers, or overdue escalations.
                </p>
              </div>
            </div>
          )}
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          5. CAMPUS TIMELINE & ROSTER BREAKDOWN (1.4fr / 1fr)
      ═══════════════════════════════════════════════ */}
      <section
        className="portal-split-grid"
      >
        {/* Left: Daily Campus Schedule & Timeline */}
        <article
          style={{
            background: "#fff",
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
              <Clock size={19} color={S.navy} />
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: S.navy }}>
                Today’s Campus Schedule &amp; Operations
              </h2>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: S.slate,
                background: S.chip,
                padding: "4px 10px",
                borderRadius: "100px",
              }}
            >
              Bell Schedule
            </span>
          </div>

          {operationalTimeline.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {operationalTimeline.map((item, idx) => {
                const isDone = item.status === "completed";
                const isLive = item.status === "in_progress";

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "10px 14px",
                      background: isLive ? "#f0f7ff" : S.chip,
                      border: `1px solid ${isLive ? "#bae5f5" : S.border}`,
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: S.navy,
                        width: "72px",
                        flexShrink: 0,
                      }}
                    >
                      {item.time}
                    </span>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: isDone ? S.green : isLive ? S.blue : S.faint,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: S.navy }}>
                        {item.event}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: S.slate }}>
                        {item.lead} · {item.category}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: isDone ? S.green : isLive ? S.blue : S.slate,
                        background: isDone ? S.greenBg : isLive ? "#d0e6ff" : "rgba(0,0,0,0.04)",
                        padding: "2px 8px",
                        borderRadius: "100px",
                        textTransform: "capitalize",
                      }}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                borderRadius: "8px",
                background: S.chip,
                border: `1px dashed ${S.border}`,
              }}
            >
              <Clock size={28} color={S.muted} style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: S.navy }}>
                No Timetable Schedule Configured for Today
              </p>
              <p style={{ margin: "4px 0 12px", fontSize: "11.5px", color: S.slate }}>
                Class periods and daily faculty assignments will populate here automatically.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("timetable")}
                style={{
                  background: S.navy,
                  color: "#fff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Configure Timetable
              </button>
            </div>
          )}
        </article>

        {/* Right: Campus Roster Distribution & Capacity */}
        <article
          style={{
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Building2 size={19} color={S.navy} />
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: S.navy }}>
                Campus Roster Distribution
              </h2>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: S.slate, lineHeight: 1.5 }}>
              Institutional capacity and enrollment breakdown across active grade clusters.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ padding: "12px", background: S.chip, borderRadius: "8px", border: `1px solid ${S.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 600, color: S.navy }}>
                  <span>Active Grade Sections</span>
                  <span>{totalSections} Sections</span>
                </div>
                <div style={{ fontSize: "11px", color: S.slate, marginTop: "4px" }}>
                  Organized across {totalClasses} primary &amp; secondary programs
                </div>
              </div>

              <div style={{ padding: "12px", background: S.chip, borderRadius: "8px", border: `1px solid ${S.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 600, color: S.navy }}>
                  <span>Student-Teacher Ratio</span>
                  <span>{studentTeacherRatio}</span>
                </div>
                <div style={{ fontSize: "11px", color: S.slate, marginTop: "4px" }}>
                  {totalTeachers} instructional faculty members active
                </div>
              </div>

              <div style={{ padding: "12px", background: S.chip, borderRadius: "8px", border: `1px solid ${S.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 600, color: S.navy }}>
                  <span>Linked Parent Accounts</span>
                  <span>{totalParents.toLocaleString()} Verified</span>
                </div>
                <div style={{ fontSize: "11px", color: S.slate, marginTop: "4px" }}>
                  SMS &amp; In-App notification channels active
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("academics")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              border: `1px solid ${S.line}`,
              borderRadius: "6px",
              background: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              color: S.navy,
              cursor: "pointer",
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
            <span>Manage Academic Programs</span>
            <ArrowRight size={14} />
          </button>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          6. REAL-TIME AUDIT TRAIL FEED
      ═══════════════════════════════════════════════ */}
      <section
        style={{
          background: "#fff",
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
            <Activity size={19} color={S.navy} />
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: S.navy }}>
              Real-Time Administrative Audit Trail
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("audit")}
            style={{
              all: "unset",
              fontSize: "12px",
              fontWeight: 600,
              color: S.navy,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>View Full Ledger</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentActivity.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentActivity.map((log: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: S.chip,
                  borderRadius: "8px",
                  border: `1px solid ${S.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      background: "#fff",
                      border: `1px solid ${S.border}`,
                      color: S.navy,
                    }}
                  >
                    {formatAuditBadge(log.action || log.category)}
                  </span>
                  <span style={{ fontSize: "13px", color: S.navy, fontWeight: 500 }}>
                    {formatAuditMessage(log.action, log.detail, log.actor)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "11px", color: S.slate }}>
                    {log.actor || "Staff"}
                  </span>
                  <span style={{ fontSize: "11px", color: S.faint }}>
                    {log.time || "Recently"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              borderRadius: "8px",
              background: S.chip,
              border: `1px dashed ${S.border}`,
              color: S.slate,
              fontSize: "12.5px",
            }}
          >
            No administrative audit events recorded yet for this session.
          </div>
        )}
      </section>
    </div>
  );
};
