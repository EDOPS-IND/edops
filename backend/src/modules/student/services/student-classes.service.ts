import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentClassesService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getClassDetails(organizationId: string, studentUserId: string) {
    const [enrollment] = await this.drizzle.query(
      `SELECT e.section_id, sec.name AS "className", y.name AS "academicYear", e.roll_number AS "rollNumber",
        COALESCE(ctu.name, 'Unassigned') AS "classTeacher"
       FROM enrollments e JOIN sections sec ON sec.id=e.section_id AND sec.organization_id=e.organization_id
       LEFT JOIN users ctu ON ctu.id=sec.class_teacher_user_id
       LEFT JOIN academic_years y ON y.id=e.academic_year_id AND y.organization_id=e.organization_id
       WHERE e.organization_id=$1 AND e.student_user_id=$2 AND e.status='active' LIMIT 1`, [organizationId, studentUserId]);
    if (!enrollment) return { classInfo: null, classmates: [], announcements: [] };
    const classmates = await this.drizzle.query(
      `SELECT u.id, u.name, e.roll_number AS "rollNumber", e.status, u.id=$3 AS "isSelf"
       FROM enrollments e JOIN users u ON u.id=e.student_user_id
       WHERE e.organization_id=$1 AND e.section_id=$2 AND e.status='active' ORDER BY e.roll_number`, [organizationId, enrollment.section_id, studentUserId]);
    const [count] = await this.drizzle.query(
      `SELECT COUNT(DISTINCT subject_id)::int AS total FROM class_subject_assignments WHERE organization_id=$1 AND section_id=$2`, [organizationId, enrollment.section_id]);
    const announcements = await this.drizzle.query(
      `SELECT id,title,sender_name AS author,created_at AS date,message AS content FROM school_broadcasts
       WHERE organization_id=$1 AND target_audience IN ('all','students') ORDER BY created_at DESC LIMIT 20`, [organizationId]);
    return { classInfo: { ...enrollment, classTeacher: enrollment.classTeacher, roomNumber: null, studentCount: classmates.length, subjectsCount: count.total }, classmates, announcements };
  }

  async getStudentLectures(organizationId: string, studentUserId: string) {
    const [enrollment] = await this.drizzle.query(
      `SELECT e.section_id, COALESCE(prog.name || ' - ', '') || sec.name AS "classSection", sec.name AS "sectionName"
       FROM enrollments e
       JOIN sections sec ON sec.id = e.section_id AND sec.organization_id = e.organization_id
       LEFT JOIN programs prog ON prog.id = sec.program_id
       WHERE e.organization_id = $1 AND e.student_user_id = $2 AND e.status = 'active'
       LIMIT 1`,
      [organizationId, studentUserId],
    );
    if (!enrollment) return { lectures: [] };

    const lectures = await this.drizzle.query(
      `SELECT id, topic, subject_name AS "subjectName", class_section AS "classSection",
              teacher_name AS "teacherName", to_char(planned_date, 'YYYY-MM-DD') AS "date",
              activities AS "periodInfo",
              resources, homework, reflection AS notes, status, created_at AS "createdAt"
       FROM principal_lesson_plans
       WHERE organization_id = $1
         AND (
           class_section = $2
           OR class_section = $3
           OR class_section LIKE '%' || $3
         )
       ORDER BY planned_date DESC, created_at DESC LIMIT 50`,
      [organizationId, enrollment.classSection, enrollment.sectionName],
    );
    return { lectures };
  }
}
