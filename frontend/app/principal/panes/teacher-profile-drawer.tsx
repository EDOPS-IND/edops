"use client";

import React, { useState } from "react";
import { getPrincipalTeacherProfile } from "../../edops-api";
import { X, User } from "lucide-react";

type Tab = "overview" | "workload" | "classes" | "observations" | "development";
type TeacherProfile = {
  overview: { name: string; email: string; department: string | null; memberSince: string | null };
  workload: { weeklyPeriods: number; classesTaught: number; studentCount: number };
  metrics: { lessonPlanCompliance: number | null; professionalDevelopmentHours: number };
  classes: { id: string; className: string; subject: string; studentCount: number }[];
  observations: { id: string; overallRating: string; observationDate: string; lessonTopic: string; strengths: string; areasForImprovement: string; actionItems: string }[];
  developments: { id: string; category: string; status: string; title: string; provider: string; trainingHours: number }[];
};

export function TeacherProfileDrawer({
  teacherId,
  organizationId,
  onClose,
}: {
  teacherId: string;
  organizationId: string;
  onClose: () => void;
}) {
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  React.useEffect(() => {
    let active = true;
    getPrincipalTeacherProfile(organizationId, teacherId)
      .then((profile) => { if (active) setTeacherProfile(profile); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load teacher dossier"); });
    return () => { active = false; };
  }, [organizationId, teacherId]);

  const { overview, workload, metrics, classes = [], observations = [], developments = [] } = teacherProfile ?? {};
  const percentage = (value: number | null | undefined) => value == null ? "—" : `${value}%`;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }}>
      <div
        style={{
          background: "#FFFFFF",
          width: "100%",
          maxWidth: "780px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 25px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", color: "#1D4ED8" }}>
              <User size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1E293B" }}>
                {overview?.name ?? "Teacher Academic Dossier"}
              </h2>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                {overview?.email ?? ""}{overview?.department ? ` · ${overview.department}` : ""}
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
            { id: "overview", label: "Academic Overview" },
            { id: "workload", label: "Workload & Periods" },
            { id: "classes", label: "Assigned Classes" },
            { id: "observations", label: "Observations & Rubric" },
            { id: "development", label: "Professional Development" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
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

        {/* Body Content */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && <div role="alert">{error}</div>}
          {!teacherProfile && !error && <div>Loading teacher dossier…</div>}
          {teacherProfile && <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Faculty Profile</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                  <div>Official Email: <b>{overview?.email}</b></div>
                  <div>Member since: <b>{overview?.memberSince ? new Date(overview.memberSince).toLocaleDateString() : "—"}</b></div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#1E40AF", fontWeight: 600 }}>Lesson Plan Compliance</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#1D4ED8" }}>{percentage(metrics?.lessonPlanCompliance)}</div>
                </div>
                <div style={{ background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#6B21A8", fontWeight: 600 }}>Completed Training Hours</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#7E22CE" }}>{metrics?.professionalDevelopmentHours ?? 0}h</div>
                </div>
              </div>
            </div>
          )}

          {/* Workload Tab */}
          {activeTab === "workload" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>Weekly Period Allocation</h4>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#1E293B", marginBottom: "4px" }}>
                  {workload?.weeklyPeriods ?? 0} <span style={{ fontSize: "14px", fontWeight: 500, color: "#64748B" }}>scheduled periods weekly</span>
                </div>
                <div style={{ fontSize: "13px", color: "#475569", marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div>• <b>Classes Taught:</b> {workload?.classesTaught} sections ({workload?.studentCount} students total load)</div>
                </div>
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === "classes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {classes.length === 0 && <p>No class assignments recorded.</p>}
              {classes.map((cls) => (
                <div key={cls.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>{cls.className} · {cls.subject}</div>
                    <div style={{ fontSize: "12px", color: "#64748B" }}>{cls.studentCount} students enrolled</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Observations Tab */}
          {activeTab === "observations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {observations.length === 0 && <p>No classroom observations recorded.</p>}
              {observations.map((obs) => (
                <div key={obs.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#065F46", background: "#ECFDF5", padding: "2px 6px", borderRadius: "4px" }}>
                      Rating: {obs.overallRating}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Date: <b>{obs.observationDate}</b></span>
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>{obs.lessonTopic}</h4>
                  <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div><b>Strengths:</b> {obs.strengths}</div>
                    <div><b>Areas for Improvement:</b> {obs.areasForImprovement}</div>
                    <div><b>Action Item:</b> {obs.actionItems}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Development Tab */}
          {activeTab === "development" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {developments.length === 0 && <p>No teacher development recorded.</p>}
              {developments.map((dev) => (
                <div key={dev.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "2px 6px", borderRadius: "4px" }}>
                      {dev.category}
                    </span>
                    <span style={{ fontSize: "12px", color: dev.status === "Completed" ? "#15803D" : "#B45309", fontWeight: 600 }}>
                      {dev.status}
                    </span>
                  </div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>{dev.title}</h4>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>Provider: {dev.provider} · {dev.trainingHours} hours</div>
                </div>
              ))}
            </div>
          )}
          </>}
        </div>
      </div>
    </div>
  );
}
