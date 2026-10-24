import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

type Section = { id: string; name: string; programName?: string; subjects?: { id: string; name: string; code?: string }[] };
type Row = { sectionId: string; subjectIds: string[]; subjectId?: string; startTime: string; endTime: string; maxMarks: number; passingMarks: number };

export function ExamPlanDrawer({
  open,
  sections,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  sections: Section[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: (value: { examName: string; term: string; examDate: string; status: "scheduled"; plans: Required<Pick<Row, "sectionId" | "subjectId" | "startTime" | "endTime" | "maxMarks" | "passingMarks">>[] }) => void;
}) {
  const classes = useMemo(() => [...new Set(sections.map((s) => s.programName).filter(Boolean))] as string[], [sections]);
  const newRow = (): Row => ({ sectionId: "", subjectIds: [], startTime: "09:00", endTime: "12:00", maxMarks: 100, passingMarks: 33 });
  const [examName, setExamName] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [examDate, setExamDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setError(""); setRows((current) => current.length ? current : [newRow()]); }
  }, [open]);
  if (!open) return null;

  const update = (index: number, patch: Partial<Row>) => setRows((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row));
  const sectionFor = (row: Row) => sections.find((s) => s.id === row.sectionId);
  const chooseClass = (index: number, programName: string) => {
    const section = sections.find((s) => s.programName === programName);
    update(index, { sectionId: section?.id || "", subjectIds: [] });
  };
  const toggleAll = (index: number, checked: boolean) => {
    const subjects = sectionFor(rows[index])?.subjects || [];
    update(index, { subjectIds: checked ? subjects.map((s) => s.id) : [] });
  };
  const toggleSubject = (index: number, subjectId: string) => {
    const selected = rows[index].subjectIds;
    update(index, { subjectIds: selected.includes(subjectId) ? selected.filter((id) => id !== subjectId) : [...selected, subjectId] });
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const invalid = !examName.trim() || !term.trim() || !examDate || rows.some((r) => !r.sectionId || !r.subjectIds.length || r.startTime >= r.endTime || r.passingMarks <= 0 || r.passingMarks > r.maxMarks);
    if (invalid) { setError("Choose a class, section, at least one enrolled subject, and valid marks/time for every row."); return; }
    onSubmit({
      examName: examName.trim(), term: term.trim(), examDate, status: "scheduled",
      plans: rows.flatMap((row) => row.subjectIds.map((subjectId) => ({ ...row, subjectId })))
        .map(({ subjectIds, ...row }) => row as Required<Pick<Row, "sectionId" | "subjectId" | "startTime" | "endTime" | "maxMarks" | "passingMarks">>),
    });
  };

  return <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(12,30,51,.45)" }}>
    <aside className="edops-right-drawer" style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "min(var(--edops-drawer-width), 100%)", background: "#fff", boxShadow: "-12px 0 30px rgba(0,0,0,.18)", overflowY: "auto" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", background: "#f8fafc", borderBottom: "1px solid #e4e6e9" }}>
        <div><h3 style={{ margin: 0, color: "#0c1e33" }}>Schedule School Examination</h3><small style={{ color: "#667085" }}>Select class, section, then enrolled subjects</small></div>
        <button type="button" onClick={onClose} style={{ background: "transparent", border: 0, cursor: "pointer" }}><X size={20} /></button>
      </div>
      <form onSubmit={submit} style={{ padding: 22, display: "grid", gap: 16 }}>
        {error && <div style={{ padding: 10, color: "#991B1B", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, fontSize: 13 }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 10 }}>
          <label style={label}>Exam name<input required value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Term 1 Examination" style={input} /></label>
          <label style={label}>Term / cycle<input required value={term} onChange={(e) => setTerm(e.target.value)} style={input} /></label>
          <label style={label}>Exam date<input required type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} style={input} /></label>
        </div>
        {rows.map((row, index) => {
          const section = sectionFor(row); const available = section?.subjects || []; const selectedAll = available.length > 0 && row.subjectIds.length === available.length;
          return <section key={index} style={{ padding: 14, border: "1px solid #d0d5dd", borderRadius: 10, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong>Class &amp; section {index + 1}</strong>{rows.length > 1 && <button type="button" onClick={() => setRows((current) => current.filter((_, i) => i !== index))} style={iconButton}><Trash2 size={15} /></button>}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={label}>Class<select required value={section?.programName || ""} onChange={(e) => chooseClass(index, e.target.value)} style={input}><option value="">Select class</option>{classes.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
              <label style={label}>Section<select required value={row.sectionId} onChange={(e) => update(index, { sectionId: e.target.value, subjectIds: [] })} style={input}><option value="">Select section</option>{sections.filter((s) => !section?.programName || s.programName === section.programName).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            </div>
            <div style={{ display: "grid", gap: 7 }}><label style={label}>Subjects ({row.subjectIds.length}/{available.length} selected)</label><label style={{ fontSize: 13 }}><input type="checkbox" checked={selectedAll} onChange={(e) => toggleAll(index, e.target.checked)} disabled={!available.length} /> Select all enrolled subjects</label>{available.map((subject) => <label key={subject.id} style={{ fontSize: 13 }}><input type="checkbox" checked={row.subjectIds.includes(subject.id)} onChange={() => toggleSubject(index, subject.id)} /> {subject.name}{subject.code ? ` (${subject.code})` : ""}</label>)}{row.sectionId && !available.length && <small style={{ color: "#B42318" }}>No enrolled subjects are assigned to this section.</small>}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <label style={label}>Start<input required type="time" value={row.startTime} onChange={(e) => update(index, { startTime: e.target.value })} style={input} /></label>
              <label style={label}>End<input required type="time" value={row.endTime} onChange={(e) => update(index, { endTime: e.target.value })} style={input} /></label>
              <label style={label}>Max marks<input required type="number" min="1" max="999.99" value={row.maxMarks} onChange={(e) => {
                const newMax = Number(e.target.value);
                const defaultPass = Math.max(1, Math.round(newMax * 0.33));
                update(index, { maxMarks: newMax, passingMarks: row.passingMarks > newMax ? defaultPass : row.passingMarks });
              }} style={input} /></label>
              <label style={label}>Pass marks<input required type="number" min="0.01" max={row.maxMarks} value={row.passingMarks} onChange={(e) => update(index, { passingMarks: Number(e.target.value) })} style={input} /></label>
            </div>
          </section>;
        })}
        <button type="button" onClick={() => setRows((current) => [...current, newRow()])} style={{ ...secondaryButton, justifyContent: "center" }}><Plus size={15} /> Add class &amp; section</button>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #e4e6e9", paddingTop: 14 }}><button type="button" onClick={onClose} style={secondaryButton}>Cancel</button><button type="submit" disabled={busy} style={primaryButton}>{busy ? "Scheduling..." : "Schedule examination"}</button></div>
      </form>
    </aside>
  </div>;
}

const label: React.CSSProperties = { display: "grid", gap: 4, fontSize: 12, fontWeight: 600, color: "#344054" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "1px solid #e4e6e9", fontSize: 13, background: "#fff" };
const secondaryButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 6, border: "1px solid #d0d5dd", background: "#fff", fontWeight: 600, cursor: "pointer" };
const primaryButton: React.CSSProperties = { ...secondaryButton, border: 0, background: "#0c1e33", color: "#fff" };
const iconButton: React.CSSProperties = { border: 0, background: "transparent", color: "#B42318", cursor: "pointer" };
