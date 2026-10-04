"use client";

import React, { useState } from "react";
import { TimetableSlot } from "./types";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  Building,
  User,
  BookOpen,
} from "lucide-react";

export function TimetablePane() {
  const [viewMode, setViewMode] = useState<"class" | "teacher" | "room">("class");
  const [selectedClass, setSelectedClass] = useState("10-A");

  // Sample schedule grid for Class 10-A with an intentional conflict detection example (§32)
  const [slots, setSlots] = useState<TimetableSlot[]>([
    { id: "s-1", day: "Monday", period: 1, time: "08:30 - 09:15", grade: "Grade 10", section: "10-A", subject: "Mathematics", teacherName: "Rahul Sharma", room: "Room 201" },
    { id: "s-2", day: "Monday", period: 2, time: "09:15 - 10:00", grade: "Grade 10", section: "10-A", subject: "Physics", teacherName: "Sunita Rao", room: "Room 201" },
    { id: "s-3", day: "Monday", period: 3, time: "10:15 - 11:00", grade: "Grade 10", section: "10-A", subject: "Chemistry", teacherName: "Dr. K. Saxena", room: "Chemistry Lab" },
    { id: "s-4", day: "Monday", period: 4, time: "11:00 - 11:45", grade: "Grade 10", section: "10-A", subject: "English Lit", teacherName: "Pooja Malhotra", room: "Room 201" },
    { id: "s-5", day: "Tuesday", period: 1, time: "08:30 - 09:15", grade: "Grade 10", section: "10-A", subject: "Mathematics", teacherName: "Rahul Sharma", room: "Room 201" },
    {
      id: "s-6",
      day: "Tuesday",
      period: 2,
      time: "09:15 - 10:00",
      grade: "Grade 10",
      section: "10-A",
      subject: "Computer Science",
      teacherName: "Kunal Mehra",
      room: "IT Lab 1",
      hasConflict: true,
      conflictReason: "Room Conflict: IT Lab 1 is also allocated to Class 11-A (Period 2).",
    },
    { id: "s-7", day: "Tuesday", period: 3, time: "10:15 - 11:00", grade: "Grade 10", section: "10-A", subject: "History", teacherName: "Vikram Mehta", room: "Room 201" },
    { id: "s-8", day: "Tuesday", period: 4, time: "11:00 - 11:45", grade: "Grade 10", section: "10-A", subject: "Physical Education", teacherName: "Coach Ranveer", room: "Ground A" },
  ]);

  const periods = [
    { period: 1, time: "08:30 - 09:15" },
    { period: 2, time: "09:15 - 10:00" },
    { period: "Break", time: "10:00 - 10:15", isBreak: true },
    { period: 3, time: "10:15 - 11:00" },
    { period: 4, time: "11:00 - 11:45" },
    { period: "Lunch", time: "11:45 - 12:30", isBreak: true },
    { period: 5, time: "12:30 - 01:15" },
    { period: 6, time: "01:15 - 02:00" },
  ];

  const days: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday")[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Conflict Alert Banner (§32) */}
      <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={20} color="#DC2626" />
          <div>
            <b style={{ color: "#991B1B", fontSize: "13px" }}>Automated Conflict Detected: Room Collision in Tuesday Period 2</b>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#B91C1C" }}>
              <b>IT Lab 1</b> is assigned concurrently to <b>Class 10-A (Computer Science)</b> and <b>Class 11-A (Informatics)</b>.
            </p>
          </div>
        </div>
        <button style={{ padding: "6px 12px", background: "#991B1B", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          Auto-Resolve Conflict
        </button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
        {/* Header and Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Master Timetable Schedule & Conflict Monitor</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Detects teacher overlap, room double-booking, and period capacity</p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "flex", background: "#FAF8F5", border: "1px solid #E2DDD5", borderRadius: "6px", padding: "2px" }}>
              <button
                onClick={() => setViewMode("class")}
                style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "class" ? "#064E3B" : "transparent", color: viewMode === "class" ? "#F8E7C9" : "#064E3B" }}
              >
                Class View
              </button>
              <button
                onClick={() => setViewMode("teacher")}
                style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "teacher" ? "#064E3B" : "transparent", color: viewMode === "teacher" ? "#F8E7C9" : "#064E3B" }}
              >
                Teacher View
              </button>
              <button
                onClick={() => setViewMode("room")}
                style={{ padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "room" ? "#064E3B" : "transparent", color: viewMode === "room" ? "#F8E7C9" : "#064E3B" }}
              >
                Room View
              </button>
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #E2DDD5", fontSize: "12px", background: "#FFFFFF" }}
            >
              <option value="10-A">Class 10-A</option>
              <option value="10-B">Class 10-B</option>
              <option value="9-A">Class 9-A</option>
              <option value="11-A">Class 11-A</option>
            </select>
          </div>
        </div>

        {/* Weekly Timetable Matrix */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "center" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2DDD5", background: "#FAF8F5" }}>
                <th style={{ padding: "10px", width: "100px", textAlign: "left" }}>Day</th>
                {periods.map((p, idx) => (
                  <th key={idx} style={{ padding: "8px 6px", minWidth: "120px" }}>
                    <b>{p.isBreak ? p.period : `Period ${p.period}`}</b>
                    <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 500 }}>{p.time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day} style={{ borderBottom: "1px solid #FAF8F5" }}>
                  <td style={{ padding: "12px 10px", textAlign: "left", fontWeight: 700, color: "#064E3B", background: "#FAF8F5" }}>
                    {day}
                  </td>
                  {periods.map((p, pIdx) => {
                    if (p.isBreak) {
                      return (
                        <td key={pIdx} style={{ background: "#FDF9F0", color: "var(--muted)", fontSize: "11px", fontStyle: "italic" }}>
                          {p.period}
                        </td>
                      );
                    }
                    const slot = slots.find((s) => s.day === day && s.period === p.period);
                    if (!slot) {
                      return (
                        <td key={pIdx} style={{ padding: "8px", color: "var(--muted)" }}>
                          <span style={{ fontSize: "11px", opacity: 0.5 }}>— Free —</span>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={pIdx}
                        style={{
                          padding: "8px",
                          background: slot.hasConflict ? "#FEE2E2" : "#FAF8F5",
                          border: slot.hasConflict ? "1px solid #FCA5A5" : "1px solid #E2DDD5",
                          borderRadius: "6px",
                        }}
                      >
                        <b style={{ color: slot.hasConflict ? "#991B1B" : "#064E3B", fontSize: "12px", display: "block" }}>
                          {slot.subject}
                        </b>
                        <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>{slot.teacherName}</div>
                        <div style={{ fontSize: "10px", color: slot.hasConflict ? "#DC2626" : "var(--muted)", fontWeight: 600 }}>
                          {slot.room}
                        </div>
                        {slot.hasConflict && (
                          <div style={{ fontSize: "9.5px", color: "#991B1B", fontWeight: 700, marginTop: "2px" }}>
                            COLLISION
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
