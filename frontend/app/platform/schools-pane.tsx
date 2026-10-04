"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { School, FeatureOverride } from "./types";

export function SchoolsPane({
  schools,
  selectedSchool,
  onSelectSchool,
  schoolOverrides,
  onOpenOverrideModal,
  onRemoveOverride,
  onLifecycleChange,
  onOpenSupportSessionModal
}: {
  schools: School[];
  selectedSchool: School | null;
  onSelectSchool: (s: School | null) => void;
  schoolOverrides: FeatureOverride[];
  onOpenOverrideModal: () => void;
  onRemoveOverride: (featureKey: string) => void;
  onLifecycleChange: (schoolId: string, status: string, extendDays?: number) => void;
  onOpenSupportSessionModal: (s: School) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolDetailTab, setSchoolDetailTab] = useState<
    "overview" | "users" | "usage" | "features" | "subscription" | "billing" | "activity"
  >("overview");

  const filteredSchools = schools.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  if (!selectedSchool) {
    return (
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: 0 }}>All Schools Directory</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Manage school lifecycle, subscriptions, feature overrides, and health</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
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

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
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
                        <div style={{ width: `${s.healthScore || 90}%`, background: (s.healthScore || 90) > 85 ? "#10B981" : "#F59E0B", height: "100%" }} />
                      </div>
                      <span style={{ fontSize: "11.5px", fontWeight: 700 }}>{s.healthScore || 90}</span>
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
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
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

  /* 360° SCHOOL DETAIL VIEW WITH SUB-TABS (§14) */
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
              <div><b>Official Email:</b> {selectedSchool.officialEmail || "admin@school.edu"}</div>
              <div><b>Health Score:</b> {selectedSchool.healthScore || 95} / 100 (Optimal)</div>
              <div><b>Registered Address:</b> Main Campus, {selectedSchool.city}, {selectedSchool.state}</div>
            </div>
          </div>
          <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>Academic Leadership</h4>
            <div style={{ display: "grid", gap: "8px", fontSize: "12.5px" }}>
              <div><b>Principal:</b> {selectedSchool.principalName || "Dr. Rajesh Sharma"}</div>
              <div><b>Academic Year:</b> 2026-27 (Active)</div>
              <div><b>Status:</b> <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{selectedSchool.status}</span></div>
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
              <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{selectedSchool.studentsCount} / 5,000</div>
            </div>
            <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>Faculty Assigned</div>
              <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{selectedSchool.teachersCount} / 350</div>
            </div>
            <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>Parents Connected</div>
              <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{selectedSchool.parentsCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Usage & Quotas (§15) */}
      {schoolDetailTab === "usage" && (
        <div style={{ display: "grid", gap: "14px" }}>
          <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12.5px" }}>
              <span>Storage Utilization ({selectedSchool.storageUsageGb || 72} GB / 500 GB)</span>
              <b>14.4%</b>
            </div>
            <div style={{ width: "100%", background: "#E5E7EB", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "14.4%", background: "#10B981", height: "100%" }} />
            </div>
          </div>
          <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12.5px" }}>
              <span>Monthly API Requests ({(selectedSchool.apiRequests || 124000).toLocaleString()} / 1,000,000)</span>
              <b>12.4%</b>
            </div>
            <div style={{ width: "100%", background: "#E5E7EB", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "12.4%", background: "#064E3B", height: "100%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Subtab 4: Features & Overrides (§8) */}
      {schoolDetailTab === "features" && (
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Custom School Feature Overrides</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>Override default plan entitlements for this school</p>
            </div>
            <button
              onClick={onOpenOverrideModal}
              style={{ padding: "6px 12px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              + Add Feature Override
            </button>
          </div>

          {schoolOverrides.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", background: "#F9FAFB", borderRadius: "8px", color: "#6B7280", fontSize: "13px" }}>
              No overrides active. This school follows its standard plan features.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E7EB", textAlign: "left" }}>
                  <th style={{ padding: "8px" }}>Feature</th>
                  <th style={{ padding: "8px" }}>State</th>
                  <th style={{ padding: "8px" }}>Quota Override</th>
                  <th style={{ padding: "8px" }}>Reason</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {schoolOverrides.map((ov) => (
                  <tr key={ov.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "8px" }}><b>{ov.featureKey}</b></td>
                    <td style={{ padding: "8px" }}>
                      <span style={{ color: ov.enabled ? "#10B981" : "#EF4444", fontWeight: 700 }}>
                        {ov.enabled ? "ENABLED (ON)" : "DISABLED (OFF)"}
                      </span>
                    </td>
                    <td style={{ padding: "8px" }}>{ov.customQuota ? `${ov.customQuota} req/mo` : "Unlimited"}</td>
                    <td style={{ padding: "8px", color: "#6B7280" }}>{ov.reason}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <button
                        onClick={() => onRemoveOverride(ov.featureKey)}
                        style={{ color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Subtab 5: Subscriptions */}
      {schoolDetailTab === "subscription" && (
        <div style={{ background: "#F9FAFB", padding: "18px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Current Subscription Tier</div>
            <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>{selectedSchool.plan} Plan</div>
            <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>Active · Renews in 24 days</div>
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
          <div style={{ padding: "10px", borderBottom: "1px solid #F3F4F6" }}>
            <b>organization.created</b> · Provisioned by Platform Admin · 2 months ago
          </div>
          <div style={{ padding: "10px", borderBottom: "1px solid #F3F4F6" }}>
            <b>subscription.assigned</b> · Assigned Professional Plan · 2 months ago
          </div>
          <div style={{ padding: "10px", borderBottom: "1px solid #F3F4F6" }}>
            <b>invitation.accepted</b> · Initial School Admin verified credentials · 2 months ago
          </div>
        </div>
      )}
    </div>
  );
}
