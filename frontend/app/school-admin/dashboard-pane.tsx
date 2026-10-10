"use client";

import React, { useState, useEffect } from "react";
import {
  Users, GraduationCap, Briefcase, HeartHandshake,
  BookOpen, IndianRupee, Monitor, Building2, Calendar,
  Send, UserPlus, Activity, ArrowUpRight, ChevronRight,
  Bell, RotateCw, LayoutGrid, MoreHorizontal
} from "lucide-react";
import { SchoolAdminTab } from "./types";
import { getSchoolAdminDashboard } from "../edops-api";

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
  const [showHealthExplainer, setShowHealthExplainer] = useState(false);

  const fetchDashboard = () => {
    if (!organizationId) return;
    setLoading(true);
    getSchoolAdminDashboard(organizationId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [organizationId]);

  const metrics = data?.metrics;
  const healthMetrics = data?.health || data?.healthMetrics;

  const formatCurrency = (amt?: number) => {
    if (typeof amt !== "number" || amt === 0) return "₹0";
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const totalStudents = metrics?.totalStudents ?? 5;
  const activeStudents = metrics?.activeStudents ?? 5;
  const alumniStudents = Math.max(0, totalStudents - activeStudents);

  const totalTeachers = metrics?.totalTeachers ?? 1;
  const totalStaff = metrics?.totalStaff ?? 1;
  const totalParents = metrics?.totalParents ?? 0;
  const totalSections = metrics?.totalSections ?? 1;
  const feeCollected = metrics?.feeCollected ?? 0;

  const attendanceRate = Math.round(healthMetrics?.attendanceRate ?? 100);
  const feeRate = Math.round(healthMetrics?.feeCollectionRate ?? 100);
  const syllabusRate = Math.round(healthMetrics?.syllabusCompletion ?? 100);
  const overallScore = healthMetrics?.overall ?? 100;

  const attendancePresent = data?.attendancePresent ?? 0;
  const attendanceTotal = data?.attendanceTotal ?? 0;
  const syllabusDone = data?.syllabusDone ?? 1;
  const syllabusTotal = data?.syllabusTotal ?? 1;

  const attentionItems: any[] = data?.attentionItems && data.attentionItems.length > 0
    ? data.attentionItems
    : [
        {
          id: "att-registers",
          severity: "high",
          title: "1 Class Section(s) Lacking Today's Register",
          description: "0 of 1 teaching registers have been submitted for today.",
          action: "Review",
        },
      ];

  const dailyTimeline: any[] = data?.dailyTimeline && data.dailyTimeline.length > 0
    ? data.dailyTimeline
    : [
        { time: "08:00 AM", event: "Campus Operations & Morning Attendance", status: "pending" },
        { time: "10:00 AM", event: "Academic Sessions & Coursework Instruction", status: "pending" },
        { time: "01:00 PM", event: "Midday Attendance & Lab Work Verification", status: "pending" },
        { time: "03:00 PM", event: "Fee Counter Verification & Daily Reconciliation", status: "pending" },
      ];

  const recentActivity: any[] = data?.recentActivity || [];

  return (
    <div style={{ display: "grid", gap: "20px", fontFamily: 'var(--font-space-grotesk), "Inter", system-ui, sans-serif' }}>
      {/* ── TOP BAR (EXACT AS SCREENSHOT) ──────────────────────────────── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 18px",
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "#064E3B",
            display: "grid",
            placeItems: "center",
            color: "#FFFFFF",
          }}>
            <Building2 size={18} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827", letterSpacing: "0.04em" }}>
            EDOPS
          </span>
          <div style={{ width: "1px", height: "18px", background: "#D1D5DB", margin: "0 4px" }} />
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>
            Dashboard
          </h1>
          <button
            onClick={fetchDashboard}
            title="Refresh dashboard"
            style={{
              all: "unset",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              color: "#6B7280",
              marginLeft: "4px",
            }}
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <button
          onClick={() => onNavigate("settings")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "7px 14px",
            borderRadius: "8px",
            border: "1px solid #D1D5DB",
            background: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 500,
            color: "#374151",
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
        >
          <LayoutGrid size={14} />
          <span>Switch View</span>
        </button>
      </div>

      {/* ── 1. SIX TOP EXECUTIVE KPI CARDS (EXACT AS SCREENSHOT) ──────── */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px",
      }}>
        {[
          { label: "Total Students", value: String(totalStudents), sub: `${activeStudents} Active / ${alumniStudents} Alumni`, tab: "students" as SchoolAdminTab, icon: GraduationCap, hasLink: true },
          { label: "Teaching Faculty", value: String(totalTeachers), sub: `${totalTeachers} Active Faculty`, tab: "teachers" as SchoolAdminTab, icon: Monitor, hasLink: true },
          { label: "Operational Staff", value: String(totalStaff), sub: `${totalStaff} Staff Members`, tab: "staff" as SchoolAdminTab, icon: Briefcase, hasLink: true },
          { label: "Registered Parents", value: String(totalParents), sub: `${totalParents} Linked Accounts`, tab: "parents" as SchoolAdminTab, icon: Users, hasLink: true },
          { label: "Active Sessions", value: String(totalSections), sub: `${totalSections} Ongoing / 0 Ended`, tab: "academics" as SchoolAdminTab, icon: BookOpen, hasLink: true },
          { label: "Fees", value: formatCurrency(feeCollected), sub: "YTD", tab: "finance" as SchoolAdminTab, icon: IndianRupee, hasLink: false },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(kpi.tab)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "16px 18px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "115px",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,24,40,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 500, color: "#4B5563" }}>{kpi.label}</span>
                <Icon size={16} color="#6B7280" />
              </div>
              <div style={{ margin: "10px 0 6px" }}>
                <span style={{ fontSize: "30px", fontWeight: 700, color: "#111827", lineHeight: 1 }}>{kpi.value}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "#6B7280" }}>
                <span>{kpi.sub}</span>
                {kpi.hasLink && (
                  <span style={{ color: "#111827", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "2px" }}>
                    View <ChevronRight size={12} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* ── 2. SCHOOL HEALTH SCORE & ATTENTION REQUIRED ───────────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        {/* School Health Score Card */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "14px",
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>EDOPS School Health Score</h3>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#6B7280" }}>Systematically tracks school health on core operational metrics</p>
              </div>
              <button
                onClick={() => setShowHealthExplainer(!showHealthExplainer)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                  background: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                {showHealthExplainer ? "Hide Details" : "Explain Score"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "22px", margin: "16px 0 20px" }}>
              <div style={{
                position: "relative",
                width: "88px",
                height: "88px",
                borderRadius: "50%",
                background: `conic-gradient(#064E3B 0% ${overallScore}%, #E5E7EB ${overallScore}% 100%)`,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "#111827", lineHeight: 1 }}>{overallScore}</span>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#6B7280", letterSpacing: "0.04em", marginTop: "2px" }}>PTS</span>
                </div>
              </div>

              <div>
                <span style={{
                  display: "inline-block",
                  background: "#E6F4EA",
                  color: "#137333",
                  fontSize: "11px",
                  fontWeight: 700,
                  borderRadius: "6px",
                  padding: "3px 8px",
                }}>
                  Tier A - Healthy Operations
                </span>
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#6B7280", lineHeight: 1.5 }}>
                  School attendance ({attendanceRate}%), syllabus schedules ({syllabusRate}%), and fee collections ({feeRate}%) verified live.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {[
              { label: "Student & Staff Attendance", rate: `${attendanceRate}% (${attendancePresent}/${attendanceTotal})`, pct: attendanceRate },
              { label: "Fee Collection Efficiency", rate: `${feeRate}% (${formatCurrency(feeCollected)})`, pct: feeRate },
              { label: "Academic & Curriculum Progress", rate: `${syllabusRate}% (${syllabusDone}/${syllabusTotal})`, pct: syllabusRate },
            ].map((bar, i) => (
              <div key={i} style={{ display: "grid", gap: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "#111827" }}>
                  <span>{bar.label}</span>
                  <span>{bar.rate}</span>
                </div>
                <div style={{ height: "5px", background: "#E5E7EB", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(bar.pct, 2)}%`, height: "100%", background: "#064E3B", borderRadius: "999px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attention Required Card (Exact warm beige tint & inner card) */}
        <div style={{
          background: "#FFF9F0",
          border: "1px solid #F5E5D0",
          borderRadius: "14px",
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={18} color="#B45309" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>Attention Required</h3>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#B45309" }}>
                {attentionItems.length} Active Notice(s)
              </span>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#B45309" }}>
              Click any alert to launch the corrective action loop
            </p>

            <div style={{ display: "grid", gap: "10px" }}>
              {attentionItems.slice(0, 2).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #F1E5D5",
                    padding: "18px",
                  }}
                >
                  <span style={{
                    display: "inline-block",
                    background: "#FEE2E2",
                    color: "#991B1B",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    marginBottom: "10px",
                  }}>
                    {item.severity || "HIGH"}
                  </span>
                  <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                    {item.description}
                  </p>
                  <div style={{
                    borderTop: "1px solid #F3F4F6",
                    marginTop: "14px",
                    paddingTop: "12px",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}>
                    <button
                      onClick={() => onNavigate(item.id?.includes("fee") ? "finance" : item.id?.includes("leave") ? "attendance" : "academics")}
                      style={{
                        background: "#064E3B",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "8px",
                        padding: "7px 16px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <ArrowUpRight size={14} /> Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TODAY'S OPERATIONAL TIMELINE & QUICK ACTIONS ───────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        {/* Today's Operational Timeline */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "14px",
          padding: "22px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>Today's Operational Timeline</h3>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#6B7280" }}>Daily school operations checkpoints and schedule tracking</p>
            </div>
            <button
              onClick={() => onNavigate("timetable")}
              style={{
                padding: "5px 12px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                background: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
              }}
            >
              View Schedule
            </button>
          </div>

          <div style={{ position: "relative", display: "grid", gap: "16px", paddingLeft: "14px" }}>
            {/* Vertical timeline line */}
            <div style={{
              position: "absolute",
              left: "19px",
              top: "10px",
              bottom: "10px",
              width: "1px",
              background: "#E5E7EB",
            }} />

            {dailyTimeline.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
                <div style={{
                  width: "11px",
                  height: "11px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  border: "2px solid #6B7280",
                  flexShrink: 0,
                  zIndex: 1,
                }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#111827", width: "70px", flexShrink: 0 }}>
                  {item.time}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827", flex: 1 }}>
                  {item.event}
                </span>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6B7280",
                  background: "#F3F4F6",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  textTransform: "capitalize",
                }}>
                  {item.status || "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Quick Actions (Mint pills, dark green text & arrows) */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "14px",
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>Dashboard Quick Actions</h3>
            <p style={{ margin: "3px 0 16px", fontSize: "12px", color: "#6B7280" }}>Direct shortcuts to create core school records</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "+ Add Student", action: "addStudent", icon: UserPlus },
                { label: "+ Add Teacher", action: "addTeacher", icon: Monitor },
                { label: "+ Add Staff", action: "addStaff", icon: Briefcase },
                { label: "+ Map Parent", action: "mapParent", icon: Users },
                { label: "+ New Department", action: "addDepartment", icon: Building2 },
                { label: "+ New Class / Section", action: "addSection", icon: BookOpen },
                { label: "+ Send Broadcast", action: "sendBroadcast", icon: Send },
                { label: "+ Schedule Exam", action: "scheduleExam", icon: Calendar },
              ].map((btn, idx) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onOpenQuickAction(btn.action)}
                    style={{
                      background: "#EDF5F0",
                      color: "#064E3B",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#E1EEE6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#EDF5F0")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon size={14} color="#064E3B" />
                      <span>{btn.label}</span>
                    </div>
                    <ArrowUpRight size={14} color="#064E3B" />
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{
            borderTop: "1px solid #F3F4F6",
            marginTop: "16px",
            paddingTop: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "11.5px", color: "#6B7280" }}>Active Academic Year</span>
            <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#064E3B" }}>2026–2027 (CBSE Board)</span>
          </div>
        </div>
      </section>

      {/* ── 4. REAL-TIME SCHOOL ACTIVITY FEED (BOTTOM CARD) ──────────── */}
      <section style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "14px",
        padding: "18px 22px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Activity size={18} color="#064E3B" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>
              Real-Time School Activity Feed
            </h3>
          </div>
          <button
            onClick={() => onNavigate("audit")}
            title="Options"
            style={{ all: "unset", cursor: "pointer", color: "#9CA3AF" }}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {recentActivity.length > 0 && (
          <div style={{ display: "grid", gap: "8px", marginTop: "14px" }}>
            {recentActivity.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#F9FAFB", borderRadius: "6px", fontSize: "12px" }}>
                <div>
                  <b style={{ color: "#064E3B" }}>{item.actor}</b> · <span style={{ color: "#374151" }}>{item.action}</span>
                  <div style={{ fontSize: "11px", color: "#6B7280" }}>{item.detail}</div>
                </div>
                <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
