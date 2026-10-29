"use client";

import React from "react";
import { X, BookOpen, Users, AlertTriangle, UserCheck, BarChart3, ArrowRight } from "lucide-react";
import { SubjectPerformanceItem, SubjectSectionDetail } from "../types";

export function SubjectPerformanceDrawer({
  subject,
  onClose,
  onOpenTeacherProfile,
  onTabChange,
  onNavigate,
}: {
  subject: SubjectPerformanceItem;
  onClose: () => void;
  onOpenTeacherProfile?: (teacherId: string) => void;
  onTabChange?: (tab: string) => void;
  onNavigate?: (pane: string, subTab?: string) => void;
}) {
  const sections = subject.sections || [];
  const percent = (v: number | null | undefined) => (v == null ? "—" : `${v}%`);

  // Detect variance between sections for academic intervention
  const scoredSections = sections.filter((s) => s.averageScore != null);
  let varianceWarning: { high: SubjectSectionDetail; low: SubjectSectionDetail; diff: number } | null = null;
  if (scoredSections.length >= 2) {
    const sorted = [...scoredSections].sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    const high = sorted[0];
    const low = sorted[sorted.length - 1];
    const diff = (high.averageScore || 0) - (low.averageScore || 0);
    if (diff >= 15) {
      varianceWarning = { high, low, diff };
    }
  }

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(2px)",
        display: "flex",
        justifyContent: "flex-end",
        padding: 0,
        zIndex: 1100,
      }}
    >
      <div
        className="edops-right-drawer"
        style={{
          background: "#FFFFFF",
          width: "100%",
          maxWidth: "640px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.18)",
          overflow: "hidden",
          animation: "drawerSlideIn 0.22s ease-out",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#EEF2FF",
                border: "1px solid #C7D2FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4338CA",
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>
                  {subject.name}
                </h2>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: subject.isElective ? "#F3E8FF" : "#EFF6FF",
                    color: subject.isElective ? "#7E22CE" : "#1D4ED8",
                    border: subject.isElective ? "1px solid #E9D5FF" : "1px solid #DBEAFE",
                  }}
                >
                  {subject.isElective ? "Elective" : "Core"}
                </span>
                {subject.code && (
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>
                    ({subject.code})
                  </span>
                )}
              </div>
              <span style={{ fontSize: "12px", color: "#64748B", marginTop: "2px", display: "block" }}>
                Class-by-Class Subject Performance & Faculty Mapping
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: "transparent",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* School-Wide Benchmark Summary Strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "14px",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Sections</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginTop: "3px" }}>
                {subject.sectionCount ?? sections.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Faculty</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginTop: "3px" }}>
                {subject.teacherCount ?? 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Avg Score</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#1D4ED8", marginTop: "3px" }}>
                {percent(subject.average)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Turn-in Rate</div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#047857", marginTop: "3px" }}>
                {percent(subject.assignmentRate)}
              </div>
            </div>
          </div>

          {/* Section Variance Insight Notice */}
          {varianceWarning && (
            <div
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
              }}
            >
              <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "12.5px", color: "#92400E", lineHeight: "1.45" }}>
                <b style={{ color: "#78350F" }}>High Section Variance ({varianceWarning.diff}%):</b>{" "}
                {varianceWarning.high.displayName} is averaging{" "}
                <b>{percent(varianceWarning.high.averageScore)}</b> under {varianceWarning.high.teacherName}, while{" "}
                {varianceWarning.low.displayName} is at{" "}
                <b>{percent(varianceWarning.low.averageScore)}</b> under {varianceWarning.low.teacherName}.
                Consider conducting a joint lesson sync or remedial sessions.
              </div>
            </div>
          )}

          {/* Section Breakdown List */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                <BarChart3 size={15} color="#475569" />
                Class-by-Class Breakdown ({sections.length})
              </span>
              <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                Multi-teacher section allocations
              </span>
            </div>

            {sections.length === 0 ? (
              <div
                style={{
                  padding: "36px 20px",
                  textAlign: "center",
                  background: "#F8FAFC",
                  border: "1px dashed #CBD5E1",
                  borderRadius: "10px",
                  color: "#64748B",
                }}
              >
                <BookOpen size={28} color="#94A3B8" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#334155" }}>
                  No classes mapped to this subject
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                  Assign this subject to classes in Academics &gt; Class Timetable &amp; Subjects.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sections.map((sec) => {
                  const hasTeacher = Boolean(sec.teacherUserId && sec.teacherName !== "Unassigned");
                  const isLowScore = sec.averageScore != null && sec.averageScore < 50;

                  return (
                    <div
                      key={sec.sectionId}
                      style={{
                        background: "#FFFFFF",
                        border: isLowScore ? "1px solid #FECACA" : "1px solid #E2E8F0",
                        borderRadius: "10px",
                        padding: "16px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      {/* Section Card Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: 700, color: "#0F172A" }}>
                              {sec.displayName}
                            </h4>
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                background: sec.status === "Needs Attention" ? "#FEF3C7" : sec.status === "Excelling" ? "#DCFCE7" : "#F1F5F9",
                                color: sec.status === "Needs Attention" ? "#92400E" : sec.status === "Excelling" ? "#166534" : "#475569",
                              }}
                            >
                              {sec.status}
                            </span>
                          </div>
                          <span style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px", display: "inline-block" }}>
                            {sec.studentCount} active students enrolled
                          </span>
                        </div>

                        {/* Assigned Teacher Badge */}
                        <div style={{ textAlign: "right" }}>
                          {hasTeacher ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (sec.teacherUserId && onOpenTeacherProfile) {
                                  onOpenTeacherProfile(sec.teacherUserId);
                                }
                              }}
                              title="Click to view Teacher Dossier"
                              style={{
                                background: "#F1F5F9",
                                border: "1px solid #E2E8F0",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                cursor: onOpenTeacherProfile ? "pointer" : "default",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <UserCheck size={13} color="#0284C7" />
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>
                                {sec.teacherName}
                              </span>
                            </button>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                background: "#FEF2F2",
                                border: "1px solid #FEE2E2",
                                color: "#B91C1C",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              ⚠️ Unassigned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Section Metrics Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: "8px",
                          background: "#F8FAFC",
                          border: "1px solid #F1F5F9",
                          borderRadius: "8px",
                          padding: "10px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "10.5px", color: "#64748B" }}>Class Avg</div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: isLowScore ? "#DC2626" : sec.averageScore != null && sec.averageScore >= 75 ? "#166534" : "#1E293B",
                              marginTop: "2px",
                            }}
                          >
                            {percent(sec.averageScore)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "10.5px", color: "#64748B" }}>Turn-in Rate</div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginTop: "2px" }}>
                            {percent(sec.assignmentRate)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "10.5px", color: "#64748B" }}>Pass Rate</div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginTop: "2px" }}>
                            {percent(sec.passRate)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "10.5px", color: "#64748B" }}>Attendance</div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginTop: "2px" }}>
                            {percent(sec.attendanceRate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E2E8F0",
            background: "#F8FAFC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {onNavigate || onTabChange ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigate) {
                  onNavigate("planning", "action_plans");
                } else {
                  onTabChange?.("planning");
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#0F172A",
                color: "#FFFFFF",
                borderRadius: "8px",
                border: "none",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Academic Action Plans
              <ArrowRight size={14} />
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#FFFFFF",
              color: "#334155",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
