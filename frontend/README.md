# Frontend

Next.js App Router with TypeScript. Folder structure only.

## Routes

| Directory under src/app | Intended URL | Workspace |
| --- | --- | --- |
| (auth)/login | /login | Organization user sign-in |
| platform | /platform | Product team and super-admin tools |
| t/[tenantSlug]/admin | /t/school-name/admin | School administration |
| t/[tenantSlug]/teacher | /t/school-name/teacher | Assigned classes and student work |
| t/[tenantSlug]/student | /t/school-name/student | Learning timeline, assignments and Arena |
| t/[tenantSlug]/parent | /t/school-name/parent | Authorized children's summaries |

These directories become routes only when Next.js page files are added.
The `(auth)` route group does not add a URL segment. Tenant-scoped layouts can
live at `src/app/t/[tenantSlug]/layout.tsx` when implemented.

## Source ownership

- `src/app/`: thin route pages, layouts and route-level loading/error states.
- `src/features/auth/`: sign-in and session UI.
- `src/features/tenants/`: organization setup, memberships, roles and settings.
- `src/features/academics/`: programs, classes and enrollment screens.
- `src/features/attendance/`: attendance entry and history.
- `src/features/assignments/`: authoring, submissions and grading.
- `src/features/assessments/`: question bank and Arena.
- `src/features/content/`: resources and recordings.
- `src/features/reports/`: scorecards, timelines and dashboards.
- `src/features/billing/`: organization plans, invoices and usage.
- `src/components/`: genuinely shared UI such as tables and form fields.
- `src/lib/`: shared session and API infrastructure.
- `public/`: public static assets only; never student uploads or private recordings.

Keep feature components, API calls and types together. Role-specific pages reuse
features where appropriate. Add subfolders only when a feature becomes large.

Menus and layouts help users navigate; backend authorization protects records.
Only the backend decides whether a session can access a tenant or action.
The frontend never connects directly to PostgreSQL, Redis or OpenAI.
