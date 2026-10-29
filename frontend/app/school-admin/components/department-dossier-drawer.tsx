"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Mail,
  Phone,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { DepartmentRecord } from "../types";
import {
  updateDepartmentHod,
  updateDepartmentSubjects,
  getAvailableDepartmentSubjects,
  deleteSchoolAdminDepartment,
} from "@/app/edops-api";
import { SearchableSelect, SearchableSelectOption } from "@/app/components/searchable-select";

interface DepartmentDossierDrawerProps {
  department: DepartmentRecord | null;
  isOpen: boolean;
  organizationId: string;
  allTeachers: any[];
  allDepartments: DepartmentRecord[];
  onClose: () => void;
  onDepartmentUpdated: () => void;
}

export const DepartmentDossierDrawer: React.FC<DepartmentDossierDrawerProps> = ({
  department,
  isOpen,
  organizationId,
  allTeachers,
  allDepartments,
  onClose,
  onDepartmentUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "hod" | "subjects" | "faculty">("overview");
  
  // HOD Assignment States
  const [isEditingHod, setIsEditingHod] = useState(false);
  const [selectedHodId, setSelectedHodId] = useState<string | null>(null);
  const [savingHod, setSavingHod] = useState(false);
  const [hodError, setHodError] = useState<string | null>(null);
  const [hodSuccess, setHodSuccess] = useState<string | null>(null);

  // Subject Mapping States
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectToAdd, setSubjectToAdd] = useState<string | null>(null);
  const [savingSubjects, setSavingSubjects] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [subjectSearch, setSubjectSearch] = useState("");

  // Deletion State
  const [isDeletingDept, setIsDeletingDept] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset and load data when department changes
  useEffect(() => {
    if (department && isOpen) {
      setSelectedHodId(department.headTeacherId || null);
      setIsEditingHod(false);
      setHodError(null);
      setHodSuccess(null);
      setSubjectError(null);
      setConfirmDelete(false);

      // Load all available subjects for mapping
      if (organizationId) {
        setLoadingSubjects(true);
        getAvailableDepartmentSubjects(organizationId)
          .then((res) => {
            setAvailableSubjects(res || []);
          })
          .catch((err) => {
            console.error("Failed to load available subjects:", err);
          })
          .finally(() => {
            setLoadingSubjects(false);
          });
      }
    }
  }, [department, isOpen, organizationId]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Compute which teachers are already HOD of other departments
  // Rule: 1 Teacher can be HOD of ONLY 1 Department at a time
  const teacherHodMap = useMemo(() => {
    const map = new Map<string, string>(); // teacherId -> departmentName
    if (!department) return map;
    allDepartments.forEach((d) => {
      if (d.headTeacherId && d.id !== department.id) {
        map.set(d.headTeacherId, d.name);
      }
    });
    return map;
  }, [allDepartments, department?.id]);

  if (!isOpen || !department) return null;

  // Build Teacher Options for SearchableSelect
  const teacherOptions: SearchableSelectOption[] = allTeachers.map((t) => {
    const teacherId = t.userId || t.id;
    const isCurrent = teacherId === department.headTeacherId;
    const isOtherHodDept = teacherHodMap.get(teacherId);

    return {
      value: teacherId,
      label: t.name || t.email,
      sublabel: t.email ? `${t.email} • ${t.specialty || "Faculty"}` : (t.specialty || "Faculty"),
      badge: isCurrent ? "Current HOD" : isOtherHodDept ? `HOD (${isOtherHodDept})` : undefined,
      badgeColor: isCurrent ? "#DBEAFE" : "#FEF3C7",
      disabled: Boolean(isOtherHodDept),
      disabledReason: isOtherHodDept ? `Already leads ${isOtherHodDept}` : undefined,
    };
  });

  // Build Subject Options for SearchableSelect (to add subjects)
  // Rule: 1 Subject can belong to ONLY 1 Department at a time
  const currentSubjectIds = new Set((department.subjects || []).map((s) => s.id));
  const subjectOptions: SearchableSelectOption[] = availableSubjects
    .filter((s) => !currentSubjectIds.has(s.id))
    .map((s) => {
      const isOtherDept = s.departmentId && s.departmentId !== department.id;
      return {
        value: s.id,
        label: s.name,
        sublabel: s.code ? `Code: ${s.code}` : undefined,
        badge: isOtherDept ? `In ${s.departmentName || "Another Dept"}` : "Unassigned",
        badgeColor: isOtherDept ? "#FEE2E2" : "#DCFCE7",
        disabledReason: isOtherDept ? `Will move from ${s.departmentName}` : undefined,
      };
    });

  // HOD Save Handler
  const handleSaveHod = async () => {
    if (!organizationId || !department) return;
    setSavingHod(true);
    setHodError(null);
    setHodSuccess(null);

    try {
      await updateDepartmentHod(organizationId, department.id, selectedHodId);
      setHodSuccess(selectedHodId ? "Head of Department updated successfully!" : "Head of Department removed.");
      setIsEditingHod(false);
      onDepartmentUpdated();
    } catch (err: any) {
      console.error("Error saving HOD:", err);
      setHodError(err?.message || "Failed to update Department Head. Please try again.");
    } finally {
      setSavingHod(false);
    }
  };

  // Remove HOD directly
  const handleRemoveHod = async () => {
    if (!organizationId || !department) return;
    if (!confirm("Are you sure you want to remove the Head of Department for " + department.name + "?")) {
      return;
    }
    setSavingHod(true);
    setHodError(null);
    try {
      await updateDepartmentHod(organizationId, department.id, null);
      setSelectedHodId(null);
      setHodSuccess("Head of Department removed.");
      setIsEditingHod(false);
      onDepartmentUpdated();
    } catch (err: any) {
      console.error("Error removing HOD:", err);
      setHodError(err?.message || "Failed to remove Department Head.");
    } finally {
      setSavingHod(false);
    }
  };

  // Add Subject to Department
  const handleAddSubject = async () => {
    if (!organizationId || !department || !subjectToAdd) return;
    setSavingSubjects(true);
    setSubjectError(null);

    try {
      const existingIds = (department.subjects || []).map((s) => s.id);
      const newSubjectIds = Array.from(new Set([...existingIds, subjectToAdd]));
      await updateDepartmentSubjects(organizationId, department.id, newSubjectIds);
      setSubjectToAdd(null);
      onDepartmentUpdated();
    } catch (err: any) {
      console.error("Error adding subject:", err);
      setSubjectError(err?.message || "Failed to add subject.");
    } finally {
      setSavingSubjects(false);
    }
  };

  // Remove Subject from Department (unlinks it)
  const handleRemoveSubject = async (subjectId: string, subjectName: string) => {
    if (!organizationId || !department) return;
    if (!confirm(`Are you sure you want to remove "${subjectName}" from ${department.name}?`)) {
      return;
    }
    setSavingSubjects(true);
    setSubjectError(null);

    try {
      const existingIds = (department.subjects || []).map((s) => s.id);
      const newSubjectIds = existingIds.filter((id) => id !== subjectId);
      await updateDepartmentSubjects(organizationId, department.id, newSubjectIds);
      onDepartmentUpdated();
    } catch (err: any) {
      console.error("Error removing subject:", err);
      setSubjectError(err?.message || "Failed to remove subject.");
    } finally {
      setSavingSubjects(false);
    }
  };

  // Delete Department Handler
  const handleDeleteDepartment = async () => {
    if (!organizationId || !department) return;
    setIsDeletingDept(true);
    try {
      await deleteSchoolAdminDepartment(organizationId, department.id);
      onDepartmentUpdated();
      onClose();
    } catch (err: any) {
      console.error("Error deleting department:", err);
      alert(err?.message || "Failed to delete department.");
    } finally {
      setIsDeletingDept(false);
    }
  };

  const hasHod = Boolean(department.headTeacherId || (department.headName && department.headName !== "Unassigned"));
  const filteredSubjects = (department.subjects || []).filter((s) => {
    if (!subjectSearch) return true;
    const q = subjectSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q));
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        justifyContent: "flex-end",
        padding: 0,
        backgroundColor: "rgba(12, 30, 51, 0.45)",
        backdropFilter: "blur(3px)",
        animation: "fadeIn 0.2s ease-out",
        fontFamily: "'Poppins', sans-serif",
      }}
      onClick={onClose}
    >
      {/* Drawer Container */}
      <div
        className="edops-right-drawer"
        style={{
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "680px",
          height: "100%",
          background: "#FFFFFF",
          boxShadow: "-8px 0 32px rgba(12, 30, 51, 0.16)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E2E8F0",
            background: "#FAFCFE",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "10px",
                  background: "#E0D3FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#51249A",
                  fontWeight: 700,
                  fontSize: "16px",
                  letterSpacing: "0.02em",
                }}
              >
                {department.code?.slice(0, 4) || "DEPT"}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "19px",
                      fontWeight: 700,
                      color: "#0C1E33",
                      lineHeight: "120%",
                    }}
                  >
                    {department.name}
                  </h2>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "100px",
                      background: (department.status || "").toLowerCase().includes("pend") ? "#FEF3C7" : "#D1FAE5",
                      color: (department.status || "").toLowerCase().includes("pend") ? "#92400E" : "#065F46",
                    }}
                  >
                    {(department.status || "").toLowerCase().includes("pend") ? "Pending Setup" : "Active"}
                  </span>
                </div>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "12px",
                    color: "#64748B",
                  }}
                >
                  Location: <span style={{ color: "#334155", fontWeight: 500 }}>{department.location || "Academic Wing"}</span>
                  {" • "}
                  Code: <span style={{ color: "#334155", fontWeight: 600, fontFamily: "monospace" }}>{department.code}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#F1F5F9",
                border: "none",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748B",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#E2E8F0";
                e.currentTarget.style.color = "#0C1E33";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
                e.currentTarget.style.color = "#64748B";
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>
                Mapped Subjects
              </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#0C1E33" }}>
                {department.subjects?.length || 0}
              </span>
            </div>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>
                Faculty Load
              </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#0C1E33" }}>
                {department.teachersCount || department.teachers?.length || 0}
              </span>
            </div>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>
                Student Capacity
              </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#0C1E33" }}>
                {department.studentsCount || 0}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "6px",
              borderBottom: "1px solid #E2E8F0",
              paddingBottom: "8px",
            }}
          >
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "hod", label: "Head of Dept (HOD)", icon: ShieldCheck },
              { id: "subjects", label: `Subjects (${department.subjects?.length || 0})`, icon: BookOpen },
              { id: "faculty", label: `Faculty (${department.teachersCount || department.teachers?.length || 0})`, icon: GraduationCap },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: isSelected ? "#0C1E33" : "transparent",
                    color: isSelected ? "#FFFFFF" : "#64748B",
                    fontSize: "12px",
                    fontWeight: isSelected ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Body */}
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
          {/* Notification Messages */}
          {hodSuccess && (
            <div
              style={{
                padding: "10px 14px",
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#166534",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>✓ {hodSuccess}</span>
              <button
                type="button"
                onClick={() => setHodSuccess(null)}
                style={{ border: "none", background: "transparent", color: "#166534", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {hodError && (
            <div
              style={{
                padding: "10px 14px",
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#991B1B",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>⚠️ {hodError}</span>
              <button
                type="button"
                onClick={() => setHodError(null)}
                style={{ border: "none", background: "transparent", color: "#991B1B", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {subjectError && (
            <div
              style={{
                padding: "10px 14px",
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#991B1B",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>⚠️ {subjectError}</span>
              <button
                type="button"
                onClick={() => setSubjectError(null)}
                style={{ border: "none", background: "transparent", color: "#991B1B", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* 1. OVERVIEW TAB                                               */}
          {/* ============================================================== */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* HOD Summary Card */}
              <div
                style={{
                  background: "#FAFAFA",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={16} style={{ color: "#2563EB" }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                      Head of Department (HOD)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("hod")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563EB",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>Manage HOD</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {hasHod ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        background: "#DBEAFE",
                        color: "#1E40AF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "15px",
                      }}
                    >
                      {department.headName?.charAt(0) || "H"}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0C1E33" }}>
                        {department.headName}
                      </h4>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
                        {department.headEmail || "Active Department Lead"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "#FEF3C7",
                      borderRadius: "8px",
                      border: "1px dashed #F59E0B",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertTriangle size={16} style={{ color: "#D97706" }} />
                      <span style={{ fontSize: "12.5px", fontWeight: 500, color: "#92400E" }}>
                        No HOD assigned yet to lead this department.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("hod")}
                      style={{
                        padding: "4px 10px",
                        background: "#0C1E33",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Assign HOD
                    </button>
                  </div>
                )}
              </div>

              {/* Subjects Preview */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <BookOpen size={16} style={{ color: "#059669" }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                      Curriculum Subjects ({department.subjects?.length || 0})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("subjects")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563EB",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>Manage Subjects</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {department.subjects && department.subjects.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {department.subjects.map((sub) => (
                      <span
                        key={sub.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "#F1F5F9",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#334155",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#0C1E33" }}>{sub.name}</span>
                        {sub.code && <span style={{ fontSize: "10px", color: "#64748B" }}>({sub.code})</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>
                    No curriculum subjects mapped yet. Map subjects to link syllabus pacing.
                  </p>
                )}
              </div>

              {/* Faculty Preview */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <GraduationCap size={16} style={{ color: "#7C3AED" }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                      Faculty Instructors ({department.teachers?.length || 0})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("faculty")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563EB",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>View Faculty</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {department.teachers && department.teachers.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {department.teachers.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          background: "#F8FAFC",
                          borderRadius: "6px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: t.isHod ? "#DBEAFE" : "#E2E8F0",
                              color: t.isHod ? "#1E40AF" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            {t.name?.charAt(0) || "T"}
                          </div>
                          <div>
                            <span style={{ fontSize: "12.5px", fontWeight: 500, color: "#0C1E33" }}>
                              {t.name}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748B", marginLeft: "8px" }}>
                              {t.email}
                            </span>
                          </div>
                        </div>
                        {t.isHod && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "#EFF6FF",
                              color: "#2563EB",
                            }}
                          >
                            HOD
                          </span>
                        )}
                      </div>
                    ))}
                    {department.teachers.length > 3 && (
                      <span style={{ fontSize: "11px", color: "#64748B", textAlign: "center" }}>
                        +{department.teachers.length - 3} more faculty members
                      </span>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8" }}>
                    No teachers assigned to subjects in this department yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. HEAD OF DEPARTMENT (HOD) TAB                               */}
          {/* ============================================================== */}
          {activeTab === "hod" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <h3 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 600, color: "#0C1E33" }}>
                  Head of Department Assignment
                </h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748B", lineHeight: "140%" }}>
                  The HOD oversees curriculum delivery, monitors syllabus pacing across subjects, and leads affiliated faculty.
                  <b style={{ color: "#0C1E33" }}> Rule: </b> A faculty member can only serve as HOD for 1 department at a time.
                </p>
              </div>

              {/* Current HOD Info */}
              {hasHod && !isEditingHod ? (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                      Active Department Head
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "100px",
                        background: "#EFF6FF",
                        color: "#2563EB",
                      }}
                    >
                      Lead Administrator
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        background: "#E0D3FF",
                        color: "#51249A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "18px",
                      }}
                    >
                      {department.headName?.charAt(0) || "H"}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0C1E33" }}>
                        {department.headName}
                      </h4>
                      {department.headEmail && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                          <Mail size={12} style={{ color: "#64748B" }} />
                          <span style={{ fontSize: "12px", color: "#64748B" }}>{department.headEmail}</span>
                        </div>
                      )}
                      {department.headPhone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          <Phone size={12} style={{ color: "#64748B" }} />
                          <span style={{ fontSize: "12px", color: "#64748B" }}>{department.headPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "10px", paddingTop: "8px", borderTop: "1px solid #F1F5F9" }}>
                    <button
                      type="button"
                      onClick={() => setIsEditingHod(true)}
                      style={{
                        flex: 1,
                        padding: "9px 14px",
                        background: "#0C1E33",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <UserCheck size={14} />
                      <span>Change HOD</span>
                    </button>
                    <button
                      type="button"
                      disabled={savingHod}
                      onClick={handleRemoveHod}
                      style={{
                        padding: "9px 14px",
                        background: "#FEE2E2",
                        color: "#DC2626",
                        border: "1px solid #FCA5A5",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: savingHod ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <UserX size={14} />
                      <span>Remove HOD</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* HOD Assignment Form */
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                    Select Faculty Member for HOD
                  </label>

                  <SearchableSelect
                    options={teacherOptions}
                    value={selectedHodId}
                    onChange={(val) => setSelectedHodId(val)}
                    placeholder="Search by faculty name or email..."
                    searchPlaceholder="Type teacher name, email..."
                    clearable={true}
                  />

                  <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    <button
                      type="button"
                      disabled={savingHod || !selectedHodId}
                      onClick={handleSaveHod}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        background: !selectedHodId ? "#E2E8F0" : "#2563EB",
                        color: !selectedHodId ? "#94A3B8" : "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: !selectedHodId || savingHod ? "not-allowed" : "pointer",
                      }}
                    >
                      {savingHod ? "Saving HOD..." : "Confirm & Assign HOD"}
                    </button>
                    {hasHod && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingHod(false);
                          setSelectedHodId(department.headTeacherId || null);
                        }}
                        style={{
                          padding: "10px 16px",
                          background: "#F1F5F9",
                          color: "#475569",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. CURRICULUM SUBJECTS TAB                                    */}
          {/* ============================================================== */}
          {activeTab === "subjects" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Add Subject Section */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plus size={16} style={{ color: "#2563EB" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                    Map Additional Subject
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>
                  Select an existing school subject to link to <b>{department.name}</b>.
                  Each subject belongs to exactly 1 department.
                </p>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <SearchableSelect
                      options={subjectOptions}
                      value={subjectToAdd}
                      onChange={(val) => setSubjectToAdd(val)}
                      placeholder="Search and select a subject..."
                      searchPlaceholder="Search subject by name or code..."
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!subjectToAdd || savingSubjects}
                    onClick={handleAddSubject}
                    style={{
                      padding: "0 18px",
                      height: "42px",
                      background: !subjectToAdd ? "#E2E8F0" : "#0C1E33",
                      color: !subjectToAdd ? "#94A3B8" : "#FFFFFF",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: !subjectToAdd || savingSubjects ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {savingSubjects ? "Linking..." : "+ Add to Dept"}
                  </button>
                </div>
              </div>

              {/* Mapped Subjects List with Search Filter */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                    Currently Mapped Subjects ({department.subjects?.length || 0})
                  </span>
                  {(department.subjects?.length || 0) > 3 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#F1F5F9",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        width: "160px",
                      }}
                    >
                      <Search size={12} style={{ color: "#64748B" }} />
                      <input
                        type="text"
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        placeholder="Filter subjects..."
                        style={{
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontSize: "11px",
                          width: "100%",
                          color: "#0C1E33",
                        }}
                      />
                    </div>
                  )}
                </div>

                {filteredSubjects.length === 0 ? (
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      background: "#FAFAFA",
                      borderRadius: "8px",
                      border: "1px dashed #CBD5E1",
                      color: "#64748B",
                      fontSize: "12.5px",
                    }}
                  >
                    {subjectSearch
                      ? `No mapped subjects match "${subjectSearch}"`
                      : "No subjects are currently mapped to this department."}
                  </div>
                ) : (
                  filteredSubjects.map((sub: any) => (
                    <div
                      key={sub.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#0C1E33" }}>
                            {sub.name}
                          </span>
                          {sub.code && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: "#F1F5F9",
                                color: "#475569",
                              }}
                            >
                              {sub.code}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                          <span style={{ fontSize: "11px", color: "#64748B" }}>
                            Teachers: <b style={{ color: "#334155" }}>{sub.teachersCount ?? 0}</b>
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748B" }}>
                            Sections: <b style={{ color: "#334155" }}>{sub.sectionsCount ?? 0}</b>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={savingSubjects}
                        onClick={() => handleRemoveSubject(sub.id, sub.name)}
                        style={{
                          background: "#FEE2E2",
                          border: "none",
                          borderRadius: "6px",
                          width: "30px",
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#DC2626",
                          cursor: savingSubjects ? "not-allowed" : "pointer",
                          transition: "all 0.15s ease",
                        }}
                        title={`Remove ${sub.name} from department`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. AFFILIATED FACULTY TAB                                     */}
          {/* ============================================================== */}
          {activeTab === "faculty" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                  Affiliated Faculty Instructors ({department.teachers?.length || 0})
                </span>
                <span style={{ fontSize: "11px", color: "#64748B" }}>
                  Assigned via department subjects & HOD role
                </span>
              </div>

              {(!department.teachers || department.teachers.length === 0) ? (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    background: "#FAFAFA",
                    borderRadius: "8px",
                    border: "1px dashed #CBD5E1",
                    color: "#64748B",
                    fontSize: "12.5px",
                  }}
                >
                  No faculty instructors are currently teaching subjects under this department.
                </div>
              ) : (
                department.teachers.map((t: any) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: t.isHod ? "#E0D3FF" : "#F1F5F9",
                          color: t.isHod ? "#51249A" : "#334155",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "13px",
                        }}
                      >
                        {t.name?.charAt(0) || "T"}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0C1E33" }}>
                            {t.name}
                          </span>
                          {t.isHod ? (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: "#EFF6FF",
                                color: "#2563EB",
                              }}
                            >
                              Head of Department
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 500,
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: "#F1F5F9",
                                color: "#475569",
                              }}
                            >
                              Faculty Teacher
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
                          {t.email && (
                            <span style={{ fontSize: "11px", color: "#64748B" }}>
                              {t.email}
                            </span>
                          )}
                          {t.phone && t.phone !== "-" && (
                            <span style={{ fontSize: "11px", color: "#64748B" }}>
                              • {t.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {t.empId && (
                      <span style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>
                        #{t.empId}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* Danger Zone: Delete Department                                */}
          {/* ============================================================== */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "20px",
              borderTop: "1px solid #F1F5F9",
            }}
          >
            {confirmDelete ? (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: "8px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991B1B" }}>
                  <AlertTriangle size={16} />
                  <span style={{ fontSize: "12.5px", fontWeight: 600 }}>
                    Are you sure you want to delete {department.name}?
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "11.5px", color: "#7F1D1D", lineHeight: "140%" }}>
                  All mapped subjects will be unlinked (no subjects will be deleted). This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    disabled={isDeletingDept}
                    onClick={handleDeleteDepartment}
                    style={{
                      padding: "8px 14px",
                      background: "#DC2626",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: isDeletingDept ? "not-allowed" : "pointer",
                    }}
                  >
                    {isDeletingDept ? "Deleting..." : "Yes, Delete Department"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      padding: "8px 14px",
                      background: "#FFFFFF",
                      color: "#374151",
                      border: "1px solid #D1D5DB",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#DC2626",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 0",
                }}
              >
                <Trash2 size={13} />
                <span>Delete this academic department</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
