"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, Check } from "lucide-react";
import { createTeacherIntervention, getTeacherClassStudents, getTeacherClasses } from "../../edops-api";

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
  amberBg: "#fcedb6",
  amberDark: "#614400",
  coralBg: "#ffd8c7",
  coralDark: "#782a00",
};

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
  const [reviewDate, setReviewDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);
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
      if (!firstSection) {
        setStudents([]);
        return;
      }
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
      setError(err?.message || "Could not assign intervention. Please try again.");
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
              Academic Support & Remedial
            </span>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: S.navy }}>
              Create Student Intervention
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: S.slate }}>
              Structured remedial plan for struggling learners with milestone tracking.
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
                Target Student *
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
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
                {students.length === 0 ? (
                  <option value="">No enrolled students</option>
                ) : (
                  students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.rollNumber ? `Roll ${st.rollNumber}` : "Student"})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
                Intervention Strategy
              </label>
              <select
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value)}
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
            <label style={{ display: "block", fontWeight: 600, color: S.navy, marginBottom: "6px" }}>
              Targeted Academic Problem Area *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Graphing quadratic functions & vertex determination"
              value={problemArea}
              onChange={(e) => setProblemArea(e.target.value)}
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
              Evidence from Assessments / Assignments *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scored 6/20 on Unit Test 2, Section B problems omitted"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
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
              Target Learning Goal *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Achieve >= 75% on quadratic graphing practice worksheet"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
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
                Action to Execute *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 20-minute daily review sessions"
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
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
                Review Milestone Date *
              </label>
              <input
                type="date"
                required
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
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
              disabled={saving || !studentId || !problemArea.trim()}
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
              {saving ? "Registering..." : "Assign Intervention"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
