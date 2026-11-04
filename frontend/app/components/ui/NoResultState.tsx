"use client";

import React from "react";

export interface NoResultStateProps {
  title: string;
  description: string;
  onReset?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  border?: string;
}

export function NoResultState({
  title,
  description,
  onReset,
  actionLabel,
  onAction,
  border = "#E0E5EB",
}: NoResultStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box",
        background: "#FFFFFF",
        borderRadius: "10px",
        border: `1px solid ${border}`,
      }}
    >
      <img
        src="/noresult.png"
        alt="No results found"
        style={{
          width: "135px",
          height: "auto",
          maxHeight: "115px",
          objectFit: "contain",
          marginBottom: "16px",
          opacity: 0.95,
        }}
      />
      <b
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          color: "#0C1E33",
          marginBottom: "6px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </b>
      <p
        style={{
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
          fontSize: "12.5px",
          color: "#495D72",
          maxWidth: "440px",
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: "7px 18px",
              borderRadius: "6px",
              background: "#0C1E33",
              color: "#FFFFFF",
              border: "none",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
              transition: "all 0.15s ease",
            }}
          >
            Reset Filters
          </button>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              padding: "7px 18px",
              borderRadius: "6px",
              background: "#FFFFFF",
              color: "#0C1E33",
              border: `1px solid ${border}`,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Poppins', sans-serif",
              transition: "all 0.15s ease",
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
