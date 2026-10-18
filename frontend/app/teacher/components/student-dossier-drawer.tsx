"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  GraduationCap,
  Calendar,
  ClipboardList,
  Award,
  AlertTriangle,
  Mail,
  ShieldCheck,
  TrendingUp,
  FileText,
  Phone,
  BookOpen,
} from "lucide-react";
import { getTeacherStudent360 } from "../../edops-api";

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
  violetBg: "#e1d2ff",
  violetDark: "#4a0e8f",
  amberBg: "#fde1ac",
  amberDark: "#614400",
  roseBg: "#ffd6d6",
  roseDark: "#7a1a1a",
  peachBg: "#ffd8c7",
  peachDark: "#782a00",
};

interface StudentDossierDrawerProps {
  isOpen?: boolean;
  studentId: string | null;
  organizationId: string;
  onClose: () => void;
  onOpenIntervention?: (studentId: string) => void;
}

export function StudentDossierDrawer({
  isOpen,
  studentId,
  organizationId,
  onClose,
  onOpenIntervention,
}: StudentDossierDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "assessments" | "assignments" | "competencies" | "interventions">("overview");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (studentId && isOpen) {
      loadDossier();
    }
  }, [studentId, organizationId, isOpen]);

  if (!isOpen || !studentId) {
    return null;
  }

  async function loadDossier() {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await getTeacherStudent360(organizationId, studentId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const rollNumber = data?.student?.rollNumber || "—";
  const studentName = data?.student?.name || "Student Profile";
  const classSection = data?.student?.classSection || "";
  const subjectName = data?.subjectScope?.subjectName || "Assigned Subject";
  const guardianName = data?.student?.guardianName || "Parent / Guardian";
  const guardianPhone = data?.student?.guardianPhone;

  // Real numerical stats directly from database
  const rawAverage = data?.subjectScope?.currentAverage;
  const currentAverage = rawAverage != null 
    ? `${Math.round(Number(rawAverage))}%` 
    : "—";
  
  const rawAttendance = data?.attendance?.subjectAttendancePct;
  const attendanceRate = rawAttendance != null 
    ? `${Math.round(Number(rawAttendance))}%` 
    : "—";
  
  const classesAttended = data?.attendance?.classesAttended ?? 0;
  const totalClasses = data?.attendance?.totalClassesConducted ?? 0;

  const rawCompletion = data?.assignments?.completionRate;
  const completionRate = rawCompletion != null 
    ? `${Math.round(Number(rawCompletion))}%` 
    : "—";

  const submittedAssignments = data?.assignments?.submitted ?? 0;
  const totalAssignments = data?.assignments?.totalAssigned ?? 0;

  const strengths = data?.strengths && data.strengths.length > 0
    ? data.strengths
    : ["Actively enrolled in classroom roster", "Initial observation and performance assessment in progress"];

  const weakAreas = data?.weakAreas && data.weakAreas.length > 0
    ? data.weakAreas
    : ["Continuous evaluation underway to determine targeted learning support"];

  const competencies = data?.competencies && data.competencies.length > 0
    ? data.competencies
    : [
        { competency: "Core Conceptual Mastery", level: "In Progress", evidence: "Initial formative exercises pending" },
        { competency: "Practical Application", level: "In Progress", evidence: "Awaiting coursework submissions" },
      ];

  const assessments = data?.assessments || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        overflow: "hidden",
        background: "rgba(12, 30, 51, 0.45)",
        backdropFilter: "blur(2px)",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          maxWidth: "680px",
          width: "100%",
          background: T.white,
          boxShadow: "0 0 50px rgba(12, 30, 51, 0.25)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: T.white,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "6px",
                  background: T.chip,
                  border: `1px solid ${T.border}`,
                  color: T.navy,
                }}
              >
                Roll #{rollNumber}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "6px",
                  background: T.greenBg,
                  color: T.greenDark,
                }}
              >
                {data?.subjectScope?.status || "Active Student"}
              </span>
              <span style={{ fontSize: "12px", color: T.slate, fontWeight: 500 }}>
                {classSection} • {subjectName}
              </span>
            </div>
            <h2 style={{ margin: "2px 0 0 0", fontSize: "20px", fontWeight: 600, color: T.navy, letterSpacing: "-0.01em" }}>
              {studentName}
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: T.slate }}>
              Guardian: {guardianName} {guardianPhone ? `(${guardianPhone})` : ""} • Scope: {subjectName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: T.slate,
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

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${T.border}`,
            padding: "0 24px",
            gap: "20px",
            fontSize: "12px",
            fontWeight: 600,
            background: T.white,
            overflowX: "auto",
          }}
        >
          {[
            { id: "overview", label: "Subject Overview" },
            { id: "assessments", label: "Tests & Scores" },
            { id: "assignments", label: "Coursework" },
            { id: "competencies", label: "Competencies" },
            { id: "interventions", label: "Remedial & Support" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "12px 0",
                  border: "none",
                  background: "transparent",
                  borderBottom: active ? `2px solid ${T.navy}` : "2px solid transparent",
                  color: active ? T.navy : T.slate,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", fontSize: "12px" }}>
          {loading ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: T.slate }}>
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
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>Loading student dossier...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Top 3 Metric Cards - Pastel Palette */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                    {/* Subject Average (Pastel Violet) */}
                    <div
                      style={{
                        padding: "16px",
                        background: T.violetBg,
                        border: `1px solid ${T.violetBg}`,
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "110px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: T.violetDark }}>
                        Subject Average
                      </div>
                      <p style={{ margin: "6px 0 2px 0", fontSize: "28px", fontWeight: 700, lineHeight: 1, color: T.violetDark }}>
                        {currentAverage}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: T.violetDark, fontWeight: 500 }}>
                        {data?.subjectScope?.improvementPct ? `${data.subjectScope.improvementPct} vs last term` : "Continuous evaluation"}
                      </p>
                    </div>

                    {/* Attendance (Pastel Mint) */}
                    <div
                      style={{
                        padding: "16px",
                        background: T.greenBg,
                        border: `1px solid ${T.greenBg}`,
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "110px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: T.greenDark }}>
                        Attendance
                      </div>
                      <p style={{ margin: "6px 0 2px 0", fontSize: "28px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
                        {attendanceRate}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: T.greenDark, fontWeight: 500 }}>
                        {totalClasses > 0 ? `${classesAttended} / ${totalClasses} periods attended` : "No classes recorded yet"}
                      </p>
                    </div>

                    {/* Coursework (Pastel Peach) */}
                    <div
                      style={{
                        padding: "16px",
                        background: T.peachBg,
                        border: `1px solid ${T.peachBg}`,
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "110px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: T.peachDark }}>
                        Assignments
                      </div>
                      <p style={{ margin: "6px 0 2px 0", fontSize: "28px", fontWeight: 700, lineHeight: 1, color: T.peachDark }}>
                        {completionRate}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: T.peachDark, fontWeight: 500 }}>
                        {totalAssignments > 0 ? `${submittedAssignments} / ${totalAssignments} submitted` : "No coursework assigned yet"}
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div
                      style={{
                        padding: "16px",
                        background: T.white,
                        border: `1px solid ${T.border}`,
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: T.greenDark }}>
                        Observed Strengths
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px", color: T.slate, fontSize: "12px" }}>
                        {strengths.map((str: string, i: number) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        background: T.white,
                        border: `1px solid ${T.border}`,
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: T.roseDark }}>
                        Gaps Requiring Attention
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "6px", color: T.slate, fontSize: "12px" }}>
                        {weakAreas.map((gap: string, i: number) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "assessments" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy }}>
                    Recent Subject Assessments
                  </h4>
                  {assessments.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", color: T.slate, border: `1px solid ${T.border}`, borderRadius: "10px", background: T.white }}>
                      No formal subject assessments recorded yet for this student.
                    </div>
                  ) : (
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden", background: T.white }}>
                      {assessments.map((asmt: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: i !== assessments.length - 1 ? `1px solid ${T.border}` : "none",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: T.navy }}>{asmt.name}</div>
                            <div style={{ color: T.slate, fontSize: "11px", marginTop: "2px" }}>Date: {asmt.date}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: T.navy }}>
                              {asmt.score} / {asmt.maxMarks}
                            </div>
                            <span style={{ fontSize: "11px", color: T.slate }}>
                              {asmt.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "assignments" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy }}>
                    Coursework & Homework Log
                  </h4>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: "10px", overflow: "hidden", background: T.white }}>
                    <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, background: T.chip }}>
                      <span style={{ fontWeight: 600, color: T.navy }}>Assignment Pacing</span>
                      <span style={{ fontWeight: 600, color: T.navy }}>{submittedAssignments} of {totalAssignments} Turned In</span>
                    </div>
                    <div style={{ padding: "20px", color: T.slate, fontSize: "12px", lineHeight: 1.6 }}>
                      {submittedAssignments >= totalAssignments ? (
                        <p style={{ margin: 0 }}>All scheduled exercises and homework sets have been submitted on time.</p>
                      ) : (
                        <p style={{ margin: 0 }}>Student has {totalAssignments - submittedAssignments} pending coursework task(s) awaiting completion.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "competencies" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy }}>
                    Competency-Based Evaluation
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {competencies.map((c: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          padding: "14px 16px",
                          background: T.white,
                          borderRadius: "10px",
                          border: `1px solid ${T.border}`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600, color: T.navy }}>
                          <span>{c.competency}</span>
                          <span style={{ color: T.blue, fontWeight: 600, background: T.chip, padding: "2px 8px", borderRadius: "6px" }}>{c.level}</span>
                        </div>
                        <p style={{ margin: "6px 0 0 0", color: T.slate, fontSize: "12px" }}>{c.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "interventions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy }}>
                      Active Interventions & Remedials
                    </h4>
                    {onOpenIntervention && (
                      <button
                        type="button"
                        onClick={() => onOpenIntervention(studentId)}
                        style={{
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: T.navy,
                          color: T.white,
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        + Create Remedial Action
                      </button>
                    )}
                  </div>
                  {data?.activeInterventions && data.activeInterventions.length > 0 ? (
                    data.activeInterventions.map((inv: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          padding: "14px 16px",
                          background: T.amberBg,
                          border: `1px solid ${T.amberBg}`,
                          borderRadius: "10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600, color: T.amberDark }}>
                          <span>{inv.type}: {inv.problemArea}</span>
                          <span style={{ fontSize: "10px", background: "rgba(97,68,0,0.15)", color: T.amberDark, padding: "2px 8px", borderRadius: "10px" }}>{inv.status}</span>
                        </div>
                        <p style={{ margin: "4px 0", color: T.navy }}>Goal: {inv.goal}</p>
                        <div style={{ color: T.slate, fontSize: "11px" }}>Review Date: {inv.reviewDate}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "28px", textAlign: "center", color: T.slate, border: `1px dashed ${T.border}`, borderRadius: "10px", background: T.white }}>
                      No active remedial interventions assigned to this student.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Action Bar */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: T.white,
          }}
        >
          <span style={{ fontSize: "11px", color: T.slate, fontWeight: 500 }}>
            Subject-scoped access compliant with NEP-2020 student privacy
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            {onOpenIntervention && (
              <button
                type="button"
                onClick={() => onOpenIntervention(studentId)}
                style={{
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: T.navy,
                  color: T.white,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(12,30,51,0.2)",
                }}
              >
                Assign Remedial Support
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                color: T.slate,
                background: T.white,
                border: `1px solid ${T.line}`,
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
