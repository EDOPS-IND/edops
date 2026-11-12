export type Role = "school_admin" | "teacher" | "student";

export type ClassRoom = {
  sectionId: string;
  sectionName: string;
  academicYearId: string;
  subjectId: string;
  subjectName: string;
  teacherUserId: string;
  programId?: string;
  programName?: string;
};

export type Assignment = {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  maxScore: number;
  status: "draft" | "published";
  sectionId: string;
  subjectId: string;
};

export type Submission = {
  id: string;
  studentId: string;
  content: string | null;
  submittedAt: string | null;
  score: number | null;
  feedback: string | null;
  status: "pending" | "submitted" | "late" | "graded";
};

export type AttendanceSession = {
  id: string;
  sectionId: string;
  subjectId: string | null;
  date: string;
  period: number;
  status: "draft" | "finalized";
};

export type AttendanceRecord = {
  id: string;
  studentId: string;
  status: "present" | "absent" | "late" | "excused" | null;
};

export type RosterStudent = {
  studentId: string;
  rollNumber: string;
  email: string;
  studentName?: string;
};

export type ExamEvaluation = {
  id: string;
  organizationId: string;
  sectionId: string;
  subjectId: string;
  title: string;
  maxMarks: number;
  weightage: number;
  myScore?: number | null;
  studentScores?: Record<string, number>;
  createdAt: string;
};

export type Notification = {
  id: string;
  eventType: string;
  resourceId: string;
  sectionId: string;
  subjectId: string | null;
  occurredAt: string;
  readAt: string | null;
};

export type Inbox = {
  items: Notification[];
  total: number;
  unreadCount: number;
};

export type Recording = {
  id: string;
  title: string;
  recordedAt: string;
  durationSeconds: number;
  contentType: string;
  sizeBytes: number;
  status: "uploading" | "ready" | "published" | "archived";
};

export type ArenaQuestion = {
  id: string;
  programId?: string | null;
  chapter: string;
  topic: string;
  difficulty: string;
  questionType: "single_choice" | "multiple_choice" | "subjective";
  content: {
    prompt: string;
    options?: { id: string; text: string }[];
    modelAnswer?: string;
    rubric?: string;
  };
  tags: string[];
  maxScore: number;
  status: "draft" | "published" | "archived";
};

export type ArenaAttempt = {
  id: string;
  questionId: string;
  submittedAnswer: string[];
  isCorrect: boolean;
  score: number;
  maxScore: number;
  createdAt: string;
};

export type Scorecard = {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  rollNumber?: string;
  assignmentCount: number;
  submittedCount: number;
  gradedCount: number;
  avgScore: number | null;
  completionPct: number | null;
  attendancePct: number | null;
  arenaAttemptCount: number;
  arenaScore: number | null;
  attendanceCount?: number;
  attendedCount?: number;
};

export type BillingOverview = {
  subscription: null | { status: string; periodStart: string; periodEnd: string };
  entitlements: {
    status: string;
    periodStart: string;
    periodEnd: string;
    implicitTrial: boolean;
    entitled: boolean;
    maxStudents: number;
    maxTeachers: number;
    features: Record<string, boolean>;
  };
  usage: {
    students: number;
    teachers: number;
    pendingStudents: number;
    pendingTeachers: number;
  };
  overrides: { feature: string; enabled: boolean }[];
};

export type Invoice = {
  id: string;
  amountMinor: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  paymentReference: string | null;
  paidAt: string | null;
};

export type Tab = "assignments" | "attendance" | "updates" | "recordings" | "arena" | "progress";
