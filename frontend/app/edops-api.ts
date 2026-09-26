export type OrganizationSummary = { id: string; name: string; slug: string; status: "active" | "suspended"; role: "school_admin" | "teacher" | "student" | "parent" };
export type Profile = { user: { id: string; email: string; isPlatformAdmin: boolean }; organizations: OrganizationSummary[]; csrfToken?: string };
export type Organization = OrganizationSummary & { timeZone: string; locale: "en-IN" | "hi-IN" | "en-US"; createdAt: string; updatedAt: string };
export type ListResult<T> = { items: T[]; total: number; limit: number; offset: number };
export type AcademicYear = { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; createdAt: string };
export type Program = { id: string; name: string; sequenceOrder: number; createdAt: string };
export type Subject = { id: string; name: string; code: string; createdAt: string };
export type Section = { id: string; academicYearId: string; programId: string; name: string; capacity: number; createdAt: string };
export type Member = { userId: string; email: string; role: "teacher" | "student"; status: "active" | "inactive"; accountActive: boolean };
export type Enrollment = { id: string; studentUserId: string; sectionId: string; academicYearId: string; rollNumber: string; status: "active" | "transferred" | "withdrawn"; createdAt: string };
export type Assignment = { id: string; sectionId: string; subjectId: string; teacherUserId: string; createdAt: string };
export type TeacherWorkspaceData = { role: "teacher"; assignments: { id: string; sectionId: string; sectionName: string; subjectId: string; subjectName: string; subjectCode: string }[]; students: { studentUserId: string; email: string; sectionId: string; sectionName: string; rollNumber: string }[] };
export type StudentWorkspaceData = { role: "student"; enrollment: null | { id: string; sectionId: string; sectionName: string; rollNumber: string; programName: string; academicYearName: string }; subjects: { subjectId: string; subjectName: string; subjectCode: string; teacherUserId: string; teacherEmail: string }[] };
export type RoleWorkspaceData = TeacherWorkspaceData | StudentWorkspaceData;
export type InvitationBatch = { id: string; organizationId: string; count: number; createdAt: string };
export type SchoolData = { organization: Organization; years: ListResult<AcademicYear>; programs: ListResult<Program>; subjects: ListResult<Subject>; sections: ListResult<Section>; members: ListResult<Member>; enrollments: ListResult<Enrollment>; assignments: ListResult<Assignment>; batches: ListResult<InvitationBatch> };

let csrfToken: string | undefined;

function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_EDOPS_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? `${window.location.protocol}//${window.location.hostname}:3001/api/v1` : `${window.location.origin}/api/v1`;
}

export async function api<T>(path: string, options: { method?: "GET" | "POST" | "PATCH"; body?: unknown; idempotent?: boolean } = {}): Promise<T> {
  const method = options.method ?? "GET";
  if (method !== "GET" && !csrfToken) await csrf();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-CSRF-Token"] = csrfToken ?? "";
  if (options.idempotent) headers["Idempotency-Key"] = crypto.randomUUID();
  const response = await fetch(`${baseUrl()}${path}`, { method, credentials: "include", headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join("; ") : data?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }
  if (data?.csrfToken) csrfToken = data.csrfToken;
  if (path === "/auth/logout") csrfToken = undefined;
  return data as T;
}

export async function csrf() { const result = await api<{ csrfToken: string }>("/auth/csrf"); csrfToken = result.csrfToken; return result; }
export async function login(email: string, password: string) { await csrf(); return api<Profile>("/auth/login", { method: "POST", body: { email, password } }); }
export function logout() { return api<null>("/auth/logout", { method: "POST" }); }
export function profile() { return api<Profile>("/auth/me"); }
export function loadRoleWorkspace(organizationId: string) { return api<RoleWorkspaceData>(`/organizations/${organizationId}/academics/my-workspace`); }

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
