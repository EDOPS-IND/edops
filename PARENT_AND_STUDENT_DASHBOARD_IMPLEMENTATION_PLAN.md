# EDOPS Parent & Student Dashboard: Background ("bg") & Bug Audit and Implementation Plan

**Document Version:** 1.0.0  
**Target Roles:** Parent Guardian (`parent`) & Student Learner (`student`)  
**Design System Standard:** Midnight Obsidian (`#090D16`) & Ivory Canvas (`#FFFFFF` / `#F8FAFC`)  
**Status:** Awaiting User Approval  

---

## 1. Executive Summary & Dual Interpretation of "bg"

During the audit of both the **Parent Portal** and the **Student Portal**, we investigated two critical dimensions represented by **"bg"**:

1. **Visual Backgrounds & Design Tokens ("bg" = Background)**:
   - Visual surfaces, CSS classes, color schemes, sidebar backdrops, card surfaces, modal overlay backdrops, and compliance with the *Midnight Obsidian & Ivory* design system specified in [DESIGN.md](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/DESIGN.md).
2. **Defects, Gaps & Logic Bugs ("bg" = Bugs)**:
   - Functional defects, routing traps, missing feature modules (Fees, PTM booking), unhooked modal callbacks, desynchronized ward state, hardcoded calendar grids, and missing mobile drawer overlays.

This document compiles the exhaustive audit findings across both dimensions and presents a phased, production-grade implementation roadmap.

---

## 2. Parent Dashboard: Audit Findings

### 2.1. Background ("bg") Findings & Visual Defects

| Area | Current Implementation | Design System Standard | Issue / Discrepancy |
| :--- | :--- | :--- | :--- |
| **Workspace Shell & Sidebar Background** | Rendered inside legacy `RoleWorkspace` in `page.tsx` using `.sidebar` from `globals.css` / `campus.css`: `background: #064E3B` (Dark Green) with active items in `background: #F8E7C9` (Cream/Gold). | `bg-[#090D16]` (Midnight Obsidian) with borders `border-[#1A243D]` and active items `bg-slate-700 text-white font-bold`. | **Severe Visual Clash:** Parent is the only role still trapped in the legacy green CSS theme while the inner dashboard uses modern dark-obsidian and slate-50. |
| **Main Content Canvas Background** | `.main-content` from legacy CSS with `var(--bg)` (`#FAF8F5`). | `bg-slate-50` (`#F8FAFC`) with crisp text hierarchy `text-slate-800`. | Inconsistent margins, padding, and background color bleed. |
| **Stacked Header Cards** | Legacy `.welcome-row` is rendered above `ParentDashboard`, which then renders its own inner header card (`bg-white rounded-xl border border-slate-200/80 p-4`). | Single unified top navigation bar (`bg-white border-b border-slate-200`) plus streamlined dashboard hero. | Two duplicate headers are rendered on top of each other with conflicting backgrounds and badges. |
| **Modal Backdrops** | `bg-[#070A10]/60 backdrop-blur-xs` (Leave modal, query modal, report modal). | `bg-[#070A10]/60 backdrop-blur-xs`. | Matches design system, but modals lack unified padding and border radius compared to Student/Teacher modals (`rounded-2xl` vs `rounded-xl`). |
| **Action Buttons** | Hardcoded `bg-[#090D16] hover:bg-[#1E293B] border border-[#1A243D]`. | Standard Midnight Obsidian primary button token. | Proper color, but lacks unified icon alignment and hover transition consistency. |

### 2.2. Functional Bugs & Specification Gaps ("bg" = Bugs)

1. **Bug P-1: Parent Portal trapped in Legacy `RoleWorkspace`**
   - **Location:** [page.tsx:L155](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/page.tsx#L155)
   - **Description:** Principal, Teacher, and Student roles each have dedicated workspaces (`PrincipalWorkspace`, `TeacherWorkspace`, `StudentWorkspace`). Parent was omitted from the role check and falls through `isMemberWorkspace(membership)` to `RoleWorkspace`, causing broken navigation, duplicate headers, and green legacy sidebar styling.
2. **Bug P-2: Missing Fees & Invoicing Pane (Specified in Spec Section 4.5)**
   - **Location:** [parent-dashboard.tsx:L30](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/parent-dashboard.tsx#L30)
   - **Description:** [PARENT_AND_STUDENT_PORTAL_IMPLEMENTATION.md](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/PARENT_AND_STUDENT_PORTAL_IMPLEMENTATION.md#L145-L152) specifies a complete Fee Ledger with tuition breakdown, due dates, online payment simulation, and GST receipts download. This pane is completely missing in `parent-dashboard.tsx`.
3. **Bug P-3: Missing PTM (Parent-Teacher Meeting) Booking Pane (Specified in Spec Section 4.6)**
   - **Location:** [parent-dashboard.tsx:L30](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/parent-dashboard.tsx#L30)
   - **Description:** Spec Section 4.6 specifies 10-minute PTM slot booking with teachers, time-slot selection, and meeting links. It is completely missing.
4. **Bug P-4: Ward Desynchronization on Child Switch**
   - **Location:** [parent-dashboard.tsx:L81-L83](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/parent-dashboard.tsx#L81-L83)
   - **Description:** Switching between Aarav Sharma (Grade 10-A) and Ananya Sharma (Grade 6-B) changes only the name in the header; the daily period timetable, subjects, and report cards remain static and hardcoded to Grade 10-A.
5. **Bug P-5: Hardcoded 31-Day Attendance Calendar Grid**
   - **Location:** [parent-dashboard.tsx:L538-L560](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/parent-dashboard.tsx#L538-L560)
   - **Description:** The attendance grid hardcodes 31 days with static modulo formula `day % 7 === 0 || day % 7 === 6` for weekend styling without accounting for real calendar months, holidays, or student punch records.
6. **Bug P-6: Non-Persistent Leaves and Queries**
   - **Location:** [parent-dashboard.tsx:L129-L167](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/parent-dashboard.tsx#L129-L167)
   - **Description:** Leave applications and principal queries are stored only in temporary React state (`leavesList`, `queriesList`) and reset upon page reload. They should sync with API endpoints and fallback to localStorage/mock DB.

---

## 3. Student Dashboard: Audit Findings

### 3.1. Background ("bg") Findings & Visual Polish

| Area | Current Implementation | Design System Standard | Issue / Discrepancy |
| :--- | :--- | :--- | :--- |
| **Sidebar Navigation Items** | Active: `bg-slate-700 font-bold shadow-sm border border-slate-600/40`. Inactive: `hover:bg-[#131C31]`. | Matches [DESIGN.md](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/DESIGN.md#L70-L73) specification (`dark-obsidian-800` hover, neutral grey active). | Looks clean and matches contrast ratio > 8.5:1. |
| **Hero Greeting Banner** | `bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800` in [dashboard-pane.tsx:L96](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/student/panes/dashboard-pane.tsx#L96). | Matches Design System Hero Banners section. | Clean, high contrast; primary button uses inline `#FFFFFF` with `#3730A3` text to prevent whitening. |
| **Modal Backdrops Discrepancy** | `ArenaAttemptModal`: `bg-[#070A10]/60 backdrop-blur-xs`.<br>`StudentGoalModal`: `bg-slate-900/50 backdrop-blur-xs`.<br>`SupportRequestModal`: `bg-slate-900/50 backdrop-blur-xs`.<br>`AssignmentSubmitModal`: `bg-slate-900/50 backdrop-blur-xs`.<br>`LecturePlayerModal`: `bg-slate-900/60 backdrop-blur-xs`. | Unified token: `bg-[#070A10]/60 backdrop-blur-xs` (`dark-obsidian-950` with blur). | **Visual Inconsistency:** Multiple modal backdrops use slightly different dark shades (`slate-900/50` vs `#070A10/60`). |
| **Mobile Sidebar Overlay** | [student-workspace.tsx:L281](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/student/student-workspace.tsx#L281) has mobile menu drawer, but **lacks a clickable backdrop overlay**. | Translucent dark backdrop `bg-[#070A10]/60 backdrop-blur-xs` when drawer is open. | On mobile viewports, tapping outside the sidebar does not close the menu because there is no overlay backdrop. |
| **Exam Hall Ticket Print Background** | [exams-pane.tsx:L373](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/student/panes/exams-pane.tsx#L373) calls `window.print()` without print-specific CSS. | Pure white background with no sidebar, header, or action buttons during printing. | When printing the hall ticket, the entire app shell, sidebar, and buttons print alongside the hall ticket. |

### 3.2. Functional Bugs & Logic Defects ("bg" = Bugs)

1. **Bug S-1: Missing `onSuccess` Handlers on Modals in `student-workspace.tsx`**
   - **Location:** [student-workspace.tsx:L440-L449](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/student/student-workspace.tsx#L440-L449)
   - **Description:** `<StudentGoalModal>` and `<SupportRequestModal>` support `onSuccess?: () => void` to trigger a reload of progress goals and communication threads. However, `student-workspace.tsx` renders them without `onSuccess`. When a student creates an academic goal or submits a support doubt, the modal closes, but the underlying pane never reloads.
2. **Bug S-2: HPC Self-Reflection Persistence Gap**
   - **Location:** [progress-pane.tsx:L49-L53](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/student/panes/progress-pane.tsx#L49-L53)
   - **Description:** Clicking "Save Self-Reflection" in the CBSE Holistic Progress Card tab only sets a temporary state `hpcSaved = true` for 2.5 seconds without persisting ratings or text to the API or localStorage.
3. **Bug S-3: Sub-Pane Action Routing Guard**
   - **Location:** [student-workspace.tsx:L89-L93](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/student/student-workspace.tsx#L89-L93)
   - **Description:** `navigateTo(tab)` strictly verifies whether the tab exists in `navigation.sections`. If section keys are prefixed (e.g. `academics.assignments`), some quick action buttons (like "Submit Homework" in `DashboardPane`) can fail to switch tabs if the navigation section has not resolved.
4. **Bug S-4: Lecture Player Completion Sync**
   - **Location:** [lecture-player-modal.tsx:L29-L42](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/student/components/lecture-player-modal.tsx#L29-L42)
   - **Description:** In `student-workspace.tsx`, `LecturePlayerModal` is invoked without `onSuccess`, so marking a lecture complete does not refresh watch progress in `ResourcesPane`.

---

## 4. Proposed Target Architecture

### 4.1. Parent Portal Architecture Refactoring
We will restructure the parent portal to follow the exact modular architecture used by `StudentWorkspace`, `TeacherWorkspace`, and `PrincipalWorkspace`:

```
frontend/app/
├── parent/                                  <-- New Modular Parent Workspace Directory
│   ├── index.ts                             <-- Clean module exports
│   ├── types.ts                             <-- ParentTab, Ward, Leave, Ptm, Fee types
│   ├── parent-workspace.tsx                 <-- Top header, Obsidian sidebar, Ward switcher, quick actions
│   ├── panes/
│   │   ├── overview-pane.tsx                <-- Family KPI metrics, today's schedule radar, recent teacher notes
│   │   ├── academics-pane.tsx               <-- Ward dossier, subject breakdown, term scores, report preview
│   │   ├── attendance-pane.tsx              <-- Dynamic monthly calendar, 75% CBSE compliance, leave requests
│   │   ├── fees-pane.tsx                    <-- [NEW] Tuition ledger, installment breakdown, payment simulation, GST receipts
│   │   ├── ptm-pane.tsx                     <-- [NEW] 1-on-1 PTM slot booking, conference schedules, meeting links
│   │   └── notices-pane.tsx                 <-- Circular bulletins, teacher messages, Principal grievance tracking
│   └── components/
│       ├── apply-leave-modal.tsx            <-- Digital leave request with date validation
│       ├── parent-query-modal.tsx           <-- Grievance submission to Principal Desk
│       ├── ptm-booking-modal.tsx            <-- [NEW] Slot reservation with teacher & notes
│       ├── fee-payment-modal.tsx            <-- [NEW] Interactive payment simulation & receipt generator
│       └── report-card-modal.tsx            <-- CBSE Term 1 & 2 holistic progress card
```

### 4.2. Wiring Parent Workspace in `page.tsx`
Update [page.tsx](file:///Users/rajaryan/Desktop/EDOPS/EDOPS/frontend/app/page.tsx) to mount `ParentWorkspace` as a first-class citizen:

```tsx
// frontend/app/page.tsx
if (membership.role === "student") {
  return (
    <StudentWorkspace
      key={workspace}
      organization={membership}
      onLogout={signOut}
      onSwitchOrganization={switchWorkspace}
      organizations={profile.organizations}
    />
  );
}

if (membership.role === "parent") {
  return (
    <ParentWorkspace
      key={workspace}
      organization={membership}
      onLogout={signOut}
      onSwitchOrganization={switchWorkspace}
      organizations={profile.organizations}
    />
  );
}
```

This completely eliminates the legacy `.sidebar` (`#064E3B`) and `.welcome-row` clash for parent users!

---

## 5. Implementation Roadmap & Checklist

### Phase 1: Parent Workspace Modernization & Background Unification
- [ ] **Create `frontend/app/parent/` module directory structure**.
- [ ] **Build `ParentWorkspace` component** (`parent/parent-workspace.tsx`):
  - Sticky top header (`bg-white border-b border-slate-200`) with EdOps brand, "Parent Guardian Portal" badge, profile pill, and org switcher.
  - Persistent multi-ward switcher in header with active status indicators (e.g. "Aarav Sharma · 10-A" vs "Ananya Sharma · 6-B").
  - Universal Midnight Obsidian sidebar (`bg-[#090D16] border-r border-[#1A243D]`) with active item `bg-slate-700 text-white font-bold` and inactive hover `bg-[#131C31]`.
  - Mobile drawer with backdrop overlay (`bg-[#070A10]/60 backdrop-blur-xs`).
- [ ] **Wire `ParentWorkspace` into `page.tsx`** for `membership.role === "parent"`.
- [ ] **Update `dashboard-navigation.ts`**:
  - Add navigation sections for `overview`, `academics`, `attendance`, `fees`, `ptm`, `communication`.

### Phase 2: Missing Parent Feature Panes & Ward Reactivity
- [ ] **Refactor `OverviewPane`**:
  - Connect KPI metrics and schedule radar dynamically to the currently selected ward (`selectedChildId`).
- [ ] **Refactor `AcademicsPane`**:
  - Display ward-specific curriculum, subjects (e.g., Grade 10 secondary subjects vs Grade 6 middle school subjects), and term gradebook.
- [ ] **Refactor `AttendancePane`**:
  - Implement a dynamic monthly calendar based on real calendar days and attendance statuses.
  - Wire leave application form with persistent state (stored in localStorage / mock DB with status workflow).
- [ ] **Build `FeesBillingPane` [NEW]**:
  - Itemized tuition, laboratory, sports, examination, and transport fees.
  - Due date countdowns and payment status badges (`Paid`, `Due`, `Upcoming`).
  - Interactive "Pay Fees Online" simulation modal with downloadable tax-compliant GST fee receipts.
- [ ] **Build `PtmBookingPane` [NEW]**:
  - Teacher conference slot scheduler with 10-minute time intervals.
  - "Book PTM Slot" modal with meeting mode selection (`In-Person` or `Google Meet / Video Conference`).
  - Active reservation card with cancel/reschedule option.
- [ ] **Refactor `NoticesGrievancePane`**:
  - Connect grievance queries directly to the `principal_parent_queries` data model.

### Phase 3: Student Dashboard Background Polish & Bug Fixes
- [ ] **Standardize Modal Backdrops**:
  - Update `StudentGoalModal`, `SupportRequestModal`, `AssignmentSubmitModal`, and `LecturePlayerModal` to consistently use `bg-[#070A10]/60 backdrop-blur-xs`.
- [ ] **Add Mobile Sidebar Backdrop Overlay**:
  - In `student-workspace.tsx`, add a clickable backdrop overlay when `mobileMenuOpen === true` so tapping anywhere outside dismisses the sidebar.
- [ ] **Wire `onSuccess` Callbacks in `student-workspace.tsx`**:
  - Connect callbacks for `StudentGoalModal`, `SupportRequestModal`, `AssignmentSubmitModal`, and `LecturePlayerModal` so creating a goal, raising a doubt, or watching a lecture immediately refreshes active pane data.
- [ ] **Add Print-Specific CSS for Exam Hall Ticket**:
  - Add `@media print` styling in `exams-pane.tsx` so only the hall ticket card prints on clean white paper without dashboard headers or navigation.
- [ ] **Persist CBSE HPC Self-Reflection**:
  - Update `handleSaveHpc` in `progress-pane.tsx` to persist reflection answers to localStorage / API state.

### Phase 4: API & Fallback Contracts Synchronization
- [ ] **Update `frontend/app/edops-api.ts` & `mock-portal-data.ts`**:
  - Add parent fees and PTM slot mock generators tied to `mockStudents` and `mockParents`.
  - Ensure fallback data respects `Aarav Sharma` (Grade 10-A) and `Ananya Sharma` (Grade 6-B) ward linking.
- [ ] **Validate TypeScript & Build Integrity**:
  - Run `npx tsc --noEmit` to ensure 0 type errors across all new and modified components.

---

## 6. Verification Plan

| Verification Step | Target Criteria | Method |
| :--- | :--- | :--- |
| **Type Check** | Clean compile with 0 TypeScript errors | `npx tsc --noEmit` in `frontend` |
| **Visual Background Check** | Parent portal displays Midnight Obsidian sidebar (`#090D16`), no legacy green `#064E3B`, Ivory canvas (`#F8FAFC`), crisp cards | Inspect in browser |
| **Ward Switcher Reactivity** | Switching between Aarav (10-A) and Ananya (6-B) updates subjects, schedule, and attendance | Test ward switcher in Parent portal |
| **New Parent Panes** | Fees & Invoicing pane and PTM Booking pane render properly with interactive modals | Test fee payment and PTM slot booking |
| **Student Modal Polish** | All modals share unified `bg-[#070A10]/60` backdrop; goal and doubt creation triggers pane reloads | Create target goal and submit support doubt |
| **Mobile Responsiveness** | Sidebar drawer opens and closes smoothly with backdrop click-to-dismiss | Responsive viewport testing |

---

> [!IMPORTANT]
> **Awaiting User Approval:**  
> Review the audit findings and implementation plan above. Once you approve this roadmap, we will begin execution immediately starting with Phase 1.
