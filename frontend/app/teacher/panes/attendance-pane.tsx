"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Users,
  Clock,
  Mail,
  UserX,
  FileCheck,
  CheckSquare,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  applyTeacherLeave,
  getTeacherAttendance,
  getTeacherClasses,
  getTeacherLeaves,
  getTeacherStudentLeaves,
  getTeacherTodayTimetable,
  updateTeacherStudentLeaveStatus,
} from "../../edops-api";
import { ApplyLeaveModal, LeaveItem, LeaveTable } from "../../components/leave-desk";

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
};

interface AttendancePaneProps {
  organizationId: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  onTakeAttendance: (sectionId: string, periodNumber?: number, classSection?: string) => void;
  onContactParent?: (studentName: string) => void;
}

export function AttendancePane({
  organizationId,
  initialTab = "registers",
  onTabChange,
  onTakeAttendance,
  onContactParent,
}: AttendancePaneProps) {
  const [data, setData] = useState<any>(null);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"registers" | "my_leaves" | "student_leaves">(
    initialTab === "my_leaves" || initialTab === "student_leaves" ? initialTab : "registers"
  );
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    if (initialTab && (initialTab === "registers" || initialTab === "my_leaves" || initialTab === "student_leaves")) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    loadData();
    loadLeaveData();
  }, [organizationId]);

  async function loadLeaveData() {
    try {
      const [leaves, stLeaves] = await Promise.all([
        getTeacherLeaves(organizationId).catch(() => []),
        getTeacherStudentLeaves(organizationId).catch(() => []),
      ]);
      setMyLeaves(Array.isArray(leaves) ? leaves : []);
      setStudentLeaves(Array.isArray(stLeaves) ? stLeaves : []);
    } catch {
      // ignore
    }
  }

  const handleApplyLeave = async (dto: { leaveType: string; startDate: string; endDate: string; reason: string }) => {
    await applyTeacherLeave(organizationId, dto);
    await loadLeaveData();
  };

  const handleReviewStudentLeave = async (id: string, status: "approved" | "rejected", reviewNotes?: string) => {
    await updateTeacherStudentLeaveStatus(organizationId, id, status, reviewNotes);
    await loadLeaveData();
  };

  async function loadData() {
    setLoading(true);
    try {
      const [attRes, ttRes, clsRes] = await Promise.all([
        getTeacherAttendance(organizationId).catch(() => null),
        getTeacherTodayTimetable(organizationId).catch(() => null),
        getTeacherClasses(organizationId).catch(() => null),
      ]);
      if (attRes) setData(attRes);
      if (ttRes?.slots) {
        setTodaySlots(ttRes.slots);
        setActiveSlot(ttRes.activeSlot || null);
      }
      if (clsRes?.classes?.length > 0) {
        setDefaultSectionId(clsRes.classes[0].sectionId);
      }
    } finally {
      setLoading(false);
    }
  }

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
          Loading attendance records...
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
            Statutory Monitoring
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
            Class Attendance &amp; Register Verification
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Period-by-period roll call verification, statutory 75% CBSE compliance, and absentee logs.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: `1px solid ${T.border}`,
              background: T.white,
              color: T.navy,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Calendar size={14} />
            <span>Apply Leave</span>
          </button>

          {activeSlot ? (
            <button
              type="button"
              onClick={() => onTakeAttendance(activeSlot.sectionId, activeSlot.period, activeSlot.classSection)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: T.navy,
                color: T.white,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
              }}
            >
              <CheckSquare size={14} />
              <span>Take Attendance: {activeSlot.classSection} (P{activeSlot.period})</span>
            </button>
          ) : todaySlots.length > 0 && todaySlots.every((s) => s.attendanceTaken) ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "100px",
                background: T.greenBg,
                color: T.greenDark,
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={13} color={T.greenDark} />
              <span>All Periods Finalized Today</span>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "100px",
                background: T.chip,
                color: T.slate,
                fontSize: "11px",
                fontWeight: 600,
                border: `1px solid ${T.border}`,
              }}
            >
              <Clock size={13} color={T.slate} />
              <span>No Active Class Right Now</span>
            </div>
          )}
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
        {/* Attendance Rate (Pastel Mint) */}
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
              Today's Attendance
            </span>
            <Calendar size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {data?.todayStatus?.overallAttendancePct ?? 92}%
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Across all enrolled classes today
          </p>
        </div>

        {/* Registers Finalized (Pastel Sky) */}
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
              Registers Finalized
            </span>
            <FileCheck size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {data?.todayStatus?.classesMarked ?? 3} / {data?.todayStatus?.classesTotal ?? 4}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Completed teaching periods
          </p>
        </div>

        {/* Registers Pending (Pastel Warm Amber) */}
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
              Pending Marking
            </span>
            <Clock size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {data?.todayStatus?.pendingMarking ?? 1}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            Period registers requiring roll call
          </p>
        </div>

        {/* Defaulters (<75%) (Pastel Rose) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.roseBg,
            border: `1px solid ${T.roseBg}`,
            borderRadius: "10px",
            color: T.roseDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Defaulters (&lt;75%)
            </span>
            <AlertTriangle size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.roseDark }}>
            {data?.defaultersAlerts?.length ?? 2}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.roseDark }}>
            Students below CBSE 75% threshold
          </p>
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "registers", label: "Daily Registers & Timetable" },
          {
            id: "my_leaves",
            label: `My Leave Applications${myLeaves.filter((l) => l.status === "pending").length > 0 ? ` (${myLeaves.filter((l) => l.status === "pending").length})` : ""}`,
          },
          {
            id: "student_leaves",
            label: `Class Student Leaves (≤ 2 Days)${studentLeaves.filter((l) => l.status === "pending").length > 0 ? ` (${studentLeaves.filter((l) => l.status === "pending").length})` : ""}`,
          },
        ].map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                onTabChange?.(t.id);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isActive ? T.navy : T.border,
                background: isActive ? T.navy : T.white,
                color: isActive ? T.white : T.slate,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "registers" && (
        <>
          {/* 3. Today's Timetable Periods & Attendance Status */}
          {todaySlots.length > 0 && (
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
              Today's Class Schedule &amp; Register Verification
            </h3>
            <span style={{ fontSize: "11px", color: T.slate, fontWeight: 500 }}>
              Live Timetable Link Active
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {todaySlots.map((slot) => {
              const isFinalized = slot.attendanceTaken;
              const isActive = slot.status === "active";
              return (
                <div
                  key={slot.id || `${slot.period}-${slot.sectionId}`}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${isFinalized ? T.border : isActive ? T.navy : T.border}`,
                    background: isFinalized ? T.chip : isActive ? "#f0f4f8" : T.white,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, color: T.navy }}>
                    <span>Period {slot.period}: {slot.classSection}</span>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: T.slate }}>{slot.startTime} – {slot.endTime}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: T.slate }}>{slot.subject} • {slot.room}</div>

                  <div style={{ paddingTop: "8px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {isFinalized ? (
                      <span style={{ fontSize: "11px", fontWeight: 600, color: T.greenDark, background: T.greenBg, padding: "2px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={12} /> Finalized
                      </span>
                    ) : isActive ? (
                      <span style={{ fontSize: "11px", fontWeight: 600, color: T.skyDark, background: T.skyBg, padding: "2px 8px", borderRadius: "6px" }}>
                        ● Live Period
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: 500, color: T.slate, background: T.chip, padding: "2px 8px", borderRadius: "6px", border: `1px solid ${T.border}` }}>
                        {slot.status === "upcoming" ? "Upcoming" : "Pending Marking"}
                      </span>
                    )}

                    {isFinalized ? (
                      <span style={{ fontSize: "12px", fontWeight: 600, color: T.greenDark }}>Recorded ✓</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onTakeAttendance(slot.sectionId, slot.period, slot.classSection)}
                        style={{
                          background: "transparent",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: T.navy,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: 0,
                        }}
                      >
                        Take Attendance →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Defaulters Alert Docket */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} color={T.roseDark} />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: T.navy }}>
              Attendance Defaulters Alert Center (Below 75%)
            </h3>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", background: T.roseBg, color: T.roseDark }}>
            CBSE Statutory Notice
          </span>
        </div>

        {data?.defaultersAlerts && data.defaultersAlerts.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {data.defaultersAlerts.map((def: any) => (
              <div
                key={def.id || def.studentName}
                style={{
                  padding: "16px",
                  background: T.chip,
                  borderRadius: "8px",
                  border: `1px solid ${T.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600, color: T.navy, fontSize: "13px" }}>
                  <span>{def.studentName}</span>
                  <span style={{ color: T.roseDark, fontWeight: 700 }}>{def.attendancePct}%</span>
                </div>
                <div style={{ fontSize: "11.5px", color: T.slate }}>
                  {def.classSection} • {def.totalAbsences} cumulative absences
                </div>
                <div style={{ paddingTop: "8px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: T.roseDark, background: T.roseBg, padding: "2px 6px", borderRadius: "4px" }}>
                    {def.status || "Defaulter"}
                  </span>
                  {onContactParent && (
                    <button
                      type="button"
                      onClick={() => onContactParent(def.studentName)}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: T.navy,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: 0,
                      }}
                    >
                      <Mail size={12} /> Contact Parent →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "32px", textAlign: "center", color: T.slate, border: `1px dashed ${T.border}`, borderRadius: "8px", fontSize: "12px" }}>
            All students are currently maintaining attendance above the 75% CBSE requirement.
          </div>
        )}
      </div>

      {/* 5. Historical Registers Table */}
      <div
        style={{
          background: T.white,
          borderRadius: "10px",
          border: `1px solid ${T.border}`,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy }}>
            Recent Finalized Attendance Registers
          </h3>
          <span style={{ fontSize: "12px", color: T.slate }}>
            Last 7 calendar days
          </span>
        </div>

        {data?.recentRegisters && data.recentRegisters.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: T.chip, borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Period</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Class &amp; Subject</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Present / Total</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase" }}>Attendance %</th>
                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 600, fontSize: "11px", textTransform: "uppercase", textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRegisters.map((reg: any, idx: number) => (
                <tr key={reg.id || idx} style={{ borderBottom: idx !== data.recentRegisters.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: T.navy }}>{reg.date}</td>
                  <td style={{ padding: "12px 16px", color: T.slate }}>P{reg.period}</td>
                  <td style={{ padding: "12px 16px", color: T.navy }}>{reg.classSection} • {reg.subject}</td>
                  <td style={{ padding: "12px 16px", color: T.slate }}>{reg.presentCount} / {reg.totalCount}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: reg.percentage < 75 ? T.roseDark : T.greenDark }}>
                    {reg.percentage}%
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, background: T.greenBg, color: T.greenDark }}>
                      Finalized
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "36px", textAlign: "center", color: T.slate, fontSize: "12px" }}>
            No past registers found for this week.
          </div>
        )}
      </div>
      </>
      )}

      {activeTab === "my_leaves" && (
        <LeaveTable
          title="My Leave History & Status"
          subtitle="Your personal leave applications submitted to Principal"
          leaves={myLeaves.map((l: any) => ({
            id: l.id,
            applicantName: "Me (Teacher)",
            applicantRole: "teacher",
            leaveType: l.leaveType,
            startDate: l.startDate,
            endDate: l.endDate,
            daysCount: l.daysCount,
            reason: l.reason,
            status: l.status,
            submittedAt: l.submittedAt,
            reviewNotes: l.reviewNotes,
          }))}
          canApprove={false}
          emptyTitle="No leave applications submitted"
          emptySubtitle="Click 'Apply Leave' above to submit a new leave request to the Principal."
        />
      )}

      {activeTab === "student_leaves" && (
        <LeaveTable
          title="Student Leave Verification (≤ 2 Days)"
          subtitle="Parent-submitted leave requests for your assigned class section"
          leaves={studentLeaves.map((l: any) => ({
            id: l.id,
            applicantName: l.studentName,
            applicantRole: "student",
            detail: `${l.className || "Class"} ${l.sectionName || ""}${l.rollNo ? ` · Roll ${l.rollNo}` : ""}`,
            leaveType: l.leaveType,
            startDate: l.startDate,
            endDate: l.endDate,
            daysCount: l.daysCount,
            reason: l.reason,
            status: l.status,
            submittedAt: l.submittedAt,
            reviewNotes: l.reviewNotes,
          }))}
          canApprove={true}
          onAction={handleReviewStudentLeave}
          emptyTitle="No student leave requests"
          emptySubtitle="Short leave requests (≤ 2 days) applied by parents for your class will appear here."
        />
      )}

      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Teacher Leave"
        applicantLabel="Submitted to Principal for academic verification & substitution planning"
        onSubmit={handleApplyLeave}
      />
    </div>
  );
}
