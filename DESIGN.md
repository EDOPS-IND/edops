# edops · Student Dashboard — Design Specification

Source: Figma file `Student-Portal--Community-`, node `2005:1679` ("edops · Student dashboard").
Desktop frame: 1024 px wide, minimum height 960 px.

---

## 1. Overview

A student dashboard with a fixed dark sidebar on the left and a light workspace on the right. The workspace contains a header bar, a greeting banner, a heading row, six metric cards, two status cards, and a context strip.

**Page structure (top to bottom, right column):**

1. Workspace header (68 px)
2. Announcement banner (180 px)
3. "Your Academic Overview" heading row
4. Metric grid (2 rows × 3 cards)
5. Academic status (2 cards side by side)
6. Academic context strip

---

## 2. Design Tokens

### 2.1 Colors

| Token | Hex / Value | Usage |
|---|---|---|
| `navy` | `#0c1e33` | Sidebar bg, primary text, primary button, progress fill |
| `slate` | `#495d72` | Secondary text |
| `muted` | `#a6abb5` | Sidebar item text, text on dark surfaces |
| `faint` | `#b3b3b3` | Hints (⌘ K, "Current academic year") |
| `page-bg` | `#f4f6f7` | Page and banner background |
| `white` | `#ffffff` | Header, cards |
| `border` | `#e4e6e9` | Card and banner borders, dividers |
| `line` | `#ced8e5` | Outline buttons, header divider |
| `header-border` | `rgba(206,216,229,0.97)` | Header bottom border |
| `chip` | `#f5f6f8` | Search bar, icon buttons, pills |
| `search-border` | `#ebedf2` | Search bar border |
| `blue` | `#17a1fa` | Avatar, initials tile |
| `track` | `#eceef3` | Progress bar track |
| `card-divider` | `#f2f2f2` | Divider inside the standing card |
| `sep` | `#5c6b80` | "/" separators in the banner |
| `green-bg` | `#d9eed1` | "All Clear" pill, clear message box |
| `green` | `#61a249` | "All Clear" text, check icon |
| `green-dark` | `#1a5c0a` | Clear message text |
| `on-dark-1` | `rgba(255,255,255,0.4)` | Sidebar section labels |
| `on-dark-2` | `rgba(255,255,255,0.1)` | Sidebar borders, dividers, active gradient start |

**Metric card palettes**

| Card | Background / border | Label, icon, note |
|---|---|---|
| Attendance Rate | `#e1d2ff` | `#4a0e8f` |
| Overall Score | `#fde1ac` | `#7a4a00` |
| Assignments Due | `#bae5f5` | `#0a5a7a` |
| Curriculum Pacing | `#ccefbf` | `#1a5c0a` |
| Arena Practice | `#ffd6d6` | `#7a1a1a` |
| Academic Average | `#0c1e33` | `#a6abb5` (value and "View" in white) |

On all light cards the value and "View" link use `#0c1e33`.

### 2.2 Typography

| Family | Use |
|---|---|
| **Poppins** (Regular 400, SemiBold 600, Bold 700) | All UI text |
| **Inter** Bold 700 | "edops" wordmark only |
| Rubik Regular | Wave emoji in the greeting (28 px) |

Line height is `normal` everywhere unless listed below.

| Size | Weight | Where |
|---|---|---|
| 10 px | 600 | Sidebar section labels, metric labels (uppercase), pills, card eyebrow |
| 11 px | 400 / 600 | Notes, "View", hints, sub-labels, profile role |
| 12 px | 600 / 400 | Workspace note title, profile name, context title, "3 of 8", clear subtext |
| 13 px | 400 / 600 | Nav items, body text, buttons, banner details |
| 14 px | 600 | Header title, clear message title |
| 17 px | 600 | "Your Academic Overview" |
| 18 px | 600 | Card titles |
| 22 px | 700 (Inter) | Wordmark |
| 26 px | 600 | Greeting |
| 36 px | 700 (600 on standing score) | Metric values, score. Line height 1 |

Specific line heights: workspace note text 1.6; standing result text 1.6; card paragraphs 1.5; context text 1.5; clear subtext 1.5.

### 2.3 Spacing scale

`2, 4, 6, 8, 10, 12, 16, 20, 24, 32` px. Odd values used once or twice: 7, 9, 11, 14, 15, 18, 28.

### 2.4 Radii

| Value | Use |
|---|---|
| 2 px | Active-nav dot |
| 4 px | Roll badge |
| 6 px | Buttons, search, workspace note, initials tile, clear message, nav active left corners |
| 8 px | Header icon buttons |
| 10 px | Banner, all cards |
| 12 px | Progress bar |
| 100 px | Pills |
| 50% | Avatar |

### 2.5 Shadows

None. Depth comes from borders and fills only.

---

## 3. Layout

### 3.1 Sidebar — "Primary navigation"

- Width 224 px, min height 960 px, background `navy`
- Padding 28 px top / 20 px sides / 24 px bottom; vertical gap 8 px
- Content, in order:
  1. **Brand**: book icon (26 px) + "edops" wordmark, gap 10, padding 0 12
  2. 20 px spacer
  3. **Navigation groups** (gap 4 px between items; label → first item 14 px; item → next label 24 px)
     - STUDENT WORKSPACE: Dashboard (active)
     - ACADEMICS: Attendance, Homework, Curriculum, Arena Practice, Assessments
     - SETTINGS: Account Settings, Logout
  4. **Student identity block** pinned to the bottom (left/right 20, bottom 24, gap 12):
     - Workspace note box: 1 px border `rgba(255,255,255,0.1)`, radius 6, padding 14, gap 7
     - 1 px divider
     - Profile: 34 px blue initials tile ("AR"), name "Alex Rivera", role "Student · 10-A"

**Nav item:** padding 11 × 12, gap 11, 13 px text, icon 18 px, color `muted`.
**Active item:** 6 px white left border, left corners radius 6, horizontal gradient from `rgba(255,255,255,0.1)` at 8.57 % to transparent, text white 600, 19 px icon, 4 px white dot on the right edge, vertically centered.

### 3.2 Workspace header

- Height 68 px, white, 1 px bottom border, padding 0 32
- Left: "Student Command Center" (14/600) · 1×16 divider · "Dashboard" (13, slate), gap 12
- Right (gap 20):
  - Search bar: 220 px wide, padding 6 × 14, gap 8, 16 px search icon, "Search" 13 px slate, "⌘ K" 11 px faint
  - Icon group (gap 16): messages button (36 px, radius 8), notifications button (36 px, radius 8), avatar (36 px circle, `#17a1fa`)

### 3.3 Dashboard overview

Padding 28 / 32 / 32 / 32, vertical gap 24.

**Banner**
- Height 180, background `page-bg`, 1 px `border`, radius 10, overflow clipped
- Left content: padding 28 × 32, gap 12
  - Greeting row (gap 10): 👋 28 px + "Good Morning, Alex Rivera!" 26/600
  - Details row (gap 10): "Student" / **10-A** / "Academic Year 2026–2027" + badge "Roll No: 101" (bg `rgba(12,30,51,0.05)`, padding 4 × 8, radius 4, 11/600)
  - Actions row (gap 10): Submit Homework (upload icon), Start Arena (play icon), Ask Teacher (chat icon, filled navy, white text)
  - Button: padding 10 × 16, gap 8, 1 px `line` border, radius 6, 13/600, icon 16 px
- Right: illustration 251 × 196 (two people talking, circular arrow, chat bubbles)

**Heading row**
- Left: "Your Academic Overview" 17/600 + pill "2026–2027" (padding 4 × 10, 10/600, slate)
- Right: "Current academic year" 11 px faint

**Metric grid** — 2 rows × 3 columns, gap 12, each card flex: 1, height 148
- Padding 20, 1 px border same as fill, radius 10, vertical gap 14
- Head: uppercase label (10/600) left, 18 px icon right
- Value: 36 px bold, line height 1
- Footer: note (11, left) and "View" + 14 px arrow (11/600, right)

| Row | Cards (label · value · note) |
|---|---|
| 1 | Attendance Rate · 0% · Below 75% threshold |
| 1 | Overall Score · 0% · +0% vs last term |
| 1 | Assignments Due · 0 · All submissions clear |
| 2 | Curriculum Pacing · 0% · Saved curriculum progress |
| 2 | Arena Practice · 0 · Questions answered |
| 2 | Academic Average · — · Saved assessment results |

**Academic status** — two equal cards, gap 16. Card: white, 1 px `border`, radius 10, padding 24, gap 20.

*Student Academic Standing*
- Eyebrow "EDOPS" (10/600 slate) over title "Student Academic Standing" (18/600); "Explain Score" (11/600) + 15 px help icon on the right
- Paragraph (13, line height 1.5, slate)
- 1 px `#f2f2f2` divider
- Result row (gap 24): 80 px score column ("—" 36/600, "/100" 11 slate) + detail column (gap 10): pill "No graded results" (padding 5 × 9, 10/600) and a 11 px / 1.6 explanatory line

*Attention Required*
- 19 px check-circle icon + title (18/600), gap 9; "All Clear" pill on the right (bg `#d9eed1`, text `#61a249`, padding 5 × 9)
- Paragraph 13 px slate: "Click any alert to open the recommended action loop."
- Clear message box: bg `#d9eed1`, padding 20, radius 6, gap 15; 26 px check icon; title 14/600 "All coursework is up to date."; subtext 12 / 1.5 "No pending submissions or alerts." — text color `#1a5c0a`

**Academic context strip**
- White, 1 px `border`, radius 10, padding 18 × 24, gap 24, items centered
- Guide (flexible): 18 px info icon + "How am I doing?" (12/600) over a 11 px / 1.5 slate line
- 1×34 divider
- Class Teacher (128 px wide): label 11 slate, value "—" 13
- 1×34 divider
- Semester Progress (160 px wide, gap 8): label 11 slate + "3 of 8" 12/600 + 14 px sort icon; 6 px track `#eceef3`, radius 12, fill 60 px (37.5 %) `navy`

---

## 4. Components

| Component | Variants | Notes |
|---|---|---|
| Nav item | default, active | See 3.1 |
| Button | outline, primary | See 3.3 |
| Pill | neutral (`#f5f6f8`), success (`#d9eed1`) | Fully rounded |
| Icon button | messages, notifications | 36 px, radius 8, bg `chip` |
| Metric card | 6 color themes | See 2.1 |
| Card | standard | White, bordered, radius 10 |
| Progress bar | — | 6 px, radius 12 |

---

## 5. Iconography

Icon set: **Vuesax (bold)** for solid icons, **Vuesax (linear)** for arrows; 18 px default. Sizes in use: 14, 15, 16, 18, 19, 20, 26.

Icons used: element-4, calendar-tick, clipboard-text, book, menu-board, note-2, setting-2, logout, search-normal, messages, notification, trend-up, archive-book, alarm, arrow-right, arrow-3 (sort), plus custom upload, play, message, help-circle, check-circle, info.

---

## 6. Responsive Behavior

The Figma file only defines the desktop layout. The tablet and mobile rules below were added in the HTML implementation and are **not** from the design.

| Breakpoint | Behavior |
|---|---|
| > 1024 px | As designed. Sidebar visible and sticky |
| ≤ 1024 px | Sidebar becomes a collapsible panel below the header, toggled by a hamburger button (`aria-expanded`, CSS transition). Metric grid becomes 2 columns. Search narrows to 160 px |
| ≤ 768 px | Metric grid 1 column. Status cards stack. Banner height auto, illustration hidden. Context strip stacks with horizontal dividers. Search, messages button and breadcrumb hidden |

---

## 7. Notes and Known Gaps

- Icons and the banner illustration in the HTML are redrawn approximations; the original Figma vector assets were not downloadable from the build environment.
- All numeric values (0%, 0, —) are placeholder/empty-state data, as designed.
- The avatar in Figma is a solid blue circle; no photo is used.