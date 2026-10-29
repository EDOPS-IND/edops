"use client";

import React, { useState, useEffect } from "react";
import { X, GraduationCap, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, BookOpen, Clock, ShieldCheck, HeartHandshake, RefreshCw } from "lucide-react";
import { getPrincipalStudent360 } from "../../edops-api";

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-360-title"
      className="modal-backdrop"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(12, 30, 51, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "16px" }}
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
          maxWidth: "860px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", color: "#065F46" }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 id="student-360-title" style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0C1E33" }}>
                  {loading ? "Loading Student Dossier..." : overview.name ? `${overview.name} — Student 360° Profile` : "Student 360° Academic Profile"}
                </h2>
                {overview.className && (
                  <span style={{ background: "#0C1E33", color: "#FFFFFF", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                    {overview.className} - {overview.section} (Roll {overview.rollNumber || "—"})
                  </span>
                )}
              </div>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Admission No: {overview.admissionNumber || "—"} · Class Teacher: <b>{overview.classTeacher || "Not Assigned"}</b> · Guardian: {overview.guardianName || "Not assigned"} ({overview.guardianPhone || "—"})
              </span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close dialog" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B", padding: "6px" }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Strip */}
        <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", background: "#FFFFFF", padding: "0 20px", overflowX: "auto" }}>
          {[
            { id: "overview", label: "Academic Snapshot" },
            { id: "academics", label: "Subject Breakdown & Trends" },
            { id: "attendance", label: "Attendance & Defaulters" },
            { id: "learning_outcomes", label: "Competencies & LOs" },
            { id: "interventions", label: "Intervention Dossier" },
            { id: "holistic", label: "Holistic Progress Card" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: "12px 14px",
                border: "none",
                background: "transparent",
                borderBottom: activeTab === t.id ? "2px solid #0C1E33" : "2px solid transparent",
                color: activeTab === t.id ? "#0C1E33" : "#64748B",
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {loading ? (
            /* Skeleton Loading State */
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ height: "76px", background: "#F1F5F9", borderRadius: "8px" }} />
                ))}
              </div>
              <div style={{ height: "240px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }} />
            </div>
          ) : !studentData ? (
            /* Error / Empty State */
            <div style={{ padding: "48px 20px", textAlign: "center", color: "#64748B" }}>
              <AlertTriangle size={36} style={{ margin: "0 auto 12px", color: "#D97706" }} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>Student Records Not Available</h3>
              <p style={{ margin: "6px 0 16px", fontSize: "13px" }}>Academic dossier could not be retrieved from campus telemetry.</p>
              <button
                type="button"
                onClick={fetchDossier}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 16px",
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Overall Average</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: overview.overallAverage < 65 ? "#DC2626" : "#1E293B" }}>
                    {overview.overallAverage}%
                  </div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Campus Attendance</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: overview.attendanceRate < 75 ? "#DC2626" : "#15803D" }}>
                    {overview.attendanceRate}%
                  </div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Assignments Turn-in</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: overview.assignmentCompletion < 70 ? "#DC2626" : "#065F46" }}>
                    {overview.assignmentCompletion}%
                  </div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Attention State</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#B91C1C", marginTop: "4px" }}>
                    {overview.attentionCategory}
                  </div>
                </div>
              </div>

              {overview.attentionCategory && overview.attentionCategory.includes("Support") && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertTriangle size={20} color="#DC2626" />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B" }}>Intervention Status: Active</div>
                      <div style={{ fontSize: "12px", color: "#B91C1C" }}>See saved interventions for assigned support.</div>
                    </div>
                  </div>
                  {onTriggerIntervention && (
                    <button
                      onClick={() => onTriggerIntervention(overview.name)}
                      style={{ background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Update Plan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Academics & Subject Performance Tab */}
          {activeTab === "academics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {academics.map((sub: any, idx: number) => (
                <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>{sub.subject}</div>
                    <div style={{ fontSize: "12px", color: "#64748B" }}>Instructor: <b>{sub.teacher}</b></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "#64748B" }}>Previous Term</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>{sub.previousScore != null ? `${sub.previousScore}%` : "—"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "#64748B" }}>Current Score</div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: sub.currentScore == null ? "#64748B" : sub.currentScore < 60 ? "#DC2626" : "#15803D" }}>
                        {sub.currentScore != null ? `${sub.currentScore}%` : "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "90px", justifyContent: "flex-end", fontSize: "12px", fontWeight: 700, color: sub.change == null ? "#64748B" : sub.change < 0 ? "#DC2626" : "#15803D" }}>
                      {sub.change == null ? (
                        <span style={{ fontSize: "11px", color: "#94A3B8" }}>No trend</span>
                      ) : (
                        <>
                          {sub.change < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                          {sub.change > 0 ? `+${sub.change}%` : `${sub.change}%`}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Attendance Tab */}
          {activeTab === "attendance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: attendance?.isDefaulter ? "#FEF2F2" : "#F0FDF4", border: "1px solid", borderColor: attendance?.isDefaulter ? "#FCA5A5" : "#BBF7D0", borderRadius: "8px", padding: "14px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: attendance?.isDefaulter ? "#991B1B" : "#166534" }}>
                  {attendance?.isDefaulter ? "Attendance Defaulter (<75% Threshold)" : "Good Attendance Standing"}
                </div>
                <div style={{ fontSize: "12px", color: attendance?.isDefaulter ? "#B91C1C" : "#15803D", marginTop: "2px" }}>
                  Present: <b>{attendance?.presentDays} / {attendance?.totalWorkingDays} days</b> ({attendance?.attendancePercentage}%)
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>Recent Absence Incidents</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(attendance?.recentAbsences || []).map((abs: any, idx: number) => (
                    <div key={idx} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>Date: <b>{abs.date}</b> ({abs.reason})</span>
                      <span style={{ color: abs.parentNotified ? "#15803D" : "#D97706", fontWeight: 600 }}>
                        {abs.parentNotified ? "Parent Contacted" : "Notification Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Learning Outcomes Tab */}
          {activeTab === "learning_outcomes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {learningOutcomes.map((lo: any, idx: number) => (
                <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1E293B" }}>{lo.loCode} — {lo.description}</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: lo.mastery < 50 ? "#DC2626" : "#15803D" }}>{lo.mastery}%</span>
                  </div>
                  <div style={{ height: "6px", width: "100%", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${lo.mastery}%`, background: lo.mastery < 50 ? "#DC2626" : "#065F46" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. Interventions Tab */}
          {activeTab === "interventions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {interventions.map((it: any, idx: number) => (
                <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{it.problemArea}</h4>
                    <span style={{ background: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>{it.status}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div><b>Evidence:</b> {it.evidence}</div>
                    <div><b>Target Goal:</b> {it.goal}</div>
                    <div><b>Intervention Strategy:</b> {it.interventionStrategy}</div>
                    <div>Responsible Faculty: <b>{it.responsibleTeacherName}</b> · Scheduled Review: <b>{it.reviewDate}</b></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6. Holistic Progress Card Tab (CBSE HPC layer, Section 27) */}
          {activeTab === "holistic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", padding: "14px" }}>
                <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#166534" }}>CBSE Holistic Progress Card (HPC)</h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#15803D" }}>Multi-dimensional developmental evaluation across cognitive, socio-emotional & creative domains.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>Cognitive Trajectory</div>
                  <div style={{ color: "#475569" }}>{holisticProgress?.cognitiveSummary}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>Affective & Socio-Emotional</div>
                  <div style={{ color: "#475569" }}>{holisticProgress?.socioEmotionalSummary}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>Psychomotor & Laboratory Safety</div>
                  <div style={{ color: "#475569" }}>{holisticProgress?.psychomotorSummary}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>Creativity & Co-Curricular</div>
                  <div style={{ color: "#475569" }}>{holisticProgress?.creativeSummary}</div>
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ background: "#1E293B", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
