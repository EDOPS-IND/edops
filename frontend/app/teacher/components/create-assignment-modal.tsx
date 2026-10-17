"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, Send, Calendar, CheckSquare } from "lucide-react";
import { createTeacherAssignment, getTeacherClasses } from "../../edops-api";

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  defaultSectionId?: string;
  defaultSubjectId?: string;
  onSuccess?: () => void;
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  organizationId,
  defaultSectionId = "",
  defaultSubjectId = "",
  onSuccess,
}: CreateAssignmentModalProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState(defaultSectionId);
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [topic, setTopic] = useState("");
  const [dueAt, setDueAt] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [maxScore, setMaxScore] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen, organizationId]);

  async function loadClasses() {
    try {
      const res = await getTeacherClasses(organizationId);
      const list = res?.classes || [];
      setClasses(list);
      const selected = list.find((c: any) => c.sectionId === defaultSectionId && (!defaultSubjectId || c.subjectId === defaultSubjectId));
      if (selected) setSubjectId(selected.subjectId);
      if (list.length > 0 && !sectionId) {
        setSectionId(list[0].sectionId);
        setSubjectId(list[0].subjectId);
      }
    } catch {
      setClasses([]);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError("");
    setSaving(true);
    try {
      await createTeacherAssignment(organizationId, {
        title,
        description,
        sectionId,
        subjectId,
        topic,
        dueAt,
        maxScore: Number(maxScore),
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
      <div className="bg-white  rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200  space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 ">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 ">
              Coursework Authoring
            </span>
            <h3 className="text-lg font-bold text-gray-900 ">
              Create New Assignment
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p role="alert" className="text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-gray-700  block mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Exercise 4.2: Quadratic Formula Derivations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50  border border-gray-300  rounded-lg text-gray-900  focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700  block mb-1">
                Target Section
              </label>
              <select
                value={`${sectionId}:${subjectId}`}
                onChange={(e) => { const [section, subject] = e.target.value.split(":"); setSectionId(section); setSubjectId(subject); }}
                className="w-full px-2.5 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
              >
                {classes.length === 0 ? (
                  <option value="">No classes available</option>
                ) : (
                  classes.map((cls) => (
                    <option key={`${cls.sectionId}:${cls.subjectId}`} value={`${cls.sectionId}:${cls.subjectId}`}>
                      {cls.className || cls.name} ({cls.subjectName || cls.subject})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700  block mb-1">
                Max Marks
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700  block mb-1">
              Topic / Chapter
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-1.5 bg-gray-50  border border-gray-300  rounded-lg text-gray-900 "
            />
          </div>

          <div>
            <label className="font-bold text-gray-700  block mb-1">
              Instructions & Problem Questions
            </label>
            <textarea
              rows={3}
              placeholder="State the exercises, rubric requirements and submission format..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50  border border-gray-300  rounded-lg text-gray-900  focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              disabled={saving || !title.trim() || !sectionId || !subjectId}
              className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition"
            >
              {saving ? "Publishing..." : "Publish to Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
