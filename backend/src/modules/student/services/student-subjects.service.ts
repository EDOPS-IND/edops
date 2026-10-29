import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentSubjectsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getSubjects(organizationId: string, studentUserId: string) {
    const subjects = await this.drizzle.query(
      `SELECT sub.id, sub.name, sub.code, COALESCE(u.name, 'Unassigned') AS teacher, COALESCE(u.email, '') AS "teacherEmail",
        (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE ar.status IN ('present','late')) / NULLIF(COUNT(*),0),1)
         FROM attendance_records ar JOIN attendance_sessions ats ON ats.id=ar.attendance_session_id AND ats.organization_id=ar.organization_id
         WHERE ar.organization_id=$1 AND ar.student_id=$2 AND ats.subject_id=sub.id AND ats.status='finalized') AS attendance,
        (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE ss.status IN ('submitted','late','graded')) / NULLIF(COUNT(*),0),1)
         FROM submissions ss JOIN assignments a ON a.id=ss.assignment_id AND a.organization_id=ss.organization_id
         WHERE ss.organization_id=$1 AND ss.student_id=$2 AND a.subject_id=sub.id AND a.status='published') AS "assignmentsCompleted",
        (SELECT ROUND(AVG(100.0 * ss.score / NULLIF(a.max_score,0))::numeric,1)
         FROM submissions ss JOIN assignments a ON a.id=ss.assignment_id AND a.organization_id=ss.organization_id
         WHERE ss.organization_id=$1 AND ss.student_id=$2 AND a.subject_id=sub.id AND ss.status='graded') AS "assessmentAverage",
        (SELECT ROUND(AVG(n.actual_completion_percentage),1) FROM principal_curriculum_nodes n
         WHERE n.organization_id=$1 AND n.subject_id=sub.id AND n.academic_year_id=e.academic_year_id AND (n.grade=sec.name OR n.grade=(SELECT p.name FROM programs p WHERE p.id=sec.program_id) OR n.grade=(SELECT REPLACE(p.name, 'Class ', '') FROM programs p WHERE p.id=sec.program_id))) AS "curriculumProgress"
       FROM enrollments e
       LEFT JOIN academic_years y ON y.id=e.academic_year_id AND y.organization_id=e.organization_id
       JOIN sections sec ON sec.id=e.section_id AND sec.organization_id=e.organization_id
       JOIN class_subject_assignments c ON c.organization_id=e.organization_id AND c.section_id=e.section_id
       JOIN subjects sub ON sub.id=c.subject_id AND sub.organization_id=c.organization_id
       LEFT JOIN users u ON u.id=c.teacher_user_id
       WHERE e.organization_id=$1 AND e.student_user_id=$2 AND e.status='active'
       ORDER BY sub.name`, [organizationId, studentUserId]);
    return { subjects: subjects.map(s => ({ ...s,
      attendance: s.attendance == null ? null : Number(s.attendance),
      assignmentsCompleted: s.assignmentsCompleted == null ? null : Number(s.assignmentsCompleted),
      assessmentAverage: s.assessmentAverage == null ? null : Number(s.assessmentAverage),
      curriculumProgress: s.curriculumProgress == null ? null : Number(s.curriculumProgress),
    })) };
  }
}
