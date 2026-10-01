"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, createResource, ListResult, updateResource } from "./edops-api";
import { Bell, CalendarCheck2, CirclePlay, ClipboardCheck, FileText, Inbox, Plus, Trophy, Video, X } from "lucide-react";

type Role = "school_admin" | "teacher" | "student";
type ClassRoom = { sectionId: string; sectionName: string; academicYearId: string; subjectId: string; subjectName: string; teacherUserId: string; programId?: string; programName?: string };
type Assignment = { id: string; title: string; description: string; dueAt: string; maxScore: number; status: "draft" | "published"; sectionId: string; subjectId: string };
type Submission = { id: string; studentId: string; content: string | null; submittedAt: string | null; score: number | null; feedback: string | null; status: "pending" | "submitted" | "late" | "graded" };
type AttendanceSession = { id: string; sectionId: string; subjectId: string | null; date: string; period: number; status: "draft" | "finalized" };
type AttendanceRecord = { id: string; studentId: string; status: "present" | "absent" | "late" | "excused" | null };
type RosterStudent = { studentId: string; rollNumber: string; email: string };
type Notification = { id: string; eventType: string; resourceId: string; sectionId: string; subjectId: string | null; occurredAt: string; readAt: string | null };
type Inbox = { items: Notification[]; total: number; unreadCount: number };
type Recording = { id: string; title: string; recordedAt: string; durationSeconds: number; contentType: string; sizeBytes: number; status: "uploading" | "ready" | "published" | "archived" };
type ArenaQuestion = { id: string; programId?: string | null; chapter: string; topic: string; difficulty: string; questionType: "single_choice" | "multiple_choice" | "subjective"; content: { prompt: string; options?: { id: string; text: string }[]; modelAnswer?: string; rubric?: string }; tags: string[]; maxScore: number; status: "draft" | "published" | "archived" };
type ArenaAttempt = { id: string; questionId: string; submittedAnswer: string[]; isCorrect: boolean; score: number; maxScore: number; createdAt: string };
type Scorecard = { id: string; studentId: string; assignmentCount: number; submittedCount: number; gradedCount: number; avgScore: number | null; completionPct: number | null; attendancePct: number | null; arenaAttemptCount: number; arenaScore: number | null };
type GradeHistory = { id: string; title: string; score: number; maxScore: number; feedback: string | null; submittedAt: string | null };
type BillingOverview = { subscription: null | { status: string; periodStart: string; periodEnd: string }; entitlements: { status: string; periodStart: string; periodEnd: string; implicitTrial: boolean; entitled: boolean; maxStudents: number; maxTeachers: number; features: Record<string, boolean> }; usage: { students: number; teachers: number; pendingStudents: number; pendingTeachers: number }; overrides: { feature: string; enabled: boolean }[] };
type Invoice = { id: string; amountMinor: number; currency: string; periodStart: string; periodEnd: string; status: string; paymentReference: string | null; paidAt: string | null };
type Tab = "assignments" | "attendance" | "updates" | "recordings" | "arena" | "progress";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "assignments", label: "Assignments", icon: "✓" }, { id: "attendance", label: "Attendance", icon: "◎" },
  { id: "updates", label: "Updates", icon: "◇" }, { id: "recordings", label: "Recordings", icon: "▶" },
  { id: "arena", label: "Arena", icon: "◈" }, { id: "progress", label: "Progress", icon: "↗" },
];

export function LearningWorkspace({ organizationId, role, initialTab = "assignments", initialClassKey = "", hideTabs = false }: { organizationId: string; role: Role; initialTab?: Tab; initialClassKey?: string; hideTabs?: boolean }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classKey, setClassKey] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { let live = true; api<ListResult<ClassRoom>>(`/organizations/${organizationId}/teaching/classes?limit=100`).then((result) => { if (!live) return; setClasses(result.items); setClassKey(result.items.some((item) => keyOf(item) === initialClassKey) ? initialClassKey : result.items[0] ? keyOf(result.items[0]) : ""); }).catch((reason) => live && setError(reason.message)); return () => { live = false; }; }, [organizationId, initialClassKey]);
  const classroom = classes.find((item) => keyOf(item) === classKey) ?? null;
  return <div className="learning-product">
    <div className="learning-toolbar"><div><p className="eyebrow">Live learning workspace</p><h2>{role === "student" ? "My learning" : role === "teacher" ? "Teaching desk" : "School learning"}</h2></div>{classes.length > 0 && <label>Class and subject<select value={classKey} onChange={(event) => setClassKey(event.target.value)}>{classes.map((item) => <option key={keyOf(item)} value={keyOf(item)}>{item.sectionName} · {item.subjectName}</option>)}</select></label>}</div>
    {error && <Banner text={error} />}
    {!error && !classes.length ? <Empty title="No classes available" copy={role === "student" ? "Your school needs to enroll you and assign subjects first." : "A school administrator needs to create section and subject assignments first."} /> : <>
      {!hideTabs && <nav className="learning-tabs" aria-label="Learning tools">{tabs.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>}
      {classroom && tab === "assignments" && <AssignmentsPane org={organizationId} role={role} classroom={classroom} />}
      {classroom && tab === "attendance" && <AttendancePane org={organizationId} role={role} classroom={classroom} />}
      {classroom && tab === "updates" && <UpdatesPane org={organizationId} classroom={classroom} />}
      {classroom && tab === "recordings" && <RecordingsPane org={organizationId} role={role} classroom={classroom} />}
      {classroom && tab === "arena" && <ArenaPane org={organizationId} role={role} classroom={classroom} />}
      {classroom && tab === "progress" && <ProgressPane org={organizationId} role={role} classroom={classroom} />}
    </>}
  </div>;
}

export function SchoolBilling({ organizationId }: { organizationId: string }) {
  const [overview, setOverview] = useState<BillingOverview | null>(null); const [invoices, setInvoices] = useState<Invoice[]>([]); const [error, setError] = useState("");
  useEffect(() => { let live = true; Promise.all([api<BillingOverview>(`/organizations/${organizationId}/billing`), api<ListResult<Invoice>>(`/organizations/${organizationId}/billing/invoices?limit=100`)]).then(([billing, history]) => { if (live) { setOverview(billing); setInvoices(history.items); } }).catch((reason) => live && setError(reason.message)); return () => { live = false; }; }, [organizationId]);
  return <FeatureCard title="Billing and entitlements" copy="Your current plan, seat usage, product access, and invoice history.">{error && <Banner text={error} />}{overview && <><div className="billing-metrics"><Metric label="Plan status" value={overview.entitlements.status.replace("_", " ")} /><Metric label="Student seats" value={`${overview.usage.students + overview.usage.pendingStudents} / ${overview.entitlements.maxStudents}`} /><Metric label="Teacher seats" value={`${overview.usage.teachers + overview.usage.pendingTeachers} / ${overview.entitlements.maxTeachers}`} /><Metric label="Current period" value={`${dateOnly(overview.entitlements.periodStart.slice(0, 10))} – ${dateOnly(overview.entitlements.periodEnd.slice(0, 10))}`} /></div><div className="entitlement-row">{Object.entries(overview.entitlements.features).map(([name, enabled]) => <span className={enabled ? "enabled" : "disabled"} key={name}>{enabled ? "✓" : "×"} {name}</span>)}</div></>}{invoices.length ? <div className="invoice-table"><div className="table-head"><span>Period</span><span>Amount</span><span>Status</span><span>Reference</span></div>{invoices.map((item) => <div key={item.id}><span>{dateOnly(item.periodStart.slice(0, 10))} – {dateOnly(item.periodEnd.slice(0, 10))}</span><b>{new Intl.NumberFormat("en-IN", { style: "currency", currency: item.currency }).format(item.amountMinor / 100)}</b><span className={`status-chip ${item.status}`}>{item.status}</span><span>{item.paymentReference ?? "—"}</span></div>)}</div> : <Empty title="No invoices" copy="Invoice records will appear when the platform administrator issues them." />}</FeatureCard>;
}

function AssignmentsPane({ org, role, classroom }: { org: string; role: Role; classroom: ClassRoom }) {
  const [items, setItems] = useState<Assignment[]>([]); const [creating, setCreating] = useState(false); const [selected, setSelected] = useState<Assignment | null>(null); const [error, setError] = useState("");
  const root = `/organizations/${org}/teaching`;
  async function load() { const result = await api<ListResult<Assignment>>(`${root}/assignments?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`); setItems(result.items); }
  useEffect(() => { let live = true; api<ListResult<Assignment>>(`${root}/assignments?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`).then((result) => live && setItems(result.items)).catch((reason) => live && setError(reason.message)); return () => { live = false; }; }, [classroom.sectionId, classroom.subjectId, root]);
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); await run(async () => { await createResource(`${root}/assignments`, { sectionId: classroom.sectionId, subjectId: classroom.subjectId, title: data.get("title"), description: data.get("description"), dueAt: new Date(String(data.get("dueAt"))).toISOString(), maxScore: Number(data.get("maxScore")) }); setCreating(false); await load(); }, setError); }
  async function publish(id: string) { await run(async () => { await createResource(`${root}/assignments/${id}/publish`, {}); await load(); }, setError); }
  return <FeatureCard title="Assignments" copy={role === "student" ? "Open published work, submit your answer, and review feedback." : "Create work, publish it to the captured class roster, and grade submissions."} action={role !== "student" ? <button className="primary-button" onClick={() => setCreating(true)}><Plus size={17} /> New assignment</button> : null}>
    {error && <Banner text={error} />}{items.length ? <div className="product-list">{items.map((item) => <article key={item.id}><div className="list-symbol"><FileText size={19} /></div><div><span className={`status-chip ${item.status}`}>{item.status}</span><h3>{item.title}</h3><p>{item.description || "No instructions provided."}</p><small>Due {dateTime(item.dueAt)} · {item.maxScore} marks</small></div><div className="row-actions">{role !== "student" && item.status === "draft" && <button onClick={() => publish(item.id)}>Publish</button>}<button onClick={() => setSelected(item)}>{role === "student" ? "Open work" : "View submissions"}</button></div></article>)}</div> : <Empty title="No assignments yet" copy={role === "student" ? "Published assignments will appear here." : "Create the first assignment for this class."} />}
    {creating && <Modal title="New assignment" onClose={() => setCreating(false)}><form className="product-form" onSubmit={create}><label>Title<input name="title" required maxLength={200} /></label><label>Instructions<textarea name="description" rows={5} maxLength={8000} /></label><div className="form-grid"><label>Due date and time<input name="dueAt" type="datetime-local" required /></label><label>Maximum score<input name="maxScore" type="number" min="0.01" max="10000" step="0.01" required defaultValue="100" /></label></div><FormActions onCancel={() => setCreating(false)} /></form></Modal>}
    {selected && <SubmissionModal org={org} role={role} assignment={selected} onClose={() => setSelected(null)} />}
  </FeatureCard>;
}

function SubmissionModal({ org, role, assignment, onClose }: { org: string; role: Role; assignment: Assignment; onClose: () => void }) {
  const [items, setItems] = useState<Submission[]>([]); const [error, setError] = useState(""); const root = `/organizations/${org}/teaching`;
  async function load() { const result = await api<ListResult<Submission>>(`${root}/assignments/${assignment.id}/submissions?limit=100`); setItems(result.items); }
  useEffect(() => { let live = true; api<ListResult<Submission>>(`${root}/assignments/${assignment.id}/submissions?limit=100`).then((result) => live && setItems(result.items)).catch((reason) => live && setError(reason.message)); return () => { live = false; }; }, [assignment.id, root]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); await run(async () => { await createResource(`${root}/assignments/${assignment.id}/submissions`, { content: data.get("content") }); await load(); }, setError); }
  async function grade(event: FormEvent<HTMLFormElement>, id: string) { event.preventDefault(); const data = new FormData(event.currentTarget); await run(async () => { await updateResource(`${root}/submissions/${id}/grade`, { score: Number(data.get("score")), feedback: data.get("feedback") }); await load(); }, setError); }
  return <Modal title={assignment.title} onClose={onClose}><p className="modal-copy">{assignment.description || "No additional instructions."}</p>{error && <Banner text={error} />}{role === "student" ? <form className="product-form" onSubmit={submit}><label>Your answer<textarea name="content" rows={9} required maxLength={8000} defaultValue={items[0]?.content ?? ""} disabled={items[0]?.status === "graded"} /></label>{items[0]?.status === "graded" && <div className="grade-result"><b>{items[0].score} / {assignment.maxScore}</b><p>{items[0].feedback || "No feedback provided."}</p></div>}<FormActions onCancel={onClose} label={items[0]?.content ? "Update submission" : "Submit assignment"} disabled={items[0]?.status === "graded"} /></form> : items.length ? <div className="grading-list">{items.map((item) => <form key={item.id} onSubmit={(event) => grade(event, item.id)}><div><b>{item.studentId}</b><span className={`status-chip ${item.status}`}>{item.status}</span><p>{item.content || "Not submitted"}</p></div>{item.content && <div className="grade-fields"><label>Score<input name="score" type="number" min="0" max={assignment.maxScore} step="0.01" required defaultValue={item.score ?? ""} /></label><label>Feedback<input name="feedback" defaultValue={item.feedback ?? ""} maxLength={4000} /></label><button className="primary-button">Save grade</button></div>}</form>)}</div> : <Empty title="No submissions" copy="Student submissions will appear after publication." />}</Modal>;
}

function AttendancePane({ org, role, classroom }: { org: string; role: Role; classroom: ClassRoom }) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]); const [selected, setSelected] = useState<AttendanceSession | null>(null); const [creating, setCreating] = useState(false); const [error, setError] = useState(""); const root = `/organizations/${org}/teaching`;
  async function load() { const result = await api<ListResult<AttendanceSession>>(`${root}/attendance-sessions?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`); setSessions(result.items); }
  useEffect(() => { let live = true; api<ListResult<AttendanceSession>>(`${root}/attendance-sessions?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`).then((result) => live && setSessions(result.items)).catch((reason) => live && setError(reason.message)); return () => { live = false; }; }, [classroom.sectionId, classroom.subjectId, root]);
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); await run(async () => { await createResource(`${root}/attendance-sessions`, { sectionId: classroom.sectionId, subjectId: classroom.subjectId, date: data.get("date"), period: Number(data.get("period")) }); setCreating(false); await load(); }, setError); }
  return <FeatureCard title="Attendance" copy={role === "student" ? "Review your finalized attendance records." : "Open a class register, mark every student, and finalize it."} action={role !== "student" ? <button className="primary-button" onClick={() => setCreating(true)}><Plus size={17} /> Take attendance</button> : null}>{error && <Banner text={error} />}{sessions.length ? <div className="compact-grid">{sessions.map((item) => <button key={item.id} className="session-card" onClick={() => setSelected(item)}><span className={`status-chip ${item.status}`}>{item.status}</span><b>{dateOnly(item.date)}</b><small>Period {item.period}</small></button>)}</div> : <Empty title="No attendance records" copy="Attendance sessions for this class will appear here." />}{creating && <Modal title="Take attendance" onClose={() => setCreating(false)}><form className="product-form" onSubmit={create}><label>Date<input name="date" type="date" required max={new Date().toISOString().slice(0, 10)} /></label><label>Period<input name="period" type="number" min="1" max="20" required defaultValue="1" /></label><FormActions onCancel={() => setCreating(false)} label="Open register" /></form></Modal>}{selected && <AttendanceRegister org={org} role={role} classroom={classroom} session={selected} onClose={() => { setSelected(null); void load(); }} />}</FeatureCard>;
}

function AttendanceRegister({ org, role, classroom, session, onClose }: { org: string; role: Role; classroom: ClassRoom; session: AttendanceSession; onClose: () => void }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]); const [roster, setRoster] = useState<RosterStudent[]>([]); const [error, setError] = useState(""); const root = `/organizations/${org}/teaching`;
  async function load() { const result = await api<ListResult<AttendanceRecord>>(`${root}/attendance-sessions/${session.id}/records?limit=100`); setRecords(result.items); }
  useEffect(() => { let live = true; Promise.all([api<ListResult<AttendanceRecord>>(`${root}/attendance-sessions/${session.id}/records?limit=100`), role === "student" ? Promise.resolve({ items: [] as RosterStudent[] }) : api<ListResult<RosterStudent>>(`${root}/roster?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`)]).then(([marks, people]) => { if (live) { setRecords(marks.items); setRoster(people.items); } }).catch((reason) => live && setError(reason.message)); return () => { live = false; }; }, [classroom.sectionId, classroom.subjectId, role, root, session.id]);
  async function save() { await run(async () => { await updateResource(`${root}/attendance-sessions/${session.id}/records`, { records: records.map((item) => ({ studentId: item.studentId, status: item.status })) }); await load(); }, setError); }
  async function finalize() { await run(async () => { await createResource(`${root}/attendance-sessions/${session.id}/finalize`, {}); onClose(); }, setError); }
  return <Modal title={`${dateOnly(session.date)} · Period ${session.period}`} onClose={onClose}>{error && <Banner text={error} />}{records.length ? <div className="attendance-list">{records.map((item) => <label key={item.id}><span><b>{roster.find((person) => person.studentId === item.studentId)?.email ?? "My attendance"}</b><small>{roster.find((person) => person.studentId === item.studentId)?.rollNumber ? `Roll ${roster.find((person) => person.studentId === item.studentId)?.rollNumber}` : item.studentId}</small></span>{role === "student" || session.status === "finalized" ? <strong className={`status-chip ${item.status}`}>{item.status ?? "unmarked"}</strong> : <select value={item.status ?? ""} onChange={(event) => setRecords((current) => current.map((record) => record.id === item.id ? { ...record, status: event.target.value as AttendanceRecord["status"] } : record))}><option value="">Mark attendance</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option></select>}</label>)}</div> : <Empty title="No attendance records" copy="This register has no captured students." />}{role !== "student" && session.status === "draft" && <div className="modal-actions"><button className="secondary-button" onClick={save}>Save marks</button><button className="primary-button" onClick={finalize} disabled={records.some((item) => !item.status)}>Finalize register</button></div>}</Modal>;
}

function UpdatesPane({ org, classroom }: { org: string; classroom: ClassRoom }) {
  const [inbox, setInbox] = useState<Inbox>({ items: [], total: 0, unreadCount: 0 }); const [timeline, setTimeline] = useState<Notification[]>([]); const [error, setError] = useState("");
  async function load() { const [messages, events] = await Promise.all([api<Inbox>(`/organizations/${org}/notifications?filter=all&limit=100`), api<ListResult<Notification>>(`/organizations/${org}/timeline?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`)]); setInbox(messages); setTimeline(events.items); }
  useEffect(() => { let live = true; Promise.all([api<Inbox>(`/organizations/${org}/notifications?filter=all&limit=100`), api<ListResult<Notification>>(`/organizations/${org}/timeline?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`)]).then(([messages, events]) => { if (live) { setInbox(messages); setTimeline(events.items); } }).catch((reason) => live && setError(reason.message)); return () => { live = false; }; }, [classroom.sectionId, classroom.subjectId, org]);
  async function markRead(id: string) { await run(async () => { await updateResource(`/organizations/${org}/notifications/${id}/read`, {}); await load(); }, setError); }
  return <div className="two-feature-columns"><FeatureCard title={`Notifications · ${inbox.unreadCount} unread`} copy="Updates addressed directly to you.">{error && <Banner text={error} />}{inbox.items.length ? <div className="updates-list">{inbox.items.map((item) => <article key={item.id} className={!item.readAt ? "unread" : ""}><span>{eventIcon(item.eventType)}</span><div><b>{eventName(item.eventType)}</b><small>{dateTime(item.occurredAt)}</small></div>{!item.readAt && <button onClick={() => markRead(item.id)}>Mark read</button>}</article>)}</div> : <Empty title="Inbox is clear" copy="New class updates will appear here." />}</FeatureCard><FeatureCard title="Class timeline" copy="Recent published activity in this class.">{timeline.length ? <div className="timeline-list">{timeline.map((item) => <article key={item.id}><span>{eventIcon(item.eventType)}</span><div><b>{eventName(item.eventType)}</b><small>{dateTime(item.occurredAt)}</small></div></article>)}</div> : <Empty title="No class activity" copy="Published work and finalized attendance will appear here." />}</FeatureCard></div>;
}

function RecordingsPane({ org, role, classroom }: { org: string; role: Role; classroom: ClassRoom }) {
  const [items, setItems] = useState<Recording[]>([]); const [creating, setCreating] = useState(false); const [error, setError] = useState(""); const root = `/organizations/${org}/recordings`;
  async function load() { const result = await api<ListResult<Recording>>(`${root}?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`); setItems(result.items); }
  useEffect(() => { let live = true; api<ListResult<Recording>>(`${root}?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`).then((result) => live && setItems(result.items)).catch((reason) => live && setError(reason.message)); return () => { live = false; }; }, [classroom.sectionId, classroom.subjectId, root]);
  async function transition(id: string, action: "publish" | "archive") { await run(async () => { if (action === "publish") await createResource(`${root}/${id}/publish`, {}); else await updateResource(`${root}/${id}/archive`, {}); await load(); }, setError); }
  async function play(id: string) { await run(async () => { const result = await api<{ url: string }>(`${root}/${id}/playback`); window.open(result.url, "_blank", "noopener,noreferrer"); }, setError); }
  return <FeatureCard title="Class recordings" copy={role === "student" ? "Watch published lessons securely." : "Upload a lesson, verify it, and publish it to students."} action={role !== "student" ? <button className="primary-button" onClick={() => setCreating(true)}><Plus size={17} /> Upload recording</button> : null}>{error && <Banner text={error} />}{items.length ? <div className="media-grid">{items.map((item) => <article key={item.id}><div className="media-cover"><span><CirclePlay size={30} /></span><small>{duration(item.durationSeconds)}</small></div><span className={`status-chip ${item.status}`}>{item.status}</span><h3>{item.title}</h3><p>{dateTime(item.recordedAt)} · {formatBytes(item.sizeBytes)}</p><div className="row-actions">{(item.status === "published" || item.status === "ready") && <button onClick={() => play(item.id)}>Play</button>}{role !== "student" && item.status === "ready" && <button onClick={() => transition(item.id, "publish")}>Publish</button>}{role !== "student" && item.status !== "archived" && <button onClick={() => transition(item.id, "archive")}>Archive</button>}</div></article>)}</div> : <Empty title="No recordings" copy="Published class recordings will appear here." />}{creating && <RecordingUpload org={org} classroom={classroom} onClose={() => { setCreating(false); void load(); }} />}</FeatureCard>;
}

function RecordingUpload({ org, classroom, onClose }: { org: string; classroom: ClassRoom; onClose: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function upload(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const data = new FormData(event.currentTarget); const file = data.get("file"); if (!(file instanceof File)) return; try { const hash = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())))); const recording = await createResource<Recording>(`/organizations/${org}/recordings`, { sectionId: classroom.sectionId, subjectId: classroom.subjectId, title: data.get("title"), recordedAt: new Date(String(data.get("recordedAt"))).toISOString(), durationSeconds: Number(data.get("durationSeconds")), contentType: file.type, sizeBytes: file.size, checksumSha256: hash }); const target = await api<{ url: string; headers: Record<string, string> }>(`/organizations/${org}/recordings/${recording.id}/upload-url`, { method: "POST" }); const response = await fetch(target.url, { method: "PUT", headers: target.headers, body: file }); if (!response.ok) throw new Error("The video upload failed."); const versionId = response.headers.get("x-amz-version-id"); if (!versionId) throw new Error("Storage did not return a version ID."); await createResource(`/organizations/${org}/recordings/${recording.id}/complete`, { versionId }); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed"); } finally { setBusy(false); } }
  return <Modal title="Upload class recording" onClose={onClose}><form className="product-form" onSubmit={upload}>{error && <Banner text={error} />}<label>Title<input name="title" required maxLength={200} /></label><label>Video file<input name="file" type="file" accept="video/mp4,video/webm" required /></label><div className="form-grid"><label>Recorded at<input name="recordedAt" type="datetime-local" required /></label><label>Duration in seconds<input name="durationSeconds" type="number" min="1" max="28800" required /></label></div><FormActions onCancel={onClose} label={busy ? "Uploading…" : "Upload and verify"} disabled={busy} /></form></Modal>;
}

function ArenaPane({ org, role, classroom }: { org: string; role: Role; classroom: ClassRoom }) {
  const [items, setItems] = useState<ArenaQuestion[]>([]);
  const [creating, setCreating] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, ArenaAttempt[]>>({});
  const [error, setError] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const root = `/organizations/${org}/arena`;

  async function load() {
    const result = await api<ListResult<ArenaQuestion>>(`${root}/questions?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`);
    setItems(result.items);
  }

  useEffect(() => {
    let live = true;
    api<ListResult<ArenaQuestion>>(`${root}/questions?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`)
      .then((result) => live && setItems(result.items))
      .catch((reason) => live && setError(reason.message));
    return () => { live = false; };
  }, [classroom.sectionId, classroom.subjectId, root]);

  async function transition(id: string, action: "publish" | "archive") {
    await run(async () => {
      if (action === "publish") await createResource(`${root}/questions/${id}/publish`, {});
      else await updateResource(`${root}/questions/${id}/archive`, {});
      await load();
    }, setError);
  }

  async function attempt(event: FormEvent<HTMLFormElement>, question: ArenaQuestion) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const selected = question.questionType === "subjective" ? ["model_answer"] : data.getAll("answer").map(String);
    await run(async () => {
      await createResource(`${root}/questions/${question.id}/attempts`, { selectedOptionIds: selected });
      const history = await api<ListResult<ArenaAttempt>>(`${root}/questions/${question.id}/attempts?limit=100`);
      setAttempts((current) => ({ ...current, [question.id]: history.items }));
    }, setError);
  }

  const availableChapters = Array.from(new Set(items.map((i) => i.chapter).filter(Boolean)));
  const availableTopics = Array.from(new Set(items.filter((i) => !chapterFilter || i.chapter === chapterFilter).map((i) => i.topic).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    if (chapterFilter && item.chapter !== chapterFilter) return false;
    if (topicFilter && item.topic !== topicFilter) return false;
    if (difficultyFilter && item.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <FeatureCard
      title="Arena practice"
      copy={role === "student" ? "Practice published questions and improve your best score." : "Build objective practice questions and publish them to enrolled students."}
      action={role !== "student" ? <button className="primary-button" onClick={() => setCreating(true)}><Plus size={17} /> New Arena question</button> : null}
    >
      {error && <Banner text={error} />}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "16px", padding: "10px 14px", background: "var(--surface-sunken, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-subtle, #e2e8f0)" }}>
        <span style={{ fontSize: "0.85em", fontWeight: 600, color: "var(--text-subtle, #64748b)" }}>Class: {classroom.programName || classroom.sectionName} · {classroom.subjectName}</span>
        <select style={{ marginLeft: "auto", fontSize: "0.85em", padding: "4px 8px" }} value={chapterFilter} onChange={(e) => { setChapterFilter(e.target.value); setTopicFilter(""); }}>
          <option value="">All chapters</option>
          {availableChapters.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
        </select>
        <select style={{ fontSize: "0.85em", padding: "4px 8px" }} value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
          <option value="">All topics</option>
          {availableTopics.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
        </select>
        <select style={{ fontSize: "0.85em", padding: "4px 8px" }} value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {filteredItems.length ? (
        <div className="question-list">
          {filteredItems.map((item) => (
            <article key={item.id}>
              <div className="question-meta">
                <span className={`status-chip ${item.status}`}>{item.status}</span>
                <span>{item.difficulty}</span>
                {item.chapter && <span style={{ fontWeight: 500 }}>{item.chapter}</span>}
                <span>{item.topic}</span>
                <span style={{ textTransform: "uppercase", fontSize: "0.75em", letterSpacing: "0.05em", opacity: 0.8 }}>{item.questionType === "subjective" ? "Subjective" : "MCQ"}</span>
              </div>
              <h3>{item.content.prompt}</h3>
              {role === "student" ? (
                <form onSubmit={(event) => attempt(event, item)}>
                  {item.questionType === "subjective" ? (
                    <div style={{ marginBottom: "12px" }}>
                      <textarea
                        name="written_answer"
                        rows={3}
                        placeholder="Write your explanation or working here..."
                        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-subtle, #cbd5e1)" }}
                      />
                    </div>
                  ) : (
                    <div className="answer-options">
                      {(item.content.options || []).map((option) => (
                        <label key={option.id}>
                          <input name="answer" type={item.questionType === "single_choice" ? "radio" : "checkbox"} value={option.id} required={item.questionType === "single_choice"} />
                          {option.text}
                        </label>
                      ))}
                    </div>
                  )}
                  <button className="primary-button">Check answer</button>
                  {attempts[item.id]?.[0] && (
                    item.questionType === "subjective" ? (
                      <div style={{ marginTop: "12px", padding: "12px", background: "var(--surface-sunken, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-subtle, #e2e8f0)" }}>
                        <strong className="correct-answer" style={{ display: "block", marginBottom: "8px" }}>Completed · Self-assessment & Model answer</strong>
                        <div style={{ fontSize: "0.9em", marginBottom: "6px" }}><b>Model Answer / Solution:</b></div>
                        <p style={{ margin: "0 0 8px 0", fontSize: "0.9em", whiteSpace: "pre-wrap" }}>{item.content.modelAnswer || "Model answer registered by instructor."}</p>
                        {item.content.rubric && (
                          <>
                            <div style={{ fontSize: "0.85em", color: "var(--text-subtle, #475569)", marginBottom: "4px" }}><b>Scoring Rubric:</b></div>
                            <p style={{ margin: "0", fontSize: "0.85em", whiteSpace: "pre-wrap", color: "var(--text-subtle, #475569)" }}>{item.content.rubric}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <strong className={attempts[item.id][0].isCorrect ? "correct-answer" : "wrong-answer"}>
                        {attempts[item.id][0].isCorrect ? "Correct" : "Try again"} · {attempts[item.id][0].score}/{attempts[item.id][0].maxScore}
                      </strong>
                    )
                  )}
                </form>
              ) : (
                <div className="row-actions">
                  {item.status === "draft" && <button onClick={() => transition(item.id, "publish")}>Publish</button>}
                  {item.status !== "archived" && <button onClick={() => transition(item.id, "archive")}>Archive</button>}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty title="No Arena questions" copy={role === "student" ? "Published practice will appear here." : "Create the first practice question."} />
      )}
      {creating && <QuestionForm org={org} classroom={classroom} onClose={() => { setCreating(false); void load(); }} />}
    </FeatureCard>
  );
}

function QuestionForm({ org, classroom, onClose }: { org: string; classroom: ClassRoom; onClose: () => void }) {
  const [error, setError] = useState("");
  const [qType, setQType] = useState<"single_choice" | "subjective">("single_choice");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const chapter = String(data.get("chapter") || "").trim();
    const topic = String(data.get("topic") || "").trim();
    const prompt = String(data.get("prompt") || "");
    const difficulty = String(data.get("difficulty") || "easy");
    const maxScore = Number(data.get("maxScore") || 1);
    const tags = String(data.get("tags") || "").split(",").map((item) => item.trim()).filter(Boolean);

    let content: any = { prompt };
    let answerKey: string[] = [];

    if (qType === "subjective") {
      content.modelAnswer = String(data.get("modelAnswer") || "").trim();
      content.rubric = String(data.get("rubric") || "").trim();
      answerKey = ["model_answer"];
    } else {
      const options = ["a", "b", "c", "d"].map((id) => ({ id, text: String(data.get(`option-${id}`) || "").trim() })).filter((item) => item.text);
      content.options = options;
      answerKey = [String(data.get("answer") || "a")];
    }

    await run(async () => {
      await createResource(`/organizations/${org}/arena/questions`, {
        sectionId: classroom.sectionId,
        subjectId: classroom.subjectId,
        programId: classroom.programId || undefined,
        chapter,
        topic,
        difficulty,
        questionType: qType,
        content,
        answerKey,
        tags,
        maxScore,
      });
      onClose();
    }, setError);
  }

  return (
    <Modal title="New Arena question" onClose={onClose}>
      <form className="product-form" onSubmit={submit}>
        {error && <Banner text={error} />}
        <div style={{ padding: "8px 12px", background: "var(--surface-sunken, #f1f5f9)", borderRadius: "6px", fontSize: "0.85em", marginBottom: "8px" }}>
          <b>Class:</b> {classroom.programName || classroom.sectionName} &nbsp;|&nbsp; <b>Subject:</b> {classroom.subjectName}
        </div>
        <div className="form-grid">
          <label>Question type
            <select value={qType} onChange={(e) => setQType(e.target.value as any)}>
              <option value="single_choice">Multiple Choice (MCQ)</option>
              <option value="subjective">Subjective (Model answer / Rubric)</option>
            </select>
          </label>
          <label>Difficulty
            <select name="difficulty">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>Chapter<input name="chapter" placeholder="e.g. Chapter 1: Calculus" required maxLength={100} /></label>
          <label>Topic<input name="topic" placeholder="e.g. Derivatives" required maxLength={100} /></label>
        </div>
        <label>Question prompt<textarea name="prompt" rows={3} required maxLength={4000} /></label>
        {qType === "subjective" ? (
          <>
            <label>Model Answer / Solution<textarea name="modelAnswer" rows={3} placeholder="Provide expected answer or detailed solution steps..." required maxLength={4000} /></label>
            <label>Grading Rubric (optional)<textarea name="rubric" rows={2} placeholder="Key points or criteria for self-assessment..." maxLength={2000} /></label>
          </>
        ) : (
          <>
            {["a", "b", "c", "d"].map((id, index) => (
              <label key={id}>Option {index + 1}<input name={`option-${id}`} required={index < 2} maxLength={500} /></label>
            ))}
            <div className="form-grid">
              <label>Correct option
                <select name="answer">
                  <option value="a">Option 1</option>
                  <option value="b">Option 2</option>
                  <option value="c">Option 3</option>
                  <option value="d">Option 4</option>
                </select>
              </label>
              <label>Score<input name="maxScore" type="number" min="1" max="100" defaultValue="1" required /></label>
            </div>
          </>
        )}
        {qType === "subjective" && (
          <label>Score<input name="maxScore" type="number" min="1" max="100" defaultValue="5" required /></label>
        )}
        <label>Tags, separated by commas<input name="tags" placeholder="e.g. calculus, exam-prep" /></label>
        <FormActions onCancel={onClose} />
      </form>
    </Modal>
  );
}

function ProgressPane({ org, role, classroom }: { org: string; role: Role; classroom: ClassRoom }) {
  const [items, setItems] = useState<Scorecard[]>([]); const [grades, setGrades] = useState<GradeHistory[]>([]); const [error, setError] = useState("");
  useEffect(() => { let live = true; const root = `/organizations/${org}/teaching`; const scores = api<ListResult<Scorecard>>(`${root}/scorecards?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`); const history = role === "student" ? api<ListResult<Assignment>>(`${root}/assignments?sectionId=${classroom.sectionId}&subjectId=${classroom.subjectId}&limit=100`).then(async (work) => (await Promise.all(work.items.map(async (assignment) => ({ assignment, submissions: (await api<ListResult<Submission>>(`${root}/assignments/${assignment.id}/submissions?limit=100`)).items })))).flatMap(({ assignment, submissions }) => submissions.filter((submission) => submission.status === "graded" && submission.score !== null).map((submission) => ({ id: submission.id, title: assignment.title, score: submission.score!, maxScore: assignment.maxScore, feedback: submission.feedback, submittedAt: submission.submittedAt })))) : Promise.resolve([]); Promise.all([scores, history]).then(([scorecards, pastGrades]) => { if (live) { setItems(scorecards.items); setGrades(pastGrades); } }).catch((reason) => live && setError(reason.message)); return () => { live = false; }; }, [classroom.sectionId, classroom.subjectId, org, role]);
  return <FeatureCard title={role === "student" ? "Previous grades" : "Progress and scorecards"} copy="Academic-year-to-date results calculated from graded work, finalized attendance, and Arena practice.">{error && <Banner text={error} />}{role === "student" && grades.length > 0 && <div className="grade-history">{grades.map((grade) => <article key={grade.id}><div><h3>{grade.title}</h3><p>{grade.feedback || "No teacher feedback provided."}</p><small>{grade.submittedAt ? dateTime(grade.submittedAt) : "Submitted"}</small></div><strong>{grade.score}<span> / {grade.maxScore}</span></strong></article>)}</div>}{items.length ? <div className="scorecard-grid">{items.map((item) => <article key={item.id}><span className="student-id">{role === "student" ? "Current class summary" : item.studentId}</span><Metric label="Average score" value={percent(item.avgScore)} /><Metric label="Completion" value={percent(item.completionPct)} /><Metric label="Attendance" value={percent(item.attendancePct)} /><Metric label="Arena best" value={percent(item.arenaScore)} /><small>{item.submittedCount}/{item.assignmentCount} assignments · {item.arenaAttemptCount} Arena attempts</small></article>)}</div> : <Empty title="No grades yet" copy="Your results will appear after a teacher grades submitted work." />}</FeatureCard>;
}

function FeatureCard({ title, copy, action, children }: { title: string; copy: string; action?: React.ReactNode; children: React.ReactNode }) { return <section className="feature-surface"><header><div><h2>{title}</h2><p>{copy}</p></div>{action}</header><div className="feature-body">{children}</div></section>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop"><section className="action-modal product-modal" role="dialog" aria-modal="true" aria-label={title}><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><h2>{title}</h2>{children}</section></div>; }
function FormActions({ onCancel, label = "Save", disabled = false }: { onCancel: () => void; label?: string; disabled?: boolean }) { return <div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={disabled}>{label}</button></div>; }
function Empty({ title, copy }: { title: string; copy: string }) { return <div className="product-empty"><span><Inbox size={20} /></span><h3>{title}</h3><p>{copy}</p></div>; }
function Banner({ text }: { text: string }) { return <div className="form-error product-error" role="alert">{text}</div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="score-metric"><span>{label}</span><b>{value}</b></div>; }
async function run(task: () => Promise<void>, onError: (message: string) => void) { onError(""); try { await task(); } catch (reason) { onError(reason instanceof Error ? reason.message : "Something went wrong"); } }
function keyOf(item: ClassRoom) { return `${item.sectionId}:${item.subjectId}`; }
function dateTime(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function dateOnly(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`)); }
function percent(value: number | null) { return value === null ? "—" : `${Math.round(value)}%`; }
function duration(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function formatBytes(bytes: number) { return bytes < 1048576 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`; }
function eventName(value: string) { return ({ "assignment.published": "New assignment published", "submission.graded": "Assignment graded", "attendance.finalized": "Attendance finalized", "recording.published": "New recording published" } as Record<string, string>)[value] ?? value; }
function eventIcon(value: string) { const Icon = value.includes("assignment") ? ClipboardCheck : value.includes("attendance") ? CalendarCheck2 : value.includes("recording") ? Video : value.includes("arena") ? Trophy : Bell; return <Icon size={17} aria-hidden="true" />; }
