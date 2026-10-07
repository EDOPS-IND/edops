'use client';

import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface CalendarPaneProps {
  organizationId: string;
}

export const CalendarPane: React.FC<CalendarPaneProps> = () => {
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  const events = [
    {
      date: 'Oct 06, 2026',
      title: 'Mathematics: Quadratic Equations Homework Due',
      type: 'Deadline',
      badgeColor: 'bg-amber-100 text-amber-700',
      time: '05:00 PM',
      description: 'NCERT Exercise 4.3 derivation steps to be uploaded in portal.',
    },
    {
      date: 'Oct 08, 2026',
      title: 'Chemical Reactions Diagnostic Arena Drill',
      type: 'Arena',
      badgeColor: 'bg-purple-100 text-purple-700',
      time: '08:00 PM Cutoff',
      description: '15 objective practice questions to test conservation of mass.',
    },
    {
      date: 'Oct 15, 2026',
      title: 'Term 1 Mid-Term Examination Commences',
      type: 'Exam',
      badgeColor: 'bg-rose-100 text-rose-700',
      time: '09:30 AM - 12:30 PM',
      description: 'Day 1: Mathematics (80 Marks Theory). Reporting time: 09:15 AM.',
    },
    {
      date: 'Oct 24, 2026',
      title: 'Diwali Autumn Vacation Begins',
      type: 'Holiday',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      time: 'Oct 24 - Oct 28',
      description: 'School reopens on Oct 29. Holiday homework projects due on return.',
    },
    {
      date: 'Nov 07, 2026',
      title: 'Parent-Teacher Meeting (Term 1 Review)',
      type: 'PTM',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      time: '08:30 AM - 01:30 PM',
      description: 'Discussion of Mid-Term scorecards and holistic progress card portfolios.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Deadlines & Events Calendar</h2>
          <p className="text-sm text-slate-500">Upcoming exam dates, assignment cut-offs, PTM sessions, and gazetted school holidays.</p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option>October 2026</option>
          <option>November 2026</option>
          <option>December 2026</option>
        </select>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Key Dates ({selectedMonth})</h3>
          <span className="text-xs text-slate-400">{events.length} Scheduled Milestones</span>
        </div>
        <div className="divide-y divide-slate-100">
          {events.map((evt, idx) => (
            <div key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-20 shrink-0 text-center bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{evt.date.split(' ')[0]}</div>
                  <div className="text-lg font-extrabold text-slate-900">{evt.date.split(' ')[1].replace(',', '')}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${evt.badgeColor}`}>
                      {evt.type}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{evt.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600">{evt.description}</p>
                </div>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-xs font-semibold text-slate-700 block">{evt.time}</span>
                <span className="text-[10px] text-slate-400">School Calendar Sync</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
