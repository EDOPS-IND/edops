"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { getTeacherTodayTimetable, getTeacherWeeklyTimetable } from "../../edops-api";

interface TimetablePaneProps {
  organizationId: string;
  onTakeAttendance?: (sectionId?: string, periodNumber?: number, classSection?: string) => void;
  onLogLesson?: (classSection?: string, sectionId?: string) => void;
}

export function TimetablePane({ organizationId, onTakeAttendance, onLogLesson }: TimetablePaneProps) {
  const [viewMode, setViewMode] = useState<"today" | "weekly">("weekly");
  const [todayData, setTodayData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimetable();
  }, [organizationId]);

  async function loadTimetable() {
    setLoading(true);
    try {
      const [todayRes, weeklyRes] = await Promise.all([
        getTeacherTodayTimetable(organizationId),
        getTeacherWeeklyTimetable(organizationId),
      ]);
      setTodayData(todayRes);
      setWeeklyData(weeklyRes);
    } catch {
      setTodayData({ day: "today", slots: [] });
      setWeeklyData({ totalWeeklyPeriods: 0, maxWeeklyPeriods: 30, days: [], grid: {} });
    } finally {
      setLoading(false);
    }
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600 " />
            Teacher Timetable & Schedule Master
          </h2>
          <p className="text-xs text-gray-500  mt-0.5">
            Weekly period load: <strong className="text-indigo-600">{weeklyData?.totalWeeklyPeriods ?? 0} / {weeklyData?.maxWeeklyPeriods ?? 0} Periods</strong> (Assigned Load)
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setViewMode("today")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              viewMode === "today"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              viewMode === "weekly"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            Full Weekly Grid
          </button>
        </div>
      </div>

      {viewMode === "today" ? (
        <div className="bg-white  rounded-xl border border-gray-200  p-5 space-y-4">
          <h3 className="text-base font-bold text-gray-900 ">
            Today's Sequence of Periods
          </h3>
          <div className="space-y-3">
            {todayData?.slots?.length > 0 ? (
              todayData.slots.map((slot: any) => (
                <div
                  key={slot.period}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs hover:bg-slate-50/50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-slate-200">
                      P{slot.period}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 ">
                        {slot.classSection} • {slot.subject}
                      </h4>
                      <div className="text-xs text-gray-400 flex items-center gap-3 mt-0.5">
                        <span>{slot.startTime} – {slot.endTime}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {slot.room}</span>
                      </div>
                    </div>
                  </div>

                  {onTakeAttendance && (
                    <button
                      onClick={() => onTakeAttendance(slot.sectionId || "", slot.period)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-[#090D16] hover:bg-[#131C31] shadow-xs border border-[#1A243D] transition-colors"
                      style={{ color: "#FFFFFF" }}
                    >
                      Take Attendance
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                No instructional periods scheduled for today.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Weekly Grid */
        <div className="bg-white  rounded-xl border border-gray-200  p-5 overflow-x-auto">
          <div className="min-w-[700px] grid grid-cols-6 gap-3">
            {days.map((day) => {
              const daySlots = weeklyData?.grid?.[day] || [];
              return (
                <div key={day} className="space-y-2">
                  <div className="text-center py-2 bg-gray-50  rounded-lg text-xs font-black uppercase tracking-wider text-gray-700 ">
                    {day}
                  </div>
                  <div className="space-y-2">
                    {daySlots.length > 0 ? (
                      daySlots.map((s: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-xs space-y-1 transition ${
                            s.class.includes("Free")
                              ? "bg-gray-50/50  border-dashed border-gray-200 text-gray-400"
                              : s.class.includes("Test")
                              ? "bg-purple-50  border-purple-200 text-purple-900 "
                              : s.class.includes("Substitution")
                              ? "bg-amber-50  border-amber-200 text-amber-900 "
                              : "bg-white  border-gray-200  hover:border-indigo-400"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                            <span>P{s.period}</span>
                            <span>{s.room}</span>
                          </div>
                          <div className="font-bold text-gray-900  leading-tight">
                            {s.class}
                          </div>
                          {s.subject && (
                            <div className="text-[11px] text-indigo-600  font-semibold">
                              {s.subject}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-400 text-[11px] border border-dashed border-gray-100 rounded-xl">
                        No periods
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
