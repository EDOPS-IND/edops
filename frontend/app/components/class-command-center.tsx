"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Search,
  X,
  Check,
  Grid,
  List,
  UserCheck,
  BarChart3,
  Calendar,
  ExternalLink,
  Clock,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import {
  getPrincipalSectionOverview,
  updatePrincipalClassTeacher,
  assignPrincipalTeacher,
  allocatePrincipalSectionSubject,
  removePrincipalSectionSubject,
  getSchoolAdminSectionOverview,
  updateSchoolAdminClassTeacher,
  assignSchoolAdminSectionTeacher,
  removeSchoolAdminSectionSubject,
  getPrincipalStudent360,
  getSchoolAdminStudent360,
  createSchoolAdminBroadcast,
  createSchoolAdminDiscipline,
} from "../edops-api";
import { ClassSubjectAllocationModal } from "./class-subject-allocation-modal";

export interface SectionSummary {
  id: string;
  name?: string;
  sectionName?: string;
  programName?: string;
  className?: string;
  code?: string;
  capacity?: number;
  enrolledCount?: number;
  studentCount?: number;
  isOverCapacity?: boolean;
  classTeacherUserId?: string | null;
  classTeacherName?: string | null;
  classTeacherEmail?: string | null;
  subjectsCount?: number;
  attendanceRate?: number | null;
}

interface ClassCommandCenterProps {
  organizationId: string;
  role: "principal" | "school-admin";
  sections: SectionSummary[];
  programs?: Array<{ id: string; name: string }>;
  onRefresh?: () => void;
  onOpenStudent?: (studentId: string) => void;
}

export function ClassSectionManager({
  organizationId,
  role,
  sections = [],
  programs = [],
  onRefresh,
  onOpenStudent,
}: ClassCommandCenterProps) {
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Available grade tabs
  const gradeList = React.useMemo(() => {
    const set = new Set<string>();
    sections.forEach((s) => {
      const g = s.programName?.trim() || s.className?.trim() || "Other";
      set.add(g);
    });
    return Array.from(set);
  }, [sections]);

  // Filtered sections
  const filteredSections = sections.filter((s) => {
    const prog = (s.programName || s.className || "").trim();
    const matchesGrade =
      selectedGrade === "all" ||
      prog === selectedGrade ||
      (selectedGrade.startsWith("Class ") && prog === selectedGrade.replace("Class ", "")) ||
      (prog.startsWith("Class ") && prog.replace("Class ", "") === selectedGrade);
    const query = searchQuery.toLowerCase().trim();
    const secName = s.name || s.sectionName || "";
    const matchesSearch =
      !query ||
      secName.toLowerCase().includes(query) ||
      (s.code && s.code.toLowerCase().includes(query)) ||
      prog.toLowerCase().includes(query) ||
      (s.classTeacherName && s.classTeacherName.toLowerCase().includes(query));
    return matchesGrade && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* 1. Header Toolbar with Filter Pills, Search & View Mode */}
      <div
        className="edops-class-section-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "#ffffff",
          padding: "14px 18px",
          borderRadius: "10px",
          border: "1px solid #e4e6e9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: 1 }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0c1e33", display: "flex", alignItems: "center", gap: "6px" }}>
            <Layers size={15} /> Grade:
          </span>
          <button
            type="button"
            onClick={() => setSelectedGrade("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: selectedGrade === "all" ? "1px solid #0c1e33" : "1px solid #e4e6e9",
              background: selectedGrade === "all" ? "#0c1e33" : "#f8fafc",
              color: selectedGrade === "all" ? "#ffffff" : "#475569",
              fontSize: "12px",
              fontWeight: selectedGrade === "all" ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            All Classes ({sections.length})
          </button>
          {gradeList.map((g) => {
            const count = sections.filter((s) => (s.programName?.trim() || s.className?.trim()) === g).length;
            const isSelected = selectedGrade === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: isSelected ? "1px solid #0c1e33" : "1px solid #e4e6e9",
                  background: isSelected ? "#0c1e33" : "#f8fafc",
                  color: isSelected ? "#ffffff" : "#475569",
                  fontSize: "12px",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{g}</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "10px",
                    background: isSelected ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                    color: isSelected ? "#ffffff" : "#64748b",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="edops-class-section-controls" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Search Input */}
          <div className="edops-class-section-search" style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search section or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "7px 12px 7px 30px",
                borderRadius: "6px",
                border: "1px solid #e4e6e9",
                fontSize: "12.5px",
                width: "210px",
                outline: "none",
                background: "#f8fafc",
              }}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="edops-view-mode-toggle" style={{ display: "flex", background: "#f1f5f9", borderRadius: "6px", padding: "2px", border: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{
                all: "unset",
                padding: "6px 10px",
                borderRadius: "5px",
                cursor: "pointer",
                background: viewMode === "grid" ? "#ffffff" : "transparent",
                color: viewMode === "grid" ? "#0c1e33" : "#64748b",
                fontWeight: viewMode === "grid" ? 700 : 500,
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: viewMode === "grid" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <Grid size={13} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                all: "unset",
                padding: "6px 10px",
                borderRadius: "5px",
                cursor: "pointer",
                background: viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#0c1e33" : "#64748b",
                fontWeight: viewMode === "table" ? 700 : 500,
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: viewMode === "table" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <List size={13} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid Cards View */}
      {viewMode === "grid" ? (
        filteredSections.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e4e6e9",
              borderRadius: "10px",
              padding: "48px 20px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            <Layers size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#0c1e33" }}>No Class Sections Found</p>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px" }}>No sections match your active grade filter or search query.</p>
          </div>
        ) : (
          <div className="edops-class-section-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(295px, 1fr))", gap: "16px" }}>
            {filteredSections.map((sec) => {
              const enrolled = Number(sec.enrolledCount ?? sec.studentCount ?? 0);
              const capacity = Number(sec.capacity || 40);
              const capPct = Math.min(100, capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0);
              const progName = sec.programName || sec.className || "Standard";
              const secName = sec.name || sec.sectionName || "";
              const codeDisplay = sec.code || `${progName.replace(/^Class\s*/i, "")} ${secName}`.trim();
              const isOver = enrolled > capacity;

              return (
                <div
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e4e6e9",
                    borderRadius: "10px",
                    padding: "18px 20px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "220px",
                    gap: "14px",
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 2px rgba(12, 30, 51, 0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#0c1e33";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(12,30,51,0.08)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e4e6e9";
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(12, 30, 51, 0.04)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Top Bar: Section Badge & Title */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          padding: "3px 9px",
                          borderRadius: "6px",
                          background: "#0c1e33",
                          color: "#ffffff",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {codeDisplay}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: isOver ? "#fee2e2" : "#f1f5f9",
                          color: isOver ? "#991b1b" : "#475569",
                        }}
                      >
                        {enrolled} / {capacity} Enrolled
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: 700, color: "#0c1e33" }}>
                      {progName} — Section {secName}
                    </h4>
                  </div>

                  {/* Class Teacher Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "7px",
                      background: sec.classTeacherName ? "#f0fdf4" : "#fefce8",
                      border: sec.classTeacherName ? "1px solid #bbf7d0" : "1px solid #fef08a",
                    }}
                  >
                    <UserCheck size={14} style={{ color: sec.classTeacherName ? "#16a34a" : "#ca8a04", flexShrink: 0 }} />
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: sec.classTeacherName ? "#15803d" : "#a16207", display: "block" }}>
                        Class Teacher
                      </span>
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: sec.classTeacherName ? "#166534" : "#854d0e",
                        }}
                      >
                        {sec.classTeacherName || "Not Assigned"}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                      <span>Class Capacity</span>
                      <span style={{ fontWeight: 700, color: isOver ? "#dc2626" : "#0c1e33" }}>{capPct}%</span>
                    </div>
                    <div style={{ height: "6px", width: "100%", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${capPct}%`,
                          background: isOver ? "#ef4444" : "#059669",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Stats & Action link */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9",
                      fontSize: "11.5px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: (sec.subjectsCount ?? 0) > 0 ? "#f0fdf4" : "#fefce8",
                          color: (sec.subjectsCount ?? 0) > 0 ? "#166534" : "#854d0e",
                        }}
                        title="Subjects allocated specifically to this class"
                      >
                        {sec.subjectsCount ?? 0} {sec.subjectsCount === 1 ? "Subject" : "Subjects"}
                      </span>
                      <span style={{ color: "#64748b" }} title="Section Attendance">
                        {sec.attendanceRate != null ? `${sec.attendanceRate}% Attn` : "—"}
                      </span>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 700, color: "#0c1e33" }}>
                      Command Center <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* 3. Table View */
        <div className="edops-class-section-table" style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Code</th>
                <th style={{ padding: "12px 16px" }}>Class / Program</th>
                <th style={{ padding: "12px 16px" }}>Section</th>
                <th style={{ padding: "12px 16px" }}>Class Teacher</th>
                <th style={{ padding: "12px 16px" }}>Capacity</th>
                <th style={{ padding: "12px 16px" }}>Subjects</th>
                <th style={{ padding: "12px 16px" }}>Attendance</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSections.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "28px", textAlign: "center", color: "#64748b" }}>
                    No class sections match the active filter.
                  </td>
                </tr>
              ) : (
                filteredSections.map((sec) => {
                  const enrolled = Number(sec.enrolledCount ?? sec.studentCount ?? 0);
                  const capacity = Number(sec.capacity || 40);
                  const progName = sec.programName || sec.className || "Standard";
                  const secName = sec.name || sec.sectionName || "";
                  const codeDisplay = sec.code || `${progName.replace(/^Class\s*/i, "")} ${secName}`.trim();
                  return (
                    <tr
                      key={sec.id}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0c1e33" }}>{codeDisplay}</td>
                      <td style={{ padding: "12px 16px", color: "#1e293b", fontWeight: 600 }}>{progName}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>Section {secName}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: sec.classTeacherName ? "#f0fdf4" : "#fefce8",
                            color: sec.classTeacherName ? "#166534" : "#854d0e",
                          }}
                        >
                          {sec.classTeacherName ? sec.classTeacherName : "Not Assigned"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>
                        {enrolled} / {capacity}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{sec.subjectsCount ?? 0} mapped</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#047857" }}>
                        {sec.attendanceRate != null ? `${sec.attendanceRate}%` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setActiveSectionId(sec.id)}
                          style={{
                            background: "#0c1e33",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 14px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Command Center →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Interactive Class Command Center Modal */}
      {activeSectionId && (
        <ClassCommandCenterModal
          organizationId={organizationId}
          role={role}
          sectionId={activeSectionId}
          onClose={() => setActiveSectionId(null)}
          onRefresh={() => {
            if (onRefresh) onRefresh();
          }}
          onOpenStudent={onOpenStudent}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CLASS COMMAND CENTER DRAWER WITH INLINE STUDENT 360 TRANSITION
// ─────────────────────────────────────────────────────────────

interface ModalProps {
  organizationId: string;
  role: "principal" | "school-admin";
  sectionId: string;
  onClose: () => void;
  onRefresh?: () => void;
  onOpenStudent?: (studentId: string) => void;
}

export function ClassCommandCenterModal({
  organizationId,
  role,
  sectionId,
  onClose,
  onRefresh,
  onOpenStudent,
}: ModalProps) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalTab, setModalTab] = useState<"faculty" | "students" | "syllabus">("faculty");
  const [selectedClassTeacher, setSelectedClassTeacher] = useState<string>("");
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  // INLINE STUDENT 360 TRANSITION (Prevents stacked modals)
  const [activeStudent, setActiveStudent] = useState<{ id: string; name: string } | null>(null);
  const [student360Data, setStudent360Data] = useState<any>(null);
  const [student360Loading, setStudent360Loading] = useState(false);
  const [student360Tab, setStudent360Tab] = useState<"overview" | "academics" | "attendance" | "learning_outcomes">("overview");

  // Subject assignment inline editing state
  const [assigningSubjectId, setAssigningSubjectId] = useState<string | null>(null);
  const [selectedSubjectTeacher, setSelectedSubjectTeacher] = useState<string>("");
  const [savingSubjectTeacher, setSavingSubjectTeacher] = useState(false);
  const [showAllocateSubjectModal, setShowAllocateSubjectModal] = useState<boolean>(false);

  // Keyboard accessibility and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeStudent) {
          setActiveStudent(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeStudent, onClose]);

  // Load live section overview
  const loadOverview = async () => {
    try {
      setLoading(true);
      const data =
        role === "principal"
          ? await getPrincipalSectionOverview(organizationId, sectionId)
          : await getSchoolAdminSectionOverview(organizationId, sectionId);
      setDetail(data);
      setSelectedClassTeacher(data?.section?.classTeacherUserId || "");
    } catch {
      setNotice({ text: "Failed to load class information.", ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [organizationId, sectionId]);

  // When activeStudent changes, fetch live Student 360 dossier
  useEffect(() => {
    if (!activeStudent?.id) {
      setStudent360Data(null);
      return;
    }
    let cancelled = false;
    setStudent360Loading(true);
    const fetch360 =
      role === "principal"
        ? getPrincipalStudent360(organizationId, activeStudent.id)
        : getSchoolAdminStudent360(organizationId, activeStudent.id);

    fetch360
      .then((res) => {
        if (!cancelled) setStudent360Data(res);
      })
      .catch(() => {
        if (!cancelled) setStudent360Data(null);
      })
      .finally(() => {
        if (!cancelled) setStudent360Loading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeStudent, organizationId, role]);

  // Attendance Warning Action
  const [warningSent, setWarningSent] = useState(false);
  const [sendingWarning, setSendingWarning] = useState(false);

  const handleSendAttendanceWarning = async () => {
    if (!organizationId || !activeStudent) return;
    setSendingWarning(true);
    try {
      const sName = activeStudent.name || "Student";
      const sRoll = (student360Data?.profile?.rollNo || (activeStudent as any).rollNumber) ? `Roll #${student360Data?.profile?.rollNo || (activeStudent as any).rollNumber}` : "";
      const classSec = detail?.section?.name || detail?.name || "Class Section";
      const absentCount = student360Data?.attendance?.absentDays ?? 0;
      const attRate = student360Data?.attendance?.overallPercentage ?? null;
      const rateText = attRate != null ? `${attRate}%` : "below statutory mark";

      await createSchoolAdminBroadcast(organizationId, {
        title: `Statutory Attendance Warning: ${sName} (${classSec})`,
        message: `Official attendance breach warning for ${sName} (${classSec}${sRoll ? ` · ${sRoll}` : ""}). Current attendance is ${rateText} with ${absentCount} recorded absences. Under CBSE regulations, a minimum of 75% attendance is required for term and examination clearance.`,
        channels: ["in_app", "email", "sms"],
        targetAudience: "parents",
        priority: "urgent",
      });

      await createSchoolAdminDiscipline(organizationId, {
        studentUserId: activeStudent.id,
        studentName: sName,
        classSection: classSec,
        incidentType: "Attendance Defaulter Warning",
        severity: attRate != null && attRate < 60 ? "severe" : "moderate",
        description: `Official attendance breach warning issued to parent. Current rate: ${rateText} with ${absentCount} absence(s).`,
        actionTaken: "Attendance Warning Notice Issued to Parent",
        reportedByName: "School Administration",
        parentNotified: true,
      });

      setWarningSent(true);
      setTimeout(() => setWarningSent(false), 4000);
    } catch (err) {
      console.error("Failed to send attendance warning:", err);
    } finally {
      setSendingWarning(false);
    }
  };

  // Handle Save Class Teacher
  const handleSaveClassTeacher = async () => {
    try {
      setSavingTeacher(true);
      setNotice(null);
      const teacherId = selectedClassTeacher ? selectedClassTeacher : null;
      if (role === "principal") {
        await updatePrincipalClassTeacher(organizationId, sectionId, teacherId);
      } else {
        await updateSchoolAdminClassTeacher(organizationId, sectionId, teacherId);
      }
      setNotice({ text: "Class teacher designation updated successfully!", ok: true });
      await loadOverview();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setNotice({ text: err.message || "Failed to update class teacher.", ok: false });
    } finally {
      setSavingTeacher(false);
    }
  };

  // Handle Save Subject Teacher
  const handleSaveSubjectTeacher = async (subjectId: string, overrideTeacherId?: string) => {
    const teacherIdToAssign = overrideTeacherId || selectedSubjectTeacher;
    if (!teacherIdToAssign) return;
    try {
      setSavingSubjectTeacher(true);
      setNotice(null);
      if (role === "principal") {
        await assignPrincipalTeacher(organizationId, {
          sectionId,
          subjectId,
          teacherUserId: teacherIdToAssign,
        });
      } else {
        await assignSchoolAdminSectionTeacher(organizationId, sectionId, {
          subjectId,
          teacherUserId: teacherIdToAssign,
        });
      }
      setNotice({ text: "Faculty allocated to subject successfully!", ok: true });
      setAssigningSubjectId(null);
      setSelectedSubjectTeacher("");
      await loadOverview();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setNotice({ text: err.message || "Failed to assign subject teacher.", ok: false });
    } finally {
      setSavingSubjectTeacher(false);
    }
  };

  // Handle Allocate Subject to Class (existing or new)
  const handleAllocateSubject = async (data: {
    subjectId?: string;
    teacherUserId?: string | null;
    newSubjectName?: string;
    newSubjectCode?: string;
  }) => {
    try {
      setNotice(null);
      if (role === "principal") {
        await allocatePrincipalSectionSubject(organizationId, sectionId, data);
      } else {
        if (data.subjectId) {
          await assignSchoolAdminSectionTeacher(organizationId, sectionId, {
            subjectId: data.subjectId,
            teacherUserId: data.teacherUserId || null,
          });
        }
      }
      setNotice({ text: "Subject allocated to this class successfully!", ok: true });
      await loadOverview();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to allocate subject.");
    }
  };

  // Handle Remove / Unallocate Subject from Class
  const handleRemoveSubject = async (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${subjectName}" from this class section?`)) {
      return;
    }
    try {
      setNotice(null);
      if (role === "principal") {
        await removePrincipalSectionSubject(organizationId, sectionId, subjectId);
      } else {
        await removeSchoolAdminSectionSubject(organizationId, sectionId, subjectId);
      }
      setNotice({ text: `"${subjectName}" removed from this class section.`, ok: true });
      await loadOverview();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setNotice({ text: err?.message || "Failed to remove subject.", ok: false });
    }
  };

  const sec = detail?.section;
  const subjects = detail?.subjects || [];
  const students = detail?.students || [];
  const teachers = detail?.teachers || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(12, 30, 51, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (activeStudent) setActiveStudent(null);
          else onClose();
        }
      }}
    >
      <div
        className="edops-right-drawer"
        style={{
          background: "#ffffff",
          borderRadius: "14px 0 0 14px",
          width: "100%",
          maxWidth: "min(var(--edops-drawer-width), 94vw)",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-18px 0 45px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* ─── MODAL HEADER (Context-Aware for Class or Student) ─── */}
        <div
          className="edops-drawer-header"
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e4e6e9",
            background: "#faf8f5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {activeStudent ? (
            /* Student 360 Header with Back Button */
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setActiveStudent(null)}
                style={{
                  all: "unset",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "#ffffff",
                  border: "1px solid #ced8e5",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0c1e33",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              >
                <ArrowLeft size={14} /> Back to Class Roster
              </button>
              <div>
                <h3 id="class-modal-title" style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0c1e33" }}>
                  {activeStudent.name} — Student 360° Academic Dossier
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {sec?.code} • Section {sec?.name}
                </span>
              </div>
            </div>
          ) : (
            /* Class Overview Header */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: "#0c1e33",
                    color: "#ffffff",
                  }}
                >
                  {sec?.code || "Class Section"}
                </span>
                <h3 id="class-modal-title" style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0c1e33" }}>
                  {sec ? `${sec.programName || sec.className || "Class"} — Section ${sec.name || sec.sectionName || ""}` : "Class Command Center"}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                Academic Oversight • Capacity: {sec?.enrolledCount ?? sec?.studentCount ?? 0} / {sec?.capacity || 40} Enrolled • Total Subjects: {subjects.length}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Notice alert */}
        {notice && (
          <div
            style={{
              padding: "10px 24px",
              background: notice.ok ? "#ecfdf5" : "#fef2f2",
              borderBottom: notice.ok ? "1px solid #a7f3d0" : "1px solid #fecaca",
              color: notice.ok ? "#065f46" : "#991b1b",
              fontSize: "12.5px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {notice.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* ─── MODAL TABS (Rendered conditionally for Class or Student) ─── */}
        {!activeStudent ? (
          <div className="edops-drawer-tabs" style={{ display: "flex", borderBottom: "1px solid #e4e6e9", background: "#f8fafc", padding: "0 24px" }}>
            {[
              { id: "faculty", label: `Faculty & Class Teacher`, icon: <UserCheck size={14} /> },
              { id: "students", label: `Enrolled Students (${students.length})`, icon: <GraduationCap size={14} /> },
              { id: "syllabus", label: `Subject Progress (${subjects.length})`, icon: <BarChart3 size={14} /> },
            ].map((t) => {
              const active = modalTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setModalTab(t.id as any)}
                  style={{
                    all: "unset",
                    padding: "12px 18px",
                    fontSize: "13px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "#0c1e33" : "#64748b",
                    borderBottom: active ? "2px solid #0c1e33" : "2px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {t.icon} {t.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", borderBottom: "1px solid #e4e6e9", background: "#f8fafc", padding: "0 24px", overflowX: "auto" }}>
            {[
              { id: "overview", label: "Academic Snapshot" },
              { id: "academics", label: "Subject Breakdown" },
              { id: "attendance", label: "Attendance Record" },
              { id: "learning_outcomes", label: "Competencies & LOs" },
            ].map((t) => {
              const active = student360Tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStudent360Tab(t.id as any)}
                  style={{
                    all: "unset",
                    padding: "12px 18px",
                    fontSize: "13px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "#0c1e33" : "#64748b",
                    borderBottom: active ? "2px solid #0c1e33" : "2px solid transparent",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── MODAL BODY ─── */}
        <div className="edops-drawer-body" style={{ padding: "24px", overflowY: "auto", overflowX: "hidden", flex: 1, minWidth: 0 }}>
          {activeStudent ? (
            /* ═════════════════════════════════════════════════
               INLINE STUDENT 360 DOSSIER VIEW
            ═════════════════════════════════════════════════ */
            student360Loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ height: "76px", background: "#f1f5f9", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
                  ))}
                </div>
                <div style={{ height: "200px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              </div>
            ) : !student360Data ? (
              <div style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                <AlertTriangle size={32} style={{ margin: "0 auto 10px", color: "#d97706" }} />
                <p style={{ margin: 0, fontWeight: 700, color: "#0c1e33" }}>Student Records Awaiting Academic Session Data</p>
                <p style={{ margin: "4px 0 0", fontSize: "12.5px" }}>No historical marks or attendance recorded yet for this student.</p>
              </div>
            ) : (
              (() => {
                const sOverview = student360Data.overview || {};
                const sAcademics = student360Data.academics || [];
                const sAttendance = student360Data.attendance || {};
                const sLOs = student360Data.learningOutcomes || [];

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* 4 Metric Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Overall Assessment Avg</div>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: sOverview.overallAverage != null ? (sOverview.overallAverage < 60 ? "#dc2626" : "#0c1e33") : "#64748b", marginTop: "4px" }}>
                          {sOverview.overallAverage != null ? `${sOverview.overallAverage}%` : "—"}
                        </div>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Session Attendance</div>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: sOverview.attendanceRate != null ? (sOverview.attendanceRate < 75 ? "#dc2626" : "#15803d") : "#64748b", marginTop: "4px" }}>
                          {sOverview.attendanceRate != null ? `${sOverview.attendanceRate}%` : "—"}
                        </div>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Assignment Submission</div>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: sOverview.assignmentCompletion != null ? "#065f46" : "#64748b", marginTop: "4px" }}>
                          {sOverview.assignmentCompletion != null ? `${sOverview.assignmentCompletion}%` : "—"}
                        </div>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Academic Standing</div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0c1e33", marginTop: "8px" }}>
                          {sOverview.attentionCategory || "Good Standing"}
                        </div>
                      </div>
                    </div>

                    {/* Tab Views */}
                    {student360Tab === "overview" && (
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "18px", background: "#ffffff" }}>
                        <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>Student Dossier Highlights</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "12.5px" }}>
                          <div><span style={{ color: "#64748b" }}>Full Name:</span> <strong>{sOverview.name || activeStudent.name}</strong></div>
                          <div><span style={{ color: "#64748b" }}>Admission Number:</span> <strong>{sOverview.admissionNumber || "—"}</strong></div>
                          <div><span style={{ color: "#64748b" }}>Roll Number:</span> <strong>{sOverview.rollNumber || "—"}</strong></div>
                          <div><span style={{ color: "#64748b" }}>Parent / Guardian:</span> <strong>{sOverview.guardianName || "Not assigned"}</strong></div>
                          <div><span style={{ color: "#64748b" }}>Guardian Contact:</span> <strong>{sOverview.guardianPhone || "—"}</strong></div>
                          <div><span style={{ color: "#64748b" }}>Category:</span> <strong>{sOverview.category || "General"}</strong></div>
                        </div>
                      </div>
                    )}

                    {student360Tab === "academics" && (
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: 700 }}>
                              <th style={{ padding: "10px 14px" }}>Subject</th>
                              <th style={{ padding: "10px 14px" }}>Assigned Teacher</th>
                              <th style={{ padding: "10px 14px" }}>Average Score</th>
                              <th style={{ padding: "10px 14px" }}>Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sAcademics.length === 0 ? (
                              <tr>
                                <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                                  No subject scores recorded yet.
                                </td>
                              </tr>
                            ) : (
                              sAcademics.map((sub: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ padding: "11px 14px", fontWeight: 700, color: "#0c1e33" }}>{sub.subjectName}</td>
                                  <td style={{ padding: "11px 14px", color: "#475569" }}>{sub.teacherName || "Unassigned"}</td>
                                  <td style={{ padding: "11px 14px", fontWeight: 700, color: sub.averageScore != null ? (sub.averageScore < 60 ? "#dc2626" : "#0c1e33") : "#64748b" }}>
                                    {sub.averageScore != null ? `${sub.averageScore}%` : "—"}
                                  </td>
                                  <td style={{ padding: "11px 14px", color: "#64748b" }}>{sub.trend || "Stable"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {student360Tab === "attendance" && (
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "18px", background: "#ffffff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                          <div>
                            <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>Attendance Record</h4>
                            <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
                              Consolidated institutional presence for {activeStudent.name}.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleSendAttendanceWarning}
                            disabled={sendingWarning || warningSent}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "7px 14px",
                              borderRadius: "6px",
                              background: warningSent ? "#ECFDF5" : "#0c1e33",
                              color: warningSent ? "#047857" : "#FFFFFF",
                              border: warningSent ? "1px solid #A7F3D0" : "none",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: sendingWarning || warningSent ? "default" : "pointer",
                              fontFamily: "'Poppins', sans-serif",
                            }}
                          >
                            {warningSent ? (
                              <>
                                <CheckCircle2 size={13} />
                                Warning Sent ✓
                              </>
                            ) : sendingWarning ? (
                              "Dispatching..."
                            ) : (
                              <>
                                <AlertTriangle size={13} style={{ color: "#FBBF24" }} />
                                Send Attendance Warning to Parent
                              </>
                            )}
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px" }}>
                          <span style={{ padding: "6px 12px", borderRadius: "6px", background: "#f0fdf4", color: "#166534", fontWeight: 700 }}>
                            Present Days: {sAttendance.presentDays ?? "Recorded live"}
                          </span>
                          <span style={{ padding: "6px 12px", borderRadius: "6px", background: "#fef2f2", color: "#991b1b", fontWeight: 700 }}>
                            Absent Days: {sAttendance.absentDays ?? 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {student360Tab === "learning_outcomes" && (
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "18px", background: "#ffffff" }}>
                        <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>Curriculum Competencies</h4>
                        {sLOs.length === 0 ? (
                          <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                            No specific competency rubrics linked yet for this student.
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {sLOs.map((lo: any, idx: number) => (
                              <div key={idx} style={{ padding: "8px 12px", borderRadius: "6px", background: "#f8fafc", fontSize: "12.5px" }}>
                                <strong>{lo.outcome || lo.name}</strong>: {lo.status || "In Progress"}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()
            )
          ) : loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>Loading class details...</div>
            </div>
          ) : modalTab === "faculty" ? (
            /* TAB 1: Faculty & Class Teacher */
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              {/* Highlight Card: Class Teacher Assignment */}
              <div
                className="edops-class-teacher-card"
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <UserCheck size={16} style={{ color: "#16a34a" }} />
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#15803d", letterSpacing: "0.03em" }}>
                      Class Teacher Designation
                    </span>
                  </div>
                  <h4 style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 700, color: "#166534" }}>
                    {sec?.classTeacherName ? `Assigned to ${sec.classTeacherName}` : "No Class Teacher Currently Assigned"}
                  </h4>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#15803d" }}>
                    The Class Teacher monitors daily attendance, student health, and overall performance of {sec?.code || "this section"}.
                  </p>
                </div>

                <div className="edops-class-teacher-controls" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <select
                    value={selectedClassTeacher}
                    onChange={(e) => setSelectedClassTeacher(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #86efac",
                      background: "#ffffff",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#166534",
                      minWidth: "210px",
                      outline: "none",
                    }}
                  >
                    <option value="">— Select Class Teacher —</option>
                    {teachers.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSaveClassTeacher}
                    disabled={savingTeacher}
                    style={{
                      background: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      opacity: savingTeacher ? 0.7 : 1,
                    }}
                  >
                    {savingTeacher ? "Saving..." : "Save Designation"}
                  </button>
                </div>
              </div>

              {/* Subject Faculty Allocations Table */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>Subject Allocations & Faculty</h4>
                    <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                      Curriculum subjects allocated specifically to this class section ({subjects.length} allocated)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAllocateSubjectModal(true)}
                    style={{
                      background: "#0c1e33",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      boxShadow: "0 1px 3px rgba(12,30,51,0.12)",
                    }}
                  >
                    <Plus size={14} /> Allocate Subject
                  </button>
                </div>

                <div style={{ border: "1px solid #e4e6e9", borderRadius: "8px", overflowX: "auto", overflowY: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                        <th style={{ padding: "10px 14px" }}>Subject</th>
                        <th style={{ padding: "10px 14px" }}>Code</th>
                        <th style={{ padding: "10px 14px" }}>Assigned Primary Faculty</th>
                        <th style={{ padding: "10px 14px" }}>Weekly Timetable</th>
                        <th style={{ padding: "10px 14px" }}>Syllabus Status</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "36px 20px", textAlign: "center", color: "#64748b" }}>
                            <BookOpen size={32} style={{ margin: "0 auto 8px", opacity: 0.35 }} />
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#0c1e33" }}>
                              No Subjects Allocated to this Class Yet
                            </p>
                            <p style={{ margin: "4px 0 14px", fontSize: "12px", color: "#64748b" }}>
                              In Indian schools, subjects belong specifically to each class grade. Click below to allocate subjects from the master syllabus.
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowAllocateSubjectModal(true)}
                              style={{
                                background: "#0c1e33",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                padding: "7px 16px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Plus size={14} /> Allocate First Subject
                            </button>
                          </td>
                        </tr>
                      ) : (
                        subjects.map((sub: any) => {
                          const isEditing = assigningSubjectId === sub.subjectId;
                          return (
                            <tr key={sub.subjectId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0c1e33" }}>{sub.subjectName}</td>
                              <td style={{ padding: "12px 14px", color: "#64748b" }}>{sub.subjectCode}</td>
                              <td style={{ padding: "12px 14px" }}>
                                {isEditing ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <select
                                      value={selectedSubjectTeacher}
                                      onChange={(e) => setSelectedSubjectTeacher(e.target.value)}
                                      style={{
                                        padding: "4px 8px",
                                        borderRadius: "5px",
                                        border: "1px solid #0c1e33",
                                        fontSize: "12px",
                                      }}
                                    >
                                      <option value="">Select Faculty</option>
                                      {teachers.map((t: any) => (
                                        <option key={t.id} value={t.id}>
                                          {t.name}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSubjectTeacher(sub.subjectId)}
                                      disabled={savingSubjectTeacher || !selectedSubjectTeacher}
                                      style={{
                                        background: "#0c1e33",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "4px 8px",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAssigningSubjectId(null);
                                        setSelectedSubjectTeacher("");
                                      }}
                                      style={{
                                        background: "#f1f5f9",
                                        color: "#475569",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "4px 8px",
                                        fontSize: "11px",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <span
                                      style={{
                                        padding: "3px 8px",
                                        borderRadius: "6px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        background: sub.teacherName ? "#f0fdf4" : "#fefce8",
                                        color: sub.teacherName ? "#166534" : "#854d0e",
                                        display: "inline-block",
                                      }}
                                    >
                                      {sub.teacherName ? sub.teacherName : "Not Assigned"}
                                    </span>
                                    {!sub.teacherName && sub.weeklyPeriodsCount > 0 && sub.timetableTeacherName && sub.timetableTeacherUserId && (
                                      <div style={{ marginTop: "4px" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveSubjectTeacher(sub.subjectId, sub.timetableTeacherUserId)}
                                          disabled={savingSubjectTeacher}
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            background: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                            color: "#1d4ed8",
                                            borderRadius: "4px",
                                            padding: "2px 6px",
                                            fontSize: "10.5px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                          }}
                                          title={`Assign ${sub.timetableTeacherName} as primary faculty`}
                                        >
                                          Set {sub.timetableTeacherName} as Primary
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                {sub.weeklyPeriodsCount > 0 ? (
                                  <div>
                                    <span style={{ fontWeight: 600, color: "#0c1e33", fontSize: "11.5px" }}>
                                      {sub.weeklyPeriodsCount} {sub.weeklyPeriodsCount === 1 ? "period" : "periods"}/wk
                                    </span>
                                    {sub.timetableTeacherName && (
                                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                                        with {sub.timetableTeacherName}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>— 0 periods</span>
                                )}
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ height: "6px", width: "80px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${sub.completionPct}%`, background: "#059669", borderRadius: "3px" }} />
                                  </div>
                                  <span style={{ fontSize: "11px", color: "#64748b" }}>{sub.completionPct}%</span>
                                </div>
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                                  {!isEditing && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAssigningSubjectId(sub.subjectId);
                                        setSelectedSubjectTeacher(sub.teacherUserId || sub.timetableTeacherUserId || "");
                                      }}
                                      style={{
                                        background: "#ffffff",
                                        border: "1px solid #ced8e5",
                                        borderRadius: "5px",
                                        padding: "4px 10px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#0c1e33",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {sub.teacherName ? "Reassign" : "Assign Faculty"}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubject(sub.subjectId, sub.subjectName)}
                                    title={`Unallocate ${sub.subjectName} from this class`}
                                    style={{
                                      background: "#fef2f2",
                                      border: "1px solid #fecaca",
                                      borderRadius: "5px",
                                      padding: "4px 8px",
                                      fontSize: "11px",
                                      color: "#991b1b",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <Trash2 size={12} />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : modalTab === "students" ? (
            /* TAB 2: Enrolled Students Roster */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>
                    Active Student Roster ({students.length} Students)
                  </h4>
                  <span style={{ fontSize: "11.5px", color: "#64748b" }}>All active enrollments with roll number and parent contact</span>
                </div>
              </div>

              <div style={{ border: "1px solid #e4e6e9", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                      <th style={{ padding: "10px 14px", width: "70px" }}>Roll #</th>
                      <th style={{ padding: "10px 14px" }}>Student Name</th>
                      <th style={{ padding: "10px 14px" }}>Admission No</th>
                      <th style={{ padding: "10px 14px" }}>Parent / Guardian</th>
                      <th style={{ padding: "10px 14px" }}>Contact</th>
                      <th style={{ padding: "10px 14px" }}>Attendance</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                          No students currently enrolled in this section.
                        </td>
                      </tr>
                    ) : (
                      students.map((st: any) => (
                        <tr key={st.studentId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "11px 14px", fontWeight: 800, color: "#0c1e33" }}>{st.rollNo || "—"}</td>
                          <td style={{ padding: "11px 14px", fontWeight: 600, color: "#1e293b" }}>{st.name}</td>
                          <td style={{ padding: "11px 14px", color: "#64748b" }}>{st.admissionNo || "—"}</td>
                          <td style={{ padding: "11px 14px", color: "#475569" }}>{st.parentName}</td>
                          <td style={{ padding: "11px 14px", color: "#64748b" }}>{st.parentPhone}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: st.attendanceRate < 80 ? "#fef2f2" : "#ecfdf5",
                                color: st.attendanceRate < 80 ? "#dc2626" : "#059669",
                              }}
                            >
                              {st.attendanceRate}%
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px", textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => {
                                // Transitions directly inline inside the modal
                                setActiveStudent({ id: st.studentId, name: st.name });
                              }}
                              style={{
                                background: "#f1f5f9",
                                border: "none",
                                borderRadius: "5px",
                                padding: "5px 10px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                color: "#0c1e33",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                transition: "all 0.12s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                            >
                              {role === "school-admin" ? "Profile" : "360"} <ExternalLink size={11} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* TAB 3: Subject Syllabus Progress */
            <div>
              <div style={{ marginBottom: "14px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>Subject Curriculum Completion</h4>
                <span style={{ fontSize: "11.5px", color: "#64748b" }}>Syllabus and chapter completion percentage across all assigned subjects</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
                {subjects.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      background: "#f8fafc",
                      border: "1px dashed #ced8e5",
                      borderRadius: "8px",
                      color: "#64748b",
                      gridColumn: "1 / -1",
                    }}
                  >
                    <BookOpen size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "13.5px", color: "#0c1e33" }}>
                      No subjects allocated to track syllabus progress
                    </p>
                    <p style={{ margin: "4px 0 12px", fontSize: "12px" }}>
                      Once you allocate subjects in the Faculty tab, chapter tracking and syllabus coverage will appear here.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setModalTab("faculty");
                        setShowAllocateSubjectModal(true);
                      }}
                      style={{
                        background: "#0c1e33",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      + Allocate Subjects Now
                    </button>
                  </div>
                ) : (
                  subjects.map((sub: any) => (
                    <div
                      key={sub.subjectId}
                      style={{
                        background: "#faf8f5",
                        border: "1px solid #e4e6e9",
                        borderRadius: "8px",
                        padding: "14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: "13px", color: "#0c1e33" }}>{sub.subjectName}</span>
                        <span style={{ fontWeight: 800, fontSize: "12px", color: "#059669" }}>{sub.completionPct}%</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                        <div style={{ height: "100%", width: `${sub.completionPct}%`, background: "#059669", borderRadius: "3px" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
                        <span>Faculty: {sub.teacherName || "Unassigned"}</span>
                        <span>{sub.totalChapters} Chapters</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="edops-drawer-footer"
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #e4e6e9",
            background: "#faf8f5",
            display: "flex",
            justifyContent: activeStudent ? "space-between" : "flex-end",
            alignItems: "center",
          }}
        >
          {activeStudent && (
            <button
              type="button"
              onClick={() => setActiveStudent(null)}
              style={{
                all: "unset",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "7px 14px",
                borderRadius: "6px",
                background: "#f1f5f9",
                border: "1px solid #ced8e5",
                fontSize: "12px",
                fontWeight: 600,
                color: "#0c1e33",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={13} /> Back to Roster
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#0c1e33",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "7px 18px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Reusable Subject Allocation Modal */}
      {showAllocateSubjectModal && (
        <ClassSubjectAllocationModal
          isOpen={showAllocateSubjectModal}
          onClose={() => setShowAllocateSubjectModal(false)}
          sectionName={sec ? `${sec.programName || sec.className || "Class"} — Section ${sec.name || sec.sectionName || ""}` : "Class Section"}
          availableSubjects={detail?.availableSubjects || []}
          alreadyAllocatedSubjectIds={subjects.map((s: any) => s.subjectId)}
          teachers={teachers}
          defaultTeacherId={sec?.classTeacherUserId || null}
          onAllocate={handleAllocateSubject}
        />
      )}
    </div>
  );
}
