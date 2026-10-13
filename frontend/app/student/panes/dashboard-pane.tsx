'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Trophy,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { getStudentDashboard } from '../../edops-api';
import { StudentTab } from '../types';

interface DashboardPaneProps {
  organizationId: string;
  onNavigateTab: (tab: StudentTab) => void;
  onSubmitAssignment: (assignment?: any) => void;
  onStartArena: (activity?: any) => void;
  onOpenLecture: (lecture?: any) => void;
}

export const DashboardPane: React.FC<DashboardPaneProps> = ({
  organizationId,
  onNavigateTab,
  onSubmitAssignment,
  onStartArena,
  onOpenLecture,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [organizationId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await getStudentDashboard(organizationId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Loading your personal learning command center...
      </div>
    );
  }

  const enrollment = data?.enrollment || {
    classSection: 'Active Section',
    academicYear: '2026-27',
    rollNumber: '01',
    classTeacher: 'Faculty',
  };

  const kpis = data?.kpis || {
    overallAttendance: 0,
    academicAverage: 0,
    improvement: 0,
    assignmentCompletion: 0,
    assignmentsPending: 0,
    curriculumProgress: 0,
  };

  const nextClass = data?.nextClass || {
    subject: 'Instructional Period',
    teacher: 'Faculty',
    room: 'Room',
    startTime: '09:00 AM',
    endTime: '09:45 AM',
    topic: 'Scheduled Session',
    lessonStatus: 'Active',
  };

  const timetable = data?.timetable || [];
  const pendingTasks = data?.pendingTasks || [];
  const alerts = data?.alerts || [];

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Good Morning, {data?.studentName || "Student"} 👋</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20">
              Roll No: {enrollment.rollNumber}
            </span>
          </div>
          <p className="text-xs md:text-sm text-indigo-100 mt-1">
            {enrollment.classSection} • Academic Year {enrollment.academicYear} • Class Teacher: {enrollment.classTeacher}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('assignments')}
            style={{ backgroundColor: '#FFFFFF', color: '#3730A3' }}
            className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm"
          >
            Submit Homework ({kpis.assignmentsPending})
          </button>
          <button
            onClick={() => onNavigateTab('arena')}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)' }}
            className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/25 transition-colors"
          >
            Practice Arena
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Attendance */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Attendance</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">Active</span>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {kpis.overallAttendance}%
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold">&ge; 75% CBSE</span> threshold met
          </p>
        </div>

        {/* Academic Average */}
        <div
          onClick={() => onNavigateTab('performance')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Overall Score</span>
            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +{kpis.improvement}%
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {kpis.academicAverage}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Previous: 77% (Term 1)</p>
        </div>

        {/* Assignments */}
        <div
          onClick={() => onNavigateTab('assignments')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Assignments</span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
              {kpis.assignmentsPending} Pending
            </span>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {kpis.assignmentCompletion}%
          </div>
          <p className="text-xs text-slate-400 mt-1">27 submitted of 30 total</p>
        </div>

        {/* Curriculum */}
        <div
          onClick={() => onNavigateTab('curriculum')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Curriculum</span>
            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">On Track</span>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            {kpis.curriculumProgress}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Chapter 4 of 7 completed</p>
        </div>
      </div>

      {/* Next Class Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                Next Class
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {nextClass.startTime} – {nextClass.endTime} • Room {nextClass.room}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {nextClass.subject}: <span className="font-normal text-slate-600">{nextClass.topic}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Teacher: <span className="font-semibold text-slate-700">{nextClass.teacher}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('subjects')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Subject Details
          </button>
          <button
            onClick={() => onNavigateTab('resources')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Study Notes
          </button>
        </div>
      </div>

      {/* Split Row: Today's Timetable & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-900 text-sm">Today&apos;s Lectures</h3>
            </div>
            <button
              onClick={() => onNavigateTab('timetable')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <span>Weekly Grid</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {timetable.map((p: any, idx: number) => {
              const status = (p.status || 'upcoming').toLowerCase();
              return (
                <div
                  key={idx}
                  className={`p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    status === 'now' ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                      P{p.periodNumber || p.period || (idx + 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{p.subjectName || p.subject || 'Subject'}</h4>
                        {status === 'now' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-600 text-white animate-pulse">
                            NOW
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {p.startTime ? `${p.startTime} - ${p.endTime}` : (p.time || '08:30 - 09:15')} • {p.teacherName || p.teacher || 'Faculty'} (Room {p.room || '302'})
                      </p>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        status === 'completed'
                          ? 'bg-slate-100 text-slate-500'
                          : status === 'now'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Tasks & Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Action Items</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">{pendingTasks.length} Due</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingTasks.map((task: any) => (
              <div key={task.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 leading-tight">{task.title}</h4>
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      task.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Due: {task.dueDate}</span>
                  <button
                    onClick={() => {
                      if (task.type === 'assignment') onSubmitAssignment({ id: task.id, title: task.title });
                      else if (task.type === 'arena') onStartArena({ id: task.id, title: task.title });
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Start →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages from Teachers & Academic Office */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Teacher Directives & In-App Messages</h3>
          </div>
          <button
            onClick={() => onNavigateTab('communication')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            Open Academic Inbox ({data?.recentMessages?.length || 0}) →
          </button>
        </div>

        {data?.recentMessages && data.recentMessages.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.recentMessages.map((m: any) => (
              <div
                key={m.id}
                onClick={() => onNavigateTab('communication')}
                className="py-3 cursor-pointer hover:bg-slate-50 rounded-lg px-2 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{m.senderName}</span>
                  <span className="text-[10px] text-slate-400">{m.date}</span>
                </div>
                <div className="text-xs font-semibold text-indigo-600">{m.subjectLine}</div>
                <p className="text-xs text-slate-600 line-clamp-2">{m.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-400">
            No unread directives or messages. All caught up!
          </div>
        )}
      </div>

      {/* Academic Alerts Banner */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Academic Radar & Notices</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                alert.type === 'warning'
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : alert.type === 'exam'
                  ? 'bg-purple-50/50 border-purple-200 text-purple-950'
                  : 'bg-blue-50/50 border-blue-200 text-blue-950'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
              <div>
                <h4 className="font-bold">{alert.title}</h4>
                <p className="mt-0.5 opacity-90">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
