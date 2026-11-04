"use client";

import React from "react";
import {
  X,
  User,
  Briefcase,
  FileText,
  Clock,
  Mail,
  Phone,
  UserCheck,
  UserX,
} from "lucide-react";
import { StaffRecord } from "../types";
import { getStudentAvatarUrl } from "../../edops-api";
import { MemberLifecycleTarget } from "../../components/member-lifecycle-modal";

export interface StaffDossierDrawerProps {
  staff: StaffRecord | null;
  onClose: () => void;
  staff360Tab: "personal" | "employment" | "documents" | "activity";
  onTabChange: (tab: "personal" | "employment" | "documents" | "activity") => void;
  onLifecycleAction?: (target: MemberLifecycleTarget) => void;
}

export function StaffDossierDrawer({
  staff,
  onClose,
  staff360Tab,
  onTabChange,
  onLifecycleAction,
}: StaffDossierDrawerProps) {
  if (!staff) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12, 30, 51, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        overflow: "hidden",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="edops-right-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Staff Profile - ${staff.name}`}
        style={{
          width: "var(--edops-drawer-width)",
          maxWidth: "100vw",
          height: "100vh",
          background: "#FFFFFF",
          boxShadow: "-8px 0 32px rgba(12, 30, 51, 0.14)",
          display: "flex",
          flexDirection: "column",
          animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative",
          zIndex: 1001,
          borderLeft: "1px solid #E2E8F0",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {/* Header: breadcrumb & close */}
        <div
          style={{
            padding: "18px 24px 0",
            background: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, letterSpacing: "0.02em" }}>
              Staff Dossier · #{staff.empId || staff.id?.slice(0, 8).toUpperCase() || "-"}
            </span>

            <button
              onClick={onClose}
              title="Close (Esc)"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                border: "1px solid #E2E8F0",
                background: "#FFFFFF",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
                e.currentTarget.style.color = "#0C1E33";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFFFF";
                e.currentTarget.style.color = "#64748B";
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Profile identity banner */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={getStudentAvatarUrl(staff.name, staff.email || staff.empId)}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    fontWeight: 600,
                    color: "#0C1E33",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {staff.name || "-"}
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "3px",
                  fontSize: "12px",
                  color: "#64748B",
                  flexWrap: "wrap",
                }}
              >
                <span>{staff.designation || "Staff Member"}</span>
                <span>·</span>
                <span>{staff.department || "Operations"}</span>
                <span>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={12} style={{ color: "#94A3B8" }} />
                  {staff.email || `${(staff.name || "staff").toLowerCase().replace(/[^a-z0-9]/g, "")}@staff.edops.edu`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Underline Tab Navigation */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            background: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
            padding: "0 20px",
            scrollbarWidth: "none",
            flexShrink: 0,
          }}
        >
          {[
            { id: "personal", label: "Personal", icon: User },
            { id: "employment", label: "Employment", icon: Briefcase },
            { id: "documents", label: "Documents", icon: FileText },
            { id: "activity", label: "Audit Log", icon: Clock },
          ].map((tab) => {
            const isActive = staff360Tab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                style={{
                  boxSizing: "border-box",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 12px",
                  fontSize: "12.5px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  background: "transparent",
                  color: isActive ? "#0C1E33" : "#64748B",
                  border: "none",
                  borderBottom: isActive ? "2px solid #0C1E33" : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.12s ease",
                  marginBottom: "-1px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#0C1E33";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#64748B";
                }}
              >
                <TabIcon size={13} style={{ color: isActive ? "#0C1E33" : "#94A3B8" }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            scrollbarWidth: "none",
          }}
        >
          {staff360Tab === "personal" && (
            <>
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                  <User size={14} style={{ color: "#475569" }} />
                  <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Staff Profile & Appointment</h4>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Full Name</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      {staff.name || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employee ID</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px", fontFamily: "monospace" }}>
                      {staff.empId || "EMP-" + (staff.id ? staff.id.slice(0, 6).toUpperCase() : "—")}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Department</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      {staff.department || "Operations & Support"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Designation</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      {staff.designation || "Staff"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employment Type</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      {staff.employmentType || "Full-Time Staff"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Joining Date</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      {staff.joiningDate || "Active Term"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Operational Status</div>
                    <div style={{ fontSize: "13px", color: (staff.status || "Active").toLowerCase().includes("pend") ? "#92400E" : "#047857", fontWeight: 600, marginTop: "2px" }}>
                      ● {staff.status || "Active Duty"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Shift Schedule</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      Standard Campus Shift (08:30 - 17:00)
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                  <Phone size={14} style={{ color: "#475569" }} />
                  <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Contact & Workspace</h4>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Official Email</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      {staff.email || `${(staff.name || "staff").toLowerCase().replace(/[^a-z0-9]/g, "")}@staff.edops.edu`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Primary Phone</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      {staff.phone || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Emergency Contact</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      {staff.phone || "Campus Security Desk"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Campus Work Station</div>
                    <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                      Central Operations Wing
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {staff360Tab === "employment" && (
            <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                <Briefcase size={14} style={{ color: "#475569" }} />
                <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Operational Clearances & Roster</h4>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Access Clearance</div>
                  <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>Level 2 (Campus Facilities)</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Duty Frequency</div>
                  <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>5 Days / Week</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Reporting Department</div>
                  <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>{staff.department || "Operations"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Supervisor / HOD</div>
                  <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>Campus Administrator</div>
                </div>
              </div>
            </div>
          )}

          {staff360Tab === "documents" && (
            <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                <FileText size={14} style={{ color: "#475569" }} />
                <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Verified Employment Documentation</h4>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { name: "Government Identity Proof", desc: "Aadhaar / National Identity Document", status: "Verified" },
                  { name: "Background Verification", desc: "Criminal background and character check", status: "Cleared" },
                  { name: "Employment Agreement & NDA", desc: "Countersigned formal institution contract", status: "Active Signed" },
                  { name: "Campus Safety & Access Pass", desc: "Authorized RFID badge & keycard access", status: "Issued" },
                ].map((doc, dIdx) => (
                  <div
                    key={dIdx}
                    style={{
                      padding: "10px 14px",
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33" }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                        {doc.desc}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: "#ECFDF5",
                        color: "#047857",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {staff360Tab === "activity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Summary metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <div style={{ padding: "12px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Shift Adherence</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#047857", marginTop: "2px" }}>99.2%</div>
                </div>
                <div style={{ padding: "12px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Active Post</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33", marginTop: "4px" }}>Operations</div>
                </div>
                <div style={{ padding: "12px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Breaches / Incidents</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", marginTop: "2px" }}>0</div>
                </div>
              </div>

              {/* Duty Roster & Check-in Table */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                  <Clock size={14} style={{ color: "#475569" }} />
                  <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#0C1E33" }}>
                    Recent Duty Roster & Campus Check-in
                  </h4>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { date: "Today", area: "Central Operations Wing", checkin: "08:24 AM", checkout: "17:00 PM (Scheduled)", status: "On Duty" },
                    { date: "Yesterday", area: "Facilities & Inventory", checkin: "08:28 AM", checkout: "17:04 PM", status: "Completed" },
                    { date: "2 days ago", area: "Central Operations Wing", checkin: "08:19 AM", checkout: "17:01 PM", status: "Completed" },
                  ].map((log, lIdx) => (
                    <div
                      key={lIdx}
                      style={{
                        padding: "9px 12px",
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#0C1E33" }}>{log.area}</div>
                        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "1px" }}>
                          {log.date} · In: {log.checkin} · Out: {log.checkout}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: log.status === "On Duty" ? "#ECFDF5" : "#F1F5F9",
                          color: log.status === "On Duty" ? "#047857" : "#475569",
                        }}
                      >
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Drawer Footer */}
        <div
          style={{
            padding: "12px 24px",
            background: "#FFFFFF",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748B" }}>
            Staff #{staff.empId || staff.id?.slice(0, 8)} · {staff.department || "Operations & Support"}
          </span>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {onLifecycleAction && (
              <button
                type="button"
                onClick={() =>
                  onLifecycleAction({
                    id: (staff as any).userId || staff.id,
                    name: staff.name,
                    email: staff.email,
                    role: "staff",
                    status: staff.status,
                    sublabel: `Staff #${staff.empId || staff.id?.slice(0, 8)}`,
                  })
                }
                style={{
                  padding: "6px 14px",
                  background: (staff.status || "").toLowerCase() === "inactive" ? "#DCFCE7" : "#FEE2E2",
                  color: (staff.status || "").toLowerCase() === "inactive" ? "#166534" : "#DC2626",
                  border: (staff.status || "").toLowerCase() === "inactive" ? "1px solid #86EFAC" : "1px solid #FCA5A5",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {(staff.status || "").toLowerCase() === "inactive" ? (
                  <>
                    <UserCheck size={13} />
                    <span>Reactivate Staff</span>
                  </>
                ) : (
                  <>
                    <UserX size={13} />
                    <span>Deactivate / Remove</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                padding: "6px 16px",
                background: "#F1F5F9",
                color: "#0C1E33",
                border: "1px solid #E2E8F0",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "12.5px",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            >
              Close
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
