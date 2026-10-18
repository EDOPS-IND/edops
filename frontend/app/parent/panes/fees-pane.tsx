"use client";

import React from "react";
import { WardInfo } from "../types";
import { CreditCard, CheckCircle2, AlertCircle, Clock, Receipt, Building2 } from "lucide-react";

export function FeesPane({ selectedWard }: { selectedWard: WardInfo }) {
  const fees = selectedWard.data?.fees || [];

  const totalAssessed = fees.reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0);
  const totalPaid = fees.reduce((acc: number, f: any) => acc + (Number(f.paidAmount) || 0), 0);
  const totalPending = fees.reduce((acc: number, f: any) => acc + (Number(f.pending) || 0), 0);

  const isAllClear = totalPending === 0 && fees.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 4 Pastel Top KPI Metric Cards (Strictly 148px height) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Card 1: Mint */}
        <div
          style={{
            height: "148px",
            background: "#ccefbf",
            border: "1px solid #b2e49f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a5c0a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Assessed
            </span>
            <Receipt size={16} color="#1a5c0a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#144807", lineHeight: 1 }}>
              ₹{totalAssessed.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "11px", color: "#23730e", marginTop: "6px", fontWeight: 600 }}>
              {fees.length} Invoiced Fee Heads
            </div>
          </div>
        </div>

        {/* Card 2: Violet */}
        <div
          style={{
            height: "148px",
            background: "#e1d2ff",
            border: "1px solid #cdb5ff",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4a0e8f", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Fees Paid
            </span>
            <CheckCircle2 size={16} color="#4a0e8f" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#360a69", lineHeight: 1 }}>
              ₹{totalPaid.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "11px", color: "#5d1cb3", marginTop: "6px", fontWeight: 600 }}>
              Processed & Reconciled
            </div>
          </div>
        </div>

        {/* Card 3: Sky */}
        <div
          style={{
            height: "148px",
            background: "#bae5f5",
            border: "1px solid #9ad7ef",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0a5a7a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Balance Outstanding
            </span>
            <AlertCircle size={16} color="#0a5a7a" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#074158", lineHeight: 1 }}>
              ₹{totalPending.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "11px", color: "#0d6e94", marginTop: "6px", fontWeight: 600 }}>
              {totalPending > 0 ? "Payment Action Required" : "Zero Balance Due"}
            </div>
          </div>
        </div>

        {/* Card 4: Peach */}
        <div
          style={{
            height: "148px",
            background: "#ffd8c7",
            border: "1px solid #ffbe9f",
            borderRadius: "10px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#782a00", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Settlement Status
            </span>
            <CreditCard size={16} color="#782a00" />
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#561e00", lineHeight: 1 }}>
              {isAllClear ? "All Clear" : totalPending > 0 ? "Due" : "Good"}
            </div>
            <div style={{ fontSize: "11px", color: "#943502", marginTop: "6px", fontWeight: 600 }}>
              Accounts Standing Verified
            </div>
          </div>
        </div>
      </div>

      {/* Invoiced Fee Dues Table */}
      <div style={{ background: "#ffffff", border: "1px solid #e4e6e9", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e4e6e9" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
            School Fee Invoices & Structure
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
            Itemized breakdown of tuition, sports, laboratory, and examination assessments.
          </p>
        </div>

        {fees.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
            No fee invoices currently assigned to {selectedWard.name}.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e6e9", color: "#64748b", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Fee Head</th>
                  <th style={{ padding: "12px 16px" }}>Assessed (₹)</th>
                  <th style={{ padding: "12px 16px" }}>Paid (₹)</th>
                  <th style={{ padding: "12px 16px" }}>Pending (₹)</th>
                  <th style={{ padding: "12px 16px" }}>Due Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f: any, idx: number) => {
                  const isPaid = f.status?.toLowerCase().includes("paid") || f.pending === 0;
                  const isOverdue = f.status?.toLowerCase().includes("overdue");
                  return (
                    <tr
                      key={f.id || idx}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fbfcfd")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>{f.title}</td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        ₹{Number(f.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#15803d", fontWeight: 600 }}>
                        ₹{Number(f.paidAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: f.pending > 0 ? "#dc2626" : "#0c1e33" }}>
                        ₹{Number(f.pending || 0).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>
                        {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: isPaid ? "#dcfce7" : isOverdue ? "#fee2e2" : "#fef3c7",
                            color: isPaid ? "#166534" : isOverdue ? "#991b1b" : "#92400e",
                            textTransform: "capitalize",
                          }}
                        >
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment & Receipts Information Notice */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e4e6e9",
          borderRadius: "10px",
          padding: "20px",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
        }}
      >
        <Building2 size={24} color="#0c1e33" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
            School Accounts & Payment Instructions
          </h4>
          <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#475569", lineHeight: "1.5" }}>
            School fees can be settled via UPI, Net Banking, or in-person at the campus finance counter during office hours
            (9:00 AM – 3:30 PM). To obtain tax-deductible receipts (80G) or submit payment verification slips, contact the
            accounts office directly.
          </p>
          <div style={{ fontSize: "11px", color: "#64748b" }}>
            Campus Desk: accounts@school.edops.in • Accounts Phone: +91 (0) 11 4500 2200
          </div>
        </div>
      </div>
    </div>
  );
}
