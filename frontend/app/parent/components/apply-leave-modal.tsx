"use client";

import React, { useState, useEffect } from "react";
import { WardInfo, LeaveApplication } from "../types";
import { Calendar, X } from "lucide-react";

export function ApplyLeaveModal({
  isOpen,
  onClose,
  selectedWard,
  onApplyLeave,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedWard: WardInfo;
  onApplyLeave: (data: Pick<LeaveApplication, "leaveType" | "startDate" | "endDate" | "reason">) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
          maxWidth: "480px",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
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
              Apply Student Leave
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
              Leave application for <b>{selectedWard.name}</b> ({selectedWard.sectionName || "Enrolled"})
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              await onApplyLeave({
                leaveType: String(form.get("type")),
                startDate: String(form.get("start")),
                endDate: String(form.get("end")),
                reason: String(form.get("reason")),
              });
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to submit leave application");
            } finally {
              setBusy(false);
            }
          }}
          style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          {error && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                color: "#991b1b",
                fontSize: "12px",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="leave-type" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Leave Type *
            </label>
            <select
              id="leave-type"
              name="type"
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                background: "#ffffff",
              }}
            >
              <option value="Medical Leave">Medical / Sick Leave</option>
              <option value="Family Function">Family Event / Function</option>
              <option value="Urgent Personal">Urgent Personal Matter</option>
              <option value="Academic Olympiad">External Competition / Olympiad</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="leave-start" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Start Date *
              </label>
              <input
                id="leave-start"
                name="start"
                type="date"
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                }}
              />
            </div>
            <div>
              <label htmlFor="leave-end" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                End Date *
              </label>
              <input
                id="leave-end"
                name="end"
                type="date"
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="leave-reason" style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Reason for Absence *
            </label>
            <textarea
              id="leave-reason"
              name="reason"
              required
              rows={3}
              maxLength={4000}
              placeholder="State the detailed reason for absence to be reviewed by the school..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "10px",
              paddingTop: "14px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #e4e6e9",
                background: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                color: "#475569",
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
                borderRadius: "8px",
                border: "none",
                background: "#0c1e33",
                fontSize: "12px",
                fontWeight: 600,
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              {busy ? "Submitting…" : "Submit Leave Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
