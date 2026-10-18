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
    { id: "fees", label: "Fee Invoicing & Receipts", icon: CreditCard, tab: "fees" as ParentTab },
    { id: "ptm", label: "PTM Slot Scheduling", icon: CalendarDays, tab: "ptm" as ParentTab },
    { id: "notices", label: "School Notices & Grievance", icon: Bell, tab: "notices" as ParentTab },
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
    <div style={{ minHeight: "100vh", background: "#f4f6f7", display: "flex", flexDirection: "column" }}>
      {/* 1. TOP STICKY HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#ffffff",
          borderBottom: "1px solid #e4e6e9",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #e4e6e9",
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#0b0f19",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "15px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <Sparkles size={18} color="#818cf8" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: 800, fontSize: "15px", color: "#0c1e33", letterSpacing: "-0.3px" }}>
                  EdOps
                </span>
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
                  Parent Portal
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>{organization.name}</div>
            </div>
          </div>
        </div>

        {/* Header Right: Ward Switcher & Quick Actions */}
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
                  <span
                    style={{
                      fontSize: "9px",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      background: isSelected ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                      color: isSelected ? "#ffffff" : "#475569",
                    }}
                  >
                    {w.sectionName || "Enrolled"}
                  </span>
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

          {/* Org Selector */}
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

          {/* Parent Profile Avatar & Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "10px", borderLeft: "1px solid #e4e6e9" }}>
            <img
              src={getStudentAvatarUrl("Guardian", organization.id)}
              alt="Parent Account"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#0b0f19",
                border: "1px solid #e4e6e9",
              }}
              title="Verified Guardian"
            />
            <button
              onClick={onLogout}
              title="Sign Out"
              style={{
                padding: "6px",
                borderRadius: "6px",
                border: "none",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE BODY (Sidebar + Main View) */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Mobile menu backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 30,
              background: "rgba(11, 15, 25, 0.6)",
              backdropFilter: "blur(2px)",
            }}
          />
        )}

        {/* Universal Midnight Obsidian Sidebar (#0b0f19) */}
        <aside
          style={{
            width: "256px",
            background: "#0b0f19",
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexShrink: 0,
            zIndex: 35,
          }}
        >
          {/* Top of Sidebar: Ward Selector Card */}
          <div style={{ padding: "16px 14px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#8a92a6", marginBottom: "8px", paddingLeft: "6px" }}>
              Active Student Ward
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {wards.map((w) => {
                const isSelected = w.studentUserId === selectedWard.studentUserId;
                return (
                  <button
                    key={w.studentUserId}
                    onClick={() => {
                      setSelectedWardId(w.studentUserId);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: isSelected ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid transparent",
                      background: isSelected ? "#1c2337" : "transparent",
                      color: isSelected ? "#ffffff" : "#8a92a6",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={getStudentAvatarUrl(w.name, w.studentUserId)}
                        alt=""
                        style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#1c2337" }}
                      />
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "#ffffff" : "#d1d5db" }}>
                          {w.name}
                        </div>
                        <div style={{ fontSize: "10px", color: "#8a92a6" }}>{w.sectionName || "Enrolled"}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#8a92a6", marginBottom: "8px", paddingLeft: "8px" }}>
              Navigation
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: isActive ? "#1c2337" : "transparent",
                    color: isActive ? "#ffffff" : "#8a92a6",
                    fontSize: "12.5px",
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "left",
                  }}
                >
                  <Icon size={16} color={isActive ? "#ffffff" : "#8a92a6"} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer: Verified Session Badge */}
          <div style={{ padding: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <ShieldCheck size={20} color="#10b981" />
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff" }}>Verified Guardian</div>
                <div style={{ fontSize: "10px", color: "#8a92a6" }}>{wards.length} linked child profile(s)</div>
              </div>
            </div>
          </div>
        </aside>

        {/* 3. MAIN CONTENT VIEW CANVAS */}
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

      {/* 4. GLOBAL PARENT MODALS */}
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
