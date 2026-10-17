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
  GraduationCap,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  Upload,
  Play,
  HelpCircle,
  Activity,
  FileText,
  Trophy,
  Award,
  ShieldAlert,
} from "lucide-react";
import { getStudentDashboard } from "../../edops-api";
import { StudentTab } from "../types";

// ─── Design Tokens (Neutral / Minimalist Admin Design System) ───────────────────────────
const S = {
  ink: "#101828",       // primary text
  muted: "#475467",     // secondary text
  faint: "#667085",     // tertiary text
  border: "#E2DDD5",    // dividers / borders (matching school admin)
  borderSubtle: "#EAECF0",
  bg: "#FFFFFF",        // card background
  canvas: "#F7F8FA",    // page background
  cardRowBg: "#FAF8F5", // subtle tinted background for list items
  accent: "#101828",    // dark accent for buttons/links

  // Status colors (subtle)
  greenBg: "#ECFDF3",
  greenTxt: "#027A48",
  greenBdr: "#ABEFC6",

  amberBg: "#FFFAEB",
  amberTxt: "#B54708",
  amberBdr: "#FEDF89",

  redBg: "#FEF3F2",
  redTxt: "#B42318",
  redBdr: "#FECDCA",

  blueBg: "#EFF8FF",
  blueTxt: "#175CD3",
  blueBdr: "#B2DDFF",
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
      <div style={{ padding: "48px 0", textAlign: "center", color: S.faint }}>
        <div style={{ width: "28px", height: "28px", border: `2px solid ${S.ink}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: "13px", fontWeight: 600, color: S.muted, margin: 0 }}>Loading student learning command center...</p>
      </div>
    );
  }

  const enrollment = data?.enrollment || { classSection: "", academicYear: "", rollNumber: "", classTeacher: "" };

  const kpis = data?.kpis || { overallAttendance: 0, academicAverage: 0, improvement: 0, assignmentCompletion: 0, assignmentsPending: 0, curriculumProgress: 0 };

  const healthScore = kpis.academicAverage == null ? null : Math.round(kpis.academicAverage);

  const nextClass = data?.nextClass || { subject: "", teacher: "", room: "", startTime: "", endTime: "", startsInMinutes: 0, topic: "", lessonStatus: "", lessonPlanStatus: "" };

  const timetable = data?.timetable || [];
  const attentionItems = data?.attentionRequired || (data?.pendingTasks ? data.pendingTasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    desc: `Due: ${t.dueDate || t.due || "Soon"}`,
    message: `Due: ${t.dueDate || t.due || "Soon"}`,
    severity: t.priority === "urgent" ? "critical" : "warning",
    action: t.type === "arena" ? "Start Arena" : "Submit Homework",
    type: t.type || "assignment",
  })) : []);

  const activityLogs = data?.recentActivity || ([] as any[]);

  const messages = data?.recentMessages || [];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* 1. TOP GREETING HEADER WITH KEPT BUTTONS STRICTLY ON TOP */}
      <section
        style={{
          background: S.bg,
          border: `1px solid ${S.border}`,
          borderRadius: "12px",
          padding: "20px 24px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: S.ink, letterSpacing: "-0.02em" }}>
              Good Morning, {data?.studentName || "Student"} 👋
            </h2>
            <span
              style={{
                background: S.cardRowBg,
                border: `1px solid ${S.border}`,
                color: S.ink,
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              Roll No: {enrollment.rollNumber}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: S.muted, fontWeight: 500 }}>
            {enrollment.classSection} · Academic Year {enrollment.academicYear} · Class Teacher: <b style={{ color: S.ink }}>{enrollment.classTeacher}</b>
          </p>
        </div>

        {/* Action Buttons strictly placed on top as requested */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
          {/* Submit Homework */}
          <button
            onClick={() => onSubmitAssignment ? onSubmitAssignment() : onNavigateTab("assignments")}
            style={{
              background: "#FFFFFF",
              color: S.ink,
              border: `1px solid #D0D5DD`,
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12.5px",
              fontWeight: 650,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#98A2B3"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#D0D5DD"; }}
          >
            <Upload size={14} style={{ color: S.muted }} />
            <span>Submit Homework</span>
            {(kpis?.assignmentsPending ?? 0) > 0 && (
              <span
                style={{
                  background: S.redBg,
                  color: S.redTxt,
                  border: `1px solid ${S.redBdr}`,
                  padding: "1px 6px",
                  borderRadius: "999px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                }}
              >
                {kpis.assignmentsPending} Due
              </span>
            )}
          </button>

          {/* Start Arena */}
          <button
            onClick={() => onStartArena ? onStartArena() : onNavigateTab("arena")}
            style={{
              background: "#FFFFFF",
              color: S.ink,
              border: `1px solid #D0D5DD`,
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12.5px",
              fontWeight: 650,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#98A2B3"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#D0D5DD"; }}
          >
            <Play size={14} style={{ color: "#101828" }} />
            <span>Start Arena</span>
          </button>

          {/* Ask Teacher */}
          <button
            onClick={() => onAskTeacher ? onAskTeacher() : onNavigateTab("communication")}
            style={{
              background: S.accent,
              color: "#FFFFFF",
              border: `1px solid ${S.accent}`,
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 1px 2px rgba(16,24,40,0.08)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1D2939")}
            onMouseLeave={(e) => (e.currentTarget.style.background = S.accent)}
          >
            <HelpCircle size={14} style={{ color: "#FFFFFF" }} />
            <span>Ask Teacher</span>
          </button>

          {/* Full Timetable */}
          <button
            onClick={() => onNavigateTab("timetable")}
            style={{
              background: S.cardRowBg,
              color: S.muted,
              border: `1px solid ${S.border}`,
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1EFEA")}
            onMouseLeave={(e) => (e.currentTarget.style.background = S.cardRowBg)}
          >
            <Calendar size={13} style={{ color: S.faint }} />
            <span>Full Timetable</span>
          </button>
        </div>
      </section>

      {/* 2. TOP EXECUTIVE KPI CARDS (Admin StatCard Grid) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {[
          { label: "Attendance Rate", value: `${kpis?.overallAttendance ?? 0}%`, sub: (kpis?.overallAttendance ?? 0) >= 75 ? "≥ 75% CBSE threshold met" : "Below 75% threshold", tab: "attendance" as StudentTab, icon: CheckCircle2 },
          { label: "Overall Score", value: `${kpis?.academicAverage ?? 0}%`, sub: `+${kpis?.improvement ?? 0}% vs last term`, tab: "performance" as StudentTab, icon: TrendingUp },
          { label: "Assignments Due", value: String(kpis?.assignmentsPending ?? 0), sub: (kpis?.assignmentsPending ?? 0) > 0 ? `${kpis.assignmentsPending} pending submission` : "All submissions clear", tab: "assignments" as StudentTab, icon: FileText },
          { label: "Curriculum Pacing", value: `${kpis?.curriculumProgress ?? 0}%`, sub: "Saved curriculum progress", tab: "curriculum" as StudentTab, icon: BookOpen },
          { label: "Arena Practice", value: String(data?.metrics?.completedTests ?? 0), sub: "Questions attempted", tab: "arena" as StudentTab, icon: Trophy },
          { label: "Academic Average", value: kpis.academicAverage == null ? "—" : `${kpis.academicAverage}%`, sub: "Saved assessment results", tab: "assessments" as StudentTab, icon: Award },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab(kpi.tab)}
              style={{
                background: S.bg,
                border: `1px solid ${S.border}`,
                borderRadius: "12px",
                padding: "20px",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(16,24,40,0.06)";
                e.currentTarget.style.borderColor = "#D0D5DD";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = S.border;
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "12px", fontWeight: 650, color: S.muted, textTransform: "uppercase", letterSpacing: "0.03em" }}>{kpi.label}</span>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#FDF9F0", display: "grid", placeItems: "center", color: S.ink }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ margin: "14px 0 6px" }}>
                <span style={{ fontSize: "28px", fontWeight: 800, color: S.ink, letterSpacing: "-0.03em" }}>{kpi.value}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: S.faint }}>
                <span>{kpi.sub}</span>
                <span style={{ color: S.ink, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px" }}>
                  View <ChevronRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* 3. STUDENT ACADEMIC HEALTH SCORE & ATTENTION REQUIRED (Identical to Admin Dashboard Health Card) */}
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "20px" }}>
        {/* Student Academic Standing Score Card */}
        <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: S.ink }}>EDOPS Student Academic Standing</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>Deterministic metric score based on verified attendance, coursework, and assessments</p>
            </div>
            <button
              onClick={() => setShowHealthExplainer(!showHealthExplainer)}
              style={{ background: "#FDF9F0", border: "1px solid #E5CCA2", color: S.ink, padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
            >
              {showHealthExplainer ? "Hide Logic" : "Explain Score"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", margin: "18px 0" }}>
            <div style={{ position: "relative", width: "96px", height: "96px", borderRadius: "50%", background: `conic-gradient(#101828 0% ${healthScore}%, #E2DDD5 ${healthScore}% 100%)`, display: "grid", placeItems: "center" }}>
              <div style={{ width: "76px", height: "76px", borderRadius: "50%", background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "24px", fontWeight: 900, color: S.ink, lineHeight: 1 }}>{healthScore ?? "—"}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: S.faint }}>/100</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "inline-block", background: S.greenBg, border: `1px solid ${S.greenBdr}`, padding: "3px 10px", borderRadius: "12px", fontSize: "11.5px", fontWeight: 700, color: S.greenTxt }}>
                {healthScore == null ? "No graded results" : "Recorded academic average"}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: "#334155", lineHeight: 1.5 }}>
                Verified attendance ({kpis?.overallAttendance ?? 0}%), homework completion ({kpis?.assignmentCompletion ?? 0}%), and academic average ({kpis?.academicAverage ?? 0}%) live in register.
              </p>
            </div>
          </div>

          {showHealthExplainer && (
            <div style={{ background: S.cardRowBg, border: `1px solid ${S.borderSubtle}`, borderRadius: "8px", padding: "12px 14px", marginTop: "12px", fontSize: "12px", color: "#334155" }}>
              <b style={{ color: S.ink }}>Recorded indicators:</b>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                <div>• Attendance: {kpis.overallAttendance}%</div>
                <div>• Academic Average: {kpis.academicAverage}%</div>
                <div>• Coursework Completion: {kpis.assignmentCompletion}%</div>
                <div>Practice drill results are shown in Arena</div>
              </div>
            </div>
          )}
        </div>

        {/* Attention Required (§54: Operational Loop) */}
        <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} color="#D97706" />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: S.ink }}>Attention Required</h3>
                <span
                  style={{
                    background: attentionItems.length > 0 ? S.amberBg : S.greenBg,
                    color: attentionItems.length > 0 ? S.amberTxt : S.greenTxt,
                    border: `1px solid ${attentionItems.length > 0 ? S.amberBdr : S.greenBdr}`,
                    padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700
                  }}
                >
                  {attentionItems.length > 0 ? `${attentionItems.length} Active Notice(s)` : "All Clear"}
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: S.faint }}>Click any alert to launch the corrective action loop</p>
            </div>
            <button
              onClick={() => onNavigateTab("assignments")}
              style={{ background: "transparent", border: "none", color: S.ink, fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              Assignments <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {attentionItems.length > 0 ? (
              attentionItems.map((al: any, idx: number) => {
                const isHigh = al.severity === "critical" || al.severity === "high";
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: S.cardRowBg,
                      border: `1px solid ${isHigh ? S.redBdr : S.amberBdr}`,
                      display: "grid",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                            color: isHigh ? S.redTxt : S.amberTxt,
                            background: isHigh ? S.redBg : S.amberBg,
                            padding: "1px 6px", borderRadius: "4px"
                          }}
                        >
                          {isHigh ? "High" : "Notice"}
                        </span>
                        <b style={{ fontSize: "13px", color: S.ink }}>{al.title}</b>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#334155", lineHeight: 1.4 }}>{al.message || al.desc}</p>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
                      <button
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
                          background: S.accent,
                          border: "none",
                          color: "#FFFFFF",
                          padding: "5px 12px",
                          borderRadius: "6px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        {al.action || "Take Action"} ↗
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: S.greenTxt, background: S.greenBg, borderRadius: "8px", border: `1px solid ${S.greenBdr}`, fontSize: "12.5px" }}>
                ✓ All coursework up to date. No pending submissions or alerts.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. CURRENT / NEXT CLASS PROMINENT CARD (Admin Style) */}
      {nextClass ? (
        <section
          style={{
            background: S.bg,
            border: `1px solid ${S.border}`,
            borderRadius: "12px",
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
                  color: S.greenTxt,
                  border: `1px solid ${S.greenBdr}`,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                NOW / NEXT PERIOD
              </span>
              <span style={{ fontSize: "12.5px", color: S.muted, fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={13} style={{ color: S.faint }} /> Starts in {nextClass.startsInMinutes ?? 15} mins ({nextClass.startTime}–{nextClass.endTime})
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: S.ink }}>
              {nextClass.subject} · <span style={{ fontWeight: 600, color: S.muted }}>{nextClass.topic || "Instructional Period"}</span>
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", fontSize: "12px", color: S.faint, marginTop: "2px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={13} /> Room {nextClass.room || "302"}
              </span>
              <span>•</span>
              <span>Teacher: <b style={{ color: S.ink }}>{nextClass.teacher || "Faculty"}</b></span>
              <span>•</span>
              <span style={{ color: S.greenTxt, fontWeight: 600 }}>Status: {nextClass.lessonStatus || "Active"}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => onNavigateTab("subjects")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #D0D5DD",
                color: S.ink,
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              Subject Hub
            </button>
            <button
              onClick={() => onOpenLecture ? onOpenLecture() : onNavigateTab("resources")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #D0D5DD",
                color: S.ink,
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              Study Notes
            </button>
            <button
              onClick={() => onStartArena ? onStartArena() : onNavigateTab("arena")}
              style={{
                background: S.accent,
                color: "#FFFFFF",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Practice Arena ↗
            </button>
          </div>
        </section>
      ) : null}

      {/* 5. TODAY'S SCHEDULE & REAL-TIME ACTIVITY RADAR */}
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "20px" }}>
        {/* Today's Instructional Periods */}
        <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: S.ink }}>Today's Instructional Periods</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>Daily academic schedule checkpoints and lecture tracking</p>
            </div>
            <button
              onClick={() => onNavigateTab("timetable")}
              style={{ background: S.cardRowBg, border: `1px solid ${S.border}`, color: S.ink, padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              Weekly Grid <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {timetable && timetable.length > 0 ? (
              timetable.map((period: any, idx: number) => {
                const status = (period.status || "upcoming").toLowerCase();
                const isCompleted = status === "completed";
                const isNow = status === "now";

                return (
                  <div
                    key={period.periodNumber || period.period || idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: isNow ? S.blueBg : S.cardRowBg,
                      border: `1px solid ${isNow ? S.blueBdr : S.borderSubtle}`,
                      borderRadius: "8px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: S.bg,
                          border: `1px solid ${isCompleted ? S.greenBdr : S.borderSubtle}`,
                          color: isCompleted ? S.greenTxt : S.ink,
                          display: "grid",
                          placeItems: "center",
                          fontSize: "11.5px",
                          fontWeight: 800,
                        }}
                      >
                        P{period.periodNumber || period.period || idx + 1}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <b style={{ fontSize: "13px", color: S.ink }}>
                            {period.subjectName || period.subject || "Subject"}
                          </b>
                          {isNow && (
                            <span style={{ fontSize: "10px", fontWeight: 800, background: S.blueTxt, color: "#FFFFFF", padding: "1px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                              NOW
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "11.5px", color: S.faint, marginTop: "2px" }}>
                          {period.startTime ? `${period.startTime} - ${period.endTime}` : (period.time || "09:00 - 09:45")} · {period.teacherName || period.teacher || "Faculty"} (Room {period.room || "302"})
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span style={{ background: S.greenBg, color: S.greenTxt, border: `1px solid ${S.greenBdr}`, padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      ) : isNow ? (
                        <button
                          onClick={() => onOpenLecture ? onOpenLecture() : onNavigateTab("resources")}
                          style={{ background: S.accent, color: "#FFFFFF", border: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Join Session ↗
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigateTab("resources")}
                          style={{ background: S.bg, color: S.ink, border: `1px solid #D0D5DD`, padding: "5px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 650, cursor: "pointer" }}
                        >
                          Study Notes
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: S.faint, fontSize: "12px" }}>
                No instructional periods scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real-Time Activity Feed & Directives */}
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Real-Time Learning & Activity Log Feed (§55) */}
          <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: S.ink }}>Real-Time Learning Activity Feed</h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>Live auditable actions logged across homework, arena, and classes</p>
              </div>
              <button
                onClick={() => onNavigateTab("progress")}
                style={{ background: "transparent", border: "none", color: S.ink, fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
              >
                Progress Log ↗
              </button>
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              {activityLogs.length > 0 ? (
                activityLogs.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: S.cardRowBg, borderRadius: "6px", fontSize: "12.5px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: S.ink }} />
                      <div>
                        <b style={{ color: S.ink }}>{item.category || "Academic"}</b> · <span style={{ color: "#334155" }}>{item.text || item.action}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: S.faint, fontWeight: 600 }}>{item.time}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "16px", textAlign: "center", color: S.faint, fontSize: "12px" }}>
                  No recent learning actions recorded today.
                </div>
              )}
            </div>
          </div>

          {/* Teacher Directives & Inbox */}
          <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: S.ink }}>Teacher Directives & In-App Notes</h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>Official communications from instructional faculty</p>
              </div>
              <button
                onClick={() => onNavigateTab("communication")}
                style={{ background: "transparent", border: "none", color: S.ink, fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
              >
                Open Inbox ({messages.length}) ↗
              </button>
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              {messages.length > 0 ? (
                messages.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => onNavigateTab("communication")}
                    style={{ padding: "10px 12px", background: S.cardRowBg, borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: `1px solid ${S.borderSubtle}` }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                      <b style={{ color: S.ink }}>{m.senderName}</b>
                      <span style={{ fontSize: "10.5px", color: S.faint }}>{m.date}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: S.ink, marginBottom: "2px" }}>{m.subjectLine}</div>
                    <p style={{ margin: 0, color: S.muted, fontSize: "11.5px", lineHeight: 1.4 }}>{m.body}</p>
                  </div>
                ))
              ) : (
                <div style={{ padding: "14px", textAlign: "center", color: S.faint, fontSize: "12px" }}>
                  No unread directives recorded from teachers.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
