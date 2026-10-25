import { Injectable, NotFoundException } from "@nestjs/common";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { AcademicListDto } from "../academics/academic.dto";
import { ClassQuery } from "../assignments/teaching.dto";
import { TeachingAccess } from "../assignments/teaching-access.service";
import { User } from "../auth/user.entity";
import { AuditService } from "../audit/audit.service";

export class InboxQuery extends AcademicListDto {
  @ApiPropertyOptional({ enum: ["all", "unread"], default: "all" })
  @IsIn(["all", "unread"])
  filter: string = "all";
}

// Parameters 1-3 are always school, role, actor. Payloads contain IDs/types only, never grades or answers.
const visibleEvent = `e.organization_id=$1 AND
  ($2 IN ('school_admin', 'principal') OR ($2='teacher' AND EXISTS (SELECT 1 FROM class_subject_assignments c WHERE c.organization_id=e.organization_id
    AND c.section_id=e.section_id AND c.subject_id=e.subject_id AND c.teacher_user_id=$3))
  OR ($2='student' AND EXISTS (SELECT 1 FROM event_recipients r WHERE r.organization_id=e.organization_id AND r.event_id=e.id AND r.user_id=$3)
    AND EXISTS (SELECT 1 FROM enrollments en WHERE en.organization_id=e.organization_id AND en.section_id=e.section_id AND en.student_user_id=$3 AND en.status='active'))
  OR ($2='parent' AND EXISTS (SELECT 1 FROM event_recipients r WHERE r.organization_id=e.organization_id AND r.event_id=e.id AND r.user_id=$3)))
  AND (e.event_type<>'recording.published' OR EXISTS (SELECT 1 FROM recorded_sessions r WHERE r.organization_id=e.organization_id AND r.id=e.resource_id AND r.status='published'))`;
const eventFields = `e.event_type AS "eventType",e.resource_id AS "resourceId",e.section_id AS "sectionId",e.subject_id AS "subjectId",e.occurred_at AS "occurredAt"`;

@Injectable()
export class FeedService {
  constructor(
    private readonly access: TeachingAccess,
    private readonly audit: AuditService,
  ) {}

  timeline(org: string, actor: User, query: ClassQuery) {
    return this.access.forFeature("communication")(
      org,
      actor,
      null,
      null,
      null,
      (manager, role) =>
        this.access.classScope(
          manager,
          org,
          actor,
          role,
          query.sectionId,
          query.subjectId ?? null,
        ),
      async (manager, role) => {
        const params = [
          org,
          role,
          actor.id,
          query.sectionId,
          query.subjectId ?? null,
        ];
        const from = `FROM timeline_events t JOIN domain_events e ON e.organization_id=t.organization_id AND e.id=t.event_id
          WHERE ${visibleEvent} AND e.section_id=$4 AND e.subject_id IS NOT DISTINCT FROM $5::uuid`;
        const [count] = await manager.query(
          `SELECT count(*)::int AS total ${from}`,
          params,
        );
        const items = await manager.query(
          `SELECT e.id,${eventFields} ${from} ORDER BY e.occurred_at DESC,e.id DESC LIMIT $6 OFFSET $7`,
          [...params, query.limit, query.offset],
        );
        return {
          items,
          total: count.total,
          limit: query.limit,
          offset: query.offset,
        };
      },
    );
  }

  inbox(org: string, actor: User, query: InboxQuery) {
    return this.access.forFeature("communication")(
      org,
      actor,
      null,
      null,
      null,
      async () => {},
      async (manager, role) => {
        const params = [org, role, actor.id];
        const from = `FROM notifications n JOIN domain_events e ON e.organization_id=n.organization_id AND e.id=n.event_id
        WHERE n.user_id=$3 AND ${visibleEvent}`;
        const [counts] = await manager.query(
          `SELECT count(*)::int AS total,count(*) FILTER(WHERE n.read_at IS NULL)::int AS unread ${from}`,
          params,
        );
        const items = await manager.query(
          `SELECT n.id,n.event_id AS "eventId",n.read_at AS "readAt",${eventFields} ${from}
        ${query.filter === "unread" ? "AND n.read_at IS NULL" : ""} ORDER BY n.created_at DESC,n.id DESC LIMIT $4 OFFSET $5`,
          [...params, query.limit, query.offset],
        );
        return {
          items,
          total: query.filter === "unread" ? counts.unread : counts.total,
          unreadCount: counts.unread,
          limit: query.limit,
          offset: query.offset,
        };
      },
    );
  }

  read(org: string, actor: User, id: string) {
    return this.access.forFeature("communication")(
      org,
      actor,
      "notification.read",
      { id },
      null,
      async () => {},
      async (manager, role) => {
        const [found] = await manager.query(
          `SELECT n.id,n.read_at AS "readAt" FROM notifications n
        JOIN domain_events e ON e.organization_id=n.organization_id AND e.id=n.event_id
        WHERE n.id=$4 AND n.user_id=$3 AND ${visibleEvent}`,
          [org, role, actor.id, id],
        );
        if (!found) throw new NotFoundException("Notification not found");
        if (!found.readAt) {
          const [updated] = await manager.query(
            'UPDATE notifications SET read_at=clock_timestamp() WHERE organization_id=$1 AND id=$2 RETURNING id, read_at AS "readAt"',
            [org, id],
          );
          await this.audit.record(manager, {
            organizationId: org,
            actorId: actor.id,
            action: "notification.read",
            details: { notificationId: id },
          });
          return updated;
        }
        return found;
      },
    );
  }

  markAllRead(org: string, actor: User) {
    return this.access.forFeature("communication")(
      org,
      actor,
      "notification.read",
      { id: "all" },
      null,
      async () => {},
      async (manager) => {
        await manager.query(
          "UPDATE notifications SET read_at=clock_timestamp() WHERE organization_id=$1 AND user_id=$2 AND read_at IS NULL",
          [org, actor.id],
        );
        return { success: true };
      },
    );
  }
}
