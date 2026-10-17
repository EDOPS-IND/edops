"use client";

import React, { useState, useEffect } from "react";
import { TimetableSlot } from "./types";
import {
  getSchoolAdminTimetable,
  createSchoolAdminTimetable,
  updateSchoolAdminTimetable,
  deleteSchoolAdminTimetable,
  getSchoolAdminAcademics,
  getSchoolAdminTeachers,
} from "../edops-api";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  Trash2,
  Edit2,
  X,
  Building,
  User,
  BookOpen,
} from "lucide-react";

export function TimetablePane({ organizationId }: { organizationId?: string }) {
  const [viewMode, setViewMode] = useState<"class" | "teacher" | "room">("class");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Metadata for dropdowns
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Raw entries from backend
  const [rawEntries, setRawEntries] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    sectionId: "",
    subjectId: "",
    teacherUserId: "",
    dayOfWeek: 1,
    periodNumber: 1,
    startTime: "",
    endTime: "",
    roomNumber: "",
  });

  const loadData = () => {
    if (!organizationId) return;
    setLoading(true);
    Promise.all([
      getSchoolAdminTimetable(organizationId),
      getSchoolAdminAcademics(organizationId),
      getSchoolAdminTeachers(organizationId),
    ])
      .then(([ttData, acadData, teachData]) => {
        if (ttData?.conflicts) {
          setConflicts(ttData.conflicts);
        } else {
          setConflicts([]);
        }

        if (acadData?.sections && Array.isArray(acadData.sections)) {
          setSections(acadData.sections);
          setSelectedSectionId(current => acadData.sections.some((s: any) => s.id === current) ? current : (acadData.sections[0]?.id || ""));
        }
        if (acadData?.subjects) setSubjects(acadData.subjects);
        if (Array.isArray(teachData) && teachData.length > 0) {
          setTeachers(teachData);
          setSelectedTeacherId(current => teachData.some((t: any) => (t.id || t.userId) === current) ? current : (teachData[0]?.id || teachData[0]?.userId || ""));
        }

        if (ttData?.entries && Array.isArray(ttData.entries)) {
          setRawEntries(ttData.entries);
          const mappedSlots = ttData.entries.map((e: any) => ({
            id: e.id,
            raw: e,
            day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(e.day_of_week) - 1] || "Monday",
            period: e.period_number,
            time: `${e.start_time ? e.start_time.slice(0, 5) : ""} - ${e.end_time ? e.end_time.slice(0, 5) : ""}`,
            grade: e.programName || "Class",
            section: e.sectionName || "",
            sectionId: e.section_id,
            className: e.programName ? `${e.programName} - ${e.sectionName}` : `Class ${e.sectionName}`,
            subject: e.subjectName || "Subject",
            subjectId: e.subject_id,
            teacherName: e.teacherName || (e.teacherEmail ? e.teacherEmail.split("@")[0] : "Teacher"),
            teacherUserId: e.teacher_user_id,
            room: e.room_number || "",
          }));
          setSlots(mappedSlots);

          const rooms = Array.from(new Set(mappedSlots.map((s: any) => s.room?.trim()).filter(Boolean))) as string[];
          if (rooms.length > 0) {
            setSelectedRoom(current => rooms.includes(current) ? current : rooms[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const openCreateModal = () => {
    setEditingSlot(null);
    setFormError(null);
    const defaultSecId = sections[0]?.id || "";
    const defaultSubId = subjects[0]?.id || "";
    const defaultTeachId = teachers[0]?.id || "";
    setForm({
      sectionId: defaultSecId,
      subjectId: defaultSubId,
      teacherUserId: defaultTeachId,
      dayOfWeek: 1,
      periodNumber: 1,
      startTime: "",
      endTime: "",
      roomNumber: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (slot: any) => {
    setEditingSlot(slot);
    setFormError(null);
    setForm({
      sectionId: slot.raw?.section_id || slot.sectionId || "",
      subjectId: slot.raw?.subject_id || slot.subjectId || "",
      teacherUserId: slot.raw?.teacher_user_id || slot.teacherUserId || "",
      dayOfWeek: Number(slot.raw?.day_of_week) || 1,
      periodNumber: Number(slot.raw?.period_number) || slot.period || 1,
      startTime: slot.raw?.start_time || "08:30",
      endTime: slot.raw?.end_time || "09:15",
      roomNumber: slot.raw?.room_number || slot.room || "Room 101",
    });
    setModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingSlot) {
        await updateSchoolAdminTimetable(organizationId, editingSlot.id, form);
      } else {
        await createSchoolAdminTimetable(organizationId, form);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save timetable period. Ensure teacher has no scheduling conflicts.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!organizationId) return;
    if (!confirm("Are you sure you want to delete this timetable period?")) return;
    try {
      await deleteSchoolAdminTimetable(organizationId, slotId);
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete slot");
    }
  };

  const availableRooms = Array.from(new Set(slots.map((s) => s.room?.trim()).filter(Boolean))).sort() as string[];
  const standardDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hasSaturday = slots.some((s) => s.day === "Saturday");
  const days = hasSaturday ? [...standardDays, "Saturday"] : standardDays;
  const slotPeriods = slots.map((s) => Number(s.period)).filter((p) => !isNaN(p) && p > 0);
  const maxPeriod = slotPeriods.length > 0 ? Math.max(8, ...slotPeriods) : 8;
  const periods = Array.from({ length: maxPeriod }, (_, i) => {
    const pNum = i + 1;
    const matchingSlot = slots.find((s) => Number(s.period) === pNum);
    return {
      period: pNum,
      time: matchingSlot?.time || "",
      isBreak: false,
    };
  });

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Conflict Alert Banner (§32) */}
      {conflicts.length > 0 ? (
        <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={20} color="#DC2626" />
            <div>
              <b style={{ color: "#991B1B", fontSize: "13px" }}>Scheduling Conflict Detected: {conflicts[0].firstSection} vs {conflicts[0].secondSection}</b>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#B91C1C" }}>
                Teacher {conflicts[0].teacherEmail} allocated to multiple sections simultaneously in Period {conflicts[0].periodNumber}.
              </p>
            </div>
          </div>
          <button style={{ padding: "6px 12px", background: "#991B1B", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            Auto-Resolve
          </button>
        </div>
      ) : (
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "10px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2 size={18} color="#064E3B" />
          <span style={{ color: "#064E3B", fontSize: "13px", fontWeight: 700 }}>{loading ? "Loading timetable…" : slots.length ? "No recorded scheduling conflicts." : "No timetable entries saved."}</span>
        </div>
      )}

      <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
        {/* Header and Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Master Timetable Schedule & Conflict Monitor</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Detects teacher overlap, room double-booking, and period capacity</p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "flex", background: "#FAF8F5", border: "1px solid #E2DDD5", borderRadius: "6px", padding: "2px" }}>
              <button
                onClick={() => setViewMode("class")}
                style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "class" ? "#064E3B" : "transparent", color: viewMode === "class" ? "#F8E7C9" : "#064E3B" }}
              >
                Class View
              </button>
              <button
                onClick={() => setViewMode("teacher")}
                style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "teacher" ? "#064E3B" : "transparent", color: viewMode === "teacher" ? "#F8E7C9" : "#064E3B" }}
              >
                Teacher View
              </button>
              <button
                onClick={() => setViewMode("room")}
                style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "room" ? "#064E3B" : "transparent", color: viewMode === "room" ? "#F8E7C9" : "#064E3B" }}
              >
                Room View
              </button>
            </div>

            {viewMode === "class" && (
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #E2DDD5", fontSize: "12px", background: "#FFFFFF", color: "#101828", outline: "none" }}
              >
                {sections.length > 0 ? (
                  sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.programName ? `${s.programName} - ${s.name}` : `Class ${s.name}`}
                    </option>
                  ))
                ) : (
                  <option value="">No classes available</option>
                )}
              </select>
            )}

            {viewMode === "teacher" && (
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #E2DDD5", fontSize: "12px", background: "#FFFFFF", color: "#101828", outline: "none" }}
              >
                {teachers.length > 0 ? (
                  teachers.map((t) => {
                    const id = t.id || t.userId;
                    return (
                      <option key={id} value={id}>
                        {t.name || t.email} ({t.department || "Faculty"})
                      </option>
                    );
                  })
                ) : (
                  <option value="">No teachers available</option>
                )}
              </select>
            )}

            {viewMode === "room" && (
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #E2DDD5", fontSize: "12px", background: "#FFFFFF", color: "#101828", outline: "none" }}
              >
                {availableRooms.length > 0 ? (
                  availableRooms.map((r) => (
                    <option key={r} value={r}>
                      Room: {r}
                    </option>
                  ))
                ) : (
                  <option value="">No rooms scheduled</option>
                )}
              </select>
            )}

            <button
              onClick={openCreateModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                background: "#064E3B",
                color: "#F8E7C9",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Add Period
            </button>
          </div>
        </div>

        {/* Weekly Timetable Matrix */}
        {!loading && slots.length === 0 && <p style={{ fontSize: "13px", color: "var(--muted)", margin: "16px 0" }}>No timetable entries saved yet. Click "+ Add Period" to create schedules.</p>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "center" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2DDD5", background: "#FAF8F5" }}>
                <th style={{ padding: "10px", width: "100px", textAlign: "left" }}>Day</th>
                {periods.map((p, idx) => (
                  <th key={idx} style={{ padding: "8px 6px", minWidth: "130px" }}>
                    <b>{p.isBreak ? p.period : `Period ${p.period}`}</b>
                    <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 500 }}>{p.time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day} style={{ borderBottom: "1px solid #FAF8F5" }}>
                  <td style={{ padding: "12px 10px", textAlign: "left", fontWeight: 700, color: "#064E3B", background: "#FAF8F5" }}>
                    {day}
                  </td>
                  {periods.map((p, pIdx) => {
                    if (p.isBreak) {
                      return (
                        <td key={pIdx} style={{ background: "#FDF9F0", color: "var(--muted)", fontSize: "11px", fontStyle: "italic" }}>
                          {p.period}
                        </td>
                      );
                    }
                    const slot = slots.find((s) => {
                      if (s.day !== day || Number(s.period) !== Number(p.period)) return false;
                      if (viewMode === "class") {
                        return selectedSectionId ? s.sectionId === selectedSectionId : true;
                      }
                      if (viewMode === "teacher") {
                        return selectedTeacherId ? s.teacherUserId === selectedTeacherId : true;
                      }
                      if (viewMode === "room") {
                        return selectedRoom ? s.room.trim().toLowerCase() === selectedRoom.trim().toLowerCase() : true;
                      }
                      return true;
                    });

                    if (!slot) {
                      return (
                        <td key={pIdx} style={{ padding: "8px", color: "var(--muted)" }}>
                          <span style={{ fontSize: "11px", opacity: 0.5 }}>— Free —</span>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={pIdx}
                        style={{
                          padding: "8px",
                          background: slot.hasConflict ? "#FEE2E2" : "#FAF8F5",
                          border: slot.hasConflict ? "1px solid #FCA5A5" : "1px solid #E2DDD5",
                          borderRadius: "6px",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
                          <b style={{ color: slot.hasConflict ? "#991B1B" : "#064E3B", fontSize: "12px", textAlign: "left" }}>
                            {slot.subject}
                          </b>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              onClick={() => openEditModal(slot)}
                              title="Edit Slot"
                              style={{ border: "none", background: "transparent", color: "#64748B", cursor: "pointer", padding: "1px" }}
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              title="Delete Slot"
                              style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer", padding: "1px" }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {viewMode === "class" && (
                          <>
                            <div style={{ fontSize: "10.5px", color: "var(--muted)", textAlign: "left", marginTop: "2px" }}>{slot.teacherName}</div>
                            <div style={{ fontSize: "10px", color: slot.hasConflict ? "#DC2626" : "var(--muted)", fontWeight: 600, textAlign: "left" }}>
                              {slot.room || "No room assigned"}
                            </div>
                          </>
                        )}

                        {viewMode === "teacher" && (
                          <>
                            <div style={{ fontSize: "10.5px", color: "#064E3B", fontWeight: 700, textAlign: "left", marginTop: "2px" }}>
                              {slot.className || `Section ${slot.section}`}
                            </div>
                            <div style={{ fontSize: "10px", color: slot.hasConflict ? "#DC2626" : "var(--muted)", fontWeight: 600, textAlign: "left" }}>
                              {slot.room || "No room assigned"}
                            </div>
                          </>
                        )}

                        {viewMode === "room" && (
                          <>
                            <div style={{ fontSize: "10.5px", color: "#064E3B", fontWeight: 700, textAlign: "left", marginTop: "2px" }}>
                              {slot.className || `Section ${slot.section}`}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--muted)", textAlign: "left" }}>
                              {slot.teacherName}
                            </div>
                          </>
                        )}

                        {slot.hasConflict && (
                          <div style={{ fontSize: "9.5px", color: "#991B1B", fontWeight: 700, marginTop: "2px", textAlign: "left" }}>
                            COLLISION
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit Timetable Period */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "12px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2DDD5", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF8F5" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#064E3B" }}>
                {editingSlot ? "Edit Timetable Period" : "Add Timetable Period"}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {formError && (
                <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "6px", padding: "10px 14px", color: "#991B1B", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Class / Section</label>
                  <select
                    value={form.sectionId}
                    onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  >
                    <option value="">Select section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.programName ? `${s.programName} - ${s.name}` : s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Day of Week</label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                    required
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Period Number</label>
                  <select
                    value={form.periodNumber}
                    onChange={(e) => setForm({ ...form, periodNumber: Number(e.target.value) })}
                    required
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Subject</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  >
                    <option value="">Select subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Assigned Teacher</label>
                <select
                  value={form.teacherUserId}
                  onChange={(e) => setForm({ ...form, teacherUserId: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name || t.email} ({t.department || "Faculty"})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Room</label>
                  <input
                    type="text"
                    value={form.roomNumber}
                    onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                    placeholder="Room 101"
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px", paddingTop: "12px", borderTop: "1px solid #E2DDD5" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#475569", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#064E3B", color: "#F8E7C9", fontSize: "12px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? "Saving..." : editingSlot ? "Update Period" : "Save Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
