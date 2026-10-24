"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  X,
  Check,
  Calendar,
  BookOpen,
  Info,
} from "lucide-react";
import { getCommunicationNotices } from "../edops-api";

export type DropdownRole = "school_admin" | "principal" | "teacher" | "student" | "parent" | "platform";

export interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: "announcement" | "alert" | "academic" | "attendance" | "system";
  priority: "low" | "normal" | "high" | "urgent";
  sender: string;
  createdAt: string;
  read: boolean;
  targetTab?: string;
  targetSubTab?: string;
}

interface NotificationBellDropdownProps {
  organizationId?: string;
  role: DropdownRole;
  onNavigate?: (tab: string, subTab?: string) => void;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  iconSize?: number;
  iconColor?: string;
  badgeColor?: string;
  ariaLabel?: string;
  title?: string;
}

// Sensible contextual fallback notifications if backend database table is empty for new tenants
const ROLE_DEFAULT_NOTICES: Record<DropdownRole, UnifiedNotification[]> = {
  school_admin: [
    {
      id: "sa-1",
      title: "Fee Collection Cycle for Q3 Active",
      message: "Automated fee reminders dispatched to 142 parent accounts. 84% on-time payment track.",
      type: "alert",
      priority: "high",
      sender: "Finance Department",
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      read: false,
      targetTab: "finance",
    },
    {
      id: "sa-2",
      title: "Academic Term Calendar Approved",
      message: "The Governing Council has approved the Annual Term Examination dates and gazetted holidays.",
      type: "announcement",
      priority: "normal",
      sender: "Principal's Office",
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      read: false,
      targetTab: "communication",
      targetSubTab: "broadcast",
    },
    {
      id: "sa-3",
      title: "Transport Route 4 Schedule Update",
      message: "Maintenance scheduled for Bus #12. Alternate vehicle allocated for North Sector route.",
      type: "system",
      priority: "normal",
      sender: "Operations Team",
      createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      read: true,
      targetTab: "operations",
    },
  ],
  principal: [
    {
      id: "pr-1",
      title: "At-Risk Student Attendance Alert",
      message: "4 senior secondary students have fallen below the 75% attendance threshold this week.",
      type: "alert",
      priority: "urgent",
      sender: "Academic Discipline",
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: false,
      targetTab: "alerts",
    },
    {
      id: "pr-2",
      title: "Curriculum Progress Milestone Reached",
      message: "Grade 10 Science departments completed Unit 4 learning outcomes ahead of schedule.",
      type: "academic",
      priority: "normal",
      sender: "HOD Sciences",
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      read: false,
      targetTab: "academics",
      targetSubTab: "curriculum",
    },
    {
      id: "pr-3",
      title: "Teacher Substitution Arranged",
      message: "Mr. Sharma on approved leave today. 2 periods reassigned to faculty successfully.",
      type: "system",
      priority: "normal",
      sender: "Academic Coordinator",
      createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      read: true,
      targetTab: "timetable",
    },
  ],
  teacher: [
    {
      id: "tc-1",
      title: "Term Exam Question Paper Review",
      message: "Please submit Grade 10 Mathematics question paper blueprint by Friday 4:00 PM.",
      type: "academic",
      priority: "high",
      sender: "Examination Cell",
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      read: false,
      targetTab: "assessment",
    },
    {
      id: "tc-2",
      title: "Parent Query Awaiting Response",
      message: "Guardian of Aarav Sharma sent an inquiry regarding Term 1 physics scorecard.",
      type: "announcement",
      priority: "normal",
      sender: "Parent Helpdesk",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      read: false,
      targetTab: "communication",
    },
    {
      id: "tc-3",
      title: "Period Register Finalization",
      message: "Attendance register for Section 10-A is finalized and submitted to main school register.",
      type: "attendance",
      priority: "normal",
      sender: "Attendance Registry",
      createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      read: true,
      targetTab: "attendance",
    },
  ],
  student: [
    {
      id: "st-1",
      title: "New Assignment Posted in Mathematics",
      message: "Quadratic Equations Practice Set #3 published. Submission deadline: Tomorrow, 5:00 PM.",
      type: "academic",
      priority: "high",
      sender: "Mr. Rajesh Kumar",
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      read: false,
      targetTab: "academics",
      targetSubTab: "assignments",
    },
    {
      id: "st-2",
      title: "Annual Sports Meet Registration Open",
      message: "Entries open for track and field events. Contact sports coaches before Friday.",
      type: "announcement",
      priority: "normal",
      sender: "Physical Education Dept",
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      read: false,
      targetTab: "dashboard",
    },
    {
      id: "st-3",
      title: "Physics Unit Test Scorecard Published",
      message: "Your score: 28/30 (A+ Grade). Class average: 23.4. Great effort!",
      type: "academic",
      priority: "normal",
      sender: "Academic Evaluation",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      read: true,
      targetTab: "academics",
      targetSubTab: "assessments",
    },
  ],
  parent: [
    {
      id: "pa-1",
      title: "Term Exam Timetable & Admit Card",
      message: "Mid-Term Examination schedule has been released. View dates and syllabus breakdown.",
      type: "academic",
      priority: "high",
      sender: "School Administration",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
      targetTab: "academics",
    },
    {
      id: "pa-2",
      title: "Daily Attendance Notification",
      message: "Your ward was marked Present in school today at 08:10 AM.",
      type: "attendance",
      priority: "normal",
      sender: "Automated Gate Register",
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      read: false,
      targetTab: "attendance",
    },
    {
      id: "pa-3",
      title: "Upcoming Parent-Teacher Meeting (PTM)",
      message: "Scheduled for Saturday from 9:30 AM to 1:00 PM. Book your preferred faculty slot.",
      type: "announcement",
      priority: "normal",
      sender: "Principal's Desk",
      createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      read: true,
      targetTab: "ptm",
    },
  ],
  platform: [
    {
      id: "pl-1",
      title: "System Health: All Clusters Operational",
      message: "Zero service degradations detected across database nodes, worker queues, and gateways.",
      type: "system",
      priority: "normal",
      sender: "Platform Telemetry",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      read: false,
      targetTab: "health",
    },
    {
      id: "pl-2",
      title: "Database Backup Completed",
      message: "Automated snapshot backup #20261025 completed and encrypted to cloud storage.",
      type: "system",
      priority: "normal",
      sender: "Infrastructure Manager",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      read: false,
      targetTab: "overview",
    },
    {
      id: "pl-3",
      title: "New School Tenant Provisioned",
      message: "Delhi Public School tenant initialized with Enterprise plan features active.",
      type: "announcement",
      priority: "normal",
      sender: "Tenant Provisioning Service",
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      read: true,
      targetTab: "schools",
    },
  ],
};

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recent";
  }
}

export function NotificationBellDropdown({
  organizationId,
  role,
  onNavigate,
  buttonClassName,
  buttonStyle,
  iconSize = 16,
  iconColor = "#0c1e33",
  badgeColor = "#E84040",
  ariaLabel = "Notifications",
  title = "Notifications",
}: NotificationBellDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "alerts">("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [liveNotices, setLiveNotices] = useState<UnifiedNotification[]>([]);
  const [selectedItem, setSelectedItem] = useState<UnifiedNotification | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const storageKey = `edops_notif_read_${role}_${organizationId || "global"}`;

  // Restore read IDs from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setReadIds(new Set(JSON.parse(saved)));
      }
    } catch {
      // ignore storage error
    }
  }, [storageKey]);

  // Persist read IDs to localStorage
  const saveReadIds = (newSet: Set<string>) => {
    setReadIds(newSet);
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
    } catch {
      // ignore storage error
    }
  };

  // Fetch live notices from backend API
  useEffect(() => {
    let isMounted = true;
    if (!organizationId) {
      setLiveNotices([]);
      return;
    }

    getCommunicationNotices(organizationId)
      .then((data: any) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: UnifiedNotification[] = data.map((n: any) => ({
            id: String(n.id || `notice-${Math.random()}`),
            title: n.title || "School Circular",
            message: n.message || "",
            type: (n.priority === "urgent" || n.priority === "high" ? "alert" : "announcement") as any,
            priority: (n.priority || "normal") as any,
            sender: n.senderName || n.sentBy || "School Administration",
            createdAt: n.createdAt || new Date().toISOString(),
            read: false,
            targetTab: role === "parent" ? "notices" : "communication",
            targetSubTab: "broadcast",
          }));
          setLiveNotices(mapped);
        } else {
          setLiveNotices([]);
        }
      })
      .catch(() => {
        if (isMounted) setLiveNotices([]);
      });

    return () => {
      isMounted = false;
    };
  }, [organizationId, role]);

  // Combine live notices with curated role fallbacks
  const allNotifications: UnifiedNotification[] = useMemo(() => {
    const defaults = ROLE_DEFAULT_NOTICES[role] || ROLE_DEFAULT_NOTICES.school_admin;
    const combined = [...liveNotices];

    // Append defaults not already in combined
    for (const d of defaults) {
      if (!combined.some((c) => c.title.toLowerCase() === d.title.toLowerCase())) {
        combined.push(d);
      }
    }

    return combined.map((n) => ({
      ...n,
      read: readIds.has(n.id) || n.read,
    }));
  }, [liveNotices, role, readIds]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.read).length;
  }, [allNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return allNotifications.filter((n) => !n.read);
    }
    if (filter === "alerts") {
      return allNotifications.filter((n) => n.priority === "urgent" || n.priority === "high" || n.type === "alert");
    }
    return allNotifications;
  }, [allNotifications, filter]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const markAllRead = () => {
    const next = new Set(readIds);
    allNotifications.forEach((n) => next.add(n.id));
    saveReadIds(next);
  };

  const markItemRead = (item: UnifiedNotification) => {
    const next = new Set(readIds);
    next.add(item.id);
    saveReadIds(next);
  };

  const handleItemClick = (item: UnifiedNotification) => {
    markItemRead(item);
    if (item.targetTab && onNavigate) {
      setIsOpen(false);
      onNavigate(item.targetTab, item.targetSubTab);
    } else {
      setSelectedItem(item);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    if (!onNavigate) return;
    if (role === "school_admin") onNavigate("communication", "broadcast");
    else if (role === "teacher") onNavigate("communication");
    else if (role === "student") onNavigate("communication");
    else if (role === "principal") onNavigate("alerts");
    else if (role === "parent") onNavigate("notices");
    else if (role === "platform") onNavigate("overview");
  };

  const getIconForType = (type: string, priority: string) => {
    if (priority === "urgent" || priority === "high") {
      return <ShieldAlert size={16} color="#DC2626" />;
    }
    switch (type) {
      case "announcement":
        return <Megaphone size={16} color="#4F46E5" />;
      case "academic":
        return <BookOpen size={16} color="#0284C7" />;
      case "attendance":
        return <Calendar size={16} color="#16A34A" />;
      case "system":
        return <Info size={16} color="#475569" />;
      default:
        return <Bell size={16} color="#64748B" />;
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        title={title}
        className={buttonClassName}
        style={{
          all: "unset",
          boxSizing: "border-box",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "background 0.15s ease, transform 0.1s ease",
          ...buttonStyle,
        }}
        onMouseEnter={(e) => {
          if (!buttonStyle?.background || buttonStyle.background === "#ffffff" || buttonStyle.background === "none") {
            e.currentTarget.style.background = "#f1f5f9";
          }
        }}
        onMouseLeave={(e) => {
          if (buttonStyle?.background) {
            e.currentTarget.style.background = String(buttonStyle.background);
          } else {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <Bell size={iconSize} color={iconColor} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              minWidth: unreadCount > 9 ? "16px" : "8px",
              height: unreadCount > 9 ? "16px" : "8px",
              padding: unreadCount > 9 ? "0 4px" : "0",
              borderRadius: unreadCount > 9 ? "10px" : "50%",
              background: badgeColor,
              border: "1.5px solid #ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1,
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }}
          >
            {unreadCount > 9 ? "9+" : ""}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "370px",
            maxWidth: "calc(100vw - 24px)",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 12px 30px -4px rgba(15, 23, 42, 0.15), 0 4px 12px -2px rgba(15, 23, 42, 0.08)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "edopsFadeIn 0.15s ease-out",
          }}
        >
          {/* Popover Header */}
          <div
            style={{
              padding: "14px 16px 12px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fafafa",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: "#0c1e33",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Bell size={14} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0c1e33", lineHeight: 1.2 }}>
                  Notifications
                </h3>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                  {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "All updates caught up"}
                </span>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  all: "unset",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#2563eb",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                }}
                title="Mark all as read"
              >
                <Check size={12} strokeWidth={2.5} /> Mark read
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div
            style={{
              padding: "8px 16px",
              display: "flex",
              gap: "6px",
              borderBottom: "1px solid #f1f5f9",
              background: "#ffffff",
            }}
          >
            {(
              [
                { id: "all", label: `All (${allNotifications.length})` },
                { id: "unread", label: `Unread (${unreadCount})` },
                { id: "alerts", label: "Alerts" },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  style={{
                    all: "unset",
                    padding: "4px 10px",
                    borderRadius: "16px",
                    fontSize: "11px",
                    fontWeight: active ? 700 : 500,
                    background: active ? "#0c1e33" : "#f1f5f9",
                    color: active ? "#ffffff" : "#475569",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Notification Items List */}
          <div
            style={{
              maxHeight: "340px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: "36px 20px",
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                <CheckCircle2 size={32} color="#10B981" style={{ margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                  {filter === "unread" ? "No unread notifications" : "No notifications found"}
                </p>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  You are completely caught up with current circulars.
                </span>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isUrgent = item.priority === "urgent" || item.priority === "high";
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      background: item.read ? "#ffffff" : "#f8fafc",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      transition: "background 0.12s ease",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = item.read ? "#ffffff" : "#f8fafc")
                    }
                  >
                    {/* Status Dot */}
                    {!item.read && (
                      <span
                        style={{
                          position: "absolute",
                          left: "6px",
                          top: "16px",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: isUrgent ? "#DC2626" : "#2563EB",
                        }}
                      />
                    )}

                    {/* Icon container */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: isUrgent ? "#FEE2E2" : "#F1F5F9",
                        display: "grid",
                        placeItems: "center",
                        marginTop: "2px",
                      }}
                    >
                      {getIconForType(item.type, item.priority)}
                    </div>

                    {/* Text content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          marginBottom: "3px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12.5px",
                            fontWeight: item.read ? 600 : 700,
                            color: isUrgent ? "#991B1B" : "#0f172a",
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.title}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 500,
                            color: "#94a3b8",
                            flexShrink: 0,
                          }}
                        >
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: "11.5px",
                          color: "#475569",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.message}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "#64748b",
                            background: "#e2e8f0",
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {item.sender}
                        </span>
                        {isUrgent && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "#DC2626",
                              background: "#FEE2E2",
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Popover Footer */}
          <div
            style={{
              padding: "10px 16px",
              background: "#fafafa",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={handleViewAll}
              style={{
                all: "unset",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#0c1e33",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#eaedf2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span>
                {role === "parent"
                  ? "Open Notice Board & Grievances"
                  : role === "principal"
                  ? "View All Academic Alerts"
                  : "View All Notices & Circulars"}
              </span>
              <ChevronRight size={13} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                all: "unset",
                fontSize: "11px",
                fontWeight: 500,
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Selected Item Full Detail Modal */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 10000,
            display: "grid",
            placeItems: "center",
            padding: "16px",
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fafafa",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {getIconForType(selectedItem.type, selectedItem.priority)}
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  {selectedItem.sender}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ all: "unset", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "16px", fontWeight: 700, color: "#0c1e33" }}>
                {selectedItem.title}
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: "#334155", lineHeight: 1.6 }}>
                {selectedItem.message}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#94a3b8" }}>
                <Clock size={12} />
                <span>Published {new Date(selectedItem.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                background: "#fafafa",
              }}
            >
              {selectedItem.targetTab && onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    const tab = selectedItem.targetTab;
                    const sub = selectedItem.targetSubTab;
                    setSelectedItem(null);
                    setIsOpen(false);
                    if (tab) onNavigate(tab, sub);
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    background: "#0c1e33",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Go to Action
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  background: "#e2e8f0",
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
