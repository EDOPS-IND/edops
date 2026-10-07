'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Clock, CheckCircle2, Play, Flame, Layers } from 'lucide-react';
import { getStudentArena } from '../../edops-api';

interface ArenaPaneProps {
  organizationId: string;
  onStartArena: (activity: any) => void;
}

export const ArenaPane: React.FC<ArenaPaneProps> = ({ organizationId, onStartArena }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArena();
  }, [organizationId]);

  const loadArena = async () => {
    setLoading(true);
    try {
      const res = await getStudentArena(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Arena activities...</div>;
  }

  const activities = data?.activities || [];
  const performance = data?.performance || {
    attemptedCount: 8,
    completedCount: 8,
    averageScore: 78,
    bestScore: 92,
    topicMastery: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Arena Objective Practice Bank</h2>
        <p className="text-sm text-slate-500">Self-paced drills and timed diagnostic assessments with instant step-by-step explanations.</p>
      </div>

      {/* Top Mastery Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Quizzes Completed</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{performance.completedCount} Drills</div>
          <p className="text-xs text-slate-400 mt-1">100% completion rate</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Average Accuracy</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">{performance.averageScore}%</div>
          <p className="text-xs text-slate-400 mt-1">Across all STEM topics</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Personal Best</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{performance.bestScore}%</div>
          <p className="text-xs text-slate-400 mt-1">In Algebra Speed Drill</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Practice Streak</span>
          <div className="text-2xl font-extrabold text-amber-500 mt-1 flex items-center gap-1">
            <Flame className="w-5 h-5 fill-amber-500" /> 4 Days
          </div>
          <p className="text-xs text-slate-400 mt-1">Consistent daily practice</p>
        </div>
      </div>

      {/* Available Arena Activities */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Assigned Arena Quizzes & Practice Sets</h3>
          <span className="text-xs text-slate-400">{activities.length} Available</span>
        </div>
        <div className="divide-y divide-slate-100">
          {activities.map((act: any) => (
            <div key={act.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                    {act.subject}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {act.mode === 'practice' ? 'Practice Mode' : 'Assigned Test'}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                </div>
                <p className="text-xs text-slate-500">{act.topic}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>{act.questionCount} Questions</span>
                  <span>Duration: {act.durationMinutes} mins</span>
                  <span>Available until: {act.availableUntil}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {act.status === 'completed' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Scored {act.bestScore}%
                  </span>
                ) : (
                  <button
                    onClick={() => onStartArena(act)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Drill</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Mastery Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-1">Topic Mastery Insights</h3>
        <p className="text-xs text-slate-500 mb-4">Competency accuracy breakdown derived from your Arena attempts.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {performance.topicMastery.map((tm: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{tm.topic}</span>
                <span className="font-bold text-purple-600">{tm.mastery}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    tm.mastery >= 80 ? 'bg-emerald-500' : tm.mastery >= 70 ? 'bg-indigo-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${tm.mastery}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400">
                Classification: <span className="font-semibold text-slate-600">{tm.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
