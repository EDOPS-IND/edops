"use client";

import React, { useState } from "react";
import {
  Users, GraduationCap, Briefcase, HeartHandshake, AlertTriangle,
  TrendingUp, CheckCircle2, Clock, ArrowRight, Send, UserPlus,
  Building2, Calendar, CreditCard, BookOpen, ShieldAlert, Activity,
  ArrowUpRight, Target, ClipboardCheck, BellRing, ArrowRightCircle,
  ChevronRight
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
                      onClick={() => onNavigate(al.id?.includes("fee") ? "finance" : al.id?.includes("leave") ? "attendance" : "academics")}
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
          </div>
        </div>
      </section>

      {/* 3. TODAY'S TIMELINE & QUICK ACTIONS */}
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "20px" }}>
        {/* Operational Timeline */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#064E3B" }}>Today's Operational Timeline</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Daily school operations checkpoints and schedule tracking</p>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#064E3B", background: "#FDF9F0", border: "1px solid #E5CCA2", padding: "3px 8px", borderRadius: "6px" }}>
              Live Schedule
            </span>
          </div>

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
                        {op.status?.replace("_", " ")}
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
          </div>
        </div>

        {/* Dashboard Quick Actions */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "12px", padding: "22px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "17px", fontWeight: 800, color: "#064E3B" }}>Dashboard Quick Actions</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Direct shortcuts to create operational records</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "+ Add Student", action: "addStudent", icon: UserPlus },
              { label: "+ Add Teacher", action: "addTeacher", icon: Users },
              { label: "+ Add Staff", action: "addStaff", icon: Briefcase },
              { label: "+ Map Parent", action: "mapParent", icon: HeartHandshake },
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
                    padding: "10px 12px",
                    background: "#064E3B",
                    color: "#F8E7C9",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textAlign: "left",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#04382A")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#064E3B")}
                >
                  <Icon size={14} />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #E2DDD5" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#064E3B" }}>Active Academic Year:</span>
            <div style={{ marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--muted)" }}>
              <span>2026–2027 (CBSE Board)</span>
              <span style={{ color: "#064E3B", fontWeight: 700 }}>Ends 31 Mar 2027</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. REAL-TIME SCHOOL AUDIT ACTIVITY FEED (§55) */}
      <section style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "12px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Real-Time School Activity Feed</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Live auditable actions logged by faculty, accountants, and staff</p>
          </div>
          <button
            onClick={() => onNavigate("audit")}
            style={{ background: "transparent", border: "none", color: "#064E3B", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
          >
            Full Audit Log ↗
          </button>
        </div>

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
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
