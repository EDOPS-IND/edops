"use client";

import React, { useState } from "react";
import { Plus, X, BookOpen, AlertCircle, Sparkles, UserCheck } from "lucide-react";

export interface AvailableSubject {
  id: string;
  name: string;
  code: string;
}

export interface TeacherOption {
  id: string;
  name: string;
  email?: string;
}

export interface ClassSubjectAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  availableSubjects: AvailableSubject[];
  alreadyAllocatedSubjectIds: string[];
  teachers: TeacherOption[];
  defaultTeacherId?: string | null;
  onAllocate: (data: {
    subjectId?: string;
    teacherUserId?: string | null;
    newSubjectName?: string;
    newSubjectCode?: string;
  }) => Promise<void>;
}

export function ClassSubjectAllocationModal({
  isOpen,
  onClose,
  sectionName,
  availableSubjects = [],
  alreadyAllocatedSubjectIds = [],
  teachers = [],
  defaultTeacherId,
  onAllocate,
}: ClassSubjectAllocationModalProps) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [newSubjectName, setNewSubjectName] = useState<string>("");
  const [newSubjectCode, setNewSubjectCode] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(defaultTeacherId || "");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  // Filter out subjects already assigned to this section to prevent duplicates
  const unassignedSubjects = availableSubjects.filter(
    (s) => !alreadyAllocatedSubjectIds.includes(s.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "existing") {
      if (!selectedSubjectId) {
        setError("Please choose a subject to allocate.");
        return;
      }
    } else {
      if (!newSubjectName.trim()) {
        setError("Please enter a subject name.");
        return;
      }
    }

    try {
      setBusy(true);
      await onAllocate({
        subjectId: mode === "existing" ? selectedSubjectId : undefined,
        teacherUserId: selectedTeacherId || null,
        newSubjectName: mode === "new" ? newSubjectName.trim() : undefined,
        newSubjectCode: mode === "new" ? newSubjectCode.trim() : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to allocate subject to this class.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alloc-subject-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(12, 30, 51, 0.7)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 45px rgba(12,30,51,0.25)",
          border: "1px solid #ced8e5",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e4e6e9",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              id="alloc-subject-title"
              style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0c1e33" }}
            >
              Allocate Subject to Class
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
              Target Section: <strong style={{ color: "#0c1e33" }}>{sectionName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          {error && (
            <div
              style={{
                padding: "10px 12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                color: "#991b1b",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              background: "#f1f5f9",
              padding: "4px",
              borderRadius: "8px",
              marginBottom: "18px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("existing");
                setError("");
              }}
              style={{
                all: "unset",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                textAlign: "center",
                fontSize: "12px",
                fontWeight: mode === "existing" ? 700 : 500,
                background: mode === "existing" ? "#ffffff" : "transparent",
                color: mode === "existing" ? "#0c1e33" : "#64748b",
                boxShadow: mode === "existing" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}
            >
              School Subject Bank
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("new");
                setError("");
              }}
              style={{
                all: "unset",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                textAlign: "center",
                fontSize: "12px",
                fontWeight: mode === "new" ? 700 : 500,
                background: mode === "new" ? "#ffffff" : "transparent",
                color: mode === "new" ? "#0c1e33" : "#64748b",
                boxShadow: mode === "new" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}
            >
              + Create New Subject
            </button>
          </div>

          {/* Tab 1: Pick from existing school subjects */}
          {mode === "existing" ? (
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Select Subject from Master Bank
              </label>
              {unassignedSubjects.length === 0 ? (
                <div
                  style={{
                    padding: "12px",
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  All existing school subjects are already allocated to this class! Click "+ Create New Subject" to add a new one.
                </div>
              ) : (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ced8e5",
                    fontSize: "13px",
                    color: "#0c1e33",
                    background: "#ffffff",
                    outline: "none",
                  }}
                  required
                >
                  <option value="">-- Choose Subject ({unassignedSubjects.length} available) --</option>
                  {unassignedSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            /* Tab 2: Create new subject inline */
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Robotics, French, Sanskrit, Environmental Studies"
                  value={newSubjectName}
                  onChange={(e) => {
                    setNewSubjectName(e.target.value);
                    if (!newSubjectCode) {
                      setNewSubjectCode(
                        e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase()
                      );
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ced8e5",
                    fontSize: "13px",
                    color: "#0c1e33",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Subject Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ROB, FRN, SKT, EVS"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ced8e5",
                    fontSize: "13px",
                    color: "#0c1e33",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {/* Teacher Assignment Select */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Assign Primary Faculty (Teacher)
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #ced8e5",
                fontSize: "13px",
                color: "#0c1e33",
                background: "#ffffff",
                outline: "none",
              }}
            >
              <option value="">-- Assign Later / Use Class Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.email ? `(${t.email})` : ""}
                </option>
              ))}
            </select>
            <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#64748b" }}>
              In Indian schools, faculty can be updated at any time from the Class Command Center or Timetable.
            </p>
          </div>

          {/* Modal Footer Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{
                all: "unset",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#475569",
                background: "#f1f5f9",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "8px 20px",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#ffffff",
                background: "#0c1e33",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Allocating..." : "Allocate Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}