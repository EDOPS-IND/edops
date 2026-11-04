"use client";

import React from "react";

export interface TableSkeletonRowsProps {
  rows?: number;
  columns?: number;
  border?: string;
}

export function TableSkeletonRows({
  rows = 6,
  columns = 6,
  border = "#E0E5EB",
}: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => {
        const isEven = rIdx % 2 === 0;
        return (
          <tr
            key={rIdx}
            style={{
              height: "52px",
              minHeight: "52px",
              background: isEven ? "#FFFFFF" : "#F8FAFC",
              borderBottom: `1px solid ${border}`,
              boxSizing: "border-box",
            }}
          >
            {/* Col 1: Avatar / Icon + Text shimmer */}
            <td style={{ padding: "0 18px", height: "52px", verticalAlign: "middle" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  className="edops-skeleton"
                  style={{ width: "30px", height: "30px", borderRadius: "6px", flexShrink: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "125px" }}>
                  <div className="edops-skeleton" style={{ height: "12px", width: "85%" }} />
                  <div className="edops-skeleton" style={{ height: "9px", width: "60%" }} />
                </div>
              </div>
            </td>
            {/* Middle columns */}
            {Array.from({ length: Math.max(columns - 2, 1) }).map((_, cIdx) => (
              <td key={cIdx} style={{ padding: "0 14px", height: "52px", verticalAlign: "middle" }}>
                <div
                  className="edops-skeleton"
                  style={{
                    height: "12px",
                    width: cIdx % 2 === 0 ? "70px" : "105px",
                    maxWidth: "90%",
                  }}
                />
              </td>
            ))}
            {/* Last column: Action button */}
            <td style={{ padding: "0 18px", height: "52px", textAlign: "right", verticalAlign: "middle" }}>
              <div style={{ display: "inline-flex", justifyContent: "flex-end", width: "100%" }}>
                <div
                  className="edops-skeleton"
                  style={{ height: "26px", width: "65px", borderRadius: "6px" }}
                />
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

export interface KpiSkeletonGridProps {
  count?: number;
  columns?: string;
  border?: string;
}

export function KpiSkeletonGrid({
  count = 4,
  columns = "repeat(auto-fit, minmax(210px, 1fr))",
  border = "#E0E5EB",
}: KpiSkeletonGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            background: "#FFFFFF",
            border: `1px solid ${border}`,
            borderRadius: "10px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="edops-skeleton" style={{ height: "14px", width: "90px" }} />
            <div className="edops-skeleton" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
          </div>
          <div className="edops-skeleton" style={{ height: "28px", width: "60px" }} />
          <div className="edops-skeleton" style={{ height: "11px", width: "120px" }} />
        </div>
      ))}
    </div>
  );
}
