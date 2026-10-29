# EDOPS — Enterprise B2B Multi-Tenant School Operations Platform & LMS

[![Backend](https://img.shields.io/badge/Backend-NestJS%2011%20%7C%20TypeORM%20%7C%20Drizzle-E0234E?style=flat-square&logo=nestjs)](./backend)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%20%7C%20Vinext%20%7C%20React%2019-000000?style=flat-square&logo=nextdotjs)](./frontend)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20%28RLS%29-336791?style=flat-square&logo=postgresql)](./backend/compose.yaml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](./tsconfig.json)
[![API Docs](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=flat-square&logo=swagger)](http://127.0.0.1:3001/api/docs)

**EDOPS** is an enterprise-grade, institutional B2B multi-tenant Learning Management System (LMS) and comprehensive School Operations Platform. Engineered specifically for K-12 schools, higher education institutions, and educational networks, EDOPS unifies academic planning, student rosters, assignment lifecycles, attendance tracking, lecture recordings, objective practice arenas, fee ledgers, and multi-persona portals into an isolated, secure, and resilient platform.

---

## 📑 Table of Contents

1. [Executive Overview & Tenancy Architecture](#1-executive-overview--tenancy-architecture)
2. [System Requirements & Prerequisites](#2-system-requirements--prerequisites)
3. [Quick Start (One-Command Launch)](#3-quick-start-one-command-launch)
4. [Role Hierarchy & Access Boundaries](#4-role-hierarchy--access-boundaries)
5. [Milestone Capabilities Breakdown (M1 – M6+)](#5-milestone-capabilities-breakdown-m1--m6)
6. [Comprehensive File & Directory Guide ("Which File is for What")](#6-comprehensive-file--directory-guide-which-file-is-for-what)
   - [Root Directory](#61-root-directory)
   - [Backend Architecture (`backend/`)](#62-backend-architecture-backend)
   - [Frontend Architecture (`frontend/`)](#63-frontend-architecture-frontend)
   - [Domain Modules Breakdown](#64-domain-modules-breakdown)
   - [Frontend Role Workspaces & Panes](#65-frontend-role-workspaces--panes)
7. [Source of Truth & System Impact Matrix ("Where Everything is Defined & What It Affects")](#7-source-of-truth--system-impact-matrix-where-everything-is-defined--what-it-affects)
   - [Master Data Flow & Cascade Lifecycle](#71-master-data-flow--cascade-lifecycle)
   - [Domain-by-Domain Source of Truth & Downstream Impact Matrix](#72-domain-by-domain-source-of-truth--downstream-impact-matrix)
   - [Deep-Dive Ripple Effects per Key Entity & Mutation](#73-deep-dive-ripple-effects-per-key-entity--mutation)
   - [Developer Ripple Effect Rulebook ("If You Modify X, You Must Update Y")](#74-developer-ripple-effect-rulebook-if-you-modify-x-you-must-update-y)
8. [Environment Variables & Configuration](#8-environment-variables--configuration)
9. [API Architecture & Swagger Documentation](#9-api-architecture--swagger-documentation)
10. [Security, Isolation & Regulatory Standards](#10-security-isolation--regulatory-standards)
11. [Troubleshooting & Maintenance Workflows](#11-troubleshooting--maintenance-workflows)

---

## 1. Executive Overview & Tenancy Architecture

### 1.1 Commercial & Tenancy Model
- **Institutional B2B SaaS**: EDOPS is licensed exclusively to schools and educational organizations. Individual teachers, parents, or students cannot register independently.
- **Strict Multi-Tenancy**: Every school operates as an isolated tenant with its own academic calendar, programs, sections, subjects, staff rosters, attendance logs, grading scorecards, and media vault.
- **Dual-Layer Tenant Isolation**:
  1. **Application-Level Scoping**: All database queries and transactional harnesses enforce explicit `organization_id` filters. Slugs and client-supplied identifiers never grant access on their own.
  2. **Database-Level Row-Level Security (RLS)**: Enforced via PostgreSQL session variables (`set_config('app.current_org_id', $1, true)`), guaranteeing physical data isolation across tenant tables even in the event of application logic anomalies.

### 1.2 Technology Stack
- **Backend API**: [NestJS 11](https://nestjs.com/) on Express 5, TypeScript 5.9, TypeORM 0.3 (schema migrations) paired with [Drizzle ORM](https://orm.drizzle.team/) for high-throughput, type-safe SQL queries.
- **Frontend Client**: [Next.js App Router](https://nextjs.org/) powered by [Vinext](https://github.com/cloudflare/vinext) & Vite 8, React 19, TypeScript 5.9, [Tailwind CSS 4](https://tailwindcss.com/), and [Lucide React](https://lucide.dev/) icons.
- **Primary Database**: PostgreSQL 16 (Alpine container with custom healthchecks, persistent volumes, and RLS policies).
- **Asynchronous Processing**: Transactional Outbox pattern backed by PostgreSQL `FOR UPDATE SKIP LOCKED` for reliable, decoupled notification and event dispatching without external broker overhead.
- **Object Storage**: Private versioned AWS S3 / MinIO storage with presigned short-lived PUT/GET capabilities.

---

## 2. System Requirements & Prerequisites

Before launching the platform, ensure your local development machine satisfies the following requirements:

| Component | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 22.13.0` | `22.14.0+ LTS` | `node -v` |
| **npm** | `>= 10.0.0` | `10.9.0+` | `npm -v` |
| **Docker** | `>= 24.0.0` | Latest Docker Desktop | `docker -v` |
| **Docker Compose** | `>= 2.20.0` | Latest Docker Desktop | `docker compose version` |
| **Operating System** | macOS (Apple Silicon/Intel), Ubuntu 22.04+ LTS, or Windows 11 with WSL2 | — | `uname -s` |

### Required Local Ports
Ensure the following ports are free before starting:
- **Port 3000**: Next.js / Vinext Frontend client
- **Port 3001**: NestJS Backend API service
- **Port 15432** or **5432**: PostgreSQL 16 database (Docker host binding on `15432` or native Postgres.app on `5432`)

*(Note: The provided [start.sh](start.sh) script automatically detects and frees stale processes listening on ports 3000 and 3001, and auto-detects active Postgres on port 5432 or 15432).*

---

## 3. Quick Start (One-Command Launch)

The platform includes a zero-config, unified automation script that provisions infrastructure, runs migrations, boots the backend and frontend in parallel, and opens your browser.

### 3.1 Launch All Services

From the project root:

```bash
npm start
# or alternatively:
bash start.sh
```

### 3.2 What `start.sh` Executes Automatically:
1. **Prerequisite Verification**: Checks for Node.js, Docker, and Docker daemon availability.
2. **Port Conflict Resolution**: Automatically clears any stale processes occupying port `3000` or `3001`.
3. **Database Detection & Initialization**: Checks for running PostgreSQL (Postgres.app on port `5432` or Docker Compose `backend/compose.yaml` on port `15432`). Starts and polls container until healthy if needed.
4. **Environment Initialization**: Generates a secure `backend/.env` with random cryptographic secrets if not already present.
5. **Schema Migration Execution**: Executes TypeORM schema migrations to prepare the database structure.
6. **Backend API Startup**: Launches the NestJS API with live TypeScript file watching (`http://127.0.0.1:3001`) and polls `/api/health` until ready.
7. **Frontend Startup**: Starts the Next.js / Vinext development server (`http://127.0.0.1:3000`).
8. **Browser Launch**: Automatically opens the web application at `http://localhost:3000`.
9. **Clean Teardown**: Intercepts `Ctrl+C` (SIGINT/SIGTERM) to gracefully stop all child processes and free ports.

### 3.3 Bootstrapping & Managing Platform Administrators
The root platform super administrator is initialized securely through the backend CLI without hardcoded credentials:

```bash
cd backend
npm run bootstrap:admin -- admin@your-school.org
```

To reset an existing administrator's credentials securely via CLI:

```bash
cd backend
npm run reset:admin -- admin@your-school.org
```

You will be prompted to enter a hidden password (12-128 characters). See [ACCOUNTS.md](ACCOUNTS.md) for institutional account onboarding details.

---

## 4. Role Hierarchy & Access Boundaries

```mermaid
flowchart TD
    PA["Platform Super Admin (Global Scope)"]
    PA -->|"Provisions & Suspends"| ORG["School Organization (Tenant)"]
    ORG --> SA["School Admin (Institutional Operations)"]
    ORG --> PR["Principal (Academic Leadership & Oversight)"]
    SA -->|"Manages Rosters & Structure"| PR
    SA --> T["Teacher (Classroom & Subject Scoped)"]
    PR -->|"Observes & Approves"| T
    T -->|"Teaches & Grades"| S["Student (Section Enrolled)"]
    P["Parent (Guardian Oversight)"] -.->|"Observes Ward"| S
    P -->|"Submits Leaves & PTM"| T
```

### Role Permissions Matrix

| Feature / Domain | Platform Admin | School Admin | Principal | Teacher | Student | Parent |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Organization Provisioning & Plans** |  Full | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Academic Structure (Years/Sections)** | ❌ No |  Full |  View/Plan | ❌ No | ❌ No | ❌ No |
| **Roster Provisioning (CSV/Bulk)** | ❌ No |  Full |  View | ❌ No | ❌ No | ❌ No |
| **Teacher Assignments to Classes** | ❌ No |  Full |  Approve | ❌ No | ❌ No | ❌ No |
| **Assignment Authoring & Grading** | ❌ No |  Audit |  Audit |  Full |  Submit |  View |
| **Attendance Taking & Finalization** | ❌ No |  Audit |  Audit |  Full |  View |  Leave Apply |
| **Practice Arena Question Authoring** | ❌ No |  View |  View |  Full | ❌ No | ❌ No |
| **Practice Arena Test Taking** | ❌ No | ❌ No | ❌ No | ❌ No |  Full |  View |
| **Lecture Recordings & Video Vault** | ❌ No |  View |  View |  Upload |  Watch |  View |
| **Fee Management & Invoicing** | ❌ No |  Full | ❌ No | ❌ No | ❌ No |  Pay / Receipt |
| **Teacher Workload & Observations** | ❌ No |  View |  Full | ❌ No | ❌ No | ❌ No |
| **Timetable Substitutions** | ❌ No |  View |  Full |  View |  View |  View |
| **PTM (Parent-Teacher Meeting) Slots** | ❌ No |  Config |  Audit |  Host | ❌ No |  Book |

---

## 5. Milestone Capabilities Breakdown (M1 – M6+)

The platform architecture is structured into robust, auditable functional milestones:

### 🔹 Milestone 1: Identity, Authentication & Multi-Tenancy
- **Stateful PostgreSQL Sessions**: Stored in the `sessions` table using HTTP-only, `SameSite=Lax` secure cookies (`edops_session` / `__Host-edops_session`).
- **Stateless JWT Tokens**: Optional Bearer token authentication supporting mobile or headless integrations with cryptographically hashed refresh tokens (`user_refresh_tokens`).
- **Cryptographic Security**: Native Node.js `scrypt` hashing with 16-byte random salts; constant-time equality comparisons (`timingSafeEqual`) to prevent timing side-channel attacks.
- **CSRF Protection**: Synchronized CSRF tokens (`csrf-sync`) enforced on every mutative operation (`POST`, `PATCH`, `DELETE`).
- **School Invitations**: Single-use 48-hour invitation tokens hashed with SHA-256 before storage; supports onboarding new users or linking existing accounts.
- **Tenant Management**: Alphanumeric kebab-case school slugs, IANA timezone support, and instant tenant suspension mechanics.

### 🔹 Milestone 2: Academic Hierarchy & Member Roster
- **Academic Structure**: Academic years (with date-bound constraints and current active year flag), Programs (grade levels with sequence ordering), Sections (capacity constraints 1–5,000), Subjects, and Class-Subject assignments.
- **Enrollment Lifecycle**: Student states (`active`, `transferred`, `withdrawn`) with unique roll numbers per class section.
- **Batch Provisioning**: Bulk JSON and streaming CSV roster imports (up to 100 entries per batch) with transactional validation.
- **Idempotency Guarantee**: 24-hour AES-256-GCM encrypted idempotency caching keyed by `(organization_id, actor_id, Idempotency-Key)`. Replays exact outcomes on identical request hashes; prevents duplicate roster generation.

### 🔹 Milestone 3: Teaching, Attendance & Scorecards
- **Assignment Engine**: Draft and published states, future-dated deadlines, automatic student submission record initialization upon assignment publication.
- **Student Submissions & Grading**: Plain-text submissions (up to 8,000 characters), submission states (`pending`, `submitted`, `late`, `graded`), teacher grading with qualitative remarks.
- **Attendance Registry**: Timezone-aware sessions constrained within the active academic year; statuses (`draft` → `finalized`); status markings (`present`, `absent`, `late`, `excused`).
- **Materialized Scorecards**: Real-time aggregation of assignment completion rates, weighted grade averages, attendance percentages, and practice attempts without locking conflicts.

### 🔹 Milestone 4: Communication, Notifications & Private Recordings
- **Transactional Outbox Engine**: Outbox events emitted atomically within the business transaction (`domain_events` + `event_recipients`).
- **Background Worker**: Dedicated worker process (`backend/src/worker.ts`) draining events via `FOR UPDATE SKIP LOCKED` with exponential backoff and jitter.
- **Class Timeline & Inbox**: Enrolled-section timeline broadcasts and personal in-app student/teacher inboxes.
- **Private Video Vault**: Presigned S3/MinIO upload URLs with SHA-256 checksums, content-type enforcement, and magic byte validation (MP4 `ftyp`, WebM `0x1a45dfa3`). Short-lived 2-minute presigned playback URLs.

### 🔹 Milestone 5: Objective Arena Practice
- **Question Bank**: Class-scoped single-choice and multiple-choice questions categorized by topic, difficulty (`easy`, `medium`, `hard`), and curriculum tags.
- **Instant Auto-Grading**: Deterministic grading logic executed immediately on attempt submission without external LLM latency or cost.
- **Practice Telemetry**: Real-time scorecards, attempt streaks, and mastery breakdown.

### 🔹 Milestone 6: Platform Billing, Entitlements & Telemetry
- **Subscription Engine**: Global tiered plans with monthly billing cycles, feature toggles (`arena`, `recordings`, `communication`), and automatic 30-day trial periods for new schools.
- **Seat Quotas**: Hard enforcement of student and teacher seat quotas. Over-quota invitations are rejected with `409 Conflict`.
- **Manual Invoicing Ledger**: Platform-issued manual invoices with non-overlapping period bounds (`tstzrange`), payment reference reconciliation, and invoice voiding.
- **Platform Telemetry**: Aggregate cross-school metrics (active seats, verified storage consumption, published assignments, invoice ledger).

### 🔹 Beyond M6: Specialized Enterprise Portals
- **Principal Academic Control Center**: Annual academic planning, timetable conflict resolution & teacher substitutions, classroom observation ratings, examination moderation, and Student 360 profile drawers.
- **School Admin Command Hub**: Complete staff, parent, and student directory, departmental hierarchies, fee management, transport/facility logs, and audit logs.
- **Parent Guardian Portal**: Multi-child switcher, digital leave request submission, fee dues and receipts, private teacher messaging, and Parent-Teacher Meeting (PTM) slot booking.

---

## 6. Comprehensive File & Directory Guide ("Which File is for What")

This section provides an exhaustive guide detailing the exact responsibilities of every major file and directory across the entire repository.

### 6.1 Root Directory

```text
EDOPS/
├── README.md                                   # Master project guide, architecture, and documentation (this file)
├── ACCOUNTS.md                                 # User provisioning, institutional hierarchy & account onboarding guide
├── start.sh                                    # Unified multi-service startup script (Docker, NestJS, Next.js)
├── package.json                                # Root package orchestrating unified start and seed scripts
├── requirement.md                              # Formal Product Requirements Document (PRD) & Low-Level Design (LLD)
├── DESIGN.md                                   # UI/UX design specifications, tokens, and component guidelines
├── PARENT_AND_STUDENT_PORTAL_IMPLEMENTATION.md # Detailed specification for Student and Parent portals
├── PARENT_AND_STUDENT_DASHBOARD_IMPLEMENTATION_PLAN.md # Roadmap & step-by-step implementation plan for portals
├── output/                                     # Product documents and architectural blueprints
│   └── pdf/
│       ├── lms-product-blueprint.pdf           # Comprehensive LMS architectural blueprint PDF
│       └── school-organization-b2b-saas-blueprint.pdf # School B2B SaaS system diagram & reference PDF
├── backend/                                    # NestJS API, PostgreSQL database, and business modules
└── frontend/                                   # Next.js / Vinext React frontend application
```

---

### 6.2 Backend Architecture (`backend/`)

```text
backend/
├── compose.yaml          # Docker Compose configuration running PostgreSQL 16 Alpine on port 15432
├── package.json          # Backend dependencies, build scripts, migration runners, and test suites
├── tsconfig.json         # TypeScript compiler configuration (strict null checks, decorators)
├── drizzle.config.ts     # Drizzle ORM configuration pointing to database schema and migrations
├── edops-openapi.json    # Complete exported OpenAPI 3.0 specification for all 90+ endpoints
├── .env.example          # Template documenting all required and optional environment variables
├── scripts/
│   └── init-env.cjs      # Generates a random 64-character SESSION_SECRET and builds local .env
├── src/
│   ├── main.ts           # Application entrypoint: loads configuration, invokes createApp, listens on PORT
│   ├── app.ts            # Factory setting up Express, Helmet, CORS, Swagger, Global Pipes, and Filters
│   ├── app.module.ts     # Root NestJS module importing all 17 domain modules, guards, and interceptors
│   ├── config.ts         # Type-safe configuration loader with validation for ports, URLs, and secrets
│   ├── worker.ts         # Asynchronous worker draining transactional outbox events (FOR UPDATE SKIP LOCKED)
│   ├── bootstrap-admin.ts# Secure CLI tool to bootstrap the first platform super admin via hidden stdin
│   ├── reset-admin.ts    # Secure CLI tool to reset platform admin credentials via hidden stdin
│   ├── common/           # Shared cross-cutting authorization, filtering, and OpenAPI utilities
│   │   ├── auth.guard.ts              # Protects routes via Session or JWT; handles @Public & @PlatformAdmin
│   │   ├── tenant.guard.ts            # Validates active school membership and enforces organization scoping
│   │   ├── http-error.filter.ts       # Normalizes error payloads to uniform { statusCode, message, error }
│   │   ├── portal-database.interceptor.ts # Sets PostgreSQL RLS session context (app.current_org_id)
│   │   ├── api-docs.ts                # Shared Swagger OpenAPI response schemas and error helpers
│   │   └── school-api-docs.ts         # Swagger decorators specific to school-level operations
│   ├── database/         # Database connection layer, schema definitions, and migrations
│   │   ├── data-source.ts             # TypeORM DataSource instance used for executing schema migrations
│   │   ├── drizzle.service.ts         # High-performance Drizzle SQL execution wrapper and transaction manager
│   │   ├── database.module.ts         # Global NestJS module exposing database services
│   │   ├── schema.ts                  # Drizzle ORM TypeScript schema mapping all database tables
│   │   ├── migrate.ts                 # Script to execute pending TypeORM migrations programmatically
│   │   ├── init-dev.sql               # Initial database bootstrap SQL (creates edops_test database)
│   │   └── migrations/                # Version-controlled schema migrations (25 migration files)
│   │       ├── 1788825600000-InitialSchema.ts          # M1: Users, Organizations, Memberships, Sessions
│   │       ├── 1788912000000-Academics.ts              # M2: Academic Years, Programs, Sections, Subjects
│   │       ├── 1788998400000-Teaching.ts               # M3: Assignments, Submissions, Attendance, Scorecards
│   │       ├── 1789084800000-Communication.ts          # M4: Outbox, Domain Events, Media Recordings
│   │       ├── 1789171200000-Arena.ts                  # M5: Arena Questions, Attempts, Practice Banks
│   │       ├── 1789257600000-Billing.ts                # M6: Subscription Plans, Invoices, Entitlements
│   │       ├── 1789344000000-PlatformControlCenter.ts  # Platform admin metrics and navigation schema
│   │       ├── 1789430400000-SchoolAdminControlCenter.ts # School admin staff, departments, and fee structures
│   │       ├── 1789516800000-PrincipalControlCenter.ts # Principal planning, observations, and exam plans
│   │       ├── 1789603200000-TeacherControlCenter.ts   # Teacher workload, class assignments, and feedback
│   │       ├── 1789689600000-StudentControlCenter.ts   # Student goals, counseling, and exam hall tickets
│   │       ├── 1789776000000-PrincipalPeople.ts        # Principal staff directory and teacher profiles
│   │       ├── 1789862400000-PrincipalObservationClassName.ts # Classroom observation metadata updates
│   │       ├── 1789948800000-PrincipalTimetableSubstitutions.ts # Timetable teacher substitution registry
│   │       ├── 1790035200000-RoleFeatureOverrides.ts   # Per-role granular feature toggle overrides
│   │       ├── 1790121600000-PrincipalExamPlans.ts     # Examination schedules and grading schemas
│   │       ├── 1790208000000-PrincipalExamTermScope.ts # Term-based evaluation scoping
│   │       ├── 1790294400000-DashboardNavigation.ts    # Customizable dynamic dashboard navigation items
│   │       ├── 1790380800000-DatabaseBackedPortals.ts  # Parent-student relationships, PTM bookings, HPC reflections
│   │       ├── 1790467200000-SchoolPolicySettings.ts   # School-level governance and policy settings
│   │       ├── 1790553600000-PasswordResetTokens.ts    # Secure single-use password reset tokens
│   │       ├── 1790553600001-SubjectPassingMarks.ts    # Subject-level passing marks and grading thresholds
│   │       ├── 1790553600002-NullableSubjectFaculty.ts # Flexible faculty assignment constraints
│   │       ├── 1790553600003-SchoolDocuments.ts        # Institutional documents and policy repository
│   │       └── 1790553600004-RemoveSchoolAdminReportsNavigation.ts # Clean navigation item deduplication
│   └── modules/          # 17 Business domain modules (detailed in Section 6.4)
├── test/                 # Integration test suites verifying database rules and security harnesses
└── docs/                 # Detailed milestone documentation (MILESTONE-1.md through MILESTONE-6.md, API.md)
```

---

### 6.3 Frontend Architecture (`frontend/`)

```text
frontend/
├── package.json          # Frontend dependencies (React 19, Lucide, Tailwind 4, Vinext, Vite 8)
├── next.config.ts        # Next.js configuration settings
├── vite.config.ts        # Vite configuration powering fast HMR and SSR with Vinext
├── tsconfig.json         # TypeScript compiler configuration for React / Next.js JSX
├── public/               # Static public assets, icons, and branding logos
├── app/                  # Next.js App Router root directory
│   ├── layout.tsx        # Top-level root layout injecting typography and global styles
│   ├── page.tsx          # Central client controller: session management, role routing, and view switching
│   ├── [...slug]/page.tsx# Dynamic deep-link router preserving sub-route context across roles
│   ├── edops-api.ts      # Strongly typed API client: CSRF handling, JWT/cookie management, and endpoint bindings
│   ├── dashboard-navigation.ts # Dynamic RBAC navigation structure and sidebar item generator
│   ├── dashboard-routing.ts    # URL query parameter parsing, slug mapping, and deep-linking state
│   ├── dashboard-home.tsx# Default welcome landing page for logged-in personas
│   ├── platform-workspace.tsx  # Platform Super Admin top-level workspace container
│   ├── learning-workspace.tsx  # Shared learning workspace container
│   ├── principal-dashboard.tsx # Principal executive overview card container
│   ├── parent-dashboard.tsx    # Parent overview card container
│   ├── request-error-banner.tsx# Uniform UI banner for displaying API communication errors
│   ├── campus.css        # Academic campus design tokens and styling rules
│   ├── globals.css       # Core design system CSS, color variables, and reset rules
│   ├── redesign.css      # Midnight Obsidian & Ivory Canvas design system extensions
│   ├── components/       # Shared enterprise portal components
│   │   ├── communication-chat.tsx    # Real-time direct messages with deduplication & race-condition safety
│   │   ├── universal-timetable.tsx   # Universal responsive Timetable Radar component
│   │   ├── leave-desk.tsx            # Digital leave application desk & status workflows
│   │   ├── global-portal-search.tsx  # Quick search & command palette across entities
│   │   ├── teacher-allocation-manager.tsx # Section-wise multi-teacher assignment manager
│   │   ├── notice-board.tsx          # Role-targeted announcement feed & pinboard
│   │   ├── notification-bell-dropdown.tsx # Notification alerts with universal audio chime
│   │   ├── member-lifecycle-modal.tsx# Student/staff lifecycle state updates
│   │   ├── exam-plan-drawer.tsx      # Examination schedule drawer & score locking
│   │   ├── class-command-center.tsx  # Section roster, subjects, and attendance hub
│   │   └── ui/           # Standard reusable atomic components
│   │       ├── Banner.tsx      # Notification and alert banner component
│   │       ├── Empty.tsx       # Standardized empty-state placeholder view
│   │       ├── FeatureCard.tsx # Metric and capability overview card
│   │       ├── FormActions.tsx # Standard submit/cancel form action buttons
│   │       ├── Metric.tsx      # Stat and KPI indicator tile
│   │       ├── Modal.tsx       # Accessible dialog and modal overlay
│   │       └── index.ts        # UI component barrel export
│   ├── platform/         # Platform Super Admin Workspace & Panes (Section 6.5)
│   ├── school-admin/     # School Administrator Hub & Panes (Section 6.5)
│   ├── principal/        # Principal Academic Suite & Panes (Section 6.5)
│   ├── teacher/          # Teacher Classroom Workspace & Panes (Section 6.5)
│   ├── student/          # Student Learning Portal & Panes (Section 6.5)
│   └── parent/           # Parent Guardian Portal & Panes (Section 6.5)
└── tests/                # Automated frontend integration tests
```

---

### 6.4 Domain Modules Breakdown (`backend/src/modules/`)

| Module Path | Primary Responsibilities & Key Files |
| :--- | :--- |
| `modules/auth/` | **Authentication & Identity**: User verification, scrypt password hashing (`password.ts`), JWT access/refresh token generation (`jwt.util.ts`), session cookie issuance, CSRF tokens (`auth.controller.ts`, `auth.service.ts`). |
| `modules/tenants/` | **Organization & Multi-Tenancy**: School provisioning, tenant slug uniqueness, timezone/locale configuration, school suspension controls, one-time invitation generation (`tenants.controller.ts`, `provisioning.service.ts`). |
| `modules/academics/` | **Academic Structure**: Academic years, programs (grades), sections, subjects, and teacher class-subject assignments (`academics.controller.ts`, `academics.service.ts`). |
| `modules/assignments/` | **Teaching & Coursework**: Assignment creation, publishing lifecycle, student plain-text submissions, and qualitative grading (`teaching.controller.ts`, `teaching.service.ts`, `assignments.service.ts`). |
| `modules/attendance/` | **Daily Attendance**: Class attendance registers, date bound validation, attendance marking (`present`, `absent`, `late`, `excused`), and finalization (`attendance.service.ts`). |
| `modules/arena/` | **Practice Arena**: Class-scoped question bank authoring, single/multi-choice formats, deterministic instant auto-grading, and attempt scoring (`arena.controller.ts`, `arena.service.ts`). |
| `modules/content/` | **Media & Communication**: Presigned S3 PUT/GET URLs for lecture recordings, media upload verification (magic bytes & SHA-256), short-lived playback URLs (`communication.controller.ts`, `recordings.service.ts`, `storage.service.ts`). |
| `modules/notifications/`| **Outbox & Messaging**: Transactional outbox event emission, recipient projection, class timeline feeds, and personal user inboxes (`feed.service.ts`, `outbox.service.ts`). |
| `modules/billing/` | **Subscription & Invoicing**: Platform pricing plans, monthly cycles, student/teacher seat enforcement, manual invoicing records, and telemetry stats (`billing.controller.ts`, `billing.service.ts`, `entitlements.ts`). |
| `modules/audit/` | **Transactional Audit Ledger**: Immutable audit log recording actor UUID, organization UUID, action verb, timestamp, and metadata for every mutative operation (`audit.service.ts`). |
| `modules/principal/` | **Principal Operations**: Annual academic planning, teacher workload reviews, classroom observation evaluations, timetable substitutions, exam term evaluation locks (`principal.module.ts`, `services/`). |
| `modules/school-admin/` | **School Administration**: Bulk CSV/JSON roster imports, staff provisioning, department management, fee collections, facility logs, and institutional settings (`school-admin.controller.ts`, `school-admin.service.ts`). |
| `modules/teacher/` | **Teacher Management**: Class rosters, workload management, student remarks, and timetable tracking (`teacher.module.ts`, `services/`). |
| `modules/student/` | **Student Operations**: Student dashboard data aggregation, goal tracking, counseling requests, and exam hall ticket generation (`student.module.ts`, `services/`). |
| `modules/parent/` | **Parent & Ward Engagement**: Multi-child relationship mapping, digital leave applications, PTM slot scheduling, and fee payment tracking (`parent.service.ts`, `parent.module.ts`). |
| `modules/reports/` | **Scorecards & Analytics**: Materialized scorecard calculation, grade weighting, and student academic performance summaries (`scorecards.service.ts`). |

---

### 6.5 Frontend Role Workspaces & Panes

Each user role has a dedicated workspace in the frontend containing modular, focused panes:

#### 1. Student Portal (`frontend/app/student/panes/`)
- `dashboard-pane.tsx`: Academic overview, daily schedule, pending tasks, and recent grades.
- `timetable-pane.tsx`: Live Timetable Radar highlighting the active period, room, and teacher.
- `subjects-pane.tsx`: Enrolled subjects list, syllabus milestones, and teacher details.
- `assignments-pane.tsx`: Homework list, submission editor (plain text), due dates, and rubrics.
- `arena-pane.tsx`: Interactive Practice Arena with timed tests, instant feedback, and streaks.
- `attendance-pane.tsx`: Visual calendar heatmap, percentage bar, and finalized attendance records.
- `resources-pane.tsx`: Recorded video lectures vault, PDF study notes, and lesson bookmarks.
- `exams-pane.tsx`: Upcoming exam timetables, digital hall ticket downloads, and CBSE report cards.
- `progress-pane.tsx`: Holistic Progress Card (HPC), self-assessments, and teacher remarks.
- `communication-pane.tsx`: Private 1-on-1 doubt clearing threads with teachers.
- `performance-pane.tsx`, `profile-pane.tsx`, `curriculum-pane.tsx`, `class-pane.tsx`, `calendar-pane.tsx`, `assessments-pane.tsx`: Academic metrics, personal profile, and class schedules.

#### 2. Teacher Workspace (`frontend/app/teacher/panes/`)
- `dashboard-pane.tsx`: Teaching schedule, pending submission grading counts, and announcements.
- `classes-pane.tsx`: Assigned classes, sections, and subject enrollments.
- `assignments-pane.tsx`: Assignment creator, deadline scheduler, and student submission grading grid.
- `attendance-pane.tsx`: Daily attendance register with one-click present/absent/late toggles.
- `learning-pane.tsx`: Recorded lesson uploader with S3 presigned URL integration.
- `arena-pane.tsx`: Question bank manager: create single/multi-choice practice questions with tags.
- `reports-pane.tsx`: Materialized student scorecards and class academic averages.
- `students-pane.tsx`: Class roster directory with attendance and performance histories.
- `timetable-pane.tsx`, `workload-pane.tsx`, `communication-pane.tsx`, `curriculum-pane.tsx`, `calendar-pane.tsx`, `exams-pane.tsx`, `assessments-pane.tsx`, `activity-pane.tsx`: Timetable viewer, lesson planning, and parent/student messages.

#### 3. School Admin Command Center (`frontend/app/school-admin/`)
- `people-pane.tsx`: Master roster manager: bulk CSV/JSON student and teacher imports, staff directory.
- `academics-pane.tsx`: Academic years configuration, programs (grades), sections, and subject catalogs.
- `timetable-pane.tsx`: Master school timetable scheduler and period allocator.
- `attendance-leave-pane.tsx`: Institution-wide attendance registers and staff leave approvals.
- `finance-pane.tsx`: Fee category manager, student fee ledgers, offline receipts, and dues.
- `governance-pane.tsx`: School policy documents, accreditation compliance, and security settings.
- `learning-exams-pane.tsx`: Examination terms, grading scales, and report card generation.
- `operations-pane.tsx`: Transport routes, vehicle tracking, and campus facility logs.
- `communication-pane.tsx`: Circulars, broadcasts, and school-wide announcements.
- `dashboard-pane.tsx`: Institution KPI dashboard: active student count, attendance rate, fee collections.

#### 4. Principal Academic Suite (`frontend/app/principal/panes/`)
- `planning-pane.tsx`: Annual Academic Plan (AAP), curriculum pacing guidelines, and institutional goals.
- `teachers-pane.tsx`: Teacher workload analyzer, lesson plan submissions, and teaching observation rubrics.
- `teacher-profile-drawer.tsx`: 360-degree teacher profile drawer with workload and review history.
- `timetable-pane.tsx`: Daily substitution engine to assign substitute teachers for absent staff.
- `examinations-pane.tsx`: Term exam schedules, question paper approval, and evaluation locking.
- `student-360-modal.tsx`: Comprehensive student drill-down modal showing attendance, grades, and HPC data.
- `alerts-pane.tsx`: Academic risk radar (low attendance alerts, failing student warnings).
- `analytics-audit-pane.tsx`: Comparative academic department analytics and grading compliance audits.
- `dashboard-pane.tsx`, `academics-pane.tsx`, `attendance-pane.tsx`, `assessments-pane.tsx`, `communication-pane.tsx`, `learning-pane.tsx`, `reports-pane.tsx`, `activity-pane.tsx`, `students-pane.tsx`.

#### 5. Parent Guardian Hub (`frontend/app/parent/panes/`)
- `overview-pane.tsx`: Child summary card, daily attendance status, and recent teacher notes.
- `academics-pane.tsx`: Homework completion status, upcoming tests, and teacher feedback.
- `attendance-pane.tsx`: Attendance calendar and **Digital Leave Application submission form**.
- `fees-pane.tsx`: Fee schedule, paid receipts, and upcoming installment breakdowns.
- `notices-pane.tsx`: Official school circulars and class teacher messages.
- `ptm-pane.tsx`: 1-on-1 Parent-Teacher Meeting (PTM) interactive slot reservation.

#### 6. Platform Super Admin Workspace (`frontend/app/platform/`)
- `schools-pane.tsx`: Multi-tenant school directory: provision new schools, suspend/activate tenants.
- `onboarding-wizard.tsx`: Step-by-step school onboarding wizard generating one-time admin invites.
- `plans-pane.tsx`: Global SaaS subscription plans, pricing, seat allocations, and feature toggles.
- `subscriptions-pane.tsx`: Active school subscriptions, trial periods (30 days), and renewal dates.
- `billing-pane.tsx`: Manual invoice generator, payment status reconciliation, and receipts.
- `dashboard-navigation-editor.tsx`: Live navigation item customizer for tenant workspaces.
- `health-pane.tsx`, `security-pane.tsx`, `support-pane.tsx`, `config-pane.tsx`: System telemetry, audit logs, and infrastructure health.

---

## 7. Source of Truth & System Impact Matrix ("Where Everything is Defined & What It Affects")

This section maps **where every entity and business rule is defined** (Source of Truth), **which UI workspaces consume it**, and **where and what it affects downstream** (cascades, foreign keys, outbox events, materialized scorecards, and authorization).

### 7.1 Master Data Flow & Cascade Lifecycle

```mermaid
flowchart TD
    Client["Client Interaction (Frontend Pane)"] -->|"API Call + CSRF / JWT"| Guard["AuthGuard & TenantGuard"]
    Guard -->|"Session Context"| RLS["RLS Interceptor: set_config('app.current_org_id')"]
    RLS --> Service["Domain Business Service"]
    
    Service -->|"1. Primary Mutation"| CoreDB[("Core Database Tables (Drizzle/PostgreSQL)")]
    CoreDB -->|"Foreign Key Constraints & Triggers"| DepDB[("Downstream Tables (submissions, scorecards, etc.)")]
    
    Service -->|"2. Single-Student Rollup"| Scorecards[("Materialized scorecards Table")]
    Service -->|"3. Atomic Outbox Event"| Outbox[("domain_events & event_recipients")]
    Service -->|"4. Audit Entry"| Audit[("audit_events Ledger")]
    
    Outbox -->|"Async FOR UPDATE SKIP LOCKED"| Worker["Outbox Worker (worker.ts)"]
    Worker -->|"Project Notifications"| Inboxes["Personal Inboxes & Timelines"]
    
    Scorecards -->|"Real-Time KPI Feed"| Dashboards["Dashboards (Student, Teacher, Parent, Principal)"]
    Inboxes -->|"Real-Time Activity Radar"| Dashboards
```

---

### 7.2 Domain-by-Domain Source of Truth & Downstream Impact Matrix

| Domain / Subsystem | Source of Truth (Database Tables & Backend Source Files) | Consumed By (Frontend Workspaces & API Endpoints) | Where & What It Affects (Downstream Tables, RLS, Services & Cascades) |
| :--- | :--- | :--- | :--- |
| **Authentication & Accounts** | `users`<br>`sessions`<br>`user_refresh_tokens`<br>• `backend/src/modules/auth/auth.service.ts`<br>• `auth.controller.ts`<br>• `jwt.util.ts`, `password.ts` | • `frontend/app/page.tsx`<br>• `frontend/app/edops-api.ts`<br>• `POST /api/v1/auth/login`<br>• `POST /api/v1/auth/refresh`<br>• `GET /api/v1/auth/me`<br>• `POST /api/v1/auth/logout` | • **Affects `req.user`** across all protected endpoints via `AuthGuard`.<br>• Controls PostgreSQL RLS scoping via `portal-database.interceptor.ts`.<br>• Emits `auth.login` and `auth.logout` to `audit_events`.<br>• Invalidating a session or revoking a refresh token immediately denies API access across all client tabs. |
| **School Tenancy & Organizations** | `organizations`<br>`memberships`<br>`invitations`<br>• `backend/src/modules/tenants/tenants.service.ts`<br>• `provisioning.service.ts` | • `platform/schools-pane.tsx`<br>• `school-admin/governance-pane.tsx`<br>• `POST /api/v1/platform/organizations`<br>• `PATCH /api/v1/platform/organizations/:id/status` | • Setting `organizations.status = 'suspended'` **instantly blocks all API access** for all teachers, students, parents, and admins belonging to that school via `TenantGuard`.<br>• `memberships` dictates the user's role and workspace (`school_admin`, `principal`, `teacher`, `student`, `parent`).<br>• Invitation generation consumes seat quotas in `subscriptions`. |
| **Academic Hierarchy** | `academic_years`<br>`programs`<br>`sections`<br>`subjects`<br>• `backend/src/modules/academics/academics.service.ts`<br>• `academics.controller.ts` | • `school-admin/academics-pane.tsx`<br>• `principal/academics-pane.tsx`<br>• `student/subjects-pane.tsx`<br>• `GET /api/v1/academics/*` | • `academic_years.is_current = true` enforces date boundary validation across assignments and attendance (cannot take attendance outside the active year).<br>• Deleting a subject or section cascades or restricts enrollments, timetables, and submissions via foreign key constraints.<br>• Defines the master curriculum structure. |
| **Teacher Class Assignments** | `class_subject_assignments`<br>• `backend/src/modules/academics/academics.service.ts`<br>• `backend/src/modules/assignments/teaching-access.service.ts` | • `teacher/classes-pane.tsx`<br>• `principal/teachers-pane.tsx`<br>• `POST /api/v1/academics/teacher-assignments` | • **Authorizes teachers**: A teacher can ONLY author assignments, take attendance, upload recordings, and grade submissions for `(section_id, subject_id)` pairs assigned in this table.<br>• Directly impacts Principal Teacher Workload calculations and teacher substitution eligibility. |
| **Student Roster & Enrollments** | `enrollments`<br>`student_profiles`<br>• `backend/src/modules/academics/academics.service.ts`<br>• `backend/src/modules/school-admin/school-admin.service.ts` | • `school-admin/people-pane.tsx`<br>• `teacher/students-pane.tsx`<br>• `student/profile-pane.tsx`<br>• `POST /api/v1/school/roster/import` | • Active enrollments (`status = 'active'`) dictate which students are initialized when an assignment is published.<br>• If a student is marked `transferred` or `withdrawn`, they are excluded from future attendance sessions, examination hall tickets, and assignment rosters.<br>• Consumes student seat quotas in `subscriptions`. |
| **Coursework & Assignments** | `assignments`<br>• `backend/src/modules/assignments/assignments.service.ts`<br>• `teaching.controller.ts` | • `teacher/assignments-pane.tsx`<br>• `student/assignments-pane.tsx`<br>• `parent/academics-pane.tsx`<br>• `POST /api/v1/teaching/assignments` | • When an assignment changes from `draft` → `published`, the system **automatically initializes `submissions` records (`status = 'pending'`)** for all active students enrolled in the section.<br>• Emits `assignment.published` into `domain_events` via the transactional outbox.<br>• Sets the deadline constraint (`dueAt > now()`). |
| **Student Submissions & Homework** | `submissions`<br>• `backend/src/modules/assignments/assignments.service.ts`<br>• `teaching.controller.ts` | • `student/assignments-pane.tsx`<br>• `teacher/assignments-pane.tsx`<br>• `POST /api/v1/teaching/assignments/:id/submissions` | • Updating a submission to `submitted` or `late` records submission timestamp and locks further edits after deadline.<br>• Triggers immediate **single-student transactional recalculation in `scorecards`** (completed assignment count and submission rate).<br>• Updates teacher's pending grading queue in `teacher/dashboard-pane.tsx`. |
| **Grading & Qualitative Feedback** | `submissions.score`<br>`submissions.feedback`<br>`submissions.graded_at`<br>• `backend/src/modules/assignments/teaching.service.ts` | • `teacher/assignments-pane.tsx`<br>• `student/performance-pane.tsx`<br>• `parent/academics-pane.tsx`<br>• `PATCH /api/v1/teaching/assignments/:id/grade` | • Scores must satisfy `0 <= score <= max_score`.<br>• Triggers transactional recalculation of student's weighted grade average in `scorecards`.<br>• Emits `submission.graded` to `domain_events`, alerting the student and parent via in-app inbox and notification badge. |
| **Daily Attendance Engine** | `attendance_sessions`<br>`attendance_records`<br>• `backend/src/modules/attendance/attendance.service.ts`<br>• `teaching.controller.ts` | • `teacher/attendance-pane.tsx`<br>• `student/attendance-pane.tsx`<br>• `parent/attendance-pane.tsx`<br>• `principal/attendance-pane.tsx`<br>• `POST /api/v1/teaching/attendance` | • Finalizing an attendance session checks uniqueness `(section_id, subject_id, date, period)` to prevent duplicates.<br>• Recalculates student's **attended vs counted session percentage in `scorecards`**.<br>• Feeds Student visual calendar heatmap, Principal Academic Risk alerts (`alerts-pane.tsx` if < 75%), and Parent absence notifications. |
| **Materialized Scorecards** | `scorecards`<br>• `backend/src/modules/reports/scorecards.service.ts` | • `student/dashboard-pane.tsx`<br>• `teacher/reports-pane.tsx`<br>• `parent/overview-pane.tsx`<br>• `principal/dashboard-pane.tsx` | • Materialized single-row rollup per student aggregating: total assignments, completed count, weighted grade average, total attendance sessions, attended sessions, attendance %, and Arena attempts.<br>• Powers all high-level KPI tiles without performing expensive table scans on dashboard loads. |
| **Transactional Outbox & Worker** | `domain_events`<br>`event_recipients`<br>• `backend/src/modules/notifications/outbox.service.ts`<br>• `feed.service.ts`<br>• `backend/src/worker.ts` | • Notification bell icon across all workspaces<br>• `student/communication-pane.tsx`<br>• `teacher/activity-pane.tsx`<br>• `GET /api/v1/notifications/inbox` | • Domain events are written in the same database transaction as domain writes.<br>• `worker.ts` polls `domain_events` with `FOR UPDATE SKIP LOCKED`, projecting notifications to `event_recipients`.<br>• Decouples external notification latency from API write response times. |
| **Private Lesson Recordings** | `recorded_sessions`<br>• `backend/src/modules/content/recordings.service.ts`<br>• `storage.service.ts` | • `teacher/learning-pane.tsx`<br>• `student/resources-pane.tsx`<br>• `POST /api/v1/communication/recordings` | • Upload flow: Generates 1-hour presigned S3 PUT URL; validates SHA-256 and file magic bytes (MP4 `ftyp`, WebM `0x1a45dfa3`).<br>• Publishing generates short-lived 2-minute presigned GET playback URLs.<br>• Updates tenant storage utilization in `platform_organization_telemetry`. |
| **Objective Practice Arena** | `arena_questions`<br>`arena_attempts`<br>• `backend/src/modules/arena/arena.service.ts`<br>• `arena.controller.ts` | • `teacher/arena-pane.tsx`<br>• `student/arena-pane.tsx`<br>• `POST /api/v1/arena/attempts` | • Question answer keys are stripped from student-facing API endpoints.<br>• Student attempt submission triggers **instant deterministic auto-grading**.<br>• Updates student Arena attempt count and highest score in `scorecards`.<br>• Updates streak count and mastery percentages in Student `arena-pane.tsx`. |
| **Platform SaaS Subscriptions & Seats** | `plans`<br>`subscriptions`<br>`tenant_feature_overrides`<br>• `backend/src/modules/billing/billing.service.ts`<br>• `entitlements.ts` | • `platform/plans-pane.tsx`<br>• `platform/subscriptions-pane.tsx`<br>• `school-admin/governance-pane.tsx` | • New schools receive a 30-day trial automatically.<br>• **Seat Quota Enforcement**: Creating/inviting new teachers or students checks `active_memberships + pending_invites <= max_seats`. Rejects over-quota invitations with `409 Conflict`.<br>• Feature toggles (`arena`, `recordings`, `communication`) dynamically show/hide frontend panes via `dashboard-navigation.ts`. |
| **Manual Invoicing Ledger** | `manual_invoices`<br>• `backend/src/modules/billing/billing.service.ts`<br>• `billing.controller.ts` | • `platform/billing-pane.tsx`<br>• `school-admin/finance-pane.tsx`<br>• `POST /api/v1/platform/invoices` | • Stores manual school invoices with non-overlapping period bounds (`tstzrange`).<br>• Recording offline payments updates payment reference, settles dues, and updates platform revenue telemetry. |
| **Principal Academic Planning & Workload** | `annual_academic_plans`<br>`teacher_workload`<br>`teaching_observations`<br>• `backend/src/modules/principal/services/*` | • `principal/planning-pane.tsx`<br>• `principal/teachers-pane.tsx`<br>• `principal/teacher-profile-drawer.tsx` | • Master academic milestones guide teacher lesson planning.<br>• Teacher observation rubrics feed teacher performance evaluations.<br>• Workload tracker alerts principals if weekly period allocations exceed school limits. |
| **Timetable Substitutions** | `timetable_substitutions`<br>• `backend/src/modules/principal/services/timetable.service.ts` | • `principal/timetable-pane.tsx`<br>• `teacher/timetable-pane.tsx`<br>• `student/timetable-pane.tsx` | • When a teacher takes leave, the principal assigns a qualified substitute.<br>• **Directly updates Student Live Timetable Radar** and teacher daily schedule with substitution badges. |
| **Examination Plans & Locked Evaluations** | `exam_plans`<br>`exam_evaluations`<br>• `backend/src/modules/principal/services/examinations.service.ts` | • `principal/examinations-pane.tsx`<br>• `school-admin/learning-exams-pane.tsx`<br>• `student/exams-pane.tsx` | • Setting `exam_evaluations.is_locked = true` **locks scores permanently**, preventing any teacher score modification.<br>• Unlocks CBSE-compliant digital report card downloads and term score publishing. |
| **Parent-Student Linking & Leaves** | `parent_student_relationships`<br>`student_leaves`<br>• `backend/src/modules/parent/parent.service.ts` | • `parent/overview-pane.tsx`<br>• `parent/attendance-pane.tsx`<br>• `teacher/attendance-pane.tsx` | • Binds guardian accounts to one or multiple student wards.<br>• Powers parent **multi-ward switcher**.<br>• Submitting a leave application updates teacher's attendance view with leave reason and logs excused absence notes. |
| **Parent-Teacher Meetings (PTM)** | `ptm_schedules`<br>`ptm_bookings`<br>• `backend/src/database/migrations/1790380800000-DatabaseBackedPortals.ts` | • `parent/ptm-pane.tsx`<br>• `teacher/communication-pane.tsx`<br>• `principal/communication-pane.tsx` | • Unique database indexes (`ptm_teacher_slot`, `ptm_parent_slot`) **prevent double-booking conflicts**.<br>• Confirmed slots notify teachers and parents and appear on daily schedules. |
| **School Fee Ledgers & Dues** | `fee_categories`<br>`student_fee_dues`<br>`student_fee_payments`<br>• `backend/src/modules/school-admin/school-admin.service.ts` | • `school-admin/finance-pane.tsx`<br>• `parent/fees-pane.tsx` | • Generates student fee dues based on grade/program fee categories.<br>• Recording payments issues immutable receipts, updates student clearance status, and adjusts school collection totals. |
| **Holistic Progress Card (HPC / NEP 2020)** | `student_reflections`<br>• `backend/src/database/migrations/1790380800000-DatabaseBackedPortals.ts` | • `student/progress-pane.tsx`<br>• `principal/student-360-modal.tsx`<br>• `parent/overview-pane.tsx` | • Stores student self-evaluations, cognitive ratings, and growth goals.<br>• Integrates directly into Principal Student 360 view and Parent progress cards to satisfy CBSE NEP 2020 mandates. |
| **Dynamic Dashboard Navigation** | `dashboard_navigation_items`<br>• `backend/src/modules/billing/dashboard-navigation.ts`<br>• `frontend/app/dashboard-navigation.ts` | • `platform/dashboard-navigation-editor.tsx`<br>• Sidebar menus in all role workspaces | • Controls enabled/disabled status and sort order of sidebar navigation items per role and school.<br>• Allows platform admins to dynamically turn features on/off without redeploying frontend code. |
| **Transactional Audit Trail** | `audit_events`<br>• `backend/src/modules/audit/audit.service.ts` | • `school-admin/governance-pane.tsx`<br>• `platform/security-pane.tsx`<br>• `principal/analytics-audit-pane.tsx` | • Captures immutable records: `actor_id`, `organization_id`, `action`, `details`, `created_at`.<br>• Records all authentication events, roster modifications, grading changes, settings updates, and status toggles for compliance audits. |

---

### 7.3 Deep-Dive Ripple Effects per Key Entity & Mutation

Understanding cause-and-effect in EDOPS is vital when debugging or developing new features. Below is the exact chain reaction for key state changes:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. ACTION: Setting an Organization to "suspended"                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Source: PATCH /api/v1/platform/organizations/:id/status (status: "suspended")        │
│ • Database: organizations.status = 'suspended', audit_events record created            │
│ • Downstream Ripple Effects:                                                           │
│   1. TenantGuard immediately intercepts and rejects all subsequent API calls from any  │
│      user belonging to that organization with 403 Forbidden.                           │
│   2. Active sessions remain valid in /api/v1/auth/me (showing status="suspended"), but │
│      all school-scoped endpoints (academics, teaching, attendance, arena) reject access│
│   3. Outbox worker ceases dispatching notifications for that tenant.                   │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. ACTION: Publishing an Assignment (draft -> published)                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Source: POST /api/v1/teaching/assignments/:id/publish                                │
│ • Database: assignments.status = 'published', assignments.published_at = NOW()        │
│ • Downstream Ripple Effects:                                                           │
│   1. Submissions Engine queries all active enrollments (enrollments.status = 'active') │
│      for that section and batch-inserts pending records into submissions.              │
│   2. Atomic outbox event assignment.published is inserted into domain_events.          │
│   3. worker.ts drains the event and generates event_recipients for all enrolled        │
│      students and linked parents.                                                      │
│   4. Student assignments-pane.tsx and Parent academics-pane.tsx update dynamically.   │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. ACTION: Finalizing an Attendance Session                                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Source: POST /api/v1/teaching/attendance/:id/finalize                                │
│ • Database: attendance_sessions.status = 'finalized', finalized_at = NOW()             │
│ • Downstream Ripple Effects:                                                           │
│   1. Database validates uniqueness (section_id, subject_id, date, period).             │
│   2. Immediately triggers transactional single-student scorecards recalculation for    │
│      every student in attendance_records (attended_sessions / total_sessions).         │
│   3. Student attendance heatmap re-renders with new status (green=present, red=absent).│
│   4. If a student's attendance percentage drops below 75%, Principal alerts-pane.tsx   │
│      triggers an automated Academic Risk alert.                                        │
│   5. Parents receive absence alerts if ward was marked absent or late.                 │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. ACTION: Submitting an Objective Arena Attempt                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Source: POST /api/v1/arena/attempts                                                  │
│ • Database: arena_attempts record created with is_correct, score, max_score            │
│ • Downstream Ripple Effects:                                                           │
│   1. Instant deterministic evaluation compares submitted answers against answer_key.  │
│   2. Student's scorecards record updates transactionally (arena_attempts, arena_score).│
│   3. Student arena-pane.tsx displays live score, correct answer rationale, and streaks.│
│   4. Teacher arena-pane.tsx aggregates question difficulty and class success rates.    │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 5. ACTION: Principal Assigning a Timetable Teacher Substitution                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Source: POST /api/v1/principal/timetable/substitutions                               │
│ • Database: timetable_substitutions record inserted (date, period, original, substitute)│
│ • Downstream Ripple Effects:                                                           │
│   1. Student Live Timetable Radar updates period card with "Substitute: Teacher Name". │
│   2. Substitute teacher's daily schedule displays the newly assigned cover class.      │
│   3. Substitute teacher is temporarily authorized to conduct attendance for that period│
│   4. Original teacher's workload register logs an approved absence.                    │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 6. ACTION: Principal Locking Term Exam Evaluations                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Source: PATCH /api/v1/principal/examinations/:id/lock                                │
│ • Database: exam_evaluations.is_locked = true                                          │
│ • Downstream Ripple Effects:                                                           │
│   1. Teachers can no longer modify student marks in learning-exams-pane.tsx.           │
│   2. Formal CBSE Term Report Cards become finalized and downloadable in PDF format.    │
│   3. Students and parents gain view access to published terminal grade sheets.         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 7.4 Developer Ripple Effect Rulebook ("If You Modify X, You Must Update Y")

When making changes to the codebase, follow these mandatory dependency rules:

1. **If you modify a Database Table or Column**:
   - Create a TypeORM migration in `backend/src/database/migrations/<timestamp>-Name.ts`.
   - Update the Drizzle TypeScript schema in `backend/src/database/schema.ts`.
   - Update the backend TypeScript entity/DTO in `backend/src/modules/<domain>/`.
   - Update frontend API response types in `frontend/app/edops-api.ts`.
   - If the table contains tenant data, ensure `organization_id` has an index and is included in RLS policies.

2. **If you create a New Mutative API Route (`POST`, `PATCH`, `DELETE`)**:
   - Require CSRF validation via `X-CSRF-Token` header.
   - For batch or mutative operations, require the `Idempotency-Key` header.
   - Document Swagger decorators (`@ApiOkResponse`, `@ApiErrors`, `@ApiOperation`).
   - Add audit logging call via `this.audit.record(this.drizzle, { actorId, organizationId, action })`.
   - Update `edops-openapi.json` by running OpenAPI extraction.

3. **If you alter Grading, Attendance, or Arena Scoring Logic**:
   - Update the single-student recalculation transaction in `backend/src/modules/reports/scorecards.service.ts`.
   - Verify that KPI cards in `student/dashboard-pane.tsx`, `teacher/reports-pane.tsx`, and `principal/dashboard-pane.tsx` reflect the new formula.

4. **If you emit an Asynchronous Event or Notification**:
   - Insert into `domain_events` within the primary business database transaction.
   - Register the event handler in `backend/src/modules/notifications/feed.service.ts` or `outbox.service.ts`.
   - Verify that `backend/src/worker.ts` handles event serialization and projection cleanly.

5. **If you add a New Feature or Sidebar Pane**:
   - Register the pane in `frontend/app/dashboard-navigation.ts`.
   - Register feature key in `backend/src/modules/billing/entitlements.ts`.
   - Include the component in the role workspace container (e.g., `student-workspace.tsx`).

---

## 8. Environment Variables & Configuration

The backend reads its configuration from `backend/.env`. A complete template is provided in [backend/.env.example](backend/.env.example).

### Configuration Reference Table

| Variable Key | Required | Default in Local Dev | Description & Purpose |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Runtime environment (`development`, `test`, `production`). |
| `HOST` | No | `127.0.0.1` | Network interface to bind the NestJS HTTP listener. |
| `PORT` | No | `3001` | TCP port for the NestJS API server. |
| `DATABASE_URL` | Yes | `postgresql://edops:edops_dev@127.0.0.1:15432/edops` | Primary PostgreSQL database connection string. |
| `DATABASE_SCHEMA`| No | `public` | PostgreSQL schema name for table isolation. |
| `TEST_DATABASE_URL`| No | `postgresql://edops:edops_dev@127.0.0.1:15432/edops_test` | Dedicated database for automated integration tests. |
| `SESSION_SECRET` | Yes | *(Generated by `npm run env:init`)* | Cryptographic key (min 32 chars) for signing session cookies. |
| `JWT_SECRET` | No | Defaults to `SESSION_SECRET` | Secret key used for signing stateless JWT access tokens. |
| `SESSION_MAX_AGE_HOURS`| No | `8` | Maximum lifetime of an authenticated session (no sliding extension). |
| `CORS_ORIGINS` | Yes | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated list of allowed client origins (HTTPS required in prod). |
| `THROTTLE_LIMIT` | No | `120` | Maximum requests per minute per IP for standard endpoints. |
| `AUTH_THROTTLE_LIMIT`| No| `10` | Rate limit per minute per IP for `/auth/login` and `/auth/invitations/accept`. |
| `TRUST_PROXY` | No | `false` | Reverse proxy IPs / CIDRs to trust for client IP determination. |
| `S3_BUCKET` | Optional | — | AWS S3 / MinIO bucket name for private lesson recordings. |
| `S3_REGION` | Optional | — | AWS Region for the recording storage bucket (e.g., `ap-south-1`). |
| `S3_ENDPOINT` | Optional | — | Custom S3 endpoint URL (e.g., `http://127.0.0.1:19000` for MinIO). |
| `S3_ACCESS_KEY_ID` | Optional | — | S3 Access Key ID (omit in production to use AWS IAM roles). |
| `S3_SECRET_ACCESS_KEY`| Optional | — | S3 Secret Access Key (omit in production to use AWS IAM roles). |

---

## 9. API Architecture & Swagger Documentation

The backend exposes an interactive **Swagger UI** in non-production environments and an OpenAPI 3.0 specification file.

### 9.1 Accessing Interactive Documentation
- **Interactive Swagger UI**: [http://127.0.0.1:3001/api/docs](http://127.0.0.1:3001/api/docs)
- **Raw OpenAPI JSON Spec**: [http://127.0.0.1:3001/api/docs-json](http://127.0.0.1:3001/api/docs-json)
- **Exported Schema File**: [backend/edops-openapi.json](backend/edops-openapi.json)

### 9.2 Canonical Route Structure
All API routes follow the standard `/api/v1` namespace (with legacy `/api` aliases maintained for backwards compatibility):

```text
/api/health                                 Public health connectivity check (SELECT 1)
/api/v1/auth/csrf                           Fetch session-synchronized CSRF token
/api/v1/auth/login                          Credential verification & session/token issuance
/api/v1/auth/refresh                        Refresh stateless JWT access token
/api/v1/auth/switch-school                  Switch active school context within account
/api/v1/auth/me                             Current user profile & permitted school memberships
/api/v1/auth/logout                         Session revocation & cookie invalidation
/api/v1/platform/organizations              Platform Admin: Provision new school tenants
/api/v1/platform/organizations/:id/status   Platform Admin: Activate or suspend school tenant
/api/v1/platform/plans                      Platform Admin: Manage global subscription tiers
/api/v1/platform/invoices                   Platform Admin: Issue manual billing records
/api/v1/organizations/:id                   School Admin: Read or update school settings
/api/v1/academics/years                     Manage academic calendar years
/api/v1/academics/programs                  Manage programs (grades/classes)
/api/v1/academics/sections                  Manage class sections and student capacities
/api/v1/academics/subjects                  Manage course subjects and curriculum tags
/api/v1/academics/teacher-assignments       Assign teachers to section-subject pairs
/api/v1/teaching/assignments                Teacher assignment creation & publication
/api/v1/teaching/assignments/:id/submissions Student homework submissions & teacher grading
/api/v1/teaching/attendance                 Class attendance registers & session finalization
/api/v1/arena/questions                     Objective practice question bank authoring
/api/v1/arena/attempts                      Student practice tests & deterministic auto-grading
/api/v1/communication/recordings            Presigned S3 video recording uploads & playbacks
/api/v1/notifications/inbox                 Personal user notification inbox & unread counts
/api/v1/notifications/timeline              Section-enrolled broadcast activity timeline
```

---

## 10. Security, Isolation & Regulatory Standards

EDOPS is designed to meet stringent global and regional compliance mandates for educational institutions:

### 10.1 Security Architecture
1. **Zero Trust Session Security**:
   - `SameSite=Lax`, `HttpOnly`, `Secure` cookies with 8-hour absolute timeouts.
   - Synchronized CSRF tokens required on every mutative request.
2. **Defensive Cryptography**:
   - Node.js native `scrypt` hashing with unique random salts.
   - `crypto.timingSafeEqual` prevents timing enumeration vulnerabilities.
   - Idempotency payloads encrypted using `AES-256-GCM`.
3. **Network Defenses**:
   - `Helmet` security headers (HSTS, CSP, X-Frame-Options).
   - Strict CORS origin whitelisting (HTTPS enforced in production).
   - Multi-tiered rate limiting via NestJS Throttler.

### 10.2 Educational & Privacy Standards
- **CBSE SARAS & Affiliation Byelaws**: Built-in support for mandatory school governance registers, curriculum pacing, and attendance compliance thresholds.
- **NEP 2020 Holistic Progress Card (HPC)**: Multi-dimensional assessment engine integrating academic scores, self-reflections, peer assessments, and socio-emotional observations.
- **India DPDP Act 2023 & FERPA**: Strict parental consent workflows for minor students, role-scoped data visibility, and verified audit trails for all record modifications.

---

## 11. Troubleshooting & Maintenance Workflows

### 11.1 Frequently Encountered Scenarios

#### 🔴 "Docker daemon is not running"
- **Cause**: Docker Desktop is not started on your machine.
- **Fix**: Open Docker Desktop and wait until the whale icon shows "Engine running", then re-run `npm start`.

#### 🔴 "Port 3000 or 3001 already in use"
- **Cause**: A previously killed development server left an orphaned process.
- **Fix**: Run `npm start` (the script automatically frees these ports), or manually run:
  ```bash
  lsof -ti :3000,3001 | xargs kill -9
  ```

#### 🔴 Database Migration Errors or Schema Mismatches
- **Cause**: Out-of-sync database state after pulling new branch changes.
- **Fix**: Run migrations manually from the backend directory:
  ```bash
  cd backend
  npm run db:migrate
  ```

#### 🔴 Session Expired or CSRF Token Invalid
- **Cause**: Browser cookie expired (8-hour limit) or invalidated after server secret rotation.
- **Fix**: Log out and log back in, or clear browser cookies for `localhost:3000`.

---

### 11.2 Useful CLI Commands Reference

```bash
# === Root Commands ===
npm start               # Start PostgreSQL, Backend, and Frontend in one command
npm run dev             # Alias for npm start
npm run seed            # Seed demo data via backend seeder

# === Backend Commands (from backend/) ===
npm run build           # Compile TypeScript to dist/
npm run start:dev       # Launch NestJS in watch mode
npm run db:migrate      # Apply all pending database migrations
npm run bootstrap:admin -- email@school.org # Create a platform super admin via CLI
npm run reset:admin -- email@school.org     # Reset an existing administrator password via CLI
npm run worker          # Start the background outbox event worker
npm test                # Run backend automated integration tests

# === Frontend Commands (from frontend/) ===
npm run dev             # Start Vinext / Next.js development server
npm run build           # Compile frontend bundle for production
npm run lint            # Run ESLint validation
npm test                # Run frontend UI verification tests
```

---

<p align="center">
  <b>EDOPS</b> • Modern Multi-Tenant School Operations SaaS & Learning Platform<br>
  Built with NestJS, Next.js, and PostgreSQL.
</p>
