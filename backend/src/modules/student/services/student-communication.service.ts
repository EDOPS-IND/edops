import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { SendStudentMessageDto } from '../dto/student.dto';

@Injectable()
export class StudentCommunicationService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getMessages(organizationId: string, studentUserId: string) {
    const rows = await this.drizzle.query(
      `SELECT tm.*,su.name AS sender_name,ru.name AS recipient_name FROM teacher_messages tm
       JOIN users su ON su.id=tm.sender_id JOIN users ru ON ru.id=tm.recipient_id
       WHERE tm.organization_id=$1 AND (tm.recipient_id=$2 OR tm.sender_id=$2) ORDER BY tm.created_at DESC`, [organizationId,studentUserId]);
    const messages = rows.map(m => ({ id:m.id,senderId:m.sender_id,senderName:m.sender_name,recipientId:m.recipient_id,recipientName:m.recipient_name,
      otherPartyId:m.sender_id===studentUserId?m.recipient_id:m.sender_id,otherPartyName:m.sender_id===studentUserId?m.recipient_name:m.sender_name,
      isOutgoing:m.sender_id===studentUserId,subjectLine:m.subject_line,body:m.body,timestamp:m.created_at,createdAt:m.created_at,isRead:m.is_read,priority:m.priority }));
    const teachersList = await this.drizzle.query(
      `SELECT DISTINCT u.id,u.name,s.name AS subject FROM enrollments e
       JOIN class_subject_assignments c ON c.organization_id=e.organization_id AND c.section_id=e.section_id
       JOIN users u ON u.id=c.teacher_user_id JOIN subjects s ON s.id=c.subject_id AND s.organization_id=c.organization_id
       WHERE e.organization_id=$1 AND e.student_user_id=$2 AND e.status='active' ORDER BY u.name`, [organizationId,studentUserId]);
    const announcements = await this.drizzle.query(
      `SELECT id,title,message AS details,created_at AS date FROM school_broadcasts WHERE organization_id=$1 AND target_audience IN ('all','students') ORDER BY created_at DESC`, [organizationId]);
    return { messages, teachersList, announcements };
  }

  async sendMessage(organizationId: string, studentUserId: string, dto: SendStudentMessageDto) {
    const [recipient] = await this.drizzle.query(
      `SELECT user_id FROM memberships WHERE organization_id=$1 AND user_id=$2 AND role='teacher' AND status='active'`, [organizationId,dto.recipientId]);
    if (!recipient) throw new NotFoundException('Teacher not found in this school');
    const [message] = await this.drizzle.query(
      `INSERT INTO teacher_messages (organization_id,sender_id,recipient_id,recipient_role,subject_line,body,priority)
       VALUES ($1,$2,$3,'teacher',$4,$5,$6) RETURNING *`, [organizationId,studentUserId,dto.recipientId,dto.subjectLine,dto.body,dto.priority || 'normal']);
    return { success:true, messageId:message.id, message };
  }
}
