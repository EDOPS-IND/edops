"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Calendar, AlertCircle, FileText, UserCheck, X } from "lucide-react";

export interface LeaveItem {
  id: string;
  applicantName?: string;
  applicantRole?: "teacher" | "student" | string;
  applicantEmail?: string;
  detail?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string | null;
  reviewerName?: string | null;
}

export interface LeaveTableProps {
  leaves: LeaveItem[];
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  canApprove?: boolean;
  onAction?: (id: string, status: "approved" | "rejected", reviewNotes?: string) => Promise<void>;
  filterRole?: "teacher" | "student" | "all";
}

export function LeaveTable({
  leaves,
  title,
  subtitle,
  emptyTitle = "No leave requests",
  emptySubtitle = "New applications will appear here as soon as they are submitted.",
  canApprove = false,
  onAction,
}: LeaveTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);
  const [reviewNote, setReviewNote] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filteredLeaves = leaves.filter((l) => {
    if (filter === "all") return true;
    return (l.status || "").toLowerCase() === filter;
  });

  const handleOpenReview = (id: string, action: "approved" | "rejected") => {
    setSelectedId(id);
    setReviewAction(action);
    setReviewNote("");
  };

  const handleConfirmReview = async () => {
    if (!selectedId || !reviewAction || !onAction) return;
    setBusyId(selectedId);
    try {
      await onAction(selectedId, reviewAction, reviewNote.trim() || undefined);
      setSelectedId(null);
      setReviewAction(null);
      setReviewNote("");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
      {(title || subtitle) && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            {title && <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0c1e33" }}>{title}</h3>}
            {subtitle && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>{subtitle}</p>}
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {(["all", "pending", "approved", "rejected"] as const).map((st) => {
              const active = filter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilter(st)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: `1px solid ${active ? "#0c1e33" : "#e4e6e9"}`,
                    background: active ? "#0c1e33" : "#ffffff",
                    color: active ? "#ffffff" : "#475569",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filteredLeaves.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
          <FileText size={28} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>{emptyTitle}</p>
          <p style={{ margin: "4px 0 0", fontSize: "12px" }}>{emptySubtitle}</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Applicant</th>
                <th style={{ padding: "12px 16px" }}>Leave Details</th>
                <th style={{ padding: "12px 16px" }}>Duration</th>
                <th style={{ padding: "12px 16px" }}>Reason</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                {canApprove && <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((item) => {
                const isPending = (item.status || "").toLowerCase() === "pending";
                const isApproved = (item.status || "").toLowerCase() === "approved";
                const isRejected = (item.status || "").toLowerCase() === "rejected";

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background: item.applicantRole === "teacher" ? "#0c1e33" : "#0284c7",
                            color: "#ffffff",
                          }}
                        >
                          {item.applicantRole || "User"}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>
                            {item.applicantName || "Applicant"}
                          </div>
                          {item.detail && (
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{item.detail}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "#f1f5f9",
                          color: "#334155",
                          textTransform: "capitalize",
                        }}
                      >
                        {item.leaveType}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>
                        {item.startDate} → {item.endDate}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        <b style={{ color: item.daysCount > 2 ? "#b45309" : "#0c1e33" }}>
                          {item.daysCount} {item.daysCount === 1 ? "day" : "days"}
                        </b>
                        {item.daysCount > 2 && item.applicantRole === "student" && " (Principal Level)"}
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px", maxWidth: "240px" }}>
                      <div style={{ color: "#334155", fontSize: "12px", lineHeight: 1.4 }}>
                        {item.reason || "—"}
                      </div>
                      {item.reviewNotes && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>
                          Note: "{item.reviewNotes}" {item.reviewerName ? `(by ${item.reviewerName})` : ""}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fef3c7",
                          color: isApproved ? "#15803d" : isRejected ? "#991b1b" : "#b45309",
                          textTransform: "capitalize",
                        }}
                      >
                        {isApproved && <CheckCircle2 size={12} />}
                        {isRejected && <XCircle size={12} />}
                        {isPending && <Clock size={12} />}
                        {item.status}
                      </span>
                    </td>

                    {canApprove && (
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {isPending ? (
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => handleOpenReview(item.id, "approved")}
                              style={{
                                padding: "5px 12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#0c1e33",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => handleOpenReview(item.id, "rejected")}
                              style={{
                                padding: "5px 12px",
                                borderRadius: "6px",
                                border: "1px solid #fee2e2",
                                background: "#fff5f5",
                                color: "#991b1b",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Resolved</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Confirmation & Review Note Modal */}
      {selectedId && reviewAction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(11, 15, 25, 0.6)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#0c1e33" }}>
              {reviewAction === "approved" ? "Confirm Approval" : "Confirm Rejection"}
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#64748b" }}>
              Are you sure you want to mark this request as <b>{reviewAction}</b>? You can add an optional review note below.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Remarks / Decision Note (Optional)
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Approved. Syllabus coverage adjusted with substitution."
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                disabled={busyId === selectedId}
                onClick={() => {
                  setSelectedId(null);
                  setReviewAction(null);
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === selectedId}
                onClick={handleConfirmReview}
                style={{
                  padding: "7px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: reviewAction === "approved" ? "#0c1e33" : "#dc2626",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {busyId === selectedId ? "Processing..." : `Confirm ${reviewAction === "approved" ? "Approval" : "Rejection"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  applicantLabel?: string;
  availableTypes?: string[];
  onSubmit: (data: { leaveType: string; startDate: string; endDate: string; reason: string }) => Promise<void>;
}

export function ApplyLeaveModal({
  isOpen,
  onClose,
  title = "Apply for Leave",
  applicantLabel,
  availableTypes = ["casual", "medical", "personal", "emergency"],
  onSubmit,
}: ApplyLeaveModalProps) {
  const [leaveType, setLeaveType] = useState<string>(availableTypes[0] || "casual");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
    setReason("");
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate day count
  let daysCount = 0;
  if (startDate && endDate && endDate >= startDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    daysCount = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Please select valid start and end dates.");
      return;
    }
    if (endDate < startDate) {
      setError("End date cannot be prior to start date.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the leave application.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSubmit({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to submit leave application.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(11, 15, 25, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
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
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0c1e33", margin: 0 }}>
              {title}
            </h2>
            {applicantLabel && (
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
                {applicantLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          {error && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                color: "#991b1b",
                fontSize: "12px",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px", textTransform: "uppercase" }}>
              Leave Category
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                background: "#ffffff",
                boxSizing: "border-box",
                textTransform: "capitalize",
              }}
            >
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} Leave
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px", textTransform: "uppercase" }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px", textTransform: "uppercase" }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {daysCount > 0 && (
            <div
              style={{
                padding: "8px 12px",
                background: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                color: "#334155",
                marginBottom: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Calculated Leave Duration:</span>
              <b style={{ color: "#0c1e33" }}>{daysCount} {daysCount === 1 ? "day" : "days"}</b>
            </div>
          )}

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px", textTransform: "uppercase" }}>
              Reason for Absence
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain the reason for the leave application..."
              rows={3}
              required
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                color: "#475569",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                background: "#0c1e33",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {busy ? "Submitting..." : "Submit Leave Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
