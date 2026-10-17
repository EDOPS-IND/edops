import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { SubmitAssignmentDto } from '../dto/student.dto';
import { AssignmentsService } from '../../assignments/assignments.service';
import { User } from '../../auth/user.entity';

@Injectable()
export class StudentAssignmentsService {
  constructor(private readonly drizzle: DrizzleService, private readonly assignmentsService: AssignmentsService) {}

  async getAssignments(organizationId: string, studentUserId: string, statusFilter?: string) {
    const assignments = await this.drizzle.query(
      `SELECT a.id,a.title,a.description,a.description AS instructions,a.max_score AS "maxMarks",a.due_at AS "dueDate",
        sub.name AS subject,u.name AS teacher,COALESCE(s.status,'pending') AS status,s.submitted_at AS "submittedAt",s.score,s.feedback
       FROM assignments a JOIN subjects sub ON sub.id=a.subject_id AND sub.organization_id=a.organization_id
       JOIN users u ON u.id=a.created_by LEFT JOIN submissions s ON s.assignment_id=a.id AND s.organization_id=a.organization_id AND s.student_id=$2
       WHERE a.organization_id=$1 AND a.status='published' AND EXISTS (
         SELECT 1 FROM enrollments e WHERE e.organization_id=a.organization_id AND e.section_id=a.section_id AND e.student_user_id=$2 AND e.status='active')
       ORDER BY a.created_at DESC`, [organizationId,studentUserId]);
    const submitted = assignments.filter(a => ['submitted','late','graded'].includes(a.status)).length;
    const filter = statusFilter === 'evaluated' ? 'graded' : statusFilter;
    return { assignments: filter && filter !== 'all' ? assignments.filter(a => a.status===filter) : assignments,
      summary: { totalAssigned:assignments.length, submitted, pending:assignments.filter(a=>a.status==='pending').length,
        late:assignments.filter(a=>a.status==='late').length, completionPct:assignments.length?Math.round(100*submitted/assignments.length):0,subjectWise:[] } };
  }

  async submitAssignment(organizationId: string, studentUserId: string, assignmentId: string, dto: SubmitAssignmentDto) {
    const submission = await this.assignmentsService.submit(organizationId, { id:studentUserId } as User, assignmentId, { content:dto.content });
    return { success:true, submission };
  }
}
