'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, CheckCircle2, AlertCircle, Compass, Target } from 'lucide-react';
import { getStudentPerformance } from '../../edops-api';

interface PerformancePaneProps {
  organizationId: string;
}

export const PerformancePane: React.FC<PerformancePaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trends' | 'outcomes' | 'competencies' | 'holistic'>('trends');

  useEffect(() => {
    loadPerformance();
  }, [organizationId]);

  const loadPerformance = async () => {
    setLoading(true);
    try {
      const res = await getStudentPerformance(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading academic performance records...</div>;
  }

  const overall = data?.overall || { currentAverage: 82, targetAverage: 85, growthPercentage: 5, trend: 'Improving' };
  const monthlyTrends = data?.monthlyTrends || [];
  const subjectScores = data?.subjectScores || [];
  const learningOutcomes = data?.learningOutcomes || [];
  const competencies = data?.competencies || [];
  const holistic = data?.holisticProgress || { academicGrowth: 85, cognitiveSkills: 82, physicalHealth: 88, socialCollaboration: 90 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Academic Performance & Competencies</h2>
        <p className="text-sm text-slate-500">Holistic tracking: growth trends, CBSE learning outcomes, and multidimensional competencies.</p>
      </div>

      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Cumulative Academic Average</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 flex items-center gap-3">
            <span>{overall.currentAverage}%</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +{overall.growthPercentage}% Growth
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Target Goal: {overall.targetAverage}% • Trend: {overall.trend}</p>
        </div>
        <div className="flex items-center gap-2">
          {monthlyTrends.map((mt: any, idx: number) => (
            <div key={idx} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100 min-w-[65px]">
              <span className="text-[10px] text-slate-400 font-medium block">{mt.month.split(' ')[0]}</span>
              <span className="text-xs font-bold text-indigo-600">{mt.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('trends')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'trends'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Subject Mastery & Target Gaps
        </button>
        <button
          onClick={() => setActiveTab('outcomes')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'outcomes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          CBSE Learning Outcomes
        </button>
        <button
          onClick={() => setActiveTab('competencies')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'competencies'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Core Competency Levels
        </button>
        <button
          onClick={() => setActiveTab('holistic')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'holistic'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          CBSE Holistic Progress Card (HPC)
        </button>
      </div>

      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectScores.map((sub: any, idx: number) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{sub.subject}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {sub.status}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-slate-900">{sub.score}%</span>
                  <span className="text-xs text-slate-400 ml-1">Current</span>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Target: {sub.target}%
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${sub.score}%` }} />
              </div>
              <p className="text-[11px] text-slate-400">Pacing: {sub.trend} toward annual examination</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'outcomes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Prescribed Learning Outcomes Mastery</h3>
            <span className="text-xs text-slate-400">{learningOutcomes.length} Evaluated</span>
          </div>
          <div className="divide-y divide-slate-100">
            {learningOutcomes.map((lo: any, idx: number) => (
              <div key={idx} className="p-4 space-y-1 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {lo.code}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{lo.subject}</span>
                    <h4 className="text-xs font-bold text-slate-900">{lo.title}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      lo.status === 'Achieved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : lo.status === 'Developing'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {lo.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 pl-1">
                  <span className="font-semibold text-slate-700">Evidence:</span> {lo.evidence}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'competencies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competencies.map((comp: any, idx: number) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{comp.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {comp.level}
                </span>
              </div>
              <p className="text-xs text-slate-600">{comp.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'holistic' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">CBSE Holistic Progress Card Framework (360° Assessment)</h3>
            <p className="text-xs text-slate-500">Evaluates learner in all dimensions of development beyond pen-and-paper scores.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">Academic Growth</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{holistic.academicGrowth}%</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">Cognitive & Inquiry</span>
              <div className="text-xl font-bold text-indigo-600 mt-1">{holistic.cognitiveSkills}%</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">Physical & Health</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">{holistic.physicalHealth}%</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">Social & Collaboration</span>
              <div className="text-xl font-bold text-purple-600 mt-1">{holistic.socialCollaboration}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
