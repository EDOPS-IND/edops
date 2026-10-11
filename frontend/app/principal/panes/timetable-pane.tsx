"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import {
  assignPrincipalSubstitute, createPrincipalTimetableEntry, deletePrincipalTimetableEntry,
  getPrincipalSubstituteSuggestions, getPrincipalTeachers, getPrincipalTimetable, updatePrincipalTimetableEntry,
} from "../../edops-api";

type Entry = { id: string; academic_year_id: string; section_id: string; subject_id: string; teacher_user_id: string; day_of_week: number; period_number: number; start_time: string; end_time: string; room_number: string; sectionName: string; programName: string; subjectName: string; teacherName: string };
type Substitute = { id: string; timetableEntryId: string; eventDate: string; dayOfWeek: number; periodNumber: number; sectionName: string; programName: string; subjectName: string; originalTeacher: string; substituteTeacher: string; absenceType: string | null; impactNote: string };
type Uncovered = { timetableEntryId: string; eventDate: string; periodNumber: number; sectionName: string; programName: string; subjectName: string; originalTeacher: string; absenceType: string };
type Option = { id: string; name: string; email?: string };
type Data = { entries: Entry[]; substitutions: Substitute[]; uncovered: Uncovered[] };
type People = { teachers: Option[]; sections: Option[]; subjects: Option[] };
type View = "academic" | "teacher" | "class" | "substitutions";
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const date = (value: string) => value?.slice(0, 10) || "—";

function ConflictMatrix({ entries }: { entries: Entry[] }) {
  // ponytail: pairwise scan is fine for one school's weekly grid; group by slot if it grows large.
  const clashes: string[] = [];
  const loads = new Map<string, { teacher: string; count: number }>();
  for (const entry of entries) {
    const load = loads.get(entry.teacher_user_id) ?? { teacher: entry.teacherName, count: 0 };
    load.count++;
    loads.set(entry.teacher_user_id, load);
    for (const other of entries) {
      if (other.id >= entry.id || other.academic_year_id !== entry.academic_year_id ||
        other.day_of_week !== entry.day_of_week ||
        (other.period_number !== entry.period_number && !(other.start_time < entry.end_time && other.end_time > entry.start_time))) continue;
      const subject = other.teacher_user_id === entry.teacher_user_id ? `Teacher ${entry.teacherName}`
        : other.section_id === entry.section_id ? `Class ${entry.programName} - ${entry.sectionName}`
        : entry.room_number && other.room_number === entry.room_number ? `Room ${entry.room_number}` : "";
      if (subject) clashes.push(`${subject}: ${days[entry.day_of_week - 1]}, period ${entry.period_number}`);
    }
  }
  return <section className="rounded border border-slate-200 bg-white p-4">
    <h3 className="font-semibold">Timetable conflict and load matrix</h3>
    {!entries.length ? <p className="text-slate-500">No timetable entries to analyse.</p> : <>
      <p>{clashes.length} scheduling conflicts across {entries.length} saved periods</p>
      {clashes.length > 0 && <ul className="list-disc pl-5 text-red-700">{clashes.map((item, index) => <li key={index}>{item}</li>)}</ul>}
      <div className="mt-3 flex flex-wrap gap-2">{[...loads.entries()].map(([id, load]) =>
        <span key={id} className="rounded bg-slate-100 px-2 py-1">{load.teacher}: {load.count} periods/week</span>)}</div>
    </>}
  </section>;
}

export function TimetablePane({ organizationId, initialTab = "academic" }: { organizationId: string; initialTab?: string }) {
  const view = initialTab as View;
  const [data, setData] = useState<Data | null>(null);
  const [people, setPeople] = useState<People | null>(null);
  const [error, setError] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [editing, setEditing] = useState<Entry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [subFormOpen, setSubFormOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Option[]>([]);
  const [searchedSuggestions, setSearchedSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = () => getPrincipalTimetable(organizationId).then(setData);
  useEffect(() => {
    let active = true;
    Promise.all([getPrincipalTimetable(organizationId), getPrincipalTeachers(organizationId)])
      .then(([timetable, roster]) => { if (active) { setData(timetable); setPeople(roster); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load timetable"); });
    return () => { active = false; };
  }, [organizationId]);

  const entries = data?.entries ?? [];
  const filtered = entries.filter((item) => view === "teacher" ? !teacherId || item.teacher_user_id === teacherId
    : view === "class" ? !sectionId || item.section_id === sectionId : true);
  const heading = { academic: "Academic Timetable", teacher: "Teacher Timetable", class: "Class Timetable", substitutions: "Substitution Overview" }[view];
  const field = (name: string, value: string) => setForm((previous) => ({ ...previous, [name]: value }));
  const openEntry = (entry: Entry | null) => {
    setEditing(entry); setError("");
    setForm(entry ? { sectionId: entry.section_id, subjectId: entry.subject_id, teacherUserId: entry.teacher_user_id,
      dayOfWeek: String(entry.day_of_week), periodNumber: String(entry.period_number), startTime: entry.start_time,
      endTime: entry.end_time, roomNumber: entry.room_number } : {});
    setFormOpen(true);
  };
  const openSubstitute = (timetableEntryId = "", eventDate = "", impactNote = "") => {
    setError(""); setForm({ timetableEntryId, eventDate, impactNote }); setSuggestions([]); setSearchedSuggestions(false); setSubFormOpen(true);
  };
  async function saveEntry(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const body = { ...form, dayOfWeek: Number(form.dayOfWeek), periodNumber: Number(form.periodNumber) };
      if (editing) await updatePrincipalTimetableEntry(organizationId, editing.id, body);
      else await createPrincipalTimetableEntry(organizationId, body);
      await reload(); setFormOpen(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save timetable entry"); }
    finally { setSaving(false); }
  }
  async function removeEntry(id: string) {
    if (!window.confirm("Delete this timetable period?")) return;
    setError("");
    try { await deletePrincipalTimetableEntry(organizationId, id); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete timetable entry"); }
  }
  async function findSuggestions() {
    setError(""); setSuggestions([]); setSearchedSuggestions(false);
    try { setSuggestions(await getPrincipalSubstituteSuggestions(organizationId, form.timetableEntryId, form.eventDate)); setSearchedSuggestions(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not find available teachers"); }
  }
  async function saveSubstitute(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { await assignPrincipalSubstitute(organizationId, form); await reload(); setSubFormOpen(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not assign substitute"); }
    finally { setSaving(false); }
  }
  const select = (name: string, label: string, options: Option[]) =>
    <label>{label}<select required value={form[name] ?? ""} onChange={(event) => field(name, event.target.value)}>
      <option value="">Select {label.toLowerCase()}</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name || item.email}</option>)}
    </select></label>;

  return <section className="principal-timetable space-y-4 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <button type="button" onClick={() => view === "substitutions" ? openSubstitute() : openEntry(null)}>
        <Plus size={14} /> {view === "substitutions" ? "Assign substitute" : "Add period"}
      </button>
    </div>
    {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
    {view === "teacher" && <label>Teacher <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
      <option value="">All teachers</option>{(people?.teachers ?? []).map((item) => <option key={item.id} value={item.id}>{item.name || item.email}</option>)}
    </select></label>}
    {view === "class" && <label>Class <select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
      <option value="">All classes</option>{(people?.sections ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select></label>}
    {view === "academic" && <ConflictMatrix entries={entries} />}
    {view !== "substitutions" && (filtered.length ? <div className="overflow-x-auto rounded border bg-white"><table className="w-full text-left">
      <thead><tr><th>Day</th><th>Period</th><th>Time</th><th>Class</th><th>Subject</th><th>Teacher</th><th>Room</th><th>Actions</th></tr></thead>
      <tbody>{filtered.map((entry) => <tr key={entry.id}>
        <td>{days[entry.day_of_week - 1]}</td><td>{entry.period_number}</td><td>{entry.start_time}–{entry.end_time}</td>
        <td>{entry.programName} - {entry.sectionName}</td><td>{entry.subjectName}</td><td>{entry.teacherName}</td><td>{entry.room_number || "—"}</td>
        <td><div className="flex gap-2"><button type="button" onClick={() => openEntry(entry)}>Edit</button><button type="button" onClick={() => removeEntry(entry.id)}>Delete</button></div></td>
      </tr>)}</tbody></table></div> : <p className="text-slate-500">{data ? "No timetable periods recorded." : error ? "Timetable unavailable." : "Loading timetable…"}</p>)}
    {view === "substitutions" && <section className="space-y-2"><h3 className="font-semibold">Uncovered teacher absences</h3>
      {(data?.uncovered ?? []).length ? <div className="overflow-x-auto rounded border bg-white"><table className="w-full text-left">
        <thead><tr><th>Date</th><th>Class / subject</th><th>Period</th><th>Absent teacher</th><th>Leave type</th><th></th></tr></thead>
        <tbody>{data!.uncovered.map((item) => <tr key={item.timetableEntryId + date(item.eventDate)}>
          <td>{date(item.eventDate)}</td><td>{item.programName} - {item.sectionName} · {item.subjectName}</td>
          <td>{item.periodNumber}</td><td>{item.originalTeacher}</td><td>{item.absenceType}</td>
          <td><button type="button" onClick={() => openSubstitute(item.timetableEntryId, date(item.eventDate))}>Assign substitute</button></td>
        </tr>)}</tbody></table></div> : <p className="text-slate-500">{data ? "No uncovered approved teacher absences in the current window." : error ? "Absences unavailable." : "Loading absences…"}</p>}
    </section>}
    {view === "substitutions" && <section className="space-y-2"><h3 className="font-semibold">Recorded substitutions</h3>{(data?.substitutions ?? []).length ? <div className="overflow-x-auto rounded border bg-white"><table className="w-full text-left">
      <thead><tr><th>Date</th><th>Class / subject</th><th>Period</th><th>Original teacher</th><th>Absence</th><th>Substitute</th><th>Impact note</th><th></th></tr></thead>
      <tbody>{data!.substitutions.map((item) => <tr key={item.id}><td>{date(item.eventDate)}</td>
        <td>{item.programName} - {item.sectionName} · {item.subjectName}</td><td>{item.periodNumber}</td>
        <td>{item.originalTeacher}</td><td>{item.absenceType || "Not recorded"}</td><td>{item.substituteTeacher}</td>
        <td>{item.impactNote || "—"}</td><td><button type="button" onClick={() => openSubstitute(item.timetableEntryId, date(item.eventDate), item.impactNote)}>Change</button></td></tr>)}</tbody></table></div>
      : <p className="text-slate-500">{data ? "No substitutions recorded." : error ? "Substitutions unavailable." : "Loading substitutions…"}</p>}</section>}

    {formOpen && <div className="modal-backdrop"><form role="dialog" aria-modal="true" onSubmit={saveEntry} className="action-modal timetable-form">
      <button type="button" className="modal-close" aria-label="Close" onClick={() => setFormOpen(false)}>×</button>
      <h2 className="font-semibold">{editing ? "Edit period" : "Add period"}</h2><div className="modal-form">
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {select("sectionId", "Class", people?.sections ?? [])}{select("subjectId", "Subject", people?.subjects ?? [])}{select("teacherUserId", "Teacher", people?.teachers ?? [])}
        <label>Day<select required value={form.dayOfWeek ?? ""} onChange={(event) => field("dayOfWeek", event.target.value)}><option value="">Select day</option>
          {days.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label>
        <label>Period<input type="number" min={1} max={8} required value={form.periodNumber ?? ""} onChange={(event) => field("periodNumber", event.target.value)} /></label>
        <label>Start time<input type="time" required value={form.startTime ?? ""} onChange={(event) => field("startTime", event.target.value)} /></label>
        <label>End time<input type="time" required value={form.endTime ?? ""} onChange={(event) => field("endTime", event.target.value)} /></label>
        <label>Room<input value={form.roomNumber ?? ""} onChange={(event) => field("roomNumber", event.target.value)} /></label>
        <div className="modal-actions"><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>
      </div></form></div>}

    {subFormOpen && <div className="modal-backdrop"><form role="dialog" aria-modal="true" onSubmit={saveSubstitute} className="action-modal timetable-form">
      <button type="button" className="modal-close" aria-label="Close" onClick={() => setSubFormOpen(false)}>×</button>
      <h2 className="font-semibold">Assign substitute</h2><div className="modal-form">
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <label>Date<input type="date" required value={form.eventDate ?? ""} onChange={(event) => { setForm((previous) => ({ ...previous, eventDate: event.target.value, timetableEntryId: "", substituteTeacherUserId: "" })); setSuggestions([]); setSearchedSuggestions(false); }} /></label>
        <label>Timetable period<select required value={form.timetableEntryId ?? ""} onChange={(event) => { setForm((previous) => ({ ...previous, timetableEntryId: event.target.value, substituteTeacherUserId: "" })); setSuggestions([]); setSearchedSuggestions(false); }}>
          <option value="">Select period</option>{entries.filter((entry) => !form.eventDate || entry.day_of_week === (new Date(`${form.eventDate}T12:00:00Z`).getUTCDay() || 7))
            .map((entry) => <option key={entry.id} value={entry.id}>{days[entry.day_of_week - 1]} · Period {entry.period_number} · {entry.programName} - {entry.sectionName} · {entry.teacherName}</option>)}
        </select></label>
        <button type="button" disabled={!form.eventDate || !form.timetableEntryId} onClick={findSuggestions}>Find available teachers</button>
        {form.eventDate && form.timetableEntryId && suggestions.length === 0 && !error && <p className="text-slate-500">{searchedSuggestions ? "No teachers are available for this period." : "Find available teachers to load options."}</p>}
        {select("substituteTeacherUserId", "Substitute teacher", suggestions)}
        <label>Academic impact note<textarea value={form.impactNote ?? ""} onChange={(event) => field("impactNote", event.target.value)} /></label>
        <div className="modal-actions"><button type="button" onClick={() => setSubFormOpen(false)}>Cancel</button><button disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>
      </div></form></div>}
    <style>{`.principal-timetable table th, .principal-timetable table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0 } .principal-timetable button:not(.modal-close) { display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: white } .principal-timetable select { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px } .timetable-form { max-width: 520px } .timetable-form .modal-form { max-height: 70vh; overflow: auto } .timetable-form label { display: grid; gap: 4px; margin: 8px 0 } .timetable-form input, .timetable-form select, .timetable-form textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px }`}</style>
  </section>;
}
