"use client";

import React, { useRef, useState, useEffect } from "react";
import { BroadcastRecord, CommunicationTicket } from "./types";
import { CommunicationChat } from "../components/communication-chat";
import { NoticeBoard } from "../components/notice-board";
import { getSchoolAdminBroadcasts, createSchoolAdminBroadcast, getSchoolAdminConversations, openSchoolAdminCommunicationStream } from "../edops-api";
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
  activeTab?: "broadcast" | "chat" | "inbox" | "newBroadcast";
  onTabChange?: (tab: "broadcast" | "chat" | "inbox" | "newBroadcast") => void;
}) {
  const [subtab, setSubtab] = useState<"broadcast" | "chat" | "newBroadcast">(
    activeTab === "chat" || activeTab === "newBroadcast" ? activeTab : "broadcast"
  );

  useEffect(() => {
    if (activeTab) {
      if ((activeTab as string) === "inbox") {
        setSubtab("chat");
      } else if (activeTab !== subtab) {
        setSubtab(activeTab as any);
      }
    }
  }, [activeTab]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [realtimeRevision, setRealtimeRevision] = useState(0);

  // Broadcasts history
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>(([] as any[]));
  const [selectedDeliveryReport, setSelectedDeliveryReport] = useState<BroadcastRecord | null>(null);

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

        {/* 3. Direct Messages (Pastel Sky) */}
        <article
          onClick={() => {
            setSubtab("chat");
            if (onTabChange) onTabChange("chat");
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
              Direct Messages
            </span>
            <MessageSquare size={18} />
          </div>
          <p style={{ margin: 0, fontSize: "36px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
            {tickets.length}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px" }}>Parent, teacher &amp; student conversations</span>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Chat</span>
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

      {/* Subtab Selector */}
      <div className="edops-communication-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e4e6e9", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div className="edops-communication-tabs" style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "broadcast", label: "Official Notice Board" },
            { id: "chat", label: "Direct Messages" },
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

      {/* 1. OFFICIAL NOTICE BOARD */}
      {subtab === "broadcast" && organizationId && (
        <NoticeBoard organizationId={organizationId} role="school_admin" />
      )}

      {/* 2. DIRECT MESSAGES */}
      {subtab === "chat" && organizationId && (
        <CommunicationChat organizationId={organizationId} title="Direct Messages" />
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
      {/* 4. DELIVERY REPORT MODAL */}
      {selectedDeliveryReport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12, 30, 51, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#FFFFFF", borderRadius: "10px", padding: "24px", maxWidth: "480px", width: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>Delivery Report</h3>
                <span style={{ fontSize: "11px", color: "#64748B" }}>Notice dispatch status and multi-channel audit</span>
              </div>
              <button onClick={() => setSelectedDeliveryReport(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748B" }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: "12px", fontSize: "13px" }}>
              <div><b>Title:</b> {selectedDeliveryReport.title}</div>
              <div><b>Target Audience:</b> {selectedDeliveryReport.audience}</div>
              <div><b>Dispatched:</b> {selectedDeliveryReport.sentAt} by {selectedDeliveryReport.sentBy}</div>
              <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>In-App Noticeboard:</span>
                  <span style={{ color: "#047857", fontWeight: 700 }}>✓ Published & Live</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Channels Included:</span>
                  <b>{selectedDeliveryReport.channels?.join(", ") || "In-App"}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Recipients:</span>
                  <b>{selectedDeliveryReport.deliveryStats.sent > 0 ? selectedDeliveryReport.deliveryStats.sent : "All Enrolled"}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Successfully Delivered:</span>
                  <span style={{ color: "#047857", fontWeight: 700 }}>{selectedDeliveryReport.deliveryStats.sent > 0 ? selectedDeliveryReport.deliveryStats.delivered : "100%"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Delivery Failures:</span>
                  <span style={{ color: selectedDeliveryReport.deliveryStats.failed > 0 ? "#DC2626" : "#64748B", fontWeight: 700 }}>{selectedDeliveryReport.deliveryStats.failed}</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "18px", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setSelectedDeliveryReport(null)}
                style={{ padding: "8px 18px", background: "#0C1E33", color: "#FFFFFF", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
