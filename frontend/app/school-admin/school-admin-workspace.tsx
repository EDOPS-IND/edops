"use client";

import React, { useState } from "react";
import { SchoolAdminTab } from "./types";
import { useDashboardNavigation } from "../dashboard-navigation";
import { FeatureUnavailableCard, ThreeDotsLoading } from "../components/feature-unavailable-card";
import { GlobalPortalSearch } from "../components/global-portal-search";
import { DashboardPane } from "./dashboard-pane";
import { PeoplePane } from "./people-pane";
import { AcademicsPane } from "./academics-pane";
import { TimetablePane } from "./timetable-pane";
import { AttendanceLeavePane } from "./attendance-leave-pane";
import { LearningExamsPane } from "./learning-exams-pane";
import { FinancePane } from "./finance-pane";
import { CommunicationPane } from "./communication-pane";
import { OperationsPane } from "./operations-pane";
import { GovernancePane } from "./governance-pane";
import {
  LayoutDashboard, Users, GraduationCap, Briefcase, HeartHandshake,
  Building2, BookOpen, CalendarDays, CalendarCheck2, Award, CreditCard,
  MessageSquare, Bus, ShieldAlert, FileText, BarChart3, Sliders, History,
  Search, Bell, LogOut, RefreshCw, ChevronDown, Menu, X,
} from "lucide-react";
import {
  createSchoolAdminBroadcast, createSchoolAdminLeave,
  createSchoolAdminDiscipline, createSchoolAdminDepartment,
  createSchoolInvitation, directAdmitStudent, getSchoolAdminAcademics, getSchoolAdminStudents,
  getSchoolAdminTeachers, createAcademicSection, createAcademicProgram,
  getStudentAvatarUrl,
  createSchoolAdminExam,
} from "../edops-api";

// ─── Design Tokens (Strictly matching Student & Teacher Dashboard specification) ──
const S = {
  // Sidebar tokens
  sidebarBg: "#0b0f19",
  sidebarBorder: "rgba(255, 255, 255, 0.06)",
  itemActiveBg: "#1c2337",
  itemActiveText: "#ffffff",
  itemInactiveText: "#8a92a6",
  itemHoverBg: "rgba(255, 255, 255, 0.05)",
  groupLabel: "rgba(255, 255, 255, 0.38)",
  // Badges
  badge: "#E84040",
  warnBadge: "#D97706",
  online: "#22C55E",
  // Header tokens
  headerBg: "#FFFFFF",
  headerBorder: "rgba(206, 216, 229, 0.97)",
  headerInk: "#0c1e33",
  headerMuted: "#495d72",
  inputBg: "#F9FAFB",
  inputBorder: "#D0D5DD",
  // Canvas tokens
  canvasBg: "#f4f6f7",
  navy: "#0c1e33",
  slate: "#495d72",
  line: "#ced8e5",
  border: "#e4e6e9",
  chip: "#f5f6f8",
  faint: "#b3b3b3",
  avatarBg: "#1A1D24",
  avatarText: "#FFFFFF",
};

// ─── Nav item (Matching Student & Teacher Command Center) ──────────────────────
function NavItem({
  icon: Icon, label, active, badge, badgeVariant = "red", onClick,
}: {
  icon: React.ElementType; label: string; active: boolean;
  badge?: number; badgeVariant?: "red" | "amber"; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        all: "unset",
        boxSizing: "border-box",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "11px",
        height: "40px",
        padding: "0 12px",
        borderRadius: "10px",
        cursor: "pointer",
        position: "relative",
        background: active ? S.itemActiveBg : hover ? S.itemHoverBg : "transparent",
        color: active ? S.itemActiveText : hover ? "#ffffff" : S.itemInactiveText,
        fontWeight: active ? 600 : 450,
        fontSize: "13.5px",
        transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Icon
        size={18}
        strokeWidth={active ? 2 : 1.75}
        style={{
          color: active ? "#ffffff" : hover ? "#ffffff" : S.itemInactiveText,
          flexShrink: 0,
          transition: "color 0.15s ease",
        }}
      />
      <span style={{
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>

      {badge !== undefined && (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "18px",
          height: "18px",
          padding: "0 5px",
          borderRadius: "999px",
          fontSize: "10.5px",
          fontWeight: 700,
          background: badgeVariant === "amber" ? S.warnBadge : S.badge,
          color: "#fff",
          flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Section group label ─────────────────────────────────────────────────────
function NavGroup({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: "10px",
      fontWeight: 700,
      color: S.groupLabel,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      padding: "14px 12px 4px",
      userSelect: "none",
    }}>
      {label}
    </div>
  );
}

// ─── Workspace ───────────────────────────────────────────────────────────────
export function SchoolAdminWorkspace({
  schoolName = "School Workspace",
  organizationId,
  activeTab = "dashboard",
  activeSubTab = "",
  onTabChange,
  onSubTabChange,
  onOpenAction,
  onLogout,
}: {
  schoolName?: string;
  organizationId?: string;
  activeTab?: SchoolAdminTab;
  activeSubTab?: string;
  onTabChange?: (tab: SchoolAdminTab) => void;
  onSubTabChange?: (tab: SchoolAdminTab, subTab: string) => void;
  onOpenAction?: (action: string) => void;
  onLogout?: () => void;
}) {
  const [currentTab, setCurrentTab] = useState<SchoolAdminTab>(activeTab);
  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubTab);

  React.useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeSubTab !== undefined && activeSubTab !== currentSubTab) {
      setCurrentSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  const navigation = useDashboardNavigation(organizationId ?? "", "school_admin");
  const available = (tab: SchoolAdminTab) => {
    if (tab === "dashboard") return true;
    if (tab === "assignments" || tab === "exams" || tab === "results") {
      const parentKey = tab === "assignments" ? "learning" : "examinations";
      return available(parentKey as SchoolAdminTab);
    }
    if (!navigation.sections || navigation.sections.length === 0) return true;
    return navigation.sections.some(section =>
      section.key === tab ||
      section.items.some(item =>
        item.key === tab ||
        item.key.endsWith(`.${tab}`) ||
        item.key.endsWith(tab) ||
        tab.endsWith(`.${item.key}`) ||
        tab.endsWith(item.key)
      )
    );
  };
  const navIcons: Record<SchoolAdminTab, React.ElementType> = {
    dashboard: LayoutDashboard, students: GraduationCap, teachers: Users, staff: Briefcase, parents: HeartHandshake,
    departments: Building2, academics: BookOpen, timetable: CalendarDays, attendance: CalendarCheck2,
    learning: BookOpen, examinations: Award, assignments: BookOpen, exams: Award, results: Award,
    finance: CreditCard, communication: MessageSquare,
    operations: Bus, alerts: ShieldAlert, discipline: FileText, documents: FileText,
    reports: BarChart3, settings: Sliders, audit: History,
  };
  const [quickActionModal, setQuickActionModal] = useState<string | null>(null);
  const [actionTitle, setActionTitle] = useState("");
  const [actionScope, setActionScope] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [personName, setPersonName] = useState("");
  const [personEmail, setPersonEmail] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [personSpecialty, setPersonSpecialty] = useState("");
  const [personEmployeeId, setPersonEmployeeId] = useState("");
  const [personEmploymentType, setPersonEmploymentType] = useState("Regular Faculty");
  const [studentGender, setStudentGender] = useState("Male");
  const [studentDob, setStudentDob] = useState("");
  const [studentAdmissionNo, setStudentAdmissionNo] = useState("");
  const [studentRollNo, setStudentRollNo] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [academicSections, setAcademicSections] = useState<{ id: string; name: string; programName: string }[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [childSearch, setChildSearch] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptHeadTeacherId, setDeptHeadTeacherId] = useState("");
  const [deptLocation, setDeptLocation] = useState("");
  const [deptSubjectIds, setDeptSubjectIds] = useState<string[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [sectionYearId, setSectionYearId] = useState("");
  const [sectionProgramId, setSectionProgramId] = useState("");
  const [sectionName, setSectionName] = useState("A");
  const [sectionCapacity, setSectionCapacity] = useState(40);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicPrograms, setAcademicPrograms] = useState<any[]>([]);
  const [isCreatingNewClass, setIsCreatingNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassOrder, setNewClassOrder] = useState<number>(10);
  const [createdInvite, setCreatedInvite] = useState<{ token: string; email: string; role: string; expiresAt: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  const go = (tab: SchoolAdminTab, subTab?: string) => {
    if (tab === "assignments") {
      if (!available("learning")) return;
      setCurrentTab("learning");
      setCurrentSubTab("assignments");
      if (onSubTabChange) onSubTabChange("learning", "assignments");
      else if (onTabChange) onTabChange("assignments");
      return;
    }
    if (tab === "exams") {
      if (!available("examinations")) return;
      setCurrentTab("examinations");
      setCurrentSubTab("exams");
      if (onSubTabChange) onSubTabChange("examinations", "exams");
      else if (onTabChange) onTabChange("exams");
      return;
    }
    if (tab === "results") {
      if (!available("examinations")) return;
      setCurrentTab("examinations");
      setCurrentSubTab("results");
      if (onSubTabChange) onSubTabChange("examinations", "results");
      else if (onTabChange) onTabChange("results");
      return;
    }

    if (!available(tab)) return;
    setCurrentTab(tab);
    if (subTab) {
      setCurrentSubTab(subTab);
      if (onSubTabChange) onSubTabChange(tab, subTab);
      else if (onTabChange) onTabChange(tab);
    } else {
      if (onTabChange) onTabChange(tab);
    }
  };

  const handleDeptNameChange = (val: string) => {
    setDeptName(val);
    const words = val.trim().split(/\s+/).filter((w) => !/^(of|and|the|&)$/i.test(w));
    let auto = "";
    if (words.length >= 3) {
      auto = words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
    } else if (words.length === 2) {
      auto = (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 3) {
      auto = words[0].slice(0, 4).toUpperCase();
    }
    if (auto) setDeptCode(auto);
  };

  // Quick action state for Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"all" | "parents" | "teachers" | "students">("all");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState<"normal" | "high" | "urgent">("normal");
  const [broadcastChannels, setBroadcastChannels] = useState({ inApp: true, whatsapp: true, sms: false, email: false });

  // Quick action state for Exam
  const [examName, setExamName] = useState("");
  const [examTerm, setExamTerm] = useState("Term 1");
  const [examSectionId, setExamSectionId] = useState("");
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examStartTime, setExamStartTime] = useState("09:00");
  const [examEndTime, setExamEndTime] = useState("12:00");
  const [examMaxMarks, setExamMaxMarks] = useState(100);
  const [directAddWithoutInvite, setDirectAddWithoutInvite] = useState(false);

  const isPersonAction = ["addPrincipal", "addTeacher", "addStudent", "addStaff", "mapParent", "addParent"].includes(quickActionModal || "");
  const isDepartmentAction = quickActionModal === "addDepartment";
  const isSectionAction = ["addSection", "section"].includes(quickActionModal || "");
  const isClassAction = ["addClass", "program"].includes(quickActionModal || "");
  const isBroadcastAction = quickActionModal === "sendBroadcast";
  const isExamAction = quickActionModal === "scheduleExam";
  const detectedRole: 'principal' | 'teacher' | 'student' | 'staff' | 'parent' =
    quickActionModal === "addPrincipal" ? "principal" :
    quickActionModal === "addTeacher" ? "teacher" :
    quickActionModal === "addStudent" ? "student" :
    quickActionModal === "addStaff" ? "staff" : "parent";

  const triggerAction = (act: string) => {
    const globalActions = ["invite","year","subject","teacherAssignment","enrollment","school"];
    if (onOpenAction && globalActions.includes(act)) {
      onOpenAction(act);
    } else {
      setActionTitle(""); setActionScope(""); setActionNotes("");
      setPersonName(""); setPersonEmail(""); setPersonPhone(""); setPersonSpecialty("");
      setPersonEmployeeId(""); setPersonEmploymentType(act === "addStaff" ? "Permanent Staff" : act === "addPrincipal" ? "Tenured Principal" : "Regular Faculty");
      setSelectedClass(""); setSelectedSectionId(""); setSelectedChildIds([]); setChildSearch("");
      setStudentGender("Male"); setStudentDob(""); setStudentAdmissionNo(""); setStudentRollNo("");
      setDeptName(""); setDeptCode(""); setDeptHeadTeacherId(""); setDeptLocation(""); setDeptSubjectIds([]); setSubjectSearch("");
      setSectionYearId(""); setSectionProgramId(""); setSectionName("A"); setSectionCapacity(40);
      setIsCreatingNewClass(false); setNewClassName(""); setNewClassOrder(10);
      setCreatedInvite(null); setCopiedLink(false); setActionError("");
      setDirectAddWithoutInvite(false);
      setQuickActionModal(act);

      if (act === "sendBroadcast") {
        setBroadcastTitle("");
        setBroadcastAudience("all");
        setBroadcastMessage("");
        setBroadcastPriority("normal");
        setBroadcastChannels({ inApp: true, whatsapp: true, sms: false, email: false });
      } else if (act === "scheduleExam" && organizationId) {
        setExamName("");
        setExamTerm("Term 1");
        setExamSectionId("");
        setExamSubjectId("");
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setExamDate(d.toISOString().split("T")[0]);
        setExamStartTime("09:00");
        setExamEndTime("12:00");
        setExamMaxMarks(100);
        getSchoolAdminAcademics(organizationId).then((data) => {
          if (data?.sections) {
            setAcademicSections(data.sections);
            if (data.sections.length > 0) setExamSectionId(data.sections[0].id);
          }
          if (data?.subjects) {
            setAvailableSubjects(data.subjects);
            if (data.subjects.length > 0) setExamSubjectId(data.subjects[0].id);
          }
        }).catch(() => {});
      } else if (act === "addStudent" && organizationId) {
        getSchoolAdminAcademics(organizationId).then((data) => {
          if (data?.sections) setAcademicSections(data.sections);
        }).catch(() => {});
      } else if ((act === "mapParent" || act === "addParent") && organizationId) {
        getSchoolAdminStudents(organizationId).then((st) => {
          if (st) setAvailableStudents(st);
        }).catch(() => {});
      } else if (act === "addDepartment" && organizationId) {
        getSchoolAdminTeachers(organizationId).then((tc) => {
          if (tc) setAvailableTeachers(tc);
        }).catch(() => {});
        getSchoolAdminAcademics(organizationId).then((data) => {
          if (data?.subjects) setAvailableSubjects(data.subjects);
        }).catch(() => {});
      } else if ((act === "addSection" || act === "section" || act === "addClass" || act === "program") && organizationId) {
        getSchoolAdminAcademics(organizationId).then((data) => {
          if (data) {
            setAcademicYears(data.academicYears || []);
            setAcademicPrograms(data.programs || []);
            const cur = data.currentYear || data.academicYears?.find((y: any) => y.is_current) || data.academicYears?.[0];
            if (cur) setSectionYearId(cur.id);
            if (data.programs && data.programs.length > 0) {
              setSectionProgramId(data.programs[0].id);
              setIsCreatingNewClass(false);
            } else {
              setIsCreatingNewClass(true);
            }
          }
        }).catch(() => {});
      }
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActionModal) return;
    setActionBusy(true);
    setActionError("");
    try {
      if (organizationId) {
        if (isPersonAction) {
          if (detectedRole === "student" && directAddWithoutInvite) {
            await directAdmitStudent(organizationId, {
              name: personName.trim(),
              email: personEmail.trim().toLowerCase(),
              phone: personPhone.trim() || undefined,
              sectionId: selectedSectionId || undefined,
              admissionNo: studentAdmissionNo.trim() || undefined,
              rollNo: studentRollNo.trim() || undefined,
              gender: studentGender || "Not Specified",
              dob: studentDob || undefined,
            });
            setRefreshKey((k) => k + 1);
            setQuickActionModal(null);
            return;
          }

          const res = await createSchoolInvitation(organizationId, {
            name: personName.trim() || undefined,
            email: personEmail.trim().toLowerCase(),
            phone: personPhone.trim() || undefined,
            specialty: detectedRole === "teacher" ? personSpecialty.trim() || undefined : undefined,
            employeeId: (detectedRole === "teacher" || detectedRole === "staff" || detectedRole === "principal") && personEmployeeId.trim() ? personEmployeeId.trim() : undefined,
            employmentType: (detectedRole === "teacher" || detectedRole === "staff" || detectedRole === "principal") && personEmploymentType ? personEmploymentType : undefined,
            sectionId: detectedRole === "student" ? selectedSectionId || undefined : undefined,
            childStudentIds: detectedRole === "parent" && selectedChildIds.length > 0 ? selectedChildIds : undefined,
            role: detectedRole,
          });
          setRefreshKey((k) => k + 1);
          if (res && res.invitations && res.invitations[0]) {
            setCreatedInvite(res.invitations[0]);
            return;
          }
          setQuickActionModal(null);
          return;
        }

        if (isDepartmentAction) {
          await createSchoolAdminDepartment(organizationId, {
            name: deptName.trim(),
            code: (deptCode.trim() || deptName.trim().slice(0, 4) || "DEPT").toUpperCase(),
            headTeacherId: deptHeadTeacherId || undefined,
            subjectIds: deptSubjectIds.length > 0 ? deptSubjectIds : undefined,
            location: deptLocation.trim() || undefined,
          });
          setRefreshKey((k) => k + 1);
          setQuickActionModal(null);
          return;
        }

        if (isSectionAction) {
          let progId = sectionProgramId;
          if (isCreatingNewClass || !progId) {
            const rawClass = newClassName.trim().replace(/^class\s*/i, "");
            if (!rawClass) {
              throw new Error("Please enter a Class number or digit (e.g. 10)");
            }
            const fullClassName = `Class ${rawClass}`;
            const existingProg = academicPrograms.find(
              (p) => p.name.trim().toLowerCase() === fullClassName.toLowerCase()
            );
            if (existingProg) {
              progId = existingProg.id;
            } else {
              const seqOrder = Number(newClassOrder) || parseInt(rawClass, 10) || 10;
              const newProg = await createAcademicProgram(organizationId, {
                name: fullClassName,
                sequenceOrder: seqOrder,
              });
              progId = newProg?.id;
            }
          }
          if (!sectionYearId) {
            throw new Error("Please select an Academic Year");
          }
          if (!progId) {
            throw new Error("Please select or specify a Class");
          }
          const finalSectionName = sectionName.trim().toUpperCase();
          if (!finalSectionName) {
            throw new Error("Please enter a Section letter (e.g. A, B)");
          }
          const cap = Number(sectionCapacity) || 40;
          if (cap < 1 || cap > 5000) {
            throw new Error("Capacity must be between 1 and 5000");
          }
          await createAcademicSection(organizationId, {
            academicYearId: sectionYearId,
            programId: progId,
            name: finalSectionName,
            capacity: cap,
          });
          setRefreshKey((k) => k + 1);
          setQuickActionModal(null);
          return;
        }

        if (isClassAction) {
          const rawClass = (newClassName.trim() || actionTitle.trim()).replace(/^class\s*/i, "");
          if (!rawClass) {
            throw new Error("Please enter a Class number or digit (e.g. 10)");
          }
          const fullClassName = `Class ${rawClass}`;
          const seqOrder = Number(newClassOrder) || parseInt(rawClass, 10) || 10;
          await createAcademicProgram(organizationId, {
            name: fullClassName,
            sequenceOrder: seqOrder,
          });
          setRefreshKey((k) => k + 1);
          setQuickActionModal(null);
          return;
        }

        if (isBroadcastAction) {
          if (!broadcastTitle.trim()) throw new Error("Please enter broadcast title / subject");
          if (!broadcastMessage.trim()) throw new Error("Please enter broadcast message body");
          const activeChannels: string[] = [];
          if (broadcastChannels.inApp) activeChannels.push("in_app");
          if (broadcastChannels.whatsapp) activeChannels.push("whatsapp");
          if (broadcastChannels.sms) activeChannels.push("sms");
          if (broadcastChannels.email) activeChannels.push("email");
          if (activeChannels.length === 0) activeChannels.push("in_app");

          await createSchoolAdminBroadcast(organizationId, {
            title: broadcastTitle.trim(),
            message: broadcastMessage.trim(),
            channels: activeChannels,
            targetAudience: broadcastAudience,
            priority: broadcastPriority,
          });
          setRefreshKey((k) => k + 1);
          setQuickActionModal(null);
          return;
        }

        if (isExamAction) {
          if (!examName.trim()) throw new Error("Please enter examination title");
          if (!examSectionId) throw new Error("Please select a target Class & Section");
          if (!examSubjectId) throw new Error("Please select an Examination Subject");
          if (!examDate) throw new Error("Please choose an Examination Date");

          await createSchoolAdminExam(organizationId, {
            sectionId: examSectionId,
            subjectId: examSubjectId,
            examName: examName.trim(),
            term: examTerm,
            examDate: examDate,
            startTime: examStartTime,
            endTime: examEndTime,
            maxMarks: Number(examMaxMarks) || 100,
          });
          setRefreshKey((k) => k + 1);
          setQuickActionModal(null);
          return;
        }

        if (quickActionModal.toLowerCase().includes("broadcast") || quickActionModal.toLowerCase().includes("announcement")) {
          await createSchoolAdminBroadcast(organizationId, { title: actionTitle || "School Operational Notice", message: actionNotes || "Important announcement.", channels: ["in_app","whatsapp"], targetAudience: "all" });
        } else if (quickActionModal.toLowerCase().includes("leave")) {
          await createSchoolAdminLeave(organizationId, { leaveType: "Casual Leave", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0], reason: actionNotes || actionTitle || "Emergency absence" });
        } else if (quickActionModal.toLowerCase().includes("discipline")) {
          await createSchoolAdminDiscipline(organizationId, { studentName: actionTitle || "Student", classSection: actionScope || "10-A", incidentType: "Classroom Disruption", severity: "minor", description: actionNotes || "Incident noted", actionTaken: "Verbal counseling", parentNotified: true });
        } else if (quickActionModal.toLowerCase().includes("department")) {
          await createSchoolAdminDepartment(organizationId, { name: actionTitle, code: actionScope || actionTitle.slice(0,4).toUpperCase() });
        }
        setRefreshKey((k) => k + 1);
      }
      setQuickActionModal(null);
    } catch (err: any) {
      setActionError(err?.message || `Failed to complete ${quickActionModal}`);
    } finally {
      setActionBusy(false);
    }
  };

  const pageTitle: Partial<Record<SchoolAdminTab, string>> = {
    dashboard: "Dashboard", students: "Students", teachers: "Teachers & Workload",
    staff: "School Staff", parents: "Parents & Guardians", departments: "Departments",
    academics: "Academic Structure", timetable: "Timetable", attendance: "Attendance & Leave",
    learning: "Coursework & Curriculum", examinations: "Exams & Results", finance: "Fee Management",
    communication: "Communication", operations: "Transport & Facilities",
    discipline: "Discipline Register", documents: "Documents & Policies",
    reports: "Reports & Analytics", alerts: "Alert Center",
    settings: "School Settings", audit: "Audit Log",
  };

  const initials = schoolName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const adminAvatarUrl = getStudentAvatarUrl(schoolName, "admin@edops.internal");

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: S.canvasBg,
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: S.navy,
    }}>
      {/* ═══════════════════════════════════════════════
          S I D E B A R (Matching Student & Teacher Command Center)
      ═══════════════════════════════════════════════ */}
      <aside
        id="sidebar"
        aria-label="School Admin primary navigation"
        className="workspace-aside"
        style={{
          width: "240px",
          flexShrink: 0,
          background: S.sidebarBg,
          color: "#fff",
          height: "100vh",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          padding: 0,
          boxSizing: "border-box",
          zIndex: 40,
          borderRight: `1px solid ${S.sidebarBorder}`,
        }}
      >
        {/* Brand / Logo - Exactly 68px height matching Student & Teacher Command Center */}
        <div
          style={{
            height: "68px",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            cursor: "pointer",
            flexShrink: 0,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            boxSizing: "border-box",
          }}
          onClick={() => go("dashboard")}
          title="EDOPS School Admin Command Center"
        >
          <img
            src="/EDOPSLogo.png"
            alt="EDOPS School OS"
            style={{
              height: "36px",
              width: "auto",
              maxWidth: "140px",
              display: "block",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          />
        </div>

        {/* Scrollable Navigation Body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "12px 12px 14px",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
          }}
        >
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              flex: 1,
            }}
            aria-label="Sidebar navigation"
          >
            {navigation.error && (
              <p role="alert" style={{ color: "#FCA5A5", padding: "12px", fontSize: "12px" }}>
                {navigation.error}
              </p>
            )}
            {navigation.sections.map((section, idx) => (
              <React.Fragment key={section.key}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: S.groupLabel,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: idx === 0 ? "8px 12px 4px" : "14px 12px 4px",
                    userSelect: "none",
                  }}
                >
                  {section.label}
                </div>
                {section.items.map((item) => {
                  const tab = item.key.split(".").at(-1) as SchoolAdminTab;
                  return (
                    <NavItem
                      key={item.key}
                      icon={navIcons[tab] || LayoutDashboard}
                      label={item.label}
                      active={currentTab === tab}
                      onClick={() => go(tab)}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          M A I N   C O N T E N T   &   H E A D E R
      ═══════════════════════════════════════════════ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh" }}>
        {/* Top bar - Exactly 68px height matching Command Center Spec */}
        <header
          className="workspace-header"
        >
          {/* Left: Page Title & Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", whiteSpace: "nowrap", minWidth: 0 }}>
            <button
              type="button"
              aria-label="Open school admin navigation"
              className="workspace-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: S.navy, overflow: "hidden", textOverflow: "ellipsis" }}>
              School Admin Command Center
            </p>
            <span className="hidden sm:inline-block" style={{ width: "1px", height: "16px", background: S.line }} />
            <p className="hidden sm:inline-block" style={{ margin: 0, fontSize: "13px", color: S.slate }}>
              {pageTitle[currentTab] ?? currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
            </p>

            {currentTab === "dashboard" && (
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Refresh Dashboard"
                aria-label="Refresh Dashboard"
                style={{
                  all: "unset",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: S.slate,
                  marginLeft: "4px",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f2f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <RefreshCw size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div className="workspace-header-actions">

            {/* Search Input */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="workspace-search-btn"
              aria-label="Search portal"
            >
              <Search size={15} style={{ flexShrink: 0, color: "#64748b" }} className="search-icon" />
              <span className="search-label">Search portal...</span>
              <kbd className="search-kbd">⌘ K</kbd>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => go("alerts")}
              aria-label="Alerts"
              style={{
                all: "unset",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                borderRadius: "8px",
                border: `1px solid ${S.line}`,
                background: "#ffffff",
                cursor: "pointer",
                color: S.navy,
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f6f7")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <Bell size={15} strokeWidth={1.75} />
              <span
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: S.badge,
                  border: "1.5px solid #ffffff",
                }}
              />
            </button>

            {/* Avatar Dropdown - Exactly matching Student Dashboard Profile Avatar */}
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                title="School Admin Profile & Settings"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: profileMenuOpen ? "2px solid #0c1e33" : `1px solid ${S.border}`,
                  background: "#f0f4f8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: profileMenuOpen ? "0 0 0 3px rgba(12, 30, 51, 0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <img
                  src={adminAvatarUrl}
                  alt={schoolName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>

              {profileMenuOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 90 }}
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div
                    className="workspace-profile-dropdown"
                  >
                    <div style={{ padding: "10px 12px", borderBottom: `1px solid ${S.border}`, marginBottom: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          flexShrink: 0,
                          border: `1px solid ${S.border}`,
                          background: "#f0f4f8",
                        }}
                      >
                        <img
                          src={adminAvatarUrl}
                          alt={schoolName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                      <div style={{ minWidth: 0, overflow: "hidden" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: S.navy, letterSpacing: "-0.01em", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {schoolName}
                        </div>
                        <div style={{ fontSize: "11px", color: S.slate }}>
                          School Administrator
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        if (onLogout) onLogout();
                        else window.location.reload();
                      }}
                      style={{
                        all: "unset",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: S.navy,
                        cursor: "pointer",
                        borderRadius: "6px",
                        boxSizing: "border-box",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f6f7")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={15} strokeWidth={1.75} style={{ color: S.slate }} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content Canvas ────────────────────────── */}
        <div className="workspace-content-canvas" style={{ background: S.canvasBg }}>
          {navigation.loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "360px" }}>
              <ThreeDotsLoading size={10} color="#0c1e33" />
            </div>
          ) : !available(currentTab) && currentTab !== "dashboard" ? (
            <FeatureUnavailableCard
              title="This dashboard feature is unavailable for this school"
              featureName={currentTab ? currentTab.charAt(0).toUpperCase() + currentTab.slice(1) : undefined}
              onBackToDashboard={() => go("dashboard")}
              dashboardLabel="Return to Dashboard"
            />
          ) : (
            <>
              {currentTab === "dashboard" && (
                <DashboardPane key={`dashboard-${refreshKey}`} organizationId={organizationId} onNavigate={go} onOpenQuickAction={triggerAction} />
              )}
              {["students", "teachers", "staff", "parents", "departments"].includes(currentTab) && (
                <PeoplePane key={`people-${refreshKey}`} organizationId={organizationId} activeTab={currentTab as any} onOpenQuickAction={triggerAction} onTabChange={go} />
              )}
              {currentTab === "academics" && (
                <AcademicsPane
                  key={`academics-${refreshKey}`}
                  organizationId={organizationId}
                  activeTab={currentSubTab as any}
                  onTabChange={(st) => go("academics", st)}
                  onOpenQuickAction={triggerAction}
                />
              )}
              {currentTab === "timetable" && (
                <TimetablePane
                  key={`timetable-${refreshKey}`}
                  organizationId={organizationId}
                  activeViewMode={currentSubTab as any}
                  onViewModeChange={(vm) => go("timetable", vm)}
                />
              )}
              {currentTab === "attendance" && (
                <AttendanceLeavePane
                  key={`attendance-${refreshKey}`}
                  organizationId={organizationId}
                  activeTab={currentSubTab as any}
                  onTabChange={(st) => go("attendance", st)}
                />
              )}
              {["learning", "examinations", "assignments", "exams", "results"].includes(currentTab) && (
                <LearningExamsPane
                  key={`learning-${refreshKey}`}
                  organizationId={organizationId}
                  activeTab={
                    currentTab === "results" || currentSubTab === "results"
                      ? "results"
                      : currentTab === "exams" || currentSubTab === "exams" || currentTab === "examinations"
                      ? "exams"
                      : "assignments"
                  }
                  onTabChange={(subTab) => {
                    const parent = subTab === "assignments" ? "learning" : "examinations";
                    go(parent as SchoolAdminTab, subTab);
                  }}
                />
              )}
              {currentTab === "finance" && (
                <FinancePane
                  key={`finance-${refreshKey}`}
                  organizationId={organizationId}
                  activeTab={currentSubTab as any}
                  onTabChange={(st) => go("finance", st)}
                />
              )}
              {currentTab === "communication" && (
                <CommunicationPane
                  key={`communication-${refreshKey}`}
                  organizationId={organizationId}
                  activeTab={currentSubTab as any}
                  onTabChange={(st) => go("communication", st)}
                />
              )}
              {currentTab === "operations" && (
                <OperationsPane
                  key={`operations-${refreshKey}`}
                  organizationId={organizationId}
                  activeTab={currentSubTab as any}
                  onTabChange={(st) => go("operations", st)}
                />
              )}
              {["discipline", "documents", "reports", "alerts", "settings", "audit"].includes(currentTab) && (
                <GovernancePane key={`governance-${refreshKey}`} organizationId={organizationId} activeTab={currentTab as any} onTabChange={go} />
              )}
            </>
          )}
        </div>
      </main>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="workspace-drawer-backdrop">
          <button
            type="button"
            aria-label="Close navigation"
            className="workspace-drawer-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="workspace-drawer">
            {/* Top brand header with logo just like desktop view */}
            <div
              style={{
                height: "68px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 18px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                flexShrink: 0,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                onClick={() => { setMobileMenuOpen(false); go("dashboard"); }}
                title="EDOPS School Admin Portal"
              >
                <img
                  src="/EDOPSLogo.png"
                  alt="EDOPS School Admin Portal"
                  style={{
                    height: "34px",
                    width: "auto",
                    maxWidth: "130px",
                    display: "block",
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
                  }}
                />
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  all: "unset",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "#94a3b8",
                  background: "rgba(255, 255, 255, 0.05)",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {navigation.sections.map((section) => (
                <div key={section.key} style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 12px 4px" }}>
                    {section.label}
                  </div>
                  {section.items.map((item) => {
                    const tab = item.key.split(".").at(-1) as SchoolAdminTab;
                    const Icon = navIcons[tab] || LayoutDashboard;
                    const active = currentTab === tab;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          go(tab);
                        }}
                        className={`drawer-nav-item ${active ? "active" : ""}`}
                        style={{
                          all: "unset",
                          boxSizing: "border-box",
                          display: "flex",
                          alignItems: "center",
                          gap: "11px",
                          width: "100%",
                          height: "38px",
                          padding: "0 12px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: active ? 600 : 500,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          background: active ? "#1c2337" : "transparent",
                          color: active ? "#ffffff" : "#cbd5e1",
                          borderLeft: active ? "3px solid #F8E7C9" : "3px solid transparent",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Icon size={16} style={{ flexShrink: 0, color: active ? "#F8E7C9" : "#94a3b8" }} />
                        <span style={{ color: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Q U I C K   A C T I O N   D O S S I E R   D R A W E R
      ═══════════════════════════════════════════════ */}
      <style>{`
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
      {quickActionModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            animation: "edopsFadeIn 0.15s ease",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setQuickActionModal(null);
              setCreatedInvite(null);
            }
          }}
        >
          <aside
            style={{
              position: "relative",
              width: "580px",
              maxWidth: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              background: "#FFFFFF",
              boxShadow: "-8px 0 32px rgba(12, 30, 51, 0.14)",
              borderLeft: "1px solid #E2E8F0",
              animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              fontFamily: "'Poppins', sans-serif",
            }}
            role="dialog"
            aria-modal="true"
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {isPersonAction
                    ? `Member Onboarding Dossier · ${
                        detectedRole === "staff"
                          ? "Staff Member"
                          : detectedRole === "teacher"
                          ? "Faculty Teacher"
                          : detectedRole === "student"
                          ? "Enrolled Student"
                          : detectedRole === "parent"
                          ? "Guardian / Parent"
                          : "School Principal"
                      }`
                    : isDepartmentAction
                    ? "Academic Department Dossier · Register"
                    : isSectionAction
                    ? "Academic Structure Dossier · Section"
                    : isClassAction
                    ? "Academic Structure Dossier · Class"
                    : isBroadcastAction
                    ? "Communication Dispatch Dossier"
                    : isExamAction
                    ? "Assessment Schedule Dossier"
                    : "School Operations Dossier"}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setQuickActionModal(null);
                    setCreatedInvite(null);
                  }}
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

              {/* Title & Description - Clean without logo / icon */}
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 650,
                    color: "#0C1E33",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {isSectionAction
                    ? "Add Academic Section"
                    : isClassAction
                    ? "Add Class Program"
                    : quickActionModal === "addDepartment"
                    ? "Create Academic Department"
                    : quickActionModal === "addStudent"
                    ? "Add New Student"
                    : quickActionModal === "addTeacher"
                    ? "Add New Teacher"
                    : quickActionModal === "addStaff"
                    ? "Add New Staff Member"
                    : quickActionModal === "addPrincipal"
                    ? "Add School Principal"
                    : quickActionModal === "mapParent" || quickActionModal === "addParent"
                    ? "Map Parent / Guardian"
                    : isBroadcastAction
                    ? "Send School Broadcast"
                    : isExamAction
                    ? "Schedule Examination"
                    : quickActionModal.replace(/([A-Z])/g, " $1").trim()}
                </h3>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>
                  {quickActionModal === "addStaff"
                    ? "Enter staff member details, assign an employee ID, and generate an official onboarding invitation link."
                    : quickActionModal === "addTeacher"
                    ? "Enter faculty member details, subject specialty, and generate an official onboarding invitation link."
                    : quickActionModal === "addStudent"
                    ? "Enter student details, assign class, and generate an onboarding invitation link."
                    : quickActionModal === "mapParent" || quickActionModal === "addParent"
                    ? "Enter guardian contact details and link with enrolled student profiles."
                    : isDepartmentAction
                    ? "Configure department name, code, Head of Department, and discipline subjects."
                    : "Fill in the required information to complete the onboarding process."}
                </div>
              </div>
            </div>

            {createdInvite ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "16px", alignContent: "start" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px",
                    background: "#ECFDF5", border: "1px solid #A7F3D0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", color: "#065F46"
                  }}>
                    ✓
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 600, color: "#027A48", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Invitation Ready
                    </p>
                    <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 650, color: "#0C1E33", letterSpacing: "-0.02em" }}>
                      Invitation link generated
                    </h2>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475467", lineHeight: 1.5 }}>
                      An invitation was created for <strong style={{ color: "#0C1E33" }}>{createdInvite.email}</strong> as <strong style={{ color: "#0C1E33", textTransform: "capitalize" }}>{createdInvite.role}</strong>. Share this link for them to activate their account.
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                      Invitation URL
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== "undefined" ? `${window.location.origin}/?invite=${createdInvite.token}` : `/?invite=${createdInvite.token}`}
                        style={{
                          flex: 1,
                          padding: "9px 12px",
                          borderRadius: "6px",
                          border: "1px solid #CBD5E1",
                          fontSize: "12px",
                          background: "#F8FAFC",
                          color: "#0C1E33",
                          fontFamily: "monospace",
                          outline: "none",
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = typeof window !== "undefined" ? `${window.location.origin}/?invite=${createdInvite.token}` : `/?invite=${createdInvite.token}`;
                          navigator.clipboard.writeText(url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        style={{
                          boxSizing: "border-box",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          background: copiedLink ? "#047857" : "#0C1E33",
                          color: "#FFFFFF",
                          border: "none",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "background 0.15s ease",
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        {copiedLink ? "✓ Copied" : "Copy Link"}
                      </button>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                      Token expires in 48 hours. Can be redeemed once.
                    </span>
                  </div>
                </div>

                <div style={{
                  padding: "14px 24px",
                  background: "#FFFFFF",
                  borderTop: "1px solid #E2E8F0",
                  display: "flex",
                  justifyContent: "flex-end",
                  flexShrink: 0
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickActionModal(null);
                      setCreatedInvite(null);
                    }}
                    style={{
                      padding: "8px 24px",
                      borderRadius: "6px",
                      border: "none",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      background: "#0C1E33",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      fontFamily: "'Poppins', sans-serif",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#0C1E33")}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleActionSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                {actionError && (
                  <div style={{ margin: "16px 24px 0", padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", color: "#DC2626", fontSize: "12px" }}>
                    {actionError}
                  </div>
                )}

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px 24px",
                    display: "grid",
                    gap: "14px",
                    alignContent: "start",
                  }}
                >
                  {isPersonAction ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#475569", fontWeight: 500 }}>Assigned Role:</span>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "#0C1E33",
                          color: "#FFFFFF",
                        }}>
                          {detectedRole === "staff"
                            ? "Staff Member"
                            : detectedRole === "teacher"
                            ? "Teaching Faculty"
                            : detectedRole === "student"
                            ? "Enrolled Student"
                            : detectedRole === "parent"
                            ? "Guardian / Parent"
                            : "School Principal"}
                        </span>
                      </div>

                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Full Name <span style={{ color: "#D92D20" }}>*</span></span>
                        <input
                          required
                          type="text"
                          value={personName}
                          onChange={(e) => setPersonName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                        />
                      </label>

                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Email Address <span style={{ color: "#D92D20" }}>*</span></span>
                        <input
                          required
                          type="email"
                          value={personEmail}
                          onChange={(e) => setPersonEmail(e.target.value)}
                          placeholder="e.g. rahul.sharma@school.example"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                        />
                      </label>

                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        Phone Number
                        <input
                          type="tel"
                          value={personPhone}
                          onChange={(e) => setPersonPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                        />
                      </label>

                      {detectedRole === "teacher" && (
                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Subject Specialty <span style={{ color: "#D92D20" }}>*</span></span>
                          <input
                            required
                            type="text"
                            value={personSpecialty}
                            onChange={(e) => setPersonSpecialty(e.target.value)}
                            placeholder="e.g. Mathematics, Science, English"
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          />
                        </label>
                      )}

                      {(detectedRole === "teacher" || detectedRole === "staff" || detectedRole === "principal") && (
                        <>
                          <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Employee ID / Code</span>
                              <span style={{ fontSize: "11px", color: "#667085" }}>Optional (e.g. {detectedRole === "staff" ? "STF-1042" : "EMP-1042"})</span>
                            </div>
                            <input
                              type="text"
                              value={personEmployeeId}
                              onChange={(e) => setPersonEmployeeId(e.target.value)}
                              placeholder={detectedRole === "staff" ? "e.g. STF-1042 or ADM-089" : "e.g. EMP-1042 or TCH-089"}
                              style={{
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #D0D5DD",
                                fontSize: "13px",
                                outline: "none",
                                color: "#101828",
                                background: "#FFFFFF",
                                fontFamily: "inherit",
                              }}
                            />
                          </label>

                          <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                            <span>Employment Contract Type</span>
                            <select
                              value={personEmploymentType}
                              onChange={(e) => setPersonEmploymentType(e.target.value)}
                              style={{
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #D0D5DD",
                                fontSize: "13px",
                                outline: "none",
                                color: "#101828",
                                background: "#FFFFFF",
                                fontFamily: "inherit",
                              }}
                            >
                              {detectedRole === "staff" ? (
                                <>
                                  <option value="Permanent Staff">Permanent Staff (Full-Time)</option>
                                  <option value="Probationary Staff">Probationary Staff</option>
                                  <option value="Contractual Staff">Contractual Staff</option>
                                  <option value="Part-Time Staff">Part-Time / Support Staff</option>
                                </>
                              ) : detectedRole === "principal" ? (
                                <>
                                  <option value="Tenured Principal">Tenured Principal (Full-Time)</option>
                                  <option value="Acting Principal">Acting / Interim Principal</option>
                                  <option value="Contractual Principal">Contractual Administrator</option>
                                </>
                              ) : (
                                <>
                                  <option value="Regular Faculty">Regular Faculty (Permanent Full-Time)</option>
                                  <option value="Probationary Faculty">Probationary Faculty</option>
                                  <option value="Contractual Faculty">Contractual / Ad-hoc Faculty</option>
                                  <option value="Visiting / Part-Time">Visiting / Part-Time Faculty</option>
                                </>
                              )}
                            </select>
                          </label>
                        </>
                      )}

                      {detectedRole === "student" && (
                        <>
                          <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                            <span>Class <span style={{ color: "#D92D20" }}>*</span></span>
                            <select
                              required
                              value={selectedClass}
                              onChange={(e) => {
                                setSelectedClass(e.target.value);
                                setSelectedSectionId("");
                              }}
                              style={{
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #D0D5DD",
                                fontSize: "13px",
                                outline: "none",
                                color: "#101828",
                                background: "#FFFFFF",
                                fontFamily: "inherit",
                              }}
                            >
                              <option value="">Select Class...</option>
                              {Array.from(new Set(academicSections.map((s) => s.programName).filter(Boolean))).sort().map((cls) => (
                                <option key={cls} value={cls}>{cls}</option>
                              ))}
                            </select>
                          </label>

                          {selectedClass && (
                            <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                              <span>Section <span style={{ color: "#D92D20" }}>*</span></span>
                              <select
                                required
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                style={{
                                  padding: "9px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #D0D5DD",
                                  fontSize: "13px",
                                  outline: "none",
                                  color: "#101828",
                                  background: "#FFFFFF",
                                  fontFamily: "inherit",
                                }}
                              >
                                <option value="">Select Section...</option>
                                {academicSections
                                  .filter((s) => s.programName === selectedClass)
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                              </select>
                            </label>
                          )}

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                              <span>Gender</span>
                              <select
                                value={studentGender}
                                onChange={(e) => setStudentGender(e.target.value)}
                                style={{
                                  padding: "9px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #D0D5DD",
                                  fontSize: "13px",
                                  outline: "none",
                                  color: "#101828",
                                  background: "#FFFFFF",
                                  fontFamily: "inherit",
                                }}
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </label>

                            <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                              <span>Date of Birth</span>
                              <input
                                type="date"
                                value={studentDob}
                                onChange={(e) => setStudentDob(e.target.value)}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #D0D5DD",
                                  fontSize: "13px",
                                  outline: "none",
                                  color: "#101828",
                                  background: "#FFFFFF",
                                  fontFamily: "inherit",
                                }}
                              />
                            </label>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                              <span>Admission No <small style={{ color: "#667085", fontWeight: 400 }}>(Optional)</small></span>
                              <input
                                type="text"
                                placeholder="Auto (e.g. ADM-0003)"
                                value={studentAdmissionNo}
                                onChange={(e) => setStudentAdmissionNo(e.target.value)}
                                style={{
                                  padding: "9px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #D0D5DD",
                                  fontSize: "13px",
                                  outline: "none",
                                  color: "#101828",
                                  background: "#FFFFFF",
                                  fontFamily: "inherit",
                                }}
                              />
                            </label>

                            <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                              <span>Roll No <small style={{ color: "#667085", fontWeight: 400 }}>(Optional)</small></span>
                              <input
                                type="text"
                                placeholder="Auto (e.g. 001)"
                                value={studentRollNo}
                                onChange={(e) => setStudentRollNo(e.target.value)}
                                style={{
                                  padding: "9px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #D0D5DD",
                                  fontSize: "13px",
                                  outline: "none",
                                  color: "#101828",
                                  background: "#FFFFFF",
                                  fontFamily: "inherit",
                                }}
                              />
                            </label>
                          </div>

                          {/* Admission Option: Invite vs Direct Add */}
                          <div style={{ marginTop: "4px", display: "grid", gap: "6px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                              Admission &amp; Invitation Mode
                            </label>

                            <div style={{ display: "grid", gap: "8px" }}>
                              {/* Option 1: Send Invitation Link */}
                              <div
                                onClick={() => setDirectAddWithoutInvite(false)}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "12px",
                                  padding: "11px 14px",
                                  borderRadius: "8px",
                                  border: !directAddWithoutInvite ? "1.5px solid #0C1E33" : "1px solid #E2E8F0",
                                  background: !directAddWithoutInvite ? "#F8FAFC" : "#FFFFFF",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (directAddWithoutInvite) e.currentTarget.style.borderColor = "#CBD5E1";
                                }}
                                onMouseLeave={(e) => {
                                  if (directAddWithoutInvite) e.currentTarget.style.borderColor = "#E2E8F0";
                                }}
                              >
                                <div
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    border: !directAddWithoutInvite ? "5px solid #0C1E33" : "1.5px solid #CBD5E1",
                                    background: "#FFFFFF",
                                    flexShrink: 0,
                                    marginTop: "2px",
                                    transition: "all 0.15s ease",
                                    boxSizing: "border-box",
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                                      Send Invitation Link
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: 600,
                                        color: "#047857",
                                        background: "#ECFDF5",
                                        border: "1px solid #D1FAE5",
                                        padding: "1px 7px",
                                        borderRadius: "12px",
                                        lineHeight: "15px",
                                      }}
                                    >
                                      Recommended
                                    </span>
                                  </div>
                                  <p style={{ margin: "3px 0 0", fontSize: "11.5px", color: "#64748B", lineHeight: "1.4" }}>
                                    Generates secure digital onboarding token and sends an invitation email to the student
                                  </p>
                                </div>
                              </div>

                              {/* Option 2: Directly Add Student to Register */}
                              <div
                                onClick={() => setDirectAddWithoutInvite(true)}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "12px",
                                  padding: "11px 14px",
                                  borderRadius: "8px",
                                  border: directAddWithoutInvite ? "1.5px solid #0C1E33" : "1px solid #E2E8F0",
                                  background: directAddWithoutInvite ? "#F8FAFC" : "#FFFFFF",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  if (!directAddWithoutInvite) e.currentTarget.style.borderColor = "#CBD5E1";
                                }}
                                onMouseLeave={(e) => {
                                  if (!directAddWithoutInvite) e.currentTarget.style.borderColor = "#E2E8F0";
                                }}
                              >
                                <div
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    border: directAddWithoutInvite ? "5px solid #0C1E33" : "1.5px solid #CBD5E1",
                                    background: "#FFFFFF",
                                    flexShrink: 0,
                                    marginTop: "2px",
                                    transition: "all 0.15s ease",
                                    boxSizing: "border-box",
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                                      Directly Add Student to Register
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: 600,
                                        color: "#475569",
                                        background: "#F1F5F9",
                                        border: "1px solid #E2E8F0",
                                        padding: "1px 7px",
                                        borderRadius: "12px",
                                        lineHeight: "15px",
                                      }}
                                    >
                                      Direct Enrolment
                                    </span>
                                  </div>
                                  <p style={{ margin: "3px 0 0", fontSize: "11.5px", color: "#64748B", lineHeight: "1.4" }}>
                                    Enrolls student immediately into the active directory without sending an invitation email now (status: <em>Not Sent</em>)
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {detectedRole === "parent" && (
                        <div style={{ display: "grid", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                              Select Child / Children
                            </span>
                            {selectedChildIds.length > 0 && (
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#027A48", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "1px 8px", borderRadius: "10px" }}>
                                {selectedChildIds.length} child{selectedChildIds.length > 1 ? "ren" : ""} selected
                              </span>
                            )}
                          </div>

                          {availableStudents.length > 4 && (
                            <input
                              type="text"
                              placeholder="Search child by name or admission no..."
                              value={childSearch}
                              onChange={(e) => setChildSearch(e.target.value)}
                              style={{
                                padding: "7px 10px",
                                borderRadius: "6px",
                                border: "1px solid #D0D5DD",
                                fontSize: "12px",
                                outline: "none",
                                background: "#FFFFFF",
                                fontFamily: "inherit",
                              }}
                            />
                          )}

                          <div style={{
                            maxHeight: "150px",
                            overflowY: "auto",
                            border: "1px solid #D0D5DD",
                            borderRadius: "8px",
                            padding: "6px",
                            display: "grid",
                            gap: "4px",
                            background: "#FAFAFA",
                          }}>
                            {availableStudents
                              .filter((st) => {
                                if (!childSearch.trim()) return true;
                                const q = childSearch.toLowerCase();
                                return (st.name || "").toLowerCase().includes(q) || (st.admissionNo || "").toLowerCase().includes(q);
                              })
                              .map((st) => {
                                const studentId = st.id || st.userId;
                                const isSelected = selectedChildIds.includes(studentId);
                                return (
                                  <label
                                    key={studentId}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      background: isSelected ? "#EFF8FF" : "#FFFFFF",
                                      border: isSelected ? "1px solid #B2DDFF" : "1px solid #EAECF0",
                                      cursor: "pointer",
                                      fontSize: "12.5px",
                                      color: "#101828",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {
                                        setSelectedChildIds((prev) =>
                                          isSelected ? prev.filter((id) => id !== studentId) : [...prev, studentId]
                                        );
                                      }}
                                      style={{ cursor: "pointer" }}
                                    />
                                    <span style={{ fontWeight: isSelected ? 600 : 450 }}>{st.name}</span>
                                    {(st.grade || st.section) && (
                                      <span style={{ fontSize: "11px", color: "#667085", marginLeft: "auto" }}>
                                        {st.grade} {st.section ? `(${st.section})` : ""}
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            {availableStudents.length === 0 && (
                              <span style={{ fontSize: "12px", color: "#667085", padding: "10px", textAlign: "center" }}>
                                Loading or no students enrolled yet.
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : isDepartmentAction ? (
                    <>
                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Department Name <span style={{ color: "#D92D20" }}>*</span></span>
                        <input
                          required
                          type="text"
                          value={deptName}
                          onChange={(e) => handleDeptNameChange(e.target.value)}
                          placeholder="e.g. Science & Technology, Mathematics"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                        />
                      </label>

                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Department Code <span style={{ color: "#D92D20" }}>*</span></span>
                          <span style={{ fontSize: "11px", color: "#667085" }}>Auto-generated uppercase</span>
                        </div>
                        <input
                          required
                          type="text"
                          value={deptCode}
                          onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                          placeholder="e.g. SCI, MATH"
                          maxLength={10}
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "monospace",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        />
                      </label>

                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Head of Department (HoD)</span>
                        <select
                          value={deptHeadTeacherId}
                          onChange={(e) => setDeptHeadTeacherId(e.target.value)}
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                        >
                          <option value="">No HoD assigned yet</option>
                          {availableTeachers.map((t) => (
                            <option key={t.id || t.userId} value={t.id || t.userId}>
                              {t.name} ({t.email})
                            </option>
                          ))}
                        </select>
                      </label>

                      <div style={{ display: "grid", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                            Mapped Subjects
                          </span>
                          {deptSubjectIds.length > 0 && (
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#027A48", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "1px 8px", borderRadius: "10px" }}>
                              {deptSubjectIds.length} subject{deptSubjectIds.length > 1 ? "s" : ""} mapped
                            </span>
                          )}
                        </div>

                        {availableSubjects.length > 4 && (
                          <input
                            type="text"
                            placeholder="Filter subjects by name or code..."
                            value={subjectSearch}
                            onChange={(e) => setSubjectSearch(e.target.value)}
                            style={{
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #D0D5DD",
                              fontSize: "12px",
                              outline: "none",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          />
                        )}

                        <div style={{
                          maxHeight: "140px",
                          overflowY: "auto",
                          border: "1px solid #D0D5DD",
                          borderRadius: "8px",
                          padding: "6px",
                          display: "grid",
                          gap: "4px",
                          background: "#FAFAFA",
                        }}>
                          {availableSubjects
                            .filter((sub) => {
                              if (!subjectSearch.trim()) return true;
                              const q = subjectSearch.toLowerCase();
                              return (sub.name || "").toLowerCase().includes(q) || (sub.code || "").toLowerCase().includes(q);
                            })
                            .map((sub) => {
                              const isChecked = deptSubjectIds.includes(sub.id);
                              return (
                                <label
                                  key={sub.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    background: isChecked ? "#EFF8FF" : "#FFFFFF",
                                    border: isChecked ? "1px solid #B2DDFF" : "1px solid #EAECF0",
                                    cursor: "pointer",
                                    fontSize: "12.5px",
                                    color: "#101828",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setDeptSubjectIds((prev) =>
                                        isChecked ? prev.filter((id) => id !== sub.id) : [...prev, sub.id]
                                      );
                                    }}
                                    style={{ cursor: "pointer" }}
                                  />
                                  <span style={{ fontWeight: isChecked ? 600 : 450 }}>{sub.name}</span>
                                  {sub.code && (
                                    <span style={{ fontSize: "11px", color: "#667085", marginLeft: "auto", fontFamily: "monospace" }}>
                                      {sub.code}
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          {availableSubjects.length === 0 && (
                            <span style={{ fontSize: "12px", color: "#667085", padding: "10px", textAlign: "center" }}>
                              No subjects available yet. You can create subjects under Academics.
                            </span>
                          )}
                        </div>
                      </div>

                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Room / Location <span style={{ fontSize: "11px", color: "#667085", fontWeight: 400 }}>(Optional)</span></span>
                        <input
                          type="text"
                          value={deptLocation}
                          onChange={(e) => setDeptLocation(e.target.value)}
                          placeholder="e.g. Science Block, Room 204"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                        />
                      </label>
                    </>
                  ) : isSectionAction ? (
                    <>
                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Academic Year <span style={{ color: "#D92D20" }}>*</span></span>
                        <select
                          required
                          value={sectionYearId}
                          onChange={(e) => setSectionYearId(e.target.value)}
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                        >
                          <option value="">Select Academic Year...</option>
                          {academicYears.map((yr) => (
                            <option key={yr.id} value={yr.id}>
                              {yr.name} {yr.is_current || yr.isCurrent ? "(Current)" : ""}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div style={{ display: "grid", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                            Class <span style={{ color: "#D92D20" }}>*</span>
                          </span>
                          {academicPrograms.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingNewClass(!isCreatingNewClass);
                                if (!isCreatingNewClass && !newClassName) {
                                  setNewClassName("");
                                }
                              }}
                              style={{
                                all: "unset",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                color: "#0284C7",
                                cursor: "pointer",
                              }}
                            >
                              {isCreatingNewClass ? "← Choose existing class" : "+ Create new class"}
                            </button>
                          )}
                        </div>

                        {(!isCreatingNewClass && academicPrograms.length > 0) ? (
                          <select
                            required
                            value={sectionProgramId}
                            onChange={(e) => {
                              if (e.target.value === "__new__") {
                                setIsCreatingNewClass(true);
                              } else {
                                setSectionProgramId(e.target.value);
                              }
                            }}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          >
                            <option value="">Select Class...</option>
                            {academicPrograms.map((prog) => (
                              <option key={prog.id} value={prog.id}>
                                {prog.name}
                              </option>
                            ))}
                            <option value="__new__">+ Create new class...</option>
                          </select>
                        ) : (
                          <div style={{ display: "grid", gap: "6px" }}>
                            <div style={{
                              display: "flex",
                              alignItems: "stretch",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              background: "#FFFFFF",
                              overflow: "hidden",
                            }}>
                              <div style={{
                                padding: "9px 14px",
                                background: "#F2F4F7",
                                borderRight: "1px solid #D0D5DD",
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#344054",
                                display: "flex",
                                alignItems: "center",
                                userSelect: "none",
                              }}>
                                Class
                              </div>
                              <input
                                required
                                type="text"
                                value={newClassName}
                                onChange={(e) => {
                                  const clean = e.target.value.replace(/^class\s*/i, "").trimStart();
                                  setNewClassName(clean);
                                  const parsed = parseInt(clean, 10);
                                  if (!isNaN(parsed)) {
                                    setNewClassOrder(parsed);
                                  }
                                }}
                                placeholder="Enter digit (e.g. 10, 9, 1)"
                                style={{
                                  flex: 1,
                                  padding: "9px 12px",
                                  border: "none",
                                  outline: "none",
                                  fontSize: "13px",
                                  color: "#101828",
                                  background: "transparent",
                                  fontFamily: "inherit",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "11px", color: "#667085" }}>
                              {newClassName.trim()
                                ? `Will create "Class ${newClassName.trim()}" and attach Section "${(sectionName.trim() || 'A').toUpperCase()}".`
                                : 'Enter digit of class (e.g. 10 for Class 10).'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Section Identifier <span style={{ color: "#D92D20" }}>*</span></span>
                          <input
                            required
                            type="text"
                            maxLength={10}
                            value={sectionName}
                            onChange={(e) => setSectionName(e.target.value.toUpperCase())}
                            placeholder="e.g. A, B, C"
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                              textTransform: "uppercase",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                            }}
                          />
                        </label>

                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Student Capacity <span style={{ color: "#D92D20" }}>*</span></span>
                          <input
                            required
                            type="number"
                            min={1}
                            max={500}
                            value={sectionCapacity}
                            onChange={(e) => setSectionCapacity(Number(e.target.value))}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          />
                        </label>
                      </div>
                    </>
                  ) : isClassAction ? (
                    <>
                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Class <span style={{ color: "#D92D20" }}>*</span></span>
                        <div style={{
                          display: "flex",
                          alignItems: "stretch",
                          borderRadius: "8px",
                          border: "1px solid #D0D5DD",
                          background: "#FFFFFF",
                          overflow: "hidden",
                        }}>
                          <div style={{
                            padding: "9px 14px",
                            background: "#F2F4F7",
                            borderRight: "1px solid #D0D5DD",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#344054",
                            display: "flex",
                            alignItems: "center",
                            userSelect: "none",
                          }}>
                            Class
                          </div>
                          <input
                            required
                            type="text"
                            value={newClassName}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/^class\s*/i, "").trimStart();
                              setNewClassName(clean);
                              const parsed = parseInt(clean, 10);
                              if (!isNaN(parsed)) {
                                setNewClassOrder(parsed);
                              }
                            }}
                            placeholder="Enter digit (e.g. 10, 9, 1)"
                            style={{
                              flex: 1,
                              padding: "9px 12px",
                              border: "none",
                              outline: "none",
                              fontSize: "13px",
                              color: "#101828",
                              background: "transparent",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "11px", color: "#667085" }}>
                          {newClassName.trim() ? `Will create "Class ${newClassName.trim()}".` : 'Enter digit of class (e.g. 10 for Class 10).'}
                        </span>
                      </label>
                    </>
                  ) : isBroadcastAction ? (
                    <>
                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Broadcast Subject / Title <span style={{ color: "#D92D20" }}>*</span></span>
                        <input
                          required
                          type="text"
                          value={broadcastTitle}
                          onChange={(e) => setBroadcastTitle(e.target.value)}
                          placeholder="e.g. Annual Sports Meet Notice or Winter Vacation Announcement"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                        />
                      </label>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Target Audience</span>
                          <select
                            value={broadcastAudience}
                            onChange={(e) => setBroadcastAudience(e.target.value as any)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          >
                            <option value="all">All Stakeholders (Whole School)</option>
                            <option value="parents">Parents Only</option>
                            <option value="teachers">Teachers & Staff Only</option>
                            <option value="students">Students Only</option>
                          </select>
                        </label>

                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Urgency / Priority</span>
                          <select
                            value={broadcastPriority}
                            onChange={(e) => setBroadcastPriority(e.target.value as any)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          >
                            <option value="normal">Normal Announcement</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent / Emergency Alert</option>
                          </select>
                        </label>
                      </div>

                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Broadcast Message Body <span style={{ color: "#D92D20" }}>*</span></span>
                        <textarea
                          required
                          rows={4}
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder="Type the message to be dispatched to recipients..."
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            resize: "vertical",
                            fontFamily: "inherit",
                          }}
                        />
                      </label>

                      <div style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#344054" }}>Delivery Channels</span>
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "#344054" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={broadcastChannels.inApp}
                              onChange={(e) => setBroadcastChannels({ ...broadcastChannels, inApp: e.target.checked })}
                            />
                            In-App Notification
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={broadcastChannels.whatsapp}
                              onChange={(e) => setBroadcastChannels({ ...broadcastChannels, whatsapp: e.target.checked })}
                            />
                            WhatsApp Notification
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={broadcastChannels.sms}
                              onChange={(e) => setBroadcastChannels({ ...broadcastChannels, sms: e.target.checked })}
                            />
                            SMS
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={broadcastChannels.email}
                              onChange={(e) => setBroadcastChannels({ ...broadcastChannels, email: e.target.checked })}
                            />
                            Email Dispatch
                          </label>
                        </div>
                      </div>
                    </>
                  ) : isExamAction ? (
                    <>
                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        <span>Examination Name / Assessment Title <span style={{ color: "#D92D20" }}>*</span></span>
                        <input
                          required
                          type="text"
                          value={examName}
                          onChange={(e) => setExamName(e.target.value)}
                          placeholder="e.g. Mid-Term Mathematics Assessment or Unit Test 1"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            background: "#FFFFFF",
                            fontFamily: "inherit",
                          }}
                        />
                      </label>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Academic Term</span>
                          <select
                            value={examTerm}
                            onChange={(e) => setExamTerm(e.target.value)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          >
                            <option value="Term 1">Term 1</option>
                            <option value="Term 2">Term 2</option>
                            <option value="Mid-Term">Mid-Term</option>
                            <option value="Finals / Annual">Finals / Annual</option>
                            <option value="Unit Assessment">Unit Assessment</option>
                          </select>
                        </label>

                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Target Class & Section <span style={{ color: "#D92D20" }}>*</span></span>
                          <select
                            required
                            value={examSectionId}
                            onChange={(e) => setExamSectionId(e.target.value)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          >
                            <option value="">Select Class & Section...</option>
                            {academicSections.map((sec) => (
                              <option key={sec.id} value={sec.id}>
                                {sec.programName ? `${sec.programName} - Section ${sec.name}` : `Section ${sec.name}`}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Subject <span style={{ color: "#D92D20" }}>*</span></span>
                          <select
                            required
                            value={examSubjectId}
                            onChange={(e) => setExamSubjectId(e.target.value)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          >
                            <option value="">Select Subject...</option>
                            {availableSubjects.map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name} {sub.code ? `(${sub.code})` : ""}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Exam Date <span style={{ color: "#D92D20" }}>*</span></span>
                          <input
                            required
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          />
                        </label>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Start Time</span>
                          <input
                            type="time"
                            value={examStartTime}
                            onChange={(e) => setExamStartTime(e.target.value)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          />
                        </label>

                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>End Time</span>
                          <input
                            type="time"
                            value={examEndTime}
                            onChange={(e) => setExamEndTime(e.target.value)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          />
                        </label>

                        <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>Max Marks</span>
                          <input
                            type="number"
                            min={10}
                            max={500}
                            value={examMaxMarks}
                            onChange={(e) => setExamMaxMarks(Number(e.target.value))}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      {[
                        { id: "title", label: "Full Name / Title", value: actionTitle, set: setActionTitle, placeholder: "Enter name or title…", required: true },
                        { id: "scope", label: "Class / Department Scope", value: actionScope, set: setActionScope, placeholder: "e.g. Class 10-A or Science Dept", required: false },
                      ].map((f) => (
                        <label key={f.id} style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                          <span>{f.label}{f.required && <span style={{ color: "#D92D20" }}> *</span>}</span>
                          <input
                            required={f.required}
                            type="text"
                            value={f.value}
                            onChange={(e) => f.set(e.target.value)}
                            placeholder={f.placeholder}
                            style={{
                              padding: "9px 12px",
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: "13px",
                              outline: "none",
                              color: "#101828",
                              background: "#FFFFFF",
                              fontFamily: "inherit",
                            }}
                          />
                        </label>
                      ))}
                      <label style={{ display: "grid", gap: "5px", fontSize: "12px", fontWeight: 500, color: "#344054" }}>
                        Operational Notes
                        <textarea
                          rows={3}
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          placeholder="Notes, roll number or details…"
                          style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #D0D5DD",
                            fontSize: "13px",
                            outline: "none",
                            color: "#101828",
                            resize: "vertical",
                            fontFamily: "inherit",
                          }}
                        />
                      </label>
                    </>
                  )}

                  </div>

                  {/* Sticky Drawer Footer */}
                  <div
                    style={{
                      padding: "14px 24px",
                      background: "#FFFFFF",
                      borderTop: "1px solid #E2E8F0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setQuickActionModal(null)}
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: 500,
                        color: "#475569",
                        cursor: "pointer",
                        background: "#FFFFFF",
                        fontFamily: "'Poppins', sans-serif",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionBusy}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 20px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        background: "#0C1E33",
                        color: "#FFFFFF",
                        cursor: actionBusy ? "wait" : "pointer",
                        opacity: actionBusy ? 0.7 : 1,
                        fontFamily: "'Poppins', sans-serif",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => { if (!actionBusy) e.currentTarget.style.background = "#1B3554"; }}
                      onMouseLeave={(e) => { if (!actionBusy) e.currentTarget.style.background = "#0C1E33"; }}
                    >
                      {actionBusy
                        ? "Processing…"
                        : detectedRole === "student" && directAddWithoutInvite
                        ? "Directly Admit Student"
                        : quickActionModal === "addStaff"
                        ? "Send Staff Invite Link"
                        : quickActionModal === "addTeacher"
                        ? "Send Teacher Invite Link"
                        : quickActionModal === "addStudent"
                        ? "Send Student Invite Link"
                        : quickActionModal === "mapParent" || quickActionModal === "addParent"
                        ? "Send Guardian Invite Link"
                        : isPersonAction
                        ? "Generate Invite Link"
                        : isDepartmentAction
                        ? "Create Department"
                        : isSectionAction
                        ? (isCreatingNewClass ? "Create Class & Section" : "Create Section")
                        : isClassAction
                        ? "Create Class"
                        : isExamAction
                        ? "Schedule Examination"
                        : isBroadcastAction
                        ? "Send Broadcast Dispatch"
                        : "Confirm & Log"}
                    </button>
                  </div>
                </form>
            )}
          </aside>
        </div>
      )}

      {/* Global Navigation Search Modal (Cmd+K / Settings Search) */}
      <GlobalPortalSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        role="school_admin"
        onNavigate={(section, subTab) => go(section as SchoolAdminTab, subTab)}
        onOpenAction={(action) => setQuickActionModal(action)}
      />
    </div>
  );
}
