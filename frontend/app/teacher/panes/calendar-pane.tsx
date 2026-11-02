"use client";

import React, { useState, useEffect } from "react";
import { getTeacherCalendar } from "../../edops-api";
import { Calendar, CalendarDays, Clock, MapPin, Award, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { SchoolCalendarGrid, toDDMMYYYY } from "../../components/school-calendar-grid";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

interface CalendarPaneProps {
  organizationId: string;
}

export const CalendarPane: React.FC<CalendarPaneProps> = ({ organizationId }) => {
  const today = new Date();
  const [currentYearMonth, setCurrentYearMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const selectedMonthStr = `${MONTH_NAMES[currentYearMonth.month]} ${currentYearMonth.year}`;

  useEffect(() => {
    loadCalendar();
  }, [organizationId, selectedMonthStr]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const res = await getTeacherCalendar(organizationId, selectedMonthStr);
      setData(res);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const events = data?.events || [];
  const stats = data?.stats || { exams: "0 Papers", deadlines: "0 Pending", ptm: "0 Scheduled", holidays: "0 Days" };

  if (loading && !data) {
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
          Loading academic calendar...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header */}
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
            Institutional Dates &amp; Events
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
            Academic Calendar &amp; Milestone Schedule
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Term examination milestones, marks submission cut-offs, PTM sessions, and gazetted holidays.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: T.white, border: `1px solid ${T.line}`, borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 700, color: T.navy }}>
          <Calendar size={14} style={{ color: T.blue }} />
          <span>Active View: {selectedMonthStr}</span>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards - Strict DESIGN.md Section 2.1 Palettes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Exams Scheduled (Pastel Sky) */}
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
              Exams Scheduled
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {stats.exams}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Formative &amp; terminal dates
          </p>
        </div>

        {/* Marks Deadlines (Pastel Warm Amber) */}
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
              Marks Deadlines
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {stats.deadlines}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            Portal lock cut-off milestones
          </p>
        </div>

        {/* PTM Conferences (Pastel Violet) */}
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
              PTM Sessions
            </span>
            <Users size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.violetDark }}>
            {stats.ptm}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            Parent-teacher conferences
          </p>
        </div>

        {/* Holidays (Pastel Mint) */}
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
              Gazetted Holidays
            </span>
            <CalendarDays size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {stats.holidays}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Approved school recess days
          </p>
        </div>
      </div>

      {/* 2.5. Full Visual Academic Calendar Grid (Synchronized with Teacher Dashboard) */}
      <SchoolCalendarGrid
        organizationId={organizationId}
        canEdit={false}
        title="Faculty Academic Calendar & Holiday Grid"
        subtitle="Full institutional session calendar. Click on any date to inspect exams, holidays, and milestones."
        events={events}
        controlledYearMonth={currentYearMonth}
        onMonthChange={setCurrentYearMonth}
      />
    </div>
  );
};
