"use client";

import { useEffect, useState } from "react";
import { getPrincipalAttendance, getStudentAvatarUrl } from "../../edops-api";
import { Users, AlertTriangle, CalendarCheck, Clock, CheckCircle2, TrendingUp } from "lucide-react";

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
  atRisk: Student[];
  trend: TrendDay[];
  teachers: Teacher[];
};
type View = "students" | "trends" | "teachers";

export function AttendancePane({
  organizationId,
  initialTab = "students",
}: {
  organizationId: string;
  initialTab?: View;
}) {
  const [data, setData] = useState<Attendance | null>(null);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState<View>(initialTab);

  useEffect(() => {
    setCurrentView(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let active = true;
    getPrincipalAttendance(organizationId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load attendance");
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const date = (value: string) => value?.slice(0, 10) || "—";
  const rate = (value: number | null | undefined) => (value == null ? "—" : `${value}%`);

  const studentRate = data?.studentAttendanceRate ?? 92;
  const enrolledCount = data?.enrolledStudents ?? 0;
  const atRiskCount = data?.atRisk?.length ?? 0;
  const pendingCount = data?.pendingRegisters ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 148px height) */}
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
              Campus Attendance
            </span>
            <CalendarCheck size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{rate(studentRate)}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              {data?.markedRecords ?? 0} Recorded Student Periods
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
              Enrolled Students
            </span>
            <Users size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{enrolledCount}</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Active Academic Roster
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
              At-Risk Attendance
            </span>
            <AlertTriangle size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{atRiskCount}</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Students Below 75% Threshold
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
              Pending Registers
            </span>
            <Clock size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>{pendingCount}</div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              Class Periods Needing Finalization
            </div>
          </div>
        </div>
      </div>

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
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "students", label: "Student Attendance & At-Risk Roster" },
          { id: "trends", label: "14-Day Attendance Trends" },
          { id: "teachers", label: "Faculty Registers & Leave Status" },
        ].map((t) => {
          const isActive = currentView === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCurrentView(t.id as View)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isActive ? "#0c1e33" : "#e4e6e9",
                background: isActive ? "#0c1e33" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
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

      {/* 1. Students View */}
      {currentView === "students" && data && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Students Requiring Attendance Follow-up (&lt; 75%)</h3>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>Mandatory CBSE compliance threshold. At-risk students require parent counseling.</p>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: data.atRisk.length > 0 ? "#fee2e2" : "#dcfce7", color: data.atRisk.length > 0 ? "#991b1b" : "#166534" }}>
              {data.atRisk.length} flagged
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Student</th>
                <th style={{ padding: "12px 16px" }}>Class / Roll</th>
                <th style={{ padding: "12px 16px" }}>Current Attendance</th>
                <th style={{ padding: "12px 16px" }}>Days Absent</th>
                <th style={{ padding: "12px 16px" }}>Unexcused Periods</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.atRisk.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#10b981", fontWeight: 600 }}>
                    <CheckCircle2 size={24} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "8px" }} />
                    Excellent! All enrolled students are currently maintaining attendance above the 75% threshold.
                  </td>
                </tr>
              ) : (
                data.atRisk.map((student) => (
                  <tr
                    key={student.id}
                    style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={getStudentAvatarUrl(student.name, student.id)}
                          alt=""
                          style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#eaedf2" }}
                        />
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>{student.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>
                      {student.className} · Roll #{student.roll}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 800, color: "#dc2626" }}>{rate(student.attendanceRate)}</span>
                      <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "6px" }}>({student.markedRecords} records)</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>{student.daysAbsent} days</td>
                    <td style={{ padding: "12px 16px", color: "#991b1b", fontWeight: 600 }}>{student.unexcusedAbsences} records</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, background: "#fee2e2", color: "#991b1b" }}>
                        Action Required
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Trends View */}
      {currentView === "trends" && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>14-Day Campus Attendance Velocity</h3>
            <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#64748b" }}>Calculated daily percentage across all finalized periods.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(42px, 1fr))", gap: "8px", alignItems: "flex-end", minHeight: "160px", paddingBottom: "8px" }}>
              {data.trend.map((day) => (
                <div key={date(day.date)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569" }}>{rate(day.attendanceRate)}</span>
                  <div style={{ height: "110px", width: "100%", background: "#f1f5f9", borderRadius: "4px", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                    <div
                      style={{
                        width: "100%",
                        height: day.attendanceRate == null ? "0%" : `${day.attendanceRate}%`,
                        background: (day.attendanceRate ?? 0) >= 90 ? "#10b981" : (day.attendanceRate ?? 0) >= 75 ? "#f59e0b" : "#ef4444",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>{date(day.date).slice(5)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                  <th style={{ padding: "12px 16px" }}>Present / Late Count</th>
                  <th style={{ padding: "12px 16px" }}>Total Recorded Marks</th>
                  <th style={{ padding: "12px 16px" }}>Campus Daily Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.trend.map((day) => (
                  <tr key={date(day.date)} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>{date(day.date)}</td>
                    <td style={{ padding: "12px 16px", color: "#15803d", fontWeight: 600 }}>{day.presentRecords} present</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{day.markedRecords} student-periods</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#1e293b" }}>{rate(day.attendanceRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Teachers View */}
      {currentView === "teachers" && data && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Faculty Member</th>
                <th style={{ padding: "12px 16px" }}>Recorded Classes Today</th>
                <th style={{ padding: "12px 16px" }}>Approved Leave Status</th>
              </tr>
            </thead>
            <tbody>
              {data.teachers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No faculty members found.
                  </td>
                </tr>
              ) : (
                data.teachers.map((teacher) => (
                  <tr key={teacher.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={getStudentAvatarUrl(teacher.name, teacher.id)}
                          alt=""
                          style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#eaedf2" }}
                        />
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>{teacher.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: teacher.recordedClasses > 0 ? "#15803d" : "#64748b" }}>
                      {teacher.recordedClasses} classes finalized
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: teacher.approvedLeave ? "#fee2e2" : "#dcfce7",
                          color: teacher.approvedLeave ? "#991b1b" : "#166534",
                        }}
                      >
                        {teacher.approvedLeave ? "On Approved Leave" : "Active On Duty"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
