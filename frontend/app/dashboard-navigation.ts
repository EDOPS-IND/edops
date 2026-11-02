"use client";

import { useEffect, useState } from "react";
import { DashboardSection, getDashboardNavigation, OrganizationSummary } from "./edops-api";

const defaultNavigationData: Record<OrganizationSummary["role"], DashboardSection[]> = {
  school_admin: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "dashboard", label: "Dashboard", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "academics", label: "Academics & Instruction", sortOrder: 20, items: [
      { key: "academics", label: "Academics", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "learning", label: "Curriculum", sortOrder: 20, enabled: true, effectiveEnabled: true },
    ]},
    { key: "schedule", label: "Schedule & Presence", sortOrder: 30, items: [
      { key: "timetable", label: "Timetable", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "attendance", label: "Attendance", sortOrder: 20, enabled: true, effectiveEnabled: true },
    ]},
    { key: "assessment", label: "Assessment & Performance", sortOrder: 40, items: [
      { key: "examinations", label: "Examinations", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
    { key: "communication", label: "Communication & Community", sortOrder: 50, items: [
      { key: "communication", label: "Communication", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
    { key: "management", label: "Operations & Governance", sortOrder: 60, items: [
      { key: "students", label: "Students", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "teachers", label: "Teachers", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "staff", label: "Staff", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "parents", label: "Parents", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "departments", label: "Departments", sortOrder: 50, enabled: true, effectiveEnabled: true },
      { key: "finance", label: "Finance", sortOrder: 60, enabled: true, effectiveEnabled: true },
      { key: "operations", label: "Operations", sortOrder: 70, enabled: true, effectiveEnabled: true },
      { key: "alerts", label: "Alerts", sortOrder: 80, enabled: true, effectiveEnabled: true },
      { key: "discipline", label: "Discipline", sortOrder: 90, enabled: true, effectiveEnabled: true },
      { key: "documents", label: "Documents", sortOrder: 100, enabled: true, effectiveEnabled: true },
      { key: "settings", label: "Settings", sortOrder: 110, enabled: true, effectiveEnabled: true },
      { key: "audit", label: "Audit", sortOrder: 120, enabled: true, effectiveEnabled: true },
    ]},
  ],
  principal: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "dashboard", label: "Dashboard", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "academics", label: "Academics & Instruction", sortOrder: 20, items: [
      { key: "classes", label: "Classes", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "subjects", label: "Subjects", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "curriculum", label: "Curriculum", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "learning", label: "Learning", sortOrder: 40, enabled: true, effectiveEnabled: true },
    ]},
    { key: "schedule", label: "Schedule & Presence", sortOrder: 30, items: [
      { key: "timetable", label: "Timetable", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "attendance", label: "Attendance", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "planning", label: "Planning", sortOrder: 30, enabled: true, effectiveEnabled: true },
    ]},
    { key: "assessment", label: "Assessment & Performance", sortOrder: 40, items: [
      { key: "assessments", label: "Assessments", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "examinations", label: "Examinations", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "students", label: "Students", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "analytics", label: "Analytics", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "reports", label: "Reports", sortOrder: 50, enabled: true, effectiveEnabled: true },
    ]},
    { key: "communication", label: "Communication & Community", sortOrder: 50, items: [
      { key: "communication", label: "Communication", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
    { key: "management", label: "Operations & Governance", sortOrder: 60, items: [
      { key: "people", label: "Faculty", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "alerts", label: "Alerts", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "activity", label: "Activity", sortOrder: 30, enabled: true, effectiveEnabled: true },
    ]},
  ],
  teacher: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "dashboard", label: "Dashboard", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "academics", label: "Academics & Instruction", sortOrder: 20, items: [
      { key: "classes", label: "Classes", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "curriculum", label: "Curriculum", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "learning", label: "Lessons", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "assignments", label: "Assignments", sortOrder: 40, enabled: true, effectiveEnabled: true },
    ]},
    { key: "schedule", label: "Schedule & Presence", sortOrder: 30, items: [
      { key: "timetable", label: "Timetable", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "attendance", label: "Attendance", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "calendar", label: "Calendar", sortOrder: 30, enabled: true, effectiveEnabled: true },
    ]},
    { key: "assessment", label: "Assessment & Performance", sortOrder: 40, items: [
      { key: "assessment", label: "Assessments", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "exams", label: "Examinations", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "arena", label: "Arena", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "students", label: "Students", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "reports", label: "Reports", sortOrder: 50, enabled: true, effectiveEnabled: true },
    ]},
    { key: "communication", label: "Communication & Community", sortOrder: 50, items: [
      { key: "communication", label: "Communication", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
    { key: "management", label: "Operations & Governance", sortOrder: 60, items: [
      { key: "workload", label: "Workload", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "activity", label: "Activity", sortOrder: 20, enabled: true, effectiveEnabled: true },
    ]},
  ],
  student: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "dashboard", label: "Dashboard", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "academics", label: "Academics & Instruction", sortOrder: 20, items: [
      { key: "class", label: "Classes", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "subjects", label: "Subjects", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "curriculum", label: "Curriculum", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "assignments", label: "Assignments", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "resources", label: "Resources", sortOrder: 50, enabled: true, effectiveEnabled: true },
    ]},
    { key: "schedule", label: "Schedule & Presence", sortOrder: 30, items: [
      { key: "timetable", label: "Timetable", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "attendance", label: "Attendance", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "calendar", label: "Calendar", sortOrder: 30, enabled: true, effectiveEnabled: true },
    ]},
    { key: "assessment", label: "Assessment & Performance", sortOrder: 40, items: [
      { key: "assessments", label: "Assessments", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "exams", label: "Examinations", sortOrder: 20, enabled: true, effectiveEnabled: true },
      { key: "arena", label: "Arena", sortOrder: 30, enabled: true, effectiveEnabled: true },
      { key: "performance", label: "Performance", sortOrder: 40, enabled: true, effectiveEnabled: true },
      { key: "progress", label: "Progress", sortOrder: 50, enabled: true, effectiveEnabled: true },
    ]},
    { key: "communication", label: "Communication & Community", sortOrder: 50, items: [
      { key: "communication", label: "Communication", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
    { key: "management", label: "Operations & Governance", sortOrder: 60, items: [
      { key: "profile", label: "Profile", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
  ],
  parent: [
    { key: "overview", label: "Overview", sortOrder: 10, items: [{ key: "overview", label: "Overview", sortOrder: 10, enabled: true, effectiveEnabled: true }] },
    { key: "academics", label: "Academics & Instruction", sortOrder: 20, items: [
      { key: "academics", label: "Academics", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "children", label: "Children", sortOrder: 20, enabled: true, effectiveEnabled: true },
    ]},
    { key: "schedule", label: "Schedule & Presence", sortOrder: 30, items: [
      { key: "attendance", label: "Attendance", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
    { key: "assessment", label: "Assessment & Performance", sortOrder: 40, items: [
      { key: "ptm", label: "Meetings", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
    { key: "communication", label: "Communication & Community", sortOrder: 50, items: [
      { key: "notices", label: "Notices", sortOrder: 10, enabled: true, effectiveEnabled: true },
      { key: "communication", label: "Communication", sortOrder: 20, enabled: true, effectiveEnabled: true },
    ]},
    { key: "management", label: "Operations & Governance", sortOrder: 60, items: [
      { key: "fees", label: "Fees", sortOrder: 10, enabled: true, effectiveEnabled: true },
    ]},
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

  const has = (key: string) => {
    // If sections has items, check them; otherwise always allow standard items
    if (sections.length > 0) {
      return sections.some(section =>
        section.key === key ||
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
  };

  const filterSubTabs = <T extends { id: string; featureKey?: string }>(tabs: T[]): T[] => {
    if (sections.length === 0) return tabs;
    return tabs.filter((t) => {
      const key = t.featureKey || t.id;
      return (
        key === "dashboard" ||
        key === "overview" ||
        has(key)
      );
    });
  };

  return {
    sections,
    loading,
    error,
    has,
    filterSubTabs,
  };
}
