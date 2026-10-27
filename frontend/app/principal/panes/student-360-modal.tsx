"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Clock,
  ShieldCheck,
  ShieldAlert,
  HeartHandshake,
  RefreshCw,
  Mail,
  Calendar,
  Award,
  ChevronRight,
  User,
} from "lucide-react";
import { getPrincipalStudent360, getStudentAvatarUrl } from "../../edops-api";

export function Student360Modal({
  studentData: initialStudentData,
  studentId,
  organizationId,
  onClose,
  onTriggerIntervention,
}: {
  studentData?: any;
  studentId?: string;
  organizationId?: string;
  onClose: () => void;
  onTriggerIntervention?: (studentName: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "academics" | "attendance" | "learning_outcomes" | "interventions" | "holistic"
  >("overview");
  const [loadedData, setLoadedData] = useState<any>(initialStudentData || null);
  const [loading, setLoading] = useState<boolean>(!initialStudentData && !!studentId);

  const fetchDossier = () => {
    if (studentId && organizationId) {
      setLoading(true);
      getPrincipalStudent360(organizationId, studentId)
        .then((res) => {
          setLoadedData(res);
        })
        .catch(() => {
          setLoadedData(null);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (initialStudentData) {
      setLoadedData(initialStudentData);
      return;
    }
    fetchDossier();
  }, [initialStudentData, studentId, organizationId]);

  // Keyboard accessibility and body scroll lock
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const studentData = loadedData;
  const overview = studentData?.overview || {};
  const academics = studentData?.academics || [];
  const attendance = studentData?.attendance || {};
  const assignments = studentData?.assignments || {};
  const learningOutcomes = studentData?.learningOutcomes || [];
  const competencies = studentData?.competencies || [];
  const interventions = studentData?.interventions || [];
  const holisticProgress = studentData?.holisticProgress || {};

  const studentName = overview.name || "Student";
  const admissionNo = overview.admissionNumber || overview.admissionNo || overview.rollNumber || overview.rollNo || "-";
  const attendancePct = overview.attendanceRate ?? overview.attendancePct ?? attendance?.attendancePercentage ?? null;
  const isDefaulter = attendancePct != null && Number(attendancePct) < 75;

  const emailDisplay =
    overview.email ||
    overview.studentEmail ||
    `${studentName.toLowerCase().replace(/[^a-z0-9]/g, "")}@student.edops.edu`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-360-title"
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(12, 30, 51, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {/* ─── Header Matching School Admin Dossier ──────────────────────────── */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid #E2E8F0",
            background: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          {/* Top meta row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "11.5px",
                color: "#64748B",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Student Dossier · #{admissionNo}
            </span>

            <button
              onClick={onClose}
              title="Close (Esc)"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                border: "1px solid #E2E8F0",
                background: "#FFFFFF",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
                e.currentTarget.style.color = "#0C1E33";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFFFF";
                e.currentTarget.style.color = "#64748B";
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Profile Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <div className="edops-skeleton" style={{ width: "100%", height: "100%" }} />
              ) : (
                <img
                  src={overview.photoUrl || overview.avatarUrl || getStudentAvatarUrl(studentName, studentId || admissionNo)}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3
                  id="student-360-title"
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    fontWeight: 600,
                    color: "#0C1E33",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {loading ? "Loading Student Dossier..." : studentName}
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "3px",
                  fontSize: "12px",
                  color: "#64748B",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  Class {overview.className || overview.grade || "-"} {overview.section ? `(${overview.section})` : ""}
                </span>
                <span>·</span>
                <span>Roll #{overview.rollNumber || overview.rollNo || "-"}</span>
                <span>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={12} style={{ color: "#94A3B8" }} />
                  {emailDisplay}
                </span>

                {isDefaulter && (
                  <>
                    <span>·</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: "#FEF2F2",
                        border: "1px solid #FECACA",
                        color: "#B91C1C",
                        fontSize: "11px",
                        fontWeight: 600,
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      <AlertTriangle size={11} />
                      {attendancePct}% Defaulter (&lt;75%)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Underline Tab Navigation Matching School Admin ─────────────── */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            background: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
            padding: "0 20px",
            scrollbarWidth: "none",
            flexShrink: 0,
          }}
        >
          {[
            { id: "overview", label: "Academic Snapshot", icon: GraduationCap },
            { id: "academics", label: "Subject Breakdown & Trends", icon: BookOpen },
            { id: "attendance", label: "Attendance & Defaulters", icon: Calendar },
            { id: "learning_outcomes", label: "Competencies & LOs", icon: Award },
            { id: "interventions", label: "Intervention Dossier", icon: ShieldAlert },
            { id: "holistic", label: "Holistic Progress Card", icon: HeartHandshake },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "11px 14px",
                  fontSize: "12.5px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  background: "transparent",
                  color: isActive ? "#0C1E33" : "#64748B",
                  border: "none",
                  borderBottom: isActive ? "2px solid #0C1E33" : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.12s ease",
                }}
              >
                <TabIcon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Modal Body ────────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {loading ? (
            /* Skeleton Loading State with Authentic Shimmer */
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                      background: "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div className="edops-skeleton" style={{ height: "12px", width: "70%" }} />
                    <div className="edops-skeleton" style={{ height: "24px", width: "50%" }} />
                  </div>
                ))}
              </div>

              <div
                style={{
                  border: "1px solid #E0E5EB",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "#FFFFFF",
                }}
              >
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #E0E5EB", background: "#F8FAFC" }}>
                  <div className="edops-skeleton" style={{ height: "14px", width: "160px" }} />
                </div>
                {Array.from({ length: 4 }).map((_, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      borderBottom: "1px solid #E0E5EB",
                      background: rIdx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                    }}
                  >
                    <div className="edops-skeleton" style={{ height: "14px", width: "140px" }} />
                    <div className="edops-skeleton" style={{ height: "14px", width: "80px" }} />
                    <div className="edops-skeleton" style={{ height: "14px", width: "60px" }} />
                  </div>
                ))}
              </div>
            </div>
          ) : !studentData ? (
            /* Error / Empty State with /bee.png */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 20px",
                textAlign: "center",
              }}
            >
              <img
                src="/bee.png"
                alt="No student records"
                style={{ width: "90px", height: "auto", marginBottom: "16px", opacity: 0.9 }}
              />
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>
                Student Records Not Available
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "12.5px", color: "#64748B", maxWidth: "400px" }}>
                Academic dossier could not be retrieved from campus telemetry.
              </p>
              <button
                type="button"
                onClick={fetchDossier}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  background: "#0C1E33",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={13} /> Retry Loading
              </button>
            </div>
          ) : (
            <>
              {/* 1. Overview Tab */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Overall Average</div>
                      <div style={{ fontSize: "26px", fontWeight: 700, color: (overview.overallAverage || 0) < 65 ? "#DC2626" : "#0C1E33", marginTop: "4px" }}>
                        {overview.overallAverage != null ? `${overview.overallAverage}%` : "—"}
                      </div>
                    </div>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Campus Attendance</div>
                      <div style={{ fontSize: "26px", fontWeight: 700, color: isDefaulter ? "#DC2626" : "#15803D", marginTop: "4px" }}>
                        {attendancePct != null ? `${attendancePct}%` : "—"}
                      </div>
                    </div>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Assignments Turn-in</div>
                      <div style={{ fontSize: "26px", fontWeight: 700, color: (overview.assignmentCompletion || 0) < 70 ? "#DC2626" : "#0C1E33", marginTop: "4px" }}>
                        {overview.assignmentCompletion != null ? `${overview.assignmentCompletion}%` : "—"}
                      </div>
                    </div>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Attention State</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: isDefaulter ? "#B91C1C" : "#0C1E33", marginTop: "10px" }}>
                        {overview.attentionCategory || (isDefaulter ? "Attendance Action" : "On Track")}
                      </div>
                    </div>
                  </div>

                  {overview.attentionCategory && overview.attentionCategory.includes("Support") && (
                    <div
                      style={{
                        background: "#FEF2F2",
                        border: "1px solid #FCA5A5",
                        borderRadius: "10px",
                        padding: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <AlertTriangle size={20} color="#DC2626" />
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B" }}>Intervention Status: Active</div>
                          <div style={{ fontSize: "12px", color: "#B91C1C" }}>See saved interventions for assigned support.</div>
                        </div>
                      </div>
                      {onTriggerIntervention && (
                        <button
                          type="button"
                          onClick={() => onTriggerIntervention(studentName)}
                          style={{
                            background: "#0C1E33",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 14px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Update Plan
                        </button>
                      )}
                    </div>
                  )}

                  {/* Guardian & Contact Meta Box */}
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "#0C1E33" }}>Guardian & Enrollment Record</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12.5px", color: "#475569" }}>
                      <div><b>Guardian:</b> {overview.guardianName || "Not assigned"}</div>
                      <div><b>Emergency Phone:</b> {overview.guardianPhone || "—"}</div>
                      <div><b>Admission Number:</b> {overview.admissionNumber || "—"}</div>
                      <div><b>Current Academic Year:</b> 2026-27</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Academics & Subject Performance Tab */}
              {activeTab === "academics" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {academics.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
                      <p>No subject performance records available.</p>
                    </div>
                  ) : (
                    academics.map((sub: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "14px 18px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C1E33" }}>{sub.subject}</div>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>Instructor: <b>{sub.teacher}</b></div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "11px", color: "#64748B" }}>Previous Term</div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>{sub.previousScore}%</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "11px", color: "#64748B" }}>Current Score</div>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: sub.currentScore < 60 ? "#DC2626" : "#15803D" }}>
                              {sub.currentScore}%
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              width: "90px",
                              justifyContent: "flex-end",
                              fontSize: "12px",
                              fontWeight: 700,
                              color: sub.change < 0 ? "#DC2626" : "#15803D",
                            }}
                          >
                            {sub.change < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                            {sub.change > 0 ? `+${sub.change}%` : `${sub.change}%`}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 3. Attendance Tab */}
              {activeTab === "attendance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div
                    style={{
                      background: attendance?.isDefaulter || isDefaulter ? "#FEF2F2" : "#F0FDF4",
                      border: "1px solid",
                      borderColor: attendance?.isDefaulter || isDefaulter ? "#FCA5A5" : "#BBF7D0",
                      borderRadius: "10px",
                      padding: "16px",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 700, color: attendance?.isDefaulter || isDefaulter ? "#991B1B" : "#166534" }}>
                      {attendance?.isDefaulter || isDefaulter ? "Attendance Defaulter (< 75% Threshold)" : "Good Attendance Standing"}
                    </div>
                    <div style={{ fontSize: "12.5px", color: attendance?.isDefaulter || isDefaulter ? "#B91C1C" : "#15803D", marginTop: "3px" }}>
                      Present: <b>{attendance?.presentDays || "—"} / {attendance?.totalWorkingDays || "—"} days</b> ({attendancePct}%)
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "#0C1E33" }}>Recent Absence Incidents</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(attendance?.recentAbsences || []).length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#64748B", background: "#F8FAFC", borderRadius: "8px" }}>
                          No recent absence incidents logged.
                        </div>
                      ) : (
                        (attendance?.recentAbsences || []).map((abs: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              borderRadius: "8px",
                              padding: "12px 16px",
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12.5px",
                            }}
                          >
                            <span>Date: <b>{abs.date}</b> ({abs.reason})</span>
                            <span style={{ color: abs.parentNotified ? "#15803D" : "#D97706", fontWeight: 600 }}>
                              {abs.parentNotified ? "Parent Contacted" : "Notification Pending"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Learning Outcomes Tab */}
              {activeTab === "learning_outcomes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {learningOutcomes.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
                      <p>No competency and learning outcome mastery scores recorded.</p>
                    </div>
                  ) : (
                    learningOutcomes.map((lo: any, idx: number) => (
                      <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33" }}>
                            {lo.loCode} — {lo.description}
                          </span>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: lo.mastery < 50 ? "#DC2626" : "#15803D" }}>
                            {lo.mastery}%
                          </span>
                        </div>
                        <div style={{ height: "6px", width: "100%", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${lo.mastery}%`, background: lo.mastery < 50 ? "#DC2626" : "#0C1E33" }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 5. Interventions Tab */}
              {activeTab === "interventions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {interventions.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
                      <p>No active interventions recorded for this student.</p>
                    </div>
                  ) : (
                    interventions.map((it: any, idx: number) => (
                      <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>{it.problemArea}</h4>
                          <span style={{ background: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                            {it.status}
                          </span>
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#475569", display: "flex", flexDirection: "column", gap: "5px" }}>
                          <div><b>Evidence:</b> {it.evidence}</div>
                          <div><b>Target Goal:</b> {it.goal}</div>
                          <div><b>Intervention Strategy:</b> {it.interventionStrategy}</div>
                          <div>Responsible Faculty: <b>{it.responsibleTeacherName}</b> · Scheduled Review: <b>{it.reviewDate}</b></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 6. Holistic Progress Card Tab */}
              {activeTab === "holistic" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "16px" }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#166534" }}>
                      CBSE Holistic Progress Card (HPC)
                    </h4>
                    <p style={{ margin: 0, fontSize: "12px", color: "#15803D" }}>
                      Multi-dimensional developmental evaluation across cognitive, socio-emotional & creative domains.
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12.5px" }}>
                    <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                      <div style={{ fontWeight: 700, color: "#0C1E33", marginBottom: "4px" }}>Cognitive Trajectory</div>
                      <div style={{ color: "#475569" }}>{holisticProgress?.cognitiveSummary || "Demonstrating consistent analytical reasoning across coursework."}</div>
                    </div>
                    <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                      <div style={{ fontWeight: 700, color: "#0C1E33", marginBottom: "4px" }}>Affective & Socio-Emotional</div>
                      <div style={{ color: "#475569" }}>{holisticProgress?.socioEmotionalSummary || "Collaborative team member in class projects."}</div>
                    </div>
                    <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                      <div style={{ fontWeight: 700, color: "#0C1E33", marginBottom: "4px" }}>Psychomotor & Laboratory Safety</div>
                      <div style={{ color: "#475569" }}>{holisticProgress?.psychomotorSummary || "Adheres to institutional safety guidelines."}</div>
                    </div>
                    <div style={{ background: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                      <div style={{ fontWeight: 700, color: "#0C1E33", marginBottom: "4px" }}>Creativity & Co-Curricular</div>
                      <div style={{ color: "#475569" }}>{holisticProgress?.creativeSummary || "Active participant in school cultural and sports programs."}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── Footer ────────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #E2E8F0",
            background: "#F8FAFC",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#0C1E33",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "12.5px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
