import { api, ApiRequestOptions, ListResult } from "./client";

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

export async function getTeacherLeaves(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/teacher/leaves`);
}

export function applyTeacherLeave(orgId: string, data: { leaveType: string; startDate: string; endDate: string; reason?: string }) {
  return api<any>(`/organizations/${orgId}/teacher/leaves`, {
    method: "POST",
    body: data,
  });
}

export async function getTeacherStudentLeaves(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/teacher/leaves/student-requests`);
}

export function updateTeacherStudentLeaveStatus(orgId: string, id: string, status: "approved" | "rejected", reviewNotes?: string) {
  return api<any>(`/organizations/${orgId}/teacher/leaves/student-requests/${id}/status`, {
    method: "PATCH",
    body: { status, reviewNotes },
  });
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
