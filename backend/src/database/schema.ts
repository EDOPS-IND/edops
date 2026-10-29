import { pgTable, uuid, varchar, text, timestamp, boolean, integer, date, doublePrecision, jsonb, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// Core Identity & Multi-Tenancy Tables (public schema)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  name: varchar('name', { length: 120 }).default('').notNull(),
  phone: varchar('phone', { length: 32 }),
  gender: varchar('gender', { length: 32 }),
  dob: date('dob'),
  passwordHash: text('password_hash').notNull(),
  isPlatformAdmin: boolean('is_platform_admin').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 63 }).notNull().unique(),
  timeZone: varchar('time_zone', { length: 100 }).notNull(),
  locale: varchar('locale', { length: 16 }).notNull(),
  status: varchar('status', { length: 16 }).default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable('memberships', {
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'school_admin' | 'principal' | 'teacher' | 'student' | 'parent'
  specialty: varchar('specialty', { length: 100 }),
  employeeId: varchar('employee_id', { length: 50 }),
  employmentType: varchar('employment_type', { length: 50 }),
  gender: varchar('gender', { length: 32 }),
  dob: date('dob'),
  status: varchar('status', { length: 16 }).default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.organizationId, table.userId] }),
]);

export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  email: varchar('email', { length: 254 }).notNull(),
  name: varchar('name', { length: 120 }),
  phone: varchar('phone', { length: 32 }),
  role: varchar('role', { length: 20 }).default('school_admin').notNull(),
  specialty: varchar('specialty', { length: 100 }),
  sectionId: uuid('section_id'),
  childStudentIds: jsonb('child_student_ids'),
  employeeId: varchar('employee_id', { length: 50 }),
  employmentType: varchar('employment_type', { length: 50 }),
  gender: varchar('gender', { length: 32 }),
  dob: date('dob'),
  rawToken: varchar('raw_token', { length: 128 }),
  batchId: uuid('batch_id'),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  invitedBy: uuid('invited_by').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id'),
  actorId: uuid('actor_id'),
  action: varchar('action', { length: 80 }).notNull(),
  details: jsonb('details').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Academics Domain Tables (public schema)
// ============================================================================

export const academicYears = pgTable('academic_years', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  isCurrent: boolean('is_current').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const programs = pgTable('programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  sequenceOrder: integer('sequence_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  code: varchar('code', { length: 32 }).notNull(),
  isElective: boolean('is_elective').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  academicYearId: uuid('academic_year_id').references(() => academicYears.id).notNull(),
  programId: uuid('program_id').references(() => programs.id).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  capacity: integer('capacity').notNull(),
  classTeacherUserId: uuid('class_teacher_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const classSubjectAssignments = pgTable('class_subject_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  teacherUserId: uuid('teacher_user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  studentUserId: uuid('student_user_id').references(() => users.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  academicYearId: uuid('academic_year_id').references(() => academicYears.id).notNull(),
  rollNumber: varchar('roll_number', { length: 32 }).notNull(),
  status: varchar('status', { length: 16 }).default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Teaching & Assessment Tables (public schema)
// ============================================================================

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: varchar('description', { length: 8000 }).default('').notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  maxScore: doublePrecision('max_score').notNull(),
  status: varchar('status', { length: 16 }).default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  assignmentId: uuid('assignment_id').references(() => assignments.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  content: varchar('content', { length: 8000 }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  score: doublePrecision('score'),
  feedback: varchar('feedback', { length: 4000 }),
  gradedBy: uuid('graded_by'),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
  status: varchar('status', { length: 16 }).default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceSessions = pgTable('attendance_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  subjectId: uuid('subject_id'),
  date: date('date').notNull(),
  period: integer('period').notNull(),
  takenBy: uuid('taken_by').references(() => users.id).notNull(),
  status: varchar('status', { length: 16 }).default('draft').notNull(),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  attendanceSessionId: uuid('attendance_session_id').references(() => attendanceSessions.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 16 }).notNull(), // 'present' | 'absent' | 'late'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const examEvaluations = pgTable('exam_evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  sectionId: uuid('section_id').references(() => sections.id).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.id).notNull(),
  title: varchar('title', { length: 120 }).notNull(),
  maxMarks: doublePrecision('max_marks').default(100).notNull(),
  weightage: doublePrecision('weightage').default(20).notNull(),
  studentScores: jsonb('student_scores').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const arenaQuestions = pgTable('arena_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  programId: uuid('program_id'),
  sectionId: uuid('section_id').notNull(),
  subjectId: uuid('subject_id').notNull(),
  createdBy: uuid('created_by').notNull(),
  chapter: varchar('chapter', { length: 100 }).default('').notNull(),
  topic: varchar('topic', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 10 }) .notNull(),
  questionType: varchar('question_type', { length: 20 }).notNull(),
  content: jsonb('content').notNull(),
  answerKey: jsonb('answer_key').notNull(),
  tags: text('tags').array().notNull(),
  maxScore: integer('max_score').notNull(),
  status: varchar('status', { length: 16 }).default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const arenaAttempts = pgTable('arena_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  questionId: uuid('question_id').references(() => arenaQuestions.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  submittedAnswer: jsonb('submitted_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recordedSessions = pgTable('recorded_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  sectionId: uuid('section_id').notNull(),
  subjectId: uuid('subject_id').notNull(),
  uploadedBy: uuid('uploaded_by').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  contentType: varchar('content_type', { length: 32 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  checksumSha256: varchar('checksum_sha256', { length: 44 }).notNull(),
  objectKey: text('object_key').notNull(),
  objectVersion: text('object_version'),
  status: varchar('status', { length: 16 }).default('uploading').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
