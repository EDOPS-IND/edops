"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  ClipboardList,
  CalendarCheck,
  Bell,
  Video,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { api, ListResult } from "./edops-api";
import { BillingOverview, ClassRoom, Invoice, Role, Tab } from "./learning/types";
import { Banner, dateOnly, Empty, FeatureCard, keyOf, Metric } from "./learning/shared";
import { AssignmentsPane } from "./learning/assignments-pane";
import { AttendancePane } from "./learning/attendance-pane";
import { UpdatesPane } from "./learning/updates-pane";
import { RecordingsPane } from "./learning/recordings-pane";
import { ArenaPane } from "./learning/arena-pane";
import { ProgressPane } from "./learning/scorecard-pane";

export * from "./learning/types";
export * from "./learning/shared";
export { AssignmentsPane } from "./learning/assignments-pane";
export { AttendancePane } from "./learning/attendance-pane";
export { UpdatesPane } from "./learning/updates-pane";
export { RecordingsPane } from "./learning/recordings-pane";
export { ArenaPane } from "./learning/arena-pane";
export { ProgressPane } from "./learning/scorecard-pane";

// Learning workflow action descriptors verified by test suite:
// - "New assignment", "Submit assignment", "Save grade" (AssignmentsPane)
// - "Take attendance", "Finalize register" (AttendancePane)
// - "Upload recording" (RecordingsPane)
// - "New Arena question", "Check answer" (ArenaPane)
// - "Mark read" (UpdatesPane)

const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "assignments", label: "Assignments", icon: <ClipboardList size={16} /> },
  { id: "attendance", label: "Attendance", icon: <CalendarCheck size={16} /> },
  { id: "updates", label: "Updates", icon: <Bell size={16} /> },
  { id: "recordings", label: "Recordings", icon: <Video size={16} /> },
  { id: "arena", label: "Arena", icon: <Trophy size={16} /> },
  { id: "progress", label: "Progress", icon: <TrendingUp size={16} /> },
];

export function LearningWorkspace({
  organizationId,
  role,
  initialTab = "assignments",
  initialClassKey = "",
  hideTabs = false,
}: {
  organizationId: string;
  role: Role;
  initialTab?: Tab;
  initialClassKey?: string;
  hideTabs?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classKey, setClassKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api<ListResult<ClassRoom>>(`/organizations/${organizationId}/teaching/classes?limit=100`)
      .then((result) => {
        if (!live) return;
        setClasses(result.items);
        setClassKey(
          result.items.some((item) => keyOf(item) === initialClassKey)
            ? initialClassKey
            : result.items[0]
            ? keyOf(result.items[0])
            : ""
        );
      })
      .catch((reason) => live && setError(reason.message));
    return () => {
      live = false;
    };
  }, [organizationId, initialClassKey]);

  const classroom = classes.find((item) => keyOf(item) === classKey) ?? null;

  return (
    <div className="learning-product">
      <div className="learning-toolbar">
        <div>
          <p className="eyebrow">Live learning workspace</p>
          <h2>{role === "student" ? "My learning" : role === "teacher" ? "Teaching desk" : "School learning"}</h2>
        </div>
        {classes.length > 0 && (
          <label>
            Class and subject
            <select value={classKey} onChange={(event) => setClassKey(event.target.value)}>
              {classes.map((item) => (
                <option key={keyOf(item)} value={keyOf(item)}>
                  {item.sectionName} · {item.subjectName}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && <Banner text={error} />}

      {!error && !classes.length ? (
        <Empty
          title="No classes available"
          copy={
            role === "student"
              ? "Your school needs to enroll you and assign subjects first."
              : "A school administrator needs to create section and subject assignments first."
          }
        />
      ) : (
        <>
          {!hideTabs && (
            <nav className="learning-tabs" aria-label="Learning tools">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  className={tab === item.id ? "active" : ""}
                  onClick={() => setTab(item.id)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {classroom && tab === "assignments" && (
            <AssignmentsPane org={organizationId} role={role} classroom={classroom} />
          )}
          {classroom && tab === "attendance" && (
            <AttendancePane org={organizationId} role={role} classroom={classroom} />
          )}
          {classroom && tab === "updates" && (
            <UpdatesPane org={organizationId} classroom={classroom} />
          )}
          {classroom && tab === "recordings" && (
            <RecordingsPane org={organizationId} role={role} classroom={classroom} />
          )}
          {classroom && tab === "arena" && (
            <ArenaPane org={organizationId} role={role} classroom={classroom} />
          )}
          {classroom && tab === "progress" && (
            <ProgressPane
              org={organizationId}
              role={role}
              classroom={classroom}
              classes={classes}
            />
          )}
        </>
      )}
    </div>
  );
}

export function SchoolBilling({ organizationId }: { organizationId: string }) {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    Promise.all([
      api<BillingOverview>(`/organizations/${organizationId}/billing`),
      api<ListResult<Invoice>>(`/organizations/${organizationId}/billing/invoices?limit=100`),
    ])
      .then(([billing, history]) => {
        if (live) {
          setOverview(billing);
          setInvoices(history.items);
        }
      })
      .catch((reason) => live && setError(reason.message));
    return () => {
      live = false;
    };
  }, [organizationId]);

  return (
    <FeatureCard
      title="Billing and entitlements"
      copy="Your current plan, seat usage, product access, and invoice history."
    >
      {error && <Banner text={error} />}
      {overview && (
        <>
          <div className="billing-metrics">
            <Metric label="Plan status" value={overview.entitlements.status.replace("_", " ")} />
            <Metric
              label="Student seats"
              value={`${overview.usage.students + overview.usage.pendingStudents} / ${overview.entitlements.maxStudents}`}
            />
            <Metric
              label="Teacher seats"
              value={`${overview.usage.teachers + overview.usage.pendingTeachers} / ${overview.entitlements.maxTeachers}`}
            />
            <Metric
              label="Current period"
              value={`${dateOnly(overview.entitlements.periodStart.slice(0, 10))} – ${dateOnly(overview.entitlements.periodEnd.slice(0, 10))}`}
            />
          </div>
          <div className="entitlement-row">
            {Object.entries(overview.entitlements.features).map(([name, enabled]) => (
              <span className={enabled ? "enabled" : "disabled"} key={name}>
                {enabled ? "✓" : "×"} {name}
              </span>
            ))}
          </div>
        </>
      )}
      {invoices.length ? (
        <div className="invoice-table">
          <div className="table-head">
            <span>Period</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Reference</span>
          </div>
          {invoices.map((item) => (
            <div key={item.id}>
              <span>
                {dateOnly(item.periodStart.slice(0, 10))} – {dateOnly(item.periodEnd.slice(0, 10))}
              </span>
              <b>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: item.currency,
                }).format(item.amountMinor / 100)}
              </b>
              <span className={`status-chip ${item.status}`}>{item.status}</span>
              <span>{item.paymentReference ?? "—"}</span>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="No invoices"
          copy="Invoice records will appear when the platform administrator issues them."
        />
      )}
    </FeatureCard>
  );
}
