# EDOPS DESIGN SYSTEM SPECIFICATION
## "Midnight Obsidian & Ivory" (Darkish Blue-Black + Pure White)

---

### 1. DESIGN PHILOSOPHY & VISION
EdOps combines the authority, focus, and precision of a modern academic operating system with a high-contrast, premium aesthetic.

The product identity is built on a two-pillar balance:
1. **The Navigation Anchor (Midnight Obsidian)**: A deep, authoritative blend of darkish blue and pitch black (`#090D16` / `#0B0F19`) that commands focus, frames the workspace, and eliminates visual noise in navigation.
2. **The Workspace Canvas (Ivory White)**: A clean, distraction-free, hyper-legible white canvas (`#FFFFFF` / `#F8FAFC`) where curriculum data, timetables, gradebooks, attendance, and analytics breathe naturally with crisp typography.

---

### 2. COLOR PALETTE

#### A. Primary Dark (Midnight Obsidian — Darkish Blue & Black Mix)
| Token | Hex Value | Usage |
|---|---|---|
| `dark-obsidian-950` | `#070A10` | Sidebar deep backgrounds, high-contrast modal backdrops |
| `dark-obsidian-900` | `#090D16` | Main navigation sidebar, primary button normal state |
| `dark-obsidian-850` | `#0D1322` | Sidebar header, sidebar cards |
| `dark-obsidian-800` | `#131C31` | Inactive nav hover background, elevated dark cards |
| `dark-obsidian-active` | `#1E293B` | Active nav item background (high contrast separation) |
| `dark-obsidian-border` | `#1A243D` | Borders on dark surfaces, dividers, active indicators |
| `dark-obsidian-text-nav` | `#CBD5E1` | Inactive nav links (slate-200, contrast > 8.5:1 against #090D16) |
| `dark-obsidian-text-bright` | `#FFFFFF` | Active nav link text, high-emphasis text on dark surfaces |

#### B. Clean Workspace Light (Ivory & Pure White)
| Token | Hex Value | Usage |
|---|---|---|
| `light-canvas` | `#F8FAFC` | Main dashboard content background |
| `light-surface` | `#FFFFFF` | Cards, tables, modals, drawer content surfaces |
| `light-border` | `#E2E8F0` | Card borders, table dividers, secondary button borders |
| `light-border-subtle` | `#F1F5F9` | Subtle row separators, inner borders |
| `text-primary` | `#0F172A` | Primary headings, table headers, KPI values (ultra-crisp) |
| `text-secondary` | `#334155` | Body text, descriptions, labels |
| `text-muted` | `#64748B` | Secondary metadata, timestamps, helper text |

#### C. Semantic Accents
| Role | Color | Hex | Usage |
|---|---|---|---|
| Verification / Success | Emerald | `#10B981` | CBSE verified status, present attendance, passing |
| Alert / Attention | Amber | `#F59E0B` | Defaulters, pending evaluations, late submissions |
| Urgent / At-Risk | Rose | `#EF4444` | High risk students, absences, critical alerts |
| Academic Focus | Cobalt / Indigo | `#4F46E5` | LO tags, progress markers, subtle badges |

---

### 3. TYPOGRAPHY & HIERARCHY
- **Font Stack**: System UI / Inter (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- **Letter Spacing**:
  - Headings: `tracking-tight` (`-0.025em`) for modern authority.
  - Uppercase Labels & Badges: `tracking-wider` (`0.05em`) with `text-[10px]` or `text-xs` font-bold.
- **Hierarchy**:
  - Dashboard Page Titles: `text-xl sm:text-2xl font-bold text-slate-900`
  - Section Titles: `text-sm font-bold text-slate-900 uppercase tracking-wider`
  - Body Text: `text-xs sm:text-sm text-slate-600 font-medium`
  - Data / Metric Digits: `text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight`

---

### 4. COMPONENT CONTRACTS

#### A. Universal Navigation Sidebar
- **Background**: `bg-[#090D16]`
- **Border**: `border-r border-[#1A243D]`
- **Header**: Org identity with white bold title (`text-white`) and role badge (`bg-[#131C31] text-slate-200 border border-[#1A243D]`).
- **Nav Buttons**:
  - Inactive: `text-slate-200` (`#CBD5E1`) font-medium with hover `text-white` and `bg-[#131C31]` (guarantees contrast ratio > 8.5:1).
  - Active: Refined grey background `bg-slate-700 text-white font-bold shadow-sm border border-slate-600/40` (`#334155`) with white icon `text-white`.
  - Inactive Icons: `text-slate-400` / Active Icons: `text-white`.
  - Sub-items: Indented with `border-l border-[#243354] ml-5 pl-6` using `text-slate-300 hover:text-white` and active `bg-slate-700 text-white font-bold shadow-sm border border-slate-600/40` (neutral grey, never blue/indigo).
- **Bottom Session Pill**: Deep slate card (`#0D1322`) with green verified status indicator.

#### B. Hero Banners & Banner Buttons
- **Hero Banners**: Rich gradient (e.g., Indigo `from-indigo-700 via-indigo-600 to-indigo-800` or Emerald `from-emerald-600 to-teal-700`).
- **Banner Primary Action Button**: Explicitly styled with `#FFFFFF` background and `#3730A3` dark indigo text to ensure no CSS inheritance can cause whitening:
  ```tsx
  style={{ backgroundColor: '#FFFFFF', color: '#3730A3' }}
  className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm"
  ```
- **Banner Secondary Action Button**: Translucent white container with crisp white text:
  ```tsx
  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)' }}
  className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/25 transition-colors"
  ```

#### C. Universal Primary & Secondary Buttons
- **Primary Button**:
  - Tailwind: `bg-[#090D16] hover:bg-[#1E293B] text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs border border-[#1A243D] active:scale-[0.99] flex items-center gap-2`
  - Effect: Solid darkish-blue/black base, smooth lighting on hover.
- **Secondary Button**:
  - Tailwind: `bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors border border-slate-200 shadow-2xs flex items-center gap-2`
- **Subtle / Ghost Button**:
  - Tailwind: `text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors`

#### C. Content Surfaces & Cards
- **Card**: `bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5`
- **KPI Block**: `bg-white rounded-xl border border-slate-200/80 p-4 hover:border-slate-300 transition-colors`
- **Table Container**: `bg-white rounded-xl border border-slate-200 overflow-hidden`
  - Header: `bg-slate-50/75 border-b border-slate-200 text-slate-700 text-xs font-semibold`
  - Rows: `hover:bg-slate-50/60 border-b border-slate-100 transition-colors`

---

### 5. PRODUCT DASHBOARDS COVERED
This design specification applies uniformly across all 6 workspaces:
1. **Platform Admin Dashboard** (`platform-workspace.tsx`)
2. **School Admin Dashboard** (`school-admin-workspace.tsx`)
3. **Principal Dashboard** (`principal-workspace.tsx`)
4. **Teacher Dashboard** (`teacher-workspace.tsx`)
5. **Student Dashboard** (`student-workspace.tsx`)
6. **Parent Dashboard** (`parent-dashboard.tsx`)
