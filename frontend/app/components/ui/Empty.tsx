"use client";

import React from "react";
import { Inbox } from "lucide-react";

export function Empty({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="product-empty">
      <span><Inbox size={20} /></span>
      <h3>{title}</h3>
      <p>{copy}</p>
      {action && (
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
