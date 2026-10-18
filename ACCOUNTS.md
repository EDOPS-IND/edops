# EDOPS Demo Accounts & Credentials

This document provides demo credentials and persona guides for testing and evaluating the **EDOPS** School SaaS Platform.

> **Password Rule:** For all demo accounts, the default password is the **same as the email address** (or `password123` in automated test harnesses).

---

## 🔑 Demo Accounts Quick Reference

| Persona / Role | Email Address | Default Password | Scope / Permissions |
| :--- | :--- | :--- | :--- |
| **Platform Super Admin** | `superadmin@edops.com` | `superadmin@edops.com` | Global cross-tenant management, provision schools, manage subscription plans, manual invoicing, system telemetry |
| **School Admin (Alternative)** | `admin@edops.com` | `admin@edops.com` | Tenant-level operations, master rosters, class/section assignments, fee configuration |
| **School Administrator** | `school@edops.com` | `school@edops.com` | Full school operations, academic years, departments, teacher/student rosters, staff management |
| **Principal** | `principal@edops.com` | `principal@edops.com` | Academic planning, curriculum tracking, teacher observations, timetable substitutions, exam moderation |
| **Teacher** | `teacher@edops.com` | `teacher@edops.com` | Assigned sections/subjects, assignment authoring & grading, attendance registers, lecture recordings, Arena questions |
| **Student** | `student@edops.com` | `student@edops.com` | Live timetable radar, homework submissions, instant auto-graded Arena practice, attendance heatmap, video vault |
| **Parent** | `parent@edops.com` | `parent@edops.com` | Multi-ward switcher, academic progress tracking, digital leave applications, fee receipts, PTM booking |

---

## 🚀 Bootstrap Custom Platform Super Admin

To create an authentic, production-grade super admin account with a custom email and hidden password via the CLI:

```bash
cd backend
npm run bootstrap:admin -- owner@your-company.com
```

- Passwords must be between 12 and 128 characters.
- Entered securely via hidden stdin prompt.
- Handled with scrypt cryptographic hashing.
