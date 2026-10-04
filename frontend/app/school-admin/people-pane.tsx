"use client";

import React, { useState } from "react";
import {
  StudentRecord,
  TeacherRecord,
  StaffRecord,
  ParentRecord,
  DepartmentRecord,
} from "./types";
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
  initialSubtab = "students",
  onOpenQuickAction,
}: {
  initialSubtab?: "students" | "teachers" | "staff" | "parents" | "departments";
  onOpenQuickAction: (action: string) => void;
}) {
  const [subtab, setSubtab] = useState<"students" | "teachers" | "staff" | "parents" | "departments">(initialSubtab);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Student for 360° Profile Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [student360Tab, setStudent360Tab] = useState<
    "personal" | "academic" | "parents" | "attendance" | "assignments" | "exams" | "results" | "fees" | "leave" | "discipline" | "documents" | "communication" | "activity"
  >("personal");

  // Selected Teacher for Workload Modal
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRecord | null>(null);

  // Selected Department for Department 360° Dashboard
  const [selectedDept, setSelectedDept] = useState<DepartmentRecord | null>(null);

  // Mock initial dataset
  const [students, setStudents] = useState<StudentRecord[]>([
    {
      id: "std-1",
      admissionNo: "ED-2024-001",
      name: "Aarav Sharma",
      rollNo: "01",
      grade: "Grade 10",
      section: "10-A",
      gender: "Male",
      house: "Tagore",
      parentName: "Rajesh Sharma",
      parentPhone: "+91 98765 43210",
      attendancePct: 96,
      feeStatus: "Paid",
      academicStatus: "Honor Roll",
      status: "Active",
      bloodGroup: "O+",
      dob: "2010-05-14",
      address: "B-42, Vasant Vihar, New Delhi",
      emergencyContact: "+91 98765 43210",
    },
    {
      id: "std-2",
      admissionNo: "ED-2024-042",
      name: "Ananya Iyer",
      rollNo: "14",
      grade: "Grade 10",
      section: "10-A",
      gender: "Female",
      house: "Raman",
      parentName: "Venkat Iyer",
      parentPhone: "+91 98112 34567",
      attendancePct: 71,
      feeStatus: "Overdue",
      academicStatus: "Needs Attention",
      status: "Active",
      bloodGroup: "B+",
      dob: "2010-09-21",
      address: "12/A, Defence Colony, New Delhi",
      emergencyContact: "+91 98112 34567",
    },
    {
      id: "std-3",
      admissionNo: "ED-2024-089",
      name: "Rohan Verma",
      rollNo: "28",
      grade: "Grade 9",
      section: "9-B",
      gender: "Male",
      house: "Shivaji",
      parentName: "Sunil Verma",
      parentPhone: "+91 97123 98765",
      attendancePct: 88,
      feeStatus: "Pending",
      academicStatus: "Good Standing",
      status: "Active",
      bloodGroup: "A+",
      dob: "2011-02-11",
      address: "Pocket 4, Mayur Vihar, New Delhi",
      emergencyContact: "+91 97123 98765",
    },
    {
      id: "std-4",
      admissionNo: "ED-2023-112",
      name: "Diya Patel",
      rollNo: "09",
      grade: "Grade 11",
      section: "11-A (Science)",
      gender: "Female",
      house: "Ashoka",
      parentName: "Ketan Patel",
      parentPhone: "+91 99001 23456",
      attendancePct: 98,
      feeStatus: "Paid",
      academicStatus: "Honor Roll",
      status: "Active",
      bloodGroup: "AB+",
      dob: "2009-11-30",
      address: "C-101, Greater Kailash 1, New Delhi",
      emergencyContact: "+91 99001 23456",
    },
  ]);

  const [teachers, setTeachers] = useState<TeacherRecord[]>([
    {
      id: "tch-1",
      empId: "EMP-T-01",
      name: "Rahul Sharma",
      email: "rahul.sharma@edops.school",
      phone: "+91 98234 56789",
      department: "Mathematics",
      designation: "Head of Department & PGT",
      subjects: ["Mathematics", "Applied Math"],
      classes: ["10-A", "10-B", "9-A", "12-A"],
      joiningDate: "2021-06-15",
      employmentType: "Full Time",
      weeklyPeriods: 28,
      maxPeriods: 30,
      status: "Active",
    },
    {
      id: "tch-2",
      empId: "EMP-T-08",
      name: "Sunita Rao",
      email: "sunita.rao@edops.school",
      phone: "+91 98456 12345",
      department: "Science",
      designation: "Senior PGT Physics",
      subjects: ["Physics", "General Science"],
      classes: ["11-A", "11-B", "12-A"],
      joiningDate: "2020-04-10",
      employmentType: "Full Time",
      weeklyPeriods: 31,
      maxPeriods: 30,
      status: "Active",
    },
    {
      id: "tch-3",
      empId: "EMP-T-14",
      name: "Pooja Malhotra",
      email: "pooja.m@edops.school",
      phone: "+91 98711 22334",
      department: "English",
      designation: "TGT English",
      subjects: ["English Literature", "Grammar"],
      classes: ["8-A", "8-B", "9-A"],
      joiningDate: "2022-07-01",
      employmentType: "Full Time",
      weeklyPeriods: 22,
      maxPeriods: 30,
      status: "Active",
    },
  ]);

  const [staff, setStaff] = useState<StaffRecord[]>([
    { id: "stf-1", empId: "EMP-S-01", name: "Sunita Roy", email: "accounts@edops.school", phone: "+91 98111 22334", department: "Finance", designation: "Chief Accountant", employmentType: "Full Time", joiningDate: "2019-03-01", status: "Active" },
    { id: "stf-2", empId: "EMP-S-04", name: "Ramesh Chand", email: "transport@edops.school", phone: "+91 98222 33445", department: "Transport", designation: "Transport Manager", employmentType: "Full Time", joiningDate: "2020-08-15", status: "Active" },
    { id: "stf-3", empId: "EMP-S-09", name: "Deepa Narang", email: "infirmary@edops.school", phone: "+91 98333 44556", department: "Medical", designation: "Campus Nurse", employmentType: "Full Time", joiningDate: "2021-01-10", status: "Active" },
    { id: "stf-4", empId: "EMP-S-12", name: "Vikram Negi", email: "it@edops.school", phone: "+91 98444 55667", department: "IT", designation: "Systems Administrator", employmentType: "Full Time", joiningDate: "2022-02-01", status: "Active" },
  ]);

  const [parents, setParents] = useState<ParentRecord[]>([
    {
      id: "par-1",
      name: "Rajesh Sharma",
      email: "rajesh.sharma@example.com",
      mobile: "+91 98765 43210",
      relationship: "Father",
      occupation: "Chartered Accountant",
      address: "B-42, Vasant Vihar, New Delhi",
      emergencyContact: "+91 98765 43211",
      accountStatus: "Active",
      invitationStatus: "Accepted",
      children: [
        { studentId: "std-1", studentName: "Aarav Sharma", grade: "Grade 10", section: "10-A" },
        { studentId: "std-x", studentName: "Ananya Sharma", grade: "Grade 5", section: "5-B" },
      ],
      permissions: { attendance: true, fees: true, exams: true, assignments: true, communication: true, transport: true },
    },
    {
      id: "par-2",
      name: "Venkat Iyer",
      email: "venkat.iyer@example.com",
      mobile: "+91 98112 34567",
      relationship: "Father",
      occupation: "Software Architect",
      address: "12/A, Defence Colony, New Delhi",
      emergencyContact: "+91 98112 34568",
      accountStatus: "Active",
      invitationStatus: "Accepted",
      children: [{ studentId: "std-2", studentName: "Ananya Iyer", grade: "Grade 10", section: "10-A" }],
      permissions: { attendance: true, fees: true, exams: true, assignments: true, communication: true, transport: true },
    },
  ]);

  const [departments, setDepartments] = useState<DepartmentRecord[]>([
    { id: "dept-1", name: "Mathematics", code: "MATH", headName: "Rahul Sharma", headEmail: "rahul.sharma@edops.school", teachersCount: 14, staffCount: 1, studentsCount: 420, classesCount: 12, avgAttendancePct: 95.2, syllabusCompletionPct: 78, status: "Active", location: "Academic Block B, Floor 2" },
    { id: "dept-2", name: "Science", code: "SCI", headName: "Sunita Rao", headEmail: "sunita.rao@edops.school", teachersCount: 18, staffCount: 4, studentsCount: 520, classesCount: 14, avgAttendancePct: 93.8, syllabusCompletionPct: 72, status: "Active", location: "Science Complex, Floor 1" },
    { id: "dept-3", name: "English & Languages", code: "LANG", headName: "Pooja Malhotra", headEmail: "pooja.m@edops.school", teachersCount: 16, staffCount: 1, studentsCount: 650, classesCount: 18, avgAttendancePct: 96.0, syllabusCompletionPct: 82, status: "Active", location: "Humanities Wing, Floor 1" },
    { id: "dept-4", name: "Computer Science & IT", code: "CS", headName: "Kunal Mehra", headEmail: "kunal.m@edops.school", teachersCount: 8, staffCount: 3, studentsCount: 340, classesCount: 10, avgAttendancePct: 97.4, syllabusCompletionPct: 85, status: "Active", location: "IT Tower, Lab 1 & 2" },
  ]);

  const filteredStudents = students.filter((s) => {
    if (gradeFilter !== "all" && !s.grade.toLowerCase().includes(gradeFilter.toLowerCase())) return false;
    if (statusFilter !== "all" && s.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2DDD5", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "students", label: "Students (1,420)", icon: GraduationCap },
            { id: "teachers", label: "Teachers & Workload (92)", icon: Users },
            { id: "staff", label: "Staff Intelligence (38)", icon: Briefcase },
            { id: "parents", label: "Parents & Mappings (1,840)", icon: HeartHandshake },
            { id: "departments", label: "Departments (8)", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subtab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubtab(tab.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: active ? 750 : 600,
                  background: active ? "#064E3B" : "transparent",
                  color: active ? "#F8E7C9" : "#064E3B",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

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
            background: "#064E3B",
            color: "#F8E7C9",
            border: "none",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={15} />
          {subtab === "students" ? "Add Student" : subtab === "teachers" ? "Add Teacher" : subtab === "staff" ? "Add Staff" : subtab === "parents" ? "Map Parent" : "New Department"}
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. STUDENTS TAB (§13, §14: Roster & Student 360° Profile)       */}
      {/* ============================================================== */}
      {subtab === "students" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
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
                  style={{ width: "100%", padding: "7px 10px 7px 32px", borderRadius: "6px", border: "1px solid #E2DDD5", fontSize: "13px" }}
                />
              </div>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #E2DDD5", fontSize: "12.5px", background: "#FFFFFF" }}
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
                <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Admission No</th>
                  <th style={{ padding: "10px" }}>Student Name</th>
                  <th style={{ padding: "10px" }}>Class / Roll</th>
                  <th style={{ padding: "10px" }}>Parent / Contact</th>
                  <th style={{ padding: "10px" }}>Attendance</th>
                  <th style={{ padding: "10px" }}>Fee Status</th>
                  <th style={{ padding: "10px" }}>Academic Status</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>360° Profile</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <b>{s.admissionNo}</b>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>House: {s.house}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#FDF9F0", display: "grid", placeItems: "center", fontWeight: 700, color: "#064E3B", border: "1px solid #E5CCA2" }}>
                          {s.name[0]}
                        </div>
                        <div>
                          <b>{s.name}</b>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>{s.gender} · Blood {s.bloodGroup}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <b>{s.section}</b>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>Roll #{s.rollNo}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <div>{s.parentName}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{s.parentPhone}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ fontWeight: 700, color: s.attendancePct < 75 ? "#B45309" : "#064E3B" }}>
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
                        color: s.feeStatus === "Paid" ? "#064E3B" : s.feeStatus === "Pending" ? "#92400E" : "#991B1B",
                      }}>
                        {s.feeStatus}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#064E3B" }}>{s.academicStatus}</span>
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedStudent(s)}
                        style={{
                          padding: "5px 10px",
                          background: "#064E3B",
                          color: "#F8E7C9",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Eye size={13} /> Open 360°
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TEACHERS & WORKLOAD TAB (§15, §16: Periods 28/30 Calculator) */}
      {/* ============================================================== */}
      {subtab === "teachers" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Workload Intelligence Alert Card */}
          <div style={{ background: "#FDF9F0", border: "1px solid #E5CCA2", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <b style={{ color: "#064E3B", fontSize: "14px" }}>Automated Faculty Workload Calculation Active</b>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                State private school standard: 24–28 periods/week (Balanced). Overload flagged automatically when exceeding 30 periods.
              </p>
            </div>
            <span style={{ background: "#064E3B", color: "#F8E7C9", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
              92 / 92 Calculated
            </span>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
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
                {teachers.map((t) => {
                  const workloadPct = Math.round((t.weeklyPeriods / t.maxPeriods) * 100);
                  const isOverloaded = t.weeklyPeriods > t.maxPeriods;
                  const isHeavy = t.weeklyPeriods >= 27 && !isOverloaded;
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                      <td style={{ padding: "12px 10px" }}>
                        <b>{t.name}</b>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{t.empId} · {t.employmentType}</div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontWeight: 650, color: "#064E3B" }}>{t.department}</span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>{t.designation}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ fontSize: "12px" }}>{t.subjects.join(", ")}</span>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {t.classes.map((c) => (
                            <span key={c} style={{ background: "#FAF8F5", border: "1px solid #E2DDD5", padding: "1px 6px", borderRadius: "4px", fontSize: "11px" }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <b>{t.weeklyPeriods} / {t.maxPeriods}</b>
                          <span style={{
                            fontSize: "10.5px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px",
                            background: isOverloaded ? "#FEE2E2" : isHeavy ? "#FEF3C7" : "#ECFDF5",
                            color: isOverloaded ? "#991B1B" : isHeavy ? "#92400E" : "#064E3B",
                          }}>
                            {isOverloaded ? "Overloaded" : isHeavy ? "Heavy" : "Balanced"}
                          </span>
                        </div>
                        <div style={{ height: "4px", width: "100px", background: "#E2DDD5", borderRadius: "2px", marginTop: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, workloadPct)}%`, height: "100%", background: isOverloaded ? "#EF4444" : "#064E3B" }} />
                        </div>
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{ color: "#064E3B", fontWeight: 700 }}>{t.status}</span>
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedTeacher(t)}
                          style={{ padding: "4px 8px", background: "#FDF9F0", border: "1px solid #E5CCA2", color: "#064E3B", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                        >
                          Workload Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. STAFF INTELLIGENCE TAB (§8, §17: Non-Teaching Staff Roster)   */}
      {/* ============================================================== */}
      {subtab === "staff" && (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Department Breakdown Mini-Pills */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            {[
              { dept: "Finance & Accounts", count: 6, roles: "Accountants, Cashiers" },
              { dept: "Administration", count: 8, roles: "Office Staff, Registrar" },
              { dept: "Transport Fleet", count: 12, roles: "Drivers, Conductors, Route Mgr" },
              { dept: "Campus Medical", count: 3, roles: "Nurse, Medical Attendant" },
            ].map((d, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "8px", padding: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 650 }}>{d.dept}</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#064E3B", margin: "4px 0" }}>{d.count} Staff</div>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>{d.roles}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Emp ID & Name</th>
                  <th style={{ padding: "10px" }}>Department</th>
                  <th style={{ padding: "10px" }}>Designation</th>
                  <th style={{ padding: "10px" }}>Phone / Email</th>
                  <th style={{ padding: "10px" }}>Employment Type</th>
                  <th style={{ padding: "10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <b>{s.name}</b>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{s.empId}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ fontWeight: 650, color: "#064E3B" }}>{s.department}</span>
                    </td>
                    <td style={{ padding: "12px 10px" }}>{s.designation}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <div>{s.phone}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{s.email}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>{s.employmentType}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ color: "#064E3B", fontWeight: 700 }}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. PARENTS & M:N MAPPING TAB (§18 - §21: Children Switcher)      */}
      {/* ============================================================== */}
      {subtab === "parents" && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={{ background: "#FDF9F0", border: "1px solid #E5CCA2", borderRadius: "10px", padding: "16px" }}>
            <b style={{ color: "#064E3B", fontSize: "14px" }}>Many-to-Many Authorized Guardian Mapping Enabled (§19)</b>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "var(--muted)" }}>
              A parent can have multiple enrolled children across grades. Passwords are never exposed; parents activate via secure encrypted single-use tokens.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
                  <th style={{ padding: "10px" }}>Parent Name</th>
                  <th style={{ padding: "10px" }}>Contact</th>
                  <th style={{ padding: "10px" }}>Relationship</th>
                  <th style={{ padding: "10px" }}>Mapped Children</th>
                  <th style={{ padding: "10px" }}>Invitation Status</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <b>{p.name}</b>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{p.occupation}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <div>{p.mobile}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{p.email}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>{p.relationship}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <div style={{ display: "grid", gap: "4px" }}>
                        {p.children.map((ch, idx) => (
                          <span key={idx} style={{ background: "#FAF8F5", border: "1px solid #E2DDD5", padding: "2px 8px", borderRadius: "6px", fontSize: "11.5px" }}>
                            <b>{ch.studentName}</b> ({ch.grade} · {ch.section})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                        background: p.invitationStatus === "Accepted" ? "#ECFDF5" : "#FEF3C7",
                        color: p.invitationStatus === "Accepted" ? "#064E3B" : "#92400E",
                      }}>
                        {p.invitationStatus}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}>
                      <button
                        onClick={() => alert(`Resending invite link to ${p.email}`)}
                        style={{ padding: "4px 8px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Resend Invite
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. DEPARTMENTS TAB (§9 - §11: Department 360° Management)       */}
      {/* ============================================================== */}
      {subtab === "departments" && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {departments.map((d) => (
              <div
                key={d.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2DDD5",
                  borderRadius: "10px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>{d.name}</h4>
                      <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 650 }}>Code: {d.code}</span>
                    </div>
                    <span style={{ background: "#ECFDF5", color: "#064E3B", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>
                      {d.status}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 12px", fontSize: "12px", color: "var(--muted)" }}>Head: <b>{d.headName}</b> ({d.headEmail})</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#FAF8F5", padding: "10px", borderRadius: "6px", fontSize: "12px", marginBottom: "14px" }}>
                    <div>Faculty: <b>{d.teachersCount}</b></div>
                    <div>Students: <b>{d.studentsCount}</b></div>
                    <div>Attendance: <b>{d.avgAttendancePct}%</b></div>
                    <div>Syllabus: <b>{d.syllabusCompletionPct}%</b></div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2DDD5", paddingTop: "10px" }}>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>{d.location}</span>
                  <button
                    onClick={() => setSelectedDept(d)}
                    style={{ padding: "4px 10px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                  >
                    View Dept 360°
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STUDENT 360° PROFILE MODAL (§14: 13 Individual Tabs)           */}
      {/* ============================================================== */}
      {selectedStudent && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelectedStudent(null)}>
          <section className="action-modal" role="dialog" aria-modal="true" style={{ maxWidth: "860px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2DDD5", paddingBottom: "14px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#064E3B", color: "#F8E7C9", display: "grid", placeItems: "center", fontSize: "18px", fontWeight: 800 }}>
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#064E3B" }}>{selectedStudent.name} (360° Profile)</h3>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Admission: {selectedStudent.admissionNo} · {selectedStudent.grade} ({selectedStudent.section}) · Roll #{selectedStudent.rollNo}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--muted)" }}>×</button>
            </div>

            {/* 13 Navigation Tabs */}
            <div style={{ display: "flex", gap: "4px", overflowX: "auto", borderBottom: "1px solid #E2DDD5", paddingBottom: "8px", marginBottom: "16px" }}>
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
                    padding: "5px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: student360Tab === tab.id ? 700 : 500,
                    background: student360Tab === tab.id ? "#064E3B" : "transparent",
                    color: student360Tab === tab.id ? "#F8E7C9" : "#064E3B",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
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
                      <div>Doctor on Record: <b>Dr. A. Sen (Apollo Clinic)</b></div>
                    </div>
                  </div>
                </div>
              )}

              {student360Tab === "attendance" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF8F5", padding: "14px", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#064E3B" }}>{selectedStudent.attendancePct}%</div>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>Term Attendance Rate (Statutory min: 75%)</span>
                    </div>
                    <button style={{ padding: "6px 12px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700 }}>
                      Send Attendance Warning to Parent
                    </button>
                  </div>
                  <div>
                    <b>Recent Absence Log</b>
                    <div style={{ marginTop: "6px", display: "grid", gap: "6px" }}>
                      <div style={{ padding: "8px 12px", background: "#FFF", border: "1px solid #E2DDD5", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
                        <span>Oct 02, 2026 · Absent (Sick Leave note verified by Class Teacher)</span>
                        <span style={{ color: "#064E3B", fontWeight: 700 }}>Excused</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {student360Tab === "fees" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "#FAF8F5", padding: "12px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>Fee Status</span>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: "#064E3B" }}>{selectedStudent.feeStatus}</div>
                    </div>
                    <div style={{ background: "#FAF8F5", padding: "12px", borderRadius: "8px" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>Pending Dues</span>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: selectedStudent.feeStatus === "Paid" ? "#064E3B" : "#B45309" }}>
                        {selectedStudent.feeStatus === "Paid" ? "₹0.00" : "₹18,500.00"}
                      </div>
                    </div>
                  </div>
                  <button style={{ justifySelf: "flex-start", padding: "6px 14px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                    Record Offline Fee Receipt
                  </button>
                </div>
              )}

              {/* Default fallback for other tabs */}
              {!["personal", "attendance", "fees"].includes(student360Tab) && (
                <div style={{ padding: "20px", textAlign: "center", background: "#FAF8F5", borderRadius: "8px", color: "var(--muted)" }}>
                  <b>{student360Tab.toUpperCase()} Records Synchronized</b>
                  <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                    Verified records for {selectedStudent.name} linked from EDOPS academic database.
                  </p>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid #E2DDD5", paddingTop: "12px", marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedStudent(null)} style={{ padding: "6px 16px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>
                Close Profile
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
