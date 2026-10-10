"use client";

import { AuditLog } from "./types";

export function SecurityPane({
  auditLogs,
  staffData,
}: {
  auditLogs: AuditLog[];
  staffData?: { staff: any[]; roles: any[] };
}) {
  const staff = staffData?.staff || [];
  const roles = staffData?.roles || [
    { role: "super_admin", label: "Super Admin", permissions: "Full platform root privilege (all resources)" },
    { role: "platform_admin", label: "Platform Admin", permissions: "School onboarding, tenant lifecycle, plans & overrides" },
    { role: "finance_admin", label: "Finance Admin", permissions: "Billing, invoices, offline payment verification, refunds" },
    { role: "support_agent", label: "Support Agent", permissions: "Support tickets, temporary audited support sessions" },
    { role: "security_admin", label: "Security Admin", permissions: "Immutable audit verification, MFA enforcement, policies" },
    { role: "operations_manager", label: "Operations Manager", permissions: "Academic defaults, rosters and school setup assistance" },
  ];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Platform Staff Members Table (§26, §27) */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Platform Staff Accounts</h3>
          <span style={{ fontSize: "11.5px", color: "#6B7280" }}>{staff.length} Active Staff Member(s)</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left" }}>
              <th style={{ padding: "8px" }}>Name / Contact</th>
              <th style={{ padding: "8px" }}>Platform Role</th>
              <th style={{ padding: "8px" }}>Super Admin</th>
              <th style={{ padding: "8px" }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {staff.length > 0 ? (
              staff.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "10px 8px" }}>
                    <b>{s.name || s.email}</b>
                    <div style={{ fontSize: "11px", color: "#6B7280" }}>{s.email}</div>
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                      background: "#DEF7EC", color: "#03543F", textTransform: "capitalize"
                    }}>
                      {String(s.platformRole || "staff").replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <span style={{ color: s.isSuperAdmin ? "#10B981" : "#6B7280", fontWeight: 700 }}>
                      {s.isSuperAdmin ? "YES" : "NO"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", color: "#6B7280", fontSize: "12px" }}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "Active"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "#6B7280" }}>
                  No platform staff users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Role RBAC Definition (§26) */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700 }}>Platform Role RBAC Matrix</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left" }}>
              <th style={{ padding: "8px" }}>Role</th>
              <th style={{ padding: "8px" }}>Scope & Permissions</th>
              <th style={{ padding: "8px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px 8px" }}><b>{r.label || r.role}</b></td>
                <td style={{ padding: "10px 8px", color: "#4B5563" }}>{r.permissions}</td>
                <td style={{ padding: "10px 8px" }}><span style={{ color: "#10B981", fontWeight: 700 }}>Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Immutable Audit Logs Table (§22) */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Immutable Platform Audit Trail</h3>
          <span style={{ fontSize: "11px", color: "#6B7280" }}>Cryptographically hashed entries</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left", color: "#4B5563" }}>
              <th style={{ padding: "8px" }}>Timestamp</th>
              <th style={{ padding: "8px" }}>Action</th>
              <th style={{ padding: "8px" }}>School / Tenant</th>
              <th style={{ padding: "8px" }}>Actor</th>
              <th style={{ padding: "8px" }}>State Diff / Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length > 0 ? (
              auditLogs.slice(0, 15).map(l => (
                <tr key={l.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "8px", color: "#6B7280" }}>{new Date(l.createdAt).toLocaleTimeString()}</td>
                  <td style={{ padding: "8px" }}><b>{l.action}</b></td>
                  <td style={{ padding: "8px" }}>{l.schoolName || "Platform"}</td>
                  <td style={{ padding: "8px" }}>{l.actorEmail || "Platform Admin"}</td>
                  <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "11px", color: "#4B5563" }}>
                    {JSON.stringify(l.details || {}).slice(0, 60)}...
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: "16px", textAlign: "center", color: "#6B7280" }}>
                  Audit records are streaming in real-time.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
