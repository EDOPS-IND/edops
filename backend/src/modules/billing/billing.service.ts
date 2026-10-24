import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { isDeepStrictEqual } from "node:util";
import { AcademicListDto } from "../academics/academic.dto";
import { AuditService } from "../audit/audit.service";
import { User } from "../auth/user.entity";
import { SchoolWork } from "../tenants/school-work.service";
import { randomBytes } from "node:crypto";
import { tokenHash } from "../auth/password";
import {
  CreatePlanDto,
  FeatureOverrideDto,
  PayInvoiceDto,
  SubscriptionDto,
  CreateSupportTicketDto,
  UpdateSupportTicketStatusDto,
  StartSupportSessionDto,
  CreateAnnouncementDto,
  RecordPaymentDto,
  RefundPaymentDto,
  DetailedFeatureOverrideDto,
  SchoolLifecycleTransitionDto,
  OnboardSchoolFullDto,
  UpdateSchoolDetailsDto,
} from "./billing.dto";
import { entitlements, seatUsage } from "./entitlements";
import {
  dashboardRoles,
  DashboardRole,
  dashboardSections,
} from "./dashboard-navigation";

import { DrizzleService } from "../../database/drizzle.service";
import { Queryable } from "./entitlements";
import { MailService } from "../notifications/mail.service";

const planFields = `id,name,amount_minor AS "amountMinor",currency,billing_cycle AS "billingCycle",max_students AS "maxStudents",max_teachers AS "maxTeachers",features,active,created_at AS "createdAt"`;
const subscriptionFields = `id,organization_id AS "organizationId",plan_id AS "planId",status,period_start AS "periodStart",period_end AS "periodEnd",updated_at AS "updatedAt"`;
const invoiceFields = `id,organization_id AS "organizationId",subscription_id AS "subscriptionId",plan_id AS "planId",amount_minor AS "amountMinor",currency,period_start AS "periodStart",period_end AS "periodEnd",status,payment_reference AS "paymentReference",paid_at AS "paidAt",created_at AS "createdAt"`;

@Injectable()
export class BillingService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly work: SchoolWork,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  private async validatePlanFeatures(
    m: Queryable,
    features: Record<string, boolean>,
  ) {
    if (!features || typeof features !== "object" || Array.isArray(features))
      throw new BadRequestException("Features must be an object");
    const keys = new Set<string>([
      "arena",
      "recordings",
      "communication",
      ...(await m.query("SELECT key FROM feature_catalog")).map(
        (row: { key: string }) => row.key,
      ),
    ]);
    for (const [key, enabled] of Object.entries(features)) {
      if (!keys.has(key) || typeof enabled !== "boolean")
        throw new BadRequestException(`Invalid feature setting: ${key}`);
    }
    return features;
  }

  private dashboardRole(role: string): asserts role is DashboardRole {
    if (!dashboardRoles.includes(role as DashboardRole))
      throw new BadRequestException("Unknown dashboard role");
  }

  private async navigationRows(
    m: Queryable,
    org: string,
    role: DashboardRole,
    includeDisabled: boolean,
  ) {
    const sections = await m.query(
      `SELECT DISTINCT ON (key) key,label,sort_order AS "sortOrder",enabled
      FROM dashboard_sections WHERE role=$2 AND (organization_id IS NULL OR organization_id=$1)
      ORDER BY key, organization_id IS NOT NULL DESC`,
      [org, role],
    );
    const items = await m.query(
      `SELECT DISTINCT ON (key) key,section_key AS "sectionKey",label,feature_key AS "featureKey",sort_order AS "sortOrder",enabled
      FROM dashboard_items WHERE role=$2 AND (organization_id IS NULL OR organization_id=$1)
      ORDER BY key, organization_id IS NOT NULL DESC`,
      [org, role],
    );
    const effective = await entitlements(m, org, role);
    return sections
      .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .map((section: any) => ({
        ...section,
        items: items
          .filter((item: any) => item.sectionKey === section.key)
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          .map((item: any) => ({
            ...item,
            effectiveEnabled:
              effective.entitled &&
              section.enabled &&
              item.enabled &&
              effective.features[item.featureKey] !== false,
          }))
          .filter((item: any) => includeDisabled || item.effectiveEnabled),
      }))
      .filter(
        (section: any) =>
          includeDisabled || (section.enabled && section.items.length > 0),
      );
  }

  defaultNavigationForRole(role: DashboardRole) {
    const matchingSections = dashboardSections.filter((s) => s.role === role);
    return matchingSections.map((s, sIdx) => ({
      key: s.key,
      label: s.label,
      sortOrder: (sIdx + 1) * 10,
      enabled: true,
      items: s.items.map((itemStr, iIdx) => {
        const [key, label] = itemStr.split("|");
        return {
          key: `${s.key}.${key}`,
          sectionKey: s.key,
          label,
          sortOrder: (iIdx + 1) * 10,
          enabled: true,
          effectiveEnabled: true,
        };
      }),
    }));
  }

  async dashboardNavigation(
    org: string,
    actor: User,
    role: string,
    platform = false,
  ) {
    this.dashboardRole(role);
    try {
      if (platform)
        return await this.platform(actor, (m) =>
          this.navigationRows(m, org, role, true),
        );
      const [member] = await this.drizzle.query(
        `SELECT 1 FROM memberships m JOIN organizations o ON o.id=m.organization_id
        WHERE m.organization_id=$1 AND m.user_id=$2 AND m.role=$3 AND m.status='active' AND o.status='active'`,
        [org, actor.id, role],
      );
      if (!member)
        throw new ForbiddenException("Active school membership required");
      return await this.navigationRows(this.drizzle, org, role, false);
    } catch (err) {
      throw err;
    }
  }

  saveDashboardSection(
    actor: User,
    org: string,
    role: string,
    key: string,
    input: { label?: string; sortOrder?: number; enabled?: boolean },
  ) {
    this.dashboardRole(role);
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new BadRequestException("Section settings are required");
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(key))
      throw new BadRequestException("Invalid section key");
    return this.platform(actor, async (m) => {
      if (
        !(await m.query("SELECT 1 FROM organizations WHERE id=$1", [org]))
          .length
      )
        throw new NotFoundException("School not found");
      const [current] = await m.query(
        `SELECT key,label,sort_order AS "sortOrder",enabled FROM dashboard_sections
        WHERE role=$2 AND key=$3 AND (organization_id IS NULL OR organization_id=$1)
        ORDER BY organization_id IS NOT NULL DESC LIMIT 1`,
        [org, role, key],
      );
      const label = (input.label ?? current?.label)?.trim();
      if (!label || label.length > 100)
        throw new BadRequestException(
          "Section label is required (maximum 100 characters)",
        );
      const sortOrder = input.sortOrder ?? current?.sortOrder ?? 100;
      if (!Number.isInteger(sortOrder) || sortOrder < 0)
        throw new BadRequestException("Invalid section order");
      if (input.enabled !== undefined && typeof input.enabled !== "boolean")
        throw new BadRequestException("Invalid section status");
      await m.query(
        "DELETE FROM dashboard_sections WHERE organization_id=$1 AND role=$2 AND key=$3",
        [org, role, key],
      );
      await m.query(
        "INSERT INTO dashboard_sections(organization_id,role,key,label,sort_order,enabled) VALUES($1,$2,$3,$4,$5,$6)",
        [
          org,
          role,
          key,
          label,
          sortOrder,
          input.enabled ?? current?.enabled ?? true,
        ],
      );
      await this.audit.record(m, {
        organizationId: org,
        actorId: actor.id,
        action: "dashboard.section_updated",
        details: { role, key, input },
      });
      return this.navigationRows(m, org, role, true);
    });
  }

  saveDashboardItem(
    actor: User,
    org: string,
    role: string,
    key: string,
    input: {
      label?: string;
      sectionKey?: string;
      sortOrder?: number;
      enabled?: boolean;
    },
  ) {
    this.dashboardRole(role);
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new BadRequestException("Item settings are required");
    return this.platform(actor, async (m) => {
      if (
        !(await m.query("SELECT 1 FROM organizations WHERE id=$1", [org]))
          .length
      )
        throw new NotFoundException("School not found");
      const [current] = await m.query(
        `SELECT key,section_key AS "sectionKey",label,feature_key AS "featureKey",sort_order AS "sortOrder",enabled
        FROM dashboard_items WHERE role=$2 AND key=$3 AND (organization_id IS NULL OR organization_id=$1)
        ORDER BY organization_id IS NOT NULL DESC LIMIT 1`,
        [org, role, key],
      );
      if (!current)
        throw new NotFoundException("Dashboard item not registered");
      const sectionKey = input.sectionKey ?? current.sectionKey;
      const [section] = await m.query(
        `SELECT 1 FROM dashboard_sections WHERE role=$2 AND key=$3 AND (organization_id IS NULL OR organization_id=$1) LIMIT 1`,
        [org, role, sectionKey],
      );
      if (!section)
        throw new BadRequestException(
          "Target section does not exist for this role",
        );
      const sortOrder = input.sortOrder ?? current.sortOrder;
      if (!Number.isInteger(sortOrder) || sortOrder < 0)
        throw new BadRequestException("Invalid item order");
      if (input.enabled !== undefined && typeof input.enabled !== "boolean")
        throw new BadRequestException("Invalid item status");
      const label = (input.label ?? current.label)?.trim();
      if (!label || label.length > 100)
        throw new BadRequestException(
          "Item label is required (maximum 100 characters)",
        );
      await m.query(
        "DELETE FROM dashboard_items WHERE organization_id=$1 AND role=$2 AND key=$3",
        [org, role, key],
      );
      await m.query(
        `INSERT INTO dashboard_items(organization_id,role,key,section_key,label,feature_key,sort_order,enabled)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          org,
          role,
          key,
          sectionKey,
          label,
          current.featureKey,
          sortOrder,
          input.enabled ?? current.enabled,
        ],
      );
      await this.audit.record(m, {
        organizationId: org,
        actorId: actor.id,
        action: "dashboard.item_updated",
        details: { role, key, input },
      });
      return this.navigationRows(m, org, role, true);
    });
  }

  private async platform<T>(actor: User, fn: (m: Queryable) => Promise<T>) {
    return this.drizzle.transaction(async (m) => {
      const [user] = await m.query(
        "SELECT id FROM users WHERE id=$1 AND is_active=true AND is_platform_admin=true LIMIT 1",
        [actor.id],
      );
      if (!user)
        throw new ForbiddenException("Platform administrator access required");
      return fn(m);
    });
  }
  private scope<T>(
    org: string,
    actor: User,
    action: string | null,
    payload: unknown,
    key: string | undefined | null,
    fn: (m: any) => Promise<T>,
    platform = true,
  ) {
    return this.work.run(
      org,
      actor,
      action,
      payload,
      key,
      fn,
      platform
        ? { roles: [], platform: true, authorize: async () => {} }
        : undefined,
    );
  }
  createPlan(actor: User, dto: CreatePlanDto) {
    return this.platform(actor, async (m) => {
      const features = await this.validatePlanFeatures(m, dto.features);
      const rows = await m.query(
        `INSERT INTO plans(id,name,amount_minor,max_students,max_teachers,features) VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(id) DO NOTHING RETURNING ${planFields}`,
        [
          dto.id,
          dto.name,
          dto.amountMinor,
          dto.maxStudents,
          dto.maxTeachers,
          features,
        ],
      );
      if (!rows.length) {
        const [existing] = await m.query(
          `SELECT ${planFields} FROM plans WHERE id=$1`,
          [dto.id],
        );
        if (
          !existing ||
          existing.name !== dto.name ||
          existing.amountMinor !== dto.amountMinor ||
          existing.maxStudents !== dto.maxStudents ||
          existing.maxTeachers !== dto.maxTeachers ||
          !isDeepStrictEqual(existing.features, features)
        )
          throw new ConflictException(
            "Plan ID already has different immutable terms",
          );
        return existing;
      }
      await this.audit.record(m, {
        organizationId: null,
        actorId: actor.id,
        action: "plan.created",
        details: { planId: dto.id },
      });
      return rows[0];
    });
  }
  plans(actor: User, q: AcademicListDto) {
    return this.platform(actor, async (m) => {
      const [count] = await m.query("SELECT count(*)::int AS total FROM plans");
      const items = await m.query(
        `SELECT ${planFields} FROM plans ORDER BY created_at DESC,id LIMIT $1 OFFSET $2`,
        [q.limit, q.offset],
      );
      return { items, total: count.total, limit: q.limit, offset: q.offset };
    });
  }
  planStatus(actor: User, id: string, active: boolean) {
    return this.platform(actor, async (m) => {
      const [row] = await m.query(
        `SELECT ${planFields} FROM plans WHERE id=$1 FOR UPDATE`,
        [id],
      );
      if (!row) throw new NotFoundException("Plan not found");
      if (row.active === active) return row;
      await m.query("UPDATE plans SET active=$2 WHERE id=$1", [id, active]);
      await this.audit.record(m, {
        organizationId: null,
        actorId: actor.id,
        action: "plan.status_changed",
        details: { planId: id, before: row.active, after: active },
      });
      return { ...row, active };
    });
  }
  organizations(actor: User, q: AcademicListDto) {
    return this.platform(actor, async (m) => {
      const [count] = await m.query(
        "SELECT count(*)::int AS total FROM organizations",
      );
      const items = await m.query(
        `
        SELECT 
          o.id, o.name, o.slug, o.status, o.created_at AS "createdAt",
          COALESCE(o.code, UPPER(SUBSTRING(o.slug, 1, 3)) || '001') AS code,
          o.board AS board,
          o.school_type AS "schoolType",
          o.registration_number AS "registrationNumber",
          o.affiliation_number AS "affiliationNumber",
          o.established_year AS "establishedYear",
          o.address_line1 AS "addressLine1",
          o.address_line2 AS "addressLine2",
          o.city AS city,
          o.state AS state,
          o.country AS country,
          o.pincode AS pincode,
          o.official_email AS "officialEmail",
          COALESCE(o.official_phone, '') AS "officialPhone",
          o.website AS website,
          o.time_zone AS "timeZone",
          o.locale AS locale,
          COALESCE(
            ROUND(
              COALESCE((
                SELECT (COUNT(*) FILTER (WHERE ar.status IN ('present', 'late'))::numeric / NULLIF(COUNT(*), 0)) * 100
                FROM attendance_records ar
                JOIN attendance_sessions as_sess ON ar.attendance_session_id = as_sess.id
                WHERE as_sess.organization_id = o.id
              ), 0) * 0.40 +
              COALESCE((
                SELECT (SUM(amount_paid)::numeric / NULLIF(SUM(total_due), 0)) * 100
                FROM student_fee_dues
                WHERE organization_id = o.id
              ), 0) * 0.35 +
              COALESCE((
                SELECT AVG(actual_completion_percentage)
                FROM principal_curriculum_nodes
                WHERE organization_id = o.id
              ), 0) * 0.25
            )::int,
            0
          ) AS "healthScore",
          COALESCE(p.name, 'Basic') AS plan,
          (SELECT count(*)::int FROM memberships m2 WHERE m2.organization_id = o.id AND m2.role = 'student' AND m2.status = 'active') AS "studentsCount",
          (SELECT count(*)::int FROM memberships m2 WHERE m2.role = 'teacher' AND m2.organization_id = o.id AND m2.status = 'active') AS "teachersCount",
          (SELECT count(*)::int FROM memberships m2 WHERE m2.role = 'parent' AND m2.organization_id = o.id AND m2.status = 'active') AS "parentsCount",
          (SELECT COALESCE(ROUND(SUM(r.size_bytes) / 1073741824.0, 1), 0) FROM recorded_sessions r WHERE r.organization_id = o.id) AS "storageUsageGb",
          (SELECT count(*)::int FROM domain_events de WHERE de.organization_id = o.id) AS "apiRequests",
          inv.raw_token AS "pendingInviteToken",
          inv.expires_at AS "pendingInviteExpiresAt",
          inv.invite_status AS "adminInviteStatus"
        FROM organizations o
        LEFT JOIN subscriptions s ON s.organization_id = o.id AND s.status IN ('active', 'trialing')
        LEFT JOIN plans p ON p.id = s.plan_id
        LEFT JOIN LATERAL (
          SELECT 
            i.id,
            CASE 
              WHEN i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > now() THEN i.raw_token 
              ELSE NULL 
            END AS raw_token,
            i.expires_at,
            CASE 
              WHEN i.accepted_at IS NOT NULL THEN 'accepted'
              WHEN i.revoked_at IS NOT NULL THEN 'revoked'
              WHEN i.expires_at <= now() THEN 'expired'
              ELSE 'pending'
            END AS invite_status
          FROM invitations i
          WHERE i.organization_id = o.id AND i.role = 'school_admin'
          ORDER BY i.created_at DESC
          LIMIT 1
        ) inv ON true
        ORDER BY o.created_at DESC, o.id
        LIMIT $1 OFFSET $2
      `,
        [q.limit, q.offset],
      );
      return { items, total: count.total, limit: q.limit, offset: q.offset };
    });
  }
  private async overview(m: Queryable, org: string) {
    const [subscription] = await m.query(
      `SELECT ${subscriptionFields} FROM subscriptions WHERE organization_id=$1`,
      [org],
    );
    return {
      subscription: subscription ?? null,
      entitlements: await entitlements(m, org),
      usage: await seatUsage(m, org),
      overrides: await m.query(
        "SELECT feature_key AS feature,enabled FROM feature_flags WHERE organization_id=$1 ORDER BY feature_key",
        [org],
      ),
    };
  }
  get(org: string, actor: User, platform = true) {
    return this.scope(
      org,
      actor,
      null,
      null,
      null,
      (m) => this.overview(m, org),
      platform,
    );
  }
  subscribe(org: string, actor: User, dto: SubscriptionDto, key?: string) {
    return this.scope(
      org,
      actor,
      "subscription.updated",
      dto,
      key,
      async (m) => {
        const start = new Date(dto.periodStart),
          end = new Date(dto.periodEnd);
        const days = (end.getTime() - start.getTime()) / 86400000;
        if (days <= 0 || days > 32)
          throw new BadRequestException(
            "Subscription period must be positive and no longer than 32 days",
          );
        const [plan] = await m.query(
          `SELECT ${planFields} FROM plans WHERE id=$1 FOR SHARE`,
          [dto.planId],
        );
        if (!plan) throw new NotFoundException("Plan not found");
        if (!plan.active)
          throw new ConflictException("Plan is retired; choose an active plan");
        const usage = await seatUsage(m, org);
        if (
          usage.students + usage.pendingStudents > plan.maxStudents ||
          usage.teachers + usage.pendingTeachers > plan.maxTeachers
        )
          throw new ConflictException(
            "Plan is below current reserved seat usage",
          );
        const [before] = await m.query(
          `SELECT ${subscriptionFields} FROM subscriptions WHERE organization_id=$1`,
          [org],
        );
        const [after] = await m.query(
          `INSERT INTO subscriptions(organization_id,plan_id,status,period_start,period_end) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(organization_id) DO UPDATE SET plan_id=excluded.plan_id,status=excluded.status,period_start=excluded.period_start,period_end=excluded.period_end,updated_at=clock_timestamp()
        RETURNING ${subscriptionFields}`,
          [org, dto.planId, dto.status, start, end],
        );
        await this.audit.record(m, {
          organizationId: org,
          actorId: actor.id,
          action: "subscription.updated",
          details: { before: before ?? null, after },
        });
        return this.overview(m, org);
      },
    );
  }
  override(org: string, actor: User, dto: FeatureOverrideDto) {
    return this.scope(
      org,
      actor,
      "feature.override_changed",
      dto,
      null,
      async (m) => {
        const [old] = await m.query(
          "SELECT enabled FROM feature_flags WHERE organization_id=$1 AND feature_key=$2",
          [org, dto.feature],
        );
        if (dto.mode === "inherit")
          await m.query(
            "DELETE FROM feature_flags WHERE organization_id=$1 AND feature_key=$2",
            [org, dto.feature],
          );
        else
          await m.query(
            "INSERT INTO feature_flags(organization_id,feature_key,enabled) VALUES($1,$2,$3) ON CONFLICT(organization_id,feature_key) DO UPDATE SET enabled=excluded.enabled",
            [org, dto.feature, dto.mode === "enabled"],
          );
        await this.audit.record(m, {
          organizationId: org,
          actorId: actor.id,
          action: "feature.override_changed",
          details: {
            feature: dto.feature,
            before: old?.enabled ?? null,
            after: dto.mode === "inherit" ? null : dto.mode === "enabled",
          },
        });
        return this.overview(m, org);
      },
    );
  }
  issue(org: string, actor: User, key?: string) {
    return this.scope(org, actor, "invoice.issued", {}, key, async (m) => {
      const [s] = await m.query(
        `SELECT s.*,p.amount_minor,p.currency FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.organization_id=$1 FOR UPDATE OF s`,
        [org],
      );
      if (!s || !["active", "past_due"].includes(s.status))
        throw new ConflictException(
          "An explicit active or past_due subscription is required",
        );
      const [overlap] = await m.query(
        `SELECT id FROM invoices WHERE organization_id=$1 AND status<>'void'
        AND tstzrange(period_start,period_end,'[)') && tstzrange($2::timestamptz,$3::timestamptz,'[)')`,
        [org, s.period_start, s.period_end],
      );
      if (overlap)
        throw new ConflictException(
          "A non-void invoice already covers part of this period",
        );
      const [invoice] = await m.query(
        `INSERT INTO invoices(organization_id,subscription_id,plan_id,amount_minor,currency,period_start,period_end)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ${invoiceFields}`,
        [
          org,
          s.id,
          s.plan_id,
          s.amount_minor,
          s.currency,
          s.period_start,
          s.period_end,
        ],
      );
      await this.audit.record(m, {
        organizationId: org,
        actorId: actor.id,
        action: "invoice.issued",
        details: { invoiceId: invoice.id, amountMinor: invoice.amountMinor },
      });
      return invoice;
    });
  }
  invoices(org: string, actor: User, q: AcademicListDto, platform = true) {
    return this.scope(
      org,
      actor,
      null,
      null,
      null,
      async (m) => {
        const [count] = await m.query(
          "SELECT count(*)::int AS total FROM invoices WHERE organization_id=$1",
          [org],
        );
        const items = await m.query(
          `SELECT ${invoiceFields} FROM invoices WHERE organization_id=$1 ORDER BY created_at DESC,id LIMIT $2 OFFSET $3`,
          [org, q.limit, q.offset],
        );
        return { items, total: count.total, limit: q.limit, offset: q.offset };
      },
      platform,
    );
  }
  settle(org: string, actor: User, id: string, dto: PayInvoiceDto | null) {
    const target = dto ? "paid" : "void";
    return this.scope(
      org,
      actor,
      `invoice.${target}`,
      { id, ...dto },
      null,
      async (m) => {
        const [row] = await m.query(
          `SELECT ${invoiceFields} FROM invoices WHERE organization_id=$1 AND id=$2`,
          [org, id],
        );
        if (!row) throw new NotFoundException("Invoice not found");
        if (
          row.status === target &&
          (!dto || row.paymentReference === dto.paymentReference)
        )
          return row;
        if (row.status !== "open")
          throw new ConflictException(
            "Only open invoices can be paid or voided",
          );
        const [after] = await m.query(
          `UPDATE invoices SET status=$3::varchar,payment_reference=$4,paid_at=CASE WHEN $3::varchar='paid' THEN clock_timestamp() ELSE NULL END
        WHERE organization_id=$1 AND id=$2 RETURNING ${invoiceFields}`,
          [org, id, target, dto?.paymentReference ?? null],
        );
        await this.audit.record(m, {
          organizationId: org,
          actorId: actor.id,
          action: `invoice.${target}`,
          details: { invoiceId: id, before: "open", after: target },
        });
        return after;
      },
    );
  }
  statistics(org: string, actor: User) {
    return this.scope(org, actor, null, null, null, async (m) => {
      const [counts] = await m.query(
        `SELECT
        (SELECT count(*)::int FROM sections WHERE organization_id=$1) AS sections,
        (SELECT count(*)::int FROM assignments WHERE organization_id=$1 AND status='published') AS "publishedAssignments",
        (SELECT count(*)::int FROM arena_attempts WHERE organization_id=$1) AS "arenaAttempts",
        (SELECT count(*)::int FROM recorded_sessions WHERE organization_id=$1 AND status='published') AS "publishedRecordings",
        (SELECT coalesce(sum(size_bytes),0)::text FROM recorded_sessions WHERE organization_id=$1 AND object_version IS NOT NULL) AS "verifiedRecordingBytes",
        (SELECT count(*)::int FROM domain_events WHERE organization_id=$1 AND failed_at IS NOT NULL) AS "failedEvents",
        (SELECT coalesce(sum(amount_minor),0)::text FROM invoices WHERE organization_id=$1 AND status='paid') AS "paidAmountMinor",
        (SELECT coalesce(sum(amount_minor),0)::text FROM invoices WHERE organization_id=$1 AND status='open') AS "openAmountMinor"`,
        [org],
      );
      return {
        organizationId: org,
        currency: "INR",
        ...counts,
        usage: await seatUsage(m, org),
      };
    });
  }
  dashboard(actor: User) {
    return this.platform(actor, async (m) => {
      const [schools] = await m.query(
        `SELECT count(*)::int AS total, count(*) FILTER (WHERE status='active')::int AS active, count(*) FILTER (WHERE status='suspended')::int AS inactive FROM organizations`,
      );
      const [users] = await m.query(
        `SELECT count(*) FILTER (WHERE role='student' AND status='active')::int AS students, count(*) FILTER (WHERE role='teacher' AND status='active')::int AS teachers, count(*) FILTER (WHERE role='parent' AND status='active')::int AS parents FROM memberships`,
      );
      const [subscriptions] = await m.query(
        `SELECT count(*) FILTER (WHERE status='active')::int AS active, count(*) FILTER (WHERE status='trialing')::int AS trial, count(*) FILTER (WHERE status='canceled' OR status='past_due')::int AS expired FROM subscriptions`,
      );
      const [revenue] = await m.query(
        `SELECT COALESCE(SUM(amount_minor) FILTER (WHERE status='paid'), 0)::bigint / 100 AS monthly, COALESCE(SUM(amount_minor) FILTER (WHERE status='open'), 0)::bigint / 100 AS pending FROM invoices`,
      );
      const [storageRes] = await m.query(
        `SELECT COALESCE(ROUND(SUM(size_bytes) / 1073741824.0, 1), 0) AS "usedGb" FROM recorded_sessions`,
      );
      const [eventsRes] = await m.query(
        `SELECT count(*)::int AS total FROM domain_events`,
      );
      const activities = await m.query(
        `SELECT a.id, a.action, a.created_at AS "createdAt", COALESCE(o.name, 'Platform') AS "schoolName", COALESCE(u.email, 'System') AS "actorEmail" FROM audit_events a LEFT JOIN organizations o ON o.id = a.organization_id LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 10`,
      );
      return {
        schools: {
          total: Number(schools?.total ?? 0),
          active: Number(schools?.active ?? 0),
          inactive: Number(schools?.inactive ?? 0),
        },
        users: {
          students: Number(users?.students ?? 0),
          teachers: Number(users?.teachers ?? 0),
          parents: Number(users?.parents ?? 0),
        },
        subscriptions: {
          active: Number(subscriptions?.active ?? 0),
          trial: Number(subscriptions?.trial ?? 0),
          expired: Number(subscriptions?.expired ?? 0),
        },
        revenue: {
          monthly: Number(revenue?.monthly ?? 0),
          pending: Number(revenue?.pending ?? 0),
        },
        usage: {
          storage: Number(storageRes?.usedGb ?? 0),
          apiRequests: Number(eventsRes?.total ?? 0),
        },
        recentActivities: activities.map((act: any) => ({
          id: act.id,
          action: act.action,
          schoolName: act.schoolName,
          actorEmail: act.actorEmail,
          createdAt: act.createdAt,
        })),
      };
    });
  }
  auditLogs(actor: User, q: AcademicListDto) {
    return this.platform(actor, async (m) => {
      const [count] = await m.query(
        "SELECT count(*)::int AS total FROM audit_events",
      );
      const items = await m.query(
        `SELECT a.id, a.action, a.organization_id AS "organizationId", a.actor_id AS "actorId", a.details, a.created_at AS "createdAt", COALESCE(o.name, 'Platform') AS "schoolName", COALESCE(u.email, 'System') AS "actorEmail" FROM audit_events a LEFT JOIN organizations o ON o.id = a.organization_id LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
        [q.limit, q.offset],
      );
      return {
        total: Number(count?.total ?? 0),
        items,
        limit: q.limit,
        offset: q.offset,
      };
    });
  }

  //  & : Centralized Feature Catalog
  featureCatalog(actor: User) {
    return this.platform(actor, async (m) => {
      return m.query(
        `SELECT key, category, name, description, has_quota AS "hasQuota", default_quota AS "defaultQuota" FROM feature_catalog ORDER BY category, key`,
      );
    });
  }

  // : Plan Feature Matrix
  featureMatrix(actor: User) {
    return this.platform(actor, async (m) => {
      const plans = await m.query(
        `SELECT id, name, features, active FROM plans ORDER BY name ASC`,
      );
      const features = await m.query(
        `SELECT key, category, name, description, has_quota AS "hasQuota", default_quota AS "defaultQuota" FROM feature_catalog ORDER BY category, key`,
      );
      return { plans, features };
    });
  }

  // Update Plan Features JSONB
  updatePlanFeatures(
    actor: User,
    planId: string,
    features: Record<string, boolean>,
  ) {
    return this.platform(actor, async (m) => {
      await this.validatePlanFeatures(m, features);
      const [plan] = await m.query(
        `SELECT id, name, features FROM plans WHERE id=$1`,
        [planId],
      );
      if (!plan) throw new NotFoundException("Plan not found");
      await m.query(`UPDATE plans SET features=$2::jsonb WHERE id=$1`, [
        planId,
        JSON.stringify(features),
      ]);
      await this.audit.record(m, {
        organizationId: null,
        actorId: actor.id,
        action: "plan.features_updated",
        details: { planId, before: plan.features, after: features },
      });
      return { id: planId, features };
    });
  }

  // : School-Specific Feature Overrides
  getDetailedOverrides(actor: User, org: string) {
    return this.platform(actor, async (m) => {
      return m.query(
        `SELECT o.id, o.feature_key AS "featureKey", o.role, o.enabled, o.custom_limit AS "customLimit", o.custom_quota AS "customQuota", o.start_date AS "startDate", o.expiry_date AS "expiryDate", o.reason, o.created_at AS "createdAt", COALESCE(f.name, o.feature_key) AS "featureName", f.category FROM feature_overrides o LEFT JOIN feature_catalog f ON f.key = o.feature_key WHERE o.organization_id=$1 ORDER BY o.created_at DESC`,
        [org],
      );
    });
  }

  setDetailedOverride(
    actor: User,
    org: string,
    dto: DetailedFeatureOverrideDto,
  ) {
    return this.platform(actor, async (m) => {
      const [catalog] = await m.query(
        `SELECT key FROM feature_catalog WHERE key=$1`,
        [dto.featureKey],
      );
      if (!catalog)
        throw new NotFoundException(
          `Feature key '${dto.featureKey}' not recognized in catalog`,
        );
      const roleParam = dto.role && dto.role !== "ALL" ? dto.role : null;
      if (roleParam) {
        await m.query(
          `DELETE FROM feature_overrides WHERE organization_id=$1 AND feature_key=$2 AND role=$3`,
          [org, dto.featureKey, roleParam],
        );
      } else {
        await m.query(
          `DELETE FROM feature_overrides WHERE organization_id=$1 AND feature_key=$2 AND role IS NULL`,
          [org, dto.featureKey],
        );
      }
      const [row] = await m.query(
        `INSERT INTO feature_overrides (organization_id, feature_key, role, enabled, custom_limit, custom_quota, expiry_date, reason, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, feature_key AS "featureKey", role, enabled, custom_limit AS "customLimit", custom_quota AS "customQuota", expiry_date AS "expiryDate", reason`,
        [
          org,
          dto.featureKey,
          roleParam,
          dto.enabled,
          dto.customLimit ?? null,
          dto.customQuota ?? null,
          dto.expiryDate ? new Date(dto.expiryDate) : null,
          dto.reason ?? "",
          actor.id,
        ],
      );
      await this.audit.record(m, {
        organizationId: org,
        actorId: actor.id,
        action: "feature.detailed_override",
        details: { ...dto } as Record<string, unknown>,
      });
      return row;
    });
  }

  removeDetailedOverride(
    actor: User,
    org: string,
    featureKey: string,
    role?: string | null,
  ) {
    return this.platform(actor, async (m) => {
      const roleParam = role && role !== "ALL" ? role : null;
      if (roleParam) {
        await m.query(
          `DELETE FROM feature_overrides WHERE organization_id=$1 AND feature_key=$2 AND role=$3`,
          [org, featureKey, roleParam],
        );
      } else {
        await m.query(
          `DELETE FROM feature_overrides WHERE organization_id=$1 AND feature_key=$2 AND role IS NULL`,
          [org, featureKey],
        );
      }
      await this.audit.record(m, {
        organizationId: org,
        actorId: actor.id,
        action: "feature.detailed_override_removed",
        details: { featureKey, role: roleParam },
      });
      return { success: true };
    });
  }

  // : Complete 2D Role-Feature Matrix
  async getRoleFeatureMatrix(actor: User, org: string) {
    return this.platform(actor, async (m) => {
      const catalog = await m.query(
        `SELECT key, category, name, description, has_quota AS "hasQuota", default_quota AS "defaultQuota" FROM feature_catalog ORDER BY category, name`,
      );
      const [school] = await m.query(
        `SELECT o.id, o.name, p.name AS plan_name
         FROM organizations o
         LEFT JOIN subscriptions s ON s.organization_id = o.id
         LEFT JOIN plans p ON p.id = s.plan_id
         WHERE o.id = $1`,
        [org],
      );
      if (!school) throw new NotFoundException("School not found");

      const roles = [
        "school_admin",
        "principal",
        "teacher",
        "student",
        "parent",
      ];
      const tenant = await entitlements(m, org);
      const roleEntitlements = Object.fromEntries(
        await Promise.all(
          roles.map(async (role) => [role, await entitlements(m, org, role)]),
        ),
      );
      const overrides = tenant.overrides;

      const matrix = catalog.map((feat: any) => {
        const tenantOverride = overrides.find(
          (o: any) =>
            o.feature_key === feat.key && (!o.role || o.role === "ALL"),
        );
        const tenantEnabled = Boolean(tenant.features[feat.key]);
        const tenantIsOverride = Boolean(tenantOverride);

        const roleStates: Record<
          string,
          {
            enabled: boolean;
            isOverride: boolean;
            inherited: boolean;
            reason?: string;
            notApplicable?: boolean;
          }
        > = {};
        for (const r of roles) {
          if (
            feat.key.startsWith("nav:") &&
            !feat.key.startsWith(`nav:${r}:`)
          ) {
            roleStates[r] = {
              enabled: false,
              isOverride: false,
              inherited: false,
              notApplicable: true,
            };
            continue;
          }
          const roleOv = overrides.find(
            (o: any) => o.feature_key === feat.key && o.role === r,
          );
          if (roleOv) {
            roleStates[r] = {
              enabled: Boolean(roleEntitlements[r].features[feat.key]),
              isOverride: true,
              inherited: false,
              reason: roleOv.reason,
            };
          } else {
            roleStates[r] = {
              enabled: Boolean(roleEntitlements[r].features[feat.key]),
              isOverride: false,
              inherited: true,
            };
          }
        }

        return {
          key: feat.key,
          name: feat.name,
          category: feat.category,
          description: feat.description,
          tenantDefault: {
            enabled: tenantEnabled,
            isOverride: tenantIsOverride,
            reason: tenantOverride?.reason,
          },
          roles: roleStates,
        };
      });

      return {
        schoolId: school.id,
        schoolName: school.name,
        planName:
          school.plan_name ||
          (tenant.implicitTrial ? "Implicit trial" : "No plan"),
        entitled: tenant.entitled,
        periodEnd: tenant.periodEnd,
        roles,
        matrix,
      };
    });
  }

  // : Support Center Tickets
  tickets(actor: User, q: AcademicListDto) {
    return this.platform(actor, async (m) => {
      const [count] = await m.query(
        `SELECT count(*)::int AS total FROM support_tickets`,
      );
      const items = await m.query(
        `SELECT t.id, t.ticket_code AS "ticketCode", t.organization_id AS "organizationId", t.school_name AS "schoolName", t.category, t.priority, t.status, t.subject, t.description, t.created_at AS "createdAt", t.updated_at AS "updatedAt", u.email AS "creatorEmail", a.email AS "assigneeEmail" FROM support_tickets t LEFT JOIN users u ON u.id = t.created_by LEFT JOIN users a ON a.id = t.assigned_to ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`,
        [q.limit, q.offset],
      );
      return { items, total: count.total, limit: q.limit, offset: q.offset };
    });
  }

  createTicket(actor: User, dto: CreateSupportTicketDto) {
    return this.platform(actor, async (m) => {
      const ticketCode = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;
      const [ticket] = await m.query(
        `INSERT INTO support_tickets (ticket_code, organization_id, school_name, created_by, category, priority, subject, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, ticket_code AS "ticketCode", school_name AS "schoolName", category, priority, status, subject, description, created_at AS "createdAt"`,
        [
          ticketCode,
          dto.organizationId ?? null,
          dto.schoolName ?? "Platform Admin",
          actor.id,
          dto.category,
          dto.priority,
          dto.subject,
          dto.description,
        ],
      );
      await this.audit.record(m, {
        organizationId: dto.organizationId ?? null,
        actorId: actor.id,
        action: "ticket.created",
        details: { ticketId: ticket.id, ticketCode },
      });
      return ticket;
    });
  }

  createSchoolTicket(
    org: string,
    actor: User,
    dto: CreateSupportTicketDto,
  ) {
    return this.scope(org, actor, "ticket.created", dto, null, async (m) => {
      const [school] = await m.query(
        `SELECT name FROM organizations WHERE id=$1`,
        [org],
      );
      const schoolName = school?.name || dto.schoolName || "School Workspace";
      const ticketCode = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;
      const [ticket] = await m.query(
        `INSERT INTO support_tickets (ticket_code, organization_id, school_name, created_by, category, priority, subject, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, ticket_code AS "ticketCode", organization_id AS "organizationId", school_name AS "schoolName", category, priority, status, subject, description, created_at AS "createdAt"`,
        [
          ticketCode,
          org,
          schoolName,
          actor.id,
          dto.category || "academic",
          dto.priority || "medium",
          dto.subject,
          dto.description,
        ],
      );
      await this.audit.record(m, {
        organizationId: org,
        actorId: actor.id,
        action: "ticket.created",
        details: { ticketId: ticket.id, ticketCode },
      });
      return ticket;
    }, false);
  }

  schoolTickets(org: string, actor: User) {
    return this.scope(org, actor, null, null, null, async (m) => {
      return m.query(
        `SELECT id, ticket_code AS "ticketCode", organization_id AS "organizationId", school_name AS "schoolName", category, priority, status, subject, description, created_at AS "createdAt", updated_at AS "updatedAt"
        FROM support_tickets WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 50`,
        [org],
      );
    }, false);
  }

  updateTicketStatus(
    actor: User,
    id: string,
    dto: UpdateSupportTicketStatusDto,
  ) {
    return this.platform(actor, async (m) => {
      const [ticket] = await m.query(
        `SELECT id, status FROM support_tickets WHERE id=$1`,
        [id],
      );
      if (!ticket) throw new NotFoundException("Ticket not found");
      await m.query(
        `UPDATE support_tickets SET status=$2, assigned_to=COALESCE($3, assigned_to), updated_at=now() WHERE id=$1`,
        [id, dto.status, dto.assignedTo ?? null],
      );
      await this.audit.record(m, {
        organizationId: null,
        actorId: actor.id,
        action: "ticket.status_changed",
        details: { ticketId: id, before: ticket.status, after: dto.status },
      });
      return { id, status: dto.status };
    });
  }

  // : Audited Support Impersonation
  startSupportSession(actor: User, dto: StartSupportSessionDto) {
    return this.platform(actor, async (m) => {
      const [org] = await m.query(
        `SELECT id, name FROM organizations WHERE id=$1`,
        [dto.organizationId],
      );
      if (!org) throw new NotFoundException("School not found");
      const sessionToken = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await this.audit.record(m, {
        organizationId: dto.organizationId,
        actorId: actor.id,
        action: "support.session_started",
        details: {
          schoolName: org.name,
          reason: dto.reason,
          expiresAt: expiresAt.toISOString(),
          sessionTokenPrefix: sessionToken.slice(0, 8),
        },
      });
      return {
        active: true,
        schoolId: org.id,
        schoolName: org.name,
        expiresAt: expiresAt.toISOString(),
        sessionToken,
        warning: "SUPPORT SESSION ACTIVE - ALL ACTIONS ARE PERMANENTLY AUDITED",
      };
    });
  }

  // : Platform Announcements
  announcements(actor: User) {
    return this.platform(actor, async (m) => {
      return m.query(
        `SELECT id, title, message, type, priority, audience, target_plans AS "targetPlans", channels, status, start_date AS "startDate", end_date AS "endDate", created_at AS "createdAt" FROM platform_announcements ORDER BY created_at DESC`,
      );
    });
  }

  createAnnouncement(actor: User, dto: CreateAnnouncementDto) {
    return this.platform(actor, async (m) => {
      const [announcement] = await m.query(
        `INSERT INTO platform_announcements (title, message, type, priority, audience, target_plans, channels)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, title, message, type, priority, audience, channels, status, created_at AS "createdAt"`,
        [
          dto.title,
          dto.message,
          dto.type,
          dto.priority,
          dto.audience,
          dto.targetPlans ?? [],
          dto.channels ?? ["dashboard"],
        ],
      );
      await this.audit.record(m, {
        organizationId: null,
        actorId: actor.id,
        action: "announcement.created",
        details: { announcementId: announcement.id, title: dto.title },
      });
      return announcement;
    });
  }

  // : Payments & Refunds
  payments(actor: User, q: AcademicListDto) {
    return this.platform(actor, async (m) => {
      const [count] = await m.query(
        `SELECT count(*)::int AS total FROM payments`,
      );
      const items = await m.query(
        `SELECT p.id, p.invoice_id AS "invoiceId", p.organization_id AS "organizationId", p.amount_minor AS "amountMinor", p.currency, p.status, p.payment_method AS "paymentMethod", p.transaction_id AS "transactionId", p.failure_reason AS "failureReason", p.retry_count AS "retryCount", p.refund_reason AS "refundReason", p.created_at AS "createdAt", o.name AS "schoolName" FROM payments p JOIN organizations o ON o.id = p.organization_id ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
        [q.limit, q.offset],
      );
      return { items, total: count.total, limit: q.limit, offset: q.offset };
    });
  }

  recordPayment(actor: User, dto: RecordPaymentDto) {
    return this.platform(actor, async (m) => {
      const [invoice] = await m.query(
        `SELECT id, organization_id, amount_minor, status FROM invoices WHERE id=$1`,
        [dto.invoiceId],
      );
      if (!invoice) throw new NotFoundException("Invoice not found");
      const [payment] = await m.query(
        `INSERT INTO payments (invoice_id, organization_id, amount_minor, payment_method, transaction_id, status)
        VALUES ($1, $2, $3, $4, $5, 'success')
        RETURNING id, invoice_id AS "invoiceId", amount_minor AS "amountMinor", status, created_at AS "createdAt"`,
        [
          dto.invoiceId,
          invoice.organization_id,
          dto.amountMinor,
          dto.paymentMethod,
          dto.transactionId ?? `TXN-${Date.now()}`,
        ],
      );
      await m.query(
        `UPDATE invoices SET status='paid', paid_at=now(), payment_reference=$2 WHERE id=$1`,
        [dto.invoiceId, dto.transactionId ?? payment.id],
      );
      await this.audit.record(m, {
        organizationId: invoice.organization_id,
        actorId: actor.id,
        action: "payment.recorded",
        details: { paymentId: payment.id, amountMinor: dto.amountMinor },
      });
      return payment;
    });
  }

  refundPayment(actor: User, paymentId: string, dto: RefundPaymentDto) {
    return this.platform(actor, async (m) => {
      const [payment] = await m.query(
        `SELECT id, organization_id, amount_minor, status FROM payments WHERE id=$1`,
        [paymentId],
      );
      if (!payment) throw new NotFoundException("Payment not found");
      if (payment.status !== "success")
        throw new ConflictException("Only successful payments can be refunded");
      await m.query(
        `UPDATE payments SET status='refunded', refund_reason=$2, refund_approved_by=$3 WHERE id=$1`,
        [paymentId, dto.reason, actor.id],
      );
      await this.audit.record(m, {
        organizationId: payment.organization_id,
        actorId: actor.id,
        action: "payment.refunded",
        details: {
          paymentId,
          amountMinor: payment.amount_minor,
          reason: dto.reason,
        },
      });
      return { id: paymentId, status: "refunded", refundReason: dto.reason };
    });
  }

  // , , , , : Full Transactional School Onboarding
  onboardSchool(actor: User, dto: OnboardSchoolFullDto) {
    return this.platform(actor, async (m) => {
      // 1. Check duplicate slug
      const [slugExists] = await m.query(
        `SELECT id FROM organizations WHERE slug = $1 LIMIT 1`,
        [dto.slug],
      );
      if (slugExists)
        throw new ConflictException("A school with this slug already exists");

      // 2. Check duplicate official school email
      const officialEmail = (dto.officialEmail || "").trim().toLowerCase();
      if (!officialEmail)
        throw new BadRequestException("Official school email is required");
      const [emailOrgExists] = await m.query(
        `SELECT id, name FROM organizations WHERE lower(btrim(official_email)) = $1 LIMIT 1`,
        [officialEmail],
      );
      if (emailOrgExists) {
        throw new ConflictException(
          `Official school email '${officialEmail}' is already registered with school '${emailOrgExists.name}'`,
        );
      }

      // 3. Check duplicate official school phone
      const officialPhone = (dto.officialPhone || "").trim();
      if (officialPhone) {
        const [phoneOrgExists] = await m.query(
          `SELECT id, name FROM organizations WHERE btrim(official_phone) = $1 LIMIT 1`,
          [officialPhone],
        );
        if (phoneOrgExists) {
          throw new ConflictException(
            `Official school phone '${officialPhone}' is already registered with school '${phoneOrgExists.name}'`,
          );
        }
      }

      // 4. Admin email is auto-linked from officialEmail if not explicitly provided
      const adminEmail = (dto.adminEmail || officialEmail).trim().toLowerCase();
      const [existingUserEmail] = await m.query(
        `SELECT id, email FROM users WHERE lower(btrim(email)) = $1 LIMIT 1`,
        [adminEmail],
      );
      if (existingUserEmail) {
        throw new ConflictException(
          `An administrator or user account already exists with email '${adminEmail}'`,
        );
      }
      const [pendingInviteEmail] = await m.query(
        `SELECT id, email FROM invitations WHERE lower(btrim(email)) = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now() LIMIT 1`,
        [adminEmail],
      );
      if (pendingInviteEmail) {
        throw new ConflictException(
          `An active pending invitation already exists for email '${adminEmail}'`,
        );
      }

      // 5. Check duplicate admin phone (if provided)
      const adminPhone = (dto.adminPhone || "").trim();
      if (adminPhone) {
        const [existingUserPhone] = await m.query(
          `SELECT id FROM users WHERE btrim(phone) = $1 LIMIT 1`,
          [adminPhone],
        );
        if (existingUserPhone) {
          throw new ConflictException(
            `A user account with phone '${adminPhone}' already exists in the system`,
          );
        }
        const [pendingInvitePhone] = await m.query(
          `SELECT id FROM invitations WHERE btrim(phone) = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now() LIMIT 1`,
          [adminPhone],
        );
        if (pendingInvitePhone) {
          throw new ConflictException(
            `An active pending invitation already exists for phone '${adminPhone}'`,
          );
        }
      }

      // 6. Insert organization
      const status = "active";
      const [org] = await m.query(
        `INSERT INTO organizations (
        name, slug, time_zone, locale, status, code, school_type, board, registration_number, affiliation_number, established_year, address_line1, city, state, pincode, official_email, official_phone, website
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING id, name, slug, status, created_at AS "createdAt"`,
        [
          dto.name,
          dto.slug,
          dto.timeZone ?? "Asia/Kolkata",
          dto.locale ?? "en-IN",
          status,
          dto.code ?? `SCH-${Date.now().toString().slice(-4)}`,
          dto.schoolType ?? "Private",
          dto.board ?? "CBSE",
          dto.registrationNumber ?? null,
          dto.affiliationNumber ?? null,
          dto.establishedYear ?? null,
          dto.addressLine1 ?? null,
          dto.city ?? null,
          dto.state ?? null,
          dto.pincode ?? null,
          officialEmail,
          officialPhone || null,
          dto.website ?? null,
        ],
      );

      // 7. Create initial School Admin Invitation with raw_token for secure retrieval while pending
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
      await m.query(
        `INSERT INTO invitations (organization_id, email, token_hash, raw_token, invited_by, role, name, phone, expires_at)
        VALUES ($1, $2, $3, $4, $5, 'school_admin', $6, $7, $8)`,
        [
          org.id,
          adminEmail,
          tokenHash(token),
          token,
          actor.id,
          dto.adminName,
          adminPhone || null,
          expiresAt,
        ],
      );

      this.mail
        .sendInvitationEmail(
          adminEmail,
          token,
          "school_admin",
          org.name,
          dto.adminName,
        )
        .catch((err) => {
          console.error(
            `[ONBOARDING EMAIL FAILED] Could not dispatch to ${adminEmail}:`,
            err?.message || err,
          );
        });

      // 8. Assign Plan & Subscription
      let [plan] = await m.query(`SELECT id, name FROM plans WHERE id=$1`, [
        dto.planId,
      ]);
      if (!plan) throw new NotFoundException("Selected plan not found");
      const trialDays = dto.trialDays ?? 30;
      await m.query(
        `INSERT INTO subscriptions (organization_id, plan_id, status, period_start, period_end)
        VALUES ($1, $2, $3, now(), now() + interval '${trialDays} days')`,
        [org.id, dto.planId, dto.isTrial ? "trialing" : "active"],
      );

      // 5. Apply any initial feature overrides
      if (dto.overrides && Array.isArray(dto.overrides)) {
        for (const ov of dto.overrides) {
          await m.query(
            `INSERT INTO feature_overrides (organization_id, feature_key, enabled, reason, created_by)
            VALUES ($1, $2, $3, $4, $5) ON CONFLICT (organization_id, feature_key) DO UPDATE SET enabled=excluded.enabled`,
            [
              org.id,
              ov.featureKey,
              ov.enabled,
              ov.reason ?? "Onboarding override",
              actor.id,
            ],
          );
        }
      }

      // 6. Record immutable audit log
      await this.audit.record(m, {
        organizationId: org.id,
        actorId: actor.id,
        action: "school.onboarded_complete",
        details: {
          schoolName: org.name,
          slug: org.slug,
          planId: dto.planId,
          adminEmail: dto.adminEmail,
        },
      });

      return {
        organization: org,
        invitation: {
          token,
          email: dto.adminEmail,
          expiresAt: expiresAt.toISOString(),
        },
        plan: { id: plan.id, name: plan.name },
        status: "SCHOOL CREATED SUCCESSFULLY",
      };
    });
  }

  // : School Lifecycle Transitions
  schoolLifecycle(actor: User, id: string, dto: SchoolLifecycleTransitionDto) {
    return this.platform(actor, async (m) => {
      const [org] = await m.query(
        `SELECT id, name, status FROM organizations WHERE id=$1`,
        [id],
      );
      if (!org) throw new NotFoundException("School not found");
      const beforeStatus = org.status;
      await m.query(`UPDATE organizations SET status=$2 WHERE id=$1`, [
        id,
        dto.status,
      ]);
      if (dto.extendTrialDays && dto.extendTrialDays > 0) {
        await m.query(
          `UPDATE subscriptions SET period_end = period_end + interval '${dto.extendTrialDays} days' WHERE organization_id=$1`,
          [id],
        );
      }
      await this.audit.record(m, {
        organizationId: id,
        actorId: actor.id,
        action: "school.lifecycle_transition",
        details: {
          before: beforeStatus,
          after: dto.status,
          reason: dto.reason ?? "",
          extendedDays: dto.extendTrialDays ?? 0,
        },
      });
      return { id, name: org.name, status: dto.status };
    });
  }

  // Platform Admin: Update School Details
  updateSchoolDetails(actor: User, id: string, dto: UpdateSchoolDetailsDto) {
    return this.platform(actor, async (m) => {
      const [existing] = await m.query(
        `SELECT * FROM organizations WHERE id = $1 FOR UPDATE LIMIT 1`,
        [id],
      );
      if (!existing) throw new NotFoundException("School organization not found");

      if (dto.slug && dto.slug !== existing.slug) {
        const [dupSlug] = await m.query(
          `SELECT id FROM organizations WHERE slug = $1 AND id != $2 LIMIT 1`,
          [dto.slug, id],
        );
        if (dupSlug) {
          throw new ConflictException(`Slug '${dto.slug}' is already in use by another school`);
        }
      }

      if (dto.officialEmail && dto.officialEmail !== existing.official_email) {
        const [dupEmail] = await m.query(
          `SELECT id, name FROM organizations WHERE lower(btrim(official_email)) = lower(btrim($1)) AND id != $2 LIMIT 1`,
          [dto.officialEmail, id],
        );
        if (dupEmail) {
          throw new ConflictException(
            `Official email '${dto.officialEmail}' is already registered with school '${dupEmail.name}'`,
          );
        }
      }

      if (dto.officialPhone && dto.officialPhone !== existing.official_phone) {
        const [dupPhone] = await m.query(
          `SELECT id, name FROM organizations WHERE btrim(official_phone) = btrim($1) AND id != $2 LIMIT 1`,
          [dto.officialPhone, id],
        );
        if (dupPhone) {
          throw new ConflictException(
            `Official phone '${dto.officialPhone}' is already registered with school '${dupPhone.name}'`,
          );
        }
      }

      const mapping: Record<string, string> = {
        name: "name",
        slug: "slug",
        code: "code",
        schoolType: "school_type",
        board: "board",
        registrationNumber: "registration_number",
        affiliationNumber: "affiliation_number",
        establishedYear: "established_year",
        addressLine1: "address_line1",
        addressLine2: "address_line2",
        city: "city",
        state: "state",
        country: "country",
        pincode: "pincode",
        officialEmail: "official_email",
        officialPhone: "official_phone",
        website: "website",
        timeZone: "time_zone",
        locale: "locale",
      };

      const updates: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      for (const [key, col] of Object.entries(mapping)) {
        if ((dto as any)[key] !== undefined) {
          updates.push(`${col} = $${pIdx++}`);
          params.push((dto as any)[key]);
        }
      }

      if (updates.length === 0) {
        throw new BadRequestException("No valid fields provided for update");
      }

      updates.push(`updated_at = NOW()`);
      params.push(id);

      const [updated] = await m.query(
        `UPDATE organizations SET ${updates.join(", ")} WHERE id = $${pIdx} RETURNING *`,
        params,
      );

      await this.audit.record(m, {
        organizationId: id,
        actorId: actor.id,
        action: "organization.updated",
        details: {
          before: existing,
          after: updated,
          source: "platform_admin",
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        status: updated.status,
        code: updated.code,
        board: updated.board,
        schoolType: updated.school_type,
        city: updated.city,
        state: updated.state,
        country: updated.country,
        pincode: updated.pincode,
        addressLine1: updated.address_line1,
        addressLine2: updated.address_line2,
        officialEmail: updated.official_email,
        officialPhone: updated.official_phone,
        website: updated.website,
        registrationNumber: updated.registration_number,
        affiliationNumber: updated.affiliation_number,
        establishedYear: updated.established_year,
        timeZone: updated.time_zone,
        locale: updated.locale,
        updatedAt: updated.updated_at,
      };
    });
  }

  // : Global Search across schools, tickets, invoices, plans, announcements
  globalSearch(actor: User, query: string) {
    return this.platform(actor, async (m) => {
      const trimmed = (query || "").trim();
      if (!trimmed) return { results: [] };
      const q = `%${trimmed}%`;
      const [schools, tickets, invoices, plans, announcements] = await Promise.all([
        m.query(
          `SELECT id, name, slug, status, code, board, city, state, 'school' AS type 
           FROM organizations 
           WHERE name ILIKE $1 OR slug ILIKE $1 OR code ILIKE $1 OR city ILIKE $1 OR state ILIKE $1 OR board ILIKE $1 OR official_email ILIKE $1 OR official_phone ILIKE $1 
           LIMIT 8`,
          [q],
        ),
        m.query(
          `SELECT id, ticket_code AS "ticketCode", subject, status, category, priority, 'ticket' AS type 
           FROM support_tickets 
           WHERE ticket_code ILIKE $1 OR subject ILIKE $1 OR category ILIKE $1 
           LIMIT 6`,
          [q],
        ),
        m.query(
          `SELECT id, payment_reference AS "paymentReference", amount_minor AS "amountMinor", currency, status, 'invoice' AS type 
           FROM invoices 
           WHERE payment_reference ILIKE $1 OR id::text ILIKE $1 
           LIMIT 5`,
          [q],
        ),
        m.query(
          `SELECT id, name, active, 'plan' AS type 
           FROM plans 
           WHERE name ILIKE $1 
           LIMIT 5`,
          [q],
        ),
        m.query(
          `SELECT id, title, type AS "announcementType", priority, status, 'announcement' AS type 
           FROM platform_announcements 
           WHERE title ILIKE $1 OR message ILIKE $1 
           LIMIT 5`,
          [q],
        ).catch(() => []),
      ]);
      return { results: [...schools, ...tickets, ...invoices, ...plans, ...(announcements || [])] };
    });
  }

  // : Detailed Platform Health
  detailedHealth(actor: User) {
    return this.platform(actor, async (m) => {
      const start = Date.now();
      await m.query("SELECT 1");
      const latencyMs = Date.now() - start;
      const [storage] = await m.query(
        `SELECT COALESCE(SUM(size_bytes), 0)/1073741824.0 AS used FROM recorded_sessions`,
      );
      const [events] = await m.query(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE failed_at IS NOT NULL)::int AS failed FROM domain_events`,
      );
      const [sess] = await m.query(
        `SELECT COUNT(DISTINCT user_id)::int AS count FROM user_refresh_tokens WHERE expires_at > now() AND revoked_at IS NULL`,
      );
      const [dau] = await m.query(
        `SELECT COUNT(DISTINCT actor_id)::int AS count FROM audit_events WHERE created_at >= now() - INTERVAL '24 hours' AND actor_id IS NOT NULL`,
      );
      const errorRateNum = events.total
        ? Number(((events.failed / events.total) * 100).toFixed(2))
        : 0;
      const isHealthy = errorRateNum < 5 && latencyMs < 1000;
      return {
        overall: isHealthy ? "HEALTHY" : "DEGRADED",
        services: [
          {
            name: "PostgreSQL Database",
            status: latencyMs < 1000 ? "HEALTHY" : "DEGRADED",
            latencyMs,
            uptime: null,
          },
        ],
        metrics: {
          errorRate: `${errorRateNum}%`,
          avgLatencyMs: latencyMs,
          activeSessions: Number(sess?.count ?? 0),
          dailyActiveUsers: Number(dau?.count ?? 0),
          storageUsedGb: Number(Number(storage.used).toFixed(2)),
          storageLimitGb: 500,
        },
      };
    });
  }

  //  & : Platform Staff Management
  staff(actor: User) {
    return this.platform(actor, async (m) => {
      const users = await m.query(
        `SELECT id, email, name, phone, platform_role AS "platformRole", is_platform_admin AS "isSuperAdmin", created_at AS "createdAt" FROM users WHERE is_platform_admin = true OR platform_role != 'none' ORDER BY created_at ASC`,
      );
      return {
        staff: users,
        roles: [
          {
            role: "super_admin",
            label: "Super Admin",
            permissions: "Full platform access",
          },
          {
            role: "platform_admin",
            label: "Platform Admin",
            permissions: "School and platform operations",
          },
          {
            role: "finance_admin",
            label: "Finance Admin",
            permissions: "Billing, invoices and revenue",
          },
          {
            role: "support_agent",
            label: "Support Agent",
            permissions: "School support & audited sessions",
          },
          {
            role: "security_admin",
            label: "Security Admin",
            permissions: "Audit logs & security policies",
          },
          {
            role: "operations_manager",
            label: "Operations Manager",
            permissions: "School onboarding and lifecycles",
          },
        ],
      };
    });
  }
}
