"use client";

import { useState, useEffect, type ReactNode } from "react";
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
  HeartPulse
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

// Modals & Drawers
import { AcademicHealthModal } from "./components/academic-health-modal";
import { GlobalSearchModal } from "./components/global-search-modal";
import { TeacherProfileDrawer } from "./panes/teacher-profile-drawer";
import { Student360Modal } from "./panes/student-360-modal";

import { OrganizationSummary } from "../edops-api";
import { useDashboardNavigation } from "../dashboard-navigation";

type PrincipalNavItem = { id: string; label: string; icon: ReactNode; paneId?: string; subItems?: { id: string; label: string; paneId?: string }[] };

interface PrincipalWorkspaceProps {
  organization: OrganizationSummary;
  onLogout: () => Promise<void>;
  onSwitchOrganization: (orgId: string) => void;
  organizations: OrganizationSummary[];
}

export function PrincipalWorkspace({
  organization,
  onLogout,
}: PrincipalWorkspaceProps) {
  // Navigation State
  const [activePane, setActivePane] = useState<string>("dashboard");
  const [activeSubTab, setActiveSubTab] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    planning: true,
    people: false,
    academics: false,
    timetable: false,
    attendance: false,
    learning: false,
    assessment: false,
    examinations: false,
    students: false,
    communication: false,
    analytics: false
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Dialog States
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [academicYear, setAcademicYear] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleSignOut = async () => {
    setSigningOut(true);
    setLogoutError("");
    try { await onLogout(); }
    catch (reason) { setLogoutError(reason instanceof Error ? reason.message : "Could not sign out"); }
    finally { setSigningOut(false); }
  };

  useEffect(() => {
    import("../edops-api").then(({ getPrincipalDashboard }) => {
      getPrincipalDashboard(organization.id)
        .then((data) => {
          setHealthScore(data?.academicHealth?.score ?? null);
          setAcademicYear(data?.schoolKpis?.activeAcademicYear ?? null);
        })
        .catch(() => {});
    });
  }, [organization.id]);

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

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navigateTo = (pane: string, subTab: string = "") => {
    setActivePane(pane);
    setActiveSubTab(pane === "people" && !subTab ? "workload" : subTab);
    setMobileMenuOpen(false);
  };

  const navigation = useDashboardNavigation(organization.id, "principal");
  const isFeatureEnabled = (key: string) => navigation.sections.some(section => section.items.some(item => item.featureKey === key));

  const baseNavItems: PrincipalNavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: "planning",
      label: "Academic Planning",
      icon: <CalendarCheck className="w-4 h-4" />,
      subItems: [
        { id: "app", label: "Annual Academic Plan" },
        { id: "calendar", label: "Academic Calendar" },
        { id: "targets", label: "Learning Goals & Targets" },
        { id: "school_targets", label: "School Academic Targets" }
      ]
    },
    {
      id: "people",
      label: "People – Academic",
      icon: <Users className="w-4 h-4" />,
      subItems: [
        { id: "workload", label: "Teacher Workload" },
        { id: "hods", label: "Department Heads" },
        { id: "coordinators", label: "Coordinators" },
        { id: "assignments", label: "Teacher Assignments" },
        { id: "development", label: "Teacher Development" }
      ]
    },
    {
      id: "academics",
      label: "Academics",
      icon: <BookOpen className="w-4 h-4" />,
      subItems: [
        { id: "classes", label: "Classes" },
        { id: "sections", label: "Sections" },
        { id: "subjects", label: "Subjects" },
        { id: "curriculum", label: "Curriculum" },
        { id: "outcomes", label: "Learning Outcomes" },
        { id: "lesson_plans", label: "Lesson Plans" },
        { id: "progress", label: "Teaching Progress" }
      ]
    },
    {
      id: "timetable",
      label: "Timetable",
      icon: <Clock className="w-4 h-4" />,
      subItems: [
        { id: "academic_tt", label: "Academic Timetable" },
        { id: "teacher_tt", label: "Teacher Timetable" },
        { id: "class_tt", label: "Class Timetable" },
        { id: "substitution", label: "Substitution Overview" }
      ]
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: <UserCheck className="w-4 h-4" />,
      subItems: [
        { id: "student_att", label: "Student Attendance" },
        { id: "trends", label: "Attendance Trends" },
        { id: "faculty_att", label: "Teacher Activity and Leave" }
      ]
    },
    {
      id: "learning",
      label: "Assignments & Learning",
      icon: <ClipboardList className="w-4 h-4" />,
      subItems: [
        { id: "assignments", label: "Assignments" },
        { id: "submissions", label: "Submissions" },
        { id: "study_material", label: "Study Material" },
        { id: "classroom", label: "Classroom Activities" }
      ]
    },
    {
      id: "assessment",
      label: "Assessment",
      icon: <GraduationCap className="w-4 h-4" />,
      subItems: [
        { id: "assessments", label: "Assessments & Question Papers" },
        { id: "analysis", label: "Assessment Analysis" }
      ]
    },
    {
      id: "examinations",
      label: "Examinations",
      icon: <Award className="w-4 h-4" />,
      subItems: [
        { id: "exam_planning", label: "Exam Planning" },
        { id: "schedule", label: "Exam Schedule & Publishing" },
        { id: "marks", label: "Marks" },
        { id: "report_cards", label: "Report Cards" }
      ]
    },
    {
      id: "students",
      label: "Students",
      icon: <Users className="w-4 h-4" />,
      subItems: [
        { id: "performance", label: "Student Performance" },
        { id: "360", label: "Student 360" },
        { id: "at_risk", label: "At-Risk Students" },
        { id: "remedial", label: "Remedial Programs" },
        { id: "enrichment", label: "Enrichment Programs" }
      ]
    },
    {
      id: "communication",
      label: "Academic Communication",
      icon: <MessageSquare className="w-4 h-4" />,
      subItems: [
        { id: "inbox", label: "Principal Inbox" },
        { id: "teacher_msgs", label: "Teacher Directives" },
        { id: "parent_msgs", label: "Parent Grievances" },
        { id: "student_msgs", label: "Student Messages" },
        { id: "announcements", label: "Academic Announcements" },
        { id: "ptm", label: "PTM Schedule & Minutes" }
      ]
    },
    {
      id: "analytics",
      label: "Academic Analytics",
      icon: <BarChart2 className="w-4 h-4" />,
      subItems: [
        { id: "school", label: "School Performance" },
        { id: "class", label: "Class Performance" },
        { id: "subject", label: "Subject Performance" },
        { id: "teacher", label: "Teacher Performance" },
        { id: "curriculum", label: "Curriculum Progress" },
        { id: "audit", label: "Academic Execution Audit" }
      ]
    },
    {
      id: "alerts",
      label: "Academic Alerts",
      icon: <Bell className="w-4 h-4 text-red-500" />
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: "activity",
      label: "Academic Activity",
      icon: <Activity className="w-4 h-4" />
    }
  ];

  const sourceItems = new Map<string, { paneId: string; subId?: string; icon: ReactNode }>();
  for (const pane of baseNavItems) {
    if (pane.subItems?.length) for (const sub of pane.subItems) sourceItems.set(`${pane.id}.${sub.id}`, { paneId: pane.id, subId: sub.id, icon: pane.icon });
    else sourceItems.set(`${pane.id === "dashboard" ? "overview" : "management"}.${pane.id}`, { paneId: pane.id, icon: pane.icon });
  }
  const navItems: PrincipalNavItem[] = navigation.sections.flatMap<PrincipalNavItem>(section => {
    const entries = section.items.flatMap(item => {
      const source = sourceItems.get(item.key) ||
        Array.from(sourceItems.entries()).find(([k]) => k === item.key || k.endsWith(`.${item.key}`) || item.key.endsWith(`.${k}`) || k.endsWith(item.key))?.[1];
      return source ? [{ source, key: item.key, label: item.label }] : [];
    });
    if (!entries.length) return [];
    if (section.key === "overview" && entries.length === 1 && !entries[0].source.subId) return [{ id: section.key, label: entries[0].label, icon: entries[0].source.icon, paneId: entries[0].source.paneId }];
    return [{ id: section.key, label: section.label, icon: entries[0].source.icon,
      subItems: entries.map(entry => ({ id: entry.source.subId ?? entry.key, label: entry.label, paneId: entry.source.paneId })) }];
  });

  // Sidebar IDs differ from a few pane tab IDs. Only open views the panes actually provide.
  const paneTabs: Record<string, Record<string, string>> = {
    planning: { app: "annual_plan", calendar: "calendar", targets: "learning_goals", school_targets: "school_targets", action_plans: "action_plans" },
    people: { hods: "hods", coordinators: "coordinators", assignments: "assignments", workload: "workload", development: "development" },
    academics: { classes: "classes", sections: "classes", subjects: "subjects", curriculum: "curriculum", outcomes: "competencies", lesson_plans: "lesson_plans", progress: "curriculum" },
    timetable: { academic_tt: "academic", teacher_tt: "teacher", class_tt: "class", substitution: "substitutions" },
    attendance: { student_att: "students", trends: "trends", faculty_att: "teachers" },
    learning: { assignments: "assignments", submissions: "submissions", study_material: "materials", classroom: "activities" },
    assessment: { assessments: "assessments", analysis: "analysis" },
    examinations: { exam_planning: "planning", schedule: "schedule", marks: "marks", report_cards: "report_cards" },
    students: { performance: "all", at_risk: "at_risk", remedial: "remedial", enrichment: "enrichment" },
    communication: { inbox: "inbox", parent_msgs: "parent_queries", ptm: "ptm" },
    analytics: { school: "school_analytics", class: "classes", subject: "school_analytics", teacher: "teachers", audit: "classes" },
  };
  const selectedSubItem = baseNavItems.find((item) => item.id === activePane)?.subItems?.find((sub) => sub.id === activeSubTab);
  const activeView = paneTabs[activePane]?.[activeSubTab];
  const activeKey = activePane === "dashboard" ? "overview.dashboard" : ["alerts", "reports", "activity"].includes(activePane) ? `management.${activePane}` : activePane === "planning" && activeSubTab === "action_plans" ? "planning.app" : `${activePane}.${activeSubTab}`;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F7F8FA",
        fontFamily: 'var(--font-space-grotesk), "Inter", system-ui, sans-serif',
      }}
    >
      {/* SIDEBAR NAVIGATION (Desktop Admin Charcoal) */}
      <aside
        style={{
          width: "228px",
          flexShrink: 0,
          background: "#111318",
          borderRight: "1px solid #1E2128",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: "#2A2D35 transparent",
          zIndex: 40,
        }}
      >
        {/* Brand / Logo */}
        <div
          style={{
            height: "58px",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            borderBottom: "1px solid #1E2128",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <div style={{ height: "28px", display: "flex", alignItems: "center" }}>
            <img src="/logo.svg" alt="EDOPS" style={{ height: "100%", width: "auto", display: "block" }} />
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <nav style={{ flex: 1, padding: "8px 8px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {navItems.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isSelected = activePane === item.paneId || item.subItems?.some(sub => sub.paneId === activePane) === true;
            const isExpanded = expandedSections[item.id];

            return (
              <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <button
                  onClick={() => {
                    if (hasSub) {
                      toggleSection(item.id);
                      if (!isSelected) {
                        navigateTo(item.subItems![0].paneId ?? item.id, item.subItems![0].id);
                      }
                    } else {
                      navigateTo(item.paneId ?? item.id);
                    }
                  }}
                  style={{
                    all: "unset",
                    boxSizing: "border-box",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 12px 7px 14px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    position: "relative",
                    background: isSelected && !hasSub ? "#1E2128" : isSelected && hasSub ? "#1E2128" : "transparent",
                    transition: "background 0.12s",
                  }}
                >
                  {isSelected && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "2px",
                        height: "16px",
                        borderRadius: "0 2px 2px 0",
                        background: "#FFFFFF",
                      }}
                    />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "9px", overflow: "hidden" }}>
                    <span style={{ color: isSelected ? "#FFFFFF" : "#8C909A", display: "flex", alignItems: "center" }}>
                      {item.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "#FFFFFF" : "#8C909A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  {hasSub && (
                    <ChevronDown
                      size={13}
                      style={{
                        color: "#8C909A",
                        transform: isExpanded ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s ease",
                      }}
                    />
                  )}
                </button>

                {/* Sub-items */}
                {hasSub && isExpanded && (
                  <div style={{ paddingLeft: "26px", display: "flex", flexDirection: "column", gap: "1px", borderLeft: "1px solid #1E2128", marginLeft: "18px", margin: "2px 0 4px 18px" }}>
                    {item.subItems!.map((sub) => {
                      const isSubActive = activePane === sub.paneId && activeSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigateTo(sub.paneId ?? item.id, sub.id)}
                          style={{
                            all: "unset",
                            boxSizing: "border-box",
                            padding: "5px 10px",
                            fontSize: "12px",
                            fontWeight: isSubActive ? 600 : 400,
                            borderRadius: "5px",
                            cursor: "pointer",
                            background: isSubActive ? "#1E2128" : "transparent",
                            color: isSubActive ? "#FFFFFF" : "#8C909A",
                            transition: "background 0.12s, color 0.12s",
                          }}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Identity & Sign out */}
        <div style={{ borderTop: "1px solid #1E2128", padding: "12px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#8C909A", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Principal Executive OS
            </span>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
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
              color: "#8C909A",
              transition: "background 0.12s, color 0.12s",
            }}
          >
            <LogOut size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh", overflow: "auto" }}>
        {/* TOP COMMAND HEADER (Admin Style) */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            height: "58px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            background: "#FFFFFF",
            borderBottom: "1px solid #EAECF0",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          {/* Left Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
                color: "#101828",
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Principal Command Center
            </h1>
          </div>

          {/* Right: Quick Action Buttons strictly placed on top as requested */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {/* Quick Academic Health Badge Button */}
            <button
              onClick={() => setHealthModalOpen(true)}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "#ECFDF3",
                border: "1px solid #ABEFC6",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#027A48",
                cursor: "pointer",
              }}
            >
              <HeartPulse size={14} />
              <span>Academic Health: {healthScore !== null ? `${healthScore}/100` : "94/100"}</span>
            </button>

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
                padding: "6px 14px",
                background: "#101828",
                border: "1px solid #101828",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16,24,40,0.08)",
              }}
            >
              <Plus size={13} style={{ color: "#FFFFFF" }} />
              <span>Action Plans</span>
            </button>

            {/* Academic Search */}
            <button
              onClick={() => setSearchModalOpen(true)}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "#FFFFFF",
                border: "1px solid #D0D5DD",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#101828",
                cursor: "pointer",
              }}
            >
              <Search size={13} style={{ color: "#475467" }} />
              <span>Academic Search ⌘K</span>
            </button>

            {/* Academic Alerts */}
            <button
              onClick={() => navigateTo("alerts")}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                background: "#F9FAFB",
                border: "1px solid #D0D5DD",
                borderRadius: "8px",
                cursor: "pointer",
                position: "relative",
              }}
              title="Academic Alerts"
            >
              <Bell size={14} style={{ color: "#475467" }} />
              <span style={{ position: "absolute", top: "7px", right: "7px", width: "6px", height: "6px", borderRadius: "50%", background: "#E84040" }} />
            </button>
          </div>
        </header>

        {logoutError && (
          <div role="alert" style={{ background: "#FEF3F2", color: "#B42318", borderBottom: "1px solid #FECDCA", padding: "8px 28px", fontSize: "13px" }}>
            Sign out failed: {logoutError}
          </div>
        )}

        {/* WORKSPACE BODY VIEW */}
        <div style={{ padding: "24px 28px", flex: 1 }}>
          {navigation.loading ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#475467" }}>
              <p>Loading dashboard navigation…</p>
            </div>
          ) : navigation.error ? (
            <p role="alert" style={{ color: "#B42318" }}>{navigation.error}</p>
          ) : !navigation.has(activeKey) ? (
            <p style={{ color: "#475467" }}>This feature is unavailable for this school or role.</p>
          ) : selectedSubItem && !activeView ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "12px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>{selectedSubItem.label}</h2>
              <p style={{ color: "#475467", marginTop: "8px" }}>This view is not available yet.</p>
            </div>
          ) : <>
          {activePane === "dashboard" && (
            <DashboardPane
              key={organization.id}
              organizationId={organization.id}
              onNavigate={navigateTo}
              onOpenHealthModal={() => setHealthModalOpen(true)}
              onOpenTeacherProfile={(id) => setSelectedTeacherId(id)}
              onOpenStudent360={(id) => setSelectedStudentId(id)}
            />
          )}

          {activePane === "planning" && (
            <PlanningPane
              key={activeView}
              organizationId={organization.id}
              initialTab={activeView}
            />
          )}

          {activePane === "people" && (
            <TeachersPane
              key={activeView}
              organizationId={organization.id}
              view={activeView as "hods" | "coordinators" | "assignments" | "workload" | "development"}
              onOpenProfile={(id) => setSelectedTeacherId(id)}
            />
          )}

          {activePane === "academics" && (
            <AcademicsPane
              key={activeView}
              organizationId={organization.id}
              initialTab={activeView}
              onOpenTeacherProfile={(id) => setSelectedTeacherId(id)}
            />
          )}

          {activePane === "timetable" && (
            <TimetablePane
              key={activeView}
              organizationId={organization.id}
              initialTab={activeView}
            />
          )}

          {activePane === "attendance" && (
            <AttendancePane
              key={activeView}
              organizationId={organization.id}
              initialTab={activeView as "students" | "trends" | "teachers"}
            />
          )}

          {activePane === "learning" && (
            <LearningPane
              key={activeView}
              organizationId={organization.id}
              initialTab={activeView as "assignments" | "submissions" | "materials" | "activities"}
            />
          )}

          {activePane === "assessment" && (
            !isFeatureEnabled("assessments") ? (
              <div style={{ padding: "40px", textAlign: "center", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", margin: "20px" }}>
                <h3 style={{ color: "#991B1B", margin: "0 0 8px" }}>Feature Disabled</h3>
                <p style={{ color: "#7F1D1D", margin: 0, fontSize: "14px" }}>
                  Assessments are currently disabled for this institution or role by the platform administrator.
                </p>
              </div>
            ) : (
              <AssessmentsPane
                key={activeView}
                organizationId={organization.id}
                initialTab={(activeView as "assessments" | "analysis") || "assessments"}
                onNavigate={navigateTo}
              />
            )
          )}

          {activePane === "examinations" && (
            isFeatureEnabled("exams") ? (
              <ExaminationsPane
                key={activeView}
                organizationId={organization.id}
                initialTab={activeView as "planning" | "schedule" | "marks" | "report_cards"}
              />
            ) : (
              <div className="m-5 rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
                Exams are disabled for this school or role. A platform administrator can enable Exams in Schools &amp; Tenants → Features &amp; Overrides.
              </div>
            )
          )}

          {activePane === "students" && (
            <StudentsPane
              key={activeView}
              organizationId={organization.id}
              onOpenStudent360={(id) => setSelectedStudentId(id)}
              initialTab={activeView}
            />
          )}

          {activePane === "communication" && (
            <CommunicationPane
              key={activeView}
              organizationId={organization.id}
              initialTab={activeView}
            />
          )}

          {activePane === "analytics" && (
            <AnalyticsAuditPane
              key={activeView}
              organizationId={organization.id}
              initialTab={activeView}
              onNavigate={navigateTo}
            />
          )}

          {activePane === "alerts" && (
            <AlertsPane
              organizationId={organization.id}
              onNavigate={navigateTo}
            />
          )}

          {activePane === "reports" && (
            <ReportsPane
              organizationId={organization.id}
            />
          )}

          {activePane === "activity" && (
            <ActivityPane
              organizationId={organization.id}
            />
          )}
          </>}
        </div>
      </main>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button type="button" aria-label="Close navigation"
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#090D16] border-r border-[#1A243D] p-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#1A243D]">
              <span className="font-bold text-sm text-white">Principal Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 rounded-lg hover:bg-[#131C31] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.subItems?.length ? navigateTo(item.subItems[0].paneId ?? item.id, item.subItems[0].id) : navigateTo(item.paneId ?? item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg ${
                    activePane === item.id
                      ? "bg-[#131C31] border-l-2 border-indigo-400 font-bold"
                      : "hover:bg-[#131C31]/60"
                  }`}
                  style={{ color: activePane === item.id ? "#FFFFFF" : "#CBD5E1" }}
                >
                  <span style={{ color: activePane === item.id ? "#818CF8" : "#94A3B8" }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
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

      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
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
