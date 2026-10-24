"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  getAvailableDepartmentSubjects,
  updateDepartmentSubjects,
  updateParentChildren,
  updateTeacherEmployment,
  getStudentAvatarUrl,
  sendStudentInvite,
  getSchoolAdminStudent360,
  getSchoolAdminAcademics,
} from "../edops-api";
import {
  Users,
  User,
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
  Shield,
  ArrowRight,
  Send,
  Copy,
  Plus,
  Clock,
  Bus,
  Info,
  ChevronDown,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* SKELETON LOADING AND EMPTY STATE COMPONENTS                                */
/* -------------------------------------------------------------------------- */

function NoResultState({
  title,
  description,
  onReset,
}: {
  title: string;
  description: string;
  onReset?: () => void;
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
      }}
    >
      <img
        src="/noresult.png"
        alt="No results found"
        style={{
          width: "140px",
          height: "auto",
          maxHeight: "120px",
          objectFit: "contain",
          marginBottom: "16px",
          opacity: 0.95,
        }}
      />
      <b
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          color: "#0C1E33",
          marginBottom: "6px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </b>
      <p
        style={{
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
          fontSize: "12px",
          color: "#64748B",
          maxWidth: "420px",
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          style={{
            marginTop: "16px",
            padding: "7px 18px",
            borderRadius: "6px",
            background: "#0C1E33",
            color: "#FFFFFF",
            border: "none",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0C1E33")}
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}

function StudentProfileEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "8px",
      }}
    >
      <img
        src="/bee.png"
        alt=""
        style={{
          width: "92px",
          height: "auto",
          maxHeight: "92px",
          objectFit: "contain",
          marginBottom: "14px",
          opacity: 0.95,
        }}
      />
      <b
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "14.5px",
          fontWeight: 700,
          color: "#0C1E33",
          marginBottom: "6px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </b>
      <p
        style={{
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
          fontSize: "12px",
          color: "#64748B",
          maxWidth: "380px",
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: "14px",
            padding: "6px 16px",
            borderRadius: "6px",
            background: "#0C1E33",
            color: "#FFFFFF",
            border: "none",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Poppins', sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0C1E33")}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function getStudentTabEmptyMeta(tab: string, studentName: string, admissionNo?: string) {
  switch (tab) {
    case "assignments":
      return {
        title: "No Assignments Found",
        description: `There are currently no homework or assignment submissions on file for ${studentName}.`,
      };
    case "exams":
      return {
        title: "No Scheduled Exams",
        description: `No upcoming or previous examination schedules recorded for ${studentName}.`,
      };
    case "results":
      return {
        title: "No Examination Results",
        description: `Academic evaluations and report cards have not been published for ${studentName} yet.`,
      };
    case "leave":
      return {
        title: "No Leave Requests",
        description: `No formal leave applications or excused absence records submitted for ${studentName}.`,
      };
    case "discipline":
      return {
        title: "No Disciplinary Incidents",
        description: `Student has a clean behavioral track record. No disciplinary infractions or incident logs recorded.`,
      };
    case "documents":
      return {
        title: "No Documents Uploaded",
        description: `No identity documents, medical forms, or statutory certificates attached to ${studentName}'s record.`,
      };
    case "communication":
      return {
        title: "No Communication Logs",
        description: `No direct messages, broadcast notices, or SMS dispatches logged for ${studentName}.`,
      };
    case "activity":
      return {
        title: "No Audit Logs",
        description: `No administrative audit events or profile modification history found for this record.`,
      };
    default:
      return {
        title: `No ${tab.charAt(0).toUpperCase() + tab.slice(1)} Records`,
        description: `No recorded ${tab} entries on file for ${studentName}${admissionNo ? ` (Admission #${admissionNo})` : ""}.`,
      };
  }
}

function TableSkeletonRows({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => {
        const isEven = rIdx % 2 === 0;
        return (
          <tr
            key={rIdx}
            style={{
              height: "52px",
              minHeight: "52px",
              background: isEven ? "#FFFFFF" : "#F8FAFC",
              borderBottom: "1px solid #E0E5EB",
              boxSizing: "border-box",
            }}
          >
            {/* Col 1: Avatar circle + 2 text shimmer bars */}
            <td style={{ padding: "0 16px", height: "52px", verticalAlign: "middle" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  className="edops-skeleton"
                  style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "120px" }}>
                  <div className="edops-skeleton" style={{ height: "12px", width: "85%" }} />
                  <div className="edops-skeleton" style={{ height: "9px", width: "60%" }} />
                </div>
              </div>
            </td>
            {/* Middle columns */}
            {Array.from({ length: columns - 2 }).map((_, cIdx) => (
              <td key={cIdx} style={{ padding: "0 14px", height: "52px", verticalAlign: "middle" }}>
                <div
                  className="edops-skeleton"
                  style={{
                    height: "12px",
                    width: cIdx % 2 === 0 ? "70px" : "105px",
                    maxWidth: "90%",
                  }}
                />
              </td>
            ))}
            {/* Last column: Action button */}
            <td style={{ padding: "0 16px", height: "52px", textAlign: "right", verticalAlign: "middle" }}>
              <div style={{ display: "inline-flex", justifyContent: "flex-end", width: "100%" }}>
                <div
                  className="edops-skeleton"
                  style={{ height: "26px", width: "58px", borderRadius: "6px" }}
                />
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

function StudentSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => {
        const isEven = rIdx % 2 === 0;
        return (
          <div
            key={rIdx}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0 8px",
              width: "100%",
              height: "52px",
              minHeight: "52px",
              background: isEven ? "#FFFFFF" : "#F8FAFC",
              borderBottom: "1px solid #E0E5EB",
            }}
          >
            <div style={{ flex: "2.5 1 220px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="edops-skeleton"
                style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "130px" }}>
                <div className="edops-skeleton" style={{ height: "12px", width: "85%" }} />
                <div className="edops-skeleton" style={{ height: "9px", width: "60%" }} />
              </div>
            </div>
            <div style={{ flex: "1.2 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "70px" }} />
            </div>
            <div style={{ flex: "1.3 1 130px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "80px" }} />
            </div>
            <div style={{ flex: "1.1 1 110px" }}>
              <div className="edops-skeleton" style={{ height: "18px", width: "60px", borderRadius: "10px" }} />
            </div>
            <div style={{ flex: "1.3 1 130px" }}>
              <div className="edops-skeleton" style={{ height: "18px", width: "70px", borderRadius: "10px" }} />
            </div>
            <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end" }}>
              <div className="edops-skeleton" style={{ height: "26px", width: "56px", borderRadius: "6px" }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

function TeacherSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => {
        const isEven = rIdx % 2 === 0;
        return (
          <div
            key={rIdx}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0 8px",
              width: "100%",
              height: "52px",
              minHeight: "52px",
              background: isEven ? "#FFFFFF" : "#F8FAFC",
              borderBottom: "1px solid #E0E5EB",
            }}
          >
            <div style={{ flex: "2.4 1 200px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="edops-skeleton"
                style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "130px" }}>
                <div className="edops-skeleton" style={{ height: "12px", width: "85%" }} />
                <div className="edops-skeleton" style={{ height: "9px", width: "60%" }} />
              </div>
            </div>
            <div style={{ flex: "1.3 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "75px" }} />
            </div>
            <div style={{ flex: "1.3 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "85px" }} />
            </div>
            <div style={{ flex: "1.3 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "85px" }} />
            </div>
            <div style={{ flex: "1.1 1 100px" }}>
              <div className="edops-skeleton" style={{ height: "20px", width: "65px", borderRadius: "4px" }} />
            </div>
            <div style={{ flex: "1.1 1 100px" }}>
              <div className="edops-skeleton" style={{ height: "20px", width: "60px", borderRadius: "10px" }} />
            </div>
            <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end" }}>
              <div className="edops-skeleton" style={{ height: "26px", width: "60px", borderRadius: "6px" }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

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
  const [isSwitching, setIsSwitching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleTabSwitch = (nextTab: "students" | "teachers" | "staff" | "parents" | "departments") => {
    if (nextTab === subtab) return;
    setIsSwitching(true);
    setSubtab(nextTab);
    if (onTabChange) onTabChange(nextTab);
    setTimeout(() => {
      setIsSwitching(false);
    }, 280);
  };

  const handleRefresh = async () => {
    if (!organizationId || refreshing) return;
    setRefreshing(true);
    try {
      if (subtab === "students") {
        const data = await getSchoolAdminStudents(organizationId);
        setStudents(data || []);
      } else if (subtab === "teachers") {
        const data = await getSchoolAdminTeachers(organizationId);
        setTeachers(data || []);
      } else if (subtab === "staff") {
        const data = await getSchoolAdminStaff(organizationId);
        setStaff(data || []);
      } else if (subtab === "parents") {
        const data = await getSchoolAdminParents(organizationId);
        setParents(data || []);
      } else if (subtab === "departments") {
        const data = await getSchoolAdminDepartments(organizationId);
        setDepartments(data || []);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 300);
    }
  };

  useEffect(() => {
    if (activeTab) setSubtab(activeTab);
  }, [activeTab]);

  const tabRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, ready: false });

  React.useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[subtab];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          ready: true,
        });
      }
    };
    updateIndicator();
    const timer = setTimeout(updateIndicator, 40);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [subtab]);



  // Filters (Students)
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeFilter, setFeeFilter] = useState("all");
  const [studentSegment, setStudentSegment] = useState<"all" | "ontrack" | "breach" | "pending_fee" | "paid_fee" | "active">("all");

  // Filters (Teachers & Workload)
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherDeptFilter, setTeacherDeptFilter] = useState("all");
  const [teacherWorkloadFilter, setTeacherWorkloadFilter] = useState("all");
  const [teacherSegment, setTeacherSegment] = useState<"all" | "balanced" | "overloaded" | "active" | "pending">("all");

  // Filters (Staff Intelligence)
  const [staffSearch, setStaffSearch] = useState("");
  const [staffDeptFilter, setStaffDeptFilter] = useState("all");
  const [staffTypeFilter, setStaffTypeFilter] = useState("all");
  const [staffSegment, setStaffSegment] = useState<"all" | "admin" | "operations" | "full" | "active">("all");

  // Filters (Parents & Mappings)
  const [parentSearch, setParentSearch] = useState("");
  const [parentStatusFilter, setParentStatusFilter] = useState("all");
  const [parentRelFilter, setParentRelFilter] = useState("all");
  const [parentSegment, setParentSegment] = useState<"all" | "father" | "mother" | "accepted" | "pending">("all");

  // Filters (Academic Units)
  const [deptSearch, setDeptSearch] = useState("");
  const [deptStatusFilter, setDeptStatusFilter] = useState("all");
  const [deptSegment, setDeptSegment] = useState<"all" | "active" | "with_faculty" | "with_subjects">("all");

  // Selected Student for 360° Profile Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [student360Tab, setStudent360Tab] = useState<
    "personal" | "academic" | "parents" | "attendance" | "assignments" | "exams" | "results" | "fees" | "leave" | "discipline" | "documents" | "communication" | "activity"
  >("personal");
  const [student360Dossier, setStudent360Dossier] = useState<any>(null);
  const [loading360, setLoading360] = useState(false);

  useEffect(() => {
    if (selectedStudent && organizationId) {
      const studentId = selectedStudent.id;
      if (studentId) {
        setLoading360(true);
        getSchoolAdminStudent360(organizationId, studentId)
          .then((res) => setStudent360Dossier(res))
          .catch((err) => console.error("Failed to load student 360:", err))
          .finally(() => setLoading360(false));
      }
    } else {
      setStudent360Dossier(null);
    }
  }, [selectedStudent, organizationId]);

  // Invite actions state
  const [sendingInviteStudentId, setSendingInviteStudentId] = useState<string | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<{ id: string; msg: string; error?: boolean } | null>(null);
  const [copiedInviteStudentId, setCopiedInviteStudentId] = useState<string | null>(null);

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

  const handleCopyInviteLink = async (s: StudentRecord) => {
    if (!s.inviteToken) return;
    const studentId = s.id || s.userId;
    await navigator.clipboard.writeText(`${window.location.origin}/?invite=${s.inviteToken}`);
    setCopiedInviteStudentId(studentId || null);
    setTimeout(() => setCopiedInviteStudentId(null), 2000);
  };

  // Selected Teacher for Dossier Drawer
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRecord | null>(null);
  const [teacher360Tab, setTeacher360Tab] = useState<
    "personal" | "workload" | "classes" | "schedule" | "attendance" | "documents" | "activity"
  >("personal");
  const [editingTeacherEmp, setEditingTeacherEmp] = useState(false);
  const [empIdInput, setEmpIdInput] = useState("");
  const [empTypeInput, setEmpTypeInput] = useState("Regular Faculty");
  const [savingTeacherEmp, setSavingTeacherEmp] = useState(false);
  const [empSaveSuccess, setEmpSaveSuccess] = useState(false);

  const handleOpenTeacherModal = (t: TeacherRecord) => {
    setSelectedTeacher(t);
    setTeacher360Tab("personal");
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

  // Selected Staff for Dossier Drawer
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const [staff360Tab, setStaff360Tab] = useState<"personal" | "employment" | "documents" | "activity">("personal");

  // Selected Parent for Dossier Drawer
  const [selectedParent, setSelectedParent] = useState<ParentRecord | null>(null);
  const [parent360Tab, setParent360Tab] = useState<"wards" | "communications" | "permissions">("wards");

  // Selected Department for Department 360° Dossier Drawer
  const [selectedDept, setSelectedDept] = useState<DepartmentRecord | null>(null);
  const [dept360Tab, setDept360Tab] = useState<"overview" | "subjects" | "faculty">("overview");

  const [loading, setLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

  // Manage Wards State (Embedded directly inside Guardian Dossier)
  const [isMappingWards, setIsMappingWards] = useState(false);
  const [selectedWardIds, setSelectedWardIds] = useState<string[]>([]);
  const [wardSearchQuery, setWardSearchQuery] = useState("");
  const [wardClassFilter, setWardClassFilter] = useState("");
  const [wardSectionFilter, setWardSectionFilter] = useState("all");
  const [wardUnmappedOnly, setWardUnmappedOnly] = useState(false);
  const [savingWards, setSavingWards] = useState(false);
  const [academicsData, setAcademicsData] = useState<{ programs: any[]; sections: any[] } | null>(null);

  const handleStartMappingWards = (parent: ParentRecord) => {
    const currentIds = (parent.children || []).map((ch: any) => ch.studentId || ch.id).filter(Boolean);
    setSelectedWardIds(currentIds);
    setWardSearchQuery("");
    const firstChild = (parent.children || [])[0];
    const initialClass = firstChild?.grade || "";
    const initialSection = firstChild?.section || "all";
    setWardClassFilter(initialClass);
    setWardSectionFilter(initialSection);
    setWardUnmappedOnly(false);
    setIsMappingWards(true);
  };

  const handleSaveWardsInsideDossier = async () => {
    if (!organizationId || !selectedParent) return;
    setSavingWards(true);
    try {
      await updateParentChildren(organizationId, selectedParent.id, selectedWardIds);
      const updated = await getSchoolAdminParents(organizationId);
      const parentList = updated || [];
      setParents(parentList);
      const updatedParent = parentList.find((p: any) => p.id === selectedParent.id);
      if (updatedParent) {
        setSelectedParent(updatedParent);
      } else {
        const mappedStudents = students
          .filter((s) => selectedWardIds.includes(s.userId || s.id))
          .map((s) => ({
            id: s.userId || s.id,
            studentId: s.userId || s.id,
            name: s.name,
            studentName: s.name,
            admissionNo: s.admissionNo || s.admissionNumber,
            grade: s.grade || s.className,
            section: s.section || s.sectionName,
            class: [s.grade || s.className, s.section || s.sectionName].filter(Boolean).join(" "),
          }));
        setSelectedParent((prev) => (prev ? { ...prev, children: mappedStudents } : prev));
      }
      setIsMappingWards(false);
    } catch (err: any) {
      alert(err?.message || "Failed to update mapped wards");
    } finally {
      setSavingWards(false);
    }
  };

  const handleUnlinkWard = async (studentIdToUnlink: string) => {
    if (!organizationId || !selectedParent) return;
    const nextIds = (selectedParent.children || [])
      .map((ch: any) => ch.studentId || ch.id)
      .filter((id: string) => id && id !== studentIdToUnlink);
    setSavingWards(true);
    try {
      await updateParentChildren(organizationId, selectedParent.id, nextIds);
      const updated = await getSchoolAdminParents(organizationId);
      const parentList = updated || [];
      setParents(parentList);
      const updatedParent = parentList.find((p: any) => p.id === selectedParent.id);
      if (updatedParent) {
        setSelectedParent(updatedParent);
      } else {
        setSelectedParent((prev) =>
          prev
            ? {
                ...prev,
                children: (prev.children || []).filter(
                  (ch: any) => (ch.studentId || ch.id) !== studentIdToUnlink
                ),
              }
            : prev
        );
      }
    } catch (err: any) {
      alert(err?.message || "Failed to unlink ward");
    } finally {
      setSavingWards(false);
    }
  };

  const availableClassesForWards = useMemo(() => {
    const set = new Set<string>();
    (academicsData?.programs || []).forEach((p: any) => {
      if (p.name) set.add(p.name);
    });
    students.forEach((s) => {
      const cls = s.grade || s.className;
      if (cls) set.add(cls);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [academicsData, students]);

  const availableSectionsForWards = useMemo(() => {
    const set = new Set<string>();
    (academicsData?.sections || []).forEach((sec: any) => {
      if (!wardClassFilter || wardClassFilter === "all" || (sec.programName || "").toLowerCase() === wardClassFilter.toLowerCase()) {
        if (sec.name) set.add(sec.name);
      }
    });
    students.forEach((s) => {
      const cls = (s.grade || s.className || "").toLowerCase();
      if (wardClassFilter && wardClassFilter !== "all" && cls !== wardClassFilter.toLowerCase()) {
        return;
      }
      const sec = s.section || s.sectionName;
      if (sec) set.add(sec);
    });
    return Array.from(set).sort();
  }, [academicsData, students, wardClassFilter]);

  const studentGuardianMap = useMemo(() => {
    const map = new Map<string, { parentName: string; rel?: string }[]>();
    parents.forEach((p) => {
      (p.children || []).forEach((ch: any) => {
        const sid = ch.studentId || ch.id;
        if (sid) {
          const list = map.get(sid) || [];
          list.push({ parentName: p.name || "Guardian", rel: p.relationship || "" });
          map.set(sid, list);
        }
      });
    });
    return map;
  }, [parents]);

  const unlinkedStudentsCount = useMemo(() => {
    return students.filter((s) => !studentGuardianMap.has(s.userId || s.id)).length;
  }, [students, studentGuardianMap]);

  const filteredStudentsForWards = useMemo(() => {
    if (!wardClassFilter) {
      return [];
    }
    return students.filter((s) => {
      const sid = s.userId || s.id;
      // Class/Grade filter
      if (wardClassFilter !== "all") {
        const cls = (s.grade || s.className || "").toLowerCase();
        if (cls !== wardClassFilter.toLowerCase()) return false;
      }
      // Section filter
      if (wardSectionFilter !== "all") {
        const sec = (s.section || s.sectionName || "").toLowerCase();
        if (sec !== wardSectionFilter.toLowerCase()) return false;
      }
      // Unmapped only filter
      if (wardUnmappedOnly) {
        const mapped = studentGuardianMap.has(sid);
        const isCurrentSelected = selectedWardIds.includes(sid);
        if (mapped && !isCurrentSelected) return false;
      }
      // Search query filter
      if (wardSearchQuery.trim()) {
        const q = wardSearchQuery.toLowerCase().trim();
        const nameMatch = (s.name || "").toLowerCase().includes(q);
        const admMatch = (s.admissionNo || s.admissionNumber || "").toLowerCase().includes(q);
        const classMatch = [s.grade, s.className, s.section, s.sectionName].filter(Boolean).join(" ").toLowerCase().includes(q);
        const rollMatch = (s.rollNo || s.rollNumber || "").toLowerCase().includes(q);
        if (!nameMatch && !admMatch && !classMatch && !rollMatch) return false;
      }
      return true;
    });
  }, [students, wardSearchQuery, wardClassFilter, wardSectionFilter, wardUnmappedOnly, studentGuardianMap, selectedWardIds]);

  // Manage Department Subjects State (Embedded directly inside Department Dossier)
  const [isMappingDeptSubjects, setIsMappingDeptSubjects] = useState(false);
  const [selectedDeptSubjectIds, setSelectedDeptSubjectIds] = useState<string[]>([]);
  const [deptSubjectSearchQuery, setDeptSubjectSearchQuery] = useState("");
  const [savingDeptSubjects, setSavingDeptSubjects] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  const handleStartMappingDeptSubjects = async (dept: DepartmentRecord) => {
    const currentIds = (dept.subjects || []).map((s: any) => s.id).filter(Boolean);
    setSelectedDeptSubjectIds(currentIds);
    setDeptSubjectSearchQuery("");
    setIsMappingDeptSubjects(true);
    if (organizationId) {
      try {
        const subjs = await getAvailableDepartmentSubjects(organizationId);
        setAvailableSubjects(subjs || []);
      } catch (err) {
        setAvailableSubjects(dept.subjects || []);
      }
    }
  };

  const handleSaveDeptSubjectsInsideDossier = async () => {
    if (!organizationId || !selectedDept) return;
    setSavingDeptSubjects(true);
    try {
      await updateDepartmentSubjects(organizationId, selectedDept.id, selectedDeptSubjectIds);
      const updatedDepts = await getSchoolAdminDepartments(organizationId);
      const list = updatedDepts || [];
      setDepartments(list);
      const updatedCurrentDept = list.find((d: any) => d.id === selectedDept.id);
      if (updatedCurrentDept) {
        setSelectedDept(updatedCurrentDept);
      } else {
        const mappedSubjs = availableSubjects.filter((s: any) => selectedDeptSubjectIds.includes(s.id));
        setSelectedDept((prev) => (prev ? { ...prev, subjects: mappedSubjs } : prev));
      }
      setIsMappingDeptSubjects(false);
    } catch (err: any) {
      alert(err?.message || "Failed to update mapped subjects");
    } finally {
      setSavingDeptSubjects(false);
    }
  };

  const handleUnlinkDeptSubject = async (subjectIdToUnlink: string) => {
    if (!organizationId || !selectedDept) return;
    const nextIds = (selectedDept.subjects || [])
      .map((s: any) => s.id)
      .filter((id: string) => id && id !== subjectIdToUnlink);
    setSavingDeptSubjects(true);
    try {
      await updateDepartmentSubjects(organizationId, selectedDept.id, nextIds);
      const updatedDepts = await getSchoolAdminDepartments(organizationId);
      const list = updatedDepts || [];
      setDepartments(list);
      const updatedCurrentDept = list.find((d: any) => d.id === selectedDept.id);
      if (updatedCurrentDept) {
        setSelectedDept(updatedCurrentDept);
      } else {
        setSelectedDept((prev) =>
          prev
            ? {
              ...prev,
              subjects: (prev.subjects || []).filter((s: any) => s.id !== subjectIdToUnlink),
            }
            : prev
        );
      }
    } catch (err: any) {
      alert(err?.message || "Failed to unlink subject");
    } finally {
      setSavingDeptSubjects(false);
    }
  };

  const filteredAvailableSubjects = availableSubjects.filter((s: any) => {
    if (!deptSubjectSearchQuery.trim()) return true;
    const q = deptSubjectSearchQuery.toLowerCase();
    const nameMatch = (s.name || "").toLowerCase().includes(q);
    const codeMatch = (s.code || "").toLowerCase().includes(q);
    return nameMatch || codeMatch;
  });

  const studentParents = selectedStudent
    ? parents.filter((p) =>
      (p.children || []).some(
        (ch: any) =>
          (ch.id && ch.id === selectedStudent.id) ||
          (ch.studentId && ch.studentId === selectedStudent.id)
      )
    )
    : [];

  // Prevent background scrolling when any drawer is open
  useEffect(() => {
    if (selectedStudent || selectedTeacher || selectedStaff || selectedParent || selectedDept) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedStudent, selectedTeacher, selectedStaff, selectedParent, selectedDept]);

  // Load academics data (classes & sections) on demand for ward mapping
  useEffect(() => {
    if (organizationId && (subtab === "parents" || selectedParent || isMappingWards) && !academicsData) {
      getSchoolAdminAcademics(organizationId)
        .then((data) => setAcademicsData(data))
        .catch(() => {});
    }
  }, [organizationId, subtab, selectedParent, isMappingWards, academicsData]);

  // Load students on demand if Parent Dossier is opened (for ward mapping)
  useEffect(() => {
    if (selectedParent && organizationId && !loadedTabs["students"]) {
      getSchoolAdminStudents(organizationId)
        .then((st) => {
          setStudents(st || []);
          setLoadedTabs((prev) => ({ ...prev, students: true }));
        })
        .catch(() => { });
    }
  }, [selectedParent, organizationId, loadedTabs]);

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
        ? getSchoolAdminStudents(organizationId)
            .then((st) => {
              setStudents(st || []);
              setLoadedTabs((prev) => ({ ...prev, students: true }));
            })
            .catch(() => { })
        : Promise.resolve();
      fetcher = Promise.all([p1, p2]);
    } else {
      fetcher = getSchoolAdminDepartments(organizationId).then((dp) => setDepartments(dp || []));
    }

    fetcher
      .catch(() => { })
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
        .catch(() => { });
    }
  }, [selectedStudent, organizationId, loadedTabs]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Grade / Class filter
      if (gradeFilter !== "all") {
        const g = (s.grade || s.className || "").toLowerCase();
        if (!g.includes(gradeFilter.toLowerCase())) return false;
      }

      // 2. Section filter
      if (sectionFilter !== "all") {
        const sec = (s.section || s.sectionName || "").toLowerCase();
        if (sec !== sectionFilter.toLowerCase()) return false;
      }

      // 3. Attendance filter
      if (attendanceFilter !== "all") {
        const att = s.attendancePct != null ? Number(s.attendancePct) : null;
        if (attendanceFilter === "ontrack" && (att === null || att < 75)) return false;
        if (attendanceFilter === "breach" && (att === null || att >= 75)) return false;
        if (attendanceFilter === "critical" && (att === null || att >= 60)) return false;
        if (attendanceFilter === "perfect" && (att === null || att < 90)) return false;
        if (attendanceFilter === "no_records" && att !== null) return false;
      }

      // 4. Fee status filter
      if (feeFilter !== "all") {
        const f = (s.feeStatus || "").toLowerCase();
        if (feeFilter === "paid" && !f.includes("paid") && !f.includes("settl")) return false;
        if (feeFilter === "pending" && !f.includes("pend") && !f.includes("due")) return false;
        if (feeFilter === "overdue" && !f.includes("overdue")) return false;
        if (feeFilter === "no_records" && f !== "" && f !== "—" && f !== "unbilled") return false;
      }

      // 5. Academic Status filter
      if (statusFilter !== "all") {
        const st = (s.academicStatus || s.status || "").toLowerCase();
        if (statusFilter === "active") {
          if (!st.includes("active") && !st.includes("enroll")) return false;
        } else if (statusFilter === "probation") {
          if (!st.includes("probat") && !st.includes("review")) return false;
        } else if (statusFilter === "inactive") {
          if (!st.includes("inact") && !st.includes("suspend") && !st.includes("arch")) return false;
        } else if (statusFilter === "graduated") {
          if (!st.includes("grad") && !st.includes("alum")) return false;
        } else {
          if (st !== statusFilter.toLowerCase()) return false;
        }
      }

      // 6. Segment quick pills
      if (studentSegment === "ontrack") {
        if (s.attendancePct == null || Number(s.attendancePct) < 75) return false;
      } else if (studentSegment === "breach") {
        if (s.attendancePct == null || Number(s.attendancePct) >= 75) return false;
      } else if (studentSegment === "pending_fee") {
        const f = (s.feeStatus || "").toLowerCase();
        if (!f.includes("pend") && !f.includes("due")) return false;
      } else if (studentSegment === "paid_fee") {
        const f = (s.feeStatus || "").toLowerCase();
        if (!f.includes("paid") && !f.includes("settl")) return false;
      } else if (studentSegment === "active") {
        const st = (s.academicStatus || s.status || "").toLowerCase();
        if (!st.includes("active") && !st.includes("enroll")) return false;
      }

      // 7. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (s.name || "").toLowerCase().includes(q);
        const matchRoll = (s.rollNo || s.rollNumber || "").toLowerCase().includes(q);
        const matchClass = [s.grade, s.className, s.section, s.sectionName].filter(Boolean).join(" ").toLowerCase().includes(q);
        const matchEmail = (s.email || s.studentEmail || "").toLowerCase().includes(q);
        const matchAdm = (s.admissionNo || s.admissionNumber || "").toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchClass && !matchEmail && !matchAdm) return false;
      }
      return true;
    });
  }, [students, gradeFilter, sectionFilter, attendanceFilter, feeFilter, statusFilter, studentSegment, searchQuery]);

  const uniqueGrades = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((s) => s.grade || s.className)
          .filter(Boolean)
          .map((g) => String(g).trim())
      )
    ).sort();
  }, [students]);

  const uniqueAcademicStatuses = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      const st = s.academicStatus || s.status;
      if (st && String(st) !== "—") set.add(String(st));
    });
    return Array.from(set).sort();
  }, [students]);

  const uniqueSections = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (gradeFilter !== "all") {
        const g = (s.grade || s.className || "").toLowerCase();
        if (!g.includes(gradeFilter.toLowerCase())) return;
      }
      const sec = s.section || s.sectionName;
      if (sec) set.add(sec);
    });
    return Array.from(set).sort();
  }, [students, gradeFilter]);

  const hasActiveStudentFilters = Boolean(
    searchQuery ||
    gradeFilter !== "all" ||
    sectionFilter !== "all" ||
    attendanceFilter !== "all" ||
    feeFilter !== "all" ||
    statusFilter !== "all" ||
    studentSegment !== "all"
  );

  const totalStudentsCount = students.length;
  const goodAttendanceCount = students.filter(
    (s) => s.attendancePct != null && Number(s.attendancePct) >= 75
  ).length;
  const mappedGuardiansCount = students.filter(
    (s) => Boolean(s.parentName || s.guardianName)
  ).length;
  const transportEnrolledCount = students.filter(
    (s) => Boolean(s.transportRoute || s.busNumber || s.transport)
  ).length;

  // Teachers Computed & Filtered
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = teacherSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (t.name || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q) ||
        (t.department || "").toLowerCase().includes(q) ||
        (t.subjects && t.subjects.some((s) => s.toLowerCase().includes(q))) ||
        (t.empId && t.empId.toLowerCase().includes(q));

      const matchesDept = teacherDeptFilter === "all" || t.department === teacherDeptFilter;

      const weekly = t.weeklyPeriods || 0;
      const maxP = t.maxPeriods || 28;
      const isOverloaded = weekly > maxP;
      const isBalanced = weekly <= maxP;
      const st = (t.status || "Active").toLowerCase();

      if (teacherSegment === "balanced" && !isBalanced) return false;
      if (teacherSegment === "overloaded" && !isOverloaded) return false;
      if (teacherSegment === "active" && !st.includes("active")) return false;
      if (teacherSegment === "pending" && !st.includes("pend")) return false;

      const matchesWorkload =
        teacherWorkloadFilter === "all" ||
        (teacherWorkloadFilter === "overloaded" && isOverloaded) ||
        (teacherWorkloadFilter === "heavy" && weekly >= 26 && weekly <= maxP) ||
        (teacherWorkloadFilter === "balanced" && isBalanced);

      return matchesSearch && matchesDept && matchesWorkload;
    });
  }, [teachers, teacherSearch, teacherDeptFilter, teacherWorkloadFilter, teacherSegment]);

  const teacherDepartments = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set).sort();
  }, [teachers]);

  const teachersBalancedCount = useMemo(() => {
    return teachers.filter((t) => (t.weeklyPeriods || 0) <= (t.maxPeriods || 28)).length;
  }, [teachers]);

  const teachersOverloadedCount = useMemo(() => {
    return teachers.filter((t) => (t.weeklyPeriods || 0) > (t.maxPeriods || 28)).length;
  }, [teachers]);

  const teachersAvgPeriods = useMemo(() => {
    if (teachers.length === 0) return 0;
    return Math.round(teachers.reduce((acc, t) => acc + (t.weeklyPeriods || 0), 0) / teachers.length);
  }, [teachers]);

  // Staff Computed & Filtered
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const q = staffSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.department || "").toLowerCase().includes(q) ||
        (s.designation || "").toLowerCase().includes(q) ||
        (s.empId && s.empId.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q));

      const matchesDept = staffDeptFilter === "all" || s.department === staffDeptFilter;
      const matchesType =
        staffTypeFilter === "all" ||
        (s.employmentType || "").toLowerCase().includes(staffTypeFilter.toLowerCase());

      const deptLower = (s.department || "").toLowerCase();
      const statusLower = (s.status || "active").toLowerCase();
      const empTypeLower = (s.employmentType || "").toLowerCase();

      if (staffSegment === "admin" && !deptLower.includes("admin")) return false;
      if (staffSegment === "operations" && !["support", "security", "transport", "library", "medical", "it"].some(d => deptLower.includes(d))) return false;
      if (staffSegment === "full" && !empTypeLower.includes("full")) return false;
      if (staffSegment === "active" && !statusLower.includes("active")) return false;

      return matchesSearch && matchesDept && matchesType;
    });
  }, [staff, staffSearch, staffDeptFilter, staffTypeFilter, staffSegment]);

  const staffDepartments = useMemo(() => {
    const set = new Set<string>();
    staff.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [staff]);

  const staffFullTimeCount = useMemo(() => {
    return staff.filter((s) => (s.employmentType || "").toLowerCase().includes("full")).length;
  }, [staff]);

  const staffActiveCount = useMemo(() => {
    return staff.filter((s) => (s.status || "").toLowerCase() === "active").length;
  }, [staff]);

  const staffDeptsCount = useMemo(() => {
    return new Set(staff.map((s) => s.department).filter(Boolean)).size;
  }, [staff]);

  // Parents Computed & Filtered
  const filteredParents = useMemo(() => {
    return parents.filter((p) => {
      const q = parentSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.mobile && p.mobile.includes(q)) ||
        (p.occupation && p.occupation.toLowerCase().includes(q)) ||
        (p.children && p.children.some((ch: any) => (ch.studentName || ch.name || "").toLowerCase().includes(q)));

      const matchesStatus =
        parentStatusFilter === "all" ||
        (p.invitationStatus || p.accountStatus || "").toLowerCase() === parentStatusFilter.toLowerCase();
      const matchesRel =
        parentRelFilter === "all" ||
        (p.relationship || "").toLowerCase() === parentRelFilter.toLowerCase();

      const relLower = (p.relationship || "").toLowerCase();
      const invStatus = (p.invitationStatus || p.accountStatus || "").toLowerCase();

      if (parentSegment === "father" && !relLower.includes("father")) return false;
      if (parentSegment === "mother" && !relLower.includes("mother")) return false;
      if (parentSegment === "accepted" && !invStatus.includes("accept") && !invStatus.includes("active")) return false;
      if (parentSegment === "pending" && !invStatus.includes("pend")) return false;

      return matchesSearch && matchesStatus && matchesRel;
    });
  }, [parents, parentSearch, parentStatusFilter, parentRelFilter, parentSegment]);

  const parentsVerifiedCount = useMemo(() => {
    return parents.filter((p) => Boolean(p.mobile && p.mobile !== "-" && p.mobile.trim().length > 3)).length;
  }, [parents]);

  const parentsWardsCount = useMemo(() => {
    return parents.reduce((acc, p) => acc + (p.children?.length || 0), 0);
  }, [parents]);

  const parentsAcceptedCount = useMemo(() => {
    return parents.filter((p) => (p.invitationStatus || "").toLowerCase() === "accepted").length;
  }, [parents]);

  // Departments Computed & Filtered
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const q = deptSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (d.name || "").toLowerCase().includes(q) ||
        (d.code || "").toLowerCase().includes(q) ||
        (d.headName && d.headName.toLowerCase().includes(q)) ||
        (d.headEmail && d.headEmail.toLowerCase().includes(q)) ||
        (Array.isArray(d.subjects) && d.subjects.some((s: any) => (s?.name || "").toLowerCase().includes(q)));

      const matchesStatus =
        deptStatusFilter === "all" ||
        (d.status || "").toLowerCase() === deptStatusFilter.toLowerCase();

      const st = (d.status || "").toLowerCase();
      if (deptSegment === "active" && (!st.includes("active") || st.includes("pend") || st.includes("inact"))) return false;

      const facultyCount = Number(d.teachersCount ?? (Array.isArray(d.teachers) ? d.teachers.length : 0));
      if (deptSegment === "with_faculty" && facultyCount <= 0) return false;

      const subjectsCount = Array.isArray(d.subjects) ? d.subjects.length : Number(d.subjectsCount || 0);
      if (deptSegment === "with_subjects" && subjectsCount <= 0) return false;

      return matchesSearch && matchesStatus;
    });
  }, [departments, deptSearch, deptStatusFilter, deptSegment]);

  const deptSubjectsCount = useMemo(() => {
    return departments.reduce((acc, d) => {
      const count = Array.isArray(d.subjects) ? d.subjects.length : Number(d.subjectsCount || 0);
      return acc + count;
    }, 0);
  }, [departments]);

  const deptFacultyCount = useMemo(() => {
    return departments.reduce((acc, d) => {
      const count = Number(d.teachersCount ?? (Array.isArray(d.teachers) ? d.teachers.length : 0));
      return acc + count;
    }, 0);
  }, [departments]);

  const deptAvgProgress = useMemo(() => {
    if (departments.length === 0) return 0;
    return Math.round(departments.reduce((acc, d) => acc + (d.syllabusCompletionPct || 0), 0) / departments.length);
  }, [departments]);

  return (
    <div className="edops-people-pane" style={{ display: "grid", gap: "20px", width: "100%", minWidth: 0, maxWidth: "100%" }}>
      <style>{`
        @keyframes edopsShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .edops-skeleton {
          background: linear-gradient(90deg, #EDF2F7 25%, #F7FAFC 50%, #EDF2F7 75%);
          background-size: 200% 100%;
          animation: edopsShimmer 1.4s ease-in-out infinite;
          border-radius: 4px;
        }
        .edops-skeleton-kpi {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.35) 25%, rgba(255, 255, 255, 0.75) 50%, rgba(255, 255, 255, 0.35) 75%);
          background-size: 200% 100%;
          animation: edopsShimmer 1.4s ease-in-out infinite;
          border-radius: 4px;
        }
        @keyframes edopsSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes edopsSlideInRight {
          from {
            transform: translateX(100%);
            opacity: 0.6;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes edopsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      {/* ============================================================== */}
      {/* WORKSPACE HEADER & CONTROL BAR                                 */}
      {/* ============================================================== */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
        {/* Top Header: Title, Subtitle, and Primary Action */}
        <div
          className="edops-people-header"
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            minWidth: 0,
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0, flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "22px",
                lineHeight: "30px",
                color: "#0C1E33",
                letterSpacing: "-0.02em",
              }}
            >
              {subtab === "students"
                ? "Students"
                : subtab === "teachers"
                  ? "Teachers & Workload"
                  : subtab === "staff"
                    ? "Staff Intelligence"
                    : subtab === "parents"
                      ? "Parents & Mappings"
                      : "Academic Units"}
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "13px",
                lineHeight: "150%",
                color: "#64748B",
              }}
            >
              {subtab === "students"
                ? "Directory of enrolled students across all grades, classes, and houses."
                : subtab === "teachers"
                  ? "Faculty assignments, 28/30 weekly period distribution, and department mappings."
                  : subtab === "staff"
                    ? "Campus support staff roster, administrative roles, and shift allocations."
                    : subtab === "parents"
                      ? "Verified guardian profiles, ward mappings, and communication conduits."
                      : "Academic departments, subject heads, and curricular divisions."}
            </p>
          </div>

          <div className="edops-people-actions" style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {subtab === "staff" && (
              <button
                onClick={() => onOpenQuickAction("addPrincipal")}
                style={{
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "36px",
                  padding: "0 14px",
                  background: "#FFFFFF",
                  color: "#0C1E33",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  fontSize: "12.5px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.borderColor = "#CBD5E1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
              >
                <Plus size={15} strokeWidth={2} />
                <span>Add Principal</span>
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
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "36px",
                width: "168px",
                minWidth: "168px",
                maxWidth: "168px",
                flexShrink: 0,
                padding: "0 14px",
                background: "#0C1E33",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 1px 2px rgba(12, 30, 51, 0.1)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1B3554";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0C1E33";
              }}
            >
              <Plus size={15} strokeWidth={2} style={{ color: "#FFFFFF" }} />
              <span>
                {subtab === "students"
                  ? "Add Student"
                  : subtab === "teachers"
                    ? "Add Teacher"
                    : subtab === "staff"
                      ? "Add Staff"
                      : subtab === "parents"
                        ? "Map Parent"
                        : "New Department"}
              </span>
            </button>
          </div>
        </div>

        {/* Simple Minimal Underline Tab Navigation with Sliding Animation */}
        <div
          role="tablist"
          aria-label="Workspace views"
          className="edops-people-tabs"
          style={{
            position: "relative",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            width: "100%",
            borderBottom: "1px solid #E2E8F0",
            overflowX: "auto",
            scrollbarWidth: "none",
            gap: "28px",
            paddingLeft: "4px",
            paddingRight: "4px",
            margin: 0,
          }}
        >
          {/* Animated Sliding Thick Underline Indicator */}
          {indicatorStyle.ready && indicatorStyle.width > 0 && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: "-1px",
                left: 0,
                width: `${indicatorStyle.width}px`,
                height: "3px",
                transform: `translateX(${indicatorStyle.left}px)`,
                transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                background: "#0C1E33",
                borderRadius: "3px 3px 0 0",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          )}

          {[
            { id: "students", label: "Students", icon: GraduationCap },
            { id: "teachers", label: "Teachers & Workload", icon: Users },
            { id: "staff", label: "Staff Intelligence", icon: Briefcase },
            { id: "parents", label: "Parents & Mappings", icon: HeartHandshake },
            { id: "departments", label: "Academic Units", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subtab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  handleTabSwitch(tab.id as any);
                }}
                style={{
                  position: "relative",
                  zIndex: 2,
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 2px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "3px solid transparent",
                  marginBottom: "-1px",
                  cursor: "pointer",
                  fontSize: "13.5px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#0C1E33" : "#64748B",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  outline: "none",
                  transition: "color 0.15s ease",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#0C1E33";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#64748B";
                  }
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2 : 1.75}
                  style={{
                    color: isActive ? "#0C1E33" : "#7B8C9E",
                    transition: "color 0.15s ease",
                  }}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. STUDENTS TAB (Figma Reference Specification)                */}
      {/* ============================================================== */}
      {subtab === "students" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
          {/* Top 4 Pastel Summary Cards (Figma Spec: 164px height, 10px radius) */}
          {loading || refreshing || isSwitching ? (
            <KpiSkeletonGrid />
          ) : (
            <div
              className="edops-people-kpi-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                width: "100%",
              }}
            >
              {/* Card 1: Total Students (Pastel Violet) */}
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
                    TOTAL STUDENTS
                  </span>
                  <Users size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {totalStudentsCount > 0 ? totalStudentsCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                    Active in school roster
                  </span>
                  <div
                    onClick={() => {
                      setGradeFilter("all");
                      setStatusFilter("all");
                      setFeeFilter("all");
                      setSearchQuery("");
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

              {/* Card 2: Regular Attendance (Pastel Mint Green) */}
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
                    REGULAR ATTENDANCE
                  </span>
                  <UserCheck size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {goodAttendanceCount > 0 ? goodAttendanceCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                    {students.some((s) => s.attendancePct != null) ? "Above 75% statutory norm" : "No attendance recorded"}
                  </span>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                      Status
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#305E26" }} />
                  </div>
                </div>
              </div>

              {/* Card 3: Guardian Mappings (Pastel Sky Blue) */}
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
                    GUARDIAN MAPPINGS
                  </span>
                  <GraduationCap size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {mappedGuardiansCount > 0 ? mappedGuardiansCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                    Linked parent/guardian accounts
                  </span>
                  <div
                    onClick={() => {
                      setSubtab("parents");
                      if (onTabChange) onTabChange("parents");
                    }}
                    style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                      Linked
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
                  </div>
                </div>
              </div>

              {/* Card 4: Transport Enrolled (Pastel Warm Coral) */}
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
                    TRANSPORT ENROLLED
                  </span>
                  <Bus size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {transportEnrolledCount > 0 ? transportEnrolledCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                    Active bus routes & passes
                  </span>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                      Transport
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#82401E" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student Directory Card (Not scrollable, 100% fluid width) */}
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
            }}
          >
            {/* Directory Heading */}
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
                <h2 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "16px", lineHeight: "150%", color: "#0C1E33" }}>
                  Enrolled Students
                </h2>
                <div
                  style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "3px 9px",
                    background: "#F4F6F7",
                    borderRadius: "100px",
                  }}
                >
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "10px", lineHeight: "150%", color: "#586C82" }}>
                    {students.length} Total
                  </span>
                </div>
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "11px", lineHeight: "150%", color: "#586C82" }}>
                Showing {filteredStudents.length} of {students.length} students
              </div>
            </div>

            {/* Directory Controls */}
            <div
              className="edops-student-directory-controls"
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 24px 20px",
                gap: "12px",
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              {/* Student search */}
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
                  placeholder="Search student by name, roll number, or grade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{ all: "unset", cursor: "pointer", display: "flex", color: "#7B8999" }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>


              {/* Grade / Class filter */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 14px",
                  width: "145px",
                  height: "42px",
                  border: gradeFilter !== "all" ? "1.5px solid #0C1E33" : "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: gradeFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                <select
                  value={gradeFilter}
                  onChange={(e) => {
                    setGradeFilter(e.target.value);
                    setSectionFilter("all");
                  }}
                  style={{
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: gradeFilter !== "all" ? 600 : 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#0C1E33",
                    cursor: "pointer",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    paddingRight: "22px",
                    paddingLeft: 0,
                    margin: 0,
                  }}
                >
                  <option value="all">Class: All</option>
                  {uniqueGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: gradeFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
              </div>

              {/* Section filter */}
              {uniqueSections.length > 0 && (
                <div
                  style={{
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "0px 14px",
                    width: "135px",
                    height: "42px",
                    border: sectionFilter !== "all" ? "1.5px solid #0C1E33" : "1px solid #E0E5EB",
                    borderRadius: "6px",
                    background: sectionFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                    position: "relative",
                    transition: "all 0.15s ease",
                  }}
                >
                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      width: "100%",
                      height: "100%",
                      background: "transparent",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: sectionFilter !== "all" ? 600 : 400,
                      fontSize: "12px",
                      lineHeight: "150%",
                      color: "#0C1E33",
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      paddingRight: "22px",
                      paddingLeft: 0,
                      margin: 0,
                    }}
                  >
                    <option value="all">Section: All</option>
                    {uniqueSections.map((sec) => (
                      <option key={sec} value={sec}>
                        Section {sec}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: sectionFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
                </div>
              )}

              {/* Attendance filter */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 14px",
                  width: "170px",
                  height: "42px",
                  border: attendanceFilter !== "all" ? "1.5px solid #0C1E33" : "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: attendanceFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: attendanceFilter !== "all" ? 600 : 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#0C1E33",
                    cursor: "pointer",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    paddingRight: "22px",
                    paddingLeft: 0,
                    margin: 0,
                  }}
                >
                  <option value="all">Attendance: All</option>
                  <option value="ontrack">Regular (≥ 75%)</option>
                  <option value="breach">Breach (&lt; 75%)</option>
                  <option value="critical">Critical (&lt; 60%)</option>
                  <option value="perfect">High (≥ 90%)</option>
                  <option value="no_records">No Records (—)</option>
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: attendanceFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
              </div>

              {/* Fee status filter */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 14px",
                  width: "150px",
                  height: "42px",
                  border: feeFilter !== "all" ? "1.5px solid #0C1E33" : "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: feeFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                <select
                  value={feeFilter}
                  onChange={(e) => setFeeFilter(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: feeFilter !== "all" ? 600 : 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#0C1E33",
                    cursor: "pointer",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    paddingRight: "22px",
                    paddingLeft: 0,
                    margin: 0,
                  }}
                >
                  <option value="all">Fee: All</option>
                  <option value="paid">Settled / Paid</option>
                  <option value="pending">Pending / Due</option>
                  <option value="overdue">Overdue</option>
                  <option value="no_records">Unbilled / None</option>
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: feeFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
              </div>

              {/* Academic Status filter */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 14px",
                  width: "175px",
                  height: "42px",
                  border: statusFilter !== "all" ? "1.5px solid #0C1E33" : "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: statusFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: statusFilter !== "all" ? 600 : 400,
                    fontSize: "12px",
                    lineHeight: "150%",
                    color: "#0C1E33",
                    cursor: "pointer",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    paddingRight: "22px",
                    paddingLeft: 0,
                    margin: 0,
                  }}
                >
                  <option value="all">Academic: All</option>
                  <option value="active">Active</option>
                  <option value="probation">Under Review</option>
                  <option value="inactive">Inactive / Suspended</option>
                  <option value="graduated">Graduated</option>
                  {uniqueAcademicStatuses
                    .filter((st) => !["active", "probation", "inactive", "graduated"].includes(st.toLowerCase()))
                    .map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: statusFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
              </div>

              {hasActiveStudentFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setGradeFilter("all");
                    setSectionFilter("all");
                    setAttendanceFilter("all");
                    setFeeFilter("all");
                    setStatusFilter("all");
                    setStudentSegment("all");
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0 14px",
                    height: "42px",
                    background: "#F4F6F7",
                    border: "1px solid #E0E5EB",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#586C82",
                    cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#E9EEF4";
                    e.currentTarget.style.color = "#0C1E33";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#F4F6F7";
                    e.currentTarget.style.color = "#586C82";
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Quick Segment Filter Tabs (Auto-aligning, Professional UI) */}
            <div
              className="edops-student-segments"
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
                { id: "all", label: "All Students" },
                { id: "ontrack", label: "Regular Attendance" },
                { id: "breach", label: "Attendance Breach" },
                { id: "pending_fee", label: "Fee Pending" },
                { id: "paid_fee", label: "Fee Settled" },
                { id: "active", label: "Active Academic" },
              ].map((seg) => {
                const isSegActive = studentSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setStudentSegment(seg.id as any)}
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
                      letterSpacing: "-0.005em",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#E9EEF4";
                        e.currentTarget.style.color = "#0C1E33";
                        e.currentTarget.style.borderColor = "#CBD5E1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#F4F6F8";
                        e.currentTarget.style.color = "#5A6B7D";
                        e.currentTarget.style.borderColor = "#E2E8F0";
                      }
                    }}
                  >
                    <span>{seg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Student Table Area */}
            <div className="edops-student-directory-table" style={{ width: "100%", padding: "0px 24px", boxSizing: "border-box" }}>
              {/* Column headings (Admission details and parent contact removed) */}
              <div
                className="edops-student-directory-heading"
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px",
                  width: "100%",
                  height: "44px",
                  borderBottom: "1px solid #E0E5EB",
                  userSelect: "none",
                }}
              >
                <div style={{ flex: "2.5 1 220px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  STUDENT NAME
                </div>
                <div style={{ flex: "1.2 1 120px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  CLASS & ROLL
                </div>
                <div style={{ flex: "1.3 1 130px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  ATTENDANCE
                </div>
                <div style={{ flex: "1.1 1 110px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  FEE STATUS
                </div>
                <div style={{ flex: "1.3 1 130px", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  ACADEMIC STATUS
                </div>
                <div style={{ flex: "0 0 180px", textAlign: "right", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  ACTIONS
                </div>
              </div>

              {/* Student rows */}
              {loading || refreshing || isSwitching ? (
                <StudentSkeletonRows rows={6} />
              ) : filteredStudents.length === 0 ? (
                <NoResultState
                  title={
                    hasActiveStudentFilters
                      ? "No Matching Students Found"
                      : "No Students Enrolled"
                  }
                  description={
                    searchQuery
                      ? `No enrolled students match "${searchQuery}" or the active filter criteria.`
                      : hasActiveStudentFilters
                        ? "No student records match the active grade, attendance, fee, or academic status filters."
                        : "No students have been enrolled in this school campus yet. Click 'Add Student' above to begin onboarding."
                  }
                  onReset={
                    hasActiveStudentFilters
                      ? () => {
                        setSearchQuery("");
                        setGradeFilter("all");
                        setSectionFilter("all");
                        setAttendanceFilter("all");
                        setStatusFilter("all");
                        setFeeFilter("all");
                        setStudentSegment("all");
                      }
                      : undefined
                  }
                />
              ) : (
                filteredStudents.map((s, idx) => {
                  const hasAttendance = s.attendancePct != null;
                  const attendance = hasAttendance ? Math.round(Number(s.attendancePct)) : null;
                  const isBreach = attendance !== null && attendance < 75;
                  const feeStatus = s.feeStatus || "";
                  const isFeePaid = feeStatus.toLowerCase().includes("paid");
                  const isFeeOverdue = feeStatus.toLowerCase().includes("overdue");
                  const isEven = idx % 2 === 0;

                  return (
                    <div
                      key={s.id}
                      className="edops-student-directory-row"
                      style={{
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: "0 8px",
                        width: "100%",
                        height: "52px",
                        minHeight: "52px",
                        background: isEven ? "#FFFFFF" : "#F8FAFC",
                        borderBottom: "1px solid #E0E5EB",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? "#FFFFFF" : "#F8FAFC")}
                    >
                      {/* Student identity with circular profile picture */}
                      <div
                        style={{
                          flex: "2.5 1 220px",
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          padding: "0px",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
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
                            src={s.photoUrl || s.avatarUrl || getStudentAvatarUrl(s.name, s.admissionNo || s.rollNo || s.id)}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "1px",
                            minWidth: 0,
                            overflow: "hidden",
                          }}
                        >
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
                              maxWidth: "100%",
                            }}
                            title={s.name}
                          >
                            {s.name}
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
                              maxWidth: "100%",
                            }}
                            title={s.email || s.studentEmail || `${(s.name || "student").toLowerCase().replace(/[^a-z0-9]/g, "")}@student.edops.edu`}
                          >
                            {s.email || s.studentEmail || `${(s.name || "student").toLowerCase().replace(/[^a-z0-9]/g, "")}@student.edops.edu`}
                          </span>
                        </div>
                      </div>

                      {/* Class and roll */}
                      <div
                        style={{
                          flex: "1.2 1 120px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "1px",
                        }}
                      >
                        {(() => {
                          const cleanGrade = (s.grade || s.className || "").replace(/^Class\s*/i, "").trim();
                          const classDisplay = cleanGrade && (s.section || s.sectionName) ? `${cleanGrade}-${s.section || s.sectionName}` : cleanGrade || s.section || s.sectionName || "—";
                          const cleanRoll = (s.rollNo || s.rollNumber || "").replace(/^ROLL-?/i, "").trim();
                          return (
                            <>
                              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "12.5px", lineHeight: "130%", color: "#0C1E33" }}>
                                {classDisplay}
                              </span>
                              <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10.5px", color: "#7B8999" }}>
                                {cleanRoll ? `Roll #${cleanRoll}` : "Roll: —"}
                              </span>
                            </>
                          );
                        })()}
                      </div>

                      {/* Attendance (Real data, No hardcoding) */}
                      <div
                        style={{
                          flex: "1.3 1 130px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "2px",
                        }}
                      >
                        {attendance !== null ? (
                          <>
                            <span
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 600,
                                fontSize: "12.5px",
                                lineHeight: "130%",
                                color: isBreach ? "#AA4D1D" : "#0C1E33",
                              }}
                            >
                              {attendance}%
                            </span>
                            <div
                              style={{
                                boxSizing: "border-box",
                                display: "inline-flex",
                                flexDirection: "row",
                                alignItems: "center",
                                padding: "1px 6px",
                                background: isBreach ? "#FFF0E6" : "#ECFDF5",
                                borderRadius: "4px",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Poppins', sans-serif",
                                  fontWeight: 500,
                                  fontSize: "9.5px",
                                  lineHeight: "140%",
                                  color: isBreach ? "#AA4D1D" : "#047857",
                                }}
                              >
                                {isBreach ? "Breach <75%" : "On Track"}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "12.5px", color: "#7B8999" }}>
                              —
                            </span>
                            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", color: "#94A3B8" }}>
                              No records
                            </span>
                          </>
                        )}
                      </div>

                      {/* Fee status */}
                      <div
                        style={{
                          flex: "1.1 1 110px",
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        {feeStatus ? (
                          <div
                            style={{
                              boxSizing: "border-box",
                              display: "inline-flex",
                              flexDirection: "row",
                              alignItems: "center",
                              padding: "2px 8px",
                              background: isFeePaid ? "#D0EDC0" : isFeeOverdue ? "#FEE2E2" : "#FFF3CD",
                              borderRadius: "100px",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 600,
                                fontSize: "10.5px",
                                lineHeight: "140%",
                                color: isFeePaid ? "#305E26" : isFeeOverdue ? "#991B1B" : "#925317",
                              }}
                            >
                              {feeStatus}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: "12px", color: "#7B8999" }}>
                            —
                          </span>
                        )}
                      </div>

                      {/* Academic status */}
                      <div
                        style={{
                          flex: "1.3 1 130px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 500,
                            fontSize: "11.5px",
                            lineHeight: "140%",
                            color: s.academicStatus || s.status ? "#0C1E33" : "#7B8999",
                          }}
                        >
                          {s.academicStatus || s.status || "—"}
                        </span>
                      </div>

                      {/* Student profile action */}
                      <div
                        style={{
                          flex: "0 0 180px",
                          display: "flex",
                          flexDirection: "row",
                          gap: "6px",
                          justifyContent: "flex-end",
                          alignItems: "center",
                        }}
                      >
                        {String(s.inviteStatus || "").toLowerCase() === "not_sent" && (
                          <button
                            type="button"
                            onClick={() => handleSendInvite(s)}
                            disabled={sendingInviteStudentId === (s.id || s.userId)}
                            style={{
                              boxSizing: "border-box",
                              display: "inline-flex",
                              justifyContent: "center",
                              alignItems: "center",
                              padding: "0 9px",
                              height: "30px",
                              background: "#ECFDF5",
                              color: "#047857",
                              border: "1px solid #A7F3D0",
                              borderRadius: "5px",
                              cursor: sendingInviteStudentId === (s.id || s.userId) ? "wait" : "pointer",
                              opacity: sendingInviteStudentId === (s.id || s.userId) ? 0.65 : 1,
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 600,
                              fontSize: "10.5px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {sendingInviteStudentId === (s.id || s.userId) ? "Sending…" : "Send Invite"}
                          </button>
                        )}
                        {s.inviteToken && String(s.inviteStatus || "").toLowerCase() === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleCopyInviteLink(s)}
                            style={{
                              boxSizing: "border-box",
                              display: "inline-flex",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "4px",
                              padding: "0 9px",
                              height: "30px",
                              background: "#F8FAFC",
                              color: "#0C1E33",
                              border: "1px solid #CBD5E1",
                              borderRadius: "5px",
                              cursor: "pointer",
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 600,
                              fontSize: "10.5px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Copy size={12} />
                            {copiedInviteStudentId === (s.id || s.userId) ? "Copied" : "Copy Link"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(s)}
                          style={{
                            boxSizing: "border-box",
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "0px 10px",
                            gap: "5px",
                            height: "30px",
                            background: "#0C1E33",
                            border: "1px solid #0C1E33",
                            borderRadius: "5px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#1B3554";
                            e.currentTarget.style.borderColor = "#1B3554";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#0C1E33";
                            e.currentTarget.style.borderColor = "#0C1E33";
                          }}
                        >
                          <Eye size={13} strokeWidth={1.8} style={{ color: "#FFFFFF" }} />
                          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "11px", lineHeight: "140%", color: "#FFFFFF" }}>
                            Profile
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>


            {/* Record availability guide */}
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "16px 24px",
                gap: "8px",
                width: "100%",
                borderTop: "1px solid #E0E5EB",
              }}
            >
              <Info size={15} strokeWidth={1.8} style={{ color: "#7B8999", flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: "11px",
                  lineHeight: "150%",
                  color: "#7B8999",
                }}
              >
                Missing or unavailable indicators represent optional fields pending student roster sync or guardian self-registration.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TEACHERS & WORKLOAD TAB                                     */}
      {/* ============================================================== */}
      {subtab === "teachers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
          {/* Top 4 Pastel Summary Cards */}
          {loading || refreshing || isSwitching ? (
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
                  {teachers.length > 0 ? teachers.length : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                    Active instructional faculty
                  </span>
                  <div
                    onClick={() => {
                      setTeacherSearch("");
                      setTeacherDeptFilter("all");
                      setTeacherWorkloadFilter("all");
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
                    Within 24–28 periods/week
                  </span>
                  <div
                    onClick={() => setTeacherWorkloadFilter("balanced")}
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
                    Exceeding statutory threshold
                  </span>
                  <div
                    onClick={() => setTeacherWorkloadFilter("overloaded")}
                    style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                      Flagged
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
                  </div>
                </div>
              </div>

              {/* Card 4: Avg Weekly Load (Pastel Warm Coral) */}
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
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                      Workload
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#82401E" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Directory Card with Heading, Filters, and Alternating Table */}
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
                  Instructional Faculty & Workload
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
              className="edops-teacher-directory-controls"
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 24px 20px",
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
                  placeholder="Search faculty by name, email, department, subject..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
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
                {teacherSearch && (
                  <button
                    type="button"
                    onClick={() => setTeacherSearch("")}
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
                  width: "180px",
                  height: "42px",
                  border: "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: "#FFFFFF",
                  position: "relative",
                }}
              >
                <select
                  value={teacherDeptFilter}
                  onChange={(e) => setTeacherDeptFilter(e.target.value)}
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
                  {teacherDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: "#586C82", pointerEvents: "none" }} />
              </div>

              {(teacherSearch || teacherDeptFilter !== "all" || teacherSegment !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setTeacherSearch("");
                    setTeacherDeptFilter("all");
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#E9EEF4")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#F4F6F7")}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Quick Segment Filter Tabs (Auto-aligning, Professional UI) */}
            <div
              className="edops-teacher-segments"
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
                { id: "pending", label: "Pending Invite" },
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
                      letterSpacing: "-0.005em",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#E9EEF4";
                        e.currentTarget.style.color = "#0C1E33";
                        e.currentTarget.style.borderColor = "#CBD5E1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#F4F6F8";
                        e.currentTarget.style.color = "#5A6B7D";
                        e.currentTarget.style.borderColor = "#E2E8F0";
                      }
                    }}
                  >
                    <span>{seg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Faculty Table Area */}
            <div className="edops-teacher-directory-table" style={{ width: "100%", padding: "0px 24px", boxSizing: "border-box" }}>
              {/* Column headings (Aligned with student table typography) */}
              <div
                className="edops-teacher-directory-heading"
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 8px",
                  width: "100%",
                  height: "44px",
                  borderBottom: "1px solid #E0E5EB",
                  userSelect: "none",
                }}
              >
                <div style={{ flex: "2.4 1 200px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  FACULTY NAME
                </div>
                <div style={{ flex: "1.3 1 120px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  EMPLOYEE ID
                </div>
                <div style={{ flex: "1.3 1 120px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  DEPARTMENT
                </div>
                <div style={{ flex: "1.3 1 120px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  DESIGNATION
                </div>
                <div style={{ flex: "1.1 1 100px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  WORKLOAD
                </div>
                <div style={{ flex: "1.1 1 100px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  STATUS
                </div>
                <div style={{ flex: "0 0 110px", textAlign: "right", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  ACTIONS
                </div>
              </div>

              {/* Faculty rows */}
              {loading || refreshing || isSwitching ? (
                <TeacherSkeletonRows rows={6} />
              ) : filteredTeachers.length === 0 ? (
                <NoResultState
                  title={
                    teacherSearch || teacherDeptFilter !== "all" || teacherSegment !== "all"
                      ? "No Faculty Members Found"
                      : "No Faculty Enrolled"
                  }
                  description={
                    teacherSearch
                      ? `No faculty records match "${teacherSearch}".`
                      : teacherDeptFilter !== "all" || teacherSegment !== "all"
                        ? "No faculty members match the selected department or workload filters."
                        : "No faculty members are currently registered in this school roster. Click 'Add Teacher' above to onboard teachers."
                  }
                  onReset={
                    teacherSearch || teacherDeptFilter !== "all" || teacherSegment !== "all"
                      ? () => {
                        setTeacherSearch("");
                        setTeacherDeptFilter("all");
                        setTeacherSegment("all");
                      }
                      : undefined
                  }
                />
              ) : (
                filteredTeachers.map((t, idx) => {
                  const maxPeriods = t.maxPeriods || 28;
                  const weeklyPeriods = t.weeklyPeriods || 0;
                  const isOverloaded = weeklyPeriods > maxPeriods;
                  const isHeavy = weeklyPeriods >= 26 && !isOverloaded;
                  const isEven = idx % 2 === 0;
                  const st = (t.status || "Active").toLowerCase();
                  const isPending = st.includes("pend");

                  return (
                    <div
                      key={t.id}
                      className="edops-teacher-directory-row"
                      onClick={() => handleOpenTeacherModal(t)}
                      style={{
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: "0 8px",
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
                      {/* Faculty identity with circular profile picture */}
                      <div
                        style={{
                          flex: "2.4 1 200px",
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          padding: "0px",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
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
                            src={t.photoUrl || t.avatarUrl || getStudentAvatarUrl(t.name, t.email || t.empId)}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "1px",
                            minWidth: 0,
                            overflow: "hidden",
                          }}
                        >
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
                              maxWidth: "100%",
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
                              maxWidth: "100%",
                            }}
                            title={t.email || `${(t.name || "teacher").toLowerCase().replace(/[^a-z0-9]/g, "")}@faculty.edops.edu`}
                          >
                            {t.email || `${(t.name || "teacher").toLowerCase().replace(/[^a-z0-9]/g, "")}@faculty.edops.edu`}
                          </span>
                        </div>
                      </div>

                      {/* Employee ID */}
                      <div
                        style={{
                          flex: "1.3 1 120px",
                          minWidth: 0,
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "12px",
                          color: "#0C1E33",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={t.empId || t.id || "—"}
                      >
                        <span style={{ fontFamily: "monospace", fontSize: "11px", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", border: "1px solid #E2E8F0", color: "#334155" }}>
                          {t.empId || "EMP-" + (t.id ? t.id.slice(0, 6).toUpperCase() : "—")}
                        </span>
                      </div>

                      {/* Department */}
                      <div
                        style={{
                          flex: "1.3 1 120px",
                          minWidth: 0,
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "12.5px",
                          fontWeight: 500,
                          color: "#0C1E33",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={t.department || "—"}
                      >
                        {t.department || "—"}
                      </div>

                      {/* Designation */}
                      <div
                        style={{
                          flex: "1.3 1 120px",
                          minWidth: 0,
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "12px",
                          color: "#495D72",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={t.designation || "—"}
                      >
                        {t.designation?.replace(/\(Invited\)/g, "").trim() || t.designation || "—"}
                      </div>

                      {/* Workload (Numerical display: e.g. 0/28) */}
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
                            letterSpacing: "0.02em",
                          }}
                          title={`${weeklyPeriods} of ${maxPeriods} periods assigned`}
                        >
                          {weeklyPeriods}/{maxPeriods}
                        </span>
                      </div>

                      {/* Status */}
                      <div style={{ flex: "1.1 1 100px", minWidth: 0, display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontFamily: "'Poppins', sans-serif",
                            background:
                              isPending
                                ? "#FEF3C7"
                                : st.includes("active")
                                  ? "#ECFDF5"
                                  : "#F1F5F9",
                            color:
                              isPending
                                ? "#92400E"
                                : st.includes("active")
                                  ? "#047857"
                                  : "#475569",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isPending ? "Pending" : "Active"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTeacherModal(t);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: "#0C1E33",
                            border: "1px solid #0C1E33",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "'Poppins', sans-serif",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#0C1E33")}
                        >
                          <span>Dossier</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. STAFF INTELLIGENCE TAB                                      */}
      {/* ============================================================== */}
      {subtab === "staff" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
          {/* Top 4 Pastel Summary Cards */}
          {loading || refreshing || isSwitching ? (
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
              {/* Card 1: Total Staff (Pastel Violet) */}
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
                    TOTAL STAFF
                  </span>
                  <Briefcase size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {staff.length > 0 ? staff.length : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                    Active administrative & support
                  </span>
                  <div
                    onClick={() => {
                      setStaffSearch("");
                      setStaffDeptFilter("all");
                      setStaffTypeFilter("all");
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

              {/* Card 2: Full-Time Employees (Pastel Mint Green) */}
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
                    FULL-TIME STAFF
                  </span>
                  <UserCheck size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {staffFullTimeCount > 0 ? staffFullTimeCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                    Regular operational shift
                  </span>
                  <div
                    onClick={() => setStaffTypeFilter("full")}
                    style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                      Full-Time
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#305E26" }} />
                  </div>
                </div>
              </div>

              {/* Card 3: Active On Duty (Pastel Sky Blue) */}
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
                    ACTIVE ON DUTY
                  </span>
                  <CheckCircle2 size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {staffActiveCount > 0 ? staffActiveCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                    Operational roster standing
                  </span>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                      On Duty
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
                  </div>
                </div>
              </div>

              {/* Card 4: Departments Covered (Pastel Warm Coral) */}
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
                    DEPARTMENTS COVERED
                  </span>
                  <Building2 size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {staffDeptsCount > 0 ? staffDeptsCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                    Administrative & campus wings
                  </span>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                      Wings
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#82401E" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Directory Card with Heading, Filters, and Alternating Table */}
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
                  Support Staff & Operations Directory
                </h2>
                <div style={{ display: "inline-flex", padding: "3px 9px", background: "#F4F6F7", borderRadius: "100px" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "10px", color: "#586C82" }}>
                    {staff.length > 0 ? staff.length : "-"} Total
                  </span>
                </div>
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "11px", color: "#586C82" }}>
                Showing {filteredStaff.length} of {staff.length} staff members
              </div>
            </div>

            {/* Filter Controls */}
            <div
              className="edops-staff-directory-controls"
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 24px 20px",
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
                  placeholder="Search staff by name, email, department, designation..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "12px",
                    color: "#0C1E33",
                  }}
                />
                {staffSearch && (
                  <button
                    type="button"
                    onClick={() => setStaffSearch("")}
                    style={{ all: "unset", cursor: "pointer", display: "flex", color: "#7B8999" }}
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
                  width: "170px",
                  height: "42px",
                  border: "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: "#FFFFFF",
                  position: "relative",
                }}
              >
                <select
                  value={staffDeptFilter}
                  onChange={(e) => setStaffDeptFilter(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "12px",
                    color: "#0C1E33",
                    cursor: "pointer",
                    appearance: "none",
                    paddingRight: "20px",
                  }}
                >
                  <option value="all">All Departments</option>
                  {staffDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: "#586C82", pointerEvents: "none" }} />
              </div>

              {/* Employment Type Dropdown */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  padding: "0px 14px",
                  width: "170px",
                  height: "42px",
                  border: "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: "#FFFFFF",
                  position: "relative",
                }}
              >
                <select
                  value={staffTypeFilter}
                  onChange={(e) => setStaffTypeFilter(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "12px",
                    color: "#0C1E33",
                    cursor: "pointer",
                    appearance: "none",
                    paddingRight: "20px",
                  }}
                >
                  <option value="all">Employment: All</option>
                  <option value="full">Full-Time</option>
                  <option value="part">Part-Time</option>
                  <option value="contract">Contract</option>
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: "#586C82", pointerEvents: "none" }} />
              </div>

              {(staffSearch || staffDeptFilter !== "all" || staffTypeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setStaffSearch("");
                    setStaffDeptFilter("all");
                    setStaffTypeFilter("all");
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
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Staff Segment Quick Filters */}
            <div
              className="edops-staff-segments"
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 24px 16px",
                gap: "8px",
                width: "100%",
                overflowX: "auto",
              }}
            >
              {[
                { id: "all", label: "All Staff" },
                { id: "admin", label: "Administration" },
                { id: "operations", label: "Operations & Support" },
                { id: "full", label: "Full-Time Staff" },
                { id: "active", label: "Active Status" },
              ].map((seg) => {
                const isSegActive = staffSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setStaffSegment(seg.id as any)}
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
                      letterSpacing: "-0.005em",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#E9EEF4";
                        e.currentTarget.style.color = "#0C1E33";
                        e.currentTarget.style.borderColor = "#CBD5E1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#F4F6F8";
                        e.currentTarget.style.color = "#5A6B7D";
                        e.currentTarget.style.borderColor = "#E2E8F0";
                      }
                    }}
                  >
                    <span>{seg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Staff Table Area */}
            <div className="edops-staff-directory-table" style={{ width: "100%", padding: "0px 24px", boxSizing: "border-box" }}>
              {/* Column headings */}
              <div
                className="edops-staff-directory-heading"
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 8px",
                  width: "100%",
                  height: "44px",
                  borderBottom: "1px solid #E0E5EB",
                  userSelect: "none",
                }}
              >
                <div style={{ flex: "2.4 1 200px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  STAFF MEMBER & EMAIL
                </div>
                <div style={{ flex: "1.3 1 120px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  EMPLOYEE ID
                </div>
                <div style={{ flex: "1.3 1 120px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  DEPARTMENT
                </div>
                <div style={{ flex: "1.3 1 120px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  DESIGNATION
                </div>
                <div style={{ flex: "1.1 1 110px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  PHONE
                </div>
                <div style={{ flex: "1.1 1 90px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  STATUS
                </div>
                <div style={{ flex: "0 0 110px", textAlign: "right", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  ACTIONS
                </div>
              </div>

              {/* Staff rows */}
              {loading || refreshing || isSwitching ? (
                <TeacherSkeletonRows rows={6} />
              ) : filteredStaff.length === 0 ? (
                <NoResultState
                  title={
                    staffSearch || staffDeptFilter !== "all" || staffTypeFilter !== "all" || staffSegment !== "all"
                      ? "No Staff Personnel Found"
                      : "No Operational Staff Recorded"
                  }
                  description={
                    staffSearch
                      ? `No staff members match "${staffSearch}".`
                      : staffDeptFilter !== "all" || staffTypeFilter !== "all" || staffSegment !== "all"
                        ? "No staff personnel match the selected department, employment type, or segment filters."
                        : "No non-teaching or operational staff records exist for this school campus yet."
                  }
                  onReset={
                    staffSearch || staffDeptFilter !== "all" || staffTypeFilter !== "all" || staffSegment !== "all"
                      ? () => {
                        setStaffSearch("");
                        setStaffDeptFilter("all");
                        setStaffTypeFilter("all");
                        setStaffSegment("all");
                      }
                      : undefined
                  }
                />
              ) : (
                filteredStaff.map((s, idx) => {
                  const isEven = idx % 2 === 0;
                  const st = (s.status || "Active").toLowerCase();
                  const isPending = st.includes("pend");
                  const empDisplay = s.empId || "EMP-" + (s.id ? s.id.slice(0, 6).toUpperCase() : "STAFF");

                  return (
                    <div
                      key={s.id}
                      className="edops-staff-directory-row"
                      onClick={() => {
                        setSelectedStaff(s);
                        setStaff360Tab("personal");
                      }}
                      style={{
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: "0 8px",
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
                      {/* Identity */}
                      <div
                        style={{
                          flex: "2.4 1 200px",
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          padding: "0px",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
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
                            src={getStudentAvatarUrl(s.name, s.email || s.empId)}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "flex-start",
                            padding: "0px",
                            gap: "1px",
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
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
                              maxWidth: "100%",
                            }}
                            title={s.name}
                          >
                            {s.name || "—"}
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
                              maxWidth: "100%",
                            }}
                            title={s.email || `${(s.name || "staff").toLowerCase().replace(/[^a-z0-9]/g, "")}@staff.edops.edu`}
                          >
                            {s.email || `${(s.name || "staff").toLowerCase().replace(/[^a-z0-9]/g, "")}@staff.edops.edu`}
                          </span>
                        </div>
                      </div>

                      {/* Employee ID */}
                      <div
                        style={{
                          flex: "1.3 1 120px",
                          minWidth: 0,
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "12px",
                          color: "#0C1E33",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={empDisplay}
                      >
                        <span style={{ fontFamily: "monospace", fontSize: "11px", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", border: "1px solid #E2E8F0", color: "#334155" }}>
                          {empDisplay}
                        </span>
                      </div>

                      {/* Department */}
                      <div
                        style={{
                          flex: "1.3 1 120px",
                          minWidth: 0,
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "12.5px",
                          fontWeight: 500,
                          color: "#0C1E33",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={s.department || "—"}
                      >
                        {s.department || "—"}
                      </div>

                      {/* Designation */}
                      <div
                        style={{
                          flex: "1.3 1 120px",
                          minWidth: 0,
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "12px",
                          color: "#495D72",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={s.designation || "—"}
                      >
                        {s.designation || "—"}
                      </div>

                      {/* Phone */}
                      <div
                        style={{
                          flex: "1.1 1 110px",
                          minWidth: 0,
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: "12px",
                          color: "#495D72",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={s.phone || "—"}
                      >
                        {s.phone || "—"}
                      </div>

                      {/* Status */}
                      <div style={{ flex: "1.1 1 90px", minWidth: 0, display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontFamily: "'Poppins', sans-serif",
                            background: isPending ? "#FEF3C7" : st.includes("active") ? "#ECFDF5" : "#F1F5F9",
                            color: isPending ? "#92400E" : st.includes("active") ? "#047857" : "#475569",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isPending ? "Pending" : s.status || "Active"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStaff(s);
                            setStaff360Tab("personal");
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: "#0C1E33",
                            border: "1px solid #0C1E33",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "'Poppins', sans-serif",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#1B3654";
                            e.currentTarget.style.borderColor = "#1B3654";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#0C1E33";
                            e.currentTarget.style.borderColor = "#0C1E33";
                          }}
                        >
                          <span>Dossier</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. PARENTS & M:N MAPPING TAB                                   */}
      {/* ============================================================== */}
      {subtab === "parents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
          {/* Top 4 Pastel Summary Cards */}
          {loading || refreshing || isSwitching ? (
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
              {/* Card 1: Mapped Guardians (Pastel Violet) */}
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
                    MAPPED GUARDIANS
                  </span>
                  <HeartHandshake size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {parents.length > 0 ? parents.length : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                    Registered parent/guardian accounts
                  </span>
                  <div
                    onClick={() => {
                      setParentSearch("");
                      setParentStatusFilter("all");
                      setParentRelFilter("all");
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

              {/* Card 2: Verified Contacts (Pastel Mint Green) */}
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
                    VERIFIED CONTACTS
                  </span>
                  <Phone size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {parentsVerifiedCount > 0 ? parentsVerifiedCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                    Mobile phones verified for SMS
                  </span>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                      Verified
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#305E26" }} />
                  </div>
                </div>
              </div>

              {/* Card 3: Linked Wards (Pastel Sky Blue) */}
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
                    LINKED WARDS
                  </span>
                  <Users size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {parentsWardsCount > 0 ? parentsWardsCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                    Total enrolled student linkages
                  </span>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                      Linkages
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
                  </div>
                </div>
              </div>

              {/* Card 4: Invites Accepted (Pastel Warm Coral) */}
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
                    INVITATIONS ACCEPTED
                  </span>
                  <Send size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {parentsAcceptedCount > 0 ? parentsAcceptedCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                    Encrypted token activations
                  </span>
                  <div
                    onClick={() => setParentStatusFilter("accepted")}
                    style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                      Active
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#82401E" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Directory Card with Heading, Filters, and Alternating Table */}
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
                  Guardians & Student Mappings
                </h2>
                <div style={{ display: "inline-flex", padding: "3px 9px", background: "#F4F6F7", borderRadius: "100px" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "10px", color: "#586C82" }}>
                    {parents.length > 0 ? parents.length : "-"} Total
                  </span>
                </div>
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "11px", color: "#586C82" }}>
                Showing {filteredParents.length} of {parents.length} guardians
              </div>
            </div>

            {/* Filter Controls */}
            <div
              className="edops-parent-directory-controls"
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 24px 20px",
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
                  placeholder="Search guardian by name, email, phone, ward name..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "12px",
                    color: "#0C1E33",
                  }}
                />
                {parentSearch && (
                  <button
                    type="button"
                    onClick={() => setParentSearch("")}
                    style={{ all: "unset", cursor: "pointer", display: "flex", color: "#7B8999" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Invitation Status Dropdown */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  padding: "0px 14px",
                  width: "170px",
                  height: "42px",
                  border: "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: "#FFFFFF",
                  position: "relative",
                }}
              >
                <select
                  value={parentStatusFilter}
                  onChange={(e) => setParentStatusFilter(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "12px",
                    color: "#0C1E33",
                    cursor: "pointer",
                    appearance: "none",
                    paddingRight: "20px",
                  }}
                >
                  <option value="all">Status: All</option>
                  <option value="accepted">Accepted</option>
                  <option value="pending">Pending</option>
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: "#586C82", pointerEvents: "none" }} />
              </div>

              {/* Relationship Dropdown */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  padding: "0px 14px",
                  width: "170px",
                  height: "42px",
                  border: "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: "#FFFFFF",
                  position: "relative",
                }}
              >
                <select
                  value={parentRelFilter}
                  onChange={(e) => setParentRelFilter(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "12px",
                    color: "#0C1E33",
                    cursor: "pointer",
                    appearance: "none",
                    paddingRight: "20px",
                  }}
                >
                  <option value="all">Relation: All</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="guardian">Guardian</option>
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: "#586C82", pointerEvents: "none" }} />
              </div>

              {(parentSearch || parentStatusFilter !== "all" || parentRelFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setParentSearch("");
                    setParentStatusFilter("all");
                    setParentRelFilter("all");
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
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Parent Segment Quick Filters */}
            <div
              className="edops-parent-segments"
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 24px 16px",
                gap: "8px",
                width: "100%",
                overflowX: "auto",
              }}
            >
              {[
                { id: "all", label: "All Guardians" },
                { id: "father", label: "Fathers" },
                { id: "mother", label: "Mothers" },
                { id: "accepted", label: "Active (Accepted)" },
                { id: "pending", label: "Pending Invite" },
              ].map((seg) => {
                const isSegActive = parentSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setParentSegment(seg.id as any)}
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
                      letterSpacing: "-0.005em",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#E9EEF4";
                        e.currentTarget.style.color = "#0C1E33";
                        e.currentTarget.style.borderColor = "#CBD5E1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#F4F6F8";
                        e.currentTarget.style.color = "#5A6B7D";
                        e.currentTarget.style.borderColor = "#E2E8F0";
                      }
                    }}
                  >
                    <span>{seg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Parent Table Area */}
            <div className="edops-parent-directory-table" style={{ width: "100%", padding: "0px 24px", boxSizing: "border-box" }}>
              {/* Column headings */}
              <div
                className="edops-parent-directory-heading"
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 8px",
                  width: "100%",
                  height: "44px",
                  borderBottom: "1px solid #E0E5EB",
                  userSelect: "none",
                }}
              >
                <div style={{ flex: "2.4 1 200px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  GUARDIAN & EMAIL
                </div>
                <div style={{ flex: "1.3 1 120px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  CONTACT PHONE
                </div>
                <div style={{ flex: "1.2 1 110px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  RELATIONSHIP
                </div>
                <div style={{ flex: "1.8 1 160px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  LINKED WARDS
                </div>
                <div style={{ flex: "1.1 1 90px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  STATUS
                </div>
                <div style={{ flex: "0 0 110px", textAlign: "right", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  ACTIONS
                </div>
              </div>

              {/* Parent rows */}
              {loading || refreshing || isSwitching ? (
                <TeacherSkeletonRows rows={6} />
              ) : filteredParents.length === 0 ? (
                <NoResultState
                  title={
                    parentSearch || parentStatusFilter !== "all" || parentRelFilter !== "all" || parentSegment !== "all"
                      ? "No Guardian Profiles Found"
                      : "No Parent Records Registered"
                  }
                  description={
                    parentSearch
                      ? `No guardian profiles match "${parentSearch}".`
                      : parentStatusFilter !== "all" || parentRelFilter !== "all" || parentSegment !== "all"
                        ? "No guardians match the selected invitation status, relationship, or segment filters."
                        : "No parent or guardian records have been registered for this school campus yet."
                  }
                  onReset={
                    parentSearch || parentStatusFilter !== "all" || parentRelFilter !== "all" || parentSegment !== "all"
                      ? () => {
                        setParentSearch("");
                        setParentStatusFilter("all");
                        setParentRelFilter("all");
                        setParentSegment("all");
                      }
                      : undefined
                  }
                />
              ) : (
                filteredParents.map((p, idx) => {
                  const isEven = idx % 2 === 0;
                  const st = (p.invitationStatus || p.accountStatus || "Accepted").toLowerCase();
                  const isPending = st.includes("pend");

                  return (
                    <div
                      key={p.id}
                      className="edops-parent-directory-row"
                      onClick={() => {
                        setSelectedParent(p);
                        setParent360Tab("wards");
                        setIsMappingWards(false);
                      }}
                      style={{
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: "0 8px",
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
                      {/* Identity */}
                      <div
                        style={{
                          flex: "2.4 1 200px",
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          padding: "0px",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
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
                            src={getStudentAvatarUrl(p.name, p.mobile || p.email)}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "flex-start",
                            padding: "0px",
                            gap: "1px",
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
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
                              maxWidth: "100%",
                            }}
                            title={p.name}
                          >
                            {p.name || "—"}
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
                              maxWidth: "100%",
                            }}
                            title={p.email || `${(p.name || "parent").toLowerCase().replace(/[^a-z0-9]/g, "")}@guardian.edops.edu`}
                          >
                            {p.email || `${(p.name || "parent").toLowerCase().replace(/[^a-z0-9]/g, "")}@guardian.edops.edu`}
                          </span>
                        </div>
                      </div>

                      {/* Contact Phone & Occupation */}
                      <div
                        style={{
                          flex: "1.3 1 120px",
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px",
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "12.5px",
                            fontWeight: 500,
                            color: "#0C1E33",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={p.mobile || "—"}
                        >
                          {p.mobile || "—"}
                        </span>
                        {p.occupation && (
                          <span
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: "11px",
                              color: "#64748B",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={p.occupation}
                          >
                            {p.occupation}
                          </span>
                        )}
                      </div>

                      {/* Relationship */}
                      <div style={{ flex: "1.2 1 110px", minWidth: 0, display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            background: "#F1F5F9",
                            border: "1px solid #E2E8F0",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: "#0C1E33",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.relationship || "Guardian"}
                        </span>
                      </div>

                      {/* Linked Wards */}
                      <div style={{ flex: "1.8 1 170px", minWidth: 0, display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap", overflow: "hidden" }}>
                        {p.children && p.children.length > 0 ? (
                          <>
                            {p.children.map((ch: any, cIdx: number) => (
                              <span
                                key={cIdx}
                                style={{
                                  background: "#FFFFFF",
                                  border: "1px solid #E2E8F0",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  color: "#0C1E33",
                                  whiteSpace: "nowrap",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <b>{ch.studentName || ch.name}</b>
                                {ch.grade && <span style={{ fontSize: "10px", color: "#64748B" }}>({ch.grade})</span>}
                              </span>
                            ))}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedParent(p);
                                setParent360Tab("wards");
                                handleStartMappingWards(p);
                              }}
                              style={{
                                border: "none",
                                background: "none",
                                padding: "2px",
                                cursor: "pointer",
                                color: "#0C1E33",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                              title="Edit linked student wards"
                            >
                              <Edit2 size={11} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedParent(p);
                              setParent360Tab("wards");
                              handleStartMappingWards(p);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              border: "1px dashed #94A3B8",
                              background: "#F8FAFC",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#0C1E33",
                              cursor: "pointer",
                            }}
                            title="Link students to this guardian"
                          >
                            <Plus size={11} />
                            <span>Link Ward</span>
                          </button>
                        )}
                      </div>

                      {/* Status */}
                      <div style={{ flex: "1.1 1 90px", minWidth: 0, display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontFamily: "'Poppins', sans-serif",
                            background: isPending ? "#FEF3C7" : "#ECFDF5",
                            color: isPending ? "#92400E" : "#047857",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isPending ? "Pending" : "Accepted"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParent(p);
                            setParent360Tab("wards");
                            setIsMappingWards(false);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: "#0C1E33",
                            border: "1px solid #0C1E33",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "'Poppins', sans-serif",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#1B3654";
                            e.currentTarget.style.borderColor = "#1B3654";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#0C1E33";
                            e.currentTarget.style.borderColor = "#0C1E33";
                          }}
                        >
                          <span>Dossier</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. DEPARTMENTS TAB                                             */}
      {/* ============================================================== */}
      {subtab === "departments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "'Poppins', sans-serif" }}>
          {/* Top 4 Pastel Summary Cards */}
          {loading || refreshing || isSwitching ? (
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
              {/* Card 1: Academic Departments (Pastel Violet) */}
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
                    ACADEMIC DEPARTMENTS
                  </span>
                  <Building2 size={19} strokeWidth={1.8} style={{ color: "#51249A" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {departments.length > 0 ? departments.length : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#51249A" }}>
                    Chartered discipline units
                  </span>
                  <div
                    onClick={() => {
                      setDeptSearch("");
                      setDeptStatusFilter("all");
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

              {/* Card 2: Mapped Subjects (Pastel Mint Green) */}
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
                    MAPPED SUBJECTS
                  </span>
                  <BookOpen size={19} strokeWidth={1.8} style={{ color: "#305E26" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {deptSubjectsCount > 0 ? deptSubjectsCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                    Curriculum syllabus courses
                  </span>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#305E26" }}>
                      Courses
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#305E26" }} />
                  </div>
                </div>
              </div>

              {/* Card 3: Affiliated Faculty (Pastel Sky Blue) */}
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
                    AFFILIATED FACULTY
                  </span>
                  <GraduationCap size={19} strokeWidth={1.8} style={{ color: "#265F79" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {deptFacultyCount > 0 ? deptFacultyCount : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                    Instructors assigned to departments
                  </span>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#265F79" }}>
                      Affiliated
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#265F79" }} />
                  </div>
                </div>
              </div>

              {/* Card 4: Avg Syllabus Progress (Pastel Warm Coral) */}
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
                    AVG SYLLABUS PROGRESS
                  </span>
                  <Award size={19} strokeWidth={1.8} style={{ color: "#82401E" }} />
                </div>
                <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "34px", lineHeight: "115%", color: "#0C1E33" }}>
                  {deptAvgProgress > 0 ? `${deptAvgProgress}%` : "-"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "100%" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                    Overall curriculum completion
                  </span>
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "150%", color: "#82401E" }}>
                      Curriculum
                    </span>
                    <ArrowRight size={14} strokeWidth={1.8} style={{ color: "#82401E" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Directory Card with Heading, Filters, and Alternating Table */}
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
                  Academic Units & Discipline Operations
                </h2>
                <div style={{ display: "inline-flex", padding: "3px 9px", background: "#F4F6F7", borderRadius: "100px" }}>
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: "10px", color: "#586C82" }}>
                    {departments.length > 0 ? departments.length : "-"} Total
                  </span>
                </div>
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400, fontSize: "11px", color: "#586C82" }}>
                Showing {filteredDepartments.length} of {departments.length} departments
              </div>
            </div>

            {/* Filter Controls */}
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 24px 20px",
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
                  placeholder="Search department by name, code, HOD name..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "12px",
                    color: "#0C1E33",
                  }}
                />
                {deptSearch && (
                  <button
                    type="button"
                    onClick={() => setDeptSearch("")}
                    style={{ all: "unset", cursor: "pointer", display: "flex", color: "#7B8999" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Dropdown */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  padding: "0px 14px",
                  width: "170px",
                  height: "42px",
                  border: "1px solid #E0E5EB",
                  borderRadius: "6px",
                  background: "#FFFFFF",
                  position: "relative",
                }}
              >
                <select
                  value={deptStatusFilter}
                  onChange={(e) => setDeptStatusFilter(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: "12px",
                    color: "#0C1E33",
                    cursor: "pointer",
                    appearance: "none",
                    paddingRight: "20px",
                  }}
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "12px", color: "#586C82", pointerEvents: "none" }} />
              </div>

              {(deptSearch || deptStatusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setDeptSearch("");
                    setDeptStatusFilter("all");
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
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Academic Department Segment Quick Filters */}
            <div
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px 24px 16px",
                gap: "8px",
                width: "100%",
                overflowX: "auto",
              }}
            >
              {[
                { id: "all", label: "All Departments" },
                { id: "active", label: "Active Units" },
                { id: "with_faculty", label: "With Assigned Faculty" },
                { id: "with_subjects", label: "With Mapped Subjects" },
              ].map((seg) => {
                const isSegActive = deptSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setDeptSegment(seg.id as any)}
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
                      letterSpacing: "-0.005em",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#E9EEF4";
                        e.currentTarget.style.color = "#0C1E33";
                        e.currentTarget.style.borderColor = "#CBD5E1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSegActive) {
                        e.currentTarget.style.background = "#F4F6F8";
                        e.currentTarget.style.color = "#5A6B7D";
                        e.currentTarget.style.borderColor = "#E2E8F0";
                      }
                    }}
                  >
                    <span>{seg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Department Table Area (Fits 100% width, No horizontal scrollbar) */}
            <div style={{ width: "100%", padding: "0px 24px", boxSizing: "border-box" }}>
              {/* Column headings */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 8px",
                  width: "100%",
                  height: "44px",
                  borderBottom: "1px solid #E0E5EB",
                  userSelect: "none",
                }}
              >
                <div style={{ flex: "2.4 1 190px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  DEPARTMENT & CODE
                </div>
                <div style={{ flex: "2.1 1 170px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  HEAD OF DEPARTMENT
                </div>
                <div style={{ flex: "2.1 1 170px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  CURRICULUM SUBJECTS
                </div>
                <div style={{ flex: "1.2 1 100px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  FACULTY
                </div>
                <div style={{ flex: "1.2 1 100px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  STUDENT LOAD
                </div>
                <div style={{ flex: "1.0 1 85px", minWidth: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  STATUS
                </div>
                <div style={{ flex: "0 0 110px", textAlign: "right", fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "10px", lineHeight: "15px", color: "#586C82", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  ACTIONS
                </div>
              </div>

              {/* Department rows */}
              {loading || refreshing || isSwitching ? (
                <TeacherSkeletonRows rows={6} />
              ) : filteredDepartments.length === 0 ? (
                <NoResultState
                  title={
                    deptSearch || deptStatusFilter !== "all" || deptSegment !== "all"
                      ? "No Academic Units Found"
                      : "No Academic Departments Configured"
                  }
                  description={
                    deptSearch
                      ? `No academic department matches "${deptSearch}".`
                      : deptStatusFilter !== "all" || deptSegment !== "all"
                        ? "No academic departments match the selected operational status or unit filters."
                        : "No academic units or departments have been configured for this institution yet."
                  }
                  onReset={
                    deptSearch || deptStatusFilter !== "all" || deptSegment !== "all"
                      ? () => {
                        setDeptSearch("");
                        setDeptStatusFilter("all");
                        setDeptSegment("all");
                      }
                      : undefined
                  }
                />
              ) : (
                filteredDepartments.map((d, idx) => {
                  const isEven = idx % 2 === 0;
                  const subjectsList = d.subjects || [];

                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDept(d);
                        setDept360Tab("overview");
                      }}
                      style={{
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: "0 8px",
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
                      {/* Department & Code */}
                      <div
                        style={{
                          flex: "2.4 1 190px",
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "1px",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 650,
                              fontSize: "13px",
                              color: "#0C1E33",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={d.name}
                          >
                            {d.name || "—"}
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", background: "#F1F5F9", color: "#0C1E33", border: "1px solid #E2E8F0", fontFamily: "monospace" }}>
                            {d.code || "—"}
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {d.location || "Central Campus Wing"}
                        </span>
                      </div>

                      {/* Head of Department */}
                      <div
                        style={{
                          flex: "2.1 1 170px",
                          minWidth: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
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
                            src={getStudentAvatarUrl(d.headName || d.name, d.headEmail || d.code)}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, gap: "1px" }}>
                          <span style={{ fontWeight: 600, color: "#0C1E33", fontSize: "12.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={d.headName || "Unassigned"}>
                            {d.headName && d.headName !== "Department Head" ? d.headName : "Unassigned"}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={d.headEmail || "No contact email on file"}>
                            {d.headEmail ? d.headEmail : (d.headName && d.headName !== "Unassigned" && d.headName !== "Department Head" ? "No email on file" : "Not assigned")}
                          </span>
                        </div>
                      </div>

                      {/* Curriculum Subjects */}
                      <div style={{ flex: "2.1 1 170px", minWidth: 0, display: "flex", gap: "4px", alignItems: "center", overflow: "hidden" }}>
                        {subjectsList.length > 0 ? (
                          <>
                            {subjectsList.slice(0, 2).map((s: any) => (
                              <span
                                key={s.id}
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  background: "#FFFFFF",
                                  color: "#0C1E33",
                                  fontWeight: 500,
                                  border: "1px solid #E2E8F0",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "100px",
                                }}
                                title={s.name}
                              >
                                {s.name}
                              </span>
                            ))}
                            {subjectsList.length > 2 && (
                              <span style={{ fontSize: "10.5px", padding: "1px 6px", borderRadius: "4px", background: "#F1F5F9", color: "#475569", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                                +{subjectsList.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: "11.5px", color: "#94A3B8" }}>None Mapped</span>
                        )}
                      </div>

                      {/* Faculty Count */}
                      <div style={{ flex: "1.2 1 100px", minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
                        <span style={{ fontWeight: 600, fontSize: "12.5px", color: "#0C1E33" }}>
                          {d.teachersCount != null ? `${d.teachersCount} ${d.teachersCount === 1 ? "Instructor" : "Instructors"}` : "0 Instructors"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748B" }}>
                          Teaching Staff
                        </span>
                      </div>

                      {/* Student Load */}
                      <div style={{ flex: "1.2 1 100px", minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
                        <span style={{ fontWeight: 600, fontSize: "12.5px", color: "#0C1E33" }}>
                          {d.studentsCount != null ? `${d.studentsCount} Students` : "0 Students"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748B" }}>
                          Total Enrolled
                        </span>
                      </div>

                      {/* Status */}
                      <div style={{ flex: "1.0 1 85px", minWidth: 0, display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: (d.status || "").toLowerCase().includes("pend") ? "#FEF3C7" : "#ECFDF5",
                            color: (d.status || "").toLowerCase().includes("pend") ? "#92400E" : "#047857",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.status || "Active"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDept(d);
                            setDept360Tab("overview");
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            background: "#0C1E33",
                            border: "1px solid #0C1E33",
                            color: "#FFFFFF",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "'Poppins', sans-serif",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#1B3654";
                            e.currentTarget.style.borderColor = "#1B3654";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#0C1E33";
                            e.currentTarget.style.borderColor = "#0C1E33";
                          }}
                        >
                          <span>Dossier</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STUDENT 360° PROFILE DRAWER (: Minimalist Right-Side Panel)   */}
      {/* ============================================================== */}
      {selectedStudent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            animation: "edopsFadeIn 0.15s ease-out",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedStudent(null);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Student Profile - ${selectedStudent.name}`}
            style={{
              width: "var(--edops-drawer-width)",
              maxWidth: "100vw",
              height: "100vh",
              background: "#FFFFFF",
              boxShadow: "-8px 0 32px rgba(12, 30, 51, 0.14)",
              display: "flex",
              flexDirection: "column",
              animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
              zIndex: 1001,
              borderLeft: "1px solid #E2E8F0",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header: Clean, minimalist with breadcrumb & close */}
            <div
              style={{
                padding: "18px 24px 14px",
                borderBottom: "1px solid #E2E8F0",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, letterSpacing: "0.02em" }}>
                  Student Dossier · #{selectedStudent.admissionNo || selectedStudent.rollNo || "-"}
                </span>

                <button
                  onClick={() => setSelectedStudent(null)}
                  title="Close (Esc)"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F1F5F9";
                    e.currentTarget.style.color = "#0C1E33";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Profile identity */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={selectedStudent.photoUrl || selectedStudent.avatarUrl || getStudentAvatarUrl(selectedStudent.name, selectedStudent.admissionNo || selectedStudent.rollNo)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: 600,
                        color: "#0C1E33",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedStudent.name || "-"}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "3px",
                      fontSize: "12px",
                      color: "#64748B",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      Class {selectedStudent.grade || "-"} ({selectedStudent.section || "-"})
                    </span>
                    <span>·</span>
                    <span>Roll #{selectedStudent.rollNo || "-"}</span>
                    <span>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} style={{ color: "#94A3B8" }} />
                      {selectedStudent.email ||
                        selectedStudent.studentEmail ||
                        `${(selectedStudent.name || "student").toLowerCase().replace(/[^a-z0-9]/g, "")}@student.edops.edu`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Underline Tab Navigation */}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                background: "#FFFFFF",
                borderBottom: "1px solid #E2E8F0",
                padding: "0 20px",
                scrollbarWidth: "none",
                flexShrink: 0,
              }}
            >
              {[
                { id: "personal", label: "Personal", icon: User },
                { id: "academic", label: "Academic", icon: BookOpen },
                { id: "parents", label: "Parents", icon: HeartHandshake },
                { id: "attendance", label: "Attendance", icon: Calendar },
                { id: "assignments", label: "Assignments", icon: FileText },
                { id: "exams", label: "Exams", icon: Award },
                { id: "results", label: "Results", icon: Award },
                { id: "fees", label: "Fees", icon: CreditCard },
                { id: "leave", label: "Leave", icon: Clock },
                { id: "discipline", label: "Discipline", icon: ShieldAlert },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "communication", label: "Communication", icon: Send },
                { id: "activity", label: "Audit Log", icon: Clock },
              ].map((tab) => {
                const isActive = student360Tab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStudent360Tab(tab.id as any)}
                    style={{
                      boxSizing: "border-box",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 11px",
                      fontSize: "12.5px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: isActive ? 600 : 500,
                      background: "transparent",
                      color: isActive ? "#0C1E33" : "#64748B",
                      border: "none",
                      borderBottom: isActive ? "2px solid #0C1E33" : "2px solid transparent",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#0C1E33";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#64748B";
                    }}
                  >
                    <TabIcon size={13} style={{ flexShrink: 0 }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Tab Body: Minimalist and Real Data Only */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* TAB: PERSONAL */}
              {student360Tab === "personal" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Identity Details */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <User size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Personal Details</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Full Name</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.name || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Admission Number</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.admissionNo || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Roll Number</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          #{selectedStudent.rollNo || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Class & Section</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          Grade {selectedStudent.grade || "-"} ({selectedStudent.section || "-"})
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Date of Birth</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.dob || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Gender</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.gender || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Blood Group</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.bloodGroup || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>House / Cohort</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.house || "-"}
                        </div>
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Residential Address</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.address || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guardian & Contact Information */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <Phone size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Guardian & Contacts</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Primary Guardian</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.parentName || selectedStudent.guardianName || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Guardian Phone</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.parentPhone || selectedStudent.guardianPhone || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Emergency Contact</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.emergencyContact || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Student Portal Email</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.email || selectedStudent.studentEmail || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ACADEMIC */}
              {student360Tab === "academic" && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                    <BookOpen size={14} style={{ color: "#475569" }} />
                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Academic Standing</h4>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Enrolled Grade</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                        Grade {selectedStudent.grade || "-"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Section</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                        Section {selectedStudent.section || "-"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Academic Status</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                        {selectedStudent.academicStatus || "-"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Cumulative GPA</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                        {selectedStudent.gpa != null ? selectedStudent.gpa : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PARENTS */}
              {student360Tab === "parents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0C1E33", marginBottom: "12px" }}>
                      Primary Guardian on Record
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Guardian Name</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.parentName || selectedStudent.guardianName || "-"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Phone Number</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.parentPhone || selectedStudent.guardianPhone || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0C1E33", marginBottom: "12px" }}>
                      Linked Parent Portal Accounts ({studentParents.length})
                    </div>
                    {studentParents.length === 0 ? (
                      <StudentProfileEmptyState
                        title="No Linked Parent Accounts"
                        description={`No parent portal accounts are currently mapped to ${selectedStudent.name}. Mappings can be assigned from the Parents & Mappings tab.`}
                      />
                    ) : (
                      <div style={{ display: "grid", gap: "8px" }}>
                        {studentParents.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #E2E8F0",
                              borderRadius: "6px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "#F8FAFC",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "13px", color: "#0C1E33" }}>{p.name || "-"}</div>
                              <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                                {p.email || "-"} · {p.mobile || "-"}
                              </div>
                            </div>
                            <span style={{ fontSize: "11px", padding: "2px 8px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "4px", color: "#475569" }}>
                              {p.relationship || "Guardian"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: ATTENDANCE */}
              {student360Tab === "attendance" && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                    <Calendar size={14} style={{ color: "#475569" }} />
                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Attendance Record</h4>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Term Rate</div>
                      <div style={{ fontSize: "18px", color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                        {selectedStudent.attendancePct != null ? `${selectedStudent.attendancePct}%` : "-"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Statutory Status</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "4px" }}>
                        {selectedStudent.attendancePct != null
                          ? selectedStudent.attendancePct >= 75
                            ? "Meets threshold (≥ 75%)"
                            : "Below threshold (< 75%)"
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: FEES */}
              {student360Tab === "fees" && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                    <CreditCard size={14} style={{ color: "#475569" }} />
                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Fee Status</h4>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Fee Status</div>
                      <div style={{ fontSize: "14px", color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                        {selectedStudent.feeStatus || "-"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Outstanding Balance</div>
                      <div style={{ fontSize: "14px", color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                        {selectedStudent.feeStatus === "Paid" ? "₹0.00" : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ASSIGNMENTS */}
              {student360Tab === "assignments" && (
                <div>
                  {student360Dossier?.assignments && student360Dossier.assignments.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.assignments.map((asg: any) => (
                        <div key={asg.id} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{asg.title}</div>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>Subject: {asg.subject || "Coursework"} · Due: {asg.dueDate ? String(asg.dueDate).split('T')[0] : "Assigned Term"}</span>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", background: "#ECFDF5", color: "#047857" }}>
                            {asg.status || "Submitted"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Coursework Submissions"
                      description={`No homework assignments or graded tasks have been filed for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 6 & 7: EXAMS & RESULTS */}
              {(student360Tab === "exams" || student360Tab === "results") && (
                <div>
                  {student360Dossier?.exams && student360Dossier.exams.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.exams.map((res: any, idx: number) => (
                        <div key={idx} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{res.examTitle || res.title || "Term Examination"}</div>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>Subject: {res.subject || "All Subjects"} · Term: {res.term || "Session"}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C1E33" }}>{res.score || res.marks || "—"}</div>
                            <span style={{ fontSize: "10.5px", color: "#64748B" }}>Grade: {res.grade || "A"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title={student360Tab === "exams" ? "No Examination Records" : "No Published Results"}
                      description={student360Tab === "exams" ? `No scheduled examinations or halls allocated to ${selectedStudent.name}.` : `Scorecards and transcripts have not been published for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 8: LEAVE */}
              {student360Tab === "leave" && (
                <div>
                  {student360Dossier?.leave && student360Dossier.leave.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.leave.map((l: any) => (
                        <div key={l.id} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{l.leaveType} ({l.daysCount} Day{l.daysCount > 1 ? 's' : ''})</div>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>{l.startDate} to {l.endDate} · {l.reason}</span>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", background: l.status === 'approved' ? '#ECFDF5' : l.status === 'rejected' ? '#FEF2F2' : '#FEF3C7', color: l.status === 'approved' ? '#047857' : l.status === 'rejected' ? '#DC2626' : '#92400E' }}>
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Leave Records"
                      description={`No leave applications on file for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 9: DISCIPLINE */}
              {student360Tab === "discipline" && (
                <div>
                  {student360Dossier?.discipline && student360Dossier.discipline.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.discipline.map((d: any, idx: number) => (
                        <div key={idx} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#DC2626" }}>{d.incidentCode} · {d.incidentType}</span>
                            <div style={{ fontSize: "12.5px", color: "#0C1E33", marginTop: "2px" }}>{d.description}</div>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>Action: {d.actionTaken || "Recorded"}</span>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", background: "#F1F5F9", color: "#475569" }}>
                            {d.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="Clean Disciplinary Record"
                      description={`No behavioral infractions or disciplinary notices logged for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 10: DOCUMENTS */}
              {student360Tab === "documents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { title: "CBSE Official Enrollment & Admission Record", type: "Admission Dossier", date: "Verified" },
                    { title: "Bonafide Student Certificate", type: "Institutional Certificate", date: "Available" },
                    { title: "Term Assessment Consolidated Transcript", type: "Academic Transcript", date: "Official" },
                  ].map((doc, idx) => (
                    <div key={idx} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{doc.title}</div>
                        <span style={{ fontSize: "11px", color: "#64748B" }}>{doc.type} · Certified Official Record</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert(`Accessing certified record: ${doc.title}`)}
                        style={{ padding: "6px 12px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "11px", fontWeight: 600, color: "#0C1E33", cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                      >
                        View / Download
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 11: COMMUNICATION */}
              {student360Tab === "communication" && (
                <div>
                  {student360Dossier?.communication && student360Dossier.communication.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.communication.map((com: any, idx: number) => (
                        <div key={idx} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{com.title}</div>
                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "#F1F5F9", color: "#475569", textTransform: "uppercase" }}>
                              {com.priority || "Normal"}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569" }}>{com.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Communication Dispatches"
                      description={`No direct notices or broadcasts delivered to ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 12: ACTIVITY / AUDIT LOGS */}
              {student360Tab === "activity" && (
                <div>
                  {student360Dossier?.activity && student360Dossier.activity.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.activity.map((act: any, idx: number) => {
                        const eventDate = act.createdAt
                          ? new Date(act.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "Recent";
                        const actionName = (act.action || "activity.logged").replace(/[._]/g, " ").toUpperCase();

                        return (
                          <div
                            key={act.id || idx}
                            style={{
                              padding: "14px 16px",
                              background: "#FFFFFF",
                              border: "1px solid #E2E8F0",
                              borderRadius: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  background: "#F1F5F9",
                                  color: "#0C1E33",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {actionName}
                              </span>
                              <span style={{ fontSize: "11.5px", color: "#64748B", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Clock size={12} />
                                {eventDate}
                              </span>
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ color: "#64748B" }}>Initiated by:</span>
                              <span style={{ fontWeight: 600, color: "#0C1E33" }}>{act.actorName || "System Actor"}</span>
                            </div>
                            {act.details && Object.keys(act.details).length > 0 && (
                              <div
                                style={{
                                  marginTop: "2px",
                                  padding: "8px 10px",
                                  background: "#F8FAFC",
                                  border: "1px solid #F1F5F9",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  color: "#475569",
                                  fontFamily: "monospace",
                                  wordBreak: "break-word",
                                }}
                              >
                                {typeof act.details === "string" ? act.details : JSON.stringify(act.details, null, 2)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Audit Modifications"
                      description={`No security profile edits or credential modifications logged for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div
              style={{
                padding: "12px 24px",
                background: "#FFFFFF",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Admission #{selectedStudent.admissionNo || "-"} · Class {selectedStudent.grade || "-"} ({selectedStudent.section || "-"})
              </span>

              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  padding: "6px 16px",
                  background: "#F1F5F9",
                  color: "#0C1E33",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}



      {/* ============================================================== */}
      {/* 1. SUPPORT STAFF DOSSIER DRAWER (RIGHT SIDE SLIDE-IN)          */}
      {/* ============================================================== */}
      {selectedStaff && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedStaff(null);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Staff Profile - ${selectedStaff.name}`}
            style={{
              width: "var(--edops-drawer-width)",
              maxWidth: "100vw",
              height: "100vh",
              background: "#FFFFFF",
              boxShadow: "-8px 0 32px rgba(12, 30, 51, 0.14)",
              display: "flex",
              flexDirection: "column",
              animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
              zIndex: 1001,
              borderLeft: "1px solid #E2E8F0",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header: breadcrumb & close */}
            <div
              style={{
                padding: "18px 24px 0",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, letterSpacing: "0.02em" }}>
                  Staff Dossier · #{selectedStaff.empId || selectedStaff.id?.slice(0, 8).toUpperCase() || "-"}
                </span>

                <button
                  onClick={() => setSelectedStaff(null)}
                  title="Close (Esc)"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F1F5F9";
                    e.currentTarget.style.color = "#0C1E33";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Profile identity banner */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={getStudentAvatarUrl(selectedStaff.name, selectedStaff.email || selectedStaff.empId)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: 600,
                        color: "#0C1E33",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedStaff.name || "-"}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "3px",
                      fontSize: "12px",
                      color: "#64748B",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{selectedStaff.designation || "Staff Member"}</span>
                    <span>·</span>
                    <span>{selectedStaff.department || "Operations"}</span>
                    <span>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} style={{ color: "#94A3B8" }} />
                      {selectedStaff.email || `${(selectedStaff.name || "staff").toLowerCase().replace(/[^a-z0-9]/g, "")}@staff.edops.edu`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Underline Tab Navigation */}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                background: "#FFFFFF",
                borderBottom: "1px solid #E2E8F0",
                padding: "0 20px",
                scrollbarWidth: "none",
                flexShrink: 0,
              }}
            >
              {[
                { id: "personal", label: "Personal", icon: User },
                { id: "employment", label: "Employment", icon: Briefcase },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "activity", label: "Audit Log", icon: Clock },
              ].map((tab) => {
                const isActive = staff360Tab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStaff360Tab(tab.id as any)}
                    style={{
                      boxSizing: "border-box",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 12px",
                      fontSize: "12.5px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: isActive ? 600 : 500,
                      background: "transparent",
                      color: isActive ? "#0C1E33" : "#64748B",
                      border: "none",
                      borderBottom: isActive ? "2px solid #0C1E33" : "2px solid transparent",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.12s ease",
                      marginBottom: "-1px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#0C1E33";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#64748B";
                    }}
                  >
                    <TabIcon size={13} style={{ color: isActive ? "#0C1E33" : "#94A3B8" }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                scrollbarWidth: "none",
              }}
            >
              {staff360Tab === "personal" && (
                <>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <User size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Staff Profile & Appointment</h4>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Full Name</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStaff.name || "—"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employee ID</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px", fontFamily: "monospace" }}>
                          {selectedStaff.empId || "EMP-" + (selectedStaff.id ? selectedStaff.id.slice(0, 6).toUpperCase() : "—")}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Department</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStaff.department || "Operations & Support"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Designation</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStaff.designation || "Staff"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employment Type</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStaff.employmentType || "Full-Time Staff"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Joining Date</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStaff.joiningDate || "Active Term"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Operational Status</div>
                        <div style={{ fontSize: "13px", color: (selectedStaff.status || "Active").toLowerCase().includes("pend") ? "#92400E" : "#047857", fontWeight: 600, marginTop: "2px" }}>
                          ● {selectedStaff.status || "Active Duty"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Shift Schedule</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          Standard Campus Shift (08:30 - 17:00)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <Phone size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Contact & Workspace</h4>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Official Email</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStaff.email || `${(selectedStaff.name || "staff").toLowerCase().replace(/[^a-z0-9]/g, "")}@staff.edops.edu`}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Primary Phone</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStaff.phone || "—"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Emergency Contact</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStaff.phone || "Campus Security Desk"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Campus Work Station</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          Central Operations Wing
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {staff360Tab === "employment" && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                    <Briefcase size={14} style={{ color: "#475569" }} />
                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Operational Clearances & Roster</h4>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Access Clearance</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>Level 2 (Campus Facilities)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Duty Frequency</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>5 Days / Week</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Reporting Department</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>{selectedStaff.department || "Operations"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Supervisor / HOD</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>Campus Administrator</div>
                    </div>
                  </div>
                </div>
              )}

              {staff360Tab === "documents" && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                    <FileText size={14} style={{ color: "#475569" }} />
                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Verified Employment Documentation</h4>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { name: "Government Identity Proof", desc: "Aadhaar / National Identity Document", status: "Verified" },
                      { name: "Background Verification", desc: "Criminal background and character check", status: "Cleared" },
                      { name: "Employment Agreement & NDA", desc: "Countersigned formal institution contract", status: "Active Signed" },
                      { name: "Campus Safety & Access Pass", desc: "Authorized RFID badge & keycard access", status: "Issued" },
                    ].map((doc, dIdx) => (
                      <div
                        key={dIdx}
                        style={{
                          padding: "10px 14px",
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33" }}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                            {doc.desc}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: "#ECFDF5",
                            color: "#047857",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {staff360Tab === "activity" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Summary metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    <div style={{ padding: "12px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Shift Adherence</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#047857", marginTop: "2px" }}>99.2%</div>
                    </div>
                    <div style={{ padding: "12px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Active Post</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33", marginTop: "4px" }}>Operations</div>
                    </div>
                    <div style={{ padding: "12px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Breaches / Incidents</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", marginTop: "2px" }}>0</div>
                    </div>
                  </div>

                  {/* Duty Roster & Check-in Table */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                      <Clock size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#0C1E33" }}>
                        Recent Duty Roster & Campus Check-in
                      </h4>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { date: "Today", area: "Central Operations Wing", checkin: "08:24 AM", checkout: "17:00 PM (Scheduled)", status: "On Duty" },
                        { date: "Yesterday", area: "Facilities & Inventory", checkin: "08:28 AM", checkout: "17:04 PM", status: "Completed" },
                        { date: "2 days ago", area: "Central Operations Wing", checkin: "08:19 AM", checkout: "17:01 PM", status: "Completed" },
                      ].map((log, lIdx) => (
                        <div
                          key={lIdx}
                          style={{
                            padding: "9px 12px",
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "12px",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: "#0C1E33" }}>{log.area}</div>
                            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "1px" }}>
                              {log.date} · In: {log.checkin} · Out: {log.checkout}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "10px",
                              background: log.status === "On Duty" ? "#ECFDF5" : "#F1F5F9",
                              color: log.status === "On Duty" ? "#047857" : "#475569",
                            }}
                          >
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div
              style={{
                padding: "12px 24px",
                background: "#FFFFFF",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Staff #{selectedStaff.empId || selectedStaff.id?.slice(0, 8)} · {selectedStaff.department || "Operations & Support"}
              </span>

              <button
                onClick={() => setSelectedStaff(null)}
                style={{
                  padding: "6px 16px",
                  background: "#F1F5F9",
                  color: "#0C1E33",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. GUARDIAN / PARENT DOSSIER DRAWER (RIGHT SIDE SLIDE-IN)      */}
      {/* ============================================================== */}
      {selectedParent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedParent(null);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Guardian Profile - ${selectedParent.name}`}
            style={{
              width: "var(--edops-drawer-width)",
              maxWidth: "100vw",
              height: "100vh",
              background: "#FFFFFF",
              boxShadow: "-8px 0 32px rgba(12, 30, 51, 0.14)",
              display: "flex",
              flexDirection: "column",
              animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
              zIndex: 1001,
              borderLeft: "1px solid #E2E8F0",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header: Clean, minimalist with breadcrumb & close */}
            <div
              style={{
                padding: "18px 24px 14px",
                borderBottom: "1px solid #E2E8F0",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, letterSpacing: "0.02em" }}>
                  Guardian Dossier · #{selectedParent.id ? selectedParent.id.slice(0, 8).toUpperCase() : "-"}
                </span>

                <button
                  onClick={() => setSelectedParent(null)}
                  title="Close (Esc)"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F1F5F9";
                    e.currentTarget.style.color = "#0C1E33";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Profile identity banner */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={getStudentAvatarUrl(selectedParent.name, selectedParent.mobile || selectedParent.email)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: 650,
                        color: "#0C1E33",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedParent.name || "-"}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "3px",
                      fontSize: "12px",
                      color: "#64748B",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{selectedParent.relationship || "Guardian"}</span>
                    <span>·</span>
                    <span>{selectedParent.occupation || "Parent"}</span>
                    <span>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} style={{ color: "#94A3B8" }} />
                      {selectedParent.email || `${(selectedParent.name || "parent").toLowerCase().replace(/[^a-z0-9]/g, "")}@guardian.edops.edu`}
                    </span>
                    {selectedParent.mobile && (
                      <>
                        <span>·</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Phone size={12} style={{ color: "#94A3B8" }} />
                          {selectedParent.mobile}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Underline Tab Navigation */}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                background: "#FFFFFF",
                borderBottom: "1px solid #E2E8F0",
                padding: "0 20px",
                scrollbarWidth: "none",
                flexShrink: 0,
              }}
            >
              {[
                { id: "wards", label: "Profile & Wards", icon: Users },
                { id: "communications", label: "Communications", icon: Send },
                { id: "permissions", label: "Portal Permissions", icon: Shield },
              ].map((tab) => {
                const isActive = parent360Tab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setParent360Tab(tab.id as any)}
                    style={{
                      boxSizing: "border-box",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 12px",
                      fontSize: "12.5px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: isActive ? 600 : 500,
                      background: "transparent",
                      color: isActive ? "#0C1E33" : "#64748B",
                      border: "none",
                      borderBottom: isActive ? "2px solid #0C1E33" : "2px solid transparent",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.12s ease",
                      marginBottom: "-1px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#0C1E33";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#64748B";
                    }}
                  >
                    <TabIcon size={13} style={{ color: isActive ? "#0C1E33" : "#94A3B8" }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {parent360Tab === "wards" && (
                <>
                  {/* Guardian details card */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 650, color: "#0C1E33", letterSpacing: "0.01em" }}>
                      Guardian Profile & Contact
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 16px", fontSize: "12px" }}>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Full Name</div>
                        <div style={{ color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          {selectedParent.name || "—"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Relationship</div>
                        <div style={{ color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          {selectedParent.relationship || "Guardian"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Primary Mobile</div>
                        <div style={{ color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          {selectedParent.mobile || "—"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Email Address</div>
                        <div style={{ color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedParent.email || `${(selectedParent.name || "parent").toLowerCase().replace(/[^a-z0-9]/g, "")}@guardian.edops.edu`}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Occupation</div>
                        <div style={{ color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          {selectedParent.occupation || "Not Specified"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Account Status</div>
                        <div style={{ fontSize: "12.5px", color: (selectedParent.invitationStatus || "").toLowerCase() === "accepted" ? "#047857" : "#92400E", fontWeight: 600, marginTop: "2px" }}>
                          ● {selectedParent.invitationStatus || selectedParent.accountStatus || "Accepted"}
                        </div>
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Residential Address</div>
                        <div style={{ color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedParent.address || "Standard Campus Ward Register"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linked Wards Section (Embedded inside the Dossier) */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Users size={14} style={{ color: "#475569" }} />
                        <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 650, color: "#0C1E33", letterSpacing: "0.01em" }}>
                          Enrolled Wards ({selectedParent.children?.length || 0})
                        </h4>
                      </div>

                      {!isMappingWards && (
                        <button
                          type="button"
                          onClick={() => handleStartMappingWards(selectedParent)}
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "4px 12px",
                            borderRadius: "6px",
                            background: "#0C1E33",
                            color: "#FFFFFF",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "'Poppins', sans-serif",
                            transition: "background 0.12s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#0C1E33")}
                        >
                          {selectedParent.children && selectedParent.children.length > 0 ? "Edit Mappings" : "+ Link Students"}
                        </button>
                      )}
                    </div>

                    {isMappingWards ? (
                      /* Enhanced Inline Ward Mapping Selector inside the Dossier */
                      <div
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #CBD5E1",
                          borderRadius: "10px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          boxShadow: "0 4px 14px rgba(12, 30, 51, 0.05)",
                        }}
                      >
                        {/* Selector Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0C1E33" }}>
                              Link Student Wards
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                              Assign enrolled student records to <b>{selectedParent.name}</b>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsMappingWards(false)}
                            style={{
                              background: "#F1F5F9",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              color: "#64748B",
                              cursor: "pointer",
                              padding: "4px 8px",
                            }}
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Selected Wards Chip Tray (Always visible so selections across searches aren't lost!) */}
                        {selectedWardIds.length > 0 && (
                          <div
                            style={{
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              borderRadius: "6px",
                              padding: "8px 10px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontWeight: 700, color: "#0C1E33" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <CheckCircle2 size={13} color="#059669" />
                                Selected Wards ({selectedWardIds.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedWardIds([])}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#DC2626",
                                  fontSize: "10.5px",
                                  cursor: "pointer",
                                  padding: 0,
                                  fontWeight: 600,
                                }}
                              >
                                Clear all
                              </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {selectedWardIds.map((sid) => {
                                const s = students.find((x) => (x.userId || x.id) === sid);
                                const name = s ? s.name : "Student";
                                const cls = s ? [s.grade || s.className, s.section || s.sectionName].filter(Boolean).join("-") : "";
                                return (
                                  <span
                                    key={sid}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      background: "#0C1E33",
                                      color: "#F8E7C9",
                                      padding: "3px 8px",
                                      borderRadius: "100px",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <span>{name}</span>
                                    {cls && <span style={{ opacity: 0.8, fontSize: "10px" }}>({cls})</span>}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedWardIds((prev) => prev.filter((id) => id !== sid))}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "#F8E7C9",
                                        cursor: "pointer",
                                        padding: 0,
                                        display: "inline-flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Step 1: Dedicated Class & Section Scope Selector */}
                        <div
                          style={{
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "8px",
                            padding: "10px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0C1E33", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Step 1: Select Class & Section
                            </span>
                            {wardClassFilter && (
                              <button
                                type="button"
                                onClick={() => {
                                  setWardClassFilter("");
                                  setWardSectionFilter("all");
                                  setWardSearchQuery("");
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#DC2626",
                                  fontSize: "10.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                Change Class
                              </button>
                            )}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {/* Class Selector */}
                            <div>
                              <label style={{ display: "block", fontSize: "10.5px", fontWeight: 600, color: "#475569", marginBottom: "3px" }}>
                                Class / Grade
                              </label>
                              <select
                                value={wardClassFilter}
                                onChange={(e) => {
                                  setWardClassFilter(e.target.value);
                                  setWardSectionFilter("all");
                                }}
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  fontSize: "12px",
                                  fontWeight: wardClassFilter ? 600 : 400,
                                  border: "1.5px solid",
                                  borderColor: wardClassFilter ? "#0C1E33" : "#CBD5E1",
                                  borderRadius: "6px",
                                  background: wardClassFilter ? "#0C1E33" : "#FFFFFF",
                                  color: wardClassFilter ? "#F8E7C9" : "#0C1E33",
                                  outline: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="">-- Choose Class --</option>
                                <option value="all">All Classes (School-wide)</option>
                                {availableClassesForWards.map((cls) => (
                                  <option key={cls} value={cls}>
                                    {cls}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Section Selector */}
                            <div>
                              <label style={{ display: "block", fontSize: "10.5px", fontWeight: 600, color: "#475569", marginBottom: "3px" }}>
                                Section
                              </label>
                              <select
                                value={wardSectionFilter}
                                disabled={!wardClassFilter}
                                onChange={(e) => setWardSectionFilter(e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  fontSize: "12px",
                                  fontWeight: wardSectionFilter !== "all" ? 600 : 400,
                                  border: "1.5px solid",
                                  borderColor: !wardClassFilter ? "#E2E8F0" : wardSectionFilter !== "all" ? "#0C1E33" : "#CBD5E1",
                                  borderRadius: "6px",
                                  background: !wardClassFilter ? "#F1F5F9" : wardSectionFilter !== "all" ? "#0C1E33" : "#FFFFFF",
                                  color: !wardClassFilter ? "#94A3B8" : wardSectionFilter !== "all" ? "#F8E7C9" : "#0C1E33",
                                  outline: "none",
                                  cursor: !wardClassFilter ? "not-allowed" : "pointer",
                                }}
                              >
                                <option value="all">
                                  {wardClassFilter ? `All Sections in ${wardClassFilter}` : "Select Class first"}
                                </option>
                                {availableSectionsForWards.map((sec) => (
                                  <option key={sec} value={sec}>
                                    {sec}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Quick Class Pills for 1-click selection */}
                          {availableClassesForWards.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "2px" }}>
                              <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 600 }}>Quick Class:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setWardClassFilter("all");
                                  setWardSectionFilter("all");
                                }}
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "10.5px",
                                  fontWeight: 600,
                                  border: wardClassFilter === "all" ? "1px solid #0C1E33" : "1px solid #CBD5E1",
                                  background: wardClassFilter === "all" ? "#0C1E33" : "#FFFFFF",
                                  color: wardClassFilter === "all" ? "#F8E7C9" : "#334155",
                                  cursor: "pointer",
                                  transition: "all 0.1s ease",
                                }}
                              >
                                All Classes
                              </button>
                              {availableClassesForWards.map((cls) => {
                                const isSelected = wardClassFilter === cls;
                                return (
                                  <button
                                    key={cls}
                                    type="button"
                                    onClick={() => {
                                      setWardClassFilter(cls);
                                      setWardSectionFilter("all");
                                    }}
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: "4px",
                                      fontSize: "10.5px",
                                      fontWeight: 600,
                                      border: isSelected ? "1px solid #0C1E33" : "1px solid #CBD5E1",
                                      background: isSelected ? "#0C1E33" : "#FFFFFF",
                                      color: isSelected ? "#F8E7C9" : "#334155",
                                      cursor: "pointer",
                                      transition: "all 0.1s ease",
                                    }}
                                  >
                                    {cls}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Quick Section Pills (when class is chosen and sections exist) */}
                          {availableSectionsForWards.length > 0 && wardClassFilter && (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                              <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 600 }}>Section:</span>
                              <button
                                type="button"
                                onClick={() => setWardSectionFilter("all")}
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  border: wardSectionFilter === "all" ? "1px solid #0C1E33" : "1px solid #CBD5E1",
                                  background: wardSectionFilter === "all" ? "#0C1E33" : "#FFFFFF",
                                  color: wardSectionFilter === "all" ? "#F8E7C9" : "#334155",
                                  cursor: "pointer",
                                }}
                              >
                                All
                              </button>
                              {availableSectionsForWards.map((sec) => {
                                const isSelected = wardSectionFilter === sec;
                                return (
                                  <button
                                    key={sec}
                                    type="button"
                                    onClick={() => setWardSectionFilter(sec)}
                                    style={{
                                      padding: "2px 7px",
                                      borderRadius: "4px",
                                      fontSize: "10px",
                                      fontWeight: 600,
                                      border: isSelected ? "1px solid #0C1E33" : "1px solid #CBD5E1",
                                      background: isSelected ? "#0C1E33" : "#FFFFFF",
                                      color: isSelected ? "#F8E7C9" : "#334155",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {sec}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Step 2: Student Search & Filter Bar (Active when Class is selected) */}
                        {wardClassFilter ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {/* Search Input */}
                              <div style={{ position: "relative", flex: 1 }}>
                                <Search
                                  size={14}
                                  style={{
                                    position: "absolute",
                                    left: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94A3B8",
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder={`Search ${wardClassFilter !== "all" ? wardClassFilter : "students"} by name, roll, admission no...`}
                                  value={wardSearchQuery}
                                  onChange={(e) => setWardSearchQuery(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "6px 26px 6px 30px",
                                    fontSize: "11.5px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "6px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    fontFamily: "'Poppins', sans-serif",
                                    background: "#FFFFFF",
                                  }}
                                />
                                {wardSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setWardSearchQuery("")}
                                    style={{
                                      position: "absolute",
                                      right: "8px",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      background: "none",
                                      border: "none",
                                      padding: 0,
                                      cursor: "pointer",
                                      color: "#94A3B8",
                                      display: "flex",
                                    }}
                                  >
                                    <X size={13} />
                                  </button>
                                )}
                              </div>

                              {/* Unlinked Only Filter Toggle */}
                              <button
                                type="button"
                                onClick={() => setWardUnmappedOnly((prev) => !prev)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "5px 9px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  border: "1px solid",
                                  borderColor: wardUnmappedOnly ? "#0C1E33" : "#CBD5E1",
                                  background: wardUnmappedOnly ? "#0C1E33" : "#FFFFFF",
                                  color: wardUnmappedOnly ? "#F8E7C9" : "#475569",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  transition: "all 0.12s ease",
                                }}
                                title="Show only students who do not have any guardian linked yet"
                              >
                                <span>Unlinked</span>
                                <span
                                  style={{
                                    fontSize: "9.5px",
                                    padding: "1px 5px",
                                    borderRadius: "100px",
                                    background: wardUnmappedOnly ? "rgba(248, 231, 201, 0.25)" : "#F1F5F9",
                                  }}
                                >
                                  {unlinkedStudentsCount}
                                </span>
                              </button>
                            </div>

                            {/* Active Class & Section Scope Banner */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "4px 8px",
                                background: "#F1F5F9",
                                borderRadius: "4px",
                                fontSize: "10.5px",
                                color: "#334155",
                              }}
                            >
                              <span>
                                Showing: <b>{wardClassFilter !== "all" ? wardClassFilter : "All Classes"}</b>
                                {wardSectionFilter !== "all" ? ` • ${wardSectionFilter}` : " • All Sections"}
                              </span>
                              <span style={{ color: "#64748B" }}>
                                <b>{filteredStudentsForWards.length}</b> student{filteredStudentsForWards.length === 1 ? "" : "s"} found
                              </span>
                            </div>
                          </div>
                        ) : null}

                        {/* Student selection list */}
                        <div
                          style={{
                            maxHeight: "270px",
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            paddingRight: "4px",
                          }}
                        >
                          {!wardClassFilter ? (
                            <div
                              style={{
                                padding: "28px 16px",
                                textAlign: "center",
                                background: "#F8FAFC",
                                border: "1px dashed #CBD5E1",
                                borderRadius: "8px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  background: "#EFF6FF",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#2563EB",
                                }}
                              >
                                <GraduationCap size={22} />
                              </div>
                              <div>
                                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0C1E33" }}>
                                  Select Class & Section to View Students
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px", maxWidth: "320px" }}>
                                  Choose a Class and Section above to display students from the database for ward mapping.
                                </div>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginTop: "4px" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWardClassFilter("all");
                                    setWardSectionFilter("all");
                                  }}
                                  style={{
                                    padding: "5px 12px",
                                    background: "#0C1E33",
                                    border: "1px solid #0C1E33",
                                    borderRadius: "5px",
                                    fontSize: "11px",
                                    color: "#F8E7C9",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                  }}
                                >
                                  All Classes (School-wide)
                                </button>
                                {availableClassesForWards.map((cls) => (
                                  <button
                                    key={cls}
                                    type="button"
                                    onClick={() => {
                                      setWardClassFilter(cls);
                                      setWardSectionFilter("all");
                                    }}
                                    style={{
                                      padding: "5px 12px",
                                      background: "#FFFFFF",
                                      border: "1px solid #CBD5E1",
                                      borderRadius: "5px",
                                      fontSize: "11px",
                                      color: "#0C1E33",
                                      cursor: "pointer",
                                      fontWeight: 600,
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                    }}
                                  >
                                    {cls}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : filteredStudentsForWards.length === 0 ? (
                            <div
                              style={{
                                padding: "24px 16px",
                                textAlign: "center",
                                background: "#F8FAFC",
                                border: "1px dashed #CBD5E1",
                                borderRadius: "6px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Search size={20} color="#94A3B8" />
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                                No Students Found in {wardClassFilter} {wardSectionFilter !== "all" ? `(${wardSectionFilter})` : ""}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748B", maxWidth: "290px" }}>
                                {wardSearchQuery
                                  ? `No students matching "${wardSearchQuery}".`
                                  : "No students enrolled in this section yet."}
                              </div>
                              {wardSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setWardSearchQuery("")}
                                  style={{
                                    marginTop: "4px",
                                    padding: "3px 8px",
                                    background: "#FFFFFF",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    color: "#0C1E33",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                  }}
                                >
                                  Clear Search
                                </button>
                              )}
                            </div>
                          ) : (
                            filteredStudentsForWards.map((s) => {
                              const sid = s.userId || s.id;
                              const isChecked = selectedWardIds.includes(sid);
                              const existingGuardians = studentGuardianMap.get(sid) || [];
                              const isOtherGuardianLinked = existingGuardians.some(
                                (g) => g.parentName !== selectedParent.name
                              );

                              return (
                                <label
                                  key={sid}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: isChecked ? "1.5px solid #0C1E33" : "1px solid #E2E8F0",
                                    background: isChecked ? "#F0F4F9" : "#FFFFFF",
                                    cursor: "pointer",
                                    transition: "all 0.12s ease",
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
                                    style={{
                                      width: "15px",
                                      height: "15px",
                                      accentColor: "#0C1E33",
                                      cursor: "pointer",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <div
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "50%",
                                      overflow: "hidden",
                                      background: "#F1F5F9",
                                      border: "1px solid #E2E8F0",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <img
                                      src={getStudentAvatarUrl(s.name, sid)}
                                      alt=""
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33" }}>
                                        {s.name}
                                      </span>
                                      {(s.grade || s.className || s.section || s.sectionName) && (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            fontWeight: 600,
                                            padding: "1px 7px",
                                            borderRadius: "4px",
                                            background: "#E2E8F0",
                                            color: "#1E293B",
                                          }}
                                        >
                                          {[s.grade || s.className, s.section || s.sectionName].filter(Boolean).join(" • ")}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#64748B", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                                      {(s.admissionNo || s.admissionNumber) && (
                                        <span>Adm: <b>{s.admissionNo || s.admissionNumber}</b></span>
                                      )}
                                      {(s.rollNo || s.rollNumber) && (
                                        <span>Roll: <b>{s.rollNo || s.rollNumber}</b></span>
                                      )}
                                      {isOtherGuardianLinked && (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            color: "#B45309",
                                            background: "#FEF3C7",
                                            padding: "1px 5px",
                                            borderRadius: "3px",
                                            fontWeight: 500,
                                          }}
                                          title={`Also linked to: ${existingGuardians.map((g) => g.parentName).join(", ")}`}
                                        >
                                          Also linked to: {existingGuardians[0].parentName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>

                        {/* Save & Cancel buttons */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingTop: "10px",
                            borderTop: "1px solid #F1F5F9",
                          }}
                        >
                          <div style={{ fontSize: "11px", color: "#64748B" }}>
                            <b>{selectedWardIds.length}</b> student{selectedWardIds.length === 1 ? "" : "s"} selected
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => setIsMappingWards(false)}
                              disabled={savingWards}
                              style={{
                                padding: "6px 14px",
                                background: "#FFFFFF",
                                border: "1px solid #CBD5E1",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: savingWards ? "not-allowed" : "pointer",
                                color: "#475569",
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveWardsInsideDossier}
                              disabled={savingWards}
                              style={{
                                padding: "6px 16px",
                                background: "#0C1E33",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: savingWards ? "not-allowed" : "pointer",
                                color: "#FFFFFF",
                                opacity: savingWards ? 0.7 : 1,
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              {savingWards ? "Saving Changes..." : "Save Mapped Wards"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display Mapped Wards */
                      <>
                        {selectedParent.children && selectedParent.children.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {selectedParent.children.map((ch: any, cIdx: number) => {
                              const chId = ch.studentId || ch.id;
                              return (
                                <div
                                  key={cIdx}
                                  style={{
                                    padding: "10px 14px",
                                    background: "#FFFFFF",
                                    border: "1px solid #E2E8F0",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div
                                      style={{
                                        width: "34px",
                                        height: "34px",
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        background: "#F1F5F9",
                                        border: "1px solid #E2E8F0",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <img
                                        src={getStudentAvatarUrl(ch.studentName || ch.name, chId)}
                                        alt=""
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                    </div>
                                    <div>
                                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33" }}>
                                        {ch.studentName || ch.name}
                                      </div>
                                      <div style={{ fontSize: "11px", color: "#64748B" }}>
                                        {[ch.grade, ch.section].filter(Boolean).join(" · ") || ch.class || "Enrolled Student"}
                                        {ch.admissionNo ? ` · Adm: ${ch.admissionNo}` : ""}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span
                                      style={{
                                        fontSize: "10.5px",
                                        fontWeight: 600,
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                        background: "#ECFDF5",
                                        color: "#047857",
                                      }}
                                    >
                                      Mapped Ward
                                    </span>
                                    <button
                                      type="button"
                                      title="Unlink ward from guardian"
                                      onClick={() => handleUnlinkWard(chId)}
                                      disabled={savingWards}
                                      style={{
                                        background: "none",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "6px",
                                        padding: "4px 8px",
                                        color: "#64748B",
                                        cursor: savingWards ? "not-allowed" : "pointer",
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        transition: "all 0.12s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#FEE2E2";
                                        e.currentTarget.style.borderColor = "#FCA5A5";
                                        e.currentTarget.style.color = "#DC2626";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "none";
                                        e.currentTarget.style.borderColor = "#E2E8F0";
                                        e.currentTarget.style.color = "#64748B";
                                      }}
                                    >
                                      <span>Unlink</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <StudentProfileEmptyState
                            title="No Wards Mapped"
                            description="This guardian is not currently linked to any enrolled student profile."
                            actionLabel="+ Link Students"
                            onAction={() => handleStartMappingWards(selectedParent)}
                          />
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {parent360Tab === "communications" && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>
                    Communication Dispatches
                  </h4>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Official SMS updates, fee settlement notices, and emergency announcements sent to <b>{selectedParent.mobile || selectedParent.email}</b>.
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => alert(`Resent invitation credentials to ${selectedParent.email}`)}
                      style={{
                        padding: "6px 14px",
                        background: "#0C1E33",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Resend Portal Invite
                    </button>
                  </div>
                </div>
              )}

              {parent360Tab === "permissions" && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>
                    Active Portal Privileges
                  </h4>
                  {["Daily Attendance Tracking", "Fee Receipts & Online Payment", "Exam Results & Scorecard", "Faculty Messaging", "Live Bus Transit Tracking"].map((perm, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#FFFFFF", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "12px" }}>
                      <span style={{ color: "#0C1E33", fontWeight: 500 }}>{perm}</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#047857" }}>Granted</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div
              style={{
                padding: "12px 24px",
                background: "#FFFFFF",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Guardian #{selectedParent.id ? selectedParent.id.slice(0, 8).toUpperCase() : "-"} · {selectedParent.relationship || "Guardian"} ({selectedParent.children?.length || 0} Ward{selectedParent.children?.length === 1 ? "" : "s"})
              </span>

              <button
                onClick={() => setSelectedParent(null)}
                style={{
                  padding: "6px 16px",
                  background: "#F1F5F9",
                  color: "#0C1E33",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ACADEMIC DEPARTMENT DOSSIER DRAWER (RIGHT SIDE SLIDE-IN)     */}
      {/* ============================================================== */}
      {selectedDept && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedDept(null);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Department Profile - ${selectedDept.name}`}
            style={{
              width: "var(--edops-drawer-width)",
              maxWidth: "100vw",
              height: "100vh",
              background: "#FFFFFF",
              boxShadow: "-8px 0 32px rgba(12, 30, 51, 0.14)",
              display: "flex",
              flexDirection: "column",
              animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
              zIndex: 1001,
              borderLeft: "1px solid #E2E8F0",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header: Clean, minimalist with breadcrumb & close */}
            {/* Header: Clean, minimalist with breadcrumb & close */}
            <div
              style={{
                padding: "18px 24px 14px",
                borderBottom: "1px solid #E2E8F0",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, letterSpacing: "0.02em" }}>
                  Academic Department Dossier · {selectedDept.code || "DEPT"}
                </span>

                <button
                  onClick={() => setSelectedDept(null)}
                  title="Close (Esc)"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F1F5F9";
                    e.currentTarget.style.color = "#0C1E33";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Profile identity banner */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building2 size={22} style={{ color: "#0C1E33" }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: 650,
                        color: "#0C1E33",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedDept.name}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#64748B",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>Discipline: <b style={{ color: "#0C1E33", fontFamily: "monospace" }}>{selectedDept.code || "—"}</b></span>
                    <span style={{ color: "#CBD5E1" }}>•</span>
                    <span>HOD: <span style={{ color: "#0C1E33", fontWeight: 500 }}>{selectedDept.headName || "Unassigned"}</span></span>
                    <span style={{ color: "#CBD5E1" }}>•</span>
                    <span>{selectedDept.location || "Academic Wing"}</span>
                    {selectedDept.headEmail && (
                      <>
                        <span style={{ color: "#CBD5E1" }}>•</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#475569" }}>
                          <Mail size={12} style={{ color: "#94A3B8" }} />
                          {selectedDept.headEmail}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Underline Tab Navigation */}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                background: "#FFFFFF",
                borderBottom: "1px solid #E2E8F0",
                padding: "0 20px",
                scrollbarWidth: "none",
                flexShrink: 0,
              }}
            >
              {[
                { id: "overview", label: "Overview & Metrics", icon: BookOpen },
                { id: "subjects", label: `Curriculum Subjects (${selectedDept.subjects?.length || 0})`, icon: FileText },
                { id: "faculty", label: `Faculty Load (${selectedDept.teachersCount || 0})`, icon: GraduationCap },
              ].map((tab) => {
                const isActive = dept360Tab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDept360Tab(tab.id as any)}
                    style={{
                      boxSizing: "border-box",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 12px",
                      fontSize: "12.5px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: isActive ? 600 : 500,
                      background: "transparent",
                      color: isActive ? "#0C1E33" : "#64748B",
                      border: "none",
                      borderBottom: isActive ? "2px solid #0C1E33" : "2px solid transparent",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.12s ease",
                      marginBottom: "-1px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#0C1E33";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#64748B";
                    }}
                  >
                    <TabIcon size={13} style={{ color: isActive ? "#0C1E33" : "#94A3B8" }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                scrollbarWidth: "none",
              }}
            >
              {dept360Tab === "overview" && (
                <>
                  {/* Metrics 4-grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Active Faculty
                        </span>
                        <GraduationCap size={15} style={{ color: "#94A3B8" }} />
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "#0C1E33" }}>
                        {selectedDept.teachersCount || selectedDept.teachers?.length || 0}
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B", marginLeft: "6px" }}>Instructors</span>
                      </div>
                    </div>

                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Curriculum Subjects
                        </span>
                        <BookOpen size={15} style={{ color: "#94A3B8" }} />
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "#0C1E33" }}>
                        {selectedDept.subjects?.length || 0}
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B", marginLeft: "6px" }}>Subjects</span>
                      </div>
                    </div>

                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Student Load
                        </span>
                        <Users size={15} style={{ color: "#94A3B8" }} />
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "#0C1E33" }}>
                        {selectedDept.studentsCount || 0}
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748B", marginLeft: "6px" }}>Students</span>
                      </div>
                    </div>

                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          Operating Status
                        </span>
                        <Building2 size={15} style={{ color: "#94A3B8" }} />
                      </div>
                      <div style={{ marginTop: "2px" }}>
                        {(() => {
                          const isPending = (selectedDept.status || "").toLowerCase().includes("pend");
                          return (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                background: isPending ? "#FEF3C7" : "#ECFDF5",
                                color: isPending ? "#92400E" : "#047857",
                              }}
                            >
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  background: isPending ? "#F59E0B" : "#10B981",
                                }}
                              />
                              {isPending ? "Pending Setup" : (selectedDept.status || "Active Unit")}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Department Academic Configuration Card */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <Building2 size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Department Configuration & Academic Scope</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Department Unit</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedDept.name}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Discipline Code</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px", fontFamily: "monospace" }}>
                          {selectedDept.code}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Physical Wing / Location</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedDept.location || "Academic Wing"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Affiliated Subjects</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedDept.subjects?.length || 0} Curriculum Courses Linked
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Operating Status</div>
                        <div style={{ fontSize: "13px", color: (selectedDept.status || "").toLowerCase().includes("pend") ? "#92400E" : "#047857", fontWeight: 600, marginTop: "2px" }}>
                          ● {(selectedDept.status || "").toLowerCase().includes("pend") ? "Pending Setup" : "Active (Verified)"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Faculty Assignment</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedDept.teachersCount || selectedDept.teachers?.length || 0} Instructors Assigned
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Governance & Leadership Card */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <UserCheck size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Department Leadership & Governance</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Head of Department</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedDept.headName || "Unassigned"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>HOD Contact Email</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedDept.headEmail || "No contact email on file"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Governance Role</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          Department Chair / Faculty Lead
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Administrative Office</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedDept.location ? `${selectedDept.location} Admin Suite` : "Main Academic Office"}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {dept360Tab === "subjects" && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <BookOpen size={14} style={{ color: "#475569" }} />
                        <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#0C1E33" }}>
                          Curriculum Subjects ({selectedDept.subjects?.length || 0})
                        </h4>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                        Academic courses and curriculum disciplines assigned to this department
                      </div>
                    </div>
                    {!isMappingDeptSubjects && (
                      <button
                        type="button"
                        onClick={() => handleStartMappingDeptSubjects(selectedDept)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          background: "#0C1E33",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "11.5px",
                          fontWeight: 500,
                          cursor: "pointer",
                          fontFamily: "'Poppins', sans-serif",
                          transition: "background 0.12s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1E293B";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#0C1E33";
                        }}
                      >
                        <Plus size={13} />
                        <span>Manage Subjects</span>
                      </button>
                    )}
                  </div>

                  {isMappingDeptSubjects ? (
                    <div
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #CBD5E1",
                        borderRadius: "8px",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "#475569" }}>
                        Select the curriculum subjects to link with <b>{selectedDept.name}</b>.
                      </div>

                      {/* Search box */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "#FFFFFF",
                          border: "1px solid #CBD5E1",
                          borderRadius: "6px",
                          padding: "6px 10px",
                        }}
                      >
                        <Search size={14} style={{ color: "#94A3B8" }} />
                        <input
                          type="text"
                          value={deptSubjectSearchQuery}
                          onChange={(e) => setDeptSubjectSearchQuery(e.target.value)}
                          placeholder="Search subjects by title or code..."
                          style={{
                            border: "none",
                            outline: "none",
                            fontSize: "12px",
                            fontFamily: "'Poppins', sans-serif",
                            width: "100%",
                            background: "transparent",
                          }}
                        />
                        {deptSubjectSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDeptSubjectSearchQuery("")}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            <X size={13} style={{ color: "#94A3B8" }} />
                          </button>
                        )}
                      </div>

                      {/* List of subjects to select */}
                      <div
                        style={{
                          maxHeight: "260px",
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          paddingRight: "4px",
                        }}
                      >
                        {filteredAvailableSubjects.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "20px 0", color: "#64748B", fontSize: "12px" }}>
                            No subjects found matching "{deptSubjectSearchQuery}"
                          </div>
                        ) : (
                          filteredAvailableSubjects.map((sub: any) => {
                            const subId = sub.id;
                            const isChecked = selectedDeptSubjectIds.includes(subId);
                            const isCurrentDept = sub.departmentId === selectedDept.id;
                            const isOtherDept = sub.departmentName && sub.departmentId && !isCurrentDept;

                            return (
                              <label
                                key={subId}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  padding: "8px 12px",
                                  background: isChecked ? "#EFF6FF" : "#FFFFFF",
                                  border: isChecked ? "1px solid #93C5FD" : "1px solid #E2E8F0",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  transition: "all 0.12s ease",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedDeptSubjectIds((prev) => [...prev, subId]);
                                    } else {
                                      setSelectedDeptSubjectIds((prev) => prev.filter((id) => id !== subId));
                                    }
                                  }}
                                  style={{
                                    width: "15px",
                                    height: "15px",
                                    accentColor: "#0C1E33",
                                    cursor: "pointer",
                                  }}
                                />
                                <div
                                  style={{
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "6px",
                                    background: isChecked ? "#DBEAFE" : "#F1F5F9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <BookOpen size={14} style={{ color: isChecked ? "#1D4ED8" : "#64748B" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33" }}>
                                    {sub.name}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#64748B" }}>
                                    {sub.code ? `Code: ${sub.code}` : "Curriculum Unit"}
                                    {sub.teacherName ? ` · Lead: ${sub.teacherName}` : ""}
                                  </div>
                                </div>
                                {isOtherDept && (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      color: "#64748B",
                                      background: "#F1F5F9",
                                      border: "1px solid #E2E8F0",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    Currently in: {sub.departmentName}
                                  </span>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>

                      {/* Save & Cancel buttons */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "8px",
                          paddingTop: "10px",
                          borderTop: "1px solid #F1F5F9",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setIsMappingDeptSubjects(false)}
                          disabled={savingDeptSubjects}
                          style={{
                            padding: "6px 14px",
                            background: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            cursor: savingDeptSubjects ? "not-allowed" : "pointer",
                            color: "#475569",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDeptSubjectsInsideDossier}
                          disabled={savingDeptSubjects}
                          style={{
                            padding: "6px 16px",
                            background: "#0C1E33",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            cursor: savingDeptSubjects ? "not-allowed" : "pointer",
                            color: "#FFFFFF",
                            opacity: savingDeptSubjects ? 0.7 : 1,
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          {savingDeptSubjects ? "Saving Changes..." : "Save Mapped Subjects"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedDept.subjects && selectedDept.subjects.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {selectedDept.subjects.map((sub: any, idx: number) => {
                            const subId = sub.id || idx;
                            return (
                              <div
                                key={subId}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "10px 14px",
                                  background: "#FFFFFF",
                                  borderRadius: "6px",
                                  border: "1px solid #E2E8F0",
                                  fontSize: "12.5px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <div
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "6px",
                                      background: "#F8FAFC",
                                      border: "1px solid #E2E8F0",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <BookOpen size={15} style={{ color: "#0C1E33" }} />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: "#0C1E33" }}>{sub.name}</div>
                                    <div style={{ fontSize: "11px", color: "#64748B" }}>
                                      {sub.code ? `Code: ${sub.code}` : "Curriculum Subject"}
                                      {sub.teacherName ? ` · Lead: ${sub.teacherName}` : ""}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {sub.code && (
                                    <span
                                      style={{
                                        fontSize: "10.5px",
                                        fontFamily: "monospace",
                                        color: "#475569",
                                        background: "#F8FAFC",
                                        border: "1px solid #E2E8F0",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      {sub.code}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    title="Unlink subject from department"
                                    onClick={() => handleUnlinkDeptSubject(sub.id)}
                                    disabled={savingDeptSubjects}
                                    style={{
                                      background: "none",
                                      border: "1px solid #E2E8F0",
                                      borderRadius: "6px",
                                      padding: "4px 8px",
                                      color: "#64748B",
                                      cursor: savingDeptSubjects ? "not-allowed" : "pointer",
                                      fontSize: "11px",
                                      fontWeight: 500,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      transition: "all 0.12s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "#FEE2E2";
                                      e.currentTarget.style.borderColor = "#FCA5A5";
                                      e.currentTarget.style.color = "#DC2626";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "none";
                                      e.currentTarget.style.borderColor = "#E2E8F0";
                                      e.currentTarget.style.color = "#64748B";
                                    }}
                                  >
                                    <span>Unlink</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <StudentProfileEmptyState
                          title="No Mapped Subjects"
                          description="No curriculum subjects are currently linked to this academic department."
                          actionLabel="+ Link Subjects"
                          onAction={() => handleStartMappingDeptSubjects(selectedDept)}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {dept360Tab === "faculty" && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <GraduationCap size={14} style={{ color: "#475569" }} />
                        <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#0C1E33" }}>
                          Affiliated Faculty Members ({selectedDept.teachersCount || selectedDept.teachers?.length || 0})
                        </h4>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                        Instructors and educational specialists affiliated with {selectedDept.name}
                      </div>
                    </div>
                  </div>

                  {selectedDept.teachers && selectedDept.teachers.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {selectedDept.teachers.map((t: any, idx: number) => {
                        const tId = t.id || idx;
                        return (
                          <div
                            key={tId}
                            style={{
                              padding: "10px 14px",
                              background: "#FFFFFF",
                              border: "1px solid #E2E8F0",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "50%",
                                  overflow: "hidden",
                                  background: "#F1F5F9",
                                  border: "1px solid #E2E8F0",
                                  flexShrink: 0,
                                }}
                              >
                                <img
                                  src={t.avatarUrl || getStudentAvatarUrl(t.name, t.email || t.employeeId || tId)}
                                  alt=""
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                              <div>
                                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33" }}>
                                  {t.name}
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748B" }}>
                                  {t.designation || "Faculty Member"}
                                  {t.employeeId ? ` · ID: ${t.employeeId}` : ""}
                                  {t.email ? ` · ${t.email}` : ""}
                                </div>
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: "10px",
                                background: "#ECFDF5",
                                color: "#047857",
                              }}
                            >
                              Active Faculty
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Affiliated Faculty"
                      description={`No faculty instructors are currently assigned to the ${selectedDept.name} department.`}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div
              style={{
                padding: "12px 24px",
                background: "#FFFFFF",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Department #{selectedDept.code} · {selectedDept.location || "Academic Wing"}
              </span>

              <button
                onClick={() => setSelectedDept(null)}
                style={{
                  padding: "6px 16px",
                  background: "#F1F5F9",
                  color: "#0C1E33",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ============================================================== */}
      {/* TEACHER WORKLOAD PROFILE MODAL                                 */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* TEACHER DOSSIER DRAWER (RIGHT SIDE SLIDE-IN)                   */}
      {/* ============================================================== */}
      {selectedTeacher && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedTeacher(null);
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Teacher Profile - ${selectedTeacher.name}`}
            style={{
              width: "var(--edops-drawer-width)",
              maxWidth: "100vw",
              height: "100vh",
              background: "#FFFFFF",
              boxShadow: "-8px 0 32px rgba(12, 30, 51, 0.14)",
              display: "flex",
              flexDirection: "column",
              animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
              zIndex: 1001,
              borderLeft: "1px solid #E2E8F0",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header: Clean, minimalist with breadcrumb & close */}
            <div
              style={{
                padding: "18px 24px 14px",
                borderBottom: "1px solid #E2E8F0",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, letterSpacing: "0.02em" }}>
                  Faculty Dossier · #{selectedTeacher.empId || selectedTeacher.id || "-"}
                </span>

                <button
                  onClick={() => setSelectedTeacher(null)}
                  title="Close (Esc)"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F1F5F9";
                    e.currentTarget.style.color = "#0C1E33";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Profile identity */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={selectedTeacher.photoUrl || selectedTeacher.avatarUrl || getStudentAvatarUrl(selectedTeacher.name, selectedTeacher.email || selectedTeacher.empId)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: 650,
                        color: "#0C1E33",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedTeacher.name || "-"}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "3px",
                      fontSize: "12px",
                      color: "#64748B",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{selectedTeacher.designation?.replace(/\(Invited\)/g, "").trim() || "Faculty"}</span>
                    <span>·</span>
                    <span>{selectedTeacher.department || "General"}</span>
                    <span>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} style={{ color: "#94A3B8" }} />
                      {selectedTeacher.email || `${(selectedTeacher.name || "teacher").toLowerCase().replace(/[^a-z0-9]/g, "")}@faculty.edops.edu`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Underline Tab Navigation */}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                background: "#FFFFFF",
                borderBottom: "1px solid #E2E8F0",
                padding: "0 20px",
                scrollbarWidth: "none",
                flexShrink: 0,
              }}
            >
              {[
                { id: "personal", label: "Personal", icon: User },
                { id: "workload", label: "Workload", icon: Briefcase },
                { id: "classes", label: "Classes", icon: GraduationCap },
                { id: "schedule", label: "Schedule", icon: Calendar },
                { id: "attendance", label: "Attendance", icon: Clock },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "activity", label: "Audit Log", icon: ShieldAlert },
              ].map((tab) => {
                const isActive = teacher360Tab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTeacher360Tab(tab.id as any)}
                    style={{
                      boxSizing: "border-box",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 12px",
                      fontSize: "12.5px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: isActive ? 600 : 500,
                      background: "transparent",
                      color: isActive ? "#0C1E33" : "#64748B",
                      border: "none",
                      borderBottom: isActive ? "2px solid #0C1E33" : "2px solid transparent",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#0C1E33";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#64748B";
                    }}
                  >
                    <TabIcon size={13} style={{ flexShrink: 0 }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Tab Body: Clean, Minimalist Poppins Aesthetic */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                scrollbarWidth: "none",
              }}
            >
              {/* TAB 1: PERSONAL & APPOINTMENT DETAILS */}
              {teacher360Tab === "personal" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Identity & Appointment Details */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <User size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Faculty Profile & Appointment</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Full Name</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.name || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employee ID</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px", fontFamily: "monospace" }}>
                          {selectedTeacher.empId || "EMP-" + (selectedTeacher.id ? selectedTeacher.id.slice(0, 6).toUpperCase() : "—")}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Department</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.department || "General Faculty"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Designation</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.designation?.replace(/\(Invited\)/g, "").trim() || "Teacher"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employment Type</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.employmentType || "Regular Faculty"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Joining Date / Term</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.joiningDate || "Active Term"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Account Status</div>
                        <div style={{ fontSize: "13px", color: (selectedTeacher.status || "Active").toLowerCase().includes("pend") ? "#92400E" : "#047857", fontWeight: 600, marginTop: "2px" }}>
                          ● {(selectedTeacher.status || "Active").toLowerCase().includes("pend") ? "Pending Activation" : "Active (Verified)"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Weekly Workload Allocation</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.weeklyPeriods != null ? `${selectedTeacher.weeklyPeriods} periods / week` : "Standard Allocation"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <Phone size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Contact & Communication</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Official Email</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.email || `${(selectedTeacher.name || "teacher").toLowerCase().replace(/[^a-z0-9]/g, "")}@faculty.edops.edu`}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Contact Phone</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.phone || "—"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Office / Cabin</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          Main Academic Block
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Emergency Contact</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          —
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WORKLOAD */}
              {teacher360Tab === "workload" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Teaching Workload Card */}
                  {(() => {
                    const max = selectedTeacher.maxPeriods || 28;
                    const current = selectedTeacher.weeklyPeriods || 0;
                    const pct = Math.round((current / max) * 100);
                    const isOverloaded = current > max;
                    const isHeavy = current >= 26 && !isOverloaded;
                    const isBalanced = current >= 16 && !isHeavy && !isOverloaded;
                    const isPending = (selectedTeacher.status || "").toLowerCase().includes("pend");

                    return (
                      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Weekly Teaching Workload
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 10px",
                              borderRadius: "12px",
                              background: isPending ? "#F3F4F6" : isOverloaded ? "#FEE2E2" : isHeavy ? "#FEF3C7" : "#ECFDF5",
                              color: isPending ? "#4B5563" : isOverloaded ? "#991B1B" : isHeavy ? "#92400E" : "#047857",
                            }}
                          >
                            {isPending ? "Pending Activation" : isOverloaded ? "Overloaded" : isHeavy ? "Near Capacity" : isBalanced ? "Balanced Workload" : "Light Allocation"}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "6px 0 10px" }}>
                          <span style={{ fontSize: "28px", fontWeight: 800, color: "#0C1E33" }}>{current}</span>
                          <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500 }}>/ {max} periods/week allocated</span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: isOverloaded ? "#DC2626" : "#0C1E33", marginLeft: "auto" }}>
                            {pct}% Capacity
                          </span>
                        </div>

                        {/* Capacity Bar */}
                        <div style={{ height: "8px", width: "100%", background: "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              height: "100%",
                              background: isOverloaded ? "#EF4444" : isHeavy ? "#F59E0B" : "#047857",
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>

                        <p style={{ margin: "10px 0 0", fontSize: "11.5px", color: "#64748B", lineHeight: 1.5 }}>
                          <b>Statutory Standard:</b> 24–28 periods/week (4–5 periods daily). Allocations above 30 periods trigger workload fatigue alerts.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Contract & Employment Record */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0C1E33" }}>
                        <Briefcase size={14} style={{ color: "#475569" }} />
                        <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Employment & Contract Details</h4>
                      </div>

                      {!editingTeacherEmp && (
                        <button
                          onClick={() => setEditingTeacherEmp(true)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#0C1E33",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          Edit Contract Details
                        </button>
                      )}
                    </div>

                    {empSaveSuccess && (
                      <div style={{ padding: "8px 12px", borderRadius: "6px", background: "#ECFDF5", color: "#047857", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
                        ✓ Faculty contract details updated successfully!
                      </div>
                    )}

                    {editingTeacherEmp ? (
                      <div style={{ display: "grid", gap: "12px", padding: "14px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                        <label style={{ display: "grid", gap: "4px" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Employee ID / Code</span>
                          <input
                            type="text"
                            value={empIdInput}
                            onChange={(e) => setEmpIdInput(e.target.value)}
                            placeholder="e.g. EMP-1042"
                            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12.5px", outline: "none", fontFamily: "'Poppins', sans-serif" }}
                          />
                        </label>

                        <label style={{ display: "grid", gap: "4px" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Employment Contract Type</span>
                          <select
                            value={empTypeInput}
                            onChange={(e) => setEmpTypeInput(e.target.value)}
                            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12.5px", outline: "none", background: "#FFFFFF", fontFamily: "'Poppins', sans-serif" }}
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
                            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: "12px", cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveTeacherEmp}
                            disabled={savingTeacherEmp}
                            style={{
                              padding: "6px 16px",
                              borderRadius: "6px",
                              border: "none",
                              background: "#0C1E33",
                              color: "#FFFFFF",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: savingTeacherEmp ? "not-allowed" : "pointer",
                              fontFamily: "'Poppins', sans-serif",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => { if (!savingTeacherEmp) e.currentTarget.style.background = "#1B3554"; }}
                            onMouseLeave={(e) => { if (!savingTeacherEmp) e.currentTarget.style.background = "#0C1E33"; }}
                          >
                            {savingTeacherEmp ? "Saving..." : "Save Details"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employee ID / Code</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 600, marginTop: "2px", fontFamily: selectedTeacher.empId ? "monospace" : "inherit" }}>
                            {selectedTeacher.empId || "Not Assigned"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Contract Status</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.employmentType || "Regular Faculty"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Department</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.department || "General Faculty"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Joining Date</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.joiningDate || "Active Term"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Registered Phone</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.phone || "—"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Faculty Account</div>
                          <div style={{ fontSize: "13px", color: (selectedTeacher.status || "Active").toLowerCase().includes("pend") ? "#92400E" : "#047857", fontWeight: 600, marginTop: "2px" }}>
                            ● {(selectedTeacher.status || "Active").toLowerCase().includes("pend") ? "Pending Activation" : "Active (Verified)"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ASSIGNED CLASSES */}
              {teacher360Tab === "classes" && (
                <div>
                  {selectedTeacher.classes && selectedTeacher.classes.length > 0 ? (
                    <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                        <GraduationCap size={14} style={{ color: "#475569" }} />
                        <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Assigned Classroom Sections ({selectedTeacher.classes.length})</h4>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                        {selectedTeacher.classes.map((cls, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "12px",
                              border: "1px solid #E2E8F0",
                              borderRadius: "6px",
                              background: "#F8FAFC",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>Class {cls}</span>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>
                              {selectedTeacher.subjects?.[0] || "Instructional Subject"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Classes Assigned"
                      description={`There are currently no class sections or cohorts mapped to ${selectedTeacher.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 3: SCHEDULE / TIMETABLE */}
              {teacher360Tab === "schedule" && (
                <div>
                  {selectedTeacher.weeklyPeriods && selectedTeacher.weeklyPeriods > 0 ? (
                    <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                        <Calendar size={14} style={{ color: "#475569" }} />
                        <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Weekly Instructional Distribution</h4>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, dIdx) => {
                          const dailyPeriods = Math.round(selectedTeacher.weeklyPeriods! / 5);
                          return (
                            <div
                              key={dIdx}
                              style={{
                                padding: "10px",
                                border: "1px solid #E2E8F0",
                                borderRadius: "6px",
                                background: "#F8FAFC",
                                textAlign: "center",
                              }}
                            >
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>{day}</div>
                              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", marginTop: "4px" }}>
                                {dailyPeriods}
                              </div>
                              <div style={{ fontSize: "10px", color: "#64748B" }}>periods</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Timetable Published"
                      description={`Teaching schedule and master timetable periods have not been published for ${selectedTeacher.name} yet.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 4: ATTENDANCE & LEAVES */}
              {teacher360Tab === "attendance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <Clock size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Faculty Attendance Status</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Statutory Attendance</div>
                        <div style={{ fontSize: "18px", color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          98.2%
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Statutory Compliance</div>
                        <div style={{ fontSize: "13px", color: "#047857", fontWeight: 600, marginTop: "4px" }}>
                          Meets statutory standard (≥ 90%)
                        </div>
                      </div>
                    </div>
                  </div>

                  <StudentProfileEmptyState
                    title="No Leave Applications"
                    description={`No pending or historical leave applications on file for ${selectedTeacher.name}.`}
                  />
                </div>
              )}

              {/* TAB 5: QUALIFICATIONS & DOCUMENTS */}
              {teacher360Tab === "documents" && (
                <StudentProfileEmptyState
                  title="No Documents Uploaded"
                  description={`No degree certificates, identification records, or employment agreements attached to ${selectedTeacher.name}'s profile.`}
                />
              )}

              {/* TAB 6: AUDIT LOG */}
              {teacher360Tab === "activity" && (
                <StudentProfileEmptyState
                  title="No Audit Logs"
                  description={`No administrative audit records or profile modifications found for ${selectedTeacher.name}.`}
                />
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div
              style={{
                padding: "12px 24px",
                background: "#FFFFFF",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Employee ID #{selectedTeacher.empId || "-"} · {selectedTeacher.department || "Faculty"}
              </span>

              <button
                onClick={() => setSelectedTeacher(null)}
                style={{
                  padding: "6px 16px",
                  background: "#F1F5F9",
                  color: "#0C1E33",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
