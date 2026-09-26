# EDOPS School SaaS — Product Requirements & Low-Level Design (LLD)

> **Document Version:** 1.0.0  
> **Target Audience:** Product Engineers, Solution Architects, System Auditors  
> **Scope:** Milestones 1–6 (Multi-Tenant Core, Academics, Teaching, Content & Outbox, Arena, Billing & Entitlements)

---

## 1. Product Overview & Vision

**EDOPS** is an enterprise-grade B2B multi-tenant Learning Management System (LMS) and school operations platform engineered for K-12 schools, colleges, and training academies. 

### 1.1 Commercial & Tenancy Model
- Sold exclusively to institutions (schools/organizations), never directly to individual teachers, parents, or students.
- Strict isolation: Each organization operates as an isolated tenant with dedicated academic calendars, student rosters, grading scorecards, and media assets.
- Dual-layer tenant isolation:
  1. Application-level tenant scoping (`organization_id` on all queries and transactional harnesses).
  2. PostgreSQL Row-Level Security (`set_config('app.current_org_id', $1, true)`) enforced across tenant tables.

---

## 2. Actors & Role Hierarchy

| Role | Scope | Key Capabilities |
|---|---|---|
| **Platform Administrator** (`platform_admin`) | Global (Cross-Tenant) | Bootstrapped via CLI. Provisions new school organizations, issues root invitations, manages global pricing plans, activates/suspends schools, views aggregate platform telemetry, and issues manual billing records. |
| **School Administrator** (`school_admin`) | Tenant-Scoped | Manages school configuration (name, timezone, locale). Provisions teachers and students individually or via bulk CSV imports. Configures academic years, programs, classes, sections, and subjects. Manages teacher assignments. |
| **Teacher** (`teacher`) | Section/Subject Assigned | Accesses only assigned sections and subjects. Creates and publishes assignments, grades student submissions with qualitative feedback, conducts and finalizes attendance sessions, publishes video recordings, and creates practice questions. |
| **Student** (`student`) | Section Enrolled | Views class timeline, personal notifications, enrolled assignments, submissions and grades, finalized attendance history, recorded lecture playbacks, and practice Arena questions. |
| **Parent** (`parent`) | Dependent Student | Read-only observation of linked student's performance, attendance history, and school notices (provisioned in core schema). |

---

## 3. Detailed Functional Requirements (M1 – M6)

### 3.1 Milestone 1: Identity, Authentication & Multi-Tenancy
- **Authentication**: Stateful sessions backed by PostgreSQL (`connect-pg-simple`), HTTP-only secure cookies (`edops_session` / `__Host-edops_session`).
- **Cryptographic Security**:
  - Native Node.js `scrypt` (`N=32768, r=8, p=3`) with 16-byte random salts.
  - Constant-time verification (`timingSafeEqual`) to neutralize timing attacks.
  - Double-submit CSRF protection (`csrf-sync`) using 32-byte session-synchronized tokens.
  - Maximum 8-hour session lifetime.
- **Tenant Management**:
  - Alphanumeric kebab-case unique slug per organization.
  - Configurable IANA timezone and locale (`en-IN`, `hi-IN`, `en-US`).
  - School suspension mechanism immediately preventing non-platform API interactions.
- **Invitation Flow**:
  - One-time invitation tokens (48-hour expiration) hashed via SHA-256 before database storage.
  - Token acceptance supports logging into existing active accounts or creating new accounts with minimum 12-character passwords.

### 3.2 Milestone 2: Academic Hierarchy & Member Roster
- **Academic Structure**:
  - `AcademicYear` with non-overlapping date bounds and current flag.
  - `Program` (Grades/Degrees) with integer sequence ordering.
  - `Section` linked to Year and Program with capacity limits (1–5000).
  - `Subject` (Code + Name) and `ClassSubjectAssignment` mapping teachers to specific section-subject pairs.
- **Student Enrollment Lifecycle**:
  - Active, Transferred, or Withdrawn student states. Unique roll numbers per section.
- **Batch Provisioning & Idempotency**:
  - Bulk JSON and streaming CSV roster import (up to 100 entries per batch, max 12 KB payload).
  - 24-hour AES-256-GCM encrypted idempotency caching keyed by `(organization_id, actor_id, Idempotency-Key)`. Replays exact outcomes on identical request hashes; rejects collisions with `409 Conflict`.

### 3.3 Milestone 3: Teaching, Attendance & Materialized Scorecards
- **Assignments Workflow**:
  - Status progression: `draft` → `published`.
  - Immutable once published. Future-dated deadlines (`dueAt > now()`).
  - Automatic student submission record initialization upon publication for all active enrollments.
- **Submissions & Grading**:
  - Plain-text submission content up to 8,000 characters.
  - Submission statuses: `pending` → `submitted` / `late` → `graded`.
  - Post-deadline resubmissions prohibited if work was already submitted.
  - Teacher grading: score (`0 <= score <= max_score`) and qualitative feedback.
- **Attendance Engine**:
  - Date constrained within active academic year and not in the future relative to school timezone.
  - Session statuses: `draft` → `finalized`.
  - Marking options: `present`, `absent`, `late`, `excused`.
  - Uniqueness constraint prevents duplicate attendance sessions for the same class/period/date.
- **Transactional Scorecards**:
  - Materialized scorecard table aggregating assignment submission counts, completion percentages, weighted average grades, attended vs counted session percentages, and practice Arena attempts.
  - Recalculated transactionally with single-student scoping on submissions, grading, and arena attempts to avoid lock contention.

### 3.4 Milestone 4: Communication Timeline, Notifications & S3 Recordings
- **Transactional Outbox Engine**:
  - Events emitted atomically in the same database transaction as domain writes (`domain_events` + `event_recipients`).
  - Decoupled worker process drains pending events via `FOR UPDATE SKIP LOCKED`.
  - Exponential backoff with jitter on projection failures; records detailed error diagnostics.
- **Feeds & Notifications**:
  - School timeline events filtered by section/subject enrollments.
  - Personal student inbox with read tracking and unread counts.
- **Private Versioned Recordings**:
  - Multi-step media upload lifecycle: `uploading` → `ready` → `published` → `archived`.
  - Presigned S3 `PUT` URLs (1-hour expiry) enforcing SHA-256 checksums, content-type headers, and `If-None-Match: *`.
  - Upload verification validates S3 object version, byte length, and file magic bytes (MP4 `ftyp` / WebM `0x1a45dfa3`) before marking `ready`.
  - Short-lived presigned `GET` playback URLs (2-minute expiry).

### 3.5 Milestone 5: Objective Arena Practice
- **Class-Scoped Question Bank**:
  - Formats: Single choice (exactly 1 correct answer) and Multiple choice (>= 1 correct answer).
  - Draft, published, and archived states. Answer keys securely excluded from public student views.
  - Categorized by topic, difficulty (`easy`, `medium`, `hard`), and string tags.
- **Deterministic Auto-Grading**:
  - Student attempts auto-graded immediately without asynchronous jobs or external LLM dependencies.
  - Immediate scorecard aggregate refresh (attempts count, question count, highest percentage score).

### 3.6 Milestone 6: Platform Billing, Entitlements & Telemetry
- **Subscription Engine**:
  - Global immutable `plans` specifying currency (`INR`), monthly billing cycle, max student/teacher seats, and feature flags (`arena`, `recordings`, `communication`).
  - Automatic 30-day default trial period for new institutions.
  - Per-tenant feature overrides allowing platform administrators to toggle specific capabilities (`inherit`, `enabled`, `disabled`).
- **Seat Enforcement**:
  - Active and pending unexpired invitations consume student and teacher seat quotas.
  - Over-quota invitations and reactivations rejected with `409 Conflict`.
- **Manual Invoicing Ledger**:
  - Platform-issued manual invoices with period bounds validation (`tstzrange` non-overlap).
  - Offline payment reconciliation with reference tracking and voiding controls.
- **Platform Telemetry**:
  - Aggregate statistics per organization: published assignments, verified storage bytes, arena attempts, open/paid invoice sums, seat capacity utilization.

---

## 4. Non-Functional Requirements (NFRs)

- **Security & Network Constraints**:
  - Strict CORS origin whitelisting (HTTPS enforced in production).
  - Production database connection requires non-superuser and non-`rolbypassrls` role.
  - Rate limiting via NestJS Throttler: 10 requests/minute on `/auth/login` and `/auth/invitations/accept`; 120 requests/minute on standard endpoints.
  - Payload limits: 16 KB for JSON bodies; 12 KB for CSV batch imports.
- **Performance & Scalability**:
  - Sub-50ms p95 on all read queries via composite indexes starting with `organization_id`.
  - Background outbox processing ensures domain write latencies remain independent of notification dispatch.
- **Auditability**:
  - Transactional audit log table (`audit_events`) capturing actor UUID, organization UUID, action verb, timestamp, and metadata for every mutative operation.

---

## 5. Low-Level Design (LLD) & Architectural Diagrams

### 5.1 System Architecture & Middleware Pipeline

```mermaid
flowchart TD
    Client["Client Browser / Mobile Agent"] -->|HTTPS + Credentials| Helmet["Helmet (Security Headers)"]
    Helmet --> CORS["Origin Verifier (Strict CORS Whitelist)"]
    CORS --> BodyParser["express.json (Max 16KB)"]
    BodyParser --> SessionMW["express-session (PostgreSQL Store)"]
    SessionMW --> CSRF["CSRF Protection (csrf-sync)"]
    CSRF --> Throttler["ThrottlerGuard (Rate Limiter)"]
    Throttler --> AuthGuard["AuthGuard (@Public / Session / @PlatformAdmin)"]
    AuthGuard --> Validation["Global ValidationPipe (class-validator)"]
    Validation --> SchoolWork["SchoolWork Execution Harness"]
    
    subgraph TransactionHarness["SchoolWork / Unit of Work"]
        SchoolWork --> CheckAuth["Validate Membership Role & Status"]
        CheckAuth --> LockOrg["Pessimistic Lock on Organization"]
        LockOrg --> SetRLS["SET LOCAL app.current_org_id = orgId"]
        SetRLS --> CheckIdemp{"Idempotency-Key Present?"}
        CheckIdemp -->|Yes & Cached| DecryptReplay["Decrypt AES-256-GCM Replay"]
        CheckIdemp -->|No or New| ExecService["Execute Domain Service Logic"]
        ExecService --> WriteAudit["Record Audit Log Event"]
        ExecService --> StoreIdemp["Encrypt & Save Idempotency Record"]
    end
    
    DecryptReplay --> Client
    StoreIdemp --> Client
    
    subgraph Storage & Workers["Asynchronous & External"]
        ExecService -.->|Append Event| DBOutbox[("domain_events table")]
        DBOutbox --> OutboxWorker["Outbox Background Daemon"]
        OutboxWorker --> TimelineProj["Project to timeline & notifications"]
        ExecService -.->|Presigned URLs| AWSS3[("AWS S3 Private Bucket")]
    end
```

---

### 5.2 Entity Relationship Diagram (Core Data Model)

```mermaid
erDiagram
    users ||--o{ memberships : has
    users ||--o{ invitations : receives
    organizations ||--o{ memberships : contains
    organizations ||--o{ invitations : issues
    organizations ||--o{ academic_years : defines
    organizations ||--o{ programs : defines
    organizations ||--o{ subscriptions : subscribes
    organizations ||--o{ invoices : receives

    academic_years ||--o{ sections : contains
    programs ||--o{ sections : organizes
    sections ||--o{ enrollments : registers
    sections ||--o{ class_subject_assignments : assigns
    subjects ||--o{ class_subject_assignments : categorizes
    
    sections ||--o{ assignments : hosts
    subjects ||--o{ assignments : categorizes
    assignments ||--o{ submissions : generates
    users ||--o{ submissions : submits

    sections ||--o{ attendance_sessions : conducts
    subjects ||--o{ attendance_sessions : optionally_covers
    attendance_sessions ||--o{ attendance_records : records
    users ||--o{ attendance_records : marks

    sections ||--o{ recorded_sessions : stores
    subjects ||--o{ recorded_sessions : categorizes

    sections ||--o{ arena_questions : banks
    subjects ||--o{ arena_questions : categorizes
    arena_questions ||--o{ arena_attempts : attempts
    users ||--o{ arena_attempts : answers

    sections ||--o{ scorecards : compiles
    subjects ||--o{ scorecards : compiles
    users ||--o{ scorecards : summarizes

    organizations ||--o{ domain_events : logs
    domain_events ||--o{ event_recipients : targets
    domain_events ||--o{ timeline_events : projects
    domain_events ||--o{ notifications : creates

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        boolean is_platform_admin
        boolean is_active
        timestamptz created_at
    }

    organizations {
        uuid id PK
        varchar name
        varchar slug UK
        varchar time_zone
        varchar locale
        varchar status
        timestamptz created_at
    }

    memberships {
        uuid organization_id PK,FK
        uuid user_id PK,FK
        varchar role
        varchar status
        timestamptz created_at
    }

    assignments {
        uuid id PK
        uuid organization_id FK
        uuid section_id FK
        uuid subject_id FK
        varchar title
        varchar description
        timestamptz due_at
        float max_score
        varchar status
        timestamptz published_at
    }

    submissions {
        uuid id PK
        uuid organization_id FK
        uuid assignment_id FK
        uuid student_id FK
        varchar content
        timestamptz submitted_at
        float score
        varchar feedback
        varchar status
    }

    scorecards {
        uuid organization_id PK,FK
        uuid student_id PK,FK
        uuid section_id PK,FK
        uuid subject_id PK,FK
        int assignment_count
        int submitted_count
        int graded_count
        float avg_score
        float completion_pct
        int attendance_count
        int attended_count
        float attendance_pct
        int arena_attempt_count
        int arena_question_count
        float arena_score
        timestamptz generated_at
    }
```

---

### 5.3 Sequence Diagram: Assignment Creation, Publishing & Grading

```mermaid
sequenceDiagram
    autonumber
    participant T as Teacher (Client)
    participant Ctrl as TeachingController
    participant Svc as AssignmentsService
    participant SW as SchoolWork
    participant DB as PostgreSQL
    participant Score as ScorecardsService
    participant OB as OutboxService

    Note over T,Ctrl: Step 1: Draft Assignment
    T->>Ctrl: POST /assignments (title, dueAt, maxScore, Idempotency-Key)
    Ctrl->>Svc: create(orgId, actor, dto, key)
    Svc->>SW: run(assignment.created)
    SW->>DB: INSERT INTO assignments (status='draft')
    SW->>DB: INSERT INTO audit_events
    SW-->>T: 201 Created (Assignment Draft)

    Note over T,Ctrl: Step 2: Publish Assignment
    T->>Ctrl: POST /assignments/:id/publish (Idempotency-Key)
    Ctrl->>Svc: publish(orgId, actor, id, key)
    Svc->>SW: run(assignment.published)
    SW->>DB: UPDATE assignments SET status='published', published_at=now()
    SW->>DB: INSERT INTO submissions (student_id) SELECT active enrolled students
    SW->>Score: refresh(org, sectionId, subjectId)
    Score->>DB: Recalculate scorecards for section
    SW->>OB: append(assignment.published)
    OB->>DB: INSERT INTO domain_events & event_recipients
    SW-->>T: 200 OK (Published Assignment)

    Note over T,Ctrl: Step 3: Student Submits & Teacher Grades
    participant S as Student (Client)
    S->>Ctrl: POST /assignments/:id/submit (content, Idempotency-Key)
    Ctrl->>Svc: submit(orgId, student, id, dto, key)
    Svc->>SW: run(submission.submitted)
    SW->>DB: UPDATE submissions SET content, status, submitted_at
    SW->>Score: refresh(org, sectionId, subjectId, studentId)
    SW-->>S: 200 OK (Submission)

    T->>Ctrl: PATCH /submissions/:id/grade (score, feedback)
    Ctrl->>Svc: grade(orgId, teacher, id, dto)
    Svc->>SW: run(submission.graded)
    SW->>DB: UPDATE submissions SET score, feedback, status='graded'
    SW->>Score: refresh(org, sectionId, subjectId, studentId)
    SW->>OB: append(submission.graded)
    SW-->>T: 200 OK (Graded Submission)
```

---

### 5.4 Sequence Diagram: Asynchronous Outbox Worker Loop

```mermaid
sequenceDiagram
    autonumber
    participant W as Outbox Worker (CLI Daemon)
    participant DB as PostgreSQL
    participant TML as timeline_events Table
    participant NOTIF as notifications Table

    loop Every Poll Interval (1 sec or batch drain)
        W->>DB: BEGIN Transaction
        W->>DB: SELECT id FROM organizations WHERE status='active' LIMIT 100
        W->>DB: SET LOCAL app.current_org_id = :orgId
        W->>DB: SELECT id, attempts FROM domain_events<br/>WHERE processed_at IS NULL AND failed_at IS NULL<br/>AND available_at <= now()<br/>ORDER BY occurred_at FOR UPDATE SKIP LOCKED LIMIT 1
        
        alt Event Found
            W->>DB: SAVEPOINT project_event
            W->>DB: INSERT INTO timeline_events (event_id) VALUES (:id) ON CONFLICT DO NOTHING
            W->>DB: INSERT INTO notifications (event_id, user_id)<br/>SELECT event_id, user_id FROM event_recipients<br/>WHERE event_id=:id ON CONFLICT DO NOTHING
            W->>DB: UPDATE domain_events SET processed_at=clock_timestamp(), last_error=NULL
            W->>DB: RELEASE SAVEPOINT project_event
            W->>DB: COMMIT Transaction
        else Projection Fails
            W->>DB: ROLLBACK TO SAVEPOINT project_event
            W->>DB: UPDATE domain_events SET attempts = attempts + 1,<br/>last_error = :errorMessage,<br/>available_at = now() + (2^attempts * interval '1s'),<br/>failed_at = CASE WHEN attempts >= 5 THEN now() ELSE NULL END
            W->>DB: COMMIT Transaction
        else No Events Available
            W->>DB: COMMIT / Sleep 1000ms
        end
    end
```

---

### 5.5 State Transition Diagrams

#### A. Invitation Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Pending: School Admin creates invite (48h expiry)
    Pending --> Accepted: POST /auth/invitations/accept (valid token)
    Pending --> Revoked: PATCH /invitations/:id/revoke
    Pending --> Expired: now() > expires_at
    Accepted --> [*]
    Revoked --> [*]
    Expired --> [*]
```

#### B. Assignment & Submission Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Draft: Teacher creates assignment
    Draft --> Published: POST /assignments/:id/publish (allocates submissions)
    
    state "Submission Record" as Sub {
        [*] --> PendingWork: Seeded on publish
        PendingWork --> Submitted: Student submits before due_at
        PendingWork --> Late: Student submits after due_at
        Submitted --> Graded: Teacher grades submission
        Late --> Graded: Teacher grades submission
    }
    
    Published --> [*]
```

#### C. Video Lecture Recording Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Uploading: Teacher registers recording metadata
    Uploading --> Ready: S3 upload verified (Magic bytes + SHA-256)
    Ready --> Published: POST /recordings/:id/publish (triggers outbox event)
    Ready --> Archived: PATCH /recordings/:id/archive
    Published --> Archived: Teacher archives recording
    Archived --> [*]
```

---

## 6. Security & Multi-Tenant Isolation Specifications

### 6.1 PostgreSQL Row-Level Security (RLS) Matrix

Each tenant table (M2–M6) enforces RLS policies via:
```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <table> FORCE ROW LEVEL SECURITY;

CREATE POLICY <table>_tenant_isolation ON <table>
    FOR ALL
    USING (organization_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);
```

| Table Category | Tables Enforced | RLS Scope Rule |
|---|---|---|
| **Academic Hierarchy** | `academic_years`, `programs`, `subjects`, `sections`, `class_subject_assignments`, `enrollments` | `organization_id` matched against session setting |
| **Teaching & Evaluation** | `assignments`, `submissions`, `attendance_sessions`, `attendance_records`, `scorecards` | `organization_id` matched against session setting |
| **Media & Content** | `recorded_sessions` | `organization_id` matched against session setting |
| **Practice Arena** | `arena_questions`, `arena_attempts` | `organization_id` matched against session setting |
| **Communication** | `domain_events`, `event_recipients`, `timeline_events`, `notifications` | `organization_id` matched against session setting |
| **Billing & Features** | `subscriptions`, `feature_flags`, `invoices` | `organization_id` matched against session setting |
| **Global Non-RLS Tables** | `users`, `organizations`, `memberships`, `invitations`, `plans`, `audit_events`, `sessions` | Application-level isolation via parameterized queries |

---

## 7. Verification & Operational Runbooks

### 7.1 Local Development Commands
```bash
# 1. Install dependencies
npm ci

# 2. Apply database migrations
npm run db:migrate

# 3. Bootstrap platform administrator
npm run bootstrap:admin -- admin@edops.internal

# 4. Start HTTP API server
npm run start:dev

# 5. Start background outbox daemon
npm run worker
```

### 7.2 Core Invariants
1. **No Anonymous Mutations:** Every mutative endpoint requires both a valid session cookie and a valid `X-CSRF-Token` header.
2. **Deterministic Auto-Grading:** Objective practice questions never consult external inference models; correctness is computed against strict option ID equality.
3. **Idempotent Write Safety:** Replayed requests with matching `Idempotency-Key` and payload hash return cached ciphertext without re-executing business mutations.
