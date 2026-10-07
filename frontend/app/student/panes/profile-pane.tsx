'use client';

import React from 'react';
import { User, ShieldCheck, FileText, Download, Award } from 'lucide-react';

interface ProfilePaneProps {
  organizationId: string;
}

export const ProfilePane: React.FC<ProfilePaneProps> = () => {
  const student = {
    name: 'Vikas Kumar',
    admissionNo: 'ADM-2024-1082',
    classSection: 'Class 10-A',
    rollNo: '17',
    academicYear: '2026-27',
    house: 'Tagore House (Blue)',
    classTeacher: 'Rahul Sharma',
    dob: '14 May 2011',
    board: 'CBSE (Central Board of Secondary Education)',
    status: 'Active Enrolled Learner',
  };

  const documents = [
    {
      title: 'Term 1 Quarterly Official Report Card',
      date: 'Aug 28, 2026',
      type: 'PDF Document',
      size: '1.2 MB',
      verifiedBy: 'School Principal & Academic Controller',
    },
    {
      title: 'Class 9 Annual Pass Certificate & Marksheet',
      date: 'Mar 24, 2026',
      type: 'Official Certificate',
      size: '2.1 MB',
      verifiedBy: 'Examination Committee',
    },
    {
      title: 'Inter-School Mathematics Olympiad Merit Certificate',
      date: 'Sep 15, 2026',
      type: 'Merit Award',
      size: '850 KB',
      verifiedBy: 'Science & Math Club Coordinator',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Student Profile & Academic Vault</h2>
        <p className="text-sm text-slate-500">Official student identity card, authorized report card archives, and achievement credentials.</p>
      </div>

      {/* Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
              VK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Admission No: {student.admissionNo} • Roll No: {student.rollNo}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Institutional Profile</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block">Academic Year</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{student.academicYear}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block">Enrolled Class</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{student.classSection}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block">Class Teacher</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{student.classTeacher}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block">School House</span>
            <span className="font-bold text-indigo-600 text-sm mt-0.5 block">{student.house}</span>
          </div>
        </div>
      </div>

      {/* Academic Documents Vault */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Official Academic Documents & Transcripts</h3>
          </div>
          <span className="text-xs text-slate-400">Read-Only Vault</span>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.map((doc, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {doc.type} • {doc.size} • Issued on {doc.date}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Certified: {doc.verifiedBy}</p>
                </div>
              </div>
              <button
                onClick={() => alert(`Downloading ${doc.title}...`)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
