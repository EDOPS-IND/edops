import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2, Layers, Send, FileEdit, Clock } from "lucide-react";

type Section = { id: string; name: string; programName?: string; subjects?: { id: string; name: string; code?: string }[] };
type RowPlan = { sectionId: string; subjectId: string; examDate?: string; startTime: string; endTime: string; maxMarks: number; passingMarks: number };

type DateSheetRow = {
  id: string;
  examDate: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  maxMarks: string | number;
  passingMarks: string | number;
};

type ClassGroup = {
  id: string;
  name: string;
  selectedClasses: string[];
  defaultStartTime: string;
  defaultEndTime: string;
  rows: DateSheetRow[];
};

function getDurationLabel(start: string, end: string) {
  if (!start || !end || start >= end) return "--";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diffMins = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMins <= 0) return "--";
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
  return `${mins}m`;
}

export function ExamPlanDrawer({
  open,
  sections,
  allSubjects,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  sections: Section[];
  allSubjects?: { id: string; name: string }[];
  busy?: boolean;
  onClose: () => void;
  onSubmit: (value: {
    examName: string;
    term: string;
    examDate: string;
    status: "draft" | "scheduled";
    plans: RowPlan[];
  }) => void;
}) {
  const allClasses = useMemo(
    () => [...new Set(sections.map((s) => s.programName).filter(Boolean))] as string[],
    [sections],
  );

  const defaultDate = useMemo(
    () => new Date(Date.now() + 86400000).toISOString().split("T")[0],
    [],
  );

  const newDateSheetRow = (dateStr?: string, start = "09:00", end = "11:00"): DateSheetRow => ({
    id: Math.random().toString(36).slice(2, 9),
    examDate: dateStr || defaultDate,
    subjectName: "",
    startTime: start,
    endTime: end,
    maxMarks: "50",
    passingMarks: "17",
  });

  const newGroup = (name: string, initialClasses: string[] = []): ClassGroup => ({
    id: Math.random().toString(36).slice(2, 9),
    name,
    selectedClasses: initialClasses,
    defaultStartTime: "09:00",
    defaultEndTime: "11:00",
    rows: [newDateSheetRow(defaultDate, "09:00", "11:00")],
  });

  const [examName, setExamName] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      if (!groups.length) {
        setGroups([newGroup("Class Group 1", allClasses.slice(0, 6))]);
      }
    }
  }, [open, allClasses]);

  if (!open) return null;

  const updateGroup = (groupId: string, patch: Partial<ClassGroup>) => {
    setGroups((curr) => curr.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  };

  const toggleClassInGroup = (groupId: string, className: string) => {
    setGroups((curr) =>
      curr.map((g) => {
        if (g.id !== groupId) return g;
        const exists = g.selectedClasses.includes(className);
        const next = exists
          ? g.selectedClasses.filter((c) => c !== className)
          : [...g.selectedClasses, className];
        return { ...g, selectedClasses: next };
      }),
    );
  };

  const toggleAllClassesInGroup = (groupId: string, selectAll: boolean) => {
    setGroups((curr) =>
      curr.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, selectedClasses: selectAll ? [...allClasses] : [] };
      }),
    );
  };

  const updateRowInGroup = (groupId: string, rowId: string, patch: Partial<DateSheetRow>) => {
    setGroups((curr) =>
      curr.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          rows: g.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
        };
      }),
    );
  };

  const addRowToGroup = (groupId: string) => {
    setGroups((curr) =>
      curr.map((g) => {
        if (g.id !== groupId) return g;
        const lastRow = g.rows[g.rows.length - 1];
        let nextDate = defaultDate;
        if (lastRow?.examDate) {
          const d = new Date(lastRow.examDate);
          d.setDate(d.getDate() + 2); // next exam day
          nextDate = d.toISOString().split("T")[0];
        }
        return {
          ...g,
          rows: [
            ...g.rows,
            newDateSheetRow(
              nextDate,
              lastRow?.startTime || g.defaultStartTime,
              lastRow?.endTime || g.defaultEndTime,
            ),
          ],
        };
      }),
    );
  };

  const removeRowFromGroup = (groupId: string, rowId: string) => {
    setGroups((curr) =>
      curr.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, rows: g.rows.filter((r) => r.id !== rowId) };
      }),
    );
  };

  const handleAction = (status: "draft" | "scheduled") => {
    if (!examName.trim()) {
      setError("Please provide an Examination Name.");
      return;
    }
    if (!term.trim()) {
      setError("Please provide an Academic Term / Cycle.");
      return;
    }
    if (!groups.length) {
      setError("Add at least one Class Group.");
      return;
    }

    const plans: RowPlan[] = [];

    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      if (!g.selectedClasses.length) {
        setError(`Group "${g.name || gi + 1}" has no selected classes.`);
        return;
      }
      if (!g.rows.length) {
        setError(`Group "${g.name || gi + 1}" has no exam rows in timetable.`);
        return;
      }

      // Check rows validity
      for (const r of g.rows) {
        if (!r.subjectName.trim()) {
          setError(`Select a subject for each exam row in "${g.name || gi + 1}".`);
          return;
        }
        if (!r.examDate) {
          setError(`Choose a valid date for each exam in "${g.name || gi + 1}".`);
          return;
        }
        if (r.startTime >= r.endTime) {
          setError(`Start time must be before end time in "${g.name || gi + 1}".`);
          return;
        }
        const maxMarksNum = Number(r.maxMarks);
        const passMarksNum = Number(r.passingMarks);
        if (isNaN(maxMarksNum) || maxMarksNum <= 0) {
          setError(`Enter valid maximum marks for each exam in "${g.name || gi + 1}".`);
          return;
        }
        if (isNaN(passMarksNum) || passMarksNum <= 0 || passMarksNum > maxMarksNum) {
          setError(`Passing marks must be between 0.01 and maximum marks (${maxMarksNum}) in "${g.name || gi + 1}".`);
          return;
        }
      }

      // Map group rows to sections and their matching subjects
      const groupSections = sections.filter(
        (s) => s.programName && g.selectedClasses.includes(s.programName),
      );

      for (const sec of groupSections) {
        for (const row of g.rows) {
          // Find subject in this section or in school's overall subjects
          const sub =
            (sec.subjects || []).find(
              (s) =>
                s.name.toLowerCase() === row.subjectName.toLowerCase() ||
                s.id === row.subjectName,
            ) ||
            (allSubjects || []).find(
              (s) =>
                s.name.toLowerCase() === row.subjectName.toLowerCase() ||
                s.id === row.subjectName,
            );

          if (!sub) {
            setError(
              `Subject "${row.subjectName}" is not registered in the school catalog for ${sec.programName || "selected class"}.`,
            );
            return;
          }

          plans.push({
            sectionId: sec.id,
            subjectId: sub.id,
            examDate: row.examDate,
            startTime: row.startTime,
            endTime: row.endTime,
            maxMarks: Number(row.maxMarks),
            passingMarks: Number(row.passingMarks),
          });
        }
      }
    }

    if (!plans.length) {
      setError(
        "No matching enrolled subjects were found for the selected classes. Please ensure enrolled subjects match your timetable entries.",
      );
      return;
    }

    onSubmit({
      examName: examName.trim(),
      term: term.trim(),
      examDate: plans[0].examDate || defaultDate,
      status,
      plans,
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    handleAction("draft");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(12,30,51,.55)",
        backdropFilter: "blur(2px)",
      }}
    >
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        .desktop-exam-table {
          display: block;
        }
        .mobile-exam-cards {
          display: none;
        }
        @media (max-width: 768px) {
          .desktop-exam-table {
            display: none !important;
          }
          .mobile-exam-cards {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
          }
          .exam-drawer-aside {
            width: 100% !important;
            max-width: 100vw !important;
          }
          .exam-drawer-header {
            padding: 14px 16px !important;
          }
          .exam-drawer-scroll-body {
            padding: 16px !important;
            gap: 16px !important;
          }
          .exam-drawer-footer {
            flex-direction: column-reverse !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 12px 16px !important;
            margin: 0 !important;
          }
          .exam-drawer-actions {
            width: 100% !important;
            flex-direction: column !important;
            gap: 8px !important;
          }
          .exam-drawer-actions button {
            width: 100% !important;
            justify-content: center !important;
          }
          .exam-drawer-footer-text {
            width: 100% !important;
            text-align: center !important;
            justify-content: center !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          .exam-group-header {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
        }
      `}</style>
      <aside
        className="edops-right-drawer exam-drawer-aside"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          maxHeight: "100vh",
          width: "min(1020px, 100vw)",
          background: "#fff",
          boxShadow: "-12px 0 30px rgba(0,0,0,.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <form
          onSubmit={submit}
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "100vh",
            overflow: "hidden",
          }}
        >
          {/* 1. Header (Fixed, flex-shrink: 0) */}
          <div
            className="exam-drawer-header"
            style={{
              flexShrink: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              background: "#f8fafc",
              borderBottom: "1px solid #e4e6e9",
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: "#0c1e33", fontSize: "16px", fontWeight: 700 }}>
                Schedule School Examination (Date-Sheet Matrix)
              </h3>
              <small style={{ color: "#64748B", fontSize: "12px" }}>
                Define exam timetable by class groups (e.g. Class 1–6 vs Class 7–10) with custom dates &amp; durations
              </small>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "transparent", border: 0, cursor: "pointer", color: "#64748B", padding: "4px" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 2. Scrollable Body (flex: 1 1 auto; independent scroll container) */}
          <div
            className="exam-drawer-scroll-body"
            style={{
              flex: "1 1 auto",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              padding: "20px 24px 30px",
              display: "grid",
              gap: "20px",
            }}
          >
          {error && (
            <div
              style={{
                padding: "12px 14px",
                color: "#991B1B",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 8,
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {/* Exam Master Header */}
          <div
            style={{
              padding: "16px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
            }}
          >
            <label style={label}>
              <span>Examination Title <span style={{ color: "#D92D20" }}>*</span></span>
              <input
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. Term 1 Mid-Term Examination 2026-27"
                style={input}
              />
            </label>
            <label style={label}>
              <span>Academic Term / Cycle <span style={{ color: "#D92D20" }}>*</span></span>
              <input
                required
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. Term 1"
                style={input}
              />
            </label>
          </div>

          {/* Class Groups with Date-Sheet Tables */}
          {groups.map((group, gIdx) => {
            // Find unique subjects across sections of selected classes in this group or all school subjects
            const groupSections = sections.filter(
              (s) => s.programName && group.selectedClasses.includes(s.programName),
            );
            const availableSubjectNames = Array.from(
              new Set([
                ...(allSubjects || []).map((s) => s.name),
                ...groupSections.flatMap((s) => (s.subjects || []).map((sub) => sub.name)),
              ]),
            ).filter(Boolean).sort();

            const allSelected =
              allClasses.length > 0 &&
              group.selectedClasses.length === allClasses.length;

            return (
              <div
                key={group.id}
                style={{
                  border: "1px solid #CBD5E1",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* Group Header */}
                <div
                  className="exam-group-header"
                  style={{
                    padding: "14px 18px",
                    background: "#F1F5F9",
                    borderBottom: "1px solid #CBD5E1",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <Layers size={18} color="#0c1e33" style={{ flexShrink: 0 }} />
                    <input
                      value={group.name}
                      onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                      placeholder="Class Group Title (e.g. Classes 1 to 6)"
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0c1e33",
                        border: "1px solid transparent",
                        background: "transparent",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        maxWidth: "100%",
                      }}
                    />
                  </div>
                  {groups.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setGroups((curr) => curr.filter((g) => g.id !== group.id))
                      }
                      style={{ ...iconButton, fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <Trash2 size={14} /> Remove Group
                    </button>
                  )}
                </div>

                <div style={{ padding: "16px", display: "grid", gap: "14px" }}>
                  {/* Class Selection Chips */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                        Assigned Classes ({group.selectedClasses.length}/{allClasses.length} selected):
                      </span>
                      <label style={{ fontSize: "12px", color: "#0c1e33", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => toggleAllClassesInGroup(group.id, e.target.checked)}
                        />
                        Select All Classes
                      </label>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {allClasses.map((cls) => {
                        const isSelected = group.selectedClasses.includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => toggleClassInGroup(group.id, cls)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "16px",
                              border: isSelected ? "1.5px solid #0c1e33" : "1px solid #E2E8F0",
                              background: isSelected ? "#0c1e33" : "#F8FAFC",
                              color: isSelected ? "#FFFFFF" : "#475569",
                              fontSize: "12px",
                              fontWeight: isSelected ? 600 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {cls}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1. Desktop Table View */}
                  <div className="desktop-exam-table" style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: "8px", WebkitOverflowScrolling: "touch" }}>
                    <table style={{ width: "100%", minWidth: "860px", borderCollapse: "collapse", fontSize: "12.5px" }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#475569" }}>
                          <th style={{ padding: "10px 12px", fontWeight: 600, width: "155px" }}>Date</th>
                          <th style={{ padding: "10px 12px", fontWeight: 600, minWidth: "210px" }}>Subject</th>
                          <th style={{ padding: "10px 12px", fontWeight: 600, width: "115px" }}>Start</th>
                          <th style={{ padding: "10px 12px", fontWeight: 600, width: "115px" }}>End</th>
                          <th style={{ padding: "10px 12px", fontWeight: 600, width: "85px", textAlign: "center" }}>Duration</th>
                          <th style={{ padding: "10px 12px", fontWeight: 600, width: "85px" }}>Max</th>
                          <th style={{ padding: "10px 12px", fontWeight: 600, width: "85px" }}>Pass</th>
                          <th style={{ padding: "10px 12px", width: "40px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row) => {
                          const duration = getDurationLabel(row.startTime, row.endTime);
                          return (
                            <tr key={row.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "8px 12px" }}>
                                <input
                                  type="date"
                                  required
                                  value={row.examDate}
                                  onChange={(e) =>
                                    updateRowInGroup(group.id, row.id, { examDate: e.target.value })
                                  }
                                  style={tableInput}
                                />
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                {availableSubjectNames.length > 0 ? (
                                  <select
                                    required
                                    value={row.subjectName}
                                    onChange={(e) =>
                                      updateRowInGroup(group.id, row.id, {
                                        subjectName: e.target.value,
                                      })
                                    }
                                    style={{ ...tableInput, cursor: "pointer", background: "#FFFFFF" }}
                                  >
                                    <option value="">Select subject...</option>
                                    {availableSubjectNames.map((sName) => (
                                      <option key={sName} value={sName}>
                                        {sName}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    required
                                    placeholder="Enter Subject (e.g. Mathematics)"
                                    value={row.subjectName}
                                    onChange={(e) =>
                                      updateRowInGroup(group.id, row.id, {
                                        subjectName: e.target.value,
                                      })
                                    }
                                    style={tableInput}
                                  />
                                )}
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                <input
                                  type="time"
                                  required
                                  value={row.startTime}
                                  onChange={(e) =>
                                    updateRowInGroup(group.id, row.id, {
                                      startTime: e.target.value,
                                    })
                                  }
                                  style={tableInput}
                                />
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                <input
                                  type="time"
                                  required
                                  value={row.endTime}
                                  onChange={(e) =>
                                    updateRowInGroup(group.id, row.id, {
                                      endTime: e.target.value,
                                    })
                                  }
                                  style={tableInput}
                                />
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    background: "#F1F5F9",
                                    color: "#334155",
                                    fontWeight: 600,
                                    fontSize: "11.5px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {duration}
                                </span>
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  required
                                  value={String(row.maxMarks ?? "")}
                                  onChange={(e) => {
                                    const clean = e.target.value.replace(/[^0-9]/g, "");
                                    updateRowInGroup(group.id, row.id, { maxMarks: clean });
                                  }}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (val > 0 && (!row.passingMarks || Number(row.passingMarks) > val)) {
                                      updateRowInGroup(group.id, row.id, {
                                        passingMarks: String(Math.max(1, Math.round(val * 0.33))),
                                      });
                                    }
                                  }}
                                  style={{ ...tableInput, textAlign: "center", minWidth: "75px" }}
                                  placeholder="100"
                                />
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  required
                                  value={String(row.passingMarks ?? "")}
                                  onChange={(e) => {
                                    const clean = e.target.value.replace(/[^0-9]/g, "");
                                    updateRowInGroup(group.id, row.id, { passingMarks: clean });
                                  }}
                                  style={{ ...tableInput, textAlign: "center", minWidth: "75px" }}
                                  placeholder="33"
                                />
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                {group.rows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeRowFromGroup(group.id, row.id)}
                                    style={iconButton}
                                    title="Delete row"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Mobile Cards View (< 768px) */}
                  <div className="mobile-exam-cards">
                    {group.rows.map((row, rIdx) => {
                      const duration = getDurationLabel(row.startTime, row.endTime);
                      return (
                        <div
                          key={row.id}
                          style={{
                            padding: "14px",
                            border: "1px solid #E2E8F0",
                            borderRadius: "10px",
                            background: "#F8FAFC",
                            display: "grid",
                            gap: "10px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0c1e33" }}>
                              Exam Paper #{rIdx + 1}
                            </span>
                            {group.rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRowFromGroup(group.id, row.id)}
                                style={iconButton}
                                title="Delete row"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <label style={label}>
                              <span>Date</span>
                              <input
                                type="date"
                                required
                                value={row.examDate}
                                onChange={(e) =>
                                  updateRowInGroup(group.id, row.id, { examDate: e.target.value })
                                }
                                style={tableInput}
                              />
                            </label>
                            <label style={label}>
                              <span>Subject</span>
                              {availableSubjectNames.length > 0 ? (
                                <select
                                  required
                                  value={row.subjectName}
                                  onChange={(e) =>
                                    updateRowInGroup(group.id, row.id, {
                                      subjectName: e.target.value,
                                    })
                                  }
                                  style={{ ...tableInput, cursor: "pointer", background: "#FFFFFF" }}
                                >
                                  <option value="">Select subject...</option>
                                  {availableSubjectNames.map((sName) => (
                                    <option key={sName} value={sName}>
                                      {sName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  required
                                  placeholder="Enter Subject"
                                  value={row.subjectName}
                                  onChange={(e) =>
                                    updateRowInGroup(group.id, row.id, {
                                      subjectName: e.target.value,
                                    })
                                  }
                                  style={tableInput}
                                />
                              )}
                            </label>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
                            <label style={label}>
                              <span>Start Time</span>
                              <input
                                type="time"
                                required
                                value={row.startTime}
                                onChange={(e) =>
                                  updateRowInGroup(group.id, row.id, {
                                    startTime: e.target.value,
                                  })
                                }
                                style={tableInput}
                              />
                            </label>
                            <label style={label}>
                              <span>End Time</span>
                              <input
                                type="time"
                                required
                                value={row.endTime}
                                onChange={(e) =>
                                  updateRowInGroup(group.id, row.id, {
                                    endTime: e.target.value,
                                  })
                                }
                                style={tableInput}
                              />
                            </label>
                            <div style={{ display: "grid", gap: "4px", paddingBottom: "2px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>Duration</span>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "7px 10px",
                                  borderRadius: "6px",
                                  background: "#E2E8F0",
                                  color: "#1E293B",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                  textAlign: "center",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {duration}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <label style={label}>
                              <span>Max Marks</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                required
                                value={String(row.maxMarks ?? "")}
                                onChange={(e) => {
                                  const clean = e.target.value.replace(/[^0-9]/g, "");
                                  updateRowInGroup(group.id, row.id, {
                                    maxMarks: clean,
                                  });
                                }}
                                onBlur={(e) => {
                                  const val = Number(e.target.value);
                                  if (val > 0 && (!row.passingMarks || Number(row.passingMarks) > val)) {
                                    updateRowInGroup(group.id, row.id, {
                                      passingMarks: String(Math.max(1, Math.round(val * 0.33))),
                                    });
                                  }
                                }}
                                style={{ ...tableInput, textAlign: "center" }}
                                placeholder="100"
                              />
                            </label>
                            <label style={label}>
                              <span>Pass Marks</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                required
                                value={String(row.passingMarks ?? "")}
                                onChange={(e) => {
                                  const clean = e.target.value.replace(/[^0-9]/g, "");
                                  updateRowInGroup(group.id, row.id, {
                                    passingMarks: clean,
                                  });
                                }}
                                style={{ ...tableInput, textAlign: "center" }}
                                placeholder="33"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Row Button */}
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <button
                      type="button"
                      onClick={() => addRowToGroup(group.id)}
                      style={{ ...secondaryButton, fontSize: "12px", padding: "7px 12px" }}
                    >
                      <Plus size={14} /> Add Exam Subject / Date Row
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Another Class Group Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                const assigned = new Set(groups.flatMap((g) => g.selectedClasses));
                const remaining = allClasses.filter((c) => !assigned.has(c));
                setGroups((curr) => [
                  ...curr,
                  newGroup(
                    `Class Group ${curr.length + 1}`,
                    remaining.length ? remaining : allClasses.slice(6),
                  ),
                ]);
              }}
              style={{ ...secondaryButton, width: "100%", justifyContent: "center", padding: "12px" }}
            >
              <Plus size={16} /> Add Another Class Group (e.g. for Secondary / Senior Wing)
            </button>
          </div>
          </div>

          {/* Footer Action Buttons */}
          <div
            className="exam-drawer-footer"
            style={{
              flexShrink: 0,
              background: "#FFFFFF",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              borderTop: "1px solid #E2E8F0",
              padding: "14px 24px",
              boxShadow: "0 -4px 16px rgba(12,30,51,0.06)",
            }}
          >
            <div className="exam-drawer-footer-text" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B", fontSize: "12px", minWidth: 0 }}>
              <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#0c1e33", flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>
                <strong>Draft</strong> saves the timetable privately. <strong>Publish</strong> immediately notifies affected students &amp; teachers.
              </span>
            </div>

            <div className="exam-drawer-actions" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  border: "1px solid #D0D5DD",
                  background: "#FFFFFF",
                  color: "#344054",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleAction("draft")}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  border: "1.5px solid #0c1e33",
                  background: "#F8FAFC",
                  color: "#0c1e33",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: busy ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                <FileEdit size={14} />
                {busy ? "Saving..." : "Save as Draft"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleAction("scheduled")}
                style={{
                  height: "38px",
                  padding: "0 22px",
                  borderRadius: "8px",
                  border: "1.5px solid #0c1e33",
                  background: "#0c1e33",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: busy ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  boxShadow: "0 2px 6px rgba(12,30,51,0.22)",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                <Send size={14} />
                {busy ? "Publishing..." : "Publish Timetable"}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}

const label: React.CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  fontWeight: 600,
  color: "#344054",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  background: "#fff",
};

const tableInput: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "7px 10px",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  fontSize: "12.5px",
  background: "#fff",
  color: "#0f172a",
};

const secondaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 14px",
  borderRadius: 6,
  border: "1px solid #d0d5dd",
  background: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 13,
  whiteSpace: "nowrap",
};

const primaryButton: React.CSSProperties = {
  ...secondaryButton,
  border: 0,
  background: "#0c1e33",
  color: "#fff",
};

const iconButton: React.CSSProperties = {
  border: 0,
  background: "transparent",
  color: "#B42318",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px",
};
