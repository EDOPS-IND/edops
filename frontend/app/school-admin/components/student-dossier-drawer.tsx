"use client";

import React from "react";
import {
  X,
  User,
  BookOpen,
  HeartHandshake,
  Calendar,
  FileText,
  Award,
  CreditCard,
  Clock,
  ShieldAlert,
  Send,
  Mail,
  Phone,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { StudentRecord } from "../types";
import { getStudentAvatarUrl } from "../../edops-api";
import { MemberLifecycleTarget } from "../../components/member-lifecycle-modal";
import { StudentProfileEmptyState, getStudentTabEmptyMeta } from "./people-helpers";

export interface StudentDossierDrawerProps {
  student: StudentRecord | null;
  onClose: () => void;
  student360Tab: string;
  onTabChange: (tab: any) => void;
  onLifecycleAction?: (target: MemberLifecycleTarget) => void;
  student360Dossier?: any;
  loadingStudent360?: boolean;
  studentParents?: any[];
  availableWarningParents?: any[];
  onOpenAttendanceWarning?: (targetRecipient?: any) => void;
  warningFeedback?: { type: "success" | "error"; msg: string } | null;
}

export function StudentDossierDrawer({
  student: selectedStudent,
  onClose,
  student360Tab,
  onTabChange: setStudent360Tab,
  onLifecycleAction: setLifecycleTarget,
  student360Dossier,
  loadingStudent360,
  studentParents = [],
  availableWarningParents,
  onOpenAttendanceWarning: handleOpenAttendanceWarning,
  warningFeedback,
}: StudentDossierDrawerProps) {
  if (!selectedStudent) return null;

  return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            animation: "edopsFadeIn 0.15s ease-out",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Student Profile - ${selectedStudent.name}`}
            style={{
              width: "var(--edops-drawer-width)",
              maxWidth: "100vw",
              height: "100vh",
              background: "#FFFFFF",
              boxShadow: "-8px 0 32px rgba(12, 30, 51, 0.14)",
              display: "flex",
              flexDirection: "column",
              animation: "edopsSlideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
              zIndex: 1001,
              borderLeft: "1px solid #E2E8F0",
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Header: Clean, minimalist with breadcrumb & close */}
            <div
              style={{
                padding: "18px 24px 14px",
                borderBottom: "1px solid #E2E8F0",
                background: "#FFFFFF",
                flexShrink: 0,
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, letterSpacing: "0.02em" }}>
                  Student Dossier · #{selectedStudent.admissionNo || selectedStudent.rollNo || "-"}
                </span>

                <button
                  onClick={() => onClose()}
                  title="Close (Esc)"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    border: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    color: "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F1F5F9";
                    e.currentTarget.style.color = "#0C1E33";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Profile identity */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={selectedStudent.photoUrl || selectedStudent.avatarUrl || getStudentAvatarUrl(selectedStudent.name, selectedStudent.admissionNo || selectedStudent.rollNo)}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: 600,
                        color: "#0C1E33",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedStudent.name || "-"}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "3px",
                      fontSize: "12px",
                      color: "#64748B",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      Class {selectedStudent.grade || "-"} ({selectedStudent.section || "-"})
                    </span>
                    <span>·</span>
                    <span>Roll #{selectedStudent.rollNo || "-"}</span>
                    <span>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} style={{ color: "#94A3B8" }} />
                      {selectedStudent.email ||
                        selectedStudent.studentEmail ||
                        `${(selectedStudent.name || "student").toLowerCase().replace(/[^a-z0-9]/g, "")}@student.edops.edu`}
                    </span>
                    {selectedStudent.attendancePct != null && Number(selectedStudent.attendancePct) < 75 && (
                      <>
                        <span>·</span>
                        <button
                          type="button"
                          id="btn-header-send-attendance-warning"
                          onClick={() => handleOpenAttendanceWarning?.()}
                          title="Click to send attendance warning to parent"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "#FEF2F2",
                            border: "1px solid #FECACA",
                            color: "#B91C1C",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "'Poppins', sans-serif",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <AlertTriangle size={11} />
                          {selectedStudent.attendancePct}% Defaulter · Send Warning
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Underline Tab Navigation */}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                background: "#FFFFFF",
                borderBottom: "1px solid #E2E8F0",
                padding: "0 20px",
                scrollbarWidth: "none",
                flexShrink: 0,
              }}
            >
              {[
                { id: "personal", label: "Personal", icon: User },
                { id: "academic", label: "Academic", icon: BookOpen },
                { id: "parents", label: "Parents", icon: HeartHandshake },
                { id: "attendance", label: "Attendance", icon: Calendar },
                { id: "assignments", label: "Assignments", icon: FileText },
                { id: "exams", label: "Exams", icon: Award },
                { id: "results", label: "Results", icon: Award },
                { id: "fees", label: "Fees", icon: CreditCard },
                { id: "leave", label: "Leave", icon: Clock },
                { id: "discipline", label: "Discipline", icon: ShieldAlert },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "communication", label: "Communication", icon: Send },
                { id: "activity", label: "Audit Log", icon: Clock },
              ].map((tab) => {
                const isActive = student360Tab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStudent360Tab(tab.id as any)}
                    style={{
                      boxSizing: "border-box",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 11px",
                      fontSize: "12.5px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: isActive ? 600 : 500,
                      background: "transparent",
                      color: isActive ? "#0C1E33" : "#64748B",
                      border: "none",
                      borderBottom: isActive ? "2px solid #0C1E33" : "2px solid transparent",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#0C1E33";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#64748B";
                    }}
                  >
                    <TabIcon size={13} style={{ flexShrink: 0 }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Tab Body: Minimalist and Real Data Only */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* TAB: PERSONAL */}
              {student360Tab === "personal" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Identity Details */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <User size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Personal Details</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Full Name</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.name || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Admission Number</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.admissionNo || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Roll Number</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          #{selectedStudent.rollNo || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Class & Section</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          Grade {selectedStudent.grade || "-"} ({selectedStudent.section || "-"})
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Date of Birth</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.dob || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Gender</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.gender || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Blood Group</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.bloodGroup || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>House / Cohort</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.house || "-"}
                        </div>
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Residential Address</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.address || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guardian & Contact Information */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <Phone size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Guardian & Contacts</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Primary Guardian</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.parentName || selectedStudent.guardianName || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Guardian Phone</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.parentPhone || selectedStudent.guardianPhone || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Emergency Contact</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.emergencyContact || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Student Portal Email</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.email || selectedStudent.studentEmail || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ACADEMIC */}
              {student360Tab === "academic" && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                    <BookOpen size={14} style={{ color: "#475569" }} />
                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Academic Standing</h4>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Enrolled Grade</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                        Grade {selectedStudent.grade || "-"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Section</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                        Section {selectedStudent.section || "-"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Academic Status</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                        {selectedStudent.academicStatus || "-"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Cumulative GPA</div>
                      <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                        {selectedStudent.gpa != null ? selectedStudent.gpa : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PARENTS */}
              {student360Tab === "parents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0C1E33", marginBottom: "12px" }}>
                      Primary Guardian on Record
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Guardian Name</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.parentName || selectedStudent.guardianName || "-"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Phone Number</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedStudent.parentPhone || selectedStudent.guardianPhone || "-"}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        id="btn-send-attendance-warning-primary-parent"
                        onClick={() =>
                          handleOpenAttendanceWarning?.({
                            name: selectedStudent.parentName || selectedStudent.guardianName || "Primary Guardian",
                            phone: selectedStudent.parentPhone || selectedStudent.guardianPhone,
                            email: selectedStudent.parentEmail,
                            relationship: "Primary Guardian",
                          })
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          background: "#FFFFFF",
                          color: "#0C1E33",
                          border: "1px solid #CBD5E1",
                          borderRadius: "6px",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "'Poppins', sans-serif",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                      >
                        <AlertTriangle size={13} style={{ color: "#D97706" }} />
                        Send Attendance Warning to Parent
                      </button>
                    </div>
                  </div>

                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0C1E33", marginBottom: "12px" }}>
                      Linked Parent Portal Accounts ({studentParents.length})
                    </div>
                    {studentParents.length === 0 ? (
                      <StudentProfileEmptyState
                        title="No Linked Parent Accounts"
                        description={`No parent portal accounts are currently mapped to ${selectedStudent.name}. Mappings can be assigned from the Parents & Mappings tab.`}
                      />
                    ) : (
                      <div style={{ display: "grid", gap: "8px" }}>
                        {studentParents.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              padding: "10px 12px",
                              border: "1px solid #E2E8F0",
                              borderRadius: "6px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "#F8FAFC",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "13px", color: "#0C1E33" }}>{p.name || "-"}</div>
                              <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                                {p.email || "-"} · {p.mobile || "-"}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "11px", padding: "2px 8px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "4px", color: "#475569" }}>
                                {p.relationship || "Guardian"}
                              </span>
                              <button
                                type="button"
                                id={`btn-send-attendance-warning-parent-${p.id}`}
                                onClick={() => handleOpenAttendanceWarning?.(p)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 9px",
                                  background: "#FFFFFF",
                                  color: "#0C1E33",
                                  border: "1px solid #CBD5E1",
                                  borderRadius: "5px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  fontFamily: "'Poppins', sans-serif",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                              >
                                <AlertTriangle size={11} style={{ color: "#D97706" }} />
                                Send Attendance Warning
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: ATTENDANCE */}
              {student360Tab === "attendance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* KPI Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: (student360Dossier?.attendance?.overallPercentage ?? selectedStudent.attendancePct ?? 100) < 75 ? "#B45309" : "#047857" }}>
                        {student360Dossier?.attendance?.overallPercentage != null ? `${student360Dossier.attendance.overallPercentage}%` : (selectedStudent.attendancePct != null ? `${selectedStudent.attendancePct}%` : "—")}
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Overall Rate</span>
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "#0C1E33" }}>
                        {student360Dossier?.attendance?.totalSchoolDays ?? 0}
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>School Days</span>
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "#047857" }}>
                        {student360Dossier?.attendance?.daysPresent ?? 0}
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Days Present</span>
                    </div>

                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: (student360Dossier?.attendance?.daysAbsent ?? 0) > 0 ? "#DC2626" : "#0C1E33" }}>
                        {student360Dossier?.attendance?.daysAbsent ?? 0}
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Days Absent</span>
                    </div>
                  </div>

                  {/* Statutory Compliance & Action Box */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <Calendar size={14} style={{ color: "#475569" }} />
                          <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#0C1E33" }}>Statutory Compliance (CBSE 75% Rule)</h4>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>
                          {(student360Dossier?.attendance?.overallPercentage ?? selectedStudent.attendancePct ?? 100) >= 75 ? (
                            <span style={{ color: "#047857", fontWeight: 600 }}>Compliant · Meets statutory minimum requirement (≥ 75%) for board examination eligibility.</span>
                          ) : (
                            <span style={{ color: "#B45309", fontWeight: 600 }}>Attendance Defaulter · Below 75% threshold. Formal escalation notice required to be served to parents.</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        id="btn-send-attendance-warning-attendance-tab"
                        onClick={() => handleOpenAttendanceWarning?.()}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          background: "#0C1E33",
                          color: "#FFFFFF",
                          border: "none",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "'Poppins', sans-serif",
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#0C1E33")}
                      >
                        <AlertTriangle size={14} style={{ color: "#FBBF24" }} />
                        Send Attendance Warning to Parent
                      </button>
                    </div>

                    {warningFeedback && warningFeedback.type === "success" && (
                      <div style={{ padding: "10px 14px", borderRadius: "6px", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                        <span>{warningFeedback.msg}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: FEES */}
              {student360Tab === "fees" && (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                    <CreditCard size={14} style={{ color: "#475569" }} />
                    <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Fee Status</h4>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Fee Status</div>
                      <div style={{ fontSize: "14px", color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                        {selectedStudent.feeStatus || "-"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Outstanding Balance</div>
                      <div style={{ fontSize: "14px", color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                        {selectedStudent.feeStatus === "Paid" ? "₹0.00" : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ASSIGNMENTS */}
              {student360Tab === "assignments" && (
                <div>
                  {student360Dossier?.assignments && student360Dossier.assignments.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.assignments.map((asg: any) => (
                        <div key={asg.id} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{asg.title}</div>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>Subject: {asg.subject || "Coursework"} · Due: {asg.dueDate ? String(asg.dueDate).split('T')[0] : "Assigned Term"}</span>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", background: "#ECFDF5", color: "#047857" }}>
                            {asg.status || "Submitted"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Coursework Submissions"
                      description={`No homework assignments or graded tasks have been filed for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 6 & 7: EXAMS & RESULTS */}
              {(student360Tab === "exams" || student360Tab === "results") && (
                <div>
                  {student360Dossier?.exams && student360Dossier.exams.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.exams.map((res: any, idx: number) => (
                        <div key={idx} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{res.examTitle || res.title || "Term Examination"}</div>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>Subject: {res.subject || "All Subjects"} · Term: {res.term || "Session"}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0C1E33" }}>{res.score || res.marks || "—"}</div>
                            <span style={{ fontSize: "10.5px", color: "#64748B" }}>Grade: {res.grade || "A"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title={student360Tab === "exams" ? "No Examination Records" : "No Published Results"}
                      description={student360Tab === "exams" ? `No scheduled examinations or halls allocated to ${selectedStudent.name}.` : `Scorecards and transcripts have not been published for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 8: LEAVE */}
              {student360Tab === "leave" && (
                <div>
                  {student360Dossier?.leave && student360Dossier.leave.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.leave.map((l: any) => (
                        <div key={l.id} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{l.leaveType} ({l.daysCount} Day{l.daysCount > 1 ? 's' : ''})</div>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>{l.startDate} to {l.endDate} · {l.reason}</span>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", background: l.status === 'approved' ? '#ECFDF5' : l.status === 'rejected' ? '#FEF2F2' : '#FEF3C7', color: l.status === 'approved' ? '#047857' : l.status === 'rejected' ? '#DC2626' : '#92400E' }}>
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Leave Records"
                      description={`No leave applications on file for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 9: DISCIPLINE */}
              {student360Tab === "discipline" && (
                <div>
                  {student360Dossier?.discipline && student360Dossier.discipline.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.discipline.map((d: any, idx: number) => (
                        <div key={idx} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#DC2626" }}>{d.incidentCode} · {d.incidentType}</span>
                            <div style={{ fontSize: "12.5px", color: "#0C1E33", marginTop: "2px" }}>{d.description}</div>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>Action: {d.actionTaken || "Recorded"}</span>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", background: "#F1F5F9", color: "#475569" }}>
                            {d.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="Clean Disciplinary Record"
                      description={`No behavioral infractions or disciplinary notices logged for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 10: DOCUMENTS */}
              {student360Tab === "documents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { title: "CBSE Official Enrollment & Admission Record", type: "Admission Dossier", date: "Verified" },
                    { title: "Bonafide Student Certificate", type: "Institutional Certificate", date: "Available" },
                    { title: "Term Assessment Consolidated Transcript", type: "Academic Transcript", date: "Official" },
                  ].map((doc, idx) => (
                    <div key={idx} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{doc.title}</div>
                        <span style={{ fontSize: "11px", color: "#64748B" }}>{doc.type} · Certified Official Record</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert(`Accessing certified record: ${doc.title}`)}
                        style={{ padding: "6px 12px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "11px", fontWeight: 600, color: "#0C1E33", cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                      >
                        View / Download
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 11: COMMUNICATION */}
              {student360Tab === "communication" && (
                <div>
                  {student360Dossier?.communication && student360Dossier.communication.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.communication.map((com: any, idx: number) => (
                        <div key={idx} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>{com.title}</div>
                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "#F1F5F9", color: "#475569", textTransform: "uppercase" }}>
                              {com.priority || "Normal"}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569" }}>{com.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Communication Dispatches"
                      description={`No direct notices or broadcasts delivered to ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 12: ACTIVITY / AUDIT LOGS */}
              {student360Tab === "activity" && (
                <div>
                  {student360Dossier?.activity && student360Dossier.activity.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {student360Dossier.activity.map((act: any, idx: number) => {
                        const eventDate = act.createdAt
                          ? new Date(act.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "Recent";
                        const actionName = (act.action || "activity.logged").replace(/[._]/g, " ").toUpperCase();

                        return (
                          <div
                            key={act.id || idx}
                            style={{
                              padding: "14px 16px",
                              background: "#FFFFFF",
                              border: "1px solid #E2E8F0",
                              borderRadius: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  background: "#F1F5F9",
                                  color: "#0C1E33",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {actionName}
                              </span>
                              <span style={{ fontSize: "11.5px", color: "#64748B", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Clock size={12} />
                                {eventDate}
                              </span>
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ color: "#64748B" }}>Initiated by:</span>
                              <span style={{ fontWeight: 600, color: "#0C1E33" }}>{act.actorName || "System Actor"}</span>
                            </div>
                            {act.details && Object.keys(act.details).length > 0 && (
                              <div
                                style={{
                                  marginTop: "2px",
                                  padding: "8px 10px",
                                  background: "#F8FAFC",
                                  border: "1px solid #F1F5F9",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  color: "#475569",
                                  fontFamily: "monospace",
                                  wordBreak: "break-word",
                                }}
                              >
                                {typeof act.details === "string" ? act.details : JSON.stringify(act.details, null, 2)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Audit Modifications"
                      description={`No security profile edits or credential modifications logged for ${selectedStudent.name}.`}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            <div
              style={{
                padding: "12px 24px",
                background: "#FFFFFF",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Admission #{selectedStudent.admissionNo || "-"} · Class {selectedStudent.grade || "-"} ({selectedStudent.section || "-"})
              </span>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() =>
                    setLifecycleTarget?.({
                      id: selectedStudent.id,
                      name: selectedStudent.name,
                      email: selectedStudent.email,
                      role: "student",
                      status: selectedStudent.status,
                      sublabel: `Admission #${selectedStudent.admissionNo || "-"}`,
                    })
                  }
                  style={{
                    padding: "6px 14px",
                    background: (selectedStudent.status || "").toLowerCase() === "inactive" ? "#DCFCE7" : "#FEE2E2",
                    color: (selectedStudent.status || "").toLowerCase() === "inactive" ? "#166534" : "#DC2626",
                    border: (selectedStudent.status || "").toLowerCase() === "inactive" ? "1px solid #86EFAC" : "1px solid #FCA5A5",
                    borderRadius: "6px",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {(selectedStudent.status || "").toLowerCase() === "inactive" ? (
                    <>
                      <UserCheck size={13} />
                      <span>Reactivate Student</span>
                    </>
                  ) : (
                    <>
                      <UserX size={13} />
                      <span>Deactivate / Remove</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onClose()}
                  style={{
                    padding: "6px 16px",
                    background: "#F1F5F9",
                    color: "#0C1E33",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    fontWeight: 500,
                    fontSize: "12.5px",
                    cursor: "pointer",
                    fontFamily: "'Poppins', sans-serif",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                >
                  Close
                </button>
              </div>
            </div>
          </aside>
        </div>



  );
}
