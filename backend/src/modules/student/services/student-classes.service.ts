import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentClassesService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getClassDetails(organizationId: string, studentUserId: string) {
    const [enrollment] = await this.drizzle.query(
      `SELECT e.section_id, sec.name AS "className", y.name AS "academicYear", e.roll_number AS "rollNumber"
       FROM enrollments e JOIN sections sec ON sec.id=e.section_id AND sec.organization_id=e.organization_id
       JOIN academic_years y ON y.id=e.academic_year_id AND y.organization_id=e.organization_id AND y.is_current
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
    return { classInfo: { ...enrollment, classTeacher: null, roomNumber: null, studentCount: classmates.length, subjectsCount: count.total }, classmates, announcements };
  }
}
