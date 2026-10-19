"use client";

import React from "react";
import { ShieldAlert, ArrowLeft, Building2, Sparkles } from "lucide-react";

export function ThreeDotsLoading({
  color = "#6366f1",
  size = 8,
  className = "",
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`edops-three-dots-wrapper ${className}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${Math.max(4, Math.round(size * 0.75))}px`,
        padding: "16px 0",
      }}
      role="status"
      aria-label="Loading..."
    >
      <span
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          backgroundColor: color,
          display: "inline-block",
          animation: "edops-dot-bounce 1.3s infinite ease-in-out both",
          animationDelay: "0ms",
        }}
      />
      <span
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          backgroundColor: color,
          opacity: 0.85,
          display: "inline-block",
          animation: "edops-dot-bounce 1.3s infinite ease-in-out both",
          animationDelay: "180ms",
        }}
      />
      <span
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          backgroundColor: color,
          opacity: 0.65,
          display: "inline-block",
          animation: "edops-dot-bounce 1.3s infinite ease-in-out both",
          animationDelay: "360ms",
        }}
      />
      <style>{`
        @keyframes edops-dot-bounce {
          0%, 80%, 100% {
            transform: scale(0.65);
            opacity: 0.35;
          }
          40% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export interface FeatureUnavailableCardProps {
  title?: string;
  featureName?: string;
  description?: string;
  onBackToDashboard?: () => void;
  dashboardLabel?: string;
}

export function FeatureUnavailableCard({
  title = "This dashboard feature is unavailable for this school",
  featureName,
  description = "This module has not been enabled for your institution under its current operational plan. Contact your school administrator or platform super-admin to unlock this capability.",
  onBackToDashboard,
  dashboardLabel = "Return to Dashboard",
}: FeatureUnavailableCardProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "440px",
        width: "100%",
        padding: "48px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "540px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e4e6e9",
          boxShadow: "0 4px 20px -2px rgba(12, 30, 51, 0.05), 0 1px 3px rgba(12, 30, 51, 0.03)",
          padding: "40px 36px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle accent backdrop glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "280px",
            height: "120px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Icon Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #fef3f2 0%, #fee4e2 100%)",
            border: "1px solid #fecdca",
            color: "#d92d20",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(217, 45, 32, 0.08)",
          }}
        >
          <ShieldAlert size={28} strokeWidth={2} />
        </div>

        {/* Status Chip */}
        <div style={{ marginBottom: "12px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: "#f4f6f8",
              color: "#495d72",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            <Building2 size={12} />
            {featureName ? `${featureName} · Restricted` : "School Feature Restriction"}
          </span>
        </div>

        {/* Primary Title - Matching User's exact prompt */}
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#0c1e33",
            margin: "0 0 10px 0",
            lineHeight: "1.35",
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h2>

        {/* Informative Explanation */}
        <p
          style={{
            fontSize: "13.5px",
            lineHeight: "1.55",
            color: "#64748b",
            margin: "0 0 28px 0",
            maxWidth: "460px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {description}
        </p>

        {/* Action Button */}
        {onBackToDashboard && (
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={onBackToDashboard}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "10px",
                background: "#0c1e33",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(12, 30, 51, 0.12)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#182a44";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0c1e33";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <ArrowLeft size={14} />
              <span>{dashboardLabel}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
