"use client";

import React, { useState, useEffect } from "react";
import {
  ClassSectionRecord,
  CurriculumChapter,
} from "./types";
import { getSchoolAdminAcademics } from "../edops-api";
import {
  Calendar,
  BookOpen,
  Users,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export function AcademicsPane({
  organizationId,
  onOpenQuickAction,
}: {
  organizationId?: string;
  onOpenQuickAction: (action: string) => void;
}) {
  const [subtab, setSubtab] = useState<"structure" | "sections" | "subjects" | "curriculum" | "calendar">("structure");

  const [academicData, setAcademicData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<ClassSectionRecord[]>([]);

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    getSchoolAdminAcademics(organizationId)
      .then((data) => {
        setAcademicData(data);
        if (data?.sections && Array.isArray(data.sections) && data.sections.length > 0) {
          setSections(
            data.sections.map((s: any) => ({
              id: s.id,
              grade: s.programName || "Standard",
              section: s.name,
              room: `Room ${s.name}`,
              capacity: s.capacity || 40,
              studentCount: Number(s.enrolledCount || 0),
              classTeacher: "Faculty Assigned",
              shift: "Morning",
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [organizationId]);

  // Curriculum Progress (§29, §30)
  const [curriculum, setCurriculum] = useState<CurriculumChapter[]>([
    { id: "c-1", subject: "Mathematics", grade: "Grade 10", unit: "Unit 1: Number Systems", chapter: "Chapter 1: Real Numbers", learningOutcomes: "Fundamental Theorem of Arithmetic, irrationality proofs", completionPct: 100, teacherName: "Rahul Sharma", status: "Completed" },
    { id: "c-2", subject: "Mathematics", grade: "Grade 10", unit: "Unit 2: Algebra", chapter: "Chapter 2: Polynomials", learningOutcomes: "Zeroes of a polynomial, geometric meaning", completionPct: 85, teacherName: "Rahul Sharma", status: "In Progress" },
    { id: "c-3", subject: "Mathematics", grade: "Grade 10", unit: "Unit 2: Algebra", chapter: "Chapter 3: Linear Equations in Two Variables", learningOutcomes: "Graphical and algebraic solution methods", completionPct: 60, teacherName: "Rahul Sharma", status: "In Progress" },
    { id: "c-4", subject: "Science (Physics)", grade: "Grade 10", unit: "Unit 3: Natural Phenomena", chapter: "Chapter 10: Light - Reflection and Refraction", learningOutcomes: "Spherical mirrors, lens formula, magnification", completionPct: 75, teacherName: "Sunita Rao", status: "In Progress" },
    { id: "c-5", subject: "English", grade: "Grade 10", unit: "Unit 1: First Flight", chapter: "Chapter 1: A Letter to God", learningOutcomes: "Reading comprehension, theme analysis, irony", completionPct: 100, teacherName: "Pooja Malhotra", status: "Completed" },
  ]);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2DDD5", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "structure", label: "Academic Year & Structure" },
            { id: "sections", label: `Classes & Sections (${sections.length})` },
            { id: "subjects", label: `Subjects & Weightage (${academicData?.subjects?.length || 24})` },
            { id: "curriculum", label: "Curriculum Progress (CBSE)" },
            { id: "calendar", label: "Academic Calendar" },
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

        <button
          onClick={() => onOpenQuickAction("addSection")}
          style={{ padding: "8px 16px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={15} /> Add Section
        </button>
      </div>

      {/* 1. ACADEMIC STRUCTURE (§23) */}
      {subtab === "structure" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Active Academic Year Configuration</h3>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Indian School Term Schedule (April 01, 2026 – March 31, 2027)</p>

            <div style={{ background: "#FAF8F5", padding: "16px", borderRadius: "8px", border: "1px solid #E2DDD5", display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Academic Cycle</span>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#064E3B" }}>2026–2027 (CBSE Board)</div>
                </div>
                <span style={{ background: "#ECFDF5", color: "#064E3B", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                  Active Cycle
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12.5px" }}>
                <div>Start Date: <b>April 01, 2026</b></div>
                <div>End Date: <b>March 31, 2027</b></div>
                <div>Term 1 Exams: <b>Sep 15 – Sep 28, 2026</b></div>
                <div>Annual Exams: <b>Feb 18 – Mar 10, 2027</b></div>
              </div>
            </div>

            <div style={{ marginTop: "18px", display: "flex", gap: "10px" }}>
              <button style={{ padding: "8px 14px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                Edit Term Dates
              </button>
              <button style={{ padding: "8px 14px", background: "#FAF8F5", border: "1px solid #E2DDD5", color: "#064E3B", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                Prepare 2027–28 Rollover
              </button>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Grade & Wing Overview</h3>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Nursery to Grade 12 Section Allocation</p>

            <div style={{ display: "grid", gap: "8px" }}>
              {[
                { wing: "Senior Secondary (Grades 11–12)", sections: "8 Sections", strength: "310 Students", streams: "Science, Commerce, Humanities" },
                { wing: "Secondary (Grades 9–10)", sections: "8 Sections", strength: "348 Students", streams: "CBSE Core Curriculum" },
                { wing: "Middle School (Grades 6–8)", sections: "10 Sections", strength: "412 Students", streams: "General Curriculum & Languages" },
                { wing: "Primary & Pre-Primary (Nur–5)", sections: "10 Sections", strength: "350 Students", streams: "Activity-Based Foundational" },
              ].map((w, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "#FAF8F5", borderRadius: "6px", border: "1px solid #E2DDD5" }}>
                  <b style={{ fontSize: "12.5px", color: "#064E3B" }}>{w.wing}</b>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                    {w.sections} · {w.strength} · <span style={{ fontStyle: "italic" }}>{w.streams}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CLASSES & SECTIONS WITH CAPACITY OVERFLOW DETECTOR (§24, §25) */}
      {subtab === "sections" && (
        <div style={{ display: "grid", gap: "16px" }}>
          {/* Capacity Overflow Alert Banner (§25) */}
          <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "10px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertTriangle size={20} color="#D97706" />
            <div>
              <b style={{ color: "#92400E", fontSize: "13px" }}>Section Capacity Overflow Warning: Class 10-C Exceeds Max Limit</b>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#B45309" }}>
                Enrolled: <b>47 Students</b> / Configured Max Capacity: <b>45 Desks</b>. Move 2 students to Section 10-A or 10-B to satisfy fire safety norms.
              </p>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Class & Section</th>
                  <th style={{ padding: "10px" }}>Room & Shift</th>
                  <th style={{ padding: "10px" }}>Class Teacher (§28)</th>
                  <th style={{ padding: "10px" }}>Enrolled / Capacity</th>
                  <th style={{ padding: "10px" }}>Status</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px 10px", textAlign: "center", color: "var(--muted)" }}>
                      {loading ? "Loading class sections..." : "No class sections configured."}
                    </td>
                  </tr>
                ) : (
                  sections.map((sec) => {
                  const isOverflow = sec.studentCount > sec.capacity;
                  const isNearFull = sec.studentCount >= sec.capacity - 2 && !isOverflow;
                  return (
                    <tr key={sec.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <b style={{ color: "#064E3B", fontSize: "14px" }}>{sec.section}</b>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{sec.grade}</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div>{sec.room}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{sec.shift} Shift</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <b>{sec.classTeacher}</b>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>Attendance & Discipline Lead</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 800, color: isOverflow ? "#EF4444" : "#064E3B" }}>
                            {sec.studentCount} / {sec.capacity}
                          </span>
                          <span style={{
                            fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px",
                            background: isOverflow ? "#FEE2E2" : isNearFull ? "#FEF3C7" : "#ECFDF5",
                            color: isOverflow ? "#991B1B" : isNearFull ? "#92400E" : "#064E3B",
                          }}>
                            {isOverflow ? "Overflow +2" : isNearFull ? "Near Capacity" : "Optimal"}
                          </span>
                        </div>
                        <div style={{ width: "120px", height: "5px", background: "#E2DDD5", borderRadius: "3px", marginTop: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, (sec.studentCount / sec.capacity) * 100)}%`, height: "100%", background: isOverflow ? "#EF4444" : "#064E3B" }} />
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ color: isOverflow ? "#DC2626" : "#064E3B", fontWeight: 700 }}>
                          {isOverflow ? "Requires Rebalance" : "Active"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button style={{ padding: "4px 8px", background: "#FDF9F0", border: "1px solid #E5CCA2", color: "#064E3B", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
                          Manage Roster
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CURRICULUM PROGRESS (§29, §30: Units, Chapters & Completion %) */}
      {subtab === "curriculum" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>CBSE Class 10 Syllabus Progress Tracker</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Tracking completion percentage by chapter and teacher assignment</p>
            </div>
            <span style={{ background: "#064E3B", color: "#F8E7C9", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
              Term 2 Progress: 76% (Target: 72%)
            </span>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {curriculum.map((c) => (
              <div key={c.id} style={{ padding: "14px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700 }}>{c.grade} · {c.subject}</span>
                    <h4 style={{ margin: "2px 0", fontSize: "14.5px", fontWeight: 800, color: "#064E3B" }}>{c.chapter}</h4>
                    <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>{c.unit} · Lead Faculty: <b>{c.teacherName}</b></span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>{c.completionPct}%</span>
                    <div style={{ fontSize: "10.5px", color: "var(--muted)", fontWeight: 650 }}>{c.status}</div>
                  </div>
                </div>

                <div style={{ width: "100%", height: "6px", background: "#E2DDD5", borderRadius: "3px", margin: "10px 0 6px", overflow: "hidden" }}>
                  <div style={{ width: `${c.completionPct}%`, height: "100%", background: "#064E3B" }} />
                </div>
                <div style={{ fontSize: "11.5px", color: "#334155" }}>
                  <b>Learning Outcomes:</b> {c.learningOutcomes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ACADEMIC CALENDAR (§31) */}
      {subtab === "calendar" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Centralized School Calendar (§31)</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Synchronized real-time with Teacher, Student, Parent & Principal portals</p>
            </div>
            <button style={{ padding: "6px 12px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
              + Add Event / Holiday
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {[
              { date: "Oct 15, 2026", type: "PTM", title: "Mid-Term Parent Teacher Meeting (All Grades)", sync: "Synced to 1,840 Parent Apps" },
              { date: "Oct 24 – Oct 29, 2026", type: "Holiday", title: "Diwali & Autumn Break (School Closed)", sync: "Synchronized across all schedules" },
              { date: "Nov 14, 2026", type: "School Event", title: "Children's Day Cultural Fest & Sports Heats", sync: "Public Calendar" },
              { date: "Dec 05 – Dec 18, 2026", type: "Exams", title: "Periodic Test 2 Assessment Window", sync: "Exam Desks & Timetable Grids" },
            ].map((ev, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "#FDF9F0", display: "grid", placeItems: "center", border: "1px solid #E5CCA2", color: "#064E3B" }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <b style={{ color: "#064E3B", fontSize: "13.5px" }}>{ev.title}</b>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{ev.date} · Type: <b>{ev.type}</b></div>
                  </div>
                </div>
                <span style={{ fontSize: "11.5px", color: "#064E3B", background: "#ECFDF5", padding: "3px 8px", borderRadius: "10px", fontWeight: 700 }}>
                  {ev.sync}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback for Subjects */}
      {subtab === "subjects" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Course Catalog & Evaluation Scheme (§26)</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Core, Electives, Max Marks, Passing Criteria and Theory/Practical split</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {(academicData?.subjects && academicData.subjects.length > 0
              ? academicData.subjects.map((sub: any) => ({
                  code: sub.code || "SUB-01",
                  name: sub.name,
                  type: "Core",
                  max: 100,
                  pass: 33,
                  theory: 80,
                  practical: 20,
                }))
              : [
                  { code: "MATH-041", name: "Mathematics", type: "Core", max: 100, pass: 33, theory: 80, practical: 20 },
                  { code: "SCI-086", name: "General Science", type: "Core", max: 100, pass: 33, theory: 80, practical: 20 },
                  { code: "ENG-184", name: "English Language & Lit", type: "Core", max: 100, pass: 33, theory: 80, practical: 20 },
                  { code: "CS-165", name: "Computer Applications", type: "Elective", max: 100, pass: 33, theory: 50, practical: 50 },
                ]
            ).map((sub: any, i: number) => (
              <div key={i} style={{ padding: "14px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5" }}>
                <b style={{ color: "#064E3B", fontSize: "14px" }}>{sub.name}</b>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{sub.code} · {sub.type}</div>
                <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span>Max: <b>{sub.max}</b></span>
                  <span>Pass: <b>{sub.pass}</b></span>
                  <span>Theory/Prac: <b>{sub.theory}/{sub.practical}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
