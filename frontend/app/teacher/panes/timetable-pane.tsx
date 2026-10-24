"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles,
  CheckSquare,
  BookOpen,
} from "lucide-react";
import { getTeacherTodayTimetable, getTeacherWeeklyTimetable } from "../../edops-api";

const T = {
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
  greenBg: "#ccefbf",
  greenDark: "#1a5c0a",
  skyBg: "#d0e6ff",
  skyDark: "#0a3a7a",
  amberBg: "#fde1ac",
  amberDark: "#614400",
  roseBg: "#ffd6d6",
  roseDark: "#7a1a1a",
  violetBg: "#e1d2ff",
  violetDark: "#4a0e8f",
};

interface TimetablePaneProps {
  organizationId: string;
  onTakeAttendance?: (sectionId?: string, periodNumber?: number, classSection?: string) => void;
  onLogLesson?: (classSection?: string, sectionId?: string) => void;
}

export function TimetablePane({ organizationId, onTakeAttendance, onLogLesson }: TimetablePaneProps) {
  const [viewMode, setViewMode] = useState<"today" | "weekly">("weekly");
  const [todayData, setTodayData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimetable();
  }, [organizationId]);

  async function loadTimetable() {
    setLoading(true);
    try {
      const [todayRes, weeklyRes] = await Promise.all([
        getTeacherTodayTimetable(organizationId),
        getTeacherWeeklyTimetable(organizationId),
      ]);
      setTodayData(todayRes);
      setWeeklyData(weeklyRes);
    } catch {
      setTodayData({ day: "today", slots: [] });
      setWeeklyData({ totalWeeklyPeriods: 0, maxWeeklyPeriods: 30, days: [], grid: {} });
    } finally {
      setLoading(false);
    }
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

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
          Loading timetable...
        </p>
      </div>
    );
  }

  const todaySlots = todayData?.slots || [];
  const totalWeekly = weeklyData?.totalWeeklyPeriods || 22;
  const maxWeekly = weeklyData?.maxWeeklyPeriods || 30;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      {/* 1. Header Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
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
            Faculty Schedule Master
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
            Class Schedule &amp; Timetable
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Assigned weekly period allocations, room locations, and daily instructional slots.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div style={{ display: "flex", background: T.chip, padding: "4px", borderRadius: "8px", border: `1px solid ${T.border}`, gap: "4px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setViewMode("today")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: viewMode === "today" ? 600 : 500,
              cursor: "pointer",
              border: "none",
              background: viewMode === "today" ? T.navy : "transparent",
              color: viewMode === "today" ? T.white : T.slate,
              transition: "all 0.15s ease",
            }}
          >
            Today's Schedule
          </button>
          <button
            type="button"
            onClick={() => setViewMode("weekly")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: viewMode === "weekly" ? 600 : 500,
              cursor: "pointer",
              border: "none",
              background: viewMode === "weekly" ? T.navy : "transparent",
              color: viewMode === "weekly" ? T.white : T.slate,
              transition: "all 0.15s ease",
            }}
          >
            Full Weekly Grid
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards - Strict DESIGN.md Section 2.1 Palettes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: "12px",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        {/* Weekly Load (Pastel Sky) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.skyBg,
            border: `1px solid ${T.skyBg}`,
            borderRadius: "10px",
            color: T.skyDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Weekly Period Load
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {totalWeekly} / {maxWeekly}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Within CBSE 30-period workload limit
          </p>
        </div>

        {/* Periods Today (Pastel Mint) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.greenBg,
            border: `1px solid ${T.greenBg}`,
            borderRadius: "10px",
            color: T.greenDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Periods Today
            </span>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {todaySlots.length} Periods
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Active instructional schedule
          </p>
        </div>

        {/* Next / Active Slot (Pastel Violet) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.violetBg,
            border: `1px solid ${T.violetBg}`,
            borderRadius: "10px",
            color: T.violetDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Next Period
            </span>
            <Sparkles size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: T.violetDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {todaySlots[0] ? `${todaySlots[0].classSection} (P${todaySlots[0].period})` : "Free Slot"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            {todaySlots[0] ? `${todaySlots[0].startTime} – ${todaySlots[0].room}` : "No more classes scheduled"}
          </p>
        </div>

        {/* Free Prep Periods (Pastel Warm Amber) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.amberBg,
            border: `1px solid ${T.amberBg}`,
            borderRadius: "10px",
            color: T.amberDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Prep &amp; Free Slots
            </span>
            <BookOpen size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {Math.max(0, maxWeekly - totalWeekly)} Slots
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            Available for grading &amp; lesson prep
          </p>
        </div>
      </div>

      {/* 3. Timetable Body Content */}
      {viewMode === "today" ? (
        <div
          style={{
            background: T.white,
            borderRadius: "10px",
            border: `1px solid ${T.border}`,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: T.navy }}>
              Today's Sequence of Instructional Periods
            </h3>
            <span style={{ fontSize: "12px", color: T.slate }}>Live timetable verification active</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {todaySlots.length > 0 ? (
              todaySlots.map((slot: any) => (
                <div
                  key={slot.id || slot.period}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "8px",
                    border: `1px solid ${T.border}`,
                    background: slot.status === "active" ? "#f0f4f9" : T.chip,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: T.white,
                        border: `1px solid ${T.border}`,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 700, color: T.navy }}>P{slot.period}</div>
                      <div style={{ fontSize: "10px", color: T.slate }}>Period</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: T.navy }}>
                        {slot.classSection} — {slot.subject}
                      </div>
                      <div style={{ fontSize: "12px", color: T.slate, display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                        <span><Clock size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {slot.startTime} – {slot.endTime}</span>
                        <span><MapPin size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Room: {slot.room}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {onTakeAttendance && (
                      <button
                        type="button"
                        onClick={() => onTakeAttendance(slot.sectionId, slot.period, slot.classSection)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: `1px solid ${T.line}`,
                          background: T.white,
                          fontSize: "12px",
                          fontWeight: 600,
                          color: T.navy,
                          cursor: "pointer",
                        }}
                      >
                        Roll Call
                      </button>
                    )}
                    {onLogLesson && (
                      <button
                        type="button"
                        onClick={() => onLogLesson(slot.classSection, slot.sectionId)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          background: T.navy,
                          fontSize: "12px",
                          fontWeight: 600,
                          color: T.white,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Log Lesson
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "48px", textAlign: "center", color: T.slate, fontSize: "13px" }}>
                No teaching periods scheduled for today.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: T.white,
            borderRadius: "10px",
            border: `1px solid ${T.border}`,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: T.navy }}>
              Weekly Instructional Matrix (6-Day Cycle)
            </h3>
            <span style={{ fontSize: "12px", color: T.slate }}>Monday through Saturday</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: T.slate, marginBottom: "4px", flexWrap: "wrap", gap: "4px", width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
            <span>↔ Scroll horizontally to view all periods</span>
            <span>7 Periods • 6 Days</span>
          </div>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "8px", border: `1px solid ${T.border}`, width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
            <table style={{ width: "100%", minWidth: "820px", borderCollapse: "collapse", fontSize: "12px", textAlign: "center" }}>
              <thead>
                <tr style={{ background: T.chip, borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ padding: "12px 14px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", width: "100px", minWidth: "90px", textAlign: "left", position: "sticky", left: 0, background: T.chip, zIndex: 3, boxShadow: "2px 0 4px rgba(0,0,0,0.04)" }}>Day</th>
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <th key={p} style={{ padding: "12px 14px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>
                      Period {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day, idx) => {
                  const daySlots = weeklyData?.grid?.[day] || [];
                  return (
                    <tr key={day} style={{ borderBottom: idx !== days.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <td style={{ padding: "14px", textAlign: "left", fontWeight: 600, color: T.navy, textTransform: "capitalize", position: "sticky", left: 0, background: T.white, zIndex: 2, boxShadow: "2px 0 4px rgba(0,0,0,0.04)" }}>
                        {day}
                      </td>
                      {[1, 2, 3, 4, 5, 6, 7].map((p) => {
                        const slot = daySlots.find((s: any) => s.period === p);
                        return (
                          <td key={p} style={{ padding: "8px", verticalAlign: "middle" }}>
                            {slot ? (
                              <div
                                style={{
                                  padding: "8px 6px",
                                  borderRadius: "6px",
                                  background: T.chip,
                                  border: `1px solid ${T.border}`,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "2px",
                                }}
                              >
                                <span style={{ fontWeight: 600, color: T.navy, fontSize: "11.5px" }}>{slot.classSection}</span>
                                <span style={{ fontSize: "10px", color: T.blue, fontWeight: 500 }}>{slot.subject}</span>
                                <span style={{ fontSize: "9.5px", color: T.slate }}>{slot.room}</span>
                              </div>
                            ) : (
                              <span style={{ color: T.faint, fontSize: "11px" }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
