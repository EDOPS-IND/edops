import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../auth/user.entity';
import { CreateStudyMaterialDto, RecordLessonDeliveryDto } from '../dto/teacher.dto';

@Injectable()
export class TeacherLearningService {
  constructor(private readonly dataSource: DataSource) {}

  async getLearningHub(organizationId: string, user: User) {
    let materials: any[] = [];
    let deliveries: any[] = [];
    try {
      const matRows = await this.dataSource.query(
        `SELECT tsm.id, tsm.title, tsm.chapter, tsm.topic, tsm.file_type, tsm.file_url,
                to_char(tsm.created_at, 'YYYY-MM-DD') as created_at,
                coalesce(sec.name, 'Class 10-A') as section_name
         FROM teacher_study_materials tsm
         LEFT JOIN sections sec ON sec.id = tsm.section_id AND sec.organization_id = tsm.organization_id
         WHERE tsm.organization_id = $1
         ORDER BY tsm.created_at DESC LIMIT 20`,
        [organizationId]
      );
      if (matRows && matRows.length > 0) {
        materials = matRows.map((m: any) => ({
          id: m.id,
          title: m.title,
          chapter: m.chapter,
          topic: m.topic,
          classSection: m.section_name.startsWith('Class ') ? m.section_name : `Class ${m.section_name}`,
          fileType: m.file_type,
          fileUrl: m.file_url,
          createdAt: m.created_at,
        }));
      }
    } catch {
      materials = [];
    }

    try {
      const delRows = await this.dataSource.query(
        `SELECT tld.id, to_char(tld.delivery_date, 'YYYY-MM-DD') as delivery_date,
                tld.period_number, tld.topics_covered, tld.participation_pct,
                tld.homework_assigned, tld.reflection,
                coalesce(sec.name, 'Class 10-A') as section_name,
                coalesce(sub.name, 'Mathematics') as subject_name
         FROM teacher_lesson_deliveries tld
         LEFT JOIN sections sec ON sec.id = tld.section_id AND sec.organization_id = tld.organization_id
         LEFT JOIN subjects sub ON sub.id = tld.subject_id AND sub.organization_id = tld.organization_id
         WHERE tld.organization_id = $1
         ORDER BY tld.delivery_date DESC, tld.period_number DESC LIMIT 15`,
        [organizationId]
      );
      if (delRows && delRows.length > 0) {
        deliveries = delRows.map((d: any) => ({
          id: d.id,
          classSection: d.section_name.startsWith('Class ') ? d.section_name : `Class ${d.section_name}`,
          subject: d.subject_name,
          deliveryDate: d.delivery_date,
          periodNumber: Number(d.period_number),
          topicsCovered: d.topics_covered,
          participationPct: Number(d.participation_pct || 90),
          homeworkAssigned: d.homework_assigned,
          reflection: d.reflection,
        }));
      }
    } catch {
      deliveries = [];
    }

    return {
      lessonPlans: [],
      studyMaterials: materials,
      recentDeliveries: deliveries,
    };
  }

  async recordDelivery(organizationId: string, user: User, dto: RecordLessonDeliveryDto) {
    let resolvedSectionId = dto.sectionId;
    let resolvedSubjectId = dto.subjectId;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.sectionId);
      if (!isUuid) {
        const cleanName = dto.sectionId.replace(/^sec-/, '').replace('-', ' ');
        const [sec] = await this.dataSource.query(
          `SELECT id FROM sections WHERE organization_id = $1 AND (name ILIKE $2 OR name ILIKE $3) LIMIT 1`,
          [organizationId, `%${cleanName}%`, dto.sectionId]
        );
        if (sec?.id) resolvedSectionId = sec.id;
        else {
          const [firstSec] = await this.dataSource.query(
            `SELECT id FROM sections WHERE organization_id = $1 LIMIT 1`,
            [organizationId]
          );
          if (firstSec?.id) resolvedSectionId = firstSec.id;
        }
      }
    } catch {}

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.subjectId);
      if (!isUuid) {
        const [sub] = await this.dataSource.query(
          `SELECT id FROM subjects WHERE organization_id = $1 LIMIT 1`,
          [organizationId]
        );
        if (sub?.id) resolvedSubjectId = sub.id;
      }
    } catch {}

    let teacherId = user.id;
    try {
      const [m] = await this.dataSource.query(
        `SELECT user_id FROM memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1`,
        [organizationId, user.id]
      );
      if (!m) {
        const [anyMember] = await this.dataSource.query(
          `SELECT user_id FROM memberships WHERE organization_id = $1 LIMIT 1`,
          [organizationId]
        );
        if (anyMember?.user_id) teacherId = anyMember.user_id;
      }
    } catch {}

    const [inserted] = await this.dataSource.query(
      `INSERT INTO teacher_lesson_deliveries (
        organization_id, lesson_plan_id, teacher_user_id, section_id, subject_id,
        delivery_date, period_number, topics_covered, participation_pct, homework_assigned, reflection, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'conducted')
      RETURNING *`,
      [
        organizationId,
        null,
        teacherId,
        resolvedSectionId,
        resolvedSubjectId,
        dto.deliveryDate,
        dto.periodNumber,
        dto.topicsCovered,
        dto.participationPct,
        dto.homeworkAssigned || null,
        dto.reflection || null,
      ]
    );

    return {
      success: true,
      delivery: inserted,
      message: 'Lesson delivery and reflection recorded in curriculum logs.',
    };
  }

  async uploadStudyMaterial(organizationId: string, user: User, dto: CreateStudyMaterialDto) {
    let resolvedSectionId = dto.sectionId;
    let resolvedSubjectId = dto.subjectId;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.sectionId);
      if (!isUuid) {
        const cleanName = dto.sectionId.replace(/^sec-/, '').replace('-', ' ');
        const [sec] = await this.dataSource.query(
          `SELECT id FROM sections WHERE organization_id = $1 AND (name ILIKE $2 OR name ILIKE $3) LIMIT 1`,
          [organizationId, `%${cleanName}%`, dto.sectionId]
        );
        if (sec?.id) resolvedSectionId = sec.id;
        else {
          const [firstSec] = await this.dataSource.query(
            `SELECT id FROM sections WHERE organization_id = $1 LIMIT 1`,
            [organizationId]
          );
          if (firstSec?.id) resolvedSectionId = firstSec.id;
        }
      }
    } catch {}

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.subjectId);
      if (!isUuid) {
        const [sub] = await this.dataSource.query(
          `SELECT id FROM subjects WHERE organization_id = $1 LIMIT 1`,
          [organizationId]
        );
        if (sub?.id) resolvedSubjectId = sub.id;
      }
    } catch {}

    let teacherId = user.id;
    try {
      const [m] = await this.dataSource.query(
        `SELECT user_id FROM memberships WHERE organization_id = $1 AND user_id = $2 LIMIT 1`,
        [organizationId, user.id]
      );
      if (!m) {
        const [anyMember] = await this.dataSource.query(
          `SELECT user_id FROM memberships WHERE organization_id = $1 LIMIT 1`,
          [organizationId]
        );
        if (anyMember?.user_id) teacherId = anyMember.user_id;
      }
    } catch {}

    const [inserted] = await this.dataSource.query(
      `INSERT INTO teacher_study_materials (
        organization_id, teacher_user_id, section_id, subject_id, unit, chapter, topic, title, description, file_type, file_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        organizationId,
        teacherId,
        resolvedSectionId,
        resolvedSubjectId,
        dto.unit || null,
        dto.chapter,
        dto.topic,
        dto.title,
        dto.description || null,
        dto.fileType,
        dto.fileUrl,
      ]
    );

    return {
      success: true,
      material: inserted,
      message: 'Study material uploaded and shared with students.',
    };
  }
}
