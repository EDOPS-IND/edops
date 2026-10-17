'use client';

import React, { useState, useEffect } from 'react';
import { Compass, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { getStudentCurriculum } from '../../edops-api';

interface CurriculumPaneProps {
  organizationId: string;
}

export const CurriculumPane: React.FC<CurriculumPaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  useEffect(() => {
    loadCurriculum();
  }, [organizationId]);

  const loadCurriculum = async () => {
    setLoading(true);
    try {
      const res = await getStudentCurriculum(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading curriculum syllabus tracker...</div>;
  }

  const overallProgress = data?.overallProgress || 0;
  const subjects = data?.subjects || [];
  const currentSub = subjects.find((s: any) => s.subject === selectedSubject) || subjects[0] || { chapters: [] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Curriculum & Syllabus Completion Tracker</h2>
        <p className="text-sm text-slate-500">Track NCERT prescribed chapter completion, covered concepts, and upcoming unit topics.</p>
      </div>

      {/* Overview Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Overall School Curriculum Pacing</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{overallProgress}% Covered</div>
          <p className="text-xs text-slate-400 mt-0.5">Your enrolled curriculum</p>
        </div>
        <div className="w-full sm:w-64 bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${overallProgress}%` }} />
        </div>
      </div>

      {/* Subject Selector Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {subjects.map((sub: any) => (
          <button
            key={sub.subject}
            onClick={() => setSelectedSubject(sub.subject)}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
              selectedSubject === sub.subject
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {sub.subject} ({sub.progress}%)
          </button>
        ))}
      </div>

      {/* Chapters Breakdown for Selected Subject */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">{currentSub.subject} Chapters & Units</h3>
          <span className="text-xs text-slate-400">{currentSub.chapters.length} Total Units</span>
        </div>
        <div className="divide-y divide-slate-100">
          {currentSub.chapters.map((ch: any) => (
            <div key={ch.number} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {ch.number}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{ch.title}</h4>
                    {ch.remainingTopics && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">Remaining to cover:</span> {ch.remainingTopics}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      ch.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : ch.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {ch.status}
                  </span>
                  <span className="block text-[11px] font-bold text-slate-700 mt-1">{ch.progress}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    ch.progress === 100 ? 'bg-emerald-500' : ch.progress > 0 ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                  style={{ width: `${ch.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
