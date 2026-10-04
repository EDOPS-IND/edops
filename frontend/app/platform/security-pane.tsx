"use client";

import { AuditLog } from "./types";

export function SecurityPane({
  auditLogs
}: {
  auditLogs: AuditLog[];
}) {
  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Platform Staff Roles Table (§26, §27) */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700 }}>Platform Staff & Role RBAC</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left" }}>
              <th style={{ padding: "8px" }}>Role</th>
              <th style={{ padding: "8px" }}>Scope & Permissions</th>
              <th style={{ padding: "8px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { role: "Super Admin", perms: "Full platform root privilege (all resources)", status: "Active" },
              { role: "Platform Admin", perms: "School onboarding, tenant lifecycle, plans & overrides", status: "Active" },
              { role: "Finance Admin", perms: "Billing, invoices, offline payment verification, refunds", status: "Active" },
              { role: "Support Agent", perms: "Support tickets, temporary audited support sessions", status: "Active" },
              { role: "Security Admin", perms: "Immutable audit verification, MFA enforcement, policies", status: "Active" },
              { role: "Operations Manager", perms: "Academic defaults, rosters and school setup assistance", status: "Active" },
            ].map((st, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px 8px" }}><b>{st.role}</b></td>
                <td style={{ padding: "10px 8px", color: "#4B5563" }}>{st.perms}</td>
                <td style={{ padding: "10px 8px" }}><span style={{ color: "#10B981", fontWeight: 700 }}>{st.status}</span></td>
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
