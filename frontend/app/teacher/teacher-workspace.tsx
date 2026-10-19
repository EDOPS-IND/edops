'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Clock,
  CheckSquare,
  FileText,
  Layers,
  Award,
  Users,
  Compass,
  MessageSquare,
  BarChart2,
  CalendarDays,
  FileSpreadsheet,
  Activity,
  LogOut,
  Plus,
  Search,
  Bell,
  RefreshCw,
  ChevronDown,
  LayoutGrid,
  Settings,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

import { OrganizationSummary, getTeacherClasses, getStudentAvatarUrl } from '../edops-api';
import { useDashboardNavigation } from '../dashboard-navigation';
import { FeatureUnavailableCard, ThreeDotsLoading } from '../components/feature-unavailable-card';
import { TeacherTab } from './types';

// Panes
import { DashboardPane } from './panes/dashboard-pane';
import { ClassesPane } from './panes/classes-pane';
import { TimetablePane } from './panes/timetable-pane';
import { AttendancePane } from './panes/attendance-pane';
import { LearningPane } from './panes/learning-pane';
import { AssignmentsPane } from './panes/assignments-pane';
import { ArenaPane } from './panes/arena-pane';
import { AssessmentsPane } from './panes/assessments-pane';
import { ExamsPane } from './panes/exams-pane';
import { StudentsPane } from './panes/students-pane';
import { CurriculumPane } from './panes/curriculum-pane';
import { CommunicationPane } from './panes/communication-pane';
import { WorkloadPane } from './panes/workload-pane';
import { CalendarPane } from './panes/calendar-pane';
import { ReportsPane } from './panes/reports-pane';
import { ActivityPane } from './panes/activity-pane';

// Modals & Drawers
import { QuickAttendanceModal } from './components/quick-attendance-modal';
import { CreateAssignmentModal } from './components/create-assignment-modal';
import { StudentDossierDrawer } from './components/student-dossier-drawer';
import { LessonCompletionModal } from './components/lesson-completion-modal';
import { CreateInterventionModal } from './components/create-intervention-modal';

// Exact design tokens matching Student Dashboard specification
const S = {
  sidebarBg: "#0b0f19",
  sidebarBorder: "rgba(255, 255, 255, 0.06)",
  itemActiveBg: "#1c2337",
  itemActiveText: "#ffffff",
  itemInactiveText: "#8a92a6",
  itemHoverBg: "rgba(255, 255, 255, 0.05)",
  groupLabel: "rgba(255, 255, 255, 0.38)",

  // Main canvas tokens
  navy: "#0c1e33",
  slate: "#495d72",
  bg: "#f4f6f7",
  white: "#ffffff",
  border: "#e4e6e9",
  line: "#ced8e5",
  chip: "#f5f6f8",
  faint: "#b3b3b3",
};

interface TeacherWorkspaceProps {
  organization: OrganizationSummary;
  onLogout: () => void;
  onSwitchOrganization: (orgId: string) => void;
  organizations: OrganizationSummary[];
  userProfile?: { id: string; email: string; name?: string; phone?: string | null; isPlatformAdmin?: boolean };
  activeTab?: TeacherTab;
  onNavigate?: (tab: TeacherTab, subTab?: string) => void;
  initialModal?: string;
  initialStudentId?: string;
  activeSubTab?: string;
}

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({
  organization,
  onLogout,
  onSwitchOrganization,
  organizations,
  userProfile,
  activeTab: activeTabProp,
  onNavigate,
  initialModal,
  initialStudentId,
  activeSubTab: activeSubTabProp,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>(activeTabProp || 'dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>(activeSubTabProp || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreModules, setShowMoreModules] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Global Modals State
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(initialModal === "attendance");
  const [attendancePeriod, setAttendancePeriod] = useState(1);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(initialModal === "assignment" || initialModal === "create-assignment");
  const [lessonModalOpen, setLessonModalOpen] = useState(initialModal === "lesson");
  const [interventionModalOpen, setInterventionModalOpen] = useState(initialModal === "intervention");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null);

  useEffect(() => {
    if (activeTabProp && activeTabProp !== activeTab) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  useEffect(() => {
    if (activeSubTabProp !== undefined && activeSubTabProp !== activeSubTab) {
      setActiveSubTab(activeSubTabProp);
    }
  }, [activeSubTabProp]);

  useEffect(() => {
    if (initialModal === "attendance") setAttendanceModalOpen(true);
    if (initialModal === "assignment" || initialModal === "create-assignment") setAssignmentModalOpen(true);
    if (initialModal === "lesson") setLessonModalOpen(true);
    if (initialModal === "intervention") setInterventionModalOpen(true);
    if (initialStudentId) setSelectedStudentId(initialStudentId);
  }, [initialModal, initialStudentId]);
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);
  const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0);
  const [lessonRefreshKey, setLessonRefreshKey] = useState(0);
  const [studentsRefreshKey, setStudentsRefreshKey] = useState(0);

  // Context for attendance/lesson modals
  const [activeClassContext, setActiveClassContext] = useState<{
    classSection: string;
    sectionId: string;
  }>({
    classSection: '',
    sectionId: '',
  });

  useEffect(() => {
    async function initClassContext() {
      try {
        const res = await getTeacherClasses(organization.id);
        if (res?.classes?.length > 0) {
          setActiveClassContext({
            classSection: res.classes[0].className || '',
            sectionId: res.classes[0].sectionId || '',
          });
        }
      } catch {}
    }
    initClassContext();
  }, [organization.id]);

  const teacherName = userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : "Faculty Member");
  const teacherEmail = userProfile?.email || "";
  const teacherSubtitle = organization.name ? `${organization.name} · Senior Faculty` : "Senior Faculty";
  const avatarUrl = getStudentAvatarUrl(teacherName, teacherEmail);

  const navigateTo = (tab: TeacherTab, subTab: string = "") => {
    setActiveTab(tab);
    setActiveSubTab(subTab);
    if (onNavigate) {
      onNavigate(tab, subTab);
    }
  };

  const handleOpenAttendance = (sectionId?: string, period = 1, classSection?: string) => {
    setActiveClassContext((prev) => ({
      classSection: classSection || prev.classSection || '',
      sectionId: sectionId || prev.sectionId || '',
    }));
    setAttendancePeriod(period);
    setAttendanceModalOpen(true);
  };

  const handleOpenLesson = (classSection?: string, sectionId?: string) => {
    setActiveClassContext((prev) => ({
      classSection: classSection || prev.classSection || '',
      sectionId: sectionId || prev.sectionId || '',
    }));
    setLessonModalOpen(true);
  };

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  const navigation = useDashboardNavigation(organization.id, 'teacher');

  const pageTitles: Record<TeacherTab, string> = {
    dashboard: "Teacher Command Center",
    classes: "My Classes & Sections",
    timetable: "Class Schedule & Timetable",
    attendance: "Attendance Registers",
    learning: "Lesson Plans & Delivery",
    assignments: "Assignments & Grading",
    arena: "Arena Practice Bank",
    assessment: "Formative Tests & Evaluations",
    exams: "Official Exams & Grading",
    students: "Student Tracking & Roster",
    curriculum: "Curriculum Progress & LOs",
    communication: "Academic Inbox & Directives",
    workload: "My Workload & Instructional Tasks",
    calendar: "Academic Calendar",
    reports: "Reports & Heatmaps",
    activity: "Faculty Audit Log",
  };

  // Primary navigation items
  const primaryInstructionItems = [
    { id: 'classes', label: 'My Classes & Sections', tab: 'classes' as TeacherTab, icon: BookOpen },
    { id: 'timetable', label: 'Class Timetable', tab: 'timetable' as TeacherTab, icon: Clock },
    { id: 'attendance', label: 'Attendance Registers', tab: 'attendance' as TeacherTab, icon: CheckSquare },
    { id: 'learning', label: 'Lesson Delivery', tab: 'learning' as TeacherTab, icon: FileText },
    { id: 'assignments', label: 'Assignments & Grading', tab: 'assignments' as TeacherTab, icon: FileText },
  ];

  // Secondary modules (Inside More Modules)
  const extraTeacherItems = [
    { id: 'arena', label: 'Arena Practice Bank', tab: 'arena' as TeacherTab, icon: Layers },
    { id: 'assessment', label: 'Formative Tests', tab: 'assessment' as TeacherTab, icon: Award },
    { id: 'exams', label: 'Term Exams', tab: 'exams' as TeacherTab, icon: CalendarDays },
    { id: 'students', label: 'Student Tracking & Dossiers', tab: 'students' as TeacherTab, icon: Users },
    { id: 'curriculum', label: 'Curriculum Pacing', tab: 'curriculum' as TeacherTab, icon: Compass },
    { id: 'communication', label: 'Academic Inbox', tab: 'communication' as TeacherTab, icon: MessageSquare },
    { id: 'workload', label: 'My Workload & Tasks', tab: 'workload' as TeacherTab, icon: BarChart2 },
    { id: 'calendar', label: 'Academic Calendar', tab: 'calendar' as TeacherTab, icon: CalendarDays },
    { id: 'reports', label: 'Reports & LO Heatmaps', tab: 'reports' as TeacherTab, icon: FileSpreadsheet },
    { id: 'activity', label: 'Activity Audit Log', tab: 'activity' as TeacherTab, icon: Activity },
  ];

  const isExtraTabActive = extraTeacherItems.some(i => i.tab === activeTab);

  // Automatically keep More Modules open when an extra tab is active
  React.useEffect(() => {
    if (isExtraTabActive) {
      setShowMoreModules(true);
    }
  }, [isExtraTabActive]);

  // Exact selector matching Student Dashboard
  const renderNavItem = (
    item: { id: string; label: string; tab: TeacherTab; icon: React.ElementType }
  ) => {
    const Icon = item.icon;
    const active = activeTab === item.tab;
    return (
      <button
        key={item.id}
        id={`nav-${item.id}`}
        onClick={() => navigateTo(item.tab)}
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
          fontSize: "13.5px",
          cursor: "pointer",
          transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
          background: active ? S.itemActiveBg : "transparent",
          color: active ? S.itemActiveText : S.itemInactiveText,
          fontWeight: active ? 600 : 450,
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.background = S.itemHoverBg;
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.color = S.itemInactiveText;
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <Icon
          size={18}
          strokeWidth={active ? 2 : 1.75}
          style={{
            flexShrink: 0,
            color: active ? "#ffffff" : S.itemInactiveText,
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
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: S.bg,
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: S.navy,
      }}
    >
      {/* ═══════════════════════════════════════════════
          S I D E B A R (Matching Student Command Center)
      ═══════════════════════════════════════════════ */}
      <aside
        id="sidebar"
        aria-label="Teacher primary navigation"
        style={{
          width: "240px",
          flexShrink: 0,
          background: S.sidebarBg,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          padding: 0,
          boxSizing: "border-box",
          zIndex: 40,
          borderRight: `1px solid ${S.sidebarBorder}`,
        }}
      >
        {/* Brand / Logo - Exactly 68px height matching Student Command Center */}
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
          onClick={() => navigateTo('dashboard')}
          title="EDOPS Teacher Command Center"
        >
          <img
            src="/EDOPSLogo.png"
            alt="EDOPS Teacher Portal"
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
            {/* Section 1: TEACHER WORKSPACE */}
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: S.groupLabel,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "8px 12px 4px",
                userSelect: "none",
              }}
            >
              TEACHER WORKSPACE
            </div>

            {/* Dashboard Item */}
            {renderNavItem({
              id: 'dashboard',
              label: 'Command Center',
              tab: 'dashboard',
              icon: LayoutDashboard,
            })}

            {/* Section 2: INSTRUCTION & CLASSES */}
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: S.groupLabel,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "14px 12px 4px",
                userSelect: "none",
              }}
            >
              INSTRUCTION & CLASSES
            </div>

            {/* Primary Instruction Items */}
            {primaryInstructionItems.map(item => renderNavItem(item))}

            {/* Seamless More Modules Section (Matching Student Sidebar) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <button
                id="nav-toggle-more-modules"
                onClick={() => setShowMoreModules(!showMoreModules)}
                style={{
                  all: "unset",
                  boxSizing: "border-box",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: isExtraTabActive && !showMoreModules ? S.itemActiveBg : "transparent",
                  color: (isExtraTabActive && !showMoreModules) || showMoreModules ? "#ffffff" : S.itemInactiveText,
                  fontWeight: (isExtraTabActive && !showMoreModules) || showMoreModules ? 600 : 450,
                  whiteSpace: "nowrap",
                  flexWrap: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!(isExtraTabActive && !showMoreModules)) {
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.background = S.itemHoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isExtraTabActive && !showMoreModules)) {
                    e.currentTarget.style.color = showMoreModules ? "#ffffff" : S.itemInactiveText;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0, flex: 1, overflow: "hidden" }}>
                  <LayoutGrid
                    size={18}
                    strokeWidth={(isExtraTabActive && !showMoreModules) || showMoreModules ? 2 : 1.75}
                    style={{
                      flexShrink: 0,
                      color: (isExtraTabActive && !showMoreModules) || showMoreModules ? "#ffffff" : S.itemInactiveText,
                    }}
                  />
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    More Modules
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <ChevronDown
                    size={15}
                    style={{
                      color: (isExtraTabActive && !showMoreModules) || showMoreModules ? "#ffffff" : S.itemInactiveText,
                      transform: showMoreModules ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      flexShrink: 0,
                    }}
                  />
                </div>
              </button>

              {/* Seamless Expanded Items with Matching Full-Width Pill Selector */}
              {showMoreModules && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                    padding: "4px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                  }}
                >
                  {extraTeacherItems.map(item => renderNavItem(item))}
                </div>
              )}
            </div>

            {/* Section 3: SETTINGS */}
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: S.groupLabel,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "14px 12px 4px",
                userSelect: "none",
              }}
            >
              SETTINGS
            </div>

            {renderNavItem({
              id: 'settings-workload',
              label: 'Faculty Settings',
              tab: 'workload',
              icon: Settings,
            })}
          </nav>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          W O R K S P A C E   &   H E A D E R
      ═══════════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        {/* Header Bar - Exactly 68px matching Student Workspace */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            height: "68px",
            padding: "0 32px",
            background: "#fff",
            borderBottom: "1px solid rgba(206, 216, 229, 0.97)",
            position: "sticky",
            top: 0,
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          {/* Header Title & Crumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", whiteSpace: "nowrap" }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: S.navy }}>
              Teacher Command Center
            </p>
            <span style={{ width: "1px", height: "16px", background: S.line }} />
            <p style={{ margin: 0, fontSize: "13px", color: S.slate }}>
              {pageTitles[activeTab] || "Command Center"}
            </p>

            {activeTab === "dashboard" && (
              <button
                onClick={() => setAttendanceRefreshKey(k => k + 1)}
                title="Refresh Dashboard"
                style={{
                  all: "unset",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: S.slate,
                  marginLeft: "4px",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f2f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>

          {/* Header Actions (Preserving Teacher Action Buttons with Student Styling) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Quick Action Button 1: Mark Attendance */}
            <button
              type="button"
              onClick={() => handleOpenAttendance()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                border: `1px solid ${S.line}`,
                borderRadius: "6px",
                background: "#ffffff",
                fontSize: "12.5px",
                fontWeight: 600,
                color: S.navy,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 1px 2px rgba(12, 30, 51, 0.04)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#98A2B3";
                e.currentTarget.style.background = "#FAF8F5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = S.line;
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              <CheckSquare size={14} style={{ color: S.navy }} />
              <span>Mark Attendance</span>
            </button>

            {/* Quick Action Button 2: + New Assignment */}
            <button
              type="button"
              onClick={() => setAssignmentModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 15px",
                border: `1px solid ${S.navy}`,
                borderRadius: "6px",
                background: S.navy,
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#ffffff",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 1px 2px rgba(12, 30, 51, 0.1)",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#132840")}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <Plus size={14} strokeWidth={2.5} style={{ color: "#ffffff" }} />
              <span>New Assignment</span>
            </button>

            {/* Search Box */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "180px",
                padding: "6px 14px",
                background: S.chip,
                border: "1px solid #ebedf2",
                borderRadius: "6px",
                color: S.slate,
              }}
            >
              <Search size={14} style={{ flexShrink: 0, color: S.slate }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "12.5px",
                  color: S.navy,
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
              <span style={{ fontSize: "10.5px", color: S.faint, whiteSpace: "nowrap", flexShrink: 0 }}>
                ⌘ K
              </span>
            </div>

            {/* Action Icon Group */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Message / Inbox button */}
              <button
                type="button"
                onClick={() => navigateTo('communication')}
                title="Academic Inbox & Directives"
                style={{
                  all: "unset",
                  display: "grid",
                  placeItems: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: S.chip,
                  color: S.navy,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#eaedf2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = S.chip)}
              >
                <MessageSquare size={17} />
              </button>

              {/* Notification bell button */}
              <button
                type="button"
                onClick={() => navigateTo('activity')}
                title="Faculty Activity & Notifications"
                style={{
                  all: "unset",
                  display: "grid",
                  placeItems: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: S.chip,
                  color: S.navy,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#eaedf2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = S.chip)}
              >
                <Bell size={17} />
              </button>

              {/* Multi-Org Switcher */}
              {organizations.length > 1 && (
                <select
                  value={organization.id}
                  onChange={(e) => onSwitchOrganization(e.target.value)}
                  style={{
                    height: "36px",
                    padding: "0 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: S.navy,
                    background: S.chip,
                    border: "1px solid #ebedf2",
                    borderRadius: "8px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Teacher Avatar & Profile Dropdown */}
              <div style={{ position: "relative" }}>
                <div
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  title="Faculty Profile & Dossier"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: profileMenuOpen ? "2px solid #0c1e33" : `1px solid ${S.border}`,
                    background: "#f0f4f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: profileMenuOpen ? "0 0 0 3px rgba(12, 30, 51, 0.1)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={teacherName}
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
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        zIndex: 100,
                        width: "240px",
                        background: "#ffffff",
                        border: `1px solid ${S.border}`,
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(12, 30, 51, 0.15), 0 8px 10px -6px rgba(12, 30, 51, 0.1)",
                        padding: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ padding: "10px 12px", borderBottom: `1px solid ${S.border}`, marginBottom: "4px" }}>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: S.navy }}>
                          {teacherName}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: S.slate }}>
                          {teacherEmail}
                        </p>
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "6px",
                            padding: "2px 8px",
                            borderRadius: "100px",
                            background: "#d9eed1",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#1a5c0a",
                          }}
                        >
                          Faculty Member
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigateTo('workload');
                        }}
                        style={{
                          all: "unset",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          fontSize: "12.5px",
                          fontWeight: 500,
                          color: S.navy,
                          cursor: "pointer",
                          borderRadius: "6px",
                          boxSizing: "border-box",
                          transition: "background 0.12s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = S.chip)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <ShieldCheck size={15} strokeWidth={1.75} style={{ color: "#495d72" }} />
                        <span>Workload &amp; Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onLogout();
                        }}
                        style={{
                          all: "unset",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          fontSize: "12.5px",
                          fontWeight: 500,
                          color: "#e11d48",
                          cursor: "pointer",
                          borderRadius: "6px",
                          boxSizing: "border-box",
                          transition: "background 0.12s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fff1f2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <LogOut size={15} strokeWidth={1.75} style={{ color: "#e11d48" }} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════
            M A I N   C O N T E N T   B O D Y
        ═══════════════════════════════════════════════ */}
        <main
          style={{
            flex: 1,
            padding: "28px 32px 32px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {navigation.loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "360px" }}>
              <ThreeDotsLoading size={10} color="#0c1e33" />
            </div>
          ) : !navigation.has(activeTab) && activeTab !== "dashboard" ? (
            <FeatureUnavailableCard
              title="This dashboard feature is unavailable for this school"
              featureName={pageTitles[activeTab] || activeTab}
              onBackToDashboard={() => navigateTo("dashboard")}
              dashboardLabel="Return to Command Center"
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPane
                  key={`dash-${attendanceRefreshKey}`}
                  organizationId={organization.id}
                  onNavigate={(tab) => navigateTo(tab as TeacherTab)}
                  onCreateAssignment={() => setAssignmentModalOpen(true)}
                  onTakeAttendance={handleOpenAttendance}
                  onMarkLessonCompleted={(sectionId, period, classSection) => handleOpenLesson(classSection, sectionId)}
                />
              )}

              {activeTab === 'classes' && (
                <ClassesPane
                  key={`classes-${attendanceRefreshKey}`}
                  organizationId={organization.id}
                  onOpenStudentDossier={handleViewStudent}
                  onTakeAttendance={(sectionId, className) => handleOpenAttendance(sectionId, 1, className)}
                  onCreateAssignment={() => setAssignmentModalOpen(true)}
                />
              )}

              {activeTab === 'timetable' && (
                <TimetablePane
                  organizationId={organization.id}
                  onTakeAttendance={handleOpenAttendance}
                  onLogLesson={handleOpenLesson}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendancePane
                  key={`att-${attendanceRefreshKey}`}
                  organizationId={organization.id}
                  onTakeAttendance={handleOpenAttendance}
                />
              )}

              {activeTab === 'learning' && (
                <LearningPane
                  key={`learning-${lessonRefreshKey}-${activeSubTab}`}
                  organizationId={organization.id}
                  initialTab={activeSubTab}
                  onTabChange={(sub) => navigateTo('learning', sub)}
                  onRecordLesson={() => handleOpenLesson()}
                  onLogLesson={handleOpenLesson}
                />
              )}

              {activeTab === 'assignments' && (
                <AssignmentsPane
                  key={`assign-${assignmentRefreshKey}-${activeSubTab}`}
                  organizationId={organization.id}
                  initialTab={activeSubTab}
                  onTabChange={(sub) => navigateTo('assignments', sub)}
                  onCreateAssignment={() => setAssignmentModalOpen(true)}
                />
              )}

              {activeTab === 'arena' && (
                <ArenaPane organizationId={organization.id} />
              )}

              {activeTab === 'assessment' && (
                <AssessmentsPane organizationId={organization.id} />
              )}

              {activeTab === 'exams' && (
                <ExamsPane organizationId={organization.id} />
              )}

              {activeTab === 'students' && (
                <StudentsPane
                  key={`students-${studentsRefreshKey}-${activeSubTab}`}
                  organizationId={organization.id}
                  initialTab={activeSubTab}
                  onTabChange={(sub) => navigateTo('students', sub)}
                  onOpenDossier={handleViewStudent}
                  onOpenIntervention={(studentId?: string) => {
                    setSelectedStudentId(studentId || null);
                    setInterventionModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'curriculum' && (
                <CurriculumPane organizationId={organization.id} />
              )}

              {activeTab === 'communication' && (
                <CommunicationPane
                  key={`comm-${activeSubTab}`}
                  organizationId={organization.id}
                  initialTab={activeSubTab}
                  onTabChange={(sub) => navigateTo('communication', sub)}
                />
              )}

              {activeTab === 'workload' && (
                <WorkloadPane organizationId={organization.id} />
              )}

              {activeTab === 'calendar' && (
                <CalendarPane organizationId={organization.id} />
              )}

              {activeTab === 'reports' && (
                <ReportsPane organizationId={organization.id} />
              )}

              {activeTab === 'activity' && (
                <ActivityPane organizationId={organization.id} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <QuickAttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        organizationId={organization.id}
        sectionId={activeClassContext.sectionId}
        classSection={activeClassContext.classSection}
        periodNumber={attendancePeriod}
        onSuccess={() => setAttendanceRefreshKey((k) => k + 1)}
      />

      <CreateAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        organizationId={organization.id}
        defaultSectionId={activeClassContext.sectionId}
        onSuccess={() => setAssignmentRefreshKey((k) => k + 1)}
      />

      <LessonCompletionModal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        organizationId={organization.id}
        sectionId={activeClassContext.sectionId}
        classSection={activeClassContext.classSection}
        onSuccess={() => setLessonRefreshKey((k) => k + 1)}
      />

      <CreateInterventionModal
        isOpen={interventionModalOpen}
        onClose={() => setInterventionModalOpen(false)}
        organizationId={organization.id}
        defaultStudentId={selectedStudentId || ''}
        onSuccess={() => setStudentsRefreshKey((k) => k + 1)}
      />

      {selectedStudentId && (
        <StudentDossierDrawer
          isOpen={Boolean(selectedStudentId)}
          onClose={() => setSelectedStudentId(null)}
          studentId={selectedStudentId}
          organizationId={organization.id}
        />
      )}
    </div>
  );
};
