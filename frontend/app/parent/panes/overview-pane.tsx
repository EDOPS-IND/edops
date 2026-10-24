"use client";

import React from "react";
import { WardInfo, ParentTab } from "../types";
import {
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Bell,
  ArrowRight,
  Plus,
  CalendarDays,
  FileText,
  User,
  GraduationCap,
} from "lucide-react";
import { getStudentAvatarUrl } from "../../edops-api";

export function OverviewPane({
  selectedWard,
  onNavigateTab,
  onOpenLeaveModal,
  onOpenQueryModal,
  onOpenReportModal,
}: {
  selectedWard: WardInfo;
  onNavigateTab: (tab: ParentTab) => void;
  onOpenLeaveModal: () => void;
  onOpenQueryModal: () => void;
  onOpenReportModal: () => void;
}) {
  const data = selectedWard.data;
  const timetable = data?.timetable || [];
  const assignments = data?.assignments || [];
  const results = data?.results || [];
  const notices = data?.notices || [];

  const pendingAssignments = assignments.filter((a: any) => a.status === "pending");
  const attendanceRate = selectedWard.attendancePct != null ? `${selectedWard.attendancePct}%` : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Hero Banner */}
      <div
        style={{
          background: "#eaedf2",
          border: "1px solid #d8dee6",
          borderRadius: "12px",
          padding: "20px clamp(14px, 3vw, 28px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          minHeight: "180px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ zIndex: 2, maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                background: "#ffffff",
                padding: "3px 8px",
                borderRadius: "4px",
                color: "#0c1e33",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              Academic Portfolio
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>•</span>
            <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
              Class {selectedWard.sectionName || "Enrolled"}
            </span>
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#0c1e33",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Welcome, Guardian of {selectedWard.name}
          </h2>

          <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px 0", lineHeight: "1.5" }}>
            Roll No: <b>{selectedWard.rollNumber || "—"}</b> • Today's Attendance:{" "}
            <span style={{ color: selectedWard.todayAttendance ? "#166534" : "#64748b", fontWeight: 700 }}>
              {selectedWard.todayAttendance || "Not Recorded"}
            </span>.
            Access real-time schedules, academic report cards, fee assessments, and faculty communications.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={onOpenLeaveModal}
              style={{
                background: "#0c1e33",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <Plus size={14} /> Apply Leave
            </button>
            <button
              onClick={() => onNavigateTab("ptm")}
              style={{
                background: "#ffffff",
                color: "#0c1e33",
                border: "1px solid #d8dee6",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <CalendarDays size={14} /> Book PTM
            </button>
            <button
              onClick={onOpenReportModal}
              style={{
                background: "#ffffff",
                color: "#0c1e33",
                border: "1px solid #d8dee6",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Award size={14} /> View Results
            </button>
            <button
              onClick={onOpenQueryModal}
              style={{
                background: "transparent",
                color: "#475569",
                border: "1px solid transparent",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ask School
            </button>
          </div>
        </div>

        {/* Executive Administrative SVG Art in Hero Banner */}
        <div
          className="hidden lg:block"
          style={{
            position: "absolute",
            right: "20px",
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.85,
            pointerEvents: "none",
          }}
        >
          <svg width="210" height="150" viewBox="0 0 210 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="30" width="170" height="100" rx="10" fill="#cbd5e1" fillOpacity="0.3" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
            <rect x="35" y="45" width="140" height="70" rx="8" fill="#ffffff" fillOpacity="0.7" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M50 65H110" stroke="#0c1e33" strokeWidth="3" strokeLinecap="round" />
            <path d="M50 80H140" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M50 95H90" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="150" cy="75" r="14" fill="#ccefbf" stroke="#1a5c0a" strokeWidth="1.5" />
            <path d="M145 75L148 78L155 71" stroke="#1a5c0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* 2. Top 4 Pastel KPI Metric Cards (Strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Mint */}
        <div
          style={{
            height: "148px",
            background: "#ccefbf",
            border: "1px solid #b2e49f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a5c0a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Attendance Rate
            </span>
            <CheckCircle2 size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{attendanceRate}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              Status: {selectedWard.todayAttendance || "Not Recorded"}
            </div>
          </div>
        </div>

        {/* Card 2: Violet */}
        <div
          style={{
            height: "148px",
            background: "#e1d2ff",
            border: "1px solid #cdb5ff",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4a0e8f", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Academic Results
            </span>
            <Award size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{results.length}</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Official Scores Published
            </div>
          </div>
        </div>

        {/* Card 3: Sky */}
        <div
          style={{
            height: "148px",
            background: "#bae5f5",
            border: "1px solid #9ad7ef",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a5a7a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Timetable Periods
            </span>
            <Clock size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{timetable.length}</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Weekly Class Periods Scheduled
            </div>
          </div>
        </div>

        {/* Card 4: Peach */}
        <div
          style={{
            height: "148px",
            background: "#ffd8c7",
            border: "1px solid #ffbe9f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#782a00", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pending Tasks
            </span>
            <BookOpen size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>{pendingAssignments.length}</div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              Assignments Awaiting Submission
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split View */}
      <div className="portal-two-col" style={{ gap: "20px" }}>
        {/* Left Column: Schedule & Child Dossier */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Child Dossier Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e4e6e9",
              borderRadius: "10px",
              padding: "16px clamp(12px, 3vw, 20px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <img
                src={getStudentAvatarUrl(selectedWard.name, selectedWard.studentUserId)}
                alt=""
                style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#eaedf2" }}
              />
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>{selectedWard.name}</h3>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Class: <b>{selectedWard.sectionName || "Enrolled"}</b> • Roll: <b>{selectedWard.rollNumber || "—"}</b>
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("academics")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                background: "#f8fafc",
                border: "1px solid #e4e6e9",
                color: "#0c1e33",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Academic Dossier <ArrowRight size={13} />
            </button>
          </div>

          {/* Weekly Timetable Preview */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e4e6e9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Weekly Timetable Schedule</h3>
              <span style={{ fontSize: "11px", color: "#64748b" }}>{timetable.length} periods active</span>
            </div>

            {timetable.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                No active timetable periods published for this class.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                      <th style={{ padding: "10px 14px" }}>Day</th>
                      <th style={{ padding: "10px 14px" }}>Period</th>
                      <th style={{ padding: "10px 14px" }}>Subject</th>
                      <th style={{ padding: "10px 14px" }}>Teacher</th>
                      <th style={{ padding: "10px 14px" }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.slice(0, 6).map((t: any, idx: number) => {
                      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                      return (
                        <tr key={t.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>
                            {typeof t.day === "number" ? dayNames[t.day - 1] || `Day ${t.day}` : t.day}
                          </td>
                          <td style={{ padding: "10px 14px", color: "#64748b" }}>Period {t.period}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0c1e33" }}>{t.subject}</td>
                          <td style={{ padding: "10px 14px", color: "#475569" }}>{t.teacher}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b" }}>
                            {t.startTime} – {t.endTime}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Assignments & Recent Notices */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Active Homework & Assignments */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e4e6e9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Class Assignments & Homework</h3>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: pendingAssignments.length > 0 ? "#fef3c7" : "#dcfce7",
                  color: pendingAssignments.length > 0 ? "#92400e" : "#166534",
                }}
              >
                {pendingAssignments.length} pending
              </span>
            </div>

            {assignments.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                No assignments currently published.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {assignments.slice(0, 5).map((a: any, idx: number) => {
                  const isDone = a.status === "completed" || a.status === "submitted";
                  return (
                    <div
                      key={a.id || idx}
                      style={{
                        padding: "12px 18px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>{a.title}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Subject: <b>{a.subject}</b> • Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background: isDone ? "#dcfce7" : "#fef3c7",
                          color: isDone ? "#166534" : "#92400e",
                          textTransform: "capitalize",
                        }}
                      >
                        {a.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* School Broadcasts & Teacher Communications */}
          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e4e6e9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>School Circulars & Notices</h3>
              <button
                onClick={() => onNavigateTab("notices")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#0c1e33",
                  cursor: "pointer",
                }}
              >
                View All ({notices.length})
              </button>
            </div>

            {notices.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                No circulars or messages for your attention.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {notices.slice(0, 3).map((n: any, idx: number) => (
                  <div
                    key={n.id || idx}
                    style={{
                      padding: "14px 18px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>{n.subject}</span>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>
                        {n.date ? new Date(n.date).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569", lineHeight: "1.4" }}>
                      {n.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
