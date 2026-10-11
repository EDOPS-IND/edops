"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createPrincipalExamPlan, getPrincipalExaminations, importPrincipalTeacherMarks,
  publishPrincipalExamResults, reviewPrincipalExamResult, updatePrincipalExamPlan,
} from "../../edops-api";

type View = "planning" | "schedule" | "marks" | "report_cards";
type Option = { id: string; name: string };
type Plan = { id: string; sectionId: string; subjectId: string; examName: string; term: string; examDate: string; startTime: string; endTime: string; maxMarks: number; status: string; className: string; sectionName: string; subjectName: string };
type Evaluation = { id: string; title: string; className: string; sectionName: string; subjectName: string; maxMarks: number; enteredStudents: number };
type Result = { id: string; examName: string; term: string; className: string; sectionName: string; subjectName: string; studentName: string; marksObtained: number; maxMarks: number; percentage: number; grade: string | null; status: string; isLocked: boolean; publishedAt: string | null };
type Card = { studentUserId: string; studentName: string; examName: string; term: string; className: string; sectionName: string; subjects: { subjectName: string; marksObtained: number; maxMarks: number; percentage: number; grade: string | null }[] };
type Data = { plans: Plan[]; evaluations: Evaluation[]; results: Result[]; reportCards: Card[]; sections: Option[]; subjects: Option[]; workflow: { entered: number; verified: number; approved: number; published: number } };

export function ExaminationsPane({ organizationId, initialTab = "schedule" }: { organizationId: string; initialTab?: View }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [markEdits, setMarkEdits] = useState<Record<string, string>>({});
  const [gradeEdits, setGradeEdits] = useState<Record<string, string>>({});
  const load = () => getPrincipalExaminations(organizationId).then(setData);
  useEffect(() => {
    let active = true;
    getPrincipalExaminations(organizationId)
      .then((result) => { if (active) setData(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load examinations"); });
    return () => { active = false; };
  }, [organizationId]);

  const change = (key: string, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  const openPlan = (plan: Plan | null) => {
    setEditing(plan); setError("");
    setForm(plan ? { sectionId: plan.sectionId, subjectId: plan.subjectId, examName: plan.examName,
      term: plan.term, examDate: plan.examDate, startTime: plan.startTime, endTime: plan.endTime,
      maxMarks: String(plan.maxMarks), status: plan.status } : { status: "draft" });
  };
  async function savePlan(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const body = { ...form, maxMarks: Number(form.maxMarks) };
      if (editing) await updatePrincipalExamPlan(organizationId, editing.id, body);
      else await createPrincipalExamPlan(organizationId, body);
      await load(); setEditing(null); setForm({});
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save exam plan"); }
    finally { setBusy(false); }
  }
  async function act(run: () => Promise<unknown>) {
    setBusy(true); setError("");
    try { await run(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Exam action failed"); }
    finally { setBusy(false); }
  }
  const cell = "border-t border-slate-100 p-3 text-left align-top";
  const head = "p-3 text-left";
  const button = "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50";
  const select = (key: string, label: string, options: Option[]) =>
    <label className="grid gap-1">{label}<select className="rounded border p-2" required value={form[key] ?? ""} onChange={(event) => change(key, event.target.value)}>
      <option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select></label>;
  const results = data?.results ?? [];
  const groups = new Map<string, { examName: string; term: string; className: string; sectionName: string; rows: Result[] }>();
  for (const result of results) {
    const key = JSON.stringify([result.term, result.examName, result.className, result.sectionName]);
    const group = groups.get(key) ?? { term: result.term, examName: result.examName, className: result.className, sectionName: result.sectionName, rows: [] };
    group.rows.push(result); groups.set(key, group);
  }

  return <section className="space-y-5 text-sm">
    <h2 className="text-xl font-semibold">{{ planning: "Exam Planning", schedule: "Exam Schedule & Publishing", marks: "Marks", report_cards: "Report Cards" }[initialTab]}</h2>
    {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
    {!data && !error && <p>Loading examinations…</p>}

    {data && initialTab === "planning" && <>
      <p className="text-slate-600">Create or edit an exam date, class, subject, time, and maximum marks. A scheduled plan appears in the exam schedule.</p>
      <button type="button" className={button} onClick={() => openPlan(null)}>Plan exam</button>
      <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full"><thead><tr>
        {["Exam", "Class / subject", "Date / time", "Maximum marks", "Status", "Action"].map((label) => <th key={label} className={head}>{label}</th>)}
      </tr></thead><tbody>{data.plans.map((plan) => <tr key={plan.id}>
        <td className={cell}>{plan.examName}<div className="text-xs text-slate-500">{plan.term}</div></td>
        <td className={cell}>{plan.className} - {plan.sectionName} · {plan.subjectName}</td>
        <td className={cell}>{plan.examDate} · {plan.startTime}–{plan.endTime}</td><td className={cell}>{plan.maxMarks}</td>
        <td className={cell}>{plan.status}</td><td className={cell}><button type="button" className={button} onClick={() => openPlan(plan)}>Edit</button></td>
      </tr>)}</tbody></table>{!data.plans.length && <p className="p-4 text-slate-500">No exam plans saved.</p>}</div>
      {(editing || form.status) && <form onSubmit={savePlan} className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-semibold">{editing ? "Edit exam plan" : "New exam plan"}</h3>
        {select("sectionId", "Class", data.sections)}{select("subjectId", "Subject", data.subjects)}
        <label className="grid gap-1">Exam name<input className="rounded border p-2" required maxLength={150} value={form.examName ?? ""} onChange={(event) => change("examName", event.target.value)} /></label>
        <label className="grid gap-1">Term<input className="rounded border p-2" required maxLength={60} value={form.term ?? ""} onChange={(event) => change("term", event.target.value)} /></label>
        <label className="grid gap-1">Date<input className="rounded border p-2" type="date" required value={form.examDate ?? ""} onChange={(event) => change("examDate", event.target.value)} /></label>
        <label className="grid gap-1">Maximum marks<input className="rounded border p-2" type="number" min="0.01" step="0.01" required value={form.maxMarks ?? ""} onChange={(event) => change("maxMarks", event.target.value)} /></label>
        <label className="grid gap-1">Start<input className="rounded border p-2" type="time" required value={form.startTime ?? ""} onChange={(event) => change("startTime", event.target.value)} /></label>
        <label className="grid gap-1">End<input className="rounded border p-2" type="time" required value={form.endTime ?? ""} onChange={(event) => change("endTime", event.target.value)} /></label>
        <label className="grid gap-1">Status<select className="rounded border p-2" value={form.status ?? "draft"} onChange={(event) => change("status", event.target.value)}><option value="draft">Draft</option><option value="scheduled">Scheduled</option></select></label>
        <div className="flex items-end gap-2"><button className={button} disabled={busy}>Save</button><button type="button" className={button} onClick={() => { setEditing(null); setForm({}); }}>Cancel</button></div>
      </form>}
    </>}

    {data && initialTab === "schedule" && <>
      <p className="text-slate-600">Scheduled exams come from saved plans. Results move through Entered, Verified, Approved, then Published and locked. Publication applies to one exam and class only after every saved mark is approved.</p>
      <div className="grid gap-3 sm:grid-cols-4">{Object.entries(data.workflow).map(([step, count]) =>
        <div key={step} className="rounded-lg border bg-white p-4"><p className="capitalize text-slate-600">{step}</p><p className="text-2xl font-bold">{count}</p></div>)}</div>
      <div className="overflow-x-auto rounded-lg border bg-white"><h3 className="p-4 font-semibold">Scheduled exams</h3><table className="w-full"><thead><tr>
        {["Exam", "Class / subject", "Date", "Time", "Maximum marks"].map((label) => <th key={label} className={head}>{label}</th>)}
      </tr></thead><tbody>{data.plans.filter((plan) => plan.status === "scheduled").map((plan) => <tr key={plan.id}>
        <td className={cell}>{plan.examName}</td><td className={cell}>{plan.className} - {plan.sectionName} · {plan.subjectName}</td>
        <td className={cell}>{plan.examDate}</td><td className={cell}>{plan.startTime}–{plan.endTime}</td><td className={cell}>{plan.maxMarks}</td>
      </tr>)}</tbody></table>{!data.plans.some((plan) => plan.status === "scheduled") && <p className="p-4 text-slate-500">No exams scheduled.</p>}</div>
      <div className="space-y-2 rounded-lg border bg-white p-4"><h3 className="font-semibold">Publish approved results</h3>
        {[...groups.values()].map((group) => {
          const ready = group.rows.every((row) => row.status === "Approved" && !row.isLocked);
          const done = group.rows.every((row) => row.status === "Published" && row.isLocked);
          return <div key={JSON.stringify([group.term, group.examName, group.className, group.sectionName])} className="flex flex-wrap items-center justify-between gap-2 border-t py-2">
            <span>{group.examName} · {group.term} · {group.className} - {group.sectionName} · {group.rows.length} marks {done ? "· Published" : ready ? "· Ready" : "· Review marks first"}</span>
            {!done && <button type="button" className={button} disabled={busy || !ready} onClick={() => {
              if (window.confirm(`Publish and lock ${group.rows.length} approved results for ${group.examName}, ${group.className} - ${group.sectionName}?`))
                act(() => publishPrincipalExamResults(organizationId, { term: group.term, examName: group.examName, className: group.className, sectionName: group.sectionName }));
            }}>Publish & lock</button>}
          </div>;
        })}
        {!groups.size && <p className="text-slate-500">No saved result sets to publish.</p>}
      </div>
    </>}

    {data && initialTab === "marks" && <>
      <p className="text-slate-600">Import teacher-entered scores, correct marks and grades while editable, verify each row, then approve it for publication.</p>
      <div className="overflow-x-auto rounded-lg border bg-white"><h3 className="p-4 font-semibold">Teacher entries</h3><table className="w-full"><thead><tr>
        {["Evaluation", "Class / subject", "Entered students", "Maximum marks", "Action"].map((label) => <th key={label} className={head}>{label}</th>)}
      </tr></thead><tbody>{data.evaluations.map((evaluation) => <tr key={evaluation.id}>
        <td className={cell}>{evaluation.title}</td><td className={cell}>{evaluation.className} - {evaluation.sectionName} · {evaluation.subjectName}</td>
        <td className={cell}>{evaluation.enteredStudents}</td><td className={cell}>{evaluation.maxMarks}</td>
        <td className={cell}><button type="button" className={button} disabled={busy || !evaluation.enteredStudents}
          onClick={() => act(() => importPrincipalTeacherMarks(organizationId, evaluation.id))}>Import marks</button></td>
      </tr>)}</tbody></table>{!data.evaluations.length && <p className="p-4 text-slate-500">No teacher evaluations saved.</p>}</div>
      <div className="overflow-x-auto rounded-lg border bg-white"><h3 className="p-4 font-semibold">Principal marks ledger</h3><table className="w-full"><thead><tr>
        {["Student", "Exam / subject", "Marks", "Percentage", "Grade", "State", "Action"].map((label) => <th key={label} className={head}>{label}</th>)}
      </tr></thead><tbody>{results.map((result) => <tr key={result.id}>
        <td className={cell}>{result.studentName}<div className="text-xs text-slate-500">{result.className} - {result.sectionName}</div></td>
        <td className={cell}>{result.examName}<div className="text-xs text-slate-500">{result.subjectName}</div></td>
        <td className={cell}>{result.status === "Entered" || result.status === "Verified" ?
          <div className="flex items-center gap-1"><input aria-label={`Marks for ${result.studentName}`} className="w-20 rounded border p-1" type="number" min="0" max={result.maxMarks} step="0.01"
            value={markEdits[result.id] ?? String(result.marksObtained)} onChange={(event) => setMarkEdits((old) => ({ ...old, [result.id]: event.target.value }))} /> / {result.maxMarks}</div>
          : `${result.marksObtained} / ${result.maxMarks}`}</td>
        <td className={cell}>{result.percentage}%</td>
        <td className={cell}>{result.status === "Entered" || result.status === "Verified" ?
          <input aria-label={`Grade for ${result.studentName}`} className="w-20 rounded border p-1" maxLength={10}
            value={gradeEdits[result.id] ?? result.grade ?? ""} onChange={(event) => setGradeEdits((old) => ({ ...old, [result.id]: event.target.value }))} /> : result.grade || "—"}</td>
        <td className={cell}>{result.status}</td>
        <td className={cell}><div className="flex gap-1">{(result.status === "Entered" || result.status === "Verified") &&
          (markEdits[result.id] !== undefined || gradeEdits[result.id] !== undefined) &&
          <button type="button" className={button} disabled={busy || markEdits[result.id] === ""} onClick={() => act(async () => {
            await reviewPrincipalExamResult(organizationId, result.id, {
              ...(markEdits[result.id] === undefined ? {} : { marksObtained: Number(markEdits[result.id]) }),
              ...(gradeEdits[result.id] === undefined ? {} : { grade: gradeEdits[result.id] }),
            });
            setMarkEdits((old) => { const next = { ...old }; delete next[result.id]; return next; });
            setGradeEdits((old) => { const next = { ...old }; delete next[result.id]; return next; });
          })}>Save</button>}
          {result.status === "Entered" ? <button type="button" className={button} disabled={busy || markEdits[result.id] !== undefined || gradeEdits[result.id] !== undefined} onClick={() => act(() => reviewPrincipalExamResult(organizationId, result.id, { status: "Verified" }))}>Verify</button>
          : result.status === "Verified" ? <button type="button" className={button} disabled={busy || markEdits[result.id] !== undefined || gradeEdits[result.id] !== undefined} onClick={() => act(() => reviewPrincipalExamResult(organizationId, result.id, { status: "Approved" }))}>Approve</button>
          : result.isLocked ? "Locked" : "Ready to publish"}</div></td>
      </tr>)}</tbody></table>{!results.length && <p className="p-4 text-slate-500">No marks imported into the principal ledger.</p>}</div>
    </>}

    {data && initialTab === "report_cards" && <>
      <p className="text-slate-600">Report cards show published and locked subject results grouped by student and exam. Draft or approved marks remain private.</p>
      {data.reportCards.map((card) => <article key={JSON.stringify([card.studentUserId, card.examName, card.term, card.className, card.sectionName])} className="rounded-lg border bg-white p-4">
        <h3 className="font-semibold">{card.studentName} · {card.examName}</h3><p className="text-xs text-slate-600">{card.className} - {card.sectionName} · {card.term}</p>
        <div className="mt-3 overflow-x-auto"><table className="w-full"><thead><tr><th className={head}>Subject</th><th className={head}>Marks</th><th className={head}>Percentage</th><th className={head}>Grade</th></tr></thead>
          <tbody>{card.subjects.map((subject) => <tr key={subject.subjectName}><td className={cell}>{subject.subjectName}</td>
            <td className={cell}>{subject.marksObtained} / {subject.maxMarks}</td><td className={cell}>{subject.percentage}%</td><td className={cell}>{subject.grade || "—"}</td></tr>)}</tbody></table></div>
      </article>)}
      {!data.reportCards.length && <p className="rounded-lg border bg-white p-4 text-slate-500">No published report cards yet.</p>}
    </>}
  </section>;
}
