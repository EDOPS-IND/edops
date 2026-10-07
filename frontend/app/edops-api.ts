export type OrganizationSummary = { id: string; name: string; slug: string; status: "active" | "suspended"; role: "school_admin" | "principal" | "teacher" | "student" | "parent" };
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
export type ParentWorkspaceData = { role: "parent"; children: ParentChild[] };
export type RoleWorkspaceData = TeacherWorkspaceData | StudentWorkspaceData | ParentWorkspaceData;
export type InvitationBatch = { id: string; organizationId: string; count: number; createdAt: string };
export type SchoolData = { organization: Organization; years: ListResult<AcademicYear>; programs: ListResult<Program>; subjects: ListResult<Subject>; sections: ListResult<Section>; members: ListResult<Member>; enrollments: ListResult<Enrollment>; assignments: ListResult<Assignment>; batches: ListResult<InvitationBatch> };

let csrfToken: string | undefined;

function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_EDOPS_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? `${window.location.protocol}//${window.location.hostname}:3001/api/v1` : `${window.location.origin}/api/v1`;
}

export async function api<T>(path: string, options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; idempotent?: boolean } = {}): Promise<T> {
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
export function setSchoolDetailedOverride(orgId: string, override: any) { return api<any>(`/platform/organizations/${orgId}/detailed-overrides`, { method: "POST", body: override }); }
export function removeSchoolDetailedOverride(orgId: string, featureKey: string) { return api<any>(`/platform/organizations/${orgId}/detailed-overrides/${featureKey}/remove`, { method: "PATCH", body: {} }); }
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
export function getSchoolAdminDepartments(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/people/departments`); }
export function createSchoolAdminDepartment(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/people/departments`, { method: "POST", body: data }); }
export function getSchoolAdminAcademics(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/academics/overview`); }
export function getSchoolAdminTimetable(orgId: string, sectionId?: string) { return api<any>(`/organizations/${orgId}/school-admin/timetable${sectionId ? `?sectionId=${sectionId}` : ''}`); }
export function createSchoolAdminTimetable(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/timetable`, { method: "POST", body: data }); }
export function getSchoolAdminAttendance(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/attendance/registers`); }
export function getSchoolAdminLeaves(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/leaves`); }
export function createSchoolAdminLeave(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/leaves`, { method: "POST", body: data }); }
export function updateSchoolAdminLeaveStatus(orgId: string, id: string, status: string, reviewNotes?: string) { return api<any>(`/organizations/${orgId}/school-admin/leaves/${id}/status`, { method: "PATCH", body: { status, reviewNotes } }); }
export function getSchoolAdminFinance(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/finance/overview`); }
export function createSchoolAdminFeeStructure(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/finance/structures`, { method: "POST", body: data }); }
export function sendSchoolAdminFeeReminder(orgId: string, dueId: string, channel = "whatsapp") { return api<any>(`/organizations/${orgId}/school-admin/finance/send-reminder`, { method: "POST", body: { dueId, channel } }); }
export function grantSchoolAdminFeeConcession(orgId: string, dueId: string, concessionAmount: number, concessionReason: string) { return api<any>(`/organizations/${orgId}/school-admin/finance/grant-concession`, { method: "POST", body: { dueId, concessionAmount, concessionReason } }); }
export function getSchoolAdminBroadcasts(orgId: string) { return api<any[]>(`/organizations/${orgId}/school-admin/communication/broadcasts`); }
export function createSchoolAdminBroadcast(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/communication/broadcast`, { method: "POST", body: data }); }
export function getSchoolAdminOperations(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/operations/overview`); }
export function getSchoolAdminGovernance(orgId: string) { return api<any>(`/organizations/${orgId}/school-admin/governance/overview`); }
export function createSchoolAdminDiscipline(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/school-admin/governance/discipline`, { method: "POST", body: data }); }

// Principal Academic Command Center APIs
export function getPrincipalDashboard(orgId: string) { return api<any>(`/organizations/${orgId}/principal/dashboard`); }
export function getPrincipalAcademicHealth(orgId: string) { return api<any>(`/organizations/${orgId}/principal/academic-health`); }
export function searchPrincipal(orgId: string, q: string) { return api<{ results: any[] }>(`/organizations/${orgId}/principal/search?q=${encodeURIComponent(q)}`); }

// Planning
export function getPrincipalPlanning(orgId: string) { return api<any>(`/organizations/${orgId}/principal/planning`); }
export function createPrincipalAcademicPlan(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/planning/academic-plans`, { method: "POST", body: data }); }
export function createPrincipalTarget(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/planning/targets`, { method: "POST", body: data }); }
export function createPrincipalActionPlan(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/planning/action-plans`, { method: "POST", body: data }); }
export function recordPrincipalMeeting(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/planning/review-meetings`, { method: "POST", body: data }); }

// People - Academic
export function getPrincipalTeachers(orgId: string) { return api<any>(`/organizations/${orgId}/principal/teachers`); }
export function getPrincipalTeacherProfile(orgId: string, teacherId: string) { return api<any>(`/organizations/${orgId}/principal/teachers/${teacherId}/academic-profile`); }
export function recordPrincipalObservation(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/observations`, { method: "POST", body: data }); }
export function assignPrincipalDevelopment(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/teachers/development`, { method: "POST", body: data }); }

// Academics & Curriculum
export function getPrincipalAcademics(orgId: string) { return api<any>(`/organizations/${orgId}/principal/academics`); }
export function getPrincipalClassPerformance(orgId: string, classId: string) { return api<any>(`/organizations/${orgId}/principal/academics/classes/${classId}/performance`); }
export function updatePrincipalCurriculumProgress(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/academics/curriculum/progress`, { method: "PATCH", body: data }); }
export function reviewPrincipalLessonPlan(orgId: string, lessonId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/academics/lesson-plans/${lessonId}/feedback`, { method: "POST", body: data }); }

// Assessments & Examinations
export function getPrincipalAssessments(orgId: string) { return api<any>(`/organizations/${orgId}/principal/assessments`); }
export function reviewPrincipalQuestionPaper(orgId: string, paperId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/assessments/question-papers/${paperId}/status`, { method: "PATCH", body: data }); }
export function getPrincipalExaminations(orgId: string) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations`); }
export function publishPrincipalResults(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/publish-results`, { method: "POST", body: data }); }

// Students & Interventions
export function getPrincipalStudents(orgId: string) { return api<any>(`/organizations/${orgId}/principal/students`); }
export function getPrincipalAtRisk(orgId: string) { return api<any>(`/organizations/${orgId}/principal/students/at-risk`); }
export function getPrincipalStudent360(orgId: string, studentId: string) { return api<any>(`/organizations/${orgId}/principal/students/${studentId}/360`); }
export function createPrincipalIntervention(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/students/interventions`, { method: "POST", body: data }); }
export function createPrincipalRemedial(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/students/remedial-programs`, { method: "POST", body: data }); }
export function createPrincipalEnrichment(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/students/enrichment-programs`, { method: "POST", body: data }); }

// Communication & PTM
export function getPrincipalCommunication(orgId: string) { return api<any>(`/organizations/${orgId}/principal/communication`); }
export function resolvePrincipalParentQuery(orgId: string, queryId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/communication/parent-queries/${queryId}`, { method: "PATCH", body: data }); }
export function createPrincipalAnnouncement(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/communication/announcements`, { method: "POST", body: data }); }

// Audit & Alerts
export function getPrincipalAlerts(orgId: string) { return api<any>(`/organizations/${orgId}/principal/alerts`); }
export function resolvePrincipalAlert(orgId: string, alertId: string, data: any) { return api<any>(`/organizations/${orgId}/principal/alerts/${alertId}/resolve`, { method: "PATCH", body: data }); }
export function getPrincipalAudit(orgId: string) { return api<any>(`/organizations/${orgId}/principal/academic-audit`); }
export function getPrincipalReports(orgId: string) { return api<any>(`/organizations/${orgId}/principal/reports`); }
export function getPrincipalActivity(orgId: string) { return api<any>(`/organizations/${orgId}/principal/activity`); }

// ==========================================
// TEACHER COMMAND CENTER APIS
// ==========================================
export function getTeacherDashboard(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/dashboard`); }
export function getTeacherClasses(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/classes`); }
export function getTeacherClassDetails(orgId: string, sectionId: string) { return api<any>(`/organizations/${orgId}/teacher/classes/${sectionId}`); }
export function getTeacherClassStudents(orgId: string, sectionId?: string) { return api<any>(`/organizations/${orgId}/teacher/classes/${sectionId || 'sec-10a'}`); }
export function getTeacherTodayTimetable(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/timetable/today`); }
export function getTeacherWeeklyTimetable(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/timetable/weekly`); }
export function getTeacherAttendance(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/attendance`); }
export function markTeacherAttendance(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/attendance/quick`, { method: "POST", body: data }); }
export function getTeacherLearning(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/learning`); }
export function recordTeacherLessonDelivery(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/lessons/deliver`, { method: "POST", body: data }); }
export function uploadTeacherStudyMaterial(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/materials`, { method: "POST", body: data }); }
export function getTeacherAssignments(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/assignments`); }
export function createTeacherAssignment(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/assignments`, { method: "POST", body: data }); }
export function getTeacherSubmissionsQueue(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/submissions/queue`); }
export function gradeTeacherSubmission(orgId: string, submissionId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/submissions/${submissionId}/grade`, { method: "POST", body: data }); }
export function getTeacherArenaQuestions(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/arena/questions`); }
export function createTeacherArenaQuestion(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/arena/questions`, { method: "POST", body: data }); }
export function getTeacherArenaAnalytics(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/arena/analytics`); }
export function getTeacherAssessments(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/assessments`); }
export function submitTeacherMarks(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/assessments/marks`, { method: "POST", body: data }); }
export function getTeacherStudents(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/students`); }
export function getTeacherStudent360(orgId: string, studentId: string) { return api<any>(`/organizations/${orgId}/teacher/students/${studentId}/360`); }
export function createTeacherIntervention(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/interventions`, { method: "POST", body: data }); }
export function getTeacherCurriculum(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/curriculum`); }
export function updateTeacherCurriculumProgress(orgId: string, chapterId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/curriculum/${chapterId}/progress`, { method: "PATCH", body: data }); }
export function getTeacherMessages(orgId: string, filter?: string) { return api<any>(`/organizations/${orgId}/teacher/messages${filter ? `?filter=${filter}` : ''}`); }
export function sendTeacherMessage(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/messages`, { method: "POST", body: data }); }
export function getTeacherWorkload(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/workload`); }
export function updateTeacherTask(orgId: string, taskId: string, data: any) { return api<any>(`/organizations/${orgId}/teacher/tasks/${taskId}`, { method: "PATCH", body: data }); }
export function getTeacherCalendar(orgId: string, month?: string) { return api<any>(`/organizations/${orgId}/teacher/calendar${month ? `?month=${encodeURIComponent(month)}` : ''}`); }
export function getTeacherReports(orgId: string, section?: string) { return api<any>(`/organizations/${orgId}/teacher/reports${section ? `?section=${encodeURIComponent(section)}` : ''}`); }
export function getTeacherActivity(orgId: string) { return api<any>(`/organizations/${orgId}/teacher/activity`); }

// Student Command Center API
export function getStudentDashboard(orgId: string) { return api<any>(`/organizations/${orgId}/student/dashboard`); }
export function getStudentClass(orgId: string) { return api<any>(`/organizations/${orgId}/student/class`); }
export function getStudentSubjects(orgId: string) { return api<any>(`/organizations/${orgId}/student/subjects`); }
export function getStudentTimetable(orgId: string) { return api<any>(`/organizations/${orgId}/student/timetable`); }
export function getStudentAssignments(orgId: string, status?: string) { return api<any>(`/organizations/${orgId}/student/assignments${status ? `?status=${status}` : ''}`); }
export function submitStudentAssignment(orgId: string, assignmentId: string, data: any) { return api<any>(`/organizations/${orgId}/student/assignments/${assignmentId}/submit`, { method: "POST", body: data }); }
export function getStudentArena(orgId: string) { return api<any>(`/organizations/${orgId}/student/arena`); }
export function submitStudentArenaAttempt(orgId: string, activityId: string, data: any) { return api<any>(`/organizations/${orgId}/student/arena/${activityId}/attempt`, { method: "POST", body: data }); }
export function getStudentAssessments(orgId: string) { return api<any>(`/organizations/${orgId}/student/assessments`); }
export function getStudentExams(orgId: string) { return api<any>(`/organizations/${orgId}/student/exams`); }
export function getStudentAttendance(orgId: string) { return api<any>(`/organizations/${orgId}/student/attendance`); }
export function getStudentPerformance(orgId: string) { return api<any>(`/organizations/${orgId}/student/performance`); }
export function getStudentCurriculum(orgId: string) { return api<any>(`/organizations/${orgId}/student/curriculum`); }
export function getStudentResources(orgId: string) { return api<any>(`/organizations/${orgId}/student/resources`); }
export function updateStudentLectureProgress(orgId: string, recordingId: string, data: any) { return api<any>(`/organizations/${orgId}/student/resources/lectures/${recordingId}/progress`, { method: "POST", body: data }); }
export function toggleStudentBookmark(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/student/resources/bookmarks`, { method: "POST", body: data }); }
export function getStudentMessages(orgId: string) { return api<any>(`/organizations/${orgId}/student/messages`); }
export function sendStudentMessage(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/student/messages`, { method: "POST", body: data }); }
export function getStudentProgress(orgId: string) { return api<any>(`/organizations/${orgId}/student/progress`); }
export function createStudentGoal(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/student/goals`, { method: "POST", body: data }); }
export function createStudentSupportRequest(orgId: string, data: any) { return api<any>(`/organizations/${orgId}/student/support-requests`, { method: "POST", body: data }); }


