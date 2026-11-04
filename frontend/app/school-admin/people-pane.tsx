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
  createSchoolAdminBroadcast,
  createSchoolAdminDiscipline,
  sendCommunicationMessage,
} from "../edops-api";
import { TeacherAllocationManager } from "../components/teacher-allocation-manager";
import { DepartmentDossierDrawer } from "./components/department-dossier-drawer";
import { StaffDossierDrawer } from "./components/staff-dossier-drawer";
import { ParentDossierDrawer } from "./components/parent-dossier-drawer";
import { TeacherDossierDrawer } from "./components/teacher-dossier-drawer";
import { StudentDossierDrawer } from "./components/student-dossier-drawer";
import { AttendanceWarningModal } from "./components/attendance-warning-modal";
import {
  StudentProfileEmptyState,
  getStudentTabEmptyMeta,
  StudentSkeletonRows,
  TeacherSkeletonRows,
} from "./components/people-helpers";
import { MemberLifecycleModal, MemberLifecycleTarget } from "../components/member-lifecycle-modal";
import { KpiSkeletonGrid, TableSkeletonRows, NoResultState } from "../components/ui";
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
  UserX,
  Mail,
  Phone,
  AlertCircle,
  AlertTriangle,
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
  Upload,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* SKELETON LOADING AND EMPTY STATE COMPONENTS                                */
/* -------------------------------------------------------------------------- */



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

  // Attendance Warning Modal & Action States
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningRecipient, setWarningRecipient] = useState<any>(null);
  const [warningFeedback, setWarningFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
  const handleOpenTeacherModal = (t: TeacherRecord) => {
    setSelectedTeacher(t);
    setTeacher360Tab("personal");
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
  const [lifecycleTarget, setLifecycleTarget] = useState<MemberLifecycleTarget | null>(null);

  // Academics data for dropdowns
  const [academicsData, setAcademicsData] = useState<{ programs?: any[]; sections?: any[]; subjects?: any[]; [key: string]: any } | null>(null);
  const [isMappingWards, setIsMappingWards] = useState(false);

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

  // Dynamically resolve all parent/guardian contacts for the selected student
  const availableWarningParents = useMemo(() => {
    const list: { id?: string; name: string; email?: string; phone?: string; relationship: string; isPrimary?: boolean }[] = [];
    
    // 1. Linked parent accounts from studentParents
    studentParents.forEach((p) => {
      if (!list.some((x) => x.id && x.id === p.id)) {
        list.push({
          id: p.id,
          name: p.name || "Linked Parent",
          email: p.email,
          phone: p.mobile || (p as any).phone,
          relationship: p.relationship || "Guardian",
          isPrimary: false,
        });
      }
    });

    // 2. Dossier parents
    if (Array.isArray(student360Dossier?.parents)) {
      student360Dossier.parents.forEach((p: any) => {
        if (!list.some((x) => (x.id && x.id === p.id) || (x.email && x.email === p.email))) {
          list.push({
            id: p.id,
            name: p.name || "Linked Parent",
            email: p.email,
            phone: p.mobile || p.phone,
            relationship: p.relationship || "Guardian",
            isPrimary: Boolean(p.isPrimary),
          });
        }
      });
    }

    // 3. Primary guardian from student record
    if (selectedStudent?.parentName || selectedStudent?.guardianName) {
      const pName = selectedStudent.parentName || selectedStudent.guardianName || "";
      const pPhone = selectedStudent.parentPhone || selectedStudent.guardianPhone || "";
      const pEmail = selectedStudent.parentEmail || "";
      if (!list.some((x) => x.name.toLowerCase() === pName.toLowerCase())) {
        list.unshift({
          name: pName,
          phone: pPhone,
          email: pEmail,
          relationship: "Primary Guardian on Record",
          isPrimary: true,
        });
      }
    }

    return list;
  }, [selectedStudent, studentParents, student360Dossier]);

  const handleOpenAttendanceWarning = (targetRecipient?: any) => {
    setWarningRecipient(targetRecipient || null);
    setWarningModalOpen(true);
  };

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

  // Load academics data (classes & sections) on demand for ward mapping and teacher allocation
  useEffect(() => {
    if (organizationId && (subtab === "parents" || selectedParent || selectedTeacher) && !academicsData) {
      getSchoolAdminAcademics(organizationId)
        .then((data) => setAcademicsData(data))
        .catch(() => {});
    }
  }, [organizationId, subtab, selectedParent, selectedTeacher, academicsData]);

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

            {subtab === "students" && (
              <button
                onClick={() => onOpenQuickAction("bulkImportStudents")}
                style={{
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  height: "36px",
                  padding: "0 14px",
                  background: "#FFFFFF",
                  color: "#0C1E33",
                  border: "1px solid #CBD5E1",
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
                  e.currentTarget.style.borderColor = "#94A3B8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#CBD5E1";
                }}
              >
                <Upload size={14} strokeWidth={2} />
                <span>Import Students CSV</span>
              </button>
            )}

            {subtab === "teachers" && (
              <button
                onClick={() => onOpenQuickAction("bulkImportTeachers")}
                style={{
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  height: "36px",
                  padding: "0 14px",
                  background: "#FFFFFF",
                  color: "#0C1E33",
                  border: "1px solid #CBD5E1",
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
                  e.currentTarget.style.borderColor = "#94A3B8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#CBD5E1";
                }}
              >
                <Upload size={14} strokeWidth={2} />
                <span>Import Teachers CSV</span>
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
                padding: "0px 24px 16px",
                gap: "8px",
                width: "100%",
                flexWrap: "nowrap",
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              {/* Student search */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 12px",
                  gap: "8px",
                  height: "40px",
                  border: "1px solid #E0E5EB",
                  borderRadius: "6px",
                  flex: "1 1 160px",
                  minWidth: "140px",
                  background: "#FFFFFF",
                }}
              >
                <Search size={15} strokeWidth={2} style={{ color: "#495D72", flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search students..."
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
                  padding: "0px 12px",
                  flex: "0 0 120px",
                  width: "120px",
                  height: "40px",
                  border: "1px solid",
                  borderColor: gradeFilter !== "all" ? "#0C1E33" : "#E0E5EB",
                  borderRadius: "6px",
                  background: gradeFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                  position: "relative",
                  flexShrink: 0,
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
                    paddingRight: "20px",
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
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "10px", color: gradeFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
              </div>

              {/* Section filter */}
              {uniqueSections.length > 0 && (
                <div
                  style={{
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "0px 12px",
                    flex: "0 0 115px",
                    width: "115px",
                    height: "40px",
                    border: "1px solid",
                    borderColor: sectionFilter !== "all" ? "#0C1E33" : "#E0E5EB",
                    borderRadius: "6px",
                    background: sectionFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                    position: "relative",
                    flexShrink: 0,
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
                      paddingRight: "20px",
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
                  <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "10px", color: sectionFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
                </div>
              )}

              {/* Attendance filter */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 12px",
                  flex: "0 0 145px",
                  width: "145px",
                  height: "40px",
                  border: "1px solid",
                  borderColor: attendanceFilter !== "all" ? "#0C1E33" : "#E0E5EB",
                  borderRadius: "6px",
                  background: attendanceFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                  position: "relative",
                  flexShrink: 0,
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
                    paddingRight: "20px",
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
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "10px", color: attendanceFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
              </div>

              {/* Fee status filter */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 12px",
                  flex: "0 0 120px",
                  width: "120px",
                  height: "40px",
                  border: "1px solid",
                  borderColor: feeFilter !== "all" ? "#0C1E33" : "#E0E5EB",
                  borderRadius: "6px",
                  background: feeFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                  position: "relative",
                  flexShrink: 0,
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
                    paddingRight: "20px",
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
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "10px", color: feeFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
              </div>

              {/* Academic Status filter */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "0px 12px",
                  flex: "0 0 135px",
                  width: "135px",
                  height: "40px",
                  border: "1px solid",
                  borderColor: statusFilter !== "all" ? "#0C1E33" : "#E0E5EB",
                  borderRadius: "6px",
                  background: statusFilter !== "all" ? "#F8FAFC" : "#FFFFFF",
                  position: "relative",
                  flexShrink: 0,
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
                    paddingRight: "20px",
                    paddingLeft: 0,
                    margin: 0,
                  }}
                >
                  <option value="all">Status: All</option>
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
                <ChevronDown size={14} strokeWidth={2} style={{ position: "absolute", right: "10px", color: statusFilter !== "all" ? "#0C1E33" : "#586C82", pointerEvents: "none" }} />
              </div>

              {/* Reset button - always rendered on same line, disabled until any filter active */}
              <button
                type="button"
                disabled={!hasActiveStudentFilters}
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
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "0 14px",
                  height: "40px",
                  flexShrink: 0,
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                  border: "1px solid",
                  borderColor: hasActiveStudentFilters ? "#0C1E33" : "#E2E8F0",
                  background: hasActiveStudentFilters ? "#0C1E33" : "#F8FAFC",
                  color: hasActiveStudentFilters ? "#FFFFFF" : "#94A3B8",
                  cursor: hasActiveStudentFilters ? "pointer" : "not-allowed",
                  opacity: hasActiveStudentFilters ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (hasActiveStudentFilters) {
                    e.currentTarget.style.background = "#1E293B";
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasActiveStudentFilters) {
                    e.currentTarget.style.background = "#0C1E33";
                  }
                }}
                title={hasActiveStudentFilters ? "Reset all filters" : "No filters active"}
              >
                <RefreshCw size={12} strokeWidth={2} />
                <span>Reset</span>
              </button>
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
                                setIsMappingWards(true);
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
                              setIsMappingWards(true);
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

            {/* Department Responsive Grid Cards */}
            {loading || refreshing || isSwitching ? (
              <div style={{ padding: "0 24px 24px", width: "100%", boxSizing: "border-box" }}>
                <TeacherSkeletonRows rows={4} />
              </div>
            ) : filteredDepartments.length === 0 ? (
              <div style={{ padding: "0 24px 24px", width: "100%", boxSizing: "border-box" }}>
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
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "18px",
                  padding: "0px 24px 24px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {filteredDepartments.map((d) => {
                  const subjectsList = d.subjects || [];
                  const isPending = (d.status || "").toLowerCase().includes("pend");
                  const hasHod = Boolean(
                    d.headTeacherId ||
                    (d.headName && d.headName !== "Unassigned" && d.headName !== "Department Head")
                  );

                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDept(d);
                      }}
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
        </div>
      )}

      {/* ============================================================== */}
      {/* STUDENT 360° PROFILE DRAWER (REUSABLE COMPONENT)               */}
      {/* ============================================================== */}
      <StudentDossierDrawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student360Tab={student360Tab}
        onTabChange={setStudent360Tab}
        onLifecycleAction={setLifecycleTarget}
        student360Dossier={student360Dossier}
        studentParents={studentParents}
        availableWarningParents={availableWarningParents}
        onOpenAttendanceWarning={handleOpenAttendanceWarning}
        warningFeedback={warningFeedback}
      />

      {/* ============================================================== */}
      {/* 1. SUPPORT STAFF DOSSIER DRAWER (REUSABLE COMPONENT)           */}
      {/* ============================================================== */}
      <StaffDossierDrawer
        staff={selectedStaff}
        onClose={() => setSelectedStaff(null)}
        staff360Tab={staff360Tab}
        onTabChange={setStaff360Tab}
        onLifecycleAction={setLifecycleTarget}
      />

      {/* ============================================================== */}
      {/* 2. GUARDIAN / PARENT DOSSIER DRAWER (REUSABLE COMPONENT)       */}
      {/* ============================================================== */}
      <ParentDossierDrawer
        parent={selectedParent}
        onClose={() => setSelectedParent(null)}
        organizationId={organizationId || ""}
        parents={parents}
        students={students}
        academicsData={academicsData}
        parent360Tab={parent360Tab}
        onTabChange={setParent360Tab}
        onLifecycleAction={setLifecycleTarget}
        onParentsUpdated={setParents}
        onParentSelected={setSelectedParent}
        isMappingWards={isMappingWards}
        onMappingWardsChange={setIsMappingWards}
      />

      {/* ============================================================== */}
      {/* 3. ACADEMIC DEPARTMENT DOSSIER DRAWER (REUSABLE COMPONENT)     */}
      {/* ============================================================== */}
      <DepartmentDossierDrawer
        department={selectedDept}
        isOpen={Boolean(selectedDept)}
        organizationId={organizationId || ""}
        allTeachers={teachers}
        allDepartments={departments}
        onClose={() => setSelectedDept(null)}
        onDepartmentUpdated={async () => {
          if (organizationId) {
            try {
              const updatedDepts = await getSchoolAdminDepartments(organizationId);
              setDepartments(updatedDepts || []);
              if (selectedDept) {
                const refreshed = (updatedDepts || []).find((d) => d.id === selectedDept.id);
                setSelectedDept(refreshed || null);
              }
            } catch (err) {
              console.error("Failed to refresh departments:", err);
            }
          }
        }}
      />

      {/* ============================================================== */}
      {/* TEACHER WORKLOAD PROFILE MODAL                                 */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* TEACHER DOSSIER DRAWER (REUSABLE COMPONENT)                   */}
      {/* ============================================================== */}
      <TeacherDossierDrawer
        teacher={selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        organizationId={organizationId || ""}
        teachers={teachers}
        academicsData={academicsData}
        teacher360Tab={teacher360Tab}
        onTabChange={setTeacher360Tab}
        onLifecycleAction={setLifecycleTarget}
        onTeachersUpdated={setTeachers}
        onTeacherSelected={setSelectedTeacher}
      />


      {/* Reusable Member Lifecycle Management Modal */}
      <MemberLifecycleModal
        member={lifecycleTarget}
        isOpen={Boolean(lifecycleTarget)}
        organizationId={organizationId || ""}
        onClose={() => setLifecycleTarget(null)}
        onSuccess={() => {
          handleRefresh();
          if (selectedStudent && (selectedStudent.id === lifecycleTarget?.id || selectedStudent.userId === lifecycleTarget?.id)) {
            setSelectedStudent(null);
          }
          if (selectedTeacher && (selectedTeacher.id === lifecycleTarget?.id || selectedTeacher.userId === lifecycleTarget?.id)) {
            setSelectedTeacher(null);
          }
          if (selectedStaff && (selectedStaff.id === lifecycleTarget?.id || (selectedStaff as any).userId === lifecycleTarget?.id)) {
            setSelectedStaff(null);
          }
          if (selectedParent && (selectedParent.id === lifecycleTarget?.id || (selectedParent as any).userId === lifecycleTarget?.id)) {
            setSelectedParent(null);
          }
        }}
      />

      {/* Statutory Attendance Warning Modal (Reusable Component) */}
      <AttendanceWarningModal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        student={selectedStudent}
        organizationId={organizationId || ""}
        student360Dossier={student360Dossier}
        availableWarningParents={availableWarningParents}
        initialRecipient={warningRecipient}
        onSuccess={(fb) => setWarningFeedback(fb)}
        onDossierRefreshed={(dossier) => setStudent360Dossier(dossier)}
      />
    </div>
  );
}
