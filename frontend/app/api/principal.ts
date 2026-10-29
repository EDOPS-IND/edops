import { api, ApiRequestOptions, ListResult } from "./client";

// Principal Control Center APIs
export async function getPrincipalDashboard(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/dashboard`);
}

export async function getPrincipalAttendance(orgId: string) {
  return api<any>(`/organizations/${orgId}/principal/attendance`);
}

export async function getPrincipalLeaves(orgId: string) {
  return api<{ staffLeaves: any[]; studentLeaves: any[] }>(`/organizations/${orgId}/principal/leaves`);
}

export function updatePrincipalLeaveStatus(orgId: string, id: string, status: 'approved' | 'rejected', reviewNotes?: string) {
  return api<any>(`/organizations/${orgId}/principal/leaves/${id}/status`, {
    method: 'PATCH',
    body: { status, reviewNotes },
  });
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

export function getPrincipalSectionOverview(orgId: string, sectionId: string) {
  return api<any>(`/organizations/${orgId}/principal/academics/sections/${sectionId}/overview`);
}

export function updatePrincipalClassTeacher(orgId: string, sectionId: string, teacherUserId: string | null) {
  return api<any>(`/organizations/${orgId}/principal/academics/sections/${sectionId}/class-teacher`, {
    method: "PATCH",
    body: { teacherUserId },
  });
}

export function allocatePrincipalSectionSubject(
  orgId: string,
  sectionId: string,
  payload: {
    subjectId?: string;
    teacherUserId?: string | null;
    newSubjectName?: string;
    newSubjectCode?: string;
  },
) {
  return api<any>(`/organizations/${orgId}/principal/academics/sections/${sectionId}/subjects`, {
    method: "POST",
    body: payload,
  });
}

export function removePrincipalSectionSubject(orgId: string, sectionId: string, subjectId: string) {
  return api<any>(`/organizations/${orgId}/principal/academics/sections/${sectionId}/subjects/${subjectId}`, {
    method: "DELETE",
  });
}

export function removeSchoolAdminSectionSubject(orgId: string, sectionId: string, subjectId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/academics/sections/${sectionId}/subjects/${subjectId}`, {
    method: "DELETE",
  });
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
export function createPrincipalExamPlans(orgId: string, data: unknown) { return api<any>(`/organizations/${orgId}/principal/assessments/examinations/plans/bulk`, { method: "POST", body: data }); }
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
