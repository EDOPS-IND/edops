"use client";

import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  UserCheck,
  UserX,
  Trash2,
  Users,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";
import { updateSchoolMemberStatus, deleteSchoolMember } from "@/app/edops-api";

export interface MemberLifecycleTarget {
  id: string;
  name: string;
  email?: string;
  role: "student" | "teacher" | "staff" | "parent";
  status: "Active" | "Inactive" | "Withdrawn" | string;
  sublabel?: string;
}

interface MemberLifecycleModalProps {
  member: MemberLifecycleTarget | null;
  isOpen: boolean;
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const MemberLifecycleModal: React.FC<MemberLifecycleModalProps> = ({
  member,
  isOpen,
  organizationId,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"status" | "delete">("status");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const isActive = (member.status || "").toLowerCase() === "active";
  const targetStatus = isActive ? "inactive" : "active";

  const handleStatusChange = async () => {
    if (!organizationId || !member) return;
    setLoading(true);
    setError(null);
    setResultSummary(null);

    try {
      const res = await updateSchoolMemberStatus(
        organizationId,
        member.id,
        targetStatus,
        reason || undefined,
      );

      if (res?.deactivatedParents && res.deactivatedParents.length > 0) {
        const parentNames = res.deactivatedParents.map((p: any) => p.name).join(", ");
        setResultSummary(
          `Status updated to Inactive. Guardian(s) [${parentNames}] were also deactivated because they have no other active wards.`,
        );
      } else {
        setResultSummary(
          `Account status successfully changed to ${isActive ? "Inactive" : "Active"}.`,
        );
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Failed to update member status:", err);
      setError(err?.message || "Failed to update member status.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!organizationId || !member) return;
    setLoading(true);
    setError(null);

    try {
      await deleteSchoolMember(organizationId, member.id, member.role);
      setResultSummary("Member record successfully deleted.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Failed to delete member:", err);
      setError(err?.message || "Failed to delete member record.");
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = {
    student: "Student",
    teacher: "Faculty Instructor",
    staff: "Staff Member",
    parent: "Parent / Guardian",
  }[member.role] || "Member";

  const RoleIcon = {
    student: GraduationCap,
    teacher: Briefcase,
    staff: Users,
    parent: HeartHandshake,
  }[member.role] || Users;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(12, 30, 51, 0.55)",
        backdropFilter: "blur(4px)",
        padding: "16px",
        fontFamily: "'Poppins', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "480px",
          background: "#FFFFFF",
          borderRadius: "14px",
          boxShadow: "0 20px 40px rgba(12, 30, 51, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: mode === "delete" ? "#FEF2F2" : "#FAFCFE",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: mode === "delete" ? "#FEE2E2" : "#EFF6FF",
                color: mode === "delete" ? "#DC2626" : "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mode === "delete" ? <Trash2 size={18} /> : isActive ? <UserX size={18} /> : <UserCheck size={18} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0C1E33" }}>
                {mode === "delete"
                  ? `Delete ${roleLabel}`
                  : isActive
                  ? `Deactivate ${roleLabel}`
                  : `Reactivate ${roleLabel}`}
              </h3>
              <span style={{ fontSize: "11px", color: "#64748B" }}>
                {member.name} • {roleLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Result Banner */}
          {resultSummary && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                color: "#166534",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{resultSummary}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Member Card Preview */}
          <div
            style={{
              padding: "12px 14px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#E2E8F0",
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                {member.name?.charAt(0) || "M"}
              </div>
              <div>
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#0C1E33", display: "block" }}>
                  {member.name}
                </span>
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  {member.email || member.sublabel || roleLabel}
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "100px",
                background: isActive ? "#DCFCE7" : "#F1F5F9",
                color: isActive ? "#166534" : "#64748B",
              }}
            >
              Current: {member.status || "Active"}
            </span>
          </div>

          {/* Action Explanations & Smart Warnings */}
          {mode === "status" && isActive && (
            <div
              style={{
                padding: "14px",
                background: "#FEF3C7",
                border: "1px dashed #F59E0B",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#92400E", fontWeight: 600, fontSize: "12.5px" }}>
                <AlertTriangle size={15} />
                <span>Deactivation Impact & Access Revocation</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "11.5px", color: "#78350F", lineHeight: "150%" }}>
                <li>Member will immediately lose login access across school apps and portals.</li>
                {member.role === "teacher" && (
                  <>
                    <li>Will be unassigned from all active class sections and timetable periods.</li>
                    <li>If serving as Head of Department (HOD), leadership will be unassigned.</li>
                  </>
                )}
                {member.role === "student" && (
                  <li>
                    <b>Guardian Cascade:</b> If linked parent/guardian has no other active children in this school, their guardian portal credentials will also be <b>deactivated automatically</b>.
                  </li>
                )}
              </ul>
            </div>
          )}

          {mode === "status" && !isActive && (
            <div
              style={{
                padding: "14px",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#1E40AF",
                lineHeight: "140%",
              }}
            >
              Reactivating this account will restore institutional login permissions.
              {member.role === "student" && " Linked guardians will also regain portal access."}
            </div>
          )}

          {mode === "delete" && (
            <div
              style={{
                padding: "14px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#991B1B",
                lineHeight: "140%",
              }}
            >
              <b>Warning: Permanent Deletion!</b> This will completely delete the member&apos;s institutional records, enrollments, and relationships from this school. This action cannot be undone.
            </div>
          )}

          {/* Optional Reason field for deactivation */}
          {mode === "status" && isActive && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569" }}>
                Reason for Offboarding / Deactivation (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Transferred, Resigned, Withdrawn..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "6px",
                  fontSize: "12px",
                  outline: "none",
                  fontFamily: "'Poppins', sans-serif",
                }}
              />
            </div>
          )}

          {/* Mode switch (Toggle between Status Change vs Permanent Delete) */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {mode === "status" ? (
              <button
                type="button"
                onClick={() => setMode("delete")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#DC2626",
                  fontSize: "11.5px",
                  fontWeight: 500,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Need to permanently delete this record?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("status")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563EB",
                  fontSize: "11.5px",
                  fontWeight: 500,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Back to Deactivate / Reactivate
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid #E2E8F0",
            background: "#FAFCFE",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "#FFFFFF",
              border: "1px solid #D5DCE4",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              color: "#475569",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>

          {mode === "status" ? (
            <button
              type="button"
              disabled={loading || Boolean(resultSummary)}
              onClick={handleStatusChange}
              style={{
                padding: "8px 18px",
                background: isActive ? "#DC2626" : "#16A34A",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: loading || Boolean(resultSummary) ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? "Processing..."
                : isActive
                ? "Confirm & Deactivate"
                : "Confirm & Reactivate"}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || Boolean(resultSummary)}
              onClick={handleDelete}
              style={{
                padding: "8px 18px",
                background: "#DC2626",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#FFFFFF",
                cursor: loading || Boolean(resultSummary) ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Deleting..." : "Permanently Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
