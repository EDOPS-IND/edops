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
  Building,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Bell,
  Sparkles,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    teaching: true,
    timetable: false,
    attendance: false,
    learning: false,
    arena: false,
    assessment: false,
    students: false,
    curriculum: false,
    communication: false,
  });

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

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navigateTo = (tab: TeacherTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
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
  const isFeatureEnabled = (key: string) => navigation.sections.some(section => section.items.some(item => item.featureKey === key));

  type TeacherNavItem = { id: string; label: string; icon: LucideIcon; tab?: TeacherTab; children?: { label: string; tab: TeacherTab }[] };
  const baseNavItems: TeacherNavItem[] = [
    {
      id: 'dashboard',
      label: 'Teacher Command Center',
      icon: LayoutDashboard,
      tab: 'dashboard' as TeacherTab,
    },
    {
      id: 'teaching',
      label: 'My Teaching',
      icon: BookOpen,
      children: [
        { label: 'My Classes & Sections', tab: 'classes' as TeacherTab },
        { label: 'Today\'s Classes', tab: 'timetable' as TeacherTab },
      ],
    },
    {
      id: 'timetable',
      label: 'Timetable',
      icon: Clock,
      children: [
        { label: 'Today & Weekly Grid', tab: 'timetable' as TeacherTab },
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: CheckSquare,
      children: [
        { label: 'Period Registers', tab: 'attendance' as TeacherTab },
      ],
    },
    {
      id: 'learning',
      label: 'Learning & Delivery',
      icon: FileText,
      children: [
        { label: 'Lesson Plans & Materials', tab: 'learning' as TeacherTab },
        { label: 'Assignments & Submissions', tab: 'assignments' as TeacherTab },
      ],
    },
    {
      id: 'arena',
      label: 'Arena Practice Bank',
      icon: Layers,
      children: [
        { label: 'Subject Questions & Bank', tab: 'arena' as TeacherTab },
      ],
    },
    {
      id: 'assessment',
      label: 'Assessments & Tests',
      icon: Award,
      children: [
        { label: 'Formative Tests & Marks', tab: 'assessment' as TeacherTab },
        { label: 'Official Exam Schedules', tab: 'exams' as TeacherTab },
      ],
    },
    {
      id: 'students',
      label: 'Student Tracking',
      icon: Users,
      children: [
        { label: 'Performance & At-Risk', tab: 'students' as TeacherTab },
      ],
    },
    {
      id: 'curriculum',
      label: 'Curriculum Progress',
      icon: Compass,
      tab: 'curriculum' as TeacherTab,
    },
    {
      id: 'communication',
      label: 'Academic Inbox',
      icon: MessageSquare,
      tab: 'communication' as TeacherTab,
    },
    {
      id: 'workload',
      label: 'My Workload & Tasks',
      icon: BarChart2,
      tab: 'workload' as TeacherTab,
    },
    {
      id: 'calendar',
      label: 'Academic Calendar',
      icon: CalendarDays,
      tab: 'calendar' as TeacherTab,
    },
    {
      id: 'reports',
      label: 'Reports & LO Heatmap',
      icon: FileSpreadsheet,
      tab: 'reports' as TeacherTab,
    },
    {
      id: 'activity',
      label: 'Activity Audit Log',
      icon: Activity,
      tab: 'activity' as TeacherTab,
    },
  ];

  const sourceItems = new Map<string, { tab: TeacherTab; icon: LucideIcon; direct: boolean }>();
  for (const group of baseNavItems) {
    if (group.children?.length) for (const child of group.children) {
      const key = group.id === 'teaching' && child.tab === 'timetable' ? 'today' : child.tab;
      sourceItems.set(`${group.id}.${key}`, { tab: child.tab, icon: group.icon, direct: false });
    }
    else if (group.tab) sourceItems.set(`${group.id === 'dashboard' ? 'overview' : ['curriculum', 'workload', 'calendar', 'reports', 'activity'].includes(group.id) ? 'management' : group.id}.${group.id}`,
      { tab: group.tab, icon: group.icon, direct: true });
  }
  const navItems: TeacherNavItem[] = navigation.sections.flatMap<TeacherNavItem>(section => {
    const entries = section.items.flatMap(item => {
      const source = sourceItems.get(item.key);
      return source ? [{ source, label: item.label }] : [];
    });
    if (!entries.length) return [];
    if (entries.length === 1 && entries[0].source.direct) return [{ id: section.key, label: entries[0].label, icon: entries[0].source.icon, tab: entries[0].source.tab }];
    return [{ id: section.key, label: section.label, icon: entries[0].source.icon,
      children: entries.map(entry => ({ label: entry.label, tab: entry.source.tab })) }];
  });
  const availableTabs = new Set(navigation.sections.flatMap(section => section.items.flatMap(item => {
    const tab = sourceItems.get(item.key)?.tab;
    return tab ? [tab] : [];
  })));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#090D16] text-white flex items-center justify-center font-bold text-base shadow-sm border border-[#1A243D]">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">
                  EdOps
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#090D16] font-semibold text-slate-200 border border-[#1A243D] uppercase tracking-wider">
                  Teacher Command Center
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {organization.name}
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Action Buttons */}
          <button
            disabled={!availableTabs.has('attendance')}
            onClick={() => handleOpenAttendance()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200 shadow-2xs"
          >
            <CheckSquare className="w-3.5 h-3.5 text-slate-600" />
            <span>Mark Attendance</span>
          </button>

          <button
            disabled={!availableTabs.has('assignments')}
            onClick={() => setAssignmentModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#090D16] hover:bg-[#131C31] text-xs font-semibold rounded-lg transition-colors shadow-xs border border-[#1A243D]"
            style={{ color: "#FFFFFF" }}
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Assignment</span>
          </button>

          {/* Org Selector */}
          {organizations.length > 1 && (
            <div className="relative hidden md:block">
              <select
                value={organization.id}
                onChange={(e) => onSwitchOrganization(e.target.value)}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#090D16] text-white flex items-center justify-center font-bold text-xs border border-[#1A243D]">
              T
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 bg-[#090D16] border-r border-[#1A243D] transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 overflow-y-auto ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full'
          }`}
        >
          <div className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasChildren = Boolean(item.children && item.children.length > 0);
              const isExpanded = expandedSections[item.id];
              const isDirectActive = activeTab === item.tab;
              const isChildActive = item.children?.some((c) => c.tab === activeTab);

              if (!hasChildren) {
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.tab!)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isDirectActive
                        ? 'bg-slate-700 font-bold shadow-sm border border-slate-600/40'
                        : 'hover:bg-[#131C31]'
                    }`}
                    style={{ color: isDirectActive ? '#FFFFFF' : '#CBD5E1' }}
                  >
                    <Icon 
                      className="w-4 h-4 shrink-0" 
                      style={{ color: isDirectActive ? '#FFFFFF' : '#94A3B8' }} 
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              }

              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isChildActive
                        ? 'bg-[#1E293B]'
                        : 'hover:bg-[#131C31]'
                    }`}
                    style={{ color: isChildActive ? '#FFFFFF' : '#CBD5E1' }}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon 
                        className="w-4 h-4 shrink-0" 
                        style={{ color: isChildActive ? '#818CF8' : '#94A3B8' }} 
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pl-6 pr-2 space-y-0.5 py-1 border-l border-[#243354] ml-5">
                      {item.children?.map((child, cIdx) => {
                        const isChildTabActive = activeTab === child.tab;
                        return (
                          <button
                            key={cIdx}
                            onClick={() => navigateTo(child.tab)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              isChildTabActive
                                ? 'bg-slate-700 font-bold shadow-sm border border-slate-600/40'
                                : 'hover:bg-[#131C31]'
                            }`}
                            style={{ color: isChildTabActive ? '#FFFFFF' : '#CBD5E1' }}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scoped Access Card Bottom Info */}
          <div className="p-3 m-3 bg-[#0D1322] border border-[#1A243D] rounded-xl text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Subject Scoped Session</span>
            </div>
            <p>Access active for assigned classes & subjects in AY 2026-27.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {navigation.loading ? <p>Loading dashboard navigation…</p> : navigation.error ? <p role="alert">{navigation.error}</p> : !availableTabs.has(activeTab) ? <p>This feature is unavailable for this school or role.</p> : <>
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
                key={`asg-${assignmentRefreshKey}`}
                organizationId={organization.id}
                onCreateAssignment={() => setAssignmentModalOpen(true)}
              />
            )}

            {activeTab === 'arena' && (
              <ArenaPane organizationId={organization.id} />
            )}

            {activeTab === 'assessment' && (
              !isFeatureEnabled('assessments') ? (
                <div style={{ padding: "40px", textAlign: "center", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", margin: "20px" }}>
                  <h3 style={{ color: "#991B1B", margin: "0 0 8px" }}>Feature Disabled</h3>
                  <p style={{ color: "#7F1D1D", margin: 0, fontSize: "14px" }}>
                    Assessments are currently disabled for teachers in this institution by the platform administrator.
                  </p>
                </div>
              ) : (
                <AssessmentsPane organizationId={organization.id} />
              )
            )}

            {activeTab === 'exams' && (
              <ExamsPane organizationId={organization.id} />
            )}

            {activeTab === 'students' && (
              <StudentsPane
                key={`students-${studentsRefreshKey}`}
                organizationId={organization.id}
                onOpenDossier={handleViewStudent}
                onOpenIntervention={() => setInterventionModalOpen(true)}
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
            </>}
          </div>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <QuickAttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        organizationId={organization.id}
        classSection={activeClassContext.classSection}
        sectionId={activeClassContext.sectionId}
        periodNumber={attendancePeriod}
        onSuccess={() => setAttendanceRefreshKey((k) => k + 1)}
      />

      <CreateAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        organizationId={organization.id}
        onSuccess={() => setAssignmentRefreshKey((k) => k + 1)}
      />

      <LessonCompletionModal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        organizationId={organization.id}
        classSection={activeClassContext.classSection}
        sectionId={activeClassContext.sectionId}
        onSuccess={() => {
          setLessonRefreshKey((k) => k + 1);
          setAttendanceRefreshKey((k) => k + 1);
        }}
      />

      <CreateInterventionModal
        isOpen={interventionModalOpen}
        onClose={() => setInterventionModalOpen(false)}
        organizationId={organization.id}
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
