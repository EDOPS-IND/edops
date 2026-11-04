"use client";

import React, { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login, Profile } from "../edops-api";

export interface LoginScreenProps {
  onLogin: (profile: Profile) => void;
  onInvite: () => void;
  onForgotPassword: () => void;
  initialNotice?: string;
}

export function LoginScreen({
  onLogin,
  onInvite,
  onForgotPassword,
  initialNotice,
}: LoginScreenProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialNotice || "");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onLogin(await login(email, password));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in failed");
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
            Management Console
          </span>
        </div>

        <div className="my-8 sm:my-12 lg:my-auto">
          <h1 className="text-white text-3xl sm:text-5xl lg:text-[64px] xl:text-[72px] font-normal leading-tight lg:leading-none tracking-[-1px] lg:tracking-[-1.44px] m-0">
            Operate with
            <br className="hidden sm:inline" />
            clarity.
          </h1>
          <p className="mt-4 sm:mt-8 text-base sm:text-lg text-[#cbd5e1] max-w-[400px] leading-[1.4] mb-0">
            Centralized platform for managing schools, overseeing operations,
            and handling student-related activities.
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
            <h2 className="mb-2 text-3xl sm:text-[48px] font-normal text-[#212121] leading-[1.2] tracking-[-0.48px] mt-0">
              Sign in
            </h2>
            <p className="mb-6 sm:mb-8 text-sm sm:text-base text-[#75758a] leading-normal mt-0">
              Access the EDOPS enterprise dashboard.
            </p>

            <form className="flex flex-col gap-5" onSubmit={submit}>
              {error && (
                <div
                  className="text-red-500 text-sm p-3 bg-red-50 rounded border border-red-200"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="block text-sm text-[#212121] font-medium">
                  Email or Username
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student, parent, teacher, admin, or email"
                  className="w-full text-base px-4 py-3 bg-white border border-[#d9d9dd] rounded text-[#212121] outline-none transition-shadow box-border focus:border-[#A0B6D9]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="login-password" className="block text-sm text-[#212121] font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-xs text-[#64748b] hover:text-[#0f172a] bg-transparent border-none cursor-pointer underline font-medium p-0"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••••••••••"
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 text-sm mt-2 bg-[#17171c] px-6 py-[14px] rounded-[32px] font-medium border-none cursor-pointer hover:bg-[#000000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={busy}
              >
                <span className="text-white">
                  {busy ? "Signing in..." : "Sign in"}
                </span>
              </button>

              <button
                type="button"
                className="bg-transparent border-none text-black font-medium text-sm cursor-pointer text-center p-0 hover:text-[#212121] transition-colors"
                onClick={onInvite}
              >
                Accept an invitation
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
