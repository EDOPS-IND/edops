'use client';

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { getStudentAssessments } from '../../edops-api';

interface AssessmentsPaneProps {
  organizationId: string;
}

export const AssessmentsPane: React.FC<AssessmentsPaneProps> = ({ organizationId }) => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, [organizationId]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const res = await getStudentAssessments(organizationId);
      setAssessments(res?.assessments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading assessments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Formative Assessments & Unit Tests</h2>
        <p className="text-sm text-slate-500">Continuous internal evaluation: periodic class tests, lab practicals, projects, and ASL scores.</p>
      </div>

      {/* Assessment cards list */}
      <div className="space-y-4">
        {assessments.map((item: any) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {item.subject}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {item.type}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{item.date}</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    item.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-xs text-slate-500">Score Obtained:</span>
                <div className="text-lg font-extrabold text-slate-900">
                  {item.marksObtained !== null ? `${item.marksObtained} / ${item.maxMarks}` : `Pending (Max: ${item.maxMarks})`}
                </div>
              </div>
              {item.grade && (
                <div className="text-right">
                  <span className="text-xs text-slate-500">Grade:</span>
                  <div className="text-lg font-extrabold text-indigo-600">{item.grade}</div>
                </div>
              )}
            </div>

            {item.teacherRemarks && (
              <p className="text-xs text-slate-600 italic">
                <span className="font-semibold text-slate-700 not-italic">Teacher Remarks:</span> &quot;{item.teacherRemarks}&quot;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
