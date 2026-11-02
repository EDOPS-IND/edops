"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Info,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  Users,
} from "lucide-react";
import { getSchoolHolidays, deleteSchoolHoliday } from "../api/school-admin";
import { EmergencyHolidayModal } from "./emergency-holiday-modal";

export function toDDMMYYYY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const s = typeof dateInput === "string" ? dateInput.slice(0, 10) : dateInput.toISOString().slice(0, 10);
  const parts = s.split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return s;
}

export interface SchoolCalendarGridProps {
  organizationId: string;
  canEdit?: boolean;
  title?: string;
  subtitle?: string;
  events?: any[];
  controlledYearMonth?: { year: number; month: number };
  onMonthChange?: (ym: { year: number; month: number }) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SchoolCalendarGrid({
  organizationId,
  canEdit = false,
  title = "Institutional Academic Calendar & Holidays",
  subtitle = "Official gazetted school holidays, emergency closures, and institutional terms.",
  events = [],
  controlledYearMonth,
  onMonthChange,
}: SchoolCalendarGridProps) {
  const today = useMemo(() => new Date(), []);
  const todayString = useMemo(() => today.toISOString().slice(0, 10), [today]);

  const [internalYearMonth, setInternalYearMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-indexed
  });

  const currentYearMonth = controlledYearMonth || internalYearMonth;

  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  const [holidays, setHolidays] = useState<any[]>([]);
  const [backendEvents, setBackendEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal & Detail Popover
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalDate, setModalDate] = useState<string>(todayString);
  const [selectedItemDetail, setSelectedItemDetail] = useState<any | null>(null);

  // Load holidays & academic years
  const loadCalendarData = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await getSchoolHolidays(organizationId, {
        academicYearId: selectedAcademicYearId || undefined,
      });
      setHolidays(res?.holidays || []);
      setBackendEvents(res?.events || []);

      if (res?.academicYears && res.academicYears.length > 0) {
        setAcademicYears(res.academicYears);
        if (!selectedAcademicYearId) {
          const current = res.academicYears.find((y: any) => y.isCurrent) || res.academicYears[0];
          if (current) setSelectedAcademicYearId(current.id);
        }
      }
    } catch {
      // Fallback gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [organizationId, selectedAcademicYearId]);

  const updateYearMonth = (newYM: { year: number; month: number }) => {
    if (onMonthChange) {
      onMonthChange(newYM);
    } else {
      setInternalYearMonth(newYM);
    }
  };

  // Navigate months
  const handlePrevMonth = () => {
    const prev = currentYearMonth.month === 0
      ? { year: currentYearMonth.year - 1, month: 11 }
      : { year: currentYearMonth.year, month: currentYearMonth.month - 1 };
    updateYearMonth(prev);
  };

  const handleNextMonth = () => {
    const next = currentYearMonth.month === 11
      ? { year: currentYearMonth.year + 1, month: 0 }
      : { year: currentYearMonth.year, month: currentYearMonth.month + 1 };
    updateYearMonth(next);
  };

  const handleGoToday = () => {
    updateYearMonth({
      year: today.getFullYear(),
      month: today.getMonth(),
    });
  };

  // Month grid calculations
  const { year, month } = currentYearMonth;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Month date prefix: YYYY-MM
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const combinedEvents = useMemo(() => {
    return [...backendEvents, ...events];
  }, [backendEvents, events]);

  // Map both holidays and academic events (exams, tasks, ptms) by date string (YYYY-MM-DD)
  const itemsByDate = useMemo(() => {
    const map = new Map<string, any[]>();

    // 1. Add holidays
    for (const h of holidays) {
      const dateKey = typeof h.date === "string" ? h.date.slice(0, 10) : "";
      if (dateKey) {
        const existing = map.get(dateKey) || [];
        existing.push({
          ...h,
          isHoliday: true,
          itemKind: h.isAdhoc || h.is_adhoc ? "Emergency Day Off" : "School Holiday",
          displayDate: toDDMMYYYY(dateKey),
        });
        map.set(dateKey, existing);
      }
    }

    // 2. Add exams, deadlines, ptms
    for (const ev of combinedEvents) {
      const dateKey = typeof (ev.rawDate || ev.date) === "string"
        ? (ev.rawDate || ev.date).slice(0, 10)
        : "";
      if (dateKey) {
        const existing = map.get(dateKey) || [];
        // Avoid duplicate if already in
        if (!existing.some((x) => x.id && x.id === ev.id && x.title === ev.title)) {
          existing.push({
            ...ev,
            rawDate: dateKey,
            itemKind: ev.type || "Event",
            displayDate: toDDMMYYYY(dateKey),
          });
          map.set(dateKey, existing);
        }
      }
    }

    return map;
  }, [holidays, combinedEvents]);

  // Total holidays in current visible month
  const monthHolidaysCount = useMemo(() => {
    return holidays.filter((h) => typeof h.date === "string" && h.date.startsWith(monthStr)).length;
  }, [holidays, monthStr]);

  const monthEventsCount = useMemo(() => {
    return combinedEvents.filter((e) => {
      const d = typeof (e.rawDate || e.date) === "string" ? (e.rawDate || e.date).slice(0, 7) : "";
      return d === monthStr;
    }).length;
  }, [combinedEvents, monthStr]);

  const currentMonthItems = useMemo(() => {
    const list: any[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${monthStr}-${String(day).padStart(2, "0")}`;
      const items = itemsByDate.get(dStr);
      if (items && items.length > 0) {
        list.push(...items);
      }
    }
    return list;
  }, [daysInMonth, monthStr, itemsByDate]);

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!canEdit || !organizationId) return;
    if (!window.confirm("Cancel or remove this declared holiday/closure from the school calendar?")) return;
    try {
      await deleteSchoolHoliday(organizationId, holidayId);
      setSelectedItemDetail(null);
      await loadCalendarData();
    } catch (err: any) {
      alert(err?.message || "Failed to remove holiday");
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(12, 30, 51, 0.05)",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 1. Header Toolbar */}
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "#fafbfc",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarIcon size={18} style={{ color: "#0c1e33" }} />
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0c1e33" }}>
              {title}
            </h2>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
            {subtitle}
          </p>
        </div>

        {/* Action Controls & Session Picker */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Academic Year Dropdown */}
          {academicYears.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                Session:
              </span>
              <select
                value={selectedAcademicYearId}
                onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0c1e33",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} {ay.isCurrent ? "★ Current" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Navigator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "2px",
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              style={{
                border: "none",
                background: "transparent",
                padding: "6px 8px",
                cursor: "pointer",
                color: "#475569",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div
              style={{
                padding: "4px 12px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#0c1e33",
                minWidth: "140px",
                textAlign: "center",
              }}
            >
              {MONTH_NAMES[month]} {year}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              style={{
                border: "none",
                background: "transparent",
                padding: "6px 8px",
                cursor: "pointer",
                color: "#475569",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoToday}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Today
          </button>

          {/* Declare Action for Principal / School Admin */}
          {canEdit ? (
            <button
              type="button"
              onClick={() => {
                setModalDate(todayString);
                setIsModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "6px",
                border: "1px solid #e11d48",
                background: "#be123c",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(190, 18, 60, 0.2)",
              }}
            >
              <AlertTriangle size={14} />
              <span>Declare Holiday / Closure</span>
            </button>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 10px",
                borderRadius: "6px",
                background: "#f1f5f9",
                fontSize: "11px",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              <ShieldCheck size={13} style={{ color: "#16a34a" }} />
              <span>Official Institutional Calendar</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Subheader Status Banner */}
      <div
        style={{
          padding: "10px 24px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#64748b",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span>
            <b>{daysInMonth}</b> Days in {MONTH_NAMES[month]}
          </span>
          <span>•</span>
          <span style={{ color: monthHolidaysCount > 0 ? "#be123c" : "#64748b", fontWeight: 600 }}>
            <b>{monthHolidaysCount}</b> Declared School Off Day{monthHolidaysCount === 1 ? "" : "s"}
          </span>
          {monthEventsCount > 0 && (
            <>
              <span>•</span>
              <span style={{ color: "#6b21a8", fontWeight: 600 }}>
                <b>{monthEventsCount}</b> Scheduled Milestone{monthEventsCount === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>

        {canEdit && (
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            💡 Tip: Click any day cell on the grid to declare or manage a holiday.
          </span>
        )}
      </div>

      {/* 3. The 7-Column Calendar Grid */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: "750px" }}>
          {/* Day of Week Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              background: "#0c1e33",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              textAlign: "center",
            }}
          >
            {WEEKDAYS.map((dayName, idx) => {
              const isSunday = idx === 0;
              return (
                <div
                  key={dayName}
                  style={{
                    padding: "10px 4px",
                    borderRight: idx === 6 ? "none" : "1px solid #1e293b",
                    color: isSunday ? "#fca5a5" : "#f8fafc",
                  }}
                >
                  {dayName}
                </div>
              );
            })}
          </div>

          {/* Day Grid Cells */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              background: "#e2e8f0",
              gap: "1px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            {/* Empty padding cells before Day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  minHeight: "108px",
                  background: "#f8fafc",
                  opacity: 0.6,
                }}
              />
            ))}

            {/* Days 1 to daysInMonth */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${monthStr}-${String(dayNum).padStart(2, "0")}`;
              const dayOfWeek = (firstDayOfWeek + i) % 7;
              const isSunday = dayOfWeek === 0;
              const isToday = dateStr === todayString;
              const dayItems = itemsByDate.get(dateStr) || [];
              const hasItems = dayItems.length > 0;
              const holidayItem = dayItems.find((x) => x.isHoliday);

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => {
                    if (hasItems) {
                      setSelectedItemDetail(dayItems[0]);
                    } else if (canEdit) {
                      setModalDate(dateStr);
                      setIsModalOpen(true);
                    }
                  }}
                  style={{
                    minHeight: "108px",
                    background: isToday
                      ? "#eff6ff"
                      : holidayItem
                      ? holidayItem.isAdhoc
                        ? "#fff1f2"
                        : "#faf5ff"
                      : isSunday
                      ? "#f8fafc"
                      : "#ffffff",
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: hasItems || canEdit ? "pointer" : "default",
                    transition: "all 0.15s ease",
                    position: "relative",
                    border: isToday ? "2px solid #2563eb" : "none",
                    boxSizing: "border-box",
                  }}
                  onMouseEnter={(e) => {
                    if (hasItems || canEdit) {
                      e.currentTarget.style.filter = "brightness(0.97)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "none";
                  }}
                >
                  {/* Top: Day Number and Indicators */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: isToday ? 800 : 600,
                        color: isToday
                          ? "#1d4ed8"
                          : holidayItem
                          ? holidayItem.isAdhoc
                            ? "#be123c"
                            : "#7e22ce"
                          : isSunday
                          ? "#94a3b8"
                          : "#1e293b",
                      }}
                    >
                      {dayNum}
                    </span>

                    {isToday && (
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          background: "#2563eb",
                          color: "#ffffff",
                          padding: "1px 5px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                        }}
                      >
                        Today
                      </span>
                    )}

                    {isSunday && !holidayItem && !isToday && (
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 500 }}>
                        Weekend
                      </span>
                    )}
                  </div>

                  {/* Middle / Bottom: Badges for Holidays, Exams, Deadlines, PTMs */}
                  <div>
                    {hasItems ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "4px" }}>
                        {dayItems.map((item, itemIdx) => {
                          const isHoliday = item.isHoliday;
                          const isAdhoc = item.isAdhoc || item.is_adhoc;
                          const typeLower = (item.type || "").toLowerCase();
                          const isExam = typeLower.includes("exam");
                          const isDeadline = typeLower.includes("deadline");
                          const isPTM = typeLower.includes("ptm");

                          let bg = "#f1f5f9";
                          let border = "#e2e8f0";
                          let color = "#334155";
                          let labelPrefix = "";

                          if (isHoliday) {
                            bg = isAdhoc ? "#ffe4e6" : "#f3e8ff";
                            border = isAdhoc ? "#fecdd3" : "#e9d5ff";
                            color = isAdhoc ? "#9f1239" : "#6b21a8";
                          } else if (isExam) {
                            bg = "#ede9fe";
                            border = "#ddd6fe";
                            color = "#5b21b6";
                            labelPrefix = "Exam: ";
                          } else if (isDeadline) {
                            bg = "#fef3c7";
                            border = "#fde68a";
                            color = "#92400e";
                            labelPrefix = "Due: ";
                          } else if (isPTM) {
                            bg = "#dcfce7";
                            border = "#bbf7d0";
                            color = "#166534";
                            labelPrefix = "PTM: ";
                          }

                          return (
                            <div
                              key={item.id || itemIdx}
                              title={`${labelPrefix}${item.title} (${item.displayDate || toDDMMYYYY(dateStr)})`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItemDetail(item);
                              }}
                              style={{
                                padding: "2px 5px",
                                borderRadius: "4px",
                                background: bg,
                                border: `1px solid ${border}`,
                                color: color,
                                fontSize: "10.5px",
                                fontWeight: 700,
                                lineHeight: 1.2,
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isAdhoc && <AlertTriangle size={10} style={{ flexShrink: 0 }} />}
                              {isExam && <Award size={10} style={{ flexShrink: 0 }} />}
                              {isPTM && <Users size={10} style={{ flexShrink: 0 }} />}
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {labelPrefix}{item.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      canEdit && (
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#cbd5e1",
                            marginTop: "6px",
                            textAlign: "center",
                          }}
                        >
                          + Add
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Legend Footer */}
      <div
        style={{
          padding: "14px 24px",
          background: "#fafbfc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "11.5px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, color: "#475569" }}>Grid Legend:</span>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "11px", height: "11px", borderRadius: "3px", background: "#ffffff", border: "1px solid #cbd5e1" }} />
            <span style={{ color: "#475569" }}>Working Day</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "11px", height: "11px", borderRadius: "3px", background: "#f3e8ff", border: "1px solid #e9d5ff" }} />
            <span style={{ color: "#6b21a8", fontWeight: 600 }}>Gazetted Holiday</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "11px", height: "11px", borderRadius: "3px", background: "#ffe4e6", border: "1px solid #fecdd3" }} />
            <span style={{ color: "#be123c", fontWeight: 600 }}>Emergency Off Day</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "11px", height: "11px", borderRadius: "3px", background: "#ede9fe", border: "1px solid #ddd6fe" }} />
            <span style={{ color: "#5b21b6", fontWeight: 600 }}>Exam Milestone</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "11px", height: "11px", borderRadius: "3px", background: "#f8fafc", border: "1px solid #e2e8f0" }} />
            <span style={{ color: "#94a3b8" }}>Sunday / Weekend</span>
          </div>
        </div>

        <div style={{ color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={14} />
          <span>Statutory compliance: Declared closures are excluded from attendance denominators.</span>
        </div>
      </div>

      {/* 4.5 Monthly Events Roster */}
      <div style={{ padding: "20px 24px", borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarIcon size={16} style={{ color: "#0c1e33" }} />
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>
              Events &amp; Milestones for {MONTH_NAMES[month]} {year}
            </h3>
          </div>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
            {currentMonthItems.length} scheduled item{currentMonthItems.length === 1 ? "" : "s"}
          </span>
        </div>

        {currentMonthItems.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "12px",
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "8px",
            }}
          >
            No school holidays or academic milestones scheduled for {MONTH_NAMES[month]} {year}.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {currentMonthItems.map((item, idx) => {
              const isHoliday = item.isHoliday;
              const isAdhoc = item.isAdhoc || item.is_adhoc;
              const typeLower = (item.type || "").toLowerCase();
              const isExam = typeLower.includes("exam");
              const isDeadline = typeLower.includes("deadline");
              const isPTM = typeLower.includes("ptm");

              let badgeBg = "#f1f5f9";
              let badgeColor = "#334155";
              if (isHoliday) {
                badgeBg = isAdhoc ? "#ffe4e6" : "#f3e8ff";
                badgeColor = isAdhoc ? "#be123c" : "#7e22ce";
              } else if (isExam) {
                badgeBg = "#ede9fe";
                badgeColor = "#5b21b6";
              } else if (isDeadline) {
                badgeBg = "#fef3c7";
                badgeColor = "#92400e";
              } else if (isPTM) {
                badgeBg = "#dcfce7";
                badgeColor = "#166534";
              }

              const dateStr = item.rawDate || item.date;
              const eventDate = new Date(dateStr);
              const dayStr = !isNaN(eventDate.getTime()) ? String(eventDate.getDate()) : "—";
              const monthAbbr = !isNaN(eventDate.getTime())
                ? eventDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
                : "EVT";
              const formattedDate = toDDMMYYYY(dateStr);

              return (
                <div
                  key={item.id || idx}
                  onClick={() => setSelectedItemDetail(item)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                        minWidth: "50px",
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#0c1e33" }}>{dayStr}</div>
                      <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>{monthAbbr}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0c1e33" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "10px", marginTop: "2px" }}>
                        <span style={{ fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1px 6px", borderRadius: "4px" }}>
                          {formattedDate}
                        </span>
                        <span>
                          <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                          {item.time || "All Day"}
                        </span>
                        {item.description && (
                          <span style={{ color: "#94a3b8" }}>• {item.description}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: badgeBg,
                      color: badgeColor,
                      textTransform: "capitalize",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.itemKind || item.type || "Milestone"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Date Item Details Drawer / Popover Modal */}
      {selectedItemDetail && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(12, 30, 51, 0.5)",
            backdropFilter: "blur(2px)",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItemDetail(null);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(12, 30, 51, 0.2)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                background: selectedItemDetail.isAdhoc
                  ? "#fff1f2"
                  : selectedItemDetail.isHoliday
                  ? "#faf5ff"
                  : "#f5f3ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {selectedItemDetail.isAdhoc ? (
                  <AlertTriangle size={18} style={{ color: "#be123c" }} />
                ) : (
                  <CalendarIcon size={18} style={{ color: "#7e22ce" }} />
                )}
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 700,
                      color: selectedItemDetail.isAdhoc ? "#9f1239" : "#581c87",
                    }}
                  >
                    {selectedItemDetail.isHoliday
                      ? selectedItemDetail.isAdhoc
                        ? "Emergency School Closure"
                        : "School Calendar Holiday"
                      : `${selectedItemDetail.type || "Academic"} Milestone`}
                  </h3>
                  <div style={{ fontSize: "11px", color: selectedItemDetail.isAdhoc ? "#be123c" : "#7e22ce", fontWeight: 600 }}>
                    Date: {toDDMMYYYY(selectedItemDetail.rawDate || selectedItemDetail.date)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemDetail(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Title / Event Name
                </label>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#0c1e33", marginTop: "2px" }}>
                  {selectedItemDetail.title}
                </div>
              </div>

              {selectedItemDetail.description && (
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Details
                  </label>
                  <div style={{ fontSize: "13px", color: "#334155", marginTop: "2px", lineHeight: 1.5 }}>
                    {selectedItemDetail.description}
                  </div>
                </div>
              )}

              {selectedItemDetail.notes && (
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Official Notice &amp; Notes
                  </label>
                  <div style={{ fontSize: "13px", color: "#334155", marginTop: "2px", lineHeight: 1.5 }}>
                    {selectedItemDetail.notes}
                  </div>
                </div>
              )}

              {selectedItemDetail.isHoliday ? (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    fontSize: "12px",
                    color: "#166534",
                    lineHeight: 1.4,
                  }}
                >
                  <b>Attendance Impact:</b> Non-instructional day. Excluded from student attendance denominator so no student is penalized.
                </div>
              ) : (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                    color: "#475569",
                  }}
                >
                  <b>Schedule:</b> {selectedItemDetail.time || "All Day"}
                </div>
              )}

              {selectedItemDetail.declaredByName && (
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Declared by: {selectedItemDetail.declaredByName}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                {canEdit && selectedItemDetail.isHoliday && (
                  <button
                    type="button"
                    onClick={() => handleDeleteHoliday(selectedItemDetail.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "1px solid #fecdd3",
                      background: "#fff1f2",
                      color: "#be123c",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Cancel Holiday</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedItemDetail(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0c1e33",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Declare Holiday Modal */}
      {canEdit && (
        <EmergencyHolidayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          organizationId={organizationId}
          initialDate={modalDate}
          academicYearId={selectedAcademicYearId}
          onSuccess={() => loadCalendarData()}
        />
      )}
    </div>
  );
}
