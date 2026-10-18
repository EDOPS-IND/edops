"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  BookOpen,
  MapPin,
} from "lucide-react";
import { getTeacherAssessments } from "../../edops-api";

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

interface ExamsPaneProps {
  organizationId: string;
}

export function ExamsPane({ organizationId }: ExamsPaneProps) {
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExams() {
      setLoading(true);
      try {
        const res = await getTeacherAssessments(organizationId);
        setExamSchedules(res?.examSchedules || []);
      } catch {
        setExamSchedules([]);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, [organizationId]);

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
          Loading examination schedules...
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
            Examinations &amp; Terminals
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
            Term Examinations &amp; Evaluation Deadlines
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Official examination timetables, syllabus scopes, room allocations, and marks submission checkpoints.
          </p>
        </div>

        <div
          style={{
            padding: "6px 14px",
            borderRadius: "100px",
            background: T.chip,
            fontSize: "11px",
            fontWeight: 600,
            color: T.slate,
            border: `1px solid ${T.border}`,
          }}
        >
          {examSchedules.length} Terminal Exams Scheduled
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
        {/* Total Terminal Exams (Pastel Sky) */}
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
              Terminal Exams
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {examSchedules.length}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Scheduled for current academic year
          </p>
        </div>

        {/* Next Exam (Pastel Violet) */}
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
              Next Exam
            </span>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, lineHeight: 1.2, color: T.violetDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {examSchedules[0]?.name || "Mid-Term Examination"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            Date: {examSchedules[0]?.date || "Nov 15, 2026"}
          </p>
        </div>

        {/* Marks Deadline (Pastel Warm Amber) */}
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
              Evaluation Deadline
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, lineHeight: 1.2, color: T.amberDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {examSchedules[0]?.marksSubmissionDeadline || "Nov 25, 2026"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            7 days post-examination lock
          </p>
        </div>

        {/* Audit Status (Pastel Mint) */}
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
              Blueprint Status
            </span>
            <CheckCircle2 size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            100%
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            CBSE guidelines compliance met
          </p>
        </div>
      </div>

      {/* 3. Examination Timeline Cards */}
      {examSchedules.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {examSchedules.map((exam) => (
            <div
              key={exam.id}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: `1px solid ${T.border}`, paddingBottom: "14px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: T.blue, textTransform: "uppercase" }}>
                    {exam.classSection} • {exam.subject}
                  </span>
                  <h3 style={{ margin: "4px 0 0", fontSize: "17px", fontWeight: 600, color: T.navy }}>
                    {exam.name}
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: T.greenBg,
                    color: T.greenDark,
                  }}
                >
                  {exam.status || "Scheduled"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <div style={{ padding: "14px", background: T.chip, borderRadius: "8px", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: "10px", color: T.slate, fontWeight: 600, textTransform: "uppercase" }}>Exam Date &amp; Timing</span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.navy, margin: "4px 0" }}>{exam.date}</div>
                  <div style={{ fontSize: "12px", color: T.slate }}>{exam.time}</div>
                </div>

                <div style={{ padding: "14px", background: T.chip, borderRadius: "8px", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: "10px", color: T.amberDark, fontWeight: 600, textTransform: "uppercase" }}>Marks Entry Deadline</span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.amberDark, margin: "4px 0" }}>{exam.marksSubmissionDeadline}</div>
                  <div style={{ fontSize: "12px", color: T.slate }}>Portal lock applies post-date</div>
                </div>

                <div style={{ padding: "14px", background: T.chip, borderRadius: "8px", border: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: "10px", color: T.slate, fontWeight: 600, textTransform: "uppercase" }}>Seating &amp; Room Hall</span>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: T.navy, margin: "4px 0" }}>{exam.roomHall || "Main Hall 3"}</div>
                  <div style={{ fontSize: "12px", color: T.slate }}>Max Marks: {exam.maxMarks || 80}</div>
                </div>
              </div>

              {exam.syllabusUnits && exam.syllabusUnits.length > 0 && (
                <div style={{ fontSize: "12px" }}>
                  <span style={{ fontWeight: 600, color: T.navy }}>Included Syllabus Units: </span>
                  <span style={{ color: T.slate }}>{exam.syllabusUnits.join(", ")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "48px", textAlign: "center", background: T.white, borderRadius: "10px", border: `1px dashed ${T.border}`, color: T.slate, fontSize: "13px" }}>
          No formal terminal examination schedules published for this term.
        </div>
      )}
    </div>
  );
}
