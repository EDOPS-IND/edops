'use client';

import React, { useState, useEffect } from 'react';
import { getTeacherReports, getTeacherClasses } from '../../edops-api';

interface ReportsPaneProps {
  organizationId: string;
}

export const ReportsPane: React.FC<ReportsPaneProps> = ({ organizationId }) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [activeTab, setActiveTab] = useState<'loHeatmap' | 'cohortSummary' | 'cbseRegister'>('loHeatmap');

  useEffect(() => {
    loadClasses();
  }, [organizationId]);

  useEffect(() => {
    if (selectedClass) {
      loadReports();
    }
  }, [organizationId, selectedClass]);

  const loadClasses = async () => {
    try {
      const res = await getTeacherClasses(organizationId);
      const cls = res?.classes || [];
      setClassesList(cls);
      if (cls.length > 0) {
        setSelectedClass(cls[0].sectionId);
      } else {
        setSelectedClass('');
        setLoading(false);
      }
    } catch {
      setClassesList([]);
      setSelectedClass('');
        setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await getTeacherReports(organizationId, selectedClass);
      setReportData(res);
    } catch (err) {
      console.error(err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') { window.print(); return; }
    const rows = [['Student','Class','Subject','Average'], ...(reportData?.students || []).map((s: any) => [s.name,s.className,s.subject,s.avg ?? ''])];
    const csv = rows.map(row => row.map((v: any) => '"' + String(v ?? '').replaceAll('"','""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    const link = document.createElement('a'); link.href=url; link.download='academic-report.csv'; link.click(); URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Generating competency reports & LO heatmaps...</div>;
  }

  const outcomes: any[] = reportData?.outcomes || [];

  const students = reportData?.students || [];

  const strongCount = students.filter((s: any) => s.avg >= 80).length;
  const onTrackCount = students.filter((s: any) => s.avg >= 60 && s.avg < 80).length;
  const needsSupportCount = students.filter((s: any) => s.avg >= 45 && s.avg < 60).length;
  const criticalCount = students.filter((s: any) => s.avg != null && s.avg < 45).length;
  const totalCount = students.length || 0;
  const strongPct = students.length ? Math.round((strongCount / totalCount) * 100) : 0;
  const onTrackPct = students.length ? Math.round((onTrackCount / totalCount) * 100) : 0;
  const needsSupportPct = students.length ? Math.round((needsSupportCount / totalCount) * 100) : 0;
  const criticalPct = students.length ? Math.round((criticalCount / totalCount) * 100) : 0;

  const challengingOutcomes = outcomes.map((lo: any, idx: number) => {
    const scores = students.map((s: any) => s.scores?.[idx] || 0);
    const avg = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    return { ...lo, avg };
  }).filter((lo: any) => lo.avg > 0 && lo.avg < 60);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 45) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Academic Mastery Reports & LO Heatmap</h2>
          <p className="text-sm text-slate-500">Subject-level competency tracking, CBSE learning outcome heatmaps, and printable report registers.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {classesList.length > 0 ? (
              classesList.map((c) => (
                <option key={c.sectionId || c.className} value={c.sectionId || c.className}>
                  {c.className} ({c.subjectName})
                </option>
              ))
            ) : (
              <option value="">No assigned classes</option>
            )}
          </select>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>PDF Export</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('loHeatmap')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'loHeatmap'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Learning Outcomes Heatmap
        </button>
        <button
          onClick={() => setActiveTab('cohortSummary')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'cohortSummary'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Cohort Performance Breakdown
        </button>
        <button
          onClick={() => setActiveTab('cbseRegister')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'cbseRegister'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          CBSE Formative Marks Register
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'loHeatmap' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Competency Mastery Grid (Class {selectedClass})
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>&ge; 80% Mastery</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                <span>60-79% On Track</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                <span>45-59% Needs Support</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
                <span>&lt; 45% Critical</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Roll</th>
                  <th className="py-3 px-4 min-w-[160px]">Student Name</th>
                  {outcomes.map((lo, idx) => (
                    <th key={idx} className="py-3 px-3 text-center min-w-[120px]">
                      <div className="font-mono text-[11px] text-slate-700">{lo.code}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate max-w-[110px]" title={lo.label}>
                        {lo.label}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center">Subject Avg</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={outcomes.length + 4} className="py-12 text-center text-xs text-slate-400">
                      No student scorecard records found for Class {selectedClass}.
                    </td>
                  </tr>
                ) : (
                  students.map((student: any) => (
                    <tr key={student.rollNo} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center text-xs text-slate-400 font-mono">{student.rollNo}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{student.name}</td>
                      {student.scores?.map((score: number, idx: number) => (
                        <td key={idx} className="py-3 px-3 text-center">
                          <span className={`inline-block w-12 py-1 rounded text-xs font-semibold border ${getScoreColor(score)}`}>
                            {score}%
                          </span>
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{student.avg}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          student.status === 'Strong'
                            ? 'bg-emerald-50 text-emerald-700'
                            : student.status === 'On Track'
                            ? 'bg-blue-50 text-blue-700'
                            : student.status === 'Needs Support'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'cohortSummary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-2">Cohort Grade Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Overall performance classification in Mathematics for Class {selectedClass}.</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Distinction / Strong (&ge; 80%)</span>
                  <span>{strongPct}% ({strongCount} {strongCount === 1 ? 'student' : 'students'})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${strongPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>On Track (60-79%)</span>
                  <span>{onTrackPct}% ({onTrackCount} {onTrackCount === 1 ? 'student' : 'students'})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${onTrackPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Needs Support (45-59%)</span>
                  <span>{needsSupportPct}% ({needsSupportCount} {needsSupportCount === 1 ? 'student' : 'students'})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${needsSupportPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Intervention Recommended (&lt; 45%)</span>
                  <span>{criticalPct}% ({criticalCount} {criticalCount === 1 ? 'student' : 'students'})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${criticalPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-2">Most Challenging Competencies</h3>
            <p className="text-xs text-slate-500 mb-4">Learning outcomes where class average falls below 60%.</p>
            <div className="space-y-3">
              {challengingOutcomes.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 text-center">
                  All competencies meet or exceed the 60% mastery threshold for Class {selectedClass}.
                </div>
              ) : (
                challengingOutcomes.map((lo: any, idx: number) => (
                  <div key={idx} className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-amber-900">{lo.code}: {lo.label}</span>
                      <span className="text-xs font-bold text-amber-700">{lo.avg}% Class Avg</span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-1">Recommended action: Assign remedial drill before Term Exam.</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cbseRegister' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              &para;
            </div>
            <h3 className="text-base font-semibold text-slate-900">CBSE Formative Assessment Mark Register Ready</h3>
            <p className="text-xs text-slate-500">
              Complies with CBSE Class 9-10 internal assessment format: Periodic Tests (5 Marks), Multiple Assessment (5 Marks), Portfolio (5 Marks), Subject Enrichment (5 Marks).
            </p>
            <button
              onClick={() => handleExport('pdf')}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Generate Official CBSE Internal Mark Sheet (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
