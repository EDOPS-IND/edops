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
  ShieldAlert,
  Activity,
  Award,
  CheckSquare,
} from "lucide-react";
import { getTeacherDashboard } from "../../edops-api";

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
  onNavigate: (pane: string, sub?: string) => void;
  onTakeAttendance: (sectionId: string, periodNumber?: number, classSection?: string) => void;
  onMarkLessonCompleted: (sectionId: string, periodNumber?: number, classSection?: string) => void;
  onCreateAssignment?: () => void;
}

export function DashboardPane({
  organizationId,
  onNavigate,
  onTakeAttendance,
  onMarkLessonCompleted,
  onCreateAssignment,
}: DashboardPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [organizationId]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await getTeacherDashboard(organizationId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: S.faint }}>
        <div style={{ width: "28px", height: "28px", border: `2px solid ${S.ink}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: "13px", fontWeight: 600, color: S.muted, margin: 0 }}>Loading teacher command center...</p>
      </div>
    );
  }

  const kpis = data?.kpis;
  const nextClass = data?.nextClass;
  const attentionItems = data?.attentionRequired || [];
  const activityLogs = data?.recentActivity || [];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* 1. TOP GREETING HEADER WITH KEPT BUTTONS ON TOP */}
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
              Good Morning, {data?.teacher?.name || "Teacher"} 👋
            </h2>
            <span
              style={{
                background: S.greenBg,
                border: `1px solid ${S.greenBdr}`,
                color: S.greenTxt,
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              Senior Faculty
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: S.muted, fontWeight: 500 }}>
            {data?.teacher?.primarySubject || "General"} · {data?.teacher?.assignedClassesCount ?? 0} Assigned Sections ({data?.teacher?.totalStudents ?? 0} Students Enrolled)
          </p>
        </div>

        {/* Buttons on top - strictly kept in place */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onCreateAssignment && (
            <button
              onClick={onCreateAssignment}
              style={{
                background: "#FFFFFF",
                color: S.ink,
                border: "1px solid #D0D5DD",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12.5px",
                fontWeight: 650,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#98A2B3"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#D0D5DD"; }}
            >
              <span>+ New Assignment</span>
            </button>
          )}

          <button
            onClick={() => onNavigate("timetable")}
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
            <Calendar size={14} style={{ color: "#E0E7FF" }} />
            <span>Full Timetable</span>
          </button>
        </div>
      </section>

      {/* 2. TOP EXECUTIVE KPI CARDS (Admin StatCard Grid) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {[
          { label: "Classes Today", value: String(kpis?.classesToday ?? 0), sub: `${kpis?.periodsToday ?? 0} instructional periods`, tab: "timetable", icon: Calendar },
          { label: "Students Today", value: String(kpis?.studentsToday ?? 0), sub: "Across assigned sections", tab: "classes", icon: Users },
          { label: "Pending Register", value: String(kpis?.pendingAttendance ?? 0), sub: (kpis?.pendingAttendance ?? 0) > 0 ? "Pending submission" : "All registers marked", tab: "attendance", icon: CheckSquare },
          { label: "Pending Grading", value: String(kpis?.pendingEvaluations ?? 0), sub: (kpis?.pendingEvaluations ?? 0) > 0 ? "Pending evaluation" : "Queue clear", tab: "assignments", icon: ClipboardList },
          { label: "Upcoming Tests", value: String(kpis?.upcomingAssessments ?? 0), sub: "Assessment schedule", tab: "assessment", icon: Award },
          { label: "Curriculum Pacing", value: `${kpis?.curriculumProgress ?? 0}%`, sub: "Syllabus pacing tracker", tab: "curriculum", icon: BookOpen },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(kpi.tab)}
              style={{
                background: S.bg,
                border: `1px solid ${S.border}`,
                borderRadius: "12px",
                padding: "18px 20px",
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
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: S.cardRowBg, display: "grid", placeItems: "center", color: S.ink }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ margin: "12px 0 6px" }}>
                <span style={{ fontSize: "26px", fontWeight: 800, color: S.ink, letterSpacing: "-0.02em" }}>{kpi.value}</span>
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

      {/* 3. HERO: CURRENT / NEXT CLASS PROMINENT CARD (Admin Style) */}
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
              {nextClass.classSection} · <span style={{ fontWeight: 600, color: S.muted }}>{nextClass.subject}</span>
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", fontSize: "12px", color: S.faint, marginTop: "2px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={13} /> {nextClass.room || "Room 302"}
              </span>
              <span>•</span>
              <span>Topic: <b style={{ color: S.ink }}>{nextClass.topic || "Instructional Session"}</b></span>
              <span>•</span>
              <span style={{ color: S.greenTxt, fontWeight: 600 }}>Lesson Plan: {nextClass.lessonPlanStatus || "Ready"}</span>
            </div>
          </div>

          {/* Action buttons kept in place */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => onTakeAttendance(nextClass.sectionId, nextClass.periodNumber || nextClass.period || 1, nextClass.classSection)}
              style={{
                background: S.accent,
                color: "#FFFFFF",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>Take Attendance</span>
            </button>
            <button
              onClick={() => onMarkLessonCompleted(nextClass.sectionId, nextClass.periodNumber || nextClass.period || 1, nextClass.classSection)}
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
              Mark Completed
            </button>
            <button
              onClick={() => onNavigate("classes")}
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
              Open Class Hub
            </button>
          </div>
        </section>
      ) : null}

      {/* 4. TODAY'S SCHEDULE & ATTENTION / REAL-TIME ACTIVITY RADAR */}
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "20px" }}>
        {/* Left: Today's Instructional Periods */}
        <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: S.ink }}>Today's Instructional Periods</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>Daily teaching schedule and period attendance registers</p>
            </div>
            <button
              onClick={() => onNavigate("timetable")}
              style={{ background: S.cardRowBg, border: `1px solid ${S.border}`, color: S.ink, padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              Weekly Schedule <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {data?.todaySchedule?.length > 0 ? (
              data.todaySchedule.map((period: any) => {
                const isDone = Boolean(period.attendanceDone);
                return (
                  <div
                    key={period.period || period.periodNumber}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: S.cardRowBg,
                      border: `1px solid ${S.borderSubtle}`,
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
                          border: `1px solid ${isDone ? S.greenBdr : S.borderSubtle}`,
                          color: isDone ? S.greenTxt : S.ink,
                          display: "grid",
                          placeItems: "center",
                          fontSize: "11.5px",
                          fontWeight: 800,
                        }}
                      >
                        P{period.period || period.periodNumber}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <b style={{ fontSize: "13px", color: S.ink }}>
                            {period.classSection}
                          </b>
                          <span style={{ fontSize: "12px", color: S.muted }}>· {period.subject}</span>
                        </div>
                        <div style={{ fontSize: "11.5px", color: S.faint, marginTop: "2px" }}>
                          {period.time} · {period.room}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isDone ? (
                        <span style={{ background: S.greenBg, color: S.greenTxt, border: `1px solid ${S.greenBdr}`, padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={12} /> Register Marked
                        </span>
                      ) : (
                        <button
                          onClick={() => onTakeAttendance(period.sectionId || "", period.period || period.periodNumber || 1, period.classSection)}
                          style={{ background: S.accent, color: "#FFFFFF", border: "none", padding: "5px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Mark Attendance
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

        {/* Right: Attention Required & Real-Time Activity Feed */}
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Attention Required */}
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
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: S.faint }}>Pending evaluations and departmental directives</p>
              </div>
              <button
                onClick={() => onNavigate("assignments")}
                style={{ background: "transparent", border: "none", color: S.ink, fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                Evaluations <ArrowRight size={13} />
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
                          <b style={{ fontSize: "13px", color: S.ink }}>{al.title || "Teaching Notice"}</b>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#334155", lineHeight: 1.4 }}>{al.message || al.desc}</p>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
                        <button
                          onClick={() => {
                            if (al.type === "evaluation_pending" || al.action?.toLowerCase().includes("grade")) onNavigate("assignments");
                            else if (al.type === "student_drop" || al.action?.toLowerCase().includes("student")) onNavigate("students");
                            else onNavigate("curriculum");
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
                  ✓ All grading and registers up to date. No pending actions recorded.
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Teacher Activity Feed */}
          <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: S.ink }}>Real-Time Teaching Activity Feed</h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: S.faint }}>Live auditable actions logged across attendance, lessons, and grading</p>
              </div>
              <button
                onClick={() => onNavigate("activity")}
                style={{ background: "transparent", border: "none", color: S.ink, fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
              >
                Full Log ↗
              </button>
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              {activityLogs.length > 0 ? (
                activityLogs.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: S.cardRowBg, borderRadius: "6px", fontSize: "12.5px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: S.ink }} />
                      <div>
                        <b style={{ color: S.ink }}>{item.category || "Instructional"}</b> · <span style={{ color: "#334155" }}>{item.text || item.action}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: S.faint, fontWeight: 600 }}>{item.time}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "16px", textAlign: "center", color: S.faint, fontSize: "12px" }}>
                  No recent teaching actions recorded today.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
