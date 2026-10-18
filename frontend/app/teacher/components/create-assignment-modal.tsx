"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, Calendar } from "lucide-react";
import { createTeacherAssignment, getTeacherClasses } from "../../edops-api";

const S = {
  navy: "#0c1e33",
  slate: "#495d72",
  muted: "#a6abb5",
  faint: "#b3b3b3",
  pageBg: "#f4f6f7",
  white: "#ffffff",
  border: "#e4e6e9",
  line: "#ced8e5",
  chip: "#f5f6f8",
  blue: "#17a1fa",
  coralBg: "#ffd8c7",
  coralDark: "#782a00",
};

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
  const [dueAt, setDueAt] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
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
      setError(err?.message || "Could not save assignment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(12, 30, 51, 0.45)",
        backdropFilter: "blur(2px)",
        padding: "16px",
        boxSizing: "border-box",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: S.white,
          border: `1px solid ${S.border}`,
          borderRadius: "14px",
          boxShadow: "0 20px 40px rgba(12, 30, 51, 0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "24px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: `1px solid ${S.line}`, paddingBottom: "14px" }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: S.navy, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
              Coursework Authoring
            </span>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: S.navy }}>
              Create New Assignment
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: S.slate }}>
              Publish exercises and homework with deadlines to class rosters.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: S.slate,
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: "10px 12px", borderRadius: "8px", background: S.coralBg, color: S.coralDark, fontSize: "12px", border: `1px solid rgba(120,42,0,0.2)` }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "12px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
              Assignment Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Exercise 4.2: Quadratic Formula Derivations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${S.line}`,
                borderRadius: "8px",
                fontSize: "12px",
                color: S.navy,
                background: S.white,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
                Target Section *
              </label>
              <select
                value={`${sectionId}:${subjectId}`}
                onChange={(e) => {
                  const [sec, sub] = e.target.value.split(":");
                  setSectionId(sec);
                  setSubjectId(sub);
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${S.line}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: S.navy,
                  background: S.white,
                  outline: "none",
                  boxSizing: "border-box",
                }}
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
              <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
                Max Marks
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${S.line}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: S.navy,
                  background: S.white,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
                Topic / Unit Chapter
              </label>
              <input
                type="text"
                placeholder="e.g. Chapter 4: Polynomials"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${S.line}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: S.navy,
                  background: S.white,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
                Submission Due Date
              </label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${S.line}`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: S.navy,
                  background: S.white,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
              Instructions & Problem Questions
            </label>
            <textarea
              rows={3}
              placeholder="State the exercises, rubric expectations, and submission instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${S.line}`,
                borderRadius: "8px",
                fontSize: "12px",
                color: S.navy,
                background: S.white,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: `1px solid ${S.line}` }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                color: S.slate,
                background: "transparent",
                border: `1px solid ${S.line}`,
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !sectionId || !subjectId}
              style={{
                padding: "8px 18px",
                fontSize: "12px",
                fontWeight: 600,
                color: S.white,
                background: S.navy,
                border: "none",
                borderRadius: "8px",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
                boxShadow: "0 2px 6px rgba(12,30,51,0.2)",
              }}
            >
              {saving ? "Publishing..." : "Publish to Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
