"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getInvitationInfo, InvitationInfo, api } from "../edops-api";

export interface InviteScreenProps {
  signedIn: boolean;
  onDone: () => void;
}

export function InviteScreen({
  signedIn,
  onDone,
}: InviteScreenProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const initialToken =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("invite") ?? "")
      : "";
  const [token, setToken] = useState(initialToken);
  const [info, setInfo] = useState<InvitationInfo | null>(null);

  useEffect(() => {
    if (token && token.length === 64) {
      getInvitationInfo(token)
        .then(setInfo)
        .catch(() => setInfo(null));
    } else {
      setInfo(null);
    }
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const body: Record<string, string> = { token: token.trim() };
    if (!signedIn) body.password = String(data.get("password"));
    const specialty = String(data.get("specialty") || "").trim();
    if (specialty) body.specialty = specialty;
    try {
      await api("/auth/invitations/accept", { method: "POST", body });
      setSuccess(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Invitation could not be accepted",
      );
    } finally {
      setBusy(false);
    }
  }

  const roleLabel = (role?: string) => {
    switch (role) {
      case "school_admin":
        return "School Administrator";
      case "principal":
        return "Principal";
      case "teacher":
        return "Teacher";
      case "student":
        return "Student";
      case "parent":
        return "Parent";
      default:
        return role || "Member";
    }
  };

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
            Management Console
          </span>
        </div>

        <div className="my-8 sm:my-12 lg:my-auto">
          <h1 className="text-white text-3xl sm:text-5xl lg:text-[64px] xl:text-[72px] font-normal leading-tight lg:leading-none tracking-[-1px] lg:tracking-[-1.44px] m-0">
            Activate
            <br className="hidden sm:inline" />
            account.
          </h1>
          <p className="mt-4 sm:mt-8 text-base sm:text-lg text-[#cbd5e1] max-w-[400px] leading-[1.4] mb-0">
            Securely set your password to activate your school workspace.
          </p>
        </div>

        <div className="flex gap-8 text-sm text-[#94a3b8]">
          <span className="cursor-pointer transition-colors duration-200 hover:text-white">
            Documentation
          </span>
          <span className="cursor-pointer transition-colors duration-200 hover:text-white">
            Support
          </span>
        </div>
      </section>

      <section className="bg-white w-full lg:w-1/2 h-full lg:min-h-screen overflow-y-auto flex flex-col shrink-0">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 xl:p-24 min-h-max">
          <div className="w-full max-w-[420px] my-auto">
            {success ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <span className="text-green-600 text-3xl">✓</span>
                </div>
                <h2 className="mb-2 text-[48px] font-normal text-[#212121] leading-[1.2] tracking-[-0.48px] mt-0">
                  Invitation accepted
                </h2>
                <p className="mb-10 text-base text-[#75758a] leading-normal mt-0">
                  {signedIn
                    ? "Your school membership is ready. Refresh your dashboard to continue."
                    : "Your account is activated. Sign in with your email and new password."}
                </p>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 text-sm mt-4 bg-[#17171c] text-white px-6 py-[14px] rounded-[32px] font-medium border-none cursor-pointer hover:bg-[#000000] transition-colors"
                  onClick={onDone}
                >
                  Continue to sign in
                </button>
              </>
            ) : (
              <>
                <h2 className="mb-2 text-[40px] font-normal text-[#212121] leading-[1.2] tracking-[-0.48px] mt-0">
                  {info ? `Join ${info.schoolName}` : "Join EDOPS"}
                </h2>
                <p className="mb-6 text-sm text-[#75758a] leading-normal mt-0">
                  {info ? (
                    <span>
                      Role:{" "}
                      <strong className="text-slate-800">
                        {roleLabel(info.role)}
                      </strong>{" "}
                      · Account:{" "}
                      <strong className="text-slate-800">{info.email}</strong>
                    </span>
                  ) : signedIn ? (
                    "Paste the invitation token sent to your account."
                  ) : (
                    "Paste your invitation token and set a password."
                  )}
                </p>

                {info && (
                  <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col gap-1">
                    <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                      Invitation Verified
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {info.name || info.email}
                    </div>
                    <div className="text-xs text-slate-500">
                      {info.schoolName} ({roleLabel(info.role)})
                      {info.specialty ? ` · Subject: ${info.specialty}` : ""}
                    </div>
                  </div>
                )}

                <form className="flex flex-col gap-5" onSubmit={submit}>
                  {error && (
                    <div
                      className="text-red-500 text-sm p-3 bg-red-50 rounded border border-red-200"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  {!initialToken && (
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm text-[#212121] font-medium">
                        Invitation token
                      </label>
                      <input
                        name="token"
                        value={token}
                        onChange={(e) => setToken(e.target.value.trim())}
                        minLength={64}
                        maxLength={64}
                        required
                        placeholder="Paste 64-character token"
                        className="w-full text-base px-4 py-3 bg-white border border-[#d9d9dd] rounded text-[#212121] outline-none transition-shadow box-border focus:border-[#A0B6D9]"
                      />
                    </div>
                  )}

                  {!signedIn && (
                    <div className="flex flex-col gap-1.5">
                      <label className="block text-sm text-[#212121] font-medium">
                        Create password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          minLength={12}
                          maxLength={128}
                          required
                          placeholder="At least 12 characters"
                          autoComplete="new-password"
                          className="w-full text-base px-4 py-3 bg-white border border-[#d9d9dd] rounded text-[#212121] outline-none transition-shadow box-border pr-10 focus:border-[#A0B6D9]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="absolute right-2.5 bg-transparent border-none cursor-pointer text-[#64748b] flex items-center p-1"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      <span className="text-xs text-[#75758a]">
                        Minimum 12 characters
                      </span>
                    </div>
                  )}

                  {/* Specialty ONLY for teachers */}
                  {info?.role === "teacher" && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm text-[#212121] font-medium">
                          Subject Specialty
                        </label>
                        {info.specialty && (
                          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                            Assigned by Admin
                          </span>
                        )}
                      </div>
                      <input
                        name="specialty"
                        defaultValue={info.specialty || ""}
                        placeholder="e.g. Mathematics, Physics, Chemistry"
                        maxLength={100}
                        className="w-full text-base px-4 py-3 bg-white border border-[#d9d9dd] rounded text-[#212121] outline-none transition-shadow box-border focus:border-[#A0B6D9]"
                      />
                      {info.specialty ? (
                        <span className="text-xs text-[#75758a]">
                          Pre-filled from your invitation. You can keep or edit
                          it.
                        </span>
                      ) : (
                        <span className="text-xs text-[#75758a]">
                          e.g. Mathematics, Physics, English
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 text-sm mt-2 bg-[#17171c] px-6 py-[14px] rounded-[32px] font-medium border-none cursor-pointer hover:bg-[#000000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={busy}
                  >
                    <span className="text-white">
                      {busy ? "Activating..." : "Activate account"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="bg-transparent border-none text-black font-medium text-sm cursor-pointer text-center p-0 hover:text-[#212121] transition-colors"
                    onClick={onDone}
                  >
                    Back to sign in
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
