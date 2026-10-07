"use client";

import React, { useState } from "react";
import { X, CheckCircle, BookOpen } from "lucide-react";
import { recordTeacherLessonDelivery } from "../../edops-api";

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
  subjectId = "sub-math",
  classSectionName,
  classSection,
  periodNumber = 1,
  onSuccess,
}: LessonCompletionModalProps) {
  const activeClassName = classSection || classSectionName || "Active Class";
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [topicsCovered, setTopicsCovered] = useState("Quadratic Equations: Factorization method & solving roots");
  const [participationPct, setParticipationPct] = useState(90);
  const [homeworkAssigned, setHomeworkAssigned] = useState("Exercise 4.2 Q1 to Q6");
  const [reflection, setReflection] = useState("Good engagement; need quick 5-min recap on negative roots next period.");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicsCovered.trim()) return;

    setSaving(true);
    try {
      await recordTeacherLessonDelivery(organizationId, {
        sectionId,
        subjectId,
        deliveryDate,
        periodNumber,
        topicsCovered,
        participationPct: Number(participationPct),
        homeworkAssigned,
        reflection,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      if (onSuccess) onSuccess();
      onClose();
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                onChange={(e) => setParticipationPct(Number(e.target.value))}
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
              disabled={saving}
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
