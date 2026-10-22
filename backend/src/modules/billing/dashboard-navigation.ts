export const dashboardRoles = [
  "school_admin",
  "principal",
  "teacher",
  "student",
  "parent",
] as const;
export type DashboardRole = (typeof dashboardRoles)[number];

type Section = {
  role: DashboardRole;
  key: string;
  label: string;
  items: string[];
};

// Keys are the existing pane/tab IDs. Labels and grouping are defaults; tenant changes live in PostgreSQL.
export const dashboardSections: Section[] = [
  {
    role: "school_admin",
    key: "overview",
    label: "Overview",
    items: ["dashboard|Dashboard"],
  },
  {
    role: "school_admin",
    key: "people",
    label: "People",
    items: [
      "students|Students",
      "teachers|Teachers & Workload",
      "staff|School Staff",
      "parents|Parents & Guardians",
      "departments|Departments",
    ],
  },
  {
    role: "school_admin",
    key: "academics",
    label: "Academics",
    items: [
      "academics|Academic Structure",
      "timetable|Timetable",
      "attendance|Attendance & Leave",
      "learning|Curriculum",
      "examinations|Exams & Results",
    ],
  },
  {
    role: "school_admin",
    key: "finance_communication",
    label: "Finance & Communication",
    items: ["finance|Fee Management", "communication|Communication"],
  },
  {
    role: "school_admin",
    key: "operations",
    label: "Operations",
    items: ["operations|Transport & Facilities"],
  },
  {
    role: "school_admin",
    key: "management",
    label: "Management",
    items: [
      "alerts|Alert Center",
      "discipline|Discipline Register",
      "documents|Documents & Policies",
      "reports|Reports & Analytics",
      "settings|School Settings",
      "audit|Audit Log",
    ],
  },
  {
    role: "principal",
    key: "overview",
    label: "Overview",
    items: ["dashboard|Dashboard"],
  },
  {
    role: "principal",
    key: "planning",
    label: "Academic Planning",
    items: [
      "app|Annual Academic Plan",
      "calendar|Academic Calendar",
      "targets|Learning Goals & Targets",
      "school_targets|School Academic Targets",
    ],
  },
  {
    role: "principal",
    key: "people",
    label: "People – Academic",
    items: [
      "workload|Teacher Workload",
      "hods|Department Heads",
      "coordinators|Coordinators",
      "assignments|Teacher Assignments",
      "development|Teacher Development",
    ],
  },
  {
    role: "principal",
    key: "academics",
    label: "Academics",
    items: [
      "classes|Classes",
      "sections|Sections",
      "subjects|Subjects",
      "curriculum|Curriculum",
      "outcomes|Learning Outcomes",
      "lesson_plans|Lesson Plans",
      "progress|Teaching Progress",
    ],
  },
  {
    role: "principal",
    key: "timetable",
    label: "Timetable",
    items: [
      "academic_tt|Academic Timetable",
      "teacher_tt|Teacher Timetable",
      "class_tt|Class Timetable",
      "substitution|Substitution Overview",
    ],
  },
  {
    role: "principal",
    key: "attendance",
    label: "Attendance",
    items: [
      "student_att|Student Attendance",
      "trends|Attendance Trends",
      "faculty_att|Teacher Activity and Leave",
    ],
  },
  {
    role: "principal",
    key: "learning",
    label: "Assignments & Learning",
    items: [
      "assignments|Assignments",
      "submissions|Submissions",
      "study_material|Study Material",
      "classroom|Classroom Activities",
    ],
  },
  {
    role: "principal",
    key: "assessment",
    label: "Assessment",
    items: [
      "assessments|Assessments & Question Papers",
      "analysis|Assessment Analysis",
    ],
  },
  {
    role: "principal",
    key: "examinations",
    label: "Examinations",
    items: [
      "exam_planning|Exam Planning",
      "schedule|Exam Schedule & Publishing",
      "marks|Marks",
      "report_cards|Report Cards",
    ],
  },
  {
    role: "principal",
    key: "students",
    label: "Students",
    items: [
      "performance|Student Performance",
      "360|Student 360",
      "at_risk|At-Risk Students",
      "remedial|Remedial Programs",
      "enrichment|Enrichment Programs",
    ],
  },
  {
    role: "principal",
    key: "communication",
    label: "Academic Communication",
    items: [
      "inbox|Principal Inbox",
      "teacher_msgs|Teacher Directives",
      "parent_msgs|Parent Grievances",
      "student_msgs|Student Messages",
      "announcements|Academic Announcements",
      "ptm|PTM Schedule & Minutes",
    ],
  },
  {
    role: "principal",
    key: "analytics",
    label: "Academic Analytics",
    items: [
      "school|School Performance",
      "class|Class Performance",
      "subject|Subject Performance",
      "teacher|Teacher Performance",
      "curriculum|Curriculum Progress",
      "audit|Academic Execution Audit",
    ],
  },
  {
    role: "principal",
    key: "management",
    label: "Management",
    items: [
      "alerts|Academic Alerts",
      "reports|Reports",
      "activity|Academic Activity",
    ],
  },
  {
    role: "teacher",
    key: "overview",
    label: "Overview",
    items: ["dashboard|Teacher Command Center"],
  },
  {
    role: "teacher",
    key: "teaching",
    label: "My Teaching",
    items: ["classes|My Classes & Sections", "today|Today’s Classes"],
  },
  {
    role: "teacher",
    key: "timetable",
    label: "Timetable",
    items: ["timetable|Today & Weekly Grid"],
  },
  {
    role: "teacher",
    key: "attendance",
    label: "Attendance",
    items: ["attendance|Period Registers"],
  },
  {
    role: "teacher",
    key: "learning",
    label: "Learning & Delivery",
    items: [
      "learning|Lesson Plans & Materials",
      "assignments|Assignments & Submissions",
    ],
  },
  {
    role: "teacher",
    key: "arena",
    label: "Arena Practice Bank",
    items: ["arena|Subject Questions & Bank"],
  },
  {
    role: "teacher",
    key: "assessment",
    label: "Assessments & Tests",
    items: [
      "assessment|Formative Tests & Marks",
      "exams|Official Exam Schedules",
    ],
  },
  {
    role: "teacher",
    key: "students",
    label: "Student Tracking",
    items: ["students|Performance & At-Risk"],
  },
  {
    role: "teacher",
    key: "management",
    label: "Management",
    items: [
      "curriculum|Curriculum Progress",
      "workload|My Workload & Tasks",
      "calendar|Academic Calendar",
      "reports|Reports & LO Heatmap",
      "activity|Activity Audit Log",
    ],
  },
  {
    role: "teacher",
    key: "communication",
    label: "Communication",
    items: ["communication|Academic Inbox"],
  },
  {
    role: "student",
    key: "overview",
    label: "Overview",
    items: ["dashboard|Student Command Center"],
  },
  {
    role: "student",
    key: "academics",
    label: "Academics",
    items: [
      "class|My Class",
      "subjects|Prescribed Subjects",
      "timetable|Timetable & Schedule",
      "assignments|Assignments & Homework",
      "arena|Arena Practice Bank",
      "assessments|Formative Tests",
      "exams|Term Exams & Scorecards",
      "curriculum|Curriculum Progress",
      "resources|Notes & Recorded Lectures",
      "calendar|Academic Calendar",
    ],
  },
  {
    role: "student",
    key: "progress",
    label: "Progress",
    items: [
      "attendance|Attendance Monitoring",
      "performance|Academic Performance",
      "progress|Personal Growth & Goals",
    ],
  },
  {
    role: "student",
    key: "communication",
    label: "Communication",
    items: ["communication|Academic Inbox"],
  },
  {
    role: "student",
    key: "account",
    label: "Account",
    items: ["profile|Student Profile & Vault"],
  },
  {
    role: "parent",
    key: "overview",
    label: "Overview",
    items: ["overview|Family Overview"],
  },
  {
    role: "parent",
    key: "academics",
    label: "Academics",
    items: ["children|Children & Learning"],
  },
  {
    role: "parent",
    key: "attendance",
    label: "Attendance",
    items: ["attendance|Attendance"],
  },
  {
    role: "parent",
    key: "communication",
    label: "Communication",
    items: ["notices|School Notices"],
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
  return `nav:${role}:${section}:${item}`;
}
