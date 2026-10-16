'use client';

import React from 'react';
import { X, FileText, Download, Award, CheckCircle2 } from 'lucide-react';
import { WardInfo } from '../types';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWard: WardInfo;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  isOpen,
  onClose,
  selectedWard,
}) => {
  if (!isOpen) return null;

  const isGrade10 = selectedWard.sectionName.includes('10');

  const subjects = isGrade10
    ? [
        { subject: 'Mathematics (041)', theory: 74, internal: 19, total: 93, grade: 'A1' },
        { subject: 'Science (086)', theory: 70, internal: 19, total: 89, grade: 'A1' },
        { subject: 'Social Science (087)', theory: 68, internal: 18, total: 86, grade: 'A2' },
        { subject: 'English Language & Literature (184)', theory: 72, internal: 19, total: 91, grade: 'A1' },
        { subject: 'Information Technology (402)', theory: 48, internal: 48, total: 96, grade: 'A1' },
      ]
    : [
        { subject: 'Mathematics', theory: 76, internal: 20, total: 96, grade: 'A1' },
        { subject: 'General Science', theory: 74, internal: 19, total: 93, grade: 'A1' },
        { subject: 'Social Studies', theory: 70, internal: 19, total: 89, grade: 'A1' },
        { subject: 'English Core', theory: 72, internal: 20, total: 92, grade: 'A1' },
        { subject: 'Computer Applications', theory: 78, internal: 20, total: 98, grade: 'A1' },
      ];

  const totalObtained = subjects.reduce((sum, s) => sum + s.total, 0);
  const totalMax = subjects.length * 100;
  const percentage = ((totalObtained / totalMax) * 100).toFixed(1);

  const handleDownloadPdf = () => {
    alert(`Certified CBSE Term Report Card downloaded for ${selectedWard.name}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070A10]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Award size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">CBSE Holistic Progress Card (HPC)</h3>
              <p className="text-xs text-slate-500">Official verified term academic evaluation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Report Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Institutional Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
              Central Board of Secondary Education
            </h2>
            <p className="text-slate-500 font-medium text-xs mt-0.5">
              Academic Session 2026-2027 · Continuous & Comprehensive Evaluation
            </p>
            <div className="mt-3 inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold text-slate-700">
              <span>Candidate: <b className="text-slate-900">{selectedWard.name}</b></span>
              <span>•</span>
              <span>Class: <b className="text-slate-900">{selectedWard.sectionName}</b></span>
              <span>•</span>
              <span>Roll: <b className="text-slate-900">{selectedWard.rollNumber}</b></span>
            </div>
          </div>

          {/* Academic Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3 text-center">Theory (80)</th>
                  <th className="py-2.5 px-3 text-center">Internal (20)</th>
                  <th className="py-2.5 px-3 text-center">Total (100)</th>
                  <th className="py-2.5 px-3 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {subjects.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{sub.subject}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">{sub.theory}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">{sub.internal}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{sub.total}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{sub.grade}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-900">
                  <td className="py-2.5 px-3">Cumulative Aggregate</td>
                  <td colSpan={2} className="py-2.5 px-3 text-center text-slate-500 font-normal">
                    Aggregate Percentage: {percentage}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-indigo-700 text-sm">
                    {totalObtained} / {totalMax}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600">A1</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* HPC 360-Degree Qualitative Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cognitive & Inquiry</span>
              <p className="text-slate-700 leading-relaxed">
                Demonstrates high conceptual clarity and active participation in STEM laboratory inquiries. Exceptional rigor in problem solving.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Affective & Socio-Emotional</span>
              <p className="text-slate-700 leading-relaxed">
                Exemplary peer collaboration, team leadership in group projects, and consistent respect for institutional guidelines.
              </p>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="pt-2 flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
              <CheckCircle2 size={14} />
              <span>Digitally Certified by Examination Cell & Controller of Assessments</span>
            </div>
            <span className="text-[11px] font-mono">Issued: Oct 2026</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="text-xs">
            <span className="text-slate-500">Attendance: </span>
            <span className="font-bold text-slate-900">{selectedWard.attendancePct}%</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-emerald-700 font-bold">Promoted with Distinction</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-colors text-xs"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs border border-[#1A243D] transition-all"
            >
              <Download size={14} /> Download Certified PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
