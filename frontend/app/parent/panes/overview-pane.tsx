'use client';

import React from 'react';
import {
  Clock,
  Calendar,
  Award,
  BookOpen,
  CheckCircle2,
  Plus,
  MessageSquare,
  FileText,
  CalendarDays,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { WardInfo, ParentTab } from '../types';

interface OverviewPaneProps {
  selectedWard: WardInfo;
  onNavigateTab: (tab: ParentTab) => void;
  onOpenLeaveModal: () => void;
  onOpenQueryModal: () => void;
  onOpenReportModal: () => void;
}

export const OverviewPane: React.FC<OverviewPaneProps> = ({
  selectedWard,
  onNavigateTab,
  onOpenLeaveModal,
  onOpenQueryModal,
  onOpenReportModal,
}) => {
  const isGrade10 = selectedWard.sectionName.includes('10');

  const schedule = isGrade10
    ? [
        { period: '1', time: '08:00 - 08:45 AM', subject: 'Mathematics', teacher: 'Dr. K. Raman', room: 'Room 302', status: 'completed' },
        { period: '2', time: '08:50 - 09:35 AM', subject: 'Physics Lab', teacher: 'Mrs. Sunita Kapoor', room: 'Science Lab 2', status: 'now' },
        { period: '3', time: '09:40 - 10:25 AM', subject: 'English Core', teacher: 'Mr. Rajiv Menon', room: 'Room 302', status: 'upcoming' },
        { period: '4', time: '10:45 - 11:30 AM', subject: 'Chemistry', teacher: 'Dr. S. Nair', room: 'Room 302', status: 'upcoming' },
        { period: '5', time: '11:35 - 12:20 PM', subject: 'Computer Science', teacher: 'Ms. Priya Desai', room: 'Computer Lab 1', status: 'upcoming' },
      ]
    : [
        { period: '1', time: '08:00 - 08:45 AM', subject: 'General Science', teacher: 'Mrs. Anita Deshmukh', room: 'Room 104', status: 'completed' },
        { period: '2', time: '08:50 - 09:35 AM', subject: 'Mathematics', teacher: 'Mr. Alok Verma', room: 'Room 104', status: 'now' },
        { period: '3', time: '09:40 - 10:25 AM', subject: 'English Language', teacher: 'Ms. Ritu Sen', room: 'Room 104', status: 'upcoming' },
        { period: '4', time: '10:45 - 11:30 AM', subject: 'Social Studies', teacher: 'Ms. Sarita Chawla', room: 'Room 104', status: 'upcoming' },
        { period: '5', time: '11:35 - 12:20 PM', subject: 'Visual Arts', teacher: 'Mr. David Bose', room: 'Art Studio', status: 'upcoming' },
      ];

  const remarks = isGrade10
    ? [
        {
          teacher: 'Dr. K. Raman',
          subject: 'Mathematics',
          date: 'Oct 12',
          text: 'Scored 38/40 in Quadratic Equations periodic test. Shows strong mastery in analytical derivations.',
          type: 'positive',
        },
        {
          teacher: 'Mrs. Sunita Kapoor',
          subject: 'Physics',
          date: 'Oct 10',
          text: 'Completed optics laboratory experiment with distinction. Recommended to revise ray sign conventions.',
          type: 'note',
        },
      ]
    : [
        {
          teacher: 'Mrs. Anita Deshmukh',
          subject: 'General Science',
          date: 'Oct 14',
          text: 'Active class participation during the plant biology models presentation. Excellent notebook presentation.',
          type: 'positive',
        },
        {
          teacher: 'Mr. Alok Verma',
          subject: 'Mathematics',
          date: 'Oct 11',
          text: 'Consistent 100% homework submission streak. Encouraged to participate in Junior Math Olympiad.',
          type: 'note',
        },
      ];

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO GREETING & QUICK SHORTCUTS */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Observing {selectedWard.name} 👋
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20">
              {selectedWard.sectionName}
            </span>
          </div>
          <p className="text-xs md:text-sm text-indigo-100 mt-1">
            {selectedWard.programName} • Roll No: {selectedWard.rollNumber} • Today: Checked In (07:42 AM Gate 2)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenLeaveModal}
            style={{ backgroundColor: '#FFFFFF', color: '#3730A3' }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus size={14} /> Apply Student Leave
          </button>
          <button
            onClick={() => onNavigateTab('ptm')}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)' }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-white/25 transition-colors flex items-center gap-1.5"
          >
            <CalendarDays size={14} /> Book PTM Slot
          </button>
        </div>
      </div>

      {/* 2. 4 KEY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Check-in */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Check-in</span>
            <Clock size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {selectedWard.todayAttendance}
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <CheckCircle2 size={12} /> 07:42 AM
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Campus Gate 2 RFID / Bio confirmed</p>
        </div>

        {/* Attendance Percentage */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</span>
            <Calendar size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {selectedWard.attendancePct}%
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
              Above 75% CBSE
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isGrade10 ? '128 of 136' : '132 of 136'} academic periods attended
          </p>
        </div>

        {/* Academic Average */}
        <div
          onClick={() => onNavigateTab('academics')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cumulative GPA</span>
            <Award size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {selectedWard.gradeScore ?? (isGrade10 ? 88.5 : 94.0)}%
            </span>
            <span className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5">
              <TrendingUp size={12} /> Grade A1
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Verified continuous assessment average</p>
        </div>

        {/* Pending Homework */}
        <div
          onClick={() => onNavigateTab('academics')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Homework Due</span>
            <BookOpen size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {isGrade10 ? '2 Tasks' : '1 Task'}
            </span>
            <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">
              Due Tomorrow
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isGrade10 ? 'Physics Lab & Math Problem Set 4' : 'Science Models & Math Worksheet'}
          </p>
        </div>
      </div>

      {/* 3. SPLIT ROW: TODAY'S LIVE RADAR & RECENT TEACHER REMARKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Radar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Today&apos;s Class Schedule Radar</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{selectedWard.sectionName}</span>
          </div>

          <div className="space-y-2.5">
            {schedule.map((p, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  p.status === 'now'
                    ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                    : p.status === 'completed'
                    ? 'bg-slate-50/60 border-slate-200/80 text-slate-500'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      p.status === 'now'
                        ? 'bg-indigo-600 text-white'
                        : p.status === 'completed'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {p.period}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{p.subject}</span>
                      {p.status === 'now' && (
                        <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold animate-pulse">
                          LIVE NOW
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {p.teacher} · {p.room}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-slate-700">{p.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Teacher Remarks & Praise */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Teacher Remarks</h3>
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">This Term</span>
          </div>

          <div className="space-y-3">
            {remarks.map((rem, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{rem.subject}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{rem.date}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">&ldquo;{rem.text}&rdquo;</p>
                <div className="text-[10px] text-slate-500 font-semibold pt-1">By: {rem.teacher}</div>
              </div>
            ))}

            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-indigo-900">Arena Practice Milestone</span>
                <span className="text-[10px] text-indigo-600 font-mono">Oct 08</span>
              </div>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Earned &quot;Concept Champion&quot; streak with an 8-question consecutive accuracy in Practice Arena.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ACTIONS BAR */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onOpenReportModal}
          className="bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs px-4 py-2 rounded-xl transition-colors border border-slate-200 shadow-2xs flex items-center gap-2"
        >
          <FileText size={14} className="text-indigo-600" /> View Certified CBSE Report Card
        </button>
        <button
          onClick={onOpenQueryModal}
          className="bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs px-4 py-2 rounded-xl transition-colors border border-slate-200 shadow-2xs flex items-center gap-2"
        >
          <MessageSquare size={14} className="text-indigo-600" /> Send Grievance / Query to Principal
        </button>
        <button
          onClick={() => onNavigateTab('fees')}
          className="bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs px-4 py-2 rounded-xl transition-colors border border-slate-200 shadow-2xs flex items-center gap-2"
        >
          <ArrowRight size={14} className="text-indigo-600" /> Check Term Fee Invoices
        </button>
      </div>
    </div>
  );
};
