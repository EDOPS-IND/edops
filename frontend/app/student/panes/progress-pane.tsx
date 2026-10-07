'use client';

import React, { useState, useEffect } from 'react';
import { Target, HelpCircle, CheckCircle2, TrendingUp, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { getStudentProgress } from '../../edops-api';

interface ProgressPaneProps {
  organizationId: string;
  onOpenGoalModal: () => void;
  onOpenSupportModal: () => void;
}

export const ProgressPane: React.FC<ProgressPaneProps> = ({
  organizationId,
  onOpenGoalModal,
  onOpenSupportModal,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [organizationId]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const res = await getStudentProgress(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading personal academic progress & recommendations...</div>;
  }

  const gapsAndStrengths = data?.gapsAndStrengths || [];
  const goals = data?.goals || [];
  const supportRequests = data?.supportRequests || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Personal Growth & Study Assistant</h2>
          <p className="text-sm text-slate-500">Constructive gap analysis, actionable study recommendations, target goals, and academic help requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGoalModal}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Set New Target Goal</span>
          </button>
          <button
            onClick={onOpenSupportModal}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need Help / Guidance</span>
          </button>
        </div>
      </div>

      {/* Constructive Gap Analysis & Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">Constructive Strengths & Recommended Practice</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gapsAndStrengths.map((item: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{item.subject}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Adaptive Feedback
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="font-bold text-emerald-700">Demonstrated Strength:</span>{' '}
                  <span className="text-slate-700">{item.strength}</span>
                </div>
                <div>
                  <span className="font-bold text-amber-700">Needs Practice:</span>{' '}
                  <span className="text-slate-700">{item.needsPractice}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                  Actionable Next Steps:
                </span>
                {item.recommendations.map((rec: string, rIdx: number) => (
                  <div key={rIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-indigo-600 font-bold">&bull;</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Academic Goals Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">My Personal Academic Target Goals</h3>
          </div>
          <button
            onClick={onOpenGoalModal}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            + Add Goal
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g: any) => (
            <div key={g.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{g.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {g.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Current: {g.currentScore}% &rarr; Target: {g.targetScore}%</span>
                <span>Deadline: {g.deadline}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${g.progressPct}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 text-right">{g.progressPct}% progress achieved</div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Support & Help Requests */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">My Academic Doubts & Guidance Requests</h3>
          </div>
          <button
            onClick={onOpenSupportModal}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            + Ask for Guidance
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {supportRequests.map((req: any) => (
            <div key={req.id} className="py-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{req.subject} ({req.category})</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {req.status}
                </span>
              </div>
              <p className="text-xs text-slate-600">{req.description}</p>
              {req.response && (
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950">
                  <span className="font-bold text-indigo-900 block">Faculty Response:</span>
                  <p className="italic mt-0.5">&quot;{req.response}&quot;</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
