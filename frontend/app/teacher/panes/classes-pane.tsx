"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  CheckSquare,
  Award,
  Plus,
  FileText,
} from "lucide-react";
import {
  getTeacherClasses,
  getTeacherClassDetails,
  getTeacherLectures,
  getTeacherTodayTimetable,
} from "../../edops-api";
import { T, TeacherClass, LectureItem, TimetableSlotItem } from "../components/classes/types";
import { LectureArchiveView } from "../components/classes/lecture-archive-view";
import { LogLectureDrawer } from "../components/classes/log-lecture-drawer";
import { LectureDetailsDrawer } from "../components/classes/lecture-details-drawer";
import { LectureReaderView } from "../components/classes/lecture-reader-view";

interface ClassesPaneProps {
  organizationId: string;
  onOpenStudentDossier: (studentId: string) => void;
  onTakeAttendance: (sectionId: string, className?: string) => void;
  onCreateAssignment: (sectionId: string) => void;
}

export function ClassesPane({
  organizationId,
  onOpenStudentDossier,
  onTakeAttendance,
  onCreateAssignment,
}: ClassesPaneProps) {
  const [classesData, setClassesData] = useState<{ classes: TeacherClass[] } | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [classDetail, setClassDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Daily Lectures state
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlotItem[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<LectureItem | null>(null);
  const [readerLecture, setReaderLecture] = useState<LectureItem | null>(null);
  const [archiveViewClass, setArchiveViewClass] = useState<TeacherClass | null>(null);
  const [inspectedLectureId, setInspectedLectureId] = useState<string | null>(null);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [logDrawerContext, setLogDrawerContext] = useState<{
    classSection?: string;
    subjectName?: string;
    periodInfo?: string;
  }>({});

  useEffect(() => {
    loadClasses();
    loadLectures();
    loadTimetableSlots();
  }, [organizationId]);

  useEffect(() => {
    if (selectedSectionId) {
      loadClassDetail(selectedSectionId);
    }
  }, [selectedSectionId]);

  async function loadClasses() {
    setLoading(true);
    try {
      const res = await getTeacherClasses(organizationId);
      setClassesData(res);
      if (res?.classes?.length > 0) {
        setSelectedSectionId(res.classes[0].sectionId);
      }
    } catch {
      setClassesData({ classes: [] });
    } finally {
      setLoading(false);
    }
  }

  async function loadLectures() {
    try {
      const res = await getTeacherLectures(organizationId);
      setLectures(res?.lectures || []);
    } catch {
      setLectures([]);
    }
  }

  async function loadTimetableSlots() {
    try {
      const res = await getTeacherTodayTimetable(organizationId);
      setTimetableSlots(res?.slots || []);
    } catch {
      setTimetableSlots([]);
    }
  }

  async function loadClassDetail(sectionId: string) {
    setDetailLoading(true);
    try {
      const res = await getTeacherClassDetails(organizationId, sectionId);
      setClassDetail(res);
    } catch {
      setClassDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleOpenLogDrawer(classSection?: string, subjectName?: string, defaultPeriod?: string) {
    const targetSection = classSection || classesData?.classes?.[0]?.className || "Class 10 - A";
    const assignedClass = classesData?.classes?.find((c) => c.className === targetSection || targetSection.includes(c.className));
    const targetSubject = subjectName || assignedClass?.subjectName || classesData?.classes?.[0]?.subjectName || "Mathematics";

    const matchSlot = timetableSlots.find((s) =>
      (s.classSection === targetSection || targetSection.includes(s.classSection || "") || (s.classSection || "").includes(targetSection)) &&
      (!s.subject || !targetSubject || s.subject.toLowerCase() === targetSubject.toLowerCase() || targetSubject.toLowerCase().includes(s.subject.toLowerCase()))
    );

    const resolvedPeriod = defaultPeriod || (matchSlot ? `Period ${matchSlot.period} (${matchSlot.startTime || ""} - ${matchSlot.endTime || ""})`.replace(" - )", ")") : "");

    setLogDrawerContext({
      classSection: targetSection,
      subjectName: targetSubject,
      periodInfo: resolvedPeriod,
    });
    setShowLogDrawer(true);
  }

  const selectedClass = classesData?.classes?.find((c) => c.sectionId === selectedSectionId);

  const filteredStudents = (classDetail?.students || []).filter((s: any) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (
      searchQuery &&
      !s.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.rollNumber?.includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: "13px", fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading classes &amp; rosters...
        </p>
      </div>
    );
  }

  // Today's Date String for Daily Lecture Reset
  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedClassLectures = selectedClass
    ? lectures.filter((l) => l.classSection === selectedClass.className && l.subjectName === selectedClass.subjectName)
    : [];
  const todayLectures = selectedClassLectures.filter((l) => l.date === todayStr);

  return (
    <>
      {archiveViewClass ? (
        <LectureArchiveView
          currentClass={archiveViewClass}
          lectures={lectures}
          inspectedLectureId={inspectedLectureId}
          onSelectLecture={(id) => setInspectedLectureId(id)}
          onBack={() => {
            setArchiveViewClass(null);
            setInspectedLectureId(null);
          }}
          onOpenLogDrawer={(cls, sub) => handleOpenLogDrawer(cls, sub)}
        />
      ) : readerLecture ? (
        <LectureReaderView
          lecture={readerLecture}
          onBack={() => setReaderLecture(null)}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* 1. Header Row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: T.slate,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Instructional Roster
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 600,
                  color: T.navy,
                  letterSpacing: "-0.01em",
                }}
              >
                My Teaching Classes &amp; Rosters
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
                Assigned sections for the academic term: inspect student attendance, evaluate progress, and launch actions.
              </p>
            </div>

            {selectedClass && selectedClass.isClassTeacher && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => onTakeAttendance(selectedClass.sectionId, selectedClass.className)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: T.navy,
                    color: T.white,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
                  }}
                >
                  <CheckSquare size={14} />
                  <span>Take Attendance</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCreateAssignment(selectedClass.sectionId)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: T.white,
                    color: T.navy,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <Award size={14} />
                  <span>+ Assignment</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Teaching Classes Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
            }}
          >
            {classesData?.classes?.map((c) => {
              const isSelected = c.sectionId === selectedSectionId;
              const classLectures = lectures.filter(
                (l) => l.classSection === c.className && l.subjectName === c.subjectName
              );
              const latestLec = classLectures[0];

              return (
                <div
                  key={c.sectionId}
                  onClick={() => setSelectedSectionId(c.sectionId)}
                  style={{
                    padding: "20px",
                    background: T.white,
                    border: isSelected ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                    boxShadow: isSelected ? "0 4px 12px rgba(12, 30, 51, 0.08)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "8px",
                          background: T.chip,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: T.navy,
                          border: `1px solid ${T.border}`,
                        }}
                      >
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: T.navy }}>
                          {c.className}
                        </h3>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.blue, fontWeight: 600 }}>
                          {c.subjectName}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "100px",
                        background: T.chip,
                        fontSize: "11px",
                        fontWeight: 600,
                        color: T.slate,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      {c.studentCount} Students
                    </span>
                  </div>

                  {/* Stats Ribbon */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      padding: "10px 12px",
                      background: T.chip,
                      borderRadius: "8px",
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "10px", color: T.slate, textTransform: "uppercase", fontWeight: 600 }}>
                        Subject Average
                      </span>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: T.navy, marginTop: "2px" }}>
                        {c.subjectAverage != null ? `${c.subjectAverage}%` : "%"}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: T.slate, textTransform: "uppercase", fontWeight: 600 }}>
                        Attendance
                      </span>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: T.greenDark, marginTop: "2px" }}>
                        {c.attendanceRate != null ? `${c.attendanceRate}%` : "%"}
                      </div>
                    </div>
                  </div>

                  {/* Compact 1-Line Lecture Summary */}
                  <div
                    style={{
                      borderTop: `1px solid ${T.border}`,
                      paddingTop: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      fontSize: "11.5px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                      <FileText size={13} color={latestLec ? T.blue : T.slate} style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          color: latestLec ? T.navy : T.slate,
                          fontWeight: latestLec ? 600 : 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={latestLec ? `${latestLec.topic} (${latestLec.date})` : "No lectures logged yet"}
                      >
                        {latestLec ? latestLec.topic : "No lectures logged yet"}
                      </span>
                      {latestLec?.periodInfo && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            background: T.chip,
                            color: T.navy,
                            padding: "1px 5px",
                            borderRadius: "4px",
                            border: `1px solid ${T.border}`,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {latestLec.periodInfo}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenLogDrawer(c.className, c.subjectName);
                      }}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: T.blue,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        flexShrink: 0,
                        padding: "2px 4px",
                      }}
                    >
                      <Plus size={12} /> Log Class
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: T.slate }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchiveViewClass(c);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        fontSize: "11px",
                        fontWeight: 600,
                        color: T.blue,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Lecture Archive ({classLectures.length}) →
                    </button>
                    <span style={{ fontWeight: 600, color: T.navy, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {isSelected ? "Active View ✓" : "Select Section →"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Selected Class Academic Detail */}
          {selectedClass && (
            <div
              style={{
                background: T.white,
                borderRadius: "10px",
                border: `1px solid ${T.border}`,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {/* Active Section Info Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "rgba(12, 30, 51, 0.05)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: T.navy,
                      }}
                    >
                      Active Section Ledger
                    </span>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: T.navy }}>
                      {selectedClass.className} — {selectedClass.subjectName}
                    </h3>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: T.slate }}>
                    Live enrollment roster, continuous assessment averages, and student performance metrics
                  </p>
                </div>
              </div>

              {/* Class KPI Cards (4 metrics) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "14px",
                }}
              >
                <div style={{ padding: "16px 20px", background: T.violetBg, borderRadius: "8px", border: "1px solid #d8c2ff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: T.violetDark, textTransform: "uppercase" }}>
                      Class Average
                    </span>
                    <Award size={16} color={T.violetDark} />
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: T.violetDark, marginTop: "8px" }}>
                    {classDetail?.overview?.subjectAverage != null ? `${classDetail.overview.subjectAverage}%` : "—"}
                  </div>
                  <span style={{ fontSize: "11px", color: T.violetDark, marginTop: "4px", display: "block" }}>
                    Continuous evaluation
                  </span>
                </div>

                <div style={{ padding: "16px 20px", background: T.greenBg, borderRadius: "8px", border: "1px solid #bce2a8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: T.greenDark, textTransform: "uppercase" }}>
                      Pass Percentage
                    </span>
                    <Award size={16} color={T.greenDark} />
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: T.greenDark, marginTop: "8px" }}>
                    {classDetail?.overview?.passRate != null ? `${classDetail.overview.passRate}%` : "—"}
                  </div>
                  <span style={{ fontSize: "11px", color: T.greenDark, marginTop: "4px", display: "block" }}>
                    Scoring &gt; 40% cutoff
                  </span>
                </div>

                <div style={{ padding: "16px 20px", background: T.skyBg, borderRadius: "8px", border: `1px solid ${T.line}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: T.skyDark, textTransform: "uppercase" }}>
                      Section Attendance
                    </span>
                    <Calendar size={16} color={T.skyDark} />
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: T.skyDark, marginTop: "8px" }}>
                    {classDetail?.overview?.attendance != null ? `${classDetail.overview.attendance}%` : "—"}
                  </div>
                  <span style={{ fontSize: "11px", color: T.skyDark, marginTop: "4px", display: "block" }}>
                    Term attendance average
                  </span>
                </div>

                <div style={{ padding: "16px 20px", background: T.roseBg, borderRadius: "8px", border: "1px solid #fecaca" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: T.roseDark, textTransform: "uppercase" }}>
                      Attention Required
                    </span>
                    <AlertTriangle size={16} color={T.roseDark} />
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: T.roseDark, marginTop: "8px" }}>
                    {(classDetail?.students || []).filter((s: any) => s.status === "needs_attention").length}
                  </div>
                  <span style={{ fontSize: "11px", color: T.roseDark, marginTop: "4px", display: "block" }}>
                    Students requiring follow-up
                  </span>
                </div>
              </div>

              {/* Today's Classroom Instruction Section (Daily Reset) */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: T.navy }}>
                        Today&apos;s Classroom Session
                      </h4>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: T.navy, background: T.chip, padding: "2px 8px", borderRadius: "6px", border: `1px solid ${T.border}` }}>
                        Today • {todayStr}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.slate }}>
                      Daily period instruction for {selectedClass.className} • Resets every morning
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setArchiveViewClass(selectedClass)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        background: T.white,
                        color: T.navy,
                        fontSize: "12px",
                        fontWeight: 600,
                        border: `1px solid ${T.border}`,
                        cursor: "pointer",
                      }}
                    >
                      <BookOpen size={13} /> Complete Archive ({selectedClassLectures.length}) →
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLogDrawer(selectedClass.className, selectedClass.subjectName)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        background: T.navy,
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={13} /> Log Today&apos;s Class
                    </button>
                  </div>
                </div>

                {todayLectures.length === 0 ? (
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: T.slate,
                      background: T.chip,
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      border: `1px dashed ${T.border}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: T.navy }}>
                      No lecture logged yet for today ({todayStr}).
                    </div>
                    <span style={{ fontSize: "11.5px" }}>
                      Click &quot;Log Today&apos;s Class&quot; to publish topics and notes to students, or view previous sessions in the complete archive.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {todayLectures.map((lec) => (
                      <div
                        key={lec.id}
                        onClick={() => {
                          setArchiveViewClass(selectedClass);
                          setInspectedLectureId(lec.id);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: T.white,
                          border: `1px solid ${T.border}`,
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.navy)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: T.chip, display: "flex", alignItems: "center", justifyContent: "center", color: T.navy, flexShrink: 0 }}>
                            <FileText size={16} />
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: 600, color: T.navy, fontSize: "13px" }}>
                                {lec.topic}
                              </span>
                              {lec.periodInfo && (
                                <span style={{ fontSize: "10px", fontWeight: 700, background: T.skyBg, color: T.skyDark, padding: "1px 6px", borderRadius: "4px" }}>
                                  {lec.periodInfo}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: T.slate }}>
                              Conducted Today • {selectedClass.className}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {lec.homework && (
                            <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: "#fef3c7", color: "#92400e" }}>
                              Homework Attached
                            </span>
                          )}
                          {lec.resources && (
                            <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: T.skyBg, color: T.skyDark }}>
                              Study Material
                            </span>
                          )}
                          <span style={{ fontSize: "11px", color: T.blue, fontWeight: 600 }}>
                            Inspect Session →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter & Search Bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", borderTop: `1px solid ${T.border}`, paddingTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {["all", "on_track", "needs_attention"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "none",
                        background: statusFilter === filter ? T.navy : T.chip,
                        color: statusFilter === filter ? T.white : T.slate,
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {filter.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <div style={{ position: "relative", minWidth: "240px" }}>
                  <Search size={14} color={T.slate} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name or roll..."
                    style={{
                      width: "100%",
                      padding: "7px 12px 7px 32px",
                      borderRadius: "6px",
                      border: `1px solid ${T.border}`,
                      fontSize: "12px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Enrolled Students Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}`, color: T.slate, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      <th style={{ padding: "10px 12px" }}>Roll</th>
                      <th style={{ padding: "10px 12px" }}>Student Name</th>
                      <th style={{ padding: "10px 12px" }}>Subject Avg</th>
                      <th style={{ padding: "10px 12px" }}>Attendance</th>
                      <th style={{ padding: "10px 12px" }}>Status</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: T.slate, fontSize: "12px" }}>
                          No students matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st: any) => (
                        <tr
                          key={st.id}
                          style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: "background 0.1s" }}
                          onClick={() => onOpenStudentDossier(st.id)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = T.chip)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "12px", fontWeight: 600, color: T.slate, fontSize: "12px" }}>
                            #{st.rollNumber || "—"}
                          </td>
                          <td style={{ padding: "12px", fontWeight: 600, color: T.navy }}>
                            {st.name}
                          </td>
                          <td style={{ padding: "12px", fontWeight: 700, color: T.navy }}>
                            {st.subjectAverage != null ? `${st.subjectAverage}%` : "—"}
                          </td>
                          <td style={{ padding: "12px", fontWeight: 700, color: (st.attendance ?? 100) < 75 ? T.roseDark : T.greenDark }}>
                            {st.attendance != null ? `${st.attendance}%` : "—"}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: st.status === "needs_attention" ? T.roseBg : T.greenBg,
                                color: st.status === "needs_attention" ? T.roseDark : T.greenDark,
                              }}
                            >
                              {st.status === "needs_attention" ? "Needs Attention" : "On Track"}
                            </span>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <span style={{ fontSize: "12px", color: T.blue, fontWeight: 600 }}>
                              View Dossier →
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Action Drawers (Mounted at Root) */}
      <LogLectureDrawer
        isOpen={showLogDrawer}
        onClose={() => setShowLogDrawer(false)}
        organizationId={organizationId}
        classes={classesData?.classes || []}
        timetableSlots={timetableSlots}
        defaultClassSection={logDrawerContext.classSection}
        defaultSubjectName={logDrawerContext.subjectName}
        defaultPeriodInfo={logDrawerContext.periodInfo}
        onSuccess={async () => {
          await loadLectures();
        }}
      />

      <LectureDetailsDrawer
        lecture={selectedLecture}
        onClose={() => setSelectedLecture(null)}
        onOpenReader={(lec) => setReaderLecture(lec)}
      />
    </>
  );
}
