"use client";

import React, { useState } from "react";
import {
  Users, GraduationCap, Briefcase, HeartHandshake, AlertTriangle,
  TrendingUp, CheckCircle2, Clock, ArrowRight, Send, UserPlus,
  Building2, Calendar, CreditCard, BookOpen, ShieldAlert, Activity,
  ArrowUpRight, Target, ClipboardCheck, BellRing, ArrowRightCircle
} from "lucide-react";
import { SchoolAdminTab } from "./types";

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
  onNavigate,
  onOpenQuickAction,
}: {
  onNavigate: (tab: SchoolAdminTab) => void;
  onOpenQuickAction: (action: string) => void;
}) {
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
              ))}
            </div>
          </div>

        </div>
      </section>

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
          ))}
        </div>
      </section>

    </div>
  );
}
