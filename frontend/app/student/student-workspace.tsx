'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  BookOpen,
  Trophy,
  Award,
  Settings,
  LogOut,
  Users,
  Clock,
  Video,
  CalendarDays,
  MessageSquare,
  Target,
  ChevronDown,
  ChevronUp,
  Search,
  Bell,
  RefreshCw,
  Layers,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';

import { OrganizationSummary } from '../edops-api';
import { useDashboardNavigation } from '../dashboard-navigation';
import { StudentTab } from './types';

// Panes
import { DashboardPane } from './panes/dashboard-pane';
import { ClassPane } from './panes/class-pane';
import { SubjectsPane } from './panes/subjects-pane';
import { TimetablePane } from './panes/timetable-pane';
import { AssignmentsPane } from './panes/assignments-pane';
import { ArenaPane } from './panes/arena-pane';
import { AssessmentsPane } from './panes/assessments-pane';
import { ExamsPane } from './panes/exams-pane';
import { AttendancePane } from './panes/attendance-pane';
import { PerformancePane } from './panes/performance-pane';
import { CurriculumPane } from './panes/curriculum-pane';
import { ResourcesPane } from './panes/resources-pane';
import { CalendarPane } from './panes/calendar-pane';
import { CommunicationPane } from './panes/communication-pane';
import { ProgressPane } from './panes/progress-pane';
import { ProfilePane } from './panes/profile-pane';

// Modals
import { AssignmentSubmitModal } from './components/assignment-submit-modal';
import { ArenaAttemptModal } from './components/arena-attempt-modal';
import { LecturePlayerModal } from './components/lecture-player-modal';
import { SupportRequestModal } from './components/support-request-modal';
import { StudentGoalModal } from './components/student-goal-modal';

// Design tokens strictly matching user image (dark charcoal navy + sleek #1c2337 active pill)
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

interface StudentWorkspaceProps {
  organization: OrganizationSummary;
  onLogout: () => void;
  onSwitchOrganization: (orgId: string) => void;
  organizations: OrganizationSummary[];
}

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({
  organization,
  onLogout,
  onSwitchOrganization,
  organizations,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTab>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const navigation = useDashboardNavigation(organization.id, 'student');
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreAcademics, setShowMoreAcademics] = useState(false);

  // Modals state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [arenaModalOpen, setArenaModalOpen] = useState(false);
  const [selectedArenaActivity, setSelectedArenaActivity] = useState<any>(null);
  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const navigateTo = (tab: StudentTab) => {
    setActiveTab(tab);
  };

  const handleOpenSubmit = (assignment?: any) => {
    if (!assignment) { navigateTo('assignments'); return; }
    setSelectedAssignment(assignment);
    setSubmitModalOpen(true);
  };

  const handleOpenArena = (activity?: any) => {
    if (!activity) { navigateTo('arena'); return; }
    setSelectedArenaActivity(activity);
    setArenaModalOpen(true);
  };

  const handleOpenLecture = (lecture?: any) => {
    if (!lecture) { navigateTo('resources'); return; }
    setSelectedLecture(lecture);
    setLectureModalOpen(true);
  };

  const pageTitles: Record<StudentTab, string> = {
    dashboard: "Dashboard",
    attendance: "Attendance",
    assignments: "Homework",
    curriculum: "Curriculum",
    arena: "Arena Practice",
    assessments: "Assessments",
    class: "My Class",
    subjects: "Subjects",
    timetable: "Timetable & Schedule",
    exams: "Term Exams",
    performance: "Performance",
    resources: "Notes & Lectures",
    calendar: "Calendar",
    communication: "Academic Inbox",
    progress: "Personal Growth",
    profile: "Account Settings",
  };

  // Primary navigation items
  const primaryAcademicItems = [
    { id: 'attendance', label: 'Attendance', tab: 'attendance' as StudentTab, icon: Calendar },
    { id: 'assignments', label: 'Homework', tab: 'assignments' as StudentTab, icon: ClipboardList },
    { id: 'curriculum', label: 'Curriculum', tab: 'curriculum' as StudentTab, icon: BookOpen },
    { id: 'arena', label: 'Arena Practice', tab: 'arena' as StudentTab, icon: Trophy },
    { id: 'assessments', label: 'Assessments', tab: 'assessments' as StudentTab, icon: Award },
  ];

  // Secondary academic modules
  const extraAcademicItems = [
    { id: 'timetable', label: 'Timetable & Schedule', tab: 'timetable' as StudentTab, icon: Clock },
    { id: 'class', label: 'My Class', tab: 'class' as StudentTab, icon: Users },
    { id: 'subjects', label: 'Prescribed Subjects', tab: 'subjects' as StudentTab, icon: BookOpen },
    { id: 'exams', label: 'Term Exams', tab: 'exams' as StudentTab, icon: CalendarDays },
    { id: 'performance', label: 'Academic Performance', tab: 'performance' as StudentTab, icon: BarChart3 },
    { id: 'resources', label: 'Notes & Lectures', tab: 'resources' as StudentTab, icon: Video },
    { id: 'calendar', label: 'Academic Calendar', tab: 'calendar' as StudentTab, icon: CalendarDays },
    { id: 'communication', label: 'Academic Inbox', tab: 'communication' as StudentTab, icon: MessageSquare },
    { id: 'progress', label: 'Personal Growth & Goals', tab: 'progress' as StudentTab, icon: Target },
  ];

  const isExtraTabActive = extraAcademicItems.some(i => i.tab === activeTab);

  // Automatically keep More Modules open when an extra tab is active
  React.useEffect(() => {
    if (isExtraTabActive) {
      setShowMoreAcademics(true);
    }
  }, [isExtraTabActive]);

  // Exact selector matching the user's uploaded image (sleek #1c2337 active pill, white text & icon)
  const renderNavItem = (
    item: { id: string; label: string; tab: StudentTab; icon: React.ElementType }
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
          S I D E B A R (Strictly matching provided selector)
      ═══════════════════════════════════════════════ */}
      <aside
        id="sidebar"
        aria-label="Primary navigation"
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
        {/* Brand / Logo - Exactly 68px height matching Student Command Center header */}
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
          title="EDOPS Student Command Center"
        >
          <img
            src="/logo.svg"
            alt="edops"
            style={{
              height: "32px",
              width: "auto",
              display: "block",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
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
          {/* Navigation Section Items */}
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              flex: 1,
            }}
            aria-label="Sidebar navigation"
          >
            {/* Section 1: STUDENT WORKSPACE */}
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
              STUDENT WORKSPACE
            </div>

            {/* Dashboard Item */}
            {renderNavItem({
              id: 'dashboard',
              label: 'Dashboard',
              tab: 'dashboard',
              icon: LayoutDashboard,
            })}

            {/* Section 2: ACADEMICS */}
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
              ACADEMICS
            </div>

            {/* Primary Academic Items */}
            {primaryAcademicItems.map(item => renderNavItem(item))}

            {/* Seamless More Modules Section (Guaranteed 1-Line & matching selector) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <button
                id="nav-toggle-more-modules"
                onClick={() => setShowMoreAcademics(!showMoreAcademics)}
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
                  background: isExtraTabActive && !showMoreAcademics ? S.itemActiveBg : "transparent",
                  color: (isExtraTabActive && !showMoreAcademics) || showMoreAcademics ? "#ffffff" : S.itemInactiveText,
                  fontWeight: (isExtraTabActive && !showMoreAcademics) || showMoreAcademics ? 600 : 450,
                  whiteSpace: "nowrap",
                  flexWrap: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!(isExtraTabActive && !showMoreAcademics)) {
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.background = S.itemHoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isExtraTabActive && !showMoreAcademics)) {
                    e.currentTarget.style.color = showMoreAcademics ? "#ffffff" : S.itemInactiveText;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0, flex: 1, overflow: "hidden" }}>
                  <LayoutGrid
                    size={18}
                    strokeWidth={(isExtraTabActive && !showMoreAcademics) || showMoreAcademics ? 2 : 1.75}
                    style={{
                      flexShrink: 0,
                      color: (isExtraTabActive && !showMoreAcademics) || showMoreAcademics ? "#ffffff" : S.itemInactiveText,
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
                      color: (isExtraTabActive && !showMoreAcademics) || showMoreAcademics ? "#ffffff" : S.itemInactiveText,
                      transform: showMoreAcademics ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      flexShrink: 0,
                    }}
                  />
                </div>
              </button>

              {/* Seamless Expanded Items with Exact Same Full-Width Pill Selector & Alignment */}
              {showMoreAcademics && (
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
                  {extraAcademicItems.map(item => renderNavItem(item))}
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
              id: 'profile',
              label: 'Account Settings',
              tab: 'profile',
              icon: Settings,
            })}
          </nav>

          {/* Profile Footer */}
          <div style={{ marginTop: "auto", paddingTop: "14px" }}>
            <div
              style={{
                height: "1px",
                background: "rgba(255, 255, 255, 0.06)",
                marginBottom: "12px",
              }}
            />

            <div
              onClick={() => navigateTo('profile')}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
              }}
              title="Account Settings"
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <img
                  src="https://api.dicebear.com/10.x/glyphs/svg?seed=Felix"
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", whiteSpace: "nowrap", overflow: "hidden" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#ffffff", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {organization.name || "Alex Rivera"}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: S.itemInactiveText }}>
                  Class 10-A
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          W O R K S P A C E   &   H E A D E R
      ═══════════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        {/* Header Bar */}
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
              Student Command Center
            </p>
            <span style={{ width: "1px", height: "16px", background: S.line }} />
            <p style={{ margin: 0, fontSize: "13px", color: S.slate }}>
              {pageTitles[activeTab] || "Dashboard"}
            </p>

            {activeTab === "dashboard" && (
              <button
                onClick={() => setRefreshKey(k => k + 1)}
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
                }}
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>

          {/* Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Search Box */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "220px",
                padding: "6px 14px",
                background: S.chip,
                border: "1px solid #ebedf2",
                borderRadius: "6px",
                color: S.slate,
              }}
            >
              <Search size={15} style={{ flexShrink: 0, color: S.slate }} />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  color: S.navy,
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
              <span style={{ fontSize: "11px", color: S.faint, whiteSpace: "nowrap", flexShrink: 0 }}>
                ⌘ K
              </span>
            </div>

            {/* Action Icon Group */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Message / Chat button */}
              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                title="Directives & Messages"
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
                }}
              >
                <MessageSquare size={18} />
              </button>

              {/* Notification bell button */}
              <button
                type="button"
                onClick={() => navigateTo('communication')}
                title="Notifications"
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
                }}
              >
                <Bell size={18} />
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

              {/* User Avatar with DiceBear Image */}
              <div
                onClick={() => navigateTo('profile')}
                title="Account Settings"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: `1px solid ${S.border}`,
                  background: "#f0f4f8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="https://api.dicebear.com/10.x/glyphs/svg?seed=Felix"
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
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
            <div style={{ padding: "48px 0", textAlign: "center", color: S.slate }}>
              <p>Loading student workspace...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPane
                  key={refreshKey}
                  organizationId={organization.id}
                  onNavigateTab={navigateTo}
                  onSubmitAssignment={handleOpenSubmit}
                  onStartArena={handleOpenArena}
                  onOpenLecture={handleOpenLecture}
                  onAskTeacher={() => setSupportModalOpen(true)}
                />
              )}

              {activeTab === 'class' && (
                <ClassPane organizationId={organization.id} />
              )}

              {activeTab === 'subjects' && (
                <SubjectsPane organizationId={organization.id} onNavigateTab={navigateTo} />
              )}

              {activeTab === 'timetable' && (
                <TimetablePane organizationId={organization.id} />
              )}

              {activeTab === 'assignments' && (
                <AssignmentsPane
                  organizationId={organization.id}
                  onSubmitAssignment={handleOpenSubmit}
                />
              )}

              {activeTab === 'arena' && (
                <ArenaPane
                  organizationId={organization.id}
                  onStartArena={handleOpenArena}
                />
              )}

              {activeTab === 'assessments' && (
                <AssessmentsPane organizationId={organization.id} />
              )}

              {activeTab === 'exams' && (
                <ExamsPane organizationId={organization.id} />
              )}

              {activeTab === 'attendance' && (
                <AttendancePane organizationId={organization.id} />
              )}

              {activeTab === 'performance' && (
                <PerformancePane organizationId={organization.id} />
              )}

              {activeTab === 'curriculum' && (
                <CurriculumPane organizationId={organization.id} />
              )}

              {activeTab === 'resources' && (
                <ResourcesPane
                  organizationId={organization.id}
                  onOpenLecture={handleOpenLecture}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarPane organizationId={organization.id} />
              )}

              {activeTab === 'communication' && (
                <CommunicationPane
                  organizationId={organization.id}
                  onOpenSupportModal={() => setSupportModalOpen(true)}
                />
              )}

              {activeTab === 'progress' && (
                <ProgressPane
                  organizationId={organization.id}
                  onOpenGoalModal={() => setGoalModalOpen(true)}
                  onOpenSupportModal={() => setSupportModalOpen(true)}
                />
              )}

              {activeTab === 'profile' && (
                <ProfilePane organizationId={organization.id} onLogout={onLogout} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AssignmentSubmitModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        organizationId={organization.id}
        assignment={selectedAssignment}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      <ArenaAttemptModal
        isOpen={arenaModalOpen}
        onClose={() => setArenaModalOpen(false)}
        organizationId={organization.id}
        activity={selectedArenaActivity}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      <LecturePlayerModal
        isOpen={lectureModalOpen}
        onClose={() => setLectureModalOpen(false)}
        organizationId={organization.id}
        lecture={selectedLecture}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      <SupportRequestModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        organizationId={organization.id}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      <StudentGoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        organizationId={organization.id}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />
    </div>
  );
};
