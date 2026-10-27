"use client";

import { useEffect, useState } from "react";
import { getPrincipalAttendance, getPrincipalLeaves, getStudentAvatarUrl, updatePrincipalLeaveStatus } from "../../edops-api";
import { Users, AlertTriangle, CalendarCheck, Clock, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { LeaveItem, LeaveTable } from "../../components/leave-desk";
import { TableSkeletonRows } from "../components/skeleton-rows";

type Student = {
  id: string;
  name: string;
  className: string;
  roll: string;
  markedRecords: number;
  attendanceRate: number;
  daysAbsent: number;
  unexcusedAbsences: number;
};
type TrendDay = { date: string; markedRecords: number; presentRecords: number; attendanceRate: number | null };
type Teacher = { id: string; name: string; approvedLeave: boolean; recordedClasses: number };
type Attendance = {
  enrolledStudents: number;
  markedRecords: number;
  studentAttendanceRate: number | null;
  pendingRegisters: number;
  students?: Student[];
  atRisk: Student[];
  trend: TrendDay[];
  teachers: Teacher[];
};
type View = "students" | "trends" | "teachers" | "leaves";

/* -------------------------------------------------------------------------- */
/* SKELETON LOADERS & EMPTY STATES                                            */
/* -------------------------------------------------------------------------- */

function KpiSkeletonGrid() {
  const cards = [
    { bg: "#E0D3FF" },
    { bg: "#D0EDC0" },
    { bg: "#BCE6F3" },
    { bg: "#FADAC9" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "164px",
            padding: "20px",
            gap: "12px",
            background: c.bg,
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "110px", height: "12px", borderRadius: "4px" }} />
            <div className="edops-skeleton-kpi" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
          </div>
          <div className="edops-skeleton-kpi" style={{ width: "75px", height: "36px", borderRadius: "6px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "140px", height: "10px", borderRadius: "4px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div className="edops-skeleton-kpi" style={{ width: "55px", height: "10px", borderRadius: "4px" }} />
              <div className="edops-skeleton-kpi" style={{ width: "14px", height: "14px", borderRadius: "3px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  illustration = "/bee.png",
  title,
  description,
}: {
  illustration?: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
        background: "#FFFFFF",
        borderRadius: "10px",
        border: "1px solid #E0E5EB",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <img
        src={illustration}
        alt=""
        style={{
          width: illustration === "/noresult.png" ? "120px" : "96px",
          height: "auto",
          maxHeight: "100px",
          objectFit: "contain",
          marginBottom: "16px",
          opacity: 0.95,
        }}
      />
      <b style={{ fontSize: "15px", fontWeight: 700, color: "#0C1E33", marginBottom: "6px" }}>
        {title}
      </b>
      <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B", maxWidth: "440px", lineHeight: 1.55 }}>
        {description}
      </p>
    </div>
  );
}

export function AttendancePane({
  organizationId,
  initialTab = "students",
  onTabChange,
}: {
  organizationId: string;
  initialTab?: View;
  onTabChange?: (tab: string) => void;
}) {
  const [data, setData] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [leavesData, setLeavesData] = useState<{ staffLeaves: any[]; studentLeaves: any[] } | null>(null);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState<View>(initialTab);
  const [studentFilter, setStudentFilter] = useState<"atRisk" | "all">("atRisk");

  const loadLeaves = () => {
    setLeavesLoading(true);
    getPrincipalLeaves(organizationId)
      .then((res) => setLeavesData(res))
      .catch(() => null)
      .finally(() => setLeavesLoading(false));
  };

  useEffect(() => {
    setCurrentView(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPrincipalAttendance(organizationId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load attendance");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    loadLeaves();
    return () => {
      active = false;
    };
  }, [organizationId]);

  const handlePrincipalLeaveAction = async (id: string, status: "approved" | "rejected", reviewNotes?: string) => {
    await updatePrincipalLeaveStatus(organizationId, id, status, reviewNotes);
    loadLeaves();
    getPrincipalAttendance(organizationId).then(setData).catch(() => null);
  };

  const rate = (value: number | null | undefined) => (value == null ? "—" : `${value}%`);

  const studentRate = data?.studentAttendanceRate ?? null;
  const enrolledCount = data?.enrolledStudents ?? 0;
  const atRiskCount = data?.atRisk?.length ?? 0;
  const pendingCount = data?.pendingRegisters ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 164px height matching School Admin) */}
      {loading ? (
        <KpiSkeletonGrid />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            width: "100%",
          }}
        >
          {/* Card 1: Campus Attendance (Pastel Violet) */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#E0D3FF",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#51249A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                CAMPUS ATTENDANCE
              </span>
              <CalendarCheck size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {rate(studentRate)}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                {data?.markedRecords ?? 0} Recorded Student Periods
              </span>
              <div
                onClick={() => setCurrentView("trends")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                  Trends
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#51249A" }} />
              </div>
            </div>
          </div>

          {/* Card 2: Enrolled Students (Pastel Mint Green) */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#D0EDC0",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#305E26", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ENROLLED STUDENTS
              </span>
              <Users size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {enrolledCount > 0 ? enrolledCount : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                Active Academic Roster
              </span>
              <div
                onClick={() => {
                  setStudentFilter("all");
                  setCurrentView("students");
                }}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                  Roster
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#305E26" }} />
              </div>
            </div>
          </div>

          {/* Card 3: At-Risk Attendance (Pastel Sky Blue) */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#BCE6F3",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#265F79", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                AT-RISK ATTENDANCE
              </span>
              <AlertTriangle size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {atRiskCount > 0 ? atRiskCount : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                Students Below 75% Threshold
              </span>
              <div
                onClick={() => {
                  setStudentFilter("atRisk");
                  setCurrentView("students");
                }}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                  Breach List
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
              </div>
            </div>
          </div>

          {/* Card 4: Pending Registers (Pastel Warm Peach) */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "164px",
              padding: "20px",
              gap: "12px",
              background: "#FADAC9",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#82401E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                PENDING REGISTERS
              </span>
              <Clock size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
            </div>
            <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
              {pendingCount > 0 ? pendingCount : "-"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                Class Periods Needing Finalization
              </span>
              <div
                onClick={() => setCurrentView("teachers")}
                style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
              >
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                  Faculty Status
                </span>
                <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#82401E" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            color: "#991b1b",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* Sub Navigation Strip */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", width: "100%" }}>
        {[
          { id: "students", label: "Student Attendance & At-Risk Roster" },
          { id: "trends", label: "14-Day Attendance Trends" },
          { id: "teachers", label: "Faculty Registers & Leave Status" },
          {
            id: "leaves",
            label: `Leave Approval Desk${
              (leavesData?.staffLeaves?.filter((l: any) => l.status === "pending")?.length || 0) +
              (leavesData?.studentLeaves?.filter((l: any) => l.status === "pending" && l.daysCount > 2)?.length || 0) > 0
                ? ` (${
                    (leavesData?.staffLeaves?.filter((l: any) => l.status === "pending")?.length || 0) +
                    (leavesData?.studentLeaves?.filter((l: any) => l.status === "pending" && l.daysCount > 2)?.length || 0)
                  })`
                : ""
            }`,
          },
        ].map((t) => {
          const isActive = currentView === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setCurrentView(t.id as View);
                onTabChange?.(t.id);
              }}
              style={{
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                height: "34px",
                padding: "0 16px",
                borderRadius: "8px",
                border: isActive ? "1px solid #0C1E33" : "1px solid #E2E8F0",
                background: isActive ? "#0C1E33" : "#F4F6F8",
                color: isActive ? "#FFFFFF" : "#5A6B7D",
                fontSize: "12px",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                boxShadow: isActive ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#E9EEF4";
                  e.currentTarget.style.color = "#0C1E33";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#F4F6F8";
                  e.currentTarget.style.color = "#5A6B7D";
                }
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Students View */}
      {currentView === "students" && (() => {
        const displayedStudents = data ? (studentFilter === "atRisk" ? data.atRisk : (data.students || data.atRisk)) : [];
        return (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E0E5EB",
              borderRadius: "10px",
              boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)",
              overflow: "hidden",
              width: "100%",
            }}
          >
            <div
              style={{
                padding: "18px 24px 16px",
                borderBottom: "1px solid #E0E5EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "15.5px", fontWeight: 700, color: "#0C1E33" }}>
                  {studentFilter === "atRisk" ? "Students Requiring Attendance Follow-up (< 75%)" : "All Enrolled Students Roster"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748B" }}>
                  {studentFilter === "atRisk"
                    ? "Mandatory statutory compliance threshold. At-risk students require parent notification."
                    : "Complete roster of active enrolled students across all classes and sections."}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", gap: "4px", background: "#F1F5F9", padding: "3px", borderRadius: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setStudentFilter("atRisk")}
                    style={{
                      all: "unset",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Poppins', sans-serif",
                      background: studentFilter === "atRisk" ? "#FFFFFF" : "transparent",
                      color: studentFilter === "atRisk" ? "#DC2626" : "#64748B",
                      boxShadow: studentFilter === "atRisk" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    At-Risk (&lt; 75%) ({data?.atRisk?.length ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentFilter("all")}
                    style={{
                      all: "unset",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Poppins', sans-serif",
                      background: studentFilter === "all" ? "#0C1E33" : "transparent",
                      color: studentFilter === "all" ? "#FFFFFF" : "#64748B",
                      boxShadow: studentFilter === "all" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    All Enrolled ({data?.students?.length ?? enrolledCount})
                  </button>
                </div>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E0E5EB", color: "#586C82", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", height: "44px" }}>
                  <th style={{ padding: "0 24px" }}>STUDENT</th>
                  <th style={{ padding: "0 16px" }}>CLASS / ROLL</th>
                  <th style={{ padding: "0 16px" }}>CURRENT ATTENDANCE</th>
                  <th style={{ padding: "0 16px" }}>DAYS ABSENT</th>
                  <th style={{ padding: "0 16px" }}>UNEXCUSED PERIODS</th>
                  <th style={{ padding: "0 24px", textAlign: "right" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading || !data ? (
                  <TableSkeletonRows rows={6} columns={6} />
                ) : displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
                      {studentFilter === "atRisk" ? (
                        (data?.markedRecords ?? 0) === 0 ? (
                          <EmptyState
                            illustration="/bee.png"
                            title="No Finalized Attendance Records"
                            description="No attendance has been finalized today. Live at-risk alerts (< 75%) will populate once sessions are submitted."
                          />
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                            <CheckCircle2 size={32} color="#10B981" />
                            <b style={{ color: "#10B981", fontSize: "14px" }}>
                              All enrolled students are currently maintaining attendance above the 75% threshold.
                            </b>
                          </div>
                        )
                      ) : (
                        <EmptyState
                          illustration="/noresult.png"
                          title="No Enrolled Students"
                          description="No students are enrolled in this school roster yet."
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, idx) => {
                    const isAtRisk = student.attendanceRate != null && student.attendanceRate < 75;
                    const hasData = student.attendanceRate != null;
                    return (
                      <tr
                        key={student.id}
                        style={{
                          height: "52px",
                          background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                          borderBottom: "1px solid #E0E5EB",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC")}
                      >
                        <td style={{ padding: "0 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img
                              src={getStudentAvatarUrl(student.name, student.id)}
                              alt=""
                              style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EAEDF2" }}
                            />
                            <span style={{ fontWeight: 600, color: "#0C1E33" }}>{student.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0 16px", color: "#475569" }}>
                          <span style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 500 }}>
                            {student.className} · Roll #{student.roll || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "0 16px" }}>
                          {hasData ? (
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "100px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: isAtRisk ? "#FEE2E2" : "#DCFCE7",
                                color: isAtRisk ? "#991B1B" : "#166534",
                              }}
                            >
                              {student.attendanceRate}%
                            </span>
                          ) : (
                            <span style={{ color: "#94A3B8" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "0 16px", fontWeight: 600, color: "#0C1E33" }}>
                          {student.daysAbsent ?? 0} days
                        </td>
                        <td style={{ padding: "0 16px", color: "#64748B" }}>
                          {student.unexcusedAbsences ?? 0} periods
                        </td>
                        <td style={{ padding: "0 24px", textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: isAtRisk ? "#DC2626" : "#16A34A",
                            }}
                          >
                            {isAtRisk ? "Intervention Needed" : "Compliant"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* 2. Trends View */}
      {currentView === "trends" && data && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>
            Institutional 14-Day Attendance Telemetry
          </h3>
          {data.trend.length === 0 ? (
            <EmptyState
              illustration="/bee.png"
              title="No Trend Data"
              description="Historical attendance trends will populate as daily sessions are recorded."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
              {data.trend.map((day) => (
                <div
                  key={day.date}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E0E5EB",
                    borderRadius: "8px",
                    padding: "12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>{day.date.slice(5)}</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#0C1E33", margin: "6px 0 2px" }}>
                    {day.attendanceRate != null ? `${day.attendanceRate}%` : "—"}
                  </div>
                  <div style={{ fontSize: "10px", color: "#586C82" }}>
                    {day.presentRecords} of {day.markedRecords}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Teachers Registers View */}
      {currentView === "teachers" && data && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E0E5EB", borderRadius: "10px", padding: "24px", boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>
            Faculty Teaching Registers &amp; Coverage
          </h3>
          {data.teachers.length === 0 ? (
            <EmptyState
              illustration="/bee.png"
              title="No Faculty Teaching Records"
              description="No faculty members are assigned to periods today."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
              {data.teachers.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E0E5EB",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#0C1E33" }}>{t.name}</h4>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                      {t.recordedClasses} class sessions recorded
                    </span>
                  </div>
                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: "100px",
                      fontSize: "10.5px",
                      fontWeight: 600,
                      background: t.approvedLeave ? "#FEE2E2" : "#DCFCE7",
                      color: t.approvedLeave ? "#991B1B" : "#166534",
                    }}
                  >
                    {t.approvedLeave ? "On Leave" : "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Leave Approval Desk */}
      {currentView === "leaves" && (
        <LeaveTable
          leaves={[...(leavesData?.staffLeaves || []), ...(leavesData?.studentLeaves || [])]}
          canApprove={true}
          title="Institutional Leave Applications"
          subtitle="Staff and student absence requests awaiting principal authorization"
          onAction={async (id: string, status: "approved" | "rejected", reviewNotes?: string) => {
            await handlePrincipalLeaveAction(id, status, reviewNotes);
          }}
        />
      )}
    </div>
  );
}
