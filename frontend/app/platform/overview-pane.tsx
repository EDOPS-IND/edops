"use client";

import { Building2, Users, DollarSign, HardDrive, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { School } from "./types";

export function OverviewPane({
  schools,
  onNavigateTab
}: {
  schools: School[];
  onNavigateTab: (tab: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "22px" }}>
      {/* KPI SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div style={{ background: "#FFF", padding: "18px", borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", fontSize: "12.5px", fontWeight: 600 }}>
            <span>Total Schools</span>
            <Building2 size={16} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", marginTop: "6px" }}>{schools.length}</div>
          <div style={{ fontSize: "11.5px", color: "#10B981", marginTop: "4px", fontWeight: 600 }}>
            {schools.filter(s => s.status === "active").length} Active · {schools.filter(s => s.status === "trial").length} Trial · {schools.filter(s => s.status === "suspended").length} Suspended
          </div>
        </div>

        <div style={{ background: "#FFF", padding: "18px", borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", fontSize: "12.5px", fontWeight: 600 }}>
            <span>Active Users (Students + Staff)</span>
            <Users size={16} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", marginTop: "6px" }}>
            {(() => {
              const totalStudents = schools.reduce((acc, s) => acc + parseInt((s.studentsCount || "0").replace(/,/g, ""), 10), 0);
              const totalTeachers = schools.reduce((acc, s) => acc + parseInt((s.teachersCount || "0").replace(/,/g, ""), 10), 0);
              const totalUsers = totalStudents + totalTeachers;
              return totalUsers > 1000 ? `${(totalUsers / 1000).toFixed(1)}K` : `${totalUsers}`;
            })()}
          </div>
          <div style={{ fontSize: "11.5px", color: "#6B7280", marginTop: "4px" }}>
            {(() => {
              const students = schools.reduce((acc, s) => acc + parseInt((s.studentsCount || "0").replace(/,/g, ""), 10), 0);
              const teachers = schools.reduce((acc, s) => acc + parseInt((s.teachersCount || "0").replace(/,/g, ""), 10), 0);
              return `${students.toLocaleString()} Students · ${teachers.toLocaleString()} Teachers`;
            })()}
          </div>
        </div>

        <div style={{ background: "#FFF", padding: "18px", borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", fontSize: "12.5px", fontWeight: 600 }}>
            <span>Monthly Recurring Revenue</span>
            <DollarSign size={16} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#059669", marginTop: "6px" }}>
            ₹{(() => {
              const activeCount = schools.filter(s => s.status === "active").length;
              const estLakhs = (activeCount * 0.75).toFixed(2);
              return `${estLakhs}L`;
            })()}
          </div>
          <div style={{ fontSize: "11.5px", color: "#10B981", marginTop: "4px", fontWeight: 600 }}>
            {schools.filter(s => s.status === "active").length} Billable Active Schools
          </div>
        </div>

        <div style={{ background: "#FFF", padding: "18px", borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", fontSize: "12.5px", fontWeight: 600 }}>
            <span>Storage & API Volume</span>
            <HardDrive size={16} />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", marginTop: "6px" }}>
            {schools.reduce((acc, s) => acc + (s.storageUsageGb || 0), 0)} GB
          </div>
          <div style={{ fontSize: "11.5px", color: "#6B7280", marginTop: "4px" }}>
            {schools.reduce((acc, s) => acc + (s.apiRequests || 0), 0).toLocaleString()} API requests tracked
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
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", background: "#FEF3C7", borderRadius: "8px", border: "1px solid #FDE68A" }}>
              <AlertTriangle size={16} color="#D97706" style={{ marginTop: "2px" }} />
              <div style={{ fontSize: "12.5px", color: "#92400E" }}>
                <b>Heritage Valley High:</b> Direct Debit payment failed (₹35,000). Automatic retry scheduled for 24h.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", background: "#FDF9F0", borderRadius: "8px", border: "1px solid #E5CCA2" }}>
              <Sparkles size={16} color="#064E3B" style={{ marginTop: "2px" }} />
              <div style={{ fontSize: "12.5px", color: "#064E3B" }}>
                <b>New Onboarding:</b> XYZ Academy completed teacher roster import (32 faculty invited).
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", background: "#F0FDF4", borderRadius: "8px", border: "1px solid #BBF7D0" }}>
              <CheckCircle2 size={16} color="#16A34A" style={{ marginTop: "2px" }} />
              <div style={{ fontSize: "12.5px", color: "#166534" }}>
                <b>System Backup:</b> Hourly WAL archiving completed across all PostgreSQL tenant nodes.
              </div>
            </div>
          </div>
        </div>

        {/* Quick Health Status Card (§34) */}
        <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>Platform Health</h3>
            <span style={{ background: "#DEF7EC", color: "#03543F", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>ALL SYSTEMS OK</span>
          </div>
          <div style={{ display: "grid", gap: "10px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>REST API Latency:</span> <b>18ms</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>PostgreSQL RLS Cluster:</span> <b style={{ color: "#10B981" }}>Healthy (4ms)</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Redis Session Store:</span> <b style={{ color: "#10B981" }}>Healthy (2ms)</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Email / SMS Delivery:</span> <b style={{ color: "#10B981" }}>99.9% Delivered</b></div>
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
