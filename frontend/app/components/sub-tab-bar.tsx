"use client";

import React, { useEffect } from "react";
import { useDashboardNavigation } from "../dashboard-navigation";
import { OrganizationSummary } from "../edops-api";

export interface SubTabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  featureKey?: string;
  badge?: number | string;
}

export interface SubTabBarProps {
  organizationId: string;
  role: OrganizationSummary["role"];
  tabs: SubTabItem[];
  activeSubTab: string;
  onSubTabChange: (subTabId: string) => void;
  variant?: "pills" | "underline";
  className?: string;
}

export function SubTabBar({
  organizationId,
  role,
  tabs,
  activeSubTab,
  onSubTabChange,
  variant = "pills",
  className = "",
}: SubTabBarProps) {
  const { filterSubTabs } = useDashboardNavigation(organizationId, role);
  const enabledTabs = filterSubTabs(tabs);

  // If current active subtab got disabled or isn't set, auto-switch to first available
  useEffect(() => {
    if (enabledTabs.length > 0 && !enabledTabs.some((t) => t.id === activeSubTab)) {
      onSubTabChange(enabledTabs[0].id);
    }
  }, [enabledTabs, activeSubTab, onSubTabChange]);

  // If 0 or only 1 subtab is enabled, do not waste vertical screen estate
  if (enabledTabs.length <= 1) return null;

  if (variant === "underline") {
    return (
      <div
        className={`edops-subtab-bar ${className}`.trim()}
        role="tablist"
        aria-label="Sub navigation tabs"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          borderBottom: "1px solid #e4e6e9",
          padding: "0 4px",
          marginBottom: "16px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {enabledTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onSubTabChange(tab.id)}
              style={{
                all: "unset",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 4px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#0c1e33" : "#64748b",
                borderBottom: isActive ? "2px solid #0c1e33" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                marginBottom: "-1px",
              }}
            >
              {Icon && <Icon size={16} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  style={{
                    background: isActive ? "#0c1e33" : "#e2e8f0",
                    color: isActive ? "#ffffff" : "#475569",
                    padding: "2px 7px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default "pills" variant
  return (
    <div
      className={`edops-subtab-bar ${className}`.trim()}
      role="tablist"
      aria-label="Sub navigation tabs"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px",
        background: "#f1f5f9",
        borderRadius: "10px",
        marginBottom: "16px",
        width: "fit-content",
        maxWidth: "100%",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {enabledTabs.map((tab) => {
        const isActive = activeSubTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSubTabChange(tab.id)}
            style={{
              all: "unset",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: isActive ? 600 : 500,
              background: isActive ? "#ffffff" : "transparent",
              color: isActive ? "#0c1e33" : "#64748b",
              boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {Icon && <Icon size={14} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  background: isActive ? "#0c1e33" : "#cbd5e1",
                  color: isActive ? "#ffffff" : "#334155",
                  padding: "1px 6px",
                  borderRadius: "8px",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
