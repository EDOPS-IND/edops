'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

import { OrganizationSummary, api, getStudentAvatarUrl } from '../edops-api';
import { useDashboardNavigation } from '../dashboard-navigation';
import { FeatureUnavailableCard, ThreeDotsLoading } from '../components/feature-unavailable-card';
import { GlobalPortalSearch } from '../components/global-portal-search';
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
  userProfile?: { id: string; email: string; name?: string; phone?: string | null; isPlatformAdmin?: boolean };
  activeTab?: StudentTab;
  onNavigate?: (tab: StudentTab, subTab?: string) => void;
  initialModal?: string;
  activeSubTab?: string;
}

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({
  organization,
  onLogout,
  onSwitchOrganization,
  organizations,
  userProfile,
  activeTab: activeTabProp,
  onNavigate,
  initialModal,
  activeSubTab: activeSubTabProp,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTab>(activeTabProp || 'dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>(activeSubTabProp || "");
  const [refreshKey, setRefreshKey] = useState(0);
  const navigation = useDashboardNavigation(organization.id, 'student');
  const [showMoreAcademics, setShowMoreAcademics] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
    let active = true;
    api<any>(`/organizations/${organization.id}/student/profile`)
      .then((res) => {
        if (active && res?.student) setStudentProfile(res.student);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [organization.id]);

  const studentName = studentProfile?.name || userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : "Student");
  const studentEmail = studentProfile?.email || userProfile?.email || "";
  const studentClass = studentProfile?.classSection ? `Class ${studentProfile.classSection}` : "Class 10-A";
  const avatarUrl = studentProfile?.avatarUrl || getStudentAvatarUrl(studentName, studentEmail);

  // Modals state
  const [submitModalOpen, setSubmitModalOpen] = useState(initialModal === "submit");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [arenaModalOpen, setArenaModalOpen] = useState(initialModal === "arena");
  const [selectedArenaActivity, setSelectedArenaActivity] = useState<any>(null);
  const [lectureModalOpen, setLectureModalOpen] = useState(initialModal === "lecture");
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(initialModal === "support");
  const [goalModalOpen, setGoalModalOpen] = useState(initialModal === "goal");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  useEffect(() => {
    if (initialModal === "submit") setSubmitModalOpen(true);
    if (initialModal === "arena") setArenaModalOpen(true);
    if (initialModal === "lecture") setLectureModalOpen(true);
    if (initialModal === "support") setSupportModalOpen(true);
    if (initialModal === "goal") setGoalModalOpen(true);
  }, [initialModal]);

  const navigateTo = (tab: StudentTab, subTab: string = "") => {
    setActiveTab(tab);
    setActiveSubTab(subTab);
    if (onNavigate) {
      onNavigate(tab, subTab);
    }
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
            src="/EDOPSLogo.png"
            alt="EDOPS Student Portal"
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
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          W O R K S P A C E   &   H E A D E R
      ═══════════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        {/* Header Bar */}
        <header
          className="workspace-header"
        >
          {/* Header Title & Crumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", whiteSpace: "nowrap", minWidth: 0 }}>
            <button
              type="button"
              aria-label="Open student navigation"
              className="workspace-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: S.navy, overflow: "hidden", textOverflow: "ellipsis" }}>
              Student Command Center
            </p>
            <span className="hidden sm:inline-block" style={{ width: "1px", height: "16px", background: S.line }} />
            <p className="hidden sm:inline-block" style={{ margin: 0, fontSize: "13px", color: S.slate }}>
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
          <div className="workspace-header-actions">
            {/* Search Box */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="workspace-search-btn"
              aria-label="Search"
            >
              <Search size={15} style={{ flexShrink: 0, color: "#64748b" }} className="search-icon" />
              <span className="search-label">Search...</span>
              <kbd className="search-kbd">⌘ K</kbd>
            </button>

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

              {/* Consistent Student Avatar & Profile Dropdown */}
              <div style={{ position: "relative" }}>
                <div
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  title="Student Profile & Settings"
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
                    alt={studentName}
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
                      <div style={{ padding: "10px 12px", borderBottom: "1px solid #e4e6e9", marginBottom: "6px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0c1e33", letterSpacing: "-0.01em" }}>
                          {studentName}
                        </div>
                        <div style={{ fontSize: "11px", color: "#495d72", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {studentEmail}
                        </div>
                        <div style={{ marginTop: "6px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "2px 8px", borderRadius: "100px", background: "#d9eed1", color: "#1a5c0a", fontSize: "10px", fontWeight: 600 }}>
                          <span>{studentClass}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigateTo('profile');
                        }}
                        style={{
                          all: "unset",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#0c1e33",
                          cursor: "pointer",
                          borderRadius: "6px",
                          boxSizing: "border-box",
                          transition: "background 0.12s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f8")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <ShieldCheck size={15} strokeWidth={1.75} style={{ color: "#495d72" }} />
                        <span>My Profile &amp; Vault</span>
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
                          fontSize: "12px",
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
          className="workspace-content-canvas"
          style={{
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
                  key="assignments"
                  organizationId={organization.id}
                  initialStatus={activeSubTab}
                  onStatusChange={(status) => navigateTo('assignments', status)}
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
                <PerformancePane
                  key="perf"
                  organizationId={organization.id}
                  initialTab={activeSubTab}
                  onTabChange={(tab) => navigateTo('performance', tab)}
                />
              )}

              {activeTab === 'curriculum' && (
                <CurriculumPane organizationId={organization.id} />
              )}

              {activeTab === 'resources' && (
                <ResourcesPane
                  key="resources"
                  organizationId={organization.id}
                  initialTab={activeSubTab}
                  onTabChange={(tab) => navigateTo('resources', tab)}
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
                  key="progress"
                  organizationId={organization.id}
                  initialTab={activeSubTab}
                  onTabChange={(tab) => navigateTo('progress', tab)}
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
                onClick={() => { setMobileMenuOpen(false); navigateTo('dashboard'); }}
                title="EDOPS Student Portal"
              >
                <img
                  src="/EDOPSLogo.png"
                  alt="EDOPS Student Portal"
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
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                ...primaryAcademicItems,
                ...extraAcademicItems,
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo(item.id as StudentTab);
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
                      background: active ? S.itemActiveBg : "transparent",
                      color: active ? "#ffffff" : "#cbd5e1",
                      borderLeft: active ? "3px solid #F8E7C9" : "3px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={17} style={{ flexShrink: 0, color: active ? "#F8E7C9" : "#94a3b8" }} />
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

      {/* Global Navigation Search Modal (Cmd+K) */}
      <GlobalPortalSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        role="student"
        onNavigate={(tab, sub) => navigateTo(tab as StudentTab, sub)}
      />
    </div>
  );
};
