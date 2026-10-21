"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  BookOpen,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Upload,
  Play,
  HelpCircle,
  Trophy,
  Award,
  Clock,
  MapPin,
  AlertCircle,
  Activity,
} from "lucide-react";
import { getStudentDashboard } from "../../edops-api";
import { StudentTab } from "../types";

// Design tokens matching HTML & Design specification
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

interface DashboardPaneProps {
  organizationId: string;
  onNavigateTab: (tab: StudentTab) => void;
  onSubmitAssignment?: (assignment?: any) => void;
  onStartArena?: (activity?: any) => void;
  onOpenLecture?: (lecture?: any) => void;
  onAskTeacher?: () => void;
}

export const DashboardPane: React.FC<DashboardPaneProps> = ({
  organizationId,
  onNavigateTab,
  onSubmitAssignment,
  onStartArena,
  onOpenLecture,
  onAskTeacher,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHealthExplainer, setShowHealthExplainer] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [organizationId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await getStudentDashboard(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

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
          Loading dashboard...
        </p>
      </div>
    );
  }

  const enrollment = data?.enrollment || {
    classSection: "10-A",
    academicYear: "2026–2027",
    rollNumber: "101",
    classTeacher: "Faculty",
  };

  const kpis = data?.kpis || {
    overallAttendance: 0,
    academicAverage: null,
    improvement: 0,
    assignmentCompletion: 0,
    assignmentsPending: 0,
    curriculumProgress: 0,
  };

  const healthScore = kpis.academicAverage == null ? null : Math.round(kpis.academicAverage);
  const nextClass = data?.nextClass;
  const timetable = data?.timetable || [];
  const pendingTasks = data?.pendingTasks || [];
  const attentionItems = data?.attentionRequired || pendingTasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    desc: `Due: ${t.dueDate || t.due || "Soon"}`,
    message: `Due: ${t.dueDate || t.due || "Soon"}`,
    severity: t.priority === "urgent" ? "critical" : "warning",
    action: t.type === "arena" ? "Start Arena" : "Submit Homework",
    type: t.type || "assignment",
  }));

  const alerts = data?.alerts || [];
  const activityLogs = data?.recentActivity || [];
  const messages = data?.recentMessages || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ═══════════════════════════════════════════════
          1. HERO BANNER WITH COLLABORATION ARTWORK
      ═══════════════════════════════════════════════ */}
      <section
        aria-labelledby="greeting"
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
              id="greeting"
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
                const name = (data?.studentName || data?.student?.name || data?.student?.email || "Student").replace(/\s*\(Student\)/gi, "").trim();
                return `${timeGreeting}, ${name}!`;
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
            {enrollment.classSection && (
              <>
                <span style={{ fontWeight: 600, color: S.navy }}>
                  {enrollment.classSection}
                </span>
                <span style={{ color: "#5c6b80" }}>/</span>
              </>
            )}
            <span>Academic Year {enrollment.academicYear || "Active Session"}</span>
            {enrollment.rollNumber && (
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
                Roll No: {enrollment.rollNumber}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
            {/* Submit Homework */}
            <button
              type="button"
              onClick={() => (onSubmitAssignment ? onSubmitAssignment() : onNavigateTab("assignments"))}
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
              <Upload size={16} />
              <span>Submit Homework</span>
            </button>

            {/* Start Arena */}
            <button
              type="button"
              onClick={() => (onStartArena ? onStartArena() : onNavigateTab("arena"))}
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
              <Play size={16} />
              <span>Start Arena</span>
            </button>

            {/* Ask Teacher */}
            <button
              type="button"
              onClick={() => (onAskTeacher ? onAskTeacher() : onNavigateTab("communication"))}
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
              <MessageSquare size={16} />
              <span>Ask Teacher</span>
            </button>
          </div>
        </div>

        {/* Student Dashboard Illustration */}
        <div className="dashboard-hero-illustration" style={{ flexShrink: 0, width: "251px", height: "196px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src="/studentdashboard.svg"
            alt="Student Dashboard"
            width={251}
            height={196}
            style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. ACADEMIC OVERVIEW HEADER
      ═══════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: S.navy }}>
            Your Academic Overview
          </h2>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "100px",
              background: S.chip,
              fontSize: "10px",
              fontWeight: 600,
              color: S.slate,
            }}
          >
            {enrollment.academicYear || "2026–2027"}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "11px", color: S.faint }}>
          Current academic year
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          3. SIX 6-COLOR METRIC STAT CARDS
      ═══════════════════════════════════════════════ */}
      <section
        aria-label="Academic metrics"
        className="portal-metrics-grid"
      >
        {/* 1. Attendance Rate (Pastel Violet) */}
        <article
          onClick={() => onNavigateTab("attendance")}
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
              Attendance Rate
            </h3>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
            {kpis?.overallAttendance ?? 0}%
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {(kpis?.overallAttendance ?? 0) < 75 ? "Below 75% threshold" : "≥ 75% threshold met"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#4a0e8f" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 2. Overall Score (Pastel Warm Amber) */}
        <article
          onClick={() => onNavigateTab("performance")}
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
              Overall Score
            </h3>
            <TrendingUp size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7a4a00" }}>
            {kpis?.academicAverage ?? 0}%
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              +{kpis?.improvement ?? 0}% vs last term
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7a4a00" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 3. Assignments Due (Pastel Sky Blue) */}
        <article
          onClick={() => onNavigateTab("assignments")}
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
              Assignments Due
            </h3>
            <ClipboardList size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
            {kpis?.assignmentsPending ?? 0}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {(kpis?.assignmentsPending ?? 0) === 0 ? "All submissions clear" : `${kpis.assignmentsPending} pending submission`}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#0a5a7a" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 4. Curriculum Pacing (Pastel Mint Green) */}
        <article
          onClick={() => onNavigateTab("curriculum")}
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
              Curriculum Pacing
            </h3>
            <BookOpen size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
            {kpis?.curriculumProgress ?? 0}%
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              Saved curriculum progress
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#1a5c0a" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 5. Arena Practice (Pastel Rose / Coral) */}
        <article
          onClick={() => onNavigateTab("arena")}
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
              Arena Practice
            </h3>
            <Trophy size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7a1a1a" }}>
            {data?.metrics?.completedTests ?? 0}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              Questions answered
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7a1a1a" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 6. Academic Average (Dark Navy High-Contrast) */}
        <article
          onClick={() => onNavigateTab("assessments")}
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
              Academic Average
            </h3>
            <Award size={18} color={S.muted} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#fff" }}>
            {kpis?.academicAverage != null ? `${kpis.academicAverage}%` : "—"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: S.muted }}>
              Saved assessment results
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#fff" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          4. ACADEMIC STATUS (Dual Cards)
      ═══════════════════════════════════════════════ */}
      <section
        aria-label="Academic status"
        className="portal-split-grid"
      >
        {/* Card 1: Academic Standing */}
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
                Academic Standing
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
            Deterministic metric score based on verified attendance, coursework, and assessments.
          </p>

          <div style={{ height: "1px", background: "#f2f2f2" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "80px", flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 600, lineHeight: 1, color: S.navy }}>
                {healthScore ?? "—"}
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
                {healthScore == null ? "No graded results" : "Recorded academic average"}
              </span>
              <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.6, color: S.slate }}>
                Verified attendance ({kpis?.overallAttendance ?? 0}%), homework completion ({kpis?.assignmentCompletion ?? 0}%), and academic average ({kpis?.academicAverage ?? 0}%) live in register.
              </p>
            </div>
          </div>

          {showHealthExplainer && (
            <div
              style={{
                background: S.chip,
                border: `1px solid ${S.border}`,
                borderRadius: "8px",
                padding: "12px 14px",
                fontSize: "12px",
                color: S.slate,
              }}
            >
              <b style={{ color: S.navy }}>Recorded indicators:</b>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                <div>• Attendance: {kpis.overallAttendance}%</div>
                <div>• Academic Average: {kpis.academicAverage ?? 0}%</div>
                <div>• Coursework Completion: {kpis.assignmentCompletion}%</div>
                <div>Practice drill results are tracked in Arena</div>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <CheckCircle2 size={19} color={S.navy} />
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: S.navy }}>
                Attention Required
              </h2>
            </div>
            <span
              style={{
                padding: "5px 9px",
                borderRadius: "100px",
                background: S.greenBg,
                fontSize: "11px",
                fontWeight: 600,
                color: S.green,
              }}
            >
              {attentionItems.length > 0 ? `${attentionItems.length} Notice(s)` : "All Clear"}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: "13px", lineHeight: "normal", color: S.slate }}>
            Click any alert to open the recommended action loop.
          </p>

          {attentionItems.length > 0 ? (
            <div style={{ display: "grid", gap: "10px" }}>
              {attentionItems.map((al: any, idx: number) => {
                const isHigh = al.severity === "critical" || al.severity === "high";
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
                      {al.message || al.desc}
                    </p>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (al.type === "arena" || al.action?.toLowerCase().includes("arena")) {
                            if (onStartArena) onStartArena();
                            else onNavigateTab("arena");
                          } else {
                            if (onSubmitAssignment) onSubmitAssignment();
                            else onNavigateTab("assignments");
                          }
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
                  All coursework is up to date.
                </p>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5 }}>
                  No pending submissions or alerts.
                </p>
              </div>
            </div>
          )}
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          5. NEXT CLASS PERIOD (When Scheduled)
      ═══════════════════════════════════════════════ */}
      {nextClass && (
        <section
          style={{
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "20px 24px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  background: S.greenBg,
                  color: S.greenDk,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                NOW / NEXT PERIOD
              </span>
              <span style={{ fontSize: "12px", color: S.slate, display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={13} /> Starts in {nextClass.startsInMinutes ?? 15} mins ({nextClass.startTime}–{nextClass.endTime})
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: S.navy }}>
              {nextClass.subject} · <span style={{ fontWeight: 500, color: S.slate }}>{nextClass.topic || "Instructional Period"}</span>
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", fontSize: "12px", color: S.slate }}>
              <span>Room {nextClass.room || "302"}</span>
              <span>•</span>
              <span>Teacher: <b style={{ color: S.navy }}>{nextClass.teacher || "Faculty"}</b></span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => onNavigateTab("subjects")}
              style={{
                background: "#fff",
                border: `1px solid ${S.line}`,
                color: S.navy,
                padding: "8px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Subject Hub
            </button>
            <button
              onClick={() => onNavigateTab("timetable")}
              style={{
                background: "#fff",
                border: `1px solid ${S.line}`,
                color: S.navy,
                padding: "8px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Timetable
            </button>
            <button
              onClick={() => (onStartArena ? onStartArena() : onNavigateTab("arena"))}
              style={{
                background: S.navy,
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Practice Arena ↗
            </button>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          6. TIMETABLE & ACTION ITEMS SPLIT ROW
      ═══════════════════════════════════════════════ */}
      <section className="portal-split-grid">
        {/* Today's Lectures & Timetable */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} color={S.navy} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: S.navy }}>
                Today&apos;s Lectures
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("timetable")}
              style={{
                background: S.chip,
                border: `1px solid ${S.border}`,
                color: S.navy,
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Weekly Grid <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: "grid", gap: "8px", flex: 1 }}>
            {timetable && timetable.length > 0 ? (
              timetable.map((period: any, idx: number) => {
                const status = (period.status || "upcoming").toLowerCase();
                const isCompleted = status === "completed";
                const isNow = status === "now";

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: isNow ? "#e0f2fe" : S.chip,
                      border: `1px solid ${isNow ? "#bae6fd" : S.border}`,
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "6px",
                          background: "#fff",
                          border: `1px solid ${isCompleted ? "#ABEFC6" : S.line}`,
                          color: isCompleted ? "#027A48" : S.navy,
                          display: "grid",
                          placeItems: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        P{period.periodNumber || period.period || idx + 1}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <b style={{ fontSize: "13px", color: S.navy }}>
                            {period.subjectName || period.subject || "Subject"}
                          </b>
                          {isNow && (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                background: S.navy,
                                color: "#fff",
                                padding: "1px 5px",
                                borderRadius: "3px",
                              }}
                            >
                              NOW
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "11.5px", color: S.slate, marginTop: "2px" }}>
                          {period.startTime ? `${period.startTime} - ${period.endTime}` : (period.time || "09:00 - 09:45")} · {period.teacherName || period.teacher || "Faculty"} (Room {period.room || "302"})
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span style={{ background: S.greenBg, color: S.greenDk, padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                          ✓ Completed
                        </span>
                      ) : isNow ? (
                        <button
                          onClick={() => (onOpenLecture ? onOpenLecture() : onNavigateTab("resources"))}
                          style={{ background: S.navy, color: "#fff", border: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}
                        >
                          Join Session ↗
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigateTab("resources")}
                          style={{ background: "#fff", color: S.navy, border: `1px solid ${S.line}`, padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}
                        >
                          Study Notes
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "28px", textAlign: "center", color: S.slate, fontSize: "12.5px" }}>
                No instructional lectures scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Action Items / Pending Tasks */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ClipboardList size={16} color={S.navy} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: S.navy }}>
                Action Items
              </h3>
            </div>
            <span style={{ fontSize: "12px", color: S.slate, fontWeight: 600 }}>
              {pendingTasks.length} Due
            </span>
          </div>

          <div style={{ display: "grid", gap: "8px", flex: 1 }}>
            {pendingTasks && pendingTasks.length > 0 ? (
              pendingTasks.map((task: any) => {
                const isUrgent = task.priority === "urgent";
                return (
                  <div
                    key={task.id}
                    style={{
                      padding: "11px 13px",
                      borderRadius: "6px",
                      background: S.chip,
                      border: `1px solid ${isUrgent ? "#FECDCA" : S.border}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: S.navy }}>
                        {task.title}
                      </span>
                      <span
                        style={{
                          fontSize: "9.5px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          background: isUrgent ? "#FEF3F2" : "#FFFAEB",
                          color: isUrgent ? "#B42318" : "#B54708",
                        }}
                      >
                        {task.priority || "Normal"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", color: S.slate }}>
                        Due: {task.dueDate || "Upcoming"}
                      </span>
                      <button
                        onClick={() => {
                          if (task.type === "assignment") {
                            if (onSubmitAssignment) onSubmitAssignment(task);
                            else onNavigateTab("assignments");
                          } else {
                            if (onStartArena) onStartArena(task);
                            else onNavigateTab("arena");
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: S.navy,
                          fontWeight: 700,
                          fontSize: "11.5px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        Start <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "28px", textAlign: "center", color: S.slate, fontSize: "12px" }}>
                ✓ No pending tasks or assignments due.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          7. ACADEMIC RADAR & NOTICES (If Alerts Exist)
      ═══════════════════════════════════════════════ */}
      {alerts && alerts.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: S.slate, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Academic Radar & Notices
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #FEDF89",
                  background: "#FFFAEB",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <AlertCircle size={16} color="#B54708" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#7A2E0E" }}>
                    {alert.title}
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#93370D" }}>
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          8. REAL-TIME ACTIVITY & TEACHER DIRECTIVES
      ═══════════════════════════════════════════════ */}
      <section className="portal-two-col">
        {/* Real-time Activity Feed */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={16} color={S.navy} />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: S.navy }}>
                Recent Learning Activity
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("progress")}
              style={{ background: "transparent", border: "none", color: S.navy, fontWeight: 600, fontSize: "11.5px", cursor: "pointer" }}
            >
              Full Log ↗
            </button>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            {activityLogs && activityLogs.length > 0 ? (
              activityLogs.slice(0, 4).map((item: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 12px",
                    background: S.chip,
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: S.navy }} />
                    <span style={{ color: S.navy, fontWeight: 500 }}>{item.text || item.action}</span>
                  </div>
                  <span style={{ fontSize: "10.5px", color: S.faint }}>
                    {item.time ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today"}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: "16px", textAlign: "center", color: S.slate, fontSize: "12px" }}>
                No recent activity logged today.
              </div>
            )}
          </div>
        </div>

        {/* Teacher Directives */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={16} color={S.navy} />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: S.navy }}>
                Teacher Directives & Notes
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("communication")}
              style={{ background: "transparent", border: "none", color: S.navy, fontWeight: 600, fontSize: "11.5px", cursor: "pointer" }}
            >
              Inbox ({messages.length}) ↗
            </button>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            {messages && messages.length > 0 ? (
              messages.slice(0, 3).map((m: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => onNavigateTab("communication")}
                  style={{
                    padding: "9px 12px",
                    background: S.chip,
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                    border: `1px solid ${S.border}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <b style={{ color: S.navy }}>{m.senderName || "Teacher"}</b>
                    <span style={{ fontSize: "10.5px", color: S.faint }}>{m.date || "Recent"}</span>
                  </div>
                  <p style={{ margin: 0, color: S.slate, fontSize: "11.5px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.subjectLine || m.body || "Class directive"}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: "16px", textAlign: "center", color: S.slate, fontSize: "12px" }}>
                No unread directives from teachers.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
