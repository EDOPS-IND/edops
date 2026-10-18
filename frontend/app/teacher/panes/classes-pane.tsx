"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  Search,
  CheckSquare,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Award,
} from "lucide-react";
import { getTeacherClasses, getTeacherClassDetails } from "../../edops-api";

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

interface ClassesPaneProps {
  organizationId: string;
  onOpenStudentDossier: (studentId: string) => void;
  onTakeAttendance: (sectionId: string, className?: string) => void;
  onCreateAssignment: (sectionId: string) => void;
}

export function ClassesPane({
  organizationId,
  onOpenStudentDossier,
  onTakeAttendance,
  onCreateAssignment,
}: ClassesPaneProps) {
  const [classesData, setClassesData] = useState<any>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [classDetail, setClassDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadClasses();
  }, [organizationId]);

  useEffect(() => {
    if (selectedSectionId) {
      loadClassDetail(selectedSectionId);
    }
  }, [selectedSectionId]);

  async function loadClasses() {
    setLoading(true);
    try {
      const res = await getTeacherClasses(organizationId);
      setClassesData(res);
      if (res?.classes?.length > 0) {
        setSelectedSectionId(res.classes[0].sectionId);
      }
    } catch {
      setClassesData({ classes: [] });
      setSelectedSectionId("");
    } finally {
      setLoading(false);
    }
  }

  async function loadClassDetail(sectionId: string) {
    setDetailLoading(true);
    try {
      const res = await getTeacherClassDetails(organizationId, sectionId);
      setClassDetail(res);
    } catch {
      setClassDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  const selectedClass = classesData?.classes?.find((c: any) => c.sectionId === selectedSectionId);

  const filteredStudents = (classDetail?.students || []).filter((s: any) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (
      searchQuery &&
      !s.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.rollNumber?.includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

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
          Loading classes &amp; rosters...
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
            Instructional Roster
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
            My Teaching Classes &amp; Rosters
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Assigned sections for the academic term: inspect student attendance, evaluate progress, and launch actions.
          </p>
        </div>

        {selectedClass && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={() => onTakeAttendance(selectedClass.sectionId, selectedClass.className)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
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
              <CheckSquare size={14} />
              <span>Take Attendance</span>
            </button>
            <button
              type="button"
              onClick={() => onCreateAssignment(selectedClass.sectionId)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: T.white,
                color: T.navy,
                border: `1px solid ${T.line}`,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ClipboardList size={14} />
              <span>+ Assignment</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Grid of Class Cards (Matching SubjectsPane card design in Student Dashboard) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "14px",
        }}
      >
        {classesData?.classes?.map((c: any) => {
          const isSelected = c.sectionId === selectedSectionId;
          return (
            <div
              key={c.sectionId}
              onClick={() => setSelectedSectionId(c.sectionId)}
              style={{
                padding: "20px",
                background: T.white,
                border: isSelected ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                borderRadius: "10px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "16px",
                boxShadow: isSelected ? "0 4px 12px rgba(12, 30, 51, 0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "8px",
                      background: isSelected ? T.chip : T.chip,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: T.navy,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: T.navy }}>
                      {c.className}
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.blue, fontWeight: 600 }}>
                      {c.subjectName}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "100px",
                    background: T.chip,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: T.slate,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {c.studentCount} Students
                </span>
              </div>

              {/* Stats Ribbon */}
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
                  <span style={{ fontSize: "10px", color: T.slate, textTransform: "uppercase", fontWeight: 600 }}>
                    Subject Average
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: T.navy, marginTop: "2px" }}>
                    {c.subjectAverage}%
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: T.slate, textTransform: "uppercase", fontWeight: 600 }}>
                    Attendance
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: T.greenDark, marginTop: "2px" }}>
                    {c.attendanceRate}%
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: T.slate }}>
                <span>{c.upcomingExam || "Term In Session"}</span>
                <span style={{ fontWeight: 600, color: T.navy, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  {isSelected ? "Active View ✓" : "Select Section →"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Selected Class Academic Detail */}
      {selectedClass && (
        <div
          style={{
            background: T.white,
            borderRadius: "10px",
            border: `1px solid ${T.border}`,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Section Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, paddingBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: T.chip, color: T.navy, border: `1px solid ${T.border}` }}>
                  Active Section Ledger
                </span>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: T.navy }}>
                  {selectedClass.className} — {selectedClass.subjectName}
                </h3>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: T.slate }}>
                Live enrollment roster, continuous assessment averages, and student performance metrics
              </p>
            </div>
          </div>

          {/* 4 Pastel Metric Cards for Section */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {/* Subject Average (Pastel Violet) */}
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
                  Class Average
                </span>
                <Award size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.violetDark }}>
                {classDetail?.overview?.subjectAverage != null ? `${classDetail.overview.subjectAverage}%` : "—"}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
                {classDetail?.overview?.highestScore != null ? `High: ${classDetail.overview.highestScore}% • Low: ${classDetail.overview.lowestScore ?? 0}%` : "No graded evaluations yet"}
              </p>
            </div>

            {/* Pass Rate (Pastel Mint) */}
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
                  Pass Percentage
                </span>
                <CheckCircle2 size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
                {classDetail?.overview?.passRate != null ? `${classDetail.overview.passRate}%` : "—"}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
                {classDetail?.overview?.passRate != null ? "Passing threshold ≥40%" : "Awaiting assessment marks"}
              </p>
            </div>

            {/* Attendance (Pastel Sky) */}
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
                  Section Attendance
                </span>
                <Calendar size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
                {classDetail?.overview?.attendance != null ? `${classDetail.overview.attendance}%` : "—"}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
                {classDetail?.overview?.attendance != null ? "Finalized registers average" : "Attendance register pending"}
              </p>
            </div>

            {/* At-Risk (Pastel Rose) */}
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
                  Attention Required
                </span>
                <AlertTriangle size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.roseDark }}>
                {classDetail?.students ? classDetail.students.filter((s: any) => s.status === "needs_attention" || (s.attendance != null && s.attendance < 75)).length : 0}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: T.roseDark }}>
                Students requiring academic follow-up
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "6px", background: T.chip, padding: "4px", borderRadius: "8px", border: `1px solid ${T.border}` }}>
              {[
                { id: "all", label: "All Students" },
                { id: "on_track", label: "On Track" },
                { id: "needs_attention", label: "Needs Attention" },
              ].map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: active ? 600 : 500,
                      border: "none",
                      background: active ? T.navy : "transparent",
                      color: active ? T.white : T.slate,
                      cursor: "pointer",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div style={{ position: "relative", minWidth: "240px" }}>
              <Search size={14} color={T.slate} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search by student name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 12px 7px 32px",
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

          {/* Roster Table */}
          <div style={{ border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden" }}>
            {detailLoading ? (
              <div style={{ padding: "36px", textAlign: "center", color: T.slate, fontSize: "12px" }}>
                Loading roster entries...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", color: T.slate, fontSize: "12px" }}>
                No students found matching current filter.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: T.chip, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Roll</th>
                    <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Student Name</th>
                    <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Subject Avg</th>
                    <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Attendance</th>
                    <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st: any, idx: number) => {
                    const avg = st.subjectAverage != null ? `${st.subjectAverage}%` : "—";
                    const att = st.attendanceRate != null ? `${st.attendanceRate}%` : "100%";
                    const needsAttention = st.status === "needs_attention" || (st.attendanceRate && st.attendanceRate < 75);

                    return (
                      <tr
                        key={st.id || idx}
                        style={{
                          borderBottom: idx !== filteredStudents.length - 1 ? `1px solid ${T.border}` : "none",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: T.slate, fontFamily: "monospace" }}>
                          #{st.rollNumber || "101"}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: T.navy }}>
                          {st.name}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: T.navy }}>
                          {avg}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: needsAttention ? T.roseDark : T.navy }}>
                          {att}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "10.5px",
                              fontWeight: 600,
                              background: needsAttention ? T.roseBg : T.greenBg,
                              color: needsAttention ? T.roseDark : T.greenDark,
                            }}
                          >
                            {needsAttention ? "Needs Attention" : "On Track"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => onOpenStudentDossier(st.id)}
                            style={{
                              padding: "4px 12px",
                              fontSize: "11px",
                              fontWeight: 600,
                              background: T.navy,
                              color: T.white,
                              borderRadius: "6px",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Dossier 360 →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
