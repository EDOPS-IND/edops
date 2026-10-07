'use client';

import React, { useState, useEffect } from 'react';
import { getTeacherCalendar } from '../../edops-api';

interface CalendarPaneProps {
  organizationId: string;
}

export const CalendarPane: React.FC<CalendarPaneProps> = ({ organizationId }) => {
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadCalendar();
  }, [organizationId, selectedMonth]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const res = await getTeacherCalendar(organizationId, selectedMonth);
      setData(res);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const events = data?.events || [];
  const stats = data?.stats || {
    exams: '0 Papers',
    deadlines: '0 Pending',
    ptm: '—',
    holidays: '0 Days',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Calendar & Milestone Schedule</h2>
          <p className="text-sm text-slate-500">School-wide academic calendar showing exams, PTMs, submission cut-offs, and holidays.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[
              'April 2026', 'May 2026', 'June 2026', 'July 2026',
              'August 2026', 'September 2026', 'October 2026', 'November 2026',
              'December 2026', 'January 2027', 'February 2027', 'March 2027'
            ].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Summary Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase">Exams Scheduled</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.exams}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase">Marks Deadlines</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats.deadlines}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase">PTM Sessions</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{stats.ptm}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase">Upcoming Holidays</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.holidays}</div>
        </div>
      </div>

      {/* Events Timeline / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Upcoming Academic Milestones ({selectedMonth})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {events.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No academic milestones or exams scheduled for {selectedMonth}.
            </div>
          ) : (
            events.map((event, idx) => (
              <div key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-24 shrink-0 text-center bg-slate-50 border border-slate-100 rounded-lg p-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase">{event.date?.split(' ')?.[0] || 'DATE'}</div>
                    <div className="text-lg font-bold text-slate-900">{event.date?.split(' ')?.[1]?.replace(',', '') || '—'}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${event.color || 'bg-indigo-50 text-indigo-700'}`}>
                        {event.type}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900">{event.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{event.description}</p>
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="text-xs text-slate-400">Notified via Academic Circular</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
