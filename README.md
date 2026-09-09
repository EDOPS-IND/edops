# School SaaS

B2B multi-tenant LMS sold to schools and education organizations.

The NestJS backend implements Milestones 1 and 2: onboarding, authentication,
academic structure, teacher/student provisioning, enrollment lifecycle,
tenant-scoped settings, suspension and transactional audit records.
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
[M2 academic structure and roster](backend/docs/MILESTONE-2.md).

Each app owns its dependencies and configuration.
The backend starts as one modular application. Add shared packages or separate
services only when working code needs them.

Empty source directories contain `.gitkeep` files so the structure can be tracked
in Git. Remove a placeholder when its directory gains real files.
