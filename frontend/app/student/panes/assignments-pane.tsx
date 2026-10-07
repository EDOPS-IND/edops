'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle, Upload, MessageSquare } from 'lucide-react';
import { getStudentAssignments } from '../../edops-api';

interface AssignmentsPaneProps {
  organizationId: string;
  onSubmitAssignment: (assignment: any) => void;
}

export const AssignmentsPane: React.FC<AssignmentsPaneProps> = ({
  organizationId,
  onSubmitAssignment,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadAssignments();
  }, [organizationId, statusFilter]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await getStudentAssignments(organizationId, statusFilter);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading homework assignments...</div>;
  }

  const assignments = data?.assignments || [];
  const summary = data?.summary || {
    totalAssigned: 30,
    submitted: 27,
    pending: 3,
    late: 2,
    completionPct: 90,
  };

  const tabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'pending', label: 'Pending / Due Soon' },
    { id: 'submitted', label: 'Submitted (Awaiting Grade)' },
    { id: 'evaluated', label: 'Evaluated & Graded' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Assignments & Coursework Hub</h2>
        <p className="text-sm text-slate-500">Track homework, upload solutions before deadline, and inspect teacher evaluation rubrics.</p>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Completion Rate</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary.completionPct}%</div>
          <p className="text-xs text-slate-400 mt-1">{summary.submitted} of {summary.totalAssigned} submitted</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Pending Review</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{summary.pending} Tasks</div>
          <p className="text-xs text-slate-400 mt-1">Due within 48 hours</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Late / Overdue</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary.late} Tasks</div>
          <p className="text-xs text-slate-400 mt-1">Submitted past deadline</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Graded Work</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">25 Graded</div>
          <p className="text-xs text-slate-400 mt-1">Average: 91% accuracy</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
              statusFilter === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            You&apos;re all caught up! No pending assignments in this view. 🎉
          </div>
        ) : (
          assignments.map((item: any) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {item.subject}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      item.status === 'evaluated'
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.status === 'submitted'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Max: {item.maxMarks} marks</span>
                </div>
              </div>

              <p className="text-xs text-slate-600">{item.description}</p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Faculty: <span className="font-semibold text-slate-700">{item.teacher}</span></span>
                  <span className="text-amber-700 font-semibold">Due: {item.dueDate}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600">Learning Outcome:</span> {item.learningOutcome}
                </div>
              </div>

              {/* Feedback if evaluated */}
              {item.status === 'evaluated' && (
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span>Teacher Score: {item.score} / {item.maxMarks}</span>
                    <span>Evaluation Complete</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] italic">&quot;{item.feedback}&quot;</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {item.submittedAt ? `Submitted: ${item.submittedAt}` : 'Submission Window Open'}
                </span>
                {item.status === 'pending' && (
                  <button
                    onClick={() => onSubmitAssignment(item)}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Submit Work</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
