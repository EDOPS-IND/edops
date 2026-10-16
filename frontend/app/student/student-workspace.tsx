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
  Sparkles,
  Menu,
  X,
  Upload,
  Play,
  HelpCircle,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    if (navigation.sections.length && !navigation.sections.some(section => section.items.some(item => item.key === tab || item.key.endsWith(`.${tab}`) || item.key.endsWith(tab)))) return;
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleOpenSubmit = (assignment?: any) => {
    setSelectedAssignment(
      assignment || {
        id: 'assign-1',
        title: 'Quadratic Equations: Problem Set 3',
        subject: 'Mathematics',
        teacher: 'Rahul Sharma',
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
            question: 'What is the discriminant of the quadratic equation 2x² - 4x + 3 = 0?',
            options: ['-8', '8', '40', '-40'],
            correctIndex: 0,
            explanation: 'D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8. Roots are complex.',
          },
          {
            id: 'q2',
            question: 'If roots of ax² + bx + c = 0 are equal, then discriminant is:',
            options: ['D > 0', 'D < 0', 'D = 0', 'D ≥ 0'],
            correctIndex: 2,
            explanation: 'Roots are equal if and only if b² - 4ac = 0.',
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
        title: 'Quadratic Equations - Complete Derivation & Discriminant',
        subject: 'Mathematics',
        teacher: 'Rahul Sharma',
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
    { id: 'dashboard', label: 'Student Command Center', icon: LayoutDashboard, tab: 'dashboard' as StudentTab },
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
    { id: 'resources', label: 'Notes & Recorded Lectures', icon: Video, tab: 'resources' as StudentTab },
    { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays, tab: 'calendar' as StudentTab },
    { id: 'communication', label: 'Academic Inbox', icon: MessageSquare, tab: 'communication' as StudentTab },
    { id: 'progress', label: 'Personal Growth & Goals', icon: Target, tab: 'progress' as StudentTab },
    { id: 'profile', label: 'Student Profile & Vault', icon: User, tab: 'profile' as StudentTab },
  ];
  const navSections = navigation.sections.map(section => ({ ...section, entries: section.items.flatMap(item => {
    const source = baseNavItems.find(candidate => item.key === candidate.id || item.key.endsWith(`.${candidate.id}`) || item.key.endsWith(candidate.id));
    return source ? [{ ...source, label: item.label }] : [];
  }) })).filter(section => section.entries.length);
  const availableTabs = new Set(navSections.flatMap(section => section.entries.map(item => item.tab)));

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
                  Student Learning Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {organization.name}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            disabled={!navigation.has('academics.assignments')}
            onClick={() => handleOpenSubmit()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Submit Homework</span>
          </button>

          <button
            disabled={!navigation.has('academics.arena')}
            onClick={() => handleOpenArena()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200 shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 text-indigo-500" />
            <span>Start Arena</span>
          </button>

          <button
            disabled={!availableTabs.has('communication')}
            onClick={() => setSupportModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#090D16] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs border border-[#2A3756]"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-slate-100">Ask Teacher</span>
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
            <button
              type="button"
              disabled={!availableTabs.has('profile')}
              onClick={() => navigateTo('profile')}
              className="w-8 h-8 rounded-full bg-[#090D16] text-white flex items-center justify-center font-bold text-xs cursor-pointer border border-[#1A243D] hover:ring-2 hover:ring-indigo-400"
              title="View Profile"
            >
              <User className="w-4 h-4" />
            </button>
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

      {/* Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile menu backdrop overlay */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-10 bg-[#070A10]/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 bg-[#090D16] border-r border-[#1A243D] transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 overflow-y-auto ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full'
          }`}
        >
          <div className="p-3 space-y-1">
            {navSections.map(section => <div key={section.key} className="space-y-1">
              <p className="px-3 pt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{section.label}</p>
              {section.entries.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-700 font-bold shadow-sm border border-slate-600/40'
                      : 'hover:bg-[#131C31]'
                  }`}
                  style={{ color: isActive ? '#FFFFFF' : '#CBD5E1' }}
                >
                  <Icon 
                    className="w-4 h-4 shrink-0" 
                    style={{ color: isActive ? '#FFFFFF' : '#94A3B8' }} 
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
              })}
            </div>)}
          </div>

          {/* Enrollment Identity Card */}
          <div className="p-3 m-3 bg-[#0D1322] border border-[#1A243D] rounded-xl text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Active Enrolled Learner</span>
            </div>
            <p className="text-slate-300">Class 10-A • Roll No. 17</p>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {navigation.loading ? <p>Loading dashboard navigation…</p> : navigation.error ? <p role="alert">{navigation.error}</p> : !availableTabs.has(activeTab) ? <p>This feature is unavailable for this school or role.</p> : <>
            {activeTab === 'dashboard' && (
              <DashboardPane
                organizationId={organization.id}
                onNavigateTab={navigateTo}
                onSubmitAssignment={handleOpenSubmit}
                onStartArena={handleOpenArena}
                onOpenLecture={handleOpenLecture}
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
            </>}
          </div>
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
