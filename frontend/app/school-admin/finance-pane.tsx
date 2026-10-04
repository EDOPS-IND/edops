"use client";

import React, { useState } from "react";
import { FeeStructureRecord, FeeDefaulterRecord } from "./types";
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Plus,
  Search,
  Filter,
} from "lucide-react";

export function FinancePane() {
  const [subtab, setSubtab] = useState<"dashboard" | "defaulters" | "structure">("dashboard");

  const feeStructures: FeeStructureRecord[] = [
    { id: "fs-1", grade: "Grade 10", tuitionFee: 42000, annualFee: 12000, transportFee: 15000, examFee: 2500, totalFee: 71500, frequency: "Quarterly" },
    { id: "fs-2", grade: "Grade 9", tuitionFee: 38000, annualFee: 12000, transportFee: 15000, examFee: 2500, totalFee: 67500, frequency: "Quarterly" },
    { id: "fs-3", grade: "Grade 11 & 12 (Science)", tuitionFee: 55000, annualFee: 15000, transportFee: 15000, examFee: 3500, totalFee: 88500, frequency: "Quarterly" },
    { id: "fs-4", grade: "Middle School (6-8)", tuitionFee: 32000, annualFee: 10000, transportFee: 14000, examFee: 2000, totalFee: 58000, frequency: "Quarterly" },
  ];

  const defaulters: FeeDefaulterRecord[] = [
    { id: "def-1", studentName: "Ananya Iyer", admissionNo: "ED-2024-042", grade: "Grade 10", section: "10-A", parentName: "Venkat Iyer", parentPhone: "+91 98112 34567", amountDue: 18500, daysOverdue: 22, lastPaymentDate: "2026-06-20" },
    { id: "def-2", studentName: "Rohan Verma", admissionNo: "ED-2024-089", grade: "Grade 9", section: "9-B", parentName: "Sunil Verma", parentPhone: "+91 97123 98765", amountDue: 17000, daysOverdue: 35, lastPaymentDate: "2026-06-15" },
    { id: "def-3", studentName: "Manav Joshi", admissionNo: "ED-2023-140", grade: "Grade 11", section: "11-A", parentName: "Dinesh Joshi", parentPhone: "+91 98889 11223", amountDue: 22000, daysOverdue: 42, lastPaymentDate: "2026-05-10" },
  ];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Subtab Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2DDD5", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "dashboard", label: "Fee Collections Overview (§41)" },
            { id: "defaulters", label: "Fee Defaulters Desk (§42)" },
            { id: "structure", label: "Grade Fee Structures (§40)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubtab(tab.id as any)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 750 : 600,
                background: subtab === tab.id ? "#064E3B" : "transparent",
                color: subtab === tab.id ? "#F8E7C9" : "#064E3B",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button style={{ padding: "8px 16px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Plus size={15} /> Record Offline Payment
        </button>
      </div>

      {/* 1. FEE COLLECTIONS OVERVIEW (§41) */}
      {subtab === "dashboard" && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Q3 Expected Target</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#064E3B", margin: "4px 0" }}>₹1.56 Cr</div>
              <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>Total Tuition & Transports</span>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Total Collected</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#064E3B", margin: "4px 0" }}>₹1.42 Cr</div>
              <span style={{ fontSize: "11.5px", color: "#064E3B", fontWeight: 700 }}>91.0% Realized</span>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Pending / Overdue</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#B45309", margin: "4px 0" }}>₹14.2 Lakh</div>
              <span style={{ fontSize: "11.5px", color: "#B45309", fontWeight: 700 }}>64 Unpaid Student Accounts</span>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "16px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 650 }}>Today's Counter Collection</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#064E3B", margin: "4px 0" }}>₹84,500</div>
              <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>6 Receipts (UPI & NetBanking)</span>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Quarterly Collection Trends by Wing</h3>
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                { wing: "Senior Secondary (11-12)", collected: "₹42.8 Lakh", total: "₹45.0 Lakh", pct: 95 },
                { wing: "Secondary Wing (9-10)", collected: "₹46.2 Lakh", total: "₹51.0 Lakh", pct: 90 },
                { wing: "Middle School (6-8)", collected: "₹34.5 Lakh", total: "₹38.5 Lakh", pct: 89 },
                { wing: "Primary & Foundational (Nur-5)", collected: "₹18.5 Lakh", total: "₹21.5 Lakh", pct: 86 },
              ].map((w, idx) => (
                <div key={idx} style={{ padding: "12px", background: "#FAF8F5", borderRadius: "8px", border: "1px solid #E2DDD5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <b>{w.wing}</b>
                    <span style={{ fontWeight: 700, color: "#064E3B" }}>{w.collected} / {w.total} ({w.pct}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "#E2DDD5", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${w.pct}%`, height: "100%", background: "#064E3B" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. FEE DEFAULTERS ACTION DESK (§42) */}
      {subtab === "defaulters" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Fee Defaulters Desk (§42)</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>Direct actionable operational triggers: Send Reminder, View Ledger, Record Payment, or Apply Concession</p>
            </div>
            <button style={{ padding: "8px 16px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              Batch Send WhatsApp Payment Link
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Student & Admission</th>
                <th style={{ padding: "10px" }}>Class / Section</th>
                <th style={{ padding: "10px" }}>Parent / Contact</th>
                <th style={{ padding: "10px" }}>Amount Due</th>
                <th style={{ padding: "10px" }}>Days Overdue</th>
                <th style={{ padding: "10px" }}>Last Payment</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <b>{d.studentName}</b>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{d.admissionNo}</div>
                  </td>
                  <td style={{ padding: "12px 10px" }}>{d.section}</td>
                  <td style={{ padding: "12px 10px" }}>
                    <div>{d.parentName}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{d.parentPhone}</div>
                  </td>
                  <td style={{ padding: "12px 10px", fontWeight: 800, color: "#B45309" }}>
                    ₹{d.amountDue.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ background: d.daysOverdue > 30 ? "#FEE2E2" : "#FEF3C7", color: d.daysOverdue > 30 ? "#991B1B" : "#92400E", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>
                      {d.daysOverdue} Days Late
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", color: "var(--muted)", fontSize: "12px" }}>{d.lastPaymentDate}</td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => alert(`Sent WhatsApp Fee Reminder to ${d.parentPhone}`)}
                        style={{ padding: "5px 10px", background: "#064E3B", color: "#F8E7C9", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Send Reminder
                      </button>
                      <button
                        onClick={() => alert(`Opening concession dialog for ${d.studentName}`)}
                        style={{ padding: "5px 10px", background: "#FAF8F5", border: "1px solid #E2DDD5", color: "#064E3B", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Concession
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. GRADE FEE STRUCTURES (§40) */}
      {subtab === "structure" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2DDD5", borderRadius: "10px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Grade-Wise Fee Structures & Head Allocations</h3>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--muted)" }}>Tuition, Annual Establishment, Transport Fleet, and Lab/Exam Fee Breakdown</p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2DDD5", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Grade / Stream</th>
                <th style={{ padding: "10px" }}>Tuition Fee</th>
                <th style={{ padding: "10px" }}>Annual Fee</th>
                <th style={{ padding: "10px" }}>Transport Fee</th>
                <th style={{ padding: "10px" }}>Exam / Lab Fee</th>
                <th style={{ padding: "10px" }}>Total Session Fee</th>
                <th style={{ padding: "10px" }}>Installments</th>
              </tr>
            </thead>
            <tbody>
              {feeStructures.map((f) => (
                <tr key={f.id} style={{ borderBottom: "1px solid #FAF8F5" }}>
                  <td style={{ padding: "12px 10px", fontWeight: 700, color: "#064E3B" }}>{f.grade}</td>
                  <td style={{ padding: "12px 10px" }}>₹{f.tuitionFee.toLocaleString()}</td>
                  <td style={{ padding: "12px 10px" }}>₹{f.annualFee.toLocaleString()}</td>
                  <td style={{ padding: "12px 10px" }}>₹{f.transportFee.toLocaleString()}</td>
                  <td style={{ padding: "12px 10px" }}>₹{f.examFee.toLocaleString()}</td>
                  <td style={{ padding: "12px 10px", fontWeight: 800, color: "#064E3B" }}>₹{f.totalFee.toLocaleString()}</td>
                  <td style={{ padding: "12px 10px" }}>{f.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
