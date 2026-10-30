"use client";

import { useState, useEffect, type ReactNode, type ElementType } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  BookOpen,
  Clock,
  ClipboardList,
  GraduationCap,
  Award,
  UserCheck,
  MessageSquare,
  BarChart2,
  Bell,
  FileText,
  Activity,
  Search,
  Plus,
  ChevronDown,
  LogOut,
  Menu,
  X,
  HeartPulse,
} from "lucide-react";

// Panes
import { DashboardPane } from "./panes/dashboard-pane";
import { PlanningPane } from "./panes/planning-pane";
import { TeachersPane } from "./panes/teachers-pane";
import { AcademicsPane } from "./panes/academics-pane";
import { TimetablePane } from "./panes/timetable-pane";
import { AttendancePane } from "./panes/attendance-pane";
import { LearningPane } from "./panes/learning-pane";
import { AssessmentsPane } from "./panes/assessments-pane";
import { ExaminationsPane } from "./panes/examinations-pane";
import { StudentsPane } from "./panes/students-pane";
import { CommunicationPane } from "./panes/communication-pane";
import { AnalyticsAuditPane } from "./panes/analytics-audit-pane";
import { AlertsPane } from "./panes/alerts-pane";
import { ReportsPane } from "./panes/reports-pane";
import { ActivityPane } from "./panes/activity-pane";
import { NotificationBellDropdown } from "../components/notification-bell-dropdown";

// Modals & Drawers
import { AcademicHealthModal } from "./components/academic-health-modal";
import { GlobalSearchModal } from "./components/global-search-modal";
import { GlobalPortalSearch } from "../components/global-portal-search";
import { TeacherProfileDrawer } from "./panes/teacher-profile-drawer";
import { Student360Modal } from "./panes/student-360-modal";

import { OrganizationSummary, getStudentAvatarUrl, invalidateApiCache } from "../edops-api";
import { useDashboardNavigation } from "../dashboard-navigation";
import { FeatureUnavailableCard, ThreeDotsLoading } from "../components/feature-unavailable-card";
import { PrincipalTab } from "./types";

// ─── Design Tokens (Strictly synchronized with School Admin & System Specs) ───
const S = {
  // Sidebar tokens
  sidebarBg: "#0b0f19",
  sidebarBorder: "rgba(255, 255, 255, 0.06)",
  itemActiveBg: "#1c2337",
  itemActiveText: "#ffffff",
  itemInactiveText: "#8a92a6",
  itemHoverBg: "rgba(255, 255, 255, 0.05)",
  groupLabel: "rgba(255, 255, 255, 0.38)",
  // Badges
  badge: "#E84040",
  warnBadge: "#D97706",
  online: "#22C55E",
  // Header tokens
  headerBg: "#FFFFFF",
  headerBorder: "rgba(206, 216, 229, 0.97)",
  headerInk: "#0c1e33",
  headerMuted: "#495d72",
  inputBg: "#F9FAFB",
  inputBorder: "#D0D5DD",
  // Canvas tokens
  canvasBg: "#f4f6f7",
  navy: "#0c1e33",
  slate: "#495d72",
  line: "#ced8e5",
  border: "#e4e6e9",
  chip: "#f5f6f8",
  faint: "#b3b3b3",
};

// ─── NavItem Component (100% Shared Design Parity with School Admin) ─────────
function NavItem({
  icon: Icon,
  label,
  active,
  badge,
  badgeVariant = "red",
  onClick,
}: {
  icon: ElementType;
  label: string;
  active: boolean;
  badge?: number;
  badgeVariant?: "red" | "amber";
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
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
        gap: "11px",
        height: "40px",
        padding: "0 12px",
        borderRadius: "10px",
        cursor: "pointer",
        position: "relative",
        background: active ? S.itemActiveBg : hover ? S.itemHoverBg : "transparent",
        color: active ? S.itemActiveText : hover ? "#ffffff" : S.itemInactiveText,
        fontWeight: active ? 600 : 450,
        fontSize: "13.5px",
        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Icon
        size={18}
        strokeWidth={active ? 2 : 1.75}
        style={{
          color: active ? "#ffffff" : hover ? "#ffffff" : S.itemInactiveText,
          flexShrink: 0,
          transition: "color 0.15s ease",
        }}
      />
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {badge !== undefined && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "18px",
            height: "18px",
            padding: "0 5px",
            borderRadius: "999px",
            fontSize: "10.5px",
            fontWeight: 700,
            background: badgeVariant === "amber" ? S.warnBadge : S.badge,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Categorized Flat Navigation Specification ─────────────────────────────────
const principalNavSections = [
  {
    key: "overview",
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    key: "operations",
    label: "Academic Operations",
    items: [
      { id: "planning", label: "Academic Planning", icon: CalendarCheck },
      { id: "academics", label: "Academics & Classes", icon: BookOpen },
      { id: "timetable", label: "Timetable", icon: Clock },
      { id: "attendance", label: "Attendance", icon: UserCheck },
      { id: "people", label: "Faculty & Workload", icon: Users },
    ],
  },
  {
    key: "learning_eval",
    label: "Student & Learning",
    items: [
      { id: "learning", label: "Assignments & Learning", icon: ClipboardList },
      { id: "assessment", label: "Assessments", icon: GraduationCap },
      { id: "examinations", label: "Examinations", icon: Award },
      { id: "students", label: "Students & 360", icon: Users },
    ],
  },
  {
    key: "governance",
    label: "Insights & Governance",
    items: [
      { id: "communication", label: "Communication", icon: MessageSquare },
      { id: "analytics", label: "Academic Analytics", icon: BarChart2 },
      { id: "alerts", label: "Academic Alerts", icon: Bell },
      { id: "reports", label: "Reports", icon: FileText },
      { id: "activity", label: "Activity Log", icon: Activity },
    ],
  },
];

const paneTitles: Record<string, string> = {
  dashboard: "Overview & Health",
  planning: "Academic Planning",
  people: "Faculty & Workload",
  academics: "Academics & Classes",
  timetable: "Timetable & Scheduling",
  attendance: "Attendance Registers",
  learning: "Assignments & Learning",
  assessment: "Assessments & Question Papers",
  examinations: "Examinations & Marks",
  students: "Student Tracking & 360",
  communication: "Academic Communication",
  analytics: "Academic Analytics & Audit",
  alerts: "Academic Alerts",
  reports: "Academic Reports",
  activity: "Activity Audit Log",
};

interface PrincipalWorkspaceProps {
  organization: OrganizationSummary;
  onLogout: () => Promise<void>;
  onSwitchOrganization: (orgId: string) => void;
  organizations: OrganizationSummary[];
  userProfile?: { id: string; email: string; name?: string; phone?: string | null; isPlatformAdmin?: boolean };
  activePane?: string;
  activeSubTab?: string;
  onNavigate?: (pane: string, subTab?: string) => void;
  initialModal?: string;
  initialTeacherId?: string;
  initialStudentId?: string;
}

export function PrincipalWorkspace({
  organization,
  onLogout,
  userProfile,
  activePane: activePaneProp,
  activeSubTab: activeSubTabProp,
  onNavigate,
  initialModal,
  initialTeacherId,
  initialStudentId,
}: PrincipalWorkspaceProps) {
  const principalName = userProfile?.name || (userProfile?.email ? userProfile.email.split("@")[0] : "Principal");
  // Navigation State
  const [activePane, setActivePane] = useState<string>(activePaneProp || "dashboard");
  const [visitedPanes, setVisitedPanes] = useState<Set<string>>(() => new Set([activePaneProp || "dashboard"]));
  const [activeSubTab, setActiveSubTab] = useState<string>(activeSubTabProp || "");

  useEffect(() => {
    setVisitedPanes((prev) => {
      if (prev.has(activePane)) return prev;
      const next = new Set(prev);
      next.add(activePane);
      return next;
    });
  }, [activePane]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Dialog States
  const [healthModalOpen, setHealthModalOpen] = useState(initialModal === "health");
  const [searchModalOpen, setSearchModalOpen] = useState(initialModal === "search");
  const [entitySearchModalOpen, setEntitySearchModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(initialTeacherId || null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  useEffect(() => {
    if (activePaneProp && activePaneProp !== activePane) {
      setActivePane(activePaneProp);
    }
  }, [activePaneProp]);

  useEffect(() => {
    if (activeSubTabProp !== undefined && activeSubTabProp !== activeSubTab) {
      setActiveSubTab(activeSubTabProp);
    }
  }, [activeSubTabProp]);

  useEffect(() => {
    if (initialModal === "health") setHealthModalOpen(true);
    if (initialModal === "search") setSearchModalOpen(true);
    if (initialTeacherId) setSelectedTeacherId(initialTeacherId);
    if (initialStudentId) setSelectedStudentId(initialStudentId);
  }, [initialModal, initialTeacherId, initialStudentId]);

  const handleSignOut = async () => {
    setSigningOut(true);
    setLogoutError("");
    try { await onLogout(); }
    catch (reason) { setLogoutError(reason instanceof Error ? reason.message : "Could not sign out"); }
    finally { setSigningOut(false); }
  };

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigateTo = (pane: string, subTab: string = "") => {
    setActivePane(pane);
    const targetSubTab = pane === "people" && !subTab ? "workload" : subTab;
    setActiveSubTab(targetSubTab);
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(pane, targetSubTab);
    }
  };

  const navigation = useDashboardNavigation(organization.id, "principal");
  const isFeatureEnabled = (key: string) => {
    // If organization has explicit features array, check it
    if (Array.isArray(organization.features) && organization.features.length > 0) {
      if (organization.features.includes(key)) return true;
      if (key === "exams" && organization.features.includes("examinations")) return true;
      if (key === "examinations" && organization.features.includes("exams")) return true;
      return false;
    }
    // Check navigation sections by key or item keys
    if (navigation.sections && navigation.sections.length > 0) {
      return navigation.sections.some(
        (section) =>
          section.key === key ||
          section.key === (key === "exams" ? "examinations" : key) ||
          section.items.some(
            (item) =>
              item.featureKey === key ||
              item.key === key ||
              (key === "exams" && (section.key === "examinations" || item.key.includes("exam"))),
          ),
      );
    }
    return true;
  };

  // Comprehensive mapping of all alias, slug, and direct IDs so every subtab works seamlessly.
  const paneTabs: Record<string, Record<string, string>> = {
    planning: {
      app: "annual_plan",
      "annual-plan": "annual_plan",
      annual_plan: "annual_plan",
      calendar: "calendar",
      targets: "learning_goals",
      "learning-goals": "learning_goals",
      learning_goals: "learning_goals",
      school_targets: "school_targets",
      "school-targets": "school_targets",
      action_plans: "action_plans",
      "action-plans": "action_plans",
    },
    people: {
      hods: "hods",
      coordinators: "hods",
      assignments: "assignments",
      workload: "workload",
      development: "development",
    },
    academics: {
      classes: "classes",
      sections: "classes",
      subjects: "subjects",
      curriculum: "curriculum",
      outcomes: "competencies",
      competencies: "competencies",
      lesson_plans: "lesson_plans",
      "lesson-plans": "lesson_plans",
      progress: "curriculum",
    },
    timetable: {
      academic_tt: "academic",
      academic: "academic",
      teacher_tt: "teacher",
      teacher: "teacher",
      class_tt: "class",
      class: "class",
      substitution: "substitutions",
      substitutions: "substitutions",
    },
    attendance: {
      student_att: "students",
      students: "students",
      trends: "trends",
      faculty_att: "teachers",
      faculty: "teachers",
      teachers: "teachers",
    },
    learning: {
      assignments: "assignments",
      submissions: "submissions",
      study_material: "materials",
      "study-material": "materials",
      materials: "materials",
      classroom: "activities",
      "classroom-activities": "activities",
      activities: "activities",
    },
    assessment: {
      assessments: "assessments",
      "question-papers": "assessments",
      analysis: "analysis",
      review: "analysis",
    },
    examinations: {
      exam_planning: "planning",
      planning: "planning",
      schedule: "schedule",
      marks: "marks",
      report_cards: "report_cards",
      "report-cards": "report_cards",
    },
    students: {
      performance: "all",
      all: "all",
      "360": "all",
      at_risk: "at_risk",
      "at-risk": "at_risk",
      remedial: "remedial",
      enrichment: "enrichment",
    },
    communication: {
      inbox: "inbox",
      teacher_msgs: "inbox",
      "teacher-directives": "inbox",
      parent_msgs: "parent_queries",
      "parent-grievances": "parent_queries",
      parent_queries: "parent_queries",
      student_msgs: "inbox",
      "student-messages": "inbox",
      announcements: "inbox",
      ptm: "ptm",
    },
    analytics: {
      school: "school_analytics",
      "school-performance": "school_analytics",
      school_analytics: "school_analytics",
      class: "classes",
      "class-performance": "classes",
      classes: "classes",
      subject: "school_analytics",
      "subject-performance": "school_analytics",
      teacher: "teachers",
      "teacher-performance": "teachers",
      teachers: "teachers",
      curriculum: "classes",
      "curriculum-progress": "classes",
      audit: "classes",
    },
  };
  const activeNavLabel = principalNavSections.flatMap((s) => s.items).find((i) => i.id === activePane)?.label || activePane;
  const activeView = paneTabs[activePane]?.[activeSubTab] || activeSubTab || Object.values(paneTabs[activePane] || {})[0] || "";
  const activeKey = activePane === "dashboard" ? "overview.dashboard" : ["alerts", "reports", "activity"].includes(activePane) ? `management.${activePane}` : activePane === "planning" && activeSubTab === "action_plans" ? "planning.app" : `${activePane}.${activeSubTab}`;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f4f6f7",
        fontFamily: 'var(--font-space-grotesk), "Inter", system-ui, sans-serif',
      }}
    >
      {/* SIDEBAR NAVIGATION (Matching School Admin exactly: 240px, S.sidebarBg, clean flat layout) */}
      <aside
        className="workspace-aside"
        style={{
          width: "240px",
          flexShrink: 0,
          background: S.sidebarBg,
          color: "#fff",
          height: "100vh",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          padding: 0,
          boxSizing: "border-box",
          zIndex: 40,
          borderRight: `1px solid ${S.sidebarBorder}`,
        }}
      >
        {/* Brand / Logo - Exactly 68px height matching Command Center Spec */}
        <div
          style={{
            height: "68px",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            cursor: "pointer",
            flexShrink: 0,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            boxSizing: "border-box",
          }}
          onClick={() => navigateTo("dashboard")}
          title="EDOPS Principal Command Center"
        >
          <img
            src="/EDOPSLogo.png"
            alt="EDOPS Principal Command Center"
            style={{
              height: "36px",
              width: "auto",
              maxWidth: "140px",
              display: "block",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          />
        </div>

        {/* Scrollable Navigation Body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "12px 12px 14px",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
          }}
        >
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              flex: 1,
            }}
            aria-label="Sidebar navigation"
          >
            {navigation.error && (
              <p role="alert" style={{ color: "#FCA5A5", padding: "12px", fontSize: "12px" }}>
                {navigation.error}
              </p>
            )}
            {principalNavSections.map((section, idx) => {
              const visibleItems = section.items.filter(
                (item) => item.id === "dashboard" || navigation.has(item.id)
              );
              if (visibleItems.length === 0) return null;
              return (
                <div key={section.key}>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: S.groupLabel,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: idx === 0 ? "8px 12px 4px" : "14px 12px 4px",
                      userSelect: "none",
                    }}
                  >
                    {section.label}
                  </div>
                  {visibleItems.map((item) => (
                    <NavItem
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      active={activePane === item.id}
                      onClick={() => navigateTo(item.id)}
                    />
                  ))}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh" }}>
        {/* TOP COMMAND HEADER (Admin Style) */}
        <header
          className="workspace-header"
        >
          {/* Left Title & Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", whiteSpace: "nowrap", minWidth: 0 }}>
            <button
              type="button"
              aria-label="Open principal navigation"
              className="workspace-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: S.navy, overflow: "hidden", textOverflow: "ellipsis" }}>
              Principal Command Center
            </p>
            <span className="hidden sm:inline-block" style={{ width: "1px", height: "16px", background: S.line }} />
            <p className="hidden sm:inline-block" style={{ margin: 0, fontSize: "13px", color: S.slate }}>
              {paneTitles[activePane] ?? (activePane.charAt(0).toUpperCase() + activePane.slice(1))}
            </p>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="workspace-header-actions">
            {/* Action Plans */}
            <button
              disabled={!navigation.has("planning.app")}
              onClick={() => navigateTo("planning", "action_plans")}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "#101828",
                border: "1px solid #101828",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16,24,40,0.08)",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={13} style={{ color: "#FFFFFF" }} />
              <span className="hidden sm:inline">Action Plans</span>
            </button>

            {/* Academic Search */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="workspace-search-btn"
              aria-label="Academic Search"
            >
              <Search size={15} style={{ flexShrink: 0, color: "#64748b" }} className="search-icon" />
              <span className="search-label">Academic Search</span>
              <kbd className="search-kbd">⌘ K</kbd>
            </button>

            {/* Academic Alerts */}
            <NotificationBellDropdown
              organizationId={organization.id}
              role="principal"
              onNavigate={(tab, subTab) => navigateTo(tab as any, subTab)}
              buttonStyle={{
                width: "36px",
                height: "36px",
                background: "#F9FAFB",
                border: "1px solid #ced8e5",
                borderRadius: "8px",
                color: "#0c1e33",
              }}
              iconSize={15}
            />

            {/* Principal Profile Avatar & Dropdown */}
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                title="Principal Executive Profile & Options"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: profileMenuOpen ? "2px solid #0c1e33" : "1px solid #ced8e5",
                  boxShadow: profileMenuOpen ? "0 0 0 3px rgba(12, 30, 51, 0.1)" : "0 1px 3px rgba(12, 30, 51, 0.08)",
                  background: "#F5F6F8",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <img
                  src={getStudentAvatarUrl(principalName, organization.id)}
                  alt={principalName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>

              {profileMenuOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 90 }}
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div
                    className="workspace-profile-dropdown"
                  >
                    <div style={{ padding: "10px 12px", borderBottom: "1px solid #EAECF0", marginBottom: "4px" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#101828" }}>
                        {principalName}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                        {organization.name || "Head of Institution"}
                      </p>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          marginTop: "6px",
                          padding: "2px 8px",
                          borderRadius: "100px",
                          background: "#dcfce7",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#15803d",
                        }}
                      >
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
                        Executive OS
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={signingOut}
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleSignOut();
                      }}
                      style={{
                        all: "unset",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#f43f5e",
                        cursor: "pointer",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fff1f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={14} strokeWidth={2} />
                      <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {logoutError && (
          <div role="alert" style={{ background: "#FEF3F2", color: "#B42318", borderBottom: "1px solid #FECDCA", padding: "8px 28px", fontSize: "13px" }}>
            Sign out failed: {logoutError}
          </div>
        )}

        {/* WORKSPACE BODY VIEW */}
        <div className="workspace-content-canvas">
          {navigation.loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "360px" }}>
              <ThreeDotsLoading size={10} color="#101828" />
            </div>
          ) : navigation.error ? (
            <p role="alert" style={{ color: "#B42318" }}>{navigation.error}</p>
          ) : !navigation.has(activePane) && !navigation.has(activeKey) && activePane !== "dashboard" ? (
            <FeatureUnavailableCard
              title="This dashboard feature is unavailable for this school"
              featureName={paneTitles[activePane] || activeNavLabel}
              onBackToDashboard={() => navigateTo("dashboard")}
              dashboardLabel="Return to Dashboard"
            />
          ) : <>
          {visitedPanes.has("dashboard") && (
            <div style={{ display: activePane === "dashboard" ? "contents" : "none" }}>
              <DashboardPane
                key={organization.id}
                organizationId={organization.id}
                principalName={principalName}
                onNavigate={navigateTo}
                onOpenHealthModal={() => setHealthModalOpen(true)}
                onOpenTeacherProfile={(id) => setSelectedTeacherId(id)}
                onOpenStudent360={(id) => setSelectedStudentId(id)}
              />
            </div>
          )}

          {visitedPanes.has("planning") && (
            <div style={{ display: activePane === "planning" ? "contents" : "none" }}>
              <PlanningPane
                key="planning"
                organizationId={organization.id}
                initialTab={activeView}
                onTabChange={(tab) => navigateTo("planning", tab)}
              />
            </div>
          )}

          {visitedPanes.has("people") && (
            <div style={{ display: activePane === "people" ? "contents" : "none" }}>
              <TeachersPane
                key="people"
                organizationId={organization.id}
                view={activeView as "hods" | "coordinators" | "assignments" | "workload" | "development"}
                onOpenProfile={(id) => setSelectedTeacherId(id)}
                onTabChange={(tab) => navigateTo("people", tab)}
              />
            </div>
          )}

          {visitedPanes.has("academics") && (
            <div style={{ display: activePane === "academics" ? "contents" : "none" }}>
              <AcademicsPane
                key="academics"
                organizationId={organization.id}
                initialTab={activeView}
                onOpenTeacherProfile={(id) => setSelectedTeacherId(id)}
                onOpenStudent360={(id) => setSelectedStudentId(id)}
                onTabChange={(tab) => navigateTo("academics", tab)}
                onNavigate={navigateTo}
              />
            </div>
          )}

          {visitedPanes.has("timetable") && (
            <div style={{ display: activePane === "timetable" ? "contents" : "none" }}>
              <TimetablePane
                key="timetable"
                organizationId={organization.id}
                initialTab={activeView}
                onTabChange={(tab) => navigateTo("timetable", tab)}
              />
            </div>
          )}

          {visitedPanes.has("attendance") && (
            <div style={{ display: activePane === "attendance" ? "contents" : "none" }}>
              <AttendancePane
                key="attendance"
                organizationId={organization.id}
                initialTab={activeView as "students" | "trends" | "teachers"}
                onTabChange={(tab) => navigateTo("attendance", tab)}
              />
            </div>
          )}

          {visitedPanes.has("learning") && (
            <div style={{ display: activePane === "learning" ? "contents" : "none" }}>
              <LearningPane
                key="learning"
                organizationId={organization.id}
                initialTab={activeView as "assignments" | "submissions" | "materials" | "activities"}
                onTabChange={(tab) => navigateTo("learning", tab)}
              />
            </div>
          )}

          {visitedPanes.has("assessment") && (
            <div style={{ display: activePane === "assessment" ? "contents" : "none" }}>
              {!isFeatureEnabled("assessments") ? (
                <div style={{ padding: "40px", textAlign: "center", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", margin: "20px" }}>
                  <h3 style={{ color: "#991B1B", margin: "0 0 8px" }}>Feature Disabled</h3>
                  <p style={{ color: "#7F1D1D", margin: 0, fontSize: "14px" }}>
                    Assessments are currently disabled for this institution or role by the platform administrator.
                  </p>
                </div>
              ) : (
                <AssessmentsPane
                  key="assessment"
                  organizationId={organization.id}
                  initialTab={(activeView as "assessments" | "analysis") || "assessments"}
                  onNavigate={navigateTo}
                  onTabChange={(tab) => navigateTo("assessment", tab)}
                />
              )}
            </div>
          )}

          {visitedPanes.has("examinations") && (
            <div style={{ display: activePane === "examinations" ? "contents" : "none" }}>
              {isFeatureEnabled("exams") ? (
                <ExaminationsPane
                  key="examinations"
                  organizationId={organization.id}
                  initialTab={activeView as "planning" | "schedule" | "marks" | "report_cards"}
                  onTabChange={(tab) => navigateTo("examinations", tab)}
                />
              ) : (
                <div className="m-5 rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
                  Exams are disabled for this school or role. A platform administrator can enable Exams in Schools &amp; Tenants → Features &amp; Overrides.
                </div>
              )}
            </div>
          )}

          {visitedPanes.has("students") && (
            <div style={{ display: activePane === "students" ? "contents" : "none" }}>
              <StudentsPane
                key="students"
                organizationId={organization.id}
                onOpenStudent360={(id) => setSelectedStudentId(id)}
                initialTab={activeView}
                onTabChange={(tab) => navigateTo("students", tab)}
              />
            </div>
          )}

          {visitedPanes.has("communication") && (
            <div style={{ display: activePane === "communication" ? "contents" : "none" }}>
              <CommunicationPane
                key="communication"
                organizationId={organization.id}
                initialTab={activeView}
                onTabChange={(tab) => navigateTo("communication", tab)}
              />
            </div>
          )}

          {visitedPanes.has("analytics") && (
            <div style={{ display: activePane === "analytics" ? "contents" : "none" }}>
              <AnalyticsAuditPane
                key="analytics"
                organizationId={organization.id}
                initialTab={activeView}
                onNavigate={navigateTo}
                onTabChange={(tab) => navigateTo("analytics", tab)}
              />
            </div>
          )}

          {visitedPanes.has("alerts") && (
            <div style={{ display: activePane === "alerts" ? "contents" : "none" }}>
              <AlertsPane
                organizationId={organization.id}
                onNavigate={navigateTo}
              />
            </div>
          )}

          {visitedPanes.has("reports") && (
            <div style={{ display: activePane === "reports" ? "contents" : "none" }}>
              <ReportsPane
                organizationId={organization.id}
              />
            </div>
          )}

          {visitedPanes.has("activity") && (
            <div style={{ display: activePane === "activity" ? "contents" : "none" }}>
              <ActivityPane
                organizationId={organization.id}
              />
            </div>
          )}
          </>}
        </div>
      </main>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="workspace-drawer-backdrop">
          <button
            type="button"
            aria-label="Close navigation"
            className="workspace-drawer-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="workspace-drawer">
            {/* Top brand header with logo just like desktop view */}
            <div
              style={{
                height: "68px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 18px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                flexShrink: 0,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                onClick={() => { setMobileMenuOpen(false); navigateTo("overview"); }}
                title="EDOPS Principal Command Center"
              >
                <img
                  src="/EDOPSLogo.png"
                  alt="EDOPS Principal Command Center"
                  style={{
                    height: "34px",
                    width: "auto",
                    maxWidth: "130px",
                    display: "block",
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
                  }}
                />
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  all: "unset",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "#94a3b8",
                  background: "rgba(255, 255, 255, 0.05)",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: "3px" }}>
              {principalNavSections.map((section, idx) => {
                const visibleItems = section.items.filter(
                  (item) => item.id === "dashboard" || navigation.has(item.id)
                );
                if (visibleItems.length === 0) return null;
                return (
                  <div key={section.key}>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: S.groupLabel,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: idx === 0 ? "8px 12px 4px" : "12px 12px 4px",
                        userSelect: "none",
                      }}
                    >
                      {section.label}
                    </div>
                    {visibleItems.map((item) => (
                      <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={activePane === item.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigateTo(item.id);
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* GLOBAL MODALS */}
      <AcademicHealthModal
        isOpen={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        organizationId={organization.id}
        onNavigate={navigateTo}
      />

      {/* Global Navigation & Settings Search (Cmd+K) */}
      <GlobalPortalSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        role="principal"
        onNavigate={(tab, sub) => navigateTo(tab as PrincipalTab, sub)}
        onOpenAction={(action) => {
          if (action === "health") setHealthModalOpen(true);
          else if (action === "entity_search") setEntitySearchModalOpen(true);
        }}
      />

      {/* Directory Entity Search (Specific Student/Teacher/Class by Name) */}
      <GlobalSearchModal
        isOpen={entitySearchModalOpen}
        onClose={() => setEntitySearchModalOpen(false)}
        organizationId={organization.id}
        onSelectTeacher={(id) => setSelectedTeacherId(id)}
        onSelectStudent={(id) => setSelectedStudentId(id)}
        onSelectClass={() => navigateTo("academics", "classes")}
      />

      {/* TEACHER PROFILE DRAWER */}
      {selectedTeacherId && (
        <TeacherProfileDrawer
          key={selectedTeacherId}
          teacherId={selectedTeacherId}
          organizationId={organization.id}
          onClose={() => setSelectedTeacherId(null)}
        />
      )}

      {/* STUDENT 360 MODAL */}
      {selectedStudentId && (
        <Student360Modal
          studentId={selectedStudentId}
          organizationId={organization.id}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}
