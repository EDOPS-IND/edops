"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  CreditCard,
  CalendarDays,
  Bell,
  MessageSquare,
  Sparkles,
  LogOut,
  Menu,
  X,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  loadRoleWorkspace,
  getParentChildDetails,
  createParentLeave,
  createParentQuery,
  OrganizationSummary,
  getStudentAvatarUrl,
} from "../edops-api";
import { ParentTab, WardInfo, LeaveApplication, ParentQuery } from "./types";

// Panes
import { OverviewPane } from "./panes/overview-pane";
import { AcademicsPane } from "./panes/academics-pane";
import { AttendancePane } from "./panes/attendance-pane";
import { FeesPane } from "./panes/fees-pane";
import { PtmPane } from "./panes/ptm-pane";
import { NoticesPane } from "./panes/notices-pane";

// Modals
import { ApplyLeaveModal } from "./components/apply-leave-modal";
import { ParentQueryModal } from "./components/parent-query-modal";
import { ReportCardModal } from "./components/report-card-modal";

interface ParentWorkspaceProps {
  organization: OrganizationSummary;
  onLogout: () => void;
  onSwitchOrganization: (orgId: string) => void;
  organizations: OrganizationSummary[];
  initialWardId?: string;
}

export const ParentWorkspace: React.FC<ParentWorkspaceProps> = ({
  organization,
  onLogout,
  onSwitchOrganization,
  organizations,
  initialWardId,
}) => {
  const [activeTab, setActiveTab] = useState<ParentTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [wards, setWards] = useState<WardInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedWardId, setSelectedWardId] = useState(initialWardId || "");
  const [details, setDetails] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const selected = wards.find((w) => w.studentUserId === selectedWardId) || wards[0];

  const refreshDetails = async () => {
    if (!selected) return;
    const data = await getParentChildDetails(organization.id, selected.studentUserId);
    setDetails(data);
    setLeavesList(data.leaves || []);
    setQueriesList(data.queries || []);
  };

  const loadWards = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loadRoleWorkspace(organization.id);
      if (data.role !== "parent") throw new Error("Parent workspace required");
      const children = (data.children as WardInfo[]) || [];
      setWards(children);
      if (children.length > 0 && !selectedWardId) {
        setSelectedWardId(children[0].studentUserId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load children");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWards();
  }, [organization.id]);

  useEffect(() => {
    let active = true;
    setDetails(null);
    setLeavesList([]);
    setQueriesList([]);
    if (!selected) return;
    setDetailLoading(true);
    setError("");
    getParentChildDetails(organization.id, selected.studentUserId)
      .then((data) => {
        if (active) {
          setDetails(data);
          setLeavesList(data.leaves || []);
          setQueriesList(data.queries || []);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organization.id, selected?.studentUserId]);

  const selectedWard = selected
    ? { ...selected, data: details, organizationId: organization.id, refresh: refreshDetails }
    : undefined;

  // Modals state
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [leavesList, setLeavesList] = useState<LeaveApplication[]>([]);
  const [queriesList, setQueriesList] = useState<ParentQuery[]>([]);

  const handleApplyLeave = async (leave: Pick<LeaveApplication, "leaveType" | "startDate" | "endDate" | "reason">) => {
    if (!selectedWard) throw new Error("Select a linked child");
    await createParentLeave(organization.id, selectedWard.studentUserId, leave);
    await refreshDetails();
  };

  const handlePostQuery = async (query: Pick<ParentQuery, "subject" | "queryText">) => {
    if (!selectedWard) throw new Error("Select a linked child");
    await createParentQuery(organization.id, selectedWard.studentUserId, query);
    await refreshDetails();
  };

  const navItems = [
    { id: "overview", label: "Family Overview", icon: LayoutDashboard, tab: "overview" as ParentTab },
    { id: "academics", label: "Children & Academics", icon: BookOpen, tab: "academics" as ParentTab },
    { id: "attendance", label: "Attendance & Leaves", icon: CheckCircle2, tab: "attendance" as ParentTab },
    { id: "fees", label: "Fee Invoicing & Dues", icon: CreditCard, tab: "fees" as ParentTab },
    { id: "ptm", label: "PTM Appointments", icon: CalendarDays, tab: "ptm" as ParentTab },
    { id: "notices", label: "Notices & Grievances", icon: Bell, tab: "notices" as ParentTab },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6f7", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #cbd5e1", borderTopColor: "#0c1e33", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Connecting to Guardian Portal…</h2>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>Verifying linked student relationships</p>
        </div>
      </div>
    );
  }

  if (!selectedWard) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6f7", padding: "20px" }}>
        <div style={{ background: "#ffffff", padding: "32px", borderRadius: "12px", border: "1px solid #e4e6e9", maxWidth: "440px", textAlign: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0c1e33", margin: "0 0 8px" }}>Parent Portal</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
            {error || "No verified children are currently linked to your guardian account."}
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              onClick={loadWards}
              style={{ padding: "8px 16px", borderRadius: "6px", background: "#0c1e33", color: "#ffffff", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              Retry
            </button>
            <button
              onClick={onLogout}
              style={{ padding: "8px 16px", borderRadius: "6px", background: "#ffffff", border: "1px solid #e4e6e9", color: "#475569", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f7", fontFamily: 'var(--font-space-grotesk), "Inter", system-ui, sans-serif' }}>
      {/* 1. UNIVERSAL MIDNIGHT OBSIDIAN SIDEBAR (#0b0f19) */}
      <aside
        id="parent-sidebar"
        aria-label="Parent Portal Navigation"
        style={{
          width: "240px",
          flexShrink: 0,
          background: "#0b0f19",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          overflow: "hidden",
          zIndex: 40,
        }}
      >
        {/* Brand Header & Official Logo */}
        <div
          style={{
            height: "68px",
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            boxSizing: "border-box",
            flexShrink: 0,
            cursor: "pointer",
            gap: "10px",
          }}
          onClick={() => setActiveTab("overview")}
          title="EDOPS Guardian Portal"
        >
          <img
            src="/logo.svg"
            alt="edops"
            style={{
              height: "32px",
              width: "auto",
              display: "block",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          />
          <span
            style={{
              fontSize: "9.5px",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "5px",
              background: "rgba(129, 140, 248, 0.16)",
              color: "#a5b4fc",
              border: "1px solid rgba(129, 140, 248, 0.3)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            PARENT
          </span>
        </div>

        {/* Scrollable Navigation Body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "14px 12px",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            gap: "16px",
          }}
        >
          {/* Active Ward Profile Card */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.38)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>ACTIVE STUDENT</span>
              <span style={{ fontSize: "9px", color: "#10b981", fontWeight: 700 }}>VERIFIED</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={getStudentAvatarUrl(selectedWard.name, selectedWard.studentUserId)}
                alt={selectedWard.name}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#1c2337",
                  flexShrink: 0,
                  border: "1.5px solid #818cf8",
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {selectedWard.name}
                </div>
                <div style={{ fontSize: "11px", color: "#8a92a6" }}>
                  Class {selectedWard.sectionName || "Enrolled"}
                </div>
              </div>
            </div>

            {/* Multi-ward switcher if guardian has more than 1 student */}
            {wards.length > 1 && (
              <div
                style={{
                  marginTop: "10px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.4)", fontWeight: 600 }}>
                  Switch Child:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {wards.map((w) => {
                    const isCur = w.studentUserId === selectedWard.studentUserId;
                    return (
                      <button
                        key={w.studentUserId}
                        onClick={() => setSelectedWardId(w.studentUserId)}
                        style={{
                          all: "unset",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: isCur ? 700 : 500,
                          background: isCur ? "#818cf8" : "rgba(255, 255, 255, 0.06)",
                          color: isCur ? "#ffffff" : "#cbd5e1",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {w.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "3px" }} aria-label="Guardian navigation">
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.38)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "8px 12px 4px",
                userSelect: "none",
              }}
            >
              GUARDIAN WORKSPACE
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setMobileMenuOpen(false);
                  }}
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
                    fontSize: "13.5px",
                    cursor: "pointer",
                    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: isActive ? "#1c2337" : "transparent",
                    color: isActive ? "#ffffff" : "#8a92a6",
                    fontWeight: isActive ? 600 : 450,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#8a92a6";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.75}
                    style={{
                      flexShrink: 0,
                      color: isActive ? "#ffffff" : "#8a92a6",
                      transition: "color 0.15s ease",
                    }}
                  />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Guardian Account Badge & Logout */}
        <div style={{ marginTop: "auto", padding: "14px 12px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <img
                src={getStudentAvatarUrl("Guardian", organization.id)}
                alt=""
                style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1c2337", flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Verified Guardian
                </div>
                <div style={{ fontSize: "10px", color: "#8a92a6" }}>{wards.length} linked child profile(s)</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: "none",
                border: "none",
                color: "#8a92a6",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8a92a6")}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT SIDE CONTENT AREA (Sticky Header + Canvas) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: "68px",
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "#ffffff",
            borderBottom: "1px solid #e4e6e9",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          {/* Header Left: School & Ward Context */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{ fontSize: "16px", fontWeight: 800, color: "#0c1e33", margin: 0 }}>
                  {organization.name}
                </h1>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "#0c1e33",
                    color: "#ffffff",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Guardian Session
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                Active Profile: <b>{selectedWard.name}</b> (Class {selectedWard.sectionName || "Enrolled"})
              </div>
            </div>
          </div>

          {/* Header Right: Ward Switcher & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Quick Ward Switcher in Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#f8fafc",
                padding: "4px 8px",
                borderRadius: "8px",
                border: "1px solid #e4e6e9",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", paddingLeft: "4px" }}>Ward:</span>
              {wards.map((w) => {
                const isSelected = w.studentUserId === selectedWard.studentUserId;
                return (
                  <button
                    key={w.studentUserId}
                    onClick={() => setSelectedWardId(w.studentUserId)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: "none",
                      background: isSelected ? "#0c1e33" : "transparent",
                      color: isSelected ? "#ffffff" : "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <img
                      src={getStudentAvatarUrl(w.name, w.studentUserId)}
                      alt=""
                      style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#eaedf2" }}
                    />
                    <span>{w.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setLeaveModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "8px",
                background: "#ffffff",
                border: "1px solid #e4e6e9",
                color: "#0c1e33",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Apply Leave
            </button>

            <button
              onClick={() => setActiveTab("ptm")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "8px",
                background: "#0c1e33",
                border: "none",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <CalendarDays size={14} color="#818cf8" /> Book PTM
            </button>

            {/* Org Switcher */}
            {organizations.length > 1 && (
              <select
                value={organization.id}
                onChange={(e) => onSwitchOrganization(e.target.value)}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  background: "#f8fafc",
                  border: "1px solid #e4e6e9",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  color: "#334155",
                }}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        {/* Main Canvas */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 36px", background: "#f4f6f7" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            {error && (
              <div
                role="alert"
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  border: "1px solid #fee2e2",
                  color: "#991b1b",
                  fontSize: "13px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{error}</span>
                <button
                  onClick={() => refreshDetails().then(() => setError("")).catch((e) => setError(e.message))}
                  style={{
                    background: "none",
                    border: "none",
                    fontWeight: 700,
                    color: "#991b1b",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {detailLoading && (
              <div style={{ padding: "10px 14px", background: "#e0e7ff", color: "#3730a3", borderRadius: "6px", fontSize: "12px", fontWeight: 600, marginBottom: "16px" }}>
                Updating child records…
              </div>
            )}

            {activeTab === "overview" && (
              <OverviewPane
                selectedWard={selectedWard}
                onNavigateTab={setActiveTab}
                onOpenLeaveModal={() => setLeaveModalOpen(true)}
                onOpenQueryModal={() => setQueryModalOpen(true)}
                onOpenReportModal={() => setReportModalOpen(true)}
              />
            )}

            {activeTab === "academics" && (
              <AcademicsPane
                selectedWard={selectedWard}
                onOpenReportModal={() => setReportModalOpen(true)}
              />
            )}

            {activeTab === "attendance" && (
              <AttendancePane
                selectedWard={selectedWard}
                leavesList={leavesList}
                onOpenLeaveModal={() => setLeaveModalOpen(true)}
              />
            )}

            {activeTab === "fees" && <FeesPane selectedWard={selectedWard} />}

            {activeTab === "ptm" && <PtmPane selectedWard={selectedWard} />}

            {activeTab === "notices" && (
              <NoticesPane
                selectedWard={selectedWard}
                queriesList={queriesList}
                onOpenQueryModal={() => setQueryModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* 3. GLOBAL PARENT MODALS */}
      <ApplyLeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        selectedWard={selectedWard}
        onApplyLeave={handleApplyLeave}
      />

      <ParentQueryModal
        isOpen={queryModalOpen}
        onClose={() => setQueryModalOpen(false)}
        selectedWard={selectedWard}
        onSubmitQuery={handlePostQuery}
      />

      <ReportCardModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        selectedWard={selectedWard}
      />
    </div>
  );
};
