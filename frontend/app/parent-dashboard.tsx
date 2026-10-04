"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquare, Calendar, Award, BookOpen, Clock, DollarSign, FileText } from "lucide-react";
import { ParentChild } from "./edops-api";

export function ParentDashboard({
  organizationId,
  children,
  onNotify,
}: {
  organizationId: string;
  children: ParentChild[];
  onNotify?: (msg: string) => void;
}) {
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [showTeacherMessageModal, setShowTeacherMessageModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [conferenceConfirmed, setConferenceConfirmed] = useState(false);

  // Fallback if no children are returned
  const defaultChild: ParentChild = {
    studentUserId: "std-1",
    name: "Rohan Sharma",
    email: "rohan@school.edu",
    rollNumber: "10-A-14",
    sectionName: "Grade 10-A",
    programName: "Grade 10",
    attendancePct: 97.4,
    todayAttendance: "Present",
  };

  const studentList = children && children.length > 0 ? children : [
    defaultChild,
    {
      studentUserId: "std-2",
      name: "Ananya Sharma",
      email: "ananya@school.edu",
      rollNumber: "6-B-08",
      sectionName: "Grade 6-B",
      programName: "Grade 6",
      attendancePct: 98.6,
      todayAttendance: "Present",
    },
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
    <div className="content-stack parent-hub-dashboard" style={{ maxWidth: "1400px", margin: "0 auto", gap: "20px" }}>
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
                border: "1px solid #CBCBCB",
                background: activeChildIndex === idx ? "#064E3B" : "#FFFFFF",
                color: activeChildIndex === idx ? "#F8E7C9" : "#064E3B",
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
          className="primary-button"
          onClick={() => setShowTeacherMessageModal(true)}
          style={{
            background: "#064E3B",
            borderColor: "#064E3B",
            color: "#F8E7C9",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <MessageSquare size={16} />
          Message Class Teacher
        </button>
      </div>

      {/* Top Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" }}>
        {/* Today's Attendance Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#707070", fontWeight: 600 }}>Today Attendance</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#E8F6F0", color: "#27795F", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
              <CheckCircle2 size={13} /> Verified
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#4A4A4A", letterSpacing: "-0.03em" }}>
            {currentChild.todayAttendance || "Present"}
          </div>
          <div style={{ fontSize: "12px", color: "#707070", marginTop: "4px" }}>
            (08:15 AM check-in)
          </div>
        </div>

        {/* Overall Attendance Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "20px" }}>
          <span style={{ fontSize: "13px", color: "#707070", fontWeight: 600 }}>Overall Attendance</span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#4A4A4A", letterSpacing: "-0.03em", marginTop: "8px" }}>
            {currentChild.attendancePct}%
          </div>
          <div style={{ height: "6px", background: "#EAEAEA", borderRadius: "3px", marginTop: "10px", overflow: "hidden" }}>
            <div style={{ width: `${currentChild.attendancePct}%`, height: "100%", background: "#064E3B", borderRadius: "3px" }} />
          </div>
        </div>

        {/* Term Fee Status */}
        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#707070", fontWeight: 600 }}>Term 2 Fee</span>
            <span style={{ background: "#E8F6F0", color: "#27795F", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
              Paid
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#4A4A4A", letterSpacing: "-0.03em" }}>
            Paid
          </div>
          <div style={{ fontSize: "12px", color: "#707070", marginTop: "4px" }}>
            (Receipt #4021 · All dues cleared)
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Scores and Upcoming Conference */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Recent Test Scores & Feedback */}
        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "22px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "17px", fontWeight: 700, color: "#4A4A4A" }}>
            Recent Test Scores & Feedback
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            {[
              { subject: "Math", score: 95, max: 100, bars: [50, 70, 85, 95] },
              { subject: "Physics", score: 88, max: 100, bars: [40, 65, 80, 88] },
              { subject: "English", score: 92, max: 100, bars: [60, 75, 88, 92] },
            ].map((item) => (
              <div key={item.subject} style={{ border: "1px solid #E5E5E5", borderRadius: "8px", padding: "14px", background: "#FAFAFA" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#707070" }}>{item.subject}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#4A4A4A", margin: "6px 0 12px" }}>
                  {item.score}<span style={{ fontSize: "12px", color: "#707070", fontWeight: 500 }}>/{item.max}</span>
                </div>
                {/* Mini bar sparkline */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "42px" }}>
                  {item.bars.map((h, bIdx) => (
                    <div
                      key={bIdx}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        background: bIdx === item.bars.length - 1 ? "#064E3B" : "#CBCBCB",
                        borderRadius: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "18px", borderTop: "1px solid #EFEFEF", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#4A4A4A" }}>Term 1 Comprehensive Report Card</span>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#707070" }}>Released on September 28 by Principal’s Office</p>
            </div>
            <button type="button" className="secondary-button" style={{ fontSize: "12px", padding: "6px 12px" }}>
              Download PDF
            </button>
          </div>
        </div>

        {/* Right Column: Parent-Teacher Meeting & Notices */}
        <div style={{ display: "grid", gap: "16px" }}>
          {/* Upcoming Parent-Teacher Conference Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: "#4A4A4A" }}>
              Upcoming Parent-Teacher Meeting
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#F5F7FA", borderRadius: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#FDF9F0", display: "grid", placeItems: "center", color: "#064E3B" }}>
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#4A4A4A" }}>Mid-Term Academic Review</div>
                <div style={{ fontSize: "11px", color: "#707070" }}>Scheduled for Oct 15 · 10:30 AM</div>
              </div>
            </div>

            <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {conferenceConfirmed ? (
                <span style={{ color: "#27795F", fontSize: "12px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={14} /> Attendance Confirmed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmConference}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#064E3B",
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
          <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: "#4A4A4A" }}>
              Recent School Notices
            </h3>
            <div style={{ display: "grid", gap: "10px", fontSize: "12px" }}>
              <div style={{ borderBottom: "1px solid #F0F0F0", paddingBottom: "8px" }}>
                <div style={{ fontWeight: 650, color: "#4A4A4A" }}>Inter-School Science Fair 2026</div>
                <div style={{ color: "#707070", fontSize: "11px" }}>October 22 · Main Auditorium</div>
              </div>
              <div>
                <div style={{ fontWeight: 650, color: "#4A4A4A" }}>Diwali Break Schedule</div>
                <div style={{ color: "#707070", fontSize: "11px" }}>Classes resume November 4</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Class Teacher Modal */}
      {showTeacherMessageModal && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowTeacherMessageModal(false)}>
          <section className="action-modal" role="dialog" aria-modal="true" style={{ maxWidth: "480px" }}>
            <button className="modal-close" onClick={() => setShowTeacherMessageModal(false)} aria-label="Close">×</button>
            <h2 style={{ fontSize: "18px", margin: "0 0 14px", color: "#4A4A4A" }}>
              Message {currentChild.name}’s Mentor
            </h2>
            <form onSubmit={handleSendMessage} className="modal-form">
              <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#4A4A4A" }}>
                Subject
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding recent Mathematics quiz"
                  defaultValue={`Inquiry regarding ${currentChild.name}`}
                  style={{ border: "1px solid #CBCBCB", borderRadius: "6px", padding: "8px 12px" }}
                />
              </label>
              <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#4A4A4A" }}>
                Message
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message for the class teacher..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{ border: "1px solid #CBCBCB", borderRadius: "6px", padding: "8px 12px", resize: "vertical" }}
                />
              </label>
              <div className="modal-actions" style={{ marginTop: "12px" }}>
                <button type="button" className="secondary-button" onClick={() => setShowTeacherMessageModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ background: "#064E3B", borderColor: "#064E3B", color: "#F8E7C9" }}>
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
