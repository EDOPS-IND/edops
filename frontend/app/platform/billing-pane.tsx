"use client";

import { PaymentRecord } from "./types";

export function BillingPane({
  payments,
  onProcessRefund
}: {
  payments: PaymentRecord[];
  onProcessRefund: (paymentId: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Revenue KPI header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Total Collected Revenue</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#059669", marginTop: "4px" }}>₹22.50L</div>
        </div>
        <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Pending Invoices</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#D97706", marginTop: "4px" }}>₹5.95L</div>
        </div>
        <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px" }}>
          <div style={{ fontSize: "12px", color: "#6B7280" }}>Failed Payments to Retry</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#DC2626", marginTop: "4px" }}>1</div>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Payments & Transaction Receipts</h3>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>Offline NEFT/RTGS attestations, gateway settlements, and refund approvals</p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E7EB", textAlign: "left", color: "#4B5563" }}>
              <th style={{ padding: "8px" }}>Invoice Ref</th>
              <th style={{ padding: "8px" }}>School</th>
              <th style={{ padding: "8px" }}>Amount</th>
              <th style={{ padding: "8px" }}>Method & Txn</th>
              <th style={{ padding: "8px" }}>Status</th>
              <th style={{ padding: "8px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px 8px" }}><b>{p.invoiceId}</b></td>
                <td style={{ padding: "10px 8px" }}>{p.schoolName}</td>
                <td style={{ padding: "10px 8px", fontWeight: 700 }}>₹{(p.amountMinor / 100).toLocaleString()}</td>
                <td style={{ padding: "10px 8px" }}>
                  <div>{p.paymentMethod}</div>
                  <div style={{ fontSize: "11px", color: "#6B7280" }}>{p.transactionId || "N/A"}</div>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{
                    padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                    background: p.status === "success" ? "#DEF7EC" : p.status === "refunded" ? "#F3F4F6" : "#FEE2E2",
                    color: p.status === "success" ? "#03543F" : p.status === "refunded" ? "#4B5563" : "#991B1B"
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "10px 8px", textAlign: "right" }}>
                  {p.status === "success" && (
                    <button
                      onClick={() => onProcessRefund(p.id)}
                      style={{ padding: "4px 8px", background: "#FFF", border: "1px solid #D1D5DB", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                    >
                      Process Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
