"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, X, Loader2, Copy, Clock, CheckCircle2 } from "lucide-react";
import { School, FeatureOverride } from "./types";
import { getAuditLogs, getSchoolRoleFeatureMatrix, updateSchoolRoleFeatureMatrix } from "../edops-api";
import { DashboardNavigationEditor } from "./dashboard-navigation-editor";

export function SchoolsPane({
  schools,
  selectedSchool,
  onSelectSchool,
  schoolOverrides,
  onRemoveOverride,
  onOverridesChanged,
  onLifecycleChange,
  onOpenSupportSessionModal
}: {
  schools: School[];
  selectedSchool: School | null;
  onSelectSchool: (s: School | null) => void;
  schoolOverrides: FeatureOverride[];
  onRemoveOverride: (featureKey: string, role?: string) => Promise<void>;
  onOverridesChanged: () => void;
  onLifecycleChange: (schoolId: string, status: string, extendDays?: number) => void;
  onOpenSupportSessionModal: (s: School) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedSchoolId, setCopiedSchoolId] = useState<string | null>(null);
  const [schoolDetailTab, setSchoolDetailTab] = useState<
    "overview" | "users" | "usage" | "features" | "subscription" | "billing" | "activity"
  >("overview");
  const [auditRows, setAuditRows] = useState<any[]>([]);
  useEffect(() => {
    setAuditRows([]);
    if (selectedSchool && schoolDetailTab === 'activity') getAuditLogs(100).then(res => setAuditRows(res.items.filter((r: any) => r.organizationId === selectedSchool.id))).catch(() => setAuditRows([]));
  }, [selectedSchool?.id, schoolDetailTab]);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [matrixCategory, setMatrixCategory] = useState("all");
  const [cellBusy, setCellBusy] = useState<string | null>(null);

  const fetchMatrix = async () => {
    if (!selectedSchool) return;
    setMatrixLoading(true);
    try {
      const data = await getSchoolRoleFeatureMatrix(selectedSchool.id);
      setMatrixData(data);
    } catch (e) {
      console.error("Failed to load feature matrix", e);
    } finally {
      setMatrixLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSchool && schoolDetailTab === "features") {
      fetchMatrix();
    }
  }, [selectedSchool?.id, schoolDetailTab]);

  const handleToggleCell = async (
    featureKey: string,
    role: string | null,
    currentState: { enabled: boolean; isOverride: boolean; inherited?: boolean }
  ) => {
    if (!selectedSchool) return;
    const busyKey = `${featureKey}_${role || "all"}`;
    setCellBusy(busyKey);
    try {
      let nextEnabled: boolean | null;
      if (!currentState.isOverride) {
        nextEnabled = !currentState.enabled;
      } else {
        if (currentState.enabled) {
          nextEnabled = false;
        } else {
          nextEnabled = null;
        }
      }

      await updateSchoolRoleFeatureMatrix(selectedSchool.id, {
        featureKey,
        role: role || null,
        enabled: nextEnabled,
        reason: nextEnabled === null ? "Reset override to default" : `Platform admin toggle for ${role || "school default"}`,
      });

      await fetchMatrix();
      onOverridesChanged();
    } catch (e: any) {
      alert(`Failed to update feature: ${e.message || "Unknown error"}`);
    } finally {
      setCellBusy(null);
    }
  };

  const filteredSchools = schools.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  const filteredMatrixFeatures = (matrixData?.matrix || []).filter((feat: any) => {
    if (matrixCategory === "all") return true;
    return feat.category === matrixCategory;
  });

  if (!selectedSchool) {
    return (
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: 0 }}>All Schools Directory</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Manage school lifecycle, subscriptions, feature overrides, and health</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["all", "active", "trial", "suspended", "archived"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, textTransform: "capitalize",
                  background: statusFilter === st ? "#064E3B" : "#F3F4F6",
                  color: statusFilter === st ? "#F8E7C9" : "#4B5563", border: "none", cursor: "pointer"
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", minWidth: "750px", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E7EB", color: "#4B5563" }}>
                <th style={{ padding: "10px" }}>School Name & Code</th>
                <th style={{ padding: "10px" }}>Location & Board</th>
                <th style={{ padding: "10px" }}>Roster (Std / Tch)</th>
                <th style={{ padding: "10px" }}>Current Plan</th>
                <th style={{ padding: "10px" }}>Health Score</th>
                <th style={{ padding: "10px" }}>Status</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <div style={{ fontWeight: 700, color: "#111827" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "#6B7280" }}>{s.code || s.slug}</div>
                    {s.adminInviteStatus === "pending" && s.pendingInviteToken && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#FEF3C7",
                          color: "#92400E",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          marginTop: "4px",
                        }}
                      >
                        <Clock size={11} /> Admin Invite Pending
                      </span>
                    )}
                    {s.adminInviteStatus === "accepted" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#DEF7EC",
                          color: "#03543F",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          marginTop: "4px",
                        }}
                      >
                        <CheckCircle2 size={11} /> Admin Active
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 10px", color: "#4B5563" }}>
                    <div>{s.city}, {s.state}</div>
                    <div style={{ fontSize: "11px", color: "#6B7280" }}>{s.board}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <b>{s.studentsCount}</b> std · {s.teachersCount} tch
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ fontWeight: 700, color: "#064E3B" }}>{s.plan}</span>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "40px", background: "#E5E7EB", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                        <div style={{ width: `${s.healthScore || 0}%`, background: (s.healthScore || 0) > 85 ? "#10B981" : "#F59E0B", height: "100%" }} />
                      </div>
                      <span style={{ fontSize: "11.5px", fontWeight: 700 }}>{s.healthScore || 0}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                      background: s.status === "active" ? "#DEF7EC" : s.status === "trial" ? "#FEF3C7" : "#FDE8E8",
                      color: s.status === "active" ? "#03543F" : s.status === "trial" ? "#92400E" : "#9B1C1C"
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", alignItems: "center" }}>
                      {s.adminInviteStatus === "pending" && s.pendingInviteToken && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `${typeof window !== "undefined" ? window.location.origin : "https://edops.in"}/?invite=${s.pendingInviteToken}`;
                            if (navigator?.clipboard?.writeText) {
                              navigator.clipboard.writeText(url);
                            }
                            setCopiedSchoolId(s.id);
                            setTimeout(() => setCopiedSchoolId(null), 2500);
                          }}
                          style={{
                            padding: "5px 10px",
                            background: copiedSchoolId === s.id ? "#059669" : "#FEF3C7",
                            color: copiedSchoolId === s.id ? "#FFF" : "#92400E",
                            border: "1px solid #FCD34D",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Copy pending invitation link"
                        >
                          {copiedSchoolId === s.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedSchoolId === s.id ? "Copied" : "Copy Invite"}
                        </button>
                      )}
                      <button
                        onClick={() => onSelectSchool(s)}
                        style={{ padding: "5px 10px", background: "#EEF2F6", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                      >
                        Manage 360°
                      </button>
                      <button
                        onClick={() => onOpenSupportSessionModal(s)}
                        style={{ padding: "5px 8px", background: "#FFFBEB", border: "1px solid #FCD34D", color: "#B45309", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                        title="Start Audited Support Session"
                      >
                        Impersonate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* 360° SCHOOL DETAIL VIEW WITH SUB-TABS */
  return (
    <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #E5E7EB", paddingBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => onSelectSchool(null)}
            style={{ background: "#F3F4F6", border: "none", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#111827" }}>{selectedSchool.name}</h2>
            <span style={{ fontSize: "12px", color: "#6B7280" }}>Tenant Code: <code>{selectedSchool.code || selectedSchool.slug}</code> · {selectedSchool.city}, {selectedSchool.state}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {selectedSchool.status === "active" ? (
            <button
              onClick={() => onLifecycleChange(selectedSchool.id, "suspended")}
              style={{ padding: "6px 12px", background: "#FEE2E2", color: "#991B1B", border: "1px solid #F87171", borderRadius: "6px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
            >
              Suspend School
            </button>
          ) : (
            <button
              onClick={() => onLifecycleChange(selectedSchool.id, "active")}
              style={{ padding: "6px 12px", background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC", borderRadius: "6px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
            >
              Activate School
            </button>
          )}
          <button
            onClick={() => onOpenSupportSessionModal(selectedSchool)}
            style={{ padding: "6px 12px", background: "#D97706", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
          >
            Start Support Session
          </button>
        </div>
      </div>

      {/* PENDING ADMIN INVITATION BANNER WITH COPY BUTTON */}
      {selectedSchool.adminInviteStatus === "pending" && selectedSchool.pendingInviteToken ? (
        <div
          style={{
            background: "#FEF3C7",
            border: "1px solid #FCD34D",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, minWidth: "260px" }}>
            <div style={{ fontWeight: 800, color: "#92400E", fontSize: "13.5px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} /> Pending School Administrator Activation Link
            </div>
            <div style={{ fontSize: "12px", color: "#78350F", marginTop: "3px" }}>
              Sent to <b>{selectedSchool.officialEmail}</b>
              {selectedSchool.pendingInviteExpiresAt && (
                <> · Valid until {new Date(selectedSchool.pendingInviteExpiresAt).toLocaleString()}</>
              )}
            </div>
            <div style={{ fontSize: "11.5px", fontFamily: "monospace", color: "#92400E", marginTop: "6px", wordBreak: "break-all", background: "#FFF", padding: "6px 10px", borderRadius: "4px", border: "1px solid #FDE68A" }}>
              {typeof window !== "undefined" ? window.location.origin : "https://edops.in"}/?invite={selectedSchool.pendingInviteToken}
            </div>
          </div>
          <button
            onClick={() => {
              const url = `${typeof window !== "undefined" ? window.location.origin : "https://edops.in"}/?invite=${selectedSchool.pendingInviteToken}`;
              if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(url);
              }
              setCopiedSchoolId(selectedSchool.id);
              setTimeout(() => setCopiedSchoolId(null), 2500);
            }}
            style={{
              padding: "8px 16px",
              background: copiedSchoolId === selectedSchool.id ? "#059669" : "#92400E",
              color: "#FFF",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            {copiedSchoolId === selectedSchool.id ? <Check size={14} /> : <Copy size={14} />}
            {copiedSchoolId === selectedSchool.id ? "Copied!" : "Copy Invitation Link"}
          </button>
        </div>
      ) : selectedSchool.adminInviteStatus === "accepted" ? (
        <div
          style={{
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            borderRadius: "8px",
            padding: "10px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12.5px",
            fontWeight: 750,
            color: "#064E3B",
          }}
        >
          <CheckCircle2 size={16} color="#059669" /> School Administrator Invitation Accepted & Verified
        </div>
      ) : null}

      {/* Sub-tabs inside School 360° View */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E5E7EB", paddingBottom: "10px", marginBottom: "20px" }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "users", label: "Users & Seats" },
          { id: "usage", label: "Usage & Quotas" },
          { id: "features", label: "Features & Overrides" },
          { id: "subscription", label: "Subscription" },
          { id: "activity", label: "Audit History" },
        ].map(sub => (
          <button
            key={sub.id}
            onClick={() => setSchoolDetailTab(sub.id as any)}
            style={{
              padding: "6px 12px", borderRadius: "6px", fontSize: "12.5px", fontWeight: 650, cursor: "pointer",
              background: schoolDetailTab === sub.id ? "#064E3B" : "transparent",
              color: schoolDetailTab === sub.id ? "#F8E7C9" : "#4B5563", border: "none"
            }}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Subtab 1: School Overview */}
      {schoolDetailTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>School Information</h4>
            <div style={{ display: "grid", gap: "8px", fontSize: "12.5px" }}>
              <div><b>Board:</b> {selectedSchool.board}</div>
              <div><b>Official Email:</b> {selectedSchool.officialEmail || "—"}</div>
              <div><b>Health Score:</b> {selectedSchool.healthScore || 0} / 100</div>
              <div><b>Registered Location:</b> {selectedSchool.city}, {selectedSchool.state}</div>
            </div>
          </div>
          <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>Academic Status</h4>
            <div style={{ display: "grid", gap: "8px", fontSize: "12.5px" }}>
              <div><b>Status:</b> <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{selectedSchool.status}</span></div>
              <div><b>Academic Year:</b> {selectedSchool.academicYear || "—"}</div>
              <div><b>Leadership & Staff:</b> Provisioned via School Admin</div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Users & Seats */}
      {schoolDetailTab === "users" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>Students Enrolled</div>
              <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{selectedSchool.studentsCount} </div>
            </div>
            <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>Faculty Assigned</div>
              <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{selectedSchool.teachersCount} </div>
            </div>
            <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>Parents Connected</div>
              <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{selectedSchool.parentsCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Usage & Quotas */}
      {schoolDetailTab === "usage" && (
        <div style={{ display: "grid", gap: "14px" }}>
          <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12.5px" }}>
              <span>Storage Utilization ({selectedSchool.storageUsageGb ?? 0} GB)</span>
              <b>—</b>
            </div>
            <div style={{ width: "100%", background: "#E5E7EB", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "0%", background: "#10B981", height: "100%" }} />
            </div>
          </div>
          <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12.5px" }}>
              <span>Monthly API Requests ({(selectedSchool.apiRequests ?? 0).toLocaleString()} )</span>
              <b>—</b>
            </div>
            <div style={{ width: "100%", background: "#E5E7EB", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "0%", background: "#064E3B", height: "100%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Subtab 4: Features & Overrides - 2D Role Matrix */}
      {schoolDetailTab === "features" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <DashboardNavigationEditor organizationId={selectedSchool.id} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                Role-Level Feature Management Matrix
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
                {matrixData?.planName || "School"} · {matrixData?.entitled ? "subscription or trial active" : "subscription or trial inactive"}. Click a cell to set or reset a school or role override.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select
                value={matrixCategory}
                onChange={(e) => setMatrixCategory(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #D1D5DB",
                  fontSize: "12px",
                  background: "#fff",
                  color: "#374151"
                }}
              >
                <option value="all">All Categories</option>
                {[...new Set<string>((matrixData?.matrix || []).map((feature: any) => String(feature.category)))].map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button
                onClick={fetchMatrix}
                style={{
                  padding: "6px 12px",
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Refresh Matrix
              </button>
            </div>
          </div>

          {matrixLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontSize: "13px" }}>
              <Loader2 className="animate-spin inline-block mr-2" size={18} /> Loading role-level feature entitlements...
            </div>
          ) : !matrixData?.matrix ? (
            <div style={{ padding: "30px", textAlign: "center", background: "#F9FAFB", borderRadius: "8px", color: "#6B7280", fontSize: "13px" }}>
              No feature matrix available for this school.
            </div>
          ) : (
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflowX: "auto", background: "#fff" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "850px" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700, color: "#374151", width: "240px" }}>Feature & Category</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700, color: "#374151", textAlign: "center" }}>School Default</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700, color: "#374151", textAlign: "center" }}>School Admin</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700, color: "#374151", textAlign: "center" }}>Principal</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700, color: "#374151", textAlign: "center" }}>Teacher</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700, color: "#374151", textAlign: "center" }}>Student</th>
                    <th style={{ padding: "10px 12px", fontWeight: 700, color: "#374151", textAlign: "center" }}>Parent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatrixFeatures.map((feat: any) => {
                    const roles = ["school_admin", "principal", "teacher", "student", "parent"];
                    return (
                      <tr key={feat.key} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: "12.5px" }}>{feat.name}</div>
                          <div style={{ fontSize: "10.5px", color: "#6B7280", marginTop: "1px" }}>
                            <span style={{ background: "#E5E7EB", padding: "1px 5px", borderRadius: "4px", marginRight: "6px", textTransform: "capitalize" }}>
                              {feat.category}
                            </span>
                            {feat.description}
                          </div>
                        </td>

                        {/* Tenant Default Cell */}
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          <button
                            onClick={() => handleToggleCell(feat.key, null, feat.tenantDefault)}
                            disabled={cellBusy === `${feat.key}_all`}
                            title={feat.tenantDefault.isOverride ? "Explicit Tenant Override (Click to cycle)" : "Inherited from Plan (Click to override)"}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              border: feat.tenantDefault.isOverride ? "1px solid #10B981" : "1px dashed #D1D5DB",
                              background: feat.tenantDefault.enabled ? (feat.tenantDefault.isOverride ? "#ECFDF5" : "#F3F4F6") : (feat.tenantDefault.isOverride ? "#FEF2F2" : "#F9FAFB"),
                              color: feat.tenantDefault.enabled ? (feat.tenantDefault.isOverride ? "#065F46" : "#1F2937") : (feat.tenantDefault.isOverride ? "#991B1B" : "#9CA3AF"),
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {feat.tenantDefault.enabled ? <Check size={12} /> : <X size={12} />}
                            {feat.tenantDefault.isOverride ? (feat.tenantDefault.enabled ? "ON (Override)" : "OFF (Override)") : (feat.tenantDefault.enabled ? "ON (Plan)" : "OFF (Plan)")}
                          </button>
                        </td>

                        {/* Role-Specific Cells */}
                        {roles.map((r) => {
                          const state = feat.roles[r] || { enabled: feat.tenantDefault.enabled, isOverride: false, inherited: true };
                          const isBusy = cellBusy === `${feat.key}_${r}`;
                          if (state.notApplicable) return <td key={r} style={{ textAlign: "center", color: "#9CA3AF" }}>—</td>;
                          return (
                            <td key={r} style={{ padding: "8px 12px", textAlign: "center" }}>
                              <button
                                onClick={() => handleToggleCell(feat.key, r, state)}
                                disabled={isBusy}
                                title={state.isOverride ? "Role Override Active (Click: Toggle -> Reset)" : "Inherited from School Default (Click to override)"}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  border: state.isOverride ? (state.enabled ? "1px solid #10B981" : "1px solid #EF4444") : "1px dashed #E5E7EB",
                                  background: state.isOverride ? (state.enabled ? "#ECFDF5" : "#FEF2F2") : "#FFFFFF",
                                  color: state.isOverride ? (state.enabled ? "#065F46" : "#991B1B") : (state.enabled ? "#374151" : "#9CA3AF"),
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {state.isOverride ? (
                                  <>
                                    {state.enabled ? <Check size={12} color="#059669" /> : <X size={12} color="#DC2626" />}
                                    <span>{state.enabled ? "ON" : "OFF"}</span>
                                    <span style={{ fontSize: "9px", background: state.enabled ? "#A7F3D0" : "#FECACA", padding: "0 3px", borderRadius: "3px" }}>R</span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ color: state.enabled ? "#10B981" : "#D1D5DB" }}>●</span>
                                    <span>{state.enabled ? "ON" : "OFF"}</span>
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick Active Overrides Summary */}
          {schoolOverrides && schoolOverrides.length > 0 && (
            <div style={{ marginTop: "12px", background: "#F9FAFB", padding: "14px", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h5 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#374151" }}>Active Custom Overrides Ledger</h5>
                <span style={{ fontSize: "11px", color: "#6B7280" }}>{schoolOverrides.length} override(s) recorded in database</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {schoolOverrides.map((ov: any) => (
                  <div
                    key={ov.id || ov.featureKey}
                    style={{
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <b>{ov.featureKey}</b>
                    {ov.role && <span style={{ background: "#EEF2FF", color: "#4F46E5", padding: "1px 4px", borderRadius: "4px", fontSize: "10px" }}>{ov.role}</span>}
                    <span style={{ color: ov.enabled ? "#059669" : "#DC2626", fontWeight: 700 }}>{ov.enabled ? "ON" : "OFF"}</span>
                    <button
                      onClick={async () => { await onRemoveOverride(ov.featureKey, ov.role || undefined); await fetchMatrix(); }}
                      title="Clear Override"
                      style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: "0 2px" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 5: Subscriptions */}
      {schoolDetailTab === "subscription" && (
        <div style={{ background: "#F9FAFB", padding: "18px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Current Subscription Tier</div>
            <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>{selectedSchool.plan} Plan</div>
            <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>{selectedSchool.status}</div>
          </div>
          <button
            onClick={() => onLifecycleChange(selectedSchool.id, selectedSchool.status, 30)}
            style={{ padding: "6px 12px", background: "#FFF", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          >
            Extend Period (+30 Days)
          </button>
        </div>
      )}

      {/* Subtab 6: Activity */}
      {schoolDetailTab === "activity" && (
        <div style={{ display: "grid", gap: "10px", fontSize: "12.5px" }}>
          <p>School events within the latest 100 platform audit records.</p>
          {auditRows.length ? auditRows.map(row => <div key={row.id}><b>{row.action}</b> · {row.actorEmail} · {new Date(row.createdAt).toLocaleString()}</div>) : <p>No matching audit records.</p>}

        </div>
      )}
    </div>
  );
}
