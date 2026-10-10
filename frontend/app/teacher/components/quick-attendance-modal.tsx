"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Clock, UserX, AlertCircle } from "lucide-react";
import { markTeacherAttendance, getTeacherClassDetails } from "../../edops-api";

interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  sectionId?: string;
  subjectId?: string;
  classSectionName?: string;
  classSection?: string;
  periodNumber?: number;
  onSuccess?: () => void;
}

export function QuickAttendanceModal({
  isOpen,
  onClose,
  organizationId,
  sectionId = "",
  subjectId = "",
  classSectionName,
  classSection,
  periodNumber = 1,
  onSuccess,
}: QuickAttendanceModalProps) {
  const activeClassName = classSection || classSectionName || "Active Class";
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const period = periodNumber || 1;
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [students, setStudents] = useState<Array<{ id: string; name: string; roll: string; status: "present" | "absent" | "late" | "excused" }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && sectionId) {
      loadSectionRoster();
    }
  }, [isOpen, sectionId, organizationId]);

  async function loadSectionRoster() {
    try {
      const res = await getTeacherClassDetails(organizationId, sectionId);
      if (res?.students && res.students.length > 0) {
        setStudents(
          res.students.map((s: any) => ({
            id: s.id,
            name: s.name,
            roll: s.rollNumber || "01",
            status: "present" as const,
          }))
        );
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    }
  }

  if (!isOpen) return null;

  const toggleStatus = (id: string, status: "present" | "absent" | "late" | "excused") => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const markAll = (status: "present" | "absent") => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await markTeacherAttendance(organizationId, {
        sectionId,
        subjectId: subjectId || undefined,
        date,
        period,
        records: students.map((s) => ({ studentId: s.id, status: s.status })),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Attendance for this class period has already been finalized today. Duplicate attendance is not allowed.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Period Register
              </span>
              <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                Slot: P{period}·{date}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">
              Take Attendance — {activeClassName}
            </h3>
            <p className="text-xs text-gray-500">
              Date: {date} • Period {period} • Unique Schedule Check Active
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Bulk Actions */}
        <div className="flex items-center justify-between bg-gray-50  p-2.5 rounded-xl text-xs">
          <div className="font-medium text-gray-600 ">
            Summary: <strong className="text-emerald-600">{presentCount} Present</strong>,{" "}
            <strong className="text-red-600">{absentCount} Absent</strong>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => markAll("present")}
              className="px-2.5 py-1 font-semibold rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
            >
              Mark All Present
            </button>
            <button
              onClick={() => markAll("absent")}
              className="px-2.5 py-1 font-semibold rounded bg-red-100 text-red-800 hover:bg-red-200 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Student Register */}
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100  border border-gray-200  rounded-xl">
          {students.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No enrolled students found in {activeClassName}.
            </div>
          ) : (
            students.map((student) => (
            <div key={student.id} className="p-2.5 flex items-center justify-between hover:bg-gray-50 :bg-gray-800/50">
              <div className="flex items-center gap-2.5">
                <span className="w-6 text-center text-xs font-mono font-bold text-gray-400">
                  {student.roll}
                </span>
                <span className="text-xs font-semibold text-gray-900 ">
                  {student.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {(["present", "absent", "late"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => toggleStatus(student.id, st)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded capitalize transition ${
                      student.status === st
                        ? st === "present"
                          ? "bg-emerald-600 text-white"
                          : st === "absent"
                          ? "bg-red-600 text-white"
                          : "bg-amber-500 text-white"
                        : "bg-gray-100  text-gray-600 "
                    }`}
                  >
                    {st}
                  </button>
                ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-600  hover:bg-gray-100 :bg-gray-750 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition"
          >
            {saving ? "Finalizing Register..." : "Finalize & Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
