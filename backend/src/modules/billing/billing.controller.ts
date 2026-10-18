import {
  applyDecorators,
  Body,
  Controller,
  Get,
  Headers,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Type,
} from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import { AuthenticatedRequest, PlatformAdmin } from "../../common/auth.guard";
import { ApiErrors } from "../../common/api-docs";
import { SchoolEndpoint } from "../../common/school-api-docs";
import { AcademicListDto } from "../academics/academic.dto";
import { EmptyActionDto } from "../assignments/teaching.dto";
import { AuditModule } from "../audit/audit.module";
import { TenantsModule } from "../tenants/tenants.module";
import {
  CreatePlanDto,
  FeatureOverrideDto,
  PayInvoiceDto,
  PlanStatusDto,
  SubscriptionDto,
} from "./billing.dto";
import {
  BillingOverview,
  InvoiceView,
  PlanView,
  SchoolStatistics,
  SchoolSummary,
} from "./billing.responses";
import { BillingService } from "./billing.service";

function Endpoint(
  summary: string,
  mode: "read" | "create" | "update",
  model: Type<unknown>,
  list: boolean,
  description: string,
) {
  return SchoolEndpoint(
    summary,
    mode,
    model,
    list,
    description,
    "Platform administrator only. School membership is not required on this explicit control-plane route. Billing writes lock the selected organization, set tenant context and audit atomically; suspended schools remain administrable.",
  );
}
function StablePlanCreate() {
  return applyDecorators(
    ApiExtraModels(PlanView),
    ApiOperation({
      summary: "Create immutable monthly plan terms",
      security: [{ cookie: [], csrf: [] }],
      description:
        "Platform administrator only. Supply a stable UUID id in the body; identical retries return the existing plan, changed terms under that ID return 409. No Idempotency-Key header. Flat monthly INR paise, included seat limits and three explicit features. Create a new plan ID to change terms; no tax or gateway integration.",
    }),
    ApiResponse({
      status: 201,
      description: "Created or identical plan ID recovered.",
      schema: { $ref: getSchemaPath(PlanView) },
    }),
    ApiErrors(400, 401, 403, 409, 413, 429, 500),
  );
}
@ApiTags("Platform Billing")
@PlatformAdmin()
@Controller({ path: "platform", version: "1" })
export class PlatformBillingController {
  constructor(private readonly billing: BillingService) {}
  @Get("dashboard")
  dashboard(@Req() req: AuthenticatedRequest) {
    return this.billing.dashboard(req.user);
  }
  @Get("audit-logs")
  auditLogs(@Req() req: AuthenticatedRequest, @Query() q: AcademicListDto) {
    return this.billing.auditLogs(req.user, q);
  }
  @Post("plans")
  @StablePlanCreate()
  createPlan(@Req() req: AuthenticatedRequest, @Body() dto: CreatePlanDto) {
    return this.billing.createPlan(req.user, dto);
  }
  @Get("plans")
  @Endpoint(
    "List platform plan catalog",
    "read",
    PlanView,
    true,
    "Includes retired plans and migration trial plan. Paginated newest-first metadata. Plan retirement does not alter existing subscription terms or revoke access; it prevents choosing that plan on subsequent subscription writes.",
  )
  plans(@Req() req: AuthenticatedRequest, @Query() q: AcademicListDto) {
    return this.billing.plans(req.user, q);
  }
  @Patch("plans/:id/status")
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Activate or retire a plan",
    "update",
    PlanView,
    false,
    "Only active can change. Plan price, currency, features and limits are immutable. Repeating the same status returns the current row without another audit. Retirement does not cancel existing subscribers.",
  )
  planStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: PlanStatusDto,
  ) {
    return this.billing.planStatus(req.user, id, dto.active);
  }
  @Get("organizations")
  @Endpoint(
    "List schools for platform administration",
    "read",
    SchoolSummary,
    true,
    "Paginated directory including suspended schools. Returns school ID, name, slug, status and creation time. Does not return memberships, student identities, invite tokens or learning records.",
  )
  organizations(@Req() req: AuthenticatedRequest, @Query() q: AcademicListDto) {
    return this.billing.organizations(req.user, q);
  }
  @Get("organizations/:organizationId/billing")
  @ApiParam({ name: "organizationId", format: "uuid" })
  @Endpoint(
    "Read school subscription and entitlements",
    "read",
    BillingOverview,
    false,
    "Returns explicit subscription or implicit 30-day trial, effective feature booleans, seat usage and overrides. Period expiration and school suspension force optional features off. Billing status is not inferred from invoice status.",
  )
  get(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
  ) {
    return this.billing.get(org, req.user);
  }
  @Post("organizations/:organizationId/subscription")
  @ApiParam({ name: "organizationId", format: "uuid" })
  @Endpoint(
    "Assign or update a school subscription period",
    "create",
    BillingOverview,
    false,
    "UUID Idempotency-Key required. Select an active immutable plan, explicit status and positive period up to 32 days. No automatic renewal, charges or proration. Rejects plans below active plus reserved seats. Historical invoice amounts remain unchanged.",
  )
  subscribe(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: SubscriptionDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.billing.subscribe(org, req.user, dto, key);
  }
  @Patch("organizations/:organizationId/features")
  @ApiParam({ name: "organizationId", format: "uuid" })
  @Endpoint(
    "Set or remove a school feature override",
    "update",
    BillingOverview,
    false,
    "Use enabled, disabled or inherit for arena, recordings or communication. Override wins over plan defaults but cannot bypass period expiration, subscription inactivity, school suspension or resource permissions. Checked before replay on optional APIs.",
  )
  override(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: FeatureOverrideDto,
  ) {
    return this.billing.override(org, req.user, dto);
  }
  @Post("organizations/:organizationId/invoices")
  @ApiParam({ name: "organizationId", format: "uuid" })
  @Endpoint(
    "Issue an internal subscription invoice record",
    "create",
    InvoiceView,
    false,
    "Empty body and UUID Idempotency-Key. Copies immutable price and current explicit active/past_due subscription period. Rejects overlap with non-void invoices. Flat full-period charge, no proration, statutory invoice, tax calculation or payment-provider request.",
  )
  issue(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() _dto: EmptyActionDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.billing.issue(org, req.user, key);
  }
  @Get("organizations/:organizationId/invoices")
  @ApiParam({ name: "organizationId", format: "uuid" })
  @Endpoint(
    "List school invoice records",
    "read",
    InvoiceView,
    true,
    "Paginated newest first. Returns stored price/period snapshots and manual receipt references. Changing subscription plans cannot rewrite these records. School billing records remain available to platform admins during suspension.",
  )
  invoices(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query() q: AcademicListDto,
  ) {
    return this.billing.invoices(org, req.user, q);
  }
  @Patch("organizations/:organizationId/invoices/:id/pay")
  @ApiParam({ name: "organizationId", format: "uuid" })
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Record a verified offline payment",
    "update",
    InvoiceView,
    false,
    "Operator attestation only; does not contact a bank. Open to paid with a globally unique paymentReference and server timestamp. Exact repeats preserve timestamp; conflicting references/terminal state return 409. Does not activate, renew or extend subscription.",
  )
  pay(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: PayInvoiceDto,
  ) {
    return this.billing.settle(org, req.user, id, dto);
  }
  @Patch("organizations/:organizationId/invoices/:id/void")
  @ApiParam({ name: "organizationId", format: "uuid" })
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Void an unpaid invoice record",
    "update",
    InvoiceView,
    false,
    "Empty body; open to void, repeat-safe. Paid records cannot be voided or refunded through this route. Voiding permits issuing a replacement period record and has no subscription or payment-provider side effects.",
  )
  void(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() _dto: EmptyActionDto,
  ) {
    return this.billing.settle(org, req.user, id, null);
  }
  @Get("statistics")
  @ApiParam({ name: "organizationId", format: "uuid" })
  @Endpoint(
    "Read aggregate school product statistics",
    "read",
    SchoolStatistics,
    false,
    "Explicit platform reporting permission; queries one tenant under RLS. Counts sections, published assignments/recordings, Arena attempts, failed events and seats. Money/byte totals are decimal integer strings. No student names, answers, grades or signed URLs; not MRR or provider-metered storage.",
  )
  statistics(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
  ) {
    return this.billing.statistics(org, req.user);
  }

  //  & : Feature Catalog & Matrix
  @Get("features")
  features(@Req() req: AuthenticatedRequest) {
    return this.billing.featureCatalog(req.user);
  }

  @Get("feature-matrix")
  featureMatrix(@Req() req: AuthenticatedRequest) {
    return this.billing.featureMatrix(req.user);
  }

  @Patch("plans/:id/features")
  updatePlanFeatures(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { features: Record<string, boolean> },
  ) {
    return this.billing.updatePlanFeatures(req.user, id, body.features);
  }

  // : School-Specific Detailed Overrides
  @Get("organizations/:organizationId/detailed-overrides")
  getDetailedOverrides(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
  ) {
    return this.billing.getDetailedOverrides(req.user, org);
  }

  @Get("organizations/:organizationId/role-feature-matrix")
  getRoleFeatureMatrix(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
  ) {
    return this.billing.getRoleFeatureMatrix(req.user, org);
  }

  @Get("organizations/:organizationId/dashboard-navigation/:role")
  dashboardNavigation(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("role") role: string,
  ) {
    return this.billing.dashboardNavigation(org, req.user, role, true);
  }

  @Post("organizations/:organizationId/dashboard-navigation/:role/sections/:key")
  saveDashboardSection(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("role") role: string,
    @Param("key") key: string,
    @Body() body: { label?: string; sortOrder?: number; enabled?: boolean },
  ) {
    return this.billing.saveDashboardSection(req.user, org, role, key, body);
  }

  @Patch("organizations/:organizationId/dashboard-navigation/:role/items/:key")
  saveDashboardItem(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("role") role: string,
    @Param("key") key: string,
    @Body() body: { label?: string; sectionKey?: string; sortOrder?: number; enabled?: boolean },
  ) {
    return this.billing.saveDashboardItem(req.user, org, role, key, body);
  }

  @Patch("organizations/:organizationId/role-feature-matrix")
  updateRoleFeatureMatrix(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: { featureKey: string; role?: string | null; enabled: boolean | null; reason?: string },
  ) {
    if (dto.enabled === null) {
      return this.billing.removeDetailedOverride(req.user, org, dto.featureKey, dto.role);
    }
    return this.billing.setDetailedOverride(req.user, org, {
      featureKey: dto.featureKey,
      role: dto.role ?? undefined,
      enabled: dto.enabled,
      reason: dto.reason || 'Configured via Platform Admin matrix',
    });
  }

  @Post("organizations/:organizationId/detailed-overrides")
  setDetailedOverride(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: any,
  ) {
    return this.billing.setDetailedOverride(req.user, org, dto);
  }

  @Patch("organizations/:organizationId/detailed-overrides/:featureKey/remove")
  removeDetailedOverride(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("featureKey") featureKey: string,
    @Query("role") role?: string,
  ) {
    return this.billing.removeDetailedOverride(req.user, org, featureKey, role);
  }

  // , , , , : Full School Onboarding Wizard
  @Post("organizations/onboard")
  onboard(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.billing.onboardSchool(req.user, dto);
  }

  // : School Lifecycle Transitions
  @Patch("organizations/:organizationId/lifecycle")
  lifecycle(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: any,
  ) {
    return this.billing.schoolLifecycle(req.user, org, dto);
  }

  // : Support Center Tickets
  @Get("support/tickets")
  tickets(@Req() req: AuthenticatedRequest, @Query() q: AcademicListDto) {
    return this.billing.tickets(req.user, q);
  }

  @Post("support/tickets")
  createTicket(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.billing.createTicket(req.user, dto);
  }

  @Patch("support/tickets/:id/status")
  updateTicketStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    return this.billing.updateTicketStatus(req.user, id, dto);
  }

  // : Audited Support Sessions (Impersonation)
  @Post("support/sessions")
  startSupportSession(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.billing.startSupportSession(req.user, dto);
  }

  // : Platform Announcements
  @Get("announcements")
  announcements(@Req() req: AuthenticatedRequest) {
    return this.billing.announcements(req.user);
  }

  @Post("announcements")
  createAnnouncement(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.billing.createAnnouncement(req.user, dto);
  }

  // : Payments & Refunds
  @Get("payments")
  payments(@Req() req: AuthenticatedRequest, @Query() q: AcademicListDto) {
    return this.billing.payments(req.user, q);
  }

  @Post("payments")
  recordPayment(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.billing.recordPayment(req.user, dto);
  }

  @Post("payments/:id/refund")
  refundPayment(
    @Req() req: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    return this.billing.refundPayment(req.user, id, dto);
  }

  // : Global Search
  @Get("search")
  search(@Req() req: AuthenticatedRequest, @Query("q") q: string) {
    return this.billing.globalSearch(req.user, q);
  }

  // : Detailed Health
  @Get("health-detailed")
  detailedHealth(@Req() req: AuthenticatedRequest) {
    return this.billing.detailedHealth(req.user);
  }

  //  & : Platform Staff
  @Get("staff")
  staff(@Req() req: AuthenticatedRequest) {
    return this.billing.staff(req.user);
  }
}
@ApiTags("School Billing")
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId/billing", version: "1" })
export class SchoolBillingController {
  constructor(private readonly billing: BillingService) {}
  @Get()
  @SchoolEndpoint(
    "Read my school billing overview",
    "read",
    BillingOverview,
    false,
    "School admin read-only. Available after subscription expiration but not school suspension. Teachers/students/parents cannot read billing. No ability to edit plans, status, limits or overrides.",
  )
  get(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
  ) {
    return this.billing.get(org, req.user, false);
  }
  @Get("invoices")
  @SchoolEndpoint(
    "Read my school invoice records",
    "read",
    InvoiceView,
    true,
    "School admin read-only paginated records, including manual payment references. Not a checkout, receipt verification or tax-invoice download endpoint. Other organizations remain concealed.",
  )
  invoices(
    @Req() req: AuthenticatedRequest,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query() q: AcademicListDto,
  ) {
    return this.billing.invoices(org, req.user, q, false);
  }
}
@Controller({ path: 'organizations/:organizationId/dashboard-navigation', version: '1' })
export class DashboardNavigationController {
  constructor(private readonly billing: BillingService) {}

  @Get(':role')
  get(@Param('organizationId', ParseUUIDPipe) org: string,
    @Param('role') role: string, @Req() req: AuthenticatedRequest) {
    return this.billing.dashboardNavigation(org, req.user, role);
  }
}
@Module({
  imports: [TenantsModule, AuditModule],
  controllers: [PlatformBillingController, SchoolBillingController, DashboardNavigationController],
  providers: [BillingService],
})
export class BillingModule {}
