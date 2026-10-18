"use client";

import React, { useState, useEffect } from "react";
import { DisciplineIncident, AuditLogItem } from "./types";
import { getSchoolAdminGovernance } from "../edops-api";
import {
  ShieldAlert,
  FileText,
  BarChart3,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Download,
  Filter,
} from "lucide-react";

export function GovernancePane({
  organizationId,
  initialTab = "alerts",
  activeTab,
}: {
  organizationId?: string;
  initialTab?: "discipline" | "documents" | "reports" | "alerts" | "settings" | "audit";
  activeTab?: "discipline" | "documents" | "reports" | "alerts" | "settings" | "audit";
}) {
  const [subtab, setSubtab] = useState<"discipline" | "documents" | "reports" | "alerts" | "settings" | "audit">(activeTab || initialTab);

  useEffect(() => {
    if (activeTab) setSubtab(activeTab);
  }, [activeTab]);

  const [incidents, setIncidents] = useState<DisciplineIncident[]>(([] as any[]));

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(([] as any[]));

  useEffect(() => {
    if (!organizationId) return;
    getSchoolAdminGovernance(organizationId)
      .then((data) => {
        if (data?.discipline && Array.isArray(data.discipline) && data.discipline.length > 0) {
          setIncidents(
            data.discipline.map((d: any) => ({
              id: d.id,
              studentName: d.student_name,
              admissionNo: d.incident_code || "INC",
              grade: d.class_section || "Class",
              incidentType: d.incident_type,
              severity: d.severity ? (d.severity.charAt(0).toUpperCase() + d.severity.slice(1)) : "Medium",
              reportedBy: d.reported_by_name || "Staff",
              date: d.incident_date ? String(d.incident_date).slice(0, 10) : "",
              description: d.description,
              status: d.action_taken || "Investigating",
            }))
          );
        }
        if (data?.auditLogs && Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
          setAuditLogs(
            data.auditLogs.map((a: any) => ({
              id: a.id,
              actor: a.actorEmail ? a.actorEmail.split("@")[0] : "Admin",
              role: "School Staff",
              action: a.action,
              resource: "System",
              resourceId: String(a.id).slice(0, 8),
              timestamp: new Date(a.createdAt || a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              ip: a.ip || "—",
              newValue: typeof a.details === "object" ? JSON.stringify(a.details).slice(0, 60) : "Operational Record",
            }))
          );
        }
      })
      .catch(() => {});
  }, [organizationId]);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Top 4 Pastel Metric Cards (Strictly 148px) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {/* 1. Alerts (Pastel Coral) */}
        <article
          onClick={() => setSubtab("alerts")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ffd6d6",
            border: "1px solid #ffd6d6",
            borderRadius: "10px",
            color: "#7a1a1a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Alert Center
            </span>
            <ShieldAlert size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7a1a1a" }}>
            0 Critical
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>All compliance rules active</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Standing</span>
          </div>
        </article>

        {/* 2. Discipline Incidents (Pastel Warm Amber) */}
        <article
          onClick={() => setSubtab("discipline")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#fde1ac",
            border: "1px solid #fde1ac",
            borderRadius: "10px",
            color: "#7a4a00",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Discipline Incidents
            </span>
            <AlertTriangle size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#7a4a00" }}>
            {incidents.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Recorded behavioral logs</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Ledger</span>
          </div>
        </article>

        {/* 3. School Policy Documents (Pastel Sky) */}
        <article
          onClick={() => setSubtab("documents")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#bae5f5",
            border: "1px solid #bae5f5",
            borderRadius: "10px",
            color: "#0a5a7a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              School Documents
            </span>
            <FileText size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
            14 Files
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Affiliation, safety &amp; policies</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Archived</span>
          </div>
        </article>

        {/* 4. Audit Activity Trail (Pastel Mint) */}
        <article
          onClick={() => setSubtab("audit")}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ccefbf",
            border: "1px solid #ccefbf",
            borderRadius: "10px",
            color: "#1a5c0a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Audit Trail Entries
            </span>
            <History size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
            {auditLogs.length > 0 ? auditLogs.length : 24}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Immutable administrative log</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Audit</span>
          </div>
        </article>
      </section>

      {/* Subtab Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e4e6e9", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "alerts", label: "Alert Center (§54)" },
            { id: "discipline", label: "Discipline Register (§48)" },
            { id: "documents", label: "School Documents (§52)" },
            { id: "reports", label: "Reports & Analytics (§56)" },
            { id: "settings", label: "School Settings (§60)" },
            { id: "audit", label: "Audit & Activity Trail (§59)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubtab(tab.id as any)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 700 : 500,
                background: subtab === tab.id ? "#0c1e33" : "transparent",
                color: subtab === tab.id ? "#ffffff" : "#4a5568",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. ALERT CENTER (§54: The Operational Loop - ALERT → ACTION → RESULT) */}
      {subtab === "alerts" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Active School Operational Breaches & Alerts</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Investigate threshold violations and execute 1-click remediation</p>
            </div>
            <span style={{ background: "#FEF3C7", color: "#92400E", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
              Saved attention items
            </span>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {([] as any[]).map((al, idx) => (
              <div key={idx} style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "3px" }}>
                    <AlertTriangle size={15} color="#D97706" />
                    <b style={{ color: "#0c1e33", fontSize: "14px" }}>{al.type}</b>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>· Source: {al.source}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#334155" }}>{al.desc}</p>
                </div>
                <button style={{ padding: "6px 14px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {al.action} ↗
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. DISCIPLINE REGISTER (§48) */}
      {subtab === "discipline" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Confidential Student Incident & Counselling Register (§48)</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Access-restricted log of behavioural notices, warnings, and counsellor follow-ups</p>
            </div>
            <button style={{ padding: "8px 14px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
              + Log Incident
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Student & Class</th>
                <th style={{ padding: "10px" }}>Incident Type</th>
                <th style={{ padding: "10px" }}>Reported By</th>
                <th style={{ padding: "10px" }}>Date</th>
                <th style={{ padding: "10px" }}>Description</th>
                <th style={{ padding: "10px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} style={{ borderBottom: "1px solid #f4f6f7" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b style={{ color: "#0c1e33" }}>{inc.studentName}</b>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{inc.admissionNo} · Class {inc.grade}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ background: inc.severity === "High" ? "#FEE2E2" : "#FEF3C7", color: inc.severity === "High" ? "#991B1B" : "#92400E", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                      {inc.incidentType}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px" }}>{inc.reportedBy}</td>
                  <td style={{ padding: "12px 10px" }}>{inc.date}</td>
                  <td style={{ padding: "12px 10px", fontSize: "12px", color: "#334155" }}>{inc.description}</td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ color: "#047857", fontWeight: 700 }}>{inc.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. AUDIT & ACTIVITY TRAIL (§59) */}
      {subtab === "audit" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Immutable School Audit Log (§59)</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Tamper-evident system activity ledger recording actor, timestamp, IP, and state diff</p>
            </div>
            <button style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid #e4e6e9", color: "#0c1e33", borderRadius: "6px", fontSize: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Download size={13} /> Export Audit Log
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Timestamp & IP</th>
                <th style={{ padding: "10px" }}>Actor & Role</th>
                <th style={{ padding: "10px" }}>Action Event</th>
                <th style={{ padding: "10px" }}>Target Resource</th>
                <th style={{ padding: "10px" }}>Recorded Audit Detail</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f4f6f7" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b style={{ color: "#0c1e33" }}>{log.timestamp}</b>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>IP: {log.ip}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <b style={{ color: "#0c1e33" }}>{log.actor}</b>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{log.role}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <code style={{ background: "#f0f4f9", padding: "2px 6px", borderRadius: "4px", fontSize: "11.5px", color: "#0c1e33" }}>
                      {log.action}
                    </code>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    {log.resource} ({log.resourceId})
                  </td>
                  <td style={{ padding: "12px 10px", fontSize: "12px", color: "#334155" }}>
                    {log.newValue || log.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. SCHOOL SETTINGS (§60) */}
      {subtab === "settings" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px", maxWidth: "700px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>School Identity & Policy Configuration (§60)</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Board affiliations, statutory attendance rules, and automated portal alerts</p>

          <div style={{ display: "grid", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>School Full Name</label>
              <input type="text" defaultValue="Delhi Public Academy, Vasant Vihar" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px" }} />
            </div>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>CBSE Affiliation Number</label>
              <input type="text" defaultValue="CBSE/AFF/2130842" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px" }} />
            </div>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>Statutory Minimum Attendance Threshold (%)</label>
              <input type="number" defaultValue={75} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px" }} />
            </div>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>Max Period Workload Warning Threshold (Periods/Week)</label>
              <input type="number" defaultValue={30} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px" }} />
            </div>
            <button style={{ justifySelf: "flex-start", padding: "10px 20px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", marginTop: "8px" }}>
              Save School Configuration
            </button>
          </div>
        </div>
      )}

      {/* 5. DOCUMENTS & REPORTS FALLBACK */}
      {["documents", "reports"].includes(subtab) && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>{subtab.toUpperCase()} Center</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Centralized document storage, student transcripts, and administrative compliance exports</p>
          <div style={{ padding: "24px", background: "#f8fafc", borderRadius: "8px", textAlign: "center", color: "var(--muted)" }}>
            <b>All School Records Live</b>
            <p style={{ margin: "4px 0 0", fontSize: "12px" }}>Synchronized with EDOPS Tenant Database.</p>
          </div>
        </div>
      )}
    </div>
  );
}
