"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Users,
  Search,
  Plus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Mail,
  User,
  Paperclip,
  Check,
  ChevronRight,
  X,
  Award,
  Bell,
  ArrowLeft,
} from "lucide-react";
import {
  getTeacherCommunicationInbox,
  getTeacherConversationThread,
  sendTeacherChatMessage,
  startTeacherConversation,
} from "../../edops-api";
import { CommunicationChat } from "../../components/communication-chat";

const T = {
  navy: "#0c1e33",
  slate: "#495d72",
  muted: "#a6abb5",
  faint: "#b3b3b3",
  pageBg: "#f4f6f7",
  white: "#ffffff",
  border: "#e4e6e9",
  line: "#ced8e5",
  chip: "#f5f6f8",
  blue: "#17a1fa",
  greenBg: "#ccefbf",
  greenDark: "#1a5c0a",
  skyBg: "#d0e6ff",
  skyDark: "#0a3a7a",
  amberBg: "#fde1ac",
  amberDark: "#614400",
  roseBg: "#ffd6d6",
  roseDark: "#7a1a1a",
  violetBg: "#e1d2ff",
  violetDark: "#4a0e8f",
};

interface CommunicationPaneProps {
  organizationId: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export function CommunicationPane({
  organizationId,
  initialTab,
  onTabChange,
}: CommunicationPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "students" | "parents" | "principal" | "school_admin">(
    initialTab && ["all", "students", "parents", "principal", "school_admin"].includes(initialTab)
      ? (initialTab as any)
      : "all"
  );

  useEffect(() => {
    if (initialTab && ["all", "students", "parents", "principal", "school_admin"].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Compose Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeChannel, setComposeChannel] = useState<"students" | "parents" | "principal" | "school_admin">("parents");
  const [composeRecipientId, setComposeRecipientId] = useState<string>("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  useEffect(() => {
    loadInbox();
  }, [organizationId]);

  useEffect(() => {
    if (selectedThreadId) {
      loadThread(selectedThreadId);
    }
  }, [selectedThreadId]);

  async function loadInbox() {
    setLoading(true);
    try {
      const res = await getTeacherCommunicationInbox(organizationId);
      setData(res);
      if (res?.threads?.length > 0 && !selectedThreadId) {
        setSelectedThreadId(res.threads[0].id);
      }
    } catch {
      setData({ threads: [], directory: {} });
    } finally {
      setLoading(false);
    }
  }

  async function loadThread(threadId: string) {
    setThreadLoading(true);
    try {
      const res = await getTeacherConversationThread(organizationId, threadId);
      setActiveThread(res);
    } catch {
      setActiveThread(null);
    } finally {
      setThreadLoading(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedThreadId) return;

    setIsSending(true);
    try {
      await sendTeacherChatMessage(organizationId, selectedThreadId, replyMessage);
      setReplyMessage("");
      await loadThread(selectedThreadId);
      await loadInbox();
    } catch {
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim() || !composeBody.trim()) return;

    setIsSubmittingNew(true);
    try {
      const res = await startTeacherConversation(organizationId, {
        channel: composeChannel,
        recipientId: composeRecipientId || undefined,
        subject: composeSubject,
        body: composeBody,
      });
      setShowComposeModal(false);
      setComposeSubject("");
      setComposeBody("");
      await loadInbox();
      if (res?.thread?.id) {
        setSelectedThreadId(res.thread.id);
      }
    } catch {
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const threads = data?.threads || [];

  const filteredThreads = threads.filter((th: any) => {
    if (activeTab !== "all" && th.channel !== activeTab) return false;
    if (
      searchQuery &&
      !th.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !th.subject?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !th.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const parentThreads = threads.filter((t: any) => t.channel === "parents").length;
  const studentThreads = threads.filter((t: any) => t.channel === "students").length;
  const adminThreads = threads.filter((t: any) => t.channel === "principal" || t.channel === "school_admin").length;

  return <CommunicationChat organizationId={organizationId} title="Direct Messages" />;

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: T.slate, fontFamily: "'Poppins', sans-serif" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            border: `3px solid ${T.line}`,
            borderTopColor: T.navy,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: "13px", fontWeight: 600, color: T.slate, margin: 0 }}>
          Loading academic inbox &amp; directives...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header Row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: T.slate,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Communication &amp; Messages
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              color: T.navy,
              letterSpacing: "-0.01em",
            }}
          >
            Academic Inbox &amp; Directives Desk
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.slate, lineHeight: 1.5 }}>
            Coordinated communication channels across parents, enrolled students, school administration, and faculty.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowComposeModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: T.navy,
            color: T.white,
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
          }}
        >
          <Plus size={14} />
          <span>New Conversation</span>
        </button>
      </div>

      {/* 2. Top 4 Metric Cards - Strict DESIGN.md Section 2.1 Palettes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Total Conversations (Pastel Sky) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.skyBg,
            border: `1px solid ${T.skyBg}`,
            borderRadius: "10px",
            color: T.skyDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Threads
            </span>
            <MessageSquare size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.skyDark }}>
            {threads.length}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.skyDark }}>
            Active conversations in inbox
          </p>
        </div>

        {/* Parent Inquiries (Pastel Mint) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.greenBg,
            border: `1px solid ${T.greenBg}`,
            borderRadius: "10px",
            color: T.greenDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Parent Queries
            </span>
            <Users size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.greenDark }}>
            {parentThreads}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.greenDark }}>
            Guardian updates &amp; feedback
          </p>
        </div>

        {/* Student Inquiries (Pastel Violet) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.violetBg,
            border: `1px solid ${T.violetBg}`,
            borderRadius: "10px",
            color: T.violetDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Student Inquiries
            </span>
            <Mail size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.violetDark }}>
            {studentThreads}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.violetDark }}>
            Doubts &amp; homework questions
          </p>
        </div>

        {/* Directives from Admin (Pastel Warm Amber) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: T.amberBg,
            border: `1px solid ${T.amberBg}`,
            borderRadius: "10px",
            color: T.amberDark,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Official Directives
            </span>
            <Bell size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: T.amberDark }}>
            {adminThreads}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: T.amberDark }}>
            Administrative circulars &amp; notices
          </p>
        </div>
      </div>

      {/* 3. Chat Hub Layout */}
      <div className="chat-layout-card">
        {/* Left Column: Thread List */}
        <div
          className={`chat-sidebar-pane ${selectedThreadId ? 'chat-pane-hidden' : ''}`}
          style={{ borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}
        >
          <div style={{ padding: "14px", borderBottom: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: T.chip, border: `1px solid ${T.border}`, padding: "6px 10px", borderRadius: "8px" }}>
              <Search size={14} color={T.slate} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", background: "transparent", fontSize: "12px", width: "100%", color: T.navy }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: "flex", gap: "4px", overflowX: "auto" }}>
              {(["all", "students", "parents", "principal", "school_admin"] as const).map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      onTabChange?.(tab);
                    }}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: active ? 600 : 500,
                      border: "none",
                      background: active ? T.navy : T.chip,
                      color: active ? T.white : T.slate,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tab === "all" ? "All" : tab === "school_admin" ? "Admin" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thread List Items */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredThreads.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: T.slate, fontSize: "12px" }}>
                No conversations found in this filter.
              </div>
            ) : (
              filteredThreads.map((th: any) => {
                const isSelected = th.id === selectedThreadId;
                return (
                  <div
                    key={th.id}
                    onClick={() => setSelectedThreadId(th.id)}
                    style={{
                      padding: "14px 16px",
                      borderBottom: `1px solid ${T.border}`,
                      background: isSelected ? "#f0f4f9" : T.white,
                      borderLeft: isSelected ? `3px solid ${T.navy}` : "3px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, color: T.navy, fontSize: "13px" }}>{th.senderName}</span>
                      <span style={{ fontSize: "10.5px", color: T.slate }}>{th.timestamp || "Today"}</span>
                    </div>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: T.blue }}>{th.subject}</div>
                    <p style={{ margin: 0, fontSize: "12px", color: T.slate, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {th.lastMessage}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Stream */}
        <div
          className={`chat-main-pane ${!selectedThreadId ? 'chat-pane-hidden' : ''}`}
          style={{ display: "flex", flexDirection: "column", height: "100%", background: T.white, minWidth: 0 }}
        >
          {selectedThreadId && activeThread ? (
            <>
              {/* Thread Header */}
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.white, gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedThreadId(null)}
                    className="chat-back-btn"
                    aria-label="Back to thread list"
                    style={{
                      all: "unset",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      background: T.white,
                      border: `1px solid ${T.border}`,
                      color: T.navy,
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Threads</span>
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: T.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activeThread.subject || "Academic Discussion"}
                    </h3>
                    <span style={{ fontSize: "11px", color: T.slate, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activeThread.channel} • {activeThread.participantName}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: "10.5px", padding: "2px 8px", borderRadius: "100px", background: T.greenBg, color: T.greenDark, fontWeight: 600, flexShrink: 0 }}>
                  Active Stream
                </span>
              </div>

              {/* Message Stream */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", background: T.pageBg }}>
                {threadLoading ? (
                  <div style={{ textAlign: "center", color: T.slate, padding: "24px", fontSize: "12px" }}>
                    Loading conversation messages...
                  </div>
                ) : (
                  activeThread.messages?.map((msg: any, i: number) => {
                    const isMe = msg.isTeacher || msg.senderRole === "teacher";
                    return (
                      <div
                        key={msg.id || i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "75%",
                        }}
                      >
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            background: isMe ? T.navy : T.white,
                            color: isMe ? T.white : T.navy,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                            border: isMe ? "none" : `1px solid ${T.border}`,
                            fontSize: "12.5px",
                            lineHeight: 1.5,
                          }}
                        >
                          {msg.content}
                        </div>
                        <span style={{ fontSize: "10px", color: T.slate, marginTop: "2px", alignSelf: isMe ? "flex-end" : "flex-start" }}>
                          {msg.timestamp || "Just now"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Footer */}
              <form onSubmit={handleSendMessage} style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: "10px", background: T.white }}>
                <input
                  type="text"
                  placeholder="Type your response to this thread..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: `1px solid ${T.line}`,
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    color: T.navy,
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={isSending || !replyMessage.trim()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    background: T.navy,
                    color: T.white,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    opacity: isSending || !replyMessage.trim() ? 0.6 : 1,
                  }}
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.slate, fontSize: "13px" }}>
              Select a conversation from the left to read messages.
            </div>
          )}
        </div>
      </div>

      <CommunicationChat organizationId={organizationId} title="Direct Messages" />

      {/* 4. Redesigned Compose Message Modal */}
      {showComposeModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(2px)",
            padding: "16px",
            boxSizing: "border-box",
            fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowComposeModal(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: "14px",
              boxShadow: "0 20px 40px rgba(12, 30, 51, 0.15)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: `1px solid ${T.line}`, paddingBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: T.navy, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                  Compose Directive
                </span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: T.navy }}>
                  Start New Chat Conversation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowComposeModal(false)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.slate,
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendNewMessage} style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                  Recipient Channel *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                  {[
                    { id: "students", label: "Students" },
                    { id: "parents", label: "Parents" },
                    { id: "principal", label: "Principal" },
                    { id: "school_admin", label: "Admin" },
                  ].map((c) => {
                    const active = composeChannel === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setComposeChannel(c.id as any)}
                        style={{
                          padding: "6px",
                          textAlign: "center",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: active ? `1px solid ${T.navy}` : `1px solid ${T.line}`,
                          background: active ? T.navy : T.white,
                          color: active ? T.white : T.slate,
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                  Specific Recipient
                </label>
                {data?.directory?.[composeChannel]?.length > 0 ? (
                  <select
                    value={composeRecipientId}
                    onChange={(e) => setComposeRecipientId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${T.line}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: T.navy,
                      background: T.white,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {data.directory[composeChannel].map((contact: any) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} ({contact.email || contact.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={`Designated ${composeChannel.toUpperCase()} Channel Desk`}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${T.line}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: T.slate,
                      background: T.chip,
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics Session Review & Homework Question"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${T.line}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: T.navy,
                    background: T.white,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, color: T.navy, marginBottom: "6px" }}>
                  Message Content *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State your directive, update, or academic observation..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${T.line}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: T.navy,
                    background: T.white,
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: `1px solid ${T.line}` }}>
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: T.slate,
                    background: "transparent",
                    border: `1px solid ${T.line}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !composeSubject.trim() || !composeBody.trim()}
                  style={{
                    padding: "8px 18px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: T.white,
                    background: T.navy,
                    border: "none",
                    borderRadius: "8px",
                    cursor: isSubmittingNew ? "not-allowed" : "pointer",
                    opacity: isSubmittingNew ? 0.6 : 1,
                    boxShadow: "0 2px 6px rgba(12, 30, 51, 0.2)",
                  }}
                >
                  {isSubmittingNew ? "Sending..." : "Start Chat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
