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

// Modals & Drawers
import { AcademicHealthModal } from "./components/academic-health-modal";
import { GlobalSearchModal } from "./components/global-search-modal";
import { GlobalPortalSearch } from "../components/global-portal-search";
import { TeacherProfileDrawer } from "./panes/teacher-profile-drawer";
import { Student360Modal } from "./panes/student-360-modal";

import { OrganizationSummary, getStudentAvatarUrl } from "../edops-api";
import { useDashboardNavigation } from "../dashboard-navigation";
import { FeatureUnavailableCard, ThreeDotsLoading } from "../components/feature-unavailable-card";
import { PrincipalTab } from "./types";

type PrincipalNavItem = { id: string; label: string; icon: ReactNode; paneId?: string; subItems?: { id: string; label: string; paneId?: string }[] };

interface PrincipalWorkspaceProps {
  organization: OrganizationSummary;
  onLogout: () => Promise<void>;
  onSwitchOrganization: (orgId: string) => void;
  organizations: OrganizationSummary[];
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
  activePane: activePaneProp,
  activeSubTab: activeSubTabProp,
  onNavigate,
  initialModal,
  initialTeacherId,
  initialStudentId,
}: PrincipalWorkspaceProps) {
  // Navigation State
  const [activePane, setActivePane] = useState<string>(activePaneProp || "dashboard");
  const [activeSubTab, setActiveSubTab] = useState<string>(activeSubTabProp || "");
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
  const [healthModalOpen, setHealthModalOpen] = useState(initialModal === "health");
  const [searchModalOpen, setSearchModalOpen] = useState(initialModal === "search");
  const [entitySearchModalOpen, setEntitySearchModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(initialTeacherId || null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [academicYear, setAcademicYear] = useState<string | null>(null);
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
    const targetSubTab = pane === "people" && !subTab ? "workload" : subTab;
    setActiveSubTab(targetSubTab);
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(pane, targetSubTab);
    }
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
      coordinators: "coordinators",
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
  const selectedSubItem = baseNavItems.find((item) => item.id === activePane)?.subItems?.find((sub) => sub.id === activeSubTab);
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
      {/* SIDEBAR NAVIGATION (Executive Dark #0b0f19) */}
      <aside
        className="workspace-aside"
        style={{
          width: "228px",
          flexShrink: 0,
          background: "#0b0f19",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          height: "100vh",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          zIndex: 40,
        }}
      >
        {/* Brand / Logo - Exactly 68px height matching Student & Teacher Command Centers */}
        <div
          style={{
            height: "68px",
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            boxSizing: "border-box",
            flexShrink: 0,
            cursor: "pointer",
          }}
          onClick={() => setActivePane("overview")}
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

        {/* Scrollable Navigation Items */}
        <nav style={{ flex: 1, padding: "8px 8px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {navItems.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isSelected = activePane === item.paneId || item.subItems?.some(sub => sub.paneId === activePane) === true;
            const isExpanded = expandedSections[item.id] !== undefined ? expandedSections[item.id] : isSelected;

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
                    background: isSelected ? "#1c2337" : "transparent",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
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
                    <span style={{ color: isSelected ? "#FFFFFF" : "#8a92a6", display: "flex", alignItems: "center" }}>
                      {item.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "#FFFFFF" : "#8a92a6",
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
                        color: isSelected ? "#FFFFFF" : "#8a92a6",
                        transform: isExpanded ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s ease",
                      }}
                    />
                  )}
                </button>

                {/* Sub-items */}
                {hasSub && isExpanded && (
                  <div style={{ paddingLeft: "26px", display: "flex", flexDirection: "column", gap: "1px", borderLeft: "1px solid rgba(255, 255, 255, 0.08)", marginLeft: "18px", margin: "2px 0 4px 18px" }}>
                    {item.subItems!.map((sub) => {
                      const isSubActive = (activePane === sub.paneId || (!sub.paneId && activePane === item.id)) &&
                        (activeSubTab === sub.id || activeView === sub.id || paneTabs[activePane]?.[sub.id] === activeView || (!activeSubTab && sub === item.subItems![0]));
                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigateTo(sub.paneId ?? item.id, sub.id)}
                          style={{
                            all: "unset",
                            boxSizing: "border-box",
                            padding: "6px 10px",
                            fontSize: "12px",
                            fontWeight: isSubActive ? 600 : 400,
                            borderRadius: "5px",
                            cursor: "pointer",
                            background: isSubActive ? "#1c2337" : "transparent",
                            color: isSubActive ? "#FFFFFF" : "#8a92a6",
                            transition: "background 0.12s, color 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubActive) e.currentTarget.style.background = "transparent";
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
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh" }}>
        {/* TOP COMMAND HEADER (Admin Style) */}
        <header
          className="workspace-header"
        >
          {/* Left Title & Hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <button
              type="button"
              aria-label="Open principal navigation"
              className="workspace-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
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

          {/* Right: Quick Action Buttons */}
          <div className="workspace-header-actions">
            {/* Quick Academic Health Badge Button */}
            <button
              onClick={() => setHealthModalOpen(true)}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                background: "#ECFDF3",
                border: "1px solid #ABEFC6",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#027A48",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <HeartPulse size={14} />
              <span>
                <span className="hidden sm:inline">Academic Health: </span>
                {healthScore !== null ? `${healthScore}/100` : "Health"}
              </span>
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
            <button
              type="button"
              onClick={() => navigateTo("alerts")}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                background: "#F9FAFB",
                border: "1px solid #ced8e5",
                borderRadius: "8px",
                cursor: "pointer",
                position: "relative",
              }}
              title="Academic Alerts"
              aria-label="Academic Alerts"
            >
              <Bell size={15} style={{ color: "#0c1e33" }} />
              <span style={{ position: "absolute", top: "7px", right: "7px", width: "6px", height: "6px", borderRadius: "50%", background: "#E84040" }} />
            </button>

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
                  src={getStudentAvatarUrl("Principal", organization.id)}
                  alt="Principal"
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
                        {organization.name || "Principal Office"}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                        Head of Institution
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
              featureName={selectedSubItem?.label || baseNavItems.find((item) => item.id === activePane)?.label || activePane}
              onBackToDashboard={() => navigateTo("dashboard")}
              dashboardLabel="Return to Dashboard"
            />
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
              key="planning"
              organizationId={organization.id}
              initialTab={activeView}
              onTabChange={(tab) => navigateTo("planning", tab)}
            />
          )}

          {activePane === "people" && (
            <TeachersPane
              key="people"
              organizationId={organization.id}
              view={activeView as "hods" | "coordinators" | "assignments" | "workload" | "development"}
              onOpenProfile={(id) => setSelectedTeacherId(id)}
              onTabChange={(tab) => navigateTo("people", tab)}
            />
          )}

          {activePane === "academics" && (
            <AcademicsPane
              key="academics"
              organizationId={organization.id}
              initialTab={activeView}
              onOpenTeacherProfile={(id) => setSelectedTeacherId(id)}
              onTabChange={(tab) => navigateTo("academics", tab)}
            />
          )}

          {activePane === "timetable" && (
            <TimetablePane
              key="timetable"
              organizationId={organization.id}
              initialTab={activeView}
              onTabChange={(tab) => navigateTo("timetable", tab)}
            />
          )}

          {activePane === "attendance" && (
            <AttendancePane
              key="attendance"
              organizationId={organization.id}
              initialTab={activeView as "students" | "trends" | "teachers"}
              onTabChange={(tab) => navigateTo("attendance", tab)}
            />
          )}

          {activePane === "learning" && (
            <LearningPane
              key="learning"
              organizationId={organization.id}
              initialTab={activeView as "assignments" | "submissions" | "materials" | "activities"}
              onTabChange={(tab) => navigateTo("learning", tab)}
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
                key="assessment"
                organizationId={organization.id}
                initialTab={(activeView as "assessments" | "analysis") || "assessments"}
                onNavigate={navigateTo}
                onTabChange={(tab) => navigateTo("assessment", tab)}
              />
            )
          )}

          {activePane === "examinations" && (
            isFeatureEnabled("exams") ? (
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
            )
          )}

          {activePane === "students" && (
            <StudentsPane
              key="students"
              organizationId={organization.id}
              onOpenStudent360={(id) => setSelectedStudentId(id)}
              initialTab={activeView}
              onTabChange={(tab) => navigateTo("students", tab)}
            />
          )}

          {activePane === "communication" && (
            <CommunicationPane
              key="communication"
              organizationId={organization.id}
              initialTab={activeView}
              onTabChange={(tab) => navigateTo("communication", tab)}
            />
          )}

          {activePane === "analytics" && (
            <AnalyticsAuditPane
              key="analytics"
              organizationId={organization.id}
              initialTab={activeView}
              onNavigate={navigateTo}
              onTabChange={(tab) => navigateTo("analytics", tab)}
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
              {navItems.map((item) => {
                const active = activePane === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (item.subItems?.length) navigateTo(item.subItems[0].paneId ?? item.id, item.subItems[0].id);
                      else navigateTo(item.paneId ?? item.id);
                    }}
                    className={`drawer-nav-item ${active ? "active" : ""}`}
                    style={{
                      all: "unset",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      gap: "11px",
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      background: active ? "#131C31" : "transparent",
                      color: active ? "#ffffff" : "#cbd5e1",
                      borderLeft: active ? "3px solid #818CF8" : "3px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ color: active ? "#818CF8" : "#94A3B8", display: "grid", placeItems: "center" }}>{item.icon}</span>
                    <span style={{ color: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  </button>
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
