"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import {
  Eye,
  Plus,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  Search,
  X,
  ArrowRight,
  UserCheck,
  UserX,
  AlertCircle,
  Clock,
  ChevronDown,
  FileCheck2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { TeacherSkeletonRows } from "../components/skeleton-rows";
import {
  assignPrincipalDepartmentHead,
  assignPrincipalDevelopment,
  completePrincipalDevelopment,
  createPrincipalDepartment,
  getPrincipalTeachers,
  getSchoolAdminDepartments,
  recordPrincipalObservation,
  getStudentAvatarUrl,
} from "../../edops-api";
import { DepartmentRecord } from "../../school-admin/types";
import { DepartmentDossierDrawer } from "../../school-admin/components/department-dossier-drawer";
import { MemberLifecycleModal, MemberLifecycleTarget } from "../../components/member-lifecycle-modal";

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
  status?: string;
  empId?: string;
  designation?: string;
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
  const [deptFilter, setDeptFilter] = useState("all");
  const [workloadFilter, setWorkloadFilter] = useState<"all" | "balanced" | "heavy" | "overloaded">("all");
  const [teacherSegment, setTeacherSegment] = useState<"all" | "balanced" | "overloaded" | "active" | "observed">("all");
  const [currentView, setCurrentView] = useState<View>(view);
  const [action, setAction] = useState<Action | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [adminDepartments, setAdminDepartments] = useState<DepartmentRecord[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentRecord | null>(null);
  const [lifecycleTarget, setLifecycleTarget] = useState<MemberLifecycleTarget | null>(null);

  useEffect(() => {
    if (view) setCurrentView(view);
  }, [view]);

  const reload = () => {
    getSchoolAdminDepartments(organizationId)
      .then((depts) => setAdminDepartments(depts || []))
      .catch(() => {});
    return getPrincipalTeachers(organizationId).then(setData);
  };

  useEffect(() => {
    let active = true;
    getSchoolAdminDepartments(organizationId)
      .then((depts) => {
        if (active) setAdminDepartments(depts || []);
      })
      .catch(() => {});
    getPrincipalTeachers(organizationId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load faculty data");
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  const teachers = data?.teachers ?? [];
  const assignments = data?.assignments ?? [];
  const departments = data?.departments ?? [];
  const developments = data?.developments ?? [];

  // Derived Department List for filter dropdown
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    departments.forEach((d) => {
      if (d.name) set.add(d.name);
    });
    return Array.from(set).sort();
  }, [teachers, departments]);

  // Workload KPIs matching School Admin
  const totalFaculty = teachers.length;
  const teachersBalancedCount = useMemo(() => {
    return teachers.filter((t) => (t.weeklyPeriods || 0) <= 24).length;
  }, [teachers]);

  const teachersOverloadedCount = useMemo(() => {
    return teachers.filter((t) => (t.weeklyPeriods || 0) > 28).length;
  }, [teachers]);

  const teachersAvgPeriods = useMemo(() => {
    if (teachers.length === 0) return 0;
    return Math.round(teachers.reduce((acc, t) => acc + (t.weeklyPeriods || 0), 0) / teachers.length);
  }, [teachers]);

  // Filtered Faculty List
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const text = `${t.name} ${t.email} ${t.department ?? ""} ${t.empId ?? ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (deptFilter !== "all" && t.department !== deptFilter) return false;

      const wp = t.weeklyPeriods || 0;
      if (workloadFilter === "balanced" && wp > 24) return false;
      if (workloadFilter === "heavy" && (wp < 25 || wp > 28)) return false;
      if (workloadFilter === "overloaded" && wp <= 28) return false;

      if (teacherSegment === "balanced" && wp > 24) return false;
      if (teacherSegment === "overloaded" && wp <= 28) return false;
      if (teacherSegment === "active" && (t.status || "Active").toLowerCase() === "inactive") return false;
      if (teacherSegment === "observed" && (t.observationsCount || 0) === 0) return false;

      return true;
    });
  }, [teachers, search, deptFilter, workloadFilter, teacherSegment]);

  const ownAssignments = assignments.filter((assignment) => assignment.teacherUserId === form.teacherUserId);
  const field = (name: string, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const open = (next: Action, teacherId?: string) => {
    setError("");
    setForm(teacherId ? { teacherUserId: teacherId } : {});
    setAction(next);
  };

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

  const isFiltered = search !== "" || deptFilter !== "all" || workloadFilter !== "all" || teacherSegment !== "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 164px height matching School Admin) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          width: "100%",
        }}
      >
        {/* Card 1: Total Faculty (Pastel Violet) */}
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
              TOTAL FACULTY
            </span>
            <GraduationCap size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
          </div>
          <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
            {totalFaculty > 0 ? totalFaculty : "-"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
              Active instructional faculty
            </span>
            <div
              onClick={() => {
                setSearch("");
                setDeptFilter("all");
                setWorkloadFilter("all");
                setTeacherSegment("all");
                setCurrentView("workload");
              }}
              style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                Directory
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#51249A" }} />
            </div>
          </div>
        </div>

        {/* Card 2: Balanced Workload (Pastel Mint Green) */}
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
              BALANCED WORKLOAD
            </span>
            <UserCheck size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
          </div>
          <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
            {teachersBalancedCount > 0 ? teachersBalancedCount : "-"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
              Within 24 periods/week
            </span>
            <div
              onClick={() => {
                setWorkloadFilter("balanced");
                setTeacherSegment("balanced");
                setCurrentView("workload");
              }}
              style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                Balanced
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#305E26" }} />
            </div>
          </div>
        </div>

        {/* Card 3: Overloaded Faculty (Pastel Sky Blue) */}
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
              OVERLOADED FACULTY
            </span>
            <AlertCircle size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
          </div>
          <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
            {teachersOverloadedCount > 0 ? teachersOverloadedCount : "-"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
              Exceeding 28 statutory periods
            </span>
            <div
              onClick={() => {
                setWorkloadFilter("overloaded");
                setTeacherSegment("overloaded");
                setCurrentView("workload");
              }}
              style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                Flagged
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
            </div>
          </div>
        </div>

        {/* Card 4: Avg Weekly Load (Pastel Warm Peach) */}
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
              AVG PERIODS / WEEK
            </span>
            <Clock size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
          </div>
          <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
            {teachersAvgPeriods > 0 ? `${teachersAvgPeriods} Per/Wk` : "-"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
              Calculated institutional allocation
            </span>
            <div
              onClick={() => {
                setCurrentView("workload");
              }}
              style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                Workload
              </span>
              <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#82401E" }} />
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
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {error}
        </div>
      )}

      {/* Sub Navigation Strip & Top Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          width: "100%",
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
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {currentView === "workload" && (
            <>
              <button
                type="button"
                onClick={() => open("observation")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#0C1E33",
                  color: "#FFFFFF",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: "0 2px 4px rgba(12, 30, 51, 0.15)",
                }}
              >
                <Plus size={15} /> Classroom Observation
              </button>
              <button
                type="button"
                onClick={() => open("development")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#FFFFFF",
                  color: "#0C1E33",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  border: "1px solid #E2E8F0",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <Plus size={15} /> Assign Training
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
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#0C1E33",
                  color: "#FFFFFF",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                <Plus size={15} /> Add Department
              </button>
              {departments.length > 0 && (
                <button
                  type="button"
                  onClick={() => open("head")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#FFFFFF",
                    color: "#0C1E33",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  <Plus size={15} /> Assign Head
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
                padding: "8px 16px",
                borderRadius: "8px",
                background: "#F8FAFC",
                color: "#0C1E33",
                fontSize: "12.5px",
                fontWeight: 600,
                border: "1px solid #CBD5E1",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
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
                padding: "8px 16px",
                borderRadius: "8px",
                background: "#0C1E33",
                color: "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <Plus size={15} /> Assign Training
            </button>
          )}
        </div>
      </div>

      {/* Main Table Views */}
      {currentView === "workload" && (
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            background: "#FFFFFF",
            border: "1px solid #E0E5EB",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)",
            overflow: "hidden",
          }}
        >
          {/* Heading */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px 16px",
              width: "100%",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "16px", color: "#0C1E33" }}>
                Instructional Faculty &amp; Workload
              </h2>
              <div style={{ display: "inline-flex", padding: "3px 9px", background: "#F4F6F7", borderRadius: "100px" }}>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "10px", color: "#586C82" }}>
                  {teachers.length > 0 ? teachers.length : "-"} Total
                </span>
              </div>
            </div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "11px", color: "#586C82" }}>
              Showing {filteredTeachers.length} of {teachers.length} faculty
            </div>
          </div>

          {/* Filter Controls */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0px 24px 18px",
              gap: "12px",
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 14px",
                gap: "10px",
                height: "42px",
                border: "1px solid #E0E5EB",
                borderRadius: "6px",
                flex: 1,
                minWidth: "240px",
                background: "#FFFFFF",
              }}
            >
              <Search size={16} strokeWidth={2} style={{ color: "#495D72", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search faculty by name, email, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  background: "transparent",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "150%",
                  color: "#0C1E33",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{ all: "unset", cursor: "pointer", display: "flex", color: "#7B8999" }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Department Dropdown */}
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                padding: "0px 14px",
                width: "190px",
                height: "42px",
                border: "1px solid #E0E5EB",
                borderRadius: "6px",
                background: "#FFFFFF",
                position: "relative",
              }}
            >
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "150%",
                  color: "#0C1E33",
                  cursor: "pointer",
                  appearance: "none",
                  paddingRight: "20px",
                }}
              >
                <option value="all">All Departments</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: "#586C82", pointerEvents: "none" }} />
            </div>

            {/* Workload Range Dropdown */}
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                padding: "0px 14px",
                width: "180px",
                height: "42px",
                border: "1px solid #E0E5EB",
                borderRadius: "6px",
                background: "#FFFFFF",
                position: "relative",
              }}
            >
              <select
                value={workloadFilter}
                onChange={(e) => setWorkloadFilter(e.target.value as any)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: "12px",
                  lineHeight: "150%",
                  color: "#0C1E33",
                  cursor: "pointer",
                  appearance: "none",
                  paddingRight: "20px",
                }}
              >
                <option value="all">All Workloads</option>
                <option value="balanced">Balanced (≤24 periods)</option>
                <option value="heavy">Heavy (25–28 periods)</option>
                <option value="overloaded">Overloaded (&gt;28 periods)</option>
              </select>
              <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: "#586C82", pointerEvents: "none" }} />
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDeptFilter("all");
                  setWorkloadFilter("all");
                  setTeacherSegment("all");
                }}
                style={{
                  padding: "0 14px",
                  height: "42px",
                  background: "#F4F6F7",
                  border: "1px solid #E0E5EB",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#586C82",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Quick Segment Filter Tabs */}
          <div
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0px 24px 18px",
              gap: "8px",
              width: "100%",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {[
              { id: "all", label: "All Faculty" },
              { id: "balanced", label: "Balanced Workload" },
              { id: "overloaded", label: "Overloaded Faculty" },
              { id: "active", label: "Active Status" },
              { id: "observed", label: "Observations Conducted" },
            ].map((seg) => {
              const isSegActive = teacherSegment === seg.id;
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => setTeacherSegment(seg.id as any)}
                  style={{
                    boxSizing: "border-box",
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    height: "34px",
                    padding: "0 16px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: isSegActive ? 600 : 500,
                    cursor: "pointer",
                    background: isSegActive ? "#0C1E33" : "#F4F6F8",
                    color: isSegActive ? "#FFFFFF" : "#5A6B7D",
                    border: isSegActive ? "1px solid #0C1E33" : "1px solid #E2E8F0",
                    boxShadow: isSegActive ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
                    transition: "all 0.16s ease",
                    flexShrink: 0,
                  }}
                >
                  <span>{seg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Table Container */}
          <div style={{ width: "100%", padding: "0px 24px", boxSizing: "border-box" }}>
            {/* Table Header */}
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 16px",
                width: "100%",
                height: "44px",
                background: "#F8FAFC",
                borderBottom: "1px solid #E0E5EB",
                userSelect: "none",
              }}
            >
              <div style={{ flex: "2.4 1 200px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                FACULTY MEMBER
              </div>
              <div style={{ flex: "1.2 1 110px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                EMPLOYEE ID
              </div>
              <div style={{ flex: "1.3 1 120px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                DEPARTMENT
              </div>
              <div style={{ flex: "1.1 1 100px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                WORKLOAD
              </div>
              <div style={{ flex: "1.3 1 120px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                LESSON COMPLIANCE
              </div>
              <div style={{ flex: "1.1 1 100px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                OBSERVATIONS
              </div>
              <div style={{ flex: "1.0 1 90px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                STATUS
              </div>
              <div style={{ flex: "0 0 160px", textAlign: "right", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                ACTIONS
              </div>
            </div>

            {/* Table Rows & Skeleton Loading */}
            {!data ? (
              <TeacherSkeletonRows rows={6} />
            ) : filteredTeachers.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "48px 20px",
                  textAlign: "center",
                }}
              >
                <img
                  src="/noresult.png"
                  alt="No faculty found"
                  style={{ width: "120px", height: "auto", marginBottom: "14px", opacity: 0.9 }}
                />
                <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: "#0C1E33" }}>
                  {isFiltered ? "No Matching Faculty Members" : "No Faculty Enrolled"}
                </h3>
                <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#64748B", maxWidth: "380px" }}>
                  {isFiltered
                    ? "Try adjusting your search terms or filters to find faculty records."
                    : "No faculty records are registered in this institution roster yet."}
                </p>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setDeptFilter("all");
                      setWorkloadFilter("all");
                      setTeacherSegment("all");
                    }}
                    style={{
                      padding: "8px 18px",
                      background: "#0C1E33",
                      color: "#FFFFFF",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredTeachers.map((t, idx) => {
                const maxPeriods = 28;
                const weeklyPeriods = t.weeklyPeriods || 0;
                const isOverloaded = weeklyPeriods > maxPeriods;
                const isHeavy = weeklyPeriods >= 25 && !isOverloaded;
                const isEven = idx % 2 === 0;
                const st = (t.status || "Active").toLowerCase();
                const isInactive = st === "inactive";

                return (
                  <div
                    key={t.id}
                    onClick={() => onOpenProfile(t.id)}
                    style={{
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      padding: "0 16px",
                      width: "100%",
                      height: "52px",
                      minHeight: "52px",
                      background: isEven ? "#FFFFFF" : "#F8FAFC",
                      borderBottom: "1px solid #E0E5EB",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? "#FFFFFF" : "#F8FAFC")}
                  >
                    {/* Faculty Identity */}
                    <div
                      style={{
                        flex: "2.4 1 200px",
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "#F5F6F8",
                          border: "1px solid #E4E6E9",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={getStudentAvatarUrl(t.name, t.id)}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 600,
                            fontSize: "13px",
                            lineHeight: "130%",
                            color: "#0C1E33",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={t.name}
                        >
                          {t.name || "—"}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 400,
                            fontSize: "11px",
                            lineHeight: "130%",
                            color: "#64748B",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={t.email}
                        >
                          {t.email || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Employee ID */}
                    <div style={{ flex: "1.2 1 110px", minWidth: 0 }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "11px",
                          background: "#F1F5F9",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid #E2E8F0",
                          color: "#334155",
                        }}
                      >
                        {t.empId || "EMP-" + (t.id ? t.id.slice(0, 5).toUpperCase() : "—")}
                      </span>
                    </div>

                    {/* Department */}
                    <div style={{ flex: "1.3 1 120px", minWidth: 0 }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
                          background: "#F1F5F9",
                          color: "#334155",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "inline-block",
                          maxWidth: "110px",
                        }}
                        title={t.department || "General"}
                      >
                        {t.department || "General"}
                      </span>
                    </div>

                    {/* Workload */}
                    <div style={{ flex: "1.1 1 100px", minWidth: 0, display: "flex", alignItems: "center" }}>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: isOverloaded ? "#FEE2E2" : isHeavy ? "#FEF3C7" : "#F1F5F9",
                          color: isOverloaded ? "#991B1B" : isHeavy ? "#92400E" : "#0C1E33",
                          border: `1px solid ${isOverloaded ? "#FCA5A5" : isHeavy ? "#FDE68A" : "#E2E8F0"}`,
                          whiteSpace: "nowrap",
                        }}
                        title={`${weeklyPeriods} of ${maxPeriods} periods assigned`}
                      >
                        {weeklyPeriods}/{maxPeriods}
                      </span>
                    </div>

                    {/* Lesson Compliance */}
                    <div style={{ flex: "1.3 1 120px", minWidth: 0 }}>
                      {t.lessonPlanCompliance == null ? (
                        <span style={{ color: "#94a3b8", fontSize: "11px" }}>—</span>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "50px", height: "6px", borderRadius: "3px", background: "#E2E8F0", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.min(100, t.lessonPlanCompliance)}%`,
                                height: "100%",
                                background: t.lessonPlanCompliance >= 80 ? "#10B981" : t.lessonPlanCompliance >= 60 ? "#F59E0B" : "#EF4444",
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: "11px", color: "#334155" }}>
                            {t.lessonPlanCompliance}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Observations */}
                    <div style={{ flex: "1.1 1 100px", minWidth: 0, display: "flex", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#475569",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FileCheck2 size={13} color="#64748B" />
                        {t.observationsCount || 0} obs
                      </span>
                    </div>

                    {/* Status */}
                    <div style={{ flex: "1.0 1 90px", minWidth: 0, display: "flex", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "10px",
                          background: isInactive ? "#FEE2E2" : "#ECFDF5",
                          color: isInactive ? "#DC2626" : "#047857",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isInactive ? "Inactive" : "Active"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div
                      style={{
                        flex: "0 0 160px",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProfile(t.id);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "0 10px",
                          height: "28px",
                          borderRadius: "6px",
                          border: "1px solid #E2E8F0",
                          background: "#FFFFFF",
                          color: "#0C1E33",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "'Poppins', sans-serif",
                          transition: "all 0.12s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#0C1E33";
                          e.currentTarget.style.color = "#FFFFFF";
                          e.currentTarget.style.borderColor = "#0C1E33";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#FFFFFF";
                          e.currentTarget.style.color = "#0C1E33";
                          e.currentTarget.style.borderColor = "#E2E8F0";
                        }}
                      >
                        <span>View</span>
                        <ChevronRight size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLifecycleTarget({
                            id: t.id,
                            name: t.name,
                            email: t.email,
                            role: "teacher",
                            status: t.status || "Active",
                            sublabel: `${t.department || "Faculty"} · ${weeklyPeriods} periods/wk`,
                          });
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: isInactive ? "1px solid #86EFAC" : "1px solid #FCA5A5",
                          background: isInactive ? "#DCFCE7" : "#FEE2E2",
                          color: isInactive ? "#166534" : "#DC2626",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        title={isInactive ? "Reactivate Teacher" : "Deactivate Teacher"}
                      >
                        {isInactive ? <UserCheck size={12} /> : <UserX size={12} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {currentView === "hods" && (() => {
        const departmentsList = adminDepartments.length > 0 ? adminDepartments : (departments as any);

        return (
          <div style={{ width: "100%" }}>
            {departmentsList.length === 0 ? (
              <div
                style={{
                  padding: "36px 24px",
                  textAlign: "center",
                  background: "#FFFFFF",
                  border: "1px dashed #CBD5E1",
                  borderRadius: "10px",
                  color: "#64748B",
                  fontSize: "13px",
                }}
              >
                No academic departments created yet. Use &ldquo;Add Department&rdquo; above to start.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "18px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {departmentsList.map((d: any) => {
                  const subjectsList = d.subjects || [];
                  const isPending = (d.status || "").toLowerCase().includes("pend");
                  const hasHod = Boolean(
                    d.headTeacherId ||
                    (d.headName && d.headName !== "Unassigned" && d.headName !== "Department Head")
                  );

                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDept(d)}
                      style={{
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "18px 20px",
                        background: "#FFFFFF",
                        border: "1.5px solid #E2E8F0",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                        boxShadow: "0 2px 5px rgba(12, 30, 51, 0.03)",
                        gap: "14px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#94A3B8";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(12, 30, 51, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#E2E8F0";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 5px rgba(12, 30, 51, 0.03)";
                      }}
                    >
                      {/* Top Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              background: "#E0D3FF",
                              color: "#51249A",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "13px",
                              flexShrink: 0,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {d.code?.slice(0, 4) || "DEPT"}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "#0C1E33",
                                lineHeight: "125%",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={d.name}
                            >
                              {d.name}
                            </h3>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>
                              {d.location || "Academic Wing"}
                            </span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: "100px",
                            background: isPending ? "#FEF3C7" : "#DCFCE7",
                            color: isPending ? "#92400E" : "#166534",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {isPending ? "Pending Setup" : "Active"}
                        </span>
                      </div>

                      {/* HOD Section */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 12px",
                          background: hasHod ? "#F8FAFC" : "#FFFBEB",
                          border: hasHod ? "1px solid #F1F5F9" : "1px dashed #F59E0B",
                          borderRadius: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: hasHod ? "#DBEAFE" : "#FEF3C7",
                              color: hasHod ? "#1E40AF" : "#D97706",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "11px",
                              flexShrink: 0,
                            }}
                          >
                            {hasHod ? (d.headName?.charAt(0) || "H") : "!"}
                          </div>
                          <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>
                              Head of Department
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: hasHod ? "#0C1E33" : "#D97706",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {hasHod ? d.headName : "No HOD Assigned"}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: "11px", color: "#2563EB", fontWeight: 600 }}>
                          {hasHod ? "Edit" : "Assign"}
                        </span>
                      </div>

                      {/* Mapped Subjects Preview */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                            Curriculum Subjects ({subjectsList.length})
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", minHeight: "26px" }}>
                          {subjectsList.length > 0 ? (
                            <>
                              {subjectsList.slice(0, 3).map((sub: any) => (
                                <span
                                  key={sub.id}
                                  style={{
                                    fontSize: "11px",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    background: "#F1F5F9",
                                    color: "#334155",
                                    fontWeight: 500,
                                    maxWidth: "110px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={sub.name}
                                >
                                  {sub.name}
                                </span>
                              ))}
                              {subjectsList.length > 3 && (
                                <span
                                  style={{
                                    fontSize: "10.5px",
                                    padding: "3px 7px",
                                    borderRadius: "6px",
                                    background: "#E2E8F0",
                                    color: "#475569",
                                    fontWeight: 600,
                                  }}
                                >
                                  +{subjectsList.length - 3} more
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: "11.5px", color: "#94A3B8", fontStyle: "italic" }}>
                              No subjects mapped
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Metrics & Dossier Action */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: "12px",
                          borderTop: "1px solid #F1F5F9",
                          marginTop: "auto",
                        }}
                      >
                        <div style={{ display: "flex", gap: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <GraduationCap size={14} style={{ color: "#64748B" }} />
                            <span style={{ fontSize: "11.5px", color: "#334155", fontWeight: 600 }}>
                              {d.teachersCount ?? 0}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>faculty</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Users size={14} style={{ color: "#64748B" }} />
                            <span style={{ fontSize: "11.5px", color: "#334155", fontWeight: 600 }}>
                              {d.studentsCount ?? 0}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>students</span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#2563EB",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          <span>Dossier</span>
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {currentView === "assignments" && (
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            background: "#FFFFFF",
            border: "1px solid #E0E5EB",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              background: "#F8FAFC",
              borderBottom: "1px solid #E0E5EB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                Class &amp; Subject Teaching Allocations
              </span>
              <span style={{ fontSize: "11px", color: "#64748B" }}>
                ({assignments.length} total assignments mapped)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onTabChange?.("academics")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#2563EB",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Configure in Academics &amp; Classes →
            </button>
          </div>

          <div style={{ width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                height: "44px",
                borderBottom: "1px solid #E0E5EB",
                fontWeight: 600,
                fontSize: "10px",
                color: "#586C82",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <div style={{ flex: "1.5 1 140px" }}>CLASS / SECTION</div>
              <div style={{ flex: "1.5 1 140px" }}>SUBJECT</div>
              <div style={{ flex: "2.0 1 180px" }}>ASSIGNED INSTRUCTOR</div>
              <div style={{ flex: "0 0 100px", textAlign: "right" }}>ACTIONS</div>
            </div>

            {assignments.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                No teacher assignments registered yet.
              </div>
            ) : (
              assignments.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 8px",
                    height: "50px",
                    background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                    borderBottom: "1px solid #E0E5EB",
                    fontSize: "12.5px",
                  }}
                >
                  <div style={{ flex: "1.5 1 140px", fontWeight: 600, color: "#0C1E33" }}>
                    {item.className}
                  </div>
                  <div style={{ flex: "1.5 1 140px", color: "#475569" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "#F1F5F9",
                        color: "#334155",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {item.subjectName}
                    </span>
                  </div>
                  <div style={{ flex: "2.0 1 180px" }}>
                    <button
                      type="button"
                      onClick={() => onOpenProfile(item.teacherUserId)}
                      style={{
                        background: "none",
                        border: "none",
                        fontWeight: 600,
                        color: "#0C1E33",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "12.5px",
                      }}
                    >
                      {item.teacherName}
                    </button>
                  </div>
                  <div style={{ flex: "0 0 100px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => open("observation", item.teacherUserId)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #E2E8F0",
                        background: "#FFFFFF",
                        color: "#0C1E33",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Observe
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {currentView === "development" && (
        <div
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            background: "#FFFFFF",
            border: "1px solid #E0E5EB",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              background: "#F8FAFC",
              borderBottom: "1px solid #E0E5EB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                Faculty Professional Development &amp; Training
              </span>
              <span style={{ fontSize: "11px", color: "#64748B" }}>
                ({developments.length} modules recorded)
              </span>
            </div>
            <button
              type="button"
              onClick={() => open("development")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                background: "#0C1E33",
                color: "#FFFFFF",
                fontSize: "11.5px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Assign Training
            </button>
          </div>

          <div style={{ width: "100%", padding: "0 20px", boxSizing: "border-box" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                height: "44px",
                borderBottom: "1px solid #E0E5EB",
                fontWeight: 600,
                fontSize: "10px",
                color: "#586C82",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <div style={{ flex: "2.0 1 180px" }}>EDUCATOR</div>
              <div style={{ flex: "2.2 1 200px" }}>TRAINING MODULE</div>
              <div style={{ flex: "1.5 1 140px" }}>PROVIDER</div>
              <div style={{ flex: "1.0 1 90px" }}>HOURS</div>
              <div style={{ flex: "1.1 1 100px" }}>STATUS</div>
              <div style={{ flex: "0 0 130px", textAlign: "right" }}>ACTIONS</div>
            </div>

            {developments.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                No professional development modules recorded yet.
              </div>
            ) : (
              developments.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 8px",
                    height: "52px",
                    background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                    borderBottom: "1px solid #E0E5EB",
                    fontSize: "12.5px",
                  }}
                >
                  <div style={{ flex: "2.0 1 180px" }}>
                    <button
                      type="button"
                      onClick={() => onOpenProfile(item.teacherUserId)}
                      style={{
                        background: "none",
                        border: "none",
                        fontWeight: 600,
                        color: "#0C1E33",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: "12.5px",
                      }}
                    >
                      {item.teacherName}
                    </button>
                  </div>
                  <div style={{ flex: "2.2 1 200px", fontWeight: 500, color: "#1E293B" }}>
                    {item.title}
                  </div>
                  <div style={{ flex: "1.5 1 140px", color: "#64748B" }}>
                    {item.provider || "—"}
                  </div>
                  <div style={{ flex: "1.0 1 90px", color: "#475569", fontWeight: 600 }}>
                    {item.trainingHours} hrs
                  </div>
                  <div style={{ flex: "1.1 1 100px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "10.5px",
                        fontWeight: 600,
                        background: item.status === "Completed" ? "#DCFCE7" : "#FEF3C7",
                        color: item.status === "Completed" ? "#166534" : "#92400E",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div style={{ flex: "0 0 130px", textAlign: "right" }}>
                    {item.status !== "Completed" && (
                      <button
                        type="button"
                        onClick={() => markCompleted(item.id)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          background: "#0C1E33",
                          color: "#FFFFFF",
                          fontSize: "11px",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
              background: "#FFFFFF",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E0E5EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", margin: 0 }}>
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
                  color: "#64748B",
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
                    background: "#FEF2F2",
                    border: "1px solid #FEE2E2",
                    color: "#991B1B",
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
                      border: "1px solid #CBD5E1",
                      fontSize: "12px",
                      background: "#FFFFFF",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name || t.email} ({t.department || "Faculty"})
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
                      border: "1px solid #CBD5E1",
                      fontSize: "12px",
                      background: "#FFFFFF",
                      fontFamily: "'Poppins', sans-serif",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        fontFamily: "'Poppins', sans-serif",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        fontFamily: "'Poppins', sans-serif",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        background: "#FFFFFF",
                        fontFamily: "'Poppins', sans-serif",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        fontFamily: "'Poppins', sans-serif",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        background: "#FFFFFF",
                        fontFamily: "'Poppins', sans-serif",
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
                            border: "1px solid #CBD5E1",
                            fontSize: "12px",
                            fontFamily: "'Poppins', sans-serif",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        fontFamily: "'Poppins', sans-serif",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        fontFamily: "'Poppins', sans-serif",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        fontFamily: "'Poppins', sans-serif",
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
                          border: "1px solid #CBD5E1",
                          fontSize: "12px",
                          fontFamily: "'Poppins', sans-serif",
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
                          border: "1px solid #CBD5E1",
                          fontSize: "12px",
                          fontFamily: "'Poppins', sans-serif",
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
                        border: "1px solid #CBD5E1",
                        fontSize: "12px",
                        fontFamily: "'Poppins', sans-serif",
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
                  borderTop: "1px solid #F1F5F9",
                }}
              >
                <button
                  type="button"
                  onClick={() => setAction(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #E0E5EB",
                    background: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
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
                    background: "#0C1E33",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {saving ? "Saving…" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Department Dossier Drawer */}
      <DepartmentDossierDrawer
        department={selectedDept}
        isOpen={Boolean(selectedDept)}
        organizationId={organizationId}
        allTeachers={teachers}
        allDepartments={adminDepartments.length > 0 ? adminDepartments : (departments as any)}
        onClose={() => setSelectedDept(null)}
        onDepartmentUpdated={async () => {
          if (organizationId) {
            try {
              const updatedDepts = await getSchoolAdminDepartments(organizationId);
              setAdminDepartments(updatedDepts || []);
              if (selectedDept) {
                const refreshed = (updatedDepts || []).find((d: any) => d.id === selectedDept.id);
                setSelectedDept(refreshed || null);
              }
              reload();
            } catch (err) {
              console.error("Failed to refresh departments:", err);
            }
          }
        }}
      />

      {/* Reusable Member Lifecycle Management Modal */}
      <MemberLifecycleModal
        member={lifecycleTarget}
        isOpen={Boolean(lifecycleTarget)}
        organizationId={organizationId}
        onClose={() => setLifecycleTarget(null)}
        onSuccess={() => {
          reload();
          setLifecycleTarget(null);
        }}
      />
    </div>
  );
}
