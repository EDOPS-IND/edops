"use client";

import React, { useState } from "react";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  FileText,
  Send,
  ShieldAlert,
  Award,
  MessageSquare,
  Download,
  Bell,
  Sparkles,
  Plus,
  X,
  CreditCard,
  UserCheck,
  TrendingUp,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { ParentWorkspaceData, ParentChild } from "./edops-api";

interface ParentDashboardProps {
  view: "overview" | "children" | "attendance" | "notices";
  children: ParentWorkspaceData["children"];
  messages: ParentWorkspaceData["messages"];
}

interface LeaveApplication {
  id: string;
  childName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "approved" | "pending" | "rejected";
  submittedAt: string;
}

interface ParentQuery {
  id: string;
  childName: string;
  subject: string;
  category: string;
  queryText: string;
  status: "open" | "investigating" | "resolved";
  submittedAt: string;
}

export function ParentDashboard({ view, children = [], messages = [] }: ParentDashboardProps) {
  // If no children in live DB yet, provide realistic mock ward for instant interactivity
  const activeChildren: ParentChild[] = children.length > 0 ? children : [
    {
      studentUserId: "std-demo-01",
      name: "Aarav Sharma",
      email: "aarav.sharma@school.edu",
      rollNumber: "14",
      sectionName: "Grade 10-A",
      programName: "Secondary CBSE",
      attendancePct: 94.2,
      todayAttendance: "Present",
    },
    {
      studentUserId: "std-demo-02",
      name: "Ananya Sharma",
      email: "ananya.sharma@school.edu",
      rollNumber: "08",
      sectionName: "Grade 6-B",
      programName: "Middle School CBSE",
      attendancePct: 98.0,
      todayAttendance: "Present",
    },
  ];

  const [selectedChildId, setSelectedChildId] = useState<string>(activeChildren[0]?.studentUserId || "");
  const selectedChild = activeChildren.find(c => c.studentUserId === selectedChildId) || activeChildren[0];

  // Modals state
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Form states
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Sick Leave",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [queryForm, setQueryForm] = useState({
    category: "Academic Quality",
    subject: "",
    queryText: "",
  });

  // Local state for leaves & queries submitted in this session
  const [leavesList, setLeavesList] = useState<LeaveApplication[]>([
    {
      id: "leave-1",
      childName: activeChildren[0]?.name || "Ward",
      leaveType: "Medical / Doctor Visit",
      startDate: "2026-10-05",
      endDate: "2026-10-06",
      reason: "Dental checkup and follow-up appointment.",
      status: "approved",
      submittedAt: "2026-10-04",
    },
  ]);

  const [queriesList, setQueriesList] = useState<ParentQuery[]>([
    {
      id: "qry-1",
      childName: activeChildren[0]?.name || "Ward",
      subject: "Math Periodic Test 2 Feedback",
      category: "Academic Quality",
      queryText: "Requesting clarity on deduction in Section B calculus proofs.",
      status: "resolved",
      submittedAt: "2026-10-08",
    },
  ]);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) return;
    const newLeave: LeaveApplication = {
      id: `leave-${Date.now()}`,
      childName: selectedChild?.name || "Student",
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: "pending",
      submittedAt: new Date().toISOString().split("T")[0],
    };
    setLeavesList([newLeave, ...leavesList]);
    setLeaveModalOpen(false);
    setLeaveForm({
      leaveType: "Sick Leave",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reason: "",
    });
  };

  const handlePostQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryForm.queryText.trim() || !queryForm.subject.trim()) return;
    const newQuery: ParentQuery = {
      id: `qry-${Date.now()}`,
      childName: selectedChild?.name || "Student",
      subject: queryForm.subject,
      category: queryForm.category,
      queryText: queryForm.queryText,
      status: "open",
      submittedAt: new Date().toISOString().split("T")[0],
    };
    setQueriesList([newQuery, ...queriesList]);
    setQueryModalOpen(false);
    setQueryForm({ category: "Academic Quality", subject: "", queryText: "" });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. WARD / CHILD SWITCHER HEADER */}
      <section className="bg-white rounded-xl border border-[#E2DDD5] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E2DDD5] text-[#101828] flex items-center justify-center font-bold text-sm">
            <Users size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#475467]">Parent Guardian Hub</span>
              <span className="bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] px-2 py-0.5 rounded text-[10px] font-bold">
                CBSE Verified
              </span>
            </div>
            <h2 className="text-base font-bold text-[#101828] tracking-tight">
              Observing: <span>{selectedChild?.name}</span>
            </h2>
          </div>
        </div>

        {/* Wards Switcher Pills */}
        <div className="flex items-center gap-2 bg-[#FAF8F5] p-1.5 rounded-lg border border-[#E2DDD5]">
          <span className="text-[11px] font-semibold text-[#475467] px-2 hidden sm:inline">Select Ward:</span>
          {activeChildren.map((child) => {
            const isSelected = child.studentUserId === selectedChildId;
            return (
              <button
                key={child.studentUserId}
                onClick={() => setSelectedChildId(child.studentUserId)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#101828] text-white shadow-xs"
                    : "text-[#344054] hover:bg-[#F2F4F7]"
                }`}
              >
                <span>{child.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? "bg-white/20 text-white" : "bg-white border border-[#D0D5DD] text-[#344054]"}`}>
                  {child.sectionName}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. OVERVIEW PANE */}
      {(view === "overview") && (
        <div className="space-y-6">
          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Check-in */}
            <div className="bg-white rounded-xl border border-[#E2DDD5] p-4.5 shadow-xs">
              <div className="flex items-center justify-between text-[#475467] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Today's Check-in</span>
                <Clock size={16} className="text-[#667085]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#101828] font-mono tracking-tight">
                  {selectedChild?.todayAttendance || "Present"}
                </span>
                <span className="text-xs text-[#027A48] font-semibold flex items-center gap-0.5">
                  <CheckCircle2 size={12} /> 07:42 AM
                </span>
              </div>
              <p className="text-[11.5px] text-[#667085] mt-2">Campus Gate 2 Bio-Punch confirmed</p>
            </div>

            {/* Attendance Percentage */}
            <div className="bg-white rounded-xl border border-[#E2DDD5] p-4.5 shadow-xs">
              <div className="flex items-center justify-between text-[#475467] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</span>
                <Calendar size={16} className="text-[#667085]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#101828] font-mono tracking-tight">
                  {selectedChild?.attendancePct ?? 94.2}%
                </span>
                <span className="text-xs bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] px-1.5 py-0.5 rounded font-bold">
                  Above 75% CBSE
                </span>
              </div>
              <p className="text-[11.5px] text-[#667085] mt-2">128 of 136 academic sessions attended</p>
            </div>

            {/* Term Academic Average */}
            <div className="bg-white rounded-xl border border-[#E2DDD5] p-4.5 shadow-xs">
              <div className="flex items-center justify-between text-[#475467] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Cumulative GPA</span>
                <Award size={16} className="text-[#667085]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#101828] font-mono tracking-tight">
                  88.5%
                </span>
                <span className="text-xs text-[#175CD3] font-semibold">Grade A1</span>
              </div>
              <p className="text-[11.5px] text-[#667085] mt-2">Across 6 enrolled core subjects</p>
            </div>

            {/* Pending Homework */}
            <div className="bg-white rounded-xl border border-[#E2DDD5] p-4.5 shadow-xs">
              <div className="flex items-center justify-between text-[#475467] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Homework Due</span>
                <BookOpen size={16} className="text-[#667085]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#101828] font-mono tracking-tight">
                  2 Pending
                </span>
                <span className="text-xs bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89] px-1.5 py-0.5 rounded font-bold">Due Tomorrow</span>
              </div>
              <p className="text-[11.5px] text-[#667085] mt-2">Physics Lab & Math Problem Set 4</p>
            </div>
          </div>

          {/* ACTION BUTTONS & QUICK SHORTCUTS (KEPT IN PLACE ON TOP) */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="bg-[#101828] hover:bg-[#1D2939] text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs border border-[#101828] flex items-center gap-2"
            >
              <Plus size={14} /> Apply Student Leave
            </button>
            <button
              onClick={() => setQueryModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-[#101828] font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors border border-[#D0D5DD] shadow-2xs flex items-center gap-2"
            >
              <MessageSquare size={14} /> Send Grievance / Academic Query
            </button>
            <button
              onClick={() => setReportModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-[#101828] font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors border border-[#D0D5DD] shadow-2xs flex items-center gap-2"
            >
              <Download size={14} /> Download CBSE Term Report Card
            </button>
          </div>

          {/* TODAY'S TIMETABLE & TEACHER REMARKS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Schedule */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">Today's Class Schedule ({selectedChild?.sectionName})</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">6 Periods Scheduled</span>
              </div>
              <div className="space-y-3">
                {[
                  { period: "P1", time: "08:00 - 08:45", subject: "Mathematics", teacher: "Dr. K. Raman", room: "Room 204", status: "completed" },
                  { period: "P2", time: "08:50 - 09:35", subject: "Physics", teacher: "Prof. S. Sengupta", room: "Science Lab B", status: "completed" },
                  { period: "P3", time: "09:40 - 10:25", subject: "English Literature", teacher: "Ms. Anita Desai", room: "Room 204", status: "current" },
                  { period: "P4", time: "10:45 - 11:30", subject: "Chemistry", teacher: "Dr. V. Rao", room: "Chemistry Lab", status: "upcoming" },
                  { period: "P5", time: "11:35 - 12:20", subject: "Computer Science", teacher: "Mr. Rajeev Nair", room: "Computer Lab 1", status: "upcoming" },
                  { period: "P6", time: "12:50 - 01:30", subject: "Physical Education", teacher: "Coach Vikram", room: "Athletics Field", status: "upcoming" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                      item.status === "current"
                        ? "bg-indigo-50/50 border-indigo-200"
                        : item.status === "completed"
                        ? "bg-slate-50 border-slate-200 text-slate-600"
                        : "bg-white border-slate-200/70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold w-6 text-slate-500">{item.period}</span>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {item.subject}
                          {item.status === "current" && (
                            <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold animate-pulse">
                              LIVE NOW
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{item.teacher} · {item.room}</div>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Notes & Recent Highlights */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">Faculty Remarks & Academic Highlights</h3>
                </div>
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">This Term</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">Class Teacher Note (Dr. K. Raman)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Yesterday</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    "Aarav demonstrated exceptional clarity during the linear algebra seminar. Homework submissions are prompt and analytical."
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">Physics Faculty (Prof. S. Sengupta)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Oct 09</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    "Practicals completed with full marks in optics experiment. Recommended to revise ray diagrams for the upcoming Periodic Test 2."
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/30">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-indigo-900">Arena Practice Milestone</span>
                    <span className="text-[10px] text-indigo-600 font-mono">Oct 08</span>
                  </div>
                  <p className="text-xs text-indigo-700">
                    Earned "Geometry Master" badge with an 8-question consecutive streak in Practice Arena.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CHILDREN & ACADEMICS PANE */}
      {(view === "children") && (
        <div className="space-y-6">
          {/* Ward Dossier Header */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-lg text-slate-800">
                  {selectedChild?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{selectedChild?.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedChild?.programName} · {selectedChild?.sectionName} · Roll No. {selectedChild?.rollNumber || "14"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{selectedChild?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs border border-[#1A243D] flex items-center gap-2"
                >
                  <FileText size={14} /> Full CBSE Grade Dossier
                </button>
              </div>
            </div>
          </div>

          {/* Core Subject Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
              Enrolled Core Subjects & Academic Standing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Mathematics (041)", teacher: "Dr. K. Raman", score: "92%", grade: "A1", syllabus: "78% Covered", nextTest: "Oct 24" },
                { name: "Physics (042)", teacher: "Prof. S. Sengupta", score: "89%", grade: "A1", syllabus: "72% Covered", nextTest: "Oct 26" },
                { name: "Chemistry (043)", teacher: "Dr. V. Rao", score: "84%", grade: "A2", syllabus: "68% Covered", nextTest: "Oct 28" },
                { name: "English Core (301)", teacher: "Ms. Anita Desai", score: "91%", grade: "A1", syllabus: "85% Covered", nextTest: "Nov 02" },
                { name: "Computer Science (083)", teacher: "Mr. Rajeev Nair", score: "96%", grade: "A1", syllabus: "82% Covered", nextTest: "Nov 04" },
                { name: "Physical Education (048)", teacher: "Coach Vikram", score: "90%", grade: "A1", syllabus: "90% Covered", nextTest: "Nov 07" },
              ].map((subj, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{subj.name}</h4>
                      <p className="text-[11px] text-slate-500">{subj.teacher}</p>
                    </div>
                    <span className="font-mono font-extrabold text-sm text-[#090D16] bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {subj.score}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                    <span>Syllabus: {subj.syllabus}</span>
                    <span className="font-semibold text-slate-700">Next: {subj.nextTest}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Homework & Assignments Tracker */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Ward Homework & Assignment Submissions</h3>
              <span className="text-xs text-slate-500 font-medium">Synced with Teacher Gradebook</span>
            </div>
            <div className="space-y-3">
              {[
                { title: "Quadratic Equations: Problem Set 4", subject: "Mathematics", due: "Tomorrow, 05:00 PM", status: "pending", marks: "-- / 20" },
                { title: "Ray Optics & Prism Lab Observations", subject: "Physics", due: "Oct 15, 11:59 PM", status: "pending", marks: "-- / 25" },
                { title: "Organic Chemistry Reaction Mechanisms", subject: "Chemistry", due: "Oct 10, 05:00 PM", status: "graded", marks: "23 / 25" },
                { title: "Essay: Industrialization Impact on Ecology", subject: "English Core", due: "Oct 06, 05:00 PM", status: "graded", marks: "19 / 20" },
              ].map((hw, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{hw.title}</div>
                    <div className="text-[11px] text-slate-500">{hw.subject} · Due: {hw.due}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-700">{hw.marks}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        hw.status === "graded"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {hw.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. ATTENDANCE & LEAVES PANE */}
      {(view === "attendance") && (
        <div className="space-y-6">
          {/* Attendance KPI Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aggregate Rate</span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                {selectedChild?.attendancePct ?? 94.2}%
              </div>
              <p className="text-[11px] text-slate-500 mt-2">128 Days Present out of 136 instructional days</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unexcused Absences</span>
              <div className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">0 Days</div>
              <p className="text-[11px] text-slate-500 mt-2">All absences covered by verified leave notes</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Leaves</span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">{leavesList.length} Requests</div>
              <button
                onClick={() => setLeaveModalOpen(true)}
                className="text-xs text-indigo-600 font-semibold mt-2 hover:underline inline-block"
              >
                + Submit new leave application
              </button>
            </div>
          </div>

          {/* Monthly Attendance Calendar Grid */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Attendance Log: October 2026</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Present</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Absent</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span> Weekend / Holiday</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="font-bold text-slate-400 py-1">{d}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const isWeekend = (i % 7 === 5) || (i % 7 === 6);
                const isLeave = day === 5 || day === 6;
                const isFuture = day > 12;
                return (
                  <div
                    key={day}
                    className={`py-3 rounded-lg border text-xs font-mono font-bold transition-colors ${
                      isFuture
                        ? "bg-slate-50/40 text-slate-300 border-slate-100"
                        : isWeekend
                        ? "bg-slate-100/70 text-slate-400 border-slate-200"
                        : isLeave
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50/70 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    <div>{day}</div>
                    <div className="text-[9px] font-sans font-medium mt-0.5">
                      {isFuture ? "--" : isWeekend ? "Off" : isLeave ? "Leave" : "Present"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submitted Leave Applications History */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Leave Applications History</h3>
              <button
                onClick={() => setLeaveModalOpen(true)}
                className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs"
              >
                + Apply for Leave
              </button>
            </div>
            <div className="space-y-3">
              {leavesList.map((leave) => (
                <div key={leave.id} className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{leave.leaveType}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 font-mono">{leave.startDate} to {leave.endDate}</span>
                    </div>
                    <p className="text-slate-500 mt-1">{leave.reason}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      leave.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : leave.status === "rejected"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. NOTICES & COMMUNICATION PANE */}
      {(view === "notices") && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Institutional Bulletins & Teacher Communications</h3>
            <button
              onClick={() => setQueryModalOpen(true)}
              className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-2"
            >
              <MessageSquare size={14} /> Raise Query to Principal
            </button>
          </div>

          {/* School Bulletins & Notices */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100 mb-4">
              Official School Notices & Circulars
            </h4>
            <div className="space-y-3">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{msg.subject || "Circular Notice"}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{msg.body || "Notice content"}</p>
                    <div className="text-[11px] text-slate-400 mt-2 font-semibold">
                      Sender: {msg.sender_name || "School Administration"}
                    </div>
                  </div>
                ))
              ) : (
                [
                  {
                    id: "circ-1",
                    subject: "Upcoming CBSE Term 1 Practical Assessment Schedule",
                    body: "The CBSE practical assessments for Science and Informatics will commence from November 15, 2026. Hall tickets will be downloadable via the student portal next Monday.",
                    sender: "Examination Cell",
                    date: "Oct 11, 2026",
                  },
                  {
                    id: "circ-2",
                    subject: "Parent-Teacher Conference (PTM) Term 1 Notification",
                    body: "Annual Term 1 PTM is scheduled for Saturday, October 25. Time slots will be opened for reservations on Friday at 10:00 AM.",
                    sender: "Office of the Principal",
                    date: "Oct 08, 2026",
                  },
                  {
                    id: "circ-3",
                    subject: "Annual Sports Day Registration & Trials",
                    body: "Inter-house athletic trials for track and field events will take place this Thursday during zero hour.",
                    sender: "Physical Education Dept.",
                    date: "Oct 05, 2026",
                  },
                ].map((circ) => (
                  <div key={circ.id} className="p-4 rounded-lg border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{circ.subject}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{circ.date}</span>
                    </div>
                    <p className="text-slate-600 pt-1">{circ.body}</p>
                    <div className="text-[11px] text-slate-500 font-medium pt-1">
                      Issued by: <span className="font-bold text-slate-700">{circ.sender}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Parent Grievance & Query Tracking (Linked to Principal Desk) */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Your Filed Queries & Grievances</h4>
                <p className="text-[11px] text-slate-500">Tracked directly by the Principal and Administrative Oversight team</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                {queriesList.length} Active
              </span>
            </div>
            <div className="space-y-3">
              {queriesList.map((q) => (
                <div key={q.id} className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{q.subject}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{q.category}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{q.queryText}</p>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">Submitted: {q.submittedAt}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      q.status === "resolved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: APPLY STUDENT LEAVE */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#070A10]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Submit Student Leave Request</h3>
              </div>
              <button
                onClick={() => setLeaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleApplyLeave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applying for Student</label>
                <input
                  type="text"
                  readOnly
                  value={`${selectedChild?.name} (${selectedChild?.sectionName})`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Leave Type</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="Sick Leave">Sick / Medical Leave</option>
                    <option value="Casual Leave">Casual / Family Urgent</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Academic Event">Sports / Olympiad Tournament</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">To Date (inclusive)</label>
                <input
                  type="date"
                  required
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason Description</label>
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="State the reason for absence..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#090D16] text-white hover:bg-[#1E293B] font-semibold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: SUBMIT GRIEVANCE / ACADEMIC QUERY */}
      {queryModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#070A10]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Submit Query to Principal & Administration</h3>
              </div>
              <button
                onClick={() => setQueryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePostQuery} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={queryForm.category}
                    onChange={(e) => setQueryForm({ ...queryForm, category: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="Academic Quality">Academic Quality & Evaluation</option>
                    <option value="Transport / Bus Delay">Transport / Bus Route Concern</option>
                    <option value="Discipline & Safety">Campus Safety & Discipline</option>
                    <option value="Fee Query">Fee Invoicing & Payment</option>
                    <option value="Special Assistance">Special Educational Support</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Regarding Ward</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedChild?.name}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Header</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clarification on Periodic Test 2 marking rubric"
                  value={queryForm.subject}
                  onChange={(e) => setQueryForm({ ...queryForm, subject: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Query</label>
                <textarea
                  required
                  rows={4}
                  value={queryForm.queryText}
                  onChange={(e) => setQueryForm({ ...queryForm, queryText: e.target.value })}
                  placeholder="Provide context and questions for the school leadership..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQueryModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#090D16] text-white hover:bg-[#1E293B] font-semibold"
                >
                  Dispatch to Principal Desk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: REPORT CARD PREVIEW */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#070A10]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">CBSE Holistic Report Card Preview</h3>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  Central Board of Secondary Education
                </h2>
                <p className="text-slate-500 font-medium text-xs">Academic Session 2026-2027 · Continuous Assessment</p>
                <div className="mt-2 text-xs font-semibold text-slate-700">
                  Student: <span className="font-bold text-slate-900">{selectedChild?.name}</span> · Class: {selectedChild?.sectionName} · Roll: {selectedChild?.rollNumber}
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                    <th className="py-2">Subject</th>
                    <th className="py-2 text-center">Theory (80)</th>
                    <th className="py-2 text-center">Internal (20)</th>
                    <th className="py-2 text-center">Total (100)</th>
                    <th className="py-2 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr>
                    <td className="py-2 font-bold text-slate-900">Mathematics</td>
                    <td className="py-2 text-center font-mono">74</td>
                    <td className="py-2 text-center font-mono">19</td>
                    <td className="py-2 text-center font-mono font-bold text-slate-900">93</td>
                    <td className="py-2 text-right font-bold text-emerald-600">A1</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-slate-900">Physics</td>
                    <td className="py-2 text-center font-mono">70</td>
                    <td className="py-2 text-center font-mono">19</td>
                    <td className="py-2 text-center font-mono font-bold text-slate-900">89</td>
                    <td className="py-2 text-right font-bold text-emerald-600">A1</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-slate-900">Chemistry</td>
                    <td className="py-2 text-center font-mono">66</td>
                    <td className="py-2 text-center font-mono">18</td>
                    <td className="py-2 text-center font-mono font-bold text-slate-900">84</td>
                    <td className="py-2 text-right font-bold text-indigo-600">A2</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-slate-900">English Core</td>
                    <td className="py-2 text-center font-mono">72</td>
                    <td className="py-2 text-center font-mono">19</td>
                    <td className="py-2 text-center font-mono font-bold text-slate-900">91</td>
                    <td className="py-2 text-right font-bold text-emerald-600">A1</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-slate-900">Computer Science</td>
                    <td className="py-2 text-center font-mono">76</td>
                    <td className="py-2 text-center font-mono">20</td>
                    <td className="py-2 text-center font-mono font-bold text-slate-900">96</td>
                    <td className="py-2 text-right font-bold text-emerald-600">A1</td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500">Attendance: {selectedChild?.attendancePct ?? 94.2}%</span>
                  <div className="text-xs font-bold text-slate-800">Result: Promoted with Distinction</div>
                </div>
                <button
                  onClick={() => {
                    alert("Digital PDF report card downloaded successfully.");
                    setReportModalOpen(false);
                  }}
                  className="bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Download size={14} /> Download Certified PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
