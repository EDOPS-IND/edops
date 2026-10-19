"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Award,
  ChevronRight,
  Plus,
  Search,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { getTeacherStudents, getStudentAvatarUrl } from "../../edops-api";

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
  skyBg: "#d0e6ff",
  skyDark: "#0a3a7a",
  amberBg: "#fde1ac",
  amberDark: "#614400",
  roseBg: "#ffd6d6",
  roseDark: "#7a1a1a",
  violetBg: "#e1d2ff",
  violetDark: "#4a0e8f",
};

interface StudentsPaneProps {
  organizationId: string;
  onOpenDossier: (studentId: string) => void;
  onOpenIntervention: (studentId?: string) => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export function StudentsPane({
  organizationId,
  onOpenDossier,
  onOpenIntervention,
  initialTab,
  onTabChange,
}: StudentsPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "at_risk" | "improving" | "top">(
    initialTab === "at_risk" || initialTab === "improving" || initialTab === "top" ? initialTab : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (initialTab === "all" || initialTab === "at_risk" || initialTab === "improving" || initialTab === "top") {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    loadStudents();
  }, [organizationId]);

  async function loadStudents() {
    setLoading(true);
    try {
      const res = await getTeacherStudents(organizationId);
      setData(res);
    } catch {
      setData({
        classificationSummary: {
          strong: 0,
          onTrack: 0,
          needsSupport: 0,
          interventionRecommended: 0,
        },
        students: [],
        atRiskStudents: [],
        topPerformers: [],
        improvingStudents: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const summary = data?.classificationSummary || {
    strong: 0,
    onTrack: 0,
    needsSupport: 0,
    interventionRecommended: 0,
  };

  const allStudents = data?.students || [];
  const atRiskStudents = data?.atRiskStudents || [];
  const topPerformers = data?.topPerformers || [];
  const improvingStudents = data?.improvingStudents || [];

  const filteredStudents = (
    activeTab === "all"
      ? allStudents
      : activeTab === "at_risk"
      ? atRiskStudents
      : activeTab === "improving"
      ? improvingStudents
      : topPerformers
  ).filter((s: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.rollNumber && String(s.rollNumber).toLowerCase().includes(q)) ||
      (s.classSection && s.classSection.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
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
        <p style={{ fontSize: "13px", fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading student cohorts &amp; interventions...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: T.slate,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Cohort Analytics &amp; Dossiers
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              color: T.navy,
              letterSpacing: "-0.01em",
            }}
          >
            Student Cohorts &amp; Remedials
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Identify learning gaps, track student trajectories, and open individual 360 dossiers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenIntervention()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: T.navy,
            color: T.white,
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
          }}
        >
          <Plus size={14} />
          <span>+ Create Remedial Action</span>
        </button>
      </div>

      {/* 2. Top 4 Metric Cards - Strict DESIGN.md Section 2.1 Palettes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Strong Cohort (Pastel Mint) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.greenBg,
            border: `1px solid ${T.greenBg}`,
            borderRadius: "10px",
            color: T.greenDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Strong Cohort
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {summary.strong}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Consistently exceeding benchmark scores (≥85%)
          </p>
        </div>

        {/* On Track Cohort (Pastel Sky) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.skyBg,
            border: `1px solid ${T.skyBg}`,
            borderRadius: "10px",
            color: T.skyDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              On Track Cohort
            </span>
            <UserCheck size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {summary.onTrack}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Meeting core syllabus competencies
          </p>
        </div>

        {/* Needs Support (Pastel Warm Amber) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.amberBg,
            border: `1px solid ${T.amberBg}`,
            borderRadius: "10px",
            color: T.amberDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Needs Support
            </span>
            <AlertTriangle size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {summary.needsSupport}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            Attendance &lt;75% or test averages &lt;40%
          </p>
        </div>

        {/* Remedials Active (Pastel Rose) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.roseBg,
            border: `1px solid ${T.roseBg}`,
            borderRadius: "10px",
            color: T.roseDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Interventions Req.
            </span>
            <TrendingUp size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.roseDark }}>
            {summary.interventionRecommended}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.roseDark }}>
            Personalized remedial action assigned
          </p>
        </div>
      </div>

      {/* 3. Search & Tab Filter Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        {/* Tab Pills */}
        <div style={{ display: "flex", background: T.chip, padding: "4px", borderRadius: "8px", border: `1px solid ${T.border}`, gap: "4px" }}>
          {[
            { id: "all", label: `All Enrolled (${allStudents.length})` },
            { id: "at_risk", label: `At-Risk (${atRiskStudents.length})` },
            { id: "improving", label: `Improving (${improvingStudents.length})` },
            { id: "top", label: `Top Performers (${topPerformers.length})` },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  onTabChange?.(tab.id);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  border: "none",
                  background: active ? T.navy : "transparent",
                  color: active ? T.white : T.slate,
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "240px" }}>
          <Search size={14} color={T.slate} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search student by name, roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 32px",
              border: `1px solid ${T.line}`,
              borderRadius: "8px",
              fontSize: "12px",
              color: T.navy,
              background: T.white,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* 4. Student Roster Table Card */}
      <div
        style={{
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy }}>
            {activeTab === "all" ? "Assigned Section Roster" : activeTab === "at_risk" ? "At-Risk Focus List" : activeTab === "improving" ? "High Momentum Students" : "Top Academic Achievers"}
          </h3>
          <span style={{ fontSize: "12px", color: T.slate, fontWeight: 500 }}>
            {filteredStudents.length} students listed
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: T.slate, fontSize: "13px" }}>
            No students found matching the selected filter.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: T.chip, borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Roll</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Student Name</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Class</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject Avg</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Attendance</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s: any, idx: number) => {
                const avg = s.subjectAverage != null ? `${s.subjectAverage}%` : "—";
                const att = s.attendance != null ? `${s.attendance}%` : "100%";
                const isAtRisk = (s.attendance != null && s.attendance < 75) || (s.subjectAverage != null && s.subjectAverage < 40);
                const isTop = s.subjectAverage != null && s.subjectAverage >= 85;

                let statusBadge = { bg: T.skyBg, color: T.skyDark, text: "On Track" };
                if (isAtRisk) {
                  statusBadge = { bg: T.roseBg, color: T.roseDark, text: "Needs Support" };
                } else if (isTop) {
                  statusBadge = { bg: T.greenBg, color: T.greenDark, text: "Top Performer" };
                }

                return (
                  <tr
                    key={s.id || idx}
                    style={{
                      borderBottom: idx !== filteredStudents.length - 1 ? `1px solid ${T.border}` : "none",
                      transition: "background 0.15s ease",
                      cursor: "pointer",
                    }}
                    onClick={() => onOpenDossier(s.id)}
                  >
                    <td style={{ padding: "14px 16px", color: T.slate, fontWeight: 600, fontFamily: "monospace" }}>
                      #{s.rollNumber || "101"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", background: "#f5f6f8", border: `1px solid ${T.border}`, flexShrink: 0 }}>
                          <img
                            src={getStudentAvatarUrl(s.name, s.rollNumber)}
                            alt={s.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: T.navy, fontSize: "13px" }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: T.slate }}>{s.guardianName || "Parent / Guardian"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: T.slate }}>
                      {s.classSection || "Class 10-A"}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: isAtRisk ? T.roseDark : isTop ? T.greenDark : T.navy }}>
                      {avg}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: s.attendance != null && s.attendance < 75 ? T.roseDark : T.navy }}>
                      {att}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: statusBadge.bg,
                          color: statusBadge.color,
                        }}
                      >
                        {statusBadge.text}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => onOpenIntervention(s.id)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: `1px solid ${T.line}`,
                            background: T.white,
                            color: T.navy,
                            cursor: "pointer",
                          }}
                        >
                          + Remedial
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDossier(s.id)}
                          style={{
                            padding: "4px 12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: "none",
                            background: T.navy,
                            color: T.white,
                            cursor: "pointer",
                          }}
                        >
                          Dossier 360 →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
