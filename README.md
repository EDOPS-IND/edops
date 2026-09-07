# School SaaS

B2B multi-tenant LMS sold to schools and education organizations.

This is a folder structure only. NestJS and Next.js have not been initialized;
there are no dependencies, runnable applications, or implemented security controls yet.

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

See [backend/README.md](backend/README.md) and
[frontend/README.md](frontend/README.md) for folder ownership.

Each app will own its dependencies and configuration when initialized.
The backend starts as one modular application. Add shared packages or separate
services only when working code needs them.

Empty source directories contain `.gitkeep` files so the structure can be tracked
in Git. Remove a placeholder when its directory gains real files.
