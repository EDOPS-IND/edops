"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Eye, Plus, Users, GraduationCap, BookOpen, Award, Search, X } from "lucide-react";
import {
  assignPrincipalCoordinator,
  assignPrincipalDepartmentHead,
  assignPrincipalDevelopment,
  assignPrincipalTeacher,
  completePrincipalDevelopment,
  createPrincipalDepartment,
  getPrincipalTeachers,
  recordPrincipalObservation,
  getStudentAvatarUrl,
} from "../../edops-api";

type View = "hods" | "coordinators" | "assignments" | "workload" | "development";
type Action = "observation" | "development" | "department" | "head";
type Teacher = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  classes: string[];
  weeklyPeriods: number;
  lessonPlanCompliance: number | null;
  observationsCount: number;
};
type Assignment = { id: string; teacherUserId: string; teacherName: string; className: string; subjectName: string };
type Department = { id: string; name: string; code: string; headTeacherId: string | null; headName: string | null };
type Coordinator = { id: string; teacherUserId: string; teacherName: string; departmentName: string; assignedAt: string };
type Development = {
  id: string;
  teacherUserId: string;
  teacherName: string;
  title: string;
  provider: string;
  trainingHours: number;
  status: string;
};
type Option = { id: string; name: string };
type PeopleData = {
  teachers: Teacher[];
  assignments: Assignment[];
  departments: Department[];
  coordinators: Coordinator[];
  developments: Development[];
  sections: Option[];
  subjects: Option[];
};

export function TeachersPane({
  organizationId,
  view = "workload",
  onOpenProfile,
  onTabChange,
}: {
  organizationId: string;
  view?: View;
  onOpenProfile: (teacherId: string) => void;
  onTabChange?: (tab: string) => void;
}) {
  const [data, setData] = useState<PeopleData | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentView, setCurrentView] = useState<View>(view);
  const [action, setAction] = useState<Action | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrentView(view);
  }, [view]);

  const reload = () => getPrincipalTeachers(organizationId).then(setData);

  useEffect(() => {
    let active = true;
    getPrincipalTeachers(organizationId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load people data");
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const teachers = data?.teachers ?? [];
  const assignments = data?.assignments ?? [];
  const departments = data?.departments ?? [];
  const coordinators = data?.coordinators ?? [];
  const developments = data?.developments ?? [];
  const sections = data?.sections ?? [];
  const subjects = data?.subjects ?? [];

  const filtered = teachers.filter((teacher) =>
    `${teacher.name} ${teacher.email} ${teacher.department ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const ownAssignments = assignments.filter((assignment) => assignment.teacherUserId === form.teacherUserId);
  const field = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const open = (next: Action) => {
    setError("");
    setForm({});
    setAction(next);
  };

  // KPIs
  const totalFaculty = teachers.length;
  const totalLoads = assignments.length;
  const compliantCount = teachers.filter((t) => (t.lessonPlanCompliance ?? 0) >= 80).length;
  const compliancePct = totalFaculty > 0 ? Math.round((compliantCount / totalFaculty) * 100) : 0;
  const completedTraining = developments.filter((d) => d.status === "Completed").length;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!action) return;
    setSaving(true);
    setError("");
    try {
      if (action === "observation") {
        const assignment = assignments.find(
          (item) => item.id === form.assignmentId && item.teacherUserId === form.teacherUserId
        );
        if (!assignment) throw new Error("Choose an assigned class and subject");
        await recordPrincipalObservation(organizationId, {
          teacherUserId: form.teacherUserId,
          className: assignment.className,
          subjectName: assignment.subjectName,
          lessonTopic: form.lessonTopic,
          overallRating: form.overallRating,
          planningScore: Number(form.planningScore),
          pedagogyScore: Number(form.pedagogyScore),
          engagementScore: Number(form.engagementScore),
          differentiationScore: Number(form.differentiationScore),
          assessmentScore: Number(form.assessmentScore),
          strengths: form.strengths ?? "",
          areasForImprovement: form.areasForImprovement ?? "",
          actionItems: form.actionItems ?? "",
        });
      } else if (action === "development") {
        await assignPrincipalDevelopment(organizationId, {
          teacherUserId: form.teacherUserId,
          title: form.title,
          category: form.category,
          provider: form.provider,
          trainingHours: Number(form.trainingHours),
          notes: form.notes ?? "",
        });
      } else if (action === "department") {
        await createPrincipalDepartment(organizationId, { name: form.name, code: form.code });
      } else if (action === "head") {
        await assignPrincipalDepartmentHead(organizationId, {
          teacherUserId: form.teacherUserId,
          departmentId: form.departmentId,
        });
      }
      await reload();
      setAction(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  async function markCompleted(id: string) {
    setError("");
    try {
      await completePrincipalDevelopment(organizationId, id);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not complete training");
    }
  }

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
              Total Faculty
            </span>
            <Users size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{totalFaculty}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              Active Teaching Educators
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
              Teaching Loads
            </span>
            <BookOpen size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{totalLoads}</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Class-Subject Assignments
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
              Lesson Plan Compliance
            </span>
            <GraduationCap size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{compliancePct}%</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              {compliantCount} of {totalFaculty} Teachers On Track
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
              Faculty Development
            </span>
            <Award size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>{developments.length}</div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              {completedTraining} Modules Completed
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

      {/* Sub Navigation Strip & Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "workload", label: "Faculty Workload" },
            { id: "hods", label: "Department Heads (HODs)" },
            { id: "assignments", label: "Class & Subject Allocations" },
            { id: "development", label: "Professional Development" },
          ].map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as View);
                  onTabChange?.(item.id);
                }}
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
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {currentView === "workload" && (
            <>
              <button
                type="button"
                onClick={() => open("observation")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "#0c1e33",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Classroom Observation
              </button>
              <button
                type="button"
                onClick={() => open("development")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#0c1e33",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1px solid #e4e6e9",
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Assign Training
              </button>
            </>
          )}

          {currentView === "hods" && (
            <>
              <button
                type="button"
                onClick={() => open("department")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "#0c1e33",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Add Department
              </button>
              {departments.length > 0 && (
                <button
                  type="button"
                  onClick={() => open("head")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: "#0c1e33",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "1px solid #e4e6e9",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} /> Assign Head
                </button>
              )}
            </>
          )}

          {currentView === "assignments" && (
            <button
              type="button"
              onClick={() => onTabChange?.("academics")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#f8fafc",
                color: "#0c1e33",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid #ced8e5",
                cursor: "pointer",
              }}
            >
              Configure in Academics &amp; Classes →
            </button>
          )}

          {currentView === "development" && (
            <button
              type="button"
              onClick={() => open("development")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#0c1e33",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Assign Training
            </button>
          )}
        </div>
      </div>

      {/* Main Table Views */}
      {currentView === "workload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e4e6e9", maxWidth: "340px" }}>
            <Search size={15} color="#94a3b8" />
            <input
              aria-label="Search teachers"
              placeholder="Search faculty by name, department, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", outline: "none", width: "100%", fontSize: "12px", color: "#1e293b" }}
            />
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Faculty Member</th>
                  <th style={{ padding: "12px 16px" }}>Department</th>
                  <th style={{ padding: "12px 16px" }}>Assigned Classes</th>
                  <th style={{ padding: "12px 16px" }}>Weekly Periods</th>
                  <th style={{ padding: "12px 16px" }}>Lesson Compliance</th>
                  <th style={{ padding: "12px 16px" }}>Observations</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Dossier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                      No active teachers found matching filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((teacher) => (
                    <tr
                      key={teacher.id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img
                            src={getStudentAvatarUrl(teacher.name || teacher.email, teacher.id)}
                            alt=""
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              background: "#eaedf2",
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "#1e293b" }}>{teacher.name || teacher.email}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "#f1f5f9",
                            color: "#334155",
                          }}
                        >
                          {teacher.department || "General"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>
                        {teacher.classes.length > 0 ? teacher.classes.join(", ") : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>
                        {teacher.weeklyPeriods} periods
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {teacher.lessonPlanCompliance == null ? (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "60px", height: "6px", borderRadius: "3px", background: "#f1f5f9", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${Math.min(100, teacher.lessonPlanCompliance)}%`,
                                  height: "100%",
                                  background: teacher.lessonPlanCompliance >= 80 ? "#10b981" : teacher.lessonPlanCompliance >= 60 ? "#f59e0b" : "#ef4444",
                                }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: "11px", color: "#334155" }}>
                              {teacher.lessonPlanCompliance}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>
                        {teacher.observationsCount} conducted
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => onOpenProfile(teacher.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #e4e6e9",
                            background: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#0c1e33",
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={13} /> View Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentView === "hods" && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Department</th>
                <th style={{ padding: "12px 16px" }}>Department Code</th>
                <th style={{ padding: "12px 16px" }}>Designated Head of Department</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No departments created yet. Use "Add Department" to start.
                  </td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr key={department.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{department.name}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontFamily: "monospace" }}>{department.code}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {department.headTeacherId ? (
                        <button
                          type="button"
                          onClick={() => onOpenProfile(department.headTeacherId!)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "#f1f5f9",
                            border: "none",
                            fontWeight: 600,
                            color: "#0c1e33",
                            cursor: "pointer",
                          }}
                        >
                          {department.headName}
                        </button>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {currentView === "assignments" && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Active instructional allocations mapped across classes and subjects.
            </span>
            <button
              type="button"
              onClick={() => onTabChange?.("academics")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#0c1e33",
                fontSize: "11.5px",
                fontWeight: 650,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Configure in Academics &amp; Classes →
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Class / Section</th>
                <th style={{ padding: "12px 16px" }}>Subject</th>
                <th style={{ padding: "12px 16px" }}>Assigned Faculty</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No teacher assignments mapped.
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{item.className}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{item.subjectName}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        type="button"
                        onClick={() => onOpenProfile(item.teacherUserId)}
                        style={{
                          background: "none",
                          border: "none",
                          fontWeight: 600,
                          color: "#0c1e33",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        {item.teacherName}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {currentView === "development" && (
        <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Educator</th>
                <th style={{ padding: "12px 16px" }}>Training Title</th>
                <th style={{ padding: "12px 16px" }}>Provider</th>
                <th style={{ padding: "12px 16px" }}>Hours</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {developments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No faculty professional development modules registered.
                  </td>
                </tr>
              ) : (
                developments.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        type="button"
                        onClick={() => onOpenProfile(item.teacherUserId)}
                        style={{
                          background: "none",
                          border: "none",
                          fontWeight: 700,
                          color: "#0c1e33",
                          cursor: "pointer",
                        }}
                      >
                        {item.teacherName}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>{item.title}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{item.provider || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{item.trainingHours} hrs</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: item.status === "Completed" ? "#dcfce7" : "#fef3c7",
                          color: item.status === "Completed" ? "#166534" : "#92400e",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {item.status !== "Completed" && (
                        <button
                          type="button"
                          onClick={() => markCompleted(item.id)}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            background: "#0c1e33",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modals */}
      {action && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(11, 15, 25, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e4e6e9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0c1e33", margin: 0 }}>
                {
                  {
                    observation: "Record Classroom Observation",
                    development: "Assign Teacher Training",
                    department: "Add Academic Department",
                    head: "Assign Department Head",
                  }[action]
                }
              </h2>
              <button
                type="button"
                onClick={() => setAction(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={submit}
              style={{
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {error && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    color: "#991b1b",
                    fontSize: "12px",
                  }}
                >
                  {error}
                </div>
              )}

              {action !== "department" && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Select Faculty Member *
                  </label>
                  <select
                    required
                    value={form.teacherUserId ?? ""}
                    onChange={(e) => field("teacherUserId", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      background: "#ffffff",
                    }}
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name || t.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {action === "head" && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Department *
                  </label>
                  <select
                    required
                    value={form.departmentId ?? ""}
                    onChange={(e) => field("departmentId", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      background: "#ffffff",
                    }}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {action === "department" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Department Name *
                    </label>
                    <input
                      required
                      maxLength={100}
                      placeholder="e.g. Science & STEM"
                      value={form.name ?? ""}
                      onChange={(e) => field("name", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Department Code *
                    </label>
                    <input
                      required
                      maxLength={30}
                      placeholder="e.g. SCI-01"
                      value={form.code ?? ""}
                      onChange={(e) => field("code", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                  </div>
                </>
              )}

              {action === "observation" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Teaching Assignment *
                    </label>
                    <select
                      required
                      value={form.assignmentId ?? ""}
                      onChange={(e) => field("assignmentId", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    >
                      <option value="">Select class & subject</option>
                      {ownAssignments.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.className} · {item.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Lesson Topic Observed *
                    </label>
                    <input
                      required
                      maxLength={200}
                      placeholder="e.g. Newton's 2nd Law of Motion"
                      value={form.lessonTopic ?? ""}
                      onChange={(e) => field("lessonTopic", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Overall Rating *
                    </label>
                    <select
                      required
                      value={form.overallRating ?? ""}
                      onChange={(e) => field("overallRating", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    >
                      <option value="">Select rating</option>
                      {["Needs Support", "Satisfactory", "Good", "Exemplary"].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {["planning", "pedagogy", "engagement", "differentiation", "assessment"].map((metric) => (
                      <div key={metric}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "capitalize", marginBottom: "2px" }}>
                          {metric} (1-5)
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={5}
                          value={form[`${metric}Score`] ?? ""}
                          onChange={(e) => field(`${metric}Score`, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            fontSize: "12px",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Observed Strengths
                    </label>
                    <textarea
                      rows={2}
                      value={form.strengths ?? ""}
                      onChange={(e) => field("strengths", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Areas for Improvement & Action Items
                    </label>
                    <textarea
                      rows={2}
                      value={form.actionItems ?? ""}
                      onChange={(e) => field("actionItems", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                  </div>
                </>
              )}

              {action === "development" && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Training Title *
                    </label>
                    <input
                      required
                      maxLength={200}
                      placeholder="e.g. Modern Formative Assessment Techniques"
                      value={form.title ?? ""}
                      onChange={(e) => field("title", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Category
                      </label>
                      <input
                        placeholder="Pedagogy / Tech"
                        value={form.category ?? ""}
                        onChange={(e) => field("category", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Training Hours
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={form.trainingHours ?? ""}
                        onChange={(e) => field("trainingHours", e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Provider / Platform
                    </label>
                    <input
                      placeholder="e.g. CBSE Academic Cell"
                      value={form.provider ?? ""}
                      onChange={(e) => field("provider", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                      }}
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                  paddingTop: "14px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  onClick={() => setAction(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #e4e6e9",
                    background: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#0c1e33",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  {saving ? "Saving…" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
