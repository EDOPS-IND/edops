"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Calendar, Megaphone, Check } from "lucide-react";
import { declareSchoolHoliday } from "@/app/api/school-admin";
import { toDDMMYYYY } from "./school-calendar-grid";

interface EmergencyHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  initialDate?: string;
  academicYearId?: string;
  onSuccess?: () => void;
}

export function EmergencyHolidayModal({
  isOpen,
  onClose,
  organizationId,
  initialDate,
  academicYearId,
  onSuccess,
}: EmergencyHolidayModalProps) {
  const [date, setDate] = useState<string>(initialDate || new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState<string>("");
  const [holidayType, setHolidayType] = useState<"adhoc_emergency" | "gazetted" | "vacation">("adhoc_emergency");
  const [notes, setNotes] = useState<string>("");
  const [broadcastNotice, setBroadcastNotice] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter an official closure reason or holiday title");
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      await declareSchoolHoliday(organizationId, {
        date,
        title: title.trim(),
        holidayType,
        isAdhoc: holidayType === "adhoc_emergency",
        notes: notes.trim(),
        broadcastNotice,
        academicYearId,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to declare holiday / emergency off day");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(12, 30, 51, 0.55)",
        backdropFilter: "blur(2px)",
        padding: "16px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 20px 40px rgba(12, 30, 51, 0.2)",
          border: "1px solid #e4e6e9",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid #e4e6e9",
            background: "#fff1f2",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#ffe4e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#be123c",
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#9f1239" }}>
                Declare School Holiday / Closure
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#be123c" }}>
                Excluded from attendance denominator so no student is penalized.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9f1239" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {errorMsg && (
            <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#9f1239", padding: "10px 14px", borderRadius: "8px", fontSize: "12.5px" }}>
              {errorMsg}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#0c1e33", marginBottom: "4px" }}>
              Effective Closure Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ced8e5",
                fontSize: "13px",
                color: "#0c1e33",
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
              Date format: <b>{toDDMMYYYY(date)}</b> (DD-MM-YYYY)
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#0c1e33", marginBottom: "4px" }}>
              Closure Category
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setHolidayType("adhoc_emergency")}
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${holidayType === "adhoc_emergency" ? "#be123c" : "#ced8e5"}`,
                  background: holidayType === "adhoc_emergency" ? "#fff1f2" : "#f8fafc",
                  color: holidayType === "adhoc_emergency" ? "#9f1239" : "#495d72",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🚨 Emergency Ad-Hoc Off
              </button>
              <button
                type="button"
                onClick={() => setHolidayType("gazetted")}
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${holidayType === "gazetted" ? "#0c1e33" : "#ced8e5"}`,
                  background: holidayType === "gazetted" ? "#f1f5f9" : "#f8fafc",
                  color: holidayType === "gazetted" ? "#0c1e33" : "#495d72",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📅 Gazetted Public Holiday
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#0c1e33", marginBottom: "4px" }}>
              Official Title / Order Reason *
            </label>
            <input
              type="text"
              placeholder="e.g. DM Cold Wave Alert / Red Alert Heavy Rainfall / Diwali"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ced8e5",
                fontSize: "13px",
                color: "#0c1e33",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#0c1e33", marginBottom: "4px" }}>
              Administrative Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. As per District Magistrate Order No. 2026/ED/410, physical classes suspended."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ced8e5",
                fontSize: "12.5px",
                color: "#0c1e33",
                boxSizing: "border-box",
                resize: "none",
              }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12.5px", color: "#0c1e33", marginTop: "2px" }}>
            <input
              type="checkbox"
              checked={broadcastNotice}
              onChange={(e) => setBroadcastNotice(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span style={{ fontWeight: 600 }}>
              Instantly broadcast emergency notification to Teachers, Students &amp; Parents
            </span>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #ced8e5",
                background: "#ffffff",
                color: "#495d72",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "8px 18px",
                borderRadius: "6px",
                border: "none",
                background: holidayType === "adhoc_emergency" ? "#be123c" : "#0c1e33",
                color: "#ffffff",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Publishing..." : "Declare & Exclude from Attendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
