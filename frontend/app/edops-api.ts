export type OrganizationSummary = { id: string; name: string; slug: string; status: "active" | "suspended"; role: "school_admin" | "principal" | "teacher" | "student" | "parent"; features?: string[]; [key: string]: any };
export type DashboardItem = { key: string; sectionKey?: string; label: string; featureKey?: string; sortOrder: number; enabled?: boolean; effectiveEnabled?: boolean; [key: string]: any };
export type DashboardSection = { key: string; label: string; sortOrder: number; enabled?: boolean; items: DashboardItem[]; [key: string]: any };
export type Profile = { user: { id: string; email: string; name?: string; phone?: string | null; isPlatformAdmin: boolean }; organizations: OrganizationSummary[]; csrfToken?: string };
export type Organization = Partial<OrganizationSummary> & { id: string; name: string; slug: string; status: "active" | "suspended"; timeZone?: string; locale?: "en-IN" | "hi-IN" | "en-US"; createdAt?: string; updatedAt?: string; countryCode?: string; [key: string]: any };
export type ListResult<T> = { items: T[]; total: number; limit?: number; offset?: number; [key: string]: any };
export type AcademicYear = { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; createdAt?: string; organizationId?: string; [key: string]: any };
export type Program = { id: string; name: string; sequenceOrder: number; createdAt?: string; organizationId?: string; [key: string]: any };
export type Subject = { id: string; name: string; code: string; createdAt?: string; organizationId?: string; [key: string]: any };
export type Section = { id: string; academicYearId?: string; programId: string; name: string; capacity: number; createdAt?: string; organizationId?: string; [key: string]: any };
export type Member = { userId: string; email: string; role: string; status: "active" | "inactive"; accountActive?: boolean; id?: string; createdAt?: string; [key: string]: any };
export type Enrollment = { id: string; studentUserId: string; sectionId: string; academicYearId?: string; rollNumber: string; status: "active" | "transferred" | "withdrawn"; createdAt?: string; organizationId?: string; [key: string]: any };
export type Assignment = { id: string; sectionId: string; subjectId: string; teacherUserId: string; createdAt?: string; organizationId?: string; [key: string]: any };
export type ParentChild = {
  studentUserId: string;
  name: string;
  email: string;
  rollNumber: string;
  sectionName: string;
  programName: string;
  attendancePct: number;
  todayAttendance: string;
};
export type TeacherWorkspaceData = { role: "teacher"; assignments: { id: string; sectionId: string; sectionName: string; subjectId: string; subjectName: string; subjectCode: string }[]; students: { studentUserId: string; email: string; sectionId: string; sectionName: string; rollNumber: string }[] };
export type StudentWorkspaceData = { role: "student"; enrollment: null | { id: string; sectionId: string; sectionName: string; rollNumber: string; programName: string; academicYearName: string }; subjects: { subjectId: string; subjectName: string; subjectCode: string; teacherUserId: string; teacherEmail: string }[] };
export type ParentWorkspaceData = { role: "parent"; children: ParentChild[]; messages: { id: string; subject?: string; body?: string; sender_name?: string; created_at?: string }[] };
export type RoleWorkspaceData = TeacherWorkspaceData | StudentWorkspaceData | ParentWorkspaceData;
export type InvitationBatch = { id: string; organizationId: string; count?: number; totalCount?: number; acceptedCount?: number; name?: string; status?: string; createdAt: string; [key: string]: any };
export type SchoolData = { organization: Organization; years: ListResult<AcademicYear>; programs: ListResult<Program>; subjects: ListResult<Subject>; sections: ListResult<Section>; members: ListResult<Member>; enrollments: ListResult<Enrollment>; assignments: ListResult<Assignment>; batches: ListResult<InvitationBatch> };

let jwtAccessToken: string | undefined;
let jwtRefreshToken: string | undefined;

if (typeof window !== "undefined") {
  jwtAccessToken = localStorage.getItem("edops_jwt_token") || undefined;
  jwtRefreshToken = localStorage.getItem("edops_refresh_token") || undefined;
}

function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_EDOPS_API_URL?.replace(/\/$/, "");
  if (configured) return configured.replace(/\/ap1(\/|$)/, "/api$1");
  if (typeof window !== "undefined") {
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return `${window.location.origin}/api/v1`;
    }
    return `${window.location.protocol}//${window.location.hostname}:3001/api/v1`;
  }
  return "http://127.0.0.1:3001/api/v1";
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function request<T>(path: string, options: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown; idempotent?: boolean } = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined" && window.location.hostname.includes("ngrok")) {
    headers["ngrok-skip-browser-warning"] = "true";
  }
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (jwtAccessToken) headers["Authorization"] = `Bearer ${jwtAccessToken}`;
  const shouldBeIdempotent = options.idempotent ?? (method === "POST" && !path.startsWith("/auth/"));
  if (shouldBeIdempotent) headers["Idempotency-Key"] = generateUUID();
  let response = await fetch(`${baseUrl()}${path}`, { method, credentials: "include", headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  
  // Silent auto-refresh on 401 when using JWT
  if (response.status === 401 && (jwtAccessToken || jwtRefreshToken) && path !== "/auth/refresh" && path !== "/auth/login") {
    try {
      const refreshRes = await fetch(`${baseUrl()}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ refreshToken: jwtRefreshToken }),
      });
      if (refreshRes.ok) {
        const refreshText = await refreshRes.text();
        const refreshData = refreshText ? JSON.parse(refreshText) : null;
        if (refreshData?.accessToken) {
          jwtAccessToken = refreshData.accessToken;
          if (refreshData.refreshToken) jwtRefreshToken = refreshData.refreshToken;
          if (typeof window !== "undefined") {
            localStorage.setItem("edops_jwt_token", refreshData.accessToken);
            if (refreshData.refreshToken) localStorage.setItem("edops_refresh_token", refreshData.refreshToken);
          }
          headers["Authorization"] = `Bearer ${jwtAccessToken}`;
          response = await fetch(`${baseUrl()}${path}`, { method, credentials: "include", headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
        }
      }
    } catch {
      // Refresh failed, proceed to error
    }
  }

  if (path === "/auth/logout") {
    jwtAccessToken = undefined;
    jwtRefreshToken = undefined;
    if (typeof window !== "undefined") {
      localStorage.removeItem("edops_jwt_token");
      localStorage.removeItem("edops_refresh_token");
    }
    return null as T;
  }

  let data: any = null;
  if (response.status !== 204) {
    const rawText = await response.text();
    if (rawText && rawText.trim().length > 0) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { message: rawText };
      }
    }
  }
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join("; ") : data?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }
  if (data?.accessToken) {
    jwtAccessToken = data.accessToken;
    if (typeof window !== "undefined") localStorage.setItem("edops_jwt_token", data.accessToken);
  }
  if (data?.refreshToken) {
    jwtRefreshToken = data.refreshToken;
    if (typeof window !== "undefined") localStorage.setItem("edops_refresh_token", data.refreshToken);
  }
  return data as T;
}

export async function api<T>(path: string, options: Parameters<typeof request>[1] = {}): Promise<T> {
  try { return await request<T>(path, options); }
  catch (error) {
    if (typeof window !== 'undefined' && !path.startsWith('/auth/')) {
      window.dispatchEvent(new CustomEvent('edops:request-error', { detail: { message:error instanceof Error?error.message:'Request failed', mutation:!!options.method && options.method!=='GET' } }));
    }
    throw error;
  }
}

export function login(email: string, password: string) { return api<Profile & { accessToken?: string; refreshToken?: string }>("/auth/login", { method: "POST", body: { email: email.trim().toLowerCase(), password } }); }
export function forgotPassword(email: string) { return api<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email: email.trim().toLowerCase() } }); }
export function verifyResetToken(token: string) { return api<{ valid: boolean; email: string }>(`/auth/reset-password/verify?token=${encodeURIComponent(token.trim())}`); }
export function resetPassword(token: string, password: string) { return api<{ message: string }>("/auth/reset-password", { method: "POST", body: { token: token.trim(), password } }); }
export function logout(): Promise<null> {
  const currentRefreshToken = jwtRefreshToken;
  jwtAccessToken = undefined;
  jwtRefreshToken = undefined;
  if (typeof window !== "undefined") {
    localStorage.removeItem("edops_jwt_token");
    localStorage.removeItem("edops_refresh_token");
  }
  return api<null>("/auth/logout", {
    method: "POST",
    body: currentRefreshToken ? { refreshToken: currentRefreshToken } : undefined,
  }).catch(() => null);
}
export function getStudentAvatarUrl(name?: string, email?: string): string {
  const seed = (name || email || "Student").trim();
  return `https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(seed)}&backgroundColor=ebedf2`;
}
export function switchSchool(schoolId: string) { return api<{ accessToken: string; activeSchoolId: string; role?: string }>("/auth/switch-school", { method: "POST", body: { schoolId } }); }
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
export function createPlatformPlan(plan: any) { return api<any>("/platform/plans", { method: "POST", body: plan }); }
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
export async function getSupportTickets(limit = 50, offset = 0) {
  return api<ListResult<any>>(`/platform/support/tickets?limit=${limit}&offset=${offset}`);
}
export function createSupportTicket(data: any) { return api<any>("/platform/support/tickets", { method: "POST", body: data }); }
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

// School Admin Control Center APIs
export async function getSchoolAdminDashboard(orgId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/dashboard`);
}

export async function getSchoolAdminStudents(
  orgId: string,
  params?: { limit?: number; offset?: number; search?: string; sectionId?: string },
) {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.search) q.set("search", params.search);
  if (params?.sectionId) q.set("sectionId", params.sectionId);
  const qs = q.toString() ? `?${q.toString()}` : "";
  const res = await api<any>(`/organizations/${orgId}/school-admin/people/students${qs}`);
  const items = Array.isArray(res) ? res : res?.items || [];
  if (res && typeof res === "object" && !Array.isArray(res)) {
    (items as any).total = res.total;
    (items as any).limit = res.limit;
    (items as any).offset = res.offset;
  }
  return items;
}

export async function getSchoolAdminStudent360(orgId: string, studentId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/people/students/${studentId}/360`);
}

export async function directAdmitStudent(
  orgId: string,
  payload: { name: string; email: string; phone?: string; sectionId?: string; admissionNo?: string; rollNo?: string; gender?: string; dob?: string }
) {
  return api<{ success: boolean; studentId: string; admissionNo: string; rollNo?: string; inviteStatus: string }>(
    `/organizations/${orgId}/school-admin/people/students/direct`,
    { method: "POST", body: payload }
  );
}

export async function getStudentProfile(orgId: string) {
  return api<any>(`/organizations/${orgId}/student/profile`);
}

export async function updateStudentProfile(orgId: string, body: any) {
  return api<any>(`/organizations/${orgId}/student/profile`, { method: "PATCH", body });
}

export async function sendStudentInvite(orgId: string, studentId: string) {
  return api<{ success: boolean; invitationId: string; token: string; expiresAt: string; inviteStatus: string }>(
    `/organizations/${orgId}/school-admin/people/students/${studentId}/send-invite`,
    { method: "POST" }
  );
}

export async function getSchoolAdminTeachers(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/school-admin/people/teachers`);
}

export async function getSchoolAdminStaff(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/school-admin/people/staff`);
}

export async function getSchoolAdminParents(
  orgId: string,
  params?: { limit?: number; offset?: number; search?: string },
) {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.search) q.set("search", params.search);
  const qs = q.toString() ? `?${q.toString()}` : "";
  const res = await api<any>(`/organizations/${orgId}/school-admin/people/parents${qs}`);
  const items = Array.isArray(res) ? res : res?.items || [];
  if (res && typeof res === "object" && !Array.isArray(res)) {
    (items as any).total = res.total;
    (items as any).limit = res.limit;
    (items as any).offset = res.offset;
  }
  return items;
}

export async function updateParentChildren(orgId: string, parentId: string, studentUserIds: string[]) {
  return api<any>(`/organizations/${orgId}/school-admin/people/parents/${parentId}/children`, {
    method: "PUT",
    body: { studentUserIds },
  });
}

export async function getSchoolAdminDepartments(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/school-admin/people/departments`);
}

export async function createSchoolAdminDepartment(orgId: string, data: any) {
  return api<any>(`/organizations/${orgId}/school-admin/people/departments`, { method: "POST", body: data });
}

export async function getAvailableDepartmentSubjects(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/school-admin/people/departments/available-subjects`);
}

export async function updateDepartmentSubjects(orgId: string, departmentId: string, subjectIds: string[]) {
  return api<any>(`/organizations/${orgId}/school-admin/people/departments/${departmentId}/subjects`, {
    method: "PUT",
    body: { subjectIds },
  });
}

export interface CreateMemberInvitationPayload {
  email: string;
  role: 'principal' | 'teacher' | 'student' | 'staff' | 'parent';
  name?: string;
  phone?: string;
  specialty?: string;
  sectionId?: string;
  childStudentIds?: string[];
  employeeId?: string;
  employmentType?: string;
}

export async function createSchoolInvitation(organizationId: string, payload: CreateMemberInvitationPayload) {
  return api<{ batchId: string; invitations: { id: string; email: string; role: string; token: string; expiresAt: string }[] }>(
    `/organizations/${organizationId}/invitations`,
    { method: "POST", body: payload, idempotent: true }
  );
}

export function updateTeacherEmployment(orgId: string, teacherId: string, payload: { employeeId?: string; employmentType?: string }) {
  return api<any>(`/organizations/${orgId}/school-admin/people/teachers/${teacherId}/employment`, { method: "PATCH", body: payload });
}

export interface BatchPromotionPayload {
  sourceSectionId: string;
  targetSectionId?: string;
  targetAcademicYearId?: string;
  action: 'promote' | 'graduate';
  studentUserIds: string[];
}

export async function batchPromoteStudents(orgId: string, payload: BatchPromotionPayload) {
  return api<any>(`/organizations/${orgId}/academics/enrollments/batch-promote`, {
    method: "POST",
    body: payload,
  });
}

export async function getSchoolAdminAcademics(orgId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/academics/overview`);
}

export function createSchoolAdminCurriculum(
  orgId: string,
  payload: {
    grade: string;
    subjectName: string;
    subjectId?: string;
    unitName: string;
    chapterName: string;
    expectedCompletionWeek?: number;
    learningOutcomes?: string[];
  },
) {
  return api<any>(`/organizations/${orgId}/school-admin/curriculum`, {
    method: "POST",
    body: payload,
  });
}

export function bulkCreateCurriculumChapters(
  orgId: string,
  payload: {
    grade: string;
    subjectId?: string;
    subjectName: string;
    chapters: Array<{
      id?: string;
      unitName?: string;
      chapterName: string;
      expectedCompletionWeek?: number;
      learningOutcomes?: string[];
    }>;
  },
) {
  return api<any>(`/organizations/${orgId}/school-admin/curriculum/bulk`, {
    method: "POST",
    body: payload,
  });
}

export function deleteCurriculumChapter(orgId: string, chapterId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/curriculum/${chapterId}`, {
    method: "DELETE",
  });
}

export function createAcademicSubject(
  orgId: string,
  payload: { name: string; code: string; isElective?: boolean },
) {
  return api<any>(`/organizations/${orgId}/academics/subjects`, {
    method: "POST",
    body: payload,
  });
}

export function updateAcademicSubject(
  orgId: string,
  subjectId: string,
  payload: { name?: string; code?: string; isElective?: boolean },
) {
  return api<any>(`/organizations/${orgId}/academics/subjects/${subjectId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function updateAcademicSection(
  orgId: string,
  sectionId: string,
  payload: { name?: string; capacity?: number },
) {
  return api<any>(`/organizations/${orgId}/academics/sections/${sectionId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function updateAcademicYear(
  orgId: string,
  yearId: string,
  payload: { name?: string; startDate?: string; endDate?: string; isCurrent?: boolean },
) {
  return api<any>(`/organizations/${orgId}/academics/years/${yearId}`, {
    method: "PATCH",
    body: payload,
  });
}



export function createSchoolAdminCoursework(
  orgId: string,
  payload: {
    sectionId: string;
    subjectId: string;
    title: string;
    description?: string;
    dueAt: string;
    maxScore?: number;
  },
) {
  return api<any>(`/organizations/${orgId}/school-admin/learning/coursework`, {
    method: "POST",
    body: payload,
  });
}

export function scheduleSchoolAdminExam(
  orgId: string,
  payload: {
    sectionId: string;
    subjectId: string;
    examName: string;
    term: string;
    examDate: string;
    startTime: string;
    endTime: string;
    maxMarks: number;
  },
) {
  return api<any>(`/organizations/${orgId}/school-admin/learning/exams`, {
    method: "POST",
    body: payload,
  });
}
export const createSchoolAdminExam = scheduleSchoolAdminExam;

export function createAcademicSection(orgId: string, payload: { academicYearId: string; programId: string; name: string; capacity: number }) {
  return api<any>(`/organizations/${orgId}/academics/sections`, { method: "POST", body: payload, idempotent: true });
}

export function createAcademicProgram(orgId: string, payload: { name: string; sequenceOrder?: number }) {
  return api<any>(`/organizations/${orgId}/academics/programs`, { method: "POST", body: payload, idempotent: true });
}

export async function getSchoolAdminTimetable(orgId: string, sectionId?: string) {
  return api<any>(`/organizations/${orgId}/school-admin/timetable${sectionId ? `?sectionId=${sectionId}` : ''}`);
}

export function createSchoolAdminTimetable(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/timetable`, { method: "POST", body: data }); }
export function updateSchoolAdminTimetable(orgId: string, id: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/timetable/${id}`, { method: "PATCH", body: data }); }
export function deleteSchoolAdminTimetable(orgId: string, id: string) { return api<any>(`/organizations/${orgId}/school-admin/timetable/${id}`, { method: "DELETE" }); }

export async function getSchoolAdminAttendance(orgId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/attendance/registers`);
}

export async function getSchoolAdminLeaves(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/school-admin/leaves`);
}

export function createSchoolAdminLeave(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/leaves`, { method: "POST", body: data }); }
export function updateSchoolAdminLeaveStatus(orgId: string, id: string, status: string, reviewNotes?: string) { return api<any>(`/organizations/${orgId}/school-admin/leaves/${id}/status`, { method: "PATCH", body: { status, reviewNotes } }); }

export async function getSchoolAdminFinance(orgId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/finance/overview`);
}

export function createSchoolAdminFeeStructure(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/finance/structures`, { method: "POST", body: data }); }
export function sendSchoolAdminFeeReminder(orgId: string, dueId: string, channel = "in_app") { return api<any>(`/organizations/${orgId}/school-admin/finance/send-reminder`, { method: "POST", body: { dueId, channel } }); }
export function grantSchoolAdminFeeConcession(orgId: string, dueId: string, concessionAmount: number, concessionReason: string) { return api<any>(`/organizations/${orgId}/school-admin/finance/grant-concession`, { method: "POST", body: { dueId, concessionAmount, concessionReason } }); }
export function recordSchoolAdminFeePayment(orgId: string, data: { dueId: string; amount: number; paymentMode?: string; referenceNo?: string; notes?: string }) { return api<any>(`/organizations/${orgId}/school-admin/finance/record-payment`, { method: "POST", body: data }); }
export function batchSendSchoolAdminFeeReminders(orgId: string, channel = "in_app") { return api<any>(`/organizations/${orgId}/school-admin/finance/batch-reminders`, { method: "POST", body: { channel } }); }

export async function getSchoolAdminBroadcasts(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/school-admin/communication/broadcasts`);
}

export async function getSchoolAdminTickets(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/school-admin/communication/tickets`);
}

export function createSchoolAdminBroadcast(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/communication/broadcast`, { method: "POST", body: data }); }

export async function getSchoolAdminOperations(orgId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/operations/overview`);
}

export function createSchoolAdminPtmSchedule(orgId: string, data: any) {
  return api<any>(`/organizations/${orgId}/school-admin/operations/ptm`, { method: "POST", body: data });
}

export function createSchoolAdminTransportVehicle(orgId: string, data: any) {
  return api<any>(`/organizations/${orgId}/school-admin/operations/transport`, { method: "POST", body: data });
}

export function createSchoolAdminLibraryBook(orgId: string, data: any) {
  return api<any>(`/organizations/${orgId}/school-admin/operations/library`, { method: "POST", body: data });
}

export function createSchoolAdminAsset(orgId: string, data: any) {
  return api<any>(`/organizations/${orgId}/school-admin/operations/assets`, { method: "POST", body: data });
}

export async function getSchoolAdminGovernance(orgId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/governance/overview`);
}

export function createSchoolAdminDiscipline(orgId: string, data: any) {
  return api<any>(`/organizations/${orgId}/school-admin/governance/discipline`, { method: "POST", body: data });
}

export function updateSchoolAdminConfiguration(orgId: string, data: any) {
  return api<any>(`/organizations/${orgId}/school-admin/settings/configuration`, { method: "PATCH", body: data });
}

// Principal Control Center APIs
export async function getPrincipalDashboard(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/dashboard`);
}

export async function getPrincipalAttendance(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/attendance`);
}

export async function getPrincipalLearningRoster(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/principal/learning-roster`);
}

export async function getPrincipalLearningOverview(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/learning-overview`);
}

export async function getPrincipalAcademicHealth(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/academic-health`);
}

export async function getPrincipalPlanning(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/planning`);
}

export function createPrincipalAcademicPlan(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/academic-plans`, { method: "POST", body: data }); }
export function createPrincipalAcademicTarget(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/targets`, { method: "POST", body: data }); }
export function updatePrincipalAcademicTarget(orgId: string, targetId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/targets/${targetId}`, { method: "PATCH", body: data }); }
export function createPrincipalActionPlan(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/action-plans`, { method: "POST", body: data }); }
export function createPrincipalReviewMeeting(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/review-meetings`, { method: "POST", body: data }); }

export async function getPrincipalTeachers(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/principal/teachers`);
}

export async function getPrincipalTeacherProfile(orgId: string, teacherId: string) {
  return api<any>(`/organizations/${orgId}/principal/teachers/${teacherId}/academic-profile`);
}

export function recordPrincipalObservation(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/observations`, { method: "POST", body: data }); }
export function assignPrincipalDevelopment(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/development`, { method: "POST", body: data }); }
export function completePrincipalDevelopment(orgId: string, id: string) { return api<any>(`/organizations/${orgId}/principal/teachers/development/${id}/complete`, { method: "PATCH" }); }
export function createPrincipalDepartment(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/departments`, { method: "POST", body: data }); }
export function assignPrincipalDepartmentHead(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/department-heads`, { method: "POST", body: data }); }
export function assignPrincipalCoordinator(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/coordinators`, { method: "POST", body: data }); }
export function assignPrincipalTeacher(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/assignments`, { method: "POST", body: data }); }

export async function getPrincipalAcademics(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/academics`);
}

export async function getPrincipalTimetable(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/timetable`);
}

export function createPrincipalTimetableEntry(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/timetable`, { method: "POST", body: data }); }
export function updatePrincipalTimetableEntry(orgId: string, id: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/timetable/${id}`, { method: "PATCH", body: data }); }
export function deletePrincipalTimetableEntry(orgId: string, id: string) { return api<any>(`/organizations/${orgId}/principal/timetable/${id}`, { method: "DELETE" }); }
export function getPrincipalSubstituteSuggestions(orgId: string, id: string, date: string) { return api<any[]>(`/organizations/${orgId}/principal/timetable/${id}/suggestions?date=${encodeURIComponent(date)}`); }
export function assignPrincipalSubstitute(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/timetable/substitutions`, { method: "POST", body: data }); }

export async function getPrincipalAssessments(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/assessments`);
}

export function createPrincipalQuestionPaper(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/assessments/question-papers`, { method: "POST", body: data }); }
export function reviewPrincipalQuestionPaper(orgId: string, paperId: string, data: { status: string; reviewComments?: string }) { return api<any>(`/organizations/${orgId}/principal/assessments/question-papers/${paperId}/status`, { method: "PATCH", body: data }); }

export async function getPrincipalExaminations(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/assessments/examinations`);
}

export function createPrincipalExamPlan(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/plans`, { method: "POST", body: data }); }
export function updatePrincipalExamPlan(orgId: string, id: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/plans/${id}`, { method: "PATCH", body: data }); }
export function importPrincipalTeacherMarks(orgId: string, id: string) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/evaluations/${id}/import`, { method: "POST" }); }
export function reviewPrincipalExamResult(orgId: string, id: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/results/${id}`, { method: "PATCH", body: data }); }
export function publishPrincipalExamResults(orgId: string, data: { term: string; examName: string; className: string; sectionName: string }) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/publish-results`, { method: "POST", body: data }); }

export async function getPrincipalStudents(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/students`);
}

export async function getPrincipalCommunication(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/communication`);
}

export async function getPrincipalAudit(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/academic-audit`);
}

export async function getPrincipalAlerts(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/alerts`);
}

export function resolvePrincipalAlert(orgId: string, alertId: string, resolutionNotes?: any) {
  const body = typeof resolutionNotes === "object" ? { status: "resolved", ...resolutionNotes } : { status: "resolved", resolutionNotes };
  return api<any>(`/organizations/${orgId}/principal/alerts/${alertId}/resolve`, { method: "PATCH", body });
}

export async function getPrincipalReports(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/reports`);
}

export async function getPrincipalActivity(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/principal/activity`);
}

export async function searchPrincipal(orgId: string, query: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/principal/search?q=${encodeURIComponent(query)}`);
}

// Teacher Workspace APIs
export async function getTeacherDashboard(orgId: string) {
  return api<any>(`/organizations/${orgId}/teacher/dashboard`);
}

export async function getTeacherClasses(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/classes`);
}

export async function getTeacherClassDetails(orgId: string, classId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/classes/${classId}`);
}

export async function getTeacherClassStudents(orgId: string, classId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/classes/${classId}`);
}

export async function getTeacherStudents(orgId: string): Promise<any> {
  return api<any[]>(`/organizations/${orgId}/teacher/students`);
}

export async function getTeacherStudent360(orgId: string, studentId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/students/${studentId}/360`);
}

export async function getPrincipalStudent360(orgId: string, studentId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/principal/students/${studentId}/360`);
}

export function markTeacherAttendance(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/attendance`, { method: "POST", body }); }

export async function getTeacherAttendance(orgId: string, query?: any): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/attendance${query?.sectionId ? `?sectionId=${query.sectionId}` : ''}`);
}

export function recordTeacherLessonDelivery(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/lessons/deliver`, { method: "POST", body }); }

export async function getTeacherCurriculum(orgId: string, sectionId?: string, subjectId?: string): Promise<any> {
  const params = new URLSearchParams();
  if (sectionId) params.append("sectionId", sectionId);
  if (subjectId) params.append("subjectId", subjectId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return api<any>(`/organizations/${orgId}/teacher/curriculum${qs}`);
}

export function updateTeacherCurriculumProgress(
  orgId: string,
  chapterIdOrBody: any,
  completionPctOrBody?: any,
  status?: string
) {
  let chapterId = '';
  let completionPct = 0;
  let statusVal = status;

  if (typeof chapterIdOrBody === 'string') {
    chapterId = chapterIdOrBody;
    if (typeof completionPctOrBody === 'number') {
      completionPct = completionPctOrBody;
    } else if (typeof completionPctOrBody === 'object' && completionPctOrBody !== null) {
      completionPct = completionPctOrBody.completionPct ?? completionPctOrBody.progress ?? 0;
      statusVal = completionPctOrBody.status ?? status;
    }
  } else if (typeof chapterIdOrBody === 'object' && chapterIdOrBody !== null) {
    chapterId = chapterIdOrBody.chapterId || chapterIdOrBody.id;
    completionPct = chapterIdOrBody.completionPct ?? chapterIdOrBody.progress ?? 0;
    statusVal = chapterIdOrBody.status;
  }

  return api<any>(`/organizations/${orgId}/teacher/curriculum/${chapterId}/progress`, {
    method: "PATCH",
    body: {
      completionPct,
      status: statusVal,
    },
  });
}

export function createTeacherAssignment(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/assignments`, { method: "POST", body }); }

export async function getTeacherAssignments(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/assignments`);
}

export async function getTeacherSubmissionsQueue(orgId: string): Promise<any[]> {
  return api<any[]>(`/organizations/${orgId}/teacher/submissions/queue`);
}

export function gradeTeacherSubmission(orgId: string, submissionId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/submissions/${submissionId}/grade`, { method: "POST", body }); }
export function createTeacherIntervention(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/interventions`, { method: "POST", body }); }

export async function getTeacherLearning(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/learning`);
}

export function uploadTeacherStudyMaterial(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/materials`, { method: "POST", body }); }

export async function getTeacherAssessments(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/assessments`);
}

export function submitTeacherMarks(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/assessments/marks`, { method: "POST", body }); }

export async function getTeacherMessages(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/messages`);
}

export function sendTeacherMessage(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/messages`, { method: "POST", body }); }

export async function getTeacherTodayTimetable(orgId: string): Promise<any> { return api<any>(`/organizations/${orgId}/teacher/timetable/today`); }

export async function getTeacherWeeklyTimetable(orgId: string): Promise<any> { return api<any>(`/organizations/${orgId}/teacher/timetable/weekly`); }

export async function getTeacherWorkload(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/workload`);
}

export function updateTeacherTask(orgId: string, taskId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/tasks/${taskId}`, { method: "PATCH", body }); }

export async function getTeacherCalendar(orgId: string, month?: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/calendar${month ? `?month=${encodeURIComponent(month)}` : ''}`);
}

export async function getTeacherReports(orgId: string, classId?: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/reports${classId ? `?class=${encodeURIComponent(classId)}` : ''}`);
}

export async function getTeacherActivity(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/activity`);
}

export async function getTeacherArenaQuestions(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/arena/questions`);
}

export function createTeacherArenaQuestion(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/arena/questions`, { method: "POST", body }); }

export async function getTeacherArenaAnalytics(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/arena/analytics`);
}

// Aliases for teacher panes
export const getTeacherQuestionBank = getTeacherArenaQuestions;
export const createTeacherQuestion = createTeacherArenaQuestion;
export const getTeacherEvaluationQueue = getTeacherSubmissionsQueue;
export function evaluateTeacherSubmission(orgId: string, submissionId: string, scoreOrBody: any, maybeFeedback?: string) {
  const body = typeof scoreOrBody === 'object' ? scoreOrBody : { score: scoreOrBody, feedback: maybeFeedback };
  return gradeTeacherSubmission(orgId, submissionId, body);
}
export const getTeacherCommunicationInbox = getTeacherMessages;
export async function getTeacherConversationThread(orgId: string, threadId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/teacher/messages/${threadId}`);
}
export function sendTeacherChatMessage(orgId: string, threadIdOrBody: any, maybeContent?: string) {
  const body = typeof threadIdOrBody === 'object' ? threadIdOrBody : { threadId: threadIdOrBody, content: maybeContent };
  return sendTeacherMessage(orgId, body);
}
export const startTeacherConversation = sendTeacherMessage;
export function updateTeacherCurriculumTopic(orgId: string, ...args: any[]) {
  if (args.length >= 4) {
    const chapterId = args[2];
    const completionPct = args[3];
    return updateTeacherCurriculumProgress(orgId, { chapterId, completionPct });
  }
  return updateTeacherCurriculumProgress(orgId, args[0], args[1]);
}

// Student Workspace APIs
export async function getStudentDashboard(orgId: string) {
  return api<any>(`/organizations/${orgId}/student/dashboard`);
}

export async function getStudentClass(orgId: string) {
  return api<any>(`/organizations/${orgId}/student/class`);
}

export async function getStudentSubjects(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/subjects`);
}

export async function getStudentTimetable(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/timetable`);
}

export async function getStudentAssignments(orgId: string, filter?: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/assignments${filter ? `?status=${filter}` : ''}`);
}

export function submitStudentAssignment(orgId: string, assignmentIdOrBody: any, maybeBody?: any) {
  if (typeof assignmentIdOrBody === 'string') {
    return api<any>(`/organizations/${orgId}/student/assignments/${assignmentIdOrBody}/submit`, { method: "POST", body: maybeBody || {} });
  }
  return api<any>(`/organizations/${orgId}/student/assignments/submit`, { method: "POST", body: assignmentIdOrBody });
}

export async function getStudentAttendance(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/attendance`);
}

export async function getStudentCurriculum(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/curriculum`);
}

export async function getStudentPerformance(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/performance`);
}

export async function getStudentProgress(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/progress`);
}

export async function getStudentAssessments(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/assessments`);
}

export async function getStudentExams(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/exams`);
}

export async function getStudentArena(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/arena`);
}

export function submitStudentArenaAttempt(orgId: string, activityIdOrBody: any, maybeBody?: any) {
  if (typeof activityIdOrBody === 'string') {
    return api<any>(`/organizations/${orgId}/student/arena/${activityIdOrBody}/attempt`, { method: "POST", body: maybeBody || {} });
  }
  return api<any>(`/organizations/${orgId}/student/arena/attempt`, { method: "POST", body: activityIdOrBody });
}

export function createStudentGoal(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/student/goals`, { method: "POST", body }); }
export function createStudentSupportRequest(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/student/support-requests`, { method: "POST", body }); }

export async function getStudentResources(orgId: string): Promise<any> {
  return api<any[]>(`/organizations/${orgId}/student/resources`);
}

export function updateStudentLectureProgress(orgId: string, recordingId: string, body: any) { return api<any>(`/organizations/${orgId}/student/resources/lectures/${recordingId}/progress`, { method: "POST", body }); }
export function toggleStudentBookmark(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/student/resources/bookmarks`, { method: "POST", body }); }

export async function getStudentMessages(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/messages`);
}

export function sendStudentMessage(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/student/messages`, { method: "POST", body }); }

// Parent Workspace APIs (Scoping verified children)
export function getParentDashboard(orgId: string) { return loadRoleWorkspace(orgId); }

export function getParentChildDetails(orgId: string, studentId: string) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}`); }
export function createParentLeave(orgId: string, studentId: string, body: unknown) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}/leaves`, { method:'POST',body }); }
export function createParentQuery(orgId: string, studentId: string, body: unknown) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}/queries`, { method:'POST',body }); }
export function bookParentPtm(orgId: string, studentId: string, body: unknown) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}/bookings`, { method:'POST',body }); }
export function cancelParentPtm(orgId: string, studentId: string, id: string) { return api<any>(`/organizations/${orgId}/parent/children/${studentId}/bookings/${id}`, { method:'DELETE' }); }
