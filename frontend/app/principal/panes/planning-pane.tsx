"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { createPrincipalAcademicPlan, createPrincipalAcademicTarget, createPrincipalActionPlan, createPrincipalReviewMeeting, getPrincipalPlanning, updatePrincipalAcademicTarget } from "../../edops-api";

type Plan = { id: string; title: string; board: string; academicObjectives: string; teachingPedagogyStrategy: string; assessmentStrategy: string; remedialPlan: string; status: string };
type Target = { id: string; title: string; category: string; baselineValue: string; targetValue: string; currentValue: string; progressPercentage: number; ownerName: string; deadline: string; status: string };
type ActionPlan = { id: string; issue: string; evidence: string; rootCause: string; action: string; ownerName: string; deadline: string; reviewDate: string; expectedResult: string; status: string };
type Meeting = { id: string; meetingType: string; meetingDate: string; participants: string[]; agenda: string; findings: string; decisions: string; status: string };
type PlanningData = { plans: Plan[]; targets: Target[]; actionPlans: ActionPlan[]; meetings: Meeting[] };
type FormKind = "plan" | "target" | "action" | "meeting" | "progress";
const date = (value: string) => value?.slice(0, 10) || "—";

export function PlanningPane({ organizationId, initialTab = "annual_plan" }: { organizationId: string; initialTab?: string }) {
  const [data, setData] = useState<PlanningData | null>(null);
  const [error, setError] = useState("");
  const [formKind, setFormKind] = useState<FormKind | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const view = initialTab;

  const reload = () => getPrincipalPlanning(organizationId).then(setData);
  useEffect(() => {
    let active = true;
    getPrincipalPlanning(organizationId).then((result) => { if (active) setData(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load academic planning"); });
    return () => { active = false; };
  }, [organizationId]);

  const field = (name: string, value: string) => setForm((previous) => ({ ...previous, [name]: value }));
  const open = (kind: FormKind) => { setError(""); setForm({}); setFormKind(kind); };
  const input = (name: string, label: string, required = true, type = "text") =>
    <label>{label}<input type={type} required={required} value={form[name] ?? ""} onChange={(event) => field(name, event.target.value)} /></label>;
  const area = (name: string, label: string, required = false) =>
    <label>{label}<textarea required={required} value={form[name] ?? ""} onChange={(event) => field(name, event.target.value)} /></label>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!formKind) return;
    setSaving(true); setError("");
    try {
      if (formKind === "plan") await createPrincipalAcademicPlan(organizationId, { ...form, status: "Draft" });
      if (formKind === "target") await createPrincipalAcademicTarget(organizationId, { ...form, category: view === "learning_goals" ? "Learning" : "School" });
      if (formKind === "action") await createPrincipalActionPlan(organizationId, form);
      if (formKind === "meeting") await createPrincipalReviewMeeting(organizationId, {
        ...form, participants: (form.participants ?? "").split(",").map((name) => name.trim()).filter(Boolean),
      });
      if (formKind === "progress") await updatePrincipalAcademicTarget(organizationId, selectedTargetId, {
        currentValue: form.currentValue, progressPercentage: Number(form.progressPercentage),
      });
      await reload();
      setFormKind(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save planning record");
    } finally { setSaving(false); }
  }

  const plans = data?.plans ?? [];
  const targets = (data?.targets ?? []).filter((item) => view === "learning_goals" ? item.category === "Learning" : item.category !== "Learning");
  const actions = data?.actionPlans ?? [];
  const meetings = data?.meetings ?? [];
  const calendar = [
    ...meetings.map((item) => ({ id: `meeting-${item.id}`, when: item.meetingDate, kind: "Academic review", title: item.meetingType, detail: item.agenda })),
    ...(data?.targets ?? []).map((item) => ({ id: `target-${item.id}`, when: item.deadline, kind: "Target deadline", title: item.title, detail: item.ownerName })),
    ...actions.map((item) => ({ id: `review-${item.id}`, when: item.reviewDate, kind: "Action review", title: item.issue, detail: item.ownerName })),
  ].sort((a, b) => date(a.when).localeCompare(date(b.when)));
  const empty = (message: string) => <p className="text-sm text-slate-500">{data ? message : error ? "Data unavailable" : "Loading…"}</p>;
  const heading = view === "annual_plan" ? "Annual Academic Plan" : view === "calendar" ? "Academic Calendar" : view === "learning_goals" ? "Learning Goals & Targets" : view === "action_plans" ? "Academic Action Plans" : "School Academic Targets";

  return <section className="planning-pane space-y-5 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <div className="flex flex-wrap gap-2">
        {view === "school_targets" && <button type="button" onClick={() => setShowActions(!showActions)}>{showActions ? "View Targets" : "View Action Plans"}</button>}
        <button type="button" onClick={() => open(view === "annual_plan" ? "plan" : view === "calendar" ? "meeting" : view === "action_plans" || showActions && view === "school_targets" ? "action" : "target")}>
          <Plus size={14} /> {view === "annual_plan" ? "New Academic Plan" : view === "calendar" ? "Record Review Meeting" : view === "action_plans" || showActions && view === "school_targets" ? "Create Action Plan" : "Create Target"}
        </button>
      </div>
    </div>
    {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

    {view === "annual_plan" && (plans.length ? <div className="grid gap-3">{plans.map((item) => <article key={item.id} className="rounded border bg-white p-4">
      <div className="flex justify-between gap-3"><h3 className="font-semibold">{item.title}</h3><span>{item.status}</span></div>
      <p className="text-slate-500">{item.board}</p>
      {item.academicObjectives && <p><b>Objectives:</b> {item.academicObjectives}</p>}
      {item.teachingPedagogyStrategy && <p><b>Teaching strategy:</b> {item.teachingPedagogyStrategy}</p>}
      {item.assessmentStrategy && <p><b>Assessment:</b> {item.assessmentStrategy}</p>}
      {item.remedialPlan && <p><b>Student support:</b> {item.remedialPlan}</p>}
    </article>)}</div> : empty("No annual plan has been recorded."))}

    {view === "calendar" && (calendar.length ? <div className="grid gap-3">{calendar.map((item) => <article key={item.id} className="rounded border bg-white p-4">
      <p className="text-slate-500">{date(item.when)} · {item.kind}</p><h3 className="font-semibold">{item.title}</h3><p>{item.detail}</p>
    </article>)}</div> : empty("No academic dates have been recorded."))}

    {(view === "learning_goals" || view === "school_targets") && !showActions && (targets.length ? <div className="grid gap-3 sm:grid-cols-2">{targets.map((item) => <article key={item.id} className="rounded border bg-white p-4">
      <div className="flex justify-between gap-3"><h3 className="font-semibold">{item.title}</h3><span>{item.status}</span></div>
      <p>Owner: {item.ownerName || "—"}</p><p>Baseline: {item.baselineValue} · Target: {item.targetValue}</p>
      <p>{item.status === "Not Started" || (item.progressPercentage === 0 && item.currentValue === "0%") ? "Progress not recorded" : `Current: ${item.currentValue} · Progress: ${item.progressPercentage}%`}</p><p>Deadline: {date(item.deadline)}</p>
      <button type="button" onClick={() => { setSelectedTargetId(item.id); setForm({}); setFormKind("progress"); }}>Record Progress</button>
    </article>)}</div> : empty("No targets have been recorded."))}

    {(view === "action_plans" || view === "school_targets" && showActions) && (actions.length ? <div className="grid gap-3">{actions.map((item) => <article key={item.id} className="rounded border bg-white p-4">
      <div className="flex justify-between gap-3"><h3 className="font-semibold">{item.issue}</h3><span>{item.status}</span></div>
      <p>Owner: {item.ownerName}</p><p><b>Action:</b> {item.action}</p>
      {item.evidence && <p><b>Evidence:</b> {item.evidence}</p>}{item.rootCause && <p><b>Root cause:</b> {item.rootCause}</p>}
      {item.expectedResult && <p><b>Expected result:</b> {item.expectedResult}</p>}
      <p>Review: {date(item.reviewDate)} · Deadline: {date(item.deadline)}</p>
    </article>)}</div> : empty("No academic action plans have been recorded."))}

    {formKind && <div className="modal-backdrop"><form role="dialog" aria-modal="true" onSubmit={submit} className="action-modal planning-form">
      <button type="button" className="modal-close" aria-label="Close" onClick={() => setFormKind(null)}>×</button>
      <h2 className="text-lg font-semibold">{{ plan: "New Academic Plan", target: "Create Target", action: "Create Action Plan", meeting: "Record Review Meeting", progress: "Record Target Progress" }[formKind]}</h2>
      <div className="modal-form">
        {formKind === "plan" && <>{input("title", "Plan title")}{input("board", "Board")}{area("academicObjectives", "Academic objectives")}{area("teachingPedagogyStrategy", "Teaching strategy")}{area("assessmentStrategy", "Assessment strategy")}</>}
        {formKind === "target" && <>{input("title", "Target title")}{input("ownerName", "Owner")}{input("baselineValue", "Baseline")}{input("targetValue", "Target")}{input("deadline", "Deadline", true, "date")}</>}
        {formKind === "action" && <>{input("issue", "Issue")}{input("ownerName", "Owner")}{area("evidence", "Evidence")}{area("rootCause", "Root cause")}{area("action", "Action", true)}{area("expectedResult", "Expected result")}{input("reviewDate", "Review date", true, "date")}{input("deadline", "Deadline", true, "date")}</>}
        {formKind === "meeting" && <>{input("meetingType", "Meeting title")}{input("meetingDate", "Date", true, "date")}{input("participants", "Participants (comma separated)", false)}{area("agenda", "Agenda", true)}{area("findings", "Findings")}{area("decisions", "Decisions")}</>}
        {formKind === "progress" && <>{input("currentValue", "Measured current value")}{input("progressPercentage", "Progress (0–100%)", true, "number")}</>}
        <div className="modal-actions"><button type="button" onClick={() => setFormKind(null)}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>
      </div>
    </form></div>}
    <style>{`.planning-form { max-width: 520px } .planning-form .modal-form { max-height: 70vh; overflow: auto } .planning-form label { display: grid; gap: 4px; margin: 8px 0 } .planning-form input, .planning-form textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px } .planning-form textarea { min-height: 64px } .planning-pane button:not(.modal-close) { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; background: white; cursor: pointer }`}</style>
  </section>;
}
