"use client";

import React, { useState } from "react";
import { X, ExternalLink, CheckCircle2 } from "lucide-react";
import { SupportTicket, Announcement } from "./types";

export function TicketDetailsDrawer({
  ticket,
  onClose,
  onResolve,
}: {
  ticket: SupportTicket | null;
  onClose: () => void;
  onResolve?: (ticketId: string) => void;
}) {
  if (!ticket) return null;

  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(2px)",
          zIndex: 1100,
        }}
      />
      <aside
        role="dialog"
        aria-label="Ticket details drawer"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(480px, 94vw)",
          background: "#FFFFFF",
          boxShadow: "-12px 0 30px rgba(0, 0, 0, 0.15)",
          zIndex: 1101,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F9FAFB",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 800,
                fontSize: "13px",
                background: "#064E3B",
                color: "#F8E7C9",
                padding: "3px 8px",
                borderRadius: "4px",
                letterSpacing: "0.5px",
              }}
            >
              {ticket.ticketCode}
            </span>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                background: isResolved ? "#DEF7EC" : "#FEF3C7",
                color: isResolved ? "#03543F" : "#92400E",
              }}
            >
              {ticket.status.replace("_", " ")}
            </span>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                background: ticket.priority === "high" || ticket.priority === "urgent" ? "#FEE2E2" : "#F3F4F6",
                color: ticket.priority === "high" || ticket.priority === "urgent" ? "#991B1B" : "#4B5563",
              }}
            >
              {ticket.priority}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "grid", gap: "20px" }}>
          {/* Metadata Card */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              padding: "16px",
              background: "#F9FAFB",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              fontSize: "12.5px",
            }}
          >
            <div>
              <div style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>School</div>
              <div style={{ fontWeight: 700, color: "#111827", marginTop: "2px" }}>{ticket.schoolName}</div>
            </div>
            <div>
              <div style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>Category</div>
              <div style={{ fontWeight: 600, color: "#374151", marginTop: "2px", textTransform: "capitalize" }}>
                {ticket.category.replace("_", " ")}
              </div>
            </div>
            <div>
              <div style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>Submitted At</div>
              <div style={{ color: "#374151", marginTop: "2px" }}>
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
              </div>
            </div>
            <div>
              <div style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", fontWeight: 600 }}>Submitted By</div>
              <div style={{ color: "#374151", marginTop: "2px", wordBreak: "break-all" }}>
                {ticket.creatorEmail || "School Administrator"}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <div style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "6px" }}>
              Subject
            </div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", lineHeight: 1.4 }}>
              {ticket.subject}
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "6px" }}>
              Full Issue Description
            </div>
            <div
              style={{
                fontSize: "13px",
                lineHeight: "1.6",
                color: "#1F2937",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "16px",
                whiteSpace: "pre-wrap",
                minHeight: "130px",
              }}
            >
              {ticket.description || "No detailed description provided."}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            background: "#F9FAFB",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#374151",
            }}
          >
            Close
          </button>
          {!isResolved && onResolve && (
            <button
              onClick={() => onResolve(ticket.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 18px",
                background: "#064E3B",
                color: "#F8E7C9",
                border: "none",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <CheckCircle2 size={15} />
              Mark as Resolved
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

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
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* SUPPORT TICKETS TABLE */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>School Support Tickets</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Click on any ticket to view full description and issue details</p>
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
            {tickets.length > 0 ? (
              tickets.map(t => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    style={{
                      borderBottom: "1px solid #F3F4F6",
                      cursor: "pointer",
                      background: isSelected ? "#F0FDF4" : "transparent",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#F9FAFB";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#064E3B" }}>
                        {t.ticketCode}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 500 }}>{t.schoolName}</td>
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
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicketId(t.id);
                          }}
                          style={{ padding: "4px 8px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "4px", fontSize: "11px", fontWeight: 600, cursor: "pointer", color: "#374151" }}
                        >
                          View
                        </button>
                        {t.status !== "resolved" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolveTicket(t.id);
                            }}
                            style={{ padding: "4px 8px", background: "#FFF", border: "1px solid #D1D5DB", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
                  No open support tickets. All tenant inquiries resolved.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Details Drawer */}
      <TicketDetailsDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicketId(null)}
        onResolve={onResolveTicket}
      />

      {/* ANNOUNCEMENTS BROADCAST CENTER */}
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
          {announcements.length > 0 ? (
            announcements.map(a => (
              <div key={a.id} style={{ padding: "14px", border: "1px solid #E5E7EB", borderRadius: "8px", background: "#F9FAFB" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{a.title}</div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#10B981" }}>{(a.status || "published").toUpperCase()}</span>
                </div>
                <p style={{ margin: "6px 0", fontSize: "12.5px", color: "#4B5563" }}>{a.message}</p>
                <div style={{ fontSize: "11px", color: "#6B7280" }}>Target Audience: <b>{(a.audience || "all").toUpperCase()}</b> · Channels: {a.channels ? a.channels.join(", ") : "dashboard"}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#6B7280", background: "#F9FAFB", borderRadius: "8px", border: "1px dashed #E5E7EB" }}>
              No platform broadcasts published yet. Use &ldquo;+ Create Announcement&rdquo; to notify school tenants.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
