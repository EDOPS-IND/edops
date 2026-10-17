"use client";

import { FormEvent, useState, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Plan } from "./types";
import { getPlatformFeatures } from "../edops-api";

export function OnboardingWizard({
  plans,
  onComplete,
  onCancel,
  busy
}: {
  plans: Plan[];
  onComplete: (data: any) => Promise<any>;
  onCancel: () => void;
  busy: boolean;
}) {
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardData, setOnboardData] = useState({
    name: "", slug: "", code: "", schoolType: "Private", board: "CBSE",
    establishedYear: new Date().getFullYear(), addressLine1: "", city: "", state: "", pincode: "",
    officialEmail: "", officialPhone: "", website: "",
    adminName: "", adminEmail: "", adminPhone: "", adminDesignation: "Administrator",
    planId: plans[0]?.id || "", isTrial: true, trialDays: 30, overrides: [] as { featureKey: string; enabled: boolean; reason: string }[],
  });
  const [onboardResult, setOnboardResult] = useState<any>(null);
  const [catalogFeatures, setCatalogFeatures] = useState<any[]>([]);
  const [featureCategory, setFeatureCategory] = useState<string>("all");
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      setLoadingFeatures(true);
      try {
        const res = await getPlatformFeatures();
        if (Array.isArray(res) && res.length > 0) {
          setCatalogFeatures(res);
        }
      } catch (err) {
        console.error("Failed to load feature catalog from database:", err);
      } finally {
        setLoadingFeatures(false);
      }
    }
    loadCatalog();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cleanData = Object.fromEntries(
      Object.entries(onboardData).filter(([_, v]) => v !== "")
    );
    const res = await onComplete(cleanData);
    if (res) setOnboardResult(res);
  }

  return (
    <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "24px" }}>
      <div style={{ marginBottom: "20px", borderBottom: "1px solid #E5E7EB", paddingBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>School Onboarding Wizard</h2>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
          Provision complete school tenant, initial admin invite, billing subscription, and feature entitlements atomically.
        </p>

        {/* Stepper Header */}
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          {[
            { step: 1, title: "1. School Info" },
            { step: 2, title: "2. School Admin" },
            { step: 3, title: "3. Plan Selection" },
            { step: 4, title: "4. Feature Entitlements" },
            { step: 5, title: "5. Finalize" },
          ].map(s => (
            <div
              key={s.step}
              onClick={() => setOnboardStep(s.step)}
              style={{
                padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer",
                background: onboardStep === s.step ? "#064E3B" : onboardStep > s.step ? "#F8E7C9" : "#F3F4F6",
                color: onboardStep === s.step ? "#F8E7C9" : onboardStep > s.step ? "#064E3B" : "#6B7280",
                border: onboardStep === s.step ? "1px solid #064E3B" : onboardStep > s.step ? "1px solid #E5CCA2" : "1px solid #E5E7EB",
              }}
            >
              {s.title}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* STEP 1: SCHOOL INFORMATION (§3) */}
        {onboardStep === 1 && (
          <div style={{ display: "grid", gap: "16px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700 }}>Step 1: School Identity & Location</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>School Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. St. Xavier's International School"
                  value={onboardData.name}
                  onChange={e => setOnboardData({ ...onboardData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-") })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>School Slug / URL ID *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. st-xaviers"
                  value={onboardData.slug}
                  onChange={e => setOnboardData({ ...onboardData, slug: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>Education Board *</label>
                <select
                  value={onboardData.board}
                  onChange={e => setOnboardData({ ...onboardData, board: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                >
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="IB">International Baccalaureate (IB)</option>
                  <option value="Cambridge">Cambridge IGCSE</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>School Code</label>
                <input
                  type="text"
                  placeholder="e.g. SXS001"
                  value={onboardData.code}
                  onChange={e => setOnboardData({ ...onboardData, code: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>City *</label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi"
                  value={onboardData.city}
                  onChange={e => setOnboardData({ ...onboardData, city: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>State *</label>
                <input
                  type="text"
                  placeholder="e.g. Delhi"
                  value={onboardData.state}
                  onChange={e => setOnboardData({ ...onboardData, state: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>Official School Email *</label>
                <input
                  required
                  type="email"
                  placeholder="admin@school.edu.in"
                  value={onboardData.officialEmail}
                  onChange={e => setOnboardData({ ...onboardData, officialEmail: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>Official Phone *</label>
                <input
                  type="tel"
                  placeholder="+911123456789"
                  value={onboardData.officialPhone}
                  onChange={e => setOnboardData({ ...onboardData, officialPhone: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOnboardStep(2)}
              style={{ alignSelf: "flex-start", marginTop: "12px", padding: "8px 20px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
            >
              Continue to School Admin →
            </button>
          </div>
        )}

        {/* STEP 2: SCHOOL ADMIN (§4 - INVITATION WORKFLOW, NO PASSWORD!) */}
        {onboardStep === 2 && (
          <div style={{ display: "grid", gap: "16px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700 }}>Step 2: Initial School Administrator</h3>
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", padding: "12px", borderRadius: "8px", fontSize: "12px", color: "#1E40AF" }}>
              ℹ️ <b>Zero-Password Policy:</b> The Platform Admin never sets the school admin password. A 48-hour cryptographically secure invitation token will be generated. The school admin sets their own password upon accepting.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>Admin Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={onboardData.adminName}
                  onChange={e => setOnboardData({ ...onboardData, adminName: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>Admin Email (For Invitation) *</label>
                <input
                  required
                  type="email"
                  placeholder="principal@school.edu.in"
                  value={onboardData.adminEmail}
                  onChange={e => setOnboardData({ ...onboardData, adminEmail: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>Designation</label>
                <input
                  type="text"
                  placeholder="Principal / Director"
                  value={onboardData.adminDesignation}
                  onChange={e => setOnboardData({ ...onboardData, adminDesignation: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600 }}>Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="+919876543210"
                  value={onboardData.adminPhone}
                  onChange={e => setOnboardData({ ...onboardData, adminPhone: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button type="button" onClick={() => setOnboardStep(1)} style={{ padding: "8px 16px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Back</button>
              <button type="button" onClick={() => setOnboardStep(3)} style={{ padding: "8px 20px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Continue to Plan Selection →</button>
            </div>
          </div>
        )}

        {/* STEP 3: PLAN SELECTION (§5) */}
        {onboardStep === 3 && (
          <div style={{ display: "grid", gap: "16px" }}>
            <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700 }}>Step 3: Select Subscription Plan Tier</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              {plans.map(p => (
                <div
                  key={p.id}
                  onClick={() => setOnboardData({ ...onboardData, planId: p.id })}
                  style={{
                    padding: "18px", borderRadius: "10px", border: "2px solid",
                    borderColor: onboardData.planId === p.id ? "#064E3B" : "#E5E7EB",
                    background: onboardData.planId === p.id ? "#FDF9F0" : "#FFF",
                    cursor: "pointer", transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: onboardData.planId === p.id ? "#064E3B" : "#111827" }}>{p.name}</h4>
                    {onboardData.planId === p.id && <span style={{ color: "#064E3B", fontWeight: 800 }}>✓ SELECTED</span>}
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 800, margin: "8px 0", color: "#064E3B" }}>
                    ₹{(p.amountMinor / 100).toLocaleString()}<span style={{ fontSize: "12px", color: "#52635B" }}>/mo</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#4B5563", lineHeight: "1.6" }}>
                    • Up to {p.maxStudents.toLocaleString()} Students<br />
                    • Up to {p.maxTeachers} Faculty seats<br />
                    • {p.maxStorageGb || 100} GB Cloud storage<br />
                    • {(p.maxApiRequests || 500000).toLocaleString()} API requests/mo
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
              <input
                type="checkbox"
                id="isTrialCheck"
                checked={onboardData.isTrial}
                onChange={e => setOnboardData({ ...onboardData, isTrial: e.target.checked })}
              />
              <label htmlFor="isTrialCheck" style={{ fontSize: "13px", fontWeight: 600 }}>Start with a 30-Day Free Trial period (No billing charge immediately)</label>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button type="button" onClick={() => setOnboardStep(2)} style={{ padding: "8px 16px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Back</button>
              <button type="button" onClick={() => setOnboardStep(4)} style={{ padding: "8px 20px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Continue to Features →</button>
            </div>
          </div>
        )}

        {/* STEP 4: FEATURE CONFIGURATION (§6, §7) */}
        {onboardStep === 4 && (
          <div style={{ display: "grid", gap: "16px" }}>
            <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700 }}>Step 4: Configure Feature Entitlements & Overrides</h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
              Features are populated directly from the PostgreSQL Feature Catalog ({catalogFeatures.length} available). Toggle specific modules on or off for this tenant.
            </p>

            {/* Category Filter Tabs */}
            {catalogFeatures.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["all", ...Array.from(new Set(catalogFeatures.map((f: any) => f.category).filter(Boolean)))].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFeatureCategory(cat)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "capitalize",
                      background: featureCategory === cat ? "#064E3B" : "#F3F4F6",
                      color: featureCategory === cat ? "#F8E7C9" : "#4B5563",
                      border: featureCategory === cat ? "1px solid #064E3B" : "1px solid #E5E7EB",
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {loadingFeatures ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#6B7280", fontSize: "12px" }}>
                <Loader2 className="animate-spin inline-block mr-2" size={16} /> Loading features from database...
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "12px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                {(featureCategory === "all" ? catalogFeatures : catalogFeatures.filter((f: any) => f.category === featureCategory)).map((feat: any) => {
                  const active = onboardData.overrides.find((o) => o.featureKey === feat.key)?.enabled ?? true;
                  return (
                    <div
                      key={feat.key}
                      style={{
                        background: "#F9FAFB",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {feat.name}
                        </div>
                        <span style={{ fontSize: "10px", textTransform: "capitalize", color: "#6B7280" }}>
                          {feat.category}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setOnboardData({
                            ...onboardData,
                            overrides: [
                              ...onboardData.overrides.filter((o) => o.featureKey !== feat.key),
                              { featureKey: feat.key, enabled: val, reason: "Configured during onboarding" },
                            ],
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button type="button" onClick={() => setOnboardStep(3)} style={{ padding: "8px 16px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Back</button>
              <button type="button" onClick={() => setOnboardStep(5)} style={{ padding: "8px 20px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Review & Finalize →</button>
            </div>
          </div>
        )}

        {/* STEP 5: FINALIZE & EXECUTE TRANSACTION (§29) */}
        {onboardStep === 5 && (
          <div style={{ display: "grid", gap: "16px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, color: "#064E3B" }}>Step 5: Review & Execute Provisioning</h3>
            
            {!onboardResult ? (
              <>
                <div style={{ background: "#FDF9F0", padding: "18px", borderRadius: "8px", border: "1px solid #E5CCA2", display: "grid", gap: "8px", fontSize: "13px" }}>
                  <div><b>School:</b> {onboardData.name || "Unnamed School"} ({onboardData.board})</div>
                  <div><b>Admin Invitee:</b> {onboardData.adminName || "Admin"} &lt;{onboardData.adminEmail || "pending@school.edu"}&gt;</div>
                  <div><b>Plan:</b> {plans.find((p) => p.id === onboardData.planId)?.name || plans[0]?.name || "Standard Plan"} ({onboardData.isTrial ? "30-Day Trial" : "Active Subscription"})</div>
                  <div><b>Domain Slug:</b> {onboardData.slug ? `${onboardData.slug}.edops.in` : "Pending Slug"}</div>
                  <div><b>Feature Overrides:</b> {onboardData.overrides.length} customized</div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button type="button" onClick={() => setOnboardStep(4)} style={{ padding: "8px 16px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Back</button>
                  <button
                    type="submit"
                    disabled={busy}
                    style={{ padding: "10px 24px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
                  >
                    {busy ? "Provisioning Tenant..." : "Create School & Generate Invitation"}
                  </button>
                </div>
              </>
            ) : (
              /* FINAL STATUS DISPLAY (§29) */
              <div style={{ background: "#ECFDF5", border: "2px solid #064E3B", borderRadius: "10px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#064E3B", fontWeight: 800, fontSize: "16px" }}>
                  <CheckCircle2 size={20} /> SCHOOL CREATED SUCCESSFULLY
                </div>
                <div style={{ marginTop: "14px", display: "grid", gap: "8px", fontSize: "13px", color: "#064E3B" }}>
                  <div><b>School Name:</b> {onboardResult.organization.name}</div>
                  <div><b>School ID:</b> <code>{onboardResult.organization.id}</code></div>
                  <div><b>Assigned Plan:</b> {onboardResult.plan.name}</div>
                  <div><b>Invitation Status:</b> Pending Acceptance (Valid 48 hours)</div>
                </div>

                <div style={{ marginTop: "16px", background: "#FFF", padding: "14px", borderRadius: "8px", border: "1px solid #A7F3D0" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#064E3B" }}>One-Time Admin Activation Link:</div>
                  <div style={{ wordBreak: "break-all", fontSize: "11.5px", fontFamily: "monospace", marginTop: "4px", color: "#064E3B" }}>
                    {typeof window !== "undefined" ? window.location.origin : "https://edops.in"}/?invite={onboardResult.invitation.token}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCancel}
                  style={{ marginTop: "16px", padding: "8px 18px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                >
                  View in Schools Directory →
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
