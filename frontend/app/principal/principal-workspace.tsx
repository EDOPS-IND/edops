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
    <div className="flex h-screen bg-gray-50  text-gray-900  overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#1A243D] bg-[#090D16] shrink-0">
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#1A243D] bg-[#090D16]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#131C31] border border-[#1A243D] flex items-center justify-center text-white shadow-sm font-black text-sm">
              EO
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">EDOPS</span>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Principal Command Center
              </span>
            </div>
          </div>
        </div>

        {/* School Organization Context */}
        <div className="p-3 border-b border-[#1A243D] bg-[#0D1322]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold truncate text-slate-100">
                {organization.name}
              </div>
              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {academicYear ? `Academic session: ${academicYear}` : "No active academic session"}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isSelected = activePane === item.paneId || item.subItems?.some(sub => sub.paneId === activePane) === true;
            const isExpanded = expandedSections[item.id];

            return (
              <div key={item.id} className="space-y-0.5">
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition ${
                    isSelected && !hasSub
                      ? "bg-slate-700 font-bold shadow-sm border border-slate-600/40"
                      : isSelected && hasSub
                      ? "bg-[#1E293B]"
                      : "hover:bg-[#131C31]"
                  }`}
                  style={{ color: isSelected && !hasSub ? "#FFFFFF" : isSelected ? "#FFFFFF" : "#CBD5E1" }}
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: isSelected && !hasSub ? "#FFFFFF" : isSelected ? "#818CF8" : "#94A3B8" }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {hasSub && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        isExpanded ? "transform rotate-180" : ""
                      }`}
                      style={{ color: "#94A3B8" }}
                    />
                  )}
                </button>

                {/* Sub-items */}
                {hasSub && isExpanded && (
                  <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#243354] ml-5">
                    {item.subItems!.map((sub) => {
                      const isSubActive = activePane === sub.paneId && activeSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigateTo(sub.paneId ?? item.id, sub.id)}
                          className={`w-full text-left px-2.5 py-1.5 text-[11px] font-medium rounded transition ${
                            isSubActive
                              ? "font-bold bg-slate-700 shadow-sm border border-slate-600/40"
                              : "hover:bg-[#131C31]"
                          }`}
                          style={{ color: isSubActive ? "#FFFFFF" : "#CBD5E1" }}
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP COMMAND HEADER */}
        <header className="h-16 border-b border-gray-200  bg-white  px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-gray-600  rounded-lg hover:bg-gray-100 :bg-gray-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline font-bold text-sm">EdOps Principal</span>
          </div>

          {/* Quick Academic Status Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setHealthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50  text-emerald-700  border border-emerald-200  hover:bg-emerald-100 transition"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              Academic Health: <strong>{healthScore !== null ? `${healthScore}/100` : "—"}</strong>
            </button>
          </div>

          {/* Search trigger & Quick Action */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100  hover:bg-gray-200 :bg-gray-800 text-gray-500  text-xs rounded-xl border border-gray-200  transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Academic Search...</span>
              <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-gray-200  text-gray-600  font-mono">
                ⌘K
              </kbd>
            </button>

            <button
              disabled={!navigation.has("planning.app")}
              onClick={() => navigateTo("planning", "action_plans")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#090D16] hover:bg-[#131C31] rounded-xl shadow-xs border border-[#1A243D] transition" style={{ color: "#FFFFFF" }}
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Action Plans</span>
            </button>

            <button
              onClick={() => navigateTo("alerts")}
              className="p-2 text-gray-600  hover:bg-gray-100 :bg-gray-800 rounded-xl relative transition"
              title="Academic Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
            </button>
            <button type="button" onClick={handleSignOut} disabled={signingOut}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              aria-label={signingOut ? "Signing out" : "Sign out"}>
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>
        </header>

        {logoutError && <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">Sign out failed: {logoutError}</div>}

        {/* WORKSPACE BODY VIEW */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {navigation.loading ? <div className="text-sm text-gray-600">Loading dashboard navigation…</div> : navigation.error ? <div role="alert" className="text-sm text-red-700">{navigation.error}</div> : !navigation.has(activeKey) ? <div className="rounded-xl border bg-white p-6 text-sm">This feature is unavailable for this school or role.</div> : selectedSubItem && !activeView ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold">{selectedSubItem.label}</h2>
              <p className="mt-2 text-sm text-gray-600">This view is not available yet.</p>
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
        </main>
      </div>

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
