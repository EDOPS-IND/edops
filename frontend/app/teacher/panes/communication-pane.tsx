"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Users,
  ShieldAlert,
  Plus,
  X,
  GraduationCap,
  Building2,
  Sparkles,
  Inbox,
  Search,
  CheckCheck
} from "lucide-react";
import { getTeacherMessages, sendTeacherMessage } from "../../edops-api";

interface CommunicationPaneProps {
  organizationId: string;
}

export function CommunicationPane({ organizationId }: CommunicationPaneProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "parents" | "students" | "principal" | "school_admin">("all");
  const [activeContactId, setActiveContactId] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Compose Modal State (for starting brand new conversation)
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeChannel, setComposeChannel] = useState<"parents" | "students" | "principal" | "school_admin">("students");
  const [composeRecipientId, setComposeRecipientId] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composePriority, setComposePriority] = useState<"normal" | "urgent">("normal");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [organizationId]);

  async function loadMessages(preserveContactId?: string) {
    try {
      const res = await getTeacherMessages(organizationId);
      setData(res);

      const msgs = res?.messages || [];
      if (preserveContactId) {
        setActiveContactId(preserveContactId);
      } else if (!activeContactId && msgs.length > 0) {
        setActiveContactId(msgs[0].otherPartyId || msgs[0].recipientId || "");
      }
    } catch {
      setData({ messages: [], announcements: [], directory: {} });
    } finally {
      setLoading(false);
    }
  }

  // Pre-fill recipient when channel changes in compose modal
  useEffect(() => {
    if (data?.directory?.[composeChannel]?.length > 0) {
      setComposeRecipientId(data.directory[composeChannel][0].id);
    } else {
      setComposeRecipientId(`${composeChannel}-desk`);
    }
  }, [composeChannel, data]);

  const rawMessages: any[] = data?.messages || [];

  // Group messages into WhatsApp-style conversation threads by otherPartyId
  const threadsMap: Record<
    string,
    {
      contactId: string;
      contactName: string;
      contactRole: string;
      category: string;
      messages: any[];
      lastMessage: any;
      unreadCount: number;
    }
  > = {};

  for (const m of rawMessages) {
    const key = m.otherPartyId || m.recipientId;
    if (!key) continue;

    if (!threadsMap[key]) {
      threadsMap[key] = {
        contactId: key,
        contactName: m.otherPartyName || m.recipientName || "Academic Contact",
        contactRole: m.category || "students",
        category: m.category || "students",
        messages: [],
        lastMessage: null,
        unreadCount: 0,
      };
    }

    threadsMap[key].messages.push(m);
    if (
      !threadsMap[key].lastMessage ||
      new Date(m.created_at || m.timestamp).getTime() >
        new Date(threadsMap[key].lastMessage.created_at || threadsMap[key].lastMessage.timestamp).getTime()
    ) {
      threadsMap[key].lastMessage = m;
    }
    if (!m.isRead && !m.isOutgoing) {
      threadsMap[key].unreadCount += 1;
    }
  }

  // Sort threads: most recent message at the top
  const allThreads = Object.values(threadsMap).sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return (
        new Date(b.lastMessage.created_at || b.lastMessage.timestamp).getTime() -
        new Date(a.lastMessage.created_at || a.lastMessage.timestamp).getTime()
      );
    }
    return 0;
  });

  // Filter threads by active tab & search query
  const filteredThreads = allThreads.filter((t) => {
    const matchesTab = activeTab === "all" || t.category === activeTab;
    const matchesSearch =
      !searchQuery.trim() ||
      t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.messages.some((m) => m.body.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const activeThread =
    threadsMap[activeContactId] ||
    filteredThreads[0] ||
    allThreads[0];

  // Auto-scroll chat stream to bottom when activeThread messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeContactId, activeThread?.messages?.length]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeThread || sending) return;

    const messageText = chatInput.trim();
    setChatInput("");
    setSending(true);

    try {
      const targetRole =
        activeThread.category === "students"
          ? "student"
          : activeThread.category === "parents"
          ? "parent"
          : activeThread.category === "principal"
          ? "principal"
          : "school_admin";

      const subject =
        activeThread.messages.length > 0
          ? activeThread.messages[0].subjectLine
          : "Direct Academic Message";

      await sendTeacherMessage(organizationId, {
        recipientId: activeThread.contactId,
        recipientRole: targetRole,
        subjectLine: subject?.startsWith("Re:") ? subject : `Re: ${subject}`,
        body: messageText,
        priority: "normal",
      });

      await loadMessages(activeThread.contactId);
    } catch (err) {
      console.error("Failed to send message:", err);
      setChatInput(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleOpenCompose = (channel?: "parents" | "students" | "principal" | "school_admin") => {
    const targetChannel = channel || (activeTab === "all" ? "students" : activeTab);
    setComposeChannel(targetChannel);
    if (data?.directory?.[targetChannel]?.length > 0) {
      setComposeRecipientId(data.directory[targetChannel][0].id);
    } else {
      setComposeRecipientId(`${targetChannel}-desk`);
    }
    setComposeSubject("");
    setComposeBody("");
    setComposePriority("normal");
    setShowComposeModal(true);
  };

  const handleSendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim() || !composeBody.trim()) return;

    setIsSubmittingNew(true);
    try {
      const roleMap: Record<string, "student" | "parent" | "principal" | "school_admin"> = {
        students: "student",
        parents: "parent",
        principal: "principal",
        school_admin: "school_admin",
      };

      const res = await sendTeacherMessage(organizationId, {
        recipientId: composeRecipientId || `${composeChannel}-desk`,
        recipientRole: roleMap[composeChannel] || "student",
        subjectLine: composeSubject,
        body: composeBody,
        priority: composePriority,
      });

      setShowComposeModal(false);
      setComposeSubject("");
      setComposeBody("");
      const newContactId = res?.message?.recipientId || composeRecipientId;
      await loadMessages(newContactId);
      if (newContactId) setActiveContactId(newContactId);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const countAll = allThreads.length;
  const countParents = allThreads.filter((t) => t.category === "parents").length;
  const countStudents = allThreads.filter((t) => t.category === "students").length;
  const countPrincipal = allThreads.filter((t) => t.category === "principal").length;
  const countSchoolAdmin = allThreads.filter((t) => t.category === "school_admin").length;

  const tabsConfig = [
    { id: "all", label: "All Chats", count: countAll, icon: Inbox },
    { id: "students", label: "Students", count: countStudents, icon: GraduationCap },
    { id: "parents", label: "Parents", count: countParents, icon: Users },
    { id: "principal", label: "Principal Directives", count: countPrincipal, icon: ShieldAlert },
    { id: "school_admin", label: "School Admin (SO)", count: countSchoolAdmin, icon: Building2 },
  ];

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "students":
        return { label: "Student", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "parents":
        return { label: "Parent", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "principal":
        return { label: "Principal", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "school_admin":
      default:
        return { label: "School Office", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Academic Chat Desk & In-App Messaging
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Continuous chat session threads with enrolled students, parents, principal, and school admin
          </p>
        </div>

        <button
          onClick={() => handleOpenCompose()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm self-start sm:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Official Broadcast Announcements Banner (if any) */}
      {data?.announcements?.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-amber-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-600 text-white rounded">
                Official Broadcast
              </span>
              <span className="text-xs font-semibold text-gray-800">
                {data.announcements[0].title}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-1">{data.announcements[0].message}</p>
          </div>
        </div>
      )}

      {/* 5 Filter Tabs with Live Thread Counts */}
      <div className="flex border-b border-gray-200 gap-2 sm:gap-6 text-xs font-bold overflow-x-auto">
        {tabsConfig.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 px-1 border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* WhatsApp-Style Continuous Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden h-[620px] max-h-[620px]">
        {/* Left Column: Conversation Threads List */}
        <div className="border-r border-gray-200 flex flex-col h-full min-h-0 bg-gray-50/40 overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200 bg-white shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs space-y-3">
                <p>No chat conversations in this category.</p>
                <button
                  onClick={() =>
                    handleOpenCompose(activeTab === "all" ? "students" : (activeTab as any))
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start New Conversation</span>
                </button>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.contactId === thread.contactId;
                const badge = getCategoryBadge(thread.category);
                const lastMsg = thread.lastMessage;

                return (
                  <div
                    key={thread.contactId}
                    onClick={() => setActiveContactId(thread.contactId)}
                    className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? "bg-indigo-50/80 border-l-4 border-indigo-600"
                        : "hover:bg-gray-100/60"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {(thread.contactName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {thread.contactName}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {lastMsg.timestamp}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <p className="text-[11px] text-gray-500 truncate flex-1">
                          {lastMsg ? (lastMsg.isOutgoing ? `You: ${lastMsg.body}` : lastMsg.body) : "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Stream & Input */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-0 bg-gray-50/30 overflow-hidden">
          {activeThread ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-3.5 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {(activeThread.contactName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">
                      {activeThread.contactName}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {getCategoryBadge(activeThread.category).label} · Continuous Active Session
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Connected
                </span>
              </div>

              {/* Chat Messages Stream (Oldest to Newest, like WhatsApp) */}
              <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {activeThread.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                    <p className="text-xs">
                      No messages with {activeThread.contactName} yet.
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Type your message below to start this conversation!
                    </p>
                  </div>
                ) : (
                  activeThread.messages
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(a.created_at || a.timestamp).getTime() -
                        new Date(b.created_at || b.timestamp).getTime()
                    )
                    .map((msg: any) => {
                      const isMe = msg.isOutgoing;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isMe
                                ? "bg-indigo-600 text-white rounded-tr-xs"
                                : "bg-white text-gray-800 border border-gray-200 rounded-tl-xs"
                            }`}
                          >
                            {msg.subjectLine && !msg.subjectLine.startsWith("Re:") && (
                              <div
                                className={`text-[10px] font-bold mb-1 pb-1 border-b ${
                                  isMe
                                    ? "border-indigo-500/60 text-indigo-100"
                                    : "border-gray-100 text-indigo-600"
                                }`}
                              >
                                {msg.subjectLine}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.body}</p>
                          </div>
                          <span className="text-[9px] text-gray-400 mt-1 px-1">
                            {msg.timestamp}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Chat Input Bar (WhatsApp-style) */}
              <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Message ${activeThread.contactName}... (Press Enter to send)`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !chatInput.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-40 transition shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>

      {/* Compose Brand New Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Start New Chat Conversation
              </h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNewMessage} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Recipient Channel
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "students", label: "Students", icon: GraduationCap },
                    { id: "parents", label: "Parents", icon: Users },
                    { id: "principal", label: "Principal", icon: ShieldAlert },
                    { id: "school_admin", label: "School Admin", icon: Building2 },
                  ].map((c) => {
                    const Icon = c.icon;
                    const isSelected = composeChannel === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setComposeChannel(c.id as any)}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Recipient
                </label>
                {data?.directory?.[composeChannel]?.length > 0 ? (
                  <select
                    value={composeRecipientId}
                    onChange={(e) => setComposeRecipientId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-900"
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
                    className="w-full p-2.5 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics Session Review"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type your message to start this chat..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew || !composeSubject.trim() || !composeBody.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingNew ? "Starting..." : "Start Chat"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
