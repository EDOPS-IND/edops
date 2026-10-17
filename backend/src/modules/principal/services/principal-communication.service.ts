import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { CreateAcademicAnnouncementDto, ResolveParentQueryDto } from '../dto/principal.dto';

@Injectable()
export class PrincipalCommunicationService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getCommunicationOverview(orgId: string, _actor: User) {
    const manager = this.drizzle;

    const parentQueries = await manager.query(
      `SELECT * FROM principal_parent_queries WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [orgId],
    );

    const fallbackQueries = parentQueries.length ? parentQueries : [];

    let inboxMessages: any[] = [];
    try {
      const liveMsgs = await manager.query(
        `SELECT tm.*, su.name as sender_name, su.email as sender_email
         FROM teacher_messages tm
         LEFT JOIN users su ON su.id = tm.sender_id
         WHERE tm.organization_id = $1 AND (tm.recipient_role = 'principal' OR tm.recipient_id = $2)
         ORDER BY tm.created_at DESC`,
        [orgId, _actor.id]
      );
      if (liveMsgs && liveMsgs.length > 0) {
        inboxMessages = liveMsgs.map((m: any) => ({
          id: m.id,
          sender: m.sender_name || 'Academic Faculty',
          category: 'Teacher Directives',
          subject: m.subject_line,
          preview: m.body,
          date: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          isUrgent: m.priority === 'urgent',
          status: m.is_read ? 'Read' : 'Unread',
        }));
      }
    } catch (error) { throw error; }

    if (inboxMessages.length === 0) {
      inboxMessages = [];
    }

    const ptmSchedules = await manager.query(`SELECT id,title,event_date AS date,start_time || ' - ' || end_time AS timing,target_grades AS "targetGrades",total_slots AS "totalSlots",booked_slots AS "bookedSlots",status FROM ptm_schedules WHERE organization_id=$1 ORDER BY event_date`, [orgId]);

    return {
      inbox: inboxMessages,
      parentQueries: fallbackQueries.map(q=>({...q,parentName:q.parent_name,parentEmail:q.parent_email,studentName:q.student_name,classSection:q.class_section,queryText:q.query_text,resolutionNotes:q.resolution_notes,assignedTeacherName:q.assigned_teacher_name})),
      ptmSchedules,
    };
  }

  async resolveParentQuery(orgId: string, _actor: User, queryId: string, dto: ResolveParentQueryDto) {
    const rows = await this.drizzle.query(`UPDATE principal_parent_queries SET status=$1,resolution_notes=$2,resolved_at=CASE WHEN $1='resolved' THEN now() ELSE NULL END WHERE id=$3 AND organization_id=$4 RETURNING id`, [dto.status,dto.resolutionNotes || '',queryId,orgId]);
    if (!rows.length) throw new NotFoundException('Parent query not found');
    return { success:true,queryId,status:dto.status };
  }

  async createAnnouncement(orgId: string, actor: User, dto: CreateAcademicAnnouncementDto) {
    const manager = this.drizzle;
    const [inserted] = await manager.query(
      `INSERT INTO school_broadcasts (
        organization_id, title, message, target_audience, priority, sent_by, sender_name, recipient_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
      RETURNING *`,
      [
        orgId,
        dto.title,
        dto.message,
        dto.targetAudience || 'all',
        dto.priority || 'normal',
        actor.id,
        actor.name || 'Principal',
      ],
    );
    return inserted;
  }
}
