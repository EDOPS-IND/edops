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

export let jwtAccessToken: string | undefined;
export let jwtRefreshToken: string | undefined;
let refreshPromise: Promise<string | null> | null = null;

export function clearAuthTokens() {
  jwtAccessToken = undefined;
  jwtRefreshToken = undefined;
  if (typeof window !== "undefined") {
    localStorage.removeItem("edops_jwt_token");
    localStorage.removeItem("edops_refresh_token");
  }
}

if (typeof window !== "undefined") {
  jwtAccessToken = localStorage.getItem("edops_jwt_token") || undefined;
  jwtRefreshToken = localStorage.getItem("edops_refresh_token") || undefined;
}

export function baseUrl() {
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

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshRes = await fetch(`${baseUrl()}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ refreshToken: jwtRefreshToken }),
      });
      if (!refreshRes.ok) return null;
      const refreshText = await refreshRes.text();
      const refreshData = refreshText ? JSON.parse(refreshText) : null;
      if (!refreshData?.accessToken) return null;
      jwtAccessToken = refreshData.accessToken;
      if (refreshData.refreshToken) jwtRefreshToken = refreshData.refreshToken;
      if (typeof window !== "undefined") {
        localStorage.setItem("edops_jwt_token", refreshData.accessToken);
        if (refreshData.refreshToken) localStorage.setItem("edops_refresh_token", refreshData.refreshToken);
      }
      return refreshData.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  idempotent?: boolean;
  silent?: boolean;
  noCache?: boolean;
  ttlMs?: number;
};

// Client-side in-memory cache for GET requests
const apiGetCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const pendingGetRequests = new Map<string, Promise<any>>();

export function invalidateApiCache(pathPrefix?: string): void {
  if (typeof window === "undefined") return;
  if (!pathPrefix) {
    apiGetCache.clear();
    return;
  }
  for (const key of apiGetCache.keys()) {
    if (key.includes(pathPrefix)) {
      apiGetCache.delete(key);
    }
  }
}

/**
 * Translates technical error messages, HTTP status codes, and database errors
 * into respectful, understandable language suitable for school administrators, teachers, and students.
 */
export function toHumanErrorMessage(error: unknown, status?: number): string {
  if (!error && !status) return "An unexpected issue occurred. Please try again.";

  let raw = "";
  if (typeof error === "string") {
    raw = error;
  } else if (error && typeof error === "object") {
    const errObj = error as any;
    if (Array.isArray(errObj.message)) {
      raw = errObj.message.join("; ");
    } else if (typeof errObj.message === "string") {
      raw = errObj.message;
    } else if (typeof errObj.error === "string") {
      raw = errObj.error;
    }
  }

  const trimmed = raw.trim();

  // 1. Network / Connection errors
  if (
    /failed to fetch|networkerror|load failed|network request failed|err_connection|econnrefused/i.test(trimmed)
  ) {
    return "Unable to connect to the school server. Please check your internet connection and try again.";
  }

  // 2. Specific Database & Backend Business Logic patterns
  if (/uq_sections_org_class_teacher/i.test(trimmed)) {
    return "This teacher is already assigned as the Class Teacher for another section. A teacher can only lead one section at a time.";
  }
  if (/uq_parent_student_rel/i.test(trimmed)) {
    return "This student is already linked to this parent or guardian.";
  }
  if (/users_email_key|duplicate key.*email/i.test(trimmed)) {
    return "An account with this email address is already registered in the system.";
  }
  if (/duplicate key value violates unique constraint/i.test(trimmed)) {
    return "This record already exists in the system with the same details.";
  }
  if (/violates foreign key constraint/i.test(trimmed)) {
    return "This record is linked to other school data and cannot be removed or modified right now.";
  }
  if (/violates not-null constraint/i.test(trimmed)) {
    return "Please make sure all required fields are filled in before submitting.";
  }
  if (/value too long for type character varying/i.test(trimmed)) {
    return "One of the entries exceeds the maximum allowed character limit. Please shorten your text.";
  }
  if (/invalid input syntax for type uuid/i.test(trimmed)) {
    return "Invalid selection. Please choose an option from the list and try again.";
  }

  // 3. Common backend domain & validation rules
  if (/A requested person already has a membership/i.test(trimmed)) {
    return "This user is already a member of the school. You can manage their status directly in the directory.";
  }
  if (/An active invitation already exists/i.test(trimmed)) {
    return "An active invitation has already been sent to this email address.";
  }
  if (/Choose a different teacher/i.test(trimmed)) {
    return "The substitute teacher cannot be the same as the assigned classroom teacher.";
  }
  if (/Capacity cannot be below active enrollment count/i.test(trimmed)) {
    return "Class capacity cannot be less than the number of currently enrolled students.";
  }
  if (/Duplicate emails in the batch/i.test(trimmed)) {
    return "The upload contains duplicate email addresses. Please ensure each email appears only once.";
  }
  if (/Plan seat limit reached/i.test(trimmed)) {
    return "Your school's account plan seat limit has been reached. Please contact support or upgrade your plan.";
  }

  // 4. Class-validator UUID & field patterns
  if (/academicYearId must be a UUID/i.test(trimmed)) {
    return "Please select a valid academic year.";
  }
  if (/programId must be a UUID/i.test(trimmed)) {
    return "Please select a valid class or grade program.";
  }
  if (/sectionId must be a UUID/i.test(trimmed)) {
    return "Please select a valid section.";
  }
  if (/subjectId must be a UUID/i.test(trimmed)) {
    return "Please select a valid subject.";
  }
  if (/teacherUserId must be a UUID/i.test(trimmed)) {
    return "Please select a valid teacher.";
  }
  if (/studentUserId must be a UUID/i.test(trimmed)) {
    return "Please select a valid student.";
  }
  if (/email must be an email/i.test(trimmed)) {
    return "Please enter a valid email address.";
  }

  // 5. HTTP status code mappings when backend didn't provide a specific domain message or returned generic text
  const isGenericMessage =
    !trimmed ||
    /^request failed \(\d+\)$/i.test(trimmed) ||
    /^(bad request|unauthorized|forbidden|not found|conflict|internal server error)$/i.test(trimmed);

  if (isGenericMessage && status) {
    switch (status) {
      case 400:
        return "The submitted information was incomplete or formatted incorrectly. Please review your entries.";
      case 401:
        return "Your session has expired. Please sign in again to continue.";
      case 403:
        return "You do not have permission to perform this action. If you believe this is a mistake, please reach out to your school administrator.";
      case 404:
        return "The requested record could not be found. It may have been moved or deleted.";
      case 409:
        return "This entry conflicts with existing records. Please check the details and try again.";
      case 422:
        return "Some details could not be processed. Please check the entries and try again.";
      case 429:
        return "Too many requests. Please wait a few moments before trying again.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "We're experiencing a temporary server delay. Please try again in a few moments.";
      default:
        return `We could not complete your request (Code ${status}). Please try again.`;
    }
  }

  // 6. Clean up technical prefixes like "ConflictException: ", "Error: ", etc.
  const cleaned = trimmed
    .replace(/^(error|conflictexception|badrequestexception|notfoundexception|forbidderexception|unauthorizedexception):\s*/i, "")
    .trim();

  // If the message is already good human prose (e.g. "Teacher John Doe is already assigned as Class Teacher for Grade 10 A"), return it
  if (cleaned.length > 0) {
    return cleaned;
  }

  return "An unexpected issue occurred while processing your request. Please try again.";
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined" && window.location.hostname.includes("ngrok")) {
    headers["ngrok-skip-browser-warning"] = "true";
  }
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (jwtAccessToken) headers["Authorization"] = `Bearer ${jwtAccessToken}`;
  const shouldBeIdempotent = options.idempotent ?? (method === "POST" && !path.startsWith("/auth/"));
  if (shouldBeIdempotent) headers["Idempotency-Key"] = generateUUID();

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      credentials: "include",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (err: any) {
    throw new Error(toHumanErrorMessage(err));
  }
  
  // Silent auto-refresh on 401 when using JWT
  if (response.status === 401 && (jwtAccessToken || jwtRefreshToken) && path !== "/auth/refresh" && path !== "/auth/login") {
    const refreshedAccessToken = await refreshAccessToken();
    if (refreshedAccessToken) {
      headers["Authorization"] = `Bearer ${refreshedAccessToken}`;
      try {
        response = await fetch(`${baseUrl()}${path}`, {
          method,
          credentials: "include",
          headers,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
        });
      } catch (err: any) {
        throw new Error(toHumanErrorMessage(err));
      }
    }
  }

  if (response.status === 401 && path !== "/auth/login" && path !== "/auth/refresh" && path !== "/auth/me") {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("edops:session-expired"));
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
    if (typeof response.text === "function") {
      const rawText = await response.text();
      if (rawText && rawText.trim().length > 0) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { message: rawText };
        }
      }
    } else if (typeof response.json === "function") {
      data = await response.json();
    }
  }
  if (!response.ok) {
    const rawMessage = Array.isArray(data?.message) ? data.message.join("; ") : (data?.message || data?.error);
    const humanMessage = toHumanErrorMessage(rawMessage, response.status);
    const err = new Error(humanMessage) as any;
    if (data?.errors && Array.isArray(data.errors)) {
      err.errors = data.errors;
    }
    throw err;
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

export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const isBrowser = typeof window !== "undefined";
  const isGet = !options.method || options.method === "GET";
  const canCache = isBrowser && isGet && !options.noCache && !path.startsWith("/auth/");
  const cacheKey = `${jwtAccessToken || "anon"}:${path}`;

  if (canCache) {
    const cached = apiGetCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    const pending = pendingGetRequests.get(cacheKey);
    if (pending) {
      return pending as Promise<T>;
    }
  }

  const execute = async () => {
    try {
      const data = await request<T>(path, options);
      if (canCache) {
        apiGetCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: options.ttlMs ?? 30_000,
        });
      } else if (isBrowser && !isGet) {
        // Automatically invalidate cached GET requests on mutations so UI always reflects changes
        invalidateApiCache();
      }
      return data;
    } catch (error: any) {
      if (isBrowser && !options.silent && !path.startsWith("/auth/")) {
        const isAbort = error?.name === "AbortError" || error?.name === "DOMException";
        const isNetworkAbort = error?.message === "Failed to fetch" || error?.message === "Load failed";
        const isMutation = !!options.method && options.method !== "GET";

        if (!isAbort && (isMutation || !isNetworkAbort)) {
          window.dispatchEvent(
            new CustomEvent("edops:request-error", {
              detail: {
                message: error instanceof Error ? error.message : "Request failed",
                mutation: isMutation,
              },
            })
          );
        }
      }
      throw error;
    } finally {
      if (canCache) {
        pendingGetRequests.delete(cacheKey);
      }
    }
  };

  if (canCache) {
    const p = execute();
    pendingGetRequests.set(cacheKey, p);
    return p;
  }

  return execute();
}
