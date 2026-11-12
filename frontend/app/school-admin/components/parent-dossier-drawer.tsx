"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Mail,
  Phone,
  Users,
  GraduationCap,
  UserCheck,
  UserX,
  CheckCircle2,
  Search,
  Filter,
  Shield,
  Send,
  Bus,
} from "lucide-react";
import { ParentRecord, StudentRecord } from "../types";
import {
  getStudentAvatarUrl,
  updateParentChildren,
  getSchoolAdminParents,
} from "../../edops-api";
import { MemberLifecycleTarget } from "../../components/member-lifecycle-modal";
import { StudentProfileEmptyState } from "./people-helpers";

export interface ParentDossierDrawerProps {
  parent: ParentRecord | null;
  onClose: () => void;
  organizationId: string;
  parents: ParentRecord[];
  students: StudentRecord[];
  academicsData: { programs?: any[]; sections?: any[]; subjects?: any[]; [key: string]: any } | null;
  parent360Tab: "wards" | "contact" | "communications" | "finance" | "activity" | string;
  onTabChange: (tab: any) => void;
  onLifecycleAction?: (target: MemberLifecycleTarget) => void;
  onParentsUpdated?: (parents: ParentRecord[]) => void;
  onParentSelected?: (parent: any) => void;
  isMappingWards?: boolean;
  onMappingWardsChange?: (mapping: boolean) => void;
}

export function ParentDossierDrawer({
  parent: selectedParent,
  onClose,
  organizationId,
  parents,
  students,
  academicsData,
  parent360Tab,
  onTabChange: setParent360Tab,
  onLifecycleAction: setLifecycleTarget,
  onParentsUpdated,
  onParentSelected: setSelectedParent,
  isMappingWards: controlledIsMappingWards,
  onMappingWardsChange,
}: ParentDossierDrawerProps) {
  if (!selectedParent) return null;

  const [internalIsMappingWards, setInternalIsMappingWards] = useState(false);
  const isMappingWards = controlledIsMappingWards !== undefined ? controlledIsMappingWards : internalIsMappingWards;
  const setIsMappingWards = (val: boolean) => {
    setInternalIsMappingWards(val);
    onMappingWardsChange?.(val);
  };
  const [selectedWardIds, setSelectedWardIds] = useState<string[]>([]);
  const [wardSearchQuery, setWardSearchQuery] = useState("");
  const [wardClassFilter, setWardClassFilter] = useState("");
  const [wardSectionFilter, setWardSectionFilter] = useState("all");
  const [wardUnmappedOnly, setWardUnmappedOnly] = useState(false);
  const [savingWards, setSavingWards] = useState(false);
  // academicsData passed via props

  React.useEffect(() => {
    if (isMappingWards && selectedParent) {
      const currentIds = (selectedParent.children || []).map((ch: any) => ch.studentId || ch.id).filter(Boolean);
      setSelectedWardIds(currentIds);
      setWardSearchQuery("");
      const firstChild = (selectedParent.children || [])[0];
      const initialClass = firstChild?.grade || "";
      const initialSection = firstChild?.section || "all";
      setWardClassFilter(initialClass);
      setWardSectionFilter(initialSection);
      setWardUnmappedOnly(false);
    }
  }, [isMappingWards, selectedParent]);

  const handleStartMappingWards = (parent: ParentRecord) => {
    const currentIds = (parent.children || []).map((ch: any) => ch.studentId || ch.id).filter(Boolean);
    setSelectedWardIds(currentIds);
    setWardSearchQuery("");
    const firstChild = (parent.children || [])[0];
    const initialClass = firstChild?.grade || "";
    const initialSection = firstChild?.section || "all";
    setWardClassFilter(initialClass);
    setWardSectionFilter(initialSection);
    setWardUnmappedOnly(false);
    setIsMappingWards(true);
  };

  const handleSaveWardsInsideDossier = async () => {
    if (!organizationId || !selectedParent) return;
    setSavingWards(true);
    try {
      await updateParentChildren(organizationId, selectedParent.id, selectedWardIds);
      const updated = await getSchoolAdminParents(organizationId);
      const parentList = updated || [];
      onParentsUpdated?.(parentList);
      const updatedParent = parentList.find((p: any) => p.id === selectedParent.id);
      if (updatedParent) {
        setSelectedParent?.(updatedParent);
      } else {
        const mappedStudents = students
          .filter((s) => selectedWardIds.includes(s.userId || s.id))
          .map((s) => ({
            id: s.userId || s.id,
            studentId: s.userId || s.id,
            name: s.name,
            studentName: s.name,
            admissionNo: s.admissionNo || s.admissionNumber,
            grade: s.grade || s.className,
            section: s.section || s.sectionName,
            class: [s.grade || s.className, s.section || s.sectionName].filter(Boolean).join(" "),
          }));
        setSelectedParent?.((prev: any) => (prev ? { ...prev, children: mappedStudents } : prev));
      }
      setIsMappingWards(false);
    } catch (err: any) {
      alert(err?.message || "Failed to update mapped wards");
    } finally {
      setSavingWards(false);
    }
  };

  const handleUnlinkWard = async (studentIdToUnlink: string) => {
    if (!organizationId || !selectedParent) return;
    const nextIds = (selectedParent.children || [])
      .map((ch: any) => ch.studentId || ch.id)
      .filter((id: string) => id && id !== studentIdToUnlink);
    setSavingWards(true);
    try {
      await updateParentChildren(organizationId, selectedParent.id, nextIds);
      const updated = await getSchoolAdminParents(organizationId);
      const parentList = updated || [];
      onParentsUpdated?.(parentList);
      const updatedParent = parentList.find((p: any) => p.id === selectedParent.id);
      if (updatedParent) {
        setSelectedParent?.(updatedParent);
      } else {
        setSelectedParent?.((prev: any) =>
          prev
            ? {
                ...prev,
                children: (prev.children || []).filter(
                  (ch: any) => (ch.studentId || ch.id) !== studentIdToUnlink
                ),
              }
            : prev
        );
      }
    } catch (err: any) {
      alert(err?.message || "Failed to unlink ward");
    } finally {
      setSavingWards(false);
    }
  };

  const availableClassesForWards = useMemo(() => {
    const set = new Set<string>();
    (academicsData?.programs || []).forEach((p: any) => {
      if (p.name) set.add(p.name);
    });
    students.forEach((s) => {
      const cls = s.grade || s.className;
      if (cls) set.add(cls);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [academicsData, students]);

  const availableSectionsForWards = useMemo(() => {
    const set = new Set<string>();
    (academicsData?.sections || []).forEach((sec: any) => {
      if (!wardClassFilter || wardClassFilter === "all" || (sec.programName || "").toLowerCase() === wardClassFilter.toLowerCase()) {
        if (sec.name) set.add(sec.name);
      }
    });
    students.forEach((s) => {
      const cls = (s.grade || s.className || "").toLowerCase();
      if (wardClassFilter && wardClassFilter !== "all" && cls !== wardClassFilter.toLowerCase()) {
        return;
      }
      const sec = s.section || s.sectionName;
      if (sec) set.add(sec);
    });
    return Array.from(set).sort();
  }, [academicsData, students, wardClassFilter]);

  const studentGuardianMap = useMemo(() => {
    const map = new Map<string, { parentName: string; rel?: string }[]>();
    parents.forEach((p) => {
      (p.children || []).forEach((ch: any) => {
        const sid = ch.studentId || ch.id;
        if (sid) {
          const list = map.get(sid) || [];
          list.push({ parentName: p.name || "Guardian", rel: p.relationship || "" });
          map.set(sid, list);
        }
      });
    });
    return map;
  }, [parents]);

  const unlinkedStudentsCount = useMemo(() => {
    return students.filter((s) => !studentGuardianMap.has(s.userId || s.id)).length;
  }, [students, studentGuardianMap]);

  const filteredStudentsForWards = useMemo(() => {
    if (!wardClassFilter) {
      return [];
    }
    return students.filter((s) => {
      const sid = s.userId || s.id;
      // Class/Grade filter
      if (wardClassFilter !== "all") {
        const cls = (s.grade || s.className || "").toLowerCase();
        if (cls !== wardClassFilter.toLowerCase()) return false;
      }
      // Section filter
      if (wardSectionFilter !== "all") {
        const sec = (s.section || s.sectionName || "").toLowerCase();
        if (sec !== wardSectionFilter.toLowerCase()) return false;
      }
      // Unmapped only filter
      if (wardUnmappedOnly) {
        const mapped = studentGuardianMap.has(sid);
        const isCurrentSelected = selectedWardIds.includes(sid);
        if (mapped && !isCurrentSelected) return false;
      }
      // Search query filter
      if (wardSearchQuery.trim()) {
        const q = wardSearchQuery.toLowerCase().trim();
        const nameMatch = (s.name || "").toLowerCase().includes(q);
        const admMatch = (s.admissionNo || s.admissionNumber || "").toLowerCase().includes(q);
        const classMatch = [s.grade, s.className, s.section, s.sectionName].filter(Boolean).join(" ").toLowerCase().includes(q);
        const rollMatch = (s.rollNo || s.rollNumber || "").toLowerCase().includes(q);
        if (!nameMatch && !admMatch && !classMatch && !rollMatch) return false;
      }
      return true;
    });
  }, [students, wardSearchQuery, wardClassFilter, wardSectionFilter, wardUnmappedOnly, studentGuardianMap, selectedWardIds]);



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
            aria-label={`Guardian Profile - ${selectedParent.name}`}
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
                  Guardian Dossier · #{selectedParent.id ? selectedParent.id.slice(0, 8).toUpperCase() : "-"}
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

              {/* Profile identity banner */}
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
                    src={getStudentAvatarUrl(selectedParent.name, selectedParent.mobile || selectedParent.email)}
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
                      {selectedParent.name || "-"}
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
                    <span>{selectedParent.relationship || "Guardian"}</span>
                    <span>·</span>
                    <span>{selectedParent.occupation || "Parent"}</span>
                    <span>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} style={{ color: "#94A3B8" }} />
                      {selectedParent.email || `${(selectedParent.name || "parent").toLowerCase().replace(/[^a-z0-9]/g, "")}@guardian.edops.edu`}
                    </span>
                    {selectedParent.mobile && (
                      <>
                        <span>·</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Phone size={12} style={{ color: "#94A3B8" }} />
                          {selectedParent.mobile}
                        </span>
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
                { id: "wards", label: "Profile & Wards", icon: Users },
                { id: "communications", label: "Communications", icon: Send },
                { id: "permissions", label: "Portal Permissions", icon: Shield },
              ].map((tab) => {
                const isActive = parent360Tab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setParent360Tab(tab.id as any)}
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
                      marginBottom: "-1px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#0C1E33";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#64748B";
                    }}
                  >
                    <TabIcon size={13} style={{ color: isActive ? "#0C1E33" : "#94A3B8" }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {parent360Tab === "wards" && (
                <>
                  {/* Guardian details card */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 650, color: "#0C1E33", letterSpacing: "0.01em" }}>
                      Guardian Profile & Contact
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 16px", fontSize: "12px" }}>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Full Name</div>
                        <div style={{ color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          {selectedParent.name || "—"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Relationship</div>
                        <div style={{ color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          {selectedParent.relationship || "Guardian"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Primary Mobile</div>
                        <div style={{ color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          {selectedParent.mobile || "—"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Email Address</div>
                        <div style={{ color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedParent.email || `${(selectedParent.name || "parent").toLowerCase().replace(/[^a-z0-9]/g, "")}@guardian.edops.edu`}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Occupation</div>
                        <div style={{ color: "#0C1E33", fontWeight: 600, marginTop: "2px" }}>
                          {selectedParent.occupation || "Not Specified"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Account Status</div>
                        <div style={{ fontSize: "12.5px", color: (selectedParent.invitationStatus || "").toLowerCase() === "accepted" ? "#047857" : "#92400E", fontWeight: 600, marginTop: "2px" }}>
                          ● {selectedParent.invitationStatus || selectedParent.accountStatus || "Accepted"}
                        </div>
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <div style={{ color: "#64748B", fontSize: "11px" }}>Residential Address</div>
                        <div style={{ color: "#0C1E33", fontWeight: 500, marginTop: "2px" }}>
                          {selectedParent.address || "Standard Campus Ward Register"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linked Wards Section (Embedded inside the Dossier) */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Users size={14} style={{ color: "#475569" }} />
                        <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 650, color: "#0C1E33", letterSpacing: "0.01em" }}>
                          Enrolled Wards ({selectedParent.children?.length || 0})
                        </h4>
                      </div>

                      {!isMappingWards && (
                        <button
                          type="button"
                          onClick={() => handleStartMappingWards(selectedParent)}
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "4px 12px",
                            borderRadius: "6px",
                            background: "#0C1E33",
                            color: "#FFFFFF",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "'Poppins', sans-serif",
                            transition: "background 0.12s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#1B3554")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#0C1E33")}
                        >
                          {selectedParent.children && selectedParent.children.length > 0 ? "Edit Mappings" : "+ Link Students"}
                        </button>
                      )}
                    </div>

                    {isMappingWards ? (
                      /* Enhanced Inline Ward Mapping Selector inside the Dossier */
                      <div
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #CBD5E1",
                          borderRadius: "10px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          boxShadow: "0 4px 14px rgba(12, 30, 51, 0.05)",
                        }}
                      >
                        {/* Selector Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0C1E33" }}>
                              Link Student Wards
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                              Assign enrolled student records to <b>{selectedParent.name}</b>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsMappingWards(false)}
                            style={{
                              background: "#F1F5F9",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              color: "#64748B",
                              cursor: "pointer",
                              padding: "4px 8px",
                            }}
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Selected Wards Chip Tray (Always visible so selections across searches aren't lost!) */}
                        {selectedWardIds.length > 0 && (
                          <div
                            style={{
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              borderRadius: "6px",
                              padding: "8px 10px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontWeight: 700, color: "#0C1E33" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <CheckCircle2 size={13} color="#059669" />
                                Selected Wards ({selectedWardIds.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedWardIds([])}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#DC2626",
                                  fontSize: "10.5px",
                                  cursor: "pointer",
                                  padding: 0,
                                  fontWeight: 600,
                                }}
                              >
                                Clear all
                              </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {selectedWardIds.map((sid) => {
                                const s = students.find((x) => (x.userId || x.id) === sid);
                                const name = s ? s.name : "Student";
                                const cls = s ? [s.grade || s.className, s.section || s.sectionName].filter(Boolean).join("-") : "";
                                return (
                                  <span
                                    key={sid}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      background: "#0C1E33",
                                      color: "#F8E7C9",
                                      padding: "3px 8px",
                                      borderRadius: "100px",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <span>{name}</span>
                                    {cls && <span style={{ opacity: 0.8, fontSize: "10px" }}>({cls})</span>}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedWardIds((prev) => prev.filter((id) => id !== sid))}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "#F8E7C9",
                                        cursor: "pointer",
                                        padding: 0,
                                        display: "inline-flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Step 1: Dedicated Class & Section Scope Selector */}
                        <div
                          style={{
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: "8px",
                            padding: "10px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0C1E33", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Step 1: Select Class & Section
                            </span>
                            {wardClassFilter && (
                              <button
                                type="button"
                                onClick={() => {
                                  setWardClassFilter("");
                                  setWardSectionFilter("all");
                                  setWardSearchQuery("");
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#DC2626",
                                  fontSize: "10.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                Change Class
                              </button>
                            )}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {/* Class Selector */}
                            <div>
                              <label style={{ display: "block", fontSize: "10.5px", fontWeight: 600, color: "#475569", marginBottom: "3px" }}>
                                Class / Grade
                              </label>
                              <select
                                value={wardClassFilter}
                                onChange={(e) => {
                                  setWardClassFilter(e.target.value);
                                  setWardSectionFilter("all");
                                }}
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  fontSize: "12px",
                                  fontWeight: wardClassFilter ? 600 : 400,
                                  border: "1.5px solid",
                                  borderColor: wardClassFilter ? "#0C1E33" : "#CBD5E1",
                                  borderRadius: "6px",
                                  background: wardClassFilter ? "#0C1E33" : "#FFFFFF",
                                  color: wardClassFilter ? "#F8E7C9" : "#0C1E33",
                                  outline: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="">-- Choose Class --</option>
                                <option value="all">All Classes (School-wide)</option>
                                {availableClassesForWards.map((cls) => (
                                  <option key={cls} value={cls}>
                                    {cls}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Section Selector */}
                            <div>
                              <label style={{ display: "block", fontSize: "10.5px", fontWeight: 600, color: "#475569", marginBottom: "3px" }}>
                                Section
                              </label>
                              <select
                                value={wardSectionFilter}
                                disabled={!wardClassFilter}
                                onChange={(e) => setWardSectionFilter(e.target.value)}
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  fontSize: "12px",
                                  fontWeight: wardSectionFilter !== "all" ? 600 : 400,
                                  border: "1.5px solid",
                                  borderColor: !wardClassFilter ? "#E2E8F0" : wardSectionFilter !== "all" ? "#0C1E33" : "#CBD5E1",
                                  borderRadius: "6px",
                                  background: !wardClassFilter ? "#F1F5F9" : wardSectionFilter !== "all" ? "#0C1E33" : "#FFFFFF",
                                  color: !wardClassFilter ? "#94A3B8" : wardSectionFilter !== "all" ? "#F8E7C9" : "#0C1E33",
                                  outline: "none",
                                  cursor: !wardClassFilter ? "not-allowed" : "pointer",
                                }}
                              >
                                <option value="all">
                                  {wardClassFilter ? `All Sections in ${wardClassFilter}` : "Select Class first"}
                                </option>
                                {availableSectionsForWards.map((sec) => (
                                  <option key={sec} value={sec}>
                                    {sec}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Quick Class Pills for 1-click selection */}
                          {availableClassesForWards.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "2px" }}>
                              <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 600 }}>Quick Class:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setWardClassFilter("all");
                                  setWardSectionFilter("all");
                                }}
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontSize: "10.5px",
                                  fontWeight: 600,
                                  border: wardClassFilter === "all" ? "1px solid #0C1E33" : "1px solid #CBD5E1",
                                  background: wardClassFilter === "all" ? "#0C1E33" : "#FFFFFF",
                                  color: wardClassFilter === "all" ? "#F8E7C9" : "#334155",
                                  cursor: "pointer",
                                  transition: "all 0.1s ease",
                                }}
                              >
                                All Classes
                              </button>
                              {availableClassesForWards.map((cls) => {
                                const isSelected = wardClassFilter === cls;
                                return (
                                  <button
                                    key={cls}
                                    type="button"
                                    onClick={() => {
                                      setWardClassFilter(cls);
                                      setWardSectionFilter("all");
                                    }}
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: "4px",
                                      fontSize: "10.5px",
                                      fontWeight: 600,
                                      border: isSelected ? "1px solid #0C1E33" : "1px solid #CBD5E1",
                                      background: isSelected ? "#0C1E33" : "#FFFFFF",
                                      color: isSelected ? "#F8E7C9" : "#334155",
                                      cursor: "pointer",
                                      transition: "all 0.1s ease",
                                    }}
                                  >
                                    {cls}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Quick Section Pills (when class is chosen and sections exist) */}
                          {availableSectionsForWards.length > 0 && wardClassFilter && (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                              <span style={{ fontSize: "10px", color: "#64748B", fontWeight: 600 }}>Section:</span>
                              <button
                                type="button"
                                onClick={() => setWardSectionFilter("all")}
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  border: wardSectionFilter === "all" ? "1px solid #0C1E33" : "1px solid #CBD5E1",
                                  background: wardSectionFilter === "all" ? "#0C1E33" : "#FFFFFF",
                                  color: wardSectionFilter === "all" ? "#F8E7C9" : "#334155",
                                  cursor: "pointer",
                                }}
                              >
                                All
                              </button>
                              {availableSectionsForWards.map((sec) => {
                                const isSelected = wardSectionFilter === sec;
                                return (
                                  <button
                                    key={sec}
                                    type="button"
                                    onClick={() => setWardSectionFilter(sec)}
                                    style={{
                                      padding: "2px 7px",
                                      borderRadius: "4px",
                                      fontSize: "10px",
                                      fontWeight: 600,
                                      border: isSelected ? "1px solid #0C1E33" : "1px solid #CBD5E1",
                                      background: isSelected ? "#0C1E33" : "#FFFFFF",
                                      color: isSelected ? "#F8E7C9" : "#334155",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {sec}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Step 2: Student Search & Filter Bar (Active when Class is selected) */}
                        {wardClassFilter ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {/* Search Input */}
                              <div style={{ position: "relative", flex: 1 }}>
                                <Search
                                  size={14}
                                  style={{
                                    position: "absolute",
                                    left: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94A3B8",
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder={`Search ${wardClassFilter !== "all" ? wardClassFilter : "students"} by name, roll, admission no...`}
                                  value={wardSearchQuery}
                                  onChange={(e) => setWardSearchQuery(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "6px 26px 6px 30px",
                                    fontSize: "11.5px",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "6px",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    fontFamily: "'Poppins', sans-serif",
                                    background: "#FFFFFF",
                                  }}
                                />
                                {wardSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setWardSearchQuery("")}
                                    style={{
                                      position: "absolute",
                                      right: "8px",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      background: "none",
                                      border: "none",
                                      padding: 0,
                                      cursor: "pointer",
                                      color: "#94A3B8",
                                      display: "flex",
                                    }}
                                  >
                                    <X size={13} />
                                  </button>
                                )}
                              </div>

                              {/* Unlinked Only Filter Toggle */}
                              <button
                                type="button"
                                onClick={() => setWardUnmappedOnly((prev) => !prev)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "5px 9px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  border: "1px solid",
                                  borderColor: wardUnmappedOnly ? "#0C1E33" : "#CBD5E1",
                                  background: wardUnmappedOnly ? "#0C1E33" : "#FFFFFF",
                                  color: wardUnmappedOnly ? "#F8E7C9" : "#475569",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  transition: "all 0.12s ease",
                                }}
                                title="Show only students who do not have any guardian linked yet"
                              >
                                <span>Unlinked</span>
                                <span
                                  style={{
                                    fontSize: "9.5px",
                                    padding: "1px 5px",
                                    borderRadius: "100px",
                                    background: wardUnmappedOnly ? "rgba(248, 231, 201, 0.25)" : "#F1F5F9",
                                  }}
                                >
                                  {unlinkedStudentsCount}
                                </span>
                              </button>
                            </div>

                            {/* Active Class & Section Scope Banner */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "4px 8px",
                                background: "#F1F5F9",
                                borderRadius: "4px",
                                fontSize: "10.5px",
                                color: "#334155",
                              }}
                            >
                              <span>
                                Showing: <b>{wardClassFilter !== "all" ? wardClassFilter : "All Classes"}</b>
                                {wardSectionFilter !== "all" ? ` • ${wardSectionFilter}` : " • All Sections"}
                              </span>
                              <span style={{ color: "#64748B" }}>
                                <b>{filteredStudentsForWards.length}</b> student{filteredStudentsForWards.length === 1 ? "" : "s"} found
                              </span>
                            </div>
                          </div>
                        ) : null}

                        {/* Student selection list */}
                        <div
                          style={{
                            maxHeight: "270px",
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            paddingRight: "4px",
                          }}
                        >
                          {!wardClassFilter ? (
                            <div
                              style={{
                                padding: "28px 16px",
                                textAlign: "center",
                                background: "#F8FAFC",
                                border: "1px dashed #CBD5E1",
                                borderRadius: "8px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  background: "#EFF6FF",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#2563EB",
                                }}
                              >
                                <GraduationCap size={22} />
                              </div>
                              <div>
                                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0C1E33" }}>
                                  Select Class & Section to View Students
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px", maxWidth: "320px" }}>
                                  Choose a Class and Section above to display students from the database for ward mapping.
                                </div>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginTop: "4px" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWardClassFilter("all");
                                    setWardSectionFilter("all");
                                  }}
                                  style={{
                                    padding: "5px 12px",
                                    background: "#0C1E33",
                                    border: "1px solid #0C1E33",
                                    borderRadius: "5px",
                                    fontSize: "11px",
                                    color: "#F8E7C9",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                  }}
                                >
                                  All Classes (School-wide)
                                </button>
                                {availableClassesForWards.map((cls) => (
                                  <button
                                    key={cls}
                                    type="button"
                                    onClick={() => {
                                      setWardClassFilter(cls);
                                      setWardSectionFilter("all");
                                    }}
                                    style={{
                                      padding: "5px 12px",
                                      background: "#FFFFFF",
                                      border: "1px solid #CBD5E1",
                                      borderRadius: "5px",
                                      fontSize: "11px",
                                      color: "#0C1E33",
                                      cursor: "pointer",
                                      fontWeight: 600,
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                    }}
                                  >
                                    {cls}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : filteredStudentsForWards.length === 0 ? (
                            <div
                              style={{
                                padding: "24px 16px",
                                textAlign: "center",
                                background: "#F8FAFC",
                                border: "1px dashed #CBD5E1",
                                borderRadius: "6px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Search size={20} color="#94A3B8" />
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                                No Students Found in {wardClassFilter} {wardSectionFilter !== "all" ? `(${wardSectionFilter})` : ""}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748B", maxWidth: "290px" }}>
                                {wardSearchQuery
                                  ? `No students matching "${wardSearchQuery}".`
                                  : "No students enrolled in this section yet."}
                              </div>
                              {wardSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setWardSearchQuery("")}
                                  style={{
                                    marginTop: "4px",
                                    padding: "3px 8px",
                                    background: "#FFFFFF",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    color: "#0C1E33",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                  }}
                                >
                                  Clear Search
                                </button>
                              )}
                            </div>
                          ) : (
                            filteredStudentsForWards.map((s) => {
                              const sid = s.userId || s.id;
                              const isChecked = selectedWardIds.includes(sid);
                              const existingGuardians = studentGuardianMap.get(sid) || [];
                              const isOtherGuardianLinked = existingGuardians.some(
                                (g) => g.parentName !== selectedParent.name
                              );

                              return (
                                <label
                                  key={sid}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: isChecked ? "1.5px solid #0C1E33" : "1px solid #E2E8F0",
                                    background: isChecked ? "#F0F4F9" : "#FFFFFF",
                                    cursor: "pointer",
                                    transition: "all 0.12s ease",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedWardIds((prev) => [...prev, sid]);
                                      } else {
                                        setSelectedWardIds((prev) => prev.filter((id) => id !== sid));
                                      }
                                    }}
                                    style={{
                                      width: "15px",
                                      height: "15px",
                                      accentColor: "#0C1E33",
                                      cursor: "pointer",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <div
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "50%",
                                      overflow: "hidden",
                                      background: "#F1F5F9",
                                      border: "1px solid #E2E8F0",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <img
                                      src={getStudentAvatarUrl(s.name, sid)}
                                      alt=""
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                      <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33" }}>
                                        {s.name}
                                      </span>
                                      {(s.grade || s.className || s.section || s.sectionName) && (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            fontWeight: 600,
                                            padding: "1px 7px",
                                            borderRadius: "4px",
                                            background: "#E2E8F0",
                                            color: "#1E293B",
                                          }}
                                        >
                                          {[s.grade || s.className, s.section || s.sectionName].filter(Boolean).join(" • ")}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#64748B", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                                      {(s.admissionNo || s.admissionNumber) && (
                                        <span>Adm: <b>{s.admissionNo || s.admissionNumber}</b></span>
                                      )}
                                      {(s.rollNo || s.rollNumber) && (
                                        <span>Roll: <b>{s.rollNo || s.rollNumber}</b></span>
                                      )}
                                      {isOtherGuardianLinked && (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            color: "#B45309",
                                            background: "#FEF3C7",
                                            padding: "1px 5px",
                                            borderRadius: "3px",
                                            fontWeight: 500,
                                          }}
                                          title={`Also linked to: ${existingGuardians.map((g) => g.parentName).join(", ")}`}
                                        >
                                          Also linked to: {existingGuardians[0].parentName}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>

                        {/* Save & Cancel buttons */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingTop: "10px",
                            borderTop: "1px solid #F1F5F9",
                          }}
                        >
                          <div style={{ fontSize: "11px", color: "#64748B" }}>
                            <b>{selectedWardIds.length}</b> student{selectedWardIds.length === 1 ? "" : "s"} selected
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => setIsMappingWards(false)}
                              disabled={savingWards}
                              style={{
                                padding: "6px 14px",
                                background: "#FFFFFF",
                                border: "1px solid #CBD5E1",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: savingWards ? "not-allowed" : "pointer",
                                color: "#475569",
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveWardsInsideDossier}
                              disabled={savingWards}
                              style={{
                                padding: "6px 16px",
                                background: "#0C1E33",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: savingWards ? "not-allowed" : "pointer",
                                color: "#FFFFFF",
                                opacity: savingWards ? 0.7 : 1,
                                fontFamily: "'Poppins', sans-serif",
                              }}
                            >
                              {savingWards ? "Saving Changes..." : "Save Mapped Wards"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display Mapped Wards */
                      <>
                        {selectedParent.children && selectedParent.children.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {selectedParent.children.map((ch: any, cIdx: number) => {
                              const chId = ch.studentId || ch.id;
                              return (
                                <div
                                  key={cIdx}
                                  style={{
                                    padding: "10px 14px",
                                    background: "#FFFFFF",
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
                                        width: "34px",
                                        height: "34px",
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        background: "#F1F5F9",
                                        border: "1px solid #E2E8F0",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <img
                                        src={getStudentAvatarUrl(ch.studentName || ch.name, chId)}
                                        alt=""
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                    </div>
                                    <div>
                                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0C1E33" }}>
                                        {ch.studentName || ch.name}
                                      </div>
                                      <div style={{ fontSize: "11px", color: "#64748B" }}>
                                        {[ch.grade, ch.section].filter(Boolean).join(" · ") || ch.class || "Enrolled Student"}
                                        {ch.admissionNo ? ` · Adm: ${ch.admissionNo}` : ""}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span
                                      style={{
                                        fontSize: "10.5px",
                                        fontWeight: 600,
                                        padding: "2px 8px",
                                        borderRadius: "10px",
                                        background: "#ECFDF5",
                                        color: "#047857",
                                      }}
                                    >
                                      Mapped Ward
                                    </span>
                                    <button
                                      type="button"
                                      title="Unlink ward from guardian"
                                      onClick={() => handleUnlinkWard(chId)}
                                      disabled={savingWards}
                                      style={{
                                        background: "none",
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "6px",
                                        padding: "4px 8px",
                                        color: "#64748B",
                                        cursor: savingWards ? "not-allowed" : "pointer",
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        transition: "all 0.12s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#FEE2E2";
                                        e.currentTarget.style.borderColor = "#FCA5A5";
                                        e.currentTarget.style.color = "#DC2626";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "none";
                                        e.currentTarget.style.borderColor = "#E2E8F0";
                                        e.currentTarget.style.color = "#64748B";
                                      }}
                                    >
                                      <span>Unlink</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <StudentProfileEmptyState
                            title="No Wards Mapped"
                            description="This guardian is not currently linked to any enrolled student profile."
                            actionLabel="+ Link Students"
                            onAction={() => handleStartMappingWards(selectedParent)}
                          />
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {parent360Tab === "communications" && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>
                    Communication Dispatches
                  </h4>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    Official SMS updates, fee settlement notices, and emergency announcements sent to <b>{selectedParent.mobile || selectedParent.email}</b>.
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => alert(`Resent invitation credentials to ${selectedParent.email}`)}
                      style={{
                        padding: "6px 14px",
                        background: "#0C1E33",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Resend Portal Invite
                    </button>
                  </div>
                </div>
              )}

              {parent360Tab === "permissions" && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 650, color: "#0C1E33" }}>
                    Active Portal Privileges
                  </h4>
                  {["Daily Attendance Tracking", "Fee Receipts & Online Payment", "Exam Results & Scorecard", "Faculty Messaging", "Live Bus Transit Tracking"].map((perm, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#FFFFFF", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "12px" }}>
                      <span style={{ color: "#0C1E33", fontWeight: 500 }}>{perm}</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#047857" }}>Granted</span>
                    </div>
                  ))}
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
                Guardian #{selectedParent.id ? selectedParent.id.slice(0, 8).toUpperCase() : "-"} · {selectedParent.relationship || "Guardian"} ({selectedParent.children?.length || 0} Ward{selectedParent.children?.length === 1 ? "" : "s"})
              </span>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() =>
                    setLifecycleTarget?.({
                      id: (selectedParent as any).userId || selectedParent.id,
                      name: selectedParent.name,
                      email: selectedParent.email,
                      role: "parent",
                      status: selectedParent.status || "Active",
                      sublabel: `Guardian · ${selectedParent.relationship || "Parent"}`,
                    })
                  }
                  style={{
                    padding: "6px 14px",
                    background: (selectedParent.status || "").toLowerCase() === "inactive" ? "#DCFCE7" : "#FEE2E2",
                    color: (selectedParent.status || "").toLowerCase() === "inactive" ? "#166534" : "#DC2626",
                    border: (selectedParent.status || "").toLowerCase() === "inactive" ? "1px solid #86EFAC" : "1px solid #FCA5A5",
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
                  {(selectedParent.status || "").toLowerCase() === "inactive" ? (
                    <>
                      <UserCheck size={13} />
                      <span>Reactivate Guardian</span>
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
