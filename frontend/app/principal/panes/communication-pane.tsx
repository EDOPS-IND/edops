"use client";

import React, { useState } from "react";
import { MessageSquare, Users, Send, CheckCircle2, Clock, AlertTriangle, Plus } from "lucide-react";
import { UnifiedCommunicationHub } from "../../components/notice-board";

export function CommunicationPane({
  inbox = [],
  parentQueries = [],
  ptmSchedules = [],
  onResolveQuery,
  onTriggerAnnouncement,
  organizationId,
  initialTab,
  onTabChange,
}: {
  inbox?: any[];
  parentQueries?: any[];
  ptmSchedules?: any[];
  onResolveQuery?: (queryId: string, status: string, notes: string) => Promise<void>;
  onTriggerAnnouncement?: () => void;
  organizationId?: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const [liveData, setLiveData] = useState<any>(null);
  const [subTab, setSubTab] = useState<"inbox" | "parent_queries" | "ptm">((initialTab as any) || "inbox");
  const [resolutionInput, setResolutionInput] = useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (initialTab) {
      setSubTab(initialTab as any);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (!organizationId) return;
    import("../../edops-api").then(({ getPrincipalCommunication }) => {
      getPrincipalCommunication(organizationId)
        .then((data) => setLiveData(data))
        .catch(() => null);
    });
  }, [organizationId]);

  const inboxList = (liveData?.inbox && liveData.inbox.length > 0) ? liveData.inbox : inbox;
  const queryList = (liveData?.parentQueries && liveData.parentQueries.length > 0) ? liveData.parentQueries : parentQueries;
  const ptmList = (liveData?.ptmSchedules && liveData.ptmSchedules.length > 0) ? liveData.ptmSchedules : ptmSchedules;


  const handleResolve = async (id: string, status: string) => {
    const notes = resolutionInput[id] || "Resolved by Principal.";
    await onResolveQuery?.(id, status, notes);
    alert(`Parent query updated to ${status}.`);
  };

  const resolvedQueriesCount = queryList.filter((q: any) => q.status === "resolved").length;
  const urgentMessagesCount = inboxList.filter((m: any) => m.isUrgent).length;

  if (organizationId) return <UnifiedCommunicationHub organizationId={organizationId} role="principal" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header & Broadcast Trigger */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MessageSquare size={22} color="#0c1e33" />
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0c1e33", margin: 0 }}>
              Institutional Communication & Parent Relations
            </h2>
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0" }}>
            Administrative inbox, parent grievance resolutions, circular broadcasts, and PTM slot oversight
          </p>
        </div>

        <button
          onClick={onTriggerAnnouncement}
          style={{
            background: "#0c1e33",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "12px",
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

      {/* 4 Standard Pastel KPI Cards (strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Mint - Grievance Resolutions */}
        <div
          style={{
            height: "148px",
            background: "#ccefbf",
            border: "1px solid #b2e49f",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1a5c0a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Resolved Inquiries
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1a5c0a", marginTop: "4px" }}>
              {resolvedQueriesCount} / {queryList.length || 0}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#23720e", fontWeight: 500 }}>
            {queryList.length > 0 ? `${Math.round((resolvedQueriesCount / queryList.length) * 100)}% resolution SLA` : "All queries resolved"}
          </div>
        </div>

        {/* Card 2: Sky - Active Messages */}
        <div
          style={{
            height: "148px",
            background: "#bae5f5",
            border: "1px solid #9ad7ef",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#0a5a7a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Principal Inbox
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0a5a7a", marginTop: "4px" }}>
              {inboxList.length || 0}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#0d6f96", fontWeight: 500 }}>
            Official memos and faculty reports
          </div>
        </div>

        {/* Card 3: Violet - PTM Scheduled */}
        <div
          style={{
            height: "148px",
            background: "#e1d2ff",
            border: "1px solid #cdb5ff",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#4a0e8f", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              PTM Sessions
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#4a0e8f", marginTop: "4px" }}>
              {ptmList.length || 0}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#5b14ae", fontWeight: 500 }}>
            Parent-Teacher conference calendar
          </div>
        </div>

        {/* Card 4: Peach - Escalated Directives */}
        <div
          style={{
            height: "148px",
            background: "#ffd8c7",
            border: "1px solid #ffbe9f",
            borderRadius: "10px",
            padding: "20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#782a00", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Urgent Priority
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#782a00", marginTop: "4px" }}>
              {urgentMessagesCount}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#923402", fontWeight: 500 }}>
            Flagged for immediate response
          </div>
        </div>
      </div>

      {/* Sub navigation Switcher */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {[
          { id: "inbox", label: "Principal Inbox" },
          { id: "parent_queries", label: "Parent Academic Queries & Complaints" },
          { id: "ptm", label: "PTM Management & Academic Notes" },
        ].map((t) => {
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setSubTab(t.id as any);
                onTabChange?.(t.id);
              }}
              style={{
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                height: "34px",
                padding: "0 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: isActive ? 600 : 500,
                background: isActive ? "#0C1E33" : "#F4F6F8",
                color: isActive ? "#FFFFFF" : "#5A6B7D",
                border: isActive ? "1px solid #0C1E33" : "1px solid #E2E8F0",
                boxShadow: isActive ? "0 2px 4px rgba(12, 30, 51, 0.14)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 1. Principal Inbox Tab (Section 47) */}
      {subTab === "inbox" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {inboxList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#64748B", fontSize: "13px" }}>No messages in principal inbox.</div>
          ) : (
            inboxList.map((msg: any, idx: number) => (
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
            ))
          )}
        </div>
      )}

      {/* 2. Parent Queries & Complaints Tab (Section 48) */}
      {subTab === "parent_queries" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {queryList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#64748B", fontSize: "13px" }}>No pending parent academic queries.</div>
          ) : (
            queryList.map((pq: any, idx: number) => (
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
                <p style={{ margin: "6px 0 12px", fontSize: "13px", color: "#334155" }}>{pq.details}</p>

                {pq.status !== "resolved" && (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Add principal resolution notes..."
                      value={resolutionInput[pq.id] || ""}
                      onChange={(e) => setResolutionInput({ ...resolutionInput, [pq.id]: e.target.value })}
                      style={{ flex: 1, padding: "6px 12px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12px" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleResolve(pq.id, "resolved")}
                      style={{ background: "#0c1e33", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Resolve & Close
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. PTM Schedules Tab */}
      {subTab === "ptm" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {ptmList.length === 0 ? (
            <div style={{ textAlign: "center", gridColumn: "1 / -1", padding: "24px 0", color: "#64748B", fontSize: "13px" }}>No PTM meetings scheduled today.</div>
          ) : (
            ptmList.map((ptm: any, idx: number) => (
              <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>{ptm.title || "PTM Session"}</h4>
                  <span style={{ background: "#DCFCE7", color: "#166534", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                    {ptm.status || "Scheduled"}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>Date: <b>{ptm.date}</b> {ptm.timing ? `(${ptm.timing})` : ''}</div>
                  {ptm.targetGrades && <div>Target Grades: <b>{ptm.targetGrades}</b></div>}
                  {ptm.bookedSlots && <div>Slot Booking: <b>{ptm.bookedSlots} / {ptm.totalSlots} slots confirmed</b></div>}
                  {ptm.keyConcerns && <div style={{ color: "#065F46", marginTop: "4px" }}>Key Agenda: {Array.isArray(ptm.keyConcerns) ? ptm.keyConcerns.join(" · ") : ptm.keyConcerns}</div>}
                  {ptm.agenda && <div style={{ color: "#065F46", marginTop: "4px" }}>Agenda: {ptm.agenda}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
