"use client";

import React, { useState } from "react";
import { WardInfo } from "../types";
import { bookParentPtm, cancelParentPtm, getStudentAvatarUrl } from "../../edops-api";
import { CalendarDays, Clock, Users, CheckCircle2, Calendar, AlertCircle } from "lucide-react";

export function PtmPane({ selectedWard }: { selectedWard: WardInfo }) {
  const [scheduleId, setScheduleId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [slotIndex, setSlotIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const schedules = selectedWard.data?.schedules || [];
  const teachers = selectedWard.data?.subjects || [];
  const bookings = selectedWard.data?.bookings || [];

  const selected = schedules.find((s: any) => s.id === scheduleId);
  const minutes = (v: string) => {
    const m = v?.match(/^(\d{1,2}):(\d{2})$/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
  };
  const count =
    selected && selected.duration > 0
      ? Math.max(0, Math.floor((minutes(selected.endTime) - minutes(selected.startTime)) / selected.duration))
      : 0;
  const time = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  const save = async (task: () => Promise<any>) => {
    setBusy(true);
    setError("");
    try {
      await task();
      await selectedWard.refresh?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save meeting booking");
    } finally {
      setBusy(false);
    }
  };

  const confirmedCount = bookings.filter((b: any) => b.status === "confirmed").length;

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
              Open PTM Sessions
            </span>
            <CalendarDays size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>{schedules.length}</div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              Scheduled Conference Days
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
              Your Bookings
            </span>
            <CheckCircle2 size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>{confirmedCount}</div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Confirmed Teacher Consultations
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
              Subject Teachers
            </span>
            <Users size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>{teachers.length}</div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              Eligible Faculty for Meetings
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
              Upcoming Consultation
            </span>
            <Clock size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>
              {bookings.length > 0 ? bookings[0].date : "None"}
            </div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              {bookings.length > 0 ? `With ${bookings[0].teacherName}` : "Book a slot below"}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            color: "#991b1b",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* PTM Slot Scheduling Booking Box */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
          Schedule a Parent-Teacher Consultation
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "11px", color: "#64748b" }}>
          Reserve a direct 1-on-1 meeting slot with your ward's subject educators to review learning progress.
        </p>

        {!schedules.length ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
            No open parent-teacher meeting schedules currently configured by the administration.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save(() =>
                bookParentPtm(selectedWard.organizationId!, selectedWard.studentUserId, {
                  scheduleId,
                  teacherId,
                  slotIndex,
                  notes,
                })
              );
            }}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Select Conference Event *
                </label>
                <select
                  required
                  value={scheduleId}
                  onChange={(e) => {
                    setScheduleId(e.target.value);
                    setSlotIndex(0);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    background: "#ffffff",
                  }}
                >
                  <option value="">Choose PTM event</option>
                  {schedules.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.title} • {s.date}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Select Faculty Educator *
                </label>
                <select
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    background: "#ffffff",
                  }}
                >
                  <option value="">Choose teacher</option>
                  {teachers.map((t: any) => (
                    <option key={t.id} value={t.teacherId}>
                      {t.teacher} • {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selected && count > 0 && (
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Select Time Slot ({selected.duration} minutes) *
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {Array.from({ length: count }, (_, i) => {
                    const slotStart = time(minutes(selected.startTime) + selected.duration * i);
                    const slotEnd = time(minutes(selected.startTime) + selected.duration * (i + 1));
                    const isSelected = slotIndex === i;
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setSlotIndex(i)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid",
                          borderColor: isSelected ? "#0c1e33" : "#e4e6e9",
                          background: isSelected ? "#0c1e33" : "#f8fafc",
                          color: isSelected ? "#ffffff" : "#334155",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {slotStart} – {slotEnd}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Notes / Agenda for Teacher (Optional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Focus discussion on chemistry midterm questions and homework pace"
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
              <button
                type="submit"
                disabled={busy || !count || !scheduleId || !teacherId}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: busy || !count || !scheduleId || !teacherId ? "#cbd5e1" : "#0c1e33",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: busy || !count || !scheduleId || !teacherId ? "not-allowed" : "pointer",
                }}
              >
                {busy ? "Booking Consultation…" : "Book Meeting Slot"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Your Confirmed Consultations List */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
            Your Confirmed PTM Bookings
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
            Scheduled conference meetings with faculty.
          </p>
        </div>

        {bookings.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
            No consultation meetings currently booked.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {bookings.map((b: any) => (
              <div
                key={b.id}
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img
                    src={getStudentAvatarUrl(b.teacherName, b.teacherId)}
                    alt=""
                    style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#eaedf2" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>
                      {b.title} • {b.teacherName}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      Date: <b>{b.date}</b> • Slot #{b.slotIndex + 1}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: b.status === "confirmed" ? "#dcfce7" : "#fee2e2",
                      color: b.status === "confirmed" ? "#166534" : "#991b1b",
                      textTransform: "capitalize",
                    }}
                  >
                    {b.status}
                  </span>

                  {b.status === "confirmed" && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        save(() => cancelParentPtm(selectedWard.organizationId!, selectedWard.studentUserId, b.id))
                      }
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid #fee2e2",
                        background: "#ffffff",
                        color: "#dc2626",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
