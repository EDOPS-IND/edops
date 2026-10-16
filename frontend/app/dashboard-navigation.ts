"use client";

import { useEffect, useState } from "react";
import { DashboardSection, getDashboardNavigation, OrganizationSummary } from "./edops-api";

const defaultNavigationData: Record<OrganizationSummary["role"], DashboardSection[]> = {
  school_admin: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "dashboard", label: "Dashboard", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "people", label: "People", sortOrder: 20, items: [
      { key: "students", label: "Students", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "teachers", label: "Teachers & Workload", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "staff", label: "School Staff", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "parents", label: "Parents & Guardians", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "departments", label: "Departments", sortOrder: 50, enabled: true, effectiveEnabled: true },
    ]},
    { key: "academics", label: "Academics", sortOrder: 30, items: [
      { key: "academics", label: "Academic Structure", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "timetable", label: "Timetable", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "attendance", label: "Attendance & Leave", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "learning", label: "Curriculum", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "examinations", label: "Exams & Results", sortOrder: 50, enabled: true, effectiveEnabled: true },
    ]},
    { key: "finance_communication", label: "Finance & Communication", sortOrder: 40, items: [
      { key: "finance", label: "Fee Management", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "communication", label: "Communication", sortOrder: 20, enabled: true, effectiveEnabled: true },
    ]},
    { key: "operations", label: "Operations", sortOrder: 50, items: [
      { key: "operations", label: "Transport & Facilities", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
    { key: "management", label: "Management", sortOrder: 60, items: [
      { key: "alerts", label: "Alert Center", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "discipline", label: "Discipline Register", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "documents", label: "Documents & Policies", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "reports", label: "Reports & Analytics", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "settings", label: "School Settings", sortOrder: 50, enabled: true, effectiveEnabled: true },
      { key: "audit", label: "Audit Log", sortOrder: 60, enabled: true, effectiveEnabled: true },
    ]},
  ],
  principal: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "dashboard", label: "Dashboard", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "planning", label: "Academic Planning", sortOrder: 20, items: [
      { key: "app", label: "Annual Academic Plan", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "calendar", label: "Academic Calendar", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "targets", label: "Learning Goals & Targets", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "school_targets", label: "School Academic Targets", sortOrder: 40, enabled: true, effectiveEnabled: true },
    ]},
    { key: "people", label: "People – Academic", sortOrder: 30, items: [
      { key: "workload", label: "Teacher Workload", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "hods", label: "Department Heads", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "coordinators", label: "Coordinators", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "assignments", label: "Teacher Assignments", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "development", label: "Teacher Development", sortOrder: 50, enabled: true, effectiveEnabled: true },
    ]},
    { key: "academics", label: "Academics", sortOrder: 40, items: [
      { key: "classes", label: "Classes", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "sections", label: "Sections", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "subjects", label: "Subjects", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "curriculum", label: "Curriculum", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "outcomes", label: "Learning Outcomes", sortOrder: 50, enabled: true, effectiveEnabled: true },
      { key: "lesson_plans", label: "Lesson Plans", sortOrder: 60, enabled: true, effectiveEnabled: true },
      { key: "progress", label: "Teaching Progress", sortOrder: 70, enabled: true, effectiveEnabled: true },
    ]},
    { key: "timetable", label: "Timetable", sortOrder: 50, items: [
      { key: "academic_tt", label: "Academic Timetable", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "teacher_tt", label: "Teacher Timetable", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "class_tt", label: "Class Timetable", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "substitution", label: "Substitution Overview", sortOrder: 40, enabled: true, effectiveEnabled: true },
    ]},
    { key: "attendance", label: "Attendance", sortOrder: 60, items: [
      { key: "student_att", label: "Student Attendance", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "trends", label: "Attendance Trends", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "faculty_att", label: "Teacher Activity and Leave", sortOrder: 30, enabled: true, effectiveEnabled: true },
    ]},
    { key: "learning", label: "Assignments & Learning", sortOrder: 70, items: [
      { key: "assignments", label: "Assignments", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "submissions", label: "Submissions", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "study_material", label: "Study Material", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "classroom", label: "Classroom Activities", sortOrder: 40, enabled: true, effectiveEnabled: true },
    ]},
    { key: "assessment", label: "Assessment", sortOrder: 80, items: [
      { key: "assessments", label: "Assessments & Question Papers", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "analysis", label: "Assessment Analysis", sortOrder: 20, enabled: true, effectiveEnabled: true },
    ]},
    { key: "examinations", label: "Examinations", sortOrder: 90, items: [
      { key: "exam_planning", label: "Exam Planning", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "schedule", label: "Exam Schedule & Publishing", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "marks", label: "Marks", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "report_cards", label: "Report Cards", sortOrder: 40, enabled: true, effectiveEnabled: true },
    ]},
    { key: "students", label: "Students", sortOrder: 100, items: [
      { key: "performance", label: "Student Performance", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "360", label: "Student 360", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "at_risk", label: "At-Risk Students", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "remedial", label: "Remedial Programs", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "enrichment", label: "Enrichment Programs", sortOrder: 50, enabled: true, effectiveEnabled: true },
    ]},
    { key: "communication", label: "Academic Communication", sortOrder: 110, items: [
      { key: "inbox", label: "Principal Inbox", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "teacher_msgs", label: "Teacher Directives", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "parent_msgs", label: "Parent Grievances", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "student_msgs", label: "Student Messages", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "announcements", label: "Academic Announcements", sortOrder: 50, enabled: true, effectiveEnabled: true },
      { key: "ptm", label: "PTM Schedule & Minutes", sortOrder: 60, enabled: true, effectiveEnabled: true },
    ]},
    { key: "analytics", label: "Academic Analytics", sortOrder: 120, items: [
      { key: "school", label: "School Performance", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "class", label: "Class Performance", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "subject", label: "Subject Performance", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "teacher", label: "Teacher Performance", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "curriculum", label: "Curriculum Progress", sortOrder: 50, enabled: true, effectiveEnabled: true },
      { key: "audit", label: "Academic Execution Audit", sortOrder: 60, enabled: true, effectiveEnabled: true },
    ]},
    { key: "management", label: "Management", sortOrder: 130, items: [
      { key: "alerts", label: "Academic Alerts", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "reports", label: "Reports", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "activity", label: "Academic Activity", sortOrder: 30, enabled: true, effectiveEnabled: true },
    ]},
  ],
  teacher: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "dashboard", label: "Teacher Command Center", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "teaching", label: "My Teaching", sortOrder: 20, items: [{ key: "classes", label: "My Classes & Sections", sortOrder: 10, enabled: true, effectiveEnabled: true }, { key: "today", label: "Today's Classes", sortOrder: 20, enabled: true, effectiveEnabled: true }] },
    { key: "timetable", label: "Timetable", sortOrder: 30, items: [{ key: "timetable", label: "Today & Weekly Grid", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "attendance", label: "Attendance", sortOrder: 40, items: [{ key: "attendance", label: "Period Registers", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "learning", label: "Learning & Delivery", sortOrder: 50, items: [{ key: "learning", label: "Lesson Plans & Materials", sortOrder: 10, enabled: true, effectiveEnabled: true }, { key: "assignments", label: "Assignments & Submissions", sortOrder: 20, enabled: true, effectiveEnabled: true }] },
    { key: "arena", label: "Arena Practice Bank", sortOrder: 60, items: [{ key: "arena", label: "Subject Questions & Bank", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "assessment", label: "Assessments & Tests", sortOrder: 70, items: [{ key: "assessment", label: "Formative Tests & Marks", sortOrder: 10, enabled: true, effectiveEnabled: true }, { key: "exams", label: "Official Exam Schedules", sortOrder: 20, enabled: true, effectiveEnabled: true }] },
    { key: "students", label: "Student Tracking", sortOrder: 80, items: [{ key: "students", label: "Performance & At-Risk", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "management", label: "Management", sortOrder: 90, items: [{ key: "curriculum", label: "Curriculum Progress", sortOrder: 10, enabled: true, effectiveEnabled: true }, { key: "workload", label: "My Workload & Tasks", sortOrder: 20, enabled: true, effectiveEnabled: true }, { key: "calendar", label: "Academic Calendar", sortOrder: 30, enabled: true, effectiveEnabled: true }, { key: "reports", label: "Reports & LO Heatmap", sortOrder: 40, enabled: true, effectiveEnabled: true }, { key: "activity", label: "Activity Audit Log", sortOrder: 50, enabled: true, effectiveEnabled: true }] },
    { key: "communication", label: "Communication", sortOrder: 100, items: [{ key: "communication", label: "Academic Inbox", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
  ],
  student: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "dashboard", label: "Student Command Center", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "academics", label: "Academics", sortOrder: 20, items: [
      { key: "class", label: "My Class", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "subjects", label: "Prescribed Subjects", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "timetable", label: "Timetable & Schedule", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "assignments", label: "Assignments & Homework", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "arena", label: "Arena Practice Bank", sortOrder: 50, enabled: true, effectiveEnabled: true },
      { key: "assessments", label: "Formative Tests", sortOrder: 60, enabled: true, effectiveEnabled: true },
      { key: "exams", label: "Term Exams & Scorecards", sortOrder: 70, enabled: true, effectiveEnabled: true },
      { key: "curriculum", label: "Curriculum Progress", sortOrder: 80, enabled: true, effectiveEnabled: true },
      { key: "resources", label: "Notes & Recorded Lectures", sortOrder: 90, enabled: true, effectiveEnabled: true },
      { key: "calendar", label: "Academic Calendar", sortOrder: 100, enabled: true, effectiveEnabled: true },
    ]},
    { key: "progress", label: "Progress", sortOrder: 30, items: [
      { key: "attendance", label: "Attendance Monitoring", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "performance", label: "Academic Performance", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "progress", label: "Personal Growth & Goals", sortOrder: 30, enabled: true, effectiveEnabled: true },
    ]},
    { key: "communication", label: "Communication", sortOrder: 40, items: [{ key: "communication", label: "Academic Inbox", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "account", label: "Account", sortOrder: 50, items: [{ key: "profile", label: "Student Profile & Vault", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
  ],
  parent: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "overview", label: "Family Overview", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "academics", label: "Academics", sortOrder: 20, items: [{ key: "academics", label: "Children & Academics", sortOrder: 10, enabled: true, effectiveEnabled: true }, { key: "children", label: "Children & Learning", sortOrder: 20, enabled: true, effectiveEnabled: true }] },
    { key: "attendance", label: "Attendance", sortOrder: 30, items: [{ key: "attendance", label: "Attendance & Leaves", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "fees", label: "Finance", sortOrder: 40, items: [{ key: "fees", label: "Fee Invoicing & Receipts", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "ptm", label: "Conferences", sortOrder: 50, items: [{ key: "ptm", label: "PTM Slot Scheduling", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "communication", label: "Communication", sortOrder: 60, items: [{ key: "notices", label: "School Notices & Grievance", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
  ],
};

export function useDashboardNavigation(organizationId: string, role: OrganizationSummary["role"]) {
  const fallback = defaultNavigationData[role] ?? [];
  const [sections, setSections] = useState<DashboardSection[]>(fallback);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let live = true;
    const fallbackSections = defaultNavigationData[role] ?? [];
    if (!organizationId) {
      setSections(fallbackSections);
      return;
    }

    setLoading(true);
    getDashboardNavigation(organizationId, role)
      .then(result => {
        if (live) {
          if (Array.isArray(result) && result.length > 0) {
            setSections(result);
          } else {
            setSections(fallbackSections);
          }
          setError("");
        }
      })
      .catch(() => {
        if (live) {
          setSections(fallbackSections);
          setError("");
        }
      })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [organizationId, role]);

  return {
    sections,
    loading,
    error,
    has: (key: string) => {
      // If sections has items, check them; otherwise always allow standard items
      if (sections.length > 0) {
        return sections.some(section =>
          section.items.some(item =>
            item.key === key ||
            item.key.endsWith(`.${key}`) ||
            key.endsWith(`.${item.key}`) ||
            item.key === key.split(".").at(-1) ||
            key === `${section.key}.${item.key}`
          )
        );
      }
      return true;
    },
  };
}
