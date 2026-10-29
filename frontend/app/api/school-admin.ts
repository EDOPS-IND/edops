import { api, ApiRequestOptions, ListResult, jwtAccessToken, jwtRefreshToken, refreshAccessToken, baseUrl } from "./client";

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

export async function updateDepartmentHod(orgId: string, departmentId: string, teacherId: string | null) {
  return api<any>(`/organizations/${orgId}/school-admin/people/departments/${departmentId}/hod`, {
    method: "PUT",
    body: { teacherId },
  });
}

export async function deleteSchoolAdminDepartment(orgId: string, departmentId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/people/departments/${departmentId}`, {
    method: "DELETE",
  });
}

export async function updateSchoolMemberStatus(
  orgId: string,
  userId: string,
  status: "active" | "inactive" | "withdrawn",
  reason?: string,
) {
  return api<any>(`/organizations/${orgId}/school-admin/people/members/${userId}/status`, {
    method: "PATCH",
    body: { status, reason },
  });
}

export async function deleteSchoolMember(
  orgId: string,
  userId: string,
  role?: string,
) {
  return api<any>(
    `/organizations/${orgId}/school-admin/people/members/${userId}${role ? `?role=${encodeURIComponent(role)}` : ""}`,
    {
      method: "DELETE",
    },
  );
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
  gender?: string;
  dob?: string;
}

export async function createSchoolInvitation(organizationId: string, payload: CreateMemberInvitationPayload) {
  return api<{ batchId: string; invitations: { id: string; email: string; role: string; token: string; expiresAt: string }[] }>(
    `/organizations/${organizationId}/invitations`,
    { method: "POST", body: payload, idempotent: true }
  );
}

export async function createBulkSchoolInvitations(organizationId: string, records: CreateMemberInvitationPayload[]) {
  return api<{ batchId: string; invitations: { id: string; email: string; role: string; token: string; expiresAt: string }[] }>(
    `/organizations/${organizationId}/invitations/bulk`,
    { method: "POST", body: { records }, idempotent: true }
  );
}

export async function importSchoolInvitationsCsv(organizationId: string, csv: string) {
  return api<{ batchId: string; invitations: { id: string; email: string; role: string; token: string; expiresAt: string }[] }>(
    `/organizations/${organizationId}/invitations/import`,
    { method: "POST", body: { csv }, idempotent: true }
  );
}

export async function bulkImportStudentsCsv(organizationId: string, csv: string, directAdmit?: boolean) {
  return api<{ success: boolean; batchId: string; mode?: string; count: number; imported: any[] }>(
    `/organizations/${organizationId}/school-admin/people/students/import-csv`,
    { method: "POST", body: { csv, directAdmit } }
  );
}

export async function bulkImportTeachersCsv(organizationId: string, csv: string) {
  return api<{ success: boolean; batchId: string; count: number; imported: any[] }>(
    `/organizations/${organizationId}/school-admin/people/teachers/import-csv`,
    { method: "POST", body: { csv } }
  );
}

export function updateTeacherEmployment(orgId: string, teacherId: string, payload: { employeeId?: string; employmentType?: string; gender?: string; dob?: string }) {
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

export function getSchoolAdminSectionOverview(orgId: string, sectionId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/academics/sections/${sectionId}/overview`);
}

export function updateSchoolAdminClassTeacher(orgId: string, sectionId: string, teacherUserId: string | null) {
  return api<any>(`/organizations/${orgId}/school-admin/academics/sections/${sectionId}/class-teacher`, {
    method: "PATCH",
    body: { teacherUserId },
  });
}

export function assignSchoolAdminSectionTeacher(orgId: string, sectionId: string, data: { subjectId: string; teacherUserId?: string | null }) {
  return api<any>(`/organizations/${orgId}/school-admin/academics/sections/${sectionId}/assign-teacher`, {
    method: "POST",
    body: data,
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

export function getAcademicSections(orgId: string) {
  return api<{ items: any[] } | any[]>(`/organizations/${orgId}/academics/sections?limit=100`).then((res: any) => res?.items || res || []);
}

export function getAcademicPrograms(orgId: string) {
  return api<{ items: any[] } | any[]>(`/organizations/${orgId}/academics/programs?limit=100`).then((res: any) => res?.items || res || []);
}

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
export function replyToSchoolAdminTicket(orgId: string, ticketId: string, body: string) {
  return api<any>(`/organizations/${orgId}/school-admin/communication/tickets/${ticketId}/reply`, { method: "POST", body: { body } });
}
export function getSchoolAdminCommunicationRecipients(orgId: string, role?: string, search = "") {
  const query = new URLSearchParams();
  if (role) query.set("role", role);
  if (search) query.set("search", search);
  return api<any[]>(`/organizations/${orgId}/school-admin/communication/recipients${query.toString() ? `?${query}` : ""}`);
}
export function getSchoolAdminConversations(orgId: string) {
  return api<any[]>(`/organizations/${orgId}/school-admin/communication/conversations`);
}
export function getSchoolAdminConversation(orgId: string, conversationId: string) {
  return api<any[]>(`/organizations/${orgId}/school-admin/communication/conversations/${conversationId}`);
}
export function sendSchoolAdminDirectMessage(orgId: string, body: any) {
  return api<any>(`/organizations/${orgId}/school-admin/communication/messages`, { method: "POST", body });
}
export function markSchoolAdminConversationRead(orgId: string, conversationId: string) {
  return api<any>(`/organizations/${orgId}/school-admin/communication/conversations/${conversationId}/read`, { method: "PATCH", body: {} });
}
export function updateSchoolAdminConversationStatus(orgId: string, conversationId: string, status: string) {
  return api<any>(`/organizations/${orgId}/school-admin/communication/conversations/${conversationId}/status`, { method: "PATCH", body: { status } });
}
export type SchoolAdminCommunicationEvent = { type: string; conversationId: string; messageId?: string };
export function openCommunicationEventStream(orgId: string, route: string, onEvent: (event: SchoolAdminCommunicationEvent) => void) {
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  const connect = async () => {
    if (closed) return;
    controller = new AbortController();
    try {
      const headers: Record<string, string> = { Accept: "text/event-stream" };
      if (jwtAccessToken) headers.Authorization = `Bearer ${jwtAccessToken}`;
      let response = await fetch(`${baseUrl()}/organizations/${orgId}/${route}/events`, { headers, credentials: "include", signal: controller.signal });
      if (response.status === 401 && (jwtAccessToken || jwtRefreshToken)) {
        const token = await refreshAccessToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
          response = await fetch(`${baseUrl()}/organizations/${orgId}/${route}/events`, { headers, credentials: "include", signal: controller.signal });
        }
      }
      if (!response.ok || !response.body) throw new Error(`Communication stream failed (${response.status})`);
      onEvent({ type: "communication.resync", conversationId: "" });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!closed) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          const data = chunk.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
          if (data) onEvent(JSON.parse(data));
        }
      }
      if (!closed) throw new Error("Communication stream closed");
    } catch {
      if (!closed) timer = setTimeout(connect, 5000);
    }
  };
  connect();
  return () => { closed = true; if (timer) clearTimeout(timer); controller?.abort(); };
}
export function openSchoolAdminCommunicationStream(orgId: string, onEvent: (event: SchoolAdminCommunicationEvent) => void) {
  return openCommunicationEventStream(orgId, "school-admin/communication", onEvent);
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

export async function uploadSchoolDocument(
  orgId: string,
  metadata: { title: string; category: string; fileName: string; contentType: string; sizeBytes: number; checksumSha256: string },
  file: File,
) {
  const created = await api<any>(`/organizations/${orgId}/school-admin/governance/documents`, { method: "POST", body: metadata });
  const uploadResponse = await fetch(created.upload.url, { method: "PUT", headers: created.upload.headers, body: file });
  if (!uploadResponse.ok) throw new Error("Document upload failed");
  const versionId = uploadResponse.headers.get("x-amz-version-id");
  if (!versionId) throw new Error("Storage did not return a document version");
  return api<any>(`/organizations/${orgId}/school-admin/governance/documents/${created.document.id}/complete`, { method: "POST", body: { versionId } });
}

export function getSchoolDocumentDownload(orgId: string, documentId: string) {
  return api<{ url: string }>(`/organizations/${orgId}/school-admin/governance/documents/${documentId}/download`);
}

export function createSchoolAdminDiscipline(orgId: string, data: any) {
  return api<any>(`/organizations/${orgId}/school-admin/governance/discipline`, { method: "POST", body: data });
}

export function updateSchoolAdminConfiguration(orgId: string, data: any) {
  return api<any>(`/organizations/${orgId}/school-admin/settings/configuration`, { method: "PATCH", body: data });
}
