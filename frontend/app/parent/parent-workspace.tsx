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
  Search,
} from "lucide-react";
import { GlobalPortalSearch } from "../components/global-portal-search";
import {
  loadRoleWorkspace,
  getParentChildDetails,
  createParentLeave,
  createParentQuery,
  OrganizationSummary,
  getStudentAvatarUrl,
} from "../edops-api";
import { ParentTab, WardInfo, LeaveApplication, ParentQuery } from "./types";
import { ThreeDotsLoading } from "../components/feature-unavailable-card";

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
  activeTab?: ParentTab;
  onNavigate?: (tab: ParentTab, wardId?: string) => void;
  initialModal?: string;
}

export const ParentWorkspace: React.FC<ParentWorkspaceProps> = ({
  organization,
  onLogout,
  onSwitchOrganization,
  organizations,
  initialWardId,
  activeTab: activeTabProp,
  onNavigate,
  initialModal,
}) => {
  const [activeTab, setActiveTab] = useState<ParentTab>(activeTabProp || "overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [wards, setWards] = useState<WardInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedWardId, setSelectedWardId] = useState(initialWardId || "");
  const [details, setDetails] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (activeTabProp && activeTabProp !== activeTab) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  useEffect(() => {
    if (initialWardId && initialWardId !== selectedWardId) {
      setSelectedWardId(initialWardId);
    }
  }, [initialWardId]);

  const fallbackWard: WardInfo = {
    studentUserId: "preview-ward",
    name: "Ward Profile",
    email: "ward@school.edu",
    rollNumber: "01",
    sectionName: "10-A",
    programName: "Secondary",
    attendancePct: 95,
    todayAttendance: "present",
  };
  const selected = wards.find((w) => w.studentUserId === selectedWardId) || (wards.length > 0 ? wards[0] : fallbackWard);

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

  const selectedWard = { ...(selected || fallbackWard), data: details, organizationId: organization.id, refresh: refreshDetails };

  // Modals state
  const [leaveModalOpen, setLeaveModalOpen] = useState(initialModal === "leave" || initialModal === "apply-leave");
  const [queryModalOpen, setQueryModalOpen] = useState(initialModal === "query" || initialModal === "grievance");
  const [reportModalOpen, setReportModalOpen] = useState(initialModal === "report-card");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  useEffect(() => {
    if (initialModal === "leave" || initialModal === "apply-leave") setLeaveModalOpen(true);
    if (initialModal === "query" || initialModal === "grievance") setQueryModalOpen(true);
    if (initialModal === "report-card") setReportModalOpen(true);
  }, [initialModal]);


  const navigateTo = (tab: ParentTab, wardId?: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(tab, wardId || selectedWardId);
    }
  };

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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f7", fontFamily: 'var(--font-space-grotesk), "Inter", system-ui, sans-serif' }}>
      {/* 1. UNIVERSAL MIDNIGHT OBSIDIAN SIDEBAR (#0b0f19) */}
      <aside
        id="parent-sidebar"
        aria-label="Parent Portal Navigation"
        className="workspace-aside"
        style={{
          width: "240px",
          flexShrink: 0,
          background: "#0b0f19",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          height: "100vh",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
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
          onClick={() => navigateTo("overview")}
          title="EDOPS Guardian Portal"
        >
          <img
            src="/EDOPSLogo.png"
            alt="EDOPS Guardian Portal"
            style={{
              height: "34px",
              width: "auto",
              maxWidth: "115px",
              display: "block",
              objectFit: "contain",
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
                    navigateTo(item.tab);
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
      </aside>

      {/* 2. RIGHT SIDE CONTENT AREA (Sticky Header + Canvas) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          className="workspace-header"
        >
          {/* Header Left: School & Ward Context */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <button
              type="button"
              aria-label="Open parent navigation"
              className="workspace-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "16px", fontWeight: 800, color: "#0c1e33", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Active Profile: <b>{selectedWard.name}</b> (Class {selectedWard.sectionName || "Enrolled"})
              </div>
            </div>
          </div>

          {/* Header Right: Ward Switcher & Actions */}
          <div className="workspace-header-actions">
            {/* Quick Spotlight Search */}
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
              className="hidden sm:inline-flex"
              style={{
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
              onClick={() => navigateTo("ptm")}
              className="hidden sm:inline-flex"
              style={{
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

            {/* Guardian Profile Avatar & Dropdown */}
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                title="Guardian Profile & Account"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: profileMenuOpen ? "2px solid #0c1e33" : "1px solid #ced8e5",
                  background: "#f0f4f8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: profileMenuOpen ? "0 0 0 3px rgba(12, 30, 51, 0.1)" : "none",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                <img
                  src={getStudentAvatarUrl("Guardian", organization.id)}
                  alt="Guardian"
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
                    <div style={{ padding: "10px 12px", borderBottom: "1px solid #EAECF0", marginBottom: "4px" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#0c1e33" }}>
                        Verified Guardian
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                        {organization.name}
                      </p>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "6px",
                          padding: "2px 8px",
                          borderRadius: "100px",
                          background: "#e0f2fe",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#0369a1",
                        }}
                      >
                        {wards.length} linked child profile(s)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onLogout();
                      }}
                      style={{
                        all: "unset",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#f43f5e",
                        cursor: "pointer",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fff1f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={14} strokeWidth={2} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="workspace-content-canvas" style={{ overflowY: "auto", background: "#f4f6f7" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "360px" }}>
                <ThreeDotsLoading size={10} color="#0c1e33" />
              </div>
            ) : (
              <>
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
            </>
          )}
          </div>
        </main>
      </div>

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
                onClick={() => { setMobileMenuOpen(false); navigateTo("overview"); }}
                title="EDOPS Parent Portal"
              >
                <img
                  src="/EDOPSLogo.png"
                  alt="EDOPS Parent Portal"
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
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: "3px" }}>
              {[
                { id: "overview", label: "Overview & Vitals", icon: LayoutDashboard },
                { id: "academics", label: "Academics & Report Cards", icon: BookOpen },
                { id: "attendance", label: "Daily Attendance & Leaves", icon: Calendar },
                { id: "fees", label: "Fee Ledger & Online Pay", icon: CreditCard },
                { id: "ptm", label: "PTM Schedule & Meetings", icon: CalendarDays },
                { id: "notices", label: "School Circulars & Queries", icon: MessageSquare },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo(item.id as ParentTab);
                    }}
                    className={`drawer-nav-item ${active ? "active" : ""}`}
                    style={{
                      all: "unset",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      gap: "11px",
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      background: active ? "#1c2337" : "transparent",
                      color: active ? "#ffffff" : "#cbd5e1",
                      borderLeft: active ? "3px solid #F8E7C9" : "3px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={17} style={{ flexShrink: 0, color: active ? "#F8E7C9" : "#94a3b8" }} />
                    <span style={{ color: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

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

      {/* Global Navigation Search Modal (Cmd+K) */}
      <GlobalPortalSearch
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        role="parent"
        onNavigate={(tab) => navigateTo(tab as ParentTab)}
      />
    </div>
  );
};
