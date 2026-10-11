# EDOPS Frontend

The EDOPS school operations dashboard. It connects to the NestJS API for
session authentication and every platform, school, teaching, communication,
recording, Arena, billing and reporting endpoint exposed by the API.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm ci
npm run dev
npm run build
```

The app runs on vinext and targets the Sites runtime.

## Current scope

- Dashboard UI lives under `app/`.
- Brand assets live under `public/`.
- Local development connects to `http://127.0.0.1:3001/api/v1`; open the UI at
  `http://127.0.0.1:3000` so the session cookie remains same-site.
- The browser calls `/api/v1` on the same origin. For a deployed Worker, set
  `EDOPS_API_ORIGIN` to the backend origin (without `/api/v1`); the Worker
  forwards `/api/*` there. Local development defaults to `127.0.0.1:3001`.

## Authentication

The frontend uses only the EDOPS API's secure HTTP-only session and CSRF flow.
It has no ChatGPT sign-in dependency.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build and verify the rendered dashboard shell
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
