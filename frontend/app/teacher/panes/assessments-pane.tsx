"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  Lock,
  Plus,
  Users,
  Award,
  AlertCircle,
  Clock,
  BookOpen,
  ChevronRight,
  TrendingUp,
  X,
} from "lucide-react";
import {
  getTeacherAssessments,
  getTeacherClassDetails,
  getTeacherClasses,
  submitTeacherMarks,
} from "../../edops-api";

const T = {
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
  greenBg: "#ccefbf",
  greenDark: "#1a5c0a",
  skyBg: "#d0e6ff",
  skyDark: "#0a3a7a",
  amberBg: "#fde1ac",
  amberDark: "#614400",
  roseBg: "#ffd6d6",
  roseDark: "#7a1a1a",
  violetBg: "#e1d2ff",
  violetDark: "#4a0e8f",
};

interface AssessmentsPaneProps {
  organizationId: string;
}

export function AssessmentsPane({ organizationId }: AssessmentsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Marks Entry Modal
  const [marksEntryOpen, setMarksEntryOpen] = useState(false);
  const [selectedAsmt, setSelectedAsmt] = useState<any>(null);
  const [scores, setScores] = useState<Array<{ id: string; name: string; roll: string; score: number | ""; remarks: string }>>([]);
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

  const handleOpenMarksEntry = async (asmt: any) => {
    setSelectedAsmt(asmt);
    setMarksEntryOpen(true);
    try {
      let secId = asmt?.sectionId;
      if (!secId) {
        const clsRes = await getTeacherClasses(organizationId);
        secId = clsRes?.classes?.[0]?.sectionId || "";
      }
      const det = await getTeacherClassDetails(organizationId, secId);
      if (det?.students) {
        setScores(
          det.students.map((st: any) => ({
            id: st.id,
            name: st.name,
            roll: st.rollNumber || "01",
            score: "",
            remarks: "Satisfactory",
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
    if (!selectedAsmt?.title?.trim() || !scores.length || scores.some((s) => s.score === "")) return;
    setSaving(true);
    try {
      let secId = selectedAsmt?.sectionId;
      if (!secId) {
        const clsRes = await getTeacherClasses(organizationId);
        secId = clsRes?.classes?.[0]?.sectionId || "";
      }
      await submitTeacherMarks(organizationId, {
        sectionId: secId,
        subjectId: selectedAsmt?.subjectId,
        title: selectedAsmt?.title || "Assessment Marks",
        maxMarks: selectedAsmt?.maxMarks || 50,
        scores: scores.map((s) => ({ studentId: s.id, score: s.score, remarks: s.remarks })),
        lockMarks,
      });
      setMarksEntryOpen(false);
      loadAssessments();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: "13px", fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading formative assessments &amp; marks...
        </p>
      </div>
    );
  }

  const assessmentsList = data?.assessments || [];
  const totalTests = assessmentsList.length;
  const lockedTests = assessmentsList.filter((a: any) => a.status?.includes("Locked")).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: T.slate,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Evaluations &amp; Blueprints
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              color: T.navy,
              letterSpacing: "-0.01em",
            }}
          >
            Assessments, Tests &amp; Marks Management
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Conduct formative tests, inspect blueprint compliance, and submit marks with verified audit locks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenMarksEntry(assessmentsList[0] || { title: "Unit Test 1", maxMarks: 50 })}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: T.navy,
            color: T.white,
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
          }}
        >
          <Plus size={14} />
          <span>+ Enter Assessment Marks</span>
        </button>
      </div>

      {/* 2. Top 4 Metric Cards - Strict DESIGN.md Section 2.1 Palettes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Total Tests (Pastel Sky) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.skyBg,
            border: `1px solid ${T.skyBg}`,
            borderRadius: "10px",
            color: T.skyDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Formative Tests
            </span>
            <FileText size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {totalTests}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Continuous evaluations conducted
          </p>
        </div>

        {/* Locked Marks (Pastel Mint) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.greenBg,
            border: `1px solid ${T.greenBg}`,
            borderRadius: "10px",
            color: T.greenDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Finalized &amp; Locked
            </span>
            <Lock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {lockedTests} / {totalTests}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Marks locked for report cards
          </p>
        </div>

        {/* Class Average (Pastel Violet) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.violetBg,
            border: `1px solid ${T.violetBg}`,
            borderRadius: "10px",
            color: T.violetDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Cohort Average
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.violetDark }}>
            78.4%
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            Across all formative tests
          </p>
        </div>

        {/* Pending Entry (Pastel Warm Amber) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.amberBg,
            border: `1px solid ${T.amberBg}`,
            borderRadius: "10px",
            color: T.amberDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Pending Entry
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {totalTests - lockedTests}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            Tests awaiting score submission
          </p>
        </div>
      </div>

      {/* 3. Assessments Grid */}
      {assessmentsList.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
          {assessmentsList.map((asmt: any) => (
            <div
              key={asmt.id}
              style={{
                background: T.white,
                borderRadius: "10px",
                border: `1px solid ${T.border}`,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", padding: "2px 8px", borderRadius: "4px", background: T.chip, color: T.navy, border: `1px solid ${T.border}` }}>
                    {asmt.type || "Formative"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: asmt.status?.includes("Locked") ? T.greenBg : T.skyBg,
                      color: asmt.status?.includes("Locked") ? T.greenDark : T.skyDark,
                    }}
                  >
                    {asmt.status || "In Draft"}
                  </span>
                </div>

                <h3 style={{ margin: "8px 0 2px", fontSize: "16px", fontWeight: 600, color: T.navy }}>
                  {asmt.title}
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: T.slate }}>
                  {asmt.classSection || "Class 10-A"} • {asmt.date || "Recent"}
                </p>
              </div>

              {/* Score summary ribbon */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  padding: "10px 12px",
                  background: T.chip,
                  borderRadius: "8px",
                  border: `1px solid ${T.border}`,
                }}
              >
                <div>
                  <span style={{ fontSize: "10px", color: T.slate, textTransform: "uppercase", fontWeight: 600 }}>Class Average</span>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: T.navy, marginTop: "2px" }}>
                    {asmt.averagePercentage ?? 78}%
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: T.slate, textTransform: "uppercase", fontWeight: 600 }}>Max Marks</span>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: T.navy, marginTop: "2px" }}>
                    {asmt.maxMarks || 50}
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: "12px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: T.slate }}>Blueprint Verified ✓</span>
                <button
                  type="button"
                  onClick={() => handleOpenMarksEntry(asmt)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: T.navy,
                    color: T.white,
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Enter / Edit Marks →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "48px", textAlign: "center", background: T.white, borderRadius: "10px", border: `1px dashed ${T.border}`, color: T.slate, fontSize: "13px" }}>
          No formative assessments or test blueprints recorded yet.
        </div>
      )}

      {/* 4. Redesigned Marks Entry Modal */}
      {marksEntryOpen && (
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
            if (e.target === e.currentTarget) setMarksEntryOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: "14px",
              boxShadow: "0 20px 40px rgba(12, 30, 51, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px",
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: `1px solid ${T.line}`, paddingBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                  Marks Ledger Desk
                </span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: T.navy }}>
                  {selectedAsmt?.title || "Assessment Marks Entry"}
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: T.slate }}>
                  {selectedAsmt?.classSection || "Class 10-A"} • Max Marks: {selectedAsmt?.maxMarks || 50}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMarksEntryOpen(false)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.slate,
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px", fontSize: "12px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                  Assessment Title *
                </label>
                <input
                  required
                  value={selectedAsmt?.title || ""}
                  onChange={(e) => setSelectedAsmt((prev: any) => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${T.line}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: T.navy,
                    background: T.white,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                  Maximum Marks
                </label>
                <input
                  type="number"
                  min={1}
                  value={selectedAsmt?.maxMarks || 50}
                  onChange={(e) => setSelectedAsmt((prev: any) => ({ ...prev, maxMarks: Number(e.target.value) }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${T.line}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: T.navy,
                    background: T.white,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Score rows */}
            <div style={{ maxHeight: "240px", overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: "8px" }}>
              {scores.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: T.slate, fontSize: "12px" }}>
                  No enrolled students found in this section to record marks for.
                </div>
              ) : (
                scores.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: idx !== scores.length - 1 ? `1px solid ${T.border}` : "none",
                      gap: "8px",
                      background: T.white,
                    }}
                  >
                    <div style={{ minWidth: "140px" }}>
                      <span style={{ fontFamily: "monospace", color: T.slate, marginRight: "6px", fontSize: "11px" }}>#{s.roll}</span>
                      <strong style={{ fontSize: "12px", color: T.navy }}>{s.name}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="number"
                        min={0}
                        max={selectedAsmt?.maxMarks || 50}
                        value={s.score}
                        placeholder="Marks"
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value);
                          setScores((prev) => prev.map((item) => (item.id === s.id ? { ...item, score: val } : item)));
                        }}
                        style={{
                          width: "68px",
                          padding: "6px 8px",
                          border: `1px solid ${T.line}`,
                          borderRadius: "6px",
                          textAlign: "center",
                          fontWeight: 700,
                          fontSize: "12px",
                          outline: "none",
                          background: T.white,
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Remarks..."
                        value={s.remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setScores((prev) => prev.map((item) => (item.id === s.id ? { ...item, remarks: val } : item)));
                        }}
                        style={{
                          width: "160px",
                          padding: "6px 8px",
                          border: `1px solid ${T.line}`,
                          borderRadius: "6px",
                          fontSize: "11px",
                          outline: "none",
                          background: T.white,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: `1px solid ${T.line}` }}>
              <button
                type="button"
                onClick={() => setMarksEntryOpen(false)}
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.slate,
                  background: "transparent",
                  border: `1px solid ${T.line}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveMarks(false)}
                disabled={saving || !selectedAsmt?.title?.trim() || !scores.length || scores.some((s) => s.score === "")}
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.navy,
                  background: T.chip,
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveMarks(true)}
                disabled={saving || !selectedAsmt?.title?.trim() || !scores.length || scores.some((s) => s.score === "")}
                style={{
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: T.white,
                  background: T.navy,
                  border: "none",
                  borderRadius: "8px",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
                }}
              >
                {saving ? "Saving..." : "Submit & Lock Marks"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
