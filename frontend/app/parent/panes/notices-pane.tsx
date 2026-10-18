"use client";

import React from "react";
import { WardInfo, ParentQuery } from "../types";
import { Bell, MessageSquare, Plus, CheckCircle2, Clock, Mail, ShieldAlert } from "lucide-react";

export function NoticesPane({
  selectedWard,
  queriesList,
  onOpenQueryModal,
}: {
  selectedWard: WardInfo;
  queriesList: ParentQuery[];
  onOpenQueryModal: () => void;
}) {
  const notices = selectedWard.data?.notices || [];
  const wardQueries = queriesList.filter((q) => q.studentUserId === selectedWard.studentUserId);

  const resolvedCount = wardQueries.filter((q) => q.status === "resolved").length;
  const pendingCount = wardQueries.filter((q) => q.status !== "resolved").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Mint */}
        <div
          style={{
            height: "148px",
            background: "#ccefbf",
            border: "1px solid #b2e49f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a5c0a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              School Circulars
            </span>
            <Bell size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{notices.length}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              Official Bulletins Published
            </div>
          </div>
        </div>

        {/* Card 2: Violet */}
        <div
          style={{
            height: "148px",
            background: "#e1d2ff",
            border: "1px solid #cdb5ff",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4a0e8f", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Inquiries Submitted
            </span>
            <MessageSquare size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{wardQueries.length}</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Parent Questions Logged
            </div>
          </div>
        </div>

        {/* Card 3: Sky */}
        <div
          style={{
            height: "148px",
            background: "#bae5f5",
            border: "1px solid #9ad7ef",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a5a7a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Resolved Inquiries
            </span>
            <CheckCircle2 size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{resolvedCount}</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Addressed by Administration
            </div>
          </div>
        </div>

        {/* Card 4: Peach */}
        <div
          style={{
            height: "148px",
            background: "#ffd8c7",
            border: "1px solid #ffbe9f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#782a00", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pending Response
            </span>
            <Clock size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>{pendingCount}</div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              Awaiting Principal Review
            </div>
          </div>
        </div>
      </div>

      {/* Official Circulars Feed */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
            Official Campus Notices & Circulars
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
            General broadcasts issued to parents and guardians.
          </p>
        </div>

        {notices.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
            No official circulars currently posted.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notices.map((n: any, idx: number) => (
              <div
                key={n.id || idx}
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        background: "#f1f5f9",
                        color: "#0c1e33",
                        textTransform: "uppercase",
                      }}
                    >
                      Circular
                    </span>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{n.subject}</h4>
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {n.date ? new Date(n.date).toLocaleDateString() : ""}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.5" }}>{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parent Inquiries & Grievances Table */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e4e6e9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
              Your Queries & Communication History
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
              Direct questions submitted by you regarding {selectedWard.name}.
            </p>
          </div>
          <button
            onClick={onOpenQueryModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#0c1e33",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Send Query to School
          </button>
        </div>

        {wardQueries.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
            You haven't submitted any inquiries yet. Click "Send Query to School" to get in touch.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Subject</th>
                  <th style={{ padding: "12px 16px" }}>Inquiry Details</th>
                  <th style={{ padding: "12px 16px" }}>School Response</th>
                  <th style={{ padding: "12px 16px" }}>Submitted Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {wardQueries.map((q) => {
                  const isResolved = q.status === "resolved";
                  return (
                    <tr
                      key={q.id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>
                        {q.subject}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569", maxWidth: "260px" }}>{q.queryText}</td>
                      <td style={{ padding: "12px 16px", color: q.response ? "#166534" : "#94a3b8", maxWidth: "260px" }}>
                        {q.response ? (
                          <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", padding: "6px 10px", borderRadius: "6px" }}>
                            {q.response}
                          </div>
                        ) : (
                          "Pending school review"
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b", whiteSpace: "nowrap" }}>
                        {q.submittedAt ? new Date(q.submittedAt).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: isResolved ? "#dcfce7" : "#fef3c7",
                            color: isResolved ? "#166534" : "#92400e",
                            textTransform: "capitalize",
                          }}
                        >
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
