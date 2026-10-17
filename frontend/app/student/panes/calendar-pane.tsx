'use client';

import React, { useState,useEffect } from 'react';
import { api } from '../../edops-api';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface CalendarPaneProps {
  organizationId: string;
}

export const CalendarPane: React.FC<CalendarPaneProps> = ({organizationId}) => {
  const [selectedMonth,setSelectedMonth]=useState(new Date().toISOString().slice(0,7));
  const [allEvents,setAllEvents]=useState<any[]>([]);
  useEffect(()=>{setAllEvents([]);api<any>(`/organizations/${organizationId}/student/calendar`).then(data=>setAllEvents(data.events)).catch(()=>{});},[organizationId]);
  const events=allEvents.filter(e=>String(e.date).slice(0,7)===selectedMonth);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Deadlines & Events Calendar</h2>
          <p className="text-sm text-slate-500">Upcoming exam dates, assignment cut-offs, PTM sessions, and gazetted school holidays.</p>
        </div>
        <input aria-label="Calendar month" type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}/>

      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Key Dates ({selectedMonth})</h3>
          <span className="text-xs text-slate-400">{events.length} Scheduled Milestones</span>
        </div>
        <div className="divide-y divide-slate-100">
          {!events.length&&<p className="p-5 text-slate-500">No saved events for this month.</p>}
          {events.map((evt, idx) => (
            <div key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-20 shrink-0 text-center bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{String(evt.date).slice(0,7)}</div>
                  <div className="text-lg font-extrabold text-slate-900">{String(evt.date).slice(8,10)}</div>
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
