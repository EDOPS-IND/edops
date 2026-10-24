"use client";

import React, { useRef, useState, useEffect } from "react";
import { BroadcastRecord, CommunicationTicket } from "./types";
import { CommunicationChat } from "../components/communication-chat";
import { getSchoolAdminBroadcasts, createSchoolAdminBroadcast, getSchoolAdminConversations, getSchoolAdminConversation, markSchoolAdminConversationRead, updateSchoolAdminConversationStatus, openSchoolAdminCommunicationStream, getSchoolAdminCommunicationRecipients, sendSchoolAdminDirectMessage } from "../edops-api";
import {
  Send,
  MessageSquare,
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  Search,
  X,
} from "lucide-react";

const normalizeBroadcast = (b: any): BroadcastRecord => ({
  id: b.id,
  title: b.title,
  message: b.message,
  audience: b.target_audience === "all" ? "Entire School" : (b.target_audience || "Parents").replace(/^./, (c: string) => c.toUpperCase()),
  channels: (b.channels || ["in_app"]).map((c: string) => c === "in_app" ? "In-App" : c),
  sentAt: b.created_at ? new Date(b.created_at).toLocaleString() : "—",
  sentBy: b.sender_name || "School Admin",
  deliveryStats: b.delivery_stats || { sent: Number(b.recipient_count || 0), delivered: Number(b.recipient_count || 0), failed: 0 },
});

function CommunicationEmptyState({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--muted)", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "8px" }}>{children}</div>;
}

const normalizeConversation = (conversation: any): CommunicationTicket => ({
  id: conversation.conversationId,
  conversationId: conversation.conversationId,
  recipientId: conversation.participantId,
  recipientRole: conversation.participantRole,
  senderName: conversation.participantName || conversation.participantEmail || "School member",
  senderRole: conversation.participantRole === "principal" ? "Staff" : conversation.participantRole === "staff" ? "Staff" : conversation.participantRole === "parent" ? "Parent" : conversation.participantRole === "student" ? "Parent" : "Teacher",
  subject: conversation.subject || "Direct message",
  snippet: conversation.preview || "",
  priority: "High",
  status: conversation.status === "in_progress" ? "In Progress" : conversation.status === "resolved" ? "Resolved" : conversation.status === "closed" ? "Closed" : "Open",
  timestamp: conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : "—",
  assignedTo: "Academic Admin Desk",
});

export function CommunicationPane({
  organizationId,
  activeTab,
  onTabChange,
}: {
  organizationId?: string;
  activeTab?: "broadcast" | "inbox" | "newBroadcast";
  onTabChange?: (tab: "broadcast" | "inbox" | "newBroadcast") => void;
}) {
  const [subtab, setSubtab] = useState<"broadcast" | "inbox" | "newBroadcast">(activeTab || "broadcast");

  useEffect(() => {
    if (activeTab && activeTab !== subtab) {
      setSubtab(activeTab);
    }
  }, [activeTab]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [directRole, setDirectRole] = useState("teacher");
  const [directSearch, setDirectSearch] = useState("");
  const [directRecipients, setDirectRecipients] = useState<any[]>([]);
  const [directRecipientsLoading, setDirectRecipientsLoading] = useState(false);
  const [directRecipientsOpen, setDirectRecipientsOpen] = useState(false);
  const [directRecipient, setDirectRecipient] = useState<any>(null);
  const [directSubject, setDirectSubject] = useState("");
  const [directBody, setDirectBody] = useState("");
  const [directSending, setDirectSending] = useState(false);
  const directSearchRequest = useRef(0);
  const [openConversation, setOpenConversation] = useState<CommunicationTicket | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [conversationReply, setConversationReply] = useState("");
  const [conversationLoading, setConversationLoading] = useState(false);
  const [realtimeRevision, setRealtimeRevision] = useState(0);

  // Broadcasts history
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>(([] as any[]));

  // Unified Inquiries & Tickets
  const [tickets, setTickets] = useState<CommunicationTicket[]>(([] as any[]));

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    setLoadError(false);
    getSchoolAdminBroadcasts(organizationId)
      .then((data) => {
        setBroadcasts(Array.isArray(data) ? data.map(normalizeBroadcast) : []);
      })
      .catch(() => setLoadError(true));

    getSchoolAdminConversations(organizationId)
      .then((data) => {
        setTickets(Array.isArray(data) ? data.map(normalizeConversation) : []);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    return openSchoolAdminCommunicationStream(organizationId, () => {
      setRealtimeRevision((revision) => revision + 1);
      getSchoolAdminBroadcasts(organizationId).then((data) => setBroadcasts(Array.isArray(data) ? data.map(normalizeBroadcast) : [])).catch(() => setLoadError(true));
      getSchoolAdminConversations(organizationId).then((data) => setTickets(Array.isArray(data) ? data.map(normalizeConversation) : [])).catch(() => setLoadError(true));
    });
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId || !openConversation?.conversationId || !realtimeRevision) return;
    getSchoolAdminConversation(organizationId, openConversation.conversationId)
      .then((messages) => setConversationMessages(Array.isArray(messages) ? messages : []))
      .catch(() => undefined);
  }, [organizationId, realtimeRevision, openConversation?.conversationId]);

  useEffect(() => {
    if (!organizationId || !showDirectMessage) return;
    const requestId = ++directSearchRequest.current;
    setDirectRecipientsLoading(true);
    const timer = setTimeout(() => {
      getSchoolAdminCommunicationRecipients(organizationId, directRole, directSearch)
        .then((data) => {
          if (requestId === directSearchRequest.current) setDirectRecipients(Array.isArray(data) ? data : []);
        })
        .catch(() => { if (requestId === directSearchRequest.current) setDirectRecipients([]); })
        .finally(() => { if (requestId === directSearchRequest.current) setDirectRecipientsLoading(false); });
    }, 250);
    return () => clearTimeout(timer);
  }, [organizationId, showDirectMessage, directRole, directSearch]);

  // Form state for New Broadcast modal
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState<"Entire School" | "Students" | "Parents" | "Teachers" | "Staff">("Parents");
  const [channels, setChannels] = useState<{ inApp: boolean; whatsapp: boolean; sms: boolean; email: boolean }>({ inApp: true, whatsapp: false, sms: false, email: false });

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedChannels: ("In-App" | "SMS" | "WhatsApp" | "Email")[] = [];
    if (channels.inApp) selectedChannels.push("In-App");
    if (channels.whatsapp) selectedChannels.push("WhatsApp");
    if (channels.sms) selectedChannels.push("SMS");
    if (channels.email) selectedChannels.push("Email");

    if (!organizationId) return;
    try {
      const saved=await createSchoolAdminBroadcast(organizationId,{
        title:broadcastTitle,message:broadcastBody,
        targetAudience:broadcastAudience==='Entire School'?'all':broadcastAudience.toLowerCase(),
        channels:selectedChannels.map(channel=>channel==='In-App'?'in_app':channel.toLowerCase()),priority:'normal',
      });
      setBroadcasts(prev=>[normalizeBroadcast(saved),...prev]);
      setBroadcastTitle('');setBroadcastBody('');closeCompose();
      alert('Notice saved to the school noticeboard.');
    } catch (error) { console.error('Broadcast could not be saved:',error); }

  };

  const closeCompose = () => {
    setSubtab("broadcast");
    onTabChange?.("broadcast");
  };

  const closeDirectMessage = () => {
    setShowDirectMessage(false);
    setDirectRecipient(null);
    setDirectSubject("");
    setDirectBody("");
  };

  const handleDirectMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organizationId || !directRecipient) return;
    setDirectSending(true);
    try {
      await sendSchoolAdminDirectMessage(organizationId, {
        recipientId: directRecipient.id,
        recipientRole: directRole,
        subject: directSubject,
        body: directBody,
        priority: "normal",
      });
      closeDirectMessage();
    } finally {
      setDirectSending(false);
    }
  };

  const openConversationDrawer = async (ticket: CommunicationTicket) => {
    if (!organizationId || !ticket.conversationId) return;
    setOpenConversation(ticket);
    setConversationLoading(true);
    try {
      const messages = await getSchoolAdminConversation(organizationId, ticket.conversationId);
      setConversationMessages(Array.isArray(messages) ? messages : []);
      await markSchoolAdminConversationRead(organizationId, ticket.conversationId);
      setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: item.status === "Open" ? "In Progress" : item.status } : item));
    } finally {
      setConversationLoading(false);
    }
  };

  const sendConversationReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organizationId || !openConversation?.conversationId || !openConversation.recipientId || !openConversation.recipientRole || !conversationReply.trim()) return;
    await sendSchoolAdminDirectMessage(organizationId, {
      recipientId: openConversation.recipientId,
      recipientRole: openConversation.recipientRole,
      subject: openConversation.subject,
      body: conversationReply.trim(),
      conversationId: openConversation.conversationId,
      priority: "normal",
    });
    await updateSchoolAdminConversationStatus(organizationId, openConversation.conversationId, "in_progress");
    setConversationReply("");
    setConversationMessages(await getSchoolAdminConversation(organizationId, openConversation.conversationId));
  };

  return (
    <div className="edops-communication-pane" style={{ display: "grid", gap: "20px" }}>
      {/* Top 4 Pastel Metric Cards (Strictly 148px) */}
      <section className="edops-communication-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {/* 1. Broadcast Dispatches (Pastel Violet) */}
        <article
          onClick={() => {
            setSubtab("broadcast");
            if (onTabChange) onTabChange("broadcast");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#e1d2ff",
            border: "1px solid #e1d2ff",
            borderRadius: "10px",
            color: "#4a0e8f",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Dispatches
            </span>
            <Send size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
            {broadcasts.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Across In-App, SMS &amp; WhatsApp</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Notices</span>
          </div>
        </article>

        {/* 2. Parent Audience Reach (Pastel Mint) */}
        <article
          onClick={() => {
            setSubtab("broadcast");
            if (onTabChange) onTabChange("broadcast");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ccefbf",
            border: "1px solid #ccefbf",
            borderRadius: "10px",
            color: "#1a5c0a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Audience Reach
            </span>
            <Smartphone size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
            {broadcasts.some((b) => b.deliveryStats.sent > 0) ? `${Math.round((broadcasts.reduce((sum, b) => sum + (b.deliveryStats.sent ? b.deliveryStats.delivered / b.deliveryStats.sent : 0), 0) / broadcasts.length) * 100)}%` : "—"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Verified mobile device delivery</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Turnout</span>
          </div>
        </article>

        {/* 3. Open Inquiries Inbox (Pastel Sky) */}
        <article
          onClick={() => {
            setSubtab("inbox");
            if (onTabChange) onTabChange("inbox");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#bae5f5",
            border: "1px solid #bae5f5",
            borderRadius: "10px",
            color: "#0a5a7a",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Inquiries &amp; Tickets
            </span>
            <MessageSquare size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
            {tickets.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Parent &amp; student academic triage</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Inbox</span>
          </div>
        </article>

        {/* 4. Active Channels (Pastel Coral) */}
        <article
          onClick={() => {
            setSubtab("newBroadcast");
            if (onTabChange) onTabChange("newBroadcast");
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "148px",
            padding: "20px",
            background: "#ffd8c7",
            border: "1px solid #ffd8c7",
            borderRadius: "10px",
            color: "#782a00",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Gateways
            </span>
            <Bell size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#782a00" }}>
            1 Channel
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>In-App noticeboard</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Active</span>
          </div>
        </article>
      </section>

      {loadError && <CommunicationEmptyState>Communication data could not be loaded. Please refresh and try again.</CommunicationEmptyState>}

      {organizationId && <CommunicationChat organizationId={organizationId} title="Direct Messages" onComposeBroadcast={() => { setSubtab("newBroadcast"); onTabChange?.("newBroadcast"); }} />}

      {/* Subtab Selector */}
      <div className="edops-communication-nav" style={{ display: "none", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e4e6e9", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div className="edops-communication-tabs" style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "broadcast", label: "Broadcast Dispatches" },
            { id: "inbox", label: "Unified Inquiries Inbox" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSubtab(tab.id as any);
                if (onTabChange) onTabChange(tab.id as any);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 700 : 500,
                background: subtab === tab.id ? "#0c1e33" : "transparent",
                color: subtab === tab.id ? "#ffffff" : "#4a5568",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. BROADCAST DISPATCHES TAB */}
      {false && (
        <div className="edops-communication-panel" style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Multi-Channel School Broadcast Center</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>In-App announcements, WhatsApp notifications, and SMS alerts dispatch ledger</p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDirectMessage(true)}
                style={{ padding: "8px 14px", background: "#ffffff", color: "#0c1e33", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <MessageSquare size={14} /> Direct Message
              </button>
              <button
                onClick={() => {
                  setSubtab("newBroadcast");
                  if (onTabChange) onTabChange("newBroadcast");
                }}
                style={{ padding: "8px 16px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Send size={14} /> Compose Broadcast
              </button>
            </div>
          </div>

          {loading ? <CommunicationEmptyState>Loading broadcasts…</CommunicationEmptyState> : broadcasts.length === 0 ? <CommunicationEmptyState>No broadcasts sent yet. Compose your first broadcast.</CommunicationEmptyState> : <div style={{ display: "grid", gap: "12px" }}>
            {broadcasts.map((b) => (
              <div key={b.id} style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e4e6e9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ background: "#f0f4f9", color: "#0c1e33", padding: "2px 8px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700 }}>
                        Target: {b.audience}
                      </span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {b.channels.map((ch, idx) => (
                          <span key={idx} style={{ background: "#ffffff", border: "1px solid #e4e6e9", color: "#0c1e33", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                    <b style={{ color: "#0c1e33", fontSize: "15px" }}>{b.title}</b>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#334155", lineHeight: 1.4 }}>{b.message}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{b.sentAt}</span>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>by {b.sentBy}</div>
                  </div>
                </div>

                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <span>Sent: <b>{b.deliveryStats.sent}</b></span>
                    <span style={{ color: "#047857" }}>Delivered: <b>{b.deliveryStats.delivered}</b></span>
                    <span style={{ color: b.deliveryStats.failed > 0 ? "#DC2626" : "var(--muted)" }}>Failed: <b>{b.deliveryStats.failed}</b></span>
                  </div>
                  <span style={{ color: "#0c1e33", fontWeight: 700, fontSize: "11.5px" }}>Delivery summary</span>
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}

      {/* 2. UNIFIED INBOX & TICKET TRIAGE */}
      {false && (
        <div className="edops-communication-panel" style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Unified Inquiries & Escalation Inbox</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Parent queries, transport reports, teacher requests and administrative escalations</p>

          {loading ? <CommunicationEmptyState>Loading inquiries…</CommunicationEmptyState> : tickets.length === 0 ? <CommunicationEmptyState>No inquiries or tickets yet.</CommunicationEmptyState> : <div style={{ display: "grid", gap: "10px" }}>
            {tickets.map((t) => (
              <div key={t.id} style={{ padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700,
                      background: t.priority === "Urgent" ? "#FEE2E2" : t.priority === "High" ? "#FEF3C7" : "#ECFDF5",
                      color: t.priority === "Urgent" ? "#991B1B" : t.priority === "High" ? "#92400E" : "#047857",
                    }}>
                      {t.priority}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 650 }}>{t.senderRole}: <b>{t.senderName}</b></span>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>· {t.timestamp}</span>
                  </div>
                  <b style={{ fontSize: "14px", color: "#0c1e33" }}>{t.subject}</b>
                  <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "#334155" }}>{t.snippet}</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "inline-block", background: t.status === "Open" ? "#FEF3C7" : "#ECFDF5", color: t.status === "Open" ? "#92400E" : "#047857", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>
                    {t.status}
                  </span>
                  <div>
                    <button onClick={() => openConversationDrawer(t)} style={{ padding: "4px 10px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
                      Open Conversation
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}

      {false && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1350, display: "flex", justifyContent: "flex-end", background: "rgba(12, 30, 51, 0.65)", backdropFilter: "blur(4px)" }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpenConversation(null); }}>
          <aside className="edops-right-drawer" role="dialog" aria-modal="true" aria-label="Conversation" style={{ height: "100vh", background: "#FFFFFF", boxShadow: "-10px 0 36px rgba(12, 30, 51, 0.22)", display: "flex", flexDirection: "column", animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <header className="edops-drawer-header" style={{ padding: "20px 24px", borderBottom: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFAFB" }}>
              <div>
                <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600 }}>{openConversation.senderName}</span>
                <h3 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 800, color: "#0c1e33" }}>{openConversation.subject}</h3>
              </div>
              <button type="button" aria-label="Close conversation" onClick={() => setOpenConversation(null)} style={{ border: 0, background: "transparent", color: "#64748b", cursor: "pointer" }}><X size={24} /></button>
            </header>
            <div className="edops-drawer-body" style={{ padding: "22px 24px", overflowY: "auto", flex: 1, display: "grid", gap: "12px", alignContent: "start" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>Conversation history</span>
                <select value={openConversation.status === "Open" ? "open" : openConversation.status === "In Progress" ? "in_progress" : openConversation.status.toLowerCase()} onChange={async (e) => { if (!organizationId || !openConversation.conversationId) return; await updateSchoolAdminConversationStatus(organizationId, openConversation.conversationId, e.target.value); setOpenConversation({ ...openConversation, status: e.target.value === "in_progress" ? "In Progress" : e.target.value === "resolved" ? "Resolved" : e.target.value === "closed" ? "Closed" : "Open" }); }} style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "12px" }}>
                  <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                </select>
              </div>
              {conversationLoading ? <CommunicationEmptyState>Loading conversation…</CommunicationEmptyState> : conversationMessages.map((message) => (
                <div key={message.id} style={{ padding: "12px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e4e6e9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "11px", color: "var(--muted)" }}><b style={{ color: "#0c1e33" }}>{message.senderName || "School Admin"}</b><span>{message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}</span></div>
                  <p style={{ margin: "7px 0 0", fontSize: "13px", lineHeight: 1.5, color: "#334155", whiteSpace: "pre-wrap" }}>{message.body}</p>
                </div>
              ))}
            </div>
            <form onSubmit={sendConversationReply} style={{ padding: "16px 24px", borderTop: "1px solid #e4e6e9", display: "grid", gap: "8px" }}>
              <textarea required rows={3} value={conversationReply} onChange={(e) => setConversationReply(e.target.value)} placeholder="Write a reply…" style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #e4e6e9", fontSize: "13px", resize: "vertical" }} />
              <button type="submit" style={{ padding: "10px 16px", background: "#0c1e33", color: "#ffffff", border: 0, borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Send Reply</button>
            </form>
          </aside>
        </div>
      )}

      {false && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", justifyContent: "flex-end", background: "rgba(12, 30, 51, 0.65)", backdropFilter: "blur(4px)" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeDirectMessage(); }}
        >
          <aside className="edops-right-drawer" role="dialog" aria-modal="true" aria-label="Send Direct Message" style={{ height: "100vh", background: "#FFFFFF", boxShadow: "-10px 0 36px rgba(12, 30, 51, 0.22)", display: "flex", flexDirection: "column", animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <header className="edops-drawer-header" style={{ padding: "20px 24px", borderBottom: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFAFB" }}>
              <div>
                <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600 }}>Communication Center</span>
                <h3 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 800, color: "#0c1e33" }}>Send Direct Message</h3>
              </div>
              <button type="button" aria-label="Close direct message" onClick={closeDirectMessage} style={{ border: 0, background: "transparent", color: "#64748b", cursor: "pointer" }}><X size={24} /></button>
            </header>
            <div className="edops-drawer-body" style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>
              <form onSubmit={handleDirectMessage} style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>Recipient type</label>
                  <select value={directRole} onChange={(e) => { setDirectRole(e.target.value); setDirectRecipient(null); }} style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px" }}>
                    <option value="principal">Principal</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="staff">Staff member</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>Search recipient</label>
                  <div>
                    <input value={directSearch} onFocus={() => setDirectRecipientsOpen(true)} onChange={(e) => { setDirectSearch(e.target.value); setDirectRecipient(null); setDirectRecipientsOpen(true); }} placeholder="Search by name or email" style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px" }} />
                    {directRecipientsOpen && <div role="listbox" aria-live="polite" style={{ display: "grid", gap: "4px", maxHeight: "180px", overflowY: "auto", marginTop: "6px", padding: "6px", background: "#fff", border: "1px solid #e4e6e9", borderRadius: "8px", boxShadow: "0 4px 12px rgba(12,30,51,.08)" }}>
                      {directRecipientsLoading ? <span style={{ padding: "10px", color: "var(--muted)", fontSize: "13px" }}>Searching recipients…</span> : directRecipients.length ? directRecipients.map((recipient) => (
                        <button key={recipient.id} type="button" role="option" aria-selected={directRecipient?.id === recipient.id} onClick={() => { setDirectRecipient(recipient); setDirectSearch(recipient.name || recipient.email); setDirectRecipientsOpen(false); }} style={{ textAlign: "left", padding: "10px 12px", border: 0, borderRadius: "6px", background: directRecipient?.id === recipient.id ? "#f0f4f9" : "#fff", color: "#0c1e33", cursor: "pointer" }}>
                          <strong>{recipient.name || recipient.email}</strong><span style={{ display: "block", marginTop: "2px", color: "var(--muted)", fontSize: "12px" }}>{recipient.email}</span>
                        </button>
                      )) : <span style={{ padding: "10px", color: "var(--muted)", fontSize: "13px" }}>No matching recipients</span>}
                    </div>}
                  </div>
                  {directRecipient && <div style={{ marginTop: "6px", color: "#047857", fontSize: "12px" }}>Selected: {directRecipient.name || directRecipient.email}</div>}
                </div>
                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>Subject</label>
                  <input required value={directSubject} onChange={(e) => setDirectSubject(e.target.value)} placeholder="Message subject" style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>Message</label>
                  <textarea required rows={6} value={directBody} onChange={(e) => setDirectBody(e.target.value)} placeholder="Write your message" style={{ width: "100%", padding: "9px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px", resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button type="submit" disabled={directSending} style={{ padding: "10px 20px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: directSending ? "wait" : "pointer" }}>{directSending ? "Sending…" : "Send Message"}</button>
                  <button type="button" onClick={closeDirectMessage} style={{ padding: "10px 16px", background: "#f8fafc", border: "1px solid #e4e6e9", color: "#0c1e33", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* 3. COMPOSE BROADCAST FORM */}
      {subtab === "newBroadcast" && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", justifyContent: "flex-end", background: "rgba(12, 30, 51, 0.65)", backdropFilter: "blur(4px)" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeCompose(); }}
        >
          <aside className="edops-right-drawer" role="dialog" aria-modal="true" aria-label="Compose Broadcast" style={{ height: "100vh", background: "#FFFFFF", boxShadow: "-10px 0 36px rgba(12, 30, 51, 0.22)", display: "flex", flexDirection: "column", animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <header className="edops-drawer-header" style={{ padding: "20px 24px", borderBottom: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFAFB" }}>
              <div>
                <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 600 }}>Communication Center</span>
                <h3 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 800, color: "#0c1e33" }}>Compose Broadcast</h3>
              </div>
              <button type="button" aria-label="Close compose broadcast" onClick={closeCompose} style={{ border: 0, background: "transparent", color: "#64748b", cursor: "pointer" }}><X size={24} /></button>
            </header>
            <div className="edops-drawer-body" style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>
              <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Send a notice to the selected school audience.</p>

          <form onSubmit={handleSendBroadcast} style={{ display: "grid", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>Target Audience</label>
              <select
                value={broadcastAudience}
                onChange={(e) => setBroadcastAudience(e.target.value as any)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px" }}
              >
                <option value="Parents">All parents</option>
                <option value="Students">All students</option>
                <option value="Teachers">All teachers</option>
                <option value="Staff">School staff</option>
                <option value="Entire School">Entire School Community (All)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>Broadcast Headline</label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Sports Meet 2026 - Schedule & Timing Circular"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33" }}>Announcement Details & Message</label>
              <textarea
                rows={4}
                required
                placeholder="Details of the announcement to be sent to parents and staff..."
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #e4e6e9", marginTop: "4px", fontSize: "13px", resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#0c1e33", display: "block", marginBottom: "6px" }}>Delivery Channels</label>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" checked={channels.inApp} onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })} />
                  In-App Noticeboard
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" disabled checked={channels.whatsapp} onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })} />
                  WhatsApp Message (unavailable)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" disabled checked={channels.sms} onChange={(e) => setChannels({ ...channels, sms: e.target.checked })} />
                  SMS Gateway (unavailable)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" disabled checked={channels.email} onChange={(e) => setChannels({ ...channels, email: e.target.checked })} />
                  Email Digest (unavailable)
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="submit"
                style={{ padding: "10px 20px", background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Send size={15} /> Dispatch Broadcast Now
              </button>
              <button
                type="button"
                onClick={closeCompose}
                style={{ padding: "10px 16px", background: "#f8fafc", border: "1px solid #e4e6e9", color: "#0c1e33", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
