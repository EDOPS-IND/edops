"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  clearable = true,
  disabled = false,
  style,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.sublabel?.toLowerCase().includes(q) ?? false;
      const matchBadge = opt.badge?.toLowerCase().includes(q) ?? false;
      return matchLabel || matchSub || matchBadge;
    });
  }, [options, search]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        fontFamily: "'Poppins', sans-serif",
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          minHeight: "42px",
          padding: "8px 12px",
          background: disabled ? "#F8FAFC" : "#FFFFFF",
          border: isOpen ? "1.5px solid #2563EB" : "1px solid #D5DCE4",
          borderRadius: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(37, 99, 235, 0.12)" : "none",
          outline: "none",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
            flex: 1,
          }}
        >
          {selectedOption ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                flex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#0C1E33",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: "4px",
                      background: selectedOption.badgeColor || "#EFF6FF",
                      color: "#1E40AF",
                    }}
                  >
                    {selectedOption.badge}
                  </span>
                )}
              </div>
              {selectedOption.sublabel && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#64748B",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: "13px", color: "#94A3B8" }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                color: "#94A3B8",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            style={{
              color: "#64748B",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1050,
            background: "#FFFFFF",
            border: "1px solid #D5DCE4",
            borderRadius: "8px",
            boxShadow:
              "0 10px 25px -5px rgba(12, 30, 51, 0.1), 0 8px 10px -6px rgba(12, 30, 51, 0.05)",
            maxHeight: "280px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeIn 0.12s ease",
          }}
        >
          {/* Live Search Input */}
          <div
            style={{
              padding: "8px",
              borderBottom: "1px solid #F1F5F9",
              background: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Search size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "12px",
                fontFamily: "'Poppins', sans-serif",
                color: "#0C1E33",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            style={{
              overflowY: "auto",
              maxHeight: "220px",
              padding: "4px 0",
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "16px 12px",
                  fontSize: "12px",
                  color: "#94A3B8",
                  textAlign: "center",
                }}
              >
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                const isDisabled = Boolean(opt.disabled);

                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      if (!isDisabled) {
                        onChange(opt.value);
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      background: isSelected
                        ? "#EFF6FF"
                        : isDisabled
                        ? "#FAFAFA"
                        : "transparent",
                      opacity: isDisabled ? 0.6 : 1,
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled && !isSelected) {
                        e.currentTarget.style.background = "#F8FAFC";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled && !isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                        gap: "2px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12.5px",
                            fontWeight: isSelected ? 600 : 500,
                            color: isDisabled
                              ? "#94A3B8"
                              : isSelected
                              ? "#1D4ED8"
                              : "#0C1E33",
                          }}
                        >
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 500,
                              padding: "1px 5px",
                              borderRadius: "3px",
                              background: opt.badgeColor || "#E2E8F0",
                              color: "#334155",
                            }}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>

                      {opt.sublabel && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#64748B",
                          }}
                        >
                          {opt.sublabel}
                        </span>
                      )}

                      {isDisabled && opt.disabledReason && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#D97706",
                            fontWeight: 500,
                          }}
                        >
                          ⚠️ {opt.disabledReason}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check
                        size={15}
                        style={{ color: "#2563EB", flexShrink: 0 }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
