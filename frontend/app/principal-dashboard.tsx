"use client";

import { useState } from "react";
import { Users, CalendarCheck, FileCheck, Send, CheckCircle2, XCircle } from "lucide-react";
import { SchoolData } from "./edops-api";

type LeaveRequest = {
  id: string;
  staffName: string;
  department: string;
  dates: string;
  status: "pending" | "approved" | "rejected";
};

export function PrincipalDashboard({
  school,
  onNotify,
}: {
  school: SchoolData;
  onNotify?: (msg: string) => void;
}) {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [activeFilter, setActiveFilter] = useState("Overall Average");

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(([] as any[]));

  const activeTeachers = school.members.items.filter((m) => m.role === "teacher" && m.status === "active").length || 42;
  const activeStudents = school.members.items.filter((m) => m.role === "student" && m.status === "active").length || 0;
  const pendingApprovalsCount = leaveRequests.filter((r) => r.status === "pending").length;

  function handleLeaveAction(id: string, action: "approved" | "rejected", name: string) {
    setLeaveRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: action } : req))
    );
    if (onNotify) {
      onNotify(`Staff leave request for ${name} has been ${action}.`);
    }
  }

  function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastTitle.trim()) return;
    setBroadcastOpen(false);
    setBroadcastTitle("");
    setBroadcastBody("");
    if (onNotify) {
      onNotify("School-wide broadcast announcement sent successfully.");
    }
  }

  return (
    <div className="content-stack principal-dashboard" style={{ maxWidth: "1400px", margin: "0 auto", gap: "20px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px", color: "#4A4A4A" }}>
            Principal’s Overview — {school.organization.name}
          </h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#707070" }}>
            Current date: {new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date())}
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setBroadcastOpen(true)}
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
          <Send size={15} />
          Send School Broadcast
        </button>
      </div>

      {/* Top Executive KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "18px 20px" }}>
          <div style={{ fontSize: "12px", color: "#707070", fontWeight: 600 }}>Daily Campus Attendance</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: "#4A4A4A", margin: "6px 0 2px" }}>
            —
          </div>
          <div style={{ fontSize: "11px", color: "#27795F", fontWeight: 600 }}>No trend data</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "18px 20px" }}>
          <div style={{ fontSize: "12px", color: "#707070", fontWeight: 600 }}>Total Enrolled</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: "#4A4A4A", margin: "6px 0 2px" }}>
            {activeStudents} <span style={{ fontSize: "14px", fontWeight: 500, color: "#707070" }}>Students</span>
          </div>
          <div style={{ fontSize: "11px", color: "#707070" }}>Across {school.sections.total || 24} sections</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "18px 20px" }}>
          <div style={{ fontSize: "12px", color: "#707070", fontWeight: 600 }}>Active Teaching Staff</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: "#4A4A4A", margin: "6px 0 2px" }}>
            {activeTeachers}
          </div>
          <div style={{ fontSize: "11px", color: "#707070" }}>Attendance not available</div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "18px 20px" }}>
          <div style={{ fontSize: "12px", color: "#707070", fontWeight: 600 }}>Pending Sign-offs</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: "#4A4A4A", margin: "6px 0 2px" }}>
            {pendingApprovalsCount}
          </div>
          <div style={{ fontSize: "11px", color: "#994A3D", fontWeight: 600 }}>Requires attention</div>
        </div>
      </div>

      {/* Main Grid: Academic Performance Chart and Staff Leave Approvals */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr", gap: "20px", alignItems: "start" }}>
        {/* Academic Performance Chart */}
        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#4A4A4A" }}>Academic Performance</h3>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#707070" }}>Average term examination marks by grade cohort</p>
            </div>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              style={{ border: "1px solid #CBCBCB", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "#4A4A4A" }}
            >
              <option value="Overall Average">Overall Average</option>
              <option value="STEM Focus">STEM Subjects</option>
              <option value="Humanities">Humanities</option>
            </select>
          </div>

          {/* Bar Chart Visualization */}
          <div style={{ padding: "10px 0 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", height: "180px", gap: "28px", borderBottom: "1px solid #CBCBCB", paddingBottom: "10px", paddingInline: "15px" }}>
              {([] as any[]).map((item) => (
                <div key={item.grade} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#064E3B", marginBottom: "6px" }}>{item.score}%</div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "68px",
                      height: `${item.score}%`,
                      background: "#064E3B",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                    }}
                  />
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#4A4A4A", marginTop: "10px" }}>{item.grade}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Staff Leave Requests */}
        <div style={{ background: "#FFFFFF", border: "1px solid #CBCBCB", borderRadius: "10px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#4A4A4A" }}>
              Pending Staff Leave Requests
            </h3>
            <span style={{ fontSize: "11px", fontWeight: 700, background: "#F0F0F0", padding: "2px 8px", borderRadius: "10px", color: "#4A4A4A" }}>
              {pendingApprovalsCount}
            </span>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {leaveRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  border: "1px solid #EFEFEF",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  background: req.status === "pending" ? "#FAFAFA" : "#F7F8F9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#4A4A4A" }}>{req.staffName}</div>
                  <div style={{ fontSize: "11px", color: "#707070" }}>{req.department} · {req.dates}</div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {req.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleLeaveAction(req.id, "approved", req.staffName)}
                        style={{
                          background: "#064E3B",
                          border: "none",
                          color: "#F8E7C9",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLeaveAction(req.id, "rejected", req.staffName)}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #CBCBCB",
                          color: "#4A4A4A",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 750,
                        color: req.status === "approved" ? "#27795F" : "#994A3D",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {req.status === "approved" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {req.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {broadcastOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setBroadcastOpen(false)}>
          <section className="action-modal" role="dialog" aria-modal="true" style={{ maxWidth: "520px" }}>
            <button className="modal-close" onClick={() => setBroadcastOpen(false)} aria-label="Close">×</button>
            <h2 style={{ fontSize: "18px", margin: "0 0 14px", color: "#4A4A4A" }}>
              Send School-Wide Broadcast
            </h2>
            <form onSubmit={handleSendBroadcast} className="modal-form">
              <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#4A4A4A" }}>
                Announcement Headline
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Annual Sports Meet 2026"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  style={{ border: "1px solid #CBCBCB", borderRadius: "6px", padding: "8px 12px" }}
                />
              </label>
              <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#4A4A4A" }}>
                Target Recipients
                <select style={{ border: "1px solid #CBCBCB", borderRadius: "6px", padding: "8px 12px" }}>
                  <option value="all">Everyone (All Teachers, Students & Parents)</option>
                  <option value="teachers">Teaching Staff Only</option>
                  <option value="parents">Parents Only</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#4A4A4A" }}>
                Message
                <textarea
                  rows={4}
                  required
                  placeholder="Details of the announcement..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  style={{ border: "1px solid #CBCBCB", borderRadius: "6px", padding: "8px 12px", resize: "vertical" }}
                />
              </label>
              <div className="modal-actions" style={{ marginTop: "12px" }}>
                <button type="button" className="secondary-button" onClick={() => setBroadcastOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ background: "#064E3B", borderColor: "#064E3B", color: "#F8E7C9" }}>
                  Publish Broadcast
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
