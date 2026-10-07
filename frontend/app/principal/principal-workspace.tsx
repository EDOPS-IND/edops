"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  BookOpen,
  Calendar,
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
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  Building,
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
import { QuickActionModal } from "./components/quick-action-modal";
import { GlobalSearchModal } from "./components/global-search-modal";
import { TeacherProfileDrawer } from "./panes/teacher-profile-drawer";
import { Student360Modal } from "./panes/student-360-modal";

import { OrganizationSummary } from "../edops-api";

interface PrincipalWorkspaceProps {
  organization: OrganizationSummary;
  onLogout: () => void;
  onSwitchOrganization: (orgId: string) => void;
  organizations: OrganizationSummary[];
}

export function PrincipalWorkspace({
  organization,
  onLogout,
  onSwitchOrganization,
  organizations
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
  const [quickActionModalOpen, setQuickActionModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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
    setActiveSubTab(subTab);
    setMobileMenuOpen(false);
  };

  const navItems = [
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
        { id: "action_plans", label: "School Academic Targets" }
      ]
    },
    {
      id: "people",
      label: "People – Academic",
      icon: <Users className="w-4 h-4" />,
      subItems: [
        { id: "teachers", label: "Teachers" },
        { id: "hods", label: "Department Heads" },
        { id: "coordinators", label: "Coordinators" },
        { id: "assignments", label: "Teacher Assignments" },
        { id: "workload", label: "Teacher Workload" },
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
        { id: "low", label: "Low Attendance (<75%)" },
        { id: "faculty_att", label: "Teacher Attendance Overview" }
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
        { id: "assessments", label: "Assessments" },
        { id: "competencies", label: "Competencies" },
        { id: "outcomes", label: "Learning Outcomes" },
        { id: "question_papers", label: "Question Papers" },
        { id: "rubrics", label: "Rubrics" },
        { id: "analysis", label: "Assessment Analysis" }
      ]
    },
    {
      id: "examinations",
      label: "Examinations",
      icon: <Award className="w-4 h-4" />,
      subItems: [
        { id: "exam_planning", label: "Exam Planning" },
        { id: "schedule", label: "Exam Schedule" },
        { id: "marks", label: "Marks" },
        { id: "results", label: "Results Publishing" },
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
                CBSE Affiliated • 2026-27
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isSelected = activePane === item.id;
            const isExpanded = expandedSections[item.id];

            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  onClick={() => {
                    if (hasSub) {
                      toggleSection(item.id);
                      if (!isSelected) {
                        navigateTo(item.id, item.subItems![0].id);
                      }
                    } else {
                      navigateTo(item.id);
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
                      const isSubActive = isSelected && activeSubTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigateTo(item.id, sub.id)}
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

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-[#1A243D] bg-[#090D16] space-y-2">
          <div className="flex items-center justify-between px-2 text-xs text-slate-400">
            <span className="font-medium">Principal Office</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
              VERIFIED
            </span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-[#131C31] rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
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
            <span className="font-bold text-sm">EdOps Principal</span>
          </div>

          {/* Quick Academic Status Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50  text-indigo-700  border border-indigo-200  flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Term 1 Ongoing • 182 Instructional Days
            </span>
            <span className="text-xs text-gray-400">|</span>
            <button
              onClick={() => setHealthModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50  text-emerald-700  border border-emerald-200  hover:bg-emerald-100 transition"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              Academic Health: <strong>88/100</strong>
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
              onClick={() => setQuickActionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#090D16] hover:bg-[#131C31] rounded-xl shadow-xs border border-[#1A243D] transition" style={{ color: "#FFFFFF" }}
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Quick Action</span>
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
          </div>
        </header>

        {/* WORKSPACE BODY VIEW */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activePane === "dashboard" && (
            <DashboardPane
              organizationId={organization.id}
              onNavigate={navigateTo}
              onOpenHealthModal={() => setHealthModalOpen(true)}
              onOpenTeacherProfile={(id) => setSelectedTeacherId(id)}
              onOpenStudent360={(id) => setSelectedStudentId(id)}
            />
          )}

          {activePane === "planning" && (
            <PlanningPane
              organizationId={organization.id}
              initialTab={activeSubTab}
            />
          )}

          {activePane === "people" && (
            <TeachersPane
              organizationId={organization.id}
              onOpenProfile={(id) => setSelectedTeacherId(id)}
            />
          )}

          {activePane === "academics" && (
            <AcademicsPane
              organizationId={organization.id}
              initialTab={activeSubTab}
              onOpenTeacherProfile={(id) => setSelectedTeacherId(id)}
            />
          )}

          {activePane === "timetable" && (
            <TimetablePane
              organizationId={organization.id}
              onNavigate={navigateTo}
            />
          )}

          {activePane === "attendance" && (
            <AttendancePane
              organizationId={organization.id}
              onOpenStudent360={(id) => setSelectedStudentId(id)}
            />
          )}

          {activePane === "learning" && (
            <LearningPane
              organizationId={organization.id}
              onNavigate={navigateTo}
            />
          )}

          {activePane === "assessment" && (
            <AssessmentsPane
              organizationId={organization.id}
              onNavigate={navigateTo}
            />
          )}

          {activePane === "examinations" && (
            <ExaminationsPane
              organizationId={organization.id}
              onNavigate={navigateTo}
            />
          )}

          {activePane === "students" && (
            <StudentsPane
              organizationId={organization.id}
              onOpenStudent360={(id) => setSelectedStudentId(id)}
              initialTab={activeSubTab}
            />
          )}

          {activePane === "communication" && (
            <CommunicationPane
              organizationId={organization.id}
              initialTab={activeSubTab}
            />
          )}

          {activePane === "analytics" && (
            <AnalyticsAuditPane
              organizationId={organization.id}
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
        </main>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
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
                  onClick={() => navigateTo(item.id)}
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

      <QuickActionModal
        isOpen={quickActionModalOpen}
        onClose={() => setQuickActionModalOpen(false)}
        organizationId={organization.id}
        onSuccess={() => {}}
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
