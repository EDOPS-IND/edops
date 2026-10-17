"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, BookOpen } from "lucide-react";
import { getTeacherClasses, recordTeacherLessonDelivery } from "../../edops-api";

interface LessonCompletionModalProps {
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

export function LessonCompletionModal({
  isOpen,
  onClose,
  organizationId,
  sectionId = "",
  subjectId = "",
  classSectionName,
  classSection,
  periodNumber = 1,
  onSuccess,
}: LessonCompletionModalProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selection, setSelection] = useState("");
  useEffect(() => {
    if (isOpen) getTeacherClasses(organizationId).then(res => {
      const rows = res.classes || [];
      setClasses(rows);
      const selected = rows.find((c: any) => c.sectionId === sectionId && (!subjectId || c.subjectId === subjectId)) || rows[0];
      setSelection(selected ? `${selected.sectionId}:${selected.subjectId}` : "");
    }).catch(() => setClasses([]));
  }, [isOpen, organizationId, sectionId, subjectId]);
  const activeClassName = classSection || classSectionName || "Active Class";
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [topicsCovered, setTopicsCovered] = useState("");
  const [participationPct, setParticipationPct] = useState<number | "">("");
  const [homeworkAssigned, setHomeworkAssigned] = useState("");
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicsCovered.trim()) return;

    setError("");
    setSaving(true);
    try {
      await recordTeacherLessonDelivery(organizationId, {
        sectionId: selection.split(":")[0],
        subjectId: selection.split(":")[1],
        deliveryDate,
        periodNumber,
        topicsCovered,
        participationPct: Number(participationPct),
        homeworkAssigned,
        reflection,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white  rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200  space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 ">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 ">
              Curriculum Execution Log
            </span>
            <h3 className="text-lg font-bold text-gray-900 ">
              Mark Lesson Completed — {activeClassName}
            </h3>
            <p className="text-gray-500">Period {periodNumber} • {deliveryDate}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p role="alert" className="text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label>Class and subject<select required value={selection} onChange={e => setSelection(e.target.value)} className="w-full border rounded-lg p-2"><option value="">Select an assigned class</option>{classes.map(c => <option key={`${c.sectionId}:${c.subjectId}`} value={`${c.sectionId}:${c.subjectId}`}>{c.className} · {c.subjectName}</option>)}</select></label>
          <div>
            <label className="font-bold text-gray-700  block mb-1">
              Topics & Concepts Delivered *
            </label>
            <input
              type="text"
              required
              value={topicsCovered}
              onChange={(e) => setTopicsCovered(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700  block mb-1">
                Student Participation (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={participationPct}
                required
                onChange={(e) => setParticipationPct(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
              />
            </div>

            <div>
              <label className="font-bold text-gray-700  block mb-1">
                Homework Assigned
              </label>
              <input
                type="text"
                value={homeworkAssigned}
                onChange={(e) => setHomeworkAssigned(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700  block mb-1">
              Teacher Pedagogical Reflection & Notes
            </label>
            <textarea
              rows={3}
              placeholder="What went well? Any concept gaps observed during the period?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 ">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-semibold text-gray-600  hover:bg-gray-100 :bg-gray-750 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selection}
              className="px-4 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition"
            >
              {saving ? "Recording..." : "Record Lesson Completion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
