"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  GraduationCap,
  Calendar,
  ClipboardList,
  Award,
  AlertTriangle,
  Mail,
  ShieldCheck,
  TrendingUp,
  FileText
} from "lucide-react";
import { getTeacherStudent360 } from "../../edops-api";

interface StudentDossierDrawerProps {
  isOpen?: boolean;
  studentId: string | null;
  organizationId: string;
  onClose: () => void;
  onOpenIntervention?: (studentId: string) => void;
}

export function StudentDossierDrawer({
  isOpen,
  studentId,
  organizationId,
  onClose,
  onOpenIntervention,
}: StudentDossierDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "assessments" | "assignments" | "competencies" | "interventions">("overview");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (studentId) {
      loadDossier();
    }
  }, [studentId, organizationId]);

  if (!isOpen || !studentId) {
    return null;
  }

  async function loadDossier() {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await getTeacherStudent360(organizationId, studentId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white  shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-200  flex items-start justify-between bg-gray-50/70 ">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800  ">
                Roll #{data?.student?.rollNumber || "03"}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800  ">
                {data?.subjectScope?.status || "On Track"}
              </span>
              <span className="text-xs text-gray-500">
                {data?.student?.classSection} • {data?.subjectScope?.subjectName}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 ">
              {data?.student?.name || "Student Academic Profile"}
            </h2>
            <p className="text-xs text-gray-500">
              Guardian: {data?.student?.guardianName} • Subject Scope: {data?.subjectScope?.subjectName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200  px-5 gap-4 text-xs font-semibold">
          {[
            { id: "overview", label: "Subject Overview" },
            { id: "assessments", label: "Tests & Scores" },
            { id: "assignments", label: "Coursework" },
            { id: "competencies", label: "Competencies" },
            { id: "interventions", label: "Remedial & Support" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 border-b-2 transition ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 "
                  : "border-transparent text-gray-500 hover:text-gray-800 :text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading student dossier...</div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* KPI Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-indigo-50  rounded-xl border border-indigo-100 ">
                      <div className="text-[10px] font-bold uppercase text-indigo-600">Subject Average</div>
                      <div className="text-2xl font-black text-indigo-950  mt-0.5">
                        {data?.subjectScope?.currentAverage}%
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                        {data?.subjectScope?.improvementPct} vs last term
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50  rounded-xl border border-emerald-100 ">
                      <div className="text-[10px] font-bold uppercase text-emerald-600">Attendance</div>
                      <div className="text-2xl font-black text-emerald-950  mt-0.5">
                        {data?.attendance?.subjectAttendancePct}%
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-0.5">
                        {data?.attendance?.classesAttended} / {data?.attendance?.totalClassesConducted} periods
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50  rounded-xl border border-amber-100 ">
                      <div className="text-[10px] font-bold uppercase text-amber-600">Assignments</div>
                      <div className="text-2xl font-black text-amber-950  mt-0.5">
                        {data?.assignments?.completionRate}%
                      </div>
                      <div className="text-[11px] text-amber-600 mt-0.5">
                        {data?.assignments?.submitted} / {data?.assignments?.totalAssigned} submitted
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-emerald-50/50  border border-emerald-200  rounded-xl space-y-1.5">
                      <h4 className="font-bold text-emerald-800 ">Observed Strengths:</h4>
                      <ul className="list-disc pl-4 space-y-1 text-emerald-900  text-[11px]">
                        {data?.strengths?.map((str: string, i: number) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 bg-red-50/50  border border-red-200  rounded-xl space-y-1.5">
                      <h4 className="font-bold text-red-800 ">Gaps Requiring Attention:</h4>
                      <ul className="list-disc pl-4 space-y-1 text-red-900  text-[11px]">
                        {data?.weakAreas?.map((gap: string, i: number) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "assessments" && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 ">Recent Subject Assessments</h4>
                  <div className="border border-gray-200  rounded-xl divide-y divide-gray-100 ">
                    {data?.assessments?.map((asmt: any, i: number) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 ">{asmt.name}</div>
                          <div className="text-gray-400 text-[11px]">Date: {asmt.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-indigo-600">
                            {asmt.score} / {asmt.maxMarks} ({asmt.percentage}%)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "competencies" && (
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 ">Competency-Based Evaluation</h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {data?.competencies?.map((c: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50  rounded-xl border border-gray-200 ">
                        <div className="flex items-center justify-between font-bold text-gray-900 ">
                          <span>{c.competency}</span>
                          <span className="text-indigo-600">{c.level}</span>
                        </div>
                        <p className="text-gray-500 text-[11px] mt-1">{c.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "interventions" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 ">Active Interventions & Remedials</h4>
                    {onOpenIntervention && (
                      <button
                        onClick={() => onOpenIntervention(studentId)}
                        className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        + Create Remedial Action
                      </button>
                    )}
                  </div>
                  {data?.activeInterventions?.map((inv: any, i: number) => (
                    <div key={i} className="p-3.5 bg-amber-50  border border-amber-200  rounded-xl space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-900 ">
                        <span>{inv.type}: {inv.problemArea}</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">{inv.status}</span>
                      </div>
                      <p className="text-gray-600 ">Goal: {inv.goal}</p>
                      <div className="text-gray-400 text-[11px]">Review Date: {inv.reviewDate}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Action Bar */}
        <div className="p-4 border-t border-gray-200  flex items-center justify-between bg-gray-50 ">
          <span className="text-[11px] text-gray-400 font-medium">
            Subject-scoped access compliant with NEP-2020 student privacy
          </span>
          <div className="flex gap-2">
            {onOpenIntervention && (
              <button
                onClick={() => onOpenIntervention(studentId)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Assign Remedial Support
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600  hover:bg-gray-200 :bg-gray-800 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
