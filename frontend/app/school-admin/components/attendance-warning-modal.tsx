"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { StudentRecord } from "../types";
import {
  sendCommunicationMessage,
  createSchoolAdminBroadcast,
  createSchoolAdminDiscipline,
  getSchoolAdminStudent360,
} from "../../edops-api";

export interface AttendanceWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord | null;
  organizationId: string;
  student360Dossier?: any;
  availableWarningParents?: any[];
  initialRecipient?: any;
  onSuccess?: (feedback: { type: "success" | "error"; msg: string }) => void;
  onDossierRefreshed?: (dossier: any) => void;
}

export function AttendanceWarningModal({
  isOpen,
  onClose,
  student: selectedStudent,
  organizationId,
  student360Dossier,
  availableWarningParents = [],
  initialRecipient,
  onSuccess,
  onDossierRefreshed: setStudent360Dossier,
}: AttendanceWarningModalProps) {
  const [warningRecipient, setWarningRecipient] = useState<any>(null);
  const [warningSubject, setWarningSubject] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [warningChannels, setWarningChannels] = useState<{ inApp: boolean; broadcast: boolean; recordDiscipline: boolean }>({
    inApp: true,
    broadcast: true,
    recordDiscipline: true,
  });
  const [sendingWarning, setSendingWarning] = useState(false);
  const [warningFeedback, setWarningFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen && selectedStudent) {
      const attPct = student360Dossier?.attendance?.overallPercentage ?? (selectedStudent.attendancePct != null ? Number(selectedStudent.attendancePct) : null);
      const absentCount = student360Dossier?.attendance?.daysAbsent ?? 0;
      const totalDays = student360Dossier?.attendance?.totalSchoolDays ?? 0;
      const sName = selectedStudent.name || "Student";
      const classSec = [selectedStudent.grade, selectedStudent.section].filter(Boolean).join("-") || "Standard";
      const roll = selectedStudent.rollNo ? `Roll #${selectedStudent.rollNo}` : (selectedStudent.admissionNo ? `Adm #${selectedStudent.admissionNo}` : "");

      const recipient = initialRecipient || availableWarningParents[0] || {
        name: selectedStudent.parentName || selectedStudent.guardianName || "Parent / Guardian",
        phone: selectedStudent.parentPhone || selectedStudent.guardianPhone || "",
        email: selectedStudent.parentEmail || "",
        relationship: "Primary Guardian",
      };

      setWarningRecipient(recipient);
      setWarningSubject(`Statutory Attendance Warning: ${sName} (${classSec}${roll ? ` · ${roll}` : ""})`);

      const attPctText = attPct != null ? `${attPct}%` : "below statutory threshold";
      setWarningMessage(
        `Dear ${recipient.name || "Parent / Guardian"},\n\nThis is an official statutory communication regarding the institutional attendance record of ${sName} (Class ${classSec}${roll ? `, ${roll}` : ""}).\n\nAs of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${sName}'s attendance rate is ${attPctText}${absentCount > 0 ? ` with ${absentCount} recorded absence(s)` : ""}${totalDays > 0 ? ` over ${totalDays} school days` : ""}. Under statutory CBSE regulations, a minimum of 75% attendance is required for regular academic progression and board examination eligibility.\n\nPlease treat this notice with priority and contact the school administration or the class teacher to regularize attendance and submit necessary documentation.\n\nInstitutional Administration`
      );
      setWarningFeedback(null);
    }
  }, [isOpen, selectedStudent, initialRecipient, availableWarningParents, student360Dossier]);


  const handleDispatchAttendanceWarning = async () => {
    if (!organizationId || !selectedStudent) return;
    setSendingWarning(true);
    setWarningFeedback(null);

    const sName = selectedStudent.name || "Student";
    const classSec = [selectedStudent.grade, selectedStudent.section].filter(Boolean).join("-") || "Unspecified";
    const attPct = student360Dossier?.attendance?.overallPercentage ?? (selectedStudent.attendancePct != null ? Number(selectedStudent.attendancePct) : null);
    const absentCount = student360Dossier?.attendance?.daysAbsent ?? 0;
    const attPctText = attPct != null ? `${attPct}%` : "below statutory threshold";
    const subject = warningSubject.trim() || `Attendance Warning: ${sName} (${classSec})`;
    const body = warningMessage.trim();

    try {
      // 1. Direct message via communication system if recipient has a mapped user ID
      const recipientUserId = warningRecipient?.id;
      if (warningChannels.inApp && recipientUserId) {
        try {
          await sendCommunicationMessage(organizationId, {
            recipientId: recipientUserId,
            recipientRole: "parent",
            subject,
            body,
            priority: "urgent",
          });
        } catch (directErr) {
          console.warn("Direct communication message to parent failed:", directErr);
        }
      }

      // 2. School broadcast circular targeted to parents
      if (warningChannels.broadcast) {
        try {
          await createSchoolAdminBroadcast(organizationId, {
            title: subject,
            message: body,
            channels: ["in_app", "email", "sms"],
            targetAudience: "parents",
            priority: "urgent",
          });
        } catch (bcastErr) {
          console.warn("Broadcast circular dispatch failed:", bcastErr);
        }
      }

      // 3. Log disciplinary / governance record
      if (warningChannels.recordDiscipline) {
        try {
          await createSchoolAdminDiscipline(organizationId, {
            studentUserId: selectedStudent.id,
            studentName: sName,
            classSection: classSec,
            incidentType: "Attendance Defaulter Warning",
            severity: attPct != null && attPct < 60 ? "severe" : "moderate",
            description: `Official attendance warning notice dispatched to ${warningRecipient?.name || selectedStudent.parentName || "Parent/Guardian"}. Current rate: ${attPctText} with ${absentCount} absence(s).`,
            actionTaken: "Attendance Warning Notice Issued to Parent",
            reportedByName: "School Administration",
            parentNotified: true,
          });
        } catch (discErr) {
          console.warn("Discipline record logging failed:", discErr);
        }
      }

      // 4. Refresh student 360 dossier so new communication & discipline records show immediately
      try {
        const refreshed = await getSchoolAdminStudent360(organizationId, selectedStudent.id);
        if (refreshed) {
          setStudent360Dossier?.(refreshed);
        }
      } catch (refErr) {
        console.warn("Could not reload dossier:", refErr);
      }

      onSuccess?.({
        type: "success",
        msg: `Attendance warning successfully issued to ${warningRecipient?.name || "Parent/Guardian"}.`,
      });
      setWarningFeedback({
        type: "success",
        msg: `Attendance warning successfully issued to ${warningRecipient?.name || "Parent/Guardian"}.`,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setWarningFeedback({
        type: "error",
        msg: err?.message || "Failed to dispatch attendance warning.",
      });
    } finally {
      setSendingWarning(false);
    }
  };


  if (!isOpen || !selectedStudent) return null;

  return (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-warning-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "edopsFadeIn 0.15s ease-out",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !sendingWarning) onClose();
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "580px",
              background: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 20px 45px rgba(12, 30, 51, 0.22)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "92vh",
              overflow: "hidden",
              fontFamily: "'Poppins', sans-serif",
              animation: "edopsSlideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#FEF3C7",
                    color: "#D97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 id="attendance-warning-modal-title" style={{ margin: 0, fontSize: "15px", fontWeight: 650, color: "#0C1E33" }}>
                    Send Attendance Warning to Parent
                  </h3>
                  <p style={{ margin: 0, fontSize: "11.5px", color: "#64748B" }}>
                    Statutory CBSE 75% rule breach notice & parent escalation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !sendingWarning && onClose()}
                title="Close"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: sendingWarning ? "not-allowed" : "pointer",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "18px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Student Context Card */}
              <div style={{ padding: "12px 14px", background: "#F1F5F9", borderRadius: "8px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0C1E33" }}>
                    {selectedStudent.name}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                    Class {selectedStudent.grade || "-"} ({selectedStudent.section || "-"}) · Roll #{selectedStudent.rollNo || selectedStudent.admissionNo || "-"}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: (student360Dossier?.attendance?.overallPercentage ?? selectedStudent.attendancePct ?? 100) < 75 ? "#DC2626" : "#047857" }}>
                    {student360Dossier?.attendance?.overallPercentage != null ? `${student360Dossier.attendance.overallPercentage}%` : (selectedStudent.attendancePct != null ? `${selectedStudent.attendancePct}%` : "—")}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>
                    {student360Dossier?.attendance?.daysAbsent ?? 0} days absent
                  </div>
                </div>
              </div>

              {/* Recipient Selection */}
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                  Recipient Parent / Guardian:
                </label>
                {availableWarningParents.length > 1 ? (
                  <select
                    value={warningRecipient?.id || warningRecipient?.email || warningRecipient?.name || ""}
                    onChange={(e) => {
                      const found = availableWarningParents.find(
                        (p) => (p.id && p.id === e.target.value) || (p.email && p.email === e.target.value) || p.name === e.target.value
                      );
                      if (found) setWarningRecipient(found);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "12.5px",
                      color: "#0C1E33",
                      background: "#FFFFFF",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {availableWarningParents.map((p, idx) => (
                      <option key={idx} value={p.id || p.email || p.name}>
                        {p.name} ({p.relationship || "Guardian"}{p.phone ? ` · ${p.phone}` : ""}{p.email ? ` · ${p.email}` : ""})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: "8px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "12px", color: "#0C1E33" }}>
                    <b>{warningRecipient?.name || selectedStudent.parentName || selectedStudent.guardianName || "Parent / Guardian"}</b>
                    <span style={{ color: "#64748B", marginLeft: "6px" }}>
                      ({warningRecipient?.relationship || "Guardian"}{warningRecipient?.phone ? ` · ${warningRecipient.phone}` : ""}{warningRecipient?.email ? ` · ${warningRecipient.email}` : ""})
                    </span>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                  Notice Subject:
                </label>
                <input
                  type="text"
                  value={warningSubject}
                  onChange={(e) => setWarningSubject(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12.5px",
                    color: "#0C1E33",
                    fontFamily: "'Poppins', sans-serif",
                  }}
                />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                  Notice Content:
                </label>
                <textarea
                  rows={6}
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    color: "#0C1E33",
                    fontFamily: "'Poppins', sans-serif",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Multi-channel dispatch indicators */}
              <div style={{ padding: "10px 12px", background: "#F8FAFC", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Dispatch Channels & Governance:
                </div>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "11.5px", color: "#334155" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={warningChannels.inApp}
                      onChange={(e) => setWarningChannels((prev) => ({ ...prev, inApp: e.target.checked }))}
                    />
                    Direct Parent Portal Message
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={warningChannels.broadcast}
                      onChange={(e) => setWarningChannels((prev) => ({ ...prev, broadcast: e.target.checked }))}
                    />
                    Campus Parent Circular
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={warningChannels.recordDiscipline}
                      onChange={(e) => setWarningChannels((prev) => ({ ...prev, recordDiscipline: e.target.checked }))}
                    />
                    Log Disciplinary Record
                  </label>
                </div>
              </div>

              {warningFeedback && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: warningFeedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
                    border: `1px solid ${warningFeedback.type === "success" ? "#A7F3D0" : "#FECACA"}`,
                    color: warningFeedback.type === "success" ? "#065F46" : "#991B1B",
                  }}
                >
                  {warningFeedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{warningFeedback.msg}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #E2E8F0",
                background: "#F8FAFC",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => onClose()}
                disabled={sendingWarning}
                style={{
                  padding: "7px 16px",
                  borderRadius: "6px",
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#334155",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: sendingWarning ? "not-allowed" : "pointer",
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                id="btn-confirm-dispatch-attendance-warning"
                onClick={handleDispatchAttendanceWarning}
                disabled={sendingWarning}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 18px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#0C1E33",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: sendingWarning ? "not-allowed" : "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!sendingWarning) e.currentTarget.style.background = "#1B3554";
                }}
                onMouseLeave={(e) => {
                  if (!sendingWarning) e.currentTarget.style.background = "#0C1E33";
                }}
              >
                {sendingWarning ? (
                  <>
                    <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
                    Dispatching Warning...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Dispatch Attendance Warning
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
  );
}
