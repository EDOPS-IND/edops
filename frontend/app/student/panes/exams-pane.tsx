'use client';

import React, { useState, useEffect } from 'react';
import { Award, Calendar, CheckCircle2, TrendingUp, ChevronRight } from 'lucide-react';
import { getStudentExams } from '../../edops-api';

interface ExamsPaneProps {
  organizationId: string;
}

export const ExamsPane: React.FC<ExamsPaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scorecards' | 'schedule'>('scorecards');

  useEffect(() => {
    loadExams();
  }, [organizationId]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await getStudentExams(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading formal exams & scorecards...</div>;
  }

  const upcomingExams = data?.upcomingExams || [];
  const scorecards = data?.scorecards || [];
  const comparison = data?.comparison || {
    previousExam: 'Periodic Test 1 (76%)',
    currentExam: 'Quarterly Examination (83%)',
    improvementPct: 7.0,
    strongestSubject: 'Science (88%)',
    highestGrowthSubject: 'Mathematics (+10.7%)',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Term Examinations & Official Scorecards</h2>
        <p className="text-sm text-slate-500">Official CBSE term exam schedules, published report cards, and growth progress comparisons.</p>
      </div>

      {/* Growth Comparison Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 rounded-2xl text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20">
              Exam-To-Exam Growth
            </span>
            <span className="text-xs text-emerald-100 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +{comparison.improvementPct}% Improvement
            </span>
          </div>
          <h3 className="text-base font-bold mt-1">
            {comparison.previousExam} &rarr; {comparison.currentExam}
          </h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            Strongest: {comparison.strongestSubject} • Top Growth: {comparison.highestGrowthSubject}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-emerald-100 block">Overall Term Grade</span>
          <span className="text-3xl font-extrabold">A</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('scorecards')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'scorecards'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Published Official Scorecards
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'schedule'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Upcoming Examination Date Sheet
        </button>
      </div>

      {activeTab === 'scorecards' && (
        <div className="space-y-6">
          {scorecards.map((sc: any) => (
            <div key={sc.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {sc.term}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{sc.examName}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Published on {sc.publishedAt}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Marks:</span>
                    <div className="text-base font-bold text-slate-900">
                      {sc.totalMarks} / {sc.maxTotal} ({sc.percentage}%)
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg">
                    {sc.grade}
                  </div>
                </div>
              </div>

              {/* Subject Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-5 font-semibold">Subject</th>
                      <th className="py-3 px-4 font-semibold text-center">Max Marks</th>
                      <th className="py-3 px-4 font-semibold text-center">Marks Obtained</th>
                      <th className="py-3 px-4 font-semibold text-center">Percentage</th>
                      <th className="py-3 px-4 font-semibold text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {sc.subjects.map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-5 font-bold text-slate-900">{s.subject}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{s.max}</td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-600">{s.marks}</td>
                        <td className="py-3 px-4 text-center font-semibold">{s.percentage}%</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 text-[10px]">
                            {s.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sc.teacherRemarks && (
                <div className="p-4 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-600 italic">
                  <span className="font-semibold text-slate-700 not-italic">Official Remarks:</span> &quot;{sc.teacherRemarks}&quot;
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {upcomingExams.map((ex: any) => (
            <div key={ex.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{ex.name}</h3>
                  <p className="text-xs text-slate-500">{ex.startDate} – {ex.endDate}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                  {ex.status}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {ex.schedule.map((slot: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{slot.subject} ({slot.maxMarks} Marks)</div>
                      <div className="text-slate-400 text-[11px]">{slot.date} • {slot.time} • Room {slot.room}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                      Theory Paper
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
