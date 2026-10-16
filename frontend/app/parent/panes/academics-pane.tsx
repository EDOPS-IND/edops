'use client';

import React from 'react';
import { FileText, BookOpen, CheckCircle2, Clock, Mail, Award, TrendingUp } from 'lucide-react';
import { WardInfo } from '../types';

interface AcademicsPaneProps {
  selectedWard: WardInfo;
  onOpenReportModal: () => void;
}

export const AcademicsPane: React.FC<AcademicsPaneProps> = ({
  selectedWard,
  onOpenReportModal,
}) => {
  const isGrade10 = selectedWard.sectionName.includes('10');

  const subjects = isGrade10
    ? [
        { name: 'Mathematics', code: 'MATH-041', teacher: 'Dr. K. Raman', email: 'raman.math@school.edu', score: 93, grade: 'A1', syllabus: 68 },
        { name: 'Physics & Science', code: 'SCI-086', teacher: 'Mrs. Sunita Kapoor', email: 'sunita.sci@school.edu', score: 89, grade: 'A1', syllabus: 72 },
        { name: 'Chemistry', code: 'CHEM-086', teacher: 'Dr. S. Nair', email: 'nair.chem@school.edu', score: 84, grade: 'A2', syllabus: 64 },
        { name: 'English Literature', code: 'ENG-184', teacher: 'Mr. Rajiv Menon', email: 'rajiv.eng@school.edu', score: 91, grade: 'A1', syllabus: 80 },
        { name: 'Computer Applications & AI', code: 'CS-402', teacher: 'Ms. Priya Desai', email: 'priya.cs@school.edu', score: 96, grade: 'A1', syllabus: 75 },
      ]
    : [
        { name: 'Mathematics', code: 'MATH-06', teacher: 'Mr. Alok Verma', email: 'alok.math@school.edu', score: 96, grade: 'A1', syllabus: 70 },
        { name: 'General Science', code: 'SCI-06', teacher: 'Mrs. Anita Deshmukh', email: 'anita.sci@school.edu', score: 93, grade: 'A1', syllabus: 75 },
        { name: 'Social Studies', code: 'SST-06', teacher: 'Ms. Sarita Chawla', email: 'sarita.sst@school.edu', score: 89, grade: 'A1', syllabus: 65 },
        { name: 'English Language', code: 'ENG-06', teacher: 'Ms. Ritu Sen', email: 'ritu.eng@school.edu', score: 92, grade: 'A1', syllabus: 80 },
        { name: 'Computer Basics', code: 'CS-06', teacher: 'Mr. K. Nair', email: 'nair.cs@school.edu', score: 98, grade: 'A1', syllabus: 85 },
      ];

  const homework = isGrade10
    ? [
        { title: 'Calculus: Quadratic Roots Proofs', subject: 'Mathematics', due: 'Tomorrow, 08:30 AM', status: 'pending' },
        { title: 'Concave Mirror Ray Diagram Observations', subject: 'Physics Lab', due: 'Tomorrow, 11:30 AM', status: 'pending' },
        { title: 'Analytical Paragraph Drafting', subject: 'English', due: 'Oct 20, 2026', status: 'submitted' },
      ]
    : [
        { title: 'Plant Cell Structure Coloring & Labeling', subject: 'General Science', due: 'Tomorrow, 09:00 AM', status: 'pending' },
        { title: 'Fractions & Decimals Exercise 3.2', subject: 'Mathematics', due: 'Oct 19, 2026', status: 'submitted' },
      ];

  return (
    <div className="space-y-6">
      {/* 1. WARD DOSSIER CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#090D16] text-white flex items-center justify-center font-bold text-xl shadow-xs border border-[#1A243D]">
              {selectedWard.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{selectedWard.name}</h3>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                  CBSE Enrolled
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedWard.programName} · {selectedWard.sectionName} · Roll No: {selectedWard.rollNumber}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{selectedWard.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenReportModal}
              className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-xs border border-[#1A243D] flex items-center gap-2"
            >
              <FileText size={14} /> Full CBSE Grade Dossier
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE PRESCRIBED SUBJECTS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Enrolled Subjects & Continuous Assessment</h4>
            <p className="text-[11px] text-slate-500">NCERT syllabus completion and latest evaluated scores</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-bold">
            {subjects.length} Prescribed Subjects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjects.map((sub, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{sub.name}</span>
                    <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-600">
                      {sub.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <Mail size={12} className="text-slate-400" />
                    <span>{sub.teacher}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-sm text-[#090D16] bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                    {sub.score}%
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">Grade {sub.grade}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Syllabus Covered</span>
                  <span className="font-mono font-semibold">{sub.syllabus}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${sub.syllabus}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. HOMEWORK & ASSIGNMENT RADAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Homework & Classroom Diary Tracker</h4>
            <p className="text-[11px] text-slate-500">Active tasks assigned by subject teachers with submission status</p>
          </div>
          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold border border-amber-200">
            {homework.filter((h) => h.status === 'pending').length} Action Items
          </span>
        </div>

        <div className="space-y-2.5">
          {homework.map((hw, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    hw.status === 'submitted'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}
                >
                  <BookOpen size={16} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">{hw.title}</h5>
                  <p className="text-[11px] text-slate-500">{hw.subject} • Deadline: {hw.due}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  hw.status === 'submitted'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {hw.status === 'submitted' ? 'Submitted' : 'Pending Submission'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
