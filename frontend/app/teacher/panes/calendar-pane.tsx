"use client";

import React, { useState, useEffect } from "react";
import { getTeacherCalendar } from "../../edops-api";
import { Calendar, CalendarDays, Clock, MapPin, Award, Users, AlertCircle, CheckCircle2 } from "lucide-react";

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
  const [selectedMonth, setSelectedMonth] = useState("October 2026");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadCalendar();
  }, [organizationId, selectedMonth]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const res = await getTeacherCalendar(organizationId, selectedMonth);
      setData(res);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const events = data?.events || [];
  const stats = data?.stats || { exams: "3", deadlines: "2", ptm: "1", holidays: "4" };

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

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            padding: "8px 14px",
            background: T.white,
            border: `1px solid ${T.line}`,
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            color: T.navy,
            outline: "none",
            cursor: "pointer",
          }}
        >
          {[
            "April 2026",
            "May 2026",
            "June 2026",
            "July 2026",
            "August 2026",
            "September 2026",
            "October 2026",
            "November 2026",
            "December 2026",
            "January 2027",
            "February 2027",
            "March 2027",
          ].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
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

      {/* 3. Events Timeline / List Card */}
      <div
        style={{
          background: T.white,
          borderRadius: "10px",
          border: `1px solid ${T.border}`,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: T.navy }}>
            Events Scheduled for {selectedMonth}
          </h3>
          <span style={{ fontSize: "12px", color: T.slate }}>
            {events.length} institutional milestones
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {events.length === 0 ? (
            <div style={{ padding: "36px", textAlign: "center", color: T.slate, fontSize: "12px", border: `1px dashed ${T.border}`, borderRadius: "8px" }}>
              No institutional events scheduled for {selectedMonth}.
            </div>
          ) : (
            events.map((ev: any, idx: number) => {
              let typeBadge = { bg: T.skyBg, color: T.skyDark };
              if (ev.type === "exam") typeBadge = { bg: T.violetBg, color: T.violetDark };
              else if (ev.type === "deadline") typeBadge = { bg: T.amberBg, color: T.amberDark };
              else if (ev.type === "holiday") typeBadge = { bg: T.greenBg, color: T.greenDark };

              return (
                <div
                  key={ev.id || idx}
                  style={{
                    padding: "14px 18px",
                    borderRadius: "8px",
                    border: `1px solid ${T.border}`,
                    background: T.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: T.chip,
                        border: `1px solid ${T.border}`,
                        textAlign: "center",
                        minWidth: "60px",
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 700, color: T.navy }}>{ev.day || "15"}</div>
                      <div style={{ fontSize: "10px", color: T.slate, textTransform: "uppercase" }}>{ev.monthShort || "OCT"}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: T.navy }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: "11.5px", color: T.slate, display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                        <span><Clock size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {ev.time || "All Day"}</span>
                        {ev.location && <span><MapPin size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {ev.location}</span>}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: typeBadge.bg,
                      color: typeBadge.color,
                      textTransform: "capitalize",
                    }}
                  >
                    {ev.type || "Academic"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
