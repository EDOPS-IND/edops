"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MessageSquare,
  Send,
  Search,
  User,
  Users,
  Plus,
  X,
  ArrowLeft,
  CheckCheck,
  Clock,
  Sparkles,
  Filter,
  ShieldCheck,
  UserCheck,
  CornerDownLeft,
} from "lucide-react";
import {
  getCommunicationConversation,
  getCommunicationConversations,
  getCommunicationRecipients,
  markCommunicationRead,
  openCommunicationStream,
  sendCommunicationMessage,
} from "../edops-api";

export type Conversation = {
  conversationId: string;
  participantId: string;
  participantName?: string;
  participantEmail?: string;
  participantRole?: string;
  subject?: string;
  preview?: string;
  unreadCount?: number;
  lastMessageAt?: string;
};

export type Recipient = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

export type Message = {
  id: string;
  senderId: string;
  senderName?: string;
  body: string;
  createdAt?: string;
};

const filterTabs = [
  { id: "all", label: "All" },
  { id: "teacher", label: "Teachers" },
  { id: "student", label: "Students" },
  { id: "parent", label: "Parents" },
  { id: "principal", label: "Principal" },
  { id: "staff", label: "Staff" },
];

export const getRoleMeta = (role?: string) => {
  const normalized = (role || "").toLowerCase();
  switch (normalized) {
    case "teacher":
      return { label: "Teacher", bg: "#d0e6ff", text: "#0a3a7a", border: "#b8d8ff" };
    case "student":
      return { label: "Student", bg: "#e1d2ff", text: "#4a0e8f", border: "#ceb8ff" };
    case "parent":
      return { label: "Parent", bg: "#d9eed1", text: "#1a5c0a", border: "#bfe3b4" };
    case "principal":
      return { label: "Principal", bg: "#fde1ac", text: "#7a4a00", border: "#f5cd82" };
    case "school_admin":
    case "admin":
      return { label: "Admin", bg: "#fde1ac", text: "#7a4a00", border: "#f5cd82" };
    default:
      return { label: "Staff", bg: "#f1f4f8", text: "#334155", border: "#e2e8f0" };
  }
};

export const getInitials = (name?: string) => {
  if (!name || !name.trim()) return "•";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const formatSidebarTime = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const formatMessageTime = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const formatDividerDate = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
};

export function CommunicationChat({
  organizationId,
  title = "Direct Messages",
  onComposeBroadcast,
}: {
  organizationId: string;
  title?: string;
  onComposeBroadcast?: () => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [directoryPeople, setDirectoryPeople] = useState<Recipient[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [body, setBody] = useState("");
  const [draftRecipient, setDraftRecipient] = useState<Recipient | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const peopleRequest = useRef(0);
  const selectedIdRef = useRef("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const followMessages = useRef(true);
  const lastConversation = useRef("");

  const selected = useMemo(
    () => conversations.find((item) => item.conversationId === selectedId),
    [conversations, selectedId]
  );
  const activeRecipient: any = selected || draftRecipient;

  const loadConversations = useCallback(async () => {
    try {
      const rows = await getCommunicationConversations(organizationId);
      const safeRows = Array.isArray(rows) ? rows : [];
      setConversations(safeRows);
      setSelectedId((current) => current || safeRows[0]?.conversationId || "");
      return safeRows;
    } catch {
      setConversations([]);
      return [];
    }
  }, [organizationId]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Load conversations on mount & listen to real-time events
  useEffect(() => {
    loadConversations()
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));

    const dispose = openCommunicationStream(organizationId, (event) => {
      void loadConversations();
      if (event.conversationId && event.conversationId === selectedIdRef.current) {
        void getCommunicationConversation(organizationId, event.conversationId)
          .then((refreshed) => {
            if (event.conversationId === selectedIdRef.current) {
              setMessages(Array.isArray(refreshed) ? refreshed : []);
            }
          })
          .catch(() => undefined);
      }
    });
    return dispose;
  }, [organizationId, loadConversations]);

  // Load active conversation messages with stale response cancellation
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    let isCurrent = true;
    setMessagesLoading(true);
    // Clear stale messages immediately so old conversation messages never bleed through
    setMessages([]);

    getCommunicationConversation(organizationId, selectedId)
      .then((data) => {
        if (isCurrent) {
          setMessages(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isCurrent) setMessages([]);
      })
      .finally(() => {
        if (isCurrent) setMessagesLoading(false);
      });

    void markCommunicationRead(organizationId, selectedId).then(() => {
      if (isCurrent) {
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === selectedId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [organizationId, selectedId]);

  // Auto-scroll on new messages
  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    const frame = requestAnimationFrame(() => {
      const conversationChanged = lastConversation.current !== selectedId;
      lastConversation.current = selectedId;
      if (conversationChanged || followMessages.current) {
        list.scrollTo({ top: list.scrollHeight, behavior: conversationChanged ? "auto" : "smooth" });
        setHasNewMessages(false);
      } else if (messages.length) {
        setHasNewMessages(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, messages]);

  // Search school directory when searching or directory modal is open
  useEffect(() => {
    if (!searchQuery.trim() && !isDirectoryOpen) {
      setDirectoryPeople([]);
      setDirectoryLoading(false);
      return;
    }
    const requestId = ++peopleRequest.current;
    const timer = setTimeout(() => {
      setDirectoryLoading(true);
      const roleQuery = activeFilter === "all" ? undefined : activeFilter;
      void getCommunicationRecipients(organizationId, roleQuery, searchQuery.trim())
        .then((data) => {
          if (requestId === peopleRequest.current) {
            setDirectoryPeople(Array.isArray(data) ? data : []);
          }
        })
        .catch(() => {
          if (requestId === peopleRequest.current) setDirectoryPeople([]);
        })
        .finally(() => {
          if (requestId === peopleRequest.current) setDirectoryLoading(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [organizationId, searchQuery, activeFilter, isDirectoryOpen]);

  // Auto-adjust textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [body]);

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRecipient || !body.trim() || sending) return;

    const recipientId = selected?.participantId || draftRecipient?.id || "";
    const recipientRole = (selected?.participantRole || draftRecipient?.role || activeRecipient?.role || activeRecipient?.participantRole || "") as "school_admin" | "principal" | "teacher" | "student" | "parent" | "staff";
    if (!recipientId || !recipientRole) return;

    const conversationId = selected?.conversationId;
    const messageContent = body.trim();
    const dynamicSubject = selected?.subject || `Direct message with ${activeRecipient.participantName || activeRecipient.name || activeRecipient.participantEmail || activeRecipient.email || "Member"}`;

    setSending(true);
    followMessages.current = true;

    try {
      await sendCommunicationMessage(organizationId, {
        recipientId,
        recipientRole,
        subject: dynamicSubject,
        body: messageContent,
        ...(conversationId ? { conversationId } : {}),
      });

      setBody("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      if (conversationId) {
        const refreshed = await getCommunicationConversation(organizationId, conversationId);
        if (selectedIdRef.current === conversationId) {
          setMessages(Array.isArray(refreshed) ? refreshed : []);
        }
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === conversationId
              ? { ...c, preview: messageContent, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      } else {
        const rows = await loadConversations();
        const created = rows.find((item: Conversation) => item.participantId === recipientId);
        setDraftRecipient(null);
        if (created) {
          setSelectedId(created.conversationId);
          const updated = await getCommunicationConversation(organizationId, created.conversationId);
          setMessages(Array.isArray(updated) ? updated : []);
        }
      }
    } catch {
      // The shared API error banner will catch and present any operational failure
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const openPerson = (person: Recipient) => {
    const existing = conversations.find((item) => item.participantId === person.id);
    if (existing) {
      setDraftRecipient(null);
      setSelectedId(existing.conversationId);
    } else {
      setSelectedId("");
      setDraftRecipient(person);
    }
    setSearchQuery("");
    setIsDirectoryOpen(false);
  };

  // Filter conversations in real-time
  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      // Role filter
      if (activeFilter !== "all") {
        const role = (item.participantRole || "").toLowerCase();
        if (activeFilter === "principal" && role !== "principal") return false;
        if (activeFilter === "teacher" && role !== "teacher") return false;
        if (activeFilter === "student" && role !== "student") return false;
        if (activeFilter === "parent" && role !== "parent") return false;
        if (activeFilter === "staff" && (role === "teacher" || role === "student" || role === "parent" || role === "principal")) return false;
      }
      // Text query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = (item.participantName || "").toLowerCase().includes(query);
        const emailMatch = (item.participantEmail || "").toLowerCase().includes(query);
        const previewMatch = (item.preview || "").toLowerCase().includes(query);
        const subjectMatch = (item.subject || "").toLowerCase().includes(query);
        return nameMatch || emailMatch || previewMatch || subjectMatch;
      }
      return true;
    });
  }, [conversations, activeFilter, searchQuery]);

  // Group messages by date and sender (with message ID deduplication)
  const groupedMessageList = useMemo(() => {
    const seen = new Set<string>();
    const uniqueMessages = messages.filter((m) => {
      if (!m.id) return true;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    const groups: { dateLabel: string; items: { message: Message; isOutgoing: boolean; isGrouped: boolean }[] }[] = [];
    let currentDateLabel = "";
    let currentGroup: { message: Message; isOutgoing: boolean; isGrouped: boolean }[] = [];

    uniqueMessages.forEach((msg, idx) => {
      const isOutgoing = Boolean(selected && msg.senderId !== selected.participantId);
      const dateLabel = formatDividerDate(msg.createdAt);

      if (dateLabel !== currentDateLabel) {
        if (currentGroup.length > 0) {
          groups.push({ dateLabel: currentDateLabel, items: currentGroup });
        }
        currentDateLabel = dateLabel;
        currentGroup = [];
      }

      const prevMsg = idx > 0 ? uniqueMessages[idx - 1] : null;
      let isGrouped = false;
      if (prevMsg && prevMsg.senderId === msg.senderId && formatDividerDate(prevMsg.createdAt) === dateLabel) {
        const prevTime = prevMsg.createdAt ? new Date(prevMsg.createdAt).getTime() : 0;
        const thisTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
        if (Math.abs(thisTime - prevTime) < 5 * 60 * 1000) {
          isGrouped = true;
        }
      }

      currentGroup.push({ message: msg, isOutgoing, isGrouped });
    });

    if (currentGroup.length > 0) {
      groups.push({ dateLabel: currentDateLabel, items: currentGroup });
    }

    return groups;
  }, [messages, selected]);

  return (
    <section className={`edops-chat-shell${activeRecipient ? " has-active-chat" : ""}`}>
      <style>{`
        .edops-chat-shell {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          height: calc(100vh - 180px);
          min-height: 580px;
          max-height: 880px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 4px 18px rgba(12, 30, 51, 0.05);
          overflow: hidden;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
        }
        .edops-chat-sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-width: 0;
          border-right: 1px solid #e4e6e9;
          background: #ffffff;
        }
        .edops-chat-main {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-width: 0;
          background: #f8fafc;
        }
        .edops-chat-item {
          width: 100%;
          text-align: left;
          background: #ffffff;
          border: 0;
          border-bottom: 1px solid #f1f5f9;
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.15s ease, border-color 0.15s ease;
          position: relative;
        }
        .edops-chat-item:hover {
          background: #f8fafc;
        }
        .edops-chat-item.is-selected {
          background: #f0f4f9;
          border-left: 3.5px solid #0c1e33;
          padding-left: 12.5px;
        }
        .edops-chat-item:focus-visible {
          outline: 2px solid #0c1e33;
          outline-offset: -2px;
        }
        .edops-chat-filter-chip {
          border: 1px solid transparent;
          border-radius: 16px;
          padding: 5px 12px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          background: #f1f4f8;
          color: #495d72;
          transition: all 0.15s ease;
        }
        .edops-chat-filter-chip:hover {
          background: #e2e8f0;
          color: #0c1e33;
        }
        .edops-chat-filter-chip.active {
          background: #0c1e33;
          color: #ffffff;
        }
        .edops-chat-composer-box {
          border-top: 1px solid #e4e6e9;
          background: #ffffff;
          padding: 12px 18px 14px;
        }
        .edops-chat-textarea {
          width: 100%;
          min-height: 44px;
          max-height: 120px;
          padding: 10px 14px;
          border: 1px solid #ced8e5;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.45;
          color: #0c1e33;
          background: #ffffff;
          resize: none;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }
        .edops-chat-textarea:focus {
          border-color: #0c1e33;
          box-shadow: 0 0 0 3px rgba(12, 30, 51, 0.08);
        }
        .edops-chat-mobile-back-btn {
          display: none;
        }
        .edops-chat-new-pill {
          position: absolute;
          z-index: 10;
          left: 50%;
          bottom: 84px;
          transform: translateX(-50%);
          border: 0;
          border-radius: 20px;
          padding: 8px 16px;
          background: #0c1e33;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(12, 30, 51, 0.25);
          cursor: pointer;
          animation: edopsBounce 0.3s ease;
        }
        @keyframes edopsBounce {
          0% { transform: translate(-50%, 10px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        @media (max-width: 900px) {
          .edops-chat-shell {
            grid-template-columns: 310px minmax(0, 1fr);
          }
        }
        @media (max-width: 720px) {
          .edops-chat-shell {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 150px);
            max-height: none;
          }
          .edops-chat-sidebar {
            display: flex;
            width: 100%;
            height: 100%;
          }
          .edops-chat-main {
            display: none;
            width: 100%;
            height: 100%;
          }
          .edops-chat-shell.has-active-chat .edops-chat-sidebar {
            display: none;
          }
          .edops-chat-shell.has-active-chat .edops-chat-main {
            display: flex;
          }
          .edops-chat-mobile-back-btn {
            display: inline-flex !important;
          }
        }
      `}</style>

      {/* ── SIDEBAR: CONVERSATION HUB ── */}
      <aside className="edops-chat-sidebar">
        {/* Sidebar Header */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #e4e6e9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={18} color="#0c1e33" />
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0c1e33", letterSpacing: "-0.01em" }}>
                {title}
              </h2>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
              {conversations.length} conversation{conversations.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsDirectoryOpen(!isDirectoryOpen);
              if (!isDirectoryOpen) setSearchQuery("");
            }}
            title="Start new conversation"
            aria-label="Start new conversation"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 12px",
              background: isDirectoryOpen ? "#f1f5f9" : "#0c1e33",
              color: isDirectoryOpen ? "#0c1e33" : "#ffffff",
              border: isDirectoryOpen ? "1px solid #cbd5e1" : "none",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {isDirectoryOpen ? <X size={14} /> : <Plus size={14} />}
            <span>{isDirectoryOpen ? "Cancel" : "New Chat"}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "12px 16px 8px" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: "#f8fafc",
              border: "1px solid #ced8e5",
              borderRadius: "8px",
              padding: "0 10px",
              transition: "border-color 0.15s ease",
            }}
          >
            <Search size={14} color="#64748b" style={{ flexShrink: 0 }} />
            <input
              name="chat-search"
              type="text"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isDirectoryOpen ? "Search member directory..." : "Search conversations..."}
              aria-label="Search conversations or members"
              style={{
                width: "100%",
                padding: "8px 8px",
                border: "none",
                background: "transparent",
                fontSize: "12.5px",
                color: "#0c1e33",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                style={{
                  border: 0,
                  background: "transparent",
                  padding: 2,
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Role Filters */}
        <div
          role="tablist"
          aria-label="Filter conversations by role"
          style={{
            display: "flex",
            gap: "5px",
            overflowX: "auto",
            padding: "4px 16px 10px",
            scrollbarWidth: "none",
          }}
        >
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`edops-chat-filter-chip${active ? " active" : ""}`}
                onClick={() => setActiveFilter(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Conversation List / Directory Results */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {isDirectoryOpen || searchQuery.trim() ? (
            /* Directory Search Results */
            <div>
              <div
                style={{
                  padding: "8px 16px",
                  background: "#f1f5f9",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  School Directory
                </span>
                {directoryLoading && <span style={{ fontSize: "11px", color: "#64748b" }}>Searching…</span>}
              </div>

              {directoryLoading ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#64748b", fontSize: "12.5px" }}>
                  Loading school members…
                </div>
              ) : directoryPeople.length > 0 ? (
                directoryPeople.map((person) => {
                  const roleMeta = getRoleMeta(person.role);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => openPerson(person)}
                      className="edops-chat-item"
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: roleMeta.bg,
                          color: roleMeta.text,
                          display: "grid",
                          placeItems: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          flexShrink: 0,
                          border: `1px solid ${roleMeta.border}`,
                        }}
                      >
                        {getInitials(person.name || person.email)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0c1e33", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {person.name || person.email}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: roleMeta.bg,
                              color: roleMeta.text,
                              flexShrink: 0,
                            }}
                          >
                            {roleMeta.label}
                          </span>
                        </div>
                        <span style={{ display: "block", fontSize: "11px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                          {person.email}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div style={{ padding: "36px 16px", textAlign: "center", color: "#64748b" }}>
                  <Users size={28} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                    No members found
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "11.5px" }}>
                    Try adjusting your search query or role filter.
                  </p>
                </div>
              )}
            </div>
          ) : loading ? (
            /* Loading Conversations Skeleton */
            <div style={{ padding: "16px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#f1f5f9" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: "12px", width: "55%", background: "#f1f5f9", borderRadius: "4px", marginBottom: "6px" }} />
                    <div style={{ height: "10px", width: "80%", background: "#f8fafc", borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length > 0 ? (
            /* Active Conversations List */
            filteredConversations.map((item) => {
              const isSelected = item.conversationId === selectedId;
              const roleMeta = getRoleMeta(item.participantRole);
              return (
                <button
                  key={item.conversationId}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.conversationId);
                    setDraftRecipient(null);
                  }}
                  className={`edops-chat-item${isSelected ? " is-selected" : ""}`}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: isSelected ? roleMeta.bg : "#f1f5f9",
                      color: isSelected ? roleMeta.text : "#0c1e33",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      flexShrink: 0,
                      border: `1px solid ${isSelected ? roleMeta.border : "#e2e8f0"}`,
                    }}
                  >
                    {getInitials(item.participantName || item.participantEmail)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: isSelected || item.unreadCount ? 700 : 600,
                          color: "#0c1e33",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.participantName || item.participantEmail || "School member"}
                      </span>
                      <span style={{ fontSize: "10.5px", color: isSelected ? "#0c1e33" : "#64748b", fontWeight: 500, flexShrink: 0 }}>
                        {formatSidebarTime(item.lastMessageAt)}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "3px" }}>
                      <span
                        style={{
                          fontSize: "11.5px",
                          color: item.unreadCount ? "#0c1e33" : "#64748b",
                          fontWeight: item.unreadCount ? 600 : 400,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          flex: 1,
                        }}
                      >
                        {item.preview || item.subject || "Direct message"}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: "9.5px",
                            fontWeight: 600,
                            padding: "1px 5px",
                            borderRadius: "4px",
                            background: roleMeta.bg,
                            color: roleMeta.text,
                          }}
                        >
                          {roleMeta.label}
                        </span>
                        {Boolean(item.unreadCount && item.unreadCount > 0) && (
                          <span
                            className="edops-unread-badge"
                            aria-label={`${item.unreadCount} unread messages`}
                            style={{
                              minWidth: "18px",
                              height: "18px",
                              padding: "0 6px",
                              borderRadius: "9px",
                              background: "#0c1e33",
                              color: "#ffffff",
                              fontSize: "10.5px",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: 1,
                            }}
                          >
                            {item.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            /* Empty Conversations State */
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <img
                src={searchQuery ? "/noresult.png" : "/bee.png"}
                alt=""
                style={{ width: searchQuery ? "90px" : "64px", height: "auto", margin: "0 auto 12px", opacity: 0.95, display: "block" }}
              />
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                {searchQuery ? "No matching conversations" : "No conversations yet"}
              </p>
              <p style={{ margin: "6px 0 16px", fontSize: "11.5px", lineHeight: 1.5 }}>
                {searchQuery
                  ? "Try checking the member directory below."
                  : "Start direct conversations with teachers, parents, and students."}
              </p>
              <button
                type="button"
                onClick={() => setIsDirectoryOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  background: "#0c1e33",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Plus size={13} />
                <span>Search Directory</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CHAT AREA ── */}
      <main className="edops-chat-main">
        {/* Chat Header */}
        <header
          style={{
            minHeight: "68px",
            padding: "12px 20px",
            borderBottom: "1px solid #e4e6e9",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            {/* Mobile Back Button */}
            <button
              className="edops-chat-mobile-back-btn"
              type="button"
              onClick={() => {
                setSelectedId("");
                setDraftRecipient(null);
              }}
              aria-label="Back to conversations list"
              style={{
                display: "none",
                alignItems: "center",
                gap: "4px",
                border: "1px solid #ced8e5",
                borderRadius: "6px",
                background: "#ffffff",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#0c1e33",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} />
              <span>Messages</span>
            </button>

            {activeRecipient && (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: getRoleMeta(activeRecipient.participantRole || activeRecipient.role).bg,
                  color: getRoleMeta(activeRecipient.participantRole || activeRecipient.role).text,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  flexShrink: 0,
                  border: `1px solid ${getRoleMeta(activeRecipient.participantRole || activeRecipient.role).border}`,
                }}
              >
                {getInitials(
                  activeRecipient.participantName ||
                    activeRecipient.name ||
                    activeRecipient.participantEmail ||
                    activeRecipient.email
                )}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "14.5px",
                    fontWeight: 700,
                    color: "#0c1e33",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activeRecipient
                    ? activeRecipient.participantName ||
                      activeRecipient.name ||
                      activeRecipient.participantEmail ||
                      activeRecipient.email
                    : "No conversation selected"}
                </h3>

                {activeRecipient && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: "4px",
                      background: getRoleMeta(activeRecipient.participantRole || activeRecipient.role).bg,
                      color: getRoleMeta(activeRecipient.participantRole || activeRecipient.role).text,
                      flexShrink: 0,
                    }}
                  >
                    {getRoleMeta(activeRecipient.participantRole || activeRecipient.role).label}
                  </span>
                )}
              </div>

              {activeRecipient ? (
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeRecipient.participantEmail || activeRecipient.email} · {selected ? "Active Direct Conversation" : "New Conversation"}
                </p>
              ) : (
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                  Choose a contact from the left sidebar to start chatting
                </p>
              )}
            </div>
          </div>

          {onComposeBroadcast && (
            <button
              type="button"
              onClick={onComposeBroadcast}
              style={{
                flexShrink: 0,
                border: "none",
                borderRadius: "8px",
                background: "#0c1e33",
                color: "#ffffff",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "opacity 0.15s ease",
              }}
            >
              <span>Broadcast Notice</span>
            </button>
          )}
        </header>

        {/* Message Log & Stream */}
        <div
          ref={messageListRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          onScroll={(event) => {
            const list = event.currentTarget;
            followMessages.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
            if (followMessages.current) setHasNewMessages(false);
          }}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            background: "#f8fafc",
          }}
        >
          {!activeRecipient ? (
            /* Empty State: No Conversation Selected */
            <div style={{ margin: "auto", textAlign: "center", maxWidth: "380px", padding: "40px 20px" }}>
              <img
                src="/bee.png"
                alt=""
                style={{
                  width: "90px",
                  height: "auto",
                  maxHeight: "90px",
                  objectFit: "contain",
                  margin: "0 auto 16px",
                  display: "block",
                  opacity: 0.95,
                }}
              />
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0c1e33" }}>
                Direct Messages Desk
              </h3>
              <p style={{ margin: "8px 0 20px", fontSize: "12.5px", color: "#64748b", lineHeight: 1.6 }}>
                Select an existing conversation from the list or start a new thread with teachers, parents, and administrative staff.
              </p>
              <button
                type="button"
                onClick={() => setIsDirectoryOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  background: "#0c1e33",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(12, 30, 51, 0.15)",
                }}
              >
                <Plus size={14} />
                <span>Start New Conversation</span>
              </button>
            </div>
          ) : messagesLoading ? (
            /* Loading State */
            <div style={{ margin: "auto", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
              Loading conversation messages…
            </div>
          ) : selected && messages.length > 0 ? (
            /* Message Bubbles Grouped by Date */
            groupedMessageList.map((group, groupIdx) => (
              <div key={groupIdx} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Date Divider Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "8px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 600,
                      color: "#64748b",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      background: "#edf2f7",
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                    }}
                  >
                    {group.dateLabel}
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                </div>

                {/* Message Bubbles */}
                {group.items.map(({ message, isOutgoing, isGrouped }) => (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignSelf: isOutgoing ? "flex-end" : "flex-start",
                      maxWidth: "min(75%, 580px)",
                      marginTop: isGrouped ? "-6px" : "2px",
                    }}
                  >
                    {!isGrouped && !isOutgoing && (
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px", marginLeft: "4px" }}>
                        {message.senderName || activeRecipient.participantName || "School member"}
                      </span>
                    )}

                    <div
                      style={{
                        padding: "10px 15px",
                        borderRadius: isOutgoing
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        background: isOutgoing ? "#0c1e33" : "#ffffff",
                        color: isOutgoing ? "#ffffff" : "#0c1e33",
                        border: isOutgoing ? "1px solid #0c1e33" : "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px rgba(12, 30, 51, 0.04)",
                        wordBreak: "break-word",
                      }}
                    >
                      <div style={{ whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: 1.55 }}>
                        {message.body}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "4px",
                          marginTop: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            color: isOutgoing ? "rgba(255, 255, 255, 0.7)" : "#94a3b8",
                          }}
                        >
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isOutgoing && (
                          <CheckCheck size={13} color="rgba(255, 255, 255, 0.85)" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            /* First Message Greeting State */
            <div style={{ margin: "auto", textAlign: "center", maxWidth: "360px", padding: "40px 20px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: getRoleMeta(activeRecipient.participantRole || activeRecipient.role).bg,
                  color: getRoleMeta(activeRecipient.participantRole || activeRecipient.role).text,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  margin: "0 auto 12px",
                  border: `2px solid ${getRoleMeta(activeRecipient.participantRole || activeRecipient.role).border}`,
                }}
              >
                {getInitials(activeRecipient.participantName || activeRecipient.name || activeRecipient.participantEmail || activeRecipient.email)}
              </div>
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#0c1e33" }}>
                Start a conversation with {activeRecipient.participantName || activeRecipient.name || activeRecipient.participantEmail || activeRecipient.email}
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                Type your message below and press Enter to initiate this direct message thread.
              </p>
            </div>
          )}
        </div>

        {/* Floating New Messages Alert Pill */}
        {hasNewMessages && (
          <button
            className="edops-chat-new-pill"
            type="button"
            onClick={() => {
              const list = messageListRef.current;
              followMessages.current = true;
              if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
              setHasNewMessages(false);
            }}
          >
            <span>New messages ↓</span>
          </button>
        )}

        {/* ── MESSAGE COMPOSER ── */}
        <form
          className="edops-chat-composer-box"
          onSubmit={handleSendMessage}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              rows={1}
              disabled={!activeRecipient || sending}
              aria-label="Write direct message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeRecipient
                  ? `Write a message to ${activeRecipient.participantName || activeRecipient.name || "school member"}…`
                  : "Select a recipient first to compose message"
              }
              className="edops-chat-textarea"
            />

            <button
              disabled={!activeRecipient || !body.trim() || sending}
              type="submit"
              aria-label="Send message"
              style={{
                height: "44px",
                padding: "0 18px",
                borderRadius: "8px",
                background: "#0c1e33",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: activeRecipient && body.trim() && !sending ? "pointer" : "not-allowed",
                opacity: activeRecipient && body.trim() && !sending ? 1 : 0.5,
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              {sending ? (
                <span>Sending…</span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
            <small style={{ fontSize: "11px", color: "#94a3b8" }}>
              Press <strong>Enter ↵</strong> to send · <strong>Shift + Enter</strong> for new line
            </small>
            {Boolean(body.length > 200) && (
              <small style={{ fontSize: "10.5px", color: "#64748b" }}>
                {body.length} characters
              </small>
            )}
          </div>
        </form>
      </main>
    </section>
  );
}
