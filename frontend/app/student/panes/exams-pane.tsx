'use client';

import React, { useState, useEffect } from 'react';
import { Award, Calendar, CheckCircle2, TrendingUp, Download, Printer, ShieldCheck, X, FileText, QrCode } from 'lucide-react';
import { getStudentExams } from '../../edops-api';

interface ExamsPaneProps {
  organizationId: string;
}

export const ExamsPane: React.FC<ExamsPaneProps> = ({ organizationId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scorecards' | 'schedule'>('scorecards');
  const [hallTicketOpen, setHallTicketOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);

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

  const upcomingExams = data?.upcomingExams || [
    {
      id: 'ex-mid-26',
      name: 'CBSE Mid-Term Board Preparatory Examination 2026',
      status: 'Admit Card Issued',
      startDate: 'Nov 02, 2026',
      endDate: 'Nov 14, 2026',
      schedule: [
        { subject: 'Mathematics (041)', date: 'Nov 02, 2026', time: '09:00 AM - 12:00 PM', room: 'Exam Hall 3 (Desk 14)', maxMarks: 80 },
        { subject: 'Physics (042)', date: 'Nov 05, 2026', time: '09:00 AM - 12:00 PM', room: 'Exam Hall 3 (Desk 14)', maxMarks: 70 },
        { subject: 'Chemistry (043)', date: 'Nov 08, 2026', time: '09:00 AM - 12:00 PM', room: 'Exam Hall 3 (Desk 14)', maxMarks: 70 },
        { subject: 'English Core (301)', date: 'Nov 11, 2026', time: '09:00 AM - 12:00 PM', room: 'Exam Hall 3 (Desk 14)', maxMarks: 80 },
        { subject: 'Computer Science (083)', date: 'Nov 14, 2026', time: '09:00 AM - 12:00 PM', room: 'Computer Lab 2 (Station 8)', maxMarks: 70 },
      ],
    },
  ];

  const scorecards = data?.scorecards || [
    {
      id: 'sc-term1-26',
      term: 'Term 1',
      examName: 'Quarterly Examination 2026',
      publishedAt: 'October 05, 2026',
      totalMarks: 442,
      maxTotal: 500,
      percentage: 88.4,
      grade: 'A1',
      teacherRemarks: 'Exemplary performance across STEM subjects. High rigor observed in analytical proofs.',
      subjects: [
        { subject: 'Mathematics', max: 100, marks: 93, percentage: 93, grade: 'A1' },
        { subject: 'Physics', max: 100, marks: 89, percentage: 89, grade: 'A1' },
        { subject: 'Chemistry', max: 100, marks: 84, percentage: 84, grade: 'A2' },
        { subject: 'English Core', max: 100, marks: 86, percentage: 86, grade: 'A2' },
        { subject: 'Computer Science', max: 100, marks: 90, percentage: 90, grade: 'A1' },
      ],
    },
  ];

  const comparison = data?.comparison || {
    previousExam: 'Periodic Test 1 (76%)',
    currentExam: 'Quarterly Examination (88.4%)',
    improvementPct: 12.4,
    strongestSubject: 'Mathematics (93%)',
    highestGrowthSubject: 'Computer Science (+14.0%)',
  };

  const handleOpenHallTicket = (exam: any) => {
    setSelectedExam(exam);
    setHallTicketOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Term Examinations & Official Scorecards</h2>
          <p className="text-sm text-slate-500">Official CBSE term exam schedules, digital hall tickets, and verified report cards.</p>
        </div>
        <button
          onClick={() => handleOpenHallTicket(upcomingExams[0])}
          className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs border border-[#1A243D] flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer size={14} /> Download Digital Hall Ticket
        </button>
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
          <span className="text-3xl font-extrabold font-mono">A1</span>
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
          Upcoming Examination Date Sheet & Admit Card
        </button>
      </div>

      {/* 1. SCORECARDS TAB */}
      {activeTab === 'scorecards' && (
        <div className="space-y-6">
          {scorecards.map((sc: any) => (
            <div key={sc.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    <div className="text-base font-bold text-slate-900 font-mono">
                      {sc.totalMarks} / {sc.maxTotal} ({sc.percentage}%)
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg font-mono">
                    {sc.grade}
                  </div>
                  <button
                    onClick={() => alert(`Downloading verified digital scorecard for ${sc.examName}...`)}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                    title="Download certified PDF scorecard"
                  >
                    <Download size={16} />
                  </button>
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
                        <td className="py-3 px-4 text-center text-slate-500 font-mono">{s.max}</td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-600 font-mono">{s.marks}</td>
                        <td className="py-3 px-4 text-center font-semibold font-mono">{s.percentage}%</td>
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

      {/* 2. SCHEDULE & ADMIT CARD TAB */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {upcomingExams.map((ex: any) => (
            <div key={ex.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{ex.name}</h3>
                  <p className="text-xs text-slate-500">{ex.startDate} – {ex.endDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {ex.status}
                  </span>
                  <button
                    onClick={() => handleOpenHallTicket(ex)}
                    className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <FileText size={13} /> View Hall Ticket
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {ex.schedule.map((slot: any, idx: number) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{slot.subject} ({slot.maxMarks} Marks)</div>
                      <div className="text-slate-500 text-[11px] font-mono">{slot.date} • {slot.time}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium text-[11px] font-mono self-start sm:self-auto">
                      {slot.room}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. DIGITAL HALL TICKET MODAL */}
      {hallTicketOpen && selectedExam && (
        <div className="fixed inset-0 z-50 bg-[#070A10]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Official Examination Hall Ticket / Admit Card</h3>
              </div>
              <button
                onClick={() => setHallTicketOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Hall Ticket Canvas */}
            <div className="p-6 space-y-5 text-xs text-slate-800">
              <style>{`
                @media print {
                  body * { visibility: hidden !important; }
                  #printable-hall-ticket, #printable-hall-ticket * { visibility: visible !important; }
                  #printable-hall-ticket { position: fixed; left: 0; top: 0; width: 100%; margin: 0; padding: 24px; border: 1px solid #cbd5e1 !important; }
                }
              `}</style>
              <div id="printable-hall-ticket" className="border border-slate-300 rounded-xl p-5 bg-white relative">
                {/* Watermark / Seal */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                      Central Board of Secondary Education
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold">{selectedExam.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Academic Session 2026 - 2027</p>
                  </div>
                  <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                    <QrCode size={40} className="text-slate-700" />
                  </div>
                </div>

                {/* Candidate Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Candidate Name</span>
                    <span className="font-bold text-slate-900">Aarav Sharma</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Roll Number</span>
                    <span className="font-bold font-mono text-slate-900">14 (Sec A)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">CBSE Reg. No.</span>
                    <span className="font-bold font-mono text-slate-900">DL-2026-104928</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Center Code</span>
                    <span className="font-bold font-mono text-slate-900">CTR-8820 (Main Wing)</span>
                  </div>
                </div>

                {/* Exam Timetable */}
                <div className="py-4">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Authorized Papers & Seating Allotment
                  </h4>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase">
                        <th className="py-1.5 font-bold">Paper / Subject</th>
                        <th className="py-1.5 font-bold font-mono">Date</th>
                        <th className="py-1.5 font-bold font-mono">Reporting Time</th>
                        <th className="py-1.5 font-bold text-right font-mono">Allotted Seating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {selectedExam.schedule?.map((s: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 font-bold text-slate-900">{s.subject}</td>
                          <td className="py-2 font-mono text-slate-600">{s.date}</td>
                          <td className="py-2 font-mono text-slate-600">{s.time}</td>
                          <td className="py-2 text-right font-mono text-slate-800">{s.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Rules of Conduct */}
                <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-bold text-slate-700">Instructions for the Candidate:</p>
                  <p>1. Must carry printed copy of this Hall Ticket along with physical School Identity Card.</p>
                  <p>2. Electronic watches, mobile phones, and calculators are strictly prohibited in the exam hall.</p>
                  <p>3. Gates close precisely at 08:45 AM. No candidate will be admitted post reading-time commencement.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Digitally Certified by Examination Controller
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHallTicketOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="bg-[#090D16] hover:bg-[#1E293B] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-xs"
                  >
                    <Printer size={14} /> Print / Save PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
