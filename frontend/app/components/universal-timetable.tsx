"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  X,
  Building,
  User,
  BookOpen,
  MapPin,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import {
  getSchoolAdminTimetable,
  createSchoolAdminTimetable,
  updateSchoolAdminTimetable,
  deleteSchoolAdminTimetable,
  getSchoolAdminAcademics,
  getSchoolAdminTeachers,
  getPrincipalTimetable,
  createPrincipalTimetableEntry,
  updatePrincipalTimetableEntry,
  deletePrincipalTimetableEntry,
  getTeacherTodayTimetable,
  getTeacherWeeklyTimetable,
  getStudentTimetable,
} from "../edops-api";

export interface UniversalTimetableProps {
  organizationId: string;
  role: "school_admin" | "principal" | "teacher" | "student";
  activeViewMode?: "class" | "teacher" | "room" | "today" | "weekly";
  onViewModeChange?: (mode: string) => void;
  onTakeAttendance?: (sectionId?: string, periodNumber?: number, classSection?: string) => void;
  onLogLesson?: (classSection?: string, sectionId?: string, periodInfo?: string) => void;
}

export function UniversalTimetable({
  organizationId,
  role,
  activeViewMode,
  onViewModeChange,
  onTakeAttendance,
  onLogLesson,
}: UniversalTimetableProps) {
  const canEdit = role === "school_admin" || role === "principal";
  const isMasterView = role === "school_admin" || role === "principal";

  // Mode: for master views (class/teacher/room), for individual (today/weekly)
  const [masterViewMode, setMasterViewMode] = useState<"class" | "teacher" | "room">(
    activeViewMode === "teacher" || activeViewMode === "room" ? activeViewMode : "class"
  );
  const [individualViewMode, setIndividualViewMode] = useState<"today" | "weekly">(
    activeViewMode === "today" ? "today" : "weekly"
  );

  useEffect(() => {
    if (activeViewMode) {
      if (activeViewMode === "class" || activeViewMode === "teacher" || activeViewMode === "room") {
        setMasterViewMode(activeViewMode);
      } else if (activeViewMode === "today" || activeViewMode === "weekly") {
        setIndividualViewMode(activeViewMode);
      }
    }
  }, [activeViewMode]);

  // Master View States
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  // Individual View States (Teacher & Student)
  const [teacherToday, setTeacherToday] = useState<any>(null);
  const [teacherWeekly, setTeacherWeekly] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit (School Admin & Principal)
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
    startTime: "08:30",
    endTime: "09:15",
    roomNumber: "Room 101",
  });

  const loadData = async () => {
    if (!organizationId) return;
    setLoading(true);

    try {
      if (isMasterView) {
        // Master Timetable Flow (School Admin & Principal)
        const [ttData, acadData, teachData] = await Promise.all([
          role === "principal"
            ? getPrincipalTimetable(organizationId).catch(() => getSchoolAdminTimetable(organizationId))
            : getSchoolAdminTimetable(organizationId),
          getSchoolAdminAcademics(organizationId).catch(() => null),
          getSchoolAdminTeachers(organizationId).catch(() => []),
        ]);

        if (ttData?.conflicts) {
          setConflicts(ttData.conflicts);
        } else {
          setConflicts([]);
        }

        if (acadData?.sections && Array.isArray(acadData.sections)) {
          setSections(acadData.sections);
          setSelectedSectionId((curr) =>
            acadData.sections.some((s: any) => s.id === curr) ? curr : acadData.sections[0]?.id || ""
          );
        }
        if (acadData?.subjects) setSubjects(acadData.subjects);
        if (acadData?.assignments && Array.isArray(acadData.assignments)) {
          setAssignments(acadData.assignments);
        }

        if (Array.isArray(teachData) && teachData.length > 0) {
          setTeachers(teachData);
          setSelectedTeacherId((curr) =>
            teachData.some((t: any) => (t.id || t.userId) === curr)
              ? curr
              : teachData[0]?.id || teachData[0]?.userId || ""
          );
        }

        if (ttData?.entries && Array.isArray(ttData.entries)) {
          const mappedSlots = ttData.entries.map((e: any) => ({
            id: e.id,
            raw: e,
            day:
              ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
                Number(e.day_of_week) - 1
              ] || "Monday",
            period: e.period_number,
            time: `${e.start_time ? e.start_time.slice(0, 5) : ""} - ${
              e.end_time ? e.end_time.slice(0, 5) : ""
            }`,
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

          const rooms = Array.from(
            new Set(mappedSlots.map((s: any) => s.room?.trim()).filter(Boolean))
          ) as string[];
          if (rooms.length > 0) {
            setSelectedRoom((curr) => (rooms.includes(curr) ? curr : rooms[0]));
          }
        }
      } else if (role === "teacher") {
        // Teacher Flow (strictly their own timetable)
        const [todayRes, weeklyRes] = await Promise.all([
          getTeacherTodayTimetable(organizationId).catch(() => ({ day: "today", slots: [] })),
          getTeacherWeeklyTimetable(organizationId).catch(() => ({
            totalWeeklyPeriods: 0,
            maxWeeklyPeriods: 30,
            days: [],
            grid: {},
          })),
        ]);
        setTeacherToday(todayRes);
        setTeacherWeekly(weeklyRes);
      } else if (role === "student") {
        // Student Flow (strictly their own class timetable)
        const studentRes = await getStudentTimetable(organizationId).catch(() => null);
        setStudentData(studentRes);
      }
    } catch (err) {
      console.error("Timetable loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId, role]);

  // Modal Handlers (for School Admin & Principal)
  const openCreateModal = () => {
    setEditingSlot(null);
    setFormError(null);
    const defaultSecId = selectedSectionId || sections[0]?.id || "";
    const defaultSubId = subjects[0]?.id || "";
    const match = assignments.find(
      (a: any) => a.sectionId === defaultSecId && a.subjectId === defaultSubId
    );
    const defaultTeachId = match?.teacherUserId || selectedTeacherId || teachers[0]?.id || "";

    setForm({
      sectionId: defaultSecId,
      subjectId: defaultSubId,
      teacherUserId: defaultTeachId,
      dayOfWeek: 1,
      periodNumber: 1,
      startTime: "08:30",
      endTime: "09:15",
      roomNumber: "Room 101",
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
      startTime: slot.raw?.start_time ? slot.raw.start_time.slice(0, 5) : "08:30",
      endTime: slot.raw?.end_time ? slot.raw.end_time.slice(0, 5) : "09:15",
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
      if (role === "principal") {
        if (editingSlot) {
          await updatePrincipalTimetableEntry(organizationId, editingSlot.id, form);
        } else {
          await createPrincipalTimetableEntry(organizationId, form);
        }
      } else {
        if (editingSlot) {
          await updateSchoolAdminTimetable(organizationId, editingSlot.id, form);
        } else {
          await createSchoolAdminTimetable(organizationId, form);
        }
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(
        err?.message || "Failed to save timetable period. Ensure teacher has no scheduling conflicts."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!organizationId) return;
    if (!confirm("Are you sure you want to delete this timetable period?")) return;
    try {
      if (role === "principal") {
        await deletePrincipalTimetableEntry(organizationId, slotId);
      } else {
        await deleteSchoolAdminTimetable(organizationId, slotId);
      }
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete slot");
    }
  };

  // Matrix Calculation for Master Views
  const availableRooms = useMemo(
    () => Array.from(new Set(slots.map((s) => s.room?.trim()).filter(Boolean))).sort(),
    [slots]
  );
  const standardDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const hasSaturday = slots.some((s) => s.day === "Saturday");
  const masterDays = hasSaturday ? [...standardDays, "Saturday"] : standardDays;
  const slotPeriods = slots.map((s) => Number(s.period)).filter((p) => !isNaN(p) && p > 0);
  const maxPeriod = slotPeriods.length > 0 ? Math.max(8, ...slotPeriods) : 8;
  const masterPeriods = Array.from({ length: maxPeriod }, (_, i) => {
    const pNum = i + 1;
    const matchingSlot = slots.find((s) => Number(s.period) === pNum);
    return {
      period: pNum,
      time: matchingSlot?.time || "",
    };
  });

  const scheduledSectionsCount = useMemo(
    () => new Set(slots.map((s) => s.sectionId).filter(Boolean)).size,
    [slots]
  );
  const assignedTeachersCount = useMemo(
    () => new Set(slots.map((s) => s.teacherUserId).filter(Boolean)).size,
    [slots]
  );

  // Individual Views Data Preparation
  const todayDayName = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  }, []);

  const studentScheduleToday = useMemo(() => {
    if (!studentData?.weeklySchedule) return [];
    const dayKey = todayDayName.toLowerCase();
    return studentData.weeklySchedule[dayKey] || [];
  }, [studentData, todayDayName]);

  const teacherScheduleToday = useMemo(() => {
    return teacherToday?.slots || [];
  }, [teacherToday]);

  return (
    <div
      className="edops-universal-timetable"
      style={{
        display: "grid",
        gap: "20px",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* TOP 4 PASTEL KPI METRIC CARDS (148px Standard) */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: "12px",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {isMasterView ? (
          <>
            {/* 1. Total Weekly Periods (Pastel Violet) */}
            <article
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "148px",
                padding: "20px",
                background: "#e1d2ff",
                border: "1px solid #e1d2ff",
                borderRadius: "10px",
                color: "#4a0e8f",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Total Weekly Periods
                </span>
                <Calendar size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
                {slots.length}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Instructional &amp; lab slots</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Active</span>
              </div>
            </article>

            {/* 2. Sections Scheduled (Pastel Mint) */}
            <article
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "148px",
                padding: "20px",
                background: "#ccefbf",
                border: "1px solid #ccefbf",
                borderRadius: "10px",
                color: "#1a5c0a",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Sections Scheduled
                </span>
                <BookOpen size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
                {scheduledSectionsCount}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Across registered class rosters</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Matrices</span>
              </div>
            </article>

            {/* 3. Assigned Faculty (Pastel Sky) */}
            <article
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "148px",
                padding: "20px",
                background: "#bae5f5",
                border: "1px solid #bae5f5",
                borderRadius: "10px",
                color: "#0a5a7a",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Assigned Faculty
                </span>
                <User size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
                {assignedTeachersCount}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Instructional load balanced</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Teachers</span>
              </div>
            </article>

            {/* 4. Conflict Alarms (Pastel Coral) */}
            <article
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "148px",
                padding: "20px",
                background: conflicts.length > 0 ? "#ffd6d6" : "#ffd8c7",
                border: `1px solid ${conflicts.length > 0 ? "#ffd6d6" : "#ffd8c7"}`,
                borderRadius: "10px",
                color: conflicts.length > 0 ? "#7a1a1a" : "#782a00",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Conflict Alarms
                </span>
                <AlertTriangle size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: conflicts.length > 0 ? "#7a1a1a" : "#782a00" }}>
                {conflicts.length}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>
                  {conflicts.length === 0 ? "Zero double-booking detected" : "Overlapping assignments detected"}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Health</span>
              </div>
            </article>
          </>
        ) : role === "teacher" ? (
          <>
            {/* Teacher Cards */}
            <article style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "148px", padding: "20px", background: "#e1d2ff", border: "1px solid #e1d2ff", borderRadius: "10px", color: "#4a0e8f" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Weekly Load</span>
                <Calendar size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
                {teacherWeekly?.totalWeeklyPeriods ?? 0}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Assigned Periods</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Max {teacherWeekly?.maxWeeklyPeriods || 30}</span>
              </div>
            </article>

            <article style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "148px", padding: "20px", background: "#ccefbf", border: "1px solid #ccefbf", borderRadius: "10px", color: "#1a5c0a" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Today's Classes</span>
                <Clock size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
                {teacherScheduleToday.length}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>{todayDayName}</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Schedule</span>
              </div>
            </article>

            <article style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "148px", padding: "20px", background: "#bae5f5", border: "1px solid #bae5f5", borderRadius: "10px", color: "#0a5a7a" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Completed Today</span>
                <CheckCircle2 size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
                {teacherScheduleToday.filter((s: any) => s.attendanceTaken || s.status === "completed").length}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Attendance finalized</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Periods</span>
              </div>
            </article>

            <article style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "148px", padding: "20px", background: "#ffd8c7", border: "1px solid #ffd8c7", borderRadius: "10px", color: "#782a00" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending Attendance</span>
                <Sparkles size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#782a00" }}>
                {teacherScheduleToday.filter((s: any) => !s.attendanceTaken && s.status !== "completed").length}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Action needed</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Queue</span>
              </div>
            </article>
          </>
        ) : (
          <>
            {/* Student Cards */}
            <article style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "148px", padding: "20px", background: "#e1d2ff", border: "1px solid #e1d2ff", borderRadius: "10px", color: "#4a0e8f" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Weekly Periods</span>
                <Calendar size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
                {Object.values(studentData?.weeklySchedule || {}).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0) as number}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Class curriculum slots</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Enrolled</span>
              </div>
            </article>

            <article style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "148px", padding: "20px", background: "#ccefbf", border: "1px solid #ccefbf", borderRadius: "10px", color: "#1a5c0a" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Today's Classes</span>
                <Clock size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
                {studentScheduleToday.length}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>{todayDayName}</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Live Roster</span>
              </div>
            </article>

            <article style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "148px", padding: "20px", background: "#bae5f5", border: "1px solid #bae5f5", borderRadius: "10px", color: "#0a5a7a" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Academic Day</span>
                <BookOpen size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "32px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
                {todayDayName.slice(0, 3)}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Instruction in session</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Active</span>
              </div>
            </article>

            <article style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "148px", padding: "20px", background: "#ffd8c7", border: "1px solid #ffd8c7", borderRadius: "10px", color: "#782a00" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Timetable Status</span>
                <CheckCircle2 size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "32px", fontWeight: 700, lineHeight: 1, color: "#782a00" }}>
                Synced
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Verified by Principal</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Official</span>
              </div>
            </article>
          </>
        )}
      </section>

      {/* Conflict Alert Banner (for Master Views) */}
      {isMasterView && (
        conflicts.length > 0 ? (
          <div
            style={{
              background: "#FEE2E2",
              border: "1px solid #FCA5A5",
              borderRadius: "10px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={20} color="#DC2626" />
              <div>
                <b style={{ color: "#991B1B", fontSize: "13px" }}>
                  Scheduling Conflict Detected: {conflicts[0].firstSection} vs {conflicts[0].secondSection}
                </b>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#B91C1C" }}>
                  Teacher {conflicts[0].teacherEmail} allocated to multiple sections simultaneously in Period {conflicts[0].periodNumber}.
                </p>
              </div>
            </div>
            <button
              onClick={() => alert("Please adjust the conflicting slot period or assign an alternate faculty member.")}
              style={{
                padding: "6px 12px",
                background: "#991B1B",
                color: "#FFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Resolve
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: "10px",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <CheckCircle2 size={18} color="#047857" />
            <span style={{ color: "#047857", fontSize: "13px", fontWeight: 700 }}>
              {loading
                ? "Loading timetable..."
                : slots.length
                ? "No recorded scheduling conflicts. All period allocations verified."
                : "No timetable entries saved."}
            </span>
          </div>
        )
      )}

      {/* Main Timetable Matrix Panel */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #e4e6e9",
          borderRadius: "10px",
          padding: "clamp(14px, 3vw, 20px)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header and Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>
              {isMasterView
                ? "Master Timetable Schedule & Conflict Monitor"
                : role === "teacher"
                ? "My Instructional Schedule"
                : "Class Academic Timetable"}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
              {isMasterView
                ? "Detects teacher overlap, room double-booking, and period capacity"
                : role === "teacher"
                ? "View your assigned classes, subject rooms, and daily teaching schedule"
                : "View daily periods, instructors, and weekly classroom schedule"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {/* View Switchers */}
            {isMasterView ? (
              <>
                <div
                  style={{
                    display: "inline-flex",
                    background: "#f8fafc",
                    border: "1px solid #e4e6e9",
                    borderRadius: "6px",
                    padding: "2px",
                    gap: "2px",
                  }}
                >
                  {(["class", "teacher", "room"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setMasterViewMode(mode);
                        onViewModeChange?.(mode);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        background: masterViewMode === mode ? "#0c1e33" : "transparent",
                        color: masterViewMode === mode ? "#ffffff" : "#4a5568",
                        textTransform: "capitalize",
                      }}
                    >
                      {mode} View
                    </button>
                  ))}
                </div>

                {masterViewMode === "class" && (
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "12px",
                      background: "#FFFFFF",
                      color: "#101828",
                      outline: "none",
                    }}
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

                {masterViewMode === "teacher" && (
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "12px",
                      background: "#FFFFFF",
                      color: "#101828",
                      outline: "none",
                    }}
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

                {masterViewMode === "room" && (
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "12px",
                      background: "#FFFFFF",
                      color: "#101828",
                      outline: "none",
                    }}
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

                {canEdit && (
                  <button
                    onClick={openCreateModal}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      background: "#0c1e33",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Plus size={14} /> Add Period
                  </button>
                )}
              </>
            ) : (
              /* Teacher & Student Individual View Switcher (Today vs Weekly) */
              <div
                style={{
                  display: "inline-flex",
                  background: "#f8fafc",
                  border: "1px solid #e4e6e9",
                  borderRadius: "6px",
                  padding: "2px",
                  gap: "2px",
                }}
              >
                <button
                  onClick={() => {
                    setIndividualViewMode("today");
                    onViewModeChange?.("today");
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    background: individualViewMode === "today" ? "#0c1e33" : "transparent",
                    color: individualViewMode === "today" ? "#ffffff" : "#4a5568",
                  }}
                >
                  Today ({todayDayName})
                </button>
                <button
                  onClick={() => {
                    setIndividualViewMode("weekly");
                    onViewModeChange?.("weekly");
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    background: individualViewMode === "weekly" ? "#0c1e33" : "transparent",
                    color: individualViewMode === "weekly" ? "#ffffff" : "#4a5568",
                  }}
                >
                  Weekly Schedule
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RENDER VIEW: TODAY TIMELINE (for Teacher / Student) */}
        {!isMasterView && individualViewMode === "today" && (
          <div style={{ width: "100%" }}>
            {role === "teacher" ? (
              teacherScheduleToday.length === 0 ? (
                <div
                  style={{
                    padding: "36px 20px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px dashed #cbd5e1",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  No teaching periods scheduled for today ({todayDayName}). Enjoy your prep time!
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {teacherScheduleToday.map((slot: any, idx: number) => {
                    const isDone = slot.attendanceTaken || slot.status === "completed";
                    const isActive = slot.status === "active";

                    return (
                      <div
                        key={slot.id || idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px 20px",
                          background: isActive ? "#F0FDF4" : "#FFFFFF",
                          border: isActive ? "1.5px solid #86EFAC" : "1px solid #E2E8F0",
                          borderRadius: "10px",
                          gap: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "8px",
                              background: isActive ? "#DCFCE7" : "#F1F5F9",
                              color: isActive ? "#166534" : "#0C1E33",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "11px",
                            }}
                          >
                            <span>P{slot.period}</span>
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: 700, fontSize: "14px", color: "#0C1E33" }}>
                                {slot.subject}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  background: "#E0F2FE",
                                  color: "#0369A1",
                                }}
                              >
                                {slot.classSection || "Class"}
                              </span>
                              {isActive && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    background: "#22C55E",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  LIVE NOW
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px", display: "flex", gap: "12px" }}>
                              <span>🕒 {slot.startTime} - {slot.endTime}</span>
                              {slot.room && <span>📍 {slot.room}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          {isDone ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#166534",
                                background: "#DCFCE7",
                                padding: "6px 12px",
                                borderRadius: "6px",
                              }}
                            >
                              <CheckCircle2 size={14} /> Completed
                            </span>
                          ) : (
                            <>
                              {onTakeAttendance && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onTakeAttendance(slot.sectionId, slot.period, slot.classSection)
                                  }
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    background: "#0C1E33",
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  <CheckSquare size={13} /> Take Attendance
                                </button>
                              )}
                              {onLogLesson && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onLogLesson(
                                      slot.classSection,
                                      slot.sectionId,
                                      slot.period ? `Period ${slot.period} (${slot.startTime || ''} - ${slot.endTime || ''})`.replace(' - )', ')') : undefined
                                    )
                                  }
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    background: "#FFFFFF",
                                    color: "#0C1E33",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  <BookOpen size={13} /> Log Lesson
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Student Today View */
              studentScheduleToday.length === 0 ? (
                <div
                  style={{
                    padding: "36px 20px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px dashed #cbd5e1",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  No classes scheduled for today ({todayDayName}). Take time to revise or complete assignments!
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {studentScheduleToday.map((slot: any, idx: number) => (
                    <div
                      key={slot.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "8px",
                            background: "#F1F5F9",
                            color: "#0C1E33",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          P{slot.period}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "#0C1E33" }}>
                            {slot.subject}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px", display: "flex", gap: "12px" }}>
                            <span>🕒 {slot.time}</span>
                            <span>👤 {slot.teacher}</span>
                            <span>📍 {slot.room || "Classroom"}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "4px",
                          background: "#F1F5F9",
                          color: "#475569",
                        }}
                      >
                        Scheduled
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* RENDER VIEW: UNIFIED HORIZONTAL WEEKLY MATRIX */}
        {(isMasterView || individualViewMode === "weekly") && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#64748b",
                marginBottom: "8px",
                flexWrap: "wrap",
                gap: "4px",
              }}
            >
              <span>↔ Scroll horizontally to view all periods</span>
              <span>
                {isMasterView
                  ? `${masterPeriods.length} Periods • ${masterDays.length} Days`
                  : role === "teacher"
                  ? `${teacherWeekly?.periods?.length || 8} Periods • Monday - Saturday`
                  : "8 Periods • Monday - Saturday"}
              </span>
            </div>

            <div
              style={{
                width: "100%",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                borderRadius: "8px",
                border: "1px solid #e4e6e9",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "850px",
                  borderCollapse: "collapse",
                  fontSize: "12.5px",
                  textAlign: "center",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #e4e6e9", background: "#f8fafc" }}>
                    <th
                      style={{
                        padding: "10px",
                        width: "100px",
                        minWidth: "90px",
                        textAlign: "left",
                        position: "sticky",
                        left: 0,
                        background: "#f8fafc",
                        zIndex: 3,
                        boxShadow: "2px 0 4px rgba(0,0,0,0.04)",
                      }}
                    >
                      Day
                    </th>
                    {(isMasterView
                      ? masterPeriods
                      : (role === "teacher" ? teacherWeekly?.periods : [1, 2, 3, 4, 5, 6, 7, 8]) || [1, 2, 3, 4, 5, 6, 7, 8]
                    ).map((p: any, idx: number) => {
                      const pNum = typeof p === "object" ? p.period : p;
                      const timeStr = typeof p === "object" ? p.time : "";

                      return (
                        <th key={idx} style={{ padding: "8px 6px", minWidth: "130px" }}>
                          <b>Period {pNum}</b>
                          {timeStr && (
                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 500 }}>
                              {timeStr}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(isMasterView
                    ? masterDays
                    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                  ).map((dayName) => {
                    const dayKey = dayName.toLowerCase();

                    return (
                      <tr key={dayName} style={{ borderBottom: "1px solid #f4f6f7" }}>
                        <td
                          style={{
                            padding: "12px 10px",
                            textAlign: "left",
                            fontWeight: 700,
                            color: "#0c1e33",
                            background: "#f8fafc",
                            position: "sticky",
                            left: 0,
                            zIndex: 2,
                            boxShadow: "2px 0 4px rgba(0,0,0,0.04)",
                          }}
                        >
                          {dayName}
                        </td>

                        {(isMasterView
                          ? masterPeriods
                          : (role === "teacher" ? teacherWeekly?.periods : [1, 2, 3, 4, 5, 6, 7, 8]) || [1, 2, 3, 4, 5, 6, 7, 8]
                        ).map((p: any, pIdx: number) => {
                          const pNum = typeof p === "object" ? p.period : p;

                          if (isMasterView) {
                            // Find matching master slot
                            const slot = slots.find((s) => {
                              if (s.day !== dayName || Number(s.period) !== Number(pNum)) return false;
                              if (masterViewMode === "class") {
                                return selectedSectionId ? s.sectionId === selectedSectionId : true;
                              }
                              if (masterViewMode === "teacher") {
                                return selectedTeacherId ? s.teacherUserId === selectedTeacherId : true;
                              }
                              if (masterViewMode === "room") {
                                return selectedRoom ? s.room.trim().toLowerCase() === selectedRoom.trim().toLowerCase() : true;
                              }
                              return true;
                            });

                            if (!slot) {
                              return (
                                <td key={pIdx} style={{ padding: "8px", color: "#94a3b8" }}>
                                  <span style={{ fontSize: "11px", opacity: 0.5 }}>— Free —</span>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={pIdx}
                                style={{
                                  padding: "8px",
                                  background: slot.hasConflict ? "#FEE2E2" : "#f8fafc",
                                  border: slot.hasConflict ? "1px solid #FCA5A5" : "1px solid #e4e6e9",
                                  borderRadius: "6px",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
                                  <b style={{ color: slot.hasConflict ? "#991B1B" : "#0c1e33", fontSize: "12px", textAlign: "left" }}>
                                    {slot.subject}
                                  </b>
                                  {canEdit && (
                                    <div style={{ display: "flex", gap: "4px" }}>
                                      <button
                                        type="button"
                                        onClick={() => openEditModal(slot)}
                                        title="Edit Slot"
                                        style={{ border: "none", background: "transparent", color: "#64748B", cursor: "pointer", padding: "1px" }}
                                      >
                                        <Edit2 size={11} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSlot(slot.id)}
                                        title="Delete Slot"
                                        style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer", padding: "1px" }}
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {masterViewMode === "class" && (
                                  <>
                                    <div style={{ fontSize: "10.5px", color: "#64748b", textAlign: "left", marginTop: "2px" }}>
                                      {slot.teacherName}
                                    </div>
                                    <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>
                                      {slot.room || "No room"}
                                    </div>
                                  </>
                                )}

                                {masterViewMode === "teacher" && (
                                  <>
                                    <div style={{ fontSize: "10.5px", color: "#0c1e33", fontWeight: 700, textAlign: "left", marginTop: "2px" }}>
                                      {slot.className || `Section ${slot.section}`}
                                    </div>
                                    <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>
                                      {slot.room || "No room"}
                                    </div>
                                  </>
                                )}

                                {masterViewMode === "room" && (
                                  <>
                                    <div style={{ fontSize: "10.5px", color: "#0c1e33", fontWeight: 700, textAlign: "left", marginTop: "2px" }}>
                                      {slot.className || `Section ${slot.section}`}
                                    </div>
                                    <div style={{ fontSize: "10px", color: "#64748b", textAlign: "left" }}>
                                      {slot.teacherName}
                                    </div>
                                  </>
                                )}
                              </td>
                            );
                          } else if (role === "teacher") {
                            // Teacher weekly slot
                            const daySlots = teacherWeekly?.grid?.[dayKey] || [];
                            const slot = daySlots.find((s: any) => Number(s.period) === Number(pNum));

                            if (!slot) {
                              return (
                                <td key={pIdx} style={{ padding: "8px", color: "#94a3b8" }}>
                                  <span style={{ fontSize: "11px", opacity: 0.5 }}>— Free —</span>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={pIdx}
                                style={{
                                  padding: "8px",
                                  background: "#f8fafc",
                                  border: "1px solid #e4e6e9",
                                  borderRadius: "6px",
                                }}
                              >
                                <b style={{ color: "#0c1e33", fontSize: "12px", textAlign: "left", display: "block" }}>
                                  {slot.subject}
                                </b>
                                <div style={{ fontSize: "10.5px", color: "#0c1e33", fontWeight: 600, textAlign: "left", marginTop: "2px" }}>
                                  {slot.class}
                                </div>
                                {slot.room && (
                                  <div style={{ fontSize: "10px", color: "#64748b", textAlign: "left" }}>
                                    {slot.room}
                                  </div>
                                )}
                              </td>
                            );
                          } else {
                            // Student weekly slot
                            const daySlots = studentData?.weeklySchedule?.[dayKey] || [];
                            const slot = daySlots.find((s: any) => Number(s.period) === Number(pNum));

                            if (!slot) {
                              return (
                                <td key={pIdx} style={{ padding: "8px", color: "#94a3b8" }}>
                                  <span style={{ fontSize: "11px", opacity: 0.5 }}>— Free —</span>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={pIdx}
                                style={{
                                  padding: "8px",
                                  background: "#f8fafc",
                                  border: "1px solid #e4e6e9",
                                  borderRadius: "6px",
                                }}
                              >
                                <b style={{ color: "#0c1e33", fontSize: "12px", textAlign: "left", display: "block" }}>
                                  {slot.subject}
                                </b>
                                <div style={{ fontSize: "10.5px", color: "#64748b", textAlign: "left", marginTop: "2px" }}>
                                  {slot.teacher}
                                </div>
                                <div style={{ fontSize: "10px", color: "#64748b", textAlign: "left" }}>
                                  {slot.room || "Classroom"}
                                </div>
                              </td>
                            );
                          }
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Period Modal (School Admin & Principal only) */}
      {modalOpen && canEdit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.4)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>
                {editingSlot ? "Edit Timetable Period" : "Add Timetable Period"}
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ border: "none", background: "transparent", color: "#64748B", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} style={{ padding: "20px", display: "grid", gap: "14px" }}>
              {formError && (
                <div
                  style={{
                    padding: "10px 12px",
                    background: "#FEE2E2",
                    border: "1px solid #FCA5A5",
                    borderRadius: "6px",
                    color: "#991B1B",
                    fontSize: "12px",
                  }}
                >
                  {formError}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Class / Section *
                </label>
                <select
                  value={form.sectionId}
                  onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12.5px",
                    outline: "none",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="">Select Class Section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.programName ? `${s.programName} - ${s.name}` : `Class ${s.name}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Subject *
                </label>
                <select
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12.5px",
                    outline: "none",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} {sub.code ? `(${sub.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Instructor / Teacher *
                </label>
                <select
                  value={form.teacherUserId}
                  onChange={(e) => setForm({ ...form, teacherUserId: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12.5px",
                    outline: "none",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="">Select Faculty Teacher</option>
                  {teachers.map((t) => {
                    const id = t.id || t.userId;
                    return (
                      <option key={id} value={id}>
                        {t.name || t.email} ({t.department || "Faculty"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Day of Week *
                  </label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "12.5px",
                      outline: "none",
                      background: "#FFFFFF",
                    }}
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Period Number *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={form.periodNumber}
                    onChange={(e) => setForm({ ...form, periodNumber: Number(e.target.value) })}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Room / Classroom Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 102, Physics Lab, Ground Floor"
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12.5px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    background: "#F1F5F9",
                    color: "#334155",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#0C1E33",
                    color: "#FFFFFF",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Saving..." : editingSlot ? "Save Changes" : "Create Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
