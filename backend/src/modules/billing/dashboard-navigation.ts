export const dashboardRoles = [
  "school_admin",
  "principal",
  "teacher",
  "student",
  "parent",
] as const;
export type DashboardRole = (typeof dashboardRoles)[number];

export type Section = {
  role: DashboardRole;
  key: string;
  label: string;
  items: string[];
};

// Universal Standardized 6-Section Taxonomy shared across all roles
export const dashboardSections: Section[] = [
  // ── 1. SCHOOL ADMIN ──
  {
    role: "school_admin",
    key: "overview",
    label: "Overview",
    items: ["dashboard|Dashboard"],
  },
  {
    role: "school_admin",
    key: "academics",
    label: "Academics & Instruction",
    items: [
      "academics|Academics",
      "learning|Curriculum",
    ],
  },
  {
    role: "school_admin",
    key: "schedule",
    label: "Schedule & Presence",
    items: [
      "timetable|Timetable",
      "attendance|Attendance",
    ],
  },
  {
    role: "school_admin",
    key: "assessment",
    label: "Assessment & Performance",
    items: [
      "examinations|Examinations",
    ],
  },
  {
    role: "school_admin",
    key: "communication",
    label: "Communication & Community",
    items: [
      "communication|Communication",
    ],
  },
  {
    role: "school_admin",
    key: "management",
    label: "Operations & Governance",
    items: [
      "students|Students",
      "teachers|Teachers",
      "staff|Staff",
      "parents|Parents",
      "departments|Departments",
      "finance|Finance",
      "operations|Operations",
      "alerts|Alerts",
      "discipline|Discipline",
      "documents|Documents",
      "settings|Settings",
      "audit|Audit",
    ],
  },

  // ── 2. PRINCIPAL ──
  {
    role: "principal",
    key: "overview",
    label: "Overview",
    items: ["dashboard|Dashboard"],
  },
  {
    role: "principal",
    key: "academics",
    label: "Academics & Instruction",
    items: [
      "classes|Classes",
      "subjects|Subjects",
      "curriculum|Curriculum",
      "learning|Learning",
    ],
  },
  {
    role: "principal",
    key: "schedule",
    label: "Schedule & Presence",
    items: [
      "timetable|Timetable",
      "attendance|Attendance",
      "planning|Planning",
    ],
  },
  {
    role: "principal",
    key: "assessment",
    label: "Assessment & Performance",
    items: [
      "assessments|Assessments",
      "examinations|Examinations",
      "students|Students",
      "analytics|Analytics",
      "reports|Reports",
    ],
  },
  {
    role: "principal",
    key: "communication",
    label: "Communication & Community",
    items: [
      "communication|Communication",
    ],
  },
  {
    role: "principal",
    key: "management",
    label: "Operations & Governance",
    items: [
      "people|Faculty",
      "alerts|Alerts",
      "activity|Activity",
    ],
  },

  // ── 3. TEACHER ──
  {
    role: "teacher",
    key: "overview",
    label: "Overview",
    items: ["dashboard|Dashboard"],
  },
  {
    role: "teacher",
    key: "academics",
    label: "Academics & Instruction",
    items: [
      "classes|Classes",
      "curriculum|Curriculum",
      "learning|Lessons",
      "assignments|Assignments",
    ],
  },
  {
    role: "teacher",
    key: "schedule",
    label: "Schedule & Presence",
    items: [
      "timetable|Timetable",
      "attendance|Attendance",
      "calendar|Calendar",
    ],
  },
  {
    role: "teacher",
    key: "assessment",
    label: "Assessment & Performance",
    items: [
      "assessment|Assessments",
      "exams|Examinations",
      "arena|Arena",
      "students|Students",
      "reports|Reports",
    ],
  },
  {
    role: "teacher",
    key: "communication",
    label: "Communication & Community",
    items: [
      "communication|Communication",
    ],
  },
  {
    role: "teacher",
    key: "management",
    label: "Operations & Governance",
    items: [
      "workload|Workload",
      "activity|Activity",
    ],
  },

  // ── 4. STUDENT ──
  {
    role: "student",
    key: "overview",
    label: "Overview",
    items: ["dashboard|Dashboard"],
  },
  {
    role: "student",
    key: "academics",
    label: "Academics & Instruction",
    items: [
      "class|Classes",
      "subjects|Subjects",
      "curriculum|Curriculum",
      "assignments|Assignments",
      "resources|Resources",
    ],
  },
  {
    role: "student",
    key: "schedule",
    label: "Schedule & Presence",
    items: [
      "timetable|Timetable",
      "attendance|Attendance",
      "calendar|Calendar",
    ],
  },
  {
    role: "student",
    key: "assessment",
    label: "Assessment & Performance",
    items: [
      "assessments|Assessments",
      "exams|Examinations",
      "arena|Arena",
      "performance|Performance",
      "progress|Progress",
    ],
  },
  {
    role: "student",
    key: "communication",
    label: "Communication & Community",
    items: [
      "communication|Communication",
    ],
  },
  {
    role: "student",
    key: "management",
    label: "Operations & Governance",
    items: [
      "profile|Profile",
    ],
  },

  // ── 5. PARENT ──
  {
    role: "parent",
    key: "overview",
    label: "Overview",
    items: ["overview|Overview"],
  },
  {
    role: "parent",
    key: "academics",
    label: "Academics & Instruction",
    items: [
      "academics|Academics",
      "children|Children",
    ],
  },
  {
    role: "parent",
    key: "schedule",
    label: "Schedule & Presence",
    items: [
      "attendance|Attendance",
    ],
  },
  {
    role: "parent",
    key: "assessment",
    label: "Assessment & Performance",
    items: [
      "ptm|Meetings",
    ],
  },
  {
    role: "parent",
    key: "communication",
    label: "Communication & Community",
    items: [
      "notices|Notices",
      "communication|Communication",
    ],
  },
  {
    role: "parent",
    key: "management",
    label: "Operations & Governance",
    items: [
      "fees|Fees",
    ],
  },
];

export function dashboardFeatureKey(
  role: DashboardRole,
  section: string,
  item: string,
) {
  if (
    section === "assessment" ||
    item === "assessments" ||
    item === "assessment"
  )
    return "assessments";
  if (section === "examinations" || item === "exams") return "exams";
  if (item === "arena") return "arena";
  if (
    item === "communication" ||
    item === "notices" ||
    section === "communication"
  )
    return "communication";
  if (item === "timetable") return "timetable";
  if (item === "attendance" || item === "student_att" || item === "faculty_att") return "attendance";
  if (item === "recordings" || item === "resources") return "recordings";
  if (item === "learning" || item === "curriculum") return "curriculum";
  if (item === "finance" || item === "fees") return "finance";
  return `nav:${role}:${section}:${item}`;
}
