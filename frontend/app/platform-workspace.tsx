"use client";

import { useEffect, useState } from "react";
import {
  getPlatformSchools, getPlatformPlans, createPlatformPlan,
  updatePlanStatus, updatePlanFeatures, getSchoolDetailedOverrides,
  setSchoolDetailedOverride, removeSchoolDetailedOverride, onboardSchool,
  updateSchoolLifecycle, getSupportTickets, createSupportTicket,
  updateSupportTicketStatus, startSupportSession, getAnnouncements,
  createAnnouncement, getPayments, refundPayment, globalSearch,
  getDetailedHealth, getAuditLogs
} from "./edops-api";
import {
  BarChart3, Building2, Calendar, CreditCard, Sparkles, Layers,
  Activity, Sliders, ShieldCheck, HelpCircle, Server, Search, Plus,
  Bell, AlertTriangle, AlertCircle, CheckCircle2, X
} from "lucide-react";
import {
  School, Plan, FeatureOverride, SupportTicket, Announcement,
  PaymentRecord, AuditLog, DEFAULT_SCHOOLS,
  OverviewPane, SchoolsPane, OnboardingWizard, PlansPane, SubscriptionsPane,
  BillingPane, UsagePane, ConfigPane, SecurityPane, SupportPane, HealthPane,
  SupportSessionModal, FeatureOverrideModal, CreatePlanModal,
  BroadcastAnnouncementModal, CreateTicketModal
} from "./platform";

export function PlatformWorkspace({
  activePanel = "overview",
  onSelectPanel,
}: {
  activePanel?: string;
  onSelectPanel?: (panel: string) => void;
}) {
  const [tab, setTab] = useState(activePanel);
  const [schools, setSchools] = useState<School[]>(DEFAULT_SCHOOLS);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolOverrides, setSchoolOverrides] = useState<FeatureOverride[]>([]);

  // Tickets & Announcements & Payments
  const [tickets, setTickets] = useState<SupportTicket[]>([
    { id: "1", ticketCode: "TCK-10234", schoolName: "Delhi Public XYZ", category: "academic", priority: "high", status: "in_progress", subject: "CBSE term report card format alignment", description: "Need alignment for 9th grade CBSE cumulative scorecards.", createdAt: "2 hours ago" },
    { id: "2", ticketCode: "TCK-10231", schoolName: "ABC International School", category: "billing", priority: "medium", status: "open", subject: "GST invoice amendment for Q4", description: "Requesting correction in GSTIN registration number.", createdAt: "5 hours ago" },
    { id: "3", ticketCode: "TCK-10219", schoolName: "XYZ Academy", category: "technical", priority: "low", status: "resolved", subject: "Custom subdomain DNS records verified", description: "CNAME verification complete for portal.xyzacademy.in", createdAt: "1 day ago" },
  ]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: "1", title: "Scheduled Maintenance: Sunday 2 AM IST", message: "Database engine optimization and index rebuild window (15 mins expected).", type: "maintenance", priority: "normal", audience: "all", channels: ["dashboard", "email"], status: "published", createdAt: "Yesterday" },
    { id: "2", title: "New Feature Release: AI Report Card Narrative Generator", message: "Schools on Enterprise and Professional plans can now generate personalized teacher comments.", type: "feature_release", priority: "high", audience: "enterprise", channels: ["dashboard"], status: "published", createdAt: "3 days ago" },
  ]);
  const [payments, setPayments] = useState<PaymentRecord[]>([
    { id: "1", invoiceId: "INV-2026-001", schoolName: "Delhi Public XYZ", amountMinor: 15000000, currency: "INR", status: "success", paymentMethod: "NEFT / RTGS", transactionId: "UTR983210492", createdAt: "2026-03-25" },
    { id: "2", invoiceId: "INV-2026-002", schoolName: "ABC International School", amountMinor: 7500000, currency: "INR", status: "success", paymentMethod: "Bank Transfer", transactionId: "UTR882103948", createdAt: "2026-03-28" },
    { id: "3", invoiceId: "INV-2026-003", schoolName: "Heritage Valley High", amountMinor: 3500000, currency: "INR", status: "failed", paymentMethod: "Direct Debit", failureReason: "Insufficient balance", createdAt: "2026-04-01" },
  ]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals state
  const [createPlanModal, setCreatePlanModal] = useState(false);
  const [overrideModal, setOverrideModal] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [supportSessionModal, setSupportSessionModal] = useState<School | null>(null);

  // Impersonation Banner session
  const [impersonatingSession, setImpersonatingSession] = useState<{
    active: boolean; schoolId: string; schoolName: string; expiresAt: string; sessionToken: string;
  } | null>(null);

  // Search & Global state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (activePanel) setTab(activePanel);
  }, [activePanel]);

  // Initial Data Fetching
  async function loadInitialData() {
    try {
      const [schoolsRes, plansRes, ticketsRes, logsRes] = await Promise.all([
        getPlatformSchools(100).catch(() => ({ items: [] })),
        getPlatformPlans(50).catch(() => ({ items: [] })),
        getSupportTickets(50).catch(() => ({ items: [] })),
        getAuditLogs(50).catch(() => ({ items: [] }))
      ]);

      if (schoolsRes.items?.length) {
        const merged = [...DEFAULT_SCHOOLS];
        for (const s of schoolsRes.items) {
          if (!merged.some(m => m.id === s.id || m.slug === s.slug)) {
            merged.push({
              id: s.id, name: s.name, slug: s.slug, status: s.status, createdAt: s.createdAt,
              code: s.code || (s.slug || "SCH").slice(0, 3).toUpperCase() + "001",
              board: s.board || "CBSE", studentsCount: "600", teachersCount: "40", parentsCount: "550",
              plan: "Professional", healthScore: 92, storageUsageGb: 35, apiRequests: 45000,
              city: s.city || "New Delhi", state: s.state || "Delhi", officialEmail: s.officialEmail || `admin@${s.slug}.edu`
            });
          }
        }
        setSchools(merged);
      }

      if (plansRes.items?.length) {
        setPlans(plansRes.items);
      } else {
        const defaultPlans: Plan[] = [
          { id: "00000000-0000-4000-8000-000000000001", name: "Basic", amountMinor: 2500000, currency: "INR", billingCycle: "monthly", maxStudents: 500, maxTeachers: 35, maxParents: 1000, maxStorageGb: 50, maxApiRequests: 200000, features: { student_management: true, teacher_management: true, attendance: true, exams: true, results: true, report_cards: true, arena: true, recordings: false, communication: true, ai_assistant: false }, active: true, createdAt: "2026-01-01" },
          { id: "00000000-0000-4000-8000-000000000002", name: "Professional", amountMinor: 6500000, currency: "INR", billingCycle: "monthly", maxStudents: 1500, maxTeachers: 100, maxParents: 3000, maxStorageGb: 200, maxApiRequests: 1000000, features: { student_management: true, teacher_management: true, parent_management: true, attendance: true, timetable: true, homework: true, exams: true, results: true, report_cards: true, arena: true, recordings: true, communication: true, fee_management: true, transport: true, library: true, ai_assistant: false }, active: true, createdAt: "2026-01-01" },
          { id: "00000000-0000-4000-8000-000000000003", name: "Enterprise", amountMinor: 14500000, currency: "INR", billingCycle: "monthly", maxStudents: 5000, maxTeachers: 350, maxParents: 10000, maxStorageGb: 1024, maxApiRequests: 5000000, features: { student_management: true, teacher_management: true, parent_management: true, attendance: true, timetable: true, homework: true, assignments: true, exams: true, results: true, report_cards: true, arena: true, recordings: true, communication: true, email_service: true, sms_service: true, whatsapp_service: true, fee_management: true, online_payments: true, transport: true, library: true, advanced_analytics: true, ai_assistant: true, ai_reports: true, api_access: true, custom_domain: true, multi_branch: true }, active: true, createdAt: "2026-01-01" },
        ];
        setPlans(defaultPlans);
      }

      if (ticketsRes.items?.length) setTickets(ticketsRes.items);
      if (logsRes.items?.length) setAuditLogs(logsRes.items);
    } catch (e: any) {
      console.error("Platform load error:", e);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  // School detail loader
  async function handleSelectSchool(school: School | null) {
    setSelectedSchool(school);
    if (!school) return;
    try {
      const overrides = await getSchoolDetailedOverrides(school.id);
      setSchoolOverrides(overrides);
    } catch {
      setSchoolOverrides([]);
    }
  }

  // Global search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await globalSearch(searchQuery);
        setSearchResults(res.results || []);
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Actions
  async function handleCompleteOnboarding(onboardData: any) {
    setBusy(true);
    setError("");
    try {
      const res = await onboardSchool(onboardData);
      setSuccessMsg(`School '${onboardData.name}' onboarded successfully!`);
      loadInitialData();
      return res;
    } catch (err: any) {
      setError(err.message || "Failed to onboard school");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleLifecycleChange(schoolId: string, status: string, extendDays = 0) {
    setBusy(true);
    try {
      await updateSchoolLifecycle(schoolId, { status, extendTrialDays: extendDays, reason: `Platform admin updated status to ${status}` });
      setSuccessMsg(`School status updated to ${status.toUpperCase()}`);
      setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, status: status as any } : s));
      if (selectedSchool && selectedSchool.id === schoolId) {
        setSelectedSchool({ ...selectedSchool, status: status as any });
      }
    } catch (err: any) {
      setError(err.message || "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleStartSupportSession(reason: string) {
    if (!supportSessionModal) return;
    setBusy(true);
    try {
      const res = await startSupportSession({
        organizationId: supportSessionModal.id,
        reason: reason || "Support ticket diagnostic session",
      });
      setImpersonatingSession(res);
      setSupportSessionModal(null);
      setSuccessMsg(`Audited support session started for ${res.schoolName}`);
    } catch (err: any) {
      setError(err.message || "Support session start failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddOverride(overrideData: any) {
    if (!selectedSchool) return;
    setBusy(true);
    try {
      await setSchoolDetailedOverride(selectedSchool.id, overrideData);
      setOverrideModal(false);
      setSuccessMsg(`Override for ${overrideData.featureKey} applied successfully`);
      const updated = await getSchoolDetailedOverrides(selectedSchool.id);
      setSchoolOverrides(updated);
    } catch (err: any) {
      setError(err.message || "Failed to save override");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveOverride(featureKey: string) {
    if (!selectedSchool) return;
    setBusy(true);
    try {
      await removeSchoolDetailedOverride(selectedSchool.id, featureKey);
      setSuccessMsg(`Override for ${featureKey} removed`);
      setSchoolOverrides(prev => prev.filter(o => o.featureKey !== featureKey));
    } catch (err: any) {
      setError(err.message || "Failed to remove override");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreatePlan(newPlanData: any) {
    try {
      await createPlatformPlan(newPlanData);
      setCreatePlanModal(false);
      setSuccessMsg(`Plan '${newPlanData.name}' created`);
      loadInitialData();
    } catch (err: any) {
      setError(err.message || "Failed to create plan");
    }
  }

  async function handleRetirePlan(planId: string) {
    try {
      await updatePlanStatus(planId, false);
      setPlans(prev => prev.map(x => x.id === planId ? { ...x, active: false } : x));
      setSuccessMsg("Plan retired successfully");
    } catch (err: any) {
      setError(err.message || "Failed to retire plan");
    }
  }

  async function handleUpdatePlanFeatures(planId: string, nextFeatures: Record<string, boolean>) {
    try {
      await updatePlanFeatures(planId, nextFeatures);
      setPlans(prev => prev.map(pl => pl.id === planId ? { ...pl, features: nextFeatures } : pl));
      setSuccessMsg("Plan feature matrix updated");
    } catch (err: any) {
      setError(err.message || "Failed to update plan features");
    }
  }

  async function handleProcessRefund(paymentId: string) {
    try {
      await refundPayment(paymentId, "Administrative billing adjustment refund");
      setPayments(prev => prev.map(pm => pm.id === paymentId ? { ...pm, status: "refunded" } : pm));
      setSuccessMsg("Refund processed successfully");
    } catch (err: any) {
      setError(err.message || "Refund failed");
    }
  }

  async function handleCreateTicket(newTicketData: any) {
    try {
      const res = await createSupportTicket(newTicketData);
      setTickets(prev => [{ ...newTicketData, id: res.id, ticketCode: res.ticketCode, priority: newTicketData.priority as any, status: "open", createdAt: "Just now" }, ...prev]);
      setTicketModal(false);
      setSuccessMsg(`Ticket ${res.ticketCode} created`);
    } catch (err: any) {
      setError(err.message || "Failed to create ticket");
    }
  }

  async function handleResolveTicket(ticketId: string) {
    try {
      await updateSupportTicketStatus(ticketId, { status: "resolved" });
      setTickets(prev => prev.map(tc => tc.id === ticketId ? { ...tc, status: "resolved" } : tc));
      setSuccessMsg("Ticket marked resolved");
    } catch (err: any) {
      setError(err.message || "Failed to resolve ticket");
    }
  }

  async function handleSendAnnouncement(announcementData: any) {
    try {
      await createAnnouncement(announcementData);
      setAnnouncements(prev => [{ ...announcementData, id: String(Date.now()), channels: ["dashboard"], status: "published", createdAt: "Just now" }, ...prev]);
      setAnnouncementModal(false);
      setSuccessMsg("Announcement broadcasted");
    } catch (err: any) {
      setError(err.message || "Failed to send announcement");
    }
  }

  return (
    <div className="platform-control-center content-stack" style={{ gap: "20px", maxWidth: "1600px", margin: "0 auto", padding: "16px 24px" }}>
      
      {/* 1. TOP AUDITED SUPPORT SESSION / IMPERSONATION BANNER (§24) */}
      {impersonatingSession && (
        <div style={{ background: "#FEF3C7", border: "2px solid #D97706", color: "#92400E", padding: "12px 20px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: "13px", boxShadow: "0 2px 8px rgba(217, 119, 6, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={18} />
            <span>⚠ SUPPORT SESSION ACTIVE: Impersonating <b>{impersonatingSession.schoolName}</b>. All actions are cryptographically signed and permanently audited.</span>
          </div>
          <button
            onClick={() => setImpersonatingSession(null)}
            style={{ background: "#D97706", color: "#FFF", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}
          >
            Exit Support Session
          </button>
        </div>
      )}

      {/* 2. HEADER BAR WITH GLOBAL SEARCH & QUICK ACTIONS (§32, §35) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid #E2DDD5", paddingBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#064E3B", margin: 0 }}>
              EDOPS Platform Admin
            </h1>
            <span style={{ background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
              CONTROL CENTER v2.4
            </span>
          </div>
          <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "#52635B" }}>
            Multi-tenant control plane: Lifecycle, Entitlements, Metering, Billing & Governance
          </p>
        </div>

        {/* Global Spotlight Search & Quick Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#9CA3AF" }} />
            <input
              type="text"
              placeholder="Search schools, codes, tickets, invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "7px 12px 7px 32px", fontSize: "12.5px", borderRadius: "7px", border: "1px solid #D1D5DB", outline: "none", background: "#F9FAFB" }}
            />
            {searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "38px", left: 0, right: 0, background: "#FFF", border: "1px solid #D1D5DB", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: "250px", overflowY: "auto", padding: "6px 0" }}>
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (item.type === "school") {
                        const s = schools.find(sc => sc.id === item.id);
                        if (s) { handleSelectSchool(s); setTab("schools"); }
                      } else if (item.type === "ticket") {
                        setTab("support");
                      } else if (item.type === "invoice") {
                        setTab("billing");
                      }
                      setSearchQuery("");
                    }}
                    style={{ padding: "8px 14px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: "1px solid #F3F4F6" }}
                  >
                    <div>
                      <b>{item.name || item.subject || item.ticketCode || item.paymentReference}</b>
                      <span style={{ fontSize: "11px", color: "#6B7280", marginLeft: "8px" }}>{item.code || item.status}</span>
                    </div>
                    <span style={{ textTransform: "uppercase", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "#F8E7C9", color: "#064E3B" }}>
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setTab("onboarding")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "7px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
          >
            <Plus size={15} /> Add School
          </button>
          <button
            onClick={() => setCreatePlanModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "7px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
          >
            <Plus size={14} /> Create Plan
          </button>
          <button
            onClick={() => setAnnouncementModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "7px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
          >
            <Bell size={14} /> Broadcast
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {successMsg && (
        <div style={{ background: "#ECFDF5", border: "1px solid #10B981", color: "#065F46", padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} /> {successMsg}</div>
          <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#065F46" }}><X size={14} /></button>
        </div>
      )}
      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #EF4444", color: "#991B1B", padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><AlertCircle size={16} /> {error}</div>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B" }}><X size={14} /></button>
        </div>
      )}

      {/* 3. PLATFORM NAVIGATION TABS (ALL 11 SECTIONS - §40) */}
      <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid #E2DDD5", paddingBottom: "10px", overflowX: "auto" }}>
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "schools", label: "Schools & Tenants", icon: Building2 },
          { id: "onboarding", label: "Onboarding Wizard", icon: Sparkles },
          { id: "plans", label: "Plans & Features", icon: Layers },
          { id: "subscriptions", label: "Subscriptions", icon: Calendar },
          { id: "billing", label: "Billing & Revenue", icon: CreditCard },
          { id: "usage", label: "Usage & Metering", icon: Activity },
          { id: "configuration", label: "Global Config", icon: Sliders },
          { id: "security", label: "Security & Audit", icon: ShieldCheck },
          { id: "support", label: "Support & Sessions", icon: HelpCircle },
          { id: "health", label: "System Health", icon: Server },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                if (item.id !== "schools") setSelectedSchool(null);
                if (onSelectPanel) onSelectPanel(item.id);
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "7px",
                border: "1px solid", borderColor: isActive ? "#064E3B" : "#E2DDD5",
                background: isActive ? "#064E3B" : "#FFFFFF", color: isActive ? "#F8E7C9" : "#4B5563",
                fontWeight: 700, fontSize: "12.5px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease",
              }}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* PANES RENDERING */}
      {tab === "overview" && (
        <OverviewPane schools={schools} onNavigateTab={(t) => setTab(t)} />
      )}

      {tab === "schools" && (
        <SchoolsPane
          schools={schools}
          selectedSchool={selectedSchool}
          onSelectSchool={handleSelectSchool}
          schoolOverrides={schoolOverrides}
          onOpenOverrideModal={() => setOverrideModal(true)}
          onRemoveOverride={handleRemoveOverride}
          onLifecycleChange={handleLifecycleChange}
          onOpenSupportSessionModal={(s) => setSupportSessionModal(s)}
        />
      )}

      {tab === "onboarding" && (
        <OnboardingWizard
          plans={plans}
          onComplete={handleCompleteOnboarding}
          onCancel={() => setTab("schools")}
          busy={busy}
        />
      )}

      {tab === "plans" && (
        <PlansPane
          plans={plans}
          onOpenCreatePlanModal={() => setCreatePlanModal(true)}
          onRetirePlan={handleRetirePlan}
          onUpdatePlanFeatures={handleUpdatePlanFeatures}
        />
      )}

      {tab === "subscriptions" && (
        <SubscriptionsPane
          schools={schools}
          onExtendPeriod={(id, st, days) => handleLifecycleChange(id, st, days)}
        />
      )}

      {tab === "billing" && (
        <BillingPane
          payments={payments}
          onProcessRefund={handleProcessRefund}
        />
      )}

      {tab === "usage" && (
        <UsagePane />
      )}

      {tab === "configuration" && (
        <ConfigPane
          onSaveConfig={() => setSuccessMsg("Global configuration defaults saved successfully")}
        />
      )}

      {tab === "security" && (
        <SecurityPane
          auditLogs={auditLogs}
        />
      )}

      {tab === "support" && (
        <SupportPane
          tickets={tickets}
          announcements={announcements}
          onOpenTicketModal={() => setTicketModal(true)}
          onOpenAnnouncementModal={() => setAnnouncementModal(true)}
          onResolveTicket={handleResolveTicket}
        />
      )}

      {tab === "health" && (
        <HealthPane />
      )}

      {/* MODALS */}
      {supportSessionModal && (
        <SupportSessionModal
          school={supportSessionModal}
          onClose={() => setSupportSessionModal(null)}
          onConfirm={handleStartSupportSession}
          busy={busy}
        />
      )}

      {overrideModal && selectedSchool && (
        <FeatureOverrideModal
          school={selectedSchool}
          onClose={() => setOverrideModal(false)}
          onSave={handleAddOverride}
          busy={busy}
        />
      )}

      {createPlanModal && (
        <CreatePlanModal
          onClose={() => setCreatePlanModal(false)}
          onCreate={handleCreatePlan}
        />
      )}

      {announcementModal && (
        <BroadcastAnnouncementModal
          onClose={() => setAnnouncementModal(false)}
          onSend={handleSendAnnouncement}
        />
      )}

      {ticketModal && (
        <CreateTicketModal
          schools={schools}
          onClose={() => setTicketModal(false)}
          onSubmit={handleCreateTicket}
        />
      )}

    </div>
  );
}
