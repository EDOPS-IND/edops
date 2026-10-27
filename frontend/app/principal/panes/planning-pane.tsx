"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Plus,
  Calendar,
  Target as TargetIcon,
  ClipboardCheck,
  Users,
  CalendarDays,
  X,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
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
            padding: "8px 18px",
            borderRadius: "6px",
            background: "#0C1E33",
            color: "#FFFFFF",
            border: "none",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={14} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    getPrincipalPlanning(organizationId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load academic planning");
      })
      .finally(() => {
        if (active) setLoading(false);
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
          {/* Card 1: Annual Plans (Pastel Violet) */}
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
                ANNUAL PLANS
              </span>
              <Calendar size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {plans.length > 0 ? plans.length : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                Curricular blueprints active
              </span>
              <div
                onClick={() => setCurrentTab("annual_plan")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                  Annual Plans
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#51249A" }} />
              </div>
            </div>
          </div>

          {/* Card 2: Academic Targets (Pastel Mint Green) */}
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
                ACADEMIC TARGETS
              </span>
              <TargetIcon size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {(data?.targets ?? []).length > 0 ? (data?.targets ?? []).length : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                Measurable academic milestones
              </span>
              <div
                onClick={() => setCurrentTab("school_targets")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                  Targets
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#305E26" }} />
              </div>
            </div>
          </div>

          {/* Card 3: Action Plans (Pastel Sky Blue) */}
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
                ACTION PLANS
              </span>
              <ClipboardCheck size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {actions.length > 0 ? actions.length : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                Targeted remedial interventions
              </span>
              <div
                onClick={() => setCurrentTab("action_plans")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                  Action Plans
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
              </div>
            </div>
          </div>

          {/* Card 4: Review Audits (Pastel Warm Peach) */}
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
                REVIEW AUDITS
              </span>
              <Users size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {meetings.length > 0 ? meetings.length : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                Department review meetings
              </span>
              <div
                onClick={() => setCurrentTab("calendar")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                  Calendar
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

      {/* Header Strip & Action Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", width: "100%" }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0C1E33", margin: 0 }}>{heading}</h2>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
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
                border: "1px solid #E2E8F0",
                background: "#FFFFFF",
                color: "#0C1E33",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
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
              background: "#0C1E33",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
              boxShadow: "0 2px 4px rgba(12, 30, 51, 0.12)",
            }}
          >
            <Plus size={15} />{" "}
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
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%", alignItems: "center" }}>
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
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                height: "34px",
                padding: "0 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: active ? "#0C1E33" : "#E2E8F0",
                background: active ? "#0C1E33" : "#F4F6F8",
                color: active ? "#FFFFFF" : "#5A6B7D",
                fontSize: "12px",
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                boxShadow: active ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
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
            <EmptyState
              illustration="/bee.png"
              title="No Annual Academic Plan"
              description="No annual academic blueprint has been created for this academic year yet. Click 'New Academic Plan' to establish objectives and curriculum frameworks."
              actionLabel="New Academic Plan"
              onAction={() => open("plan")}
            />
          ) : (
            plans.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E5EB",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>{item.title}</h3>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: item.status === "Approved" ? "#DCFCE7" : "#F1F5F9",
                      color: item.status === "Approved" ? "#166534" : "#475569",
                    }}
                  >
                    {item.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "12px" }}>
                  Affiliation Board: <b>{item.board}</b>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "#475569" }}>
                  {item.academicObjectives && <div><b style={{ color: "#0C1E33" }}>Objectives:</b> {item.academicObjectives}</div>}
                  {item.teachingPedagogyStrategy && <div><b style={{ color: "#0C1E33" }}>Teaching Strategy:</b> {item.teachingPedagogyStrategy}</div>}
                  {item.assessmentStrategy && <div><b style={{ color: "#0C1E33" }}>Assessment Scheme:</b> {item.assessmentStrategy}</div>}
                  {item.remedialPlan && <div><b style={{ color: "#0C1E33" }}>Remedial Support:</b> {item.remedialPlan}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === "calendar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {calendar.length === 0 ? (
            <EmptyState
              illustration="/bee.png"
              title="No Calendar Milestones"
              description="No academic milestones, target deadlines, or review meeting dates are recorded in the institutional calendar."
              actionLabel="Record Review Meeting"
              onAction={() => open("meeting")}
            />
          ) : (
            calendar.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E5EB",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 600,
                        background: "#F1F5F9",
                        color: "#0C1E33",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.kind}
                    </span>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0C1E33" }}>{item.title}</h3>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748B" }}>{item.detail}</p>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33" }}>{date(item.when)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {(view === "learning_goals" || view === "school_targets") && !showActions && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
          {targets.length === 0 ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <EmptyState
                illustration="/bee.png"
                title="No Academic Targets Logged"
                description="Establish institutional benchmarks and student learning outcomes to monitor performance targets."
                actionLabel="Create Target"
                onAction={() => open("target")}
              />
            </div>
          ) : (
            targets.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E5EB",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>{item.title}</h3>
                    <span
                      style={{
                        padding: "2px 7px",
                        borderRadius: "100px",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        background: item.progressPercentage >= 80 ? "#DCFCE7" : "#FEF3C7",
                        color: item.progressPercentage >= 80 ? "#166534" : "#92400E",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "12px" }}>
                    Owner: <b>{item.ownerName || "Unassigned"}</b> • Deadline: {date(item.deadline)}
                  </div>

                  <div style={{ margin: "12px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#475569", marginBottom: "4px" }}>
                      <span>Baseline: <b>{item.baselineValue}</b></span>
                      <span>Target: <b>{item.targetValue}</b></span>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, item.progressPercentage)}%`,
                          background: item.progressPercentage >= 80 ? "#10B981" : "#0C1E33",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #F1F5F9" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33" }}>
                    {item.currentValue} ({item.progressPercentage}%)
                  </span>
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
                      background: "#FFFFFF",
                      border: "1px solid #E0E5EB",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#0C1E33",
                      cursor: "pointer",
                      fontFamily: "'Poppins', sans-serif",
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
            <EmptyState
              illustration="/bee.png"
              title="No Action Plans Recorded"
              description="No targeted action plans or remedial interventions are currently logged."
              actionLabel="Create Action Plan"
              onAction={() => open("action")}
            />
          ) : (
            actions.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0E5EB",
                  borderRadius: "10px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(12, 30, 51, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>{item.issue}</h3>
                  <span style={{ padding: "2px 7px", borderRadius: "100px", fontSize: "11px", fontWeight: 600, background: "#DCFCE7", color: "#166534" }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "8px" }}>
                  Owner: <b>{item.ownerName}</b> • Deadline: {date(item.deadline)}
                </div>
                <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div><b style={{ color: "#0C1E33" }}>Action:</b> {item.action}</div>
                  {item.evidence && <div><b style={{ color: "#0C1E33" }}>Evidence:</b> {item.evidence}</div>}
                  {item.expectedResult && <div><b style={{ color: "#0C1E33" }}>Expected Outcome:</b> {item.expectedResult}</div>}
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
              background: "#FFFFFF",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E0E5EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", margin: 0 }}>
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
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: "4px" }}
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
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
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
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
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
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
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
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Baseline Value *
                      </label>
                      <input
                        required
                        value={form.baselineValue ?? ""}
                        onChange={(e) => field("baselineValue", e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Target Value *
                      </label>
                      <input
                        required
                        value={form.targetValue ?? ""}
                        onChange={(e) => field("targetValue", e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                      />
                    </div>
                  </div>
                </>
              )}

              {formKind === "action" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Identified Academic Issue *
                    </label>
                    <input
                      required
                      value={form.issue ?? ""}
                      onChange={(e) => field("issue", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Action Description *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={form.action ?? ""}
                      onChange={(e) => field("action", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>
                </>
              )}

              {formKind === "progress" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Current Metric Value *
                    </label>
                    <input
                      required
                      value={form.currentValue ?? ""}
                      onChange={(e) => field("currentValue", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Progress Percentage (0 - 100) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={form.progressPercentage ?? ""}
                      onChange={(e) => field("progressPercentage", e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
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
                    borderRadius: "8px",
                    border: "1px solid #E0E5EB",
                    background: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#0C1E33",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
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
