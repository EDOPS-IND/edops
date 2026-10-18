"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, BookOpen } from "lucide-react";
import { getTeacherClasses, recordTeacherLessonDelivery } from "../../edops-api";

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
  greenBg: "#d9eed1",
  greenDark: "#1a5c0a",
  coralBg: "#ffd8c7",
  coralDark: "#782a00",
};

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
    if (isOpen) {
      getTeacherClasses(organizationId)
        .then((res) => {
          const rows = res.classes || [];
          setClasses(rows);
          const selected =
            rows.find((c: any) => c.sectionId === sectionId && (!subjectId || c.subjectId === subjectId)) ||
            rows[0];
          setSelection(selected ? `${selected.sectionId}:${selected.subjectId}` : "");
        })
        .catch(() => setClasses([]));
    }
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
    if (!topicsCovered.trim() || !selection) return;

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
      setError(err?.message || "Could not save lesson record. Please try again.");
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
              Curriculum Execution Log
            </span>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: S.navy }}>
              Mark Lesson Completed — {activeClassName}
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: S.slate }}>
              Period {periodNumber} • {deliveryDate}
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
              Assigned Class & Subject *
            </label>
            <select
              required
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
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
              <option value="">Select an assigned class</option>
              {classes.map((c) => (
                <option key={`${c.sectionId}:${c.subjectId}`} value={`${c.sectionId}:${c.subjectId}`}>
                  {c.className} · {c.subjectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
              Topics & Concepts Delivered *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chapter 3: Newton's Laws & Friction Examples"
              value={topicsCovered}
              onChange={(e) => setTopicsCovered(e.target.value)}
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
                Student Participation (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                required
                placeholder="e.g. 85"
                value={participationPct}
                onChange={(e) => setParticipationPct(e.target.value === "" ? "" : Number(e.target.value))}
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
                Homework Assigned
              </label>
              <input
                type="text"
                placeholder="e.g. Q1-Q5 on page 42"
                value={homeworkAssigned}
                onChange={(e) => setHomeworkAssigned(e.target.value)}
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
              Teacher Pedagogical Reflection & Notes
            </label>
            <textarea
              rows={3}
              placeholder="What went well? Any concept gaps observed during the period?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
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
              disabled={saving || !selection || !topicsCovered.trim()}
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
              {saving ? "Recording..." : "Record Lesson Completion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
