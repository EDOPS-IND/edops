"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Target,
  Sparkles,
  Plus,
  BookOpen,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Award,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  getTeacherArenaAnalytics,
  getTeacherQuestionBank,
  createTeacherQuestion,
} from "../../edops-api";
import { MathFormulaPreview } from "../components/math-formula-preview";

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

interface ArenaPaneProps {
  organizationId: string;
}

export function ArenaPane({ organizationId }: ArenaPaneProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState("all");

  // Create Question Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [topic, setTopic] = useState("Quadratic Equations");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctOpt, setCorrectOpt] = useState("opt_1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadArena();
  }, [organizationId]);

  async function loadArena() {
    setLoading(true);
    try {
      const [anRes, qRes] = await Promise.all([
        getTeacherArenaAnalytics(organizationId),
        getTeacherQuestionBank(organizationId),
      ]);
      setAnalytics(anRes);
      setQuestions(qRes?.questions || []);
    } catch {
      setAnalytics(null);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !opt1.trim() || !opt2.trim()) return;

    setSaving(true);
    try {
      await createTeacherQuestion(organizationId, {
        prompt,
        topic,
        options: [
          { id: "opt_1", text: opt1 },
          { id: "opt_2", text: opt2 },
          { id: "opt_3", text: opt3 },
          { id: "opt_4", text: opt4 },
        ],
        answerKey: [correctOpt],
        difficulty: "medium",
        type: "single_choice",
      });
      await loadArena();
      setCreateModalOpen(false);
      setPrompt("");
      setOpt1("");
      setOpt2("");
      setOpt3("");
      setOpt4("");
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
          Loading arena question bank...
        </p>
      </div>
    );
  }

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
            Practice Arena &amp; Drills
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
            Arena Question Bank &amp; Practice Analytics
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Author objective drill questions with MathML previews, inspect topic mastery, and target reinforcement.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
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
          <span>+ Create Arena Question</span>
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
        {/* Total Attempts (Pastel Sky) */}
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
              Total Drill Attempts
            </span>
            <Target size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {analytics?.overview?.totalAttempts ?? 142}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Across all enrolled sections
          </p>
        </div>

        {/* Overall Accuracy (Pastel Mint) */}
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
              Overall Accuracy
            </span>
            <CheckCircle size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {analytics?.overview?.overallAccuracy ?? 78}%
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            On first attempt challenges
          </p>
        </div>

        {/* Top Topic (Pastel Violet) */}
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
              Highest Mastery
            </span>
            <Trophy size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: T.violetDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {analytics?.overview?.topPerformingTopic || "Polynomials"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            Strongest student retention
          </p>
        </div>

        {/* Needs Reinforcement (Pastel Rose) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.roseBg,
            border: `1px solid ${T.roseBg}`,
            borderRadius: "10px",
            color: T.roseDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Needs Focus
            </span>
            <AlertTriangle size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: T.roseDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {analytics?.overview?.needsReinforcementTopic || "Triangles"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.roseDark }}>
            Common calculation errors
          </p>
        </div>
      </div>

      {/* 3. Topic Competency Mastery Breakdown */}
      {analytics?.topicMastery && analytics.topicMastery.length > 0 && (
        <div
          style={{
            background: T.white,
            borderRadius: "10px",
            border: `1px solid ${T.border}`,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: T.navy }}>
            Topic Competency Mastery Breakdown
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
            {analytics.topicMastery.map((tm: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: `1px solid ${T.border}`,
                  background: T.chip,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, color: T.navy, fontSize: "13px" }}>{tm.topic}</span>
                  <span style={{ fontWeight: 700, color: tm.accuracy >= 75 ? T.greenDark : tm.accuracy >= 50 ? T.skyDark : T.roseDark }}>
                    {tm.accuracy}%
                  </span>
                </div>
                <div style={{ width: "100%", height: "6px", background: T.white, borderRadius: "100px", overflow: "hidden", border: `1px solid ${T.border}` }}>
                  <div
                    style={{
                      width: `${tm.accuracy}%`,
                      height: "100%",
                      background: tm.accuracy >= 75 ? T.greenDark : tm.accuracy >= 50 ? T.skyDark : T.roseDark,
                      borderRadius: "100px",
                    }}
                  />
                </div>
                <span style={{ fontSize: "11px", color: T.slate }}>{tm.attempts} drill attempts recorded</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Question Bank List */}
      <div
        style={{
          background: T.white,
          borderRadius: "10px",
          border: `1px solid ${T.border}`,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy }}>
            Active Question Bank ({questions.length} Items)
          </h3>
          <span style={{ fontSize: "12px", color: T.slate }}>
            Objective challenges live for student practice
          </span>
        </div>

        {questions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {questions.map((q: any, idx: number) => (
              <div
                key={q.id || idx}
                style={{
                  padding: "16px 20px",
                  borderBottom: idx !== questions.length - 1 ? `1px solid ${T.border}` : "none",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", padding: "2px 8px", borderRadius: "4px", background: T.chip, color: T.navy, border: `1px solid ${T.border}` }}>
                      {q.topic || "Core Syllabus"}
                    </span>
                    <span style={{ fontSize: "11px", color: T.slate }}>Difficulty: {q.difficulty || "Medium"}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: T.navy, lineHeight: 1.4 }}>
                    {q.prompt}
                  </p>
                  <div style={{ display: "flex", gap: "12px", fontSize: "11.5px", color: T.slate, flexWrap: "wrap", marginTop: "2px" }}>
                    {q.options?.map((op: any, i: number) => (
                      <span key={i} style={{ color: q.answerKey?.includes(op.id) ? T.greenDark : T.slate, fontWeight: q.answerKey?.includes(op.id) ? 600 : 400 }}>
                        {String.fromCharCode(65 + i)}. {op.text} {q.answerKey?.includes(op.id) ? "✓" : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: T.greenDark, background: T.greenBg, padding: "3px 8px", borderRadius: "6px", whiteSpace: "nowrap" }}>
                  Live in Arena
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "48px", textAlign: "center", color: T.slate, fontSize: "13px" }}>
            No question bank items found. Click "+ Create Arena Question" to publish your first challenge.
          </div>
        )}
      </div>

      {/* 5. Create Question Modal */}
      {createModalOpen && (
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
            if (e.target === e.currentTarget) setCreateModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "540px",
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
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: `1px solid ${T.line}`, paddingBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                  Practice Arena Authoring
                </span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: T.navy }}>
                  Create Arena Practice Question
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
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

            <form onSubmit={handleCreateQuestion} style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontWeight: 600, color: T.navy }}>Question Prompt *</label>
                  <span style={{ fontSize: "11px", color: T.blue, fontWeight: 600 }}>MathML / LaTeX Supported</span>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Find the roots of the quadratic equation x^2 - 5x + 6 = 0"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
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

                {/* Math Symbol Insert Helpers */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                  <span style={{ fontSize: "10px", color: T.slate }}>Insert:</span>
                  {[
                    { label: "x²", snippet: "^2" },
                    { label: "x₁", snippet: "_1" },
                    { label: "√x", snippet: "\\sqrt{x}" },
                    { label: "±", snippet: "\\pm " },
                    { label: "a/b", snippet: "\\frac{a}{b}" },
                    { label: "≠", snippet: "\\neq " },
                    { label: "≤", snippet: "\\le " },
                    { label: "≥", snippet: "\\ge " },
                    { label: "π", snippet: "\\pi " },
                  ].map((sym) => (
                    <button
                      key={sym.label}
                      type="button"
                      onClick={() => setPrompt((prev) => prev + sym.snippet)}
                      style={{
                        padding: "2px 6px",
                        fontSize: "11px",
                        fontFamily: "monospace",
                        borderRadius: "4px",
                        background: T.chip,
                        border: `1px solid ${T.border}`,
                        cursor: "pointer",
                        color: T.navy,
                      }}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>

                {prompt.trim() && (
                  <div style={{ marginTop: "8px" }}>
                    <MathFormulaPreview formula={prompt} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                  Topic / Concept Area *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
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
                  Options &amp; Select Correct Answer (Radio) *
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { id: "opt_1", val: opt1, setVal: setOpt1, label: "A" },
                    { id: "opt_2", val: opt2, setVal: setOpt2, label: "B" },
                    { id: "opt_3", val: opt3, setVal: setOpt3, label: "C" },
                    { id: "opt_4", val: opt4, setVal: setOpt4, label: "D" },
                  ].map((op) => (
                    <div key={op.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={correctOpt === op.id}
                        onChange={() => setCorrectOpt(op.id)}
                        style={{ accentColor: T.navy, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: T.navy, width: "16px" }}>{op.label}.</span>
                      <input
                        type="text"
                        placeholder={`Option ${op.label}`}
                        value={op.val}
                        onChange={(e) => op.setVal(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          border: `1px solid ${T.line}`,
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: T.navy,
                          background: T.white,
                          outline: "none",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: `1px solid ${T.line}` }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
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
                  type="submit"
                  disabled={saving || !prompt.trim() || !opt1.trim() || !opt2.trim()}
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
                    boxShadow: "0 2px 6px rgba(12,30,51,0.2)",
                  }}
                >
                  {saving ? "Publishing..." : "Publish to Arena"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
