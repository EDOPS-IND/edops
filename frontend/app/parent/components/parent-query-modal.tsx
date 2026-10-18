"use client";

import React, { useState } from "react";
import { WardInfo, ParentQuery } from "../types";
import { MessageSquare, X } from "lucide-react";

export function ParentQueryModal({
  isOpen,
  onClose,
  selectedWard,
  onSubmitQuery,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedWard: WardInfo;
  onSubmitQuery: (data: Pick<ParentQuery, "subject" | "queryText">) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
              Send Query to School
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#64748b" }}>
              Direct communication regarding <b>{selectedWard.name}</b>
            </p>
          </div>
          <button
            type="button"
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
              await onSubmitQuery({
                subject: String(form.get("subject")),
                queryText: String(form.get("query")),
              });
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to send inquiry");
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
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Subject / Topic *
            </label>
            <input
              name="subject"
              required
              maxLength={100}
              placeholder="e.g. Clarification regarding Mathematics syllabus pace"
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
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
              Query / Concern Details *
            </label>
            <textarea
              name="query"
              required
              rows={4}
              maxLength={8000}
              placeholder="Detail your question, feedback, or grievance for the administration or academic faculty..."
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
              {busy ? "Sending…" : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
