"use client";

import React, { useEffect, useState, type FormEvent } from "react";
import { UniversalTimetable } from "../../components/universal-timetable";
import { Users, AlertTriangle, CheckCircle2, X } from "lucide-react";
import {
  getPrincipalTimetable,
  getPrincipalSubstituteSuggestions,
  assignPrincipalSubstitute,
} from "../../edops-api";
import { TableSkeletonRows } from "../components/skeleton-rows";

interface TimetablePaneProps {
  organizationId: string;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export function TimetablePane({
  organizationId,
  initialTab = "academic",
  onTabChange,
}: TimetablePaneProps) {
  // Substitutions & Uncovered State
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [uncovered, setUncovered] = useState<any[]>([]);
  const [subFormOpen, setSubFormOpen] = useState(false);
  const [subForm, setSubForm] = useState({
    timetableEntryId: "",
    eventDate: "",
    substituteTeacherUserId: "",
    impactNote: "",
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [savingSub, setSavingSub] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const loadSubstitutions = async () => {
    if (!organizationId) return;
    setLoadingSubs(true);
    try {
      const data = await getPrincipalTimetable(organizationId);
      if (data?.substitutions) setSubstitutions(data.substitutions);
      if (data?.uncovered) setUncovered(data.uncovered);
    } catch {
      // gracefully handled
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    loadSubstitutions();
  }, [organizationId]);

  const openSubstituteModal = async (timetableEntryId: string, eventDate: string) => {
    setSubForm({
      timetableEntryId,
      eventDate,
      substituteTeacherUserId: "",
      impactNote: "",
    });
    setSuggestions([]);
    setSubFormOpen(true);

    try {
      const available = await getPrincipalSubstituteSuggestions(organizationId, timetableEntryId, eventDate);
      setSuggestions(available || []);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSaveSubstitute = async (e: FormEvent) => {
    e.preventDefault();
    if (!organizationId || !subForm.substituteTeacherUserId) return;
    setSavingSub(true);
    try {
      await assignPrincipalSubstitute(organizationId, subForm);
      setSubFormOpen(false);
      loadSubstitutions();
    } catch (err: any) {
      alert(err?.message || "Failed to assign substitute teacher");
    } finally {
      setSavingSub(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "24px", width: "100%" }}>
      {/* 1. Main Master Timetable (Matches School Admin, Teacher & Student format exactly) */}
      <UniversalTimetable
        organizationId={organizationId}
        role="principal"
        activeViewMode={initialTab === "teacher" || initialTab === "room" ? initialTab : "class"}
        onViewModeChange={onTabChange}
      />

      {/* 2. Principal Faculty Cover & Substitute Desk */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
          padding: "clamp(16px, 3vw, 22px)",
          display: "grid",
          gap: "18px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0C1E33", display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} color="#0C1E33" />
              Faculty Absence Coverage &amp; Substitutions
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748B" }}>
              Monitor teacher leave periods and assign certified substitute faculty without timetable disruption.
            </p>
          </div>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              background: uncovered.length > 0 ? "#FEE2E2" : "#DCFCE7",
              color: uncovered.length > 0 ? "#DC2626" : "#166534",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {uncovered.length > 0 ? `${uncovered.length} Uncovered Periods` : "All Periods Covered"}
          </span>
        </div>

        {/* Uncovered Periods Table */}
        {uncovered.length > 0 && (
          <div style={{ borderRadius: "8px", border: "1px solid #FCA5A5", overflowX: "auto", background: "#FEF2F2" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #FCA5A5", background: "#FEE2E2" }}>
              <b style={{ fontSize: "13px", color: "#991B1B" }}>Action Required: Uncovered Leave Periods</b>
            </div>
            <table style={{ width: "100%", minWidth: "650px", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#FEF2F2", color: "#991B1B", fontWeight: 700, borderBottom: "1px solid #FCA5A5" }}>
                  <th style={{ padding: "10px 14px" }}>Date</th>
                  <th style={{ padding: "10px 14px" }}>Period</th>
                  <th style={{ padding: "10px 14px" }}>Class &amp; Subject</th>
                  <th style={{ padding: "10px 14px" }}>Absent Faculty</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {uncovered.map((item: any) => (
                  <tr key={`${item.timetableEntryId}-${item.eventDate}`} style={{ borderBottom: "1px solid #FEE2E2" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1E293B" }}>{item.eventDate}</td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>Period {item.periodNumber}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0C1E33" }}>
                      {item.programName} - {item.sectionName} · {item.subjectName}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#DC2626", fontWeight: 600 }}>{item.originalTeacher}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => openSubstituteModal(item.timetableEntryId, item.eventDate)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          background: "#0C1E33",
                          color: "#FFFFFF",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Assign Substitute
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmed Substitutions Log */}
        <div style={{ borderRadius: "10px", border: "1px solid #E0E5EB", overflowX: "auto", background: "#FFFFFF" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #E0E5EB", background: "#F8FAFC" }}>
            <b style={{ fontSize: "13px", color: "#0C1E33", fontFamily: "'Poppins', sans-serif" }}>Confirmed Substitute Assignments Log</b>
          </div>
          <table style={{ width: "100%", minWidth: "650px", borderCollapse: "collapse", textAlign: "left", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}>
            <thead>
              <tr style={{ height: "44px", background: "#F8FAFC", color: "#586C82", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #E0E5EB" }}>
                <th style={{ padding: "0 16px" }}>Date</th>
                <th style={{ padding: "0 16px" }}>Period</th>
                <th style={{ padding: "0 16px" }}>Class / Subject</th>
                <th style={{ padding: "0 16px" }}>Absent Teacher</th>
                <th style={{ padding: "0 16px" }}>Substitute Faculty</th>
                <th style={{ padding: "0 16px" }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {loadingSubs ? (
                <TableSkeletonRows columns={6} />
              ) : substitutions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "32px 16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                      <img src="/bee.png" alt="" style={{ width: "80px", height: "auto", marginBottom: "12px", opacity: 0.95 }} />
                      <b style={{ fontSize: "14px", fontWeight: 700, color: "#0C1E33", marginBottom: "4px" }}>
                        No Recent Substitute Assignments
                      </b>
                      <p style={{ margin: 0, fontSize: "12px", color: "#64748B", maxWidth: "400px" }}>
                        All classes are running with regular faculty schedules. Leave coverage assignments will log here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                substitutions.map((item: any, idx: number) => (
                  <tr
                    key={item.id}
                    style={{
                      height: "52px",
                      background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                      borderBottom: "1px solid #E0E5EB",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC")}
                  >
                    <td style={{ padding: "0 16px", fontWeight: 700, color: "#1E293B" }}>{item.eventDate}</td>
                    <td style={{ padding: "0 16px", color: "#475569" }}>Period {item.periodNumber}</td>
                    <td style={{ padding: "0 16px", color: "#0C1E33", fontWeight: 600 }}>
                      {item.programName} - {item.sectionName} · {item.subjectName}
                    </td>
                    <td style={{ padding: "0 16px", color: "#64748B" }}>{item.originalTeacher}</td>
                    <td style={{ padding: "0 16px", fontWeight: 700, color: "#166534" }}>{item.substituteTeacher}</td>
                    <td style={{ padding: "0 16px", color: "#64748B" }}>{item.impactNote || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Substitute Assignment Modal */}
      {subFormOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(12, 30, 51, 0.4)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSubFormOpen(false);
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "460px",
              padding: "20px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>
                Assign Substitute Faculty
              </h4>
              <button
                type="button"
                onClick={() => setSubFormOpen(false)}
                style={{ border: "none", background: "transparent", color: "#64748B", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSubstitute} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Date: <b>{subForm.eventDate}</b>
                </label>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Available Substitute Faculty *
                </label>
                <select
                  required
                  value={subForm.substituteTeacherUserId}
                  onChange={(e) => setSubForm({ ...subForm, substituteTeacherUserId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12.5px",
                    outline: "none",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="">Select available faculty</option>
                  {suggestions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.email}
                    </option>
                  ))}
                </select>
                {suggestions.length === 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748B" }}>
                    Searching for faculty without period conflicts...
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Academic Coverage Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Will conduct Chapter 4 problem-solving session"
                  value={subForm.impactNote}
                  onChange={(e) => setSubForm({ ...subForm, impactNote: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12.5px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSubFormOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    background: "#F1F5F9",
                    color: "#334155",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSub || !subForm.substituteTeacherUserId}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#0C1E33",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: savingSub || !subForm.substituteTeacherUserId ? "not-allowed" : "pointer",
                    opacity: savingSub || !subForm.substituteTeacherUserId ? 0.6 : 1,
                  }}
                >
                  {savingSub ? "Saving..." : "Confirm Substitute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
