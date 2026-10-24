import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { SendTeacherMessageDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherCommunicationService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getMessages(organizationId: string, user: User, filter?: string) {
    let dbMessages: any[] = [];
    let announcements: any[] = [];
    let directory: Record<string, Array<{ id: string; name: string; email: string; role: string }>> = {
      parents: [],
      students: [],
      principal: [],
      school_admin: [],
    };

    try {
      const raw = await this.drizzle.query(
        `SELECT tm.*, 
                su.name as sender_name, su.email as sender_email,
                ru.name as recipient_name, ru.email as recipient_email,
                sm.role as sender_role_actual,
                rm.role as recipient_role_actual
         FROM teacher_messages tm
         LEFT JOIN users su ON su.id = tm.sender_id
         LEFT JOIN users ru ON ru.id = tm.recipient_id
         LEFT JOIN memberships sm ON sm.user_id = tm.sender_id AND sm.organization_id = tm.organization_id
         LEFT JOIN memberships rm ON rm.user_id = tm.recipient_id AND rm.organization_id = tm.organization_id
         WHERE tm.organization_id = $1 AND (tm.recipient_id = $2 OR tm.sender_id = $2)
         ORDER BY tm.created_at DESC`,
        [organizationId, user.id]
      );

      if (raw && raw.length > 0) {
        dbMessages = raw.map((m: any) => {
          const isOutgoing = m.sender_id === user.id;
          const otherPartyName = isOutgoing
            ? (m.recipient_name || 'Academic Recipient')
            : (m.sender_name || 'Academic Sender');
          const otherPartyId = isOutgoing ? m.recipient_id : m.sender_id;
          
          // Determine the target role or channel
          let channelRole = isOutgoing
            ? (m.recipient_role_actual || m.recipient_role)
            : (m.sender_role_actual || (m.recipient_role === 'student' ? 'student' : m.recipient_role));
          
          let category = 'school_admin';
          if (channelRole === 'student') category = 'students';
          else if (channelRole === 'parent') category = 'parents';
          else if (channelRole === 'principal') category = 'principal';
          else if (channelRole === 'school_admin' || channelRole === 'admin') category = 'school_admin';
          else if (m.recipient_role === 'student') category = 'students';
          else if (m.recipient_role === 'parent') category = 'parents';
          else if (m.recipient_role === 'principal') category = 'principal';

          return {
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name || (isOutgoing ? (user.name || 'You') : 'Academic Sender'),
            senderRole: m.sender_role_actual || (isOutgoing ? 'teacher' : (m.recipient_role || 'staff')),
            recipientId: m.recipient_id,
            recipientName: m.recipient_name || 'Academic Recipient',
            otherPartyId,
            otherPartyName,
            isOutgoing,
            subjectLine: m.subject_line,
            body: m.body,
            timestamp: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            priority: m.priority || 'normal',
            isRead: Boolean(m.is_read),
            category,
          };
        });
      }
    } catch (error) { throw error; }

    // Load available contacts directory for composing messages
    try {
      const members = await this.drizzle.query(
        `SELECT m.user_id as id, u.name, u.email, m.role
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.organization_id = $1 AND m.user_id != $2
         ORDER BY u.name ASC`,
        [organizationId, user.id]
      );
      if (members && members.length > 0) {
        for (const mem of members) {
          const item = { id: mem.id, name: mem.name || mem.email, email: mem.email, role: mem.role };
          if (mem.role === 'student') directory.students.push(item);
          else if (mem.role === 'parent') directory.parents.push(item);
          else if (mem.role === 'principal') directory.principal.push(item);
          else if (mem.role === 'school_admin') directory.school_admin.push(item);
        }
      }
    } catch (error) { throw error; }

    // Load school broadcast announcements
    try {
      const broadcasts = await this.drizzle.query(
        `SELECT id, title, message, target_audience, priority, sender_name, created_at
         FROM school_broadcasts
         WHERE organization_id = $1
         ORDER BY created_at DESC LIMIT 5`,
        [organizationId]
      );
      if (broadcasts && broadcasts.length > 0) {
        announcements = broadcasts.map((b: any) => ({
          id: b.id,
          title: b.title,
          message: b.message,
          priority: b.priority || 'normal',
          sender: b.sender_name || 'School Administration',
          date: new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
      }
    } catch (error) { throw error; }

    return {
      messages: dbMessages,
      announcements,
      directory,
    };
  }

  async sendMessage(organizationId: string, user: User, dto: SendTeacherMessageDto) {
    const [recipient] = await this.drizzle.query(`SELECT user_id,role FROM memberships WHERE organization_id=$1 AND user_id=$2 AND status='active'`, [organizationId,dto.recipientId]);
    if (!recipient || recipient.role!==dto.recipientRole) throw new NotFoundException('Recipient not found in this school');
    if (dto.conversationId) {
      const [conversation] = await this.drizzle.query(`SELECT id FROM teacher_messages WHERE organization_id=$1 AND conversation_id=$2 AND ((sender_id=$3 AND recipient_id=$4) OR (sender_id=$4 AND recipient_id=$3)) LIMIT 1`, [organizationId,dto.conversationId,user.id,recipient.user_id]);
      if (!conversation) throw new NotFoundException('Conversation not found');
    }
    const [message] = await this.drizzle.query(
      `INSERT INTO teacher_messages (organization_id,conversation_id,sender_id,recipient_id,recipient_role,section_id,subject_id,subject_line,body,priority)
       VALUES ($1,COALESCE($2,gen_random_uuid()),$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [organizationId,dto.conversationId || null,user.id,recipient.user_id,recipient.role,dto.sectionId || null,dto.subjectId || null,dto.subjectLine,dto.body,dto.priority || 'normal']);
    await this.drizzle.query("SELECT pg_notify($1, $2)", ["edops_communication", JSON.stringify({ organizationId, userIds: [user.id, recipient.user_id], type: "message.created", conversationId: message.conversation_id, messageId: message.id })]);
    return { success:true,message:{ ...message,id:message.id,senderId:user.id,senderName:user.name || user.email,recipientId:recipient.user_id,otherPartyId:recipient.user_id,isOutgoing:true,subjectLine:message.subject_line,body:message.body,timestamp:message.created_at } };
  }
}
