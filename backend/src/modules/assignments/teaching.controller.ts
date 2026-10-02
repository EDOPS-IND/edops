import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, Req, Type } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../common/auth.guard';
import { SchoolEndpoint } from '../../common/school-api-docs';
import { AcademicListDto } from '../academics/academic.dto';
import { AttendanceService } from '../attendance/attendance.service';
import { ScorecardsService } from '../reports/scorecards.service';
import { AssignmentsService } from './assignments.service';
import { AssignmentDto, AssignmentQuery, AttendanceDto, AttendanceMarksDto, ClassQuery, CreateEvaluationDto, EmptyActionDto, GradeDto, SubmitDto, UpdateAssignmentDto, UpdateScoresDto } from './teaching.dto';
import { Assignment, AttendanceSession, ExamEvaluation, Submission } from './teaching.entity';
import { AttendanceRecord, RosterStudent, Scorecard, TeachingClass } from './teaching.responses';
import { TeachingService } from './teaching.service';

function TeachingEndpoint(summary: string, mode: 'read' | 'create' | 'update', model: Type<unknown>, list: boolean, description: string) {
  return SchoolEndpoint(summary, mode, model, list, description,
    'Requires an active school membership and active school. School admins manage the school; teachers require a current section/subject assignment; students require current active enrollment and only access their own eligible published work. Resource permissions are rechecked before idempotent replay.');
}

@ApiTags('Teaching')
@ApiParam({ name: 'organizationId', format: 'uuid' })
@Controller({ path: 'organizations/:organizationId/teaching', version: '1' })
export class TeachingController {
  constructor(private readonly teaching: TeachingService, private readonly assignments: AssignmentsService,
    private readonly attendance: AttendanceService, private readonly scorecards: ScorecardsService) {}

  @Get('classes') @TeachingEndpoint('List my teaching or enrolled classes', 'read', TeachingClass, true, 'Returns section/subject links, filtered by current teacher assignment or student enrollment; admins see all links.')
  classes(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query() query: AcademicListDto) {
    return this.teaching.classes(org, req.user, query);
  }
  @Get('roster') @TeachingEndpoint('Read the active class roster', 'read', RosterStudent, true, 'Staff only. Requires sectionId; teachers also need subjectId. Returns active student accounts/memberships/enrollments, not historical snapshots.')
  roster(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query() query: ClassQuery) {
    return this.teaching.roster(org, req.user, query);
  }
  @Get('assignments') @TeachingEndpoint('List class assignments', 'read', Assignment, true, 'Requires sectionId and subjectId. Students see only published assignments whose publication snapshot includes them; drafts are staff-only.')
  list(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query() query: AssignmentQuery) {
    return this.assignments.list(org, req.user, query);
  }
  @Post('assignments') @TeachingEndpoint('Create a draft assignment', 'create', Assignment, false, 'Staff only. Future dueAt with explicit timezone; maxScore 0.01-10000. No student visibility or pending submissions until publish.')
  create(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Body() dto: AssignmentDto, @Headers('idempotency-key') key?: string) {
    return this.assignments.create(org, req.user, dto, key);
  }
  @Get('assignments/:id') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Read an authorized assignment', 'read', Assignment, false, 'Students cannot discover drafts, unassigned work or assignments in a former section.')
  get(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.assignments.get(org, req.user, id);
  }
  @Patch('assignments/:id') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Edit a draft assignment', 'update', Assignment, false, 'Staff only. Nonempty partial update; section and subject are fixed. Published assignments are immutable (409).')
  update(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() dto: UpdateAssignmentDto) {
    return this.assignments.update(org, req.user, id, dto);
  }
  @Post('assignments/:id/publish') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Publish an assignment and capture its student roster', 'create', Assignment, false, 'Staff only; empty body. Requires future due date and a nonempty active roster. Atomically creates pending submissions and refreshes scorecards. No notifications sent.')
  publish(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() _dto: EmptyActionDto, @Headers('idempotency-key') key?: string) {
    return this.assignments.publish(org, req.user, id, key);
  }
  @Get('assignments/:id/submissions') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('List assignment submissions', 'read', Submission, true, 'Staff see the captured roster including pending work. Students see only their own submission, score and feedback.')
  submissions(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Query() query: AcademicListDto) {
    return this.assignments.submissions(org, req.user, id, query);
  }
  @Post('assignments/:id/submissions') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Submit or replace my ungraded answer', 'create', Submission, false, 'Students only. Plain text up to 8000 characters. Uses the signed-in student, not a supplied studentId. Submission time is server-generated; after dueAt status is late. A new key replaces ungraded work; graded work is locked. Returns 201 even when replacing.')
  submit(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() dto: SubmitDto, @Headers('idempotency-key') key?: string) {
    return this.assignments.submit(org, req.user, id, dto, key);
  }
  @Patch('submissions/:id/grade') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Grade or correct a submitted answer', 'update', Submission, false, 'Staff only. Score 0 through assignment.maxScore; no grading of pending work. Feedback omitted preserves previous feedback; empty string clears it. Grade and materialized scorecards commit with audit.')
  grade(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() dto: GradeDto) {
    return this.assignments.grade(org, req.user, id, dto);
  }
  @Get('attendance-sessions') @TeachingEndpoint('List class attendance sessions', 'read', AttendanceSession, true, 'Requires sectionId. Omitted subjectId selects only whole-class attendance, not all subjects. Students see finalized sessions containing their own record.')
  sessions(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query() query: ClassQuery) {
    return this.attendance.list(org, req.user, query);
  }
  @Post('attendance-sessions') @TeachingEndpoint('Create a draft attendance session', 'create', AttendanceSession, false, 'Staff only; whole-class sessions require school_admin. Captures the current active roster with unmarked records. Date must be within the section academic year and no later than today in school timezone. Unique per section/subject/date/period.')
  createAttendance(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Body() dto: AttendanceDto, @Headers('idempotency-key') key?: string) {
    return this.attendance.create(org, req.user, dto, key);
  }
  @Get('attendance-sessions/:id/records') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Read captured attendance records', 'read', AttendanceRecord, true, 'Staff see the full snapshot; null status is unmarked. Students see only their own finalized record.')
  records(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Query() query: AcademicListDto) {
    return this.attendance.records(org, req.user, id, query);
  }
  @Patch('attendance-sessions/:id/records') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Mark or correct attendance in an atomic batch', 'update', AttendanceSession, false, 'Staff only; 1-100 unique snapshot students. Invalid rows reject the entire batch. Omitted students keep their previous mark. Finalized corrections immediately refresh scorecards; use GET records to read marks.')
  mark(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() dto: AttendanceMarksDto) {
    return this.attendance.mark(org, req.user, id, dto);
  }
  @Post('attendance-sessions/:id/finalize') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Finalize fully marked attendance', 'create', AttendanceSession, false, 'Staff only; empty body. Every captured student must have a mark. Makes own records visible to students and refreshes materialized scorecards in the same transaction.')
  finalize(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() _dto: EmptyActionDto, @Headers('idempotency-key') key?: string) {
    return this.attendance.finalize(org, req.user, id, key);
  }
  @Get('scorecards') @TeachingEndpoint('Read stored class scorecards', 'read', Scorecard, true, 'Requires sectionId; optional subjectId (omitted means whole-class attendance only). Students see self only. Academic-year-to-date per section, not custom terms. Mean of graded score/maxScore percentages; completion counts submitted including late; attendance counts present+late over non-excused finalized records. Empty denominators are null. No expensive refresh on GET and no arena data yet.')
  reports(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query() query: ClassQuery) {
    return this.scorecards.list(org, req.user, query);
  }

  @Get('evaluations') @TeachingEndpoint('List exam evaluations', 'read', ExamEvaluation, true, 'Returns exam evaluations for section and subject.')
  evaluations(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query() query: AssignmentQuery) {
    return this.teaching.evaluations(org, req.user, query);
  }

  @Post('evaluations') @TeachingEndpoint('Create an exam evaluation', 'create', ExamEvaluation, false, 'Staff only. Create a new official exam component.')
  createEvaluation(@Param('organizationId', ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Body() dto: CreateEvaluationDto) {
    return this.teaching.createEvaluation(org, req.user, dto);
  }

  @Patch('evaluations/:id/scores') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Update student scores for an evaluation', 'update', ExamEvaluation, false, 'Staff only. Save student scores.')
  updateEvaluationScores(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Body() dto: UpdateScoresDto) {
    return this.teaching.updateEvaluationScores(org, req.user, id, dto);
  }

  @Delete('evaluations/:id') @ApiParam({ name: 'id', format: 'uuid' }) @TeachingEndpoint('Delete an exam evaluation', 'update', ExamEvaluation, false, 'Staff only.')
  deleteEvaluation(@Param('organizationId', ParseUUIDPipe) org: string, @Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.teaching.deleteEvaluation(org, req.user, id);
  }
}
