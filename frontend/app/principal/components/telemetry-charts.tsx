"use client";

import React from "react";

export interface PillarPoint {
  label: string;
  value: number | null;
  target?: string;
}

/**
 * RadarPillarsChart
 * Deterministic 6-axis SVG radar polygon reflecting real academic health telemetry.
 * If data is unrecorded (null/0), renders the geometric web with an awaiting status.
 */
export function RadarPillarsChart({
  points,
  size = 180,
}: {
  points: PillarPoint[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 20;
  const totalAxes = points.length || 6;

  // Concentric hexagon level radii (100%, 66%, 33%)
  const levels = [1, 0.66, 0.33];

  const getCoordinates = (index: number, ratio: number) => {
    const angle = (index * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const r = Math.max(0, Math.min(1, ratio)) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const hasData = points.some((p) => typeof p.value === "number" && p.value > 0);

  // Compute points string for the data polygon
  const polygonPoints = points
    .map((p, i) => {
      const ratio = hasData && typeof p.value === "number" ? Math.max(0, Math.min(100, p.value)) / 100 : 0.05;
      const pt = getCoordinates(i, ratio);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible", display: "block" }}
        aria-label="Academic Health Radar Chart"
      >
        {/* Concentric Guide Hexagons */}
        {levels.map((level, lvlIdx) => {
          const hexPoints = Array.from({ length: totalAxes }, (_, i) => {
            const pt = getCoordinates(i, level);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          }).join(" ");
          return (
            <polygon
              key={lvlIdx}
              points={hexPoints}
              fill={lvlIdx === 0 ? "rgba(248, 250, 252, 0.5)" : "none"}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray={lvlIdx === 2 ? "2,2" : undefined}
            />
          );
        })}

        {/* 6 Spokes */}
        {Array.from({ length: totalAxes }, (_, i) => {
          const outer = getCoordinates(i, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
          );
        })}

        {/* Real Data Polygon */}
        {hasData ? (
          <>
            <polygon
              points={polygonPoints}
              fill="rgba(26, 92, 10, 0.22)"
              stroke="#1a5c0a"
              strokeWidth={2}
              strokeLinejoin="round"
              style={{ transition: "all 0.4s ease" }}
            />
            {points.map((p, i) => {
              if (p.value == null) return null;
              const ratio = Math.max(0, Math.min(100, p.value)) / 100;
              const pt = getCoordinates(i, ratio);
              return (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={3.5}
                  fill="#1a5c0a"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                >
                  <title>{`${p.label}: ${p.value}%`}</title>
                </circle>
              );
            })}
          </>
        ) : (
          <g>
            <circle cx={cx} cy={cy} r={18} fill="#f1f5f9" stroke="#cbd5e1" strokeDasharray="3,3" strokeWidth={1} />
            <text
              x={cx}
              y={cy + 3}
              textAnchor="middle"
              fontSize={8.5}
              fill="#64748b"
              fontWeight={600}
            >
              No Logs
            </text>
          </g>
        )}

        {/* Center Pivot */}
        <circle cx={cx} cy={cy} r={hasData ? 2.5 : 1} fill="#0c1e33" />
      </svg>
    </div>
  );
}

/**
 * SegmentedDonut
 * Reusable zero-dependency SVG donut ring for results and status breakdowns.
 */
export function SegmentedDonut({
  segments,
  size = 48,
  strokeWidth = 5,
  centerText,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerText?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  let accumulatedOffset = 0;

  return (
    <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)", display: "block" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          segments.map((seg, idx) => {
            const val = Math.max(0, seg.value);
            if (val === 0) return null;
            const segRatio = val / total;
            const strokeDash = segRatio * C;
            const offset = accumulatedOffset;
            accumulatedOffset += strokeDash;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeDash} ${C - strokeDash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
              >
                <title>{`${seg.label}: ${seg.value}`}</title>
              </circle>
            );
          })}
      </svg>
      {centerText && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: 700,
            color: "#0c1e33",
            userSelect: "none",
          }}
        >
          {centerText}
        </span>
      )}
    </div>
  );
}

/**
 * StackedProgressBar
 * Reusable horizontal stacked bar for Target vs Actual completion.
 */
export function StackedProgressBar({
  segments,
  height = 8,
}: {
  segments: { label: string; value: number; color: string }[];
  height?: number;
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  return (
    <div
      style={{
        width: "100%",
        height: `${height}px`,
        background: "#e2e8f0",
        borderRadius: `${height / 2}px`,
        overflow: "hidden",
        display: "flex",
      }}
    >
      {total > 0 &&
        segments.map((s, i) => {
          const val = Math.max(0, s.value);
          if (val === 0) return null;
          const widthPct = (val / total) * 100;
          return (
            <div
              key={i}
              style={{
                width: `${widthPct}%`,
                height: "100%",
                background: s.color,
                transition: "width 0.4s ease",
              }}
              title={`${s.label}: ${s.value}`}
            />
          );
        })}
    </div>
  );
}
