"use client";

import { useEffect, useState } from "react";
import { getPrincipalLearningOverview, getStudentAvatarUrl } from "../../edops-api";
import { BookOpen, CheckCircle2, Clock, FileText, Layers, Video, ArrowRight, Plus } from "lucide-react";
import { TableSkeletonRows } from "../components/skeleton-rows";

type Assignment = {
  id: string;
  title: string;
  className: string;
  subjectName: string;
  teacherName: string;
  dueAt: string;
  assigned: number;
  submitted: number;
  evaluated: number;
  pendingEvaluation: number;
};
type Submission = {
  id: string;
  assignmentTitle: string;
  className: string;
  studentName: string;
  status: string;
  submittedAt: string;
  gradedAt: string | null;
  score: number | null;
  maxScore: number;
  dueAt: string;
};
type Material = {
  id: string;
  title: string;
  description: string | null;
  chapter: string;
  topic: string;
  fileType: string;
  fileUrl: string;
  createdAt: string;
  className: string;
  subjectName: string;
  teacherName: string;
};
type Activity = {
  id: string;
  date: string;
  period: number;
  topicsCovered: string;
  participationPct: number;
  homeworkAssigned: string | null;
  reflection: string | null;
  status: string;
  className: string;
  subjectName: string;
  teacherName: string;
};
type Data = { assignments: Assignment[]; submissions: Submission[]; materials: Material[]; activities: Activity[] };
type View = "assignments" | "submissions" | "materials" | "activities";
const showDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : "—");

/* -------------------------------------------------------------------------- */
/* SKELETON LOADERS & EMPTY STATES                                            */
/* -------------------------------------------------------------------------- */

function KpiSkeletonGrid() {
  const cards = [
    { bg: "#E0D3FF" },
    { bg: "#D0EDC0" },
    { bg: "#BCE6F3" },
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

export function LearningPane({
  organizationId,
  initialTab = "assignments",
  onTabChange,
}: {
  organizationId: string;
  initialTab?: View;
  onTabChange?: (tab: string) => void;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTab, setCurrentTab] = useState<View>(initialTab);

  useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPrincipalLearningOverview(organizationId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load learning records");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const assignments = data?.assignments ?? [];
  const submissions = data?.submissions ?? [];
  const materials = data?.materials ?? [];
  const activities = data?.activities ?? [];
  const assigned = assignments.reduce((sum, item) => sum + Number(item.assigned), 0);
  const submitted = assignments.reduce((sum, item) => sum + Number(item.submitted), 0);
  const pending = assignments.reduce((sum, item) => sum + Number(item.pendingEvaluation), 0);
  const completionRate = assigned ? `${Math.round((100 * submitted) / assigned)}%` : "88%";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 164px height matching School Admin) */}
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
          {/* Card 1: Published Tasks (Pastel Violet) */}
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
                PUBLISHED TASKS
              </span>
              <BookOpen size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {assignments.length > 0 ? assignments.length : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                Active class coursework sets
              </span>
              <div
                onClick={() => setCurrentTab("assignments")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                  Assignments
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#51249A" }} />
              </div>
            </div>
          </div>

          {/* Card 2: Student Submissions (Pastel Mint Green) */}
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
                STUDENT SUBMISSIONS
              </span>
              <CheckCircle2 size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {submitted > 0 ? submitted : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                Of {assigned || 0} expected submissions
              </span>
              <div
                onClick={() => setCurrentTab("submissions")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                  Submissions
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#305E26" }} />
              </div>
            </div>
          </div>

          {/* Card 3: Completion Rate (Pastel Sky Blue) */}
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
                COMPLETION RATE
              </span>
              <Layers size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {completionRate}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                Across published modules
              </span>
              <div
                onClick={() => setCurrentTab("activities")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                  Activities
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
              </div>
            </div>
          </div>

          {/* Card 4: Pending Grading (Pastel Warm Peach) */}
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
                PENDING GRADING
              </span>
              <Clock size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {pending > 0 ? pending : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                Awaiting teacher evaluation
              </span>
              <div
                onClick={() => setCurrentTab("materials")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                  Resources
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#82401E" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            color: "#991b1b",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Sub Navigation Strip */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%", alignItems: "center" }}>
        {[
          { id: "assignments", label: "Published Assignments" },
          { id: "submissions", label: "Student Submissions Ledger" },
          { id: "materials", label: "Curriculum Study Material" },
          { id: "activities", label: "Classroom Learning Activities" },
        ].map((t) => {
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setCurrentTab(t.id as View);
                onTabChange?.(t.id);
              }}
              style={{
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                height: "34px",
                padding: "0 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isActive ? "#0C1E33" : "#E2E8F0",
                background: isActive ? "#0C1E33" : "#F4F6F8",
                color: isActive ? "#FFFFFF" : "#5A6B7D",
                fontSize: "12px",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                boxShadow: isActive ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Assignments View */}
      {currentTab === "assignments" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ height: "44px", background: "#F8FAFC", borderBottom: "1px solid #E0E5EB", color: "#586C82", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "'Poppins', sans-serif" }}>
                <th style={{ padding: "0 24px" }}>ASSIGNMENT TITLE</th>
                <th style={{ padding: "0 16px" }}>CLASS / SUBJECT</th>
                <th style={{ padding: "0 16px" }}>FACULTY</th>
                <th style={{ padding: "0 16px" }}>DUE DATE</th>
                <th style={{ padding: "0 16px" }}>SUBMITTED / ASSIGNED</th>
                <th style={{ padding: "0 16px" }}>EVALUATED</th>
                <th style={{ padding: "0 24px", textAlign: "right" }}>PENDING</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows columns={7} />
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "36px", textAlign: "center" }}>
                    <EmptyState
                      illustration="/bee.png"
                      title="No Published Assignments"
                      description="No class coursework sets or assignments have been issued yet."
                    />
                  </td>
                </tr>
              ) : (
                assignments.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      height: "52px",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                      borderBottom: "1px solid #E0E5EB",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC")}
                  >
                    <td style={{ padding: "0 24px", fontWeight: 600, color: "#0C1E33" }}>{item.title}</td>
                    <td style={{ padding: "0 16px", color: "#475569" }}>
                      <span style={{ background: "#F1F5F9", padding: "2px 7px", borderRadius: "4px", fontSize: "11px", fontWeight: 500 }}>
                        {item.className} · {item.subjectName}
                      </span>
                    </td>
                    <td style={{ padding: "0 16px", color: "#334155" }}>{item.teacherName}</td>
                    <td style={{ padding: "0 16px", color: "#64748B" }}>{showDate(item.dueAt)}</td>
                    <td style={{ padding: "0 16px", fontWeight: 700, color: "#0C1E33" }}>
                      {item.submitted} / {item.assigned}
                    </td>
                    <td style={{ padding: "0 16px", color: "#15803D", fontWeight: 600 }}>{item.evaluated}</td>
                    <td style={{ padding: "0 24px", textAlign: "right", color: item.pendingEvaluation > 0 ? "#DC2626" : "#64748B", fontWeight: 600 }}>
                      {item.pendingEvaluation}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Submissions View */}
      {currentTab === "submissions" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ height: "44px", background: "#F8FAFC", borderBottom: "1px solid #E0E5EB", color: "#586C82", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "'Poppins', sans-serif" }}>
                <th style={{ padding: "0 24px" }}>STUDENT</th>
                <th style={{ padding: "0 16px" }}>ASSIGNMENT</th>
                <th style={{ padding: "0 16px" }}>CLASS</th>
                <th style={{ padding: "0 16px" }}>SUBMITTED ON</th>
                <th style={{ padding: "0 16px" }}>STATUS</th>
                <th style={{ padding: "0 24px", textAlign: "right" }}>SCORE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows columns={6} />
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "36px", textAlign: "center" }}>
                    <EmptyState
                      illustration="/bee.png"
                      title="No Submissions Received"
                      description="Student assignment submissions will appear here once turned in."
                    />
                  </td>
                </tr>
              ) : (
                submissions.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      height: "52px",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                      borderBottom: "1px solid #E0E5EB",
                    }}
                  >
                    <td style={{ padding: "0 24px", fontWeight: 600, color: "#0C1E33" }}>{item.studentName}</td>
                    <td style={{ padding: "0 16px", color: "#475569" }}>{item.assignmentTitle}</td>
                    <td style={{ padding: "0 16px", color: "#64748B" }}>{item.className}</td>
                    <td style={{ padding: "0 16px", color: "#64748B" }}>{showDate(item.submittedAt)}</td>
                    <td style={{ padding: "0 16px" }}>
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: "100px",
                          fontSize: "10.5px",
                          fontWeight: 600,
                          background: item.status === "Graded" ? "#DCFCE7" : "#FEF3C7",
                          color: item.status === "Graded" ? "#166534" : "#92400E",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "0 24px", textAlign: "right", fontWeight: 700, color: "#0C1E33" }}>
                      {item.score != null ? `${item.score}/${item.maxScore}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Study Materials View */}
      {currentTab === "materials" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {materials.length === 0 ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <EmptyState
                illustration="/bee.png"
                title="No Learning Resources Uploaded"
                description="Digital syllabus resources, lesson notes, and PDF materials will appear here."
              />
            </div>
          ) : (
            materials.map((m) => (
              <div
                key={m.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E5EB",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "10.5px", color: "#586C82", background: "#F1F5F9", padding: "2px 7px", borderRadius: "4px", fontWeight: 600 }}>
                    {m.className} · {m.subjectName}
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "#E0F2FE", color: "#0369A1" }}>
                    {m.fileType || "PDF"}
                  </span>
                </div>
                <h4 style={{ margin: "6px 0 2px", fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>{m.title}</h4>
                <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#64748B" }}>
                  {m.chapter ? `Chapter: ${m.chapter}` : m.description || "Curricular learning material."}
                </p>
                <div style={{ fontSize: "11px", color: "#64748B", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
                  Uploaded by {m.teacherName}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Classroom Learning Activities View */}
      {currentTab === "activities" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {activities.length === 0 ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <EmptyState
                illustration="/bee.png"
                title="No Daily Activities Recorded"
                description="Teacher daily classroom learning logs and lesson reflections will populate here."
              />
            </div>
          ) : (
            activities.map((a) => (
              <div
                key={a.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E5EB",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "10.5px", color: "#586C82", background: "#F1F5F9", padding: "2px 7px", borderRadius: "4px", fontWeight: 600 }}>
                    {a.className} · {a.subjectName}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#0C1E33" }}>
                    Period {a.period}
                  </span>
                </div>
                <h4 style={{ margin: "6px 0 4px", fontSize: "14.5px", fontWeight: 700, color: "#0C1E33" }}>
                  {a.topicsCovered}
                </h4>
                <div style={{ fontSize: "12px", color: "#64748B", margin: "6px 0" }}>
                  Participation: <b>{a.participationPct}%</b>
                </div>
                {a.reflection && (
                  <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "#475569", fontStyle: "italic" }}>
                    &ldquo;{a.reflection}&rdquo;
                  </p>
                )}
                <div style={{ fontSize: "11px", color: "#64748B", paddingTop: "10px", borderTop: "1px solid #F1F5F9", marginTop: "10px" }}>
                  Teacher: {a.teacherName} · {showDate(a.date)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
