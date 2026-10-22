"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Users,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  Award,
  CheckSquare,
  HelpCircle,
  Play,
  Upload,
  Layers,
  Sparkles,
} from "lucide-react";
import { getTeacherDashboard } from "../../edops-api";
import { TeacherTab } from "../types";

// Design tokens strictly matching Student Dashboard specification
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
  onNavigate: (tab: TeacherTab) => void;
  onTakeAttendance: (sectionId?: string, periodNumber?: number, classSection?: string) => void;
  onMarkLessonCompleted: (sectionId?: string, periodNumber?: number, classSection?: string) => void;
  onCreateAssignment?: () => void;
}

export const DashboardPane: React.FC<DashboardPaneProps> = ({
  organizationId,
  onNavigate,
  onTakeAttendance,
  onMarkLessonCompleted,
  onCreateAssignment,
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
      const res = await getTeacherDashboard(organizationId);
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
          Loading teacher command center...
        </p>
      </div>
    );
  }

  const teacher = data?.teacher || {
    name: "Faculty Member",
    primarySubject: "Instructional Faculty",
    assignedClassesCount: 0,
    totalStudents: 0,
  };

  const kpis = data?.kpis || {
    classesToday: 0,
    periodsToday: 0,
    studentsToday: 0,
    pendingAttendance: 0,
    pendingAssignments: 0,
    pendingEvaluations: 0,
    upcomingAssessments: 0,
    curriculumProgress: 0,
    unreadMessages: 0,
  };

  const nextClass = data?.nextClass;
  const attentionItems = data?.attentionRequired || [];
  const todaySchedule = data?.todaySchedule || [];
  const activityLogs = data?.recentActivity || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ═══════════════════════════════════════════════
          1. HERO BANNER WITH FACULTY ARTWORK
      ═══════════════════════════════════════════════ */}
      <section
        aria-labelledby="teacher-greeting"
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
              id="teacher-greeting"
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
                const name = teacher.name.replace(/\s*\(Teacher\)|\s*\(Faculty\)/gi, "").trim();
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
            <span style={{ fontWeight: 600, color: S.navy }}>
              {teacher.primarySubject || "Primary Faculty"}
            </span>
            <span style={{ color: "#5c6b80" }}>/</span>
            <span>
              {teacher.assignedClassesCount} Assigned Sections ({teacher.totalStudents} Enrolled Students)
            </span>
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
              Senior Faculty
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
            {/* Mark Attendance */}
            <button
              type="button"
              onClick={() => onTakeAttendance(nextClass?.sectionId, 1, nextClass?.classSection)}
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
              <CheckSquare size={16} />
              <span>Mark Attendance</span>
            </button>

            {/* New Assignment */}
            <button
              type="button"
              onClick={() => (onCreateAssignment ? onCreateAssignment() : onNavigate("assignments"))}
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
              <span>+ New Assignment</span>
            </button>

            {/* Full Timetable */}
            <button
              type="button"
              onClick={() => onNavigate("timetable")}
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
              <span>Full Timetable</span>
            </button>
          </div>
        </div>

        {/* Teacher Dashboard Illustration */}
        <div className="dashboard-hero-illustration" style={{ flexShrink: 0, width: "251px", height: "196px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src="/teacherdashboard.svg"
            alt="Teacher Command Center"
            width={251}
            height={196}
            style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. INSTRUCTIONAL OVERVIEW HEADER
      ═══════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: S.navy }}>
            Instructional Overview &amp; Key Metrics
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
            Active Term
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "11px", color: S.faint }}>
          Synchronized live with school registers
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          3. SIX 6-COLOR METRIC STAT CARDS (Picture-Perfect)
      ═══════════════════════════════════════════════ */}
      <section
        aria-label="Instructional metrics"
        className="portal-metrics-grid"
      >
        {/* 1. Classes Today (Pastel Violet) */}
        <article
          onClick={() => onNavigate("timetable")}
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
              Classes Today
            </h3>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
            {kpis.classesToday}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {kpis.periodsToday} instructional periods
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#4a0e8f" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 2. Students in Attendance (Pastel Warm Amber) */}
        <article
          onClick={() => onNavigate("classes")}
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
              Students Today
            </h3>
            <Users size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7a4a00" }}>
            {kpis.studentsToday}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              Across assigned class sections
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7a4a00" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 3. Assignments & Grading (Pastel Sky Blue) */}
        <article
          onClick={() => onNavigate("assignments")}
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
            {kpis.pendingAssignments}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {kpis.pendingAssignments === 0 ? "All grading complete" : "Pending review & evaluation"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#0a5a7a" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 4. Curriculum Progress (Pastel Mint Green) */}
        <article
          onClick={() => onNavigate("curriculum")}
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
            {kpis.curriculumProgress}%
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              Overall LO delivery pacing
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#1a5c0a" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 5. Pending Attendance Registers (Pastel Rose / Coral) */}
        <article
          onClick={() => onNavigate("attendance")}
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
              Pending Registers
            </h3>
            <CheckSquare size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7a1a1a" }}>
            {kpis.pendingAttendance}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px" }}>
              {kpis.pendingAttendance === 0 ? "All registers submitted" : "Periods awaiting roll call"}
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#7a1a1a" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>

        {/* 6. Academic Directives (Navy High-Contrast) */}
        <article
          onClick={() => onNavigate("communication")}
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
              Directives &amp; Tasks
            </h3>
            <Award size={18} color={S.muted} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#fff" }}>
            {kpis.unreadMessages + kpis.pendingEvaluations}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: S.muted }}>
              {kpis.unreadMessages} directives · {kpis.pendingEvaluations} evaluations
            </p>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#fff" }}>
              View <ArrowRight size={14} />
            </span>
          </div>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          4. INSTRUCTIONAL STATUS (Dual Cards)
      ═══════════════════════════════════════════════ */}
      <section
        aria-label="Instructional status"
        className="portal-split-grid"
      >
        {/* Card 1: Faculty Standing & Readiness */}
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
                Faculty Instructional Health
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
              Explain Metric <HelpCircle size={15} />
            </button>
          </div>

          <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5, color: S.slate }}>
            Automated compliance score reflecting attendance submission rate, syllabus pacing, and active evaluations.
          </p>

          <div style={{ height: "1px", background: "#f2f2f2" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "80px", flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 600, lineHeight: 1, color: S.navy }}>
                {Math.max(0, 100 - (kpis.pendingAttendance * 5) - (kpis.pendingAssignments * 2))}
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
                High Compliance Readiness
              </span>
              <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.6, color: S.slate }}>
                Verified curriculum pacing ({kpis.curriculumProgress}%), timely registers, and active lesson execution in compliance.
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
              <b style={{ color: S.navy }}>Tracked compliance metrics:</b>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                <div>• Curriculum Progress: {kpis.curriculumProgress}%</div>
                <div>• Pending Attendance: {kpis.pendingAttendance}</div>
                <div>• Pending Grading: {kpis.pendingAssignments}</div>
                <div>• Directives: {kpis.unreadMessages} unread</div>
              </div>
            </div>
          )}
        </article>

        {/* Card 2: Attention Required / At-Risk & Tasks */}
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
                background: attentionItems.length > 0 ? "#FFFAEB" : S.greenBg,
                fontSize: "11px",
                fontWeight: 600,
                color: attentionItems.length > 0 ? "#B54708" : S.green,
                border: attentionItems.length > 0 ? "1px solid #FEDF89" : "none",
              }}
            >
              {attentionItems.length > 0 ? `${attentionItems.length} Notice(s)` : "All Clear"}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: "13px", lineHeight: "normal", color: S.slate }}>
            Click any alert to open the recommended instructional action loop.
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
                          {isHigh ? "Critical" : "Notice"}
                        </span>
                        <b style={{ fontSize: "13px", color: S.navy }}>
                          {al.type ? al.type.toUpperCase() : "TASK"}
                        </b>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: S.slate, lineHeight: 1.4 }}>
                      {al.message}
                    </p>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (al.type === "attendance") {
                            onTakeAttendance();
                          } else if (al.type === "assignment") {
                            onNavigate("assignments");
                          } else if (al.type === "at_risk" || al.type === "student") {
                            onNavigate("students");
                          } else {
                            onNavigate("communication");
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
                        {al.action || "Resolve Action"} ↗
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
                  All instructional tasks are up to date!
                </p>
                <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.5 }}>
                  No pending attendance registers or overdue assignments requiring faculty action.
                </p>
              </div>
            </div>
          )}
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          5. NEXT CLASS PERIOD (When Scheduled)
      ═══════════════════════════════════════════════ */}
      {nextClass ? (
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
                LIVE / UPCOMING PERIOD
              </span>
              <span style={{ fontSize: "12px", color: S.slate, display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={13} /> Starts in {nextClass.startsInMinutes ?? 10} mins ({nextClass.startTime}–{nextClass.endTime})
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: S.navy }}>
              {nextClass.classSection} · <span style={{ fontWeight: 500, color: S.slate }}>{nextClass.subject} ({nextClass.topic || "Instructional Plan"})</span>
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", fontSize: "12px", color: S.slate }}>
              <span>Room {nextClass.room || "Lab 2"}</span>
              <span>•</span>
              <span>Status: <b style={{ color: S.navy }}>{nextClass.lessonPlanStatus || "Prepared"}</b></span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => onTakeAttendance(nextClass.sectionId, 1, nextClass.classSection)}
              style={{
                background: "#fff",
                border: `1px solid ${S.line}`,
                color: S.navy,
                padding: "8px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckSquare size={14} />
              <span>Mark Attendance</span>
            </button>
            <button
              onClick={() => onMarkLessonCompleted(nextClass.sectionId, 1, nextClass.classSection)}
              style={{
                background: S.navy,
                border: `1px solid ${S.navy}`,
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CheckCircle2 size={14} />
              <span>Log Lesson Delivery</span>
            </button>
          </div>
        </section>
      ) : null}

      {/* ═══════════════════════════════════════════════
          6. TODAY'S INSTRUCTIONAL TIMETABLE
      ═══════════════════════════════════════════════ */}
      {todaySchedule.length > 0 && (
        <section
          style={{
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.navy }}>
                Today's Class Schedule
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.slate }}>
                Live instructional roster for today
              </p>
            </div>
            <button
              onClick={() => onNavigate("timetable")}
              style={{
                all: "unset",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                color: S.navy,
                cursor: "pointer",
              }}
            >
              <span>Full Week Schedule</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            {todaySchedule.map((period: any, idx: number) => {
              const isDone = period.attendanceDone;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: S.chip,
                    borderRadius: "8px",
                    border: `1px solid ${S.border}`,
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: S.navy,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "13px",
                        flexShrink: 0,
                      }}
                    >
                      P{period.period}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 700, color: S.navy }}>
                        {period.classSection} · {period.subject}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: S.slate }}>
                        {period.time} • Room {period.room}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "100px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: isDone ? S.greenBg : "#FFFAEB",
                        color: isDone ? S.greenDk : "#B54708",
                        border: isDone ? "none" : "1px solid #FEDF89",
                      }}
                    >
                      {isDone ? "Register Taken" : "Pending Attendance"}
                    </span>
                    {!isDone && (
                      <button
                        onClick={() => onTakeAttendance(undefined, period.period, period.classSection)}
                        style={{
                          background: S.navy,
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Roll Call
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          7. RECENT FACULTY ACTIVITY LOG
      ═══════════════════════════════════════════════ */}
      {activityLogs.length > 0 && (
        <section
          style={{
            background: "#fff",
            border: `1px solid ${S.border}`,
            borderRadius: "10px",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: S.navy }}>
            Recent Activity &amp; Logs
          </h2>
          <div style={{ display: "grid", gap: "8px" }}>
            {activityLogs.map((log: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: S.chip,
                  fontSize: "12.5px",
                  color: S.slate,
                }}
              >
                <span>{log.text}</span>
                <span style={{ fontSize: "11px", color: S.faint }}>{log.time}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
