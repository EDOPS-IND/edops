import { DrizzleService } from '../../../database/drizzle.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../auth/user.entity';

@Injectable()
export class TeacherClassesService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getMyClasses(organizationId: string, user: User) {
    const classes = await this.drizzle.query(
      `SELECT c.section_id AS "sectionId", c.subject_id AS "subjectId",
              COALESCE(prog.name || ' - ', '') || sec.name AS "className",
              sub.name AS "subjectName", sub.code AS "subjectCode",
        (SELECT COUNT(*)::int FROM enrollments e WHERE e.organization_id=c.organization_id AND e.section_id=c.section_id AND e.status='active') AS "studentCount",
        (SELECT ROUND(AVG(100.0*s.score/NULLIF(a.max_score,0))::numeric, 0)::int FROM assignments a JOIN submissions s ON s.organization_id=a.organization_id AND s.assignment_id=a.id WHERE a.organization_id=c.organization_id AND a.section_id=c.section_id AND a.subject_id=c.subject_id AND s.status='graded') AS "subjectAverage",
        (SELECT ROUND(100.0*COUNT(*) FILTER (WHERE r.status IN ('present','late'))/NULLIF(COUNT(*),0)::numeric, 0)::int FROM attendance_records r JOIN attendance_sessions ats ON ats.id=r.attendance_session_id AND ats.organization_id=r.organization_id WHERE r.organization_id=c.organization_id AND ats.section_id=c.section_id AND ats.status='finalized') AS "attendanceRate"
       FROM class_subject_assignments c 
       JOIN sections sec ON sec.id=c.section_id AND sec.organization_id=c.organization_id
       LEFT JOIN programs prog ON prog.id=sec.program_id
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

  async getLectureLogs(organizationId: string, user: User) {
    const lectures = await this.drizzle.query(
      `SELECT id, topic, subject_name AS "subjectName", class_section AS "classSection",
              teacher_name AS "teacherName", to_char(planned_date, 'YYYY-MM-DD') AS "date",
              activities AS "periodInfo",
              resources, homework, reflection AS notes, status, created_at AS "createdAt"
       FROM principal_lesson_plans
       WHERE organization_id = $1 AND teacher_user_id = $2
       ORDER BY planned_date DESC, created_at DESC LIMIT 100`,
      [organizationId, user.id],
    );
    return { lectures };
  }

  async logLecture(organizationId: string, user: User, dto: any) {
    if (!dto.topic?.trim() || !dto.classSection?.trim() || !dto.subjectName?.trim()) {
      throw new BadRequestException('Class, Subject, and Lecture Topic are required');
    }

    // Verify this class and subject are assigned to this teacher
    const isAssigned = await this.drizzle.query(
      `SELECT 1 FROM class_subject_assignments c
       JOIN sections sec ON sec.id = c.section_id AND sec.organization_id = c.organization_id
       JOIN subjects sub ON sub.id = c.subject_id AND sub.organization_id = c.organization_id
       LEFT JOIN programs prog ON prog.id = sec.program_id
       WHERE c.organization_id = $1 AND c.teacher_user_id = $2
         AND (
           COALESCE(prog.name || ' - ', '') || sec.name = $3
           OR sec.name = $3
           OR $3 LIKE '%' || sec.name
         )
         AND LOWER(sub.name) = LOWER($4)
       UNION
       SELECT 1 FROM timetable_entries t
       JOIN sections sec ON sec.id = t.section_id AND sec.organization_id = t.organization_id
       JOIN subjects sub ON sub.id = t.subject_id AND sub.organization_id = t.organization_id
       LEFT JOIN programs prog ON prog.id = sec.program_id
       LEFT JOIN principal_timetable_substitutions ps ON ps.organization_id = t.organization_id
         AND ps.timetable_entry_id = t.id AND ps.event_date = $5::date
       WHERE t.organization_id = $1
         AND COALESCE(ps.substitute_teacher_user_id, t.teacher_user_id) = $2
         AND (
           COALESCE(prog.name || ' - ', '') || sec.name = $3
           OR sec.name = $3
           OR $3 LIKE '%' || sec.name
         )
         AND LOWER(sub.name) = LOWER($4)
       LIMIT 1`,
      [organizationId, user.id, dto.classSection, dto.subjectName, dto.date || new Date().toISOString().slice(0, 10)],
    );

    if (!isAssigned || isAssigned.length === 0) {
      throw new BadRequestException(`You are not assigned to teach ${dto.subjectName} for ${dto.classSection}`);
    }

    const [row] = await this.drizzle.query(
      `INSERT INTO principal_lesson_plans (
        organization_id, teacher_user_id, teacher_name, class_section, subject_name,
        topic, planned_date, activities, resources, homework, reflection, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10, $11, 'Completed')
      RETURNING id, topic, subject_name AS "subjectName", class_section AS "classSection",
                teacher_name AS "teacherName", to_char(planned_date, 'YYYY-MM-DD') AS "date",
                activities AS "periodInfo",
                resources, homework, reflection AS notes, status, created_at AS "createdAt"`,
      [
        organizationId,
        user.id,
        user.name || user.email || 'Teacher',
        dto.classSection,
        dto.subjectName,
        dto.topic,
        dto.date || new Date().toISOString().slice(0, 10),
        dto.periodInfo || '',
        dto.resources || '',
        dto.homework || '',
        dto.notes || '',
      ],
    );
    return { success: true, lecture: row };
  }
}
