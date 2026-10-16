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
  GraduationCap,
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
  RefreshCw,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

import { OrganizationSummary, getTeacherClasses } from '../edops-api';
import { useDashboardNavigation } from '../dashboard-navigation';
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

interface TeacherWorkspaceProps {
  organization: OrganizationSummary;
  onLogout: () => void;
  onSwitchOrganization: (orgId: string) => void;
  organizations: OrganizationSummary[];
}

export const TeacherWorkspace: React.FC<TeacherWorkspaceProps> = ({
  organization,
  onLogout,
  onSwitchOrganization,
  organizations,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Global Modals State
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendancePeriod, setAttendancePeriod] = useState(1);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
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

  const navigateTo = (tab: TeacherTab) => {
    setActiveTab(tab);
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

  type TeacherNavItem = { id: string; label: string; icon: LucideIcon; tab?: TeacherTab; children?: { label: string; tab: TeacherTab }[] };
  const baseNavItems: TeacherNavItem[] = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, tab: 'dashboard' as TeacherTab },
    { id: 'classes', label: 'My Classes & Sections', icon: BookOpen, tab: 'classes' as TeacherTab },
    { id: 'timetable', label: 'Timetable & Schedule', icon: Clock, tab: 'timetable' as TeacherTab },
    { id: 'attendance', label: 'Attendance Registers', icon: CheckSquare, tab: 'attendance' as TeacherTab },
    { id: 'learning', label: 'Lesson Plans & Content', icon: FileText, tab: 'learning' as TeacherTab },
    { id: 'assignments', label: 'Assignments & Submissions', icon: FileText, tab: 'assignments' as TeacherTab },
    { id: 'arena', label: 'Arena Practice Bank', icon: Layers, tab: 'arena' as TeacherTab },
    { id: 'assessment', label: 'Assessments & Tests', icon: Award, tab: 'assessment' as TeacherTab },
    { id: 'exams', label: 'Official Exam Schedules', icon: Calendar, tab: 'exams' as TeacherTab },
    { id: 'students', label: 'Student Tracking', icon: Users, tab: 'students' as TeacherTab },
    { id: 'curriculum', label: 'Curriculum Progress', icon: Compass, tab: 'curriculum' as TeacherTab },
    { id: 'communication', label: 'Academic Inbox', icon: MessageSquare, tab: 'communication' as TeacherTab },
    { id: 'workload', label: 'My Workload & Tasks', icon: BarChart2, tab: 'workload' as TeacherTab },
    { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays, tab: 'calendar' as TeacherTab },
    { id: 'reports', label: 'Reports & LO Heatmap', icon: FileSpreadsheet, tab: 'reports' as TeacherTab },
    { id: 'activity', label: 'Activity Audit Log', icon: Activity, tab: 'activity' as TeacherTab },
  ];

  const sourceItems = new Map<string, { tab: TeacherTab; icon: LucideIcon }>();
  for (const item of baseNavItems) {
    if (item.tab) {
      sourceItems.set(item.id, { tab: item.tab, icon: item.icon });
    }
  }

  const navSections = navigation.sections.map(section => ({
    ...section,
    entries: section.items.flatMap(item => {
      const tabKey = item.key.split('.').at(-1) || item.key;
      const found = baseNavItems.find(b => b.id === tabKey || b.tab === tabKey);
      return found ? [{ ...found, label: item.label }] : [];
    }),
  })).filter(section => section.entries.length > 0);

  const availableTabs = new Set(navSections.flatMap(section => section.entries.map(item => item.tab)));

  const pageTitles: Partial<Record<TeacherTab, string>> = {
    dashboard: "Teacher Command Center",
    classes: "My Classes & Sections",
    timetable: "Class Schedule & Timetable",
    attendance: "Period Attendance Registers",
    learning: "Lesson Plans & Delivery",
    assignments: "Assignments & Submissions",
    arena: "Arena Practice Bank",
    assessment: "Formative Tests & Evaluations",
    exams: "Official Exams & Grading",
    students: "Student Tracking & At-Risk Roster",
    curriculum: "Curriculum Progress & LOs",
    communication: "Academic Directives & Messages",
    workload: "My Workload & Instructional Tasks",
    calendar: "Academic Calendar",
    reports: "Reports & Heatmaps",
    activity: "Teacher Activity Audit Log",
  };

  const teacherInitials = (organization.name || "TC")
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
                  onClick={() => navigateTo(item.tab!)}
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
              Active Faculty Session
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
              {pageTitles[activeTab] ?? "Teacher Command Center"}
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
            {/* Mark Attendance */}
            <button
              onClick={() => handleOpenAttendance()}
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
              <CheckSquare size={13} style={{ color: "#475467" }} />
              <span>Mark Attendance</span>
            </button>

            {/* + New Assignment */}
            <button
              onClick={() => setAssignmentModalOpen(true)}
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
              <Plus size={13} style={{ color: "#FFFFFF" }} />
              <span>New Assignment</span>
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
                placeholder="Search classes…"
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

            {/* Teacher Avatar */}
            <div
              style={{
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
                letterSpacing: "0.02em",
              }}
            >
              {teacherInitials}
            </div>
          </div>
        </header>

        {/* Content Body Container */}
        <div style={{ padding: "24px 28px", flex: 1 }}>
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
                  onCreateAssignment={(sectionId) => setAssignmentModalOpen(true)}
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
                  key={`learning-${lessonRefreshKey}`}
                  organizationId={organization.id}
                  onRecordLesson={() => handleOpenLesson()}
                  onLogLesson={handleOpenLesson}
                />
              )}

              {activeTab === 'assignments' && (
                <AssignmentsPane
                  key={`assign-${assignmentRefreshKey}`}
                  organizationId={organization.id}
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
                  key={`students-${studentsRefreshKey}`}
                  organizationId={organization.id}
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
                <CommunicationPane organizationId={organization.id} />
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
        </div>
      </main>

      {/* Global Modals */}
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
