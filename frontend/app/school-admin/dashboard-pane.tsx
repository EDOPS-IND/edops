"use client";

import React, { useState } from "react";
import {
  Users,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  UserPlus,
  Building2,
  Calendar,
  CreditCard,
  BookOpen,
  ShieldAlert,
  ChevronRight,
  Activity,
} from "lucide-react";
import { SchoolAdminTab } from "./types";

export function DashboardPane({
  onNavigate,
  onOpenQuickAction,
}: {
  onNavigate: (tab: SchoolAdminTab) => void;
  onOpenQuickAction: (action: string) => void;
}) {
  const [showHealthExplainer, setShowHealthExplainer] = useState(false);

  const healthScoreMetrics = [
    { name: "Student & Staff Attendance", score: 95, max: 100, weight: "25%", detail: "94.2% daily attendance average across all 32 class sections." },
    { name: "Academic & Curriculum Progress", score: 88, max: 100, weight: "20%", detail: "76% syllabus completed vs. 72% benchmark for Term 2." },
    { name: "Teacher Engagement & Workload", score: 93, max: 100, weight: "15%", detail: "89 of 92 teachers within balanced weekly period bounds." },
    { name: "Fee Collection Efficiency", score: 91, max: 100, weight: "20%", detail: "₹1.42 Cr collected out of ₹1.56 Cr expected for Q3." },
    { name: "Communication & Parent Reach", score: 97, max: 100, weight: "10%", detail: "97% parent read rate on WhatsApp & portal announcements." },
    { name: "Daily Operations & Facilities", score: 90, max: 100, weight: "10%", detail: "All 8 transport routes verified; 1 pending library audit." },
  ];

  return (
    <div style={{ display: "grid", gap: "22px" }}>
      {/* 1. TOP EXECUTIVE KPI CARDS (§5) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {[
          { label: "Total Students", value: "1,420", sub: "98.2% Active · 180 New", tab: "students" as SchoolAdminTab, icon: GraduationCap, tone: "#064E3B" },
          { label: "Teaching Faculty", value: "92", sub: "78 Full-Time · 8 Part-Time", tab: "teachers" as SchoolAdminTab, icon: Users, tone: "#064E3B" },
          { label: "Operational Staff", value: "38", sub: "12 Transport · 8 Admin · 6 Finance", tab: "staff" as SchoolAdminTab, icon: Briefcase, tone: "#064E3B" },
          { label: "Registered Parents", value: "1,840", sub: "94.6% Linked to Portal", tab: "parents" as SchoolAdminTab, icon: HeartHandshake, tone: "#064E3B" },
          { label: "Active Sections", value: "36", sub: "Nursery to Grade 12 (CBSE)", tab: "academics" as SchoolAdminTab, icon: BookOpen, tone: "#064E3B" },
          { label: "Term 3 Fees Collected", value: "₹1.42 Cr", sub: "91.0% of ₹1.56 Cr Target", tab: "finance" as SchoolAdminTab, icon: CreditCard, tone: "#064E3B" },
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
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Deterministic metric score based on 6 core operational registers</p>
            </div>
            <button
              onClick={() => setShowHealthExplainer(!showHealthExplainer)}
              style={{ background: "#FDF9F0", border: "1px solid #E5CCA2", color: "#064E3B", padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
            >
              {showHealthExplainer ? "Hide Logic" : "Explain Score"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", margin: "18px 0" }}>
            <div style={{ position: "relative", width: "96px", height: "96px", borderRadius: "50%", background: "conic-gradient(#064E3B 0% 92%, #E2DDD5 92% 100%)", display: "grid", placeItems: "center" }}>
              <div style={{ width: "76px", height: "76px", borderRadius: "50%", background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "24px", fontWeight: 900, color: "#064E3B", lineHeight: 1 }}>92</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)" }}>/100</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "inline-block", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "3px 10px", borderRadius: "12px", fontSize: "11.5px", fontWeight: 700, color: "#064E3B" }}>
                Tier A · Healthy Operations
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: "#334155", lineHeight: 1.5 }}>
                School attendance, syllabus schedules, and fee collections are operating above state CBSE benchmark thresholds.
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
                  <div style={{ width: `${m.score}%`, height: "100%", background: "#064E3B", borderRadius: "3px" }} />
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
                <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                  4 Active Breaches
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
            {[
              {
                title: "34 Students Below 75% Statutory Attendance",
                category: "Attendance",
                desc: "Statutory CBSE minimum threshold breach detected in Class 10-B (8 students) and Class 9-A (12 students).",
                cta: "Send Parent Notice via WhatsApp",
                action: "broadcast",
                severity: "High",
              },
              {
                title: "Section 10-C Exceeding Room Capacity (47 / 45)",
                category: "Academics",
                desc: "Class capacity overflow in Room 204. Fire safety & comfort quota exceeded by 2 desks.",
                cta: "Reassign Section Desk",
                action: "academics",
                severity: "Medium",
              },
              {
                title: "3 Faculty Members in Overloaded Workload (>28 Periods)",
                category: "Teachers",
                desc: "Rahul Sharma (Maths, 30 periods), Sunita Rao (Science, 29 periods) exceeding balanced threshold.",
                cta: "Balance Timetable",
                action: "timetable",
                severity: "Medium",
              },
              {
                title: "18 Accounts Overdue >30 Days (Total ₹1.84 Lakh)",
                category: "Finance",
                desc: "Q3 Fee deadline passed on 15th Sep. 18 parents have not acknowledged reminder circulars.",
                cta: "Trigger Defaulter Circular",
                action: "finance",
                severity: "High",
              },
            ].map((al, idx) => (
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
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: al.severity === "High" ? "#991B1B" : "#B45309", background: al.severity === "High" ? "#FEE2E2" : "#FEF3C7", padding: "1px 6px", borderRadius: "4px" }}>
                      {al.category}
                    </span>
                    <b style={{ fontSize: "13px", color: "#064E3B" }}>{al.title}</b>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#334155", lineHeight: 1.4 }}>{al.desc}</p>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
                  <button
                    onClick={() => onNavigate(al.action as SchoolAdminTab)}
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
                    {al.cta} ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TODAY'S DAILY OPERATIONS FLOW & QUICK ACTIONS (§63, §65) */}
      <section style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "20px" }}>
        {/* Daily School Operations Flow (§65) */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "12px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#064E3B" }}>Today's Operational Timeline</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Morning roll calls · Daytime class periods · Evening collections & summaries
              </p>
            </div>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
              {new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date())}
            </span>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {[
              { time: "08:15 AM", phase: "Morning", title: "Faculty & Student Morning Assembly Attendance", status: "Completed", note: "35 of 36 sections submitted on time (10-C pending teacher signoff)." },
              { time: "10:30 AM", phase: "Morning", title: "Transport Fleet Arrival Verification", status: "Verified", note: "All 8 school buses reported safely on campus with GPS telemetry active." },
              { time: "12:45 PM", phase: "Midday", title: "Mid-Term Periodic Test 2 Examination Submissions", status: "In Progress", note: "Science Lab practical marks entered for Grade 10-A and 10-B." },
              { time: "03:30 PM", phase: "Evening", title: "Daily Fee Counter & Bank Reconciliation", status: "Scheduled", note: "₹84,000 cash and UPI counter collection ready for vault audit." },
            ].map((op, idx) => (
              <div key={idx} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "12px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5" }}>
                <div style={{ width: "70px", flexShrink: 0 }}>
                  <b style={{ fontSize: "12px", color: "#064E3B" }}>{op.time}</b>
                  <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>{op.phase}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontSize: "13px", color: "#064E3B" }}>{op.title}</b>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: op.status === "Completed" || op.status === "Verified" ? "#064E3B" : "#B45309", background: op.status === "Completed" || op.status === "Verified" ? "#ECFDF5" : "#FEF3C7", padding: "2px 8px", borderRadius: "10px" }}>
                      {op.status}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>{op.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Quick Actions (§63) */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "12px", padding: "22px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "17px", fontWeight: 800, color: "#064E3B" }}>Dashboard Quick Actions</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Direct short-cuts to create operational records</p>
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
          {[
            { actor: "Sunita Roy (Accountant)", action: "Recorded Offline Fee Payment", detail: "₹18,500 collected for Aryan Sharma (10-A, Receipt #4092)", time: "12m ago" },
            { actor: "Rahul Sharma (Maths HOD)", action: "Published Unit Test 2 Marks", detail: "38 student results finalized for Class 10-A", time: "34m ago" },
            { actor: "Priya Varma (Class 9 Teacher)", action: "Submitted Daily Attendance Register", detail: "Class 9-A attendance finalized: 42 Present, 2 Absent", time: "1h ago" },
            { actor: "System Automator", action: "SMS / WhatsApp Notification Dispatched", detail: "PTM meeting reminder delivered to 142 parent contacts", time: "2h ago" },
            { actor: "Admin (You)", action: "Approved Teacher Casual Leave", detail: "Vikram Mehta (Physics) approved for Oct 12", time: "3h ago" },
          ].map((item, idx) => (
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
          ))}
        </div>
      </section>
    </div>
  );
}
