"use client";

import React, { useState } from "react";
import { StudentListItem } from "../types";
import {
  Search,
  User,
  AlertTriangle,
  ShieldCheck,
  Plus,
  ArrowRight,
  Award,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  HeartPulse,
} from "lucide-react";
import { getStudentAvatarUrl } from "../../edops-api";

const S = {
  navy: "#0c1e33",
  slate: "#495d72",
  muted: "#a6abb5",
  faint: "#b3b3b3",
  bg: "#f4f6f7",
  white: "#ffffff",
  border: "#e4e6e9",
  line: "#ced8e5",
  chip: "#f5f6f8",
  greenBg: "#ccefbf",
  greenDk: "#1a5c0a",
  violetBg: "#e1d2ff",
  violetDk: "#4a0e8f",
  skyBg: "#bae5f5",
  skyDk: "#0a5a7a",
  peachBg: "#ffd8c7",
  peachDk: "#782a00",
};

export function StudentsPane({
  students = [],
  atRiskData,
  onOpenStudent360,
  onTriggerIntervention,
  onTriggerRemedial,
  onTriggerEnrichment,
  organizationId,
  initialTab,
}: {
  students?: StudentListItem[];
  atRiskData?: any;
  onOpenStudent360: (studentId: string) => void;
  onTriggerIntervention?: (studentName?: string) => void;
  onTriggerRemedial?: () => void;
  onTriggerEnrichment?: () => void;
  organizationId?: string;
  initialTab?: string;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [subTab, setSubTab] = useState<"all" | "at_risk" | "remedial" | "enrichment">((initialTab as any) || "all");
  const [searchTerm, setSearchTerm] = useState("");

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalStudents }) => {
      getPrincipalStudents(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const studentList = (liveData?.students && liveData.students.length > 0) ? liveData.students : students;
  const filtered = studentList.filter((s: any) =>
    (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.className || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgScore = studentList.length
    ? Math.round(studentList.reduce((acc: number, s: any) => acc + (Number(s.overallAverage) || 0), 0) / studentList.length)
    : 0;

  const avgAtt = studentList.length
    ? Math.round(studentList.reduce((acc: number, s: any) => acc + (Number(s.attendanceRate) || 0), 0) / studentList.length)
    : 0;

  const atRiskCount = studentList.filter(
    (s: any) => s.needsIntervention || (s.overallAverage != null && s.overallAverage < 65) || (s.attendanceRate != null && s.attendanceRate < 75)
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ═══════════════════════════════════════════════
          1. TOP 4 PASTEL METRIC CARDS (148PX)
      ═══════════════════════════════════════════════ */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {/* Card 1: Total Students (Pastel Mint) */}
        <article
          onClick={() => setSubTab("all")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: S.greenBg,
            border: `1px solid ${S.greenBg}`,
            borderRadius: "10px",
            color: S.greenDk,
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Students
            </span>
            <GraduationCap size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: S.greenDk }}>
            {studentList.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Active enrolled cohorts</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              Roster <ArrowRight size={13} />
            </span>
          </div>
        </article>

        {/* Card 2: Academic Average (Pastel Violet) */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: S.violetBg,
            border: `1px solid ${S.violetBg}`,
            borderRadius: "10px",
            color: S.violetDk,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Cohort Academic Average
            </span>
            <TrendingUp size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: S.violetDk }}>
            {avgScore}%
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Cumulative examination grade</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Benchmark</span>
          </div>
        </article>

        {/* Card 3: Attendance Rate (Pastel Sky) */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: S.skyBg,
            border: `1px solid ${S.skyBg}`,
            borderRadius: "10px",
            color: S.skyDk,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Attendance Compliance
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: S.skyDk }}>
            {avgAtt}%
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Campus register verified</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Attendance</span>
          </div>
        </article>

        {/* Card 4: Attention Category (Pastel Coral) */}
        <article
          onClick={() => setSubTab("at_risk")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: S.peachBg,
            border: `1px solid ${S.peachBg}`,
            borderRadius: "10px",
            color: S.peachDk,
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Requires Attention
            </span>
            <AlertTriangle size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: S.peachDk }}>
            {atRiskCount} Students
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Intervention triggers active</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              Triage <ArrowRight size={13} />
            </span>
          </div>
        </article>
      </section>

      {/* ═══════════════════════════════════════════════
          2. SUBTAB SELECTOR & ACTION ENGINE
      ═══════════════════════════════════════════════ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: `1px solid ${S.border}`, paddingBottom: "12px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "all", label: "All Students Roster" },
            { id: "at_risk", label: "Attention & At-Risk" },
            { id: "remedial", label: "Remedial Programs" },
            { id: "enrichment", label: "Enrichment Programs" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              style={{
                all: "unset",
                boxSizing: "border-box",
                padding: "7px 14px",
                borderRadius: "6px",
                border: `1px solid ${subTab === t.id ? S.navy : S.border}`,
                background: subTab === t.id ? S.navy : S.white,
                color: subTab === t.id ? "#ffffff" : S.slate,
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => onTriggerIntervention?.()}
            style={{
              padding: "7px 14px",
              background: S.navy,
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={13} /> + New Intervention
          </button>
          <button
            onClick={onTriggerRemedial}
            style={{
              padding: "7px 14px",
              background: S.white,
              color: S.navy,
              border: `1px solid ${S.border}`,
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Remedial Camp
          </button>
          <button
            onClick={onTriggerEnrichment}
            style={{
              padding: "7px 14px",
              background: S.white,
              color: S.navy,
              border: `1px solid ${S.border}`,
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Enrichment Cohort
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          3. ROSTER TAB (ALL STUDENTS)
      ═══════════════════════════════════════════════ */}
      {subTab === "all" && (
        <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: "300px" }}>
              <Search size={15} color="#94A3B8" style={{ position: "absolute", left: "10px", top: "10px" }} />
              <input
                type="text"
                placeholder="Search by student name, class, or roll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 32px",
                  borderRadius: "6px",
                  border: `1px solid ${S.border}`,
                  fontSize: "12px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <span style={{ fontSize: "12px", color: S.slate }}>
              Showing {filtered.length} of {studentList.length} enrolled students
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: S.chip, borderBottom: `1px solid ${S.border}`, color: S.slate, fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Student</th>
                  <th style={{ padding: "12px 16px" }}>Class / Section</th>
                  <th style={{ padding: "12px 16px" }}>Average Grade</th>
                  <th style={{ padding: "12px 16px" }}>Attendance</th>
                  <th style={{ padding: "12px 16px" }}>Assignments</th>
                  <th style={{ padding: "12px 16px" }}>Risk Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>360° Dossier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: S.faint }}>
                      No matching students found in this school cohort.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s: any, idx: number) => {
                    const isAtRisk = s.needsIntervention || (s.overallAverage != null && s.overallAverage < 65) || (s.attendanceRate != null && s.attendanceRate < 75);
                    return (
                      <tr
                        key={s.id || idx}
                        style={{ borderBottom: `1px solid ${S.border}`, cursor: "pointer", transition: "background 0.15s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        onClick={() => onOpenStudent360(s.id)}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                background: S.chip,
                                border: `1px solid ${S.border}`,
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={getStudentAvatarUrl(s.name, s.rollNumber || s.id)}
                                alt={s.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: S.navy }}>{s.name}</div>
                              <div style={{ color: S.faint, fontSize: "11px" }}>Roll #{s.rollNumber || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", color: S.slate, fontWeight: 500 }}>
                          {s.className} {s.sectionName ? `(${s.sectionName})` : ""}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: s.overallAverage < 65 ? "#DC2626" : S.navy }}>
                          {s.overallAverage != null ? `${s.overallAverage}%` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 650, color: s.attendanceRate < 75 ? "#B45309" : S.greenDk }}>
                          {s.attendanceRate != null ? `${s.attendanceRate}%` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", color: S.slate }}>
                          {s.assignmentCompletion != null ? `${s.assignmentCompletion}%` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: isAtRisk ? "#FEE2E2" : "#ECFDF5",
                              color: isAtRisk ? "#991B1B" : "#047857",
                            }}
                          >
                            {isAtRisk ? "Intervention Needed" : "On Track"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStudent360(s.id);
                            }}
                            style={{
                              padding: "6px 12px",
                              background: S.navy,
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            Inspect 360°
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          4. AT-RISK ATTENTION ENGINE TAB
      ═══════════════════════════════════════════════ */}
      {subTab === "at_risk" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "16px 20px" }}>
            <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#991B1B" }}>
              Evidence-Based Attention Engine
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#B91C1C" }}>
              Dynamic threshold violations (&lt;75% attendance, grade drop &gt;10%, overdue coursework). Click any student to review individualized learning plans.
            </p>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {studentList
              .filter((s: any) => s.needsIntervention || (s.overallAverage != null && s.overallAverage < 65) || (s.attendanceRate != null && s.attendanceRate < 75))
              .map((st: any, idx: number) => (
                <div
                  key={st.id || idx}
                  style={{
                    background: S.white,
                    border: `1px solid ${S.border}`,
                    borderRadius: "10px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: S.chip,
                        border: `1px solid ${S.border}`,
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={getStudentAvatarUrl(st.name, st.rollNumber || st.id)}
                        alt={st.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: S.navy }}>{st.name}</span>
                        <span style={{ background: S.chip, color: S.slate, padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                          Class {st.className}
                        </span>
                        <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                          Attendance: {st.attendanceRate}% • Average: {st.overallAverage}%
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: S.slate, marginTop: "4px" }}>
                        Assigned Intervention: <b>Remedial Support</b> • Status: <span style={{ color: "#B45309", fontWeight: 650 }}>Active Review</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenStudent360(st.id)}
                    style={{
                      background: S.navy,
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Open 360° Profile
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          5. REMEDIAL & ENRICHMENT TABS
      ═══════════════════════════════════════════════ */}
      {(subTab === "remedial" || subTab === "enrichment") && (
        <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: "10px", padding: "24px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: S.navy }}>
            {subTab === "remedial" ? "Remedial Coaching & Academic Booster Camps" : "Enrichment & Advanced Olympiad Cohorts"}
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: S.slate }}>
            Targeted pedagogical sessions designed to close achievement gaps or challenge high-potential students.
          </p>

          <div
            style={{
              padding: "32px",
              textAlign: "center",
              background: S.chip,
              borderRadius: "8px",
              border: `1px dashed ${S.border}`,
              color: S.slate,
              fontSize: "13px",
            }}
          >
            {subTab === "remedial"
              ? "All registered remedial booster sessions are synchronized with faculty rosters."
              : "Advanced learning cohorts are active and integrated with the institutional calendar."}
          </div>
        </div>
      )}
    </div>
  );
}
