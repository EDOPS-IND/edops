export type OrganizationSummary = { id: string; name: string; slug: string; status: "active" | "suspended"; role: "school_admin" | "principal" | "teacher" | "student" | "parent"; features?: string[] };
export type DashboardItem = { key: string; sectionKey: string; label: string; featureKey: string; sortOrder: number; enabled: boolean; effectiveEnabled: boolean };
export type DashboardSection = { key: string; label: string; sortOrder: number; enabled: boolean; items: DashboardItem[] };
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
export type InvitationBatch = { id: string; organizationId: string; count: number; createdAt: string };
export type SchoolData = { organization: Organization; years: ListResult<AcademicYear>; programs: ListResult<Program>; subjects: ListResult<Subject>; sections: ListResult<Section>; members: ListResult<Member>; enrollments: ListResult<Enrollment>; assignments: ListResult<Assignment>; batches: ListResult<InvitationBatch> };

let jwtAccessToken: string | undefined;
let jwtRefreshToken: string | undefined;

if (typeof window !== "undefined") {
  jwtAccessToken = localStorage.getItem("edops_jwt_token") || undefined;
  jwtRefreshToken = localStorage.getItem("edops_refresh_token") || undefined;
}

function baseUrl() {
  if (typeof window !== "undefined") {
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return `${window.location.origin}/api/v1`;
    }
  }
  const configured = process.env.NEXT_PUBLIC_EDOPS_API_URL?.replace(/\/$/, "");
  if (configured && !configured.includes("localhost")) return configured;
  return typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001/api/v1`
    : "http://127.0.0.1:3001/api/v1";
}

export async function api<T>(path: string, options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; idempotent?: boolean } = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (jwtAccessToken) headers["Authorization"] = `Bearer ${jwtAccessToken}`;
  if (options.idempotent) headers["Idempotency-Key"] = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
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
        const refreshData = await refreshRes.json();
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

  const data = response.status === 204 ? null : await response.json().catch(() => null);
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
  if (path === "/auth/logout") {
    jwtAccessToken = undefined;
    jwtRefreshToken = undefined;
    if (typeof window !== "undefined") {
      localStorage.removeItem("edops_jwt_token");
      localStorage.removeItem("edops_refresh_token");
    }
  }
  return data as T;
}

export async function csrf() { return { csrfToken: "" }; }
export async function login(email: string, password: string) { return api<Profile & { accessToken?: string; refreshToken?: string }>("/auth/login", { method: "POST", body: { email, password } }); }
export function logout() { return api<null>("/auth/logout", { method: "POST", body: { refreshToken: jwtRefreshToken } }); }
export function switchSchool(schoolId: string) { return api<{ accessToken: string; activeSchoolId: string; role?: string }>("/auth/switch-school", { method: "POST", body: { schoolId } }); }
export function profile() { return api<Profile>("/auth/me"); }
export function getDashboardNavigation(orgId: string, role: OrganizationSummary["role"]) { return api<DashboardSection[]>(`/organizations/${orgId}/dashboard-navigation/${role}`); }
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
export function deleteResource<T>(path: string) { return api<T>(path, { method: "DELETE" }); }

// Platform Control Center APIs
export function getPlatformDashboard() { return api<any>("/platform/dashboard"); }
export function getPlatformSchools(limit = 50, offset = 0) { return api<ListResult<any>>(`/platform/organizations?limit=${limit}&offset=${offset}`); }
export function getPlatformPlans(limit = 50, offset = 0) { return api<ListResult<any>>(`/platform/plans?limit=${limit}&offset=${offset}`); }
export function createPlatformPlan(plan: any) { return api<any>("/platform/plans", { method: "POST", body: plan }); }
export function updatePlanStatus(id: string, active: boolean) { return api<any>(`/platform/plans/${id}/status`, { method: "PATCH", body: { active } }); }
export function getPlatformFeatures() { return api<any[]>("/platform/features"); }
export function getPlatformFeatureMatrix() { return api<{ plans: any[]; features: any[] }>("/platform/feature-matrix"); }
export function updatePlanFeatures(planId: string, features: Record<string, boolean>) { return api<any>(`/platform/plans/${planId}/features`, { method: "PATCH", body: { features } }); }
export function getSchoolBilling(orgId: string) { return api<any>(`/platform/organizations/${orgId}/billing`); }
export function getSchoolDetailedOverrides(orgId: string) { return api<any[]>(`/platform/organizations/${orgId}/detailed-overrides`); }
export function getSchoolRoleFeatureMatrix(orgId: string) { return api<any>(`/platform/organizations/${orgId}/role-feature-matrix`); }
export function getPlatformDashboardNavigation(orgId: string, role: OrganizationSummary["role"]) { return api<DashboardSection[]>(`/platform/organizations/${orgId}/dashboard-navigation/${role}`); }
export function savePlatformDashboardSection(orgId: string, role: OrganizationSummary["role"], key: string, body: {label?: string; sortOrder?: number; enabled?: boolean}) { return api<DashboardSection[]>(`/platform/organizations/${orgId}/dashboard-navigation/${role}/sections/${encodeURIComponent(key)}`, { method: "POST", body }); }
export function savePlatformDashboardItem(orgId: string, role: OrganizationSummary["role"], key: string, body: {sectionKey?: string; sortOrder?: number; enabled?: boolean}) { return api<DashboardSection[]>(`/platform/organizations/${orgId}/dashboard-navigation/${role}/items/${encodeURIComponent(key)}`, { method: "PATCH", body }); }
export function updateSchoolRoleFeatureMatrix(orgId: string, payload: { featureKey: string; role?: string | null; enabled: boolean | null; reason?: string }) { return api<any>(`/platform/organizations/${orgId}/role-feature-matrix`, { method: "PATCH", body: payload }); }
export function setSchoolDetailedOverride(orgId: string, override: any) { return api<any>(`/platform/organizations/${orgId}/detailed-overrides`, { method: "POST", body: override }); }
export function removeSchoolDetailedOverride(orgId: string, featureKey: string, role?: string) { return api<any>(`/platform/organizations/${orgId}/detailed-overrides/${featureKey}/remove${role ? `?role=${role}` : ''}`, { method: "PATCH", body: {} }); }
export function onboardSchool(data: any) { return api<any>("/platform/organizations/onboard", { method: "POST", body: data }); }
export function updateSchoolLifecycle(orgId: string, data: any) { return api<any>(`/platform/organizations/${orgId}/lifecycle`, { method: "PATCH", body: data }); }
export function getSupportTickets(limit = 50, offset = 0) { return api<ListResult<any>>(`/platform/support/tickets?limit=${limit}&offset=${offset}`); }
export function createSupportTicket(data: any) { return api<any>("/platform/support/tickets", { method: "POST", body: data }); }
export function updateSupportTicketStatus(id: string, data: any) { return api<any>(`/platform/support/tickets/${id}/status`, { method: "PATCH", body: data }); }
export function startSupportSession(data: any) { return api<any>("/platform/support/sessions", { method: "POST", body: data }); }
export function getAnnouncements() { return api<any[]>("/platform/announcements"); }
export function createAnnouncement(data: any) { return api<any>("/platform/announcements", { method: "POST", body: data }); }
export function getPayments(limit = 50, offset = 0) { return api<ListResult<any>>(`/platform/payments?limit=${limit}&offset=${offset}`); }
export function recordPayment(data: any) { return api<any>("/platform/payments", { method: "POST", body: data }); }
export function refundPayment(id: string, reason: string) { return api<any>(`/platform/payments/${id}/refund`, { method: "POST", body: { reason } }); }
export function globalSearch(q: string) { return api<{ results: any[] }>(`/platform/search?q=${encodeURIComponent(q)}`); }
export function getDetailedHealth() { return api<any>("/platform/health-detailed"); }
export function getPlatformStaff() { return api<any>("/platform/staff"); }
export function getAuditLogs(limit = 50, offset = 0) { return api<ListResult<any>>(`/platform/audit-logs?limit=${limit}&offset=${offset}`); }

// School Admin Control Center APIs
export function getSchoolAdminDashboard(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/dashboard`); }
export function getSchoolAdminStudents(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/people/students`); }
export function getSchoolAdminStudent360(orgId: string, studentId: string) { return api<any>(`/organizations/${orgId}/school-admin/people/students/${studentId}/360`); }
export function getSchoolAdminTeachers(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/people/teachers`); }
export function getSchoolAdminStaff(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/people/staff`); }
export function getSchoolAdminParents(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/people/parents`); }
export function getSchoolAdminDepartments(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/people/departments`); }
export function createSchoolAdminDepartment(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/people/departments`, { method: "POST", body: data }); }
export function getSchoolAdminAcademics(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/academics/overview`); }
export function getSchoolAdminTimetable(orgId: string, sectionId?: string) { return api<any>(`/organizations/${orgId}/school-admin/timetable${sectionId ? `?sectionId=${sectionId}` : ''}`); }
export function createSchoolAdminTimetable(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/timetable`, { method: "POST", body: data }); }
export function updateSchoolAdminTimetable(orgId: string, id: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/timetable/${id}`, { method: "PATCH", body: data }); }
export function deleteSchoolAdminTimetable(orgId: string, id: string) { return api<any>(`/organizations/${orgId}/school-admin/timetable/${id}`, { method: "DELETE" }); }
export function getSchoolAdminAttendance(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/attendance/registers`); }
export function getSchoolAdminLeaves(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/leaves`); }
export function createSchoolAdminLeave(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/leaves`, { method: "POST", body: data }); }
export function updateSchoolAdminLeaveStatus(orgId: string, id: string, status: string, reviewNotes?: string) { return api<any>(`/organizations/${orgId}/school-admin/leaves/${id}/status`, { method: "PATCH", body: { status, reviewNotes } }); }
export function getSchoolAdminFinance(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/finance/overview`); }
export function createSchoolAdminFeeStructure(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/finance/structures`, { method: "POST", body: data }); }
export function sendSchoolAdminFeeReminder(orgId: string, dueId: string, channel = "whatsapp") { return api<any>(`/organizations/${orgId}/school-admin/finance/send-reminder`, { method: "POST", body: { dueId, channel } }); }
export function grantSchoolAdminFeeConcession(orgId: string, dueId: string, concessionAmount: number, concessionReason: string) { return api<any>(`/organizations/${orgId}/school-admin/finance/grant-concession`, { method: "POST", body: { dueId, concessionAmount, concessionReason } }); }
export function getSchoolAdminBroadcasts(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/communication/broadcasts`); }
export function getSchoolAdminTickets(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/communication/tickets`); }
export function createSchoolAdminBroadcast(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/communication/broadcast`, { method: "POST", body: data }); }
export function getSchoolAdminOperations(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/operations/overview`); }
export function getSchoolAdminGovernance(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/governance/overview`); }
export function createSchoolAdminDiscipline(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/governance/discipline`, { method: "POST", body: data }); }

// Principal Control Center APIs
export function getPrincipalDashboard(orgId: string) { return api<any>(`/organizations/${orgId}/principal/dashboard`); }
export function getPrincipalAttendance(orgId: string) { return api<any>(`/organizations/${orgId}/principal/attendance`); }
export function getPrincipalLearningRoster(orgId: string) { return api<any[]>(`/organizations/${orgId}/principal/learning-roster`); }
export function getPrincipalLearningOverview(orgId: string) { return api<any>(`/organizations/${orgId}/principal/learning-overview`); }
export function getPrincipalAcademicHealth(orgId: string) { return api<any>(`/organizations/${orgId}/principal/academic-health`); }
export function getPrincipalPlanning(orgId: string) { return api<any>(`/organizations/${orgId}/principal/planning`); }
export function createPrincipalAcademicPlan(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/academic-plans`, { method: "POST", body: data }); }
export function createPrincipalAcademicTarget(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/targets`, { method: "POST", body: data }); }
export function updatePrincipalAcademicTarget(orgId: string, targetId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/targets/${targetId}`, { method: "PATCH", body: data }); }
export function createPrincipalActionPlan(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/action-plans`, { method: "POST", body: data }); }
export function createPrincipalReviewMeeting(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/planning/review-meetings`, { method: "POST", body: data }); }
export function getPrincipalTeachers(orgId: string) { return api<any>(`/organizations/${orgId}/principal/teachers`); }
export function getPrincipalTeacherProfile(orgId: string, teacherId: string) { return api<any>(`/organizations/${orgId}/principal/teachers/${teacherId}/academic-profile`); }
export function recordPrincipalObservation(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/observations`, { method: "POST", body: data }); }
export function assignPrincipalDevelopment(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/development`, { method: "POST", body: data }); }
export function completePrincipalDevelopment(orgId: string, id: string) { return api<any>(`/organizations/${orgId}/principal/teachers/development/${id}/complete`, { method: "PATCH" }); }
export function createPrincipalDepartment(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/departments`, { method: "POST", body: data }); }
export function assignPrincipalDepartmentHead(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/department-heads`, { method: "POST", body: data }); }
export function assignPrincipalCoordinator(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/coordinators`, { method: "POST", body: data }); }
export function assignPrincipalTeacher(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/assignments`, { method: "POST", body: data }); }
export function getPrincipalAcademics(orgId: string) { return api<any>(`/organizations/${orgId}/principal/academics`); }
export function getPrincipalTimetable(orgId: string) { return api<any>(`/organizations/${orgId}/principal/timetable`); }
export function createPrincipalTimetableEntry(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/timetable`, { method: "POST", body: data }); }
export function updatePrincipalTimetableEntry(orgId: string, id: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/timetable/${id}`, { method: "PATCH", body: data }); }
export function deletePrincipalTimetableEntry(orgId: string, id: string) { return api<any>(`/organizations/${orgId}/principal/timetable/${id}`, { method: "DELETE" }); }
export function getPrincipalSubstituteSuggestions(orgId: string, id: string, date: string) { return api<any[]>(`/organizations/${orgId}/principal/timetable/${id}/suggestions?date=${encodeURIComponent(date)}`); }
export function assignPrincipalSubstitute(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/timetable/substitutions`, { method: "POST", body: data }); }
export function getPrincipalAssessments(orgId: string) { return api<any>(`/organizations/${orgId}/principal/assessments`); }
export function createPrincipalQuestionPaper(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/assessments/question-papers`, { method: "POST", body: data }); }
export function reviewPrincipalQuestionPaper(orgId: string, paperId: string, data: { status: string; reviewComments?: string }) { return api<any>(`/organizations/${orgId}/principal/assessments/question-papers/${paperId}/status`, { method: "PATCH", body: data }); }
export function getPrincipalExaminations(orgId: string) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations`); }
export function createPrincipalExamPlan(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/plans`, { method: "POST", body: data }); }
export function updatePrincipalExamPlan(orgId: string, id: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/plans/${id}`, { method: "PATCH", body: data }); }
export function importPrincipalTeacherMarks(orgId: string, id: string) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/evaluations/${id}/import`, { method: "POST" }); }
export function reviewPrincipalExamResult(orgId: string, id: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/results/${id}`, { method: "PATCH", body: data }); }
export function publishPrincipalExamResults(orgId: string, data: { term: string; examName: string; className: string; sectionName: string }) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/publish-results`, { method: "POST", body: data }); }
export function getPrincipalStudents(orgId: string) { return api<any>(`/organizations/${orgId}/principal/students`); }
export function getPrincipalCommunication(orgId: string) { return api<any>(`/organizations/${orgId}/principal/communication`); }
export function getPrincipalAudit(orgId: string) { return api<any>(`/organizations/${orgId}/principal/academic-audit`); }
export function getPrincipalAlerts(orgId: string) { return api<any[]>(`/organizations/${orgId}/principal/alerts`); }
export function resolvePrincipalAlert(orgId: string, alertId: string, resolutionNotes?: string) { return api<any>(`/organizations/${orgId}/principal/alerts/${alertId}/resolve`, { method: "PATCH", body: { status: "resolved", resolutionNotes } }); }
export function getPrincipalReports(orgId: string) { return api<any>(`/organizations/${orgId}/principal/reports`); }
export function getPrincipalActivity(orgId: string) { return api<any[]>(`/organizations/${orgId}/principal/activity`); }
export function searchPrincipal(orgId: string, query: string) { return api<any[]>(`/organizations/${orgId}/principal/search?q=${encodeURIComponent(query)}`); }

// Teacher Workspace APIs
export function getTeacherDashboard(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/dashboard`); }
export function getTeacherClasses(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/classes`); }
export function getTeacherClassDetails(orgId: string, classId: string) { return api<any>(`/organizations/${orgId}/teacher/classes/${classId}`); }
export function getTeacherClassStudents(orgId: string, classId: string) { return api<any[]>(`/organizations/${orgId}/teacher/classes/${classId}/students`); }
export function getTeacherStudents(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/students`); }
export function getTeacherStudent360(orgId: string, studentId: string) { return api<any>(`/organizations/${orgId}/teacher/students/${studentId}/360`); }
export function markTeacherAttendance(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/attendance`, { method: "POST", body }); }
export function getTeacherAttendance(orgId: string, query?: any) { return api<any>(`/organizations/${orgId}/teacher/attendance${query?.sectionId ? `?sectionId=${query.sectionId}` : ''}`); }
export function recordTeacherLessonDelivery(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/lessons/delivery`, { method: "POST", body }); }
export function getTeacherCurriculum(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/curriculum`); }
export function updateTeacherCurriculumProgress(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/curriculum/progress`, { method: "POST", body }); }
export function createTeacherAssignment(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/assignments`, { method: "POST", body }); }
export function getTeacherAssignments(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/assignments`); }
export function getTeacherSubmissionsQueue(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/submissions`); }
export function gradeTeacherSubmission(orgId: string, submissionId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/submissions/${submissionId}/grade`, { method: "POST", body }); }
export function createTeacherIntervention(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/interventions`, { method: "POST", body }); }
export function getTeacherLearning(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/learning`); }
export function uploadTeacherStudyMaterial(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/learning/material`, { method: "POST", body }); }
export function getTeacherAssessments(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/assessments`); }
export function submitTeacherMarks(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/assessments/marks`, { method: "POST", body }); }
export function getTeacherMessages(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/messages`); }
export function sendTeacherMessage(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/messages`, { method: "POST", body }); }
export function getTeacherTodayTimetable(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/timetable/today`); }
export function getTeacherWeeklyTimetable(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/timetable/weekly`); }
export function getTeacherWorkload(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/workload`); }
export function updateTeacherTask(orgId: string, taskId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/tasks/${taskId}`, { method: "PATCH", body }); }
export function getTeacherCalendar(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/calendar`); }
export function getTeacherReports(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/reports`); }
export function getTeacherActivity(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/activity`); }
export function getTeacherArenaQuestions(orgId: string) { return api<any[]>(`/organizations/${orgId}/teacher/arena/questions`); }
export function createTeacherArenaQuestion(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/teacher/arena/questions`, { method: "POST", body }); }
export function getTeacherArenaAnalytics(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/arena/analytics`); }

// Student Workspace APIs
export function getStudentDashboard(orgId: string) { return api<any>(`/organizations/${orgId}/student/dashboard`); }
export function getStudentClass(orgId: string) { return api<any>(`/organizations/${orgId}/student/class`); }
export function getStudentSubjects(orgId: string) { return api<any[]>(`/organizations/${orgId}/student/subjects`); }
export function getStudentTimetable(orgId: string) { return api<any[]>(`/organizations/${orgId}/student/timetable`); }
export function getStudentAssignments(orgId: string) { return api<any[]>(`/organizations/${orgId}/student/assignments`); }
export function submitStudentAssignment(orgId: string, assignmentIdOrBody: any, maybeBody?: any) {
  if (typeof assignmentIdOrBody === 'string') {
    return api<any>(`/organizations/${orgId}/student/assignments/${assignmentIdOrBody}/submit`, { method: "POST", body: maybeBody || {} });
  }
  return api<any>(`/organizations/${orgId}/student/assignments/submit`, { method: "POST", body: assignmentIdOrBody });
}
export function getStudentAttendance(orgId: string) { return api<any>(`/organizations/${orgId}/student/attendance`); }
export function getStudentCurriculum(orgId: string) { return api<any>(`/organizations/${orgId}/student/curriculum`); }
export function getStudentPerformance(orgId: string) { return api<any>(`/organizations/${orgId}/student/performance`); }
export function getStudentProgress(orgId: string) { return api<any>(`/organizations/${orgId}/student/progress`); }
export function getStudentAssessments(orgId: string) { return api<any[]>(`/organizations/${orgId}/student/assessments`); }
export function getStudentExams(orgId: string) { return api<any[]>(`/organizations/${orgId}/student/exams`); }
export function getStudentArena(orgId: string) { return api<any>(`/organizations/${orgId}/student/arena`); }
export function submitStudentArenaAttempt(orgId: string, activityIdOrBody: any, maybeBody?: any) {
  if (typeof activityIdOrBody === 'string') {
    return api<any>(`/organizations/${orgId}/student/arena/${activityIdOrBody}/attempt`, { method: "POST", body: maybeBody || {} });
  }
  return api<any>(`/organizations/${orgId}/student/arena/attempt`, { method: "POST", body: activityIdOrBody });
}
export function createStudentGoal(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/student/goals`, { method: "POST", body }); }
export function createStudentSupportRequest(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/student/support`, { method: "POST", body }); }
export function getStudentResources(orgId: string) { return api<any[]>(`/organizations/${orgId}/student/resources`); }
export function updateStudentLectureProgress(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/student/lectures/progress`, { method: "POST", body }); }
export function toggleStudentBookmark(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/student/bookmarks`, { method: "POST", body }); }
export function getStudentMessages(orgId: string) { return api<any[]>(`/organizations/${orgId}/student/messages`); }
export function sendStudentMessage(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/student/messages`, { method: "POST", body }); }

// Parent Workspace APIs (Scoping verified children)
export function getParentDashboard(orgId: string) { return loadRoleWorkspace(orgId); }

