"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Calendar, Target as TargetIcon, ClipboardCheck, Users, CalendarDays, X, CheckCircle2 } from "lucide-react";
import {
  createPrincipalAcademicPlan,
  createPrincipalAcademicTarget,
  createPrincipalActionPlan,
  createPrincipalReviewMeeting,
  getPrincipalPlanning,
  updatePrincipalAcademicTarget,
} from "../../edops-api";

type Plan = {
  id: string;
  title: string;
  board: string;
  academicObjectives: string;
  teachingPedagogyStrategy: string;
  assessmentStrategy: string;
  remedialPlan: string;
  status: string;
};
type Target = {
  id: string;
  title: string;
  category: string;
  baselineValue: string;
  targetValue: string;
  currentValue: string;
  progressPercentage: number;
  ownerName: string;
  deadline: string;
  status: string;
};
type ActionPlan = {
  id: string;
  issue: string;
  evidence: string;
  rootCause: string;
  action: string;
  ownerName: string;
  deadline: string;
  reviewDate: string;
  expectedResult: string;
  status: string;
};
type Meeting = {
  id: string;
  meetingType: string;
  meetingDate: string;
  participants: string[];
  agenda: string;
  findings: string;
  decisions: string;
  status: string;
};
type PlanningData = { plans: Plan[]; targets: Target[]; actionPlans: ActionPlan[]; meetings: Meeting[] };
type FormKind = "plan" | "target" | "action" | "meeting" | "progress";
const date = (value: string) => value?.slice(0, 10) || "—";

export function PlanningPane({
  organizationId,
  initialTab = "annual_plan",
  onTabChange,
}: {
  organizationId: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const [data, setData] = useState<PlanningData | null>(null);
  const [error, setError] = useState("");
  const [formKind, setFormKind] = useState<FormKind | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [currentTab, setCurrentTab] = useState(initialTab || "annual_plan");

  useEffect(() => {
    if (initialTab) setCurrentTab(initialTab);
  }, [initialTab]);

  const view = currentTab;

  const reload = () => getPrincipalPlanning(organizationId).then(setData);

  useEffect(() => {
    let active = true;
    getPrincipalPlanning(organizationId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load academic planning");
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const field = (name: string, value: string) => setForm((previous) => ({ ...previous, [name]: value }));
  const open = (kind: FormKind) => {
    setError("");
    setForm({});
    setFormKind(kind);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!formKind) return;
    setSaving(true);
    setError("");
    try {
      if (formKind === "plan") await createPrincipalAcademicPlan(organizationId, { ...form, status: "Draft" });
      if (formKind === "target")
        await createPrincipalAcademicTarget(organizationId, {
          ...form,
          category: view === "learning_goals" ? "Learning" : "School",
        });
      if (formKind === "action") await createPrincipalActionPlan(organizationId, form);
      if (formKind === "meeting")
        await createPrincipalReviewMeeting(organizationId, {
          ...form,
          participants: (form.participants ?? "").split(",").map((name) => name.trim()).filter(Boolean),
        });
      if (formKind === "progress")
        await updatePrincipalAcademicTarget(organizationId, selectedTargetId, {
          currentValue: form.currentValue,
          progressPercentage: Number(form.progressPercentage),
        });
      await reload();
      setFormKind(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save planning record");
    } finally {
      setSaving(false);
    }
  }

  const plans = data?.plans ?? [];
  const targets = (data?.targets ?? []).filter((item) =>
    view === "learning_goals" ? item.category === "Learning" : item.category !== "Learning"
  );
  const actions = data?.actionPlans ?? [];
  const meetings = data?.meetings ?? [];
  const calendar = [
    ...meetings.map((item) => ({
      id: `meeting-${item.id}`,
      when: item.meetingDate,
      kind: "Academic review",
      title: item.meetingType,
      detail: item.agenda,
    })),
    ...(data?.targets ?? []).map((item) => ({
      id: `target-${item.id}`,
      when: item.deadline,
      kind: "Target deadline",
      title: item.title,
      detail: item.ownerName,
    })),
    ...actions.map((item) => ({
      id: `review-${item.id}`,
      when: item.reviewDate,
      kind: "Action review",
      title: item.issue,
      detail: item.ownerName,
    })),
  ].sort((a, b) => date(a.when).localeCompare(date(b.when)));

  const heading =
    view === "annual_plan"
      ? "Annual Academic Plan"
      : view === "calendar"
      ? "Academic Calendar"
      : view === "learning_goals"
      ? "Learning Goals & Targets"
      : view === "action_plans"
      ? "Academic Action Plans"
      : "School Academic Targets";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Mint */}
        <div
          style={{
            height: "148px",
            background: "#ccefbf",
            border: "1px solid #b2e49f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a5c0a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Annual Plans
            </span>
            <Calendar size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{plans.length}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              Curricular Blueprints Active
            </div>
          </div>
        </div>

        {/* Card 2: Violet */}
        <div
          style={{
            height: "148px",
            background: "#e1d2ff",
            border: "1px solid #cdb5ff",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4a0e8f", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Academic Targets
            </span>
            <TargetIcon size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{(data?.targets ?? []).length}</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Measurable Academic Milestones
            </div>
          </div>
        </div>

        {/* Card 3: Sky */}
        <div
          style={{
            height: "148px",
            background: "#bae5f5",
            border: "1px solid #9ad7ef",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a5a7a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Action Plans
            </span>
            <ClipboardCheck size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{actions.length}</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Targeted Remedial Interventions
            </div>
          </div>
        </div>

        {/* Card 4: Peach */}
        <div
          style={{
            height: "148px",
            background: "#ffd8c7",
            border: "1px solid #ffbe9f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#782a00", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Review Audits
            </span>
            <Users size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>{meetings.length}</div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              Department Review Meetings
            </div>
          </div>
        </div>
      </div>

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

      {/* Header Strip & Action Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0c1e33", margin: 0 }}>{heading}</h2>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
            Administrative roadmaps, objectives, and statutory compliance timelines.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {view === "school_targets" && (
            <button
              type="button"
              onClick={() => setShowActions(!showActions)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #e4e6e9",
                background: "#ffffff",
                color: "#0c1e33",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {showActions ? "View Targets" : "View Action Plans"}
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              open(
                view === "annual_plan"
                  ? "plan"
                  : view === "calendar"
                  ? "meeting"
                  : view === "action_plans" || (showActions && view === "school_targets")
                  ? "action"
                  : "target"
              )
            }
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
            <Plus size={14} />{" "}
            {view === "annual_plan"
              ? "New Academic Plan"
              : view === "calendar"
              ? "Record Review Meeting"
              : view === "action_plans" || (showActions && view === "school_targets")
              ? "Create Action Plan"
              : "Create Target"}
          </button>
        </div>
      </div>

      {/* Subtab Navigation Strip */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderBottom: "1px solid #e4e6e9", paddingBottom: "12px" }}>
        {[
          { id: "annual_plan", label: "Annual Academic Plan" },
          { id: "calendar", label: "Academic Calendar" },
          { id: "learning_goals", label: "Learning Goals & Targets" },
          { id: "school_targets", label: "School Academic Targets" },
          { id: "action_plans", label: "Action Plans" },
        ].map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setCurrentTab(t.id);
                onTabChange?.(t.id);
              }}
              style={{
                all: "unset",
                boxSizing: "border-box",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                border: active ? "1px solid #0c1e33" : "1px solid #e4e6e9",
                background: active ? "#0c1e33" : "#ffffff",
                color: active ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Panes Content */}
      {view === "annual_plan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {plans.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9" }}>
              No annual academic plan has been recorded. Click "New Academic Plan" to establish one.
            </div>
          ) : (
            plans.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>{item.title}</h3>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: item.status === "Approved" ? "#dcfce7" : "#f1f5f9",
                      color: item.status === "Approved" ? "#166534" : "#475569",
                    }}
                  >
                    {item.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>Affiliation Board: <b>{item.board}</b></div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#475569" }}>
                  {item.academicObjectives && <div><b style={{ color: "#1e293b" }}>Objectives:</b> {item.academicObjectives}</div>}
                  {item.teachingPedagogyStrategy && <div><b style={{ color: "#1e293b" }}>Teaching Strategy:</b> {item.teachingPedagogyStrategy}</div>}
                  {item.assessmentStrategy && <div><b style={{ color: "#1e293b" }}>Assessment Scheme:</b> {item.assessmentStrategy}</div>}
                  {item.remedialPlan && <div><b style={{ color: "#1e293b" }}>Remedial Support:</b> {item.remedialPlan}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === "calendar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {calendar.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9" }}>
              No academic milestones or meeting dates recorded.
            </div>
          ) : (
            calendar.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        background: "#f1f5f9",
                        color: "#0c1e33",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.kind}
                    </span>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{item.title}</h3>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>{item.detail}</p>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#0c1e33" }}>{date(item.when)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {(view === "learning_goals" || view === "school_targets") && !showActions && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {targets.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9", gridColumn: "1 / -1" }}>
              No academic targets logged yet.
            </div>
          ) : (
            targets.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{item.title}</h3>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        background: item.progressPercentage >= 80 ? "#dcfce7" : "#fef3c7",
                        color: item.progressPercentage >= 80 ? "#166534" : "#92400e",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "12px" }}>
                    Owner: <b>{item.ownerName || "Unassigned"}</b> • Deadline: {date(item.deadline)}
                  </div>

                  <div style={{ margin: "12px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#475569", marginBottom: "4px" }}>
                      <span>Baseline: <b>{item.baselineValue}</b></span>
                      <span>Target: <b>{item.targetValue}</b></span>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, item.progressPercentage)}%`,
                          background: item.progressPercentage >= 80 ? "#10b981" : "#0c1e33",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#0c1e33" }}>{item.currentValue} ({item.progressPercentage}%)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTargetId(item.id);
                      setForm({});
                      setFormKind("progress");
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "#ffffff",
                      border: "1px solid #e4e6e9",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#0c1e33",
                      cursor: "pointer",
                    }}
                  >
                    Update Progress
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(view === "action_plans" || (view === "school_targets" && showActions)) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {actions.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "10px", border: "1px solid #e4e6e9" }}>
              No academic action plans recorded.
            </div>
          ) : (
            actions.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e4e6e9",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{item.issue}</h3>
                  <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, background: "#dcfce7", color: "#166534" }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>Owner: <b>{item.ownerName}</b> • Deadline: {date(item.deadline)}</div>
                <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div><b style={{ color: "#1e293b" }}>Action:</b> {item.action}</div>
                  {item.evidence && <div><b style={{ color: "#1e293b" }}>Evidence:</b> {item.evidence}</div>}
                  {item.expectedResult && <div><b style={{ color: "#1e293b" }}>Expected Outcome:</b> {item.expectedResult}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Action Dialog Modal */}
      {formKind && (
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
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e4e6e9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0c1e33", margin: 0 }}>
                {
                  {
                    plan: "New Academic Plan",
                    target: "Create Academic Target",
                    action: "Create Action Plan",
                    meeting: "Record Review Meeting",
                    progress: "Record Target Progress",
                  }[formKind]
                }
              </h2>
              <button
                type="button"
                onClick={() => setFormKind(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={submit}
              style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {formKind === "plan" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Plan Title *
                    </label>
                    <input
                      required
                      value={form.title ?? ""}
                      onChange={(e) => field("title", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Board / Curricular Framework *
                    </label>
                    <input
                      required
                      value={form.board ?? ""}
                      onChange={(e) => field("board", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Academic Objectives
                    </label>
                    <textarea
                      rows={2}
                      value={form.academicObjectives ?? ""}
                      onChange={(e) => field("academicObjectives", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                </>
              )}

              {formKind === "target" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Target Title *
                    </label>
                    <input
                      required
                      value={form.title ?? ""}
                      onChange={(e) => field("title", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Owner Name *
                    </label>
                    <input
                      required
                      value={form.ownerName ?? ""}
                      onChange={(e) => field("ownerName", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Baseline Value *
                      </label>
                      <input
                        required
                        placeholder="e.g. 70%"
                        value={form.baselineValue ?? ""}
                        onChange={(e) => field("baselineValue", e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Target Value *
                      </label>
                      <input
                        required
                        placeholder="e.g. 85%"
                        value={form.targetValue ?? ""}
                        onChange={(e) => field("targetValue", e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Target Deadline *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.deadline ?? ""}
                      onChange={(e) => field("deadline", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                </>
              )}

              {formKind === "action" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Issue / Academic Gap *
                    </label>
                    <input
                      required
                      placeholder="e.g. Class 10 Math PT2 fell by 11%"
                      value={form.issue ?? ""}
                      onChange={(e) => field("issue", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Corrective Action / Strategy *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Conduct remedial sessions on Quadratic Equations"
                      value={form.action ?? ""}
                      onChange={(e) => field("action", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Owner Name *
                    </label>
                    <input
                      required
                      placeholder="e.g. HOD Mathematics"
                      value={form.ownerName ?? ""}
                      onChange={(e) => field("ownerName", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Implementation Deadline *
                      </label>
                      <input
                        type="date"
                        required
                        value={form.deadline ?? ""}
                        onChange={(e) => field("deadline", e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Review Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={form.reviewDate ?? ""}
                        onChange={(e) => field("reviewDate", e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Target Outcome / Expected Result
                    </label>
                    <input
                      placeholder="e.g. Re-test score >= 75%"
                      value={form.expectedResult ?? ""}
                      onChange={(e) => field("expectedResult", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                </>
              )}

              {formKind === "meeting" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Meeting Type *
                    </label>
                    <input
                      required
                      placeholder="e.g. Monthly Academic Review"
                      value={form.meetingType ?? ""}
                      onChange={(e) => field("meetingType", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Meeting Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={form.meetingDate ?? ""}
                        onChange={(e) => field("meetingDate", e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Participants (comma-separated) *
                      </label>
                      <input
                        required
                        placeholder="Principal, HOD Math, Science Lead"
                        value={form.participants ?? ""}
                        onChange={(e) => field("participants", e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Agenda & Focus *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Syllabus completion pace and Term 1 pre-board readiness"
                      value={form.agenda ?? ""}
                      onChange={(e) => field("agenda", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Decisions & Next Steps
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Conduct remedial tests every Saturday"
                      value={form.decisions ?? ""}
                      onChange={(e) => field("decisions", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                </>
              )}

              {formKind === "progress" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Current Measured Value
                    </label>
                    <input
                      value={form.currentValue ?? ""}
                      onChange={(e) => field("currentValue", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Progress Percentage (0–100%) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={form.progressPercentage ?? ""}
                      onChange={(e) => field("progressPercentage", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setFormKind(null)}
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
                  disabled={saving}
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
                  {saving ? "Saving…" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
