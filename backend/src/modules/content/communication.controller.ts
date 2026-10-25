import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  Type,
} from "@nestjs/common";
import { ApiParam, ApiProperty, ApiTags } from "@nestjs/swagger";
import { SchoolEndpoint } from "../../common/school-api-docs";
import { ApiErrors } from "../../common/api-docs";
import { AuthenticatedRequest } from "../../common/auth.guard";
import {
  AssignmentQuery,
  ClassQuery,
  EmptyActionDto,
} from "../assignments/teaching.dto";
import { TeachingModule } from "../assignments/teaching.module";
import { AuditModule } from "../audit/audit.module";
import { FeedService, InboxQuery } from "../notifications/feed.service";
import { OutboxModule } from "../notifications/outbox.service";
import {
  CompleteRecordingDto,
  CreateRecordingDto,
  UpdateRecordingDto,
} from "./recording.dto";
import { Recording } from "./recording.entity";
import { RecordingsService } from "./recordings.service";
import { StorageService } from "./storage.service";
import type { Response } from "express";
import { SchoolAdminModule } from "../school-admin/school-admin.module";
import { SchoolAdminService } from "../school-admin/school-admin.service";
import { CommunicationRealtimeService } from "../school-admin/communication-realtime.service";
import { SendDirectCommunicationDto, UpdateCommunicationStatusDto } from "../school-admin/school-admin.dto";

class TimelineEvent {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({
    enum: [
      "assignment.published",
      "submission.graded",
      "attendance.finalized",
      "recording.published",
    ],
  })
  eventType!: string;
  @ApiProperty({ format: "uuid" }) resourceId!: string;
  @ApiProperty({ format: "uuid" }) sectionId!: string;
  @ApiProperty({ type: String, format: "uuid", nullable: true }) subjectId!:
    | string
    | null;
  @ApiProperty({ format: "date-time" }) occurredAt!: string;
}
class Notification extends TimelineEvent {
  @ApiProperty({ format: "uuid" }) eventId!: string;
  @ApiProperty({ type: String, format: "date-time", nullable: true }) readAt!:
    | string
    | null;
}
class InboxPage {
  @ApiProperty({ type: [Notification] }) items!: Notification[];
  @ApiProperty() total!: number;
  @ApiProperty() unreadCount!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() offset!: number;
}
class ReadResult {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "date-time" }) readAt!: string;
}
class PlaybackUrl {
  @ApiProperty({
    description: "Short-lived bearer capability. Do not log, persist or share.",
  })
  url!: string;
  @ApiProperty({ example: 120 }) expiresIn!: number;
}
class UploadUrl extends PlaybackUrl {
  @ApiProperty({ example: "PUT" }) method!: string;
  @ApiProperty({ type: "object", additionalProperties: { type: "string" } })
  headers!: Record<string, string>;
  @ApiProperty() sizeBytes!: number;
}
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
    "Active school and membership required. Teachers need current section/subject assignment; students need current enrollment and their own eligible data. Platform privilege alone grants no school access. Resource permissions are rechecked before replay.",
  );
}

@ApiTags("Communication and Recordings")
@ApiParam({ name: "organizationId", format: "uuid" })
@Controller({ path: "organizations/:organizationId", version: "1" })
export class CommunicationController {
  constructor(
    private readonly feed: FeedService,
    private readonly recordings: RecordingsService,
    private readonly chat: SchoolAdminService,
    private readonly realtime: CommunicationRealtimeService,
  ) {}

  @Get("communication/events")
  communicationEvents(@Param("organizationId", ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Res() response: Response) {
    this.realtime.connect(org, req.user.id, response);
  }

  @Get("communication/recipients")
  communicationRecipients(@Param("organizationId", ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Query("role") role?: string, @Query("search") search = "") {
    return this.chat.getCommunicationRecipients(org, req.user, role, search);
  }

  @Get("communication/conversations")
  communicationConversations(@Param("organizationId", ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest) {
    return this.chat.getCommunicationConversations(org, req.user);
  }

  @Get("communication/conversations/:conversationId")
  communicationConversation(@Param("organizationId", ParseUUIDPipe) org: string, @Param("conversationId", ParseUUIDPipe) conversationId: string, @Req() req: AuthenticatedRequest) {
    return this.chat.getCommunicationConversation(org, req.user, conversationId);
  }

  @Post("communication/messages")
  sendCommunicationMessage(@Param("organizationId", ParseUUIDPipe) org: string, @Req() req: AuthenticatedRequest, @Body() dto: SendDirectCommunicationDto) {
    return this.chat.sendDirectCommunication(org, req.user, dto);
  }

  @Patch("communication/conversations/:conversationId/read")
  markCommunicationRead(@Param("organizationId", ParseUUIDPipe) org: string, @Param("conversationId", ParseUUIDPipe) conversationId: string, @Req() req: AuthenticatedRequest) {
    return this.chat.markCommunicationConversationRead(org, req.user, conversationId);
  }

  @Patch("communication/conversations/:conversationId/status")
  updateCommunicationStatus(@Param("organizationId", ParseUUIDPipe) org: string, @Param("conversationId", ParseUUIDPipe) conversationId: string, @Req() req: AuthenticatedRequest, @Body() dto: UpdateCommunicationStatusDto) {
    return this.chat.updateCommunicationStatus(org, req.user, conversationId, dto);
  }

  @Get("communication/notices")
  getNotices(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chat.getRoleNotices(org, req.user);
  }

  @Post("communication/notices")
  createNotice(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
  ) {
    return this.chat.createRoleNotice(org, req.user, dto);
  }

  @Patch("communication/notices/read-all")
  markAllNoticesRead(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chat.markAllNoticesRead(org, req.user);
  }

  @Patch("communication/notices/:id/read")
  markNoticeRead(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chat.markNoticeRead(org, req.user, id);
  }

  @Get("communication/teacher-sections")
  getTeacherSections(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chat.getTeacherBroadcastSections(org, req.user);
  }
  @Get("timeline")
  @Endpoint(
    "Read the authorized class timeline",
    "read",
    TimelineEvent,
    true,
    "Requires sectionId; omitted subjectId selects whole-class events only. Worker-projected events, newest first. Students only see snapshotted events addressed to them, never classmates grading events. No grades, answers or signed media URLs in payloads.",
  )
  timeline(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: ClassQuery,
  ) {
    return this.feed.timeline(org, req.user, query);
  }

  @Get("notifications")
  @Endpoint(
    "Read my in-app notification inbox",
    "read",
    InboxPage,
    false,
    "Own inbox only, current resource access enforced. filter=all or unread. unreadCount counts currently visible unread notifications. No email, push or WhatsApp delivery is implied.",
  )
  notifications(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: InboxQuery,
  ) {
    return this.feed.inbox(org, req.user, query);
  }

  @Patch("notifications/read-all")
  markAllNotificationsRead(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.feed.markAllRead(org, req.user);
  }

  @Patch("notifications/:id/read")
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Mark my notification read",
    "update",
    ReadResult,
    false,
    "Empty body. Foreign, inaccessible or another users notification returns 404. Repeating preserves the original readAt and does not add another audit event.",
  )
  read(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() _dto: EmptyActionDto,
  ) {
    return this.feed.read(org, req.user, id);
  }

  @Get("recordings")
  @Endpoint(
    "List class recordings",
    "read",
    Recording,
    true,
    "Requires sectionId and subjectId. Staff see all lifecycle states, students only published recordings. Current students may watch earlier recordings even if they joined after publication. Does not include storage keys or URLs.",
  )
  list(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Query() query: AssignmentQuery,
  ) {
    return this.recordings.list(org, req.user, query);
  }

  @Post("recordings")
  @Endpoint(
    "Create recording metadata",
    "create",
    Recording,
    false,
    "Staff only. Creates uploading state and a server-generated tenant-scoped key. MP4/WebM, maximum 512 MiB. Supply full-file base64 SHA-256, byte size and declared duration. No binary data in the API request.",
  )
  create(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRecordingDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.recordings.create(org, req.user, dto, key);
  }

  @Get("recordings/:id")
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Read recording metadata",
    "read",
    Recording,
    false,
    "Resource-scoped read; unpublished or archived recordings are hidden from students. No video URL, object key, version or checksum is exposed.",
  )
  get(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recordings.get(org, req.user, id);
  }

  @Patch("recordings/:id")
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Edit unpublished recording metadata",
    "update",
    Recording,
    false,
    "Staff only. Nonempty partial title, recordedAt or durationSeconds update in uploading/ready state. School, section, subject and declared file bytes/hash are immutable.",
  )
  update(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateRecordingDto,
  ) {
    return this.recordings.update(org, req.user, id, dto);
  }

  @Post("recordings/:id/upload-url")
  @HttpCode(200)
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Authorize a private direct upload",
    "update",
    UploadUrl,
    false,
    "Staff only, uploading state, empty body. Returns 200 with a fresh 300-second PUT URL; no idempotency replay. Send returned headers and the exact file bytes directly to storage. Browser sets Content-Length automatically. Capture x-amz-version-id from storage. Missing storage configuration returns 503.",
  )
  @ApiErrors(503)
  upload(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() _dto: EmptyActionDto,
  ) {
    return this.recordings.upload(org, req.user, id);
  }

  @Post("recordings/:id/complete")
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Verify the uploaded immutable video version",
    "create",
    Recording,
    false,
    "Staff only. Checks the supplied versionId through S3 HEAD and a bounded range GET: exact size, type, SHA-256 and MP4/WebM signature. Requires versioned storage. Success changes uploading to ready; failed verification leaves metadata unchanged. Duration is declared, not probed; no malware scanning/transcoding.",
  )
  @ApiErrors(503)
  complete(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CompleteRecordingDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.recordings.complete(org, req.user, id, dto, key);
  }

  @Post("recordings/:id/publish")
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Publish a verified recording",
    "create",
    Recording,
    false,
    "Staff only; empty body. Requires ready state. Commits publication, recipient snapshot, outbox and audit together. The worker adds timeline/in-app notifications asynchronously.",
  )
  publish(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() _dto: EmptyActionDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.recordings.publish(org, req.user, id, key);
  }

  @Patch("recordings/:id/archive")
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Archive a recording without deleting its object",
    "update",
    Recording,
    false,
    "Staff only; empty body. Terminal state, repeating is harmless. Hides student metadata, feed events and future playback authorizations. Already issued URLs remain usable until expiry; object cleanup/retention is a separate operator policy.",
  )
  archive(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() _dto: EmptyActionDto,
  ) {
    return this.recordings.archive(org, req.user, id);
  }

  @Get("recordings/:id/playback")
  @ApiParam({ name: "id", format: "uuid" })
  @Endpoint(
    "Authorize short-lived playback of a verified version",
    "read",
    PlaybackUrl,
    false,
    "Students require published state; staff may preview ready state. Returns a 120-second signed URL pinned to the verified object version. The URL is a bearer capability and remains valid until expiry even after membership revocation. No public bucket or permanent video URL.",
  )
  @ApiErrors(503)
  playback(
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.recordings.playback(org, req.user, id);
  }
}

@Module({
  imports: [TeachingModule, AuditModule, OutboxModule, SchoolAdminModule],
  controllers: [CommunicationController],
  providers: [FeedService, RecordingsService, StorageService],
})
export class CommunicationModule {}
