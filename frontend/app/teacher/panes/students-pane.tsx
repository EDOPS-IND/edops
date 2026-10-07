"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Award,
  ChevronRight,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { getTeacherStudents } from "../../edops-api";

interface StudentsPaneProps {
  organizationId: string;
  onOpenDossier: (studentId: string) => void;
  onOpenIntervention: (studentId?: string) => void;
}

export function StudentsPane({
  organizationId,
  onOpenDossier,
  onOpenIntervention,
}: StudentsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"at_risk" | "improving" | "top">("at_risk");

  useEffect(() => {
    loadStudents();
  }, [organizationId]);

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await getTeacherStudents(organizationId);
      setData(res);
    } catch {
      setData({
        classificationSummary: {
          strong: 0,
          onTrack: 0,
          needsSupport: 0,
          interventionRecommended: 0,
        },
        atRiskStudents: [],
        topPerformers: [],
        improvingStudents: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const summary = data?.classificationSummary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 " />
            Student Academic Cohorts & Intervention Radar
          </h2>
          <p className="text-xs text-gray-500  mt-0.5">
            Identify at-risk learning gaps, track student trajectories, and coordinate targeted remedial support
          </p>
        </div>

        <button
          onClick={() => onOpenIntervention()}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
        >
          + Create Remedial Action
        </button>
      </div>

      {/* Cohort Classification Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50  border border-emerald-200  rounded-xl">
          <span className="text-[10px] font-bold uppercase text-emerald-700">Strong Cohort</span>
          <div className="text-2xl font-black text-emerald-800  mt-1">{summary?.strong ?? 0}</div>
          <span className="text-[11px] text-emerald-700">Consistently exceeding targets</span>
        </div>

        <div className="p-4 bg-blue-50  border border-blue-200  rounded-xl">
          <span className="text-[10px] font-bold uppercase text-blue-700">On Track Cohort</span>
          <div className="text-2xl font-black text-blue-800  mt-1">{summary?.onTrack ?? 0}</div>
          <span className="text-[11px] text-blue-700">Meeting syllabus benchmarks</span>
        </div>

        <div className="p-4 bg-amber-50  border border-amber-200  rounded-xl">
          <span className="text-[10px] font-bold uppercase text-amber-700">Needs Support</span>
          <div className="text-2xl font-black text-amber-800  mt-1">{summary?.needsSupport ?? 0}</div>
          <span className="text-[11px] text-amber-700">Specific topic gaps observed</span>
        </div>

        <div className="p-4 bg-red-50  border border-red-200  rounded-xl">
          <span className="text-[10px] font-bold uppercase text-red-700">Intervention Req.</span>
          <div className="text-2xl font-black text-red-800  mt-1">{summary?.interventionRecommended ?? 0}</div>
          <span className="text-[11px] text-red-700">Multiple indicators below benchmark</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200  gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab("at_risk")}
          className={`py-2.5 border-b-2 transition ${
            activeTab === "at_risk"
              ? "border-red-600 text-red-600 "
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          At-Risk & Support Needed ({data?.atRiskStudents?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("improving")}
          className={`py-2.5 border-b-2 transition ${
            activeTab === "improving"
              ? "border-indigo-600 text-indigo-600 "
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          High Improvement Trajectory ({data?.improvingStudents?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("top")}
          className={`py-2.5 border-b-2 transition ${
            activeTab === "top"
              ? "border-emerald-600 text-emerald-600 "
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Top Academic Performers ({data?.topPerformers?.length ?? 0})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "at_risk" && (
        data?.atRiskStudents?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.atRiskStudents.map((s: any) => (
              <div key={s.id} className="p-4 bg-white rounded-xl border border-red-200 space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{s.name}</h4>
                    <span className="text-gray-400 text-[11px]">{s.classSection} • Roll #{s.rollNumber}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                    {s.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-red-50/50 rounded-xl">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Subject Avg</span>
                    <strong className="text-red-600 text-sm">{s.subjectAverage}%</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Attendance</span>
                    <strong className="text-amber-600 text-sm">{s.attendance}%</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-gray-400 font-medium">Observed Learning Gap:</span>
                  <p className="text-gray-800">{s.primaryGap}</p>
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <button
                    onClick={() => onOpenIntervention(s.id)}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    {s.remedialAssigned ? "Active Remedial" : "+ Assign Remedial"}
                  </button>
                  <button
                    onClick={() => onOpenDossier(s.id)}
                    className="font-semibold text-gray-500 hover:text-gray-900"
                  >
                    Dossier 360 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
            No at-risk students identified for this section.
          </div>
        )
      )}

      {activeTab === "improving" && (
        data?.improvingStudents?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.improvingStudents.map((s: any) => (
              <div key={s.id} className="p-4 bg-white rounded-xl border border-gray-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{s.name}</h4>
                    <span className="text-gray-400">{s.classSection} • Roll #{s.rollNumber}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {s.improvement} Gain
                  </span>
                </div>

                <p className="p-3 bg-gray-50 rounded-xl text-gray-600">
                  "{s.note}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span>Current: <strong>{s.subjectAverage}%</strong> (Previous: {s.previousAverage}%)</span>
                  <button
                    onClick={() => onOpenDossier(s.id)}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    View Trajectory →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
            No high-momentum improvement students flagged currently.
          </div>
        )
      )}

      {activeTab === "top" && (
        data?.topPerformers?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.topPerformers.map((s: any) => (
              <div key={s.id} className="p-4 bg-white rounded-xl border border-emerald-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{s.name}</h4>
                    <span className="text-gray-400">{s.classSection} • Roll #{s.rollNumber}</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600">{s.subjectAverage}%</span>
                </div>

                <div className="p-2.5 bg-emerald-50/50 rounded-xl text-emerald-900">
                  {s.highlights}
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <button
                    onClick={() => onOpenDossier(s.id)}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    Inspect Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
            No top performers recorded yet for this criteria.
          </div>
        )
      )}
    </div>
  );
}
