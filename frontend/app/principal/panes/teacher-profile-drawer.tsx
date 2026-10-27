"use client";

import React, { useState } from "react";
import { getPrincipalTeacherProfile, getStudentAvatarUrl } from "../../edops-api";
import { X, User, BookOpen, Clock, Award, FileCheck, Mail, Calendar, AlertCircle } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    getPrincipalTeacherProfile(organizationId, teacherId)
      .then((profile) => {
        if (active) setTeacherProfile(profile);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load teacher dossier");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, teacherId]);

  // Body scroll lock
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const { overview, workload, metrics, classes = [], observations = [], developments = [] } = teacherProfile ?? {};
  const percentage = (value: number | null | undefined) => (value == null ? "—" : `${value}%`);
  const teacherName = overview?.name || "Faculty Member";

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(12, 30, 51, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 10000,
        fontFamily: "'Poppins', sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="edops-right-drawer"
        style={{
          background: "#FFFFFF",
          width: "100%",
          maxWidth: "min(var(--edops-drawer-width, 680px), 100vw)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 25px rgba(0,0,0,0.15)",
          overflow: "hidden",
          animation: "edopsSlideInRight 0.22s ease-out",
        }}
      >
        {/* ─── Header Matching School Admin Drawer ─────────────────────────── */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid #E2E8F0",
            background: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          {/* Top row */}
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
              Faculty Dossier · #{overview?.department || "Instructional Staff"}
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
                  src={getStudentAvatarUrl(teacherName, teacherId)}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
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
                {loading ? "Loading Faculty Profile..." : teacherName}
              </h3>

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
                <span>{overview?.department || "General Faculty"}</span>
                <span>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={12} style={{ color: "#94A3B8" }} />
                  {overview?.email || "—"}
                </span>
                {workload?.weeklyPeriods != null && (
                  <>
                    <span>·</span>
                    <span
                      style={{
                        padding: "1px 7px",
                        borderRadius: "10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: (workload.weeklyPeriods || 0) > 28 ? "#FEE2E2" : "#ECFDF5",
                        color: (workload.weeklyPeriods || 0) > 28 ? "#991B1B" : "#047857",
                      }}
                    >
                      {workload.weeklyPeriods} Per/Wk
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Underline Tab Navigation ────────────────────────────────────── */}
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
            { id: "overview", label: "Academic Overview", icon: User },
            { id: "workload", label: "Workload & Periods", icon: Clock },
            { id: "classes", label: "Assigned Classes", icon: BookOpen },
            { id: "observations", label: "Observations & Rubric", icon: FileCheck },
            { id: "development", label: "Professional Development", icon: Award },
          ].map((t) => {
            const isActive = activeTab === t.id;
            const TabIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as Tab)}
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
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Body Content ────────────────────────────────────────────────── */}
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
          {error && (
            <div
              role="alert"
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ height: "80px", borderRadius: "10px", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="edops-skeleton" style={{ height: "12px", width: "60%" }} />
                  <div className="edops-skeleton" style={{ height: "24px", width: "40%" }} />
                </div>
                <div style={{ height: "80px", borderRadius: "10px", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="edops-skeleton" style={{ height: "12px", width: "60%" }} />
                  <div className="edops-skeleton" style={{ height: "24px", width: "40%" }} />
                </div>
              </div>
              <div style={{ height: "160px", borderRadius: "10px", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "16px" }}>
                <div className="edops-skeleton" style={{ height: "16px", width: "120px", marginBottom: "12px" }} />
                <div className="edops-skeleton" style={{ height: "12px", width: "90%", marginBottom: "8px" }} />
                <div className="edops-skeleton" style={{ height: "12px", width: "75%" }} />
              </div>
            </div>
          )}

          {!loading && teacherProfile && (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "18px",
                    }}
                  >
                    <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: "#0C1E33" }}>
                      Faculty Meta &amp; Tenure
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12.5px", color: "#475569" }}>
                      <div><b>Official Email:</b> {overview?.email || "—"}</div>
                      <div><b>Department:</b> {overview?.department || "General"}</div>
                      <div><b>Member Since:</b> {overview?.memberSince ? new Date(overview.memberSince).toLocaleDateString() : "Active Semester"}</div>
                      <div><b>Faculty ID:</b> #{teacherId.slice(0, 8)}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                        Lesson Plan Compliance
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: 700, color: (metrics?.lessonPlanCompliance || 0) >= 80 ? "#15803D" : "#0C1E33", marginTop: "4px" }}>
                        {percentage(metrics?.lessonPlanCompliance)}
                      </div>
                    </div>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                        Training Hours
                      </div>
                      <div style={{ fontSize: "24px", fontWeight: 700, color: "#0C1E33", marginTop: "4px" }}>
                        {metrics?.professionalDevelopmentHours ?? 0}h
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Workload Tab */}
              {activeTab === "workload" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "10px",
                      padding: "20px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>Weekly Period Allocation</h4>
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 700, color: "#0C1E33", marginBottom: "4px" }}>
                      {workload?.weeklyPeriods ?? 0}{" "}
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#64748B" }}>periods weekly</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#475569", marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div>• <b>Classes Taught:</b> {workload?.classesTaught ?? 0} sections</div>
                      <div>• <b>Total Student Load:</b> {workload?.studentCount ?? 0} students under instruction</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Classes Tab */}
              {activeTab === "classes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {classes.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
                      <p>No class assignments recorded for this faculty member.</p>
                    </div>
                  ) : (
                    classes.map((cls) => (
                      <div
                        key={cls.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C1E33" }}>
                            {cls.className} · {cls.subject}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>{cls.studentCount} students enrolled</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Observations Tab */}
              {activeTab === "observations" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {observations.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
                      <p>No classroom observations recorded yet.</p>
                    </div>
                  ) : (
                    observations.map((obs) => (
                      <div
                        key={obs.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#047857",
                              background: "#ECFDF5",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            Rating: {obs.overallRating}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748B" }}>Date: <b>{obs.observationDate}</b></span>
                        </div>
                        <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: "#0C1E33" }}>{obs.lessonTopic}</h4>
                        <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div><b>Strengths:</b> {obs.strengths}</div>
                          <div><b>Areas for Improvement:</b> {obs.areasForImprovement}</div>
                          <div><b>Action Item:</b> {obs.actionItems}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Development Tab */}
              {activeTab === "development" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {developments.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
                      <p>No professional development activities recorded.</p>
                    </div>
                  ) : (
                    developments.map((dev) => (
                      <div
                        key={dev.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#2563EB",
                              background: "#EFF6FF",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {dev.category}
                          </span>
                          <span style={{ fontSize: "12px", color: dev.status === "Completed" ? "#15803D" : "#B45309", fontWeight: 600 }}>
                            {dev.status}
                          </span>
                        </div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#0C1E33" }}>{dev.title}</h4>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>
                          Provider: {dev.provider} · {dev.trainingHours} hours
                        </div>
                      </div>
                    ))
                  )}
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
