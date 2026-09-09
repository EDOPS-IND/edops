import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthenticatedRequest, PlatformAdmin, Public } from '../../common/auth.guard';
import { AuthService } from '../auth/auth.service';
import { AcceptInvitationDto, CreateOrganizationDto, OrganizationStatusDto, UpdateOrganizationDto } from './tenant.dto';
import { TenantsService } from './tenants.service';
import { acceptedInvitationSchema, ApiErrors, organizationSchema, provisionSchema } from '../../common/api-docs';

@ApiTags('Platform')
@ApiErrors(429, 500)
@PlatformAdmin()
@Controller('platform/organizations')
export class PlatformOrganizationsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a school and invite its first administrator', security: [{ cookie: [], csrf: [] }],
    description: 'Platform administrator only. In one transaction, creates an active organization, stores a hashed 48-hour invitation and records organization.created. Returns the raw invitation once for private manual delivery; no email is sent. Does not create a user, membership, subscription or billing record yet. Duplicate slug returns 409. Not idempotent: a lost response cannot recover the raw token by repeating this request. Limit: 120 requests/minute per IP.',
  })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiCreatedResponse({ description: 'Created school and one-time administrator invitation.', schema: provisionSchema })
  @ApiErrors(400, 401, 403, 409, 413)
  create(@Body() dto: CreateOrganizationDto, @Req() request: AuthenticatedRequest) {
    return this.tenants.create(dto, request.user);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activate or suspend a school', security: [{ cookie: [], csrf: [] }],
    description: 'Platform administrator only. Locks the organization, updates status and records organization.status_changed with before/after values in one transaction. Suspension denies school reads, settings writes and invite acceptance on subsequent requests. It does not delete data, revoke sessions or change billing; /auth/me still lists suspended memberships. Sending the same status still writes an audit event. Limit: 120 requests/minute per IP.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Organization UUID, not its slug.' })
  @ApiBody({ type: OrganizationStatusDto })
  @ApiOkResponse({ description: 'Organization with its resulting status.', schema: organizationSchema })
  @ApiErrors(400, 401, 403, 404, 413)
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: OrganizationStatusDto, @Req() request: AuthenticatedRequest) {
    return this.tenants.setStatus(id, dto.status, request.user);
  }
}

@ApiTags('Schools')
@ApiErrors(429, 500)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Read your school settings', security: [{ cookie: [] }],
    description: 'Requires an active school_admin membership in this active organization. Rechecks membership, role and school status from PostgreSQL. No active membership returns 404; another school role or suspended school returns 403. Platform privilege alone does not bypass this check. No database changes or audit event. Limit: 120 requests/minute per IP.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID from your /auth/me organizations list.' })
  @ApiOkResponse({ description: 'Authorized organization, without users or invitation secrets.', schema: organizationSchema })
  @ApiErrors(400, 401, 403, 404)
  get(@Param('id', ParseUUIDPipe) id: string, @Req() request: AuthenticatedRequest) {
    return this.tenants.get(id, request.user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update your school name, timezone or locale', security: [{ cookie: [], csrf: [] }],
    description: 'Requires an active school_admin membership and active school. Accepts at least one of name, timeZone, locale. Unknown fields, nulls and an empty object fail with 400; slug, role, status and platform privileges cannot be changed here. Locks the school and saves settings with an organization.updated before/after audit event in one transaction. Omitted fields remain unchanged. Same-value updates still produce audit events. Limit: 120 requests/minute per IP.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'UUID from your /auth/me organizations list.' })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiOkResponse({ description: 'Organization after the settings update.', schema: organizationSchema })
  @ApiErrors(400, 401, 403, 404, 413)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrganizationDto, @Req() request: AuthenticatedRequest) {
    return this.tenants.update(id, dto, request.user);
  }
}

@ApiTags('Authentication')
@ApiErrors(429, 500)
@Controller('auth/invitations')
export class InvitationsController {
  constructor(private readonly tenants: TenantsService, private readonly auth: AuthService) {}

  @Public()
  @Post('accept')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Accept a school membership invitation', security: [{ cookie: [], csrf: [] }],
    description: 'Get /auth/csrf first. New account: be signed out and supply a 12-128 character password. Existing account: sign in with the invited email and omit password; an invite cannot reset it. Locks the school before the invitation and checks expiry, revocation, previous use and active school. In one transaction, creates the user if needed, adds the role stored on the invitation (school_admin for platform onboarding; teacher/student for M2 roster invites), consumes the invite and records invitation.accepted. Does not log in a new user or grant platform privilege. Invalid/expired/revoked/used token returns 400; wrong account or unavailable school returns 403; uniqueness conflicts return 409. Limit: 10 requests/minute per IP.',
  })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiOkResponse({ description: 'Membership granted. New users must now call /auth/login.', schema: acceptedInvitationSchema })
  @ApiErrors(400, 403, 409, 413)
  async accept(@Body() dto: AcceptInvitationDto, @Req() request: Request) {
    return this.tenants.acceptInvitation(dto, await this.auth.currentUser(request.session));
  }
}
