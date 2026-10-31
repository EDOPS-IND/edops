import { api, ApiRequestOptions, ListResult } from "./client";

// Student Workspace APIs
export async function getStudentDashboard(orgId: string) {
  return api<any>(`/organizations/${orgId}/student/dashboard`);
}

export async function getStudentClass(orgId: string) {
  return api<any>(`/organizations/${orgId}/student/class`);
}

export async function getStudentLectures(orgId: string): Promise<any> {
  return api<any>(`/organizations/${orgId}/student/class/lectures`);
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
