'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, TrendingUp, Layers, ChevronRight, User } from 'lucide-react';
import { getStudentSubjects } from '../../edops-api';
import { StudentTab } from '../types';

interface SubjectsPaneProps {
  organizationId: string;
  onNavigateTab: (tab: StudentTab) => void;
}

export const SubjectsPane: React.FC<SubjectsPaneProps> = ({ organizationId, onNavigateTab }) => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

  useEffect(() => {
    loadSubjects();
  }, [organizationId]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await getStudentSubjects(organizationId);
      const list = res?.subjects || [];
      setSubjects(list);
      if (list.length > 0) setSelectedSubject(list[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading prescribed subjects...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Prescribed Subjects</h2>
        <p className="text-sm text-slate-500">Connected learning journey: notes, recordings, coursework, and evaluations per subject.</p>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => {
          const isSelected = selectedSubject?.id === sub.id;
          return (
            <div
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {sub.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{sub.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <User className="w-3 h-3" /> {sub.teacher}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-indigo-600">{sub.assessmentAverage}%</div>
                  <span className="text-[10px] text-slate-400">Score Avg</span>
                </div>
              </div>

              {/* Progress metrics */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs font-bold text-slate-800">{sub.attendance}%</div>
                  <div className="text-[10px] text-slate-400">Attendance</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{sub.assignmentsCompleted}%</div>
                  <div className="text-[10px] text-slate-400">Homework</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{sub.curriculumProgress}%</div>
                  <div className="text-[10px] text-slate-400">Curriculum</div>
                </div>
              </div>

              <div className="mt-3 bg-slate-50 p-2 rounded-xl text-[11px] text-slate-500 truncate">
                <span className="font-semibold text-slate-700">Topic:</span> {sub.currentTopic}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Subject Detailed Learning Center */}
      {selectedSubject && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                Active Learning Track
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedSubject.name} ({selectedSubject.code})
              </h3>
              <p className="text-xs text-slate-500">Faculty: {selectedSubject.teacher} • Email: {selectedSubject.teacherEmail}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('resources')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Study Material
              </button>
              <button
                onClick={() => onNavigateTab('assignments')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Subject Assignments
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Current Curriculum Chapter</span>
              <h4 className="text-sm font-bold text-slate-900">{selectedSubject.currentTopic}</h4>
              <p className="text-xs text-slate-500">75% of unit completed in classroom lectures</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Learning Outcomes Mastered</span>
              <h4 className="text-sm font-bold text-slate-900">
                {selectedSubject.learningOutcomesAchieved} of {selectedSubject.totalLearningOutcomes} LOs
              </h4>
              <p className="text-xs text-slate-500">Verified through assessments & homework submissions</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Classroom Pacing Status</span>
              <h4 className="text-sm font-bold text-emerald-600">On Schedule (NCERT)</h4>
              <p className="text-xs text-slate-500">Aligned with CBSE Term 1 examination calendar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
