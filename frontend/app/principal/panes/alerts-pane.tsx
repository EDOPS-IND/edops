"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight,
  ShieldAlert,
  Search,
  Check,
  User,
  BookOpen,
  Calendar
} from "lucide-react";
import { getPrincipalAlerts, resolvePrincipalAlert } from "../../edops-api";

/* -------------------------------------------------------------------------- */
/* SKELETON LOADERS & EMPTY STATES                                            */
/* -------------------------------------------------------------------------- */

function KpiSkeletonGrid() {
  const cards = [
    { bg: "#D0EDC0" },
    { bg: "#BCE6F3" },
    { bg: "#E0D3FF" },
    { bg: "#FADAC9" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "164px",
            padding: "20px",
            gap: "12px",
            background: c.bg,
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "110px", height: "12px", borderRadius: "4px" }} />
            <div className="edops-skeleton-kpi" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
          </div>
          <div className="edops-skeleton-kpi" style={{ width: "75px", height: "36px", borderRadius: "6px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "140px", height: "10px", borderRadius: "4px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div className="edops-skeleton-kpi" style={{ width: "55px", height: "10px", borderRadius: "4px" }} />
              <div className="edops-skeleton-kpi" style={{ width: "14px", height: "14px", borderRadius: "3px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  illustration = "/bee.png",
  title,
  description,
}: {
  illustration?: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
        background: "#FFFFFF",
        borderRadius: "10px",
        border: "1px solid #E0E5EB",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <img
        src={illustration}
        alt=""
        style={{
          width: illustration === "/noresult.png" ? "120px" : "96px",
          height: "auto",
          maxHeight: "100px",
          objectFit: "contain",
          marginBottom: "16px",
          opacity: 0.95,
        }}
      />
      <b style={{ fontSize: "15px", fontWeight: 700, color: "#0C1E33", marginBottom: "6px" }}>
        {title}
      </b>
      <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B", maxWidth: "440px", lineHeight: 1.55 }}>
        {description}
      </p>
    </div>
  );
}

interface AlertsPaneProps {
  organizationId: string;
  onNavigate?: (pane: string, subTab?: string) => void;
}

export function AlertsPane({ organizationId, onNavigate }: AlertsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionAssigned, setActionAssigned] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [organizationId]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const res = await getPrincipalAlerts(organizationId);
      setData({...res, alerts:(res.alerts || []).map((a: any) => ({...a,resolved:a.status === "resolved"}))});
    } catch {
      setData({
        alerts: [],
        stats: {
          criticalCount: 0,
          warningCount: 0,
          infoCount: 0,
          resolvedThisWeek: 0
        }
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResolveAlert() {
    if (!selectedAlert) return;
    setSubmitting(true);
    try {
      await resolvePrincipalAlert(organizationId, selectedAlert.id, {
        status: "resolved",
        resolutionNotes: [resolutionNote, actionAssigned].filter(Boolean).join("\n")
      });
      // update state
      setData((prev: any) => ({
        ...prev,
        alerts: prev.alerts.map((a: any) =>
          a.id === selectedAlert.id ? { ...a, resolved: true, resolutionNote, actionAssigned } : a
        )
      }));
      setSelectedAlert(null);
      setResolutionNote("");
      setActionAssigned("");
    } catch {
      // Keep the alert open when the database write fails.
    } finally {
      setSubmitting(false);
    }
  }

  const filteredAlerts = (data?.alerts || []).filter((item: any) => {
    if (severityFilter !== "all" && item.severity !== severityFilter) return false;
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "'Poppins', sans-serif" }}>
      {/* Header & Action Strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={22} color="#dc2626" />
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0c1e33", margin: 0 }}>
              Academic Alert Center
            </h2>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
            Real-time proactive breach monitors across syllabus deadlines, attendance thresholds, and assessment dips
          </p>
        </div>

        <button
          onClick={() => loadAlerts()}
          style={{
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#0c1e33",
            background: "#ffffff",
            border: "1px solid #e4e6e9",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            transition: "all 0.15s ease",
          }}
        >
          Refresh Alerts
        </button>
      </div>

      {/* 4 Standard Pastel KPI Cards (strictly 164px height) */}
      {loading ? (
        <KpiSkeletonGrid />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            width: "100%",
          }}
        >
          {/* Card 1: Mint - Resolved */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#D0EDC0",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#305E26", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                RESOLVED THIS WEEK
              </span>
              <CheckCircle2 size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {data?.stats?.resolvedThisWeek ?? 0}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                Closed with corrective directives
              </span>
            </div>
          </div>

          {/* Card 2: Sky - Info */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#BCE6F3",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#265F79", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                INFORMATIONAL NOTICES
              </span>
              <Clock size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {data?.stats?.infoCount ?? 0}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                Milestones and audit logs
              </span>
            </div>
          </div>

          {/* Card 3: Violet - Warning */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#E0D3FF",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#51249A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                WARNING SIGNALS
              </span>
              <AlertTriangle size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {data?.stats?.warningCount ?? 0}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                Monitor next assessment cycle
              </span>
            </div>
          </div>

          {/* Card 4: Peach - Critical */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#FADAC9",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#82401E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                CRITICAL ACTION REQ.
              </span>
              <ShieldAlert size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {data?.stats?.criticalCount ?? 0}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                Immediate leadership intervention
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "12px 16px",
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e4e6e9",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
          {[
            { id: "all", label: "All Alerts" },
            { id: "critical", label: "Critical" },
            { id: "warning", label: "Warnings" },
            { id: "info", label: "Informational" },
          ].map((s) => {
            const isActive = severityFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSeverityFilter(s.id)}
                style={{
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  height: "34px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? "#0C1E33" : "#F4F6F8",
                  color: isActive ? "#FFFFFF" : "#5A6B7D",
                  border: isActive ? "1px solid #0C1E33" : "1px solid #E2E8F0",
                  boxShadow: isActive ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              fontSize: "12px",
              fontWeight: 500,
              background: "#f8fafc",
              border: "1px solid #e4e6e9",
              borderRadius: "8px",
              padding: "6px 10px",
              color: "#334155",
            }}
          >
            <option value="all">All Categories</option>
            <option value="curriculum_lag">Syllabus Lag</option>
            <option value="attendance_drop">Attendance Alert</option>
            <option value="assessment_drop">Assessment Drop</option>
            <option value="assignment_delay">Evaluation SLA Delay</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  padding: "16px 20px",
                  borderRadius: "10px",
                  border: "1px solid #E0E5EB",
                  background: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div className="edops-skeleton" style={{ width: "70px", height: "20px", borderRadius: "100px" }} />
                    <div className="edops-skeleton" style={{ width: "90px", height: "20px", borderRadius: "100px" }} />
                  </div>
                  <div className="edops-skeleton" style={{ width: "80px", height: "14px", borderRadius: "4px" }} />
                </div>
                <div className="edops-skeleton" style={{ width: "50%", height: "16px", borderRadius: "4px" }} />
                <div className="edops-skeleton" style={{ width: "80%", height: "12px", borderRadius: "4px" }} />
              </div>
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            illustration={severityFilter !== "all" || categoryFilter !== "all" ? "/noresult.png" : "/bee.png"}
            title={severityFilter !== "all" || categoryFilter !== "all" ? "No Alerts Matching Filter" : "All Academic Streams Healthy"}
            description={
              severityFilter !== "all" || categoryFilter !== "all"
                ? "No alerts found matching your selected severity or category criteria."
                : "All syllabus deadlines, attendance thresholds, and assessment benchmarks are operating within normal limits."
            }
          />
        ) : (
          filteredAlerts.map((item: any) => (
            <div
              key={item.id}
              style={{
                padding: "16px 20px",
                borderRadius: "10px",
                border: "1px solid",
                borderColor: item.resolved
                  ? "#e4e6e9"
                  : item.severity === "critical"
                  ? "#fca5a5"
                  : item.severity === "warning"
                  ? "#fde68a"
                  : "#bfdbfe",
                background: item.resolved
                  ? "#fafbfc"
                  : item.severity === "critical"
                  ? "#fff5f5"
                  : item.severity === "warning"
                  ? "#fffdf5"
                  : "#f8fbff",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        background:
                          item.severity === "critical"
                            ? "#ef4444"
                            : item.severity === "warning"
                            ? "#f59e0b"
                            : "#3b82f6",
                        color: "#ffffff",
                      }}
                    >
                      {item.severity}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#f1f5f9", color: "#334155" }}>
                      {item.classSection}
                    </span>
                    {item.subject && (
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>
                        {item.subject}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} /> {item.createdAt}
                    </span>
                    {item.resolved && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", display: "flex", alignItems: "center", gap: "4px", background: "#dcfce7", padding: "2px 8px", borderRadius: "20px" }}>
                        <Check size={12} /> Resolved
                      </span>
                    )}
                  </div>

                  {!item.resolved && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        onClick={() => setSelectedAlert(item)}
                        style={{
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#ffffff",
                          background: "#0c1e33",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        Intervene & Resolve
                      </button>
                      {onNavigate && item.category === "curriculum_lag" && (
                        <button
                          onClick={() => onNavigate("academics", "curriculum")}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#0c1e33",
                            background: "#ffffff",
                            border: "1px solid #e4e6e9",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          Inspect Curriculum
                        </button>
                      )}
                      {onNavigate && item.category === "attendance_drop" && (
                        <button
                          onClick={() => onNavigate("attendance", "low")}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#0c1e33",
                            background: "#ffffff",
                            border: "1px solid #e4e6e9",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          Inspect Defaulters
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0c1e33", margin: "0 0 4px" }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "12.5px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    {item.details}
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "8px", paddingTop: "4px" }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.7)", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e4e6e9", fontSize: "12px" }}>
                    <span style={{ fontWeight: 700, color: "#64748b", display: "block", marginBottom: "2px" }}>Academic Impact:</span>
                    <span style={{ color: "#1e293b" }}>{item.impact}</span>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.7)", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e4e6e9", fontSize: "12px" }}>
                    <span style={{ fontWeight: 700, color: "#64748b", display: "block", marginBottom: "2px" }}>Suggested Interventional Action:</span>
                    <span style={{ color: "#0c1e33", fontWeight: 600 }}>{item.suggestedAction}</span>
                  </div>
                </div>

                {item.teacher && (
                  <div style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", paddingTop: "2px" }}>
                    <User size={13} color="#94a3b8" />
                    Responsible Faculty: <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.teacher}</span>
                  </div>
                )}

                {item.resolutionNote && (
                  <div style={{ fontSize: "12px", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", marginTop: "4px" }}>
                    <span style={{ fontWeight: 700 }}>Resolution Recorded:</span> {item.resolutionNote}
                    {item.actionAssigned && <div style={{ marginTop: "2px", fontWeight: 600 }}>Action Assigned: {item.actionAssigned}</div>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve / Action Plan Modal */}
      {selectedAlert && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(11, 15, 25, 0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", maxWidth: "500px", width: "100%", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", border: "1px solid #e4e6e9", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: "20px", background: "#fee2e2", color: "#991b1b" }}>
                {selectedAlert.severity}
              </span>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0c1e33", margin: "6px 0 2px" }}>
                {selectedAlert.title}
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Target: {selectedAlert.classSection} • {selectedAlert.subject}
              </p>
            </div>

            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px", color: "#475569" }}>
              <p style={{ margin: 0 }}><strong>Impact:</strong> {selectedAlert.impact}</p>
              <p style={{ margin: 0 }}><strong>Suggested:</strong> {selectedAlert.suggestedAction}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#0c1e33", display: "block", marginBottom: "4px" }}>
                  Assign Corrective Action
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mandatory 3-session remedial batch with faculty"
                  value={actionAssigned}
                  onChange={(e) => setActionAssigned(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "12px", padding: "8px 12px", background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "8px", color: "#0c1e33" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#0c1e33", display: "block", marginBottom: "4px" }}>
                  Resolution Notes / Principal Directives
                </label>
                <textarea
                  rows={3}
                  placeholder="Document the corrective directive issued to the department head or class coordinator..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", fontSize: "12px", padding: "8px 12px", background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "8px", color: "#0c1e33" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", paddingTop: "8px" }}>
              <button
                onClick={() => setSelectedAlert(null)}
                style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, color: "#64748b", background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "8px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleResolveAlert}
                disabled={submitting || !resolutionNote}
                style={{ padding: "8px 18px", fontSize: "12px", fontWeight: 700, color: "#ffffff", background: "#0c1e33", border: "none", borderRadius: "8px", cursor: "pointer", opacity: submitting || !resolutionNote ? 0.5 : 1 }}
              >
                {submitting ? "Closing Alert..." : "Commit Action & Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
