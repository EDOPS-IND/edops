"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Clock, Users, Layers, AlertCircle, AlertTriangle, Calendar, X, Trash2 } from "lucide-react";
import {
  assignPrincipalSubstitute,
  createPrincipalTimetableEntry,
  deletePrincipalTimetableEntry,
  getPrincipalSubstituteSuggestions,
  getPrincipalTeachers,
  getPrincipalTimetable,
  updatePrincipalTimetableEntry,
} from "../../edops-api";

type Entry = {
  id: string;
  academic_year_id: string;
  section_id: string;
  subject_id: string;
  teacher_user_id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  room_number: string;
  sectionName: string;
  programName: string;
  subjectName: string;
  teacherName: string;
};
type Substitute = {
  id: string;
  timetableEntryId: string;
  eventDate: string;
  dayOfWeek: number;
  periodNumber: number;
  sectionName: string;
  programName: string;
  subjectName: string;
  originalTeacher: string;
  substituteTeacher: string;
  absenceType: string | null;
  impactNote: string;
};
type Uncovered = {
  timetableEntryId: string;
  eventDate: string;
  periodNumber: number;
  sectionName: string;
  programName: string;
  subjectName: string;
  originalTeacher: string;
  absenceType: string;
};
type Option = { id: string; name: string; email?: string };
type Data = { entries: Entry[]; substitutions: Substitute[]; uncovered: Uncovered[] };
type People = { teachers: Option[]; sections: Option[]; subjects: Option[]; assignments?: any[] };
type View = "academic" | "teacher" | "class" | "substitutions";
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const date = (value: string) => value?.slice(0, 10) || "—";

function ConflictMatrix({ entries }: { entries: Entry[] }) {
  const clashes: string[] = [];
  const loads = new Map<string, { teacher: string; count: number }>();
  for (const entry of entries) {
    const load = loads.get(entry.teacher_user_id) ?? { teacher: entry.teacherName, count: 0 };
    load.count++;
    loads.set(entry.teacher_user_id, load);
    for (const other of entries) {
      if (
        other.id >= entry.id ||
        other.academic_year_id !== entry.academic_year_id ||
        other.day_of_week !== entry.day_of_week ||
        (other.period_number !== entry.period_number &&
          !(other.start_time < entry.end_time && other.end_time > entry.start_time))
      )
        continue;
      const subject =
        other.teacher_user_id === entry.teacher_user_id
          ? `Teacher ${entry.teacherName}`
          : other.section_id === entry.section_id
          ? `Class ${entry.programName} - ${entry.sectionName}`
          : entry.room_number && other.room_number === entry.room_number
          ? `Room ${entry.room_number}`
          : "";
      if (subject) clashes.push(`${subject}: ${days[entry.day_of_week - 1]}, period ${entry.period_number}`);
    }
  }

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
      <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
        Timetable Conflict & Faculty Workload Matrix
      </h3>
      {!entries.length ? (
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>No timetable entries to analyse.</p>
      ) : (
        <>
          <p style={{ margin: "0 0 10px", fontSize: "12px", color: clashes.length > 0 ? "#991b1b" : "#166534", fontWeight: 600 }}>
            {clashes.length} scheduling clashes detected across {entries.length} saved periods
          </p>
          {clashes.length > 0 && (
            <ul style={{ margin: "0 0 14px", paddingLeft: "18px", fontSize: "12px", color: "#b91c1c" }}>
              {clashes.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[...loads.entries()].map(([id, load]) => (
              <span
                key={id}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "#f8fafc",
                  border: "1px solid #e4e6e9",
                  fontSize: "11px",
                  color: "#334155",
                  fontWeight: 600,
                }}
              >
                {load.teacher}: <b>{load.count} periods/wk</b>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TimetablePane({
  organizationId,
  initialTab = "academic",
  onTabChange,
}: {
  organizationId: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const [currentView, setCurrentView] = useState<View>(initialTab as View);
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

  useEffect(() => {
    setCurrentView(initialTab as View);
  }, [initialTab]);

  const reload = () => getPrincipalTimetable(organizationId).then(setData);

  useEffect(() => {
    let active = true;
    Promise.all([getPrincipalTimetable(organizationId), getPrincipalTeachers(organizationId)])
      .then(([timetable, roster]) => {
        if (active) {
          setData(timetable);
          setPeople(roster);
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load timetable");
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const entries = data?.entries ?? [];
  const filtered = entries.filter((item) =>
    currentView === "teacher"
      ? !teacherId || item.teacher_user_id === teacherId
      : currentView === "class"
      ? !sectionId || item.section_id === sectionId
      : true
  );

  const field = (name: string, value: string) => setForm((previous) => ({ ...previous, [name]: value }));
  const openEntry = (entry: Entry | null) => {
    setEditing(entry);
    setError("");
    if (entry) {
      setForm({
        sectionId: entry.section_id,
        subjectId: entry.subject_id,
        teacherUserId: entry.teacher_user_id,
        dayOfWeek: String(entry.day_of_week),
        periodNumber: String(entry.period_number),
        startTime: entry.start_time,
        endTime: entry.end_time,
        roomNumber: entry.room_number,
      });
    } else {
      const defSecId = sectionId || people?.sections[0]?.id || "";
      const defSubId = people?.subjects[0]?.id || "";
      const match = people?.assignments?.find(
        (a: any) => a.sectionId === defSecId && a.subjectId === defSubId
      );
      setForm({
        sectionId: defSecId,
        subjectId: defSubId,
        teacherUserId: match?.teacherUserId || teacherId || people?.teachers[0]?.id || "",
        dayOfWeek: "1",
        periodNumber: "1",
        startTime: "08:30",
        endTime: "09:15",
        roomNumber: "Room 101",
      });
    }
    setFormOpen(true);
  };

  const openSubstitute = (timetableEntryId = "", eventDate = "", impactNote = "") => {
    setError("");
    setForm({ timetableEntryId, eventDate, impactNote });
    setSuggestions([]);
    setSearchedSuggestions(false);
    setSubFormOpen(true);
  };

  async function saveEntry(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { ...form, dayOfWeek: Number(form.dayOfWeek), periodNumber: Number(form.periodNumber) };
      if (editing) await updatePrincipalTimetableEntry(organizationId, editing.id, body);
      else await createPrincipalTimetableEntry(organizationId, body);
      await reload();
      setFormOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save timetable entry");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: string) {
    if (!window.confirm("Delete this timetable period?")) return;
    setError("");
    try {
      await deletePrincipalTimetableEntry(organizationId, id);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete timetable entry");
    }
  }

  async function findSuggestions() {
    setError("");
    setSuggestions([]);
    setSearchedSuggestions(false);
    try {
      setSuggestions(await getPrincipalSubstituteSuggestions(organizationId, form.timetableEntryId, form.eventDate));
      setSearchedSuggestions(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not find available teachers");
    }
  }

  async function saveSubstitute(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await assignPrincipalSubstitute(organizationId, {
        timetableEntryId: form.timetableEntryId,
        eventDate: form.eventDate,
        substituteTeacherUserId: form.substituteTeacherUserId,
        impactNote: form.impactNote ?? "",
      });
      await reload();
      setSubFormOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not assign substitute");
    } finally {
      setSaving(false);
    }
  }

  // KPIs
  const facultyCount = new Set(entries.map((e) => e.teacher_user_id)).size;
  const sectionsCovered = new Set(entries.map((e) => e.section_id)).size;
  const uncoveredCount = data?.uncovered?.length ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
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
              Timetable Entries
            </span>
            <Clock size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{entries.length}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              Weekly Scheduled Periods
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
              Faculty Allocated
            </span>
            <Users size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{facultyCount}</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Teachers with Timetable Loads
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
              Classes Covered
            </span>
            <Layers size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{sectionsCovered}</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Sections with Active Master Grid
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
              Substitution Needed
            </span>
            <AlertCircle size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>{uncoveredCount}</div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              Uncovered Faculty Absences
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

      {/* Sub Navigation Strip & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "academic", label: "Master Academic Grid" },
            { id: "teacher", label: "Teacher Timetable" },
            { id: "class", label: "Class Timetable" },
            { id: "substitutions", label: "Substitutions & Cover" },
          ].map((t) => {
            const isActive = currentView === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setCurrentView(t.id as View);
                  onTabChange?.(t.id);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: isActive ? "#0c1e33" : "#e4e6e9",
                  background: isActive ? "#0c1e33" : "#ffffff",
                  color: isActive ? "#ffffff" : "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => openEntry(null)}
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
          <Plus size={14} /> Add Timetable Period
        </button>
      </div>

      {/* Filter bars if in teacher or class views */}
      {currentView === "teacher" && (
        <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e4e6e9", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Filter by Faculty:</span>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#ffffff", maxWidth: "100%" }}
          >
            <option value="">All Faculty</option>
            {people?.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || t.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentView === "class" && (
        <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e4e6e9", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Filter by Class:</span>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#ffffff", maxWidth: "100%" }}
          >
            <option value="">All Classes</option>
            {people?.sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Timetable Ledger */}
      {currentView !== "substitutions" && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: "750px", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px", position: "sticky", left: 0, background: "#f8fafc", zIndex: 3, boxShadow: "2px 0 4px rgba(0,0,0,0.04)" }}>Day</th>
                <th style={{ padding: "12px 16px" }}>Period</th>
                <th style={{ padding: "12px 16px" }}>Time</th>
                <th style={{ padding: "12px 16px" }}>Class</th>
                <th style={{ padding: "12px 16px" }}>Subject</th>
                <th style={{ padding: "12px 16px" }}>Teacher</th>
                <th style={{ padding: "12px 16px" }}>Room</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No timetable periods mapped for this selection.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b", position: "sticky", left: 0, background: "#ffffff", zIndex: 2, boxShadow: "2px 0 4px rgba(0,0,0,0.04)" }}>{days[entry.day_of_week - 1]}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>Period {entry.period_number}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>
                      {entry.start_time} – {entry.end_time}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                      {entry.programName} - {entry.sectionName}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#0c1e33", fontWeight: 600 }}>{entry.subjectName}</td>
                    <td style={{ padding: "12px 16px", color: "#334155" }}>{entry.teacherName}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{entry.room_number || "—"}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => openEntry(entry)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #e4e6e9",
                            background: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#0c1e33",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #fee2e2",
                            background: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#dc2626",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Substitutions View */}
      {currentView === "substitutions" && data && (() => {
        const uncovered = data.uncovered ?? [];
        const substitutions = data.substitutions ?? [];
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Uncovered Absences */}
            <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Uncovered Faculty Absences</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>Periods requiring substitute educator coverage today.</p>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: uncovered.length > 0 ? "#fee2e2" : "#dcfce7", color: uncovered.length > 0 ? "#991b1b" : "#166534" }}>
                  {uncovered.length} periods open
                </span>
              </div>

              <table style={{ width: "100%", minWidth: "650px", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                    <th style={{ padding: "12px 16px" }}>Date</th>
                    <th style={{ padding: "12px 16px" }}>Period</th>
                    <th style={{ padding: "12px 16px" }}>Class & Subject</th>
                    <th style={{ padding: "12px 16px" }}>Absent Faculty</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {uncovered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#15803d", fontWeight: 600 }}>
                        All periods are fully covered. No teacher substitutions required.
                      </td>
                    </tr>
                  ) : (
                    uncovered.map((item) => (
                      <tr key={`${item.timetableEntryId}-${item.eventDate}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{item.eventDate}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>Period {item.periodNumber}</td>
                        <td style={{ padding: "12px 16px", color: "#1e293b", fontWeight: 600 }}>
                          {item.programName} - {item.sectionName} · {item.subjectName}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#991b1b", fontWeight: 600 }}>{item.originalTeacher}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => openSubstitute(item.timetableEntryId, item.eventDate)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "#0c1e33",
                              color: "#ffffff",
                              fontSize: "11px",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Assign Substitute
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Assigned Substitutions Log */}
            <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Confirmed Substitute Assignments</h3>
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>History of assigned coverage for leave periods.</p>
              </div>

              <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                    <th style={{ padding: "12px 16px" }}>Date</th>
                    <th style={{ padding: "12px 16px" }}>Period</th>
                    <th style={{ padding: "12px 16px" }}>Class / Subject</th>
                    <th style={{ padding: "12px 16px" }}>Absent Teacher</th>
                    <th style={{ padding: "12px 16px" }}>Substitute Assigned</th>
                    <th style={{ padding: "12px 16px" }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {substitutions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                        No substitute assignments recorded.
                      </td>
                    </tr>
                  ) : (
                    substitutions.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{item.eventDate}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>Period {item.periodNumber}</td>
                        <td style={{ padding: "12px 16px", color: "#1e293b" }}>
                          {item.programName} - {item.sectionName} · {item.subjectName}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{item.originalTeacher}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#166534" }}>{item.substituteTeacher}</td>
                        <td style={{ padding: "12px 16px", color: "#475569" }}>{item.impactNote || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Conflict Matrix */}
      <ConflictMatrix entries={entries} />

      {/* Add / Edit Entry Modal */}
      {formOpen && (
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
              maxWidth: "500px",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0c1e33", margin: 0 }}>
                {editing ? "Edit Timetable Period" : "Add Timetable Period"}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveEntry} style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Class *</label>
                  <select
                    required
                    value={form.sectionId ?? ""}
                    onChange={(e) => {
                      const newSec = e.target.value;
                      const match = people?.assignments?.find(
                        (a: any) => a.sectionId === newSec && a.subjectId === form.subjectId
                      );
                      setForm((prev) => ({
                        ...prev,
                        sectionId: newSec,
                        ...(match?.teacherUserId ? { teacherUserId: match.teacherUserId } : {}),
                      }));
                    }}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  >
                    <option value="">Select class</option>
                    {people?.sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Subject *</label>
                  <select
                    required
                    value={form.subjectId ?? ""}
                    onChange={(e) => {
                      const newSub = e.target.value;
                      const match = people?.assignments?.find(
                        (a: any) => a.sectionId === form.sectionId && a.subjectId === newSub
                      );
                      setForm((prev) => ({
                        ...prev,
                        subjectId: newSub,
                        ...(match?.teacherUserId ? { teacherUserId: match.teacherUserId } : {}),
                      }));
                    }}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  >
                    <option value="">Select subject</option>
                    {people?.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>
                    Faculty Member *
                  </label>
                  {(() => {
                    const match = people?.assignments?.find(
                      (a: any) => a.sectionId === form.sectionId && a.subjectId === form.subjectId
                    );
                    if (!match) return null;
                    const isPrimary = form.teacherUserId === match.teacherUserId;
                    return (
                      <span style={{ fontSize: "11px", color: isPrimary ? "#059669" : "#b45309", fontWeight: 600 }}>
                        {isPrimary ? (
                          `Primary: ${match.teacherName}`
                        ) : (
                          <span>
                            Primary: {match.teacherName}{" "}
                            <button
                              type="button"
                              onClick={() => field("teacherUserId", match.teacherUserId)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#0284c7",
                                textDecoration: "underline",
                                cursor: "pointer",
                                fontSize: "11px",
                                padding: 0,
                                fontWeight: 600,
                              }}
                            >
                              (Use)
                            </button>
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </div>
                <select
                  required
                  value={form.teacherUserId ?? ""}
                  onChange={(e) => field("teacherUserId", e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                >
                  <option value="">Select teacher</option>
                  {people?.teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name || t.email}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Day of Week *</label>
                  <select
                    required
                    value={form.dayOfWeek ?? ""}
                    onChange={(e) => field("dayOfWeek", e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  >
                    <option value="">Select day</option>
                    {days.map((day, index) => (
                      <option key={day} value={index + 1}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Period Number (1-8) *</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    required
                    value={form.periodNumber ?? ""}
                    onChange={(e) => field("periodNumber", e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Start Time *</label>
                  <input
                    type="time"
                    required
                    value={form.startTime ?? ""}
                    onChange={(e) => field("startTime", e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>End Time *</label>
                  <input
                    type="time"
                    required
                    value={form.endTime ?? ""}
                    onChange={(e) => field("endTime", e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Room Number</label>
                <input
                  placeholder="e.g. Science Lab 2"
                  value={form.roomNumber ?? ""}
                  onChange={(e) => field("roomNumber", e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
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
                  {saving ? "Saving…" : "Save Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Substitute Assignment Modal */}
      {subFormOpen && (
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
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0c1e33", margin: 0 }}>Assign Substitute Teacher</h2>
              <button
                type="button"
                onClick={() => setSubFormOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveSubstitute} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Date *</label>
                <input
                  type="date"
                  required
                  value={form.eventDate ?? ""}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, eventDate: e.target.value, timetableEntryId: "", substituteTeacherUserId: "" }));
                    setSuggestions([]);
                    setSearchedSuggestions(false);
                  }}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Timetable Period *</label>
                <select
                  required
                  value={form.timetableEntryId ?? ""}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, timetableEntryId: e.target.value, substituteTeacherUserId: "" }));
                    setSuggestions([]);
                    setSearchedSuggestions(false);
                  }}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                >
                  <option value="">Select period</option>
                  {entries
                    .filter((entry) => !form.eventDate || entry.day_of_week === (new Date(`${form.eventDate}T12:00:00Z`).getUTCDay() || 7))
                    .map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {days[entry.day_of_week - 1]} · Period {entry.period_number} · {entry.programName} - {entry.sectionName} · {entry.teacherName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  disabled={!form.eventDate || !form.timetableEntryId}
                  onClick={findSuggestions}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "#f1f5f9",
                    border: "1px solid #e4e6e9",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0c1e33",
                    cursor: "pointer",
                  }}
                >
                  Find Available Teachers
                </button>
              </div>

              {suggestions.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Available Substitute *</label>
                  <select
                    required
                    value={form.substituteTeacherUserId ?? ""}
                    onChange={(e) => field("substituteTeacherUserId", e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  >
                    <option value="">Select available teacher</option>
                    {suggestions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name || s.email}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Academic Impact Note</label>
                <textarea
                  rows={2}
                  value={form.impactNote ?? ""}
                  onChange={(e) => field("impactNote", e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSubFormOpen(false)}
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
                  disabled={saving || !form.substituteTeacherUserId}
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
                  {saving ? "Saving…" : "Confirm Substitute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
