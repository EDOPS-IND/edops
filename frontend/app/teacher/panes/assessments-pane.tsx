"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Award,
  CheckCircle,
  FileCheck,
  Plus,
  Lock,
  Layers
} from "lucide-react";
import { getTeacherAssessments, submitTeacherMarks, getTeacherClassStudents, getTeacherClasses } from "../../edops-api";

interface AssessmentsPaneProps {
  organizationId: string;
}

export function AssessmentsPane({ organizationId }: AssessmentsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marksEntryOpen, setMarksEntryOpen] = useState(false);
  const [selectedAsmt, setSelectedAsmt] = useState<any>(null);

  // Marks Entry State
  const [scores, setScores] = useState<Array<{ id: string; name: string; roll: string; score: number; remarks: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, [organizationId]);

  async function loadAssessments() {
    setLoading(true);
    try {
      const res = await getTeacherAssessments(organizationId);
      setData(res);
    } catch {
      setData({ assessments: [] });
    } finally {
      setLoading(false);
    }
  }

  const handleOpenMarksEntry = async (asmt?: any) => {
    setSelectedAsmt(asmt || null);
    setMarksEntryOpen(true);
    try {
      let secId = asmt?.sectionId;
      if (!secId) {
        const clsRes = await getTeacherClasses(organizationId);
        secId = clsRes?.classes?.[0]?.sectionId || "";
      }
      const res = await getTeacherClassStudents(organizationId, secId);
      if (res?.students && res.students.length > 0) {
        setScores(
          res.students.map((st: any) => ({
            id: st.id,
            name: st.name,
            roll: st.rollNumber || "01",
            score: Math.round(Number(st.overallScore || 0)),
            remarks: "",
          }))
        );
      } else {
        setScores([]);
      }
    } catch {
      setScores([]);
    }
  };

  const handleSaveMarks = async (lockMarks: boolean) => {
    setSaving(true);
    try {
      let secId = selectedAsmt?.sectionId;
      if (!secId) {
        const clsRes = await getTeacherClasses(organizationId);
        secId = clsRes?.classes?.[0]?.sectionId || "";
      }
      await submitTeacherMarks(organizationId, {
        sectionId: secId,
        subjectId: selectedAsmt?.subjectCode || "sub-math",
        title: selectedAsmt?.title || "Assessment Marks",
        maxMarks: selectedAsmt?.maxMarks || 50,
        scores: scores.map((s) => ({ studentId: s.id, score: s.score, remarks: s.remarks })),
        lockMarks,
      });
      setMarksEntryOpen(false);
    } catch {
      setMarksEntryOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600 " />
            Assessments, Tests & Marks Management
          </h2>
          <p className="text-xs text-gray-500  mt-0.5">
            Conduct formative tests, verify blueprint compliance, and submit evaluated marks with tamper locks
          </p>
        </div>

        <button
          onClick={() => handleOpenMarksEntry(data?.assessments?.[0])}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
        >
          + Enter Assessment Marks
        </button>
      </div>

      {/* Assessments Grid */}
      {data?.assessments?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.assessments.map((asmt: any) => (
            <div key={asmt.id} className="p-5 bg-white  rounded-xl border border-gray-200  space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50  text-indigo-600">
                  {asmt.type}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  asmt.status.includes("Locked")
                    ? "bg-emerald-100 text-emerald-800  "
                    : "bg-blue-100 text-blue-800  "
                }`}>
                  {asmt.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-gray-900 ">{asmt.title}</h3>
                <p className="text-gray-500 text-[11px] mt-0.5">{asmt.classSection} • {asmt.date}</p>
              </div>

              {asmt.classAverage !== null ? (
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50  rounded-xl text-center">
                  <div>
                    <span className="text-gray-400 text-[10px] block">Average</span>
                    <strong className="text-indigo-600 font-bold">{asmt.classAverage} / {asmt.maxMarks}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">Highest</span>
                    <strong className="text-emerald-600 font-bold">{asmt.highestScore}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">Pass %</span>
                    <strong className="text-gray-900  font-bold">{asmt.passPercentage}%</strong>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50  rounded-xl text-center text-gray-400">
                  Scheduled for {asmt.date} (Max: {asmt.maxMarks} Marks)
                </div>
              )}

              <div className="pt-2 border-t border-gray-100  flex items-center justify-between text-gray-500">
                <span>Blueprint: Easy {asmt.blueprint?.easy}% • Med {asmt.blueprint?.medium}%</span>
                <button
                  onClick={() => handleOpenMarksEntry(asmt)}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Inspect Marks →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
          No formative assessments or test blueprints recorded yet.
        </div>
      )}

      {/* Marks Entry Modal */}
      {marksEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white  rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200  space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-600">Marks Entry Desk</span>
                <h3 className="text-base font-bold text-gray-900 ">
                  {selectedAsmt?.title || "Assessment Marks Entry"}
                </h3>
                <p className="text-gray-400 text-[11px]">{selectedAsmt?.classSection} • Max Marks: {selectedAsmt?.maxMarks || 50}</p>
              </div>
              <button onClick={() => setMarksEntryOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y border rounded-xl">
              {scores.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No enrolled students found in this section to record marks for.
                </div>
              ) : (
                scores.map((s, idx) => (
                <div key={s.id} className="p-2.5 flex items-center justify-between gap-3">
                  <div className="w-40">
                    <span className="font-mono text-gray-400 mr-1.5">{s.roll}</span>
                    <strong className="text-gray-900 ">{s.name}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={selectedAsmt?.maxMarks || 50}
                      value={s.score}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setScores((prev) => prev.map((item) => (item.id === s.id ? { ...item, score: val } : item)));
                      }}
                      className="w-16 px-2 py-1 border rounded text-center font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={s.remarks}
                      onChange={(e) => {
                        const val = e.target.value;
                        setScores((prev) => prev.map((item) => (item.id === s.id ? { ...item, remarks: val } : item)));
                      }}
                      className="w-48 px-2 py-1 border rounded"
                    />
                  </div>
                </div>
              )))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setMarksEntryOpen(false)}
                className="px-3 py-1.5 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveMarks(false)}
                disabled={saving}
                className="px-3.5 py-1.5 font-semibold border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSaveMarks(true)}
                disabled={saving}
                className="px-4 py-1.5 font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                Submit & Lock Marks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
