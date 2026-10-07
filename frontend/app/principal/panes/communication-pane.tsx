"use client";

import React, { useState } from "react";
import { MessageSquare, Users, Send, CheckCircle2, Clock, AlertTriangle, Plus } from "lucide-react";

export function CommunicationPane({
  inbox = [],
  parentQueries = [],
  ptmSchedules = [],
  onResolveQuery,
  onTriggerAnnouncement,
}: {
  inbox?: any[];
  parentQueries?: any[];
  ptmSchedules?: any[];
  onResolveQuery: (queryId: string, status: string, notes: string) => Promise<void>;
  onTriggerAnnouncement: () => void;
}) {
  const [subTab, setSubTab] = useState<"inbox" | "parent_queries" | "ptm">("inbox");
  const [resolutionInput, setResolutionInput] = useState<{ [key: string]: string }>({});

  const handleResolve = async (id: string, status: string) => {
    const notes = resolutionInput[id] || "Resolved by Principal.";
    await onResolveQuery(id, status, notes);
    alert(`Parent query updated to ${status}.`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Sub navigation & Trigger Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "inbox", label: "Principal Inbox" },
            { id: "parent_queries", label: "Parent Academic Queries & Complaints" },
            { id: "ptm", label: "PTM Management & Academic Notes" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: subTab === t.id ? "#064E3B" : "#CBD5E1",
                background: subTab === t.id ? "#064E3B" : "#FFFFFF",
                color: subTab === t.id ? "#F8E7C9" : "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={onTriggerAnnouncement}
          style={{
            background: "#064E3B",
            color: "#F8E7C9",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Send size={15} /> + Academic Broadcast
        </button>
      </div>

      {/* 1. Principal Inbox Tab (Section 47) */}
      {subTab === "inbox" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {inbox.map((msg, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#1E40AF", background: "#EFF6FF", padding: "2px 6px", borderRadius: "4px" }}>
                      {msg.category}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>{msg.sender}</span>
                    {msg.isUrgent && (
                      <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                        URGENT
                      </span>
                    )}
                  </div>
                  <h4 style={{ margin: "6px 0 2px", fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{msg.subject}</h4>
                </div>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>{msg.date}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#475569" }}>{msg.preview}</p>
            </div>
          ))}
        </div>
      )}

      {/* 2. Parent Queries & Complaints Tab (Section 48) */}
      {subTab === "parent_queries" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {parentQueries.map((pq, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{pq.subject}</h4>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>
                    Parent: <b>{pq.parentName}</b> ({pq.parentEmail}) · Student: <b>{pq.studentName}</b> ({pq.classSection})
                  </span>
                </div>
                <span style={{ background: pq.status === "resolved" ? "#DCFCE7" : "#FEF3C7", color: pq.status === "resolved" ? "#166534" : "#92400E", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                  {pq.status}
                </span>
              </div>

              <div style={{ background: "#F8FAFC", padding: "12px", borderRadius: "8px", margin: "10px 0", fontSize: "13px", color: "#334155" }}>
                "{pq.queryText}"
              </div>

              {pq.resolutionNotes && (
                <div style={{ fontSize: "12px", color: "#065F46", marginBottom: "10px" }}>
                  <b>Resolution Notes:</b> {pq.resolutionNotes}
                </div>
              )}

              {pq.status !== "resolved" && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
                  <input
                    type="text"
                    placeholder="Enter resolution notes or instructions to HOD..."
                    value={resolutionInput[pq.id] || ""}
                    onChange={(e) => setResolutionInput({ ...resolutionInput, [pq.id]: e.target.value })}
                    style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                  <button
                    onClick={() => handleResolve(pq.id, "resolved")}
                    style={{ background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Mark Resolved
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. PTM Management Tab (Section 49) */}
      {subTab === "ptm" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {ptmSchedules.map((ptm, idx) => (
            <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{ptm.title}</h4>
                <span style={{ background: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                  {ptm.status}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div>Date & Time: <b>{ptm.date}</b> ({ptm.timing})</div>
                <div>Target Grades: <b>{ptm.targetGrades}</b></div>
                <div>Slot Booking: <b>{ptm.bookedSlots} / {ptm.totalSlots} slots confirmed</b></div>
                <div style={{ color: "#065F46", marginTop: "4px" }}>Key Agenda: {ptm.keyConcerns.join(" · ")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
