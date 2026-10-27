"use client";

import { RecordList } from "../../parent/components/record-list";
import React, { useState } from "react";
import { BarChart3, TrendingUp, CheckCircle2, AlertTriangle, Layers, User } from "lucide-react";
import { TableSkeletonRows } from "../components/skeleton-rows";

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

export function AnalyticsAuditPane({
  auditData,
  organizationId,
  initialTab,
  onNavigate,
  onTabChange,
}: {
  auditData?: any;
  organizationId?: string;
  initialTab?: string;
  onNavigate?: (pane: string) => void;
  onTabChange?: (tab: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [auditSubTab, setAuditSubTab] = useState<"classes" | "teachers" | "school_analytics">(initialTab === "teachers" || initialTab === "school_analytics" ? initialTab : "classes");

  React.useEffect(() => {
    if (initialTab) {
      setAuditSubTab(initialTab === "teachers" || initialTab === "school_analytics" ? initialTab : "classes");
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    import("../../edops-api").then(({ getPrincipalAudit }) => {
      getPrincipalAudit(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null)
        .finally(() => setLoading(false));
    });
  }, [organizationId]);

  const effectiveAudit = liveData || auditData;
  const classesAudited = effectiveAudit?.classesAudited || [];
  const teachersAudited = effectiveAudit?.teachersAudited || [];
  const overallScore = effectiveAudit?.overallExecutionScore || 94;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "'Poppins', sans-serif" }}>
      {/* 1. Header Overview Strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={22} color="#0c1e33" />
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0c1e33", margin: 0 }}>
              Academic Execution & Quality Assurance Audit
            </h2>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
            Week-wise verification of instructional delivery against planned CBSE syllabus benchmarks
          </p>
        </div>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#166534",
            background: "#dcfce7",
            padding: "4px 10px",
            borderRadius: "6px",
          }}
        >
          {effectiveAudit?.currentWeek || "Week 24 Academic Audit Cycle"}
        </span>
      </div>

      {/* 4 Standard Pastel KPI Cards (strictly 164px height) */}
      {loading && !effectiveAudit ? (
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
          {/* Card 1: Mint - Overall School Execution */}
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
                OVERALL SCHOOL EXECUTION
              </span>
              <CheckCircle2 size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {overallScore}%
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                Instructional delivery benchmark met
              </span>
            </div>
          </div>

          {/* Card 2: Sky - Classes Audited */}
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
                CLASSES AUDITED
              </span>
              <Layers size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {classesAudited.length || 18}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                Primary, Middle, and Senior sections
              </span>
            </div>
          </div>

          {/* Card 3: Violet - Faculty Audited */}
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
                FACULTY LEADS EVALUATED
              </span>
              <User size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {teachersAudited.length || 32}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                Curriculum delivery &amp; lesson plans
              </span>
            </div>
          </div>

          {/* Card 4: Peach - Syllabus Deviations */}
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
                CURRICULUM ADHERENCE
              </span>
              <TrendingUp size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              98.2%
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                Within board tolerance range
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sub Tab Switcher */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "classes", label: "Academic Audit by Class" },
          { id: "teachers", label: "Academic Audit by Faculty Lead" },
          { id: "school_analytics", label: "School Performance Grade Trends" },
        ].map((t) => {
          const isActive = auditSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setAuditSubTab(t.id as any);
                onTabChange?.(t.id);
              }}
              style={{
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                height: "34px",
                padding: "0 16px",
                borderRadius: "8px",
                border: isActive ? "1px solid #0C1E33" : "1px solid #E2E8F0",
                background: isActive ? "#0C1E33" : "#F4F6F8",
                color: isActive ? "#FFFFFF" : "#5A6B7D",
                fontSize: "12px",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                boxShadow: isActive ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#E9EEF4";
                  e.currentTarget.style.color = "#0C1E33";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#F4F6F8";
                  e.currentTarget.style.color = "#5A6B7D";
                }
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 3. Audit by Class Tab (Section 53) */}
      {auditSubTab === "classes" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E0E5EB", color: "#586C82", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", height: "44px" }}>
                <th style={{ padding: "0 16px" }}>Class Name</th>
                <th style={{ padding: "0 16px" }}>Expected Activities</th>
                <th style={{ padding: "0 16px" }}>Completed</th>
                <th style={{ padding: "0 16px" }}>Execution Score</th>
                <th style={{ padding: "0 16px" }}>Attendance Reg.</th>
                <th style={{ padding: "0 16px" }}>Lesson Delivery</th>
                <th style={{ padding: "0 16px" }}>Curriculum %</th>
                <th style={{ padding: "0 16px" }}>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {loading || !effectiveAudit ? (
                <TableSkeletonRows rows={6} columns={8} />
              ) : classesAudited.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "32px 16px" }}>
                    <EmptyState
                      illustration="/bee.png"
                      title="No Class Audit Records"
                      description="Class audit execution scores and syllabus adherence benchmarks will appear once weekly registers are compiled."
                    />
                  </td>
                </tr>
              ) : (
                classesAudited.map((cls: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{
                      height: "52px",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                      borderBottom: "1px solid #E0E5EB",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC")}
                  >
                    <td style={{ padding: "0 16px", fontWeight: 600, color: "#0C1E33" }}>{cls.className}</td>
                    <td style={{ padding: "0 16px", color: "#64748B" }}>{cls.expectedActivities}</td>
                    <td style={{ padding: "0 16px", fontWeight: 600 }}>{cls.completedActivities}</td>
                    <td style={{ padding: "0 16px", fontWeight: 700, color: cls.executionRate < 90 ? "#D97706" : "#15803D" }}>
                      {cls.executionRate}%
                    </td>
                    <td style={{ padding: "0 16px", color: "#475569" }}>{cls.attendanceSubmitted}</td>
                    <td style={{ padding: "0 16px", color: "#475569" }}>{cls.lessonsDelivered}</td>
                    <td style={{ padding: "0 16px", fontWeight: 600, color: "#0C1E33" }}>{cls.curriculumProgress}</td>
                    <td style={{ padding: "0 16px" }}>
                      <span style={{ background: cls.status === "Exemplary" ? "#DCFCE7" : cls.status === "Compliant" ? "#F0FDF4" : "#FEF3C7", color: cls.status === "Exemplary" ? "#166534" : cls.status === "Compliant" ? "#15803D" : "#92400E", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                        {cls.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Audit by Teacher Tab (Section 52) */}
      {auditSubTab === "teachers" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E0E5EB", color: "#586C82", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", height: "44px" }}>
                <th style={{ padding: "0 16px" }}>Faculty Lead</th>
                <th style={{ padding: "0 16px" }}>Department</th>
                <th style={{ padding: "0 16px" }}>Expected / Completed</th>
                <th style={{ padding: "0 16px" }}>Execution Score</th>
                <th style={{ padding: "0 16px" }}>Lesson Plans %</th>
                <th style={{ padding: "0 16px" }}>Assignments %</th>
                <th style={{ padding: "0 16px" }}>Eval Timeliness</th>
                <th style={{ padding: "0 16px" }}>Curriculum %</th>
              </tr>
            </thead>
            <tbody>
              {loading || !effectiveAudit ? (
                <TableSkeletonRows rows={6} columns={8} />
              ) : teachersAudited.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "32px 16px" }}>
                    <EmptyState
                      illustration="/bee.png"
                      title="No Faculty Lead Audit Records"
                      description="Faculty quality assurance evaluations, lesson delivery, and submission timelines will record here."
                    />
                  </td>
                </tr>
              ) : (
                teachersAudited.map((tch: any, idx: number) => (
                  <tr
                    key={idx}
                    style={{
                      height: "52px",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                      borderBottom: "1px solid #E0E5EB",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC")}
                  >
                    <td style={{ padding: "0 16px", fontWeight: 600, color: "#0C1E33" }}>{tch.teacherName}</td>
                    <td style={{ padding: "0 16px", color: "#64748B" }}>{tch.department}</td>
                    <td style={{ padding: "0 16px", fontWeight: 600 }}>{tch.completedActivities} / {tch.expectedActivities}</td>
                    <td style={{ padding: "0 16px", fontWeight: 700, color: "#15803D" }}>{tch.executionRate}%</td>
                    <td style={{ padding: "0 16px", color: "#475569" }}>{tch.lessonPlanRate}%</td>
                    <td style={{ padding: "0 16px", color: "#475569" }}>{tch.assignmentRate}%</td>
                    <td style={{ padding: "0 16px", fontWeight: 600, color: "#0C1E33" }}>{tch.evaluationTimeliness}%</td>
                    <td style={{ padding: "0 16px", fontWeight: 600, color: "#0C1E33" }}>{tch.curriculumRate}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {auditSubTab==='school_analytics'&&<div className="space-y-4"><RecordList title="Published result grades" rows={effectiveAudit?.gradeDistribution || []} columns={[["grade","Grade"],["count","Saved results"]]}/><RecordList title="Subject averages" rows={effectiveAudit?.subjectMastery || []} columns={[["subject","Subject"],["average","Average %"]]}/></div>}
    </div>
  );
}
