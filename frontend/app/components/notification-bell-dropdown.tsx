"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Megaphone,
  ShieldAlert,
  ChevronRight,
  X,
  Check,
  Calendar,
  BookOpen,
  Info,
  RefreshCw,
  Plus,
} from "lucide-react";
import {
  getCommunicationNotices,
  api,
  getPlatformDashboard,
} from "../edops-api";

export type DropdownRole = "school_admin" | "principal" | "teacher" | "student" | "parent" | "platform";

let lastChimeTime = 0;
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastChimeTime < 1000) return;
  lastChimeTime = now;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // browser auto-play policy guard
  }
}

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
  isDomainNotification?: boolean;
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

function formatDomainEventTitle(eventType: string): string {
  switch (eventType) {
    case "assignment.published":
      return "New Assignment Published";
    case "submission.graded":
      return "Assignment Evaluated & Graded";
    case "attendance.finalized":
      return "Daily Attendance Register Finalized";
    case "recording.published":
      return "Classroom Recording Available";
    default:
      return eventType
        .split(".")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
  }
}

function formatDomainEventMessage(item: any): string {
  switch (item.eventType) {
    case "assignment.published":
      return "A new class assignment has been published and is ready for submission.";
    case "submission.graded":
      return "Your submitted assignment has been reviewed, scored, and updated in your scorecard.";
    case "attendance.finalized":
      return "Daily period attendance register has been verified and committed to the school register.";
    case "recording.published":
      return "A new recorded session from your class has been processed and is ready to stream.";
    default:
      return "An academic system event occurred in your classroom.";
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
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UnifiedNotification | null>(null);
  const [toastItem, setToastItem] = useState<UnifiedNotification | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<any>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef<boolean>(true);
  const storageKey = `edops_notif_read_${role}_${organizationId || "global"}`;

  const readIdsRef = useRef<Set<string>>(readIds);
  useEffect(() => {
    readIdsRef.current = readIds;
  }, [readIds]);

  // Restore read IDs from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = new Set<string>(JSON.parse(saved));
        setReadIds(parsed);
        readIdsRef.current = parsed;
      }
    } catch {
      // ignore storage error
    }
  }, [storageKey]);

  // Persist read IDs to localStorage
  const saveReadIds = useCallback((newSet: Set<string>) => {
    setReadIds(newSet);
    readIdsRef.current = newSet;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
    } catch {
      // ignore storage error
    }
  }, [storageKey]);

  // Fetch real notifications directly from PostgreSQL backend database
  const fetchBackendNotifications = useCallback(async () => {
    if (role === "platform") {
      // Platform Administrator: load real platform audit logs and activities from PostgreSQL
      try {
        setLoading(true);
        const dash = await getPlatformDashboard().catch(() => null);
        const activities: any[] = dash?.recentActivities || [];
        const mapped: UnifiedNotification[] = activities.map((act: any) => ({
          id: String(act.id || `audit-${Math.random()}`),
          title: act.schoolName ? `${act.schoolName} Activity` : "Platform Event",
          message: `${act.action}: ${act.details ? (typeof act.details === "object" ? JSON.stringify(act.details) : String(act.details)) : "Logged by " + (act.actorEmail || "Administrator")}`,
          type: "system",
          priority: "normal",
          sender: act.actorEmail || "Platform Service",
          createdAt: act.createdAt || new Date().toISOString(),
          read: false,
          targetTab: "overview",
        }));
        setNotifications(mapped);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!organizationId) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);

      // Query database sources via backend APIs:
      // 1. school_broadcasts table via GET /organizations/:orgId/communication/notices
      // 2. notifications table via GET /organizations/:orgId/notifications?filter=all&limit=50
      const [noticesData, domainData] = await Promise.all([
        getCommunicationNotices(organizationId, { silent: true }).catch(() => []),
        api<any>(`/organizations/${organizationId}/notifications?filter=all&limit=50`, { silent: true }).catch(() => ({ items: [] })),
      ]);

      const items: UnifiedNotification[] = [];

      // Map broadcasts/notices from database
      if (Array.isArray(noticesData)) {
        noticesData.forEach((n: any) => {
          if (!n || !n.id) return;
          const isUrgent = n.priority === "urgent" || n.priority === "high";
          const titleLower = (n.title || "").toLowerCase();
          const isLeaveNotice = titleLower.includes("leave");

          let targetTab = role === "parent" ? "notices" : role === "principal" ? "alerts" : "communication";
          let targetSubTab: string | undefined = "broadcast";

          if (isLeaveNotice) {
            targetTab = "attendance";
            targetSubTab = role === "principal" ? "leaves" : "student_leaves";
          }

          items.push({
            id: String(n.id),
            title: n.title || "School Circular",
            message: n.message || "",
            type: isLeaveNotice || isUrgent ? "alert" : "announcement",
            priority: (n.priority || "normal") as any,
            sender: n.senderName || n.sentBy || "School Administration",
            createdAt: n.createdAt || new Date().toISOString(),
            read: Boolean(n.isRead),
            targetTab,
            targetSubTab,
            isDomainNotification: false,
          });
        });
      }

      // Map domain event notifications from database
      const domainItems: any[] = Array.isArray(domainData?.items) ? domainData.items : [];
      domainItems.forEach((d: any) => {
        if (!d || !d.id) return;
        const eventType = d.eventType || "";
        const isAcademic = eventType.startsWith("assignment") || eventType.startsWith("submission");
        const isAtt = eventType.startsWith("attendance");
        items.push({
          id: String(d.id),
          title: formatDomainEventTitle(eventType),
          message: formatDomainEventMessage(d),
          type: isAtt ? "attendance" : isAcademic ? "academic" : "system",
          priority: "normal",
          sender: "Academic Registry",
          createdAt: d.occurredAt || d.createdAt || new Date().toISOString(),
          read: Boolean(d.readAt),
          targetTab: isAtt ? "attendance" : isAcademic ? (role === "student" ? "academics" : "learning") : "dashboard",
          targetSubTab: isAcademic ? "assignments" : undefined,
          isDomainNotification: true,
        });
      });

      // Sort newest first by database creation date
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Sound & 2-Second In-Page Toast for newly arrived unread notifications
      const newUnreadItems = items.filter(
        (it) => !it.read && !readIdsRef.current.has(it.id) && !knownIdsRef.current.has(it.id)
      );

      if (!isInitialFetchRef.current && newUnreadItems.length > 0) {
        const newest = newUnreadItems[0];
        playNotificationSound();
        setToastItem(newest);

        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
          setToastItem(null);
        }, 2000);
      }

      // Update known IDs
      items.forEach((it) => knownIdsRef.current.add(it.id));
      isInitialFetchRef.current = false;

      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, role]);

  useEffect(() => {
    fetchBackendNotifications();

    // Poll for new notifications every 10 seconds
    const interval = setInterval(() => {
      fetchBackendNotifications();
    }, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchBackendNotifications();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [fetchBackendNotifications]);

  // Combine with persistent read state
  const resolvedNotifications: UnifiedNotification[] = useMemo(() => {
    return notifications.map((n) => ({
      ...n,
      read: n.read || readIds.has(n.id),
    }));
  }, [notifications, readIds]);

  const unreadCount = useMemo(() => {
    return resolvedNotifications.filter((n) => !n.read).length;
  }, [resolvedNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return resolvedNotifications.filter((n) => !n.read);
    }
    if (filter === "alerts") {
      return resolvedNotifications.filter(
        (n) => n.priority === "urgent" || n.priority === "high" || n.type === "alert"
      );
    }
    return resolvedNotifications;
  }, [resolvedNotifications, filter]);

  // Close on outside click or Escape key
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

  // Mark all notifications as read in client & backend database permanently
  const markAllRead = async () => {
    const next = new Set(readIds);
    resolvedNotifications.forEach((n) => next.add(n.id));
    saveReadIds(next);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // Persist permanently in PostgreSQL for both notices and domain events
    if (organizationId) {
      Promise.all([
        api(`/organizations/${organizationId}/communication/notices/read-all`, {
          method: "PATCH",
          body: {},
        }).catch(() => {}),
        api(`/organizations/${organizationId}/notifications/read-all`, {
          method: "PATCH",
          body: {},
        }).catch(() => {}),
      ]);
    }
  };

  // Mark a single notification as read in client & backend database permanently
  const markItemRead = async (item: UnifiedNotification) => {
    const next = new Set(readIds);
    next.add(item.id);
    saveReadIds(next);
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );

    // Persist permanently in PostgreSQL
    if (organizationId) {
      if (item.isDomainNotification) {
        api(`/organizations/${organizationId}/notifications/${item.id}/read`, {
          method: "PATCH",
          body: {},
        }).catch(() => {});
      } else {
        api(`/organizations/${organizationId}/communication/notices/${item.id}/read`, {
          method: "PATCH",
          body: {},
        }).catch(() => {});
      }
    }
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

  const canPostNotices = role === "school_admin" || role === "principal" || role === "teacher";

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
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            fetchBackendNotifications();
          }
        }}
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
                  {loading
                    ? "Syncing from database..."
                    : unreadCount > 0
                    ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                    : "All updates caught up"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={fetchBackendNotifications}
                style={{
                  all: "unset",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "24px",
                  borderRadius: "5px",
                  color: "#64748b",
                  cursor: "pointer",
                  background: "#f1f5f9",
                }}
                title="Refresh notifications from database"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>

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
                  title="Mark all as read in database"
                >
                  <Check size={12} strokeWidth={2.5} /> Mark read
                </button>
              )}
            </div>
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
                { id: "all", label: `All (${resolvedNotifications.length})` },
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
            {loading && notifications.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                <span style={{ fontSize: "12px", fontWeight: 500 }}>Connecting to database...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
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
                <p style={{ margin: "4px 0 12px", fontSize: "11.5px", color: "#64748b", lineHeight: 1.4 }}>
                  There are no circulars, notices or updates in the database for your role.
                </p>
                {canPostNotices && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (onNavigate) {
                        onNavigate(role === "principal" ? "communication" : "communication", "broadcast");
                      }
                    }}
                    style={{
                      all: "unset",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "#0c1e33",
                      color: "#ffffff",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={13} /> Post Notice to Database
                  </button>
                )}
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
                        {!item.read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markItemRead(item);
                            }}
                            title="Mark as read"
                            style={{
                              marginLeft: "auto",
                              background: "#f1f5f9",
                              border: "none",
                              cursor: "pointer",
                              color: "#475569",
                              fontSize: "10.5px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              padding: "2px 7px",
                              borderRadius: "4px",
                            }}
                          >
                            <Check size={11} strokeWidth={2.5} /> Mark read
                          </button>
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

      {/* 2-Second In-Page Floating Notification Toast Popup */}
      {toastItem && (
        <div
          role="status"
          aria-live="polite"
          onClick={() => {
            if (toastItem.targetTab && onNavigate) {
              onNavigate(toastItem.targetTab, toastItem.targetSubTab);
            }
            setToastItem(null);
          }}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 999999,
            background: "#0c1e33",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "10px",
            boxShadow: "0 12px 30px rgba(12, 30, 51, 0.45), 0 2px 6px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            maxWidth: "380px",
            cursor: toastItem.targetTab ? "pointer" : "default",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            backdropFilter: "blur(6px)",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(56, 189, 248, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bell size={18} color="#38bdf8" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {toastItem.title}
              </span>
              <span style={{ fontSize: "10px", color: "#94a3b8", flexShrink: 0 }}>
                Just now
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "11.5px",
                color: "#cbd5e1",
                lineHeight: 1.35,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {toastItem.message}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setToastItem(null);
            }}
            aria-label="Close notification"
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
