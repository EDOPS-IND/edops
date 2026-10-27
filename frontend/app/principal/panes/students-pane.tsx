"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StudentListItem } from "../types";
import {
  Search,
  User,
  AlertTriangle,
  ShieldCheck,
  Plus,
  ArrowRight,
  Award,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  HeartPulse,
  ChevronDown,
  RefreshCw,
  Users,
  UserCheck,
  Eye,
  Filter,
  ChevronRight,
} from "lucide-react";
import { getStudentAvatarUrl, getPrincipalStudents } from "../../edops-api";
import { StudentSkeletonRows } from "../components/skeleton-rows";

// ─── Design Tokens strictly matching School Admin & Campus Specs ─────────────
const S = {
  navy: "#0C1E33",
  slate: "#64748B",
  muted: "#94A3B8",
  faint: "#CBD5E1",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  line: "#E2E8F0",
  chip: "#F1F5F9",
  blue: "#2563EB",
  greenBg: "#D2F4D3",
  green: "#15803D",
  greenDk: "#14532D",
};

// ─── No Result Empty State ───────────────────────────────────────────────────
function NoResultState({
  title,
  description,
  onReset,
}: {
  title: string;
  description: string;
  onReset?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      <img
        src="/noresult.png"
        alt="No results found"
        style={{
          width: "140px",
          height: "auto",
          maxHeight: "120px",
          objectFit: "contain",
          marginBottom: "16px",
          opacity: 0.95,
        }}
      />
      <b
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          color: S.navy,
          marginBottom: "6px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </b>
      <p
        style={{
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
          fontSize: "12.5px",
          color: S.slate,
          maxWidth: "420px",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          style={{
            marginTop: "16px",
            padding: "8px 18px",
            borderRadius: "6px",
            background: S.navy,
            color: "#FFFFFF",
            border: "none",
            fontSize: "12px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
          onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function StudentsPane({
  students = [],
  atRiskData,
  onOpenStudent360,
  onTriggerIntervention,
  onTriggerRemedial,
  onTriggerEnrichment,
  organizationId,
  initialTab,
  onTabChange,
}: {
  students?: StudentListItem[];
  atRiskData?: any;
  onOpenStudent360: (studentId: string) => void;
  onTriggerIntervention?: (studentName?: string) => void;
  onTriggerRemedial?: () => void;
  onTriggerEnrichment?: () => void;
  organizationId?: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters matching School Admin
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentSegment, setStudentSegment] = useState<
    "all" | "ontrack" | "breach" | "at_risk" | "remedial" | "enrichment"
  >((initialTab as any) || "all");

  useEffect(() => {
    if (initialTab) {
      setStudentSegment(initialTab as any);
    }
  }, [initialTab]);

  const loadStudents = (isSilent = false) => {
    if (!organizationId) return;
    if (!isSilent) setRefreshing(true);
    getPrincipalStudents(organizationId)
      .then((data) => {
        setLiveData(data);
      })
      .catch(() => null)
      .finally(() => {
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadStudents(false);
  }, [organizationId]);

  const studentList: any[] =
    liveData?.students && liveData.students.length > 0 ? liveData.students : students;

  // Derive unique classes and sections
  const uniqueGrades = useMemo(() => {
    const set = new Set<string>();
    studentList.forEach((s) => {
      const g = (s.grade || s.className || "").trim();
      if (g) set.add(g);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [studentList]);

  const uniqueSections = useMemo(() => {
    const set = new Set<string>();
    studentList.forEach((s) => {
      const sec = (s.section || s.sectionName || "").trim();
      if (sec) set.add(sec);
    });
    return Array.from(set).sort();
  }, [studentList]);

  // Filtered dataset
  const filteredStudents = useMemo(() => {
    return studentList.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const roll = (s.rollNumber || s.rollNo || "").toLowerCase();
      const admission = (s.admissionNo || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      if (q && !name.includes(q) && !email.includes(q) && !roll.includes(q) && !admission.includes(q)) {
        return false;
      }

      const grade = (s.grade || s.className || "").trim();
      if (gradeFilter !== "all" && grade !== gradeFilter) return false;

      const sec = (s.section || s.sectionName || "").trim();
      if (sectionFilter !== "all" && sec !== sectionFilter) return false;

      const att = s.attendanceRate ?? s.attendancePct ?? null;
      if (attendanceFilter === "ontrack" && (att === null || att < 75)) return false;
      if (attendanceFilter === "breach" && (att === null || att >= 75)) return false;

      const riskStatus = s.riskStatus || s.academicStatus || "";
      if (statusFilter === "ontrack" && riskStatus.toLowerCase().includes("risk")) return false;
      if (statusFilter === "risk" && !riskStatus.toLowerCase().includes("risk")) return false;

      // Segment filter
      if (studentSegment === "ontrack" && (att === null || att < 75)) return false;
      if (studentSegment === "breach" && (att === null || att >= 75)) return false;
      if (studentSegment === "at_risk" && !s.needsIntervention && (att === null || att >= 75)) return false;

      return true;
    });
  }, [studentList, searchQuery, gradeFilter, sectionFilter, attendanceFilter, statusFilter, studentSegment]);

  // Aggregate stats
  const totalCount = studentList.length;
  const regularAttendanceCount = studentList.filter((s) => {
    const a = s.attendanceRate ?? s.attendancePct;
    return a != null && a >= 75;
  }).length;
  const avgCohortScore = totalCount
    ? Math.round(
        studentList.reduce((acc, s) => acc + (Number(s.overallAverage) || 0), 0) / totalCount
      )
    : 0;
  const atRiskCount = studentList.filter(
    (s) =>
      s.needsIntervention ||
      (s.overallAverage != null && s.overallAverage < 40) ||
      ((s.attendanceRate ?? s.attendancePct) != null && (s.attendanceRate ?? s.attendancePct) < 75)
  ).length;

  const hasActiveFilters =
    searchQuery !== "" ||
    gradeFilter !== "all" ||
    sectionFilter !== "all" ||
    attendanceFilter !== "all" ||
    statusFilter !== "all" ||
    studentSegment !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setGradeFilter("all");
    setSectionFilter("all");
    setAttendanceFilter("all");
    setStatusFilter("all");
    setStudentSegment("all");
    onTabChange?.("all");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
        padding: "24px 28px",
        boxSizing: "border-box",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* ═══════════════════════════════════════════════
          1. HEADER WITH ACTIONS
      ═══════════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          width: "100%",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
              color: S.navy,
              letterSpacing: "-0.02em",
            }}
          >
            Students Directory &amp; Tracking
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: "13px",
              color: S.slate,
              lineHeight: 1.5,
            }}
          >
            Institutional roster of enrolled learners across all classes, curriculum cohorts, and intervention tracks.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onTriggerIntervention && (
            <button
              type="button"
              onClick={() => onTriggerIntervention()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "36px",
                padding: "0 14px",
                background: S.navy,
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(12, 30, 51, 0.1)",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
              onMouseLeave={(e) => (e.currentTarget.style.background = S.navy)}
            >
              <Plus size={15} strokeWidth={2} />
              <span>New Intervention</span>
            </button>
          )}

          {onTriggerRemedial && (
            <button
              type="button"
              onClick={onTriggerRemedial}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "36px",
                padding: "0 14px",
                background: "#FFFFFF",
                color: S.navy,
                border: `1px solid ${S.border}`,
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              <span>+ Remedial Camp</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          2. TOP 4 PASTEL SUMMARY CARDS (164PX HEIGHT)
      ═══════════════════════════════════════════════ */}
      <div
        className="edops-people-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          width: "100%",
        }}
      >
        {/* Card 1: Total Students (Pastel Violet #E0D3FF) */}
        <div
          onClick={() => {
            setStudentSegment("all");
            onTabChange?.("all");
          }}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "164px",
            padding: "20px",
            background: "#E0D3FF",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "10px", color: "#51249A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              TOTAL ENROLLED
            </span>
            <Users size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: S.navy }}>
            {totalCount > 0 ? totalCount : "—"}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#51249A" }}>Active campus cohort</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#51249A" }}>
              <span>Directory</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Card 2: Regular Attendance (Pastel Mint Green #D0EDC0) */}
        <div
          onClick={() => {
            setStudentSegment("ontrack");
            onTabChange?.("ontrack");
          }}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "164px",
            padding: "20px",
            background: "#D0EDC0",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "10px", color: "#305E26", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              REGULAR ATTENDANCE
            </span>
            <UserCheck size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: S.navy }}>
            {regularAttendanceCount > 0 ? regularAttendanceCount : "—"}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#305E26" }}>Above 75% statutory norm</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#305E26" }}>
              <span>On Track</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Card 3: Academic Average (Pastel Sky Blue #BCE6F3) */}
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "164px",
            padding: "20px",
            background: "#BCE6F3",
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "10px", color: "#265F79", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              COHORT AVERAGE
            </span>
            <GraduationCap size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: S.navy }}>
            {avgCohortScore > 0 ? `${avgCohortScore}%` : "—"}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#265F79" }}>Published assessment results</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#265F79" }}>
              <span>Benchmark</span>
            </div>
          </div>
        </div>

        {/* Card 4: Attention Required (Pastel Rose #FADAC9) */}
        <div
          onClick={() => {
            setStudentSegment("at_risk");
            onTabChange?.("at_risk");
          }}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "164px",
            padding: "20px",
            background: "#FADAC9",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "10px", color: "#8A3A14", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              REQUIRES ATTENTION
            </span>
            <AlertTriangle size={19} strokeWidth={1.8} style={{ color: "#8A3A14" }} />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: S.navy }}>
            {atRiskCount > 0 ? atRiskCount : "0"}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#8A3A14" }}>Attendance breach or academic risk</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "#8A3A14" }}>
              <span>Triage Desk</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          3. FILTER BAR & QUICK SEGMENTS (MATCHING PEOPLE PANE)
      ═══════════════════════════════════════════════ */}
      <div
        style={{
          background: S.white,
          border: `1px solid ${S.border}`,
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            padding: "16px 20px",
            alignItems: "center",
            borderBottom: `1px solid ${S.border}`,
            background: S.white,
          }}
        >
          {/* Search Input */}
          <div
            style={{
              position: "relative",
              flex: "1 1 240px",
              minWidth: "200px",
              height: "40px",
            }}
          >
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "12px",
                top: "12px",
                color: S.slate,
              }}
            />
            <input
              type="text"
              placeholder="Search by name, roll no, or admission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "100%",
                padding: "0 12px 0 36px",
                borderRadius: "6px",
                border: `1px solid ${S.border}`,
                background: S.chip,
                fontSize: "12.5px",
                fontFamily: "'Poppins', sans-serif",
                color: S.navy,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Grade/Class Dropdown */}
          <div style={{ position: "relative", width: "130px", height: "40px" }}>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              style={{
                width: "100%",
                height: "100%",
                padding: "0 28px 0 12px",
                borderRadius: "6px",
                border: `1px solid ${gradeFilter !== "all" ? S.navy : S.border}`,
                background: gradeFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                fontSize: "12px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: gradeFilter !== "all" ? 600 : 400,
                color: S.navy,
                cursor: "pointer",
                appearance: "none",
                outline: "none",
              }}
            >
              <option value="all">Grade: All</option>
              {uniqueGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{ position: "absolute", right: "10px", top: "13px", color: S.slate, pointerEvents: "none" }}
            />
          </div>

          {/* Section Dropdown */}
          <div style={{ position: "relative", width: "120px", height: "40px" }}>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{
                width: "100%",
                height: "100%",
                padding: "0 28px 0 12px",
                borderRadius: "6px",
                border: `1px solid ${sectionFilter !== "all" ? S.navy : S.border}`,
                background: sectionFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                fontSize: "12px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: sectionFilter !== "all" ? 600 : 400,
                color: S.navy,
                cursor: "pointer",
                appearance: "none",
                outline: "none",
              }}
            >
              <option value="all">Section: All</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{ position: "absolute", right: "10px", top: "13px", color: S.slate, pointerEvents: "none" }}
            />
          </div>

          {/* Attendance Dropdown */}
          <div style={{ position: "relative", width: "150px", height: "40px" }}>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              style={{
                width: "100%",
                height: "100%",
                padding: "0 28px 0 12px",
                borderRadius: "6px",
                border: `1px solid ${attendanceFilter !== "all" ? S.navy : S.border}`,
                background: attendanceFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                fontSize: "12px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: attendanceFilter !== "all" ? 600 : 400,
                color: S.navy,
                cursor: "pointer",
                appearance: "none",
                outline: "none",
              }}
            >
              <option value="all">Attendance: All</option>
              <option value="ontrack">On Track (≥75%)</option>
              <option value="breach">Breach (&lt;75%)</option>
            </select>
            <ChevronDown
              size={14}
              style={{ position: "absolute", right: "10px", top: "13px", color: S.slate, pointerEvents: "none" }}
            />
          </div>

          {/* Status Dropdown */}
          <div style={{ position: "relative", width: "140px", height: "40px" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                height: "100%",
                padding: "0 28px 0 12px",
                borderRadius: "6px",
                border: `1px solid ${statusFilter !== "all" ? S.navy : S.border}`,
                background: statusFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                fontSize: "12px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: statusFilter !== "all" ? 600 : 400,
                color: S.navy,
                cursor: "pointer",
                appearance: "none",
                outline: "none",
              }}
            >
              <option value="all">Status: All</option>
              <option value="ontrack">On Track</option>
              <option value="risk">Requires Action</option>
            </select>
            <ChevronDown
              size={14}
              style={{ position: "absolute", right: "10px", top: "13px", color: S.slate, pointerEvents: "none" }}
            />
          </div>

          {/* Reset Button */}
          <button
            type="button"
            disabled={!hasActiveFilters}
            onClick={handleResetFilters}
            style={{
              height: "40px",
              padding: "0 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              border: `1px solid ${hasActiveFilters ? S.navy : S.border}`,
              background: hasActiveFilters ? S.navy : "#F8FAFC",
              color: hasActiveFilters ? "#FFFFFF" : S.muted,
              cursor: hasActiveFilters ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
            }}
          >
            <RefreshCw size={12} />
            <span>Reset</span>
          </button>
        </div>

        {/* Quick Segment Filter Pills (Matching School Admin Pills) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "14px 20px",
            background: "#FFFFFF",
            borderBottom: `1px solid ${S.border}`,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {[
            { id: "all", label: "All Students" },
            { id: "ontrack", label: "Regular Attendance (≥75%)" },
            { id: "breach", label: "Attendance Breach (<75%)" },
            { id: "at_risk", label: "Attention & At-Risk" },
            { id: "remedial", label: "Remedial Cohort" },
            { id: "enrichment", label: "Enrichment Cohort" },
          ].map((seg) => {
            const isSegActive = studentSegment === seg.id;
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => {
                  setStudentSegment(seg.id as any);
                  onTabChange?.(seg.id);
                }}
                style={{
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  height: "34px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: isSegActive ? 600 : 500,
                  cursor: "pointer",
                  border: isSegActive ? `1px solid ${S.navy}` : "1px solid #E2E8F0",
                  background: isSegActive ? S.navy : "#F4F6F8",
                  color: isSegActive ? "#FFFFFF" : S.slate,
                  boxShadow: isSegActive ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isSegActive) {
                    e.currentTarget.style.background = "#E9EEF4";
                    e.currentTarget.style.color = S.navy;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSegActive) {
                    e.currentTarget.style.background = "#F4F6F8";
                    e.currentTarget.style.color = S.slate;
                  }
                }}
              >
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════
            4. HIGH-DENSITY STUDENT TABLE (MATCHING PEOPLE PANE)
        ═══════════════════════════════════════════════ */}
        <div style={{ width: "100%", padding: "16px 20px 24px", boxSizing: "border-box" }}>
          <div
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E5EB",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                height: "44px",
                background: "#F8FAFC",
                borderBottom: "1px solid #E0E5EB",
                userSelect: "none",
              }}
            >
              <div style={{ flex: "2.5 1 220px", minWidth: 0, fontSize: "11px", fontWeight: 600, color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                STUDENT IDENTITY
              </div>
              <div style={{ flex: "1.2 1 120px", minWidth: 0, fontSize: "11px", fontWeight: 600, color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                CLASS &amp; ROLL
              </div>
              <div style={{ flex: "1.3 1 130px", minWidth: 0, fontSize: "11px", fontWeight: 600, color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                ATTENDANCE
              </div>
              <div style={{ flex: "1.3 1 130px", minWidth: 0, fontSize: "11px", fontWeight: 600, color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                ACADEMIC SCORE
              </div>
              <div style={{ flex: "1.1 1 110px", minWidth: 0, fontSize: "11px", fontWeight: 600, color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                RISK STATUS
              </div>
              <div style={{ flex: "0 0 110px", textAlign: "right", fontSize: "11px", fontWeight: 600, color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                ACTIONS
              </div>
            </div>

            {/* Table Rows & Skeleton Loading */}
            {loading ? (
              <StudentSkeletonRows rows={6} />
            ) : filteredStudents.length === 0 ? (
              <NoResultState
                title={hasActiveFilters ? "No Students Found" : "No Students Enrolled"}
                description={
                  hasActiveFilters
                    ? "No student records match the active search and filter parameters."
                    : "No students are currently active in this school roster."
                }
                onReset={hasActiveFilters ? handleResetFilters : undefined}
              />
            ) : (
            filteredStudents.map((s, idx) => {
              const att = s.attendanceRate ?? s.attendancePct ?? null;
              const isBreach = att !== null && att < 75;
              const avg = s.overallAverage != null ? Math.round(Number(s.overallAverage)) : null;
              const isEven = idx % 2 === 0;
              const cleanGrade = (s.grade || s.className || "").replace(/^Class\s*/i, "").trim();
              const cleanSection = (s.section || s.sectionName || "").trim();
              const classDisplay = cleanGrade && cleanSection ? `${cleanGrade}-${cleanSection}` : cleanGrade || cleanSection || "—";
              const cleanRoll = (s.rollNumber || s.rollNo || "").replace(/^ROLL-?/i, "").trim();

              return (
                <div
                  key={s.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 16px",
                    width: "100%",
                    height: "52px",
                    minHeight: "52px",
                    background: isEven ? "#FFFFFF" : "#F8FAFC",
                    borderBottom: "1px solid #E0E5EB",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? "#FFFFFF" : "#F8FAFC")}
                >
                  {/* Identity with Avatar */}
                  <div style={{ flex: "2.5 1 220px", minWidth: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#F5F6F8",
                        border: "1px solid #E4E6E9",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={getStudentAvatarUrl(s.name, s.id)}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "13px",
                          color: S.navy,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={s.name}
                      >
                        {s.name}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: S.slate,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={s.email || `${s.name?.toLowerCase().replace(/\s+/g, "")}@student.edops.edu`}
                      >
                        {s.email || `${s.name?.toLowerCase().replace(/\s+/g, "")}@student.edops.edu`}
                      </span>
                    </div>
                  </div>

                  {/* Class & Roll */}
                  <div style={{ flex: "1.2 1 120px", minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
                    <span style={{ fontWeight: 600, fontSize: "12.5px", color: S.navy }}>
                      {classDisplay}
                    </span>
                    <span style={{ fontSize: "10.5px", color: "#7B8999" }}>
                      {cleanRoll ? `Roll #${cleanRoll}` : "Roll: —"}
                    </span>
                  </div>

                  {/* Attendance */}
                  <div style={{ flex: "1.3 1 130px", minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                    {att !== null ? (
                      <>
                        <span style={{ fontWeight: 600, fontSize: "12.5px", color: isBreach ? "#AA4D1D" : S.navy }}>
                          {Math.round(att)}%
                        </span>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "1px 6px",
                            background: isBreach ? "#FFF0E6" : "#ECFDF5",
                            borderRadius: "4px",
                            width: "fit-content",
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: "9.5px", color: isBreach ? "#AA4D1D" : "#047857" }}>
                            {isBreach ? "Breach <75%" : "On Track"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: "11px", color: S.muted }}>—</span>
                    )}
                  </div>

                  {/* Academic Average */}
                  <div style={{ flex: "1.3 1 130px", minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                    {avg !== null ? (
                      <>
                        <span style={{ fontWeight: 600, fontSize: "12.5px", color: avg < 50 ? "#AA4D1D" : S.navy }}>
                          {avg}%
                        </span>
                        <span style={{ fontSize: "10px", color: avg >= 75 ? "#047857" : avg >= 50 ? S.slate : "#AA4D1D" }}>
                          {avg >= 75 ? "Honor Roll" : avg >= 50 ? "Satisfactory" : "Remedial Need"}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: "11px", color: S.muted }}>No graded exams</span>
                    )}
                  </div>

                  {/* Status & Risk */}
                  <div style={{ flex: "1.1 1 110px", minWidth: 0 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: "100px",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        background: s.needsIntervention ? "#FEE2E2" : "#ECFDF5",
                        color: s.needsIntervention ? "#991B1B" : "#047857",
                      }}
                    >
                      {s.riskStatus || (s.needsIntervention ? "Action Needed" : "On Track")}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => onOpenStudent360(s.id)}
                      title="View Student Dossier"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "0 10px",
                        height: "28px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        background: "#FFFFFF",
                        color: S.navy,
                        fontSize: "11.5px",
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = S.navy;
                        e.currentTarget.style.color = "#FFFFFF";
                        e.currentTarget.style.borderColor = S.navy;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FFFFFF";
                        e.currentTarget.style.color = S.navy;
                        e.currentTarget.style.borderColor = "#E2E8F0";
                      }}
                    >
                      <span>View</span>
                      <ChevronRight size={13} />
                    </button>

                    {onTriggerIntervention && (
                      <button
                        type="button"
                        onClick={() => onTriggerIntervention(s.name)}
                        title="Create Intervention"
                        style={{
                          all: "unset",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          border: "1px solid #FECACA",
                          background: "#FEF2F2",
                          cursor: "pointer",
                          color: "#DC2626",
                          transition: "all 0.12s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                      >
                        <AlertTriangle size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
