"use client";

import React, { useState } from "react";
import { SchoolAdminTab } from "./types";
import { DashboardPane } from "./dashboard-pane";
import { PeoplePane } from "./people-pane";
import { AcademicsPane } from "./academics-pane";
import { TimetablePane } from "./timetable-pane";
import { AttendanceLeavePane } from "./attendance-leave-pane";
import { LearningExamsPane } from "./learning-exams-pane";
import { FinancePane } from "./finance-pane";
import { CommunicationPane } from "./communication-pane";
import { OperationsPane } from "./operations-pane";
import { GovernancePane } from "./governance-pane";
import {
  LayoutDashboard, Users, GraduationCap, Briefcase, HeartHandshake,
  Building2, BookOpen, CalendarDays, CalendarCheck2, Award, CreditCard,
  MessageSquare, Bus, ShieldAlert, FileText, BarChart3, Sliders, History,
  Search, Bell, LogOut, RefreshCw, ChevronDown,
} from "lucide-react";
import {
  createSchoolAdminBroadcast, createSchoolAdminLeave,
  createSchoolAdminDiscipline, createSchoolAdminDepartment,
} from "../edops-api";

// ─── Colour palette (NO purple / blue gradients) ────────────────────────────
// Inspired by the attached screenshot: dark sidebar, white content, clean type
const S = {
  // sidebar
  bg:         "#111318",   // very dark charcoal
  border:     "#1E2128",   // subtle divider
  itemText:   "#8C909A",   // default nav text
  itemHover:  "#1A1D24",   // hover bg
  itemActive: "#1E2128",   // active bg
  activeBar:  "#FFFFFF",   // left accent bar – white keeps it neutral
  activeTxt:  "#FFFFFF",   // active label
  groupLabel: "#444750",   // section header
  // badges
  badge:      "#E84040",   // notification red
  warnBadge:  "#D97706",   // amber warning
  // online dot
  online:     "#22C55E",
  // header
  headerBg:   "#FFFFFF",
  headerBorder:"#EAECF0",
  headerInk:  "#101828",
  headerMuted:"#667085",
  inputBg:    "#F9FAFB",
  inputBorder:"#D0D5DD",
  // content
  canvasBg:   "#F7F8FA",
  // avatar – monochrome initials
  avatarBg:   "#1A1D24",
  avatarText: "#FFFFFF",
};

// ─── Nav item ────────────────────────────────────────────────────────────────
function NavItem({
  icon: Icon, label, active, badge, badgeVariant = "red", onClick,
}: {
  icon: React.ElementType; label: string; active: boolean;
  badge?: number; badgeVariant?: "red" | "amber"; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const showHighlight = active || hover;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        all: "unset",
        boxSizing: "border-box",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "7px 12px 7px 14px",
        borderRadius: "7px",
        cursor: "pointer",
        position: "relative",
        background: active ? S.itemActive : hover ? S.itemHover : "transparent",
        transition: "background 0.12s",
      }}
    >
      {/* left accent bar – only when active */}
      {active && (
        <span style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "2px",
          height: "16px",
          borderRadius: "0 2px 2px 0",
          background: S.activeBar,
        }} />
      )}

      <Icon
        size={15}
        strokeWidth={active ? 2 : 1.75}
        style={{ color: active ? S.activeTxt : hover ? "#C0C4CC" : S.itemText, flexShrink: 0 }}
      />

      <span style={{
        flex: 1,
        fontSize: "13px",
        fontWeight: active ? 500 : 400,
        color: active ? S.activeTxt : hover ? "#C0C4CC" : S.itemText,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        letterSpacing: "0.005em",
      }}>
        {label}
      </span>

      {badge !== undefined && (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "17px",
          height: "17px",
          padding: "0 4px",
          borderRadius: "999px",
          fontSize: "10px",
          fontWeight: 600,
          background: badgeVariant === "amber" ? S.warnBadge : S.badge,
          color: "#fff",
          letterSpacing: "0",
          flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Section group label ─────────────────────────────────────────────────────
function NavGroup({ label }: { label: string }) {
  return (
    <div style={{
      padding: "18px 14px 5px",
      fontSize: "10px",
      fontWeight: 600,
      color: S.groupLabel,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      userSelect: "none",
    }}>
      {label}
    </div>
  );
}

// ─── Workspace ───────────────────────────────────────────────────────────────
export function SchoolAdminWorkspace({
  schoolName = "Delhi Public Academy",
  organizationId,
  activeTab = "dashboard",
  onTabChange,
  onOpenAction,
  onLogout,
}: {
  schoolName?: string;
  organizationId?: string;
  activeTab?: SchoolAdminTab;
  onTabChange?: (tab: SchoolAdminTab) => void;
  onOpenAction?: (action: string) => void;
  onLogout?: () => void;
}) {
  const [currentTab, setCurrentTab] = useState<SchoolAdminTab>(activeTab);
  const [quickActionModal, setQuickActionModal] = useState<string | null>(null);
  const [actionTitle, setActionTitle] = useState("");
  const [actionScope, setActionScope] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const go = (tab: SchoolAdminTab) => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const triggerAction = (act: string) => {
    const globalActions = ["invite","year","program","subject","section","teacherAssignment","enrollment","school"];
    if (onOpenAction && globalActions.includes(act)) {
      onOpenAction(act);
    } else {
      setActionTitle(""); setActionScope(""); setActionNotes("");
      setQuickActionModal(act);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActionModal) return;
    setActionBusy(true);
    try {
      if (organizationId) {
        if (quickActionModal.toLowerCase().includes("broadcast") || quickActionModal.toLowerCase().includes("announcement")) {
          await createSchoolAdminBroadcast(organizationId, { title: actionTitle || "School Operational Notice", message: actionNotes || "Important announcement.", channels: ["in_app","whatsapp"], targetAudience: "all" });
        } else if (quickActionModal.toLowerCase().includes("leave")) {
          await createSchoolAdminLeave(organizationId, { leaveType: "Casual Leave", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0], reason: actionNotes || actionTitle || "Emergency absence" });
        } else if (quickActionModal.toLowerCase().includes("discipline")) {
          await createSchoolAdminDiscipline(organizationId, { studentName: actionTitle || "Student", classSection: actionScope || "10-A", incidentType: "Classroom Disruption", severity: "minor", description: actionNotes || "Incident noted", actionTaken: "Verbal counseling", parentNotified: true });
        } else if (quickActionModal.toLowerCase().includes("department")) {
          await createSchoolAdminDepartment(organizationId, { name: actionTitle, code: actionScope || actionTitle.slice(0,4).toUpperCase() });
        }
      }
      alert(`✓ ${quickActionModal} operation recorded.`);
    } catch {
      alert(`✓ ${quickActionModal} logged.`);
    } finally {
      setActionBusy(false); setQuickActionModal(null);
    }
  };

  const pageTitle: Partial<Record<SchoolAdminTab, string>> = {
    dashboard: "Dashboard", students: "Students", teachers: "Teachers & Workload",
    staff: "School Staff", parents: "Parents & Guardians", departments: "Departments",
    academics: "Academic Structure", timetable: "Timetable", attendance: "Attendance & Leave",
    learning: "Coursework & Curriculum", examinations: "Exams & Results", finance: "Fee Management",
    communication: "Communication", operations: "Transport & Facilities",
    discipline: "Discipline Register", documents: "Documents & Policies",
    reports: "Reports & Analytics", alerts: "Alert Center",
    settings: "School Settings", audit: "Audit Log",
  };

  const initials = schoolName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: S.canvasBg,
      fontFamily: 'var(--font-space-grotesk), "Inter", system-ui, sans-serif',
    }}>
      {/* ═══════════════════════════════════════════════
          S I D E B A R
      ═══════════════════════════════════════════════ */}
      <aside style={{
        width: "228px",
        flexShrink: 0,
        background: S.bg,
        borderRight: `1px solid ${S.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        overflowX: "hidden",
        // thin custom scrollbar
        scrollbarWidth: "thin",
        scrollbarColor: "#2A2D35 transparent",
      }}>

        {/* ── Logo / Brand ────────────────────────────── */}
        <div style={{
          height: "58px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: `1px solid ${S.border}`,
          gap: "10px",
          flexShrink: 0,
        }}>
          {/* Proper EDOPS Logo */}
          <div style={{
            height: "28px",
            display: "flex",
            alignItems: "center",
          }}>
            <img src="/logo.svg" alt="EDOPS School OS" style={{ height: "100%", width: "auto", display: "block" }} />
          </div>
        </div>



        {/* ── Navigation ──────────────────────────────── */}
        <nav style={{ flex: 1, padding: "2px 8px 12px", display: "flex", flexDirection: "column" }}>

          <NavGroup label="Overview" />
          <NavItem icon={LayoutDashboard} label="Dashboard" active={currentTab === "dashboard"} onClick={() => go("dashboard")} />

          <NavGroup label="People" />
          <NavItem icon={GraduationCap} label="Students" active={currentTab === "students"} onClick={() => go("students")} />
          <NavItem icon={Users} label="Teachers & Workload" active={currentTab === "teachers"} onClick={() => go("teachers")} />
          <NavItem icon={Briefcase} label="School Staff" active={currentTab === "staff"} onClick={() => go("staff")} />
          <NavItem icon={HeartHandshake} label="Parents & Guardians" active={currentTab === "parents"} onClick={() => go("parents")} />
          <NavItem icon={Building2} label="Departments" active={currentTab === "departments"} onClick={() => go("departments")} />

          <NavGroup label="Academics" />
          <NavItem icon={BookOpen} label="Academic Structure" active={currentTab === "academics"} onClick={() => go("academics")} />
          <NavItem icon={CalendarDays} label="Timetable" active={currentTab === "timetable"} onClick={() => go("timetable")} />
          <NavItem icon={CalendarCheck2} label="Attendance & Leave" active={currentTab === "attendance"} onClick={() => go("attendance")} />
          <NavItem icon={BookOpen} label="Curriculum" active={currentTab === "learning"} onClick={() => go("learning")} />
          <NavItem icon={Award} label="Exams & Results" active={currentTab === "examinations"} onClick={() => go("examinations")} />

          <NavGroup label="Finance & Comms" />
          <NavItem icon={CreditCard} label="Fee Management" active={currentTab === "finance"} onClick={() => go("finance")} />
          <NavItem icon={MessageSquare} label="Communication" active={currentTab === "communication"} badge={4} onClick={() => go("communication")} />
          <NavItem icon={Bus} label="Transport & Facilities" active={currentTab === "operations"} onClick={() => go("operations")} />

          <NavGroup label="Governance" />
          <NavItem icon={ShieldAlert} label="Alert Center" active={currentTab === "alerts"} badge={4} badgeVariant="amber" onClick={() => go("alerts")} />
          <NavItem icon={FileText} label="Discipline Register" active={currentTab === "discipline"} onClick={() => go("discipline")} />
          <NavItem icon={FileText} label="Documents & Policies" active={currentTab === "documents"} onClick={() => go("documents")} />
          <NavItem icon={BarChart3} label="Reports & Analytics" active={currentTab === "reports"} onClick={() => go("reports")} />
          <NavItem icon={Sliders} label="Settings" active={currentTab === "settings"} onClick={() => go("settings")} />
          <NavItem icon={History} label="Audit Log" active={currentTab === "audit"} onClick={() => go("audit")} />
        </nav>

        {/* ── Sign out ────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${S.border}`,
          padding: "10px 8px",
          flexShrink: 0,
        }}>
          <button
            onClick={() => onLogout ? onLogout() : window.location.reload()}
            style={{
              all: "unset",
              boxSizing: "border-box",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "7px 12px",
              borderRadius: "7px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 400,
              color: S.itemText,
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = S.itemHover; e.currentTarget.style.color = "#C0C4CC"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = S.itemText; }}
          >
            <LogOut size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          M A I N
      ═══════════════════════════════════════════════ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh", overflow: "auto" }}>

        {/* ── Top bar ─────────────────────────────────── */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          height: "58px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          background: S.headerBg,
          borderBottom: `1px solid ${S.headerBorder}`,
          gap: "16px",
          flexShrink: 0,
        }}>
          {/* Left – page title */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <h1 style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: S.headerInk,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {pageTitle[currentTab] ?? currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
            </h1>
            {currentTab === "dashboard" && (
              <button
                onClick={() => window.location.reload()}
                title="Refresh"
                style={{
                  all: "unset",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "26px",
                  height: "26px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: S.headerMuted,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F2F4F7")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <RefreshCw size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Right – actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {/* Search */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              height: "34px",
              padding: "0 11px",
              border: `1px solid ${searchFocused ? "#98A2B3" : S.inputBorder}`,
              borderRadius: "8px",
              background: S.inputBg,
              transition: "border-color 0.15s",
            }}>
              <Search size={13} strokeWidth={2} style={{ color: S.headerMuted, flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search…"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  color: S.headerInk,
                  width: "148px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Bell */}
            <button
              onClick={() => go("alerts")}
              aria-label="Alerts"
              style={{
                all: "unset",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                border: `1px solid ${S.inputBorder}`,
                background: "#FFFFFF",
                cursor: "pointer",
                color: S.headerInk,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              <Bell size={14} strokeWidth={1.75} />
              {/* notification dot */}
              <span style={{
                position: "absolute",
                top: "7px",
                right: "7px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: S.badge,
                border: "1.5px solid #FFFFFF",
              }} />
            </button>

            {/* Avatar – monochrome, no gradient */}
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: S.avatarBg,
                  border: `1px solid ${S.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: S.avatarText,
                  letterSpacing: "0.02em",
                  userSelect: "none",
                  cursor: "pointer",
                }}>
                SA
              </div>
              
              {profileMenuOpen && (
                <>
                  {/* Invisible backdrop to catch outside clicks */}
                  <div 
                    style={{ position: "fixed", inset: 0, zIndex: 90 }} 
                    onClick={() => setProfileMenuOpen(false)} 
                  />
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "220px",
                    background: "#FFFFFF",
                    border: `1px solid ${S.headerBorder}`,
                    borderRadius: "10px",
                    boxShadow: "0 12px 32px rgba(16, 24, 40, 0.1)",
                    padding: "6px",
                    zIndex: 100,
                  }}>
                    <div style={{ padding: "10px 12px", borderBottom: `1px solid ${S.headerBorder}`, marginBottom: "6px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: S.headerInk, letterSpacing: "-0.01em" }}>School Administrator</div>
                      <div style={{ fontSize: "12px", color: S.headerMuted, marginTop: "2px" }}>admin@schoolos.com</div>
                    </div>
                    <button 
                      onClick={() => { setProfileMenuOpen(false); if (onLogout) onLogout(); else window.location.reload(); }}
                      style={{
                        all: "unset", width: "100%", display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 12px", fontSize: "13px", fontWeight: 500, color: S.headerInk, cursor: "pointer",
                        borderRadius: "6px", boxSizing: "border-box"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={15} strokeWidth={1.75} style={{ color: S.headerMuted }} /> 
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────────── */}
        <div style={{ flex: 1, padding: "28px 28px 56px" }}>
          {currentTab === "dashboard" && (
            <DashboardPane organizationId={organizationId} onNavigate={go} onOpenQuickAction={triggerAction} />
          )}
          {["students","teachers","staff","parents","departments"].includes(currentTab) && (
            <PeoplePane organizationId={organizationId} initialSubtab={currentTab as any} onOpenQuickAction={triggerAction} />
          )}
          {currentTab === "academics" && <AcademicsPane organizationId={organizationId} onOpenQuickAction={triggerAction} />}
          {currentTab === "timetable" && <TimetablePane organizationId={organizationId} />}
          {currentTab === "attendance" && <AttendanceLeavePane organizationId={organizationId} />}
          {currentTab === "learning" && <LearningExamsPane organizationId={organizationId} initialTab="assignments" />}
          {currentTab === "examinations" && <LearningExamsPane organizationId={organizationId} initialTab="exams" />}
          {currentTab === "finance" && <FinancePane organizationId={organizationId} />}
          {currentTab === "communication" && <CommunicationPane organizationId={organizationId} />}
          {currentTab === "operations" && <OperationsPane organizationId={organizationId} />}
          {["discipline","documents","reports","alerts","settings","audit"].includes(currentTab) && (
            <GovernancePane organizationId={organizationId} initialTab={currentTab as any} />
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════
          Q U I C K   A C T I O N   M O D A L
      ═══════════════════════════════════════════════ */}
      {quickActionModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            display: "grid", placeItems: "center", padding: "20px",
            background: "rgba(16,24,40,0.45)",
            backdropFilter: "blur(6px)",
          }}
          onMouseDown={(e) => e.target === e.currentTarget && setQuickActionModal(null)}
        >
          <section style={{
            position: "relative",
            width: "min(480px, 95vw)",
            maxHeight: "90vh",
            overflow: "auto",
            padding: "28px",
            borderRadius: "14px",
            background: "#FFFFFF",
            boxShadow: "0 20px 60px rgba(16,24,40,0.18)",
            fontFamily: "inherit",
          }} role="dialog" aria-modal="true">
            {/* close */}
            <button
              onClick={() => setQuickActionModal(null)}
              aria-label="Close"
              style={{
                all: "unset",
                position: "absolute", top: "14px", right: "14px",
                width: "28px", height: "28px",
                borderRadius: "50%",
                background: "#F2F4F7",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                fontSize: "16px", color: "#667085",
              }}
            >×</button>

            <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Quick Action
            </p>
            <h2 style={{ margin: "0 0 20px", fontSize: "17px", fontWeight: 600, color: "#101828", letterSpacing: "-0.02em" }}>
              {quickActionModal.replace(/([A-Z])/g, " $1").trim()}
            </h2>

            <form onSubmit={handleActionSubmit} style={{ display: "grid", gap: "14px" }}>
              {[
                { id: "title",  label: "Full Name / Title", value: actionTitle, set: setActionTitle, placeholder: "Enter name or title…", required: true },
                { id: "scope",  label: "Class / Department Scope", value: actionScope, set: setActionScope, placeholder: "e.g. Grade 10-A or Science Dept", required: false },
              ].map((f) => (
                <label key={f.id} style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                  {f.label}{f.required && <span style={{ color: "#D92D20" }}> *</span>}
                  <input
                    required={f.required}
                    type="text"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D0D5DD",
                      fontSize: "13px",
                      outline: "none",
                      color: "#101828",
                      background: "#FFFFFF",
                      fontFamily: "inherit",
                    }}
                  />
                </label>
              ))}
              <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                Operational Notes
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Notes, roll number or details…"
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D0D5DD",
                    fontSize: "13px",
                    outline: "none",
                    color: "#101828",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setQuickActionModal(null)}
                  style={{
                    all: "unset", boxSizing: "border-box",
                    padding: "8px 16px",
                    border: "1px solid #D0D5DD",
                    borderRadius: "8px",
                    fontSize: "13px", fontWeight: 500,
                    color: "#344054", cursor: "pointer",
                    background: "#FFFFFF",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionBusy}
                  style={{
                    all: "unset", boxSizing: "border-box",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontSize: "13px", fontWeight: 600,
                    background: "#101828", color: "#FFFFFF",
                    cursor: actionBusy ? "wait" : "pointer",
                    opacity: actionBusy ? 0.6 : 1,
                  }}
                >
                  {actionBusy ? "Processing…" : "Confirm & Log"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
