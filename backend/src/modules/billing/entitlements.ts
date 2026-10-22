import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";

export interface Queryable {
  query: (sql: string, params?: any[]) => Promise<any>;
}

export type Feature =
  | "arena"
  | "recordings"
  | "communication"
  | "assessments"
  | "exams"
  | string;
export const featureKeys: Feature[] = [
  "arena",
  "recordings",
  "communication",
  "assessments",
  "exams",
];

export async function entitlements(
  m: Queryable,
  org: string,
  role?: string | null,
) {
  const [row] = await m.query(
    `SELECT coalesce(s.status,'trialing') AS status,
    coalesce(s.period_start,o.created_at) AS period_start,coalesce(s.period_end,o.created_at+interval '30 days') AS period_end,
    coalesce(p.max_students,500) AS max_students,coalesce(p.max_teachers,50) AS max_teachers,
    coalesce(p.features,'{"arena":true,"recordings":true,"communication":true,"assessments":true,"exams":true}'::jsonb) AS features,
    s.id IS NULL AS implicit_trial,
    (coalesce(s.status,'trialing') IN ('trialing','active') AND now()>=coalesce(s.period_start,o.created_at)
      AND now()<coalesce(s.period_end,o.created_at+interval '30 days') AND o.status='active') AS entitled
    FROM organizations o LEFT JOIN subscriptions s ON s.organization_id=o.id LEFT JOIN plans p ON p.id=s.plan_id WHERE o.id=$1`,
    [org],
  );
  if (!row) throw new NotFoundException("Organization not found");
  const flags = await m.query(
    "SELECT feature_key,enabled FROM feature_flags WHERE organization_id=$1",
    [org],
  );
  const overrides = await m.query(
    `SELECT feature_key, role, enabled, custom_limit, custom_quota FROM feature_overrides
     WHERE organization_id=$1 AND (expiry_date IS NULL OR expiry_date > now())`,
    [org],
  );

  // Base features from plan and flags
  const features: Record<string, boolean> = {};
  for (const f of featureKeys) {
    const isCoreAcademic = f === "assessments" || f === "exams";
    const planVal = row.features?.[f] ?? (isCoreAcademic ? true : undefined);
    features[f] =
      row.entitled &&
      (flags.find((x: { feature_key: string }) => x.feature_key === f)
        ?.enabled ?? planVal) === true;
  }
  // Catalog features from plan JSONB if present
  if (row.features && typeof row.features === "object") {
    for (const [k, v] of Object.entries(row.features)) {
      if (typeof v === "boolean")
        features[k] =
          row.entitled &&
          (flags.find((x: { feature_key: string }) => x.feature_key === k)
            ?.enabled ??
            v);
    }
  }
  // Navigation destinations are available by default while a school is entitled.
  // Plans, school flags and overrides can still turn each destination off.
  const navigationKeys = await m.query(
    "SELECT key FROM feature_catalog WHERE key LIKE 'nav:%'",
  );
  for (const { key } of navigationKeys as { key: string }[]) {
    features[key] =
      row.entitled &&
      (flags.find((x: { feature_key: string }) => x.feature_key === key)
        ?.enabled ??
        row.features?.[key] ??
        true);
  }
  // 1. Apply school-wide overrides (where role is NULL or 'ALL')
  for (const ov of overrides.filter((o: any) => !o.role || o.role === "ALL")) {
    features[ov.feature_key] = row.entitled && ov.enabled;
  }
  // 2. Apply role-specific override if role requested
  if (role) {
    for (const ov of overrides.filter((o: any) => o.role === role)) {
      features[ov.feature_key] = row.entitled && ov.enabled;
    }
  }

  return {
    status: row.status,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    implicitTrial: row.implicit_trial,
    entitled: row.entitled as boolean,
    maxStudents: row.max_students as number,
    maxTeachers: row.max_teachers as number,
    features,
    overrides,
  };
}
export async function requireFeature(
  m: Queryable,
  org: string,
  feature: Feature,
  role?: string | null,
) {
  const e = await entitlements(m, org, role);
  if (!e.features[feature])
    throw new ForbiddenException(
      `Feature '${feature}' is not enabled for this school subscription or role`,
    );
}
export async function seatUsage(m: Queryable, org: string) {
  const [row] = await m.query(
    `SELECT
    (SELECT count(*)::int FROM memberships WHERE organization_id=$1 AND role='student' AND status='active') AS students,
    (SELECT count(*)::int FROM memberships WHERE organization_id=$1 AND role='teacher' AND status='active') AS teachers,
    (SELECT count(*)::int FROM invitations WHERE organization_id=$1 AND role='student' AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()) AS pending_students,
    (SELECT count(*)::int FROM invitations WHERE organization_id=$1 AND role='teacher' AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()) AS pending_teachers`,
    [org],
  );
  return {
    students: row.students as number,
    teachers: row.teachers as number,
    pendingStudents: row.pending_students as number,
    pendingTeachers: row.pending_teachers as number,
  };
}
export async function requireSeats(
  m: Queryable,
  org: string,
  students: number,
  teachers: number,
) {
  const e = await entitlements(m, org),
    usage = await seatUsage(m, org);
  if (!e.entitled)
    throw new ForbiddenException(
      "An active subscription or trial is required to add school members",
    );
  if (
    (students > 0 &&
      usage.students + usage.pendingStudents + students > e.maxStudents) ||
    (teachers > 0 &&
      usage.teachers + usage.pendingTeachers + teachers > e.maxTeachers)
  )
    throw new ConflictException(
      "Plan seat limit reached; pending invitations also reserve seats",
    );
}
