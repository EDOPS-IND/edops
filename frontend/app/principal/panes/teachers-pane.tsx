"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Eye, Plus } from "lucide-react";
import {
  assignPrincipalCoordinator, assignPrincipalDepartmentHead, assignPrincipalDevelopment,
  assignPrincipalTeacher, completePrincipalDevelopment, createPrincipalDepartment, getPrincipalTeachers, recordPrincipalObservation,
} from "../../edops-api";

type View = "hods" | "coordinators" | "assignments" | "workload" | "development";
type Action = "observation" | "development" | "department" | "head" | "coordinator" | "assignment";
type Teacher = { id: string; name: string; email: string; department: string | null; classes: string[]; weeklyPeriods: number; lessonPlanCompliance: number | null; observationsCount: number };
type Assignment = { id: string; teacherUserId: string; teacherName: string; className: string; subjectName: string };
type Department = { id: string; name: string; code: string; headTeacherId: string | null; headName: string | null };
type Coordinator = { id: string; teacherUserId: string; teacherName: string; departmentName: string; assignedAt: string };
type Development = { id: string; teacherUserId: string; teacherName: string; title: string; provider: string; trainingHours: number; status: string };
type Option = { id: string; name: string };
type PeopleData = { teachers: Teacher[]; assignments: Assignment[]; departments: Department[]; coordinators: Coordinator[]; developments: Development[]; sections: Option[]; subjects: Option[] };

export function TeachersPane({ organizationId, view = "workload", onOpenProfile }: {
  organizationId: string;
  view?: View;
  onOpenProfile: (teacherId: string) => void;
}) {
  const [data, setData] = useState<PeopleData | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const reload = () => getPrincipalTeachers(organizationId).then(setData);
  useEffect(() => {
    let active = true;
    getPrincipalTeachers(organizationId).then((result) => { if (active) setData(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load people data"); });
    return () => { active = false; };
  }, [organizationId]);

  const teachers = data?.teachers ?? [];
  const assignments = data?.assignments ?? [];
  const departments = data?.departments ?? [];
  const coordinators = data?.coordinators ?? [];
  const developments = data?.developments ?? [];
  const sections = data?.sections ?? [];
  const subjects = data?.subjects ?? [];
  const filtered = teachers.filter((teacher) => `${teacher.name} ${teacher.email} ${teacher.department ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const ownAssignments = assignments.filter((assignment) => assignment.teacherUserId === form.teacherUserId);
  const field = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const open = (next: Action) => { setError(""); setForm({}); setAction(next); };
  const teacherSelect = <label>Teacher<select required value={form.teacherUserId ?? ""} onChange={(event) => field("teacherUserId", event.target.value)}><option value="">Select teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name || teacher.email}</option>)}</select></label>;
  const departmentSelect = <label>Department<select required value={form.departmentId ?? ""} onChange={(event) => field("departmentId", event.target.value)}><option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!action) return;
    setSaving(true); setError("");
    try {
      if (action === "observation") {
        const assignment = assignments.find((item) => item.id === form.assignmentId && item.teacherUserId === form.teacherUserId);
        if (!assignment) throw new Error("Choose an assigned class and subject");
        await recordPrincipalObservation(organizationId, {
          teacherUserId: form.teacherUserId, className: assignment.className, subjectName: assignment.subjectName,
          lessonTopic: form.lessonTopic, overallRating: form.overallRating,
          planningScore: Number(form.planningScore), pedagogyScore: Number(form.pedagogyScore),
          engagementScore: Number(form.engagementScore), differentiationScore: Number(form.differentiationScore),
          assessmentScore: Number(form.assessmentScore), strengths: form.strengths ?? "",
          areasForImprovement: form.areasForImprovement ?? "", actionItems: form.actionItems ?? "",
        });
      } else if (action === "development") {
        await assignPrincipalDevelopment(organizationId, { teacherUserId: form.teacherUserId, title: form.title,
          category: form.category, provider: form.provider, trainingHours: Number(form.trainingHours), notes: form.notes ?? "" });
      } else if (action === "department") {
        await createPrincipalDepartment(organizationId, { name: form.name, code: form.code });
      } else if (action === "head") {
        await assignPrincipalDepartmentHead(organizationId, { teacherUserId: form.teacherUserId, departmentId: form.departmentId });
      } else if (action === "coordinator") {
        await assignPrincipalCoordinator(organizationId, { teacherUserId: form.teacherUserId, departmentId: form.departmentId });
      } else {
        await assignPrincipalTeacher(organizationId, { teacherUserId: form.teacherUserId, sectionId: form.sectionId, subjectId: form.subjectId });
      }
      await reload();
      setAction(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save changes");
    } finally { setSaving(false); }
  }

  async function markCompleted(id: string) {
    setError("");
    try { await completePrincipalDevelopment(organizationId, id); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not complete training"); }
  }

  const button = (label: string, next: Action) => <button type="button" onClick={() => open(next)}><Plus size={14} /> {label}</button>;
  const empty = (label: string) => <p className="text-sm text-slate-500">{data ? label : error ? "Data unavailable" : "Loading…"}</p>;
  return <section className="people-pane space-y-5 text-sm">
    {error && <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
    {view === "workload" && <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Teacher Workload</h2><p className="text-slate-500">{teachers.length} active teachers · {assignments.length} class assignments</p></div>
        <div className="flex gap-2">{button("Classroom Observation", "observation")}{button("Assign Training", "development")}</div>
      </div>
      <input aria-label="Search teachers" placeholder="Search teachers" value={search} onChange={(event) => setSearch(event.target.value)} className="rounded border border-slate-300 p-2" />
      {filtered.length ? <div className="overflow-x-auto rounded border border-slate-200 bg-white"><table className="w-full text-left"><thead><tr className="bg-slate-50"><th>Teacher</th><th>Department</th><th>Classes</th><th>Weekly periods</th><th>Lesson plans</th><th>Observations</th><th></th></tr></thead><tbody>{filtered.map((teacher) => <tr key={teacher.id}><td><b>{teacher.name || teacher.email}</b><br /><small>{teacher.email}</small></td><td>{teacher.department || "—"}</td><td>{teacher.classes.join(", ") || "—"}</td><td>{teacher.weeklyPeriods}</td><td>{teacher.lessonPlanCompliance == null ? "—" : `${teacher.lessonPlanCompliance}%`}</td><td>{teacher.observationsCount}</td><td><button type="button" onClick={() => onOpenProfile(teacher.id)}><Eye size={14} /> View Dossier</button></td></tr>)}</tbody></table></div> : empty("No active teachers found.")}
    </>}
    {view === "hods" && <>
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Department Heads</h2><div className="flex gap-2">{button("Add Department", "department")}{departments.length > 0 && button("Assign Head", "head")}</div></div>
      {departments.length ? <div className="rounded border border-slate-200 bg-white"><table className="w-full text-left"><thead><tr><th>Department</th><th>Code</th><th>Head</th></tr></thead><tbody>{departments.map((department) => <tr key={department.id}><td>{department.name}</td><td>{department.code}</td><td>{department.headTeacherId ? <button type="button" onClick={() => onOpenProfile(department.headTeacherId!)}>{department.headName}</button> : "Unassigned"}</td></tr>)}</tbody></table></div> : empty("No departments have been created.")}
    </>}
    {view === "coordinators" && <>
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Coordinators</h2>{departments.length > 0 && button("Assign Coordinator", "coordinator")}</div>
      {coordinators.length ? <div className="rounded border border-slate-200 bg-white"><table className="w-full text-left"><thead><tr><th>Teacher</th><th>Department</th><th>Assigned</th></tr></thead><tbody>{coordinators.map((item) => <tr key={item.id}><td><button type="button" onClick={() => onOpenProfile(item.teacherUserId)}>{item.teacherName}</button></td><td>{item.departmentName}</td><td>{new Date(item.assignedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : empty("No coordinators assigned. Create a department first if needed.")}
    </>}
    {view === "assignments" && <>
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Teacher Assignments</h2>{button("Assign Teacher", "assignment")}</div>
      {assignments.length ? <div className="rounded border border-slate-200 bg-white"><table className="w-full text-left"><thead><tr><th>Class</th><th>Subject</th><th>Teacher</th></tr></thead><tbody>{assignments.map((item) => <tr key={item.id}><td>{item.className}</td><td>{item.subjectName}</td><td><button type="button" onClick={() => onOpenProfile(item.teacherUserId)}>{item.teacherName}</button></td></tr>)}</tbody></table></div> : empty("No teachers are assigned to a class and subject.")}
    </>}
    {view === "development" && <>
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Teacher Development</h2>{button("Assign Training", "development")}</div>
      {developments.length ? <div className="rounded border border-slate-200 bg-white"><table className="w-full text-left"><thead><tr><th>Teacher</th><th>Training</th><th>Provider</th><th>Hours</th><th>Status</th><th></th></tr></thead><tbody>{developments.map((item) => <tr key={item.id}><td><button type="button" onClick={() => onOpenProfile(item.teacherUserId)}>{item.teacherName}</button></td><td>{item.title}</td><td>{item.provider || "—"}</td><td>{item.trainingHours}</td><td>{item.status}</td><td>{item.status !== "Completed" && <button type="button" onClick={() => markCompleted(item.id)}>Mark Completed</button>}</td></tr>)}</tbody></table></div> : empty("No professional development assigned.")}
    </>}
    {action && <div className="modal-backdrop"><form onSubmit={submit} role="dialog" aria-modal="true" className="action-modal people-form" style={{ maxWidth: 520 }}><button type="button" className="modal-close" aria-label="Close" onClick={() => setAction(null)}>×</button><h2 className="text-lg font-semibold">{{ observation: "Record Classroom Observation", development: "Assign Teacher Training", department: "Add Department", head: "Assign Department Head", coordinator: "Assign Coordinator", assignment: "Assign Teacher" }[action]}</h2>
      {error && <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      <div className="modal-form">
        {action !== "department" && teacherSelect}
        {(action === "head" || action === "coordinator") && departmentSelect}
        {action === "department" && <><label>Department name<input required maxLength={100} value={form.name ?? ""} onChange={(event) => field("name", event.target.value)} /></label><label>Code<input required maxLength={30} value={form.code ?? ""} onChange={(event) => field("code", event.target.value)} /></label></>}
        {action === "assignment" && <><label>Class<select required value={form.sectionId ?? ""} onChange={(event) => field("sectionId", event.target.value)}><option value="">Select class</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Subject<select required value={form.subjectId ?? ""} onChange={(event) => field("subjectId", event.target.value)}><option value="">Select subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></>}
        {action === "observation" && <><label>Assigned class and subject<select required value={form.assignmentId ?? ""} onChange={(event) => field("assignmentId", event.target.value)}><option value="">Select assignment</option>{ownAssignments.map((item) => <option key={item.id} value={item.id}>{item.className} · {item.subjectName}</option>)}</select></label>{form.teacherUserId && ownAssignments.length === 0 && <p>Assign this teacher to a class and subject first.</p>}<label>Lesson topic<input required maxLength={200} value={form.lessonTopic ?? ""} onChange={(event) => field("lessonTopic", event.target.value)} /></label><label>Overall rating<select required value={form.overallRating ?? ""} onChange={(event) => field("overallRating", event.target.value)}><option value="">Select rating</option>{["Needs Support", "Satisfactory", "Good", "Exemplary"].map((rating) => <option key={rating}>{rating}</option>)}</select></label>{["planning", "pedagogy", "engagement", "differentiation", "assessment"].map((name) => <label key={name}>{name[0].toUpperCase() + name.slice(1)} score (1–5)<input type="number" required min={1} max={5} value={form[`${name}Score`] ?? ""} onChange={(event) => field(`${name}Score`, event.target.value)} /></label>)}<label>Strengths<textarea value={form.strengths ?? ""} onChange={(event) => field("strengths", event.target.value)} /></label><label>Areas for improvement<textarea value={form.areasForImprovement ?? ""} onChange={(event) => field("areasForImprovement", event.target.value)} /></label><label>Action items<textarea value={form.actionItems ?? ""} onChange={(event) => field("actionItems", event.target.value)} /></label></>}
        {action === "development" && <><label>Training title<input required maxLength={200} value={form.title ?? ""} onChange={(event) => field("title", event.target.value)} /></label><label>Category<input maxLength={80} value={form.category ?? ""} onChange={(event) => field("category", event.target.value)} /></label><label>Provider<input maxLength={150} value={form.provider ?? ""} onChange={(event) => field("provider", event.target.value)} /></label><label>Hours<input type="number" required min={1} max={100} value={form.trainingHours ?? ""} onChange={(event) => field("trainingHours", event.target.value)} /></label><label>Notes<textarea value={form.notes ?? ""} onChange={(event) => field("notes", event.target.value)} /></label></>}
        <div className="modal-actions"><button type="button" onClick={() => setAction(null)}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>
      </div>
    </form></div>}
    <style>{`.people-form .modal-form { max-height: 70vh; overflow: auto } .people-form label { display: grid; gap: 4px; margin: 8px 0 } .people-form input, .people-form select, .people-form textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px } .people-form textarea { min-height: 64px } .people-pane table th, .people-pane table td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; vertical-align: top } .people-pane button:not(.modal-close) { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; background: white; cursor: pointer }`}</style>
  </section>;
}
