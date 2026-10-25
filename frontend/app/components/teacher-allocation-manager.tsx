"use client";

import React, { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Trash2,
  CalendarCheck,
  X,
  Clock,
  Layers,
} from "lucide-react";
import { assignSchoolAdminSectionTeacher } from "../edops-api";

export interface AllocationItem {
  id: string;
  sectionId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  isElective?: boolean;
}

export interface TeacherAllocationManagerProps {
  organizationId: string;
  teacher: {
    id: string;
    userId?: string;
    name: string;
    email: string;
    department?: string;
    weeklyPeriods?: number;
    maxPeriods?: number;
    allocations?: AllocationItem[];
    classes?: string[];
    subjects?: string[];
  };
  sections: Array<{ id: string; name: string; programName?: string; code?: string }>;
  subjects: Array<{ id: string; name: string; code?: string; isElective?: boolean }>;
  availableTeachers?: Array<{ id: string; userId?: string; name: string; email: string }>;
  onAllocationsUpdated: () => Promise<void> | void;
}

export function TeacherAllocationManager({
  organizationId,
  teacher,
  sections = [],
  subjects = [],
  availableTeachers = [],
  onAllocationsUpdated,
}: TeacherAllocationManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [reassignItem, setReassignItem] = useState<AllocationItem | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [successorTeacherId, setSuccessorTeacherId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const teacherUserId = teacher.userId || teacher.id;
  const allocations: AllocationItem[] = teacher.allocations || [];

  // Fallback: if allocations is empty but legacy classes & subjects arrays exist, construct visual items
  const displayAllocations: AllocationItem[] =
    allocations.length > 0
      ? allocations
      : (teacher.classes || []).map((cls, idx) => ({
          id: `legacy-${idx}`,
          sectionId: sections.find((s) => s.name === cls || s.code === cls)?.id || "",
          className: cls.startsWith("Class ") ? cls : `Class ${cls}`,
          subjectId: subjects.find((sub) => sub.name === (teacher.subjects?.[0] || teacher.department))?.id || "",
          subjectName: teacher.subjects?.[0] || teacher.department || "Subject Instruction",
          isElective: false,
        }));

  // Edge Case 1: Workload calculation (CBSE standard ceiling is 28-30 periods/week)
  const maxWeeklyPeriods = teacher.maxPeriods || 28;
  const currentWeeklyPeriods =
    teacher.weeklyPeriods && teacher.weeklyPeriods > 0
      ? teacher.weeklyPeriods
      : displayAllocations.length * 5; // standard ~5 periods/week per allocated class subject
  const loadPercentage = Math.round((currentWeeklyPeriods / maxWeeklyPeriods) * 100);
  const isOverloaded = currentWeeklyPeriods > maxWeeklyPeriods;
  const isNearCapacity = currentWeeklyPeriods >= 24 && !isOverloaded;

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const isSelectedElective = selectedSubject?.isElective;
  const projectedWeeklyPeriods = currentWeeklyPeriods + 5;
  const willExceedCBSE = projectedWeeklyPeriods > maxWeeklyPeriods;

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !selectedSectionId || !selectedSubjectId || !teacherUserId) return;
    setBusy(true);
    setNotice(null);
    try {
      await assignSchoolAdminSectionTeacher(organizationId, selectedSectionId, {
        subjectId: selectedSubjectId,
        teacherUserId,
      });
      setNotice({ text: "Faculty successfully allocated for the academic year!", ok: true });
      setShowAddModal(false);
      setSelectedSectionId("");
      setSelectedSubjectId("");
      await onAllocationsUpdated();
    } catch (err: any) {
      setNotice({ text: err.message || "Failed to allocate class subject.", ok: false });
    } finally {
      setBusy(false);
    }
  };

  const handleDeallocate = async (item: AllocationItem) => {
    if (
      !window.confirm(
        `Are you sure you want to de-allocate ${teacher.name} from ${item.className} (${item.subjectName})?\n\nNote: All historical attendance sessions and student report cards remain 100% preserved.`
      )
    ) {
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await assignSchoolAdminSectionTeacher(organizationId, item.sectionId, {
        subjectId: item.subjectId,
        teacherUserId: null,
      });
      setNotice({ text: "Faculty de-allocated from class section.", ok: true });
      await onAllocationsUpdated();
    } catch (err: any) {
      setNotice({ text: err.message || "Failed to de-allocate.", ok: false });
    } finally {
      setBusy(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignItem || !successorTeacherId || !organizationId) return;
    setBusy(true);
    setNotice(null);
    try {
      await assignSchoolAdminSectionTeacher(organizationId, reassignItem.sectionId, {
        subjectId: reassignItem.subjectId,
        teacherUserId: successorTeacherId,
      });
      setNotice({
        text: "Faculty re-assigned. Future timetable and grading responsibility transferred successfully!",
        ok: true,
      });
      setReassignItem(null);
      setSuccessorTeacherId("");
      await onAllocationsUpdated();
    } catch (err: any) {
      setNotice({ text: err.message || "Failed to reassign faculty.", ok: false });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. Notice Banner */}
      {notice && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "6px",
            background: notice.ok ? "#ecfdf5" : "#fef2f2",
            border: notice.ok ? "1px solid #a7f3d0" : "1px solid #fecaca",
            color: notice.ok ? "#065f46" : "#991b1b",
            fontSize: "12.5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Top Workload & Capacity Indicator (Edge Case 1) */}
      <div
        style={{
          border: isOverloaded ? "1px solid #fca5a5" : "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "16px",
          background: isOverloaded ? "#fff1f2" : "#ffffff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={15} style={{ color: isOverloaded ? "#dc2626" : "#0c1e33" }} />
              <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 700, color: "#0c1e33" }}>
                Instructional Workload &amp; Capacity
              </h4>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  background: isOverloaded ? "#fee2e2" : isNearCapacity ? "#fef3c7" : "#dcfce7",
                  color: isOverloaded ? "#991b1b" : isNearCapacity ? "#92400e" : "#166534",
                }}
              >
                {isOverloaded ? "Over-allocated" : isNearCapacity ? "Near Capacity" : "Optimal Load"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: "#64748b" }}>
              CBSE Statutory Teaching Load Ceiling: <b>{maxWeeklyPeriods} periods/week</b>
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "18px", fontWeight: 800, color: isOverloaded ? "#dc2626" : "#0c1e33" }}>
              {currentWeeklyPeriods}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}> / {maxWeeklyPeriods} periods</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: "10px", height: "7px", width: "100%", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, loadPercentage)}%`,
              background: isOverloaded ? "#dc2626" : isNearCapacity ? "#f59e0b" : "#10b981",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {isOverloaded && (
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11.5px",
              color: "#b91c1c",
              fontWeight: 500,
            }}
          >
            <AlertTriangle size={14} />
            <span>
              Workload exceeds statutory guidelines ({currentWeeklyPeriods} &gt; {maxWeeklyPeriods} periods). Consider reassigning sections to co-faculty.
            </span>
          </div>
        )}
      </div>

      {/* 3. Section Allocations Header & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>
            Annual Subject &amp; Class Allocations ({displayAllocations.length})
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#64748b" }}>
            Full Academic Session 2026-27 assignments (primary curriculum, attendance &amp; evaluation ownership)
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddModal(true);
            setNotice(null);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 14px",
            background: "#0c1e33",
            color: "#ffffff",
            borderRadius: "6px",
            border: "none",
            fontSize: "12px",
            fontWeight: 650,
            cursor: "pointer",
          }}
        >
          <Plus size={14} /> Allocate Class &amp; Subject
        </button>
      </div>

      {/* 4. Allocations Cards Grid */}
      {displayAllocations.length === 0 ? (
        <div
          style={{
            padding: "32px 20px",
            textAlign: "center",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <GraduationCap size={28} style={{ color: "#94a3b8", margin: "0 auto 8px" }} />
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>No Classroom Sections Allocated</div>
          <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
            Click &ldquo;Allocate Class &amp; Subject&rdquo; above to map this teacher to specific class cohorts for the academic year.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {displayAllocations.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: "#ffffff",
                padding: "14px 16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Layers size={14} style={{ color: "#0c1e33" }} />
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>{item.className}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: item.isElective ? "#f3e8ff" : "#e0f2fe",
                      color: item.isElective ? "#6b21a8" : "#0369a1",
                    }}
                  >
                    {item.isElective ? "Elective Subject" : "Core Subject"}
                  </span>
                </div>

                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <BookOpen size={13} style={{ color: "#475569" }} />
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                    {item.subjectName}
                  </span>
                  {item.subjectCode && (
                    <span style={{ fontSize: "10.5px", color: "#64748b" }}>({item.subjectCode})</span>
                  )}
                </div>

                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CalendarCheck size={12} style={{ color: "#166534" }} />
                  <span style={{ fontSize: "11px", color: "#166534", fontWeight: 500 }}>
                    Academic Session 2026-27 (Permanent)
                  </span>
                </div>
              </div>

              {/* Action Buttons for Handover / Deallocation */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                {availableTeachers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setReassignItem(item);
                      setSuccessorTeacherId("");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 8px",
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#0c1e33",
                      cursor: "pointer",
                    }}
                    title="Transfer this section to another faculty (preserves historical attendance & marks)"
                  >
                    <ArrowRightLeft size={11} /> Reassign Faculty
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeallocate(item)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    background: "#ffffff",
                    border: "1px solid #fecaca",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#b91c1c",
                    cursor: "pointer",
                  }}
                  title="Remove teacher allocation from this section"
                >
                  <Trash2 size={11} /> De-allocate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Allocate Class & Subject Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              padding: "22px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <GraduationCap size={18} style={{ color: "#0c1e33" }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0c1e33" }}>
                  Allocate Section &amp; Subject to {teacher.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAllocate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Class Section Select */}
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Class &amp; Section *
                </label>
                <select
                  required
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                >
                  <option value="">Select target class section…</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.programName ? `${s.programName} - ${s.name}` : `Class ${s.name}`} ({s.code || s.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Select */}
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Instructional Subject *
                </label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                >
                  <option value="">Select curriculum subject…</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} {sub.code ? `(${sub.code})` : ""} {sub.isElective ? "— [Elective]" : "— [Core]"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Elective vs Core info card (Edge Case 3) */}
              {selectedSubject && (
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    background: isSelectedElective ? "#faf5ff" : "#f0f9ff",
                    border: isSelectedElective ? "1px solid #e9d5ff" : "1px solid #bae6fd",
                    fontSize: "11.5px",
                  }}
                >
                  <b style={{ color: isSelectedElective ? "#6b21a8" : "#0369a1" }}>
                    {isSelectedElective ? "Elective Coursework" : "Core Curriculum Subject"}
                  </b>
                  <p style={{ margin: "2px 0 0", color: "#475569" }}>
                    {isSelectedElective
                      ? "Assigned to enrolled elective batches in this section. Evaluation registers are maintained per cohort."
                      : "Mandatory subject for all students enrolled in this section."}
                  </p>
                </div>
              )}

              {/* Projected Workload Warning (Edge Case 1) */}
              <div
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  background: willExceedCBSE ? "#fef2f2" : "#f8fafc",
                  border: willExceedCBSE ? "1px solid #fecaca" : "1px solid #e2e8f0",
                  fontSize: "11.5px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                  <span style={{ color: willExceedCBSE ? "#991b1b" : "#475569" }}>Projected Weekly Load:</span>
                  <span style={{ color: willExceedCBSE ? "#dc2626" : "#0c1e33" }}>
                    {currentWeeklyPeriods} &rarr; {projectedWeeklyPeriods} / {maxWeeklyPeriods} periods
                  </span>
                </div>
                {willExceedCBSE && (
                  <p style={{ margin: "4px 0 0", color: "#b91c1c" }}>
                    Adding this section will exceed the CBSE statutory ceiling of 28 periods/week for this faculty.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "8px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  style={{ padding: "8px 18px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  {busy ? "Saving…" : "Save Academic Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Mid-Year Reassign Successor Faculty Modal (Edge Case 2) */}
      {reassignItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              padding: "22px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ArrowRightLeft size={18} style={{ color: "#0c1e33" }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0c1e33" }}>
                  Reassign Faculty for {reassignItem.className} ({reassignItem.subjectName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReassignItem(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReassign} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Select Successor Teacher *
                </label>
                <select
                  required
                  value={successorTeacherId}
                  onChange={(e) => setSuccessorTeacherId(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
                >
                  <option value="">Select successor faculty…</option>
                  {availableTeachers.map((tc) => (
                    <option key={tc.id} value={tc.userId || tc.id}>
                      {tc.name} ({tc.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Handover & Data Integrity Notice */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "6px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  fontSize: "11.5px",
                  color: "#166534",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                  <CheckCircle2 size={14} />
                  <span>Historical Data Integrity Protected</span>
                </div>
                <p style={{ margin: "4px 0 0", color: "#14532d", lineHeight: 1.4 }}>
                  All previously recorded attendance sessions, student evaluations, and graded report cards will
                  remain permanently credited to <b>{teacher.name}</b>. Timetable periods and future grading responsibility will smoothly transfer to the successor.
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setReassignItem(null)}
                  style={{ padding: "8px 14px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  style={{ padding: "8px 18px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  {busy ? "Transferring…" : "Confirm Handover & Reassign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
