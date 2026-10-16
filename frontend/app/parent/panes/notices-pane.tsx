'use client';

import React from 'react';
import { Bell, MessageSquare, Plus, CheckCircle2, Clock } from 'lucide-react';
import { WardInfo, ParentQuery } from '../types';

interface NoticesPaneProps {
  selectedWard: WardInfo;
  queriesList: ParentQuery[];
  messages: any[];
  onOpenQueryModal: () => void;
}

export const NoticesPane: React.FC<NoticesPaneProps> = ({
  selectedWard,
  queriesList,
  messages,
  onOpenQueryModal,
}) => {
  const defaultCirculars = [
    {
      id: 'circ-1',
      subject: 'Upcoming CBSE Term 1 Practical Assessment Schedule',
      body: 'The CBSE practical assessments for Science and Informatics will commence from November 15, 2026. Hall tickets will be downloadable via the student portal next Monday.',
      sender: 'Examination Cell',
      date: 'Oct 14, 2026',
      badge: 'CBSE Official',
    },
    {
      id: 'circ-2',
      subject: 'Parent-Teacher Conference (PTM) Term 1 Notification',
      body: 'Annual Term 1 PTM is scheduled for Saturday, October 25. Time slots are now open for reservations via the PTM Scheduling tab.',
      sender: 'Office of the Principal',
      date: 'Oct 11, 2026',
      badge: 'Institutional',
    },
    {
      id: 'circ-3',
      subject: 'Autumn Break & LOC Candidate Verification Notification',
      body: 'All parents are requested to verify the draft registration details and candidate photograph by Friday before the official board portal submission.',
      sender: 'Administrative Oversight',
      date: 'Oct 08, 2026',
      badge: 'Action Required',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. OFFICIAL CIRCULARS & NOTICES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Official Institutional Bulletins & Circulars</h4>
              <p className="text-[11px] text-slate-500">Board directives, academic schedules, and school notifications</p>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-bold">
            {messages.length > 0 ? messages.length : defaultCirculars.length} Bulletins
          </span>
        </div>

        <div className="space-y-3">
          {(messages.length > 0 ? messages : defaultCirculars).map((circ: any) => (
            <div key={circ.id} className="p-4 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{circ.subject}</span>
                  {circ.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {circ.badge}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 font-mono text-[11px]">{circ.date || 'Recent'}</span>
              </div>
              <p className="text-slate-600 leading-relaxed pt-0.5">{circ.body}</p>
              <div className="text-[11px] text-slate-500 font-medium pt-1">
                Issued by: <span className="font-bold text-slate-700">{circ.sender || circ.sender_name || 'School Administration'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. PARENT GRIEVANCE & QUERY TRACKING */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Your Inquiries & Grievances Filed to Principal</h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Direct administrative escalation channel tracked by School Principal and Operations Team
            </p>
          </div>

          <button
            onClick={onOpenQueryModal}
            className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs border border-[#1A243D] flex items-center gap-1.5"
          >
            <Plus size={14} /> Submit Query to Principal
          </button>
        </div>

        <div className="space-y-3">
          {queriesList.length > 0 ? (
            queriesList.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-sm">{q.subject}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-xs font-normal bg-slate-100 px-2 py-0.5 rounded">{q.category}</span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{q.queryText}</p>
                  <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
                    Ward: <b className="text-slate-700">{q.childName}</b> · Submitted: {q.submittedAt}
                  </div>
                </div>

                <div>
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      q.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : q.status === 'investigating'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No active inquiries or grievances on file.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
