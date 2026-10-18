"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Clock, UserX, AlertCircle } from "lucide-react";
import { markTeacherAttendance, getTeacherClassDetails } from "../../edops-api";

const S = {
  navy: "#0c1e33",
  slate: "#495d72",
  muted: "#a6abb5",
  faint: "#b3b3b3",
  pageBg: "#f4f6f7",
  white: "#ffffff",
  border: "#e4e6e9",
  line: "#ced8e5",
  chip: "#f5f6f8",
  blue: "#17a1fa",
  greenBg: "#d9eed1",
  greenDark: "#1a5c0a",
  coralBg: "#ffd8c7",
  coralDark: "#782a00",
  amberBg: "#fcedb6",
  amberDark: "#614400",
};

interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  sectionId?: string;
  subjectId?: string;
  classSectionName?: string;
  classSection?: string;
  periodNumber?: number;
  onSuccess?: () => void;
}

export function QuickAttendanceModal({
  isOpen,
  onClose,
  organizationId,
  sectionId = "",
  subjectId = "",
  classSectionName,
  classSection,
  periodNumber = 1,
  onSuccess,
}: QuickAttendanceModalProps) {
  const activeClassName = classSection || classSectionName || "Active Class";
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const period = periodNumber || 1;
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [students, setStudents] = useState<
    Array<{ id: string; name: string; roll: string; status: "present" | "absent" | "late" | "excused" }>
  >([]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && sectionId) {
      loadSectionRoster();
    }
  }, [isOpen, sectionId, organizationId]);

  async function loadSectionRoster() {
    try {
      const res = await getTeacherClassDetails(organizationId, sectionId);
      if (res?.students && res.students.length > 0) {
        setStudents(
          res.students.map((s: any) => ({
            id: s.id,
            name: s.name,
            roll: s.rollNumber || "01",
            status: "present" as const,
          }))
        );
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    }
  }

  if (!isOpen) return null;

  const toggleStatus = (id: string, status: "present" | "absent" | "late" | "excused") => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const markAll = (status: "present" | "absent") => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await markTeacherAttendance(organizationId, {
        sectionId,
        subjectId: subjectId || undefined,
        date,
        period,
        records: students.map((s) => ({ studentId: s.id, status: s.status })),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Attendance for this class period has already been finalized today. Duplicate attendance is not allowed.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(12, 30, 51, 0.45)",
        backdropFilter: "blur(2px)",
        padding: "16px",
        boxSizing: "border-box",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          background: S.white,
          border: `1px solid ${S.border}`,
          borderRadius: "14px",
          boxShadow: "0 20px 40px rgba(12, 30, 51, 0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "24px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: `1px solid ${S.line}`, paddingBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: S.navy, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Period Register
              </span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: S.slate, background: S.chip, padding: "2px 8px", borderRadius: "6px", border: `1px solid ${S.border}` }}>
                Slot: P{period} · {date}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: S.navy }}>
              Take Attendance — {activeClassName}
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: S.slate }}>
              Date: {date} • Period {period} • Real-time Attendance Ledger
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: S.slate,
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "8px", background: S.coralBg, color: S.coralDark, fontSize: "12px", border: `1px solid rgba(120,42,0,0.2)` }}>
            <AlertCircle size={16} color={S.coralDark} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Bulk Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: S.chip, padding: "10px 14px", borderRadius: "10px", border: `1px solid ${S.border}` }}>
          <div style={{ fontSize: "12px", color: S.slate }}>
            Summary: <strong style={{ color: S.greenDark }}>{presentCount} Present</strong>,{" "}
            <strong style={{ color: S.coralDark }}>{absentCount} Absent</strong>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => markAll("present")}
              style={{
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "6px",
                background: S.greenBg,
                color: S.greenDark,
                border: "none",
                cursor: "pointer",
              }}
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll("absent")}
              style={{
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 600,
                borderRadius: "6px",
                background: S.coralBg,
                color: S.coralDark,
                border: "none",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Student Register List */}
        <div style={{ maxHeight: "280px", overflowY: "auto", border: `1px solid ${S.border}`, borderRadius: "10px" }}>
          {students.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: S.muted, fontSize: "12px" }}>
              No enrolled students found in {activeClassName}.
            </div>
          ) : (
            students.map((student, idx) => (
              <div
                key={student.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderBottom: idx !== students.length - 1 ? `1px solid ${S.border}` : "none",
                  background: S.white,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: "24px", textAlign: "center", fontSize: "12px", fontWeight: 700, color: S.muted }}>
                    {student.roll}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: S.navy }}>
                    {student.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {(["present", "absent", "late"] as const).map((st) => {
                    const active = student.status === st;
                    let bg = S.chip;
                    let color = S.slate;
                    if (active) {
                      if (st === "present") { bg = S.greenDark; color = S.white; }
                      else if (st === "absent") { bg = "#b91c1c"; color = S.white; }
                      else { bg = S.amberDark; color = S.white; }
                    }
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => toggleStatus(student.id, st)}
                        style={{
                          padding: "3px 10px",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          textTransform: "capitalize",
                          cursor: "pointer",
                          border: "none",
                          background: bg,
                          color: color,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 600,
              color: S.slate,
              background: "transparent",
              border: `1px solid ${S.line}`,
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "8px 18px",
              fontSize: "12px",
              fontWeight: 600,
              color: S.white,
              background: S.navy,
              border: "none",
              borderRadius: "8px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              boxShadow: "0 2px 6px rgba(12,30,51,0.2)",
            }}
          >
            {saving ? "Finalizing Register..." : "Finalize & Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
