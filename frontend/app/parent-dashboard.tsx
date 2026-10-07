"use client";

import React, { useState } from "react";
import { CheckCircle2, MessageSquare, Calendar, Award, AlertCircle, Download } from "lucide-react";

export interface ParentChildSummary {
  studentUserId: string;
  name: string;
  gradeName: string;
  sectionName: string;
  attendancePct: number;
  todayAttendance?: "Present" | "Absent" | "Late";
}

interface ParentDashboardProps {
  children?: ParentChildSummary[];
  onNotify?: (msg: string) => void;
}

export function ParentDashboard({ children = [], onNotify }: ParentDashboardProps) {
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [showTeacherMessageModal, setShowTeacherMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [conferenceConfirmed, setConferenceConfirmed] = useState(false);

  // Fallback demo child if none passed
  const studentList = children.length > 0 ? children : [
    {
      studentUserId: "std-001",
      name: "Aryan Sharma",
      gradeName: "Grade 10",
      sectionName: "Class 10-A",
      attendancePct: 94.2,
      todayAttendance: "Present" as const,
    },
    {
      studentUserId: "std-002",
      name: "Ananya Sharma",
      gradeName: "Grade 6",
      sectionName: "Class 6-B",
      attendancePct: 98.0,
      todayAttendance: "Present" as const,
    }
  ];

  const currentChild = studentList[activeChildIndex] || studentList[0];

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim()) return;
    setShowTeacherMessageModal(false);
    setMessageText("");
    if (onNotify) {
      onNotify(`Message sent to ${currentChild.name}'s class mentor.`);
    }
  }

  function handleConfirmConference() {
    setConferenceConfirmed(true);
    if (onNotify) {
      onNotify(`Parent-Teacher Conference attendance confirmed for ${currentChild.name}.`);
    }
  }

  return (
    <div className="content-stack parent-hub-dashboard" style={{ maxWidth: "1400px", margin: "0 auto", display: "grid", gap: "22px" }}>
      {/* Top Header with Child Switcher and Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {studentList.map((c, idx) => (
            <button
              key={c.studentUserId || idx}
              type="button"
              onClick={() => setActiveChildIndex(idx)}
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                border: activeChildIndex === idx ? "1px solid #1A243D" : "1px solid #E2E8F0",
                background: activeChildIndex === idx ? "#090D16" : "#FFFFFF",
                color: activeChildIndex === idx ? "#FFFFFF" : "#0F172A",
                fontWeight: 650,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {c.name} ({c.sectionName})
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowTeacherMessageModal(true)}
          style={{
            background: "#090D16",
            border: "1px solid #1A243D",
            color: "#FFFFFF",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontWeight: 650,
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#131C31")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#090D16")}
        >
          <MessageSquare size={16} />
          Message Class Teacher
        </button>
      </div>

      {/* Top Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" }}>
        {/* Today's Attendance Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 650 }}>Today's Attendance</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
              <CheckCircle2 size={13} /> Verified
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>
            {currentChild.todayAttendance || "Present"}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            (08:15 AM campus check-in verified)
          </div>
        </div>

        {/* Overall Attendance Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <span style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 650 }}>Overall Attendance</span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", marginTop: "8px" }}>
            {currentChild.attendancePct}%
          </div>
          <div style={{ height: "6px", background: "#E2E8F0", borderRadius: "3px", marginTop: "10px", overflow: "hidden" }}>
            <div style={{ width: `${currentChild.attendancePct}%`, height: "100%", background: "#10B981", borderRadius: "3px" }} />
          </div>
        </div>

        {/* Term Fee Status */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 650 }}>Term 2 Fee Clearance</span>
            <span style={{ background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
              Paid & Cleared
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>
            Fully Settled
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
            (Receipt #4021 · Zero outstanding dues)
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Scores and Upcoming Conference */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Recent Test Scores & Feedback */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "22px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>
            Recent Subject Mastery & Scores
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            {[
              { subject: "Math", score: 95, max: 100, bars: [50, 70, 85, 95] },
              { subject: "Physics", score: 88, max: 100, bars: [40, 65, 80, 88] },
              { subject: "English", score: 92, max: 100, bars: [60, 75, 88, 92] },
            ].map((item) => (
              <div key={item.subject} style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px", background: "#F8FAFC" }}>
                <div style={{ fontSize: "13px", fontWeight: 650, color: "#64748B" }}>{item.subject}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", margin: "6px 0 12px" }}>
                  {item.score}<span style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>/{item.max}</span>
                </div>
                {/* Mini bar sparkline */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "42px" }}>
                  {item.bars.map((h, bIdx) => (
                    <div
                      key={bIdx}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        background: bIdx === item.bars.length - 1 ? "#2563EB" : "#E2E8F0",
                        borderRadius: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "18px", borderTop: "1px solid #E2E8F0", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>Term 1 Comprehensive Report Card</span>
              <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#64748B" }}>Authorized by Principal’s Office • CBSE Guidelines</p>
            </div>
            <button
              type="button"
              style={{
                fontSize: "12px",
                padding: "6px 14px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "6px",
                color: "#0F172A",
                fontWeight: 650,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Download size={13} />
              Download PDF
            </button>
          </div>
        </div>

        {/* Right Column: Parent-Teacher Meeting & Notices */}
        <div style={{ display: "grid", gap: "16px" }}>
          {/* Upcoming Parent-Teacher Conference Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
              Upcoming Parent-Teacher Meeting
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "#FFFFFF", border: "1px solid #E2E8F0", display: "grid", placeItems: "center", color: "#0F172A" }}>
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>Mid-Term Academic Review</div>
                <div style={{ fontSize: "11.5px", color: "#64748B" }}>Scheduled for Oct 15 · 10:30 AM</div>
              </div>
            </div>

            <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {conferenceConfirmed ? (
                <span style={{ color: "#065F46", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={14} /> Attendance Confirmed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmConference}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563EB",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Confirm attendance ↗
                </button>
              )}
            </div>
          </div>

          {/* School Announcements */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
              Recent School Notices
            </h3>
            <div style={{ display: "grid", gap: "10px", fontSize: "12px" }}>
              <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                <div style={{ fontWeight: 650, color: "#0F172A" }}>Inter-School Science Fair 2026</div>
                <div style={{ color: "#64748B", fontSize: "11.5px" }}>October 22 · Main Auditorium</div>
              </div>
              <div>
                <div style={{ fontWeight: 650, color: "#0F172A" }}>Diwali Break Schedule</div>
                <div style={{ color: "#64748B", fontSize: "11.5px" }}>Classes resume November 4</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Class Teacher Modal */}
      {showTeacherMessageModal && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowTeacherMessageModal(false)}>
          <section className="action-modal" role="dialog" aria-modal="true" style={{ maxWidth: "480px", background: "#FFFFFF", borderRadius: "12px", padding: "24px", border: "1px solid #E2E8F0", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <button className="modal-close" onClick={() => setShowTeacherMessageModal(false)} aria-label="Close">×</button>
            <h2 style={{ fontSize: "18px", margin: "0 0 14px", color: "#0F172A", fontWeight: 800 }}>
              Message {currentChild.name}’s Mentor
            </h2>
            <form onSubmit={handleSendMessage} className="modal-form" style={{ display: "grid", gap: "14px" }}>
              <label style={{ display: "grid", gap: "6px", fontSize: "12.5px", color: "#0F172A", fontWeight: 600 }}>
                Subject
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding recent Mathematics quiz"
                  defaultValue={`Inquiry regarding ${currentChild.name}`}
                  style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", outline: "none" }}
                />
              </label>
              <label style={{ display: "grid", gap: "6px", fontSize: "12.5px", color: "#0F172A", fontWeight: 600 }}>
                Message
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message for the class teacher..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", resize: "vertical", outline: "none" }}
                />
              </label>
              <div className="modal-actions" style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowTeacherMessageModal(false)}
                  style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0F172A", padding: "8px 16px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 650, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: "#090D16", border: "1px solid #1A243D", color: "#FFFFFF", padding: "8px 16px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                >
                  Send Message
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
