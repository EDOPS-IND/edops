import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ToggleBookmarkDto, UpdateLectureProgressDto } from '../dto/student.dto';

@Injectable()
export class StudentResourcesService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getResources(organizationId: string, studentUserId: string) {
    const studyMaterials = await this.drizzle.query(
      `SELECT t.id,t.title,t.chapter,t.topic,t.file_type AS type,t.file_url AS "fileUrl",t.created_at AS date,
        u.name AS "uploadedBy",s.name AS subject,
        EXISTS (SELECT 1 FROM student_bookmarks b WHERE b.organization_id=t.organization_id AND b.student_user_id=$2 AND b.resource_id=t.id::text AND b.resource_type='study_material') AS "isBookmarked"
       FROM teacher_study_materials t JOIN subjects s ON s.id=t.subject_id AND s.organization_id=t.organization_id
       JOIN users u ON u.id=t.teacher_user_id
       WHERE t.organization_id=$1 AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=t.organization_id AND e.section_id=t.section_id AND e.student_user_id=$2 AND e.status='active')
       ORDER BY t.created_at DESC`, [organizationId, studentUserId]);
    const recordedLectures = await this.drizzle.query(
      `SELECT r.id,r.title,r.duration_seconds AS "durationSeconds",r.recorded_at AS "recordedDate",s.name AS subject,u.name AS teacher,
        COALESCE(p.last_position_seconds,0) AS "lastPositionSeconds",COALESCE(p.watched_pct,0) AS "watchedPct",COALESCE(p.is_completed,false) AS "isCompleted"
       FROM recorded_sessions r JOIN subjects s ON s.id=r.subject_id AND s.organization_id=r.organization_id
       JOIN users u ON u.id=r.uploaded_by
       LEFT JOIN student_lecture_progress p ON p.organization_id=r.organization_id AND p.recording_id=r.id AND p.student_user_id=$2
       WHERE r.organization_id=$1 AND r.status='published' AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=r.organization_id AND e.section_id=r.section_id AND e.student_user_id=$2 AND e.status='active')
       ORDER BY r.recorded_at DESC`, [organizationId, studentUserId]);
    const bookmarks = await this.drizzle.query(
      `SELECT id,resource_id AS "resourceId",resource_type AS "resourceType",title,subject_name AS subject,url
       FROM student_bookmarks WHERE organization_id=$1 AND student_user_id=$2 ORDER BY created_at DESC`, [organizationId, studentUserId]);
    return { studyMaterials, recordedLectures, bookmarks };
  }

  async updateLectureProgress(organizationId: string, studentUserId: string, recordingId: string, dto: UpdateLectureProgressDto) {
    const [recording] = await this.drizzle.query(
      `SELECT r.id FROM recorded_sessions r WHERE r.organization_id=$1 AND r.id=$3 AND r.status='published'
       AND EXISTS (SELECT 1 FROM enrollments e WHERE e.organization_id=r.organization_id AND e.section_id=r.section_id AND e.student_user_id=$2 AND e.status='active')`, [organizationId,studentUserId,recordingId]);
    if (!recording) throw new NotFoundException('Recording not found');
    const [progress] = await this.drizzle.query(
      `INSERT INTO student_lecture_progress (organization_id,student_user_id,recording_id,last_position_seconds,watched_pct,is_completed)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (organization_id,student_user_id,recording_id) DO UPDATE
       SET last_position_seconds=EXCLUDED.last_position_seconds,watched_pct=EXCLUDED.watched_pct,is_completed=EXCLUDED.is_completed,updated_at=now()
       RETURNING recording_id AS "recordingId",last_position_seconds AS "lastPositionSeconds",watched_pct AS "watchedPct",is_completed AS "isCompleted"`,
      [organizationId,studentUserId,recordingId,dto.lastPositionSeconds,dto.watchedPct,dto.isCompleted]);
    return { success: true, ...progress };
  }

  async toggleBookmark(organizationId: string, studentUserId: string, dto: ToggleBookmarkDto) {
    return this.drizzle.transaction(async m => {
      await m.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [JSON.stringify([organizationId,studentUserId,dto.resourceType,dto.resourceId])]);
      const removed = await m.query(
        `DELETE FROM student_bookmarks WHERE organization_id=$1 AND student_user_id=$2 AND resource_type=$3 AND resource_id=$4 RETURNING id`,
        [organizationId,studentUserId,dto.resourceType,dto.resourceId]);
      if (removed.length) return { success: true, isBookmarked: false };
      const [bookmark] = await m.query(
        `INSERT INTO student_bookmarks (organization_id,student_user_id,resource_id,resource_type,title,subject_name,url)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [organizationId,studentUserId,dto.resourceId,dto.resourceType,dto.title,dto.subjectName || null,dto.url]);
      return { success: true, isBookmarked: true, bookmark };
    });
  }
}
