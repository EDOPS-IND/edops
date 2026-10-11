"use client";

import { useEffect, useState } from "react";
import { DashboardSection, getPlatformDashboardNavigation, OrganizationSummary, savePlatformDashboardItem, savePlatformDashboardSection } from "../edops-api";

const roles: { key: OrganizationSummary["role"]; label: string }[] = [
  { key: "school_admin", label: "School Admin" }, { key: "principal", label: "Principal" },
  { key: "teacher", label: "Teacher" }, { key: "student", label: "Student" }, { key: "parent", label: "Parent" },
];

export function DashboardNavigationEditor({ organizationId }: { organizationId: string }) {
  const [role, setRole] = useState<OrganizationSummary["role"]>("principal");
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    getPlatformDashboardNavigation(organizationId, role)
      .then(data => { if (live) { setSections(data); setError(""); } })
      .catch(reason => { if (live) { setSections([]); setError(reason.message); } });
    return () => { live = false; };
  }, [organizationId, role]);

  async function save(run: () => Promise<DashboardSection[]>) {
    setBusy(true);
    setError("");
    try { setSections(await run()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save dashboard navigation"); }
    finally { setBusy(false); }
  }

  function createSection() {
    const key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (!key || sections.some(section => section.key === key)) { setError("Enter a unique section name."); return; }
    save(() => savePlatformDashboardSection(organizationId, role, key, { label: label.trim(), sortOrder: sections.length }));
    setLabel("");
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4" aria-label="Dashboard sections and features">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-900">Dashboard sections and features</h4>
          <p className="text-xs text-gray-600">Arrange existing dashboard destinations for this tenant. Capability access is set in the role matrix above.</p>
        </div>
        <label className="text-xs font-medium">Role <select aria-label="Dashboard role" value={role} onChange={event => setRole(event.target.value as OrganizationSummary["role"])} className="ml-2 rounded border p-2">
          {roles.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select></label>
      </div>
      <div className="mb-4 flex gap-2">
        <input aria-label="New section name" value={label} onChange={event => setLabel(event.target.value)} placeholder="New section name" className="min-w-0 flex-1 rounded border p-2 text-sm" />
        <button type="button" disabled={busy || !label.trim()} onClick={createSection} className="rounded bg-emerald-900 px-3 py-2 text-sm text-white disabled:opacity-50">Add section</button>
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
      <div className="space-y-3">
        {sections.map(section => (
          <div key={section.key} className="rounded border border-gray-200 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="mr-auto text-xs">Section <input aria-label={`Name for ${section.label}`} defaultValue={section.label} key={`${role}.${section.key}.${section.label}`} onBlur={event => { const next = event.target.value.trim(); if (next && next !== section.label) save(() => savePlatformDashboardSection(organizationId, role, section.key, { label: next })); }} className="ml-1 rounded border p-1 text-sm font-semibold" /></label>
              <label className="text-xs">Order <input type="number" min={0} defaultValue={section.sortOrder} key={`${role}.${section.key}.${section.sortOrder}`} onBlur={event => { const next = Number(event.target.value); if (next !== section.sortOrder) save(() => savePlatformDashboardSection(organizationId, role, section.key, { sortOrder: next })); }} className="ml-1 w-14 rounded border p-1" /></label>
              <button type="button" disabled={busy} onClick={() => save(() => savePlatformDashboardSection(organizationId, role, section.key, { enabled: !section.enabled }))} className="rounded border px-2 py-1 text-xs">{section.enabled ? "Visible" : "Hidden"}</button>
            </div>
            <div className="mt-2 space-y-2">
              {section.items.map(item => (
                <div key={item.key} className="flex flex-wrap items-center gap-2 border-t pt-2 text-xs">
                  <span className="mr-auto min-w-40 font-medium">{item.label}<span className="ml-2 text-gray-500">{item.featureKey}</span></span>
                  <span className={item.effectiveEnabled ? "text-emerald-700" : "text-amber-700"}>{item.effectiveEnabled ? "Available" : "Unavailable"}</span>
                  <label>Order <input type="number" min={0} aria-label={`Order for ${item.label}`} defaultValue={item.sortOrder} key={`${role}.${item.key}.${item.sortOrder}`} onBlur={event => { const next = Number(event.target.value); if (next !== item.sortOrder) save(() => savePlatformDashboardItem(organizationId, role, item.key, { sortOrder: next })); }} className="ml-1 w-14 rounded border p-1" /></label>
                  <select aria-label={`Section for ${item.label}`} value={section.key} disabled={busy} onChange={event => save(() => savePlatformDashboardItem(organizationId, role, item.key, { sectionKey: event.target.value }))} className="rounded border p-1">
                    {sections.map(destination => <option key={destination.key} value={destination.key}>{destination.label}</option>)}
                  </select>
                  <button type="button" disabled={busy} onClick={() => save(() => savePlatformDashboardItem(organizationId, role, item.key, { enabled: !item.enabled }))} className="rounded border px-2 py-1">{item.enabled ? "Show" : "Hide"}</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
