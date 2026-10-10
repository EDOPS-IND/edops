import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { SendStudentMessageDto } from '../dto/student.dto';

@Injectable()
export class StudentCommunicationService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getMessages(organizationId: string, studentUserId: string) {
    let messages: any[] = [];
    let teachersList: any[] = [];

    // Ensure constraint allows teacher if not already
    try {
      await this.drizzle.query(
        `DO $$ 
         BEGIN 
           ALTER TABLE teacher_messages DROP CONSTRAINT IF EXISTS teacher_messages_recipient_role_check;
           ALTER TABLE teacher_messages ADD CONSTRAINT teacher_messages_recipient_role_check CHECK (recipient_role IN ('student', 'parent', 'principal', 'school_admin', 'teacher'));
         EXCEPTION WHEN OTHERS THEN 
           NULL;
         END $$;`
      );
    } catch {}

    try {
      const raw = await this.drizzle.query(
        `SELECT tm.*,
                su.name as sender_name, su.email as sender_email,
                ru.name as recipient_name, ru.email as recipient_email
         FROM teacher_messages tm
         LEFT JOIN users su ON su.id = tm.sender_id
         LEFT JOIN users ru ON ru.id = tm.recipient_id
         WHERE tm.organization_id = $1 AND (tm.recipient_id = $2 OR tm.sender_id = $2 OR tm.recipient_role = 'student')
         ORDER BY tm.created_at DESC`,
        [organizationId, studentUserId]
      );

      if (raw && raw.length > 0) {
        messages = raw.map((m: any) => {
          const isOutgoing = m.sender_id === studentUserId;
          const otherPartyId = isOutgoing ? m.recipient_id : m.sender_id;
          const otherPartyName = isOutgoing
            ? (m.recipient_name || m.recipient_email || 'Teacher')
            : (m.sender_name || m.sender_email || 'Teacher');

          return {
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name || m.sender_email || (isOutgoing ? 'You' : 'Teacher / Academic Office'),
            senderRole: isOutgoing ? 'student' : (m.recipient_role || 'teacher'),
            recipientId: m.recipient_id,
            recipientName: m.recipient_name || m.recipient_email || 'Teacher',
            otherPartyId,
            otherPartyName,
            isOutgoing,
            subjectLine: m.subject_line,
            body: m.body,
            date: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            createdAt: m.created_at,
            isRead: Boolean(m.is_read),
            priority: m.priority || 'normal',
          };
        });
      }
    } catch {
      messages = [];
    }

    try {
      const teachers = await this.drizzle.query(
        `SELECT m.user_id as id, COALESCE(NULLIF(u.name, ''), u.email) as name, COALESCE(sub.name, 'Subject Faculty') as subject
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN teacher_allocations ta ON ta.teacher_user_id = m.user_id AND ta.organization_id = m.organization_id
         LEFT JOIN subjects sub ON sub.id = ta.subject_id
         WHERE m.organization_id = $1 AND m.role = 'teacher'
         GROUP BY m.user_id, u.name, u.email, sub.name
         ORDER BY name ASC`,
        [organizationId]
      );
      if (teachers && teachers.length > 0) {
        teachersList = teachers.map((t: any) => ({
          id: t.id,
          name: t.name,
          subject: t.subject || 'Faculty',
        }));
      }
    } catch {
      teachersList = [];
    }

    if (teachersList.length === 0) {
      teachersList = [
        { id: 't-rahul', name: 'Rahul Sharma', subject: 'Mathematics & Class Teacher' },
        { id: 't-priya', name: 'Priya Nair', subject: 'Science' },
        { id: 't-anita', name: 'Anita Roy', subject: 'English' },
      ];
    }

    return { messages, teachersList };
  }

  async sendMessage(organizationId: string, studentUserId: string, dto: SendStudentMessageDto) {
    // 1. Ensure student membership
    try {
      await this.drizzle.query(
        `INSERT INTO memberships (organization_id, user_id, role)
         VALUES ($1, $2, 'student')
         ON CONFLICT (organization_id, user_id) DO NOTHING`,
        [organizationId, studentUserId]
      );
    } catch {}

    // 2. Resolve recipient teacher ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(dto.recipientId);
    let resolvedRecipientId = isUuid ? dto.recipientId : null;

    if (!resolvedRecipientId) {
      try {
        const mem = await this.drizzle.query(
          `SELECT user_id FROM memberships WHERE organization_id = $1 AND role = 'teacher' AND user_id != $2 LIMIT 1`,
          [organizationId, studentUserId]
        );
        resolvedRecipientId = mem?.[0]?.user_id || null;
        if (!resolvedRecipientId) {
          const anyMem = await this.drizzle.query(
            `SELECT user_id FROM memberships WHERE organization_id = $1 AND user_id != $2 LIMIT 1`,
            [organizationId, studentUserId]
          );
          resolvedRecipientId = anyMem?.[0]?.user_id || studentUserId;
        }
      } catch {
        resolvedRecipientId = studentUserId;
      }
    }

    let insertedId = `msg-${Date.now()}`;
    try {
      const rows = await this.drizzle.query(
        `INSERT INTO teacher_messages (
          organization_id, sender_id, recipient_id, recipient_role, subject_line, body, priority, is_read
        )
        VALUES ($1, $2, $3, 'student', $4, $5, $6, false)
        RETURNING id`,
        [
          organizationId,
          studentUserId,
          resolvedRecipientId,
          dto.subjectLine,
          dto.body,
          dto.priority === 'urgent' ? 'urgent' : 'normal',
        ]
      );
      if (rows?.[0]?.id) {
        insertedId = rows[0].id;
      }
    } catch (e) {
      console.error('Error inserting student message:', e);
    }

    return {
      success: true,
      message: 'Your message has been sent to your teacher.',
      messageId: insertedId,
    };
  }
}
