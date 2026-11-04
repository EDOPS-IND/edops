"use client";

import React, { useState, FormEvent } from "react";
import { forgotPassword } from "../edops-api";

export interface ForgotPasswordModalProps {
  onClose: () => void;
  onSent: () => void;
}

export function ForgotPasswordModal({
  onClose,
  onSent,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
      onSent();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to request password reset",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "440px",
          width: "100%",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#64748b",
          }}
          aria-label="Close"
        >
          ×
        </button>

        {sent ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#ecfdf5",
                color: "#059669",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
                fontSize: "22px",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: 500,
                color: "#0f172a",
                margin: "0 0 8px 0",
              }}
            >
              Check your email
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
                lineHeight: "22px",
                margin: "0 0 24px 0",
              }}
            >
              We have dispatched a password reset link to <b>{email}</b> via
              Brevo. The link is valid for 30 minutes.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "32px",
                border: "none",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <div>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: 500,
                color: "#0f172a",
                margin: "0 0 8px 0",
              }}
            >
              Forgot password
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
                lineHeight: "20px",
                margin: "0 0 20px 0",
              }}
            >
              Enter your account email below. We'll send you a secure link via
              Brevo to reset your password.
            </p>

            <form
              onSubmit={submit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {error && (
                <div
                  style={{
                    color: "#ef4444",
                    fontSize: "13px",
                    padding: "10px 14px",
                    backgroundColor: "#fef2f2",
                    borderRadius: "6px",
                    border: "1px solid #fecaca",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#0f172a",
                  }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  style={{
                    width: "100%",
                    fontSize: "15px",
                    padding: "12px 14px",
                    borderRadius: "6px",
                    border: "1px solid #d9d9dd",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    padding: "12px 16px",
                    borderRadius: "32px",
                    border: "none",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    flex: 1,
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    padding: "12px 16px",
                    borderRadius: "32px",
                    border: "none",
                    fontWeight: 500,
                    cursor: "pointer",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {busy ? "Sending..." : "Send reset link"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
