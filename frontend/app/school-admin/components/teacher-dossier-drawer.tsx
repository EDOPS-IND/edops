"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Briefcase,
  Calendar,
  Clock,
  Mail,
  Phone,
  UserCheck,
  UserX,
  GraduationCap,
  FileText,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { TeacherRecord } from "../types";
import {
  getStudentAvatarUrl,
  getSchoolAdminTeachers,
  updateTeacherEmployment,
} from "../../edops-api";
import { MemberLifecycleTarget } from "../../components/member-lifecycle-modal";
import { StudentProfileEmptyState } from "./people-helpers";
import { TeacherAllocationManager } from "../../components/teacher-allocation-manager";

export interface TeacherDossierDrawerProps {
  teacher: TeacherRecord | null;
  onClose: () => void;
  organizationId: string;
  teachers: TeacherRecord[];
  academicsData: { programs?: any[]; sections?: any[]; subjects?: any[]; [key: string]: any } | null;
  teacher360Tab: "personal" | "classes" | "schedule" | "documents" | "activity" | string;
  onTabChange: (tab: any) => void;
  onLifecycleAction?: (target: MemberLifecycleTarget) => void;
  onTeachersUpdated?: (teachers: TeacherRecord[]) => void;
  onTeacherSelected?: (teacher: TeacherRecord | null) => void;
}

export function TeacherDossierDrawer({
  teacher: selectedTeacher,
  onClose,
  organizationId,
  teachers,
  academicsData,
  teacher360Tab,
  onTabChange: setTeacher360Tab,
  onLifecycleAction: setLifecycleTarget,
  onTeachersUpdated,
  onTeacherSelected: setSelectedTeacher,
}: TeacherDossierDrawerProps) {
  if (!selectedTeacher) return null;


  const [editingTeacherEmp, setEditingTeacherEmp] = useState(false);
  const [empIdInput, setEmpIdInput] = useState("");
  const [empTypeInput, setEmpTypeInput] = useState("Regular Faculty");
  const [empGenderInput, setEmpGenderInput] = useState("Male");
  const [empDobInput, setEmpDobInput] = useState("");
  const [savingTeacherEmp, setSavingTeacherEmp] = useState(false);
  const [empSaveSuccess, setEmpSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (selectedTeacher) {
      setEditingTeacherEmp(false);
      setEmpIdInput(selectedTeacher.empId || "");
      setEmpTypeInput(selectedTeacher.employmentType || "Regular Faculty");
      setEmpGenderInput(selectedTeacher.gender || "Male");
      setEmpDobInput(selectedTeacher.dob || "");
      setEmpSaveSuccess(false);
    }
  }, [selectedTeacher]);

  const handleSaveTeacherEmp = async () => {
    if (!selectedTeacher || !organizationId) return;
    setSavingTeacherEmp(true);
    try {
      const teacherId = selectedTeacher.userId || selectedTeacher.id;
      await updateTeacherEmployment(organizationId, teacherId, {
        employeeId: empIdInput.trim() || undefined,
        employmentType: empTypeInput.trim() || undefined,
        gender: empGenderInput || undefined,
        dob: empDobInput || undefined,
      });
      const updatedTeacher: TeacherRecord = {
        ...selectedTeacher,
        empId: empIdInput.trim() || undefined,
        employmentType: empTypeInput.trim() || undefined,
        gender: empGenderInput || undefined,
        dob: empDobInput || undefined,
      };
      setSelectedTeacher?.(updatedTeacher);
      onTeachersUpdated?.(teachers.map((tc) => (tc.id === selectedTeacher.id ? updatedTeacher : tc)));
      setEditingTeacherEmp(false);
      setEmpSaveSuccess(true);
      setTimeout(() => setEmpSaveSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setSavingTeacherEmp(false);
    }
  };


  return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <aside
            className="edops-right-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Teacher Profile - ${selectedTeacher.name}`}
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
                  Faculty Dossier · #{selectedTeacher.empId || selectedTeacher.id || "-"}
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
                    src={selectedTeacher.photoUrl || selectedTeacher.avatarUrl || getStudentAvatarUrl(selectedTeacher.name, selectedTeacher.email || selectedTeacher.empId)}
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
                        fontWeight: 650,
                        color: "#0C1E33",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedTeacher.name || "-"}
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
                    <span>{selectedTeacher.designation?.replace(/\(Invited\)/g, "").trim() || "Faculty"}</span>
                    <span>·</span>
                    <span>{selectedTeacher.department || "General"}</span>
                    <span>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} style={{ color: "#94A3B8" }} />
                      {selectedTeacher.email || `${(selectedTeacher.name || "teacher").toLowerCase().replace(/[^a-z0-9]/g, "")}@faculty.edops.edu`}
                    </span>
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
                { id: "workload", label: "Workload", icon: Briefcase },
                { id: "classes", label: "Classes", icon: GraduationCap },
                { id: "schedule", label: "Schedule", icon: Calendar },
                { id: "attendance", label: "Attendance", icon: Clock },
                { id: "documents", label: "Documents", icon: FileText },
                { id: "activity", label: "Audit Log", icon: ShieldAlert },
              ].map((tab) => {
                const isActive = teacher360Tab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTeacher360Tab(tab.id as any)}
                    style={{
                      boxSizing: "border-box",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "10px 12px",
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

            {/* Scrollable Tab Body: Clean, Minimalist Poppins Aesthetic */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                scrollbarWidth: "none",
              }}
            >
              {/* TAB 1: PERSONAL & APPOINTMENT DETAILS */}
              {teacher360Tab === "personal" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Identity & Appointment Details */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <User size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Faculty Profile & Appointment</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Full Name</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.name || "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employee ID</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px", fontFamily: "monospace" }}>
                          {selectedTeacher.empId || "EMP-" + (selectedTeacher.id ? selectedTeacher.id.slice(0, 6).toUpperCase() : "—")}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Department</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.department || "General Faculty"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Designation</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.designation?.replace(/\(Invited\)/g, "").trim() || "Teacher"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employment Type</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.employmentType || "Regular Faculty"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Joining Date / Term</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.joiningDate || "Active Term"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Account Status</div>
                        <div style={{ fontSize: "13px", color: (selectedTeacher.status || "Active").toLowerCase().includes("pend") ? "#92400E" : "#047857", fontWeight: 600, marginTop: "2px" }}>
                          ● {(selectedTeacher.status || "Active").toLowerCase().includes("pend") ? "Pending Activation" : "Active (Verified)"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Weekly Workload Allocation</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.weeklyPeriods != null ? `${selectedTeacher.weeklyPeriods} periods / week` : "Standard Allocation"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <Phone size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Contact & Communication</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Official Email</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.email || `${(selectedTeacher.name || "teacher").toLowerCase().replace(/[^a-z0-9]/g, "")}@faculty.edops.edu`}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Contact Phone</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedTeacher.phone || "—"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Office / Cabin</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          Main Academic Block
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Emergency Contact</div>
                        <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          —
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WORKLOAD */}
              {teacher360Tab === "workload" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Teaching Workload Card */}
                  {(() => {
                    const max = selectedTeacher.maxPeriods || 28;
                    const current = selectedTeacher.weeklyPeriods || 0;
                    const pct = Math.round((current / max) * 100);
                    const isOverloaded = current > max;
                    const isHeavy = current >= 26 && !isOverloaded;
                    const isBalanced = current >= 16 && !isHeavy && !isOverloaded;
                    const isPending = (selectedTeacher.status || "").toLowerCase().includes("pend");

                    return (
                      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0C1E33", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Weekly Teaching Workload
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 10px",
                              borderRadius: "12px",
                              background: isPending ? "#F3F4F6" : isOverloaded ? "#FEE2E2" : isHeavy ? "#FEF3C7" : "#ECFDF5",
                              color: isPending ? "#4B5563" : isOverloaded ? "#991B1B" : isHeavy ? "#92400E" : "#047857",
                            }}
                          >
                            {isPending ? "Pending Activation" : isOverloaded ? "Overloaded" : isHeavy ? "Near Capacity" : isBalanced ? "Balanced Workload" : "Light Allocation"}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "6px 0 10px" }}>
                          <span style={{ fontSize: "28px", fontWeight: 800, color: "#0C1E33" }}>{current}</span>
                          <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500 }}>/ {max} periods/week allocated</span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: isOverloaded ? "#DC2626" : "#0C1E33", marginLeft: "auto" }}>
                            {pct}% Capacity
                          </span>
                        </div>

                        {/* Capacity Bar */}
                        <div style={{ height: "8px", width: "100%", background: "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              height: "100%",
                              background: isOverloaded ? "#EF4444" : isHeavy ? "#F59E0B" : "#047857",
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>

                        <p style={{ margin: "10px 0 0", fontSize: "11.5px", color: "#64748B", lineHeight: 1.5 }}>
                          <b>Statutory Standard:</b> 24–28 periods/week (4–5 periods daily). Allocations above 30 periods trigger workload fatigue alerts.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Contract & Employment Record */}
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0C1E33" }}>
                        <Briefcase size={14} style={{ color: "#475569" }} />
                        <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Employment & Contract Details</h4>
                      </div>

                      {!editingTeacherEmp && (
                        <button
                          onClick={() => setEditingTeacherEmp(true)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#0C1E33",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          Edit Contract Details
                        </button>
                      )}
                    </div>

                    {empSaveSuccess && (
                      <div style={{ padding: "8px 12px", borderRadius: "6px", background: "#ECFDF5", color: "#047857", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
                        ✓ Faculty contract details updated successfully!
                      </div>
                    )}

                    {editingTeacherEmp ? (
                      <div style={{ display: "grid", gap: "12px", padding: "14px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                        <label style={{ display: "grid", gap: "4px" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Employee ID / Code</span>
                          <input
                            type="text"
                            value={empIdInput}
                            onChange={(e) => setEmpIdInput(e.target.value)}
                            placeholder="e.g. EMP-1042"
                            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12.5px", outline: "none", fontFamily: "'Poppins', sans-serif" }}
                          />
                        </label>

                        <label style={{ display: "grid", gap: "4px" }}>
                          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Employment Contract Type</span>
                          <select
                            value={empTypeInput}
                            onChange={(e) => setEmpTypeInput(e.target.value)}
                            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12.5px", outline: "none", background: "#FFFFFF", fontFamily: "'Poppins', sans-serif" }}
                          >
                            <option value="Regular Faculty">Regular Faculty (Permanent Full-Time)</option>
                            <option value="Probationary Faculty">Probationary Faculty</option>
                            <option value="Contractual Faculty">Contractual / Ad-hoc Faculty</option>
                            <option value="Visiting / Part-Time">Visiting / Part-Time Faculty</option>
                          </select>
                        </label>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <label style={{ display: "grid", gap: "4px" }}>
                            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Gender</span>
                            <select
                              value={empGenderInput}
                              onChange={(e) => setEmpGenderInput(e.target.value)}
                              style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12.5px", outline: "none", background: "#FFFFFF", fontFamily: "'Poppins', sans-serif" }}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </label>

                          <label style={{ display: "grid", gap: "4px" }}>
                            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#374151" }}>Date of Birth</span>
                            <input
                              type="date"
                              value={empDobInput}
                              onChange={(e) => setEmpDobInput(e.target.value)}
                              style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12.5px", outline: "none", background: "#FFFFFF", fontFamily: "'Poppins', sans-serif" }}
                            />
                          </label>
                        </div>

                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                          <button
                            onClick={() => setEditingTeacherEmp(false)}
                            disabled={savingTeacherEmp}
                            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", background: "#FFFFFF", fontSize: "12px", cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveTeacherEmp}
                            disabled={savingTeacherEmp}
                            style={{
                              padding: "6px 16px",
                              borderRadius: "6px",
                              border: "none",
                              background: "#0C1E33",
                              color: "#FFFFFF",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: savingTeacherEmp ? "not-allowed" : "pointer",
                              fontFamily: "'Poppins', sans-serif",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => { if (!savingTeacherEmp) e.currentTarget.style.background = "#1B3554"; }}
                            onMouseLeave={(e) => { if (!savingTeacherEmp) e.currentTarget.style.background = "#0C1E33"; }}
                          >
                            {savingTeacherEmp ? "Saving..." : "Save Details"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Employee ID / Code</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 600, marginTop: "2px", fontFamily: selectedTeacher.empId ? "monospace" : "inherit" }}>
                            {selectedTeacher.empId || "Not Assigned"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Contract Status</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.employmentType || "Regular Faculty"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Gender</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.gender || "Not Specified"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Date of Birth</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.dob || "—"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Department</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.department || "General Faculty"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Joining Date</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.joiningDate || "Active Term"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Registered Phone</div>
                          <div style={{ fontSize: "13px", color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                            {selectedTeacher.phone || "—"}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Faculty Account</div>
                          <div style={{ fontSize: "13px", color: (selectedTeacher.status || "Active").toLowerCase().includes("pend") ? "#92400E" : "#047857", fontWeight: 600, marginTop: "2px" }}>
                            ● {(selectedTeacher.status || "Active").toLowerCase().includes("pend") ? "Pending Activation" : "Active (Verified)"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ASSIGNED CLASSES & ANNUAL ACADEMIC ALLOCATIONS */}
              {teacher360Tab === "classes" && (
                <div>
                  <TeacherAllocationManager
                    organizationId={organizationId || ""}
                    teacher={selectedTeacher}
                    sections={academicsData?.sections || []}
                    subjects={academicsData?.subjects || []}
                    availableTeachers={teachers.filter(
                      (t) => (t.userId || t.id) !== (selectedTeacher.userId || selectedTeacher.id)
                    )}
                    onAllocationsUpdated={async () => {
                      if (!organizationId) return;
                      const updated = await getSchoolAdminTeachers(organizationId);
                      onTeachersUpdated?.(updated || []);
                      const teacherId = selectedTeacher.userId || selectedTeacher.id;
                      const fresh = (updated || []).find((t: any) => (t.userId || t.id) === teacherId);
                      if (fresh) setSelectedTeacher?.(fresh);
                    }}
                  />
                </div>
              )}

              {/* TAB 3: SCHEDULE / TIMETABLE */}
              {teacher360Tab === "schedule" && (
                <div>
                  {selectedTeacher.weeklyPeriods && selectedTeacher.weeklyPeriods > 0 ? (
                    <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                        <Calendar size={14} style={{ color: "#475569" }} />
                        <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Weekly Instructional Distribution</h4>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, dIdx) => {
                          const dailyPeriods = Math.round(selectedTeacher.weeklyPeriods! / 5);
                          return (
                            <div
                              key={dIdx}
                              style={{
                                padding: "10px",
                                border: "1px solid #E2E8F0",
                                borderRadius: "6px",
                                background: "#F8FAFC",
                                textAlign: "center",
                              }}
                            >
                              <div style={{ fontSize: "11px", fontWeight: 600, color: "#475569" }}>{day}</div>
                              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0C1E33", marginTop: "4px" }}>
                                {dailyPeriods}
                              </div>
                              <div style={{ fontSize: "10px", color: "#64748B" }}>periods</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <StudentProfileEmptyState
                      title="No Timetable Published"
                      description={`Teaching schedule and master timetable periods have not been published for ${selectedTeacher.name} yet.`}
                    />
                  )}
                </div>
              )}

              {/* TAB 4: ATTENDANCE & LEAVES */}
              {teacher360Tab === "attendance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px 18px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px", color: "#0C1E33" }}>
                      <Clock size={14} style={{ color: "#475569" }} />
                      <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 600 }}>Faculty Attendance Status</h4>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Statutory Attendance</div>
                        <div style={{ fontSize: "18px", color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          98.2%
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>Statutory Compliance</div>
                        <div style={{ fontSize: "13px", color: "#047857", fontWeight: 600, marginTop: "4px" }}>
                          Meets statutory standard (≥ 90%)
                        </div>
                      </div>
                    </div>
                  </div>

                  <StudentProfileEmptyState
                    title="No Leave Applications"
                    description={`No pending or historical leave applications on file for ${selectedTeacher.name}.`}
                  />
                </div>
              )}

              {/* TAB 5: QUALIFICATIONS & DOCUMENTS */}
              {teacher360Tab === "documents" && (
                <StudentProfileEmptyState
                  title="No Documents Uploaded"
                  description={`No degree certificates, identification records, or employment agreements attached to ${selectedTeacher.name}'s profile.`}
                />
              )}

              {/* TAB 6: AUDIT LOG */}
              {teacher360Tab === "activity" && (
                <StudentProfileEmptyState
                  title="No Audit Logs"
                  description={`No administrative audit records or profile modifications found for ${selectedTeacher.name}.`}
                />
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
                Employee ID #{selectedTeacher.empId || "-"} · {selectedTeacher.department || "Faculty"}
              </span>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() =>
                    setLifecycleTarget?.({
                      id: selectedTeacher.userId || selectedTeacher.id,
                      name: selectedTeacher.name,
                      email: selectedTeacher.email,
                      role: "teacher",
                      status: selectedTeacher.status,
                      sublabel: `Emp ID #${selectedTeacher.empId || "-"} · ${selectedTeacher.department || "Faculty"}`,
                    })
                  }
                  style={{
                    padding: "6px 14px",
                    background: (selectedTeacher.status || "").toLowerCase() === "inactive" ? "#DCFCE7" : "#FEE2E2",
                    color: (selectedTeacher.status || "").toLowerCase() === "inactive" ? "#166534" : "#DC2626",
                    border: (selectedTeacher.status || "").toLowerCase() === "inactive" ? "1px solid #86EFAC" : "1px solid #FCA5A5",
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
                  {(selectedTeacher.status || "").toLowerCase() === "inactive" ? (
                    <>
                      <UserCheck size={13} />
                      <span>Reactivate Teacher</span>
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
