"use client";

import { useEffect, useState, type ComponentProps, type FormEvent } from "react";
import {
  createPrincipalExamPlan,
  createPrincipalExamPlans,
  getPrincipalExaminations,
  importPrincipalTeacherMarks,
  publishPrincipalExamResults,
  reviewPrincipalExamResult,
  updatePrincipalExamPlan,
  getStudentAvatarUrl,
} from "../../edops-api";
import { Award, CheckCircle2, Clock, FileCheck, Layers, Plus, X } from "lucide-react";
import { ExamPlanDrawer } from "../../components/exam-plan-drawer";
import { TableSkeletonRows } from "../components/skeleton-rows";

type View = "planning" | "schedule" | "marks" | "report_cards";
type Option = { id: string; name: string; programName?: string; subjects?: { id: string; name: string; code?: string }[] };
type Plan = {
  id: string;
  sectionId: string;
  subjectId: string;
  examName: string;
  term: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  status: string;
  className: string;
  sectionName: string;
  subjectName: string;
};
type Evaluation = {
  id: string;
  title: string;
  className: string;
  sectionName: string;
  subjectName: string;
  maxMarks: number;
  enteredStudents: number;
};
type Result = {
  id: string;
  examName: string;
  term: string;
  className: string;
  sectionName: string;
  subjectName: string;
  studentName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string | null;
  status: string;
  isLocked: boolean;
  publishedAt: string | null;
};
type Card = {
  studentUserId: string;
  studentName: string;
  examName: string;
  term: string;
  className: string;
  sectionName: string;
  subjects: {
    subjectName: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade: string | null;
  }[];
};
/* -------------------------------------------------------------------------- */
/* SKELETON LOADERS & EMPTY STATES                                            */
/* -------------------------------------------------------------------------- */

function KpiSkeletonGrid() {
  const cards = [
    { bg: "#D0EDC0" },
    { bg: "#E0D3FF" },
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
  actionLabel,
  onAction,
}: {
  illustration?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
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
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: "16px",
            background: "#0C1E33",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            boxShadow: "0 2px 4px rgba(12, 30, 51, 0.12)",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

type Data = {
  plans: Plan[];
  evaluations: Evaluation[];
  results: Result[];
  reportCards: Card[];
  sections: Option[];
  subjects: Option[];
  workflow: { entered: number; verified: number; approved: number; published: number };
};

export function ExaminationsPane({
  organizationId,
  initialTab = "schedule",
  onTabChange,
}: {
  organizationId: string;
  initialTab?: View;
  onTabChange?: (tab: string) => void;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentTab, setCurrentTab] = useState<View>(initialTab);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [markEdits, setMarkEdits] = useState<Record<string, string>>({});
  const [gradeEdits, setGradeEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  const load = () => getPrincipalExaminations(organizationId).then(setData);

  useEffect(() => {
    let active = true;
    getPrincipalExaminations(organizationId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load examinations");
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const change = (key: string, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const openPlan = (plan: Plan | null) => {
    setEditing(plan);
    setError("");
    setForm(
      plan
        ? {
            sectionId: plan.sectionId,
            subjectId: plan.subjectId,
            examName: plan.examName,
            term: plan.term,
            examDate: plan.examDate,
            startTime: plan.startTime,
            endTime: plan.endTime,
            maxMarks: String(plan.maxMarks),
            passingMarks: String(plan.passingMarks),
            status: plan.status,
          }
        : { status: "draft" }
    );
  };

  async function savePlan(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const max = Number(form.maxMarks || 100);
      const pass = Number(form.passingMarks || Math.max(1, Math.round(max * 0.33)));
      const body = { ...form, maxMarks: max, passingMarks: pass };
      if (editing) await updatePrincipalExamPlan(organizationId, editing.id, body);
      else await createPrincipalExamPlan(organizationId, body);
      await load();
      setEditing(null);
      setForm({});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save exam plan");
    } finally {
      setBusy(false);
    }
  }

  async function createPlans(payload: Parameters<ComponentProps<typeof ExamPlanDrawer>["onSubmit"]>[0]) {
    setBusy(true);
    setError("");
    try {
      await createPrincipalExamPlans(organizationId, payload);
      await load();
      setShowCreateDrawer(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create exam plans");
    } finally {
      setBusy(false);
    }
  }

  async function act(run: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await run();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Exam action failed");
    } finally {
      setBusy(false);
    }
  }

  const results = data?.results ?? [];
  const groups = new Map<string, { examName: string; term: string; className: string; sectionName: string; rows: Result[] }>();
  for (const result of results) {
    const key = JSON.stringify([result.term, result.examName, result.className, result.sectionName]);
    const group =
      groups.get(key) ?? {
        term: result.term,
        examName: result.examName,
        className: result.className,
        sectionName: result.sectionName,
        rows: [],
      };
    group.rows.push(result);
    groups.set(key, group);
  }

  const workflow = data?.workflow ?? { entered: 0, verified: 0, approved: 0, published: 0 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 164px height) */}
      {!data && !error ? (
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
          {/* Card 1: Mint */}
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
                PUBLISHED RESULTS
              </span>
              <CheckCircle2 size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {workflow.published}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                Live on Student &amp; Parent Portals
              </span>
            </div>
          </div>

          {/* Card 2: Violet */}
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
                APPROVED LEDGER
              </span>
              <Award size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {workflow.approved}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                Ready for Formal Publication
              </span>
            </div>
          </div>

          {/* Card 3: Sky */}
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
                VERIFIED MARKS
              </span>
              <FileCheck size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {workflow.verified}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                Department Head Audited
              </span>
            </div>
          </div>

          {/* Card 4: Peach */}
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
                MARKS IN ENTRY
              </span>
              <Clock size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {workflow.entered}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                Submitted by Teaching Staff
              </span>
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

      {/* Sub Navigation Strip & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "schedule", label: "Exam Schedule & Release Matrix" },
            { id: "planning", label: "Exam Planner & Slotting" },
            { id: "marks", label: "Principal Marks Ledger & Review" },
            { id: "report_cards", label: "Official Student Report Cards" },
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

        {currentTab === "planning" && (
          <button
            type="button"
            onClick={() => { setError(""); setShowCreateDrawer(true); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#0c1e33",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Plan New Exam
          </button>
        )}
      </div>

      {/* 1. Schedule View */}
      {currentTab === "schedule" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #E0E5EB", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E0E5EB" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>Scheduled Examinations</h3>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748B" }}>Live assessment schedules visible across timetable registers.</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E0E5EB", color: "#586C82", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", height: "44px" }}>
                  <th style={{ padding: "0 16px" }}>Exam Name</th>
                  <th style={{ padding: "0 16px" }}>Class / Subject</th>
                  <th style={{ padding: "0 16px" }}>Scheduled Date</th>
                  <th style={{ padding: "0 16px" }}>Time Window</th>
                  <th style={{ padding: "0 16px" }}>Max Marks</th>
                </tr>
              </thead>
              <tbody>
                {!data ? (
                  <TableSkeletonRows rows={6} columns={5} />
                ) : data.plans.filter((p) => p.status === "scheduled").length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "32px 16px" }}>
                      <EmptyState
                        illustration="/bee.png"
                        title="No Scheduled Examinations"
                        description="No active examinations are currently scheduled. Use the Plan New Exam tool to set dates and test slots."
                        actionLabel="Plan New Exam"
                        onAction={() => setShowCreateDrawer(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  data.plans
                    .filter((p) => p.status === "scheduled")
                    .map((plan, idx) => (
                      <tr
                        key={plan.id}
                        style={{
                          height: "52px",
                          background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                          borderBottom: "1px solid #E0E5EB",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC")}
                      >
                        <td style={{ padding: "0 16px", fontWeight: 600, color: "#0C1E33" }}>{plan.examName}</td>
                        <td style={{ padding: "0 16px", color: "#475569" }}>
                          {plan.className} - {plan.sectionName} · {plan.subjectName}
                        </td>
                        <td style={{ padding: "0 16px", color: "#0C1E33", fontWeight: 500 }}>{plan.examDate}</td>
                        <td style={{ padding: "0 16px", color: "#64748B" }}>
                          {plan.startTime} – {plan.endTime}
                        </td>
                        <td style={{ padding: "0 16px", fontWeight: 700, color: "#0C1E33" }}>{plan.maxMarks} marks</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Publication Sets */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Publish Approved Examination Results</h3>
            <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#64748b" }}>
              Publishing will lock the scores and immediately release the official report cards to parents and students.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[...groups.values()].map((group) => {
                const ready = group.rows.every((row) => row.status === "Approved" && !row.isLocked);
                const done = group.rows.every((row) => row.status === "Published" && row.isLocked);
                return (
                  <div
                    key={JSON.stringify([group.term, group.examName, group.className, group.sectionName])}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      border: "1px solid #e4e6e9",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: "#1e293b" }}>
                        {group.examName} ({group.term})
                      </span>
                      <span style={{ color: "#64748b", marginLeft: "8px" }}>
                        · {group.className} - {group.sectionName} · {group.rows.length} student scores
                      </span>
                      <span
                        style={{
                          marginLeft: "10px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background: done ? "#dcfce7" : ready ? "#e0e7ff" : "#fef3c7",
                          color: done ? "#166534" : ready ? "#3730a3" : "#92400e",
                        }}
                      >
                        {done ? "Published & Live" : ready ? "Ready for Release" : "Verification In Progress"}
                      </span>
                    </div>

                    {!done && (
                      <button
                        type="button"
                        disabled={busy || !ready}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Publish and lock ${group.rows.length} approved results for ${group.examName}, ${group.className} - ${group.sectionName}?`
                            )
                          )
                            act(() =>
                              publishPrincipalExamResults(organizationId, {
                                term: group.term,
                                examName: group.examName,
                                className: group.className,
                                sectionName: group.sectionName,
                              })
                            );
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          background: ready ? "#0c1e33" : "#e4e6e9",
                          color: ready ? "#ffffff" : "#94a3b8",
                          fontSize: "11px",
                          fontWeight: 600,
                          border: "none",
                          cursor: ready ? "pointer" : "not-allowed",
                        }}
                      >
                        Publish & Lock
                      </button>
                    )}
                  </div>
                );
              })}
              {!groups.size && (
                <EmptyState
                  illustration="/bee.png"
                  title="No Result Sets Awaiting Publication"
                  description="When marks are submitted and reviewed, compiled class batches will appear here for final publication and locking."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Planning View */}
      {currentTab === "planning" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #E0E5EB", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E0E5EB", color: "#586C82", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", height: "44px" }}>
                  <th style={{ padding: "0 16px" }}>Exam / Term</th>
                  <th style={{ padding: "0 16px" }}>Class &amp; Subject</th>
                  <th style={{ padding: "0 16px" }}>Date &amp; Time</th>
                  <th style={{ padding: "0 16px" }}>Max Marks</th>
                  <th style={{ padding: "0 16px" }}>Status</th>
                  <th style={{ padding: "0 16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {!data ? (
                  <TableSkeletonRows rows={6} columns={6} />
                ) : data.plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px 16px" }}>
                      <EmptyState
                        illustration="/bee.png"
                        title="No Exam Plans Saved Yet"
                        description="Set up your examination plans and subjects to track progress across all classes."
                        actionLabel="Plan New Exam"
                        onAction={() => openPlan(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  data.plans.map((plan, idx) => (
                    <tr
                      key={plan.id}
                      style={{
                        height: "52px",
                        background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                        borderBottom: "1px solid #E0E5EB",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC")}
                    >
                      <td style={{ padding: "0 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0C1E33" }}>{plan.examName}</div>
                        <div style={{ fontSize: "11px", color: "#64748B" }}>{plan.term}</div>
                      </td>
                      <td style={{ padding: "0 16px", color: "#475569" }}>
                        {plan.className} - {plan.sectionName} · {plan.subjectName}
                      </td>
                      <td style={{ padding: "0 16px", color: "#0C1E33" }}>
                        {plan.examDate} · {plan.startTime}–{plan.endTime}
                      </td>
                      <td style={{ padding: "0 16px", fontWeight: 700, color: "#0C1E33" }}>{plan.maxMarks}</td>
                      <td style={{ padding: "0 16px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: plan.status === "scheduled" ? "#DCFCE7" : "#F1F5F9",
                            color: plan.status === "scheduled" ? "#166534" : "#475569",
                          }}
                        >
                          {plan.status}
                        </span>
                      </td>
                      <td style={{ padding: "0 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => openPlan(plan)}
                          style={{
                            padding: "4px 12px",
                            borderRadius: "6px",
                            border: "1px solid #E2E8F0",
                            background: "#FFFFFF",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: "#0C1E33",
                            cursor: "pointer",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          Edit Plan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <ExamPlanDrawer
            open={showCreateDrawer}
            sections={data?.sections || []}
            busy={busy}
            onClose={() => setShowCreateDrawer(false)}
            onSubmit={createPlans}
          />

          {/* Plan Form Modal/Inline: edit existing plans only */}
          {(editing || form.status) && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                background: "rgba(11, 15, 25, 0.7)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <form
                onSubmit={savePlan}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  width: "100%",
                  maxWidth: "520px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0c1e33" }}>
                    {editing ? "Edit Exam Plan" : "New Exam Plan"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({});
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Class *
                    </label>
                    <select
                      required
                      value={form.sectionId ?? ""}
                      onChange={(e) => change("sectionId", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    >
                      <option value="">Select class</option>
                      {(data?.sections || []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Subject *
                    </label>
                    <select
                      required
                      value={form.subjectId ?? ""}
                      onChange={(e) => change("subjectId", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    >
                      <option value="">Select subject</option>
                      {(data?.subjects || []).map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Exam Title *
                  </label>
                  <input
                    required
                    maxLength={150}
                    placeholder="e.g. Mid-Term Summative Assessment"
                    value={form.examName ?? ""}
                    onChange={(e) => change("examName", e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Academic Term *
                    </label>
                    <input
                      required
                      maxLength={60}
                      placeholder="e.g. Term 1"
                      value={form.term ?? ""}
                      onChange={(e) => change("term", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Maximum Marks *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.maxMarks ?? ""}
                      onChange={(e) => change("maxMarks", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Subject Passing Marks *
                    </label>
                    <input type="number" required min="0.01" max={form.maxMarks || undefined} value={form.passingMarks ?? ""} onChange={(e) => change("passingMarks", e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Exam Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.examDate ?? ""}
                      onChange={(e) => change("examDate", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={form.startTime ?? ""}
                      onChange={(e) => change("startTime", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={form.endTime ?? ""}
                      onChange={(e) => change("endTime", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Status
                  </label>
                  <select
                    value={form.status ?? "draft"}
                    onChange={(e) => change("status", e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  >
                    <option value="draft">Draft (Planning)</option>
                    <option value="scheduled">Scheduled (Active in Timetable)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({});
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      background: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#0c1e33",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    {busy ? "Saving…" : "Save Plan"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 3. Marks Ledger View */}
      {currentTab === "marks" && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Teacher Gradebook Evaluations</h3>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>Import teacher-submitted scores into the official principal ledger.</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Evaluation Title</th>
                  <th style={{ padding: "12px 16px" }}>Class / Subject</th>
                  <th style={{ padding: "12px 16px" }}>Entered Students</th>
                  <th style={{ padding: "12px 16px" }}>Maximum Marks</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.evaluations.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "32px 16px" }}>
                      <EmptyState
                        illustration="/bee.png"
                        title="No Teacher Gradebook Evaluations"
                        description="Teacher-submitted evaluation marks will appear here for import into the principal master ledger."
                      />
                    </td>
                  </tr>
                ) : (
                  data.evaluations.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{ev.title}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>
                        {ev.className} - {ev.sectionName} · {ev.subjectName}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#15803d" }}>{ev.enteredStudents} entered</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{ev.maxMarks}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          disabled={busy || !ev.enteredStudents}
                          onClick={() => act(() => importPrincipalTeacherMarks(organizationId, ev.id))}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            background: "#0c1e33",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Import Marks
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Principal Marks Ledger</h3>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
                Verify and approve marks. Editable scores can be amended prior to final publication.
              </p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Student</th>
                  <th style={{ padding: "12px 16px" }}>Exam / Subject</th>
                  <th style={{ padding: "12px 16px" }}>Marks Obtained</th>
                  <th style={{ padding: "12px 16px" }}>Percentage</th>
                  <th style={{ padding: "12px 16px" }}>Grade</th>
                  <th style={{ padding: "12px 16px" }}>Audit State</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Review Action</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "32px 16px" }}>
                      <EmptyState
                        illustration="/bee.png"
                        title="No Marks Imported Yet"
                        description="Import marks from teacher gradebook evaluations above to audit, edit, and approve them."
                      />
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr key={result.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img
                            src={getStudentAvatarUrl(result.studentName, result.id)}
                            alt=""
                            style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#eaedf2" }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "#1e293b" }}>{result.studentName}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              {result.className} - {result.sectionName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{result.examName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{result.subjectName}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {result.status === "Entered" || result.status === "Verified" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                              aria-label={`Marks for ${result.studentName}`}
                              style={{ width: "60px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                              type="number"
                              min="0"
                              max={result.maxMarks}
                              step="0.01"
                              value={markEdits[result.id] ?? String(result.marksObtained)}
                              onChange={(e) => setMarkEdits((old) => ({ ...old, [result.id]: e.target.value }))}
                            />
                            <span style={{ color: "#64748b" }}>/ {result.maxMarks}</span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 700, color: "#1e293b" }}>
                            {result.marksObtained} / {result.maxMarks}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: result.percentage >= 75 ? "#15803d" : "#dc2626" }}>
                        {result.percentage}%
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {result.status === "Entered" || result.status === "Verified" ? (
                          <input
                            aria-label={`Grade for ${result.studentName}`}
                            style={{ width: "50px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                            maxLength={10}
                            value={gradeEdits[result.id] ?? result.grade ?? ""}
                            onChange={(e) => setGradeEdits((old) => ({ ...old, [result.id]: e.target.value }))}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9" }}>
                            {result.grade || "—"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: result.status === "Approved" ? "#dcfce7" : result.status === "Verified" ? "#e0e7ff" : "#fef3c7",
                            color: result.status === "Approved" ? "#166534" : result.status === "Verified" ? "#3730a3" : "#92400e",
                          }}
                        >
                          {result.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {(result.status === "Entered" || result.status === "Verified") &&
                            (markEdits[result.id] !== undefined || gradeEdits[result.id] !== undefined) && (
                              <button
                                type="button"
                                disabled={busy || markEdits[result.id] === ""}
                                onClick={() =>
                                  act(async () => {
                                    await reviewPrincipalExamResult(organizationId, result.id, {
                                      ...(markEdits[result.id] === undefined ? {} : { marksObtained: Number(markEdits[result.id]) }),
                                      ...(gradeEdits[result.id] === undefined ? {} : { grade: gradeEdits[result.id] }),
                                    });
                                    setMarkEdits((old) => {
                                      const next = { ...old };
                                      delete next[result.id];
                                      return next;
                                    });
                                    setGradeEdits((old) => {
                                      const next = { ...old };
                                      delete next[result.id];
                                      return next;
                                    });
                                  })
                                }
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  background: "#0c1e33",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                Save
                              </button>
                            )}

                          {result.status === "Entered" ? (
                            <button
                              type="button"
                              disabled={busy || markEdits[result.id] !== undefined || gradeEdits[result.id] !== undefined}
                              onClick={() => act(() => reviewPrincipalExamResult(organizationId, result.id, { status: "Verified" }))}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "4px",
                                background: "#ffffff",
                                border: "1px solid #e4e6e9",
                                color: "#0c1e33",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Verify
                            </button>
                          ) : result.status === "Verified" ? (
                            <button
                              type="button"
                              disabled={busy || markEdits[result.id] !== undefined || gradeEdits[result.id] !== undefined}
                              onClick={() => act(() => reviewPrincipalExamResult(organizationId, result.id, { status: "Approved" }))}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "4px",
                                background: "#0c1e33",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 600,
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              Approve
                            </button>
                          ) : result.isLocked ? (
                            <span style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>Locked & Released</span>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#166534", fontWeight: 600 }}>Ready to Publish</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Report Cards View */}
      {currentTab === "report_cards" && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {data.reportCards.length === 0 ? (
            <EmptyState
              illustration="/bee.png"
              title="No Report Cards Published Yet"
              description="Once approved examination scores are published and locked, official student report cards will generate automatically here."
            />
          ) : (
            data.reportCards.map((card) => (
              <article
                key={JSON.stringify([card.studentUserId, card.examName, card.term, card.className, card.sectionName])}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                      src={getStudentAvatarUrl(card.studentName, card.studentUserId)}
                      alt=""
                      style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#eaedf2" }}
                    />
                    <div>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{card.studentName}</h3>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                        {card.className} - {card.sectionName} · {card.examName} ({card.term})
                      </p>
                    </div>
                  </div>
                  <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, background: "#dcfce7", color: "#166534" }}>
                    Official Certified Report
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                        <th style={{ padding: "10px 14px" }}>Subject</th>
                        <th style={{ padding: "10px 14px" }}>Marks Obtained</th>
                        <th style={{ padding: "10px 14px" }}>Percentage</th>
                        <th style={{ padding: "10px 14px" }}>Certified Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {card.subjects.map((sub) => (
                        <tr key={sub.subjectName} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e293b" }}>{sub.subjectName}</td>
                          <td style={{ padding: "10px 14px", color: "#475569" }}>
                            {sub.marksObtained} / {sub.maxMarks}
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 800, color: "#1e293b" }}>{sub.percentage}%</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, background: "#f1f5f9", color: "#0c1e33" }}>
                              {sub.grade || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
