"use client";

import { School } from "./types";

export function SubscriptionsPane({
  schools,
  onExtendPeriod
}: {
  schools: School[];
  onExtendPeriod: (schoolId: string, currentStatus: string, extendDays: number) => void;
}) {
  return (
    <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Active Subscriptions & Lifecycles</h2>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Monitor renewal dates, trial expirations, and status state-machines</p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left", color: "#4B5563" }}>
              <th style={{ padding: "10px" }}>School</th>
              <th style={{ padding: "10px" }}>Assigned Plan</th>
              <th style={{ padding: "10px" }}>Billing Status</th>
              <th style={{ padding: "10px" }}>Term Period</th>
              <th style={{ padding: "10px" }}>Monthly Cost</th>
              <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map(s => (
              <tr key={s.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "12px 10px" }}>
                  <b>{s.name}</b>
                  <div style={{ fontSize: "11px", color: "#6B7280" }}>{s.code}</div>
                </td>
                <td style={{ padding: "12px 10px" }}>
                  <span style={{ fontWeight: 700, color: "#064E3B" }}>{s.plan}</span>
                </td>
                <td style={{ padding: "12px 10px" }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                    background: s.status === "active" ? "#DEF7EC" : s.status === "trial" ? "#FEF3C7" : "#FDE8E8",
                    color: s.status === "active" ? "#03543F" : s.status === "trial" ? "#92400E" : "#9B1C1C"
                  }}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: "12px 10px", fontSize: "12px", color: "#4B5563" }}>
                  2026-03-01 → 2026-03-31
                </td>
                <td style={{ padding: "12px 10px", fontWeight: 700 }}>
                  ₹{s.plan === "Enterprise" ? "1,45,000" : s.plan === "Professional" ? "65,000" : "25,000"}
                </td>
                <td style={{ padding: "12px 10px", textAlign: "right" }}>
                  <button
                    onClick={() => onExtendPeriod(s.id, s.status, 30)}
                    style={{ padding: "5px 10px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Extend Period (+30d)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
