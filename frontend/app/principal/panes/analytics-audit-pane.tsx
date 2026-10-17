"use client";

import { RecordList } from "../../parent/components/record-list";
import React, { useState } from "react";
import { BarChart3, TrendingUp, CheckCircle2, AlertTriangle, Layers, User } from "lucide-react";

export function AnalyticsAuditPane({
  auditData,
  organizationId,
  initialTab,
  onNavigate,
}: {
  auditData?: any;
  organizationId?: string;
  initialTab?: string;
  onNavigate?: (pane: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [auditSubTab, setAuditSubTab] = useState<"classes" | "teachers" | "school_analytics">(initialTab === "teachers" || initialTab === "school_analytics" ? initialTab : "classes");

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalAudit }) => {
      getPrincipalAudit(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const effectiveAudit = liveData || auditData;
  const classesAudited = effectiveAudit?.classesAudited || [];
  const teachersAudited = effectiveAudit?.teachersAudited || [];


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Header Overview Strip */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#166534", background: "#DCFCE7", padding: "2px 8px", borderRadius: "4px" }}>
            {auditData?.currentWeek || "Week 24 Academic Audit Cycle"}
          </span>
          <h3 style={{ margin: "6px 0 2px", fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>
            Academic Execution & Quality Assurance Audit
          </h3>
          <span style={{ fontSize: "12px", color: "#64748B" }}>
            Week-wise verification of instructional delivery against planned CBSE syllabus benchmarks
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Overall School Execution Rate</div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "#15803D" }}>
            {auditData?.overallExecutionScore || 0}%
          </div>
        </div>
      </div>

      {/* 2. Sub Tab Switcher */}
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { id: "classes", label: "Academic Audit by Class" },
          { id: "teachers", label: "Academic Audit by Faculty Lead" },
          { id: "school_analytics", label: "School Performance Grade Trends" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAuditSubTab(t.id as any)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: auditSubTab === t.id ? "#064E3B" : "#CBD5E1",
              background: auditSubTab === t.id ? "#064E3B" : "#FFFFFF",
              color: auditSubTab === t.id ? "#F8E7C9" : "#475569",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 3. Audit by Class Tab (Section 53) */}
      {auditSubTab === "classes" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Class Name</th>
                <th style={{ padding: "12px 16px" }}>Expected Activities</th>
                <th style={{ padding: "12px 16px" }}>Completed</th>
                <th style={{ padding: "12px 16px" }}>Execution Score</th>
                <th style={{ padding: "12px 16px" }}>Attendance Reg.</th>
                <th style={{ padding: "12px 16px" }}>Lesson Delivery</th>
                <th style={{ padding: "12px 16px" }}>Curriculum %</th>
                <th style={{ padding: "12px 16px" }}>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {classesAudited.map((cls: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>{cls.className}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{cls.expectedActivities}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{cls.completedActivities}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: cls.executionRate < 90 ? "#D97706" : "#15803D" }}>
                    {cls.executionRate}%
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{cls.attendanceSubmitted}</td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{cls.lessonsDelivered}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#065F46" }}>{cls.curriculumProgress}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: cls.status === "Exemplary" ? "#DCFCE7" : cls.status === "Compliant" ? "#F0FDF4" : "#FEF3C7", color: cls.status === "Exemplary" ? "#166534" : cls.status === "Compliant" ? "#15803D" : "#92400E", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                      {cls.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Audit by Teacher Tab (Section 52) */}
      {auditSubTab === "teachers" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Faculty Lead</th>
                <th style={{ padding: "12px 16px" }}>Department</th>
                <th style={{ padding: "12px 16px" }}>Expected / Completed</th>
                <th style={{ padding: "12px 16px" }}>Execution Score</th>
                <th style={{ padding: "12px 16px" }}>Lesson Plans %</th>
                <th style={{ padding: "12px 16px" }}>Assignments %</th>
                <th style={{ padding: "12px 16px" }}>Eval Timeliness</th>
                <th style={{ padding: "12px 16px" }}>Curriculum %</th>
              </tr>
            </thead>
            <tbody>
              {teachersAudited.map((tch: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1E293B" }}>{tch.teacherName}</td>
                  <td style={{ padding: "12px 16px", color: "#64748B" }}>{tch.department}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{tch.completedActivities} / {tch.expectedActivities}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, color: "#15803D" }}>{tch.executionRate}%</td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{tch.lessonPlanRate}%</td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{tch.assignmentRate}%</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#065F46" }}>{tch.evaluationTimeliness}%</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1E293B" }}>{tch.curriculumRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {auditSubTab==='school_analytics'&&<div className="space-y-4"><RecordList title="Published result grades" rows={effectiveAudit?.gradeDistribution || []} columns={[["grade","Grade"],["count","Saved results"]]}/><RecordList title="Subject averages" rows={effectiveAudit?.subjectMastery || []} columns={[["subject","Subject"],["average","Average %"]]}/></div>}
    </div>
  );
}
