"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  ArrowRight,
  Target,
  Sparkles,
} from "lucide-react";
import { getTeacherCurriculum, updateTeacherCurriculumTopic } from "../../edops-api";

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

interface CurriculumPaneProps {
  organizationId: string;
}

export function CurriculumPane({ organizationId }: CurriculumPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurriculum();
  }, [organizationId]);

  async function loadCurriculum() {
    setLoading(true);
    try {
      const res = await getTeacherCurriculum(organizationId);
      setData(res);
    } catch {
      setData({
        overview: {
          actualProgressPct: 62,
          expectedProgressPct: 65,
          gapPct: -3,
          completedChapters: 5,
          totalChapters: 8,
        },
        chapters: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const handleIncrementProgress = async (chapter: any) => {
    const nextCompleted = Math.min(chapter.periodsDelivered + 1, chapter.periodsRequired);
    const nextPct = Math.round((nextCompleted / chapter.periodsRequired) * 100);
    try {
      await updateTeacherCurriculumTopic(
        organizationId,
        chapter.sectionId,
        chapter.subjectId,
        chapter.id,
        nextPct,
        nextPct === 100 ? "completed" : "in_progress"
      );
      loadCurriculum();
    } catch {
    }
  };

  const overview = data?.overview || {
    actualProgressPct: 62,
    expectedProgressPct: 65,
    gapPct: -3,
    completedChapters: 5,
    totalChapters: 8,
  };

  const chapters = data?.chapters || [];

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
          Loading curriculum pacing &amp; learning outcomes...
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
            Curriculum Pacing &amp; LO Matrix
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
            Curriculum Syllabus Execution &amp; LO Pacing
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Chapter-wise syllabus tracking, actual vs expected instructional delivery, and learning outcome attainment.
          </p>
        </div>

        <div
          style={{
            padding: "6px 14px",
            borderRadius: "100px",
            background: T.chip,
            fontSize: "11px",
            fontWeight: 600,
            color: T.slate,
            border: `1px solid ${T.border}`,
          }}
        >
          {overview.completedChapters} of {overview.totalChapters} Units Completed
        </div>
      </div>

      {/* 2. Top 4 Metric Cards - Strict DESIGN.md Section 2.1 Palettes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Actual Progress (Pastel Sky) */}
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
              Actual Delivery
            </span>
            <BookOpen size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {overview.actualProgressPct}%
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            {overview.completedChapters} of {overview.totalChapters} syllabus units complete
          </p>
        </div>

        {/* Expected Progress (Pastel Mint) */}
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
              Expected Benchmark
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {overview.expectedProgressPct}%
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Annual school academic calendar target
          </p>
        </div>

        {/* Pacing Gap (Pastel Warm Amber) */}
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
              Pacing Variance
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {overview.gapPct >= 0 ? `+${overview.gapPct}%` : `${overview.gapPct}%`}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            {overview.gapPct >= 0 ? "Ahead of syllabus plan" : "Slightly behind schedule"}
          </p>
        </div>

        {/* Current Unit (Pastel Violet) */}
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
              Active Unit
            </span>
            <Sparkles size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, lineHeight: 1.2, color: T.violetDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {chapters.find((c: any) => c.status?.includes("In Progress"))?.name || chapters[0]?.name || "Polynomials"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            Active classroom instruction
          </p>
        </div>
      </div>

      {/* 3. Chapter-wise Curriculum Units */}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: T.navy }}>
            Chapter-wise Syllabus Units &amp; Learning Outcome Mapping
          </h3>
          <span style={{ fontSize: "12px", color: T.slate }}>
            NEP 2020 Competency Framework
          </span>
        </div>

        {chapters.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: T.slate, fontSize: "13px", border: `1px dashed ${T.border}`, borderRadius: "8px" }}>
            No curriculum nodes mapped yet. When syllabus topics are assigned, they will appear here with lesson progress trackers.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {chapters.map((chap: any) => {
              const isCompleted = chap.status === "Completed" || chap.completionPct === 100;
              return (
                <div
                  key={chap.id}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "8px",
                    border: `1px solid ${T.border}`,
                    background: T.white,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: T.navy,
                          color: T.white,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        {chap.sequence || "1"}
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy }}>{chap.name}</h4>
                        <span style={{ fontSize: "11px", color: T.slate }}>Target: {chap.periodsRequired || 12} periods • Delivered: {chap.periodsDelivered || 8} periods</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: isCompleted ? T.greenBg : T.skyBg,
                          color: isCompleted ? T.greenDark : T.skyDark,
                        }}
                      >
                        {isCompleted ? "Completed ✓" : "In Progress"}
                      </span>
                      <span style={{ fontWeight: 700, color: T.navy, fontSize: "13px" }}>{chap.completionPct}%</span>
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleIncrementProgress(chap)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: T.white,
                            border: `1px solid ${T.line}`,
                            fontSize: "11px",
                            fontWeight: 600,
                            color: T.navy,
                            cursor: "pointer",
                          }}
                        >
                          + Log Period
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: "100%", height: "6px", background: T.chip, borderRadius: "100px", overflow: "hidden", border: `1px solid ${T.border}` }}>
                    <div
                      style={{
                        width: `${chap.completionPct}%`,
                        height: "100%",
                        background: isCompleted ? T.greenDark : T.blue,
                        borderRadius: "100px",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
