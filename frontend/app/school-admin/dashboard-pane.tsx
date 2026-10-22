"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Send,
  UserPlus,
  Building2,
  Calendar,
  CreditCard,
  BookOpen,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck2,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  Activity,
  FileText,
  UserCheck,
  Award,
  Plus,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { SchoolAdminTab } from "./types";
import { getSchoolAdminDashboard, getSchoolAdminAcademics } from "../edops-api";
import { formatAuditMessage, formatAuditBadge } from "../components/audit-formatter";

// ─── Design Tokens strictly matching Student & People UI ────────────────────
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

// ─── Number / Currency Helpers ──────────────────────────────────────────────
function formatCurrency(amt?: number | null) {
  if (typeof amt !== "number" || amt === 0 || isNaN(amt) || !isFinite(amt)) return "-";
  if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
  if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
  return `₹${amt.toLocaleString("en-IN")}`;
}

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
    return "-";
  }
  return `${typeof v === "number" ? v.toLocaleString("en-IN") : v}${suffix}`;
}

// ─── Clean Empty State with Illustrations ───────────────────────────────────
function DashboardEmptyState({
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

// ─── Dashboard Skeleton Loading Screen ──────────────────────────────────────
function DashboardSkeleton() {
  const kpiColors = ["#E0D3FF", "#FDE1AC", "#BAE5F5", "#CCEFBF", "#FFD6D6", "#0C1E33"];

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
          border-radius: 4px;
        }
        .edops-skeleton-kpi {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.35) 25%, rgba(255, 255, 255, 0.75) 50%, rgba(255, 255, 255, 0.35) 75%);
          background-size: 200% 100%;
          animation: edopsShimmer 1.4s ease-in-out infinite;
          border-radius: 4px;
        }
      `}</style>

      {/* 1. Hero Banner Skeleton */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "28px 32px",
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          height: "196px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "55%" }}>
          <div className="edops-skeleton" style={{ height: "24px", width: "240px", borderRadius: "6px" }} />
          <div className="edops-skeleton" style={{ height: "14px", width: "380px", borderRadius: "4px" }} />
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <div className="edops-skeleton" style={{ height: "36px", width: "120px", borderRadius: "6px" }} />
            <div className="edops-skeleton" style={{ height: "36px", width: "130px", borderRadius: "6px" }} />
            <div className="edops-skeleton" style={{ height: "36px", width: "140px", borderRadius: "6px" }} />
          </div>
        </div>
        <div className="edops-skeleton" style={{ width: "220px", height: "140px", borderRadius: "10px" }} />
      </div>

      {/* 2. Overview Bar Skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="edops-skeleton" style={{ height: "20px", width: "280px", borderRadius: "4px" }} />
        </div>
        <div className="edops-skeleton" style={{ height: "32px", width: "85px", borderRadius: "6px" }} />
      </div>

      {/* 3. KPI 3x2 Grid Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "16px",
          width: "100%",
        }}
      >
        {kpiColors.map((bg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              background: bg,
              borderRadius: "10px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="edops-skeleton-kpi" style={{ width: "110px", height: "12px", borderRadius: "4px" }} />
              <div className="edops-skeleton-kpi" style={{ width: "22px", height: "22px", borderRadius: "50%" }} />
            </div>
            <div className="edops-skeleton-kpi" style={{ width: "80px", height: "34px", borderRadius: "6px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="edops-skeleton-kpi" style={{ width: "130px", height: "10px", borderRadius: "4px" }} />
              <div className="edops-skeleton-kpi" style={{ width: "50px", height: "10px", borderRadius: "4px" }} />
            </div>
          </div>
        ))}
      </div>

      {/* 4. Operational Status Dual Split Cards Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "360px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="edops-skeleton" style={{ width: "170px", height: "18px", borderRadius: "4px" }} />
              <div className="edops-skeleton" style={{ width: "90px", height: "18px", borderRadius: "100px" }} />
            </div>
            <div className="edops-skeleton" style={{ width: "100px", height: "36px", borderRadius: "6px" }} />
            <div className="edops-skeleton" style={{ width: "100%", height: "12px", borderRadius: "4px" }} />
            <div className="edops-skeleton" style={{ width: "100%", height: "12px", borderRadius: "4px", marginTop: "10px" }} />
            <div className="edops-skeleton" style={{ width: "100%", height: "12px", borderRadius: "4px" }} />
            <div className="edops-skeleton" style={{ width: "100%", height: "12px", borderRadius: "4px" }} />
          </div>
          <div className="edops-skeleton" style={{ width: "100%", height: "20px", borderRadius: "4px" }} />
        </div>

        <div
          style={{
            height: "360px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="edops-skeleton" style={{ width: "160px", height: "18px", borderRadius: "4px" }} />
            <div className="edops-skeleton" style={{ width: "140px", height: "18px", borderRadius: "6px" }} />
          </div>
          <div className="edops-skeleton" style={{ width: "240px", height: "12px", borderRadius: "4px" }} />
          <div className="edops-skeleton" style={{ width: "100%", height: "38px", borderRadius: "6px", marginTop: "8px" }} />
          <div className="edops-skeleton" style={{ width: "100%", height: "38px", borderRadius: "6px" }} />
          <div className="edops-skeleton" style={{ width: "100%", height: "38px", borderRadius: "6px" }} />
        </div>
      </div>

      {/* 5. Schedule & Campus Capacity Dual Cards Skeleton */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "340px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxSizing: "border-box",
          }}
        >
          <div className="edops-skeleton" style={{ width: "180px", height: "18px", borderRadius: "4px" }} />
          <div className="edops-skeleton" style={{ width: "100%", height: "48px", borderRadius: "6px" }} />
          <div className="edops-skeleton" style={{ width: "100%", height: "48px", borderRadius: "6px" }} />
          <div className="edops-skeleton" style={{ width: "100%", height: "48px", borderRadius: "6px" }} />
        </div>

        <div
          style={{
            height: "340px",
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxSizing: "border-box",
          }}
        >
          <div className="edops-skeleton" style={{ width: "200px", height: "18px", borderRadius: "4px" }} />
          <div className="edops-skeleton" style={{ width: "100%", height: "52px", borderRadius: "6px" }} />
          <div className="edops-skeleton" style={{ width: "100%", height: "52px", borderRadius: "6px" }} />
          <div className="edops-skeleton" style={{ width: "100%", height: "52px", borderRadius: "6px" }} />
        </div>
      </div>

      {/* 6. Real-Time Audit Trail Skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="edops-skeleton" style={{ width: "240px", height: "18px", borderRadius: "4px" }} />
          <div className="edops-skeleton" style={{ width: "100px", height: "16px", borderRadius: "4px" }} />
        </div>
        <div className="edops-skeleton" style={{ width: "100%", height: "36px", borderRadius: "6px" }} />
        <div className="edops-skeleton" style={{ width: "100%", height: "36px", borderRadius: "6px" }} />
        <div className="edops-skeleton" style={{ width: "100%", height: "36px", borderRadius: "6px" }} />
        <div className="edops-skeleton" style={{ width: "100%", height: "36px", borderRadius: "6px" }} />
      </div>
    </div>
  );
}

// ─── Component Props ────────────────────────────────────────────────────────
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
  const [refreshing, setRefreshing] = useState(false);
  const [activeAcademicYear, setActiveAcademicYear] = useState<string | null>(null);
  const [showHealthExplainer, setShowHealthExplainer] = useState(false);
  const [alertFilter, setAlertFilter] = useState<"all" | "academics" | "finance" | "staffing">("all");
  const [selectedAttentionItem, setSelectedAttentionItem] = useState<any | null>(null);

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    if (!isSilent) setRefreshing(true);

    try {
      const res = await getSchoolAdminDashboard(organizationId);
      setData(res);
      if (res?.academicYear) {
        setActiveAcademicYear(res.academicYear);
      }
    } catch {
      setData(null);
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
  }, [organizationId]);

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const metrics = data?.metrics;
  const healthMetrics = data?.health || data?.healthMetrics;

  const totalStudents = Number(metrics?.totalStudents ?? 0);
  const activeStudents = Number(metrics?.activeStudents ?? totalStudents);
  const totalTeachers = Number(metrics?.totalTeachers ?? 0);
  const totalStaff = Number(metrics?.totalStaff ?? 0);
  const totalParents = Number(metrics?.totalParents ?? 0);
  const totalSections = Number(metrics?.totalSections ?? 0);
  const totalClasses = Number(metrics?.totalClasses ?? 0);
  const feeAssessed = Number(metrics?.feeAssessed ?? 0);
  const feeCollected = Number(metrics?.feeCollected ?? 0);
  const feePending = Number(metrics?.feePending ?? 0);
  const feeDefaulters = Number(metrics?.feeDefaulters ?? 0);

  const currentAcademicYear = activeAcademicYear || data?.academicYear;
  const academicYearBadge = currentAcademicYear
    ? currentAcademicYear.toUpperCase().startsWith("AY")
      ? currentAcademicYear
      : `AY ${currentAcademicYear}`
    : "No Academic Year Set";

  const studentTeacherRatio =
    totalTeachers > 0 ? `1:${Math.round(totalStudents / totalTeachers)}` : "—";

  const healthScore = typeof healthMetrics?.overall === "number" ? Math.round(healthMetrics.overall) : null;
  const attendanceRate = typeof healthMetrics?.attendanceRate === "number" ? Math.round(healthMetrics.attendanceRate) : null;
  const feeCollectionRate = typeof healthMetrics?.feeCollectionRate === "number" ? Math.round(healthMetrics.feeCollectionRate) : null;
  const syllabusCompletion = typeof healthMetrics?.syllabusCompletion === "number" ? Math.round(healthMetrics.syllabusCompletion) : null;

  // Live Attention Items from Backend
  const rawAttentionItems: any[] = Array.isArray(data?.attentionItems) ? data.attentionItems : [];

  const filteredAttention = rawAttentionItems.filter((a) => {
    if (alertFilter === "all") return true;
    if (alertFilter === "academics")
      return a.type === "academics" || a.id?.includes("attendance") || a.title?.toLowerCase().includes("section");
    if (alertFilter === "finance")
      return a.type === "finance" || a.id?.includes("fee");
    if (alertFilter === "staffing")
      return a.type === "staffing" || a.id?.includes("leave") || a.title?.toLowerCase().includes("staff");
    return true;
  });

  // Daily Campus Timeline from Backend
  const operationalTimeline: any[] = Array.isArray(data?.dailyTimeline) ? data.dailyTimeline : [];

  // Recent Activity Logs from Backend
  const recentActivity: any[] = Array.isArray(data?.recentActivity) ? data.recentActivity : [];

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
        aria-labelledby="admin-greeting"
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
              👋
            </span>
            <h1
              id="admin-greeting"
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                color: S.navy,
                letterSpacing: "-0.02em",
              }}
            >
              {(() => {
                const hour = new Date().getHours();
                const timeGreeting =
                  hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
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
            <span style={{ color: "#94A3B8" }}>/</span>
            <span>Academic Year {currentAcademicYear || "Not Set"}</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
            {/* Admit Student */}
            <button
              type="button"
              onClick={() => onOpenQuickAction("addStudent")}
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
              <UserPlus size={15} strokeWidth={2} />
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
              <CreditCard size={15} strokeWidth={2} />
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
              <Send size={15} strokeWidth={2} />
              <span>Broadcast Notice</span>
            </button>
          </div>
        </div>

        {/* Dashboard Artwork Illustration */}
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
            School Operational Overview &amp; Key Metrics
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
          3. KEY OPERATIONAL METRICS & VITALS (6 CARDS)
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
          onClick={() => onNavigate("students")}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
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
          <p
            style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: 700,
              lineHeight: "115%",
              color: S.navy,
            }}
          >
            {displayVal(totalStudents)}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {totalStudents > 0 ? `${activeStudents.toLocaleString()} active on campus` : "No active students enrolled"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#4a0e8f" }}>
              View <ArrowRight size={14} />
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#51249A" }}>
                Directory
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
          </div>
        </article>

        {/* 2. Faculty & Staff (Pastel Warm Amber #FDE1AC) */}
        <article
          onClick={() => onNavigate("teachers")}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
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
              FACULTY &amp; STAFF
            </h3>
            <Users size={19} strokeWidth={1.8} style={{ color: "#7A4A00" }} />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: 700,
              lineHeight: "115%",
              color: S.navy,
            }}
          >
            {displayVal(totalTeachers + totalStaff)}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {totalTeachers > 0 ? `${totalTeachers} teachers · Ratio ${studentTeacherRatio}` : "No instructional faculty assigned"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7a4a00" }}>
              View <ArrowRight size={14} />
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#7A4A00" }}>
                Staff Roster
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#7A4A00" }} />
            </div>
          </div>
        </article>

        {/* 3. Campus Attendance (Pastel Sky Blue #BAE5F5) */}
        <article
          onClick={() => onNavigate("attendance")}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
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
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
            {attendanceRate !== null ? `${attendanceRate}%` : "—"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {attendanceRate !== null
                ? attendanceRate >= 85
                  ? "Optimal attendance pace"
                  : "Requires homeroom follow-up"
                : "No attendance recorded yet"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#0a5a7a" }}>
              View <ArrowRight size={14} />
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#0A5A7A" }}>
                Attendance Desk
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#0A5A7A" }} />
            </div>
          </div>
        </article>

        {/* 4. Fee Realization (Pastel Mint Green #CCEFBF) */}
        <article
          onClick={() => onNavigate("finance")}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
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
              FEE REALIZATION
            </h3>
            <CreditCard size={19} strokeWidth={1.8} style={{ color: "#1A5C0A" }} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
            {feeCollectionRate !== null ? `${feeCollectionRate}%` : feeAssessed > 0 ? `${Math.round((feeCollected / feeAssessed) * 100)}%` : "—"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {feeAssessed > 0 ? `${formatCurrency(feeCollected)} of ${formatCurrency(feeAssessed)}` : "No active fee registers"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#1a5c0a" }}>
              View <ArrowRight size={14} />
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#1A5C0A" }}>
                Fee Records
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#1A5C0A" }} />
            </div>
          </div>
        </article>

        {/* 5. Fee Defaulters (Pastel Rose / Coral #FFD6D6) */}
        <article
          onClick={() => onNavigate("finance")}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
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
              FEE DEFAULTERS
            </h3>
            <ShieldAlert size={19} strokeWidth={1.8} style={{ color: "#7A1A1A" }} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7a1a1a" }}>
            {feeAssessed > 0 ? feeDefaulters : "—"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {feeAssessed > 0
                ? feePending > 0
                  ? `${formatCurrency(feePending)} overdue collections`
                  : "All collections settled"
                : "No pending fee schedules"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7a1a1a" }}>
              View <ArrowRight size={14} />
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#7A1A1A" }}>
                Defaulters Desk
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#7A1A1A" }} />
            </div>
          </div>
        </article>

        {/* 6. Campus Health Score (Navy High-Contrast #0C1E33) */}
        <article
          onClick={() => setShowHealthExplainer(!showHealthExplainer)}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
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
              INSTITUTIONAL STANDING
            </h3>
            <Award size={19} strokeWidth={1.8} style={{ color: S.muted }} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#fff" }}>
            {healthScore !== null ? `${healthScore}/100` : "—/100"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: S.muted }}>
              {healthScore !== null ? "Verified compliance register" : "Setup in progress · No data yet"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#fff" }}>
              View <ArrowRight size={14} />
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#FFFFFF" }}>
                Explain Score
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#FFFFFF" }} />
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
        {/* Card 1: Institutional Standing (Fixed Card · No Expands) */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "24px",
            background: "#FFFFFF",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            height: "360px",
            maxHeight: "360px",
            boxSizing: "border-box",
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
                {healthScore !== null ? healthScore : "—"}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: S.slate }}>/100</p>
            </div>
            <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "100px",
                  background: healthScore >= 80 ? S.greenBg : healthScore >= 60 ? "#FEF3C7" : healthScore > 0 ? "#FEE2E2" : "#F1F5F9",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: healthScore >= 80 ? S.green : healthScore >= 60 ? "#B45309" : healthScore > 0 ? "#B91C1C" : S.slate,
                }}
              >
                {healthScore === null
                  ? "Setup In Progress · No Data Yet"
                  : healthScore >= 80
                  ? "Tier A · Excellent Health"
                  : healthScore >= 60
                  ? "Tier B · Good Standing"
                  : "Tier C · Attention Needed"}
              </span>
              <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.6, color: S.slate }}>
                {healthScore === null
                  ? "Institutional standing score computes deterministically once attendance logs, term fee realization, and curriculum pacing are recorded in campus registers."
                  : `Verified attendance (${attendanceRate !== null ? `${attendanceRate}%` : "—"}), term fee realization (${feeCollectionRate !== null ? `${feeCollectionRate}%` : "—"}), and curriculum pacing (${syllabusCompletion !== null ? `${syllabusCompletion}%` : "—"}) live in campus registers.`}
              </p>
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
                <div>• Attendance Turnout: <b>{attendanceRate !== null ? `${attendanceRate}%` : "—"}</b> (40% weight)</div>
                <div>• Fee Realization: <b>{feeCollectionRate !== null ? `${feeCollectionRate}%` : "—"}</b> (35% weight)</div>
                <div>• Syllabus Delivery: <b>{syllabusCompletion !== null ? `${syllabusCompletion}%` : "—"}</b> (25% weight)</div>
                <div>• Student-Teacher Ratio: <b>{studentTeacherRatio}</b></div>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "14px",
              marginTop: "16px",
              borderTop: `1px solid ${S.border}`,
              fontSize: "11px",
              color: S.slate,
            }}
          >
            <span>Student-Teacher Ratio: <strong>{studentTeacherRatio}</strong></span>
            <span>Active Sections: <strong>{displayVal(totalSections)}</strong></span>
          </div>
        </article>

        {/* Card 2: Attention Required (Minimal Compact One-Line List) */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "24px",
            background: "#FFFFFF",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            height: "360px",
            maxHeight: "360px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            {/* Header: Title & Subtitle */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "12px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={15} color={S.navy} strokeWidth={2} />
                <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: S.navy, letterSpacing: "-0.01em" }}>
                  Attention Required
                </h2>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "18px",
                    height: "18px",
                    padding: "0 6px",
                    borderRadius: "100px",
                    background: "#F1F5F9",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: S.slate,
                  }}
                >
                  {displayVal(filteredAttention.length)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: S.muted, lineHeight: 1.4 }}>
                Automated compliance exceptions requiring administrative follow-up.
              </p>
            </div>

            {/* Category Filter Underline Tabs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                borderBottom: "1px solid #F1F5F9",
                paddingBottom: "2px",
                marginBottom: "10px",
                flexShrink: 0,
              }}
            >
              {(["all", "academics", "finance", "staffing"] as const).map((cat) => {
                const isActive = alertFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAlertFilter(cat)}
                    style={{
                      all: "unset",
                      fontSize: "11.5px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? S.navy : S.muted,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      paddingBottom: "6px",
                      borderBottom: isActive ? `2px solid ${S.navy}` : "2px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = S.navy;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = S.muted;
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Minimal Compact One-Line List */}
            {filteredAttention.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto",
                  paddingRight: "2px",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {filteredAttention.map((al, idx) => {
                  const isHigh = al.severity === "high";

                  return (
                    <React.Fragment key={idx}>
                      <div
                        onClick={() => setSelectedAttentionItem(al)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          height: "38px",
                          minHeight: "38px",
                          padding: "0 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F8FAFC";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                        title={`${al.title} (Click to view details)`}
                      >
                        {/* Left: Status Dot + Title Only */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            minWidth: 0,
                            flex: 1,
                            overflow: "hidden",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: isHigh ? "#EF4444" : "#F59E0B",
                              flexShrink: 0,
                              marginRight: "9px",
                            }}
                          />
                          <span
                            style={{
                              fontWeight: 600,
                              color: S.navy,
                              fontSize: "12.5px",
                              letterSpacing: "-0.01em",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {al.title}
                          </span>
                        </div>

                        {/* Right: Time + Chevron */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexShrink: 0,
                            marginLeft: "10px",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: S.muted, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {al.time || "Today"}
                          </span>
                          <ChevronRight size={13} color="#94A3B8" />
                        </div>
                      </div>

                      {/* Partial Inset Separator (Not fully covered) */}
                      {idx < filteredAttention.length - 1 && (
                        <div
                          style={{
                            height: "1px",
                            background: "#F1F5F9",
                            margin: "1px 8px",
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  minHeight: 0,
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <img
                  src="/bee.png"
                  alt=""
                  style={{
                    width: "60px",
                    height: "auto",
                    maxHeight: "60px",
                    objectFit: "contain",
                    marginBottom: "8px",
                    opacity: 0.9,
                  }}
                />
                <b style={{ fontSize: "13px", fontWeight: 600, color: S.navy, marginBottom: "2px" }}>
                  All administrative registers are verified
                </b>
                <p style={{ margin: 0, fontSize: "11px", color: S.slate }}>
                  No pending compliance exceptions.
                </p>
              </div>
            )}
          </div>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          5. CAMPUS TIMELINE & ROSTER BREAKDOWN (1.4fr / 1fr)
      ═══════════════════════════════════════════════ */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        {/* Left: Daily Campus Schedule & Timeline */}
        <article
          style={{
            background: "#FFFFFF",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color={S.navy} strokeWidth={2} />
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.navy, letterSpacing: "-0.01em" }}>
                Today’s Campus Schedule &amp; Operations
              </h2>
            </div>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                color: S.slate,
                background: S.chip,
                border: `1px solid ${S.border}`,
                padding: "3px 8px",
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
                      gap: "12px",
                      padding: "10px 14px",
                      background: isLive ? "#EFF6FF" : "#F8FAFC",
                      border: `1px solid ${isLive ? "#BFDBFE" : S.border}`,
                      borderRadius: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: S.navy,
                        width: "68px",
                        flexShrink: 0,
                      }}
                    >
                      {item.time}
                    </span>
                    <div
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: isDone ? S.green : isLive ? S.blue : S.faint,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: S.navy }}>
                        {item.event}
                      </p>
                      <p style={{ margin: "1px 0 0", fontSize: "11px", color: S.slate }}>
                        {item.lead} · {item.category}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        color: isDone ? S.green : isLive ? S.blue : S.slate,
                        background: isDone ? S.greenBg : isLive ? "#DBEAFE" : "rgba(0,0,0,0.04)",
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
            <DashboardEmptyState
              illustration="/noresult.png"
              title="No Timetable Schedule Configured for Today"
              description="Class periods and daily faculty assignments will populate here automatically."
              actionLabel="Configure Timetable"
              onAction={() => onNavigate("timetable")}
            />
          )}
        </article>

        {/* Right: Campus Roster Distribution & Capacity */}
        <article
          style={{
            background: "#FFFFFF",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Building2 size={18} color={S.navy} strokeWidth={2} />
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.navy, letterSpacing: "-0.01em" }}>
                Campus Roster Distribution
              </h2>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: S.slate, lineHeight: 1.5 }}>
              Institutional capacity and enrollment breakdown across active grade clusters.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "#F8FAFC",
                  borderRadius: "8px",
                  border: `1px solid ${S.border}`,
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: S.navy }}>Active Grade Sections</div>
                  <div style={{ fontSize: "11px", color: S.slate, marginTop: "2px" }}>
                    {totalClasses > 0 ? `Organized across ${totalClasses} primary & secondary programs` : "-"}
                  </div>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: S.navy }}>
                  {displayVal(totalSections, " Sections")}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "#F8FAFC",
                  borderRadius: "8px",
                  border: `1px solid ${S.border}`,
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: S.navy }}>Student-Teacher Ratio</div>
                  <div style={{ fontSize: "11px", color: S.slate, marginTop: "2px" }}>
                    {totalTeachers > 0 ? `${totalTeachers} instructional faculty members active` : "-"}
                  </div>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: S.navy }}>
                  {studentTeacherRatio}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "#F8FAFC",
                  borderRadius: "8px",
                  border: `1px solid ${S.border}`,
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: S.navy }}>Linked Parent Accounts</div>
                  <div style={{ fontSize: "11px", color: S.slate, marginTop: "2px" }}>
                    SMS &amp; In-App notification channels active
                  </div>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: S.navy }}>
                  {displayVal(totalParents, " Verified")}
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
              padding: "9px 16px",
              border: `1px solid ${S.border}`,
              borderRadius: "6px",
              background: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 600,
              color: S.navy,
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
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
            <span>Manage Academic Programs</span>
            <ArrowRight size={14} />
          </button>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          6. REAL-TIME AUDIT TRAIL FEED (Full Width · Free UI · Grid-Aligned)
      ═══════════════════════════════════════════════ */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={16} color={S.navy} strokeWidth={2} />
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: S.navy, letterSpacing: "-0.01em" }}>
              Real-Time Administrative Audit Trail
            </h2>
            <span style={{ fontSize: "11px", color: S.muted }}>
              ({displayVal(recentActivity.length)})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("audit")}
            style={{
              all: "unset",
              fontSize: "11.5px",
              fontWeight: 600,
              color: S.navy,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "5px",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = S.chip)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span>View Full Ledger</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {recentActivity.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {recentActivity.map((log: any, idx: number) => {
              const badgeCategory = formatAuditBadge(log.action || log.category);
              const message = formatAuditMessage(log.action, log.detail, log.actor);
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "84px minmax(0, 1fr) 20px 130px 20px 75px",
                    alignItems: "center",
                    padding: "7px 10px",
                    background: isEven ? "#FFFFFF" : "#F8FAFC",
                    borderRadius: "6px",
                    transition: "background 0.15s ease",
                    fontSize: "12px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? "#FFFFFF" : "#F8FAFC")}
                >
                  {/* Column 1: Monospace Category Badge */}
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9.5px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 5px",
                      borderRadius: "4px",
                      background: isEven ? "#F8FAFC" : "#FFFFFF",
                      border: `1px solid ${S.border}`,
                      color: S.navy,
                      letterSpacing: "0.03em",
                      textAlign: "center",
                      display: "block",
                      width: "74px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {badgeCategory}
                  </span>

                  {/* Column 2: Event Message */}
                  <span
                    style={{
                      fontWeight: 500,
                      color: S.navy,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      paddingRight: "8px",
                    }}
                    title={message}
                  >
                    {message}
                  </span>

                  {/* Column 3: Separator __ */}
                  <span
                    style={{
                      color: "#CBD5E1",
                      fontSize: "10px",
                      textAlign: "center",
                      userSelect: "none",
                    }}
                  >
                    __
                  </span>

                  {/* Column 4: Actor */}
                  <span
                    style={{
                      color: S.slate,
                      fontWeight: 500,
                      fontSize: "11px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={log.actor || "Staff"}
                  >
                    {log.actor || "Staff"}
                  </span>

                  {/* Column 5: Separator __ */}
                  <span
                    style={{
                      color: "#CBD5E1",
                      fontSize: "10px",
                      textAlign: "center",
                      userSelect: "none",
                    }}
                  >
                    __
                  </span>

                  {/* Column 6: Timestamp */}
                  <span
                    style={{
                      color: S.muted,
                      fontSize: "11px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {log.time || "Recently"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <DashboardEmptyState
            illustration="/bee.png"
            title="No Recent Audit Events"
            description="Administrative and governance events will be recorded here automatically."
          />
        )}
      </section>

      {/* Detailed Attention Item Popup Modal */}
      {selectedAttentionItem && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
          onClick={() => setSelectedAttentionItem(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              border: `1px solid ${S.border}`,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "520px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxSizing: "border-box",
              fontFamily: "'Poppins', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: selectedAttentionItem.severity === "high" ? "#EF4444" : "#F59E0B",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: selectedAttentionItem.severity === "high" ? "#DC2626" : S.slate,
                  }}
                >
                  {selectedAttentionItem.severity === "high" ? "High Priority Notice" : "Administrative Notice"}
                </span>
                {selectedAttentionItem.time && (
                  <span
                    style={{
                      fontSize: "10.5px",
                      color: S.muted,
                      background: S.chip,
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {selectedAttentionItem.time}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedAttentionItem(null)}
                style={{
                  all: "unset",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: S.slate,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = S.chip)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Title & Description */}
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700, color: S.navy, lineHeight: 1.4 }}>
                {selectedAttentionItem.title}
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: S.slate, lineHeight: 1.6 }}>
                {selectedAttentionItem.description}
              </p>
            </div>

            {/* Context Box */}
            <div
              style={{
                background: "#F8FAFC",
                border: `1px solid ${S.border}`,
                borderRadius: "8px",
                padding: "12px 14px",
                fontSize: "12px",
                color: "#475569",
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, color: S.navy, marginBottom: "3px" }}>Administrative Resolution</div>
              <div>
                Click below to open the dedicated module and process this register item directly.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setSelectedAttentionItem(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: `1px solid ${S.border}`,
                  background: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: S.slate,
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  const al = selectedAttentionItem;
                  if (al.id?.includes("attendance")) onNavigate("attendance");
                  else if (al.id?.includes("fee") || al.id?.includes("defaulter")) onNavigate("finance");
                  else if (al.id?.includes("leave")) onNavigate("operations");
                  else if (al.id?.includes("invite") || al.id?.includes("invites")) onNavigate("staff");
                  else onNavigate("academics");
                  setSelectedAttentionItem(null);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: S.navy,
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{selectedAttentionItem.action || "Take Action"}</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Standing Health Explainer Modal */}
      {showHealthExplainer && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
          onClick={() => setShowHealthExplainer(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              border: `1px solid ${S.border}`,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "520px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              boxSizing: "border-box",
              fontFamily: "'Poppins', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Award size={18} color={S.navy} strokeWidth={2} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.navy }}>
                  Institutional Standing Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHealthExplainer(false)}
                style={{
                  all: "unset",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: S.slate,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = S.chip)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Score Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                background: S.navy,
                borderRadius: "8px",
                color: "#FFFFFF",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: S.muted, fontWeight: 600 }}>
                  Composite Rating
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1.1, marginTop: "2px" }}>
                  {displayVal(healthScore)} {healthScore > 0 && <span style={{ fontSize: "14px", fontWeight: 400, color: S.muted }}>/ 100</span>}
                </div>
              </div>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "100px",
                  background: healthScore >= 80 ? S.greenBg : healthScore >= 60 ? "#FEF3C7" : healthScore > 0 ? "#FEE2E2" : "#334155",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: healthScore >= 80 ? S.green : healthScore >= 60 ? "#B45309" : healthScore > 0 ? "#B91C1C" : "#E2E8F0",
                }}
              >
                {healthScore >= 80
                  ? "Tier A · Optimal Health"
                  : healthScore >= 60
                  ? "Tier B · Moderate Health"
                  : healthScore > 0
                  ? "Tier C · Review Needed"
                  : "Setup Required · No Data"}
              </span>
            </div>

            {/* Pillar Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: S.navy }}>
                Deterministic Formula Synthesis
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFC", borderRadius: "6px", border: `1px solid ${S.border}`, fontSize: "12px" }}>
                <div>
                  <div style={{ fontWeight: 600, color: S.navy }}>1. Verified Attendance (40% Weight)</div>
                  <div style={{ fontSize: "11px", color: S.slate }}>Daily classroom attendance submissions</div>
                </div>
                <div style={{ fontWeight: 700, color: S.navy }}>
                  {displayVal(attendanceRate, "%")}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFC", borderRadius: "6px", border: `1px solid ${S.border}`, fontSize: "12px" }}>
                <div>
                  <div style={{ fontWeight: 600, color: S.navy }}>2. Fee Recovery (35% Weight)</div>
                  <div style={{ fontSize: "11px", color: S.slate }}>Current term collected vs assessed dues</div>
                </div>
                <div style={{ fontWeight: 700, color: S.navy }}>
                  {displayVal(feeCollectionRate, "%")}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFC", borderRadius: "6px", border: `1px solid ${S.border}`, fontSize: "12px" }}>
                <div>
                  <div style={{ fontWeight: 600, color: S.navy }}>3. Curriculum Delivery (25% Weight)</div>
                  <div style={{ fontSize: "11px", color: S.slate }}>Verified syllabus pacing nodes completed</div>
                </div>
                <div style={{ fontWeight: 700, color: S.navy }}>
                  {displayVal(syllabusCompletion, "%")}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowHealthExplainer(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "6px",
                  border: "none",
                  background: S.navy,
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
