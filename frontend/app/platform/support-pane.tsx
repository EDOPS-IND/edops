"use client";

import { SupportTicket, Announcement } from "./types";

export function SupportPane({
  tickets,
  announcements,
  onOpenTicketModal,
  onOpenAnnouncementModal,
  onResolveTicket
}: {
  tickets: SupportTicket[];
  announcements: Announcement[];
  onOpenTicketModal: () => void;
  onOpenAnnouncementModal: () => void;
  onResolveTicket: (ticketId: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* SUPPORT TICKETS TABLE */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>School Support Tickets</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Triage issues submitted by school administrators and staff</p>
          </div>
          <button
            onClick={onOpenTicketModal}
            style={{ padding: "6px 14px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
          >
            + New Ticket
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left", color: "#4B5563" }}>
              <th style={{ padding: "8px" }}>Ticket Code</th>
              <th style={{ padding: "8px" }}>School</th>
              <th style={{ padding: "8px" }}>Subject</th>
              <th style={{ padding: "8px" }}>Priority</th>
              <th style={{ padding: "8px" }}>Status</th>
              <th style={{ padding: "8px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px 8px" }}><b>{t.ticketCode}</b></td>
                <td style={{ padding: "10px 8px" }}>{t.schoolName}</td>
                <td style={{ padding: "10px 8px" }}>{t.subject}</td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{
                    padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                    background: t.priority === "high" || t.priority === "urgent" ? "#FEE2E2" : "#FEF3C7",
                    color: t.priority === "high" || t.priority === "urgent" ? "#991B1B" : "#92400E"
                  }}>
                    {t.priority}
                  </span>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{
                    padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                    background: t.status === "resolved" || t.status === "closed" ? "#DEF7EC" : "#FDF9F0",
                    color: t.status === "resolved" || t.status === "closed" ? "#03543F" : "#064E3B"
                  }}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
                <td style={{ padding: "10px 8px", textAlign: "right" }}>
                  {t.status !== "resolved" && (
                    <button
                      onClick={() => onResolveTicket(t.id)}
                      style={{ padding: "4px 8px", background: "#FFF", border: "1px solid #D1D5DB", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ANNOUNCEMENTS BROADCAST CENTER (§25) */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Platform Announcements & Broadcasts</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Broadcast notifications across all schools or selected plans</p>
          </div>
          <button
            onClick={onOpenAnnouncementModal}
            style={{ padding: "6px 14px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
          >
            + Create Announcement
          </button>
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          {announcements.map(a => (
            <div key={a.id} style={{ padding: "14px", border: "1px solid #E5E7EB", borderRadius: "8px", background: "#F9FAFB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{a.title}</div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#10B981" }}>{a.status.toUpperCase()}</span>
              </div>
              <p style={{ margin: "6px 0", fontSize: "12.5px", color: "#4B5563" }}>{a.message}</p>
              <div style={{ fontSize: "11px", color: "#6B7280" }}>Target Audience: <b>{a.audience.toUpperCase()}</b> · Channels: {a.channels.join(", ")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
