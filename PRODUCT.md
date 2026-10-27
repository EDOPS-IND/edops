# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **School Administrators & Operations Leads:** Manage school-wide configurations, class subject allocations, faculty assignments, fee collections, operations, and institutional governance.
- **Principals & Academic Directors:** Monitor school performance telemetry, curriculum pacing, teacher workloads, examinations, attendance warnings, and student 360 dossiers.
- **Teachers:** Execute daily academic routines—attendance roll call, timetable schedules, homework evaluations, and direct parent-student communications.
- **Students (K-12):** Access class command center, homework submissions, arena practice, personal timetable, and curriculum progress.
- **Parents & Guardians:** Track student academic standing, attendance warnings, fee dues, and direct messaging with educators.
- **Platform Super Administrators:** Multi-tenant provisioning, school onboarding, telemetry, and platform-wide support.

## Product Purpose

EdOps delivers a unified, modern K-12 school operating system that replaces clunky, fragmented legacy ERPs with a cohesive real-time command center. It unifies administrative operations, academic planning, attendance, and multi-role communication into a single intuitive surface.

## Positioning

A modern, real-time school command center uniting academic administration, timetables, and multi-role portals in one cohesive system—combining the data density of an institutional ERP with the speed, clarity, and craft of a modern SaaS workspace.

## Operating Context

- Fast-paced school administration offices, teacher desks, and mobile student/parent access.
- Role-gated workspaces with strict tenancy boundaries.
- High-density operational data views (timetable matrices, subject-teacher allocations, grade rosters, attendance sheets).
- Real-time communications (school notices, direct chats, leave applications, and broadcast alerts).

## Capabilities and Constraints

- Multi-tenant school isolation with role-based routing (`/school-admin`, `/principal`, `/teacher`, `/student`, `/parent`, `/platform`).
- High-density data grid interfaces, modal drawers, and live status dashboards.
- Tech Stack: Next.js / React (frontend) with TypeScript, NestJS + Drizzle + PostgreSQL (backend).
- Existing custom design tokens and campus CSS styles documented in `DESIGN.md`.

## Brand Commitments

- **Name:** "edops" (lowercase brand wordmark, Inter Bold 700).
- **Core Palette:** Deep Navy (`#0c1e33`), Slate (`#495d72`), Clean White (`#ffffff`), and calibrated semantic accents (pacing green, due amber, alert red).
- **Typography:** Poppins (primary UI font), Inter (wordmark), legible across micro-data (10px–13px) to metric headers (26px–36px).
- **Tone:** Professional, reliable, and calm for administrators; clear, engaging, and encouraging for students and parents.

## Evidence on Hand

- Figma design system reference documented in `DESIGN.md` (source: `Student-Portal--Community-`).
- Working full-stack workspaces across School Admin, Principal, Teacher, Student, and Parent.
- Reusable UI systems: Class Command Center, Universal Timetable, Leave Desk, Communication Chat, Searchable Select.

## Product Principles

1. **Operational Clarity Over Decorative Fluff:** High-density admin screens must remain instantly scanable under high-stress office workflows.
2. **Cohesive Role Harmony:** Unified design language across student, teacher, and admin surfaces while adapting density to the operator's context.
3. **Frictionless Action Loops:** Critical routines (taking attendance, assigning a substitute teacher, approving leave) must require minimal clicks with immediate visual confirmation.
4. **Resilient Production Craft:** Zero layout shifts, graceful handling of empty/loading states, robust overflow protection for student/teacher names, and clear status feedback.

## Accessibility & Inclusion

- Adherence to WCAG AA contrast standards for all text and interactive states.
- High keyboard efficiency for repetitive admin data entry (search shortcuts, tab order, focus rings).
- Responsive adaptation across desktop admin terminals and mobile/tablet surfaces for parents and students.
