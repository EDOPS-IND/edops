"use client";

import React, { useState } from "react";
import { TeacherAcademicItem } from "../types";
import { Search, Plus, Eye, Award, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck } from "lucide-react";

export function TeachersPane({
  teachers = [],
  workloadSummary,
  onOpenTeacherProfile,
  onOpenProfile,
  onTriggerObservation,
  onTriggerDevelopment,
  organizationId,
}: {
  teachers?: TeacherAcademicItem[];
  workloadSummary?: any;
  onOpenTeacherProfile?: (teacherId: string) => void;
  onOpenProfile?: (teacherId: string) => void;
  onTriggerObservation?: () => void;
  onTriggerDevelopment?: () => void;
  organizationId?: string;
}) {
  const handleOpenProfile = onOpenTeacherProfile || onOpenProfile;
  const [liveData, setLiveData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [workloadFilter, setWorkloadFilter] = useState("all");

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalTeachers }) => {
      getPrincipalTeachers(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const teacherList = (liveData?.teachers && liveData.teachers.length > 0) ? liveData.teachers : teachers;
  const summary = liveData?.workloadSummary || workloadSummary;


  const filtered = teacherList.filter((t: any) => {
    const matchesSearch = (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (t.department || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "all" || t.department === deptFilter;
    const matchesWorkload = workloadFilter === "all" || t.workloadStatus === workloadFilter;
    return matchesSearch && matchesDept && matchesWorkload;
  });

  const getWorkloadBadge = (status: string) => {
    switch (status) {
      case "Balanced": return { bg: "#DCFCE7", color: "#166534" };
      case "Heavy": return { bg: "#FEF3C7", color: "#92400E" };
      case "Overloaded": return { bg: "#FEE2E2", color: "#991B1B" };
      case "Underutilized": return { bg: "#E0F2FE", color: "#075985" };
      default: return { bg: "#F1F5F9", color: "#475569" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Workload Engine Balance Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { label: "Optimal / Balanced", count: summary?.balancedCount ?? 0, note: "20-26 periods/week", bg: "#F0FDF4", color: "#15803D" },
          { label: "Heavy Load", count: summary?.heavyCount ?? 0, note: "28-30 periods/week", bg: "#FFFBEB", color: "#B45309" },
          { label: "Overloaded (>30)", count: summary?.overloadedCount ?? 0, note: "Requires co-faculty relief", bg: "#FEF2F2", color: "#B91C1C" },
          { label: "Underutilized (<20)", count: summary?.underutilizedCount ?? 0, note: "Available for relief duty", bg: "#F0F9FF", color: "#0369A1" },
        ].map((item, idx) => (
          <div key={idx} style={{ background: item.bg, border: "1px solid rgba(0,0,0,0.06)", borderRadius: "10px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: item.color, fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: item.color, margin: "4px 0" }}>{item.count}</div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>{item.note}</div>
          </div>
        ))}
      </div>

      {/* 2. Filter & Action Strip */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", width: "260px" }}>
            <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Search faculty name or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFFFFF", color: "#334155" }}
          >
            <option value="all">All Departments</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="Social Science">Social Science</option>
            <option value="Computer Science">Computer Science</option>
          </select>

          <select
            value={workloadFilter}
            onChange={(e) => setWorkloadFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", background: "#FFFFFF", color: "#334155" }}
          >
            <option value="all">All Workload States</option>
            <option value="Balanced">Balanced</option>
            <option value="Heavy">Heavy</option>
            <option value="Overloaded">Overloaded</option>
            <option value="Underutilized">Underutilized</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onTriggerObservation}
            style={{
              background: "#064E3B",
              color: "#F8E7C9",
              border: "none",
              borderRadius: "6px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Plus size={14} />
            + Classroom Observation
          </button>
          <button
            onClick={onTriggerDevelopment}
            style={{
              background: "#F8FAFC",
              color: "#1E293B",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Award size={14} />
            Assign CBE Training
          </button>
        </div>
      </div>

      {/* 3. Academic Teacher Roster Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 700 }}>
              <th style={{ padding: "12px 16px" }}>Faculty Name</th>
              <th style={{ padding: "12px 16px" }}>Dept / Subjects</th>
              <th style={{ padding: "12px 16px" }}>Weekly Periods</th>
              <th style={{ padding: "12px 16px" }}>Workload Status</th>
              <th style={{ padding: "12px 16px" }}>Lesson Plans</th>
              <th style={{ padding: "12px 16px" }}>Curriculum %</th>
              <th style={{ padding: "12px 16px" }}>Student Avg</th>
              <th style={{ padding: "12px 16px" }}>Observations</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Academic Dossier</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, idx) => {
              const badge = getWorkloadBadge(t.workloadStatus);
              return (
                <tr
                  key={idx}
                  style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                  onClick={() => onOpenTeacherProfile(t.id)}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#1E293B" }}>{t.name}</div>
                    <div style={{ color: "#94A3B8", fontSize: "11px" }}>{t.employeeId} · {t.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#334155" }}>{t.department}</div>
                    <div style={{ color: "#64748B", fontSize: "11px" }}>{t.classes.join(", ")}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>
                    {t.weeklyPeriods} / {t.maxWeeklyPeriods}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: badge.bg, color: badge.color, padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                      {t.workloadStatus}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: t.lessonPlanCompliance >= 90 ? "#15803D" : "#B45309" }}>
                    {t.lessonPlanCompliance}%
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#065F46" }}>
                    {t.curriculumCompletion}%
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>
                    {t.studentAverageScore}%
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>
                    {t.observationsCount} logged
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProfile?.(t.id);
                      }}
                      style={{
                        background: "#F1F5F9",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#334155",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Eye size={12} /> View Dossier
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
