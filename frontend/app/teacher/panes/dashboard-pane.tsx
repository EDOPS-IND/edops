"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Users,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { getTeacherDashboard } from "../../edops-api";

interface DashboardPaneProps {
  organizationId: string;
  onNavigate: (pane: string, sub?: string) => void;
  onTakeAttendance: (sectionId: string, periodNumber?: number, classSection?: string) => void;
  onMarkLessonCompleted: (sectionId: string, periodNumber?: number, classSection?: string) => void;
  onCreateAssignment?: () => void;
}

export function DashboardPane({
  organizationId,
  onNavigate,
  onTakeAttendance,
  onMarkLessonCompleted,
  onCreateAssignment,
}: DashboardPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [organizationId]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await getTeacherDashboard(organizationId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const kpis = data?.kpis;
  const nextClass = data?.nextClass;

  return (
    <div className="space-y-6">
      {/* 1. GREETING & CONTEXT HEADER */}
      <div className="bg-[#090D16] bg-gradient-to-r from-[#090D16] to-[#131C31] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#1A243D]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            Good Morning, {data?.teacher?.name || "Teacher"} 👋
          </h1>
          <p className="text-xs text-indigo-200 mt-1 font-medium">
            Senior Faculty • {data?.teacher?.primarySubject || "General"} • {data?.teacher?.assignedClassesCount ?? 0} Assigned Classes ({data?.teacher?.totalStudents ?? 0} Students)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("timetable")}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
            style={{ color: "#FFFFFF" }}
          >
            Full Timetable
          </button>
        </div>
      </div>

      {/* 2. TODAY'S ACTIONABLE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Classes Today", val: kpis?.classesToday ?? 0, note: `${kpis?.periodsToday ?? 0} periods`, tab: "timetable" },
          { label: "Students Today", val: kpis?.studentsToday ?? 0, note: "Across assigned sections", tab: "classes" },
          { label: "Pending Register", val: kpis?.pendingAttendance ?? 0, note: (kpis?.pendingAttendance ?? 0) > 0 ? "Pending submission" : "All marked", tab: "attendance" },
          { label: "Pending Grading", val: kpis?.pendingEvaluations ?? 0, note: (kpis?.pendingEvaluations ?? 0) > 0 ? "Pending evaluation" : "Queue clear", tab: "assignments" },
          { label: "Upcoming Tests", val: kpis?.upcomingAssessments ?? 0, note: "Assessment schedule", tab: "assessment" },
          { label: "Curriculum Pacing", val: `${kpis?.curriculumProgress ?? 0}%`, note: "Pacing tracker", tab: "curriculum" },
        ].map((card, i) => (
          <button
            key={i}
            onClick={() => onNavigate(card.tab)}
            className="p-4 text-left bg-white rounded-xl border border-slate-200 hover:border-indigo-400 transition-colors group shadow-sm flex flex-col"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition-colors">
              {card.label}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {card.val}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium">{card.note}</div>
          </button>
        ))}
      </div>

      {/* 3. HERO: CURRENT / NEXT CLASS PROMINENT CARD */}
      {nextClass ? (
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-2xl shadow-md border border-indigo-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-black">
                NOW / NEXT PERIOD
              </span>
              <span className="text-xs text-indigo-200 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Starts in {nextClass.startsInMinutes} mins ({nextClass.startTime}–{nextClass.endTime})
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {nextClass.classSection} • {nextClass.subject}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {nextClass.room}
              </span>
              <span>•</span>
              <span>Topic: <strong className="text-white">{nextClass.topic}</strong></span>
              <span>•</span>
              <span className="text-emerald-300 font-semibold">Lesson Plan: {nextClass.lessonPlanStatus}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onTakeAttendance(nextClass.sectionId, 2, nextClass.classSection)}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
              style={{ color: "#FFFFFF" }}
            >
              Take Attendance
            </button>
            <button
              onClick={() => onMarkLessonCompleted(nextClass.sectionId, 2, nextClass.classSection)}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
              style={{ color: "#FFFFFF" }}
            >
              Mark Completed
            </button>
            <button
              onClick={() => onNavigate("classes")}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
              style={{ color: "#FFFFFF" }}
            >
              Open Class Hub
            </button>
          </div>
        </div>
      ) : null}

      {/* 4. TODAY'S SCHEDULE & ATTENTION RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Schedule */}
        <div className="lg:col-span-2 bg-white  rounded-xl border border-gray-200  p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900  flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Today's Instructional Periods
            </h3>
            <button
              onClick={() => onNavigate("timetable")}
              className="text-xs font-semibold text-indigo-600  hover:underline"
            >
              Weekly Schedule →
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.todaySchedule?.length > 0 ? (
              data.todaySchedule.map((period: any) => (
                <div
                  key={period.period}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs hover:bg-slate-50/50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                      period.attendanceDone
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-slate-200"
                    }`}>
                      P{period.period}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {period.classSection}
                        </span>
                        <span className="text-[11px] text-slate-500">• {period.subject}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{period.time}</span>
                        <span>•</span>
                        <span>{period.room}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {period.attendanceDone ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3" /> Register Marked
                      </span>
                    ) : (
                      <button
                        onClick={() => onTakeAttendance(period.sectionId || "", period.period, period.classSection)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-2xs transition"
                      >
                        Mark Attendance
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                No instructional periods scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Attention Required & Quick Tasks */}
        <div className="space-y-4">
          <div className="bg-white  rounded-xl border border-gray-200  p-5 space-y-3.5">
            <h3 className="text-base font-bold text-gray-900  flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Attention Required
            </h3>
            <div className="space-y-2.5">
              {data?.attentionRequired?.length > 0 ? (
                data.attentionRequired.map((att: any) => (
                  <div
                    key={att.id}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      att.severity === "critical"
                        ? "bg-red-50/50  border-red-200 "
                        : "bg-amber-50/50  border-amber-200 "
                    }`}
                  >
                    <p className="font-semibold text-gray-800 ">
                      {att.message}
                    </p>
                    <button
                      onClick={() => {
                        if (att.type === "evaluation_pending") onNavigate("assignments");
                        else if (att.type === "student_drop") onNavigate("students");
                        else onNavigate("curriculum");
                      }}
                      className="text-[11px] font-bold text-indigo-600  hover:underline flex items-center gap-1"
                    >
                      {att.action} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400 text-xs border border-dashed border-gray-100 rounded-xl">
                  No items require immediate attention.
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Mini */}
          <div className="bg-white  rounded-xl border border-gray-200  p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Recent Activity
            </h4>
            <div className="space-y-2.5 text-xs text-gray-600 ">
              {data?.recentActivity?.length > 0 ? (
                data.recentActivity.map((act: any) => (
                  <div key={act.id} className="flex items-start justify-between gap-2 pb-1.5 border-b border-gray-100  last:border-none">
                    <span>{act.text}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{act.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 text-xs py-2">
                  No recent activity recorded today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
