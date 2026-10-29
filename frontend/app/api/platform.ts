import { api, ListResult, DashboardSection, OrganizationSummary } from "./client";

// Platform Control Center APIs
export async function getPlatformDashboard() {
  return api<any>("/platform/dashboard");
}
export async function getPlatformSchools(limit = 50, offset = 0) {
  return api<ListResult<any>>(`/platform/organizations?limit=${limit}&offset=${offset}`);
}
export async function getPlatformPlans(limit = 50, offset = 0) {
  return api<ListResult<any>>(`/platform/plans?limit=${limit}&offset=${offset}`);
}
export function createPlatformPlan(plan: any) {
  const { id, name, amountMinor, maxStudents, maxTeachers, features } = plan;
  return api<any>("/platform/plans", {
    method: "POST",
    body: {
      id: id || crypto.randomUUID(),
      name,
      amountMinor: Number(amountMinor),
      maxStudents: Number(maxStudents),
      maxTeachers: Number(maxTeachers),
      features: features || {},
    },
  });
}
export function updatePlanStatus(id: string, active: boolean) { return api<any>(`/platform/plans/${id}/status`, { method: "PATCH", body: { active } }); }
export async function getPlatformFeatures() {
  return api<any[]>("/platform/features");
}
export async function getPlatformFeatureMatrix() {
  return api<{ plans: any[]; features: any[] }>("/platform/feature-matrix");
}
export function updatePlanFeatures(planId: string, features: Record<string, boolean>) { return api<any>(`/platform/plans/${planId}/features`, { method: "PATCH", body: { features } }); }
export function getSchoolBilling(orgId: string) { return api<any>(`/platform/organizations/${orgId}/billing`); }
export function getSchoolDetailedOverrides(orgId: string) { return api<any[]>(`/platform/organizations/${orgId}/detailed-overrides`); }
export function getSchoolRoleFeatureMatrix(orgId: string) { return api<any>(`/platform/organizations/${orgId}/role-feature-matrix`); }
export function getPlatformDashboardNavigation(orgId: string, role: OrganizationSummary["role"]) { return api<DashboardSection[]>(`/platform/organizations/${orgId}/dashboard-navigation/${role}`); }
export function savePlatformDashboardSection(orgId: string, role: OrganizationSummary["role"], key: string, body: {label?: string; sortOrder?: number; enabled?: boolean}) { return api<DashboardSection[]>(`/platform/organizations/${orgId}/dashboard-navigation/${role}/sections/${encodeURIComponent(key)}`, { method: "POST", body }); }
export function savePlatformDashboardItem(orgId: string, role: OrganizationSummary["role"], key: string, body: {label?: string; sectionKey?: string; sortOrder?: number; enabled?: boolean}) { return api<DashboardSection[]>(`/platform/organizations/${orgId}/dashboard-navigation/${role}/items/${encodeURIComponent(key)}`, { method: "PATCH", body }); }
export function updateSchoolRoleFeatureMatrix(orgId: string, payload: { featureKey: string; role?: string | null; enabled: boolean | null; reason?: string }) { return api<any>(`/platform/organizations/${orgId}/role-feature-matrix`, { method: "PATCH", body: payload }); }
export function setSchoolDetailedOverride(orgId: string, override: any) { return api<any>(`/platform/organizations/${orgId}/detailed-overrides`, { method: "POST", body: override }); }
export function removeSchoolDetailedOverride(orgId: string, featureKey: string, role?: string) { return api<any>(`/platform/organizations/${orgId}/detailed-overrides/${featureKey}/remove${role ? `?role=${role}` : ''}`, { method: "PATCH", body: {} }); }
export function onboardSchool(data: any) { return api<any>("/platform/organizations/onboard", { method: "POST", body: data }); }
export function updateSchoolLifecycle(orgId: string, data: any) { return api<any>(`/platform/organizations/${orgId}/lifecycle`, { method: "PATCH", body: data }); }
export function updatePlatformSchool(orgId: string, data: any) { return api<any>(`/platform/organizations/${orgId}`, { method: "PATCH", body: data }); }
export async function getSupportTickets(limit = 50, offset = 0) {
  return api<ListResult<any>>(`/platform/support/tickets?limit=${limit}&offset=${offset}`);
}
export function createSupportTicket(data: any) { return api<any>("/platform/support/tickets", { method: "POST", body: data }); }
export function createSchoolSupportTicket(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/billing/tickets`, { method: "POST", body: data }); }
export function getSchoolSupportTickets(orgId: string) { return api<any[]>(`/organizations/${orgId}/billing/tickets`); }
export function updateSupportTicketStatus(id: string, data: any) { return api<any>(`/platform/support/tickets/${id}/status`, { method: "PATCH", body: data }); }
export function startSupportSession(data: any) { return api<any>("/platform/support/sessions", { method: "POST", body: data }); }
export async function getAnnouncements() {
  return api<any[]>("/platform/announcements");
}
export function createAnnouncement(data: any) { return api<any>("/platform/announcements", { method: "POST", body: data }); }
export async function getPayments(limit = 50, offset = 0) {
  return api<ListResult<any>>(`/platform/payments?limit=${limit}&offset=${offset}`);
}
export function recordPayment(data: any) { return api<any>("/platform/payments", { method: "POST", body: data }); }
export function refundPayment(id: string, reason: string) { return api<any>(`/platform/payments/${id}/refund`, { method: "POST", body: { reason } }); }
export function globalSearch(q: string) { return api<{ results: any[] }>(`/platform/search?q=${encodeURIComponent(q)}`); }

export async function getDetailedHealth() { return api<any>("/platform/health-detailed"); }
export async function getPlatformStaff() { return api<any>("/platform/staff"); }
export async function getAuditLogs(limit = 50, offset = 0) { return api<ListResult<any>>(`/platform/audit-logs?limit=${limit}&offset=${offset}`); }
