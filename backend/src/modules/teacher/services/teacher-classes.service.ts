import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';

@Injectable()
export class TeacherClassesService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getMyClasses(organizationId: string, user: User) {
    const classes = await this.drizzle.query(
      `SELECT c.section_id AS "sectionId", c.subject_id AS "subjectId", sec.name AS "className", sub.name AS "subjectName", sub.code AS "subjectCode",
        (SELECT COUNT(*)::int FROM enrollments e WHERE e.organization_id=c.organization_id AND e.section_id=c.section_id AND e.status='active') AS "studentCount",
        (SELECT ROUND(AVG(100.0*s.score/NULLIF(a.max_score,0))::numeric, 0)::int FROM assignments a JOIN submissions s ON s.organization_id=a.organization_id AND s.assignment_id=a.id WHERE a.organization_id=c.organization_id AND a.section_id=c.section_id AND a.subject_id=c.subject_id AND s.status='graded') AS "subjectAverage",
        (SELECT ROUND(100.0*COUNT(*) FILTER (WHERE r.status IN ('present','late'))/NULLIF(COUNT(*),0)::numeric, 0)::int FROM attendance_records r JOIN attendance_sessions ats ON ats.id=r.attendance_session_id AND ats.organization_id=r.organization_id WHERE r.organization_id=c.organization_id AND ats.section_id=c.section_id AND ats.status='finalized') AS "attendanceRate"
       FROM class_subject_assignments c 
       JOIN sections sec ON sec.id=c.section_id AND sec.organization_id=c.organization_id
       JOIN subjects sub ON sub.id=c.subject_id AND sub.organization_id=c.organization_id
       WHERE c.organization_id=$1 AND c.teacher_user_id=$2 
       ORDER BY sec.name, sub.name`, 
      [organizationId, user.id]
    );
    return { 
      classes: classes.map((c: any) => ({
        ...c,
        subjectAverage: c.subjectAverage == null ? null : Number(c.subjectAverage),
        attendanceRate: c.attendanceRate == null ? null : Number(c.attendanceRate),
      })) 
    };
  }

  async getClassDetails(organizationId: string, user: User, sectionId: string) {
    const data = await this.getMyClasses(organizationId, user);
    const selected = data.classes.find((c: any) => c.sectionId === sectionId);
    if (!selected) throw new NotFoundException('Assigned class not found');

    const [stats] = await this.drizzle.query(
      `SELECT 
        (SELECT ROUND(AVG(100.0*s.score/NULLIF(a.max_score,0))::numeric, 0)::int FROM assignments a JOIN submissions s ON s.organization_id=a.organization_id AND s.assignment_id=a.id WHERE a.organization_id=$1 AND a.section_id=$2 AND a.subject_id=$3 AND s.status='graded') as "subjectAverage",
        (SELECT ROUND(MAX(100.0*s.score/NULLIF(a.max_score,0))::numeric, 0)::int FROM assignments a JOIN submissions s ON s.organization_id=a.organization_id AND s.assignment_id=a.id WHERE a.organization_id=$1 AND a.section_id=$2 AND a.subject_id=$3 AND s.status='graded') as "highestScore",
        (SELECT ROUND(MIN(100.0*s.score/NULLIF(a.max_score,0))::numeric, 0)::int FROM assignments a JOIN submissions s ON s.organization_id=a.organization_id AND s.assignment_id=a.id WHERE a.organization_id=$1 AND a.section_id=$2 AND a.subject_id=$3 AND s.status='graded') as "lowestScore",
        (SELECT ROUND(100.0*COUNT(*) FILTER (WHERE 100.0*s.score/NULLIF(a.max_score,0) >= 40)/NULLIF(COUNT(*),0)::numeric, 0)::int FROM assignments a JOIN submissions s ON s.organization_id=a.organization_id AND s.assignment_id=a.id WHERE a.organization_id=$1 AND a.section_id=$2 AND a.subject_id=$3 AND s.status='graded') as "passRate",
        (SELECT ROUND(100.0*COUNT(*) FILTER (WHERE r.status IN ('present','late'))/NULLIF(COUNT(*),0)::numeric, 0)::int FROM attendance_records r JOIN attendance_sessions ats ON ats.id=r.attendance_session_id AND ats.organization_id=r.organization_id WHERE r.organization_id=$1 AND ats.section_id=$2 AND ats.status='finalized') as "attendanceRate"`,
      [organizationId, sectionId, selected.subjectId]
    );

    const students = await this.drizzle.query(
      `SELECT u.id, u.name, u.email, e.roll_number AS "rollNumber",
        (SELECT ROUND(AVG(100.0*s.score/NULLIF(a.max_score,0))::numeric, 0)::int FROM assignments a JOIN submissions s ON s.organization_id=a.organization_id AND s.assignment_id=a.id WHERE a.organization_id=e.organization_id AND a.section_id=e.section_id AND a.subject_id=$3 AND s.student_id=u.id AND s.status='graded') as "subjectAverage",
        (SELECT ROUND(100.0*COUNT(*) FILTER (WHERE r.status IN ('present','late'))/NULLIF(COUNT(*),0)::numeric, 0)::int FROM attendance_records r JOIN attendance_sessions ats ON ats.id=r.attendance_session_id AND ats.organization_id=r.organization_id WHERE r.organization_id=e.organization_id AND ats.section_id=e.section_id AND r.student_id=u.id AND ats.status='finalized') as "attendance"
       FROM enrollments e 
       JOIN users u ON u.id=e.student_user_id 
       WHERE e.organization_id=$1 AND e.section_id=$2 AND e.status='active' 
       ORDER BY e.roll_number`, 
      [organizationId, sectionId, selected.subjectId]
    );

    const chapters = await this.drizzle.query(
      `SELECT n.id, n.chapter_name AS name, n.status, n.actual_completion_percentage AS "completionPct" 
       FROM principal_curriculum_nodes n 
       JOIN sections sec ON sec.organization_id=n.organization_id AND sec.id=$3 
       WHERE n.organization_id=$1 AND n.subject_id=$2 
       AND (n.grade=sec.name OR n.grade=(SELECT p.name FROM programs p WHERE p.id=sec.program_id) OR n.grade=(SELECT REPLACE(p.name, 'Class ', '') FROM programs p WHERE p.id=sec.program_id)) 
       AND n.academic_year_id=sec.academic_year_id 
       ORDER BY n.created_at`, 
      [organizationId, selected.subjectId, sectionId]
    );

    const enrichedStudents = students.map((s: any) => {
      const avg = s.subjectAverage != null ? Number(s.subjectAverage) : null;
      const att = s.attendance != null ? Number(s.attendance) : null;
      const status = (att != null && att < 75) || (avg != null && avg < 40)
        ? 'needs_attention'
        : (avg != null && avg >= 85)
        ? 'high_proficiency'
        : 'on_track';
      return {
        ...s,
        attendance: att,
        subjectAverage: avg,
        status,
      };
    });

    return { 
      overview: {
        ...selected,
        sectionName: selected.className,
        subjectAverage: stats?.subjectAverage != null ? Number(stats.subjectAverage) : null,
        highestScore: stats?.highestScore != null ? Number(stats.highestScore) : null,
        lowestScore: stats?.lowestScore != null ? Number(stats.lowestScore) : null,
        medianScore: stats?.subjectAverage != null ? Number(stats.subjectAverage) : null,
        passRate: stats?.passRate != null ? Number(stats.passRate) : null,
        attendance: stats?.attendanceRate != null ? Number(stats.attendanceRate) : null,
      },
      students: enrichedStudents,
      chapters 
    };
  }
}
