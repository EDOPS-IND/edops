'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Clock,
  FileText,
  Trophy,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Compass,
  Video,
  CalendarDays,
  MessageSquare,
  Target,
  User,
  LogOut,
  Upload,
  Play,
  HelpCircle,
  Search,
  RefreshCw,
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

// ─── Design Tokens (Identical to School Admin) ────────────────────────────
const S = {
  // sidebar
  bg: "#111318",
  border: "#1E2128",
  itemText: "#8C909A",
  itemHover: "#1A1D24",
  itemActive: "#1E2128",
  activeBar: "#FFFFFF",
  activeTxt: "#FFFFFF",
  groupLabel: "#444750",

  // header
  headerBg: "#FFFFFF",
  headerBorder: "#EAECF0",
  headerInk: "#101828",
  headerMuted: "#667085",
  inputBg: "#F9FAFB",
  inputBorder: "#D0D5DD",

  // content
  canvasBg: "#F7F8FA",
  avatarBg: "#1A1D24",
  avatarText: "#FFFFFF",
};

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
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
        gap: "9px",
        padding: "7px 12px 7px 14px",
        borderRadius: "7px",
        cursor: "pointer",
        position: "relative",
        background: active ? S.itemActive : hover ? S.itemHover : "transparent",
        transition: "background 0.12s",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "2px",
            height: "16px",
            borderRadius: "0 2px 2px 0",
            background: S.activeBar,
          }}
        />
      )}
      <Icon
        size={14}
        strokeWidth={active ? 2 : 1.75}
        style={{ color: active ? S.activeTxt : S.itemText, flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: "13px",
          fontWeight: active ? 600 : 400,
          color: active ? S.activeTxt : S.itemText,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function NavGroup({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "18px 14px 5px",
        fontSize: "10px",
        fontWeight: 600,
        color: S.groupLabel,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}

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
  const [searchFocused, setSearchFocused] = useState(false);

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
    if (
      navigation.sections.length &&
      !navigation.sections.some(section =>
        section.items.some(
          item =>
            item.key === tab ||
            item.key.endsWith(`.${tab}`) ||
            item.key.endsWith(tab)
        )
      )
    )
      return;
    setActiveTab(tab);
  };

  const handleOpenSubmit = (assignment?: any) => {
    setSelectedAssignment(
      assignment || {
        id: 'assign-1',
        title: 'Quadratic Equations: Problem Set 3',
        subject: 'Mathematics',
        teacher: 'Dr. K. Raman',
        maxMarks: 20,
        dueDate: 'Today, 05:00 PM',
        instructions: 'Show all derivation steps clearly.',
      }
    );
    setSubmitModalOpen(true);
  };

  const handleOpenArena = (activity?: any) => {
    setSelectedArenaActivity(
      activity || {
        id: 'arena-act-1',
        title: 'Quadratic Equations Speed Drill',
        subject: 'Mathematics',
        mode: 'practice',
        questions: [
          {
            id: 'q1',
            question: 'What is the discriminant of 2x² - 4x + 3 = 0?',
            options: ['-8', '8', '40', '-40'],
            correctIndex: 0,
            explanation: 'D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8.',
          },
          {
            id: 'q2',
            question: 'If roots of ax² + bx + c = 0 are equal, then:',
            options: ['D > 0', 'D < 0', 'D = 0', 'D ≥ 0'],
            correctIndex: 2,
            explanation: 'Equal roots occur when D = 0.',
          },
        ],
      }
    );
    setArenaModalOpen(true);
  };

  const handleOpenLecture = (lecture?: any) => {
    setSelectedLecture(
      lecture || {
        id: 'rec-1',
        title: 'Quadratic Equations - Complete Derivation',
        subject: 'Mathematics',
        teacher: 'Dr. K. Raman',
        duration: '42 mins',
        durationSeconds: 2520,
        recordedDate: 'Oct 04, 2026',
        videoUrl: 'https://cdn.school.edu/recordings/math-quadratics-lec1.mp4',
        watchedPct: 60,
        isCompleted: false,
      }
    );
    setLectureModalOpen(true);
  };

  const baseNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' as StudentTab },
    { id: 'class', label: 'My Class', icon: Users, tab: 'class' as StudentTab },
    { id: 'subjects', label: 'Prescribed Subjects', icon: BookOpen, tab: 'subjects' as StudentTab },
    { id: 'timetable', label: 'Timetable & Schedule', icon: Clock, tab: 'timetable' as StudentTab },
    { id: 'assignments', label: 'Assignments & Homework', icon: FileText, tab: 'assignments' as StudentTab },
    { id: 'arena', label: 'Arena Practice Bank', icon: Trophy, tab: 'arena' as StudentTab },
    { id: 'assessments', label: 'Formative Tests', icon: Award, tab: 'assessments' as StudentTab },
    { id: 'exams', label: 'Term Exams & Scorecards', icon: Calendar, tab: 'exams' as StudentTab },
    { id: 'attendance', label: 'Attendance Monitoring', icon: CheckCircle2, tab: 'attendance' as StudentTab },
    { id: 'performance', label: 'Academic Performance', icon: TrendingUp, tab: 'performance' as StudentTab },
    { id: 'curriculum', label: 'Curriculum Progress', icon: Compass, tab: 'curriculum' as StudentTab },
    { id: 'resources', label: 'Notes & Lectures', icon: Video, tab: 'resources' as StudentTab },
    { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays, tab: 'calendar' as StudentTab },
    { id: 'communication', label: 'Academic Inbox', icon: MessageSquare, tab: 'communication' as StudentTab },
    { id: 'progress', label: 'Personal Growth & Goals', icon: Target, tab: 'progress' as StudentTab },
    { id: 'profile', label: 'Student Profile & Vault', icon: User, tab: 'profile' as StudentTab },
  ];

  const navSections = navigation.sections.map(section => ({
    ...section,
    entries: section.items.flatMap(item => {
      const source = baseNavItems.find(
        candidate =>
          item.key === candidate.id ||
          item.key.endsWith(`.${candidate.id}`) ||
          item.key.endsWith(candidate.id)
      );
      return source ? [{ ...source, label: item.label }] : [];
    }),
  })).filter(section => section.entries.length);

  const availableTabs = new Set(navSections.flatMap(section => section.entries.map(item => item.tab)));

  const pageTitles: Partial<Record<StudentTab, string>> = {
    dashboard: "Student Command Center",
    class: "My Class & Peers",
    subjects: "Prescribed Subjects",
    timetable: "Class Timetable & Schedule",
    assignments: "Assignments & Submissions",
    arena: "Arena Practice Bank",
    assessments: "Formative Tests & Evaluations",
    exams: "Official Exams & Report Cards",
    attendance: "Attendance Register & Trends",
    performance: "Academic Performance Analytics",
    curriculum: "Curriculum Pacing & Learning Outcomes",
    resources: "Notes & Recorded Lectures",
    calendar: "Academic Calendar",
    communication: "Academic Directives & Messages",
    progress: "Personal Growth & Goals",
    profile: "Student Profile & Vault",
  };

  const studentInitials = (organization.name || "ST")
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: S.canvasBg,
        fontFamily: 'var(--font-space-grotesk), "Inter", system-ui, sans-serif',
      }}
    >
      {/* ═══════════════════════════════════════════════
          S I D E B A R (Clean Dark Charcoal Admin Sidebar)
      ═══════════════════════════════════════════════ */}
      <aside
        style={{
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
            borderBottom: `1px solid ${S.border}`,
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <div style={{ height: "28px", display: "flex", alignItems: "center" }}>
            <img src="/logo.svg" alt="EDOPS" style={{ height: "100%", width: "auto", display: "block" }} />
          </div>
        </div>

        {/* Navigation Groups */}
        <nav style={{ flex: 1, padding: "2px 8px 12px", display: "flex", flexDirection: "column" }}>
          {navigation.error && (
            <p role="alert" style={{ color: "#FCA5A5", padding: "12px", fontSize: "12px" }}>
              {navigation.error}
            </p>
          )}

          {navSections.map(section => (
            <React.Fragment key={section.key}>
              <NavGroup label={section.label} />
              {section.entries.map(item => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.tab}
                  onClick={() => navigateTo(item.tab)}
                />
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Identity & Sign Out */}
        <div style={{ borderTop: `1px solid ${S.border}`, padding: "12px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#8C909A", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Class 10-A · Enrolled
            </span>
          </div>

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
          M A I N   A R E A
      ═══════════════════════════════════════════════ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh", overflow: "auto" }}>
        {/* Sticky Top Header Bar with Kept Action Buttons Strictly on Top */}
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
            background: S.headerBg,
            borderBottom: `1px solid ${S.headerBorder}`,
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
                color: S.headerInk,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {pageTitles[activeTab] ?? "Student Command Center"}
            </h1>
            {activeTab === "dashboard" && (
              <button
                onClick={() => window.location.reload()}
                title="Refresh Dashboard"
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

          {/* Right: Quick Action Buttons strictly placed on top as requested */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {/* Submit Homework */}
            <button
              onClick={() => handleOpenSubmit()}
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
                color: S.headerInk,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#98A2B3"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#D0D5DD"; }}
            >
              <Upload size={13} style={{ color: "#475467" }} />
              <span>Submit Homework</span>
            </button>

            {/* Start Arena */}
            <button
              onClick={() => handleOpenArena()}
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
                color: S.headerInk,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#98A2B3"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#D0D5DD"; }}
            >
              <Play size={13} style={{ color: "#101828" }} />
              <span>Start Arena</span>
            </button>

            {/* Ask Teacher */}
            <button
              onClick={() => setSupportModalOpen(true)}
              style={{
                all: "unset",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: S.headerInk,
                border: `1px solid ${S.headerInk}`,
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16,24,40,0.08)",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1D2939")}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.headerInk)}
            >
              <HelpCircle size={13} style={{ color: "#FFFFFF" }} />
              <span>Ask Teacher</span>
            </button>

            {/* Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                height: "34px",
                padding: "0 11px",
                border: `1px solid ${searchFocused ? "#98A2B3" : S.inputBorder}`,
                borderRadius: "8px",
                background: S.inputBg,
                transition: "border-color 0.15s",
              }}
            >
              <Search size={13} strokeWidth={2} style={{ color: S.headerMuted, flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search coursework…"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  color: S.headerInk,
                  width: "130px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Multi-Org Switcher */}
            {organizations.length > 1 && (
              <select
                value={organization.id}
                onChange={(e) => onSwitchOrganization(e.target.value)}
                style={{
                  height: "34px",
                  padding: "0 10px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: S.headerInk,
                  background: S.inputBg,
                  border: `1px solid ${S.inputBorder}`,
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

            {/* Student Avatar */}
            <button
              type="button"
              onClick={() => navigateTo('profile')}
              title="Student Profile"
              style={{
                all: "unset",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: S.avatarBg,
                color: S.avatarText,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                letterSpacing: "0.02em",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #98A2B3")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {studentInitials}
            </button>
          </div>
        </header>

        {/* Content Body Container */}
        <div key={refreshKey} style={{ padding: "24px 28px", flex: 1 }}>
          {navigation.loading ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: S.headerMuted }}>
              <p>Loading dashboard navigation…</p>
            </div>
          ) : navigation.error ? (
            <p role="alert" style={{ color: "#B42318" }}>{navigation.error}</p>
          ) : !availableTabs.has(activeTab) ? (
            <p style={{ color: S.headerMuted }}>This feature is unavailable for this school or role.</p>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPane
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
                <ProfilePane organizationId={organization.id} />
              )}
            </>
          )}
        </div>
      </main>

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
