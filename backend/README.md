# Backend

NestJS with TypeScript and PostgreSQL. Folder structure only.

## Module ownership

| Directory under src/modules | Owns |
| --- | --- |
| auth | Login, credentials, sessions and account recovery |
| tenants | Organizations, campuses, memberships, roles, settings and feature entitlements |
| academics | Academic years, terms, programs, subjects, classes and enrollments |
| attendance | Class sessions, attendance records and corrections |
| assignments | Tasks, submissions, grading, rubrics and published scorecards |
| assessments | Question bank, Arena practice sets, attempts and objective scoring |
| content | Learning resources, file metadata and recorded-class access |
| notifications | Templates, preferences, recipients and delivery tracking |
| reports | School reports, learning timelines, adoption and authorized platform aggregates |
| billing | Organization subscriptions, plans, invoices and payment-provider events |
| audit | Privileged actions and changes to academic records |

Keep a module's controller, service, module declaration, DTOs and focused tests
together. Add those files as behavior is implemented; do not create a separate
directory for every file type.

## Shared infrastructure

- `src/common/`: reusable guards, tenant request context and authorization helpers.
  Business logic stays in its owning module.
- `src/database/`: PostgreSQL connection and transaction setup.
- `src/database/migrations/`: versioned schema changes.

The NestJS entry points `src/main.ts` and `src/app.module.ts` will be added during
framework initialization.

## Tenant boundary

Resolve tenant context from an authenticated, authorized membership.
Every resource operation must enforce tenant and role scope. Apply the same
boundary to database queries, files, background jobs, exports and reports.
URL slugs and client-supplied tenant IDs are routing hints, not authorization.

Platform administration uses explicitly privileged actions in the owning modules.
It does not grant unrestricted access to school records.

Keep tenant settings in the tenants module and validate them against supported
schemas. Plan entitlements cap what tenant settings can enable.
