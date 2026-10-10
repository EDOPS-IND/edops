"use client";

import React, { useState } from "react";
import { ExamRecord } from "./types";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  Eye,
  Plus,
} from "lucide-react";

export function LearningExamsPane({
  organizationId,
  initialTab = "assignments",
}: {
  organizationId?: string;
  initialTab?: "assignments" | "exams" | "results";
}) {
  const [subtab, setSubtab] = useState<"assignments" | "exams" | "results">(initialTab);

  const assignments = [
    { id: "a-1", class: "Grade 10-A", subject: "Mathematics", teacher: "Rahul Sharma", title: "Polynomial Theorems Problem Set #4", dueDate: "2026-10-06", submitted: 38, total: 42, completionPct: 90, status: "Active" },
    { id: "a-2", class: "Grade 10-A", subject: "Science (Physics)", teacher: "Sunita Rao", title: "Ray Optics Numerical Lab Workbook", dueDate: "2026-10-07", submitted: 32, total: 42, completionPct: 76, status: "Active" },
    { id: "a-3", class: "Grade 9-B", subject: "English", teacher: "Pooja Malhotra", title: "Poetry Analysis: The Road Not Taken", dueDate: "2026-10-04", submitted: 39, total: 39, completionPct: 100, status: "Graded" },
    { id: "a-4", class: "Grade 11-A", subject: "Chemistry", teacher: "Dr. K. Saxena", title: "Thermodynamics State Functions Notes", dueDate: "2026-10-08", submitted: 20, total: 32, completionPct: 62, status: "Active" },
  ];

  const exams: ExamRecord[] = [
    { id: "ex-1", name: "Periodic Assessment 2 (Term 1)", examType: "Periodic Test", grade: "Grade 10", academicYear: "2026-27", startDate: "2026-10-18", endDate: "2026-10-24", isPublished: false, passingMarks: 33, totalMarks: 100 },
    { id: "ex-2", name: "Periodic Assessment 1", examType: "Periodic Test", grade: "Grade 10", academicYear: "2026-27", startDate: "2026-07-15", endDate: "2026-07-22", isPublished: true, passingMarks: 33, totalMarks: 100 },
    { id: "ex-3", name: "Half-Yearly Summative Exam", examType: "Half Yearly", grade: "Grade 9-12", academicYear: "2026-27", startDate: "2026-09-15", endDate: "2026-09-28", isPublished: true, passingMarks: 33, totalMarks: 100 },
  ];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2DDD5", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "assignments", label: "Assignment Completion Monitoring (§36)" },
            { id: "exams", label: "Examinations & Schedules (§37)" },
            { id: "results", label: "Result Publishing & Report Cards (§38)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubtab(tab.id as any)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 750 : 600,
                background: subtab === tab.id ? "#064E3B" : "transparent",
                color: subtab === tab.id ? "#F8E7C9" : "#064E3B",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button style={{ padding: "8px 16px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Plus size={15} /> {subtab === "assignments" ? "New Coursework" : "Schedule New Exam"}
        </button>
      </div>

      {/* 1. ASSIGNMENTS MONITORING TAB (§36) */}
      {subtab === "assignments" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Active Coursework & Homework Completion</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>School Admin oversight of teacher assignment releases and student turn-in rates</p>
            </div>
            <span style={{ background: "#ECFDF5", color: "#064E3B", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
              Average Submission Rate: 82%
            </span>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {assignments.map((asg) => (
              <div key={asg.id} style={{ padding: "14px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>{asg.class} · {asg.subject}</span>
                    <h4 style={{ margin: "2px 0", fontSize: "14.5px", fontWeight: 800, color: "#064E3B" }}>{asg.title}</h4>
                    <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>Faculty: <b>{asg.teacher}</b> · Due: <b>{asg.dueDate}</b></span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>
                      {asg.submitted} / {asg.total} ({asg.completionPct}%)
                    </span>
                    <div style={{ fontSize: "11px", color: asg.status === "Graded" ? "#064E3B" : "#B45309", fontWeight: 700 }}>
                      {asg.status}
                    </div>
                  </div>
                </div>

                <div style={{ width: "100%", height: "6px", background: "#E2DDD5", borderRadius: "3px", margin: "10px 0 6px", overflow: "hidden" }}>
                  <div style={{ width: `${asg.completionPct}%`, height: "100%", background: "#064E3B" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "var(--muted)" }}>
                  <span>{asg.total - asg.submitted} students pending submission</span>
                  <button style={{ background: "transparent", border: "none", color: "#064E3B", fontWeight: 700, cursor: "pointer" }}>
                    View Student Drilldown ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. EXAMINATIONS SCHEDULE TAB (§37) */}
      {subtab === "exams" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>School Examination Windows & Cycles</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Unit Tests, Periodic Assessments, Half-Yearly and Annual CBSE Examination Cycles</p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Exam Name</th>
                <th style={{ padding: "10px" }}>Exam Type</th>
                <th style={{ padding: "10px" }}>Applicable Grades</th>
                <th style={{ padding: "10px" }}>Dates Window</th>
                <th style={{ padding: "10px" }}>Passing Criteria</th>
                <th style={{ padding: "10px" }}>Result Status</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((ex) => (
                <tr key={ex.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b>{ex.name}</b>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>Session: {ex.academicYear}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>{ex.examType}</td>
                  <td style={{ padding: "12px 10px" }}>{ex.grade}</td>
                  <td style={{ padding: "12px 10px" }}>{ex.startDate} → {ex.endDate}</td>
                  <td style={{ padding: "12px 10px" }}><b>{ex.passingMarks}</b> / {ex.totalMarks} (33%)</td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                      background: ex.isPublished ? "#ECFDF5" : "#FEF3C7",
                      color: ex.isPublished ? "#064E3B" : "#92400E",
                    }}>
                      {ex.isPublished ? "Results Published" : "Marks In Progress"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>
                    <button style={{ padding: "4px 8px", background: "#FAF8F5", border: "1px solid #E2DDD5", color: "#064E3B", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
                      Manage Subjects
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. CONTROLLED RESULT PUBLISHING (§38) */}
      {subtab === "results" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Controlled Result Publishing & Verification Desk</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Results can only be published after subject HOD lock. All publishing actions are logged to the immutable audit trail.</p>
            </div>
            <button style={{ padding: "8px 14px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
              Batch Generate Report Cards (PDF)
            </button>
          </div>

          <div style={{ padding: "16px", background: "#FAF8F5", border: "1px solid #E2DDD5", borderRadius: "8px", display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b style={{ color: "#064E3B", fontSize: "14px" }}>Periodic Assessment 1 (Grades 9 & 10)</b>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>Published on Aug 05, 2026 by Principal Dr. Sharma · 348 Report Cards Dispatched</div>
              </div>
              <span style={{ color: "#064E3B", fontWeight: 700, fontSize: "12px" }}>✓ Live in Parent Portals</span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={{ padding: "6px 12px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700 }}>
                Download Summary Analytics
              </button>
              <button style={{ padding: "6px 12px", background: "#FAF8F5", border: "1px solid #E2DDD5", color: "#064E3B", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700 }}>
                Print Grade Distribution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
