import { Body, Controller, Get, Headers, Module, Param, ParseUUIDPipe, Patch, Post, Query, Req, Type } from '@nestjs/common';
import { ApiParam, ApiProperty, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../common/auth.guard';
import { SchoolEndpoint } from '../../common/school-api-docs';
import { AcademicListDto } from '../academics/academic.dto';
import { EmptyActionDto } from '../assignments/teaching.dto';
import { TeachingModule } from '../assignments/teaching.module';
import { AuditModule } from '../audit/audit.module';
import { ArenaAttemptDto, ArenaQuery, ArenaQuestionDto, UpdateArenaQuestionDto } from './arena.dto';
import { ArenaAttempt, ArenaQuestion } from './arena.entity';
import { ArenaService } from './arena.service';

class ArenaAnswerKey {
  @ApiProperty({ type: [String], description: 'Staff-only correct option IDs.' }) answerKey!: string[];
}
function Endpoint(summary: string, mode: 'read' | 'create' | 'update', model: Type<unknown>, list: boolean, description: string) {
  return SchoolEndpoint(summary, mode, model, list, description,
    'Active school and membership required. Teachers require current section/subject assignment. Students require current enrollment and own attempts. Platform privilege alone grants no school access; permissions are rechecked before replay.');
}
@ApiTags('Arena')
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/arena', version: '1' })
export class ArenaController {
  constructor(private readonly arena: ArenaService) {}

  @Post('questions') @Endpoint('Create an objective practice question', 'create', ArenaQuestion, false, 'Staff only. Creates a class-scoped draft with structured content and validated answer key. Supports single_choice and multiple_choice, no LLM or code execution. Response excludes answer key.')
  create(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Body() dto: ArenaQuestionDto, @Headers('idempotency-key') key?: string) { return this.arena.create(org, req.user, dto, key); }

  @Get('questions') @Endpoint('Browse the class question bank', 'read', ArenaQuestion, true, 'Requires sectionId and subjectId. Optional exact topic, tag, difficulty and status filters. Students only see published questions, staff all states. Newest first; no answer keys in any list response.')
  list(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query() query: ArenaQuery) { return this.arena.list(org, req.user, query); }

  @Get('questions/:id') @ApiParam({ name: 'id', format: 'uuid' }) @Endpoint('Read a practice question', 'read', ArenaQuestion, false, 'Returns prompt, options and metadata, never the answer key. Students need a published question and active class enrollment. Draft and archived questions return 404 for students.')
  get(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) { return this.arena.get(org, req.user, id); }

  @Get('questions/:id/answer-key') @ApiParam({ name: 'id', format: 'uuid' }) @Endpoint('Read the staff-only answer key', 'read', ArenaAnswerKey, false, 'Assigned teacher or school admin only, in any lifecycle state. Never accessible to students, including after a correct attempt. Use when editing a draft; do not cache in student-facing state.')
  answerKey(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) { return this.arena.get(org, req.user, id, true); }

  @Patch('questions/:id') @ApiParam({ name: 'id', format: 'uuid' }) @Endpoint('Edit a draft practice question', 'update', ArenaQuestion, false, 'Staff only; nonempty partial update. Content is replaced as a whole and the merged question/key are validated together. Section and subject cannot change. Published/archived questions cannot be edited; create a replacement draft instead.')
  update(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() dto: UpdateArenaQuestionDto) { return this.arena.update(org, req.user, id, dto); }

  @Post('questions/:id/publish') @ApiParam({ name: 'id', format: 'uuid' }) @Endpoint('Publish a draft for enrolled students', 'create', ArenaQuestion, false, 'Staff only; empty body. Freezes content, key and scoring. Any currently enrolled student, including a late joiner, can practice. No M4 notification event is emitted. A replay does not republish an archived question.')
  publish(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() _dto: EmptyActionDto, @Headers('idempotency-key') key?: string) { return this.arena.transition(org, req.user, id, 'published', key); }

  @Patch('questions/:id/archive') @ApiParam({ name: 'id', format: 'uuid' }) @Endpoint('Archive a practice question', 'update', ArenaQuestion, false, 'Staff only; empty body. Terminal state, repeat-safe. Stops discovery and new attempts, retains prior attempts and scorecard metrics. Students may still read their own attempt history while enrolled. No physical deletion.')
  archive(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() _dto: EmptyActionDto) { return this.arena.transition(org, req.user, id, 'archived', null); }

  @Post('questions/:id/attempts') @ApiParam({ name: 'id', format: 'uuid' }) @Endpoint('Submit and objectively grade my practice attempt', 'create', ArenaAttempt, false, 'Students only, published question. Send selectedOptionIds; server derives identity, correctness and score. Exact set match earns full maxScore, otherwise zero; no partial credit. Repeated practice is allowed. Same key and selections, even reordered, replay one attempt. Attempt, scorecard refresh, audit and replay commit atomically.')
  submit(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() dto: ArenaAttemptDto, @Headers('idempotency-key') key?: string) { return this.arena.submit(org, req.user, id, dto, key); }

  @Get('questions/:id/attempts') @ApiParam({ name: 'id', format: 'uuid' }) @Endpoint('Read authorized question attempt history', 'read', ArenaAttempt, true, 'Newest first. Students see only their own attempts; current assigned teachers and admins see class attempts. Archived history remains readable for enrolled students who attempted it. No answer-key disclosure or peer leaderboard.')
  attempts(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Query() query: AcademicListDto) { return this.arena.attempts(org, req.user, id, query); }

  @Get('attempts/:id') @ApiParam({ name: 'id', format: 'uuid' }) @Endpoint('Read an authorized graded attempt', 'read', ArenaAttempt, false, 'Read-only stored result with submitted options, correctness and awarded/max points. A student cannot read a classmates attempt. Current enrollment/teacher assignment is rechecked even for historical results.')
  attempt(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) { return this.arena.attempt(org, req.user, id); }
}

@Module({ imports: [TeachingModule, AuditModule], controllers: [ArenaController], providers: [ArenaService] })
export class ArenaModule {}
