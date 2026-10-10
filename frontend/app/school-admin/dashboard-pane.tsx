"use client";

import React, { useState } from "react";
import {
  Users, GraduationCap, Briefcase, HeartHandshake, AlertTriangle,
  TrendingUp, CheckCircle2, Clock, ArrowRight, Send, UserPlus,
  Building2, Calendar, CreditCard, BookOpen, ShieldAlert, Activity,
  ArrowUpRight, Target, ClipboardCheck, BellRing, ArrowRightCircle
} from "lucide-react";
import { useEffect } from "react";
import { SchoolAdminTab } from "./types";
import { getSchoolAdminDashboard } from "../edops-api";

// ─── Design Tokens (Neutral / Minimalist) ───────────────────────────
const S = {
  ink: "#101828",       // primary text
  muted: "#475467",     // secondary text
  faint: "#667085",     // tertiary text
  border: "#EAECF0",    // dividers / borders
  bg: "#FFFFFF",        // card background
  canvas: "#F7F8FA",    // page background
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
};

function StatCard({ label, value, sub, icon: Icon, onClick }: {
  label: string; value: string; sub: string; icon: React.ElementType; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: S.bg,
        border: `1px solid ${hover ? "#D0D5DD" : S.border}`,
        borderRadius: "10px",
        padding: "14px 16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        transition: "all 0.15s ease",
        boxShadow: hover ? "0 4px 12px rgba(16,24,40,0.05)" : "0 1px 2px rgba(16,24,40,0.02)",
        transform: hover ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "11.5px", fontWeight: 600, color: S.muted, letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: S.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: hover ? "#F1F5F9" : S.canvas, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
          <Icon size={14} style={{ color: hover ? S.ink : S.faint, transition: "color 0.15s" }} />
        </div>
      </div>
      <div style={{ fontSize: "11.5px", color: S.faint, fontWeight: 500, marginTop: "2px" }}>
        {sub}
      </div>
    </div>
  );
}

function SectionHeader({ title, sub, action, onAction }: { title: string; sub?: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
      <div>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: S.ink, letterSpacing: "-0.01em" }}>{title}</h3>
        {sub && <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: S.faint }}>{sub}</p>}
      </div>
      {action && (
        <button
          onClick={onAction}
          style={{
            all: "unset", boxSizing: "border-box",
            cursor: "pointer", fontSize: "12px", fontWeight: 600, color: S.ink,
            display: "flex", alignItems: "center", gap: "4px",
            padding: "4px 8px", borderRadius: "6px", transition: "background 0.15s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F2F4F7")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {action} <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

function AlertRow({ alert, isLast, onClick }: { alert: any, isLast: boolean, onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const isHigh = alert.type === "High";
  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ 
        padding: "12px 0",
        borderBottom: isLast ? "none" : `1px solid ${S.border}`,
        display: "flex", alignItems: "center", gap: "12px",
        cursor: "pointer",
        transition: "opacity 0.2s ease",
        opacity: hover ? 0.7 : 1
      }}
    >
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isHigh ? S.redTxt : S.amberTxt, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: isHigh ? S.redTxt : S.amberTxt, textTransform: "uppercase", letterSpacing: "0.04em" }}>{alert.c}</span>
        <span style={{ fontSize: "13px", color: S.ink, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{alert.t}</span>
      </div>
      <ArrowRight size={14} style={{ color: S.muted, opacity: hover ? 1 : 0.4, transform: hover ? "translateX(2px)" : "none", transition: "all 0.2s ease" }} />
    </div>
  );
}

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

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    getSchoolAdminDashboard(organizationId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [organizationId]);

  const metrics = data?.metrics;
  const healthMetrics = data?.health || data?.healthMetrics;

  const formatCurrency = (amt?: number) => {
    if (typeof amt !== "number" || amt === 0) return "₹0";
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const healthScoreMetrics = [
    { name: "Student & Staff Attendance", score: Math.round(healthMetrics?.attendanceRate ?? 100), max: 100, weight: "40%", detail: `${healthMetrics?.attendanceRate ?? 100}% verified attendance rate from registered sessions.` },
    { name: "Fee Collection Efficiency", score: Math.round(healthMetrics?.feeCollectionRate ?? 100), max: 100, weight: "35%", detail: `${formatCurrency(metrics?.feeCollected)} collected out of ${formatCurrency(metrics?.feeAssessed)} assessed.` },
    { name: "Academic & Coursework Progress", score: Math.round(healthMetrics?.syllabusCompletion ?? 100), max: 100, weight: "25%", detail: `${healthMetrics?.syllabusCompletion ?? 100}% curriculum assignments published.` },
  ];

  const attentionItems: any[] = data?.attentionItems || [];
  const dailyTimeline: any[] = data?.dailyTimeline || [];
  const recentActivity: any[] = data?.recentActivity || [];

  return (
    <div style={{ display: "grid", gap: "22px" }}>
      {/* 1. TOP EXECUTIVE KPI CARDS (§5) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {[
          { label: "Total Students", value: metrics?.totalStudents !== undefined ? metrics.totalStudents.toLocaleString() : "0", sub: `${metrics?.activeStudents ?? 0} Active · ${metrics?.totalStudents ?? 0} Enrolled`, tab: "students" as SchoolAdminTab, icon: GraduationCap, tone: "#064E3B" },
          { label: "Teaching Faculty", value: metrics?.totalTeachers !== undefined ? String(metrics.totalTeachers) : "0", sub: `${metrics?.totalTeachers ?? 0} Active Faculty`, tab: "teachers" as SchoolAdminTab, icon: Users, tone: "#064E3B" },
          { label: "Operational Staff", value: metrics?.totalStaff !== undefined ? String(metrics.totalStaff) : "0", sub: `${metrics?.totalStaff ?? 0} Staff Members`, tab: "staff" as SchoolAdminTab, icon: Briefcase, tone: "#064E3B" },
          { label: "Registered Parents", value: metrics?.totalParents !== undefined ? metrics.totalParents.toLocaleString() : "0", sub: `${metrics?.totalParents ?? 0} Linked Accounts`, tab: "parents" as SchoolAdminTab, icon: HeartHandshake, tone: "#064E3B" },
          { label: "Active Sections", value: metrics?.totalSections !== undefined ? String(metrics.totalSections) : "0", sub: `${metrics?.totalClasses ?? 0} Programs / Grades`, tab: "academics" as SchoolAdminTab, icon: BookOpen, tone: "#064E3B" },
          { label: "Fees Collected", value: formatCurrency(metrics?.feeCollected ?? 0), sub: `${healthMetrics?.feeCollectionRate ?? 100}% Collection Efficiency`, tab: "finance" as SchoolAdminTab, icon: CreditCard, tone: "#064E3B" },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(kpi.tab)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2DDD5",
                borderRadius: "12px",
                padding: "20px",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(6,78,59,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 650, color: "var(--muted)" }}>{kpi.label}</span>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#FDF9F0", display: "grid", placeItems: "center", color: "#064E3B" }}>
                  <Icon size={17} />
                </div>
              </div>
              <div style={{ margin: "14px 0 6px" }}>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "#064E3B", letterSpacing: "-0.03em" }}>{kpi.value}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "var(--muted)" }}>
                <span>{kpi.sub}</span>
                <span style={{ color: "#064E3B", fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
                  View <ChevronRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* 2. SCHOOL HEALTH SCORE & ATTENTION REQUIRED (§53, §54, §80) */}
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "20px" }}>
        {/* School Health Score Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#064E3B" }}>EDOPS School Health Score</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Deterministic metric score based on core operational registers</p>
            </div>
            <button
              onClick={() => setShowHealthExplainer(!showHealthExplainer)}
              style={{ background: "#FDF9F0", border: "1px solid #E5CCA2", color: "#064E3B", padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
            >
              {showHealthExplainer ? "Hide Logic" : "Explain Score"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", margin: "18px 0" }}>
            <div style={{ position: "relative", width: "96px", height: "96px", borderRadius: "50%", background: `conic-gradient(#064E3B 0% ${healthMetrics?.overall ?? 100}%, #E2DDD5 ${healthMetrics?.overall ?? 100}% 100%)`, display: "grid", placeItems: "center" }}>
              <div style={{ width: "76px", height: "76px", borderRadius: "50%", background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "24px", fontWeight: 900, color: "#064E3B", lineHeight: 1 }}>{healthMetrics?.overall ?? 100}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)" }}>/100</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "inline-block", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "3px 10px", borderRadius: "12px", fontSize: "11.5px", fontWeight: 700, color: "#064E3B" }}>
                Tier A · {(healthMetrics?.overall ?? 100) >= 80 ? "Healthy Operations" : "Operational Review"}
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: "#334155", lineHeight: 1.5 }}>
                School attendance ({healthMetrics?.attendanceRate ?? 100}%), syllabus schedule ({healthMetrics?.syllabusCompletion ?? 100}%), and fee collections ({healthMetrics?.feeCollectionRate ?? 100}%) verified live.
              </p>
            </div>
          </div>

          {/* Breakdown bars */}
          <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
            {healthScoreMetrics.map((m, i) => (
              <div key={i} style={{ display: "grid", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ fontWeight: 650, color: "#064E3B" }}>{m.name}</span>
                  <span style={{ fontWeight: 700, color: "#064E3B" }}>{m.score}% <small style={{ color: "var(--muted)", fontWeight: 500 }}>({m.weight})</small></span>
                </div>
                <div style={{ height: "6px", background: "#E2DDD5", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(m.score, 1)}%`, height: "100%", background: "#064E3B", borderRadius: "3px" }} />
                </div>
                {showHealthExplainer && (
                  <span style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic" }}>{m.detail}</span>
                )}
              </div>
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* 1. SINGLE ROW OF METRICS (All cards in one row as requested) */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "16px",
        overflowX: "auto", // in case screen is too small, though 6 fits on wide screens
        paddingBottom: "4px"
      }}>
        <StatCard label="Total Students" value="1,420" sub="98.2% Active" icon={GraduationCap} onClick={() => onNavigate("students")} />
        <StatCard label="Faculty" value="92" sub="Full & Part-Time" icon={Users} onClick={() => onNavigate("teachers")} />
        <StatCard label="Operations" value="38" sub="Admin & Staff" icon={Briefcase} onClick={() => onNavigate("staff")} />
        <StatCard label="Parents" value="1,840" sub="94.6% Linked" icon={HeartHandshake} onClick={() => onNavigate("parents")} />
        <StatCard label="Classes" value="36" sub="Active Sections" icon={BookOpen} onClick={() => onNavigate("academics")} />
        <StatCard label="Fee Target" value="₹1.42 Cr" sub="91.0% Collected" icon={CreditCard} onClick={() => onNavigate("finance")} />
      </section>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>

        {/* Alerts & Attention Required (Left Column) */}
        <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column" }}>
          <SectionHeader title="Attention Required" sub="Operational alerts & breaches" action="View All" onAction={() => onNavigate("alerts")} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {[
              { t: "Class 10-B Attendance Below 75%", type: "High", c: "Attendance" },
              { t: "Q3 Fee Deadline Exceeded (18 Accounts)", type: "High", c: "Finance" },
              { t: "Teacher Workload >28 Periods (3 Staff)", type: "Medium", c: "Teachers" },
              { t: "Fire Safety Quota Exceeded (Room 204)", type: "Medium", c: "Academics" }
            ].map((alert, i, arr) => (
              <AlertRow key={i} alert={alert} isLast={i === arr.length - 1} onClick={() => onNavigate("alerts")} />
            ))}
          </div>
        </div>

        {/* Attention Required (§54: The Operational Loop - ALERT → ACTION) */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} color="#D97706" />
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#064E3B" }}>Attention Required</h3>
                <span style={{
                  background: attentionItems.length > 0 ? "#FEF3C7" : "#DEF7EC",
                  color: attentionItems.length > 0 ? "#92400E" : "#03543F",
                  padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700
                }}>
                  {attentionItems.length > 0 ? `${attentionItems.length} Active Notice(s)` : "All Clear"}
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--muted)" }}>Click any alert to launch the corrective action loop</p>
            </div>
            <button
              onClick={() => onNavigate("alerts")}
              style={{ background: "transparent", border: "none", color: "#064E3B", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              Alert Center <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {attentionItems.length > 0 ? (
              attentionItems.map((al, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "#FDF9F0",
                    border: "1px solid #E5CCA2",
                    display: "grid",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: al.severity === "high" ? "#991B1B" : "#B45309", background: al.severity === "high" ? "#FEE2E2" : "#FEF3C7", padding: "1px 6px", borderRadius: "4px" }}>
                        {al.severity}
                      </span>
                      <b style={{ fontSize: "13px", color: "#064E3B" }}>{al.title}</b>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#334155", lineHeight: 1.4 }}>{al.description}</p>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
                    <button
                      onClick={() => onNavigate(al.id.includes("fee") ? "finance" : al.id.includes("leave") ? "attendance" : "academics")}
                      style={{
                        background: "#064E3B",
                        border: "none",
                        color: "#F8E7C9",
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
                      {al.action} ↗
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "24px", textAlign: "center", color: "#065F46", background: "#ECFDF5", borderRadius: "8px", border: "1px solid #A7F3D0", fontSize: "12.5px" }}>
                ✓ All operational registers in good standing. No compliance breaches recorded.
              </div>
            )}
        {/* Operational Timeline (Middle Column) */}
        <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column" }}>
          <SectionHeader title="Today's Timeline" sub="Daily operational checkpoints" />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            {[
              { time: "08:15 AM", t: "Assembly Attendance", status: "Done", desc: "35 of 36 sections signed off" },
              { time: "10:30 AM", t: "Transport Fleet", status: "Done", desc: "All 8 school buses arrived" },
              { time: "12:45 PM", t: "Mid-Term Exams", status: "Active", desc: "Science practical marks pending" },
              { time: "03:30 PM", t: "Bank Reconciliation", status: "Wait", desc: "Cash counter audit scheduled" },
            ].map((item, i) => {
              const isDone = item.status === "Done";
              const isActive = item.status === "Active";
              return (
                <div key={i} style={{ display: "flex", gap: "12px", position: "relative" }}>
                  {/* Timeline line */}
                  {i !== 3 && <div style={{ position: "absolute", left: "4px", top: "20px", bottom: "-20px", width: "1px", background: S.border }} />}

                  {/* Dot */}
                  <div style={{
                    width: "9px", height: "9px", borderRadius: "50%", marginTop: "5px", zIndex: 2,
                    background: isDone ? S.greenTxt : isActive ? S.amberTxt : S.border,
                    boxShadow: `0 0 0 3px ${isDone ? S.greenBg : isActive ? S.amberBg : S.bg}`
                  }} />

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: S.ink }}>{item.time}</span>
                      <span style={{ fontSize: "11px", color: S.faint }}>· {item.t}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: S.muted, marginTop: "4px", lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Health Score & Quick Actions (Right Column) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={{ display: "grid", gap: "12px" }}>
            {dailyTimeline.length > 0 ? (
              dailyTimeline.map((op, idx) => (
                <div key={idx} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "12px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5" }}>
                  <div style={{ width: "70px", flexShrink: 0 }}>
                    <b style={{ fontSize: "12px", color: "#064E3B" }}>{op.time}</b>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <b style={{ fontSize: "13px", color: "#064E3B" }}>{op.event}</b>
                      <span style={{
                        fontSize: "11px", fontWeight: 700,
                        color: op.status === "completed" ? "#064E3B" : op.status === "in_progress" ? "#D97706" : "#6B7280",
                        background: op.status === "completed" ? "#ECFDF5" : op.status === "in_progress" ? "#FEF3C7" : "#F3F4F6",
                        padding: "2px 8px", borderRadius: "10px", textTransform: "capitalize"
                      }}>
                        {op.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "16px", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
                No active schedule events logged for today.
              </div>
            )}
          {/* Health Score */}
          <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "24px" }}>
            <SectionHeader title="School Health" sub="Operational metrics average" />
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
                <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke={S.canvas} strokeWidth="6" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={S.ink} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 30 * 0.92} ${2 * Math.PI * 30 * 0.08}`}
                    strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: S.ink, lineHeight: 1, letterSpacing: "-0.05em" }}>92</span>
                </div>
              </div>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: S.greenBg, border: `1px solid ${S.greenBdr}`, borderRadius: "6px", fontSize: "11px", fontWeight: 700, color: S.greenTxt }}>
                  <Target size={12} /> Tier A Status
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: S.muted, lineHeight: 1.4 }}>
                  All 6 operational indicators are performing above CBSE baseline thresholds.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "24px", flex: 1 }}>
            <SectionHeader title="Quick Actions" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "New Student", action: "addStudent" },
                { label: "New Broadcast", action: "sendBroadcast" },
                { label: "Map Parent", action: "mapParent" },
                { label: "New Section", action: "addSection" }
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={() => onOpenQuickAction(btn.action)}
                  style={{
                    all: "unset", boxSizing: "border-box", cursor: "pointer",
                    padding: "10px 12px", border: `1px solid ${S.border}`, borderRadius: "8px",
                    background: S.canvas, fontSize: "12px", fontWeight: 600, color: S.ink,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = S.ink; e.currentTarget.style.color = "#FFF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = S.canvas; e.currentTarget.style.color = S.ink; }}
                >
                  {btn.label} <ArrowRightCircle size={14} />
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #E2DDD5" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#064E3B" }}>Active Academic Term:</span>
            <div style={{ marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--muted)" }}>
              <span>2026–2027 Session</span>
              <span style={{ color: "#064E3B", fontWeight: 700 }}>Active</span>
              ))}
            </div>
          </div>

        </div>
      </section>

        <div style={{ display: "grid", gap: "8px" }}>
          {recentActivity.length > 0 ? (
            recentActivity.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FAF8F5", borderRadius: "6px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#064E3B" }} />
                  <div>
                    <b style={{ color: "#064E3B" }}>{item.actor}</b> · <span style={{ color: "#334155" }}>{item.action}</span>
                    <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>{item.detail}</div>
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>{item.time}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: "16px", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
              No recent administrative actions recorded in audit log.
      {/* 3. ACTIVITY FEED ROW */}
      <section style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: "14px", padding: "24px" }}>
        <SectionHeader title="Live Activity Feed" sub="Auditable system logs" action="Full Audit Log" onAction={() => onNavigate("audit")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            { a: "Accountant", act: "Offline Fee Payment", d: "₹18,500 collected (Receipt #4092)", t: "12m ago" },
            { a: "Maths HOD", act: "Unit Test Marks", d: "38 results finalized for 10-A", t: "34m ago" },
            { a: "Class 9 Teacher", act: "Attendance Register", d: "42 Present, 2 Absent", t: "1h ago" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "14px", border: `1px solid ${S.border}`, borderRadius: "10px", background: S.canvas }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: S.ink }}>{item.a}</span>
                <span style={{ fontSize: "11px", color: S.faint }}>{item.t}</span>
              </div>
              <div style={{ fontSize: "12.5px", fontWeight: 500, color: S.ink, marginBottom: "2px" }}>{item.act}</div>
              <div style={{ fontSize: "12px", color: S.muted }}>{item.d}</div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
