import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export type Feature = 'arena' | 'recordings' | 'communication' | string;
export const featureKeys: Feature[] = ['arena','recordings','communication'];

export async function entitlements(m: EntityManager, org: string) {
  const [row] = await m.query(`SELECT coalesce(s.status,'trialing') AS status,
    coalesce(s.period_start,o.created_at) AS period_start,coalesce(s.period_end,o.created_at+interval '30 days') AS period_end,
    coalesce(p.max_students,500) AS max_students,coalesce(p.max_teachers,50) AS max_teachers,
    coalesce(p.features,'{"arena":true,"recordings":true,"communication":true}'::jsonb) AS features,
    s.id IS NULL AS implicit_trial,
    (coalesce(s.status,'trialing') IN ('trialing','active') AND now()>=coalesce(s.period_start,o.created_at)
      AND now()<coalesce(s.period_end,o.created_at+interval '30 days') AND o.status='active') AS entitled
    FROM organizations o LEFT JOIN subscriptions s ON s.organization_id=o.id LEFT JOIN plans p ON p.id=s.plan_id WHERE o.id=$1`, [org]);
  if (!row) throw new NotFoundException('Organization not found');
  const flags = await m.query('SELECT feature_key,enabled FROM feature_flags WHERE organization_id=$1',[org]);
  const overrides = await m.query(
    `SELECT feature_key, enabled, custom_limit, custom_quota FROM feature_overrides 
     WHERE organization_id=$1 AND (expiry_date IS NULL OR expiry_date > now())`, [org]
  );
  
  // Base features from plan and flags
  const features: Record<string, boolean> = {};
  for (const f of featureKeys) {
    features[f] = row.entitled && (flags.find((x: {feature_key: string}) => x.feature_key===f)?.enabled ?? row.features[f]) === true;
  }
  // Catalog features from plan JSONB if present
  if (row.features && typeof row.features === 'object') {
    for (const [k, v] of Object.entries(row.features)) {
      if (typeof v === 'boolean') features[k] = row.entitled && v;
    }
  }
  // Apply school overrides
  for (const ov of overrides) {
    features[ov.feature_key] = row.entitled && ov.enabled;
  }

  return { status: row.status, periodStart: row.period_start, periodEnd: row.period_end, implicitTrial: row.implicit_trial,
    entitled: row.entitled as boolean, maxStudents: row.max_students as number, maxTeachers: row.max_teachers as number, features, overrides };
}
export async function requireFeature(m: EntityManager, org: string, feature: Feature) {
  const e = await entitlements(m,org);
  if (!e.features[feature]) throw new ForbiddenException(`Feature '${feature}' is not enabled for this school subscription`);
}
export async function seatUsage(m: EntityManager, org: string) {
  const [row] = await m.query(`SELECT
    (SELECT count(*)::int FROM memberships WHERE organization_id=$1 AND role='student' AND status='active') AS students,
    (SELECT count(*)::int FROM memberships WHERE organization_id=$1 AND role='teacher' AND status='active') AS teachers,
    (SELECT count(*)::int FROM invitations WHERE organization_id=$1 AND role='student' AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()) AS pending_students,
    (SELECT count(*)::int FROM invitations WHERE organization_id=$1 AND role='teacher' AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now()) AS pending_teachers`,[org]);
  return { students:row.students as number, teachers:row.teachers as number, pendingStudents:row.pending_students as number, pendingTeachers:row.pending_teachers as number };
}
export async function requireSeats(m: EntityManager, org: string, students: number, teachers: number) {
  const e = await entitlements(m,org), usage = await seatUsage(m,org);
  if (!e.entitled) throw new ForbiddenException('An active subscription or trial is required to add school members');
  if ((students>0 && usage.students+usage.pendingStudents+students>e.maxStudents) ||
      (teachers>0 && usage.teachers+usage.pendingTeachers+teachers>e.maxTeachers)) throw new ConflictException('Plan seat limit reached; pending invitations also reserve seats');
}
