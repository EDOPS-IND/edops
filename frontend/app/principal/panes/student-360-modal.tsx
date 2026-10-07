"use client";

import React, { useState } from "react";
import { X, GraduationCap, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, BookOpen, Clock, ShieldCheck, HeartHandshake } from "lucide-react";

export function Student360Modal({
  studentData,
  onClose,
  onTriggerIntervention,
}: {
  studentData: any;
  onClose: () => void;
  onTriggerIntervention?: (studentName: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "academics" | "attendance" | "learning_outcomes" | "interventions" | "holistic"
  >("overview");

  if (!studentData) return null;
  const { overview, academics = [], attendance, assignments, learningOutcomes = [], competencies = [], interventions = [], holisticProgress } = studentData;

  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
      <div
        className="modal-card"
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "840px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1E293B" }}>
                  {overview.name} — Student 360° Academic Profile
                </h2>
                <span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                  {overview.className} - {overview.section} (Roll {overview.rollNumber})
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Admission No: {overview.admissionNumber} · Guardian: {overview.guardianName} ({overview.guardianPhone})
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Strip */}
        <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", background: "#FFFFFF", padding: "0 20px", overflowX: "auto" }}>
          {[
            { id: "overview", label: "Academic Snapshot" },
            { id: "academics", label: "Subject Performance & Trend" },
            { id: "attendance", label: "Attendance & Defaulters" },
            { id: "learning_outcomes", label: "Learning Outcomes & Competencies" },
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
                borderBottom: activeTab === t.id ? "2px solid #064E3B" : "2px solid transparent",
                color: activeTab === t.id ? "#064E3B" : "#64748B",
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
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
                      <div style={{ fontSize: "12px", color: "#B91C1C" }}>Mathematics booster clinic assigned with Rahul Sharma. Review scheduled Nov 15.</div>
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
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>{sub.previousScore}%</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "#64748B" }}>Current Score</div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: sub.currentScore < 60 ? "#DC2626" : "#15803D" }}>{sub.currentScore}%</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "90px", justifyContent: "flex-end", fontSize: "12px", fontWeight: 700, color: sub.change < 0 ? "#DC2626" : "#15803D" }}>
                      {sub.change < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      {sub.change > 0 ? `+${sub.change}%` : `${sub.change}%`}
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
                  {attendance?.isDefaulter ? "⚠️ Attendance Defaulter (<75% Threshold)" : "✓ Good Attendance Standing"}
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
