# School SaaS

B2B multi-tenant LMS sold to schools and education organizations.

The NestJS backend implements Milestones 1-6: onboarding, authentication,
academic structure, teacher/student provisioning, enrollment lifecycle,
assignments, submissions, attendance, stored scorecards, tenant-scoped settings,
suspension, transactional audit records, class timelines, in-app notifications and
private versioned recording workflows, objective Arena questions, auto-graded practice,
school subscriptions, manual billing records, entitlements and platform statistics.
The Next.js frontend remains a folder structure only.

## Layout

```text
backend/                  NestJS API, organized by domain
  src/
    common/               Shared tenant context and authorization primitives
    database/
      migrations/         PostgreSQL schema migrations
    modules/              Business modules
frontend/                 Next.js App Router application
  public/                 Public static assets
  src/
    app/                  Routes and layouts
    features/             Domain-specific UI and API calls
    components/           Shared UI components
    lib/                  Shared frontend infrastructure
output/pdf/               Product and architecture documents
```

See [backend/README.md](backend/README.md) for setup, API flow and tests, and
[frontend/README.md](frontend/README.md) for planned frontend folder ownership.
Milestone guides: [M1 identity and onboarding](backend/docs/MILESTONE-1.md) and
[M2 academic structure and roster](backend/docs/MILESTONE-2.md), and
[M3 teaching and scorecards](backend/docs/MILESTONE-3.md), and
[M4 communication and recordings](backend/docs/MILESTONE-4.md), and
[M5 objective Arena practice](backend/docs/MILESTONE-5.md), and
[M6 billing and platform controls](backend/docs/MILESTONE-6.md).

Each app owns its dependencies and configuration.
The backend starts as one modular application. Add shared packages or separate
services only when working code needs them.

Empty source directories contain `.gitkeep` files so the structure can be tracked
in Git. Remove a placeholder when its directory gains real files.
