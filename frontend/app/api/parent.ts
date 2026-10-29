import { api } from "./client";
import { loadRoleWorkspace } from "./auth";

// Parent Workspace APIs (Scoping verified children)
export function getParentDashboard(orgId: string) { return loadRoleWorkspace(orgId); }

export function getParentChildDetails(orgId: string, studentId: string) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}`); }
export function createParentLeave(orgId: string, studentId: string, body: unknown) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}/leaves`, { method:'POST',body }); }
export function createParentQuery(orgId: string, studentId: string, body: unknown) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}/queries`, { method:'POST',body }); }
export function bookParentPtm(orgId: string, studentId: string, body: unknown) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}/bookings`, { method:'POST',body }); }
export function cancelParentPtm(orgId: string, studentId: string, id: string) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}/bookings/${id}`, { method:'DELETE' }); }
