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
import { getTeacherAttendance, getTeacherClasses } from "../../edops-api";

interface AttendancePaneProps {
  organizationId: string;
  onTakeAttendance: (sectionId: string, periodNumber?: number) => void;
  onContactParent?: (studentName: string) => void;
}

export function AttendancePane({
  organizationId,
  onTakeAttendance,
  onContactParent,
}: AttendancePaneProps) {
  const [data, setData] = useState<any>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
    loadClasses();
  }, [organizationId]);

  async function loadClasses() {
    try {
      const clsRes = await getTeacherClasses(organizationId);
      if (clsRes?.classes?.length > 0) {
        setDefaultSectionId(clsRes.classes[0].sectionId);
      }
    } catch {
      setDefaultSectionId("");
    }
  }

  async function loadAttendance() {
    setLoading(true);
    try {
      const res = await getTeacherAttendance(organizationId);
      setData(res);
    } catch {
      setData({
        todayStatus: {
          classesTotal: 0,
          classesMarked: 0,
          pendingMarking: 0,
          overallAttendancePct: 0,
        },
        recentSessions: [],
        defaultersAlerts: [],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-indigo-600 " />
            Class Attendance & Register Verification
          </h2>
          <p className="text-xs text-gray-500  mt-0.5">
            Real-time period attendance tracking and statutory CBSE 75% minimum threshold monitoring
          </p>
        </div>

        <button
          onClick={() => onTakeAttendance(defaultSectionId || data?.recentSessions?.[0]?.sectionId || "", 1)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
        >
          + Take Period Attendance
        </button>
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
