"use client";

import React, { useState } from "react";
import { SchoolAdminTab } from "./types";
import { useDashboardNavigation } from "../dashboard-navigation";
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
  Search, Bell, LogOut, RefreshCw, ChevronDown,
} from "lucide-react";
import {
  createSchoolAdminBroadcast, createSchoolAdminLeave,
  createSchoolAdminDiscipline, createSchoolAdminDepartment,
  createSchoolInvitation, getSchoolAdminAcademics, getSchoolAdminStudents,
  getSchoolAdminTeachers, createAcademicSection, createAcademicProgram,
} from "../edops-api";

// ─── Colour palette (NO purple / blue gradients) ────────────────────────────
// Inspired by the attached screenshot: dark sidebar, white content, clean type
const S = {
  // sidebar
  bg:         "#111318",   // very dark charcoal
  border:     "#1E2128",   // subtle divider
  itemText:   "#8C909A",   // default nav text
  itemHover:  "#1A1D24",   // hover bg
  itemActive: "#1E2128",   // active bg
  activeBar:  "#FFFFFF",   // left accent bar – white keeps it neutral
  activeTxt:  "#FFFFFF",   // active label
  groupLabel: "#444750",   // section header
  // badges
  badge:      "#E84040",   // notification red
  warnBadge:  "#D97706",   // amber warning
  // online dot
  online:     "#22C55E",
  // header
  headerBg:   "#FFFFFF",
  headerBorder:"#EAECF0",
  headerInk:  "#101828",
  headerMuted:"#667085",
  inputBg:    "#F9FAFB",
  inputBorder:"#D0D5DD",
  // content
  canvasBg:   "#F7F8FA",
  // avatar – monochrome initials
  avatarBg:   "#1A1D24",
  avatarText: "#FFFFFF",
};

// ─── Nav item ────────────────────────────────────────────────────────────────
function NavItem({
  icon: Icon, label, active, badge, badgeVariant = "red", onClick,
}: {
  icon: React.ElementType; label: string; active: boolean;
  badge?: number; badgeVariant?: "red" | "amber"; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const showHighlight = active || hover;
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
        gap: "9px",
        padding: "7px 12px 7px 14px",
        borderRadius: "7px",
        cursor: "pointer",
        position: "relative",
        background: active ? S.itemActive : hover ? S.itemHover : "transparent",
        transition: "background 0.12s",
      }}
    >
      {/* left accent bar – only when active */}
      {active && (
        <span style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "2px",
          height: "16px",
          borderRadius: "0 2px 2px 0",
          background: S.activeBar,
        }} />
      )}

      <Icon
        size={15}
        strokeWidth={active ? 2 : 1.75}
        style={{ color: active ? S.activeTxt : hover ? "#C0C4CC" : S.itemText, flexShrink: 0 }}
      />

      <span style={{
        flex: 1,
        fontSize: "13px",
        fontWeight: active ? 500 : 400,
        color: active ? S.activeTxt : hover ? "#C0C4CC" : S.itemText,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        letterSpacing: "0.005em",
      }}>
        {label}
      </span>

      {badge !== undefined && (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "17px",
          height: "17px",
          padding: "0 4px",
          borderRadius: "999px",
          fontSize: "10px",
          fontWeight: 600,
          background: badgeVariant === "amber" ? S.warnBadge : S.badge,
          color: "#fff",
          letterSpacing: "0",
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
      padding: "18px 14px 5px",
      fontSize: "10px",
      fontWeight: 600,
      color: S.groupLabel,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      userSelect: "none",
    }}>
      {label}
    </div>
  );
}

// ─── Workspace ───────────────────────────────────────────────────────────────
export function SchoolAdminWorkspace({
  schoolName = "Delhi Public Academy",
  organizationId,
  activeTab = "dashboard",
  onTabChange,
  onOpenAction,
  onLogout,
}: {
  schoolName?: string;
  organizationId?: string;
  activeTab?: SchoolAdminTab;
  onTabChange?: (tab: SchoolAdminTab) => void;
  onOpenAction?: (action: string) => void;
  onLogout?: () => void;
}) {
  const [currentTab, setCurrentTab] = useState<SchoolAdminTab>(activeTab);
  const navigation = useDashboardNavigation(organizationId ?? "", "school_admin");
  const available = (tab: SchoolAdminTab) => {
    if (!navigation.sections || navigation.sections.length === 0) return true;
    return navigation.sections.some(section =>
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
    learning: BookOpen, examinations: Award, finance: CreditCard, communication: MessageSquare,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const go = (tab: SchoolAdminTab) => {
    if (!available(tab)) return;
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
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

  const isPersonAction = ["addPrincipal", "addTeacher", "addStudent", "addStaff", "mapParent", "addParent"].includes(quickActionModal || "");
  const isDepartmentAction = quickActionModal === "addDepartment";
  const isSectionAction = ["addSection", "section"].includes(quickActionModal || "");
  const isClassAction = ["addClass", "program"].includes(quickActionModal || "");
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
      setPersonEmployeeId(""); setPersonEmploymentType("Regular Faculty");
      setSelectedClass(""); setSelectedSectionId(""); setSelectedChildIds([]); setChildSearch("");
      setDeptName(""); setDeptCode(""); setDeptHeadTeacherId(""); setDeptLocation(""); setDeptSubjectIds([]); setSubjectSearch("");
      setSectionYearId(""); setSectionProgramId(""); setSectionName("A"); setSectionCapacity(40);
      setIsCreatingNewClass(false); setNewClassName(""); setNewClassOrder(10);
      setCreatedInvite(null); setCopiedLink(false); setActionError("");
      setQuickActionModal(act);

      if (act === "addStudent" && organizationId) {
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
            const seqOrder = Number(newClassOrder) || parseInt(rawClass, 10) || 10;
            const newProg = await createAcademicProgram(organizationId, {
              name: fullClassName,
              sequenceOrder: seqOrder,
            });
            progId = newProg?.id;
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

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: S.canvasBg,
      fontFamily: 'var(--font-space-grotesk), "Inter", system-ui, sans-serif',
    }}>
      {/* ═══════════════════════════════════════════════
          S I D E B A R
      ═══════════════════════════════════════════════ */}
      <aside style={{
        width: "228px",
        flexShrink: 0,
        background: S.bg,
        borderRight: `1px solid ${S.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        overflowX: "hidden",
        // thin custom scrollbar
        scrollbarWidth: "thin",
        scrollbarColor: "#2A2D35 transparent",
      }}>

        {/* ── Logo / Brand ────────────────────────────── */}
        <div style={{
          height: "58px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: `1px solid ${S.border}`,
          gap: "10px",
          flexShrink: 0,
        }}>
          {/* Proper EDOPS Logo */}
          <div style={{
            height: "28px",
            display: "flex",
            alignItems: "center",
          }}>
            <img src="/logo.svg" alt="EDOPS School OS" style={{ height: "100%", width: "auto", display: "block" }} />
          </div>
        </div>



        {/* ── Navigation ──────────────────────────────── */}
        <nav style={{ flex: 1, padding: "2px 8px 12px", display: "flex", flexDirection: "column" }}>
          {navigation.error && <p role="alert" style={{ color: "#FCA5A5", padding: "12px", fontSize: "12px" }}>{navigation.error}</p>}
          {navigation.sections.map(section => (
            <React.Fragment key={section.key}>
              <NavGroup label={section.label} />
              {section.items.map(item => {
                const tab = item.key.split(".").at(-1) as SchoolAdminTab;
                return <NavItem key={item.key} icon={navIcons[tab]} label={item.label} active={currentTab === tab} onClick={() => go(tab)} />;
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* ── Sign out ────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${S.border}`,
          padding: "10px 8px",
          flexShrink: 0,
        }}>
          <button
            onClick={() => onLogout ? onLogout() : window.location.reload()}
            style={{
              all: "unset",
              boxSizing: "border-box",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "7px 12px",
              borderRadius: "7px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 400,
              color: S.itemText,
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = S.itemHover; e.currentTarget.style.color = "#C0C4CC"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = S.itemText; }}
          >
            <LogOut size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          M A I N
      ═══════════════════════════════════════════════ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100vh", overflow: "auto" }}>

        {/* ── Top bar ─────────────────────────────────── */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          height: "58px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          background: S.headerBg,
          borderBottom: `1px solid ${S.headerBorder}`,
          gap: "16px",
          flexShrink: 0,
        }}>
          {/* Left – page title */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <h1 style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: S.headerInk,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {pageTitle[currentTab] ?? currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}
            </h1>
            {currentTab === "dashboard" && (
              <button
                onClick={() => window.location.reload()}
                title="Refresh"
                style={{
                  all: "unset",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "26px",
                  height: "26px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: S.headerMuted,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F2F4F7")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <RefreshCw size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Right – actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {/* Search */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              height: "34px",
              padding: "0 11px",
              border: `1px solid ${searchFocused ? "#98A2B3" : S.inputBorder}`,
              borderRadius: "8px",
              background: S.inputBg,
              transition: "border-color 0.15s",
            }}>
              <Search size={13} strokeWidth={2} style={{ color: S.headerMuted, flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search…"
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  color: S.headerInk,
                  width: "148px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Bell */}
            <button
              onClick={() => go("alerts")}
              aria-label="Alerts"
              style={{
                all: "unset",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                border: `1px solid ${S.inputBorder}`,
                background: "#FFFFFF",
                cursor: "pointer",
                color: S.headerInk,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              <Bell size={14} strokeWidth={1.75} />
              {/* notification dot */}
              <span style={{
                position: "absolute",
                top: "7px",
                right: "7px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: S.badge,
                border: "1.5px solid #FFFFFF",
              }} />
            </button>

            {/* Avatar – monochrome, no gradient */}
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: S.avatarBg,
                  border: `1px solid ${S.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: S.avatarText,
                  letterSpacing: "0.02em",
                  userSelect: "none",
                  cursor: "pointer",
                }}>
                SA
              </div>
              
              {profileMenuOpen && (
                <>
                  {/* Invisible backdrop to catch outside clicks */}
                  <div 
                    style={{ position: "fixed", inset: 0, zIndex: 90 }} 
                    onClick={() => setProfileMenuOpen(false)} 
                  />
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "220px",
                    background: "#FFFFFF",
                    border: `1px solid ${S.headerBorder}`,
                    borderRadius: "10px",
                    boxShadow: "0 12px 32px rgba(16, 24, 40, 0.1)",
                    padding: "6px",
                    zIndex: 100,
                  }}>
                    <div style={{ padding: "10px 12px", borderBottom: `1px solid ${S.headerBorder}`, marginBottom: "6px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: S.headerInk, letterSpacing: "-0.01em" }}>School Administrator</div>
                      <div style={{ fontSize: "12px", color: S.headerMuted, marginTop: "2px" }}>admin@schoolos.com</div>
                    </div>
                    <button 
                      onClick={() => { setProfileMenuOpen(false); if (onLogout) onLogout(); else window.location.reload(); }}
                      style={{
                        all: "unset", width: "100%", display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 12px", fontSize: "13px", fontWeight: 500, color: S.headerInk, cursor: "pointer",
                        borderRadius: "6px", boxSizing: "border-box"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={15} strokeWidth={1.75} style={{ color: S.headerMuted }} /> 
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────────── */}
        <div style={{ flex: 1, padding: "28px 28px 56px" }}>
          {!available(currentTab) ? <p role="status">{navigation.loading ? "Loading dashboard navigation…" : "This dashboard feature is unavailable for this school."}</p> : <>
          {currentTab === "dashboard" && (
            <DashboardPane key={`dashboard-${refreshKey}`} organizationId={organizationId} onNavigate={go} onOpenQuickAction={triggerAction} />
          )}
          {["students","teachers","staff","parents","departments"].includes(currentTab) && (
            <PeoplePane key={`people-${refreshKey}`} organizationId={organizationId} activeTab={currentTab as any} onOpenQuickAction={triggerAction} />
          )}
          {currentTab === "academics" && <AcademicsPane organizationId={organizationId} onOpenQuickAction={triggerAction} />}
          {currentTab === "timetable" && <TimetablePane organizationId={organizationId} />}
          {currentTab === "attendance" && <AttendanceLeavePane organizationId={organizationId} />}
          {["learning", "examinations"].includes(currentTab) && (
            <LearningExamsPane key={`learning-${refreshKey}`} organizationId={organizationId} activeTab={currentTab === "examinations" ? "exams" : "assignments"} />
          )}
          {currentTab === "finance" && <FinancePane organizationId={organizationId} />}
          {currentTab === "communication" && <CommunicationPane organizationId={organizationId} />}
          {currentTab === "operations" && <OperationsPane organizationId={organizationId} />}
          {["discipline","documents","reports","alerts","settings","audit"].includes(currentTab) && (
            <GovernancePane key={`governance-${refreshKey}`} organizationId={organizationId} activeTab={currentTab as any} />
          )}
          </>}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════
          Q U I C K   A C T I O N   M O D A L
      ═══════════════════════════════════════════════ */}
      {quickActionModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            display: "grid", placeItems: "center", padding: "20px",
            background: "rgba(16,24,40,0.45)",
            backdropFilter: "blur(6px)",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setQuickActionModal(null);
              setCreatedInvite(null);
            }
          }}
        >
          <section style={{
            position: "relative",
            width: "min(480px, 95vw)",
            maxHeight: "90vh",
            overflow: "auto",
            padding: "28px",
            borderRadius: "14px",
            background: "#FFFFFF",
            boxShadow: "0 20px 60px rgba(16,24,40,0.18)",
            fontFamily: "inherit",
          }} role="dialog" aria-modal="true">
            {/* close */}
            <button
              onClick={() => {
                setQuickActionModal(null);
                setCreatedInvite(null);
              }}
              aria-label="Close"
              style={{
                all: "unset",
                position: "absolute", top: "14px", right: "14px",
                width: "28px", height: "28px",
                borderRadius: "50%",
                background: "#F2F4F7",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                fontSize: "16px", color: "#667085",
              }}
            >×</button>

            {createdInvite ? (
              <div style={{ display: "grid", gap: "16px" }}>
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
                  <h2 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 600, color: "#101828", letterSpacing: "-0.02em" }}>
                    Invitation link generated
                  </h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#475467", lineHeight: 1.5 }}>
                    An invitation was created for <strong style={{ color: "#101828" }}>{createdInvite.email}</strong> as <strong style={{ color: "#101828", textTransform: "capitalize" }}>{createdInvite.role}</strong>. Share this link for them to activate their account.
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
                        borderRadius: "8px",
                        border: "1px solid #D0D5DD",
                        fontSize: "12px",
                        background: "#F9FAFB",
                        color: "#101828",
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
                        all: "unset",
                        boxSizing: "border-box",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        background: copiedLink ? "#027A48" : "#101828",
                        color: "#FFFFFF",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {copiedLink ? "✓ Copied" : "Copy Link"}
                    </button>
                  </div>
                  <span style={{ fontSize: "11.5px", color: "#667085" }}>
                    Token expires in 48 hours. Can be redeemed once.
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickActionModal(null);
                      setCreatedInvite(null);
                    }}
                    style={{
                      all: "unset",
                      boxSizing: "border-box",
                      padding: "9px 20px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      background: "#101828",
                      color: "#FFFFFF",
                      cursor: "pointer",
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {isPersonAction ? "Member Onboarding" : (isDepartmentAction || isSectionAction || isClassAction) ? "Academic Structure" : "Quick Action"}
                </p>
                <h2 style={{ margin: "0 0 16px", fontSize: "17px", fontWeight: 600, color: "#101828", letterSpacing: "-0.02em" }}>
                  {isSectionAction
                    ? "Add Academic Section"
                    : isClassAction
                    ? "Add Class"
                    : quickActionModal === "addDepartment"
                    ? "Add Academic Department"
                    : quickActionModal.replace(/([A-Z])/g, " $1").trim()}
                </h2>

                {actionError && (
                  <div style={{ padding: "8px 12px", background: "#FEF3F2", border: "1px solid #FECDCA", borderRadius: "8px", color: "#B42318", fontSize: "12px", marginBottom: "14px" }}>
                    {actionError}
                  </div>
                )}

                <form onSubmit={handleActionSubmit} style={{ display: "grid", gap: "14px" }}>
                  {isPersonAction ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#F0F9FF", border: "1px solid #B9E6FE", borderRadius: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#026AA2" }}>Role automatically detected:</span>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "capitalize",
                          background: "#0284C7",
                          color: "#FFFFFF",
                        }}>
                          {detectedRole}
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
                              <span style={{ fontSize: "11px", color: "#667085" }}>Optional (e.g. EMP-1042)</span>
                            </div>
                            <input
                              type="text"
                              value={personEmployeeId}
                              onChange={(e) => setPersonEmployeeId(e.target.value)}
                              placeholder="e.g. EMP-1042 or TCH-089"
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
                              <option value="Regular Faculty">Regular Faculty (Permanent Full-Time)</option>
                              <option value="Probationary Faculty">Probationary Faculty</option>
                              <option value="Contractual Faculty">Contractual / Ad-hoc Faculty</option>
                              <option value="Visiting / Part-Time">Visiting / Part-Time Faculty</option>
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

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setQuickActionModal(null)}
                      style={{
                        all: "unset", boxSizing: "border-box",
                        padding: "8px 16px",
                        border: "1px solid #D0D5DD",
                        borderRadius: "8px",
                        fontSize: "13px", fontWeight: 500,
                        color: "#344054", cursor: "pointer",
                        background: "#FFFFFF",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionBusy}
                      style={{
                        all: "unset", boxSizing: "border-box",
                        padding: "8px 18px",
                        borderRadius: "8px",
                        fontSize: "13px", fontWeight: 600,
                        background: "#101828", color: "#FFFFFF",
                        cursor: actionBusy ? "wait" : "pointer",
                        opacity: actionBusy ? 0.6 : 1,
                      }}
                    >
                      {actionBusy
                        ? "Processing…"
                        : isPersonAction
                        ? "Generate Invite Link"
                        : isDepartmentAction
                        ? "Create Department"
                        : isSectionAction
                        ? (isCreatingNewClass ? "Create Class & Section" : "Create Section")
                        : isClassAction
                        ? "Create Class"
                        : "Confirm & Log"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
