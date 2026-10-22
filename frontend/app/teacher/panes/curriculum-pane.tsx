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
  Play,
  Check,
} from "lucide-react";
import { getTeacherCurriculum, updateTeacherCurriculumProgress } from "../../edops-api";

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
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  useEffect(() => {
    loadCurriculum();
  }, [organizationId]);

  async function loadCurriculum() {
    setLoading(true);
    try {
      const res = await getTeacherCurriculum(organizationId);
      setData(res);
      if (res?.assignedSubjects && res.assignedSubjects.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(res.assignedSubjects[0].subjectId);
      }
    } catch {
      setData({
        overview: {
          actualProgressPct: 0,
          expectedProgressPct: 50,
          gapPct: 0,
          completedChapters: 0,
          totalChapters: 0,
        },
        chapters: [],
        assignedSubjects: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (chapter: any, nextPct: number, nextStatus: string) => {
    try {
      await updateTeacherCurriculumProgress(
        organizationId,
        chapter.id,
        nextPct,
        nextStatus
      );
      await loadCurriculum();
    } catch (err) {
      console.error("Failed to update curriculum progress:", err);
    }
  };

  const overview = data?.overview || {
    actualProgressPct: 0,
    expectedProgressPct: 50,
    gapPct: 0,
    completedChapters: 0,
    totalChapters: 0,
  };

  const allChapters = data?.chapters || [];
  const assignedSubjects = data?.assignedSubjects || [];

  // Filter chapters by selected subject if one is chosen
  const activeSubject = assignedSubjects.find((s: any) => s.subjectId === selectedSubjectId) || assignedSubjects[0];
  const chapters = selectedSubjectId
    ? allChapters.filter((c: any) => c.subjectId === selectedSubjectId)
    : allChapters;

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

      {/* 2.5 Teacher's Assigned Subjects Grid Cards */}
      {assignedSubjects.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: T.navy }}>
              Your Assigned Subject Workspaces ({assignedSubjects.length})
            </span>
            <span style={{ fontSize: "11.5px", color: T.slate }}>
              Click any subject to view and log its syllabus progress
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
            {assignedSubjects.map((sub: any) => {
              const isSelected = selectedSubjectId === sub.subjectId;
              return (
                <div
                  key={sub.subjectId}
                  onClick={() => setSelectedSubjectId(sub.subjectId)}
                  style={{
                    background: T.white,
                    border: isSelected ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "16px 18px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    boxShadow: isSelected ? "0 4px 12px rgba(12,30,51,0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: T.slate, background: T.chip, padding: "2px 6px", borderRadius: "4px" }}>
                        {sub.subjectCode || "SUB"}
                      </span>
                      <h4 style={{ margin: "6px 0 2px", fontSize: "15px", fontWeight: 700, color: T.navy }}>
                        {sub.subjectName}
                      </h4>
                      <span style={{ fontSize: "11.5px", color: T.slate }}>
                        {sub.grade} {sub.sectionName ? `· Sec ${sub.sectionName}` : ""}
                      </span>
                    </div>
                    <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: isSelected ? T.navy : T.chip, color: isSelected ? T.white : T.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen size={16} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "5px" }}>
                      <span style={{ color: T.slate }}>{sub.totalChapters} Chapters</span>
                      <span style={{ fontWeight: 700, color: T.navy }}>{sub.progressPct}% Done</span>
                    </div>
                    <div style={{ height: "5px", background: T.chip, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${sub.progressPct}%`, background: sub.progressPct >= 100 ? T.greenDark : T.navy, borderRadius: "4px" }} />
                    </div>
                  </div>

                  <div style={{ paddingTop: "8px", borderTop: `1px solid ${T.chip}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: isSelected ? T.navy : T.slate }}>
                      {isSelected ? "Active View ✓" : "Switch to Subject →"}
                    </span>
                    <span style={{ fontSize: "11px", color: T.slate }}>
                      {sub.completedChapters}/{sub.totalChapters} Units
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: T.navy }}>
              {activeSubject ? `${activeSubject.grade} ${activeSubject.subjectName} — Chapters &amp; Delivery Log` : "Chapter-wise Syllabus Units & Learning Outcomes"}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.slate }}>
              Start chapters when instruction begins and log progress towards completion.
            </p>
          </div>
          {activeSubject && (
            <span style={{ fontSize: "12px", fontWeight: 700, color: T.navy, background: T.chip, padding: "4px 10px", borderRadius: "6px" }}>
              {chapters.length} Chapters in this Syllabus
            </span>
          )}
        </div>

        {chapters.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: T.slate, fontSize: "13px", border: `1px dashed ${T.border}`, borderRadius: "8px" }}>
            No curriculum chapters mapped for this subject yet. When School Admin defines the syllabus in the Academics tab, it will appear here automatically.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {chapters.map((chap: any) => {
              const isCompleted = chap.status === "Completed" || chap.completionPct >= 100;
              const isInProgress = chap.status === "In Progress" || (chap.completionPct > 0 && !isCompleted);
              const isUpcoming = !isCompleted && !isInProgress;

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
                          background: isCompleted ? T.greenDark : isInProgress ? T.navy : T.slate,
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: 700, color: T.navy }}>{chap.name}</h4>
                          <span style={{ fontSize: "11px", color: T.slate, background: T.chip, padding: "1px 6px", borderRadius: "4px" }}>
                            {chap.unit || "General"}
                          </span>
                        </div>
                        <span style={{ fontSize: "11.5px", color: T.slate }}>
                          Timeline: Expected by <b>Week {chap.expectedWeek || 10}</b> ({chap.expectedWeek ? `~${chap.expectedWeek} wks schedule` : "On schedule"})
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: isCompleted ? T.greenBg : isInProgress ? T.skyBg : T.chip,
                          color: isCompleted ? T.greenDark : isInProgress ? T.skyDark : T.slate,
                        }}
                      >
                        {isCompleted ? "Completed ✓" : isInProgress ? "In Progress" : "Upcoming"}
                      </span>
                      <span style={{ fontWeight: 800, color: T.navy, fontSize: "13px", minWidth: "40px", textAlign: "right" }}>
                        {chap.completionPct}%
                      </span>

                      {/* Interactive Teacher Action Buttons */}
                      {isUpcoming && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(chap, 15, "In Progress")}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            background: T.navy,
                            border: "none",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            color: T.white,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Play size={12} fill="#FFFFFF" /> Start Chapter
                        </button>
                      )}

                      {isInProgress && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const nextPct = Math.min(100, (chap.completionPct || 0) + 20);
                              handleUpdateStatus(chap, nextPct, nextPct >= 100 ? "Completed" : "In Progress");
                            }}
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              background: T.white,
                              border: `1px solid ${T.border}`,
                              fontSize: "11.5px",
                              fontWeight: 600,
                              color: T.navy,
                              cursor: "pointer",
                            }}
                          >
                            + Log Progress (+20%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(chap, 100, "Completed")}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              background: T.greenDark,
                              border: "none",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              color: T.white,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Check size={13} /> Mark Completed
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <span style={{ fontSize: "11.5px", color: T.greenDark, fontWeight: 700 }}>
                          Fully Delivered ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: "100%", height: "6px", background: T.chip, borderRadius: "100px", overflow: "hidden", border: `1px solid ${T.border}` }}>
                    <div
                      style={{
                        width: `${chap.completionPct}%`,
                        height: "100%",
                        background: isCompleted ? T.greenDark : T.navy,
                        borderRadius: "100px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  {/* Learning Outcomes Matrix if present */}
                  {chap.learningOutcomes && chap.learningOutcomes.length > 0 && (
                    <div style={{ fontSize: "11.5px", color: T.slate, display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: T.navy }}>Outcomes:</span>
                      {chap.learningOutcomes.map((lo: any, lIdx: number) => (
                        <span key={lIdx} style={{ background: T.chip, padding: "1px 6px", borderRadius: "4px" }}>
                          {lo.description || lo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
