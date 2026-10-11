"use client";

import { FeatureCatalogItem, Plan } from "./types";

export function PlansPane({
  plans,
  features,
  onOpenCreatePlanModal,
  onRetirePlan,
  onUpdatePlanFeatures
}: {
  plans: Plan[];
  features: FeatureCatalogItem[];
  onOpenCreatePlanModal: () => void;
  onRetirePlan: (planId: string) => void;
  onUpdatePlanFeatures: (planId: string, features: Record<string, boolean>) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "22px" }}>
      {/* PLANS CARDS */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>Plan Catalog Management</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Dynamically configure pricing tiers, seat allowances, and storage limits</p>
          </div>
          <button
            onClick={onOpenCreatePlanModal}
            style={{ padding: "6px 14px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
          >
            + New Plan
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {plans.map(p => (
            <div key={p.id} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "18px", background: "#F9FAFB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, background: p.active ? "#DCFCE7" : "#FEE2E2", color: p.active ? "#166534" : "#991B1B", padding: "2px 8px", borderRadius: "12px" }}>
                  {p.active ? "ACTIVE" : "RETIRED"}
                </span>
                <span style={{ fontSize: "11px", color: "#6B7280" }}>Monthly</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "8px 0 4px" }}>{p.name}</h3>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#111827", margin: "6px 0" }}>
                ₹{(p.amountMinor / 100).toLocaleString()}<small style={{ fontSize: "12px", color: "#6B7280" }}>/mo</small>
              </div>
              <div style={{ fontSize: "12px", color: "#4B5563", margin: "8px 0" }}>
                Includes <b>{p.maxStudents.toLocaleString()} students</b> · <b>{p.maxTeachers} teachers</b>
              </div>
              {p.active && (
                <button
                  onClick={() => onRetirePlan(p.id)}
                  style={{ marginTop: "10px", width: "100%", padding: "6px", background: "#FFF", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}
                >
                  Retire Plan
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PLAN FEATURE MATRIX TABLE (§10) */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Interactive Plan Feature Matrix</h3>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
            Platform Admins can modify feature entitlement checkboxes across plans. Changes take effect instantly without code deployment.
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Feature Module</th>
                <th style={{ padding: "10px" }}>Category</th>
                {plans.map(p => (
                  <th key={p.id} style={{ padding: "10px", textAlign: "center" }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map(feat => (
                <tr key={feat.key} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{feat.name}</td>
                  <td style={{ padding: "10px", color: "#6B7280" }}>{feat.category}</td>
                  {plans.map(p => {
                    const isChecked = p.features ? Boolean(p.features[feat.key]) : false;
                    return (
                      <td key={p.id} style={{ padding: "10px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const nextFeatures = { ...p.features, [feat.key]: e.target.checked };
                            onUpdatePlanFeatures(p.id, nextFeatures);
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
