"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  CheckCircle2,
  Plus,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { getTeacherArenaQuestions, createTeacherArenaQuestion, getTeacherArenaAnalytics, getTeacherClasses } from "../../edops-api";
import { MathFormulaPreview } from "../components/math-formula-preview";

interface ArenaPaneProps {
  organizationId: string;
}

export function ArenaPane({ organizationId }: ArenaPaneProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Question Form State
  const [prompt, setPrompt] = useState("");
  const [topic, setTopic] = useState("Quadratic Equations");
  const [opt1, setOpt1] = useState("2 and 3");
  const [opt2, setOpt2] = useState("-2 and -3");
  const [opt3, setOpt3] = useState("1 and 6");
  const [opt4, setOpt4] = useState("-1 and -6");
  const [correctOpt, setCorrectOpt] = useState("opt_1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadArena();
  }, [organizationId]);

  async function loadArena() {
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        getTeacherArenaQuestions(organizationId),
        getTeacherArenaAnalytics(organizationId),
      ]);
      setQuestions(qRes?.questions || []);
      setAnalytics(aRes);
    } catch {
      setQuestions([]);
      setAnalytics({
        overview: {
          totalQuestions: 0,
          totalAttempts: 0,
          overallAccuracy: 0,
          topPerformingTopic: "—",
          needsReinforcementTopic: "—",
        },
        topicMastery: [],
        questionInsights: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setSaving(true);
    try {
      const clsRes = await getTeacherClasses(organizationId);
      const targetSection = clsRes?.classes?.[0]?.sectionId || "";
      const targetClass = clsRes?.classes?.[0]?.className || "";
      await createTeacherArenaQuestion(organizationId, {
        sectionId: targetSection,
        subjectId: clsRes?.classes?.[0]?.subjectCode || "sub-math",
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
      setQuestions((prev) => [
        {
          id: `aq-${Date.now()}`,
          prompt,
          topic,
          difficulty: "medium",
          status: "published",
          classSection: targetClass || "Active Class",
          attemptsCount: 0,
          accuracyRate: null,
          options: [
            { id: "opt_1", text: opt1 },
            { id: "opt_2", text: opt2 },
            { id: "opt_3", text: opt3 },
            { id: "opt_4", text: opt4 },
          ]
        },
        ...prev,
      ]);
      setCreateModalOpen(false);
      setPrompt("");
    } catch {
      setCreateModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900  flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Arena Question Bank & Practice Analytics
          </h2>
          <p className="text-xs text-gray-500  mt-0.5">
            Create objective practice challenges and inspect student accuracy patterns across syllabus topics
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
        >
          + Create Arena Question
        </button>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Total Practice Attempts</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{analytics?.overview?.totalAttempts ?? 0}</div>
          <span className="text-xs text-gray-500">Across assigned classes</span>
        </div>

        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Overall Accuracy Rate</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{analytics?.overview?.overallAccuracy ?? 0}%</div>
          <span className="text-xs text-emerald-600 font-semibold">Active syllabus questions</span>
        </div>

        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-gray-400">Highest Mastery Topic</span>
          <div className="text-sm font-black text-gray-900  mt-1.5 truncate">{analytics?.overview?.topPerformingTopic ?? "—"}</div>
        </div>

        <div className="p-4 bg-white  rounded-xl border border-gray-200 ">
          <span className="text-[10px] font-bold uppercase text-red-500">Needs Reinforcement</span>
          <div className="text-sm font-black text-red-600 mt-1.5 truncate">{analytics?.overview?.needsReinforcementTopic ?? "—"}</div>
        </div>
      </div>

      {/* Topic Mastery Breakdown */}
      {analytics?.topicMastery?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700">
            Topic Competency Mastery Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analytics.topicMastery.map((tm: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 truncate">{tm.topic}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    tm.status === 'Strong' ? 'bg-emerald-100 text-emerald-800' :
                    tm.status === 'On Track' ? 'bg-blue-100 text-blue-800' :
                    tm.status === 'Needs Reinforcement' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {tm.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500 text-[11px]">
                  <span>{tm.questionsCount} questions</span>
                  <span className="font-bold text-gray-900">{tm.accuracy}% accuracy</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Insights Radar */}
      {analytics?.questionInsights?.length > 0 && (
        <div className="p-4 bg-amber-50/60  border border-amber-200  rounded-xl space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 ">
            Pedagogical Diagnostic Insight
          </h4>
          {analytics.questionInsights.map((ins: any, i: number) => (
            <div key={i} className="text-xs space-y-1">
              <p className="font-semibold text-gray-900 ">"{ins.question}"</p>
              <p className="text-gray-600 ">
                Accuracy: <strong>{ins.accuracy}%</strong> • Common error: {ins.mostCommonWrongAnswer}
              </p>
              <p className="text-indigo-600  font-medium">Recommendation: {ins.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Questions Bank List */}
      <div className="bg-white  rounded-xl border border-gray-200  p-5 space-y-4">
        <h3 className="text-base font-bold text-gray-900 ">
          Active Arena Question Bank
        </h3>

        {questions.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No arena practice questions created yet. Click "+ Create Arena Question" to publish practice challenges to your students.
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q: any) => (
              <div key={q.id} className="p-4 rounded-xl border border-gray-200  space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50  text-indigo-600">
                      {q.topic}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">
                      Difficulty: {q.difficulty}
                    </span>
                  </div>
                  {q.accuracyRate !== null && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50  px-2 py-0.5 rounded">
                      {q.accuracyRate}% Accuracy ({q.attemptsCount} attempts)
                    </span>
                  )}
                </div>

                <div className="font-bold text-sm text-gray-900">
                  {/[\\^_{}]|sqrt|frac|pm/.test(q.prompt) ? (
                    <MathFormulaPreview formula={q.prompt} className="border-0 bg-transparent p-0 text-gray-900 shadow-none" />
                  ) : (
                    q.prompt
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {q.options?.map((opt: any) => (
                    <div key={opt.id} className="p-2 rounded-lg bg-gray-50  border border-gray-200  text-gray-700 ">
                      {opt.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white  rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200  space-y-4 text-xs">
            <h3 className="text-base font-bold text-gray-900 ">
              Create Arena Practice Question
            </h3>

            <form onSubmit={handleCreateQuestion} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold block">Question Prompt *</label>
                  <span className="text-[10px] text-indigo-600 font-semibold">LaTeX / Math Enabled</span>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. What are the roots of x^2 - 5x + 6 = 0?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white text-gray-900 font-mono text-xs"
                />

                {/* Quick Math Symbol Shortcuts */}
                <div className="flex flex-wrap items-center gap-1 mt-1.5 mb-2">
                  <span className="text-[10px] text-gray-400 mr-1">Insert:</span>
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
                    { label: "α", snippet: "\\alpha " },
                    { label: "β", snippet: "\\beta " },
                  ].map((sym) => (
                    <button
                      key={sym.label}
                      type="button"
                      onClick={() => setPrompt((prev) => prev + sym.snippet)}
                      className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-800 border border-gray-200 transition"
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>

                {/* Live Formula Preview Box */}
                {prompt.trim() && (
                  <MathFormulaPreview formula={prompt} className="mt-1" />
                )}
              </div>

              <div>
                <label className="font-bold block mb-1">Topic / Concept</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white  text-gray-900 "
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold block">Options & Mark Correct Answer:</label>
                {[
                  { id: "opt_1", val: opt1, setVal: setOpt1 },
                  { id: "opt_2", val: opt2, setVal: setOpt2 },
                  { id: "opt_3", val: opt3, setVal: setOpt3 },
                  { id: "opt_4", val: opt4, setVal: setOpt4 },
                ].map((op, idx) => (
                  <div key={op.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={correctOpt === op.id}
                      onChange={() => setCorrectOpt(op.id)}
                    />
                    <input
                      type="text"
                      value={op.val}
                      onChange={(e) => op.setVal(e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 border rounded-lg bg-white  text-gray-900 "
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
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
