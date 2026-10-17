"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, Check } from "lucide-react";
import { createTeacherIntervention, getTeacherClassStudents, getTeacherClasses } from "../../edops-api";

interface CreateInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  defaultStudentId?: string;
  defaultSubjectId?: string;
  onSuccess?: () => void;
}

export function CreateInterventionModal({
  isOpen,
  onClose,
  organizationId,
  defaultStudentId = "",
  defaultSubjectId = "",
  onSuccess,
}: CreateInterventionModalProps) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [problemArea, setProblemArea] = useState("");
  const [evidence, setEvidence] = useState("");
  const [goal, setGoal] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");
  const [interventionType, setInterventionType] = useState("Remedial Practice");
  const [reviewDate, setReviewDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen, organizationId]);

  async function loadStudents() {
    try {
      const clsRes = await getTeacherClasses(organizationId);
      const firstSection = clsRes?.classes?.[0]?.sectionId;
      setSubjectId(clsRes?.classes?.[0]?.subjectId || "");
      if (!firstSection) { setStudents([]); return; }
      const res = await getTeacherClassStudents(organizationId, firstSection);
      const list = res?.students || [];
      setStudents(list);
      if (list.length > 0 && !studentId) {
        setStudentId(list[0].id);
      }
    } catch {
      setStudents([]);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createTeacherIntervention(organizationId, {
        studentId,
        subjectId,
        problemArea,
        evidence,
        goal,
        recommendedAction,
        interventionType,
        reviewDate,
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 ">
              Academic Support & Remedial
            </span>
            <h3 className="text-lg font-bold text-gray-900 ">
              Create Student Intervention
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p role="alert" className="text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700  block mb-1">
                Student
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
              >
                {students.length === 0 ? (
                  <option value="">No enrolled students</option>
                ) : (
                  students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.rollNumber ? `Roll ${st.rollNumber}` : 'Student'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700  block mb-1">
                Intervention Strategy
              </label>
              <select
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
              >
                <option value="Remedial Practice">Remedial Practice</option>
                <option value="Extra Class">Extra Class</option>
                <option value="One-to-One Support">One-to-One Support</option>
                <option value="Additional Assignment">Additional Assignment</option>
                <option value="Parent Discussion">Parent Discussion</option>
                <option value="Peer Support">Peer Support</option>
                <option value="Revision">Revision</option>
                <option value="Enrichment">Enrichment</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700  block mb-1">
              Targeted Academic Problem Area
            </label>
            <input
              type="text"
              required
              value={problemArea}
              onChange={(e) => setProblemArea(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
            />
          </div>

          <div>
            <label className="font-bold text-gray-700  block mb-1">
              Evidence from Assessments / Assignments
            </label>
            <input
              type="text"
              required
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
            />
          </div>

          <div>
            <label className="font-bold text-gray-700  block mb-1">
              Target Learning Goal
            </label>
            <input
              type="text"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700  block mb-1">
                Action to Execute
              </label>
              <input
                type="text"
                required
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
              />
            </div>

            <div>
              <label className="font-bold text-gray-700  block mb-1">
                Review Milestone Date
              </label>
              <input
                type="date"
                required
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
              />
            </div>
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
              disabled={saving || !studentId || !subjectId}
              className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition"
            >
              {saving ? "Registering..." : "Assign Intervention"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
