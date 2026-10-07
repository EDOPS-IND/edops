"use client";

import React, { useState } from "react";
import { StudentListItem } from "../types";
import { Search, User, AlertTriangle, ShieldCheck, Plus, ArrowRight, Award, GraduationCap } from "lucide-react";

export function StudentsPane({
  students = [],
  atRiskData,
  onOpenStudent360,
  onTriggerIntervention,
  onTriggerRemedial,
  onTriggerEnrichment,
}: {
  students?: StudentListItem[];
  atRiskData?: any;
  onOpenStudent360: (studentId: string) => void;
  onTriggerIntervention: (studentName?: string) => void;
  onTriggerRemedial: () => void;
  onTriggerEnrichment: () => void;
}) {
  const [subTab, setSubTab] = useState<"all" | "at_risk" | "remedial" | "enrichment">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = students.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.className.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Header Sub Tab Strip & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "all", label: "All Student Cohorts" },
            { id: "at_risk", label: "At-Risk Attention Engine (18)" },
            { id: "remedial", label: "Remedial & Booster Programs" },
            { id: "enrichment", label: "Enrichment & Olympiad Scholars" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: subTab === t.id ? "#064E3B" : "#CBD5E1",
                background: subTab === t.id ? "#064E3B" : "#FFFFFF",
                color: subTab === t.id ? "#F8E7C9" : "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => onTriggerIntervention()}
            style={{
              background: "#064E3B",
              color: "#F8E7C9",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={14} /> + New Intervention
          </button>
          <button
            onClick={onTriggerRemedial}
            style={{
              background: "#FFFBEB",
              color: "#92400E",
              border: "1px solid #FCD34D",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Remedial Camp
          </button>
          <button
            onClick={onTriggerEnrichment}
            style={{
              background: "#EFF6FF",
              color: "#1E40AF",
              border: "1px solid #BFDBFE",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Enrichment Cohort
          </button>
        </div>
      </div>

      {/* 2. All Students Roster */}
      {subTab === "all" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", width: "280px" }}>
              <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "10px", top: "10px" }} />
              <input
                type="text"
                placeholder="Search by student name or roll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
              />
            </div>
            <span style={{ fontSize: "12px", color: "#64748B" }}>Click any student row to view Student 360 Dossier</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Student Name</th>
                <th style={{ padding: "12px 16px" }}>Class / Section</th>
                <th style={{ padding: "12px 16px" }}>Overall Average</th>
                <th style={{ padding: "12px 16px" }}>Attendance</th>
                <th style={{ padding: "12px 16px" }}>Assignments</th>
                <th style={{ padding: "12px 16px" }}>Attention Category</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>360 Dossier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                  onClick={() => onOpenStudent360(s.id)}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#1E293B" }}>{s.name}</div>
                    <div style={{ color: "#94A3B8", fontSize: "11px" }}>Roll {s.rollNumber} · {s.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#334155" }}>{s.className} - {s.sectionName}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: s.overallAverage < 65 ? "#DC2626" : "#1E293B" }}>
                    {s.overallAverage}%
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: s.attendanceRate < 75 ? "#DC2626" : "#475569" }}>
                    {s.attendanceRate}%
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{s.assignmentCompletion}%</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: s.needsIntervention ? "#FEE2E2" : "#DCFCE7",
                        color: s.needsIntervention ? "#991B1B" : "#166534",
                      }}
                    >
                      {s.riskStatus}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStudent360(s.id);
                      }}
                      style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", fontWeight: 600, color: "#334155", cursor: "pointer" }}
                    >
                      Open 360°
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. At-Risk Attention Engine Tab (Section 41) */}
      {subTab === "at_risk" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "16px 20px" }}>
            <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#991B1B" }}>
              Evidence-Based Attention Engine
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#B91C1C" }}>
              Temporary intervention states triggered by metric thresholds (drop &gt;10%, attendance &lt;75%, assignment delays). No permanent deficit labeling.
            </p>
          </div>

          {(atRiskData?.students || [
            { id: "stu-3", name: "Vikas Kumar", className: "Grade 10-A", riskCategory: "High Priority (Math & Attendance)", indicators: "Math drop from 68% to 42%; Attendance 68.5% (Threshold 75%)", responsibleFaculty: "Rahul Sharma", interventionStatus: "Active Booster Clinic", reviewDate: "2026-11-15" },
            { id: "stu-4", name: "Rohan Mehra", className: "Grade 10-A", riskCategory: "Academic Risk (Math)", indicators: "Math PT2 score 47.5%; 4 missing homework worksheets", responsibleFaculty: "Rahul Sharma", interventionStatus: "Planned Peer Tutoring", reviewDate: "2026-11-20" },
          ]).map((st: any, idx: number) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{st.name}</span>
                  <span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>{st.className}</span>
                  <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>{st.riskCategory}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}><b>Signals:</b> {st.indicators}</div>
                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Faculty Lead: <b>{st.responsibleFaculty}</b> · Status: <b>{st.interventionStatus}</b> · Review: {st.reviewDate}</div>
              </div>
              <button
                onClick={() => onOpenStudent360(st.id)}
                style={{ background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Inspect 360° Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. Remedial & Booster Programs Tab */}
      {subTab === "remedial" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {[
            { title: "Class 10 Mathematics Booster Clinic", teacher: "Rahul Sharma", schedule: "Mon, Wed, Fri 07:30 - 08:15 AM", enrolled: 14, focus: "Real Numbers & Quadratic Equations Mastery" },
            { title: "Class 9 Science Experimental Recovery Lab", teacher: "Dr. Anita Desai", schedule: "Tue, Thu 03:30 - 04:30 PM", enrolled: 11, focus: "Optics ray tracing practical experiments" },
          ].map((rem, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{rem.title}</h4>
                <span style={{ background: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>Active</span>
              </div>
              <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div>Instructor: <b>{rem.teacher}</b></div>
                <div>Schedule: <b>{rem.schedule}</b></div>
                <div>Enrolled Students: <b>{rem.enrolled} candidates</b></div>
                <div style={{ color: "#065F46" }}>Focus: {rem.focus}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Enrichment Scholars Tab */}
      {subTab === "enrichment" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {[
            { title: "National Science Olympiad Scholars Circle", mentor: "Dr. Anita Desai", schedule: "Wed 03:30 - 05:00 PM", enrolled: 18, achievements: "2 zonal qualifiers last term" },
            { title: "AI & Python Computational Research Group", mentor: "Sunita Rao", schedule: "Sat 10:00 - 11:30 AM", enrolled: 15, achievements: "Building smart campus sensor prototype" },
          ].map((enr, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{enr.title}</h4>
                <span style={{ background: "#EFF6FF", color: "#1E40AF", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>Enrichment</span>
              </div>
              <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div>Faculty Mentor: <b>{enr.mentor}</b></div>
                <div>Timing: <b>{enr.schedule}</b></div>
                <div>Scholars: <b>{enr.enrolled} students</b></div>
                <div style={{ color: "#1D4ED8" }}>Accolades: {enr.achievements}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
