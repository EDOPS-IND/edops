"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FeeStructureRecord, FeeDefaulterRecord } from "./types";
import {
  getSchoolAdminFinance,
  sendSchoolAdminFeeReminder,
  grantSchoolAdminFeeConcession,
  createSchoolAdminFeeStructure,
  recordSchoolAdminFeePayment,
  batchSendSchoolAdminFeeReminders,
} from "../edops-api";
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
  X,
} from "lucide-react";

export function FinancePane({
  organizationId,
  activeTab,
  onTabChange,
}: {
  organizationId?: string;
  activeTab?: "dashboard" | "defaulters" | "structure";
  onTabChange?: (tab: "dashboard" | "defaulters" | "structure") => void;
}) {
  const [subtab, setSubtab] = useState<"dashboard" | "defaulters" | "structure">(activeTab || "dashboard");

  useEffect(() => {
    if (activeTab && activeTab !== subtab) {
      setSubtab(activeTab);
    }
  }, [activeTab]);
  const [loading, setLoading] = useState(false);
  const [financeData, setFinanceData] = useState<any>(null);

  const [feeStructures, setFeeStructures] = useState<FeeStructureRecord[]>([]);
  const [defaulters, setDefaulters] = useState<FeeDefaulterRecord[]>([]);

  // Modals & Forms State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDueId, setPaymentDueId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | string>("");
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [concessionDue, setConcessionDue] = useState<FeeDefaulterRecord | null>(null);
  const [concessionAmount, setConcessionAmount] = useState<number | string>("");
  const [concessionReason, setConcessionReason] = useState("");
  const [submittingConcession, setSubmittingConcession] = useState(false);

  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structureName, setStructureName] = useState("");
  const [structureClassDigit, setStructureClassDigit] = useState("");
  const [structureAcademicYearId, setStructureAcademicYearId] = useState("");
  const [tuitionFee, setTuitionFee] = useState<number | string>("");
  const [developmentFee, setDevelopmentFee] = useState<number | string>("");
  const [transportFee, setTransportFee] = useState<number | string>("");
  const [labFee, setLabFee] = useState<number | string>("");
  const [installmentsCount, setInstallmentsCount] = useState<number>(4);
  const [submittingStructure, setSubmittingStructure] = useState(false);

  const [batchSending, setBatchSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchFinance = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await getSchoolAdminFinance(organizationId);
      setFinanceData(data);
      if (data?.structures && Array.isArray(data.structures)) {
        setFeeStructures(
          data.structures.map((s: any) => ({
            id: s.id,
            grade: s.grade || s.name,
            tuitionFee: Number(s.tuition_fee || 0),
            annualFee: Number(s.development_fee || 0),
            transportFee: Number(s.transport_fee || 0),
            examFee: Number((s.lab_fee || 0) + (s.library_fee || 0)),
            totalFee: Number(s.total_annual || 0),
            frequency: s.installments_count == null ? "Not recorded" : `${s.installments_count} Installments`,
          }))
        );
      }
      if (data?.dues && Array.isArray(data.dues)) {
        setDefaulters(
          data.dues.map((d: any) => ({
            id: d.id,
            studentName: d.student_name,
            admissionNo: d.admission_number || d.roll_number || "—",
            grade: d.grade || "Class",
            section: d.section_name || "Section",
            parentName: d.guardian_name || "Parent/Guardian",
            parentPhone: d.guardian_phone || "Not on file",
            amountDue: Number(d.amount_pending || 0),
            daysOverdue: Number(d.days_overdue || 0),
            lastPaymentDate: d.due_date ? String(d.due_date).slice(0, 10) : "",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, [organizationId]);

  const handleSendReminder = async (dueId: string) => {
    if (!organizationId) return;
    try {
      await sendSchoolAdminFeeReminder(organizationId, dueId, "in_app");
      setToastMessage("Reminder dispatched directly to parent inbox.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to send reminder");
    }
  };

  const handleBatchSendReminders = async () => {
    if (!organizationId) return;
    const unpaid = defaulters.filter((d) => d.amountDue > 0);
    if (unpaid.length === 0) {
      alert("No students with pending dues found to send reminders to.");
      return;
    }
    setBatchSending(true);
    try {
      const res = await batchSendSchoolAdminFeeReminders(organizationId, "in_app");
      setToastMessage(`Dispatched fee reminders to ${res.sentCount || 0} parent inboxes.`);
      setTimeout(() => setToastMessage(null), 4000);
      await fetchFinance();
    } catch (err: any) {
      alert(err.message || "Failed to send batch fee reminders.");
    } finally {
      setBatchSending(false);
    }
  };

  const openPaymentForDue = (due?: FeeDefaulterRecord) => {
    if (due) {
      setPaymentDueId(due.id);
      setPaymentAmount(due.amountDue > 0 ? due.amountDue : "");
    } else {
      setPaymentDueId(defaulters[0]?.id || "");
      setPaymentAmount(defaulters[0]?.amountDue > 0 ? defaulters[0]?.amountDue : "");
    }
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !paymentDueId || !paymentAmount) return;
    setSubmittingPayment(true);
    try {
      await recordSchoolAdminFeePayment(organizationId, {
        dueId: paymentDueId,
        amount: Number(paymentAmount),
        paymentMode,
        referenceNo: referenceNo.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });
      setShowPaymentModal(false);
      setPaymentDueId("");
      setPaymentAmount("");
      setReferenceNo("");
      setPaymentNotes("");
      setToastMessage("Payment recorded successfully!");
      setTimeout(() => setToastMessage(null), 3000);
      await fetchFinance();
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const openConcession = (due: FeeDefaulterRecord) => {
    setConcessionDue(due);
    setConcessionAmount("");
    setConcessionReason("");
    setShowConcessionModal(true);
  };

  const handleApplyConcession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !concessionDue || !concessionAmount || !concessionReason.trim()) return;
    setSubmittingConcession(true);
    try {
      await grantSchoolAdminFeeConcession(
        organizationId,
        concessionDue.id,
        Number(concessionAmount),
        concessionReason.trim()
      );
      setShowConcessionModal(false);
      setConcessionDue(null);
      setConcessionAmount("");
      setConcessionReason("");
      setToastMessage("Audited fee concession applied successfully!");
      setTimeout(() => setToastMessage(null), 3000);
      await fetchFinance();
    } catch (err: any) {
      alert(err.message || "Failed to apply concession");
    } finally {
      setSubmittingConcession(false);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !structureName.trim() || !structureClassDigit.trim()) return;
    setSubmittingStructure(true);
    try {
      await createSchoolAdminFeeStructure(organizationId, {
        name: structureName.trim(),
        grade: `Class ${structureClassDigit.trim()}`,
        academicYearId: structureAcademicYearId || undefined,
        tuitionFee: Number(tuitionFee || 0),
        developmentFee: Number(developmentFee || 0),
        transportFee: Number(transportFee || 0),
        labFee: Number(labFee || 0),
        libraryFee: 0,
        installmentsCount: Number(installmentsCount || 4),
      });
      setShowStructureModal(false);
      setStructureName("");
      setStructureClassDigit("");
      setTuitionFee("");
      setDevelopmentFee("");
      setTransportFee("");
      setLabFee("");
      setToastMessage("Class fee structure registered!");
      setTimeout(() => setToastMessage(null), 3000);
      await fetchFinance();
    } catch (err: any) {
      alert(err.message || "Failed to create fee structure");
    } finally {
      setSubmittingStructure(false);
    }
  };

  const totalPending = defaulters.reduce((acc, d) => acc + d.amountDue, 0);

  const collectionTrends = useMemo(() => {
    const dues = financeData?.dues || [];
    if (!dues.length) return [];
    const map: Record<string, { collected: number; total: number }> = {};
    for (const d of dues) {
      const label = d.section_name || d.grade || "General";
      const key = label.includes(" ") ? label.split(" ")[0] : label;
      if (!map[key]) map[key] = { collected: 0, total: 0 };
      map[key].collected += Number(d.amount_paid || 0);
      map[key].total += Number(d.total_due || 0);
    }
    return Object.entries(map).map(([wing, s]) => ({
      wing: wing.startsWith("Class") ? wing : `Class ${wing}`,
      collected: `₹${s.collected.toLocaleString("en-IN")}`,
      total: `₹${s.total.toLocaleString("en-IN")}`,
      pct: s.total > 0 ? Math.round((s.collected / s.total) * 100) : 0,
    }));
  }, [financeData?.dues]);

  return (
    <div style={{ display: "grid", gap: "20px", position: "relative" }}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#0c1e33",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* Subtab Selector & Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e4e6e9",
          paddingBottom: "12px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "dashboard", label: "Fee Collections Overview" },
            { id: "defaulters", label: `Fee Defaulters Desk (${defaulters.length})` },
            { id: "structure", label: `Class Fee Structures (${feeStructures.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSubtab(tab.id as any);
                if (onTabChange) onTabChange(tab.id as any);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: subtab === tab.id ? 700 : 500,
                background: subtab === tab.id ? "#0c1e33" : "transparent",
                color: subtab === tab.id ? "#ffffff" : "#4a5568",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => openPaymentForDue()}
          style={{
            padding: "8px 16px",
            background: "#0c1e33",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={15} /> Record Offline Payment
        </button>
      </div>

      {/* 1. FEE COLLECTIONS OVERVIEW */}
      {subtab === "dashboard" && (
        <div style={{ display: "grid", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            {/* 1. Target Fee (Pastel Violet) */}
            <article
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "148px",
                padding: "20px",
                background: "#e1d2ff",
                border: "1px solid #e1d2ff",
                borderRadius: "10px",
                color: "#4a0e8f",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Expected Realization Target
                </span>
                <CreditCard size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "32px", fontWeight: 700, lineHeight: 1, color: "#4a0e8f" }}>
                ₹{(financeData?.dues || []).reduce((sum: number, d: any) => sum + Number(d.total_due || 0), 0).toLocaleString("en-IN")}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Total assessed tuition &amp; services</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Assessed</span>
              </div>
            </article>

            {/* 2. Total Collected (Pastel Mint) */}
            <article
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "148px",
                padding: "20px",
                background: "#ccefbf",
                border: "1px solid #ccefbf",
                borderRadius: "10px",
                color: "#1a5c0a",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Realized Collections
                </span>
                <CheckCircle2 size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "32px", fontWeight: 700, lineHeight: 1, color: "#1a5c0a" }}>
                ₹{(financeData?.dues || []).reduce((sum: number, d: any) => sum + Number(d.amount_paid || 0), 0).toLocaleString("en-IN")}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Bank &amp; Bursar deposits cleared</span>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Cleared</span>
              </div>
            </article>

            {/* 3. Overdue Balance (Pastel Coral) */}
            <article
              onClick={() => {
                setSubtab("defaulters");
                if (onTabChange) onTabChange("defaulters");
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "148px",
                padding: "20px",
                background: "#ffd6d6",
                border: "1px solid #ffd6d6",
                borderRadius: "10px",
                color: "#7a1a1a",
                cursor: "pointer",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Overdue Balance
                </span>
                <AlertTriangle size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "32px", fontWeight: 700, lineHeight: 1, color: "#7a1a1a" }}>
                ₹{totalPending.toLocaleString("en-IN")}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>{defaulters.filter((d) => d.amountDue > 0).length} unpaid student accounts</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
                  Defaulters <ArrowRight size={13} />
                </span>
              </div>
            </article>

            {/* 4. Active Fee Structures (Pastel Sky) */}
            <article
              onClick={() => {
                setSubtab("structure");
                if (onTabChange) onTabChange("structure");
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "148px",
                padding: "20px",
                background: "#bae5f5",
                border: "1px solid #bae5f5",
                borderRadius: "10px",
                color: "#0a5a7a",
                cursor: "pointer",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Active Fee Structures
                </span>
                <CreditCard size={18} />
              </div>
              <p style={{ margin: 0, fontSize: "32px", fontWeight: 700, lineHeight: 1, color: "#0a5a7a" }}>
                {feeStructures.length}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px" }}>Configured across classes</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
                  Structures <ArrowRight size={13} />
                </span>
              </div>
            </article>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>
              Collection Trends by Class
            </h3>
            {collectionTrends.length > 0 ? (
              <div style={{ display: "grid", gap: "10px" }}>
                {collectionTrends.map((w, idx) => (
                  <div key={idx} style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e4e6e9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <b style={{ color: "#0c1e33" }}>{w.wing}</b>
                      <span style={{ fontWeight: 700, color: "#047857" }}>
                        {w.collected} / {w.total} ({w.pct}%)
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#e4e6e9", borderRadius: "3px", marginTop: "8px", overflow: "hidden" }}>
                      <div style={{ width: `${w.pct}%`, height: "100%", background: "#0c1e33" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)", fontSize: "13px", padding: "20px", textAlign: "center", background: "#f8fafc", borderRadius: "8px" }}>
                No fee collection activity recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. FEE DEFAULTERS ACTION DESK */}
      {subtab === "defaulters" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>Fee Defaulters Desk</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Direct actionable operational triggers: Send Reminder, Record Payment, or Apply Concession
              </p>
            </div>
            <button
              onClick={handleBatchSendReminders}
              disabled={batchSending}
              style={{
                padding: "8px 16px",
                background: batchSending ? "#9CA3AF" : "#0c1e33",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: batchSending ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Send size={13} />
              {batchSending ? "Dispatching..." : "Batch Send Payment Link & Reminders"}
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Student & Admission</th>
                <th style={{ padding: "10px" }}>Class / Section</th>
                <th style={{ padding: "10px" }}>Parent / Contact</th>
                <th style={{ padding: "10px" }}>Amount Due</th>
                <th style={{ padding: "10px" }}>Days Overdue</th>
                <th style={{ padding: "10px" }}>Due Date</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                    No outstanding fee dues or defaulters found.
                  </td>
                </tr>
              ) : (
                defaulters.map((d) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f4f6f7" }}>
                    <td style={{ padding: "12px 10px" }}>
                      <b style={{ color: "#0c1e33" }}>{d.studentName}</b>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{d.admissionNo}</div>
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      {d.grade ? `${d.grade} ` : ""}{d.section}
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      <div>{d.parentName}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{d.parentPhone}</div>
                    </td>
                    <td style={{ padding: "12px 10px", fontWeight: 800, color: d.amountDue > 0 ? "#B45309" : "#047857" }}>
                      ₹{d.amountDue.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 10px" }}>
                      {d.amountDue > 0 ? (
                        <span
                          style={{
                            background: d.daysOverdue > 30 ? "#FEE2E2" : "#FEF3C7",
                            color: d.daysOverdue > 30 ? "#991B1B" : "#92400E",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {d.daysOverdue} Days Late
                        </span>
                      ) : (
                        <span style={{ color: "#047857", fontSize: "11.5px", fontWeight: 700 }}>Paid</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 10px", color: "var(--muted)", fontSize: "12px" }}>{d.lastPaymentDate || "—"}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => openPaymentForDue(d)}
                          style={{
                            padding: "5px 10px",
                            background: "#0c1e33",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => handleSendReminder(d.id)}
                          style={{
                            padding: "5px 10px",
                            background: "#f8fafc",
                            border: "1px solid #e4e6e9",
                            color: "#0c1e33",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Send Reminder
                        </button>
                        <button
                          onClick={() => openConcession(d)}
                          style={{
                            padding: "5px 10px",
                            background: "#f8fafc",
                            border: "1px solid #e4e6e9",
                            color: "#0c1e33",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Concession
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. CLASS FEE STRUCTURES */}
      {subtab === "structure" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #e4e6e9", borderRadius: "10px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>
                Class-Wise Fee Structures & Head Allocations
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                Tuition, Annual Establishment, Transport Fleet, and Lab/Exam Fee Breakdown
              </p>
            </div>
            <button
              onClick={() => setShowStructureModal(true)}
              style={{
                padding: "8px 16px",
                background: "#0c1e33",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={15} /> Add Fee Structure
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e4e6e9", color: "var(--muted)" }}>
                <th style={{ padding: "10px" }}>Class / Stream</th>
                <th style={{ padding: "10px" }}>Tuition Fee</th>
                <th style={{ padding: "10px" }}>Annual Fee</th>
                <th style={{ padding: "10px" }}>Transport Fee</th>
                <th style={{ padding: "10px" }}>Exam / Lab Fee</th>
                <th style={{ padding: "10px" }}>Total Session Fee</th>
                <th style={{ padding: "10px" }}>Installments</th>
              </tr>
            </thead>
            <tbody>
              {feeStructures.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                    No fee structures defined yet. Click &quot;Add Fee Structure&quot; to configure one.
                  </td>
                </tr>
              ) : (
                feeStructures.map((f) => (
                  <tr key={f.id} style={{ borderBottom: "1px solid #f4f6f7" }}>
                    <td style={{ padding: "12px 10px", fontWeight: 700, color: "#0c1e33" }}>{f.grade}</td>
                    <td style={{ padding: "12px 10px" }}>₹{f.tuitionFee.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 10px" }}>₹{f.annualFee.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 10px" }}>₹{f.transportFee.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 10px" }}>₹{f.examFee.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 10px", fontWeight: 800, color: "#0c1e33" }}>
                      ₹{f.totalFee.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 10px" }}>{f.frequency}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* RECORD OFFLINE PAYMENT MODAL */}
      {showPaymentModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>
                Record Offline Counter Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  Select Student Account *
                </label>
                <select
                  required
                  value={paymentDueId}
                  onChange={(e) => {
                    setPaymentDueId(e.target.value);
                    const selected = defaulters.find((d) => d.id === e.target.value);
                    if (selected && selected.amountDue > 0) {
                      setPaymentAmount(selected.amountDue);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e4e6e9",
                    fontSize: "13px",
                  }}
                >
                  <option value="">-- Select Student / Pending Due --</option>
                  {defaulters.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.studentName} ({d.admissionNo}) — Pending: ₹{d.amountDue.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e4e6e9",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "13px",
                    }}
                  >
                    <option value="cash">Cash (Counter)</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="dd">Demand Draft (DD)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Reference / Receipt No.
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. REC-2026-091"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  Notes / Counter Remarks
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional counter remarks"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e4e6e9",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid #e4e6e9",
                    background: "#f8fafc",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#0c1e33",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: submittingPayment ? "not-allowed" : "pointer",
                  }}
                >
                  {submittingPayment ? "Recording..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRANT CONCESSION MODAL */}
      {showConcessionModal && concessionDue && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>
                Grant Fee Concession
              </h3>
              <button
                onClick={() => setShowConcessionModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e4e6e9",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "14px",
                fontSize: "13px",
              }}
            >
              <div>
                <b>Student:</b> {concessionDue.studentName} ({concessionDue.admissionNo})
              </div>
              <div style={{ marginTop: "4px" }}>
                <b>Current Outstanding Balance:</b> ₹{concessionDue.amountDue.toLocaleString("en-IN")}
              </div>
            </div>

            <form onSubmit={handleApplyConcession} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  Concession / Waiver Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={concessionDue.amountDue}
                  required
                  value={concessionAmount}
                  onChange={(e) => setConcessionAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e4e6e9",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  Justification / Audited Reason *
                </label>
                <input
                  type="text"
                  required
                  value={concessionReason}
                  onChange={(e) => setConcessionReason(e.target.value)}
                  placeholder="e.g. Merit Scholarship / EWS Quota / Sibling Discount"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e4e6e9",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowConcessionModal(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid #e4e6e9",
                    background: "#f8fafc",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingConcession}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#0c1e33",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: submittingConcession ? "not-allowed" : "pointer",
                  }}
                >
                  {submittingConcession ? "Applying..." : "Grant Concession"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FEE STRUCTURE MODAL */}
      {showStructureModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 30, 51, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0c1e33" }}>
                Add Class Fee Structure
              </h3>
              <button
                onClick={() => setShowStructureModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStructure} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                  Structure Name *
                </label>
                <input
                  type="text"
                  required
                  value={structureName}
                  onChange={(e) => setStructureName(e.target.value)}
                  placeholder="e.g. Class 10 Standard Annual 2026-27"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e4e6e9",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Class (Digits Only) *
                  </label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        padding: "8px 10px",
                        background: "#f8fafc",
                        border: "1px solid #e4e6e9",
                        borderRight: "none",
                        borderRadius: "6px 0 0 6px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0c1e33",
                      }}
                    >
                      Class
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={structureClassDigit}
                      onChange={(e) => setStructureClassDigit(e.target.value)}
                      placeholder="e.g. 10"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "0 6px 6px 0",
                        border: "1px solid #e4e6e9",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Installments Count
                  </label>
                  <select
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "13px",
                    }}
                  >
                    <option value={1}>1 (Annual)</option>
                    <option value={2}>2 (Bi-annual)</option>
                    <option value={4}>4 (Quarterly)</option>
                    <option value={10}>10 (Monthly)</option>
                    <option value={12}>12 (Full Year Monthly)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Tuition Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={tuitionFee}
                    onChange={(e) => setTuitionFee(e.target.value)}
                    placeholder="e.g. 30000"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Annual / Development Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={developmentFee}
                    onChange={(e) => setDevelopmentFee(e.target.value)}
                    placeholder="e.g. 8000"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Transport Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={transportFee}
                    onChange={(e) => setTransportFee(e.target.value)}
                    placeholder="e.g. 12000"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                    Exam & Lab Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={labFee}
                    onChange={(e) => setLabFee(e.target.value)}
                    placeholder="e.g. 4000"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #e4e6e9",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e4e6e9",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  fontWeight: 750,
                  color: "#0c1e33",
                }}
              >
                <span>Calculated Annual Total:</span>
                <span>
                  ₹
                  {(
                    Number(tuitionFee || 0) +
                    Number(developmentFee || 0) +
                    Number(transportFee || 0) +
                    Number(labFee || 0)
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowStructureModal(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid #e4e6e9",
                    background: "#f8fafc",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStructure}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#0c1e33",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: submittingStructure ? "not-allowed" : "pointer",
                  }}
                >
                  {submittingStructure ? "Creating..." : "Save Fee Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
