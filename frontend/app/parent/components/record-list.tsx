"use client";

import React from "react";

export function RecordList({
  title,
  rows,
  columns,
  badgeColumn,
  actionButton,
}: {
  title: string;
  rows: any[];
  columns: [string, string][];
  badgeColumn?: string;
  actionButton?: React.ReactNode;
}) {
  const value = (v: any) => (v == null || v === "" ? "—" : Array.isArray(v) ? v.join(", ") : String(v));

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e4e6e9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{title}</h3>
        {actionButton && <div>{actionButton}</div>}
      </div>

      {!rows.length ? (
        <div style={{ padding: "28px 20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
          No records currently found.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                {columns.map(([key, label]) => (
                  <th key={key} style={{ padding: "12px 16px" }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                >
                  {columns.map(([key]) => {
                    const val = value(row[key]);
                    const isBadge = key === badgeColumn || key === "status" || key === "grade";
                    return (
                      <td key={key} style={{ padding: "12px 16px", color: "#334155" }}>
                        {isBadge ? (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background:
                                val.toLowerCase().includes("approved") || val.toLowerCase().includes("paid") || val.toLowerCase().includes("present") || val.toLowerCase().includes("confirmed")
                                  ? "#dcfce7"
                                  : val.toLowerCase().includes("pending") || val.toLowerCase().includes("due")
                                  ? "#fef3c7"
                                  : val.toLowerCase().includes("absent") || val.toLowerCase().includes("overdue") || val.toLowerCase().includes("rejected") || val.toLowerCase().includes("cancelled")
                                  ? "#fee2e2"
                                  : "#f1f5f9",
                              color:
                                val.toLowerCase().includes("approved") || val.toLowerCase().includes("paid") || val.toLowerCase().includes("present") || val.toLowerCase().includes("confirmed")
                                  ? "#166534"
                                  : val.toLowerCase().includes("pending") || val.toLowerCase().includes("due")
                                  ? "#92400e"
                                  : val.toLowerCase().includes("absent") || val.toLowerCase().includes("overdue") || val.toLowerCase().includes("rejected") || val.toLowerCase().includes("cancelled")
                                  ? "#991b1b"
                                  : "#0c1e33",
                            }}
                          >
                            {val}
                          </span>
                        ) : (
                          <span style={{ fontWeight: key === "title" || key === "subject" || key === "name" ? 700 : 400, color: key === "title" || key === "subject" || key === "name" ? "#1e293b" : "#334155" }}>
                            {val}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
