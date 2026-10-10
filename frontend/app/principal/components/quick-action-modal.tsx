"use client";

import React, { useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";

export function QuickActionModal({
  isOpen = false,
  actionType = "action",
  organizationId,
  onClose,
  onSubmit,
  onSuccess,
}: {
  isOpen?: boolean;
  actionType?: string;
  organizationId?: string;
  onClose: () => void;
  onSubmit?: (type: string, data: any) => Promise<void>;
  onSuccess?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [targetScope, setTargetScope] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (onSubmit) {
        await onSubmit(actionType, { title, targetScope, notes });
      } else if (organizationId) {
        const { triggerPrincipalAction } = await import("../../edops-api");
        await triggerPrincipalAction(organizationId, {
          actionType: actionType || "action",
          title,
          targetScope,
          notes,
        });
      }
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000);
    } catch {
      alert("Could not complete action. Please check your inputs.");
    } finally {
      setBusy(false);
    }
  };

  const getTitle = () => {
    switch (actionType) {
      case "plan": return "+ Create Annual Pedagogical Plan";
      case "action": return "+ Assign Academic Action Plan";
      case "observation": return "+ Record Teacher Classroom Observation";
      case "intervention": return "+ Create Student Academic Intervention Plan";
      case "ptm": return "+ Schedule Parent Teacher Meeting (PTM)";
      case "announcement": return "+ Create Academic Leadership Announcement";
      default: return "+ Principal Academic Quick Action";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}
    >
      <div
        className="modal-card"
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "540px",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>
            {getTitle()}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: "36px 24px", textAlign: "center" }}>
            <CheckCircle2 size={42} color="#16A34A" style={{ margin: "0 auto 12px" }} />
            <h4 style={{ margin: "0 0 6px", fontSize: "16px", color: "#1E293B" }}>Action Successfully Recorded</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>Principal record updated in school academic ledger.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                Title / Focus Objective *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Class 10 Mathematics Board Remedial Intervention"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                Target Class / Teacher / Faculty Lead *
              </label>
              <input
                type="text"
                required
                value={targetScope}
                onChange={(e) => setTargetScope(e.target.value)}
                placeholder="e.g. Grade 10-A (Faculty Lead: Rahul Sharma)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                Detailed Instructions & Action Items *
              </label>
              <textarea
                required
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter measurable goals, evidence base, target competencies and review deadlines..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "#FFFFFF", fontSize: "13px", fontWeight: 600, color: "#475569", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#064E3B",
                  color: "#F8E7C9",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: busy ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Send size={14} />
                {busy ? "Submitting..." : "Save Action"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
