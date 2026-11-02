"use client";

import React from "react";
import { LayoutDashboard } from "lucide-react";
import { DashboardSection, OrganizationSummary } from "../edops-api";
import { useDashboardNavigation } from "../dashboard-navigation";

export const defaultTabTooltips: Record<string, string> = {
  dashboard: "Overview & executive metrics summary",
  academics: "Academic programs, classes & section structures",
  classes: "Class rosters, sections & subject mapping",
  subjects: "Prescribed subjects, syllabus & textbooks",
  curriculum: "Curriculum pacing, learning outcomes & syllabus",
  learning: "Lesson plans, daily teaching logs & coursework",
  lessons: "Lesson plans, daily teaching logs & coursework",
  assignments: "Homework assignments, student submissions & grading",
  timetable: "Weekly period schedule & class timings",
  attendance: "Student & staff attendance registers & absence logs",
  calendar: "Academic year events, terms & holiday calendar",
  assessments: "Formative assessments, tests & marks entry",
  assessment: "Formative assessments, tests & marks entry",
  examinations: "Term exam schedules, hall tickets & report cards",
  exams: "Term exam schedules, hall tickets & report cards",
  arena: "Objective practice arena & question bank drills",
  students: "Student dossiers, tracking & 360 performance",
  reports: "Academic heatmaps, subject analytics & report cards",
  communication: "Direct messaging, broadcasts & notice announcements",
  workload: "Teacher periods, assigned tasks & workload tracking",
  activity: "Audit trail & security activity logs",
  people: "Faculty directory, assignments & workload tracking",
  teachers: "Faculty management, workload & staff profiles",
  staff: "Non-teaching staff & administrative profiles",
  parents: "Parent directory, child mappings & contact records",
  departments: "Academic departments & faculty head assignments",
  finance: "Fee collections, invoices, ledger & receipts",
  fees: "Fee invoices, payments, receipts & statements",
  operations: "School facilities, transport routes & vehicles",
  alerts: "Automated academic & operational anomaly alerts",
  discipline: "Student behavioral records & incident tracking",
  documents: "School compliance, accreditation & policy documents",
  settings: "School profile, academic policies & configurations",
  audit: "System access, security logs & administrative audit trail",
  planning: "Annual academic plans, goals & action plan tracker",
  resources: "Study notes, recorded lectures & materials",
  performance: "Student grades, scorecards & historical progress",
  progress: "Personal learning goals & milestone tracking",
  profile: "User account profile, security & preferences",
  ptm: "Parent-teacher meeting scheduling & booking",
  meetings: "Parent-teacher meeting scheduling & booking",
  notices: "School board circulars & grievance tracking",
};

export interface DashboardSidebarProps {
  organizationId: string;
  role: OrganizationSummary["role"];
  activeTab: string;
  onTabChange: (tab: string, defaultSubTab?: string) => void;
  iconMap?: Record<string, React.ElementType>;
  badgeCounts?: Record<string, number>;
  tooltipMap?: Record<string, string>;
  topSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  sections?: DashboardSection[];
  onLogoClick?: () => void;
  title?: string;
}

export function DashboardSidebar({
  organizationId,
  role,
  activeTab,
  onTabChange,
  iconMap = {},
  badgeCounts = {},
  tooltipMap = {},
  topSlot,
  bottomSlot,
  sections: customSections,
  onLogoClick,
  title = "EDOPS Portal",
}: DashboardSidebarProps) {
  const nav = useDashboardNavigation(organizationId, role);
  const sections = customSections && customSections.length > 0 ? customSections : nav.sections;

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      onTabChange(role === "parent" ? "overview" : "dashboard");
    }
  };

  return (
    <aside
      id="sidebar"
      aria-label={`${role} primary navigation`}
      className="workspace-aside"
      style={{
        width: "240px",
        flexShrink: 0,
        background: "#0b0f19",
        color: "#ffffff",
        height: "100vh",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        padding: 0,
        boxSizing: "border-box",
        zIndex: 40,
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Brand / Logo Header */}
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
        onClick={handleLogoClick}
        title={title}
      >
        <img
          src="/EDOPSLogo.png"
          alt={title}
          style={{
            height: "36px",
            width: "auto",
            maxWidth: "140px",
            display: "block",
            objectFit: "contain",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.03)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        />
      </div>

      {topSlot && <div style={{ flexShrink: 0 }}>{topSlot}</div>}

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
          {nav.error && (
            <p role="alert" style={{ color: "#FCA5A5", padding: "8px 12px", fontSize: "11px", margin: 0 }}>
              {nav.error}
            </p>
          )}

          {sections.map((section, idx) => {
            const enabledItems = (section.items || []).filter(
              (item: any) => item.effectiveEnabled !== false
            );
            if (enabledItems.length === 0) return null;

            return (
              <React.Fragment key={section.key}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "rgba(255, 255, 255, 0.38)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: idx === 0 ? "8px 12px 4px" : "14px 12px 4px",
                    userSelect: "none",
                  }}
                >
                  {section.label}
                </div>

                {enabledItems.map((item: any) => {
                  const tabId = item.key.split(".").at(-1) || item.key;
                  const Icon = iconMap[tabId] || iconMap[item.key] || LayoutDashboard;
                  const isActive = activeTab === tabId;
                  const badge = badgeCounts[tabId] ?? badgeCounts[item.key];
                  const tooltip = tooltipMap[tabId] ?? tooltipMap[item.key] ?? defaultTabTooltips[tabId] ?? defaultTabTooltips[item.key] ?? item.description ?? item.label;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      title={tooltip}
                      onClick={() => onTabChange(tabId)}
                      style={{
                        all: "unset",
                        boxSizing: "border-box",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        height: "40px",
                        padding: "0 12px",
                        borderRadius: "10px",
                        background: isActive ? "#1c2337" : "transparent",
                        color: isActive ? "#ffffff" : "#8a92a6",
                        fontSize: "13px",
                        fontWeight: isActive ? 600 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Icon
                          size={18}
                          color={isActive ? "#ffffff" : "#8a92a6"}
                          style={{ flexShrink: 0 }}
                        />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.label}
                        </span>
                      </div>

                      {typeof badge === "number" && badge > 0 && (
                        <span
                          style={{
                            background: "#E84040",
                            color: "#ffffff",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: "10px",
                            flexShrink: 0,
                            lineHeight: 1,
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {bottomSlot && <div style={{ flexShrink: 0 }}>{bottomSlot}</div>}
    </aside>
  );
}
