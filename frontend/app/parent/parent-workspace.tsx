'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  CreditCard,
  CalendarDays,
  Bell,
  MessageSquare,
  Sparkles,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { OrganizationSummary } from '../edops-api';
import { ParentTab, WardInfo, LeaveApplication, ParentQuery } from './types';

// Panes
import { OverviewPane } from './panes/overview-pane';
import { AcademicsPane } from './panes/academics-pane';
import { AttendancePane } from './panes/attendance-pane';
import { FeesPane } from './panes/fees-pane';
import { PtmPane } from './panes/ptm-pane';
import { NoticesPane } from './panes/notices-pane';

// Modals
import { ApplyLeaveModal } from './components/apply-leave-modal';
import { ParentQueryModal } from './components/parent-query-modal';
import { ReportCardModal } from './components/report-card-modal';

interface ParentWorkspaceProps {
  organization: OrganizationSummary;
  onLogout: () => void;
  onSwitchOrganization: (orgId: string) => void;
  organizations: OrganizationSummary[];
  initialWardId?: string;
}

export const ParentWorkspace: React.FC<ParentWorkspaceProps> = ({
  organization,
  onLogout,
  onSwitchOrganization,
  organizations,
  initialWardId,
}) => {
  const [activeTab, setActiveTab] = useState<ParentTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Wards List
  const wards: WardInfo[] = [
    {
      studentUserId: 'std-demo-01',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@school.edu',
      rollNumber: '10A-24',
      sectionName: 'Grade 10-A',
      programName: 'Secondary CBSE Curriculum',
      attendancePct: 96.2,
      todayAttendance: 'Present',
      checkInTime: '07:42 AM',
      gradeScore: 88.5,
      pendingHomeworkCount: 2,
    },
    {
      studentUserId: 'std-demo-02',
      name: 'Ananya Sharma',
      email: 'ananya.sharma@school.edu',
      rollNumber: '06B-12',
      sectionName: 'Grade 6-B',
      programName: 'Middle School CBSE Curriculum',
      attendancePct: 98.0,
      todayAttendance: 'Present',
      checkInTime: '07:38 AM',
      gradeScore: 94.0,
      pendingHomeworkCount: 1,
    },
  ];

  const [selectedWardId, setSelectedWardId] = useState<string>(initialWardId || wards[0].studentUserId);
  const selectedWard = wards.find((w) => w.studentUserId === selectedWardId) || wards[0];

  // Modals state
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Applications & Queries state
  const [leavesList, setLeavesList] = useState<LeaveApplication[]>([
    {
      id: 'leave-1',
      studentUserId: 'std-demo-01',
      childName: 'Aarav Sharma',
      leaveType: 'Medical / Doctor Visit',
      startDate: '2026-10-05',
      endDate: '2026-10-06',
      reason: 'Dental checkup and follow-up appointment.',
      status: 'approved',
      submittedAt: '2026-10-04',
    },
  ]);

  const [queriesList, setQueriesList] = useState<ParentQuery[]>([
    {
      id: 'qry-1',
      studentUserId: 'std-demo-01',
      childName: 'Aarav Sharma',
      subject: 'Math Periodic Test 2 Feedback',
      category: 'Academic Quality & Evaluation',
      queryText: 'Requesting clarity on deduction in Section B calculus proofs.',
      status: 'resolved',
      submittedAt: '2026-10-08',
    },
  ]);

  const handleApplyLeave = (newLeave: LeaveApplication) => {
    setLeavesList([newLeave, ...leavesList]);
  };

  const handlePostQuery = (newQuery: ParentQuery) => {
    setQueriesList([newQuery, ...queriesList]);
  };

  const navItems = [
    { id: 'overview', label: 'Family Overview', icon: LayoutDashboard, tab: 'overview' as ParentTab },
    { id: 'academics', label: 'Children & Academics', icon: BookOpen, tab: 'academics' as ParentTab },
    { id: 'attendance', label: 'Attendance & Leaves', icon: CheckCircle2, tab: 'attendance' as ParentTab },
    { id: 'fees', label: 'Fee Invoicing & Receipts', icon: CreditCard, tab: 'fees' as ParentTab },
    { id: 'ptm', label: 'PTM Slot Scheduling', icon: CalendarDays, tab: 'ptm' as ParentTab },
    { id: 'notices', label: 'School Notices & Grievance', icon: Bell, tab: 'notices' as ParentTab },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
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
                  Parent Guardian Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {organization.name}
              </p>
            </div>
          </div>
        </div>

        {/* Header Right: Ward Switcher & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Ward Switcher in Header */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 px-2">Ward:</span>
            {wards.map((w) => {
              const isSelected = w.studentUserId === selectedWardId;
              return (
                <button
                  key={w.studentUserId}
                  onClick={() => setSelectedWardId(w.studentUserId)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#090D16] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <span>{w.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {w.sectionName}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setLeaveModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Apply Leave</span>
          </button>

          <button
            onClick={() => setActiveTab('ptm')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#090D16] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs border border-[#2A3756]"
          >
            <CalendarDays className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-slate-100">Book PTM</span>
          </button>

          {/* Org Selector */}
          {organizations.length > 1 && (
            <div className="relative hidden xl:block">
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

          {/* Parent Profile Avatar & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div
              className="w-8 h-8 rounded-full bg-[#090D16] text-white flex items-center justify-center font-bold text-xs border border-[#1A243D]"
              title="Rajesh Sharma (Guardian)"
            >
              RS
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

      {/* 2. PERSISTENT WARD SWITCHER BAR (Mobile/Tablet & Quick Access) */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Select Ward:</span>
        </div>
        <div className="flex items-center gap-2">
          {wards.map((w) => {
            const isSelected = w.studentUserId === selectedWardId;
            return (
              <button
                key={w.studentUserId}
                onClick={() => setSelectedWardId(w.studentUserId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#090D16] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span>{w.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {w.sectionName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile menu backdrop overlay */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-10 bg-[#070A10]/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* Universal Midnight Obsidian Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 bg-[#090D16] border-r border-[#1A243D] transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 overflow-y-auto ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full'
          }`}
        >
          {/* Ward Selector in Sidebar for direct mobile access */}
          <div className="p-3 border-b border-[#1A243D]">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Active Ward</p>
            <div className="space-y-1">
              {wards.map((w) => {
                const isSelected = w.studentUserId === selectedWardId;
                return (
                  <button
                    key={w.studentUserId}
                    onClick={() => {
                      setSelectedWardId(w.studentUserId);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-slate-700 text-white shadow-sm border border-slate-600/40'
                        : 'text-slate-300 hover:bg-[#131C31]'
                    }`}
                  >
                    <div className="text-left truncate">
                      <div className="truncate">{w.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{w.sectionName}</div>
                    </div>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <p className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Navigation</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setMobileMenuOpen(false);
                  }}
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
          </div>

          {/* Guardian Account Badge */}
          <div className="p-3 m-3 bg-[#0D1322] border border-[#1A243D] rounded-xl text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Verified Guardian Session</span>
            </div>
            <p className="text-slate-300">Rajesh Sharma • 2 Linked Wards</p>
          </div>
        </aside>

        {/* 4. MAIN CONTENT CANVASES */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewPane
                selectedWard={selectedWard}
                onNavigateTab={setActiveTab}
                onOpenLeaveModal={() => setLeaveModalOpen(true)}
                onOpenQueryModal={() => setQueryModalOpen(true)}
                onOpenReportModal={() => setReportModalOpen(true)}
              />
            )}

            {activeTab === 'academics' && (
              <AcademicsPane
                selectedWard={selectedWard}
                onOpenReportModal={() => setReportModalOpen(true)}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendancePane
                selectedWard={selectedWard}
                leavesList={leavesList}
                onOpenLeaveModal={() => setLeaveModalOpen(true)}
              />
            )}

            {activeTab === 'fees' && (
              <FeesPane selectedWard={selectedWard} />
            )}

            {activeTab === 'ptm' && (
              <PtmPane selectedWard={selectedWard} />
            )}

            {activeTab === 'notices' && (
              <NoticesPane
                selectedWard={selectedWard}
                queriesList={queriesList}
                messages={[]}
                onOpenQueryModal={() => setQueryModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* 5. GLOBAL PARENT MODALS */}
      <ApplyLeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        selectedWard={selectedWard}
        onApplyLeave={handleApplyLeave}
      />

      <ParentQueryModal
        isOpen={queryModalOpen}
        onClose={() => setQueryModalOpen(false)}
        selectedWard={selectedWard}
        onSubmitQuery={handlePostQuery}
      />

      <ReportCardModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        selectedWard={selectedWard}
      />
    </div>
  );
};
