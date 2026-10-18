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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
            transition: "all 0.15s ease",
          }}
        >
          Refresh Alerts
        </button>
      </div>

      {/* 4 Standard Pastel KPI Cards (strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Mint - Resolved */}
        <div
          style={{
            height: "148px",
            background: "#ccefbf",
            border: "1px solid #b2e49f",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1a5c0a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Resolved This Week
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1a5c0a", marginTop: "4px" }}>
              {data?.stats?.resolvedThisWeek ?? 0}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#23720e", fontWeight: 500 }}>
            Closed with corrective directives
          </div>
        </div>

        {/* Card 2: Sky - Info */}
        <div
          style={{
            height: "148px",
            background: "#bae5f5",
            border: "1px solid #9ad7ef",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#0a5a7a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Informational Notices
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0a5a7a", marginTop: "4px" }}>
              {data?.stats?.infoCount ?? 0}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#0d6f96", fontWeight: 500 }}>
            Milestones and audit logs
          </div>
        </div>

        {/* Card 3: Violet - Warning */}
        <div
          style={{
            height: "148px",
            background: "#e1d2ff",
            border: "1px solid #cdb5ff",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#4a0e8f", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Warning Signals
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#4a0e8f", marginTop: "4px" }}>
              {data?.stats?.warningCount ?? 0}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#5b14ae", fontWeight: 500 }}>
            Monitor next assessment cycle
          </div>
        </div>

        {/* Card 4: Peach - Critical */}
        <div
          style={{
            height: "148px",
            background: "#ffd8c7",
            border: "1px solid #ffbe9f",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#782a00", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Critical Action Req.
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#782a00", marginTop: "4px" }}>
              {data?.stats?.criticalCount ?? 0}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#923402", fontWeight: 500 }}>
            Immediate leadership intervention
          </div>
        </div>
      </div>

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
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
            <Filter size={13} /> Severity:
          </span>
          {["all", "critical", "warning", "info"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                padding: "5px 12px",
                fontSize: "11.5px",
                borderRadius: "20px",
                fontWeight: 600,
                textTransform: "capitalize",
                border: "1px solid",
                borderColor: severityFilter === sev ? "#0c1e33" : "#e4e6e9",
                background: severityFilter === sev ? "#0c1e33" : "#f8fafc",
                color: severityFilter === sev ? "#ffffff" : "#475569",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {sev}
            </button>
          ))}
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
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>Loading academic alert radar...</div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9" }}>
            <CheckCircle2 size={36} color="#10b981" style={{ margin: "0 auto 8px" }} />
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: 0 }}>No active alerts matching filter</p>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>All academic streams are operating within acceptable thresholds.</p>
          </div>
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
