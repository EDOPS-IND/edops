"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { getTeacherClassRegister } from "@/app/api/teacher";
import { toDDMMYYYY } from "@/app/components/school-calendar-grid";
import { T } from "./types";

interface MonthlyRegisterViewProps {
  organizationId: string;
}

export function MonthlyRegisterView({ organizationId }: MonthlyRegisterViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [registerData, setRegisterData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async (secId?: string, monthVal?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getTeacherClassRegister(
        organizationId,
        secId || selectedSectionId || undefined,
        monthVal || selectedMonth
      );
      setRegisterData(res);
      if (res?.section?.id && !selectedSectionId) {
        setSelectedSectionId(res.section.id);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load class attendance register matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedSectionId, selectedMonth);
  }, [organizationId, selectedSectionId, selectedMonth]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    const nextVal = d.toISOString().slice(0, 7);
    setSelectedMonth(nextVal);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    const nextVal = d.toISOString().slice(0, 7);
    setSelectedMonth(nextVal);
  };

  const days: Array<{ day: number; dateStr: string; dayOfWeek: string; isSunday: boolean }> =
    registerData?.days || [];
  const students: any[] = registerData?.students || [];
  const sections: any[] = registerData?.sections || [];
  const activeSection = registerData?.section;
  const approvedLeaves: any[] = registerData?.approvedLeaves || [];
  const holidays: any[] = registerData?.holidays || [];

  // Summary Metrics
  const totalStudents = students.length;
  const validPcts = students
    .map((s) => s.attendancePercentage)
    .filter((p) => typeof p === "number");
  const classAvgPct =
    validPcts.length > 0
      ? Math.round(validPcts.reduce((a, b) => a + b, 0) / validPcts.length)
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* 1. Header Toolbar */}
      <div
        style={{
          background: T.white,
          borderRadius: "12px",
          border: `1px solid ${T.border}`,
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: T.slate,
                display: "block",
                marginBottom: "2px",
              }}
            >
              Class Register
            </span>
            <select
              value={selectedSectionId || activeSection?.id || ""}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: T.navy,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                padding: "6px 10px",
                background: T.white,
                cursor: "pointer",
              }}
            >
              {sections.map((sec: any) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} {sec.isClassTeacher ? "★ (Class Teacher)" : ""}
                </option>
              ))}
            </select>
          </div>

          {activeSection?.isClassTeacher && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: T.greenDark,
                background: T.greenBg,
                padding: "4px 8px",
                borderRadius: "6px",
                alignSelf: "flex-end",
                marginBottom: "4px",
              }}
            >
              Designated Class Teacher
            </span>
          )}
        </div>

        {/* Month Navigation & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: T.chip,
              borderRadius: "8px",
              border: `1px solid ${T.border}`,
              padding: "2px",
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                color: T.navy,
              }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "12.5px",
                fontWeight: 600,
                color: T.navy,
                padding: "4px 6px",
                outline: "none",
                cursor: "pointer",
              }}
            />
            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                color: T.navy,
              }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: `1px solid ${T.border}`,
              background: T.white,
              color: T.navy,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Stat Badges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        <div style={{ background: T.white, borderRadius: "10px", border: `1px solid ${T.border}`, padding: "12px 16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: T.slate, textTransform: "uppercase" }}>Enrolled Students</span>
          <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 700, color: T.navy }}>{totalStudents}</p>
        </div>
        <div style={{ background: T.white, borderRadius: "10px", border: `1px solid ${T.border}`, padding: "12px 16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: T.slate, textTransform: "uppercase" }}>Class Monthly Average</span>
          <p style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 700, color: classAvgPct != null && classAvgPct < 75 ? T.roseDark : T.navy }}>
            {classAvgPct != null ? `${classAvgPct}%` : "—"}
          </p>
        </div>
        <div style={{ background: T.white, borderRadius: "10px", border: `1px solid ${T.border}`, padding: "12px 16px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: T.slate, textTransform: "uppercase" }}>Legend</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", fontSize: "11px", fontWeight: 600 }}>
            <span style={{ background: T.greenBg, color: T.greenDark, padding: "2px 6px", borderRadius: "4px" }}>P: Present</span>
            <span style={{ background: T.roseBg, color: T.roseDark, padding: "2px 6px", borderRadius: "4px" }}>A: Absent</span>
            <span style={{ background: T.amberBg, color: T.amberDark, padding: "2px 6px", borderRadius: "4px" }}>L: Late</span>
            <span style={{ background: T.chip, color: T.slate, padding: "2px 6px", borderRadius: "4px" }}>H: Sunday</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: T.roseBg, border: `1px solid ${T.roseDark}`, padding: "12px 16px", borderRadius: "8px", color: T.roseDark, fontSize: "12.5px" }}>
          {errorMsg}
        </div>
      )}

      {/* 3. The Monthly Matrix Grid */}
      <div
        style={{
          background: T.white,
          borderRadius: "12px",
          border: `1px solid ${T.border}`,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: "11.5px",
              textAlign: "center",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {/* Fixed Roll Number Column */}
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    background: "#f8fafc",
                    padding: "10px 12px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: T.navy,
                    borderBottom: `1px solid ${T.border}`,
                    borderRight: `1px solid ${T.border}`,
                    minWidth: "60px",
                  }}
                >
                  Roll
                </th>
                {/* Fixed Student Name Column */}
                <th
                  style={{
                    position: "sticky",
                    left: "60px",
                    zIndex: 2,
                    background: "#f8fafc",
                    padding: "10px 14px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: T.navy,
                    borderBottom: `1px solid ${T.border}`,
                    borderRight: `1px solid ${T.border}`,
                    minWidth: "160px",
                  }}
                >
                  Student Name
                </th>
                {/* Scrollable Day Columns */}
                {days.map((d) => (
                  <th
                    key={d.day}
                    style={{
                      padding: "6px 4px",
                      fontWeight: 700,
                      color: d.isSunday ? T.roseDark : T.navy,
                      background: d.isSunday ? "#fff1f2" : "#f8fafc",
                      borderBottom: `1px solid ${T.border}`,
                      borderRight: `1px solid #f1f5f9`,
                      minWidth: "32px",
                    }}
                  >
                    <div>{d.day}</div>
                    <div style={{ fontSize: "9.5px", fontWeight: 500, color: d.isSunday ? T.roseDark : T.slate }}>
                      {d.dayOfWeek}
                    </div>
                  </th>
                ))}
                {/* Totals Summary */}
                <th style={{ padding: "10px 8px", background: "#f8fafc", fontWeight: 700, color: T.greenDark, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid #f1f5f9`, minWidth: "40px" }}>
                  P
                </th>
                <th style={{ padding: "10px 8px", background: "#f8fafc", fontWeight: 700, color: T.roseDark, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid #f1f5f9`, minWidth: "40px" }}>
                  A
                </th>
                <th style={{ padding: "10px 12px", background: "#f8fafc", fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, minWidth: "55px" }}>
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={days.length + 5} style={{ padding: "40px", color: T.slate, textAlign: "center" }}>
                    Loading monthly register matrix...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 5} style={{ padding: "40px", color: T.slate, textAlign: "center" }}>
                    No students enrolled in this section.
                  </td>
                </tr>
              ) : (
                students.map((st, idx) => {
                  const isLow = st.attendancePercentage != null && st.attendancePercentage < 75;
                  return (
                    <tr
                      key={st.id || idx}
                      style={{
                        background: idx % 2 === 0 ? T.white : "#fafbfc",
                      }}
                    >
                      {/* Fixed Roll */}
                      <td
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 1,
                          background: idx % 2 === 0 ? T.white : "#fafbfc",
                          padding: "8px 12px",
                          fontWeight: 700,
                          color: T.slate,
                          borderBottom: `1px solid ${T.border}`,
                          borderRight: `1px solid ${T.border}`,
                        }}
                      >
                        {st.rollNumber}
                      </td>
                      {/* Fixed Name */}
                      <td
                        style={{
                          position: "sticky",
                          left: "60px",
                          zIndex: 1,
                          background: idx % 2 === 0 ? T.white : "#fafbfc",
                          padding: "8px 14px",
                          fontWeight: 600,
                          color: T.navy,
                          textAlign: "left",
                          borderBottom: `1px solid ${T.border}`,
                          borderRight: `1px solid ${T.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {st.name}
                      </td>
                      {/* Matrix Day Cells */}
                      {days.map((d) => {
                        const mark = st.marks[d.day] || "-";
                        let bg = "transparent";
                        let fg = T.slate;
                        if (mark === "P") {
                          bg = T.greenBg;
                          fg = T.greenDark;
                        } else if (mark === "A") {
                          bg = T.roseBg;
                          fg = T.roseDark;
                        } else if (mark === "L") {
                          bg = T.amberBg;
                          fg = T.amberDark;
                        } else if (mark === "H") {
                          bg = "#f1f5f9";
                          fg = "#94a3b8";
                        }
                        return (
                          <td
                            key={d.day}
                            style={{
                              padding: "6px 2px",
                              borderBottom: `1px solid ${T.border}`,
                              borderRight: `1px solid #f1f5f9`,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: "22px",
                                height: "22px",
                                lineHeight: "22px",
                                borderRadius: "4px",
                                background: bg,
                                color: fg,
                                fontWeight: 700,
                                fontSize: "10.5px",
                              }}
                            >
                              {mark}
                            </span>
                          </td>
                        );
                      })}
                      {/* Totals */}
                      <td style={{ padding: "8px 6px", fontWeight: 700, color: T.greenDark, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid #f1f5f9` }}>
                        {st.presentCount}
                      </td>
                      <td style={{ padding: "8px 6px", fontWeight: 700, color: T.roseDark, borderBottom: `1px solid ${T.border}`, borderRight: `1px solid #f1f5f9` }}>
                        {st.absentCount}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          fontWeight: 700,
                          color: isLow ? T.roseDark : T.navy,
                          background: isLow ? T.roseBg : "transparent",
                          borderBottom: `1px solid ${T.border}`,
                        }}
                      >
                        {st.attendancePercentage != null ? `${st.attendancePercentage}%` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Future Calendar Forecast: Holidays & Pre-Approved Leaves Docket */}
      <div
        style={{
          background: T.white,
          borderRadius: "12px",
          border: `1px solid ${T.border}`,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Holidays Subsection */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: T.navy, display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={16} color={T.navy} />
                Declared School Holidays &amp; Closures ({selectedMonth})
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: T.slate }}>
                Official gazetted holidays and emergency ad-hoc closures (automatically excluded from working days).
              </p>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: T.slate, background: T.chip, padding: "3px 8px", borderRadius: "6px" }}>
              {holidays.length} Declared
            </span>
          </div>

          {holidays.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
              {holidays.map((h: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: h.isAdhoc ? "#fff1f2" : "#f8fafc",
                    border: `1px solid ${h.isAdhoc ? "#fecdd3" : T.border}`,
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700, color: h.isAdhoc ? T.roseDark : T.navy }}>
                    <span>{h.title}</span>
                    <span style={{ fontSize: "10px", background: h.isAdhoc ? T.roseBg : T.chip, color: h.isAdhoc ? T.roseDark : T.slate, padding: "2px 6px", borderRadius: "4px" }}>
                      {h.isAdhoc ? "Emergency Ad-Hoc Off" : "Gazetted Holiday"}
                    </span>
                  </div>
                  <div style={{ fontSize: "11.5px", color: T.slate, marginTop: "4px" }}>
                    Date: {toDDMMYYYY(h.date)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "14px", textAlign: "center", color: T.slate, fontSize: "12px", border: `1px dashed ${T.border}`, borderRadius: "8px" }}>
              No non-Sunday holidays declared for {selectedMonth}.
            </div>
          )}
        </div>

        {/* Pre-Approved Leaves Subsection */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 700, color: T.navy }}>
              Pre-Approved Student Leaves ({selectedMonth})
            </h4>
            <span style={{ fontSize: "11px", fontWeight: 600, color: T.slate, background: T.chip, padding: "3px 8px", borderRadius: "6px" }}>
              {approvedLeaves.length} Sanctioned
            </span>
          </div>

          {approvedLeaves.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
              {approvedLeaves.map((l: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: `1px solid ${T.border}`,
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600, color: T.navy }}>
                    <span>{l.studentName} (Roll {l.rollNumber})</span>
                    <span style={{ fontSize: "10.5px", background: T.amberBg, color: T.amberDark, padding: "2px 6px", borderRadius: "4px" }}>
                      {l.leaveType}
                    </span>
                  </div>
                  <div style={{ fontSize: "11.5px", color: T.slate, marginTop: "4px" }}>
                    {toDDMMYYYY(l.startDate)} to {toDDMMYYYY(l.endDate)}
                  </div>
                  {l.reason && (
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", fontStyle: "italic" }}>
                      "{l.reason}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "14px", textAlign: "center", color: T.slate, fontSize: "12px", border: `1px dashed ${T.border}`, borderRadius: "8px" }}>
              No sanctioned student leaves recorded for this section in {selectedMonth}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
