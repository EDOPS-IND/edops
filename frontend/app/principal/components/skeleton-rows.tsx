"use client";

import React from "react";

export function TableSkeletonRows({
  rows = 6,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
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
              borderBottom: "1px solid #E0E5EB",
              boxSizing: "border-box",
            }}
          >
            {/* Col 1: Avatar circle + 2 text shimmer bars */}
            <td style={{ padding: "0 16px", height: "52px", verticalAlign: "middle" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  className="edops-skeleton"
                  style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0 }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "120px" }}>
                  <div className="edops-skeleton" style={{ height: "12px", width: "85%" }} />
                  <div className="edops-skeleton" style={{ height: "9px", width: "60%" }} />
                </div>
              </div>
            </td>
            {/* Middle columns */}
            {Array.from({ length: Math.max(1, columns - 2) }).map((_, cIdx) => (
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
            <td style={{ padding: "0 16px", height: "52px", textAlign: "right", verticalAlign: "middle" }}>
              <div style={{ display: "inline-flex", justifyContent: "flex-end", width: "100%" }}>
                <div
                  className="edops-skeleton"
                  style={{ height: "26px", width: "58px", borderRadius: "6px" }}
                />
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function StudentSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => {
        const isEven = rIdx % 2 === 0;
        return (
          <div
            key={rIdx}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0 8px",
              width: "100%",
              height: "52px",
              minHeight: "52px",
              background: isEven ? "#FFFFFF" : "#F8FAFC",
              borderBottom: "1px solid #E0E5EB",
            }}
          >
            <div style={{ flex: "2.5 1 220px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="edops-skeleton"
                style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "130px" }}>
                <div className="edops-skeleton" style={{ height: "12px", width: "85%" }} />
                <div className="edops-skeleton" style={{ height: "9px", width: "60%" }} />
              </div>
            </div>
            <div style={{ flex: "1.2 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "70px" }} />
            </div>
            <div style={{ flex: "1.3 1 130px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "80px" }} />
            </div>
            <div style={{ flex: "1.1 1 110px" }}>
              <div className="edops-skeleton" style={{ height: "18px", width: "60px", borderRadius: "10px" }} />
            </div>
            <div style={{ flex: "1.3 1 130px" }}>
              <div className="edops-skeleton" style={{ height: "18px", width: "70px", borderRadius: "10px" }} />
            </div>
            <div style={{ flex: "0 0 110px", display: "flex", justifyContent: "flex-end" }}>
              <div className="edops-skeleton" style={{ height: "26px", width: "56px", borderRadius: "6px" }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

export function TeacherSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => {
        const isEven = rIdx % 2 === 0;
        return (
          <div
            key={rIdx}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0 8px",
              width: "100%",
              height: "52px",
              minHeight: "52px",
              background: isEven ? "#FFFFFF" : "#F8FAFC",
              borderBottom: "1px solid #E0E5EB",
            }}
          >
            <div style={{ flex: "2.4 1 200px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="edops-skeleton"
                style={{ width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", width: "130px" }}>
                <div className="edops-skeleton" style={{ height: "12px", width: "85%" }} />
                <div className="edops-skeleton" style={{ height: "9px", width: "60%" }} />
              </div>
            </div>
            <div style={{ flex: "1.2 1 110px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "75px" }} />
            </div>
            <div style={{ flex: "1.3 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "85px" }} />
            </div>
            <div style={{ flex: "1.1 1 100px" }}>
              <div className="edops-skeleton" style={{ height: "20px", width: "65px", borderRadius: "4px" }} />
            </div>
            <div style={{ flex: "1.3 1 120px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "85px" }} />
            </div>
            <div style={{ flex: "1.1 1 100px" }}>
              <div className="edops-skeleton" style={{ height: "12px", width: "60px" }} />
            </div>
            <div style={{ flex: "1.0 1 90px" }}>
              <div className="edops-skeleton" style={{ height: "20px", width: "55px", borderRadius: "10px" }} />
            </div>
            <div style={{ flex: "0 0 160px", display: "flex", justifyContent: "flex-end" }}>
              <div className="edops-skeleton" style={{ height: "26px", width: "60px", borderRadius: "6px" }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

export function KpiSkeletonGrid() {
  const cards = [
    { bg: "#E0D3FF" },
    { bg: "#D0EDC0" },
    { bg: "#BCE6F3" },
    { bg: "#FADAC9" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "164px",
            padding: "20px",
            gap: "12px",
            background: c.bg,
            borderRadius: "10px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "110px", height: "12px", borderRadius: "4px" }} />
            <div className="edops-skeleton-kpi" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
          </div>
          <div className="edops-skeleton-kpi" style={{ width: "75px", height: "36px", borderRadius: "6px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <div className="edops-skeleton-kpi" style={{ width: "140px", height: "10px", borderRadius: "4px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div className="edops-skeleton-kpi" style={{ width: "55px", height: "10px", borderRadius: "4px" }} />
              <div className="edops-skeleton-kpi" style={{ width: "14px", height: "14px", borderRadius: "3px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
