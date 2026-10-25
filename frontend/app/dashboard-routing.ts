"use client";

import { useEffect, useState, useCallback } from "react";
import { OrganizationSummary } from "./edops-api";

export type RoleRouteSlug = "school-admin" | "admin" | "principal" | "teacher" | "student" | "parent" | "platform";

export interface ParsedDashboardRoute {
  pathname: string;
  orgSlug: string;
  role: OrganizationSummary["role"] | "platform" | null;
  roleSlug: RoleRouteSlug | null;
  section: string;
  subSection: string;
  entityId: string;
  tab: string;
  view: string;
  academicYear: string;
  studentId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  term: string;
  date: string;
  month: string;
  status: string;
  searchQuery: string;
  modal: string;
  queryParams: Record<string, string>;
  isLogin: boolean;
  isInvite: boolean;
  isResetPassword: boolean;
}

export function slugify(text?: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function roleToSlug(role?: OrganizationSummary["role"] | "platform"): RoleRouteSlug {
  if (role === "school_admin") return "school-admin";
  if (role === "principal") return "principal";
  if (role === "teacher") return "teacher";
  if (role === "student") return "student";
  if (role === "parent") return "parent";
  if (role === "platform") return "platform";
  return "school-admin";
}

export function slugToRole(slug?: string | null): OrganizationSummary["role"] | "platform" | null {
  if (!slug) return null;
  const s = slug.toLowerCase();
  if (s === "school-admin" || s === "admin" || s === "school_admin") return "school_admin";
  if (s === "principal") return "principal";
  if (s === "teacher") return "teacher";
  if (s === "student") return "student";
  if (s === "parent") return "parent";
  if (s === "platform") return "platform";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Principal Tab Slugs Mapping (Internal ID <-> Planned URL tab slug)
// ─────────────────────────────────────────────────────────────────────────────
const PRINCIPAL_INTERNAL_TO_URL_TAB: Record<string, string> = {
  app: "annual-plan",
  annual_plan: "annual-plan",
  "annual-plan": "annual-plan",
  calendar: "calendar",
  targets: "learning-goals",
  learning_goals: "learning-goals",
  "learning-goals": "learning-goals",
  school_targets: "school-targets",
  "school-targets": "school-targets",
  action_plans: "action-plans",
  "action-plans": "action-plans",
  workload: "workload",
  hods: "hods",
  coordinators: "coordinators",
  assignments: "assignments",
  development: "development",
  classes: "classes",
  sections: "sections",
  subjects: "subjects",
  curriculum: "curriculum",
  outcomes: "outcomes",
  competencies: "competencies",
  lesson_plans: "lesson-plans",
  "lesson-plans": "lesson-plans",
  progress: "progress",
  academic_tt: "academic",
  teacher_tt: "teacher",
  class_tt: "class",
  room_tt: "room",
  room: "room",
  teacher: "teacher",
  teachers: "teachers",
  class: "class",
  today: "today",
  weekly: "weekly",
  substitution: "substitutions",
  substitutions: "substitutions",
  student_att: "students",
  students: "students",
  trends: "trends",
  faculty_att: "faculty",
  faculty: "faculty",
  submissions: "submissions",
  study_material: "study-material",
  "study-material": "study-material",
  materials: "materials",
  classroom: "classroom-activities",
  activities: "activities",
  assessments: "question-papers",
  "question-papers": "question-papers",
  analysis: "review",
  review: "review",
  exam_planning: "planning",
  planning: "planning",
  schedule: "schedule",
  marks: "marks",
  report_cards: "report-cards",
  "report-cards": "report-cards",
  performance: "performance",
  all: "all",
  "360": "360",
  at_risk: "at-risk",
  remedial: "remedial",
  enrichment: "enrichment",
  inbox: "inbox",
  teacher_msgs: "teacher-directives",
  parent_msgs: "parent-grievances",
  student_msgs: "student-messages",
  announcements: "announcements",
  ptm: "ptm",
  "school-performance": "school-performance",
  "class-performance": "class-performance",
  "subject-performance": "subject-performance",
  "teacher-performance": "teacher-performance",
  "curriculum-progress": "curriculum-progress",
  audit: "audit",
};

const PRINCIPAL_URL_TO_INTERNAL_TAB: Record<string, string> = Object.entries(
  PRINCIPAL_INTERNAL_TO_URL_TAB
).reduce((acc, [internal, urlSlug]) => {
  acc[urlSlug] = internal;
  acc[internal] = internal;
  return acc;
}, {} as Record<string, string>);

// ─────────────────────────────────────────────────────────────────────────────
// Route Parser
// ─────────────────────────────────────────────────────────────────────────────
export function parseDashboardRoute(
  customPathname?: string,
  customSearch?: string
): ParsedDashboardRoute {
  if (typeof window === "undefined" && !customPathname) {
    return {
      pathname: "/",
      orgSlug: "",
      role: null,
      roleSlug: null,
      section: "dashboard",
      subSection: "",
      entityId: "",
      tab: "",
      view: "",
      academicYear: "",
      studentId: "",
      teacherId: "",
      classId: "",
      subjectId: "",
      term: "",
      date: "",
      month: "",
      status: "",
      searchQuery: "",
      modal: "",
      queryParams: {},
      isLogin: false,
      isInvite: false,
      isResetPassword: false,
    };
  }

  const pathname = customPathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const search = customSearch ?? (typeof window !== "undefined" ? window.location.search : "");
  const searchParams = new URLSearchParams(search);

  const queryParams: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });

  const isLogin = pathname === "/login" || pathname === "/login/" || searchParams.has("login");
  const isInvite = pathname.startsWith("/invite") || searchParams.has("invite");
  const isResetPassword = pathname.startsWith("/reset-password") || searchParams.has("reset");

  // Reserved top-level routes
  if (isLogin || isInvite || isResetPassword) {
    return {
      pathname,
      orgSlug: "",
      role: null,
      roleSlug: null,
      section: isLogin ? "login" : isInvite ? "invite" : "reset-password",
      subSection: "",
      entityId: "",
      tab: searchParams.get("tab") || "",
      view: searchParams.get("view") || "",
      academicYear: searchParams.get("ay") || "",
      studentId: searchParams.get("student") || "",
      teacherId: searchParams.get("teacher") || "",
      classId: searchParams.get("class") || "",
      subjectId: searchParams.get("subject") || "",
      term: searchParams.get("term") || "",
      date: searchParams.get("date") || "",
      month: searchParams.get("month") || "",
      status: searchParams.get("status") || "",
      searchQuery: searchParams.get("q") || "",
      modal: searchParams.get("modal") || "",
      queryParams,
      isLogin,
      isInvite,
      isResetPassword,
    };
  }

  // Platform admin route: /platform/...
  if (pathname.startsWith("/platform")) {
    const parts = pathname.split("/").filter(Boolean);
    const section = parts[1] || "overview";
    const subSection = parts.slice(2).join("/");
    return {
      pathname,
      orgSlug: "",
      role: "platform",
      roleSlug: "platform",
      section: section === "dashboard" ? "overview" : section,
      subSection,
      entityId: searchParams.get("id") || parts[2] || "",
      tab: searchParams.get("tab") || "",
      view: searchParams.get("view") || "",
      academicYear: searchParams.get("ay") || "",
      studentId: searchParams.get("student") || "",
      teacherId: searchParams.get("teacher") || "",
      classId: searchParams.get("class") || "",
      subjectId: searchParams.get("subject") || "",
      term: searchParams.get("term") || "",
      date: searchParams.get("date") || "",
      month: searchParams.get("month") || "",
      status: searchParams.get("status") || "",
      searchQuery: searchParams.get("q") || "",
      modal: searchParams.get("modal") || "",
      queryParams,
      isLogin: false,
      isInvite: false,
      isResetPassword: false,
    };
  }

  // Parse /{org-slug}/{role}/{section}/{subSection...}
  const segments = pathname.split("/").filter(Boolean);

  let orgSlug = "";
  let role: OrganizationSummary["role"] | "platform" | null = null;
  let roleSlug: RoleRouteSlug | null = null;
  let rawSection = "";
  let subSection = "";
  let entityId = searchParams.get("id") || "";
  let tab = searchParams.get("tab") || "";

  if (segments.length > 0) {
    const firstRole = slugToRole(segments[0]);
    if (firstRole) {
      // Legacy role-first URL: /{role}/{org-slug}/{section}/...
      role = firstRole;
      roleSlug = segments[0] as RoleRouteSlug;
      orgSlug = segments[1] || "";
      rawSection = segments[2] || "";
      subSection = segments.slice(3).join("/");
    } else {
      // EDOPS standard: /{org-slug}/{role}/{section}/...
      orgSlug = segments[0];
      const secondRole = slugToRole(segments[1]);
      if (secondRole) {
        role = secondRole;
        roleSlug = segments[1] as RoleRouteSlug;
        rawSection = segments[2] || "";
        subSection = segments.slice(3).join("/");
      } else {
        // Just /{org-slug}
        rawSection = segments[1] || "";
        subSection = segments.slice(2).join("/");
      }
    }
  }

  // Extract trailing entity ID if in path, e.g. /students/stud_123 or /exams/exam_456
  const segRest = subSection ? subSection.split("/").filter(Boolean) : [];
  if (segRest.length > 0) {
    const last = segRest[segRest.length - 1];
    if (
      !entityId &&
      last !== "details" &&
      last !== "detail" &&
      (last.includes("_") || last.includes("-") || /\d/.test(last))
    ) {
      entityId = last;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Role-specific Section & Tab Normalization
  // ───────────────────────────────────────────────────────────────────────────
  let section = rawSection || "dashboard";

  if (role === "school_admin") {
    // School Admin Section Mapping
    if (rawSection === "people") {
      const targetSub = segRest[0] || tab || "students";
      if (["students", "teachers", "staff", "parents", "departments"].includes(targetSub)) {
        section = targetSub;
      } else {
        section = "students";
      }
      if (segRest[1] && !entityId) {
        entityId = segRest[1];
      }
    } else if (rawSection === "academics") {
      const targetSub = segRest[0];
      if (targetSub === "timetable") {
        section = "timetable";
        if (segRest[1] && !entityId) entityId = segRest[1];
      } else if (targetSub === "attendance") {
        section = "attendance";
        if (segRest[1] && !entityId) entityId = segRest[1];
      } else if (targetSub === "curriculum") {
        section = "learning";
        if (!tab) tab = "assignments";
      } else if (targetSub === "exams") {
        section = "examinations";
        if (segRest[1] && !entityId) entityId = segRest[1];
        if (!tab) tab = "exams";
      } else if (targetSub === "assignments") {
        section = "learning";
        tab = "assignments";
      } else if (targetSub === "results") {
        section = "examinations";
        tab = "results";
      } else {
        section = "academics";
        if (["structure", "sections", "subjects", "curriculum", "calendar", "promotions"].includes(targetSub)) {
          tab = targetSub;
        }
      }
    } else if (rawSection === "governance") {
      const gTab = tab || segRest[0] || "discipline";
      if (["discipline", "documents", "reports", "alerts", "settings", "audit"].includes(gTab)) {
        section = gTab;
      } else {
        section = "discipline";
      }
    } else if (rawSection === "curriculum" || rawSection === "assignments") {
      section = "learning";
      tab = "assignments";
    } else if (rawSection === "exams") {
      section = "examinations";
      if (!tab) tab = "exams";
    } else if (rawSection === "results") {
      section = "examinations";
      tab = "results";
    } else if (rawSection === "learning") {
      section = "learning";
      if (!tab) tab = "assignments";
    } else if (rawSection === "examinations") {
      section = "examinations";
      if (!tab) tab = "exams";
    } else if (
      [
        "students",
        "teachers",
        "staff",
        "parents",
        "departments",
        "timetable",
        "attendance",
        "learning",
        "examinations",
        "assignments",
        "exams",
        "results",
        "finance",
        "communication",
        "operations",
        "discipline",
        "documents",
        "reports",
        "alerts",
        "settings",
        "audit",
        "dashboard",
      ].includes(rawSection)
    ) {
      section = rawSection;
    } else {
      section = "dashboard";
    }
  } else if (role === "principal") {
    // Principal Section & Tab Mapping
    if (rawSection === "teachers" || rawSection === "people") {
      section = "people";
      if (segRest[0] && !entityId) entityId = segRest[0];
    } else if (rawSection === "assessments" || rawSection === "assessment") {
      section = "assessment";
      if (segRest[0] && !entityId) entityId = segRest[0];
    } else if (rawSection === "examinations" || rawSection === "exams") {
      section = "examinations";
      if (segRest[0] === "plans" && segRest[1]) entityId = segRest[1];
      else if (segRest[0] === "results" && segRest[1]) entityId = segRest[1];
    } else if (rawSection === "planning") {
      section = "planning";
      if (segRest[0] === "plans" && segRest[1]) entityId = segRest[1];
      else if (segRest[0] === "targets" && segRest[1]) entityId = segRest[1];
    } else if (
      [
        "dashboard",
        "planning",
        "people",
        "academics",
        "timetable",
        "attendance",
        "learning",
        "assessment",
        "examinations",
        "students",
        "communication",
        "analytics",
        "alerts",
        "reports",
        "activity",
      ].includes(rawSection)
    ) {
      section = rawSection;
    } else {
      section = "dashboard";
    }

    // Normalize Principal Tab from URL format to workspace internal format
    if (tab && PRINCIPAL_URL_TO_INTERNAL_TAB[tab]) {
      tab = PRINCIPAL_URL_TO_INTERNAL_TAB[tab];
    }
  } else if (role === "teacher") {
    // Teacher Section Mapping
    if (rawSection === "assessments") {
      section = "assessment";
    } else if (rawSection === "assignments") {
      section = "assignments";
      if (segRest[0] && !entityId) entityId = segRest[0];
    } else if (rawSection === "classes" && segRest[0]) {
      section = "classes";
      if (!entityId) entityId = segRest[0];
    } else if (rawSection === "students" && segRest[0]) {
      section = "students";
      if (!entityId) entityId = segRest[0];
    } else if (
      [
        "dashboard",
        "classes",
        "timetable",
        "attendance",
        "learning",
        "assignments",
        "arena",
        "assessment",
        "exams",
        "students",
        "curriculum",
        "workload",
        "calendar",
        "reports",
        "activity",
        "communication",
      ].includes(rawSection)
    ) {
      section = rawSection;
    } else {
      section = "dashboard";
    }
  } else if (role === "student") {
    // Student Section Mapping
    if (rawSection === "subjects" && segRest[0]) {
      section = "subjects";
      if (!entityId) entityId = segRest[0];
    } else if (rawSection === "assignments" && segRest[0]) {
      section = "assignments";
      if (!entityId) entityId = segRest[0];
    } else if (rawSection === "resources" && segRest[0]) {
      section = "resources";
      if (!entityId) entityId = segRest[0];
    } else if (
      [
        "dashboard",
        "class",
        "subjects",
        "timetable",
        "assignments",
        "arena",
        "assessments",
        "exams",
        "attendance",
        "performance",
        "curriculum",
        "resources",
        "calendar",
        "communication",
        "progress",
        "profile",
      ].includes(rawSection)
    ) {
      section = rawSection;
    } else {
      section = "dashboard";
    }
  } else if (role === "parent") {
    // Parent Section Mapping
    if (rawSection === "dashboard") {
      section = "overview";
    } else if (rawSection === "communication" || rawSection === "messages") {
      section = "notices";
    } else if (["overview", "academics", "attendance", "fees", "ptm", "notices"].includes(rawSection)) {
      section = rawSection;
    } else {
      section = "overview";
    }
  }

  const studentId = searchParams.get("student") || (role === "student" && entityId ? entityId : "");
  const teacherId = searchParams.get("teacher") || (role === "teacher" && entityId ? entityId : "");

  return {
    pathname,
    orgSlug,
    role,
    roleSlug,
    section: section || (role === "parent" ? "overview" : "dashboard"),
    subSection,
    entityId,
    tab: tab || searchParams.get("view") || "",
    view: searchParams.get("view") || tab || "",
    academicYear: searchParams.get("ay") || "",
    studentId,
    teacherId,
    classId: searchParams.get("class") || "",
    subjectId: searchParams.get("subject") || "",
    term: searchParams.get("term") || "",
    date: searchParams.get("date") || "",
    month: searchParams.get("month") || "",
    status: searchParams.get("status") || "",
    searchQuery: searchParams.get("q") || "",
    modal: searchParams.get("modal") || "",
    queryParams,
    isLogin,
    isInvite,
    isResetPassword,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Serializer
// ─────────────────────────────────────────────────────────────────────────────
export interface BuildDashboardUrlOptions {
  orgSlug?: string;
  role?: OrganizationSummary["role"] | "platform";
  section?: string;
  subSection?: string;
  entityId?: string;
  tab?: string;
  view?: string;
  academicYear?: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  term?: string;
  date?: string;
  month?: string;
  status?: string;
  searchQuery?: string;
  modal?: string | null;
  extraParams?: Record<string, string | undefined | null>;
}

export function buildDashboardUrl(options: BuildDashboardUrlOptions): string {
  const {
    orgSlug,
    role,
    section = "dashboard",
    subSection,
    entityId,
    tab,
    view,
    academicYear,
    studentId,
    teacherId,
    classId,
    subjectId,
    term,
    date,
    month,
    status,
    searchQuery,
    modal,
    extraParams,
  } = options;

  // Platform admin route
  if (role === "platform") {
    let path = "/platform";
    const pSection = section === "dashboard" ? "overview" : section;
    if (pSection && pSection !== "overview") path += `/${pSection}`;
    if (subSection) path += `/${subSection}`;
    if (entityId && !path.includes(entityId)) path += `/${entityId}`;

    const params = new URLSearchParams();
    if (tab) params.set("tab", tab);
    if (view) params.set("view", view);
    if (academicYear) params.set("ay", academicYear);
    if (status) params.set("status", status);
    if (searchQuery) params.set("q", searchQuery);
    if (modal) params.set("modal", modal);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.set(k, v);
      });
    }

    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  const cleanOrgSlug = slugify(orgSlug) || "school";
  const cleanRole = roleToSlug(role);

  let basePath = `/${cleanOrgSlug}/${cleanRole}`;
  let finalTab = tab;

  // ───────────────────────────────────────────────────────────────────────────
  // Role-specific Path Composition
  // ───────────────────────────────────────────────────────────────────────────
  if (role === "school_admin") {
    if (["students", "teachers", "staff", "parents", "departments"].includes(section)) {
      basePath += `/people/${section}`;
      if (entityId) basePath += `/${entityId}`;
    } else if (section === "academics") {
      basePath += "/academics";
    } else if (section === "timetable") {
      basePath += "/academics/timetable";
    } else if (section === "attendance") {
      basePath += "/academics/attendance";
    } else if (section === "learning" || section === "assignments") {
      basePath += "/academics/curriculum";
      finalTab = finalTab || "assignments";
    } else if (section === "examinations" || section === "exams" || section === "results") {
      basePath += "/academics/exams";
      if (entityId) basePath += `/${entityId}`;
      if (section === "results") {
        finalTab = "results";
      } else if (!finalTab) {
        finalTab = "exams";
      }
    } else if (["discipline", "documents", "reports", "alerts", "settings", "audit"].includes(section)) {
      basePath += "/governance";
      finalTab = section;
    } else if (section === "finance") {
      basePath += "/finance";
      if (entityId) basePath += `/student/${entityId}`;
    } else if (section === "communication") {
      basePath += "/communication";
      if (entityId) basePath += `/${entityId}`;
    } else if (section === "operations") {
      basePath += "/operations";
    } else if (section === "dashboard" || !section) {
      basePath += "/dashboard";
    } else {
      basePath += `/${section}`;
    }
  } else if (role === "principal") {
    if (section === "people") {
      basePath += "/teachers";
      if (entityId) basePath += `/${entityId}`;
    } else if (section === "assessment") {
      basePath += "/assessments";
      if (entityId) basePath += `/${entityId}`;
    } else if (section === "dashboard" || !section) {
      basePath += "/dashboard";
    } else {
      basePath += `/${section}`;
      if (entityId) basePath += `/${entityId}`;
    }

    // Map internal tab to URL friendly slug
    if (finalTab && PRINCIPAL_INTERNAL_TO_URL_TAB[finalTab]) {
      finalTab = PRINCIPAL_INTERNAL_TO_URL_TAB[finalTab];
    }
  } else if (role === "teacher") {
    if (section === "assessment") {
      basePath += "/assessments";
    } else if (section === "dashboard" || !section) {
      basePath += "/dashboard";
    } else {
      basePath += `/${section}`;
      if (entityId) basePath += `/${entityId}`;
    }
  } else if (role === "student") {
    if (section === "dashboard" || !section) {
      basePath += "/dashboard";
    } else {
      basePath += `/${section}`;
      if (entityId) basePath += `/${entityId}`;
    }
  } else if (role === "parent") {
    if (section === "notices") {
      basePath += "/communication";
    } else if (section === "dashboard" || section === "overview" || !section) {
      basePath += "/overview";
    } else {
      basePath += `/${section}`;
      if (entityId) basePath += `/${entityId}`;
    }
  } else {
    if (section && section !== "dashboard" && section !== "overview") {
      basePath += `/${section}`;
    }
  }

  // Query parameter construction (matching EDOPS Deep-Link Architecture)
  const params = new URLSearchParams();
  if (finalTab) params.set("tab", finalTab);
  if (view) params.set("view", view);
  if (academicYear) params.set("ay", academicYear);
  if (studentId) params.set("student", studentId);
  if (teacherId) params.set("teacher", teacherId);
  if (classId) params.set("class", classId);
  if (subjectId) params.set("subject", subjectId);
  if (term) params.set("term", term);
  if (date) params.set("date", date);
  if (month) params.set("month", month);
  if (status) params.set("status", status);
  if (searchQuery) params.set("q", searchQuery);
  if (modal) params.set("modal", modal);

  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        params.set(k, v);
      }
    });
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function updateDashboardUrl(
  options: BuildDashboardUrlOptions,
  replace = false
): string {
  if (typeof window === "undefined") return "/";
  const url = buildDashboardUrl(options);
  if (replace) {
    window.history.replaceState({ url }, "", url);
  } else {
    window.history.pushState({ url }, "", url);
  }
  window.dispatchEvent(new CustomEvent("edops-route-change", { detail: { url } }));
  return url;
}

export function resolveOrgFromRoute(
  organizations: OrganizationSummary[],
  urlOrgSlug?: string
): OrganizationSummary | undefined {
  if (!organizations || organizations.length === 0) return undefined;
  if (!urlOrgSlug) return organizations[0];

  const target = slugify(urlOrgSlug);
  return (
    organizations.find((o) => slugify(o.slug) === target) ||
    organizations.find((o) => slugify(o.id) === target) ||
    organizations.find((o) => slugify(o.name) === target) ||
    organizations.find((o) => o.id === urlOrgSlug) ||
    organizations[0]
  );
}

export function useDashboardRoute() {
  const [route, setRoute] = useState<ParsedDashboardRoute>(() => parseDashboardRoute());

  useEffect(() => {
    const handleSync = () => {
      setRoute(parseDashboardRoute());
    };

    window.addEventListener("popstate", handleSync);
    window.addEventListener("edops-route-change", handleSync);

    return () => {
      window.removeEventListener("popstate", handleSync);
      window.removeEventListener("edops-route-change", handleSync);
    };
  }, []);

  const navigate = useCallback((options: BuildDashboardUrlOptions, replace = false) => {
    return updateDashboardUrl(options, replace);
  }, []);

  const copyCurrentLink = useCallback(async (customLabel = "Link copied to clipboard!") => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      return customLabel;
    } catch {
      return "Unable to copy link";
    }
  }, []);

  return {
    route,
    navigate,
    copyCurrentLink,
  };
}
