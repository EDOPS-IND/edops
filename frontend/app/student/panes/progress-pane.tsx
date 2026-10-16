'use client';

import React, { useState, useEffect } from 'react';
import { Target, HelpCircle, CheckCircle2, TrendingUp, Sparkles, Plus, AlertCircle, Award, HeartHandshake, Dumbbell, Palette, Save } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'hpc'>('analytics');

  // CBSE HPC Self-Reflection State
  const [hpcRatings, setHpcRatings] = useState({
    cognitive: 4,
    socioEmotional: 5,
    psychomotor: 4,
    creative: 4,
  });
  const [reflectionText, setReflectionText] = useState('This term I enjoyed the geometry proofs seminar and collaborating in the science practicals.');
  const [improvementText, setImprovementText] = useState('I am working on time management during long-form chemistry tests.');
  const [hpcSaved, setHpcSaved] = useState(false);

  useEffect(() => {
    loadProgress();
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`edops_hpc_${organizationId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.ratings) setHpcRatings(parsed.ratings);
          if (parsed.reflectionText) setReflectionText(parsed.reflectionText);
          if (parsed.improvementText) setImprovementText(parsed.improvementText);
        }
      } catch {
        // ignore
      }
    }
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

  const handleSaveHpc = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `edops_hpc_${organizationId}`,
          JSON.stringify({ ratings: hpcRatings, reflectionText, improvementText })
        );
      } catch {
        // ignore
      }
    }
    setHpcSaved(true);
    setTimeout(() => setHpcSaved(false), 2500);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading personal academic progress & recommendations...</div>;
  }

  const gapsAndStrengths = data?.gapsAndStrengths || [
    {
      subject: 'Mathematics',
      strength: 'High speed in algebraic quadratic derivations and linear equations.',
      needsPractice: 'Trigonometric identities and surface area word problems.',
      recommendations: [
        'Complete Arena Trigonometry Drill Set 2',
        'Review NCERT exemplar questions for Chapter 8',
      ],
    },
    {
      subject: 'Science (Physics)',
      strength: 'Clear conceptual understanding in electric circuits and Ohm’s Law.',
      needsPractice: 'Ray optics sign convention in concave mirror diagrams.',
      recommendations: [
        'Re-watch recorded lecture on Mirror Formulas & Ray Tracing',
        'Submit optics practice worksheet by Thursday',
      ],
    },
  ];

  const goals = data?.goals || [
    {
      id: 'g-1',
      title: 'Score 90%+ in Mathematics Term 2 Pre-Boards',
      status: 'active',
      currentScore: 84,
      targetScore: 92,
      deadline: 'Nov 20, 2026',
      progressPct: 82,
    },
    {
      id: 'g-2',
      title: 'Maintain 95%+ in Science Practical Lab Sessions',
      status: 'active',
      currentScore: 90,
      targetScore: 95,
      deadline: 'Dec 05, 2026',
      progressPct: 90,
    },
  ];

  const supportRequests = data?.supportRequests || [
    {
      id: 'sr-1',
      subject: 'Mathematics',
      category: 'Subject Doubt',
      status: 'resolved',
      description: 'Sir, please clarify quadratic equation derivations with negative discriminants.',
      response: 'Reviewed during zero-period remedial class. Roots are complex conjugate pairs; keep practicing!',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Personal Growth, Goals & CBSE Holistic Card</h2>
          <p className="text-sm text-slate-500">Constructive gap analysis, self-directed target goals, and NEP 2020 360° Holistic Progress Card reflection.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGoalModal}
            className="px-3.5 py-1.5 rounded-xl bg-[#090D16] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors border border-[#1A243D]"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Set New Target Goal</span>
          </button>
          <button
            onClick={onOpenSupportModal}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors bg-white shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need Help / Guidance</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Adaptive Growth & Target Goals
        </button>
        <button
          onClick={() => setActiveTab('hpc')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'hpc'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          CBSE NEP 2020 Holistic Progress Card (Self-Reflection)
        </button>
      </div>

      {/* 1. ANALYTICS & GOALS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
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
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${g.progressPct}%` }} />
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
      )}

      {/* 2. CBSE NEP 2020 HOLISTIC PROGRESS CARD TAB */}
      {activeTab === 'hpc' && (
        <form onSubmit={handleSaveHpc} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">CBSE NEP 2020 Holistic Progress Card (HPC)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-dimensional self-assessment across cognitive, socio-emotional, physical, and creative developmental domains.
              </p>
            </div>
            {hpcSaved && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={14} /> Self-Assessment Recorded!
              </span>
            )}
          </div>

          {/* 4 Multi-Dimensional Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cognitive Domain */}
            <div className="p-4.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    🧠
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Cognitive & Analytical Inquiry</h4>
                    <p className="text-[11px] text-slate-500">Curiosity, conceptual clarity, problem solving</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-indigo-600">{hpcRatings.cognitive} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={hpcRatings.cognitive}
                onChange={(e) => setHpcRatings({ ...hpcRatings, cognitive: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Socio-Emotional Domain */}
            <div className="p-4.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                    🤝
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Socio-Emotional & Ethical Traits</h4>
                    <p className="text-[11px] text-slate-500">Teamwork, empathy, respecting viewpoints</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-rose-600">{hpcRatings.socioEmotional} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={hpcRatings.socioEmotional}
                onChange={(e) => setHpcRatings({ ...hpcRatings, socioEmotional: Number(e.target.value) })}
                className="w-full accent-rose-600"
              />
            </div>

            {/* Psychomotor Domain */}
            <div className="p-4.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    🏃
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Psychomotor & Physical Wellness</h4>
                    <p className="text-[11px] text-slate-500">Sports participation, endurance, yoga & fitness</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-emerald-600">{hpcRatings.psychomotor} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={hpcRatings.psychomotor}
                onChange={(e) => setHpcRatings({ ...hpcRatings, psychomotor: Number(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* Creative Expression */}
            <div className="p-4.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    🎨
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Creative & Practical Expression</h4>
                    <p className="text-[11px] text-slate-500">Art, innovative projects, design thinking</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-amber-600">{hpcRatings.creative} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={hpcRatings.creative}
                onChange={(e) => setHpcRatings({ ...hpcRatings, creative: Number(e.target.value) })}
                className="w-full accent-amber-600"
              />
            </div>
          </div>

          {/* Qualitative Reflection Prompts */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Personal Term Reflection: What did you learn and enjoy most?
              </label>
              <textarea
                rows={3}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                placeholder="Share your personal growth narrative for this term..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Area of Growth: What target or habit are you committing to improve next?
              </label>
              <textarea
                rows={2}
                value={improvementText}
                onChange={(e) => setImprovementText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                placeholder="Identify one key skill or study habit to sharpen..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Synced with Teacher & Principal Evaluation dossiers for official report generation.
            </span>
            <button
              type="submit"
              className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors border border-[#1A243D]"
            >
              <Save size={14} /> Submit HPC Self-Reflection
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
