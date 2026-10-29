import { api, invalidateApiCache, Profile, OrganizationSummary, DashboardSection, RoleWorkspaceData, SchoolData, Organization, ListResult, AcademicYear, Program, Subject, Section, Member, Enrollment, Assignment, InvitationBatch, jwtRefreshToken, clearAuthTokens } from "./client";

export function login(email: string, password: string) { return api<Profile & { accessToken?: string; refreshToken?: string }>("/auth/login", { method: "POST", body: { email: email.trim().toLowerCase(), password } }); }
export function forgotPassword(email: string) { return api<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email: email.trim().toLowerCase() } }); }
export function verifyResetToken(token: string) { return api<{ valid: boolean; email: string }>(`/auth/reset-password/verify?token=${encodeURIComponent(token.trim())}`); }
export function resetPassword(token: string, password: string) { return api<{ message: string }>("/auth/reset-password", { method: "POST", body: { token: token.trim(), password } }); }
export function logout(): Promise<null> {
  invalidateApiCache();
  const currentRefreshToken = jwtRefreshToken;
  clearAuthTokens();
  return api<null>("/auth/logout", {
    method: "POST",
    body: currentRefreshToken ? { refreshToken: currentRefreshToken } : undefined,
  }).catch(() => null);
}
export function getStudentAvatarUrl(name?: string, email?: string): string {
  const seed = (name || email || "Student").trim();
  return `https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ebedf2`;
}
export function switchSchool(schoolId: string) {
  invalidateApiCache();
  return api<{ accessToken: string; activeSchoolId: string; role?: string }>("/auth/switch-school", { method: "POST", body: { schoolId } });
}
export type InvitationInfo = {
  email: string;
  name?: string;
  phone?: string;
  specialty?: string;
  role: "school_admin" | "principal" | "teacher" | "student" | "parent";
  schoolName: string;
  schoolSlug: string;
};
export function getInvitationInfo(token: string): Promise<InvitationInfo> {
  return api<InvitationInfo>(`/auth/invitations/info?token=${encodeURIComponent(token)}`);
}
export function profile() { return api<Profile>("/auth/me"); }
export function getDashboardNavigation(orgId: string, role: OrganizationSummary["role"]) { return api<DashboardSection[]>(`/organizations/${orgId}/dashboard-navigation/${role}`); }
export function loadRoleWorkspace(organizationId: string): Promise<RoleWorkspaceData> { return api<RoleWorkspaceData>(`/organizations/${organizationId}/academics/my-workspace`); }



export async function loadSchool(organizationId: string): Promise<SchoolData> {
  const root = `/organizations/${organizationId}`;
  const academics = `${root}/academics`;
const [organization, years, programs, subjects, sections, members, enrollments, assignments, batches] = await Promise.all([
      api<Organization>(root), api<ListResult<AcademicYear>>(`${academics}/years?limit=100`), api<ListResult<Program>>(`${academics}/programs?limit=100`),
      api<ListResult<Subject>>(`${academics}/subjects?limit=100`), api<ListResult<Section>>(`${academics}/sections?limit=100`), api<ListResult<Member>>(`${root}/members?limit=100`),
      api<ListResult<Enrollment>>(`${academics}/enrollments?limit=100`), api<ListResult<Assignment>>(`${academics}/teacher-assignments?limit=100`), api<ListResult<InvitationBatch>>(`${root}/invitation-batches?limit=100`),
    ]);
if (!organization || typeof organization.name !== "string") throw new Error("The school profile response is incomplete. Please refresh and try again.");
return { organization, years, programs, subjects, sections, members, enrollments, assignments, batches };
}

export function createResource<T>(path: string, body: unknown, idempotent = true) { return api<T>(path, { method: "POST", body, idempotent }); }
export function updateResource<T>(path: string, body: unknown) { return api<T>(path, { method: "PATCH", body }); }
export function deleteResource<T>(path: string) { return api<T>(path, { method: "DELETE" }); }


