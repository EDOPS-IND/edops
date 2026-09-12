import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../common/auth.guard';
import { SchoolEndpoint } from '../../common/school-api-docs';
import { AcademicListDto } from '../academics/academic.dto';
import { BatchStatus, BatchSummary, BulkInvitationsDto, CsvInvitationsDto, InvitationBatchResult, MemberInvitationDto, MemberListDto, MembershipStatusDto, MemberStatus, MemberSummary, RevokedInvitation } from './provisioning.dto';
import { ProvisioningService } from './provisioning.service';

@ApiTags('School Roster')
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId', version: '1' })
export class ProvisioningController {
  constructor(private readonly provisioning: ProvisioningService) {}

  @Post('invitations') @SchoolEndpoint('Invite one teacher or student', 'create', InvitationBatchResult, false, 'Returns a one-record batch. No email is sent. Accept through /api/v1/auth/invitations/accept; an existing account must sign in first.')
  invite(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Body() dto: MemberInvitationDto, @Headers('idempotency-key') key?: string) {
    return this.provisioning.invite(org, req.user, [dto], key);
  }
  @Post('invitations/bulk') @SchoolEndpoint('Invite 1-100 teachers/students atomically', 'create', InvitationBatchResult, false, 'Duplicate emails, active invites, existing memberships or invalid rows reject the whole batch. Tokens expire after 48 hours. Tokens are encrypted in 24-hour idempotency replay storage, never plaintext at rest.')
  bulk(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Body() dto: BulkInvitationsDto, @Headers('idempotency-key') key?: string) {
    return this.provisioning.invite(org, req.user, dto.records, key);
  }
  @Post('invitations/import') @SchoolEndpoint('Import teacher/student invitations from CSV', 'create', InvitationBatchResult, false, 'JSON body with csv text, not multipart. Exact email,role headers; at most 100 records, 12000 characters. Quoted fields and BOM supported. All-or-nothing validation.')
  csv(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Body() dto: CsvInvitationsDto, @Headers('idempotency-key') key?: string) {
    return this.provisioning.csv(org, req.user, dto.csv, key);
  }
  @Get('invitation-batches') @SchoolEndpoint('List invitation batches', 'read', BatchSummary, true)
  batches(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query() query: AcademicListDto) {
    return this.provisioning.batches(org, req.user, query);
  }
  @Get('invitation-batches/:id') @ApiParam({ name: 'id', format: 'uuid' }) @SchoolEndpoint('Read batch acceptance/expiry status', 'read', BatchStatus, false, 'Never returns raw tokens or token hashes.')
  batch(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.provisioning.batch(org, req.user, id);
  }
  @Patch('invitations/:id/revoke') @ApiParam({ name: 'id', format: 'uuid' }) @SchoolEndpoint('Revoke a teacher/student invitation', 'update', RevokedInvitation, false, 'No body. Accepted or previously revoked invites return 409. School-admin onboarding invites are not managed here.')
  revoke(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.provisioning.revoke(org, req.user, id);
  }
  @Get('members') @SchoolEndpoint('List teacher/student memberships', 'read', MemberSummary, true, 'Includes active and inactive school memberships; optionally filter by role. Does not expose other schools or platform privileges.')
  members(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query() query: MemberListDto) {
    return this.provisioning.members(org, req.user, query);
  }
  @Patch('members/:id') @ApiParam({ name: 'id', format: 'uuid', description: 'Teacher/student user UUID.' }) @SchoolEndpoint('Activate/deactivate a school membership', 'update', MemberStatus, false, 'Does not edit the global account, email, password or role. Historical assignments/enrollments and their section capacity remain. Deactivation releases a subscription seat; reactivation checks M6 entitlement and reserved-seat limits. Other schools are unaffected.')
  update(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() dto: MembershipStatusDto) {
    return this.provisioning.updateMember(org, req.user, id, dto);
  }
}
