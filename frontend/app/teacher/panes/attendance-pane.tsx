"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Users,
  Clock,
  Mail,
  UserX,
  FileCheck
} from "lucide-react";
import { getTeacherAttendance, getTeacherClasses, getTeacherTodayTimetable } from "../../edops-api";

interface AttendancePaneProps {
  organizationId: string;
  onTakeAttendance: (sectionId: string, periodNumber?: number, classSection?: string) => void;
  onContactParent?: (studentName: string) => void;
}

export function AttendancePane({
  organizationId,
  onTakeAttendance,
  onContactParent,
}: AttendancePaneProps) {
  const [data, setData] = useState<any>(null);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  async function loadData() {
    setLoading(true);
    try {
      const [attRes, ttRes, clsRes] = await Promise.all([
        getTeacherAttendance(organizationId).catch(() => null),
        getTeacherTodayTimetable(organizationId).catch(() => null),
        getTeacherClasses(organizationId).catch(() => null),
      ]);
      if (attRes) setData(attRes);
      if (ttRes?.slots) {
        setTodaySlots(ttRes.slots);
        setActiveSlot(ttRes.activeSlot || null);
      }
      if (clsRes?.classes?.length > 0) {
        setDefaultSectionId(clsRes.classes[0].sectionId);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-indigo-600" />
            Class Attendance & Register Verification
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time period attendance tracking and statutory CBSE 75% minimum threshold monitoring
          </p>
        </div>

        {activeSlot ? (
          <button
            onClick={() => onTakeAttendance(activeSlot.sectionId, activeSlot.period, activeSlot.classSection)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Take Attendance: {activeSlot.classSection} (Period {activeSlot.period})
          </button>
        ) : todaySlots.length > 0 && todaySlots.every((s) => s.attendanceTaken) ? (
          <div className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            All Classes Finalized Today
          </div>
        ) : (
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            No Active Class Right Now
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Today's Attendance</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{data?.todayStatus?.overallAttendancePct ?? 0}%</div>
          <span className="text-xs text-gray-500">Across marked classes</span>
        </div>

        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Registers Finalized</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{data?.todayStatus?.classesMarked ?? 0} / {data?.todayStatus?.classesTotal ?? 0}</div>
          <span className="text-xs text-gray-500">Completed periods</span>
        </div>

        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Registers Pending</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{data?.todayStatus?.pendingMarking ?? 0}</div>
          <span className="text-xs text-amber-600 font-semibold">Action required</span>
        </div>

        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Threshold Breaches (&lt;75%)</span>
          <div className="text-2xl font-black text-red-600 mt-1">{data?.defaultersAlerts?.length ?? 0}</div>
          <span className="text-xs text-red-600 font-semibold">CBSE exam risk</span>
        </div>
      </div>

      {/* Today's Timetable Periods & Attendance Status */}
      {todaySlots.length > 0 && (
        <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-gray-900">
                Today's Class Schedule & Register Verification
              </h3>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              Verified by Timetable Schedule
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaySlots.map((slot) => {
              const isFinalized = slot.attendanceTaken;
              const isActive = slot.status === "active";
              return (
                <div
                  key={slot.id || `${slot.period}-${slot.sectionId}`}
                  className={`p-3 rounded-xl border transition ${
                    isFinalized
                      ? "bg-emerald-50/40 border-emerald-200"
                      : isActive
                      ? "bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200"
                      : "bg-gray-50/60 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-900">Period {slot.period}: {slot.classSection}</span>
                    <span className="text-gray-500 font-normal">{slot.startTime} – {slot.endTime}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{slot.subject} • {slot.room}</div>
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                    {isFinalized ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Finalized
                      </span>
                    ) : isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        ● Live Period
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {slot.status === "upcoming" ? "Upcoming" : "Pending Marking"}
                      </span>
                    )}

                    {isFinalized ? (
                      <span className="text-[11px] font-semibold text-emerald-600">
                        Recorded ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onTakeAttendance(slot.sectionId, slot.period, slot.classSection)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
                      >
                        Take Attendance →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Defaulters Alert Docket */}
      <div className="p-4 bg-red-50/50  border border-red-200  rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <h3 className="font-bold text-sm text-red-900 ">
            Attendance Defaulters Alert Center (Below 75%)
          </h3>
        </div>

        {data?.defaultersAlerts?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {data.defaultersAlerts.map((def: any) => (
              <div key={def.id} className="p-3 bg-white  rounded-xl border border-red-200  space-y-1.5">
                <div className="flex items-center justify-between font-bold text-gray-900 ">
                  <span>{def.studentName}</span>
                  <span className="text-red-600 font-black">{def.attendancePct}%</span>
                </div>
                <div className="text-gray-500 text-[11px]">{def.classSection} • {def.totalAbsences} cumulative absences</div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-red-700 bg-red-100  px-2 py-0.5 rounded">
                    {def.status}
                  </span>
                  {onContactParent && (
                    <button
                      onClick={() => onContactParent(def.studentName)}
                      className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" /> Message Guardian
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 text-xs bg-white rounded-xl border border-gray-100">
            No students currently below the statutory 75% attendance threshold.
          </div>
        )}
      </div>

      {/* Recent Finalized Registers Table */}
      <div className="bg-white  rounded-xl border border-gray-200  p-5 space-y-4">
        <h3 className="text-base font-bold text-gray-900 ">
          Recent Period Registers
        </h3>

        <div className="overflow-x-auto border border-gray-200  rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50  text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200 ">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Present</th>
                <th className="py-3 px-4">Absent</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 ">
              {data?.recentSessions?.length > 0 ? (
                data.recentSessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 :bg-gray-750/50">
                    <td className="py-3 px-4 font-mono">{s.date}</td>
                    <td className="py-3 px-4 font-bold">P{s.period}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 ">{s.classSection}</td>
                    <td className="py-3 px-4 text-indigo-600 font-medium">{s.subject}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{s.present}</td>
                    <td className="py-3 px-4 font-bold text-red-600">{s.absent}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800   px-2 py-0.5 rounded-full">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No period registers recorded yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
