import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("navigation renders icons without invoking school screens", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(`${source}\nexport { NavIcon };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const require = createRequire(import.meta.url);
  const module = { exports: {} };
  // Isolate API/workspace imports; render the real page's navigation and icon library.
  new Function("require", "module", "exports", outputText)(
    (name) => name.startsWith("./") ? {} : require(name), module, module.exports,
  );
  for (const id of ["overview", "academics", "people", "assignments", "attendance", "updates", "recordings", "arena", "progress", "billing", "settings"]) {
    const html = renderToStaticMarkup(createElement(module.exports.NavIcon, { id }));
    assert.match(html, /^<svg/, `${id} must render an icon`);
    assert.doesNotMatch(html, /School profile/);
  }
});

test("renders role-specific home pages with accessible deadline calendars", async () => {
  const source = await readFile(new URL("../app/dashboard-home.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const require = createRequire(import.meta.url);
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (name) => name.startsWith("./") ? {} : require(name), module, module.exports,
  );
  for (const role of ["student", "teacher"]) {
    const html = renderToStaticMarkup(createElement(module.exports.DashboardHome, {
      organizationId: "school", role, onNavigate() {},
    }));
    assert.match(html, /aria-label="Previous month"/);
    assert.match(html, /aria-label="Next month"/);
    assert.match(html, /Dates reflect assignment deadlines, not a class timetable/);
    assert.match(html, /role="status"/);
    assert.doesNotMatch(html, /Billing|Total XP|undefined/);
    assert.match(html, role === "student" ? /See my previous grades/ : /Review class progress/);
    assert.match(html, role === "student" ? /Jump into Arena/ : /Open assignments/);
  }
});

test("renders the EDOPS dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>EDOPS — Connected school operations<\/title>/i);
  assert.match(html, /loading-screen/);
  assert.match(html, /loading-wordmark[^>]*>EDOPS/);
  assert.doesNotMatch(html, /edops-logo\.svg/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("defines a protected workspace for every authenticated role", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const role of ["platform", "school_admin", "teacher", "student", "parent"]) assert.match(source, new RegExp(`${role}:|${role}\\\"`));
  for (const panel of ["Teaching overview", "Previous grades", "Children", "Platform administration", "School workspace"]) assert.match(source, new RegExp(panel));
  assert.match(source, /ProfileMenu/);
});

test("keeps local UI and API requests on the same hostname", async () => {
  const source = await readFile(new URL("../app/edops-api.ts", import.meta.url), "utf8");
  assert.match(source, /window\.location\.hostname}:3001/);
  assert.doesNotMatch(source, /\? "http:\/\/127\.0\.0\.1:3001/);
  assert.match(source, /school profile response is incomplete/i);
});

test("supports teacher assignments and student enrollments from the dashboard", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const value of ["teacher-assignments", "teacherUserId", "subjectId", "enrollments", "studentUserId", "rollNumber"]) assert.match(source, new RegExp(value));
});

test("loads role-scoped academic data for teacher and student dashboards", async () => {
  const api = await readFile(new URL("../app/edops-api.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(api, /academics\/my-workspace/);
  for (const label of ["My teaching assignments", "Students in my sections", "My enrollment", "My subjects and teachers"]) assert.match(page, new RegExp(label));
});

test("provides real teacher and student learning workflows", async () => {
  const source = await readFile(new URL("../app/learning-workspace.tsx", import.meta.url), "utf8");
  for (const action of ["New assignment", "Submit assignment", "Save grade", "Take attendance", "Finalize register", "Upload recording", "New Arena question", "Check answer", "Mark read"]) assert.match(source, new RegExp(action));
  assert.doesNotMatch(source, /JSON request body|Run operation|endpoint-catalog/);
});
