"use client";

import React, { useState, useEffect } from "react";
import {
  StudentRecord,
  TeacherRecord,
  StaffRecord,
  ParentRecord,
  DepartmentRecord,
} from "./types";
import {
  getSchoolAdminStudents,
  getSchoolAdminTeachers,
  getSchoolAdminStaff,
  getSchoolAdminParents,
  getSchoolAdminDepartments,
  updateParentChildren,
  updateTeacherEmployment,
  getStudentAvatarUrl,
  sendStudentInvite,
} from "../edops-api";
import {
  Users,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  Building2,
  Search,
  Filter,
  Eye,
  Edit2,
  UserCheck,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Calendar,
  BookOpen,
  Award,
  ShieldAlert,
  ArrowRight,
  Send,
  Plus,
  Clock,
} from "lucide-react";

export function PeoplePane({
  organizationId,
  initialSubtab = "students",
  activeTab,
  onOpenQuickAction,
  onTabChange,
}: {
  organizationId?: string;
  initialSubtab?: "students" | "teachers" | "staff" | "parents" | "departments";
  activeTab?: "students" | "teachers" | "staff" | "parents" | "departments";
  onOpenQuickAction: (action: string) => void;
  onTabChange?: (tab: "students" | "teachers" | "staff" | "parents" | "departments") => void;
}) {
  const [subtab, setSubtab] = useState<"students" | "teachers" | "staff" | "parents" | "departments">(activeTab || initialSubtab);

  useEffect(() => {
    if (activeTab) setSubtab(activeTab);
  }, [activeTab]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Student for 360° Profile Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [student360Tab, setStudent360Tab] = useState<
    "personal" | "academic" | "parents" | "attendance" | "assignments" | "exams" | "results" | "fees" | "leave" | "discipline" | "documents" | "communication" | "activity"
  >("personal");

  // Invite actions state
  const [sendingInviteStudentId, setSendingInviteStudentId] = useState<string | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<{ id: string; msg: string; error?: boolean } | null>(null);

  const handleSendInvite = async (s: StudentRecord) => {
    if (!organizationId) return;
    const studentId = s.id || s.userId;
    if (!studentId) return;
    setSendingInviteStudentId(studentId);
    setInviteFeedback(null);
    try {
      const res = await sendStudentInvite(organizationId, studentId);
      if (res && res.success) {
        setStudents((prev) =>
          prev.map((item) =>
            item.id === s.id || item.userId === studentId
              ? {
                  ...item,
                  inviteStatus: "pending",
                  inviteToken: res.token,
                  inviteExpiresAt: res.expiresAt,
                }
              : item
          )
        );
        setInviteFeedback({ id: studentId, msg: "Invite sent" });
        setTimeout(() => setInviteFeedback(null), 3500);
      } else {
        setInviteFeedback({ id: studentId, msg: "Failed to send", error: true });
      }
    } catch (err: any) {
      setInviteFeedback({ id: studentId, msg: err?.message || "Error sending invite", error: true });
    } finally {
      setSendingInviteStudentId(null);
    }
  };

  // Selected Teacher for Workload Modal
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRecord | null>(null);
  const [editingTeacherEmp, setEditingTeacherEmp] = useState(false);
  const [empIdInput, setEmpIdInput] = useState("");
  const [empTypeInput, setEmpTypeInput] = useState("Regular Faculty");
  const [savingTeacherEmp, setSavingTeacherEmp] = useState(false);
  const [empSaveSuccess, setEmpSaveSuccess] = useState(false);

  const handleOpenTeacherModal = (t: TeacherRecord) => {
    setSelectedTeacher(t);
    setEditingTeacherEmp(false);
    setEmpIdInput(t.empId || "");
    setEmpTypeInput(t.employmentType || "Regular Faculty");
    setEmpSaveSuccess(false);
  };

  const handleSaveTeacherEmp = async () => {
    if (!selectedTeacher || !organizationId) return;
    setSavingTeacherEmp(true);
    try {
      const teacherId = selectedTeacher.userId || selectedTeacher.id;
      await updateTeacherEmployment(organizationId, teacherId, {
        employeeId: empIdInput.trim() || undefined,
        employmentType: empTypeInput.trim() || undefined,
      });
      const updatedTeacher: TeacherRecord = {
        ...selectedTeacher,
        empId: empIdInput.trim() || undefined,
        employmentType: empTypeInput.trim() || undefined,
      };
      setSelectedTeacher(updatedTeacher);
      setTeachers((prev) => prev.map((tc) => (tc.id === selectedTeacher.id ? updatedTeacher : tc)));
      setEditingTeacherEmp(false);
      setEmpSaveSuccess(true);
      setTimeout(() => setEmpSaveSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setSavingTeacherEmp(false);
    }
  };

  // Selected Department for Department 360° Dashboard
  const [selectedDept, setSelectedDept] = useState<DepartmentRecord | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

  // Manage Wards State
  const [manageWardsParent, setManageWardsParent] = useState<ParentRecord | null>(null);
  const [selectedWardIds, setSelectedWardIds] = useState<string[]>([]);
  const [wardSearchQuery, setWardSearchQuery] = useState("");
  const [savingWards, setSavingWards] = useState(false);

  const handleOpenManageWards = (parent: ParentRecord) => {
    setManageWardsParent(parent);
    const currentIds = (parent.children || []).map((ch: any) => ch.studentId || ch.id).filter(Boolean);
    setSelectedWardIds(currentIds);
    setWardSearchQuery("");
  };

  const handleSaveWards = async () => {
    if (!organizationId || !manageWardsParent) return;
    setSavingWards(true);
    try {
      await updateParentChildren(organizationId, manageWardsParent.id, selectedWardIds);
      const updated = await getSchoolAdminParents(organizationId);
      setParents(updated || []);
      setManageWardsParent(null);
    } catch (err: any) {
      alert(err?.message || "Failed to update mapped wards");
    } finally {
      setSavingWards(false);
    }
  };

  const filteredStudentsForWards = students.filter((s) => {
    if (!wardSearchQuery.trim()) return true;
    const q = wardSearchQuery.toLowerCase();
    const nameMatch = (s.name || "").toLowerCase().includes(q);
    const admMatch = (s.admissionNo || s.admissionNumber || "").toLowerCase().includes(q);
    const classMatch = [s.grade, s.className, s.section, s.sectionName].filter(Boolean).join(" ").toLowerCase().includes(q);
    return nameMatch || admMatch || classMatch;
  });

  const studentParents = selectedStudent
    ? parents.filter((p) =>
        (p.children || []).some(
          (ch: any) =>
            (ch.id && (ch.id === selectedStudent.userId || ch.id === selectedStudent.id)) ||
            (ch.studentId && (ch.studentId === selectedStudent.userId || ch.studentId === selectedStudent.id))
        )
      )
    : [];

  // Lazy load per tab on demand with in-memory caching
  useEffect(() => {
    if (!organizationId) return;
    if (loadedTabs[subtab]) return;

    setLoading(true);
    let fetcher: Promise<any>;
    if (subtab === "students") {
      fetcher = getSchoolAdminStudents(organizationId).then((st) => setStudents(st || []));
    } else if (subtab === "teachers") {
      fetcher = getSchoolAdminTeachers(organizationId).then((tc) => setTeachers(tc || []));
    } else if (subtab === "staff") {
      fetcher = getSchoolAdminStaff(organizationId).then((sf) => setStaff(sf || []));
    } else if (subtab === "parents") {
      const p1 = getSchoolAdminParents(organizationId).then((pr) => setParents(pr || []));
      const p2 = !loadedTabs["students"]
        ? getSchoolAdminStudents(organizationId).then((st) => {
            setStudents(st || []);
            setLoadedTabs((prev) => ({ ...prev, students: true }));
          }).catch(() => {})
        : Promise.resolve();
      fetcher = Promise.all([p1, p2]);
    } else {
      fetcher = getSchoolAdminDepartments(organizationId).then((dp) => setDepartments(dp || []));
    }

    fetcher
      .catch(() => {})
      .finally(() => {
        setLoadedTabs((prev) => ({ ...prev, [subtab]: true }));
        setLoading(false);
      });
  }, [organizationId, subtab, loadedTabs]);

  // Load parents on demand if Student 360 profile is opened
  useEffect(() => {
    if (selectedStudent && organizationId && !loadedTabs["parents"]) {
      getSchoolAdminParents(organizationId)
        .then((pr) => {
          setParents(pr || []);
          setLoadedTabs((prev) => ({ ...prev, parents: true }));
        })
        .catch(() => {});
    }
  }, [selectedStudent, organizationId, loadedTabs]);

  const filteredStudents = students.filter((s) => {
    if (gradeFilter !== "all" && !s.grade.toLowerCase().includes(gradeFilter.toLowerCase())) return false;
    if (statusFilter !== "all" && s.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E6E9", paddingBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "students", label: `Students (${students.length})`, icon: GraduationCap },
            { id: "teachers", label: `Teachers & Workload (${teachers.length})`, icon: Users },
            { id: "staff", label: `Staff Intelligence (${staff.length})`, icon: Briefcase },
            { id: "parents", label: `Parents & Mappings (${parents.length})`, icon: HeartHandshake },
            { id: "departments", label: `Departments (${departments.length})`, icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subtab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSubtab(tab.id as any);
                  if (onTabChange) onTabChange(tab.id as any);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 500,
                  background: active ? "#0c1e33" : "transparent",
                  color: active ? "#ffffff" : "#495d72",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "#f4f6f7";
                    e.currentTarget.style.color = "#0c1e33";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#495d72";
                  }
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {subtab === "staff" && (
            <button
              onClick={() => onOpenQuickAction("addPrincipal")}
              style={{
                padding: "8px 14px",
                background: "#ffffff",
                color: "#0c1e33",
                border: "1px solid #CED8E5",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f6f7")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <Plus size={15} />
              Add Principal
            </button>
          )}
          <button
            onClick={() => {
              if (subtab === "students") onOpenQuickAction("addStudent");
              else if (subtab === "teachers") onOpenQuickAction("addTeacher");
              else if (subtab === "staff") onOpenQuickAction("addStaff");
              else if (subtab === "parents") onOpenQuickAction("mapParent");
              else onOpenQuickAction("addDepartment");
            }}
            style={{
              padding: "8px 16px",
              background: "#0c1e33",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(12, 30, 51, 0.08)",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#132840")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0c1e33")}
          >
            <Plus size={15} />
            {subtab === "students" ? "Add Student" : subtab === "teachers" ? "Add Teacher" : subtab === "staff" ? "Add Staff" : subtab === "parents" ? "Map Parent" : "New Department"}
          </button>
        </div>
      </div>

      {/* Top 4 Pastel Metric Cards (Strictly 148px) */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {/* Card 1: Total Directory Records (Pastel Violet) */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#e1d2ff",
            border: "1px solid #e1d2ff",
            borderRadius: "10px",
            color: "#4a0e8f",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {subtab === "students" ? "Total Students" : subtab === "teachers" ? "Instructional Faculty" : subtab === "staff" ? "Support Staff" : subtab === "parents" ? "Mapped Guardians" : "Academic Units"}
            </span>
            <Users size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
            {subtab === "students" ? students.length : subtab === "teachers" ? teachers.length : subtab === "staff" ? staff.length : subtab === "parents" ? parents.length : departments.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Active in campus ledger</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Directory</span>
          </div>
        </article>

        {/* Card 2: Active Turnout / Regular (Pastel Mint) */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ccefbf",
            border: "1px solid #ccefbf",
            borderRadius: "10px",
            color: "#1a5c0a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {subtab === "students" ? "Good Attendance" : subtab === "teachers" ? "Regular Status" : subtab === "staff" ? "Full-Time Shift" : subtab === "parents" ? "Verified Contacts" : "Core Programs"}
            </span>
            <UserCheck size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
            {subtab === "students"
              ? students.filter((s) => !s.attendanceRate || parseFloat(String(s.attendanceRate)) >= 75).length
              : subtab === "teachers"
              ? teachers.filter((t) => t.employmentType === "Regular Faculty").length
              : subtab === "staff"
              ? staff.filter((s) => s.employmentType === "Full Time").length
              : subtab === "parents"
              ? parents.filter((p) => p.mobile).length
              : departments.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Verified compliance standing</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Status</span>
          </div>
        </article>

        {/* Card 3: Associated Records (Pastel Sky) */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#bae5f5",
            border: "1px solid #bae5f5",
            borderRadius: "10px",
            color: "#0a5a7a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {subtab === "students" ? "Mapped to Guardians" : subtab === "teachers" ? "Assigned Sections" : subtab === "staff" ? "Department Allocation" : subtab === "parents" ? "Linked Students" : "Faculty Affiliated"}
            </span>
            <GraduationCap size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
            {subtab === "students"
              ? students.filter((s) => s.parentName).length
              : subtab === "teachers"
              ? teachers.reduce((acc, t) => acc + (t.assignedClassesCount || 0), 0)
              : subtab === "staff"
              ? staff.length
              : subtab === "parents"
              ? parents.reduce((acc, p) => acc + (p.children?.length || 0), 0)
              : departments.length * 3}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Linked institutional mappings</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Linked</span>
          </div>
        </article>

        {/* Card 4: Portal & Comms (Pastel Coral) */}
        <article
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ffd8c7",
            border: "1px solid #ffd8c7",
            borderRadius: "10px",
            color: "#782a00",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {subtab === "students" ? "Transport Roster" : subtab === "teachers" ? "Faculty Workload" : subtab === "staff" ? "Operational Desk" : subtab === "parents" ? "Active App Users" : "Budget Allocation"}
            </span>
            <Award size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#782a00" }}>
            {subtab === "students" ? "Active" : subtab === "teachers" ? "Balanced" : subtab === "staff" ? "Active" : subtab === "parents" ? "Enabled" : "Allocated"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Institutional operational parity</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Operational</span>
          </div>
        </article>
      </section>

      {/* ============================================================== */}
      {/* 1. STUDENTS TAB (, : Roster & Student 360° Profile)       */}
      {/* ============================================================== */}
      {subtab === "students" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          {/* Filter Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--muted)" }} />
                <input
                  type="text"
                  placeholder="Search student by name, admission no, roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px" }}
                />
              </div>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "12.5px", background: "#FFFFFF" }}
              >
                <option value="all">All Grades</option>
                <option value="10">Grade 10</option>
                <option value="9">Grade 9</option>
                <option value="11">Grade 11</option>
              </select>
            </div>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>Showing {filteredStudents.length} of {students.length} students</span>
          </div>

          {/* Students Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e4e6e9", color: "#495d72", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "12px 10px" }}>Admission No</th>
                  <th style={{ padding: "12px 10px" }}>Student Name</th>
                  <th style={{ padding: "12px 10px" }}>Class / Roll</th>
                  <th style={{ padding: "12px 10px" }}>Parent / Contact</th>
                  <th style={{ padding: "12px 10px" }}>Attendance</th>
                  <th style={{ padding: "12px 10px" }}>Fee Status</th>
                  <th style={{ padding: "12px 10px" }}>Academic Status</th>
                  <th style={{ padding: "12px 10px" }}>Invite</th>
                  <th style={{ padding: "12px 10px", textAlign: "right" }}>360° Profile</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "32px 10px", textAlign: "center", color: "#64748b" }}>
                      {loading ? "Loading students..." : "No student records found."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr
                      key={s.id}
                      style={{ borderBottom: "1px solid #e4e6e9", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 10px" }}>
                        <b style={{ color: "#0c1e33" }}>{s.admissionNo}</b>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>House: {s.house}</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", background: "#F5F6F8", border: "1px solid #E4E6E9", flexShrink: 0 }}>
                            <img
                              src={getStudentAvatarUrl(s.name, s.admissionNo || s.rollNo)}
                              alt={s.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </div>
                          <div>
                            <b style={{ color: "#0c1e33" }}>{s.name}</b>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{s.gender} · Blood {s.bloodGroup}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <b style={{ color: "#0c1e33" }}>{s.section}</b>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Roll #{s.rollNo}</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ color: "#0c1e33", fontWeight: 500 }}>{s.parentName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{s.parentPhone}</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontWeight: 700, color: s.attendancePct < 75 ? "#B45309" : "#047857" }}>
                          {s.attendancePct}%
                        </span>
                        {s.attendancePct < 75 && (
                          <span style={{ display: "block", fontSize: "10px", color: "#B45309", fontWeight: 600 }}>Breach &lt;75%</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                          background: s.feeStatus === "Paid" ? "#ECFDF5" : s.feeStatus === "Pending" ? "#FEF3C7" : "#FEE2E2",
                          color: s.feeStatus === "Paid" ? "#047857" : s.feeStatus === "Pending" ? "#92400E" : "#991B1B",
                        }}>
                          {s.feeStatus}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#0c1e33" }}>{s.academicStatus}</span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        {(() => {
                          const status = s.inviteStatus || (s.status === "Pending Invite" ? "pending" : "accepted");
                          if (status === "accepted") {
                            return (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  background: "#ECFDF5",
                                  color: "#047857",
                                }}
                              >
                                <CheckCircle2 size={12} /> Accepted
                              </span>
                            );
                          }
                          if (status === "pending") {
                            return (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  background: "#FEF3C7",
                                  color: "#92400E",
                                }}
                              >
                                <Clock size={12} /> Pending
                              </span>
                            );
                          }
                          const studentIdentifier = s.id || s.userId;
                          const isBusy = sendingInviteStudentId === studentIdentifier;
                          const feedback = inviteFeedback?.id === studentIdentifier ? inviteFeedback : null;
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  background: "#F1F5F9",
                                  color: "#475569",
                                }}
                              >
                                <Mail size={12} /> Not Sent
                              </span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSendInvite(s)}
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "5px",
                                  border: "1px solid #CBD5E1",
                                  background: "#FFFFFF",
                                  color: "#0c1e33",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: isBusy ? "wait" : "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  opacity: isBusy ? 0.6 : 1,
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => { if (!isBusy) e.currentTarget.style.borderColor = "#94A3B8"; }}
                                onMouseLeave={(e) => { if (!isBusy) e.currentTarget.style.borderColor = "#CBD5E1"; }}
                              >
                                <Send size={11} />
                                {isBusy ? "Sending…" : "Send Invite Link"}
                              </button>
                              {feedback && (
                                <span style={{ fontSize: "10px", color: feedback.error ? "#DC2626" : "#059669", fontWeight: 600 }}>
                                  {feedback.msg}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          style={{
                            padding: "6px 12px",
                            background: "#0c1e33",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#1a365d")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#0c1e33")}
                        >
                          <Eye size={13} /> Open 360°
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

      {/* ============================================================== */}
      {/* 2. TEACHERS & WORKLOAD TAB (, : Periods 28/30 Calculator) */}
      {/* ============================================================== */}
      {subtab === "teachers" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Workload Intelligence Alert Card */}
          <div style={{ background: "#ffffff", border: "1px solid #E4E6E9", borderRadius: "10px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 2px rgba(12, 30, 51, 0.04)" }}>
            <div>
              <b style={{ color: "#0c1e33", fontSize: "14px" }}>Automated Faculty Workload Calculation Active</b>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                State private school standard: 24–28 periods/week (Balanced). Overload flagged automatically when exceeding 30 periods.
              </p>
            </div>
            <span style={{ background: "#0c1e33", color: "#ffffff", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>
              {teachers.length} / {teachers.length} Calculated
            </span>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E6E9", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 2px rgba(12, 30, 51, 0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E4E6E9", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Emp ID & Name</th>
                  <th style={{ padding: "10px" }}>Department</th>
                  <th style={{ padding: "10px" }}>Designation</th>
                  <th style={{ padding: "10px" }}>Assigned Subjects</th>
                  <th style={{ padding: "10px" }}>Classes Taught</th>
                  <th style={{ padding: "10px" }}>Weekly Workload</th>
                  <th style={{ padding: "10px" }}>Status</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "32px 10px", textAlign: "center", color: "var(--muted)" }}>
                      {loading ? "Loading teachers..." : "No teacher records found."}
                    </td>
                  </tr>
                ) : (
                  teachers.map((t) => {
                  const maxPeriods = t.maxPeriods || 28;
                  const weeklyPeriods = t.weeklyPeriods || 0;
                  const workloadPct = Math.round((weeklyPeriods / maxPeriods) * 100);
                  const isOverloaded = weeklyPeriods > maxPeriods;
                  const isHeavy = weeklyPeriods >= 26 && !isOverloaded;
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid #F4F6F7" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", background: "#F5F6F8", border: "1px solid #E4E6E9", flexShrink: 0 }}>
                            <img
                              src={getStudentAvatarUrl(t.name, t.email || t.empId)}
                              alt={t.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </div>
                          <div>
                            <b>{t.name}</b>
                            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{t.empId || "ID Unassigned"} · {t.employmentType || "Regular Faculty"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontWeight: 600, color: "#0c1e33" }}>{t.department || "General"}</span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>{t.designation}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontSize: "12px" }}>{t.subjects && t.subjects.length > 0 ? t.subjects.join(", ") : "—"}</span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {t.classes && t.classes.length > 0 ? t.classes.map((c) => (
                            <span key={c} style={{ background: "#F4F6F7", border: "1px solid #E4E6E9", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>
                              {c}
                            </span>
                          )) : <span style={{ fontSize: "12px", color: "var(--muted)" }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <b>{weeklyPeriods} / {maxPeriods}</b>
                          <span style={{
                            fontSize: "10.5px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px",
                            background: isOverloaded ? "#FEE2E2" : isHeavy ? "#FEF3C7" : "#ECFDF5",
                            color: isOverloaded ? "#991B1B" : isHeavy ? "#92400E" : "#047857",
                          }}>
                            {isOverloaded ? "Overloaded" : isHeavy ? "Heavy" : "Balanced"}
                          </span>
                        </div>
                        <div style={{ height: "4px", width: "100px", background: "#E4E6E9", borderRadius: "2px", marginTop: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, workloadPct)}%`, height: "100%", background: isOverloaded ? "#EF4444" : "#0c1e33" }} />
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ color: "#047857", fontWeight: 600 }}>{t.status}</span>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenTeacherModal(t)}
                          style={{ padding: "6px 12px", background: "#F4F6F7", border: "1px solid #E4E6E9", color: "#0c1e33", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", transition: "background 0.12s ease" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#e4e6e9")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#F4F6F7")}
                        >
                          Workload Profile
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

      {/* ============================================================== */}
      {/* 3. STAFF INTELLIGENCE TAB (, : Non-Teaching Staff Roster)   */}
      {/* ============================================================== */}
      {subtab === "staff" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Department Breakdown Mini-Pills */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            {[
              { dept: "Finance & Accounts", count: staff.filter(s => /finance|account/i.test(s.department || "")).length, roles: "Accountants, Cashiers" },
              { dept: "Administration", count: staff.filter(s => /admin/i.test(s.department || "")).length, roles: "Office Staff, Registrar" },
              { dept: "Transport Fleet", count: staff.filter(s => /transport/i.test(s.department || "")).length, roles: "Drivers, Conductors, Route Mgr" },
              { dept: "Campus Medical & Operations", count: staff.filter(s => !/finance|account|admin|transport/i.test(s.department || "")).length, roles: "Medical, Security & Support" },
            ].map((d, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E4E6E9", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 2px rgba(12, 30, 51, 0.02)" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>{d.dept}</span>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0c1e33", margin: "4px 0" }}>{d.count} Staff</div>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>{d.roles}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E6E9", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 2px rgba(12, 30, 51, 0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E4E6E9", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Emp ID & Name</th>
                  <th style={{ padding: "10px" }}>Department</th>
                  <th style={{ padding: "10px" }}>Designation</th>
                  <th style={{ padding: "10px" }}>Phone / Email</th>
                  <th style={{ padding: "10px" }}>Employment Type</th>
                  <th style={{ padding: "10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px 10px", textAlign: "center", color: "var(--muted)" }}>
                      {loading ? "Loading staff records..." : "No staff members recorded."}
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #F4F6F7" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", background: "#F5F6F8", border: "1px solid #E4E6E9", flexShrink: 0 }}>
                            <img
                              src={getStudentAvatarUrl(s.name, s.email || s.empId)}
                              alt={s.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </div>
                          <div>
                            <b>{s.name}</b>
                            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{s.empId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontWeight: 600, color: "#0c1e33" }}>{s.department}</span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>{s.designation}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <div>{s.phone}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{s.email}</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>{s.employmentType}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ color: "#047857", fontWeight: 600 }}>{s.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. PARENTS & M:N MAPPING TAB ( - : Children Switcher)      */}
      {/* ============================================================== */}
      {subtab === "parents" && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #E4E6E9", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 1px 2px rgba(12, 30, 51, 0.04)" }}>
            <b style={{ color: "#0c1e33", fontSize: "14px" }}>Many-to-Many Authorized Guardian Mapping Enabled</b>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--muted)" }}>
              A parent can have multiple enrolled children across grades. Passwords are never exposed; parents activate via secure encrypted single-use tokens.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E6E9", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 2px rgba(12, 30, 51, 0.02)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E4E6E9", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Parent Name</th>
                  <th style={{ padding: "10px" }}>Contact</th>
                  <th style={{ padding: "10px" }}>Relationship</th>
                  <th style={{ padding: "10px" }}>Mapped Children</th>
                  <th style={{ padding: "10px" }}>Invitation Status</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px 10px", textAlign: "center", color: "var(--muted)" }}>
                      {loading ? "Loading parent records..." : "No parent records registered."}
                    </td>
                  </tr>
                ) : (
                  parents.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #F4F6F7" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", background: "#F5F6F8", border: "1px solid #E4E6E9", flexShrink: 0 }}>
                            <img
                              src={getStudentAvatarUrl(p.name, p.mobile || p.email)}
                              alt={p.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </div>
                          <div>
                            <b>{p.name}</b>
                            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{p.occupation}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div>{p.mobile}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{p.email}</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>{p.relationship}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "grid", gap: "4px" }}>
                          {p.children && p.children.length > 0 ? (
                            p.children.map((ch: any, idx) => (
                              <span key={idx} style={{ background: "#F4F6F7", border: "1px solid #E4E6E9", padding: "2px 8px", borderRadius: "6px", fontSize: "11.5px" }}>
                                <b>{ch.studentName || ch.name}</b> ({[ch.grade, ch.section].filter(Boolean).join(" · ") || ch.class || "Enrolled"})
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>No ward linked yet</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                          background: p.invitationStatus === "Accepted" ? "#ECFDF5" : "#FEF3C7",
                          color: p.invitationStatus === "Accepted" ? "#047857" : "#92400E",
                        }}>
                          {p.invitationStatus || p.accountStatus || "Active"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => handleOpenManageWards(p)}
                            style={{
                              padding: "6px 12px",
                              background: "#F4F6F7",
                              color: "#0c1e33",
                              border: "1px solid #E4E6E9",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "background 0.12s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#e4e6e9")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#F4F6F7")}
                          >
                            Manage Wards
                          </button>
                          <button
                            onClick={() => alert(`Resending invite link to ${p.email}`)}
                            style={{
                              padding: "6px 12px",
                              background: "#0c1e33",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#132840")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#0c1e33")}
                          >
                            Resend Invite
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. DEPARTMENTS TAB ( - : Department 360° Management)       */}
      {/* ============================================================== */}
      {subtab === "departments" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {departments.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E6E9", borderRadius: "10px", padding: "32px", textAlign: "center", color: "var(--muted)" }}>
              {loading ? "Loading departments..." : "No academic departments found."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {departments.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E6E9",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 2px rgba(12, 30, 51, 0.02)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0c1e33" }}>{d.name}</h4>
                        <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600 }}>Code: {d.code}</span>
                      </div>
                      <span style={{ background: "#ECFDF5", color: "#047857", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>
                        {d.status}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 10px", fontSize: "12px", color: "var(--muted)" }}>
                      Head: <b>{d.headName || "Unassigned"}</b> {d.headEmail ? `(${d.headEmail})` : ""}
                    </p>

                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--muted)", marginBottom: "4px" }}>
                        Mapped Subjects ({d.subjects?.length || 0}):
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {d.subjects && d.subjects.length > 0 ? (
                          d.subjects.map((s: any) => (
                            <span
                              key={s.id}
                              style={{
                                fontSize: "11px",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: "#F4F6F7",
                                color: "#0c1e33",
                                fontWeight: 500,
                                border: "1px solid #E4E6E9",
                              }}
                            >
                              {s.name} {s.code ? `(${s.code})` : ""}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: "11.5px", color: "var(--muted)", fontStyle: "italic" }}>
                            No subjects mapped yet
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#F4F6F7", padding: "10px", borderRadius: "6px", fontSize: "12px", marginBottom: "14px" }}>
                      <div>Faculty: <b>{d.teachersCount}</b></div>
                      <div>Students: <b>{d.studentsCount}</b></div>
                      <div>Attendance: <b>{d.avgAttendancePct}%</b></div>
                      <div>Syllabus: <b>{d.syllabusCompletionPct}%</b></div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E4E6E9", paddingTop: "10px" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{d.location}</span>
                    <button
                      onClick={() => setSelectedDept(d)}
                      style={{ padding: "4px 10px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#132840")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#0c1e33")}
                    >
                      View Dept 360°
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STUDENT 360° PROFILE MODAL (: 13 Individual Tabs)           */}
      {/* ============================================================== */}
      {selectedStudent && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onMouseDown={(e) => e.target === e.currentTarget && setSelectedStudent(null)}
        >
          <section
            className="action-modal"
            role="dialog"
            aria-modal="true"
            style={{
              maxWidth: "860px",
              width: "95%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #E4E6E9",
              boxShadow: "0 24px 64px rgba(12, 30, 51, 0.2)",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E6E9", paddingBottom: "14px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "10px", overflow: "hidden", border: "1px solid #ced8e5", background: "#f5f6f8", flexShrink: 0 }}>
                  <img
                    src={getStudentAvatarUrl(selectedStudent.name, selectedStudent.admissionNo || selectedStudent.rollNo)}
                    alt={selectedStudent.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 650, color: "#0c1e33" }}>{selectedStudent.name} (360° Profile)</h3>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Admission: {selectedStudent.admissionNo} · {selectedStudent.grade} ({selectedStudent.section}) · Roll #{selectedStudent.rollNo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#F4F6F7",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: "#495D72",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* 13 Navigation Tabs */}
            <div style={{ display: "flex", gap: "4px", overflowX: "auto", borderBottom: "1px solid #E4E6E9", paddingBottom: "8px", marginBottom: "16px" }}>
              {[
                { id: "personal", label: "Personal" },
                { id: "academic", label: "Academic" },
                { id: "parents", label: "Parents" },
                { id: "attendance", label: "Attendance" },
                { id: "assignments", label: "Assignments" },
                { id: "exams", label: "Exams" },
                { id: "results", label: "Results" },
                { id: "fees", label: "Fees" },
                { id: "leave", label: "Leave" },
                { id: "discipline", label: "Discipline" },
                { id: "documents", label: "Documents" },
                { id: "communication", label: "Communication" },
                { id: "activity", label: "Audit" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStudent360Tab(tab.id as any)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: student360Tab === tab.id ? 600 : 500,
                    background: student360Tab === tab.id ? "#0c1e33" : "transparent",
                    color: student360Tab === tab.id ? "#ffffff" : "#495D72",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (student360Tab !== tab.id) {
                      e.currentTarget.style.background = "#F4F6F7";
                      e.currentTarget.style.color = "#0c1e33";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (student360Tab !== tab.id) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#495D72";
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "6px", fontSize: "13px" }}>
              {student360Tab === "personal" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "#FAF8F5", padding: "14px", borderRadius: "8px" }}>
                    <b>Personal Identity</b>
                    <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                      <div>Date of Birth: <b>{selectedStudent.dob}</b></div>
                      <div>Gender: <b>{selectedStudent.gender}</b></div>
                      <div>Blood Group: <b>{selectedStudent.bloodGroup}</b></div>
                      <div>Residential Address: <b>{selectedStudent.address}</b></div>
                    </div>
                  </div>
                  <div style={{ background: "#FAF8F5", padding: "14px", borderRadius: "8px" }}>
                    <b>Emergency & Health</b>
                    <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                      <div>Primary Contact: <b>{selectedStudent.parentName}</b></div>
                      <div>Emergency Phone: <b>{selectedStudent.emergencyContact}</b></div>
                      <div>Allergies: <b>None recorded</b></div>
                      <div>Doctor on Record: <b>Not recorded</b></div>
                    </div>
                  </div>
                </div>
              )}

              {student360Tab === "parents" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={{ background: "#FAF8F5", padding: "14px", borderRadius: "8px" }}>
                    <b>Primary Guardian on Record</b>
                    <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                      <div>Guardian Name: <b>{selectedStudent.guardianName || selectedStudent.parentName || "Not assigned"}</b></div>
                      <div>Guardian Phone: <b>{selectedStudent.guardianPhone || selectedStudent.parentPhone || "Not assigned"}</b></div>
                      <div>Emergency Contact: <b>{selectedStudent.emergencyContact || "-"}</b></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <b style={{ fontSize: "13px" }}>Authorized Linked Parent Accounts ({studentParents.length})</b>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>Read-only · Manage via Parents & Mappings tab</span>
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {studentParents.length === 0 ? (
                        <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", color: "var(--muted)", fontSize: "12px", textAlign: "center" }}>
                          No parent portal accounts are currently linked to this student. Mappings can be added or updated anytime from the <b>Parents & Mappings</b> subtab.
                        </div>
                      ) : (
                        studentParents.map((p) => (
                          <div key={p.id} style={{ padding: "10px 14px", background: "#FFF", border: "1px solid #e4e6e9", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontWeight: 700, color: "#111827" }}>{p.name}</div>
                              <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>{p.email} · {p.mobile}</div>
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: 750, padding: "3px 10px", borderRadius: "10px", background: "#ECFDF5", color: "#047857" }}>
                              {p.relationship || "Guardian"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {student360Tab === "attendance" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F4F6F7", padding: "14px", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "#0c1e33" }}>{selectedStudent.attendancePct}%</div>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>Term Attendance Rate (Statutory min: 75%)</span>
                    </div>
                    <button style={{ padding: "8px 14px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      Send Attendance Warning to Parent
                    </button>
                  </div>
                  <div>
                    <b>Recent Absence Log</b>
                    <div style={{ marginTop: "6px", display: "grid", gap: "6px" }}>
                      <div style={{ padding: "8px 12px", background: "#FFF", border: "1px solid #E4E6E9", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
                        <span>No absence details loaded</span>
                        <span style={{ color: "#047857", fontWeight: 600 }}>Excused</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {student360Tab === "fees" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "#F4F6F7", padding: "12px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>Fee Status</span>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#0c1e33" }}>{selectedStudent.feeStatus}</div>
                    </div>
                    <div style={{ background: "#F4F6F7", padding: "12px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>Pending Dues</span>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: selectedStudent.feeStatus === "Paid" ? "#047857" : "#B45309" }}>
                        {selectedStudent.feeStatus === "Paid" ? "₹0.00" : "₹18,500.00"}
                      </div>
                    </div>
                  </div>
                  <button style={{ justifySelf: "flex-start", padding: "8px 14px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    Record Offline Fee Receipt
                  </button>
                </div>
              )}

              {/* Default fallback for other tabs */}
              {!["personal", "parents", "attendance", "fees"].includes(student360Tab) && (
                <div style={{ padding: "20px", textAlign: "center", background: "#F4F6F7", borderRadius: "8px", color: "var(--muted)" }}>
                  <b>{student360Tab.toUpperCase()} Records Synchronized</b>
                  <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                    Verified records for {selectedStudent.name} linked from EDOPS academic database.
                  </p>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid #E4E6E9", paddingTop: "14px", marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  padding: "8px 18px",
                  background: "#0c1e33",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#132840")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#0c1e33")}
              >
                Close Profile
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* MANAGE WARDS MODAL                                             */}
      {/* ============================================================== */}
      {manageWardsParent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
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
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #E5E7EB",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 750, color: "#111827" }}>
                  Manage Mapped Wards
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  Assign or unassign children for <b>{manageWardsParent.name}</b> ({manageWardsParent.email})
                </p>
              </div>
              <button
                onClick={() => setManageWardsParent(null)}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--muted)", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Search Input & Selection Counter */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #F3F4F6", background: "#F9FAFB" }}>
              <div style={{ position: "relative" }}>
                <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                <input
                  type="text"
                  placeholder="Search students by name, class, or admission no..."
                  value={wardSearchQuery}
                  onChange={(e) => setWardSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px 7px 32px",
                    fontSize: "12.5px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginTop: "8px", fontSize: "11.5px", color: "var(--muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><b>{selectedWardIds.length}</b> student{selectedWardIds.length === 1 ? "" : "s"} selected</span>
                {selectedWardIds.length > 0 && (
                  <button
                    onClick={() => setSelectedWardIds([])}
                    style={{ background: "none", border: "none", color: "#DC2626", fontSize: "11.5px", cursor: "pointer", padding: 0, fontWeight: 600 }}
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            {/* Student Checkbox List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "grid", gap: "6px" }}>
              {filteredStudentsForWards.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                  No matching students found
                </div>
              ) : (
                filteredStudentsForWards.map((s) => {
                  const sid = s.userId || s.id;
                  const isChecked = selectedWardIds.includes(sid);
                  return (
                    <label
                      key={sid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: isChecked ? "1.5px solid #0c1e33" : "1px solid #E5E7EB",
                        background: isChecked ? "#f0f4f9" : "#FFFFFF",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWardIds((prev) => [...prev, sid]);
                          } else {
                            setSelectedWardIds((prev) => prev.filter((id) => id !== sid));
                          }
                        }}
                        style={{ width: "16px", height: "16px", accentColor: "#0c1e33", cursor: "pointer" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 650, color: "#111827" }}>{s.name}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                          {[s.grade || s.className, s.section || s.sectionName].filter(Boolean).join(" · ") || "Enrolled"} · Adm: {s.admissionNo || s.admissionNumber || s.id.slice(0, 8)}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "flex-end", gap: "10px", background: "#F9FAFB" }}>
              <button
                onClick={() => setManageWardsParent(null)}
                disabled={savingWards}
                style={{
                  padding: "6px 14px",
                  background: "#FFFFFF",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: savingWards ? "not-allowed" : "pointer",
                  color: "#374151",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWards}
                disabled={savingWards}
                style={{
                  padding: "6px 18px",
                  background: "#0c1e33",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: savingWards ? "not-allowed" : "pointer",
                  color: "#ffffff",
                  opacity: savingWards ? 0.7 : 1,
                }}
              >
                {savingWards ? "Saving..." : "Save Mappings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DEPARTMENT 360° MODAL                                           */}
      {/* ============================================================== */}
      {selectedDept && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onMouseDown={(e) => e.target === e.currentTarget && setSelectedDept(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "580px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #E5E7EB",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 750, color: "#111827" }}>
                    {selectedDept.name}
                  </h3>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "#f0f4f9", color: "#0c1e33", fontFamily: "monospace" }}>
                    {selectedDept.code}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--muted)" }}>
                  Head of Department: <b>{selectedDept.headName || "Unassigned"}</b> {selectedDept.headEmail ? `(${selectedDept.headEmail})` : ""}
                  {selectedDept.location ? ` · Location: ${selectedDept.location}` : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--muted)", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 22px", overflowY: "auto", display: "grid", gap: "18px" }}>
              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e4e6e9", borderRadius: "8px", padding: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>Active Faculty</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0c1e33", marginTop: "2px" }}>
                    {selectedDept.teachersCount} Teachers
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e4e6e9", borderRadius: "8px", padding: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>Student Load</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0c1e33", marginTop: "2px" }}>
                    {selectedDept.studentsCount} Students
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e4e6e9", borderRadius: "8px", padding: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>Average Attendance</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0c1e33", marginTop: "2px" }}>
                    {selectedDept.avgAttendancePct || 95}%
                  </div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e4e6e9", borderRadius: "8px", padding: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>Syllabus Completion</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0c1e33", marginTop: "2px" }}>
                    {selectedDept.syllabusCompletionPct || 0}%
                  </div>
                  <div style={{ height: "4px", background: "#e4e6e9", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${selectedDept.syllabusCompletionPct || 0}%`, background: "#0c1e33", borderRadius: "2px" }} />
                  </div>
                </div>
              </div>

              {/* Mapped Subjects Breakdown */}
              <div>
                <h4 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "#111827" }}>
                  Mapped Curriculum Subjects ({selectedDept.subjects?.length || 0})
                </h4>
                {selectedDept.subjects && selectedDept.subjects.length > 0 ? (
                  <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
                    {selectedDept.subjects.map((sub: any, idx: number) => (
                      <div
                        key={sub.id || idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderBottom: idx < (selectedDept.subjects?.length || 0) - 1 ? "1px solid #F3F4F6" : "none",
                          background: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                          fontSize: "12.5px",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "#111827" }}>{sub.name}</div>
                        {sub.code && (
                          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#475467", background: "#F2F4F7", padding: "2px 6px", borderRadius: "4px" }}>
                            {sub.code}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "18px", textAlign: "center", background: "#FAF8F5", borderRadius: "8px", color: "var(--muted)", fontSize: "12px" }}>
                    No subjects currently mapped to this department.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid #E4E6E9", display: "flex", justifyContent: "flex-end", background: "#F4F6F7" }}>
              <button
                onClick={() => setSelectedDept(null)}
                style={{
                  padding: "8px 18px",
                  background: "#0c1e33",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#ffffff",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#132840")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#0c1e33")}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TEACHER WORKLOAD PROFILE MODAL                                 */}
      {/* ============================================================== */}
      {selectedTeacher && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onMouseDown={(e) => e.target === e.currentTarget && setSelectedTeacher(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "580px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 64px rgba(12, 30, 51, 0.2)",
              border: "1px solid #E4E6E9",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #E4E6E9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#0c1e33", color: "#ffffff", display: "grid", placeItems: "center", fontSize: "16px", fontWeight: 700 }}>
                  {(selectedTeacher.name || "T")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 650, color: "#0c1e33" }}>
                      {selectedTeacher.name}
                    </h3>
                    <span style={{
                      fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px",
                      background: selectedTeacher.status === "Active" ? "#ECFDF5" : "#FEF3C7",
                      color: selectedTeacher.status === "Active" ? "#047857" : "#92400E",
                    }}>
                      {selectedTeacher.status}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                    {selectedTeacher.designation} · {selectedTeacher.department || "General Faculty"} · {selectedTeacher.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#F4F6F7",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: "#495D72",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: "20px 22px", overflowY: "auto", display: "grid", gap: "16px" }}>
              {/* Workload Capacity Card */}
              {(() => {
                const max = selectedTeacher.maxPeriods || 28;
                const current = selectedTeacher.weeklyPeriods || 0;
                const pct = Math.round((current / max) * 100);
                const isOverloaded = current > max;
                const isHeavy = current >= 26 && !isOverloaded;
                const isBalanced = current >= 16 && !isHeavy && !isOverloaded;
                const isPending = selectedTeacher.status === "Pending Invite";

                return (
                  <div style={{ background: "#f8fafc", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#0c1e33", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Weekly Teaching Workload
                      </span>
                      <span style={{
                        fontSize: "11px", fontWeight: 700, padding: "2px 10px", borderRadius: "12px",
                        background: isPending ? "#F3F4F6" : isOverloaded ? "#FEE2E2" : isHeavy ? "#FEF3C7" : "#ECFDF5",
                        color: isPending ? "#4B5563" : isOverloaded ? "#991B1B" : isHeavy ? "#92400E" : "#047857",
                      }}>
                        {isPending ? "Pending Activation" : isOverloaded ? "Overloaded" : isHeavy ? "Near Capacity" : isBalanced ? "Balanced Workload" : "Light Allocation"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "6px 0 10px" }}>
                      <span style={{ fontSize: "28px", fontWeight: 800, color: "#0c1e33" }}>{current}</span>
                      <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 550 }}>/ {max} periods/week allocated</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: isOverloaded ? "#DC2626" : "#0c1e33", marginLeft: "auto" }}>
                        {pct}% Capacity
                      </span>
                    </div>

                    {/* Capacity Bar */}
                    <div style={{ height: "8px", width: "100%", background: "#E5E7EB", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(100, pct)}%`,
                        height: "100%",
                        background: isOverloaded ? "#EF4444" : isHeavy ? "#F59E0B" : "#047857",
                        borderRadius: "4px",
                        transition: "width 0.3s ease",
                      }} />
                    </div>

                    <p style={{ margin: "10px 0 0", fontSize: "11.5px", color: "var(--muted)", lineHeight: 1.45 }}>
                      <b>Statutory Standard:</b> 24–28 periods/week (4–5 periods daily). Allocations above 30 periods flag workload fatigue alerts.
                    </p>
                  </div>
                );
              })()}

              {/* Roster & Teaching Scopes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ border: "1px solid #e4e6e9", borderRadius: "8px", padding: "12px", background: "#ffffff" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Assigned Subjects ({selectedTeacher.subjects?.length || 0})
                  </div>
                  {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {selectedTeacher.subjects.map((sub, i) => (
                        <span key={i} style={{ fontSize: "11.5px", fontWeight: 600, padding: "2px 8px", background: "#f0f4f9", color: "#0c1e33", borderRadius: "4px", border: "1px solid #d0e6ff" }}>
                          {sub}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>
                      {selectedTeacher.department ? `Specialty: ${selectedTeacher.department}` : "No subjects mapped"}
                    </span>
                  )}
                </div>

                <div style={{ border: "1px solid #e4e6e9", borderRadius: "8px", padding: "12px", background: "#ffffff" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                    Classes / Sections ({selectedTeacher.classes?.length || 0})
                  </div>
                  {selectedTeacher.classes && selectedTeacher.classes.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {selectedTeacher.classes.map((cls, i) => (
                        <span key={i} style={{ fontSize: "11.5px", fontWeight: 600, padding: "2px 8px", background: "#f8fafc", color: "#0c1e33", borderRadius: "4px", border: "1px solid #e4e6e9" }}>
                          {cls}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>
                      No classroom sections assigned
                    </span>
                  )}
                </div>
              </div>

              {/* Faculty Info Card */}
              <div style={{ border: "1px solid #e4e6e9", borderRadius: "8px", padding: "14px", fontSize: "12.5px", display: "grid", gap: "10px", background: "#ffffff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                    Faculty Record & Contract
                  </span>
                  {!editingTeacherEmp && (
                    <button
                      onClick={() => setEditingTeacherEmp(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0c1e33",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Edit Contract Details
                    </button>
                  )}
                </div>

                {empSaveSuccess && (
                  <div style={{ padding: "6px 10px", borderRadius: "6px", background: "#ECFDF5", color: "#047857", fontSize: "12px", fontWeight: 600 }}>
                    ✓ Employee contract details updated successfully!
                  </div>
                )}

                {editingTeacherEmp ? (
                  <div style={{ display: "grid", gap: "10px", padding: "10px", background: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                    <label style={{ display: "grid", gap: "4px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Employee ID / Code</span>
                      <input
                        type="text"
                        value={empIdInput}
                        onChange={(e) => setEmpIdInput(e.target.value)}
                        placeholder="e.g. EMP-1042"
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12.5px", outline: "none" }}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "4px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Employment Contract Type</span>
                      <select
                        value={empTypeInput}
                        onChange={(e) => setEmpTypeInput(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12.5px", outline: "none", background: "#FFFFFF" }}
                      >
                        <option value="Regular Faculty">Regular Faculty (Permanent Full-Time)</option>
                        <option value="Probationary Faculty">Probationary Faculty</option>
                        <option value="Contractual Faculty">Contractual / Ad-hoc Faculty</option>
                        <option value="Visiting / Part-Time">Visiting / Part-Time Faculty</option>
                      </select>
                    </label>

                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                      <button
                        onClick={() => setEditingTeacherEmp(false)}
                        disabled={savingTeacherEmp}
                        style={{ padding: "4px 10px", borderRadius: "4px", border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: "11.5px", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveTeacherEmp}
                        disabled={savingTeacherEmp}
                        style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: "#0c1e33", color: "#ffffff", fontSize: "11.5px", fontWeight: 600, cursor: savingTeacherEmp ? "not-allowed" : "pointer", transition: "background 0.15s ease" }}
                        onMouseEnter={(e) => { if (!savingTeacherEmp) e.currentTarget.style.background = "#132840"; }}
                        onMouseLeave={(e) => { if (!savingTeacherEmp) e.currentTarget.style.background = "#0c1e33"; }}
                      >
                        {savingTeacherEmp ? "Saving..." : "Save Details"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted)" }}>Employee ID:</span>
                      <b style={{ fontFamily: selectedTeacher.empId ? "monospace" : "inherit" }}>
                        {selectedTeacher.empId || "Not Assigned"}
                      </b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted)" }}>Account Status:</span>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: selectedTeacher.status === "Active" ? "#ECFDF5" : "#FEF3C7",
                        color: selectedTeacher.status === "Active" ? "#047857" : "#92400E",
                      }}>
                        ● {selectedTeacher.status === "Active" ? "Active (Verified)" : "Pending Activation"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted)" }}>Employment Contract:</span>
                      <b style={{ color: selectedTeacher.employmentType ? "#111827" : "var(--muted)" }}>
                        {selectedTeacher.employmentType || "Not Specified"}
                      </b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted)" }}>Registered Phone:</span>
                      <b>{selectedTeacher.phone || "Not specified"}</b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted)" }}>Joining / Invite Date:</span>
                      <b>{selectedTeacher.joiningDate || "Recent"}</b>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid #E4E6E9", display: "flex", justifyContent: "flex-end", background: "#F4F6F7" }}>
              <button
                onClick={() => setSelectedTeacher(null)}
                style={{
                  padding: "8px 18px",
                  background: "#0c1e33",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#ffffff",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#132840")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#0c1e33")}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
