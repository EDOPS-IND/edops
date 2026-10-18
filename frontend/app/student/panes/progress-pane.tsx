'use client';

import React, { useState, useEffect } from 'react';
import { Target, HelpCircle, CheckCircle2, TrendingUp, Plus, Award, Save, Clock } from 'lucide-react';
import { api, getStudentProgress } from '../../edops-api';

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
    cognitive: 3,
    socioEmotional: 4,
    psychomotor: 3,
    creative: 4,
  });
  const [reflectionText, setReflectionText] = useState('');
  const [improvementText, setImprovementText] = useState('');
  const [hpcSaved, setHpcSaved] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [organizationId]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const res = await getStudentProgress(organizationId);
      setData(res);
      if (res?.selfReflection) {
        setHpcRatings(res.selfReflection.ratings || { cognitive: 3, socioEmotional: 4, psychomotor: 3, creative: 4 });
        setReflectionText(res.selfReflection.reflectionText || '');
        setImprovementText(res.selfReflection.improvementText || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHpc = async (e: React.FormEvent) => {
    e.preventDefault();
    setHpcSaved(false);
    try {
      await api(`/organizations/${organizationId}/student/progress/reflection`, {
        method: 'POST',
        body: { ...hpcRatings, reflectionText, improvementText },
      });
      setHpcSaved(true);
    } catch { }
  };

  if (loading) {
    return (
      <div
        className="p-10 text-center text-[#495d72] bg-white rounded-[10px] border border-[#e4e6e9] animate-pulse"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Loading personal academic progress &amp; recommendations...
      </div>
    );
  }

  // Use purely backend data without inserting mock items
  const gapsAndStrengths: any[] = data?.gapsAndStrengths || [];
  const goals: any[] = data?.goals || [];
  const supportRequests: any[] = data?.supportRequests || [];

  return (
    <div className="space-y-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] mb-1">
            Academic Growth &amp; Reflection
          </div>
          <h2 className="text-[18px] font-semibold text-[#0c1e33] tracking-tight">
            Personal Growth, Goals &amp; CBSE Holistic Card
          </h2>
          <p className="text-[13px] text-[#495d72] mt-0.5" style={{ lineHeight: '1.5' }}>
            Constructive gap analysis, self-directed target goals, and NEP 2020 360° Holistic Progress Card reflection.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenGoalModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '6px',
              border: '1px solid #0c1e33',
              background: '#0c1e33',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Poppins', sans-serif",
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#172b43';
              e.currentTarget.style.borderColor = '#172b43';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0c1e33';
              e.currentTarget.style.borderColor = '#0c1e33';
            }}
          >
            <Target size={16} strokeWidth={1.75} />
            <span>Set Target Goal</span>
          </button>
          <button
            type="button"
            onClick={onOpenSupportModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '6px',
              border: '1px solid #ced8e5',
              background: '#ffffff',
              color: '#0c1e33',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Poppins', sans-serif",
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f6f8';
              e.currentTarget.style.borderColor = '#b0c0d4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#ced8e5';
            }}
          >
            <HelpCircle size={16} strokeWidth={1.75} color="#495d72" />
            <span>Need Guidance</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#e4e6e9] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-[13px] font-semibold transition-colors border-b-2 ${
            activeTab === 'analytics'
              ? 'border-[#0c1e33] text-[#0c1e33]'
              : 'border-transparent text-[#495d72] hover:text-[#0c1e33]'
          }`}
        >
          Adaptive Growth &amp; Target Goals
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hpc')}
          className={`pb-3 text-[13px] font-semibold transition-colors border-b-2 ${
            activeTab === 'hpc'
              ? 'border-[#0c1e33] text-[#0c1e33]'
              : 'border-transparent text-[#495d72] hover:text-[#0c1e33]'
          }`}
        >
          CBSE NEP 2020 Holistic Progress Card (Self-Reflection)
        </button>
      </div>

      {/* 1. ANALYTICS & GOALS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Constructive Gap Analysis & Recommendations */}
          <div className="bg-white rounded-[10px] border border-[#e4e6e9] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e4e6e9]">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} strokeWidth={1.75} className="text-[#0c1e33]" />
                <h3 className="text-[14px] font-semibold text-[#0c1e33]">
                  Constructive Strengths &amp; Recommended Practice
                </h3>
              </div>
              <span className="text-[11px] font-medium text-[#495d72]">
                AI-Driven Adaptive Diagnostics
              </span>
            </div>

            {gapsAndStrengths.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[#495d72] bg-[#f5f6f8] rounded-[6px] border border-[#e4e6e9]">
                No diagnostic gaps detected for this evaluation cycle.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gapsAndStrengths.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-[6px] border border-[#e4e6e9] bg-[#f5f6f8] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#0c1e33]">{item.subject}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[100px] bg-[#d9eed1] text-[#1a5c0a]">
                        Adaptive Feedback
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[12px]">
                      {item.strength && (
                        <div className="flex items-start gap-1.5">
                          <span className="font-semibold text-[#1a5c0a] shrink-0">Strength:</span>
                          <span className="text-[#0c1e33]">{item.strength}</span>
                        </div>
                      )}
                      {item.needsPractice && (
                        <div className="flex items-start gap-1.5">
                          <span className="font-semibold text-[#c2410c] shrink-0">Needs Practice:</span>
                          <span className="text-[#0c1e33]">{item.needsPractice}</span>
                        </div>
                      )}
                    </div>

                    {item.recommendations?.length > 0 && (
                      <div className="pt-2 border-t border-[#ced8e5] space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#495d72] block">
                          Actionable Next Steps:
                        </span>
                        {item.recommendations.map((rec: string, rIdx: number) => (
                          <div key={rIdx} className="text-[12px] text-[#495d72] flex items-start gap-1.5">
                            <span className="text-[#0c1e33] font-bold">&bull;</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Academic Goals Tracker */}
          <div className="bg-white rounded-[10px] border border-[#e4e6e9] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e4e6e9]">
              <div className="flex items-center gap-2">
                <Target size={15} strokeWidth={1.75} className="text-[#0c1e33]" />
                <h3 className="text-[14px] font-semibold text-[#0c1e33]">
                  My Personal Academic Target Goals
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenGoalModal}
                className="text-[12px] font-semibold text-[#0c1e33] hover:underline flex items-center gap-1"
              >
                <Plus size={13} strokeWidth={2} />
                <span>Add Goal</span>
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[#495d72] bg-[#f5f6f8] rounded-[6px] border border-[#e4e6e9]">
                No target goals defined yet. Click &quot;+ Add Goal&quot; to define an academic target.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((g: any) => {
                  const progressPct = g.progressPct != null ? g.progressPct : (
                    g.targetScore && g.currentScore != null
                      ? Math.min(100, Math.round((g.currentScore / g.targetScore) * 100))
                      : 0
                  );
                  const isCompleted = g.status === 'completed' || progressPct >= 100;

                  return (
                    <div
                      key={g.id || g.title}
                      className="p-4 rounded-[6px] border border-[#e4e6e9] bg-[#ffffff] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[13px] font-semibold text-[#0c1e33] leading-snug">
                          {g.title}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-[100px] border shrink-0 ${
                            isCompleted
                              ? 'bg-[#d9eed1] text-[#1a5c0a] border-[#b2d9a4]'
                              : 'bg-[#f5f6f8] text-[#495d72] border-[#e4e6e9]'
                          }`}
                        >
                          {g.status || 'active'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[12px] text-[#495d72]">
                        <span>
                          Current: <strong className="text-[#0c1e33]">{g.currentScore != null ? `${g.currentScore}%` : '0%'}</strong> &rarr; Target: <strong className="text-[#0c1e33]">{g.targetScore != null ? `${g.targetScore}%` : '100%'}</strong>
                        </span>
                        {g.deadline && (
                          <span className="flex items-center gap-1 text-[11px] text-[#495d72]">
                            <Clock size={11} strokeWidth={1.5} />
                            <span>Deadline: {g.deadline}</span>
                          </span>
                        )}
                      </div>

                      {/* Progress Bar (track height 6px, track radius 12px) */}
                      <div className="space-y-1">
                        <div className="w-full bg-[#f5f6f8] border border-[#e4e6e9] rounded-[12px] h-[6px] overflow-hidden">
                          <div
                            className="bg-[#0c1e33] h-full rounded-[12px] transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-[#495d72] text-right font-medium">
                          {progressPct}% progress achieved
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student Support & Help Requests */}
          <div className="bg-white rounded-[10px] border border-[#e4e6e9] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e4e6e9]">
              <div className="flex items-center gap-2">
                <HelpCircle size={15} strokeWidth={1.75} className="text-[#0c1e33]" />
                <h3 className="text-[14px] font-semibold text-[#0c1e33]">
                  My Academic Doubts &amp; Guidance Requests
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenSupportModal}
                className="text-[12px] font-semibold text-[#0c1e33] hover:underline flex items-center gap-1"
              >
                <Plus size={13} strokeWidth={2} />
                <span>Ask for Guidance</span>
              </button>
            </div>

            {supportRequests.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[#495d72] bg-[#f5f6f8] rounded-[6px] border border-[#e4e6e9]">
                No academic doubts or guidance requests logged.
              </div>
            ) : (
              <div className="divide-y divide-[#e4e6e9]">
                {supportRequests.map((req: any) => {
                  const isOpen = (req.status || '').toLowerCase() === 'open';

                  return (
                    <div key={req.id || req.description} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#0c1e33] capitalize">
                            {req.subject}
                          </span>
                          {req.category && req.category.toLowerCase() !== (req.subject || '').toLowerCase() && (
                            <span className="text-[10px] text-[#495d72] bg-[#f5f6f8] px-2 py-0.5 rounded-[4px] border border-[#e4e6e9]">
                              {req.category}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-[100px] border shrink-0 ${
                            isOpen
                              ? 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]'
                              : 'bg-[#d9eed1] text-[#1a5c0a] border-[#b2d9a4]'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <p className="text-[12px] text-[#495d72] leading-relaxed">
                        {req.description}
                      </p>

                      {req.response ? (
                        <div className="p-3 rounded-[6px] bg-[#f5f6f8] border border-[#ced8e5] text-[12px] text-[#0c1e33]">
                          <span className="font-semibold block text-[10px] text-[#495d72] uppercase tracking-[0.06em]">
                            Faculty Response:
                          </span>
                          <p className="mt-0.5 text-[#0c1e33] italic">&quot;{req.response}&quot;</p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#a6abb5] flex items-center gap-1.5">
                          <Clock size={11} strokeWidth={1.5} />
                          <span>Awaiting teacher feedback</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CBSE NEP 2020 HOLISTIC PROGRESS CARD TAB */}
      {activeTab === 'hpc' && (
        <form onSubmit={handleSaveHpc} className="bg-white rounded-[10px] border border-[#e4e6e9] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e4e6e9] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Award size={16} strokeWidth={1.75} className="text-[#0c1e33]" />
                <h3 className="text-[15px] font-semibold text-[#0c1e33]">
                  CBSE NEP 2020 Holistic Progress Card (HPC)
                </h3>
              </div>
              <p className="text-[12px] text-[#495d72] mt-0.5">
                Multi-dimensional self-assessment across cognitive, socio-emotional, physical, and creative developmental domains.
              </p>
            </div>
            {hpcSaved && (
              <span className="bg-[#d9eed1] text-[#1a5c0a] border border-[#b2d9a4] px-3 py-1 rounded-[6px] text-[11px] font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 size={13} strokeWidth={2} /> Self-Assessment Recorded!
              </span>
            )}
          </div>

          {/* 4 Multi-Dimensional Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cognitive Domain */}
            <div className="p-4 rounded-[6px] border border-[#e4e6e9] bg-[#f5f6f8] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#0c1e33]">Cognitive &amp; Analytical Inquiry</h4>
                  <p className="text-[11px] text-[#495d72]">Curiosity, conceptual clarity, problem solving</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[100px] bg-white border border-[#ced8e5] text-[#0c1e33]">
                  Level {hpcRatings.cognitive} of 5
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const selected = hpcRatings.cognitive === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setHpcRatings({ ...hpcRatings, cognitive: lvl })}
                      style={{
                        background: selected ? '#0c1e33' : '#ffffff',
                        color: selected ? '#ffffff' : '#495d72',
                        border: selected ? '1px solid #0c1e33' : '1px solid #ced8e5',
                      }}
                      className="flex-1 h-[28px] rounded-[4px] text-[11px] font-semibold transition-colors"
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Socio-Emotional Domain */}
            <div className="p-4 rounded-[6px] border border-[#e4e6e9] bg-[#f5f6f8] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#0c1e33]">Socio-Emotional &amp; Ethical Traits</h4>
                  <p className="text-[11px] text-[#495d72]">Teamwork, empathy, respecting viewpoints</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[100px] bg-white border border-[#ced8e5] text-[#0c1e33]">
                  Level {hpcRatings.socioEmotional} of 5
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const selected = hpcRatings.socioEmotional === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setHpcRatings({ ...hpcRatings, socioEmotional: lvl })}
                      style={{
                        background: selected ? '#0c1e33' : '#ffffff',
                        color: selected ? '#ffffff' : '#495d72',
                        border: selected ? '1px solid #0c1e33' : '1px solid #ced8e5',
                      }}
                      className="flex-1 h-[28px] rounded-[4px] text-[11px] font-semibold transition-colors"
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Psychomotor Domain */}
            <div className="p-4 rounded-[6px] border border-[#e4e6e9] bg-[#f5f6f8] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#0c1e33]">Psychomotor &amp; Physical Wellness</h4>
                  <p className="text-[11px] text-[#495d72]">Sports participation, endurance, yoga &amp; fitness</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[100px] bg-white border border-[#ced8e5] text-[#0c1e33]">
                  Level {hpcRatings.psychomotor} of 5
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const selected = hpcRatings.psychomotor === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setHpcRatings({ ...hpcRatings, psychomotor: lvl })}
                      style={{
                        background: selected ? '#0c1e33' : '#ffffff',
                        color: selected ? '#ffffff' : '#495d72',
                        border: selected ? '1px solid #0c1e33' : '1px solid #ced8e5',
                      }}
                      className="flex-1 h-[28px] rounded-[4px] text-[11px] font-semibold transition-colors"
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Creative Expression */}
            <div className="p-4 rounded-[6px] border border-[#e4e6e9] bg-[#f5f6f8] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#0c1e33]">Creative &amp; Practical Expression</h4>
                  <p className="text-[11px] text-[#495d72]">Art, innovative projects, design thinking</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[100px] bg-white border border-[#ced8e5] text-[#0c1e33]">
                  Level {hpcRatings.creative} of 5
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const selected = hpcRatings.creative === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setHpcRatings({ ...hpcRatings, creative: lvl })}
                      style={{
                        background: selected ? '#0c1e33' : '#ffffff',
                        color: selected ? '#ffffff' : '#495d72',
                        border: selected ? '1px solid #0c1e33' : '1px solid #ced8e5',
                      }}
                      className="flex-1 h-[28px] rounded-[4px] text-[11px] font-semibold transition-colors"
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Qualitative Reflection Prompts */}
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-[12px] font-semibold text-[#0c1e33] mb-1.5">
                Personal Term Reflection: What did you learn and enjoy most?
              </label>
              <textarea
                rows={3}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#ced8e5] rounded-[6px] focus:outline-none focus:border-[#0c1e33] bg-white text-[#0c1e33]"
                placeholder="Share your personal growth narrative for this term..."
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#0c1e33] mb-1.5">
                Area of Growth: What target or habit are you committing to improve next?
              </label>
              <textarea
                rows={2}
                value={improvementText}
                onChange={(e) => setImprovementText(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#ced8e5] rounded-[6px] focus:outline-none focus:border-[#0c1e33] bg-white text-[#0c1e33]"
                placeholder="Identify one key skill or study habit to sharpen..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-[#e4e6e9] gap-3">
            <span className="text-[11px] text-[#495d72]">
              Synced with Teacher &amp; Principal Evaluation dossiers for official report generation.
            </span>
            <button
              type="submit"
              className="h-[36px] bg-[#0c1e33] hover:bg-[#162d4a] text-white font-semibold text-[12px] px-4 rounded-[6px] flex items-center justify-center gap-2 transition-colors self-end sm:self-auto"
            >
              <Save size={13} strokeWidth={1.75} />
              <span>Submit HPC Self-Reflection</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
