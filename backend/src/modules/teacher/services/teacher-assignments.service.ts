import { randomUUID } from 'node:crypto';
import { AssignmentsService } from '../../assignments/assignments.service';
import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';
import { CreateTeacherAssignmentDto, GradeSubmissionDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherAssignmentsService {
  constructor(private readonly drizzle: DrizzleService,private readonly assignmentsService:AssignmentsService) {}

  async getAssignments(organizationId: string, user: User) {
    try {
      const rows = await this.drizzle.query(
        `SELECT a.id, a.title, a.description, a.status,
                to_char(a.due_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as due_at,
                a.max_score,
                coalesce(sec.name, 'Class') as section_name,
                coalesce(sub.name, 'Subject') as subject_name,
                (SELECT COUNT(*)::int FROM enrollments e WHERE e.organization_id = a.organization_id AND e.section_id = a.section_id AND e.status = 'active') as total_students,
                (SELECT COUNT(*)::int FROM submissions s WHERE s.organization_id = a.organization_id AND s.assignment_id = a.id AND s.status IN ('submitted', 'late', 'graded')) as submitted_count,
                (SELECT COUNT(*)::int FROM submissions s WHERE s.organization_id = a.organization_id AND s.assignment_id = a.id AND s.status = 'graded') as evaluated_count
         FROM assignments a
         LEFT JOIN sections sec ON sec.id = a.section_id AND sec.organization_id = a.organization_id
         LEFT JOIN subjects sub ON sub.id = a.subject_id AND sub.organization_id = a.organization_id
         WHERE a.organization_id = $1 AND a.created_by=$2
         ORDER BY a.created_at DESC`,
        [organizationId,user.id]
      );

      if (rows && rows.length > 0) {
        const assignments = rows.map((r: any) => {
          const total = Number(r.total_students || 0);
          const submitted = Number(r.submitted_count || 0);
          const evaluated = Number(r.evaluated_count || 0);
          return {
            id: r.id,
            title: r.title,
            description: r.description,
            sectionName: r.section_name ? (r.section_name.startsWith('Class ') ? r.section_name : `Class ${r.section_name}`) : 'General',
            subjectName: r.subject_name || 'Subject',
            dueAt: r.due_at ? r.due_at.split('T')[0] : '',
            maxScore: Number(r.max_score || 0),
            status: r.status,
            submittedCount: submitted,
            totalStudents: total,
            evaluatedCount: evaluated,
            pendingEvaluation: Math.max(0, submitted - evaluated),
          };
        });
        return { assignments };
      }
    } catch (error) { throw error; }

    return { assignments: [] };
  }

  async getSubmissionsQueue(organizationId: string, user: User, assignmentId?: string) {
    try {
      const rows = await this.drizzle.query(
        `SELECT s.id, s.assignment_id, s.status, s.content, s.score, s.feedback,
                to_char(coalesce(s.submitted_at, s.created_at), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as submitted_at,
                a.title as assignment_title,
                a.max_score,
                coalesce(u.name, 'Student') as student_name,
                coalesce(e.roll_number, '01') as roll_number,
                coalesce(sec.name, 'Class 10-A') as class_section
         FROM submissions s
         JOIN assignments a ON a.id = s.assignment_id AND a.organization_id = s.organization_id
         JOIN users u ON u.id = s.student_id
         LEFT JOIN enrollments e ON e.organization_id = s.organization_id AND e.student_user_id = s.student_id AND e.section_id = a.section_id
         LEFT JOIN sections sec ON sec.id = a.section_id AND sec.organization_id = a.organization_id
         WHERE s.organization_id = $1 AND a.created_by=$2 AND s.status IN ('submitted', 'late')
         ORDER BY s.submitted_at DESC NULLS LAST LIMIT 20`,
        [organizationId,user.id]
      );

      if (rows && rows.length > 0) {
        const pendingQueue = rows.map((r: any) => ({
          id: r.id,
          studentName: r.student_name,
          rollNumber: r.roll_number,
          classSection: r.class_section.startsWith('Class ') ? r.class_section : `Class ${r.class_section}`,
          assignmentTitle: r.assignment_title,
          submittedAt: r.submitted_at ? r.submitted_at.split('T')[0] : '',
          status: r.status,
          content: r.content || '',
          maxScore: Number(r.max_score || 0),
          score: r.score != null ? Number(r.score) : null,
          feedback: r.feedback,
        }));
        return { pendingQueue };
      }
    } catch (error) { throw error; }

    return { pendingQueue: [] };
  }

  async createAssignment(organizationId: string, user: User, dto: CreateTeacherAssignmentDto) {
    const assignment=await this.assignmentsService.create(organizationId,user,{sectionId:dto.sectionId,subjectId:dto.subjectId,title:dto.title,description:dto.description || '',dueAt:dto.dueAt,maxScore:dto.maxScore},randomUUID());
    const published=await this.assignmentsService.publish(organizationId,user,assignment.id,randomUUID());
    return { success:true,assignment:published };
  }

  async gradeSubmission(organizationId: string, user: User, submissionId: string, dto: GradeSubmissionDto) {
    const submission=await this.assignmentsService.grade(organizationId,user,submissionId,{score:dto.score,feedback:dto.feedback});
    return { success:true,submissionId:submission.id,score:submission.score };
  }
}
