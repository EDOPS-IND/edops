"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { School, Plan } from "./types";

export function SupportSessionModal({
  school,
  onClose,
  onConfirm,
  busy
}: {
  school: School;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#FFF", borderRadius: "10px", padding: "24px", maxWidth: "500px", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Start Audited Support Session</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: "12.5px", color: "#4B5563", marginTop: 0 }}>
          You are starting a temporary, read/diagnostics support session for <b>{school.name}</b>.
        </p>
        <div style={{ background: "#FEF3C7", padding: "10px", borderRadius: "6px", fontSize: "11.5px", color: "#92400E", marginBottom: "14px" }}>
          ⚠️ Password is never exposed. A 60-minute scoped session token will be generated. All actions taken are permanently tagged with your Platform Admin actor identity.
        </div>
        <label style={{ fontSize: "12px", fontWeight: 600 }}>Support Reason *</label>
        <input
          type="text"
          placeholder="e.g. Investigating grade calculation discrepancy"
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px", marginBottom: "16px" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} style={{ padding: "8px 14px", background: "#F3F4F6", border: "none", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={busy} style={{ padding: "8px 18px", background: "#D97706", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>
            Confirm & Begin Session
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreatePlanModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (plan: any) => void;
}) {
  const [newPlan, setNewPlan] = useState({
    id: "", name: "", amountMinor: 5000000, maxStudents: 1000, maxTeachers: 70, maxParents: 2000, maxStorageGb: 100, maxApiRequests: 500000,
    features: {}
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#FFF", borderRadius: "10px", padding: "24px", maxWidth: "550px", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Create New Plan Tier</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12.5px" }}>
          <div>
            <label style={{ fontWeight: 600 }}>Plan Name *</label>
            <input
              type="text"
              placeholder="e.g. Premium Plus"
              value={newPlan.name}
              onChange={e => setNewPlan({ ...newPlan, name: e.target.value, id: crypto.randomUUID() })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Monthly Price (₹) *</label>
            <input
              type="number"
              placeholder="e.g. 75000"
              value={newPlan.amountMinor / 100}
              onChange={e => setNewPlan({ ...newPlan, amountMinor: Number(e.target.value) * 100 })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Max Students</label>
            <input
              type="number"
              value={newPlan.maxStudents}
              onChange={e => setNewPlan({ ...newPlan, maxStudents: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Max Teachers</label>
            <input
              type="number"
              value={newPlan.maxTeachers}
              onChange={e => setNewPlan({ ...newPlan, maxTeachers: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <button onClick={onClose} style={{ padding: "8px 14px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => {
              const planId = newPlan.id || crypto.randomUUID();
              onCreate({ ...newPlan, id: planId, currency: "INR", billingCycle: "monthly" });
            }}
            style={{ padding: "8px 18px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
          >
            Create Plan Tier
          </button>
        </div>
      </div>
    </div>
  );
}

export function BroadcastAnnouncementModal({
  onClose,
  onSend
}: {
  onClose: () => void;
  onSend: (announcement: any) => void;
}) {
  const [announcement, setAnnouncement] = useState({
    title: "", message: "", type: "general", priority: "normal", audience: "all"
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#FFF", borderRadius: "10px", padding: "24px", maxWidth: "500px", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Broadcast Platform Announcement</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gap: "12px", fontSize: "12.5px" }}>
          <div>
            <label style={{ fontWeight: 600 }}>Title *</label>
            <input
              type="text"
              placeholder="e.g. Scheduled Maintenance"
              value={announcement.title}
              onChange={e => setAnnouncement({ ...announcement, title: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Message Body *</label>
            <textarea
              rows={3}
              placeholder="Enter message details for school dashboards..."
              value={announcement.message}
              onChange={e => setAnnouncement({ ...announcement, message: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Target Audience</label>
            <select
              value={announcement.audience}
              onChange={e => setAnnouncement({ ...announcement, audience: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            >
              <option value="all">All Schools</option>
              <option value="active">Active Schools Only</option>
              <option value="trial">Trial Schools Only</option>
              <option value="enterprise">Enterprise Tier Only</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <button onClick={onClose} style={{ padding: "8px 14px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => onSend(announcement)}
            style={{ padding: "8px 18px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
          >
            Send Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateTicketModal({
  schools,
  onClose,
  onSubmit
}: {
  schools: School[];
  onClose: () => void;
  onSubmit: (ticket: any) => void;
}) {
  const [ticket, setTicket] = useState({
    schoolName: schools[0]?.name || "Delhi Public XYZ", category: "academic", priority: "medium", subject: "", description: ""
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#FFF", borderRadius: "10px", padding: "24px", maxWidth: "500px", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Create Support Ticket</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gap: "12px", fontSize: "12.5px" }}>
          <div>
            <label style={{ fontWeight: 600 }}>School *</label>
            <select
              value={ticket.schoolName}
              onChange={e => setTicket({ ...ticket, schoolName: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            >
              {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Subject *</label>
            <input
              type="text"
              placeholder="Brief summary of request or issue"
              value={ticket.subject}
              onChange={e => setTicket({ ...ticket, subject: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Description *</label>
            <textarea
              rows={3}
              placeholder="Detailed information..."
              value={ticket.description}
              onChange={e => setTicket({ ...ticket, description: e.target.value })}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <button onClick={onClose} style={{ padding: "8px 14px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => onSubmit(ticket)}
            style={{ padding: "8px 18px", background: "#064E3B", color: "#F8E7C9", border: "1px solid #064E3B", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
          >
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
