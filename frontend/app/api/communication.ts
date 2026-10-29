import { api, ApiRequestOptions } from "./client";
import { openCommunicationEventStream } from "./school-admin";

// Shared chat API used by every authenticated dashboard.
export function getCommunicationNotices(orgId: string, options?: ApiRequestOptions) { return api<any[]>(`/organizations/${orgId}/communication/notices`, options); }
export function createCommunicationNotice(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/communication/notices`, { method: "POST", body }); }
export function getTeacherBroadcastSections(orgId: string) { return api<any[]>(`/organizations/${orgId}/communication/teacher-sections`); }
export function getCommunicationConversations(orgId: string) { return api<any[]>(`/organizations/${orgId}/communication/conversations`); }
export function getCommunicationConversation(orgId: string, conversationId: string) { return api<any[]>(`/organizations/${orgId}/communication/conversations/${conversationId}`); }
export function getCommunicationRecipients(orgId: string, role?: string, search = "") {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (search) params.set("search", search);
  return api<any[]>(`/organizations/${orgId}/communication/recipients${params.toString() ? `?${params}` : ""}`);
}
export function sendCommunicationMessage(orgId: string, body: any) { return api<any>(`/organizations/${orgId}/communication/messages`, { method: "POST", body }); }
export function markCommunicationRead(orgId: string, conversationId: string) { return api<any>(`/organizations/${orgId}/communication/conversations/${conversationId}/read`, { method: "PATCH", body: {} }); }
export function updateCommunicationStatus(orgId: string, conversationId: string, status: string) { return api<any>(`/organizations/${orgId}/communication/conversations/${conversationId}/status`, { method: "PATCH", body: { status } }); }
export function openCommunicationStream(orgId: string, onEvent: (event: any) => void) {
  return openCommunicationEventStream(orgId, "communication", onEvent);
}
