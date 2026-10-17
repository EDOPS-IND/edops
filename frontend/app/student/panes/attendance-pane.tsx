'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getStudentAttendance } from '../../edops-api';

interface AttendancePaneProps {
  organizationId: string;
}

export const AttendancePane: React.FC<AttendancePaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [organizationId]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await getStudentAttendance(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading attendance records...</div>;
  }

  const summary = data?.summary || { overallPercentage: 0, totalWorkingDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, leaveDays: 0, thresholdPercentage: 0 };

  const subjectWise = data?.subjectWise || [];
  const calendarDays = data?.calendarDays || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Attendance Monitoring & History</h2>
        <p className="text-sm text-slate-500">Track daily registers, subject-wise attendance %, and CBSE minimum 75% statutory requirement.</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Overall Attendance</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary.overallPercentage}%</div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">&ge; 75% CBSE requirement met</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Days Present</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{summary.presentDays} Days</div>
          <p className="text-xs text-slate-400 mt-1">Out of {summary.totalWorkingDays} instructional days</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Days Absent</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{summary.absentDays} Days</div>
          <p className="text-xs text-slate-400 mt-1">{summary.leaveDays} approved leaves recorded</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tardy / Late Mark</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{summary.lateDays} Occasions</div>
          <p className="text-xs text-slate-400 mt-1">Arrival after 08:45 AM assembly</p>
        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-1">Subject-Wise Attendance Quota</h3>
        <p className="text-xs text-slate-500 mb-4">Required by CBSE to be eligible for Term Examinations.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjectWise.map((item: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{item.subject}</span>
                <span className="font-bold text-indigo-600">{item.percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.percentage >= 85 ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{item.attended} / {item.total} lectures</span>
                <span className="font-semibold text-emerald-700">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Attendance Timeline Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Daily Register Log</h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Holiday</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {calendarDays.map((cd: any, idx: number) => (
            <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-500">{cd.date}</span>
                <span className="text-slate-800 font-medium">{cd.remarks}</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                  cd.status === 'present'
                    ? 'bg-emerald-50 text-emerald-700'
                    : cd.status === 'absent'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {cd.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
