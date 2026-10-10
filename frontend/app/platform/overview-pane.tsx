"use client";

import { Building2, Users, DollarSign, HardDrive, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { School } from "./types";

export function OverviewPane({
  schools,
  onNavigateTab,
  dashboardData,
  healthData,
}: {
  schools: School[];
  onNavigateTab: (tab: string) => void;
  dashboardData?: any;
  healthData?: any;
}) {
  const totalSchools = dashboardData?.schools?.total ?? schools.length;
  const activeSchools = dashboardData?.schools?.active ?? schools.filter(s => s.status === "active").length;
  const trialSchools = dashboardData?.subscriptions?.trial ?? schools.filter(s => s.status === "trial").length;
  const suspendedSchools = dashboardData?.schools?.inactive ?? schools.filter(s => s.status === "suspended").length;

  const studentsCount = dashboardData?.users?.students ?? 0;
  const teachersCount = dashboardData?.users?.teachers ?? 0;
  const parentsCount = dashboardData?.users?.parents ?? 0;
  const totalUsers = studentsCount + teachersCount + parentsCount;

  const monthlyRev = dashboardData?.revenue?.monthly ?? 0;
  const pendingRev = dashboardData?.revenue?.pending ?? 0;
  const storageGb = dashboardData?.usage?.storage ?? 0;
  const apiRequests = dashboardData?.usage?.apiRequests ?? 0;

  const recentActivities: any[] = dashboardData?.recentActivities || [];

  const overallHealth = healthData?.overall || "HEALTHY";
  const avgLatency = healthData?.metrics?.avgLatencyMs ?? 14;
  const errorRate = healthData?.metrics?.errorRate ?? "0.00%";
  const activeSessions = healthData?.metrics?.activeSessions ?? 0;

  return (
    <div style={{ display: "grid", gap: "22px" }}>
      {/* KPI SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div style={{ background: "#FFF", padding: "18px", borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", fontSize: "12.5px", fontWeight: 600 }}>
            <span>Total Schools</span>
            <Building2 size={16} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", marginTop: "6px" }}>{totalSchools}</div>
          <div style={{ fontSize: "11.5px", color: "#10B981", marginTop: "4px", fontWeight: 600 }}>
            {activeSchools} Active · {trialSchools} Trial · {suspendedSchools} Suspended
          </div>
        </div>

        <div style={{ background: "#FFF", padding: "18px", borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", fontSize: "12.5px", fontWeight: 600 }}>
            <span>Active Users (Students + Staff)</span>
            <Users size={16} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", marginTop: "6px" }}>
            {totalUsers > 0 ? totalUsers.toLocaleString() : "0"}
          </div>
          <div style={{ fontSize: "11.5px", color: "#6B7280", marginTop: "4px" }}>
            {studentsCount.toLocaleString()} Students · {teachersCount.toLocaleString()} Teachers · {parentsCount.toLocaleString()} Parents
          </div>
        </div>

        <div style={{ background: "#FFF", padding: "18px", borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", fontSize: "12.5px", fontWeight: 600 }}>
            <span>Monthly Collected Revenue</span>
            <DollarSign size={16} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#059669", marginTop: "6px" }}>
            ₹{monthlyRev.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "11.5px", color: pendingRev > 0 ? "#D97706" : "#10B981", marginTop: "4px", fontWeight: 600 }}>
            ₹{pendingRev.toLocaleString("en-IN")} pending invoices
          </div>
        </div>

        <div style={{ background: "#FFF", padding: "18px", borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", fontSize: "12.5px", fontWeight: 600 }}>
            <span>API & Storage Volume</span>
            <HardDrive size={16} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", marginTop: "6px" }}>{storageGb} GB</div>
          <div style={{ fontSize: "11.5px", color: "#6B7280", marginTop: "4px" }}>
            {apiRequests.toLocaleString()} API events recorded
          </div>
        </div>
      </div>

      {/* NOTIFICATION CENTER & SYSTEM HEALTH SNAPSHOT */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Real-time Notification Center (§33) */}
        <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>Platform Notification Center</h3>
            <span style={{ fontSize: "11.5px", color: "#6B7280" }}>Live system event triggers</span>
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            {recentActivities.length > 0 ? (
              recentActivities.slice(0, 4).map((act: any) => (
                <div key={act.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", background: "#FDF9F0", borderRadius: "8px", border: "1px solid #E5CCA2" }}>
                  <Sparkles size={16} color="#064E3B" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div style={{ fontSize: "12.5px", color: "#064E3B" }}>
                    <b>{act.schoolName}:</b> {act.action.replace(/\./g, " ")} by <i>{act.actorEmail}</i>
                    <span style={{ fontSize: "11px", color: "#6B7280", marginLeft: "6px" }}>
                      ({new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: "12.5px", color: "#6B7280", padding: "12px", textAlign: "center" }}>
                No recent system events logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Quick Health Status Card (§34) */}
        <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>Platform Health</h3>
            <span style={{
              background: overallHealth === "HEALTHY" ? "#DEF7EC" : "#FEF3C7",
              color: overallHealth === "HEALTHY" ? "#03543F" : "#92400E",
              padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700
            }}>
              {overallHealth === "HEALTHY" ? "ALL SYSTEMS OK" : "DEGRADED"}
            </span>
          </div>
          <div style={{ display: "grid", gap: "10px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>REST API Avg Latency:</span> <b>{avgLatency}ms</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>System Error Rate:</span> <b style={{ color: "#10B981" }}>{errorRate}</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Active Tenant Sessions:</span> <b>{activeSessions}</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Storage Used:</span> <b>{storageGb} GB / 2,048 GB</b></div>
            <button
              onClick={() => onNavigateTab("health")}
              style={{ marginTop: "8px", padding: "6px", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}
            >
              View Detailed Health Matrix →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
