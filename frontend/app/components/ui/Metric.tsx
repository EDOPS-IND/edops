"use client";

import React from "react";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="score-metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
