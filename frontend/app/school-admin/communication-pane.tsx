"use client";

import React, { useState, useEffect } from "react";
import { BroadcastRecord, CommunicationTicket } from "./types";
import { getSchoolAdminBroadcasts, createSchoolAdminBroadcast, getSchoolAdminTickets } from "../edops-api";
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
} from "lucide-react";

export function CommunicationPane({ organizationId }: { organizationId?: string }) {
  const [subtab, setSubtab] = useState<"broadcast" | "inbox" | "newBroadcast">("broadcast");
  const [loading, setLoading] = useState(false);

  // Broadcasts history
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>(([] as any[]));

  // Unified Inquiries & Tickets
  const [tickets, setTickets] = useState<CommunicationTicket[]>(([] as any[]));

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    getSchoolAdminBroadcasts(organizationId)
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setBroadcasts(
            data.map((b: any) => ({
              id: b.id,
              title: b.title,
              message: b.message,
              audience: b.target_audience === "all" ? "Entire School" : (b.target_audience.charAt(0).toUpperCase() + b.target_audience.slice(1)),
              channels: b.channels || ["In-App"],
              sentAt: new Date(b.created_at).toLocaleDateString() + " " + new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sentBy: b.sender_name || "School Admin",
              deliveryStats: typeof b.delivery_stats === "object" && b.delivery_stats ? b.delivery_stats : { sent: b.recipient_count || 100, delivered: b.recipient_count || 100, failed: 0 },
            }))
          );
        }
      })
      .catch(() => {});

    getSchoolAdminTickets(organizationId)
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setTickets(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
      setBroadcasts(prev=>[{id:saved.id,title:saved.title,message:saved.message,audience:saved.target_audience,channels:saved.channels,sentAt:saved.created_at,sentBy:saved.sender_name,deliveryStats:saved.delivery_stats},...prev]);
      setBroadcastTitle('');setBroadcastBody('');setSubtab('broadcast');
      alert('Notice saved to the school noticeboard.');
    } catch (error) { console.error('Broadcast could not be saved:',error); }

  };

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2DDD5", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "broadcast", label: "Broadcast Dispatches" },
            { id: "inbox", label: "Unified Inquiries Inbox" },
            { id: "newBroadcast", label: "+ Compose Broadcast" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubtab(tab.id as any)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 750 : 600,
                background: subtab === tab.id ? "#064E3B" : "transparent",
                color: subtab === tab.id ? "#F8E7C9" : "#064E3B",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. BROADCAST DISPATCHES TAB */}
      {subtab === "broadcast" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Multi-Channel School Broadcast Center</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>In-App announcements, WhatsApp notifications, and SMS alerts dispatch ledger</p>
            </div>
            <button
              onClick={() => setSubtab("newBroadcast")}
              style={{ padding: "8px 16px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Send size={14} /> Compose Broadcast
            </button>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {broadcasts.map((b) => (
              <div key={b.id} style={{ padding: "16px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ background: "#ECFDF5", color: "#064E3B", padding: "2px 8px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700 }}>
                        Target: {b.audience}
                      </span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {b.channels.map((ch, idx) => (
                          <span key={idx} style={{ background: "#FDF9F0", border: "1px solid #E5CCA2", color: "#064E3B", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                    <b style={{ color: "#064E3B", fontSize: "15px" }}>{b.title}</b>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#334155", lineHeight: 1.4 }}>{b.message}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{b.sentAt}</span>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>by {b.sentBy}</div>
                  </div>
                </div>

                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #E2DDD5", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <span>Sent: <b>{b.deliveryStats.sent}</b></span>
                    <span style={{ color: "#064E3B" }}>Delivered: <b>{b.deliveryStats.delivered}</b></span>
                    <span style={{ color: b.deliveryStats.failed > 0 ? "#DC2626" : "var(--muted)" }}>Failed: <b>{b.deliveryStats.failed}</b></span>
                  </div>
                  <button style={{ background: "transparent", border: "none", color: "#064E3B", fontWeight: 700, fontSize: "11.5px", cursor: "pointer" }}>
                    Delivery Report ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. UNIFIED INBOX & TICKET TRIAGE */}
      {subtab === "inbox" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Unified Inquiries & Escalation Inbox</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Parent queries, transport reports, teacher requests and administrative escalations</p>

          <div style={{ display: "grid", gap: "10px" }}>
            {tickets.map((t) => (
              <div key={t.id} style={{ padding: "14px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700,
                      background: t.priority === "Urgent" ? "#FEE2E2" : t.priority === "High" ? "#FEF3C7" : "#ECFDF5",
                      color: t.priority === "Urgent" ? "#991B1B" : t.priority === "High" ? "#92400E" : "#064E3B",
                    }}>
                      {t.priority}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 650 }}>{t.senderRole}: <b>{t.senderName}</b></span>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>· {t.timestamp}</span>
                  </div>
                  <b style={{ fontSize: "14px", color: "#064E3B" }}>{t.subject}</b>
                  <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "#334155" }}>{t.snippet}</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "inline-block", background: t.status === "Open" ? "#FEF3C7" : "#ECFDF5", color: t.status === "Open" ? "#92400E" : "#064E3B", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>
                    {t.status}
                  </span>
                  <div>
                    <button style={{ padding: "4px 10px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
                      Reply & Triage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. COMPOSE BROADCAST FORM */}
      {subtab === "newBroadcast" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "22px", maxWidth: "700px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Compose Multi-Channel School Broadcast</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Send vital notifications across In-App Noticeboards, WhatsApp, SMS and Email</p>

          <form onSubmit={handleSendBroadcast} style={{ display: "grid", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#064E3B" }}>Target Audience</label>
              <select
                value={broadcastAudience}
                onChange={(e) => setBroadcastAudience(e.target.value as any)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2DDD5", marginTop: "4px", fontSize: "13px" }}
              >
                <option value="Parents">All parents</option>
                <option value="Students">All students</option>
                <option value="Teachers">All teachers</option>
                <option value="Staff">School staff</option>
                <option value="Entire School">Entire School Community (All)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#064E3B" }}>Broadcast Headline</label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Sports Meet 2026 - Schedule & Timing Circular"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2DDD5", marginTop: "4px", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#064E3B" }}>Announcement Details & Message</label>
              <textarea
                rows={4}
                required
                placeholder="Details of the announcement to be sent to parents and staff..."
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E2DDD5", marginTop: "4px", fontSize: "13px", resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#064E3B", display: "block", marginBottom: "6px" }}>Delivery Channels</label>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" checked={channels.inApp} onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })} />
                  In-App Noticeboard
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" checked={channels.whatsapp} onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })} />
                  WhatsApp Message
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" checked={channels.sms} onChange={(e) => setChannels({ ...channels, sms: e.target.checked })} />
                  SMS Gateway
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" checked={channels.email} onChange={(e) => setChannels({ ...channels, email: e.target.checked })} />
                  Email Digest
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="submit"
                style={{ padding: "10px 20px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Send size={15} /> Dispatch Broadcast Now
              </button>
              <button
                type="button"
                onClick={() => setSubtab("broadcast")}
                style={{ padding: "10px 16px", background: "#FAF8F5", border: "1px solid #E2DDD5", color: "#064E3B", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
