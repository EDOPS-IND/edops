"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { verifyResetToken, resetPassword } from "../edops-api";

export interface ResetPasswordScreenProps {
  token: string;
  onDone: () => void;
  onCancel: () => void;
}

export function ResetPasswordScreen({
  token,
  onDone,
  onCancel,
}: ResetPasswordScreenProps) {
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    verifyResetToken(token)
      .then((res) => {
        setTokenValid(true);
        setMaskedEmail(res.email);
      })
      .catch((err) => {
        setTokenValid(false);
        setVerifyError(
          err instanceof Error
            ? err.message
            : "This password reset link is invalid or has expired.",
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await resetPassword(token, newPassword);
      onDone();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reset password. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-white overflow-y-auto lg:overflow-hidden"
      style={{ fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif' }}
    >
      <section className="bg-[#020617] text-white flex flex-col justify-between p-6 sm:p-10 lg:p-20 xl:p-24 w-full lg:w-1/2 min-h-[220px] lg:min-h-screen lg:h-full lg:overflow-hidden shrink-0">
        <div className="block">
          <img
            src="/EDOPSLogo.png?v=4"
            alt="EDOPS"
            className="block"
            style={{
              height: "52px",
              width: "auto",
              maxWidth: "220px",
              objectFit: "contain",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
            }}
          />
          <span className="block text-sm font-medium mt-2 uppercase tracking-[0.1em] text-[#94a3b8]">
            Security Console
          </span>
        </div>

        <div className="my-8 sm:my-12 lg:my-auto">
          <h1 className="text-white text-3xl sm:text-5xl lg:text-[64px] xl:text-[72px] font-normal leading-tight lg:leading-none tracking-[-1px] lg:tracking-[-1.44px] m-0">
            Secure your
            <br className="hidden sm:inline" />
            account.
          </h1>
          <p className="mt-4 sm:mt-8 text-base sm:text-lg text-[#cbd5e1] max-w-[400px] leading-[1.4] mb-0">
            Choose a new, secure password to regain access to your dashboard.
          </p>
        </div>

        <div className="flex gap-8 text-sm text-[#94a3b8]">
          <span
            className="cursor-pointer transition-colors duration-200 hover:text-white"
            onClick={onCancel}
          >
            Back to Sign In
          </span>
        </div>
      </section>

      <section className="bg-white w-full lg:w-1/2 h-full lg:min-h-screen overflow-y-auto flex flex-col shrink-0">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 xl:p-24 min-h-max">
          <div className="w-full max-w-[420px] my-auto">
            {loading ? (
              <div className="text-center py-12">
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "3px solid #cbd5e1",
                    borderTopColor: "#0f172a",
                    borderRadius: "50%",
                    margin: "0 auto 16px auto",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p style={{ color: "#64748b", fontSize: "14px" }}>
                  Verifying password reset link...
                </p>
              </div>
            ) : !tokenValid ? (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                    fontSize: "20px",
                    fontWeight: "bold",
                  }}
                >
                  ✕
                </div>
                <h2
                  style={{
                    fontSize: "28px",
                    fontWeight: 400,
                    color: "#0f172a",
                    margin: "0 0 8px 0",
                  }}
                >
                  Link Expired or Invalid
                </h2>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                    lineHeight: "22px",
                    margin: "0 0 24px 0",
                  }}
                >
                  {verifyError ||
                    "This password reset token has expired or has already been used. Please request a new link."}
                </p>
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    width: "100%",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    padding: "14px 24px",
                    borderRadius: "32px",
                    border: "none",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div>
                <h2
                  style={{
                    fontSize: "40px",
                    fontWeight: 400,
                    color: "#0f172a",
                    lineHeight: 1.2,
                    letterSpacing: "-0.5px",
                    margin: "0 0 8px 0",
                  }}
                >
                  Set new password
                </h2>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    margin: "0 0 24px 0",
                  }}
                >
                  Resetting credentials for{" "}
                  <b style={{ color: "#0f172a" }}>{maskedEmail}</b>
                </p>

                <form
                  onSubmit={submit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {error && (
                    <div
                      style={{
                        color: "#dc2626",
                        fontSize: "13px",
                        padding: "12px 14px",
                        backgroundColor: "#fef2f2",
                        borderRadius: "6px",
                        border: "1px solid #fecaca",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#0f172a",
                      }}
                    >
                      New Password
                    </label>
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        style={{
                          width: "100%",
                          fontSize: "15px",
                          padding: "12px 40px 12px 14px",
                          borderRadius: "6px",
                          border: "1px solid #d9d9dd",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          padding: "4px",
                        }}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#0f172a",
                      }}
                    >
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
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

                  <button
                    type="submit"
                    disabled={busy}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      fontSize: "14px",
                      marginTop: "8px",
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      padding: "14px 24px",
                      borderRadius: "32px",
                      border: "none",
                      fontWeight: 500,
                      cursor: "pointer",
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    <span>
                      {busy ? "Updating..." : "Update password & sign in"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onCancel}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontWeight: 500,
                      fontSize: "14px",
                      cursor: "pointer",
                      textAlign: "center",
                      padding: 0,
                    }}
                  >
                    Cancel and return to sign in
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
