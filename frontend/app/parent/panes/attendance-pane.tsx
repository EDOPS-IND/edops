'use client';

import React from 'react';
import { Calendar, CheckCircle2, AlertCircle, Clock, Plus, ShieldCheck } from 'lucide-react';
import { WardInfo, LeaveApplication } from '../types';

interface AttendancePaneProps {
  selectedWard: WardInfo;
  leavesList: LeaveApplication[];
  onOpenLeaveModal: () => void;
}

export const AttendancePane: React.FC<AttendancePaneProps> = ({
  selectedWard,
  leavesList,
  onOpenLeaveModal,
}) => {
  // October 2026 calendar data: Oct 1, 2026 was a Thursday. 31 days total.
  // Day of week index: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // October 1 starts on Thursday (index 4). So 4 leading blank spaces.
  const daysInMonth = 31;
  const startDayOffset = 4; // Thursday

  const wardLeaves = leavesList.filter((l) => l.studentUserId === selectedWard.studentUserId);

  // Status mapping for days in October 2026
  const getDayStatus = (day: number) => {
    const dayOfWeek = (startDayOffset + day - 1) % 7;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) return 'weekend';
    if (day === 2) return 'holiday'; // Gandhi Jayanti
    if (day === 5 && selectedWard.name.includes('Aarav')) return 'leave'; // Doctor visit
    if (day > 16) return 'future';
    return 'present';
  };

  return (
    <div className="space-y-6">
      {/* 1. ATTENDANCE SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Attendance Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {selectedWard.attendancePct}%
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
              CBSE Compliant
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Requires minimum 75.0% for CBSE Board Exam admit card eligibility
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sessions Attended</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">128</span>
            <span className="text-xs text-slate-500 font-medium">/ 136 Academic Days</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Total working days recorded in academic year 2026-27</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Gate Check-in</span>
            <div className="flex items-center gap-2 mt-1 text-emerald-700 font-bold text-lg">
              <CheckCircle2 size={18} />
              <span>Present at 07:42 AM</span>
            </div>
          </div>
          <button
            onClick={onOpenLeaveModal}
            className="mt-3 bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs border border-[#1A243D] flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Submit Absence Leave
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC MONTHLY CALENDAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">October 2026 Attendance Heatmap</h4>
            <p className="text-[11px] text-slate-500">Official daily biometric and classroom attendance log</p>
          </div>
          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Excused Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Absent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Weekend / Holiday
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="font-bold text-slate-400 text-[10px] uppercase tracking-wider py-1">
              {d}
            </div>
          ))}

          {/* Empty cells before start of month */}
          {Array.from({ length: startDayOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-10 rounded-xl bg-slate-50/20" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const status = getDayStatus(dayNum);
            return (
              <div
                key={dayNum}
                className={`h-11 rounded-xl flex flex-col items-center justify-center text-xs font-mono border transition-colors ${
                  status === 'future'
                    ? 'bg-slate-50/40 text-slate-300 border-slate-100'
                    : status === 'weekend'
                    ? 'bg-slate-100/70 text-slate-400 border-slate-200'
                    : status === 'holiday'
                    ? 'bg-purple-50 text-purple-700 border-purple-200 font-bold'
                    : status === 'leave'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold'
                    : 'bg-emerald-50/80 text-emerald-900 border-emerald-200 font-bold'
                }`}
              >
                <span>{dayNum}</span>
                <span className="text-[8px] font-sans uppercase font-bold tracking-tight">
                  {status === 'holiday' ? 'Holiday' : status === 'leave' ? 'Leave' : status === 'weekend' ? 'Off' : status === 'future' ? '' : 'P'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. APPLIED LEAVES LOG */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Submitted Leave Applications</h4>
            <p className="text-[11px] text-slate-500">Track approvals and historical medical certificates</p>
          </div>
          <button
            onClick={onOpenLeaveModal}
            className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-3 py-1.5 rounded-xl transition-all shadow-xs"
          >
            Apply New Leave
          </button>
        </div>

        <div className="space-y-2.5">
          {wardLeaves.length > 0 ? (
            wardLeaves.map((leave) => (
              <div
                key={leave.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{leave.leaveType}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-mono">
                      {leave.startDate} to {leave.endDate}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{leave.reason}</p>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">Applied: {leave.submittedAt}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    leave.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : leave.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {leave.status}
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              No leave applications submitted for {selectedWard.name} this term.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
