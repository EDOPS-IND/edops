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
    name: "",
    amountMinor: 5000000,
    maxStudents: 1000,
    maxTeachers: 70,
    features: {},
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
              onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
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
              if (!newPlan.name.trim()) return;
              onCreate({
                id: crypto.randomUUID(),
                name: newPlan.name.trim(),
                amountMinor: Math.max(0, Math.round(Number(newPlan.amountMinor) || 0)),
                maxStudents: Math.max(1, Math.min(100000, Math.round(Number(newPlan.maxStudents) || 1))),
                maxTeachers: Math.max(1, Math.min(10000, Math.round(Number(newPlan.maxTeachers) || 1))),
                features: newPlan.features || {},
              });
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
  onSubmit,
  defaultSchoolId,
  readOnlySchool,
}: {
  schools: School[];
  onClose: () => void;
  onSubmit: (ticket: any) => Promise<void> | void;
  defaultSchoolId?: string;
  readOnlySchool?: boolean;
}) {
  const initialOrgId = defaultSchoolId || schools[0]?.id || "";
  const initialSchoolName = schools.find(s => s.id === initialOrgId)?.name || schools[0]?.name || "Platform Support";

  const [ticket, setTicket] = useState({
    organizationId: initialOrgId,
    schoolName: initialSchoolName,
    category: "academic",
    priority: "medium",
    subject: "",
    description: ""
  });
  const [validationError, setValidationError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!ticket.subject.trim()) {
      setValidationError("Subject is required.");
      return;
    }
    if (!ticket.description.trim()) {
      setValidationError("Description is required.");
      return;
    }
    setValidationError("");
    setBusy(true);
    try {
      await onSubmit({
        ...ticket,
        organizationId: ticket.organizationId ? ticket.organizationId : undefined,
        schoolName: ticket.schoolName || (schools.find(s => s.id === ticket.organizationId)?.name) || "Platform Support",
      });
    } catch (err: any) {
      setValidationError(err?.message || "Failed to submit ticket");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#FFF", borderRadius: "10px", padding: "24px", maxWidth: "500px", width: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#064E3B" }}>Create Support Ticket</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {validationError && (
          <div style={{ padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", color: "#991B1B", fontSize: "12px", marginBottom: "12px" }}>
            {validationError}
          </div>
        )}
        <div style={{ display: "grid", gap: "12px", fontSize: "12.5px" }}>
          <div>
            <label style={{ fontWeight: 600 }}>School *</label>
            {readOnlySchool || schools.length <= 1 ? (
              <div style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px", background: "#F9FAFB", fontWeight: 600, color: "#1F2937" }}>
                {ticket.schoolName}
              </div>
            ) : (
              <select
                value={ticket.organizationId}
                onChange={e => {
                  const s = schools.find(sch => sch.id === e.target.value);
                  setTicket({
                    ...ticket,
                    organizationId: e.target.value,
                    schoolName: s?.name || e.target.value,
                  });
                }}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
              >
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontWeight: 600 }}>Category</label>
              <select
                value={ticket.category}
                onChange={e => setTicket({ ...ticket, category: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
              >
                <option value="academic">Academic & Classes</option>
                <option value="technical">Technical & System</option>
                <option value="billing">Billing & Plan</option>
                <option value="feature_request">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="other">General Query</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Priority</label>
              <select
                value={ticket.priority}
                onChange={e => setTicket({ ...ticket, priority: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Subject *</label>
            <input
              type="text"
              required
              placeholder="Brief summary of request or issue"
              value={ticket.subject}
              onChange={e => { setTicket({ ...ticket, subject: e.target.value }); setValidationError(""); }}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Description *</label>
            <textarea
              rows={4}
              required
              placeholder="Detailed information..."
              value={ticket.description}
              onChange={e => { setTicket({ ...ticket, description: e.target.value }); setValidationError(""); }}
              style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #D1D5DB", marginTop: "4px" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          <button onClick={onClose} style={{ padding: "8px 14px", background: "#F8E7C9", color: "#064E3B", border: "1px solid #E5CCA2", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{
              padding: "8px 18px",
              background: "#064E3B",
              color: "#F8E7C9",
              border: "1px solid #064E3B",
              borderRadius: "6px",
              fontWeight: 700,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
