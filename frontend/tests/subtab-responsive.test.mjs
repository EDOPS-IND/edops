import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("teacher-workspace maintains stable component keys across subtabs", async () => {
  const file = await readFile(new URL("../app/teacher/teacher-workspace.tsx", import.meta.url), "utf8");
  assert.match(file, /key={`learning-\${lessonRefreshKey}`}/);
  assert.match(file, /key={`assign-\${assignmentRefreshKey}`}/);
  assert.match(file, /key={`students-\${studentsRefreshKey}`}/);
  assert.match(file, /key="comm"/);
  assert.doesNotMatch(file, /key={`learning-\${lessonRefreshKey}-\${activeSubTab}`}/);
  assert.doesNotMatch(file, /key={`assign-\${assignmentRefreshKey}-\${activeSubTab}`}/);
});

test("student-workspace maintains stable component keys across subtabs", async () => {
  const file = await readFile(new URL("../app/student/student-workspace.tsx", import.meta.url), "utf8");
  assert.match(file, /key="assignments"/);
  assert.match(file, /key="perf"/);
  assert.match(file, /key="resources"/);
  assert.match(file, /key="progress"/);
  assert.doesNotMatch(file, /key={`assignments-\${activeSubTab}`}/);
});

test("principal-workspace maintains stable component keys across views", async () => {
  const file = await readFile(new URL("../app/principal/principal-workspace.tsx", import.meta.url), "utf8");
  assert.match(file, /key="planning"/);
  assert.match(file, /key="people"/);
  assert.match(file, /key="academics"/);
  assert.doesNotMatch(file, /key={activeView}/);
});

test("campus.css contains responsive dashboard and modal rules", async () => {
  const css = await readFile(new URL("../app/campus.css", import.meta.url), "utf8");
  assert.match(css, /\.workspace-content-canvas\s*{/);
  assert.match(css, /\.dashboard-hero-illustration\s*{[^}]*display:\s*none\s*!important/);
  assert.match(css, /\.form-grid\s*{[^}]*grid-template-columns:\s*1fr\s*!important/);
});

test("dashboard panes hide hero illustration and wrap metrics header on mobile", async () => {
  const teacherDash = await readFile(new URL("../app/teacher/panes/dashboard-pane.tsx", import.meta.url), "utf8");
  assert.match(teacherDash, /className="dashboard-hero-illustration"/);
  assert.match(teacherDash, /Instructional Overview &amp; Key Metrics/);
  assert.match(teacherDash, /flexWrap:\s*"wrap"/);

  const adminDash = await readFile(new URL("../app/school-admin/dashboard-pane.tsx", import.meta.url), "utf8");
  assert.match(adminDash, /className="dashboard-hero-illustration"/);
  assert.match(adminDash, /School Operational Overview &amp; Key Metrics/);
  assert.match(adminDash, /flexWrap:\s*"wrap"/);
});

test("mobile headers hide non-essential shortcut buttons", async () => {
  const parentWs = await readFile(new URL("../app/parent/parent-workspace.tsx", import.meta.url), "utf8");
  assert.match(parentWs, /className="hidden sm:inline-flex"[^>]*>\s*<Plus[^>]*\/>\s*Apply Leave/);
  assert.match(parentWs, /className="hidden sm:inline-flex"[^>]*>\s*<CalendarDays[^>]*\/>\s*Book PTM/);

  const teacherWs = await readFile(new URL("../app/teacher/teacher-workspace.tsx", import.meta.url), "utf8");
  assert.match(teacherWs, /className="hidden sm:inline-flex"[^>]*>[\s\S]*?Mark Attendance/);
  assert.match(teacherWs, /className="hidden sm:inline-flex"[^>]*>[\s\S]*?New Assignment/);
});

test("auth screens fill full height on desktop without vertical cutoff", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  // LoginScreen, ResetPasswordScreen, and InviteScreen must stretch 100% height on desktop
  const matches = [...page.matchAll(/<main className="([^"]*)"/g)].map((m) => m[1]);
  for (const cls of matches) {
    assert.match(cls, /lg:h-screen/, "auth main container must specify lg:h-screen to resolve child percentage height");
  }
  const bannerMatches = [...page.matchAll(/<section className="([^"]*bg-\[#020617\][^"]*)"/g)].map((m) => m[1]);
  for (const cls of bannerMatches) {
    assert.match(cls, /lg:min-h-screen/, "banner must specify lg:min-h-screen to prevent white gaps at the bottom");
  }
});
