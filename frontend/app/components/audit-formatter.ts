/**
 * Human-readable formatter for audit trail events across School Admin,
 * Principal, and Platform Admin dashboards.
 * Replaces raw JSON (e.g. {"invitationId":"..."}) and technical IDs with plain English.
 */

export function formatAuditAction(action?: string): string {
  if (!action) return "Administrative Action";
  const act = action.toLowerCase().trim();

  if (act.includes("invitation.accepted") || act.includes("invitation accepted")) return "Invitation Accepted";
  if (act.includes("invitations.created") || act.includes("invitations created")) return "Invitations Issued";
  if (act.includes("invitation.revoked") || act.includes("invitation revoked")) return "Invitation Revoked";
  if (act.includes("school.onboarded_complete") || act.includes("school onboarded_complete")) return "School Onboarded";
  if (act.includes("organization.created")) return "School Registered";
  if (act.includes("organization.updated")) return "Profile Updated";
  if (act.includes("organization.status_changed")) return "Status Changed";
  if (act.includes("auth.login") || act === "login") return "User Login";
  if (act.includes("auth.logout") || act === "logout") return "User Logout";
  if (act.includes("password_reset")) return "Password Reset";
  if (act.includes("year")) return "Academic Year";
  if (act.includes("program") || act.includes("class")) return "Class Program";
  if (act.includes("section")) return "Section Setup";
  if (act.includes("subject")) return "Curriculum Subject";
  if (act.includes("teacher_assigned") || act.includes("teacherassignment")) return "Faculty Assigned";
  if (act.includes("enrollment")) return "Student Enrolled";
  if (act.includes("department")) return "Department Setup";
  if (act.includes("timetable")) return "Timetable Schedule";
  if (act.includes("attendance")) return "Attendance Register";
  if (act.includes("assignment")) return "Class Assignment";
  if (act.includes("submission")) return "Student Submission";
  if (act.includes("fee")) return "Fee & Finance";
  if (act.includes("ticket")) return "Support Ticket";
  if (act.includes("announcement")) return "Broadcast";
  if (act.includes("leave")) return "Staff Leave";

  return act.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatAuditMessage(action?: string, details?: any, actor?: string): string {
  const act = (action || "").toLowerCase().trim();
  let d: any = details;

  if (typeof d === "string") {
    try {
      d = JSON.parse(d);
    } catch {
      // If it's already a clean human-readable string (not JSON)
      if (!d.startsWith("{") && !d.startsWith("[")) return d;
      d = {};
    }
  }

  // 1. Invitations & Onboarding
  if (act.includes("invitation.accepted") || act.includes("invitation accepted")) {
    return actor ? `${actor} accepted onboarding invitation` : "Accepted campus onboarding invitation";
  }
  if (act.includes("invitations.created") || act.includes("invitations created")) {
    const count = d?.count || 1;
    return `Issued ${count} member onboarding invitation${count > 1 ? "s" : ""}`;
  }
  if (act.includes("invitation.revoked") || act.includes("invitation revoked")) {
    return "Revoked pending onboarding invitation";
  }
  if (act.includes("school.onboarded_complete") || act.includes("school onboarded_complete")) {
    return d?.slug ? `Completed school onboarding for ${d.slug}` : "Completed school setup and onboarding";
  }
  if (act.includes("organization.created")) {
    return "Campus organization record created";
  }
  if (act.includes("organization.updated")) {
    return "Updated school profile and regional configuration";
  }
  if (act.includes("organization.status_changed")) {
    return d?.after ? `Campus status updated to ${d.after}` : "School operational status changed";
  }

  // 2. Authentication & Account
  if (act.includes("auth.login") || act === "login") {
    return "Signed in to campus management portal";
  }
  if (act.includes("auth.logout") || act === "logout") {
    return "Signed out of portal session";
  }
  if (act.includes("password_reset") || act.includes("forgot_password")) {
    return "Account password reset completed";
  }

  // 3. Academics & Structure
  if (act.includes("year") || act.includes("academic_year")) {
    return d?.name ? `Configured Academic Year (${d.name})` : "Configured academic year calendar";
  }
  if (act.includes("program") || act.includes("class")) {
    return d?.name ? `Created academic class (${d.name})` : "Created academic class curriculum";
  }
  if (act.includes("section")) {
    return d?.name ? `Added classroom section ${d.name}` : "Created classroom section";
  }
  if (act.includes("subject")) {
    return d?.name || d?.code ? `Added subject: ${d.name || d.code}` : "Added curriculum subject";
  }
  if (act.includes("teacher_assigned") || act.includes("teacherassignment")) {
    return "Assigned faculty teacher to subject section";
  }
  if (act.includes("enrollment")) {
    return "Enrolled student into academic section";
  }
  if (act.includes("department.created")) {
    return d?.name ? `Created department: ${d.name}` : "Created academic department";
  }
  if (act.includes("timetable")) {
    if (act.includes("deleted")) return "Deleted timetable period allocation";
    if (act.includes("updated")) return "Updated master timetable period";
    return "Scheduled new timetable period";
  }

  // 4. Attendance & Classroom
  if (act.includes("attendance.finalized")) {
    return "Finalized and locked daily attendance register";
  }
  if (act.includes("attendance.marked") || act.includes("attendance.created")) {
    return "Marked period attendance register";
  }
  if (act.includes("assignment.published")) {
    return "Published coursework assignment to students";
  }
  if (act.includes("assignment.created")) {
    return "Created new class assignment";
  }
  if (act.includes("submission.graded")) {
    return "Graded student assessment submission";
  }
  if (act.includes("submission.submitted")) {
    return "Student submitted classwork assignment";
  }

  // 5. Finance & Billing
  if (act.includes("fee_structure") || act.includes("fee.structure")) {
    return "Configured institutional fee schedule";
  }
  if (act.includes("fee.payment") || act.includes("payment.recorded")) {
    return d?.amountMinor ? `Recorded tuition payment receipt of ₹${(d.amountMinor / 100).toLocaleString()}` : "Recorded student fee payment receipt";
  }
  if (act.includes("concession")) {
    return "Granted student fee concession / waiver";
  }
  if (act.includes("payment.refunded")) {
    return "Processed payment refund";
  }
  if (act.includes("plan.")) {
    return "Updated subscription plan tier";
  }

  // 6. Platform & Support
  if (act.includes("ticket.created")) {
    return d?.ticketCode ? `Opened support ticket #${d.ticketCode}` : "Submitted support ticket";
  }
  if (act.includes("ticket.status_changed")) {
    return d?.after ? `Support ticket marked as ${d.after}` : "Updated support ticket status";
  }
  if (act.includes("announcement.created")) {
    return d?.title ? `Published announcement: "${d.title}"` : "Published broadcast announcement";
  }
  if (act.includes("support.session_started")) {
    return "Initiated remote support session";
  }
  if (act.includes("leave.requested")) {
    return "Submitted staff leave application";
  }

  // Fallback to formatted title
  return formatAuditAction(action);
}

export function formatAuditBadge(action?: string): string {
  const act = (action || "").toLowerCase();
  if (act.includes("auth") || act.includes("login") || act.includes("logout") || act.includes("password")) return "Security";
  if (act.includes("invitation") || act.includes("onboard") || act.includes("member") || act.includes("enroll")) return "Roster";
  if (act.includes("attendance") || act.includes("assignment") || act.includes("submission") || act.includes("subject") || act.includes("class") || act.includes("year") || act.includes("timetable")) return "Academics";
  if (act.includes("fee") || act.includes("payment") || act.includes("billing") || act.includes("plan")) return "Finance";
  if (act.includes("ticket") || act.includes("support")) return "Support";
  return "Admin";
}
