import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { User } from '../auth/user.entity';
import { SchoolRole } from '../tenants/tenant.entity';
import { TeachingAccess } from '../assignments/teaching-access.service';
import { AssignmentQuery } from '../assignments/teaching.dto';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../notifications/outbox.service';
import { Recording, recordingView } from './recording.entity';
import { CompleteRecordingDto, CreateRecordingDto, UpdateRecordingDto } from './recording.dto';
import { StorageService } from './storage.service';
import { Queryable } from '../billing/entitlements';

@Injectable()
export class RecordingsService {
  constructor(private readonly access: TeachingAccess, private readonly audit: AuditService, private readonly storage: StorageService, private readonly outbox: OutboxService) {}

  private async authorized(manager: Queryable, org: string, actor: User, role: SchoolRole, id: string, staff = false) {
    const [row] = await manager.query(
      `SELECT id, organization_id AS "organizationId", section_id AS "sectionId", subject_id AS "subjectId",
              uploaded_by AS "uploadedBy", title, recorded_at AS "recordedAt", duration_seconds AS "durationSeconds",
              content_type AS "contentType", size_bytes AS "sizeBytes", checksum_sha256 AS "checksumSha256",
              object_key AS "objectKey", object_version AS "objectVersion", status, published_at AS "publishedAt",
              created_at AS "createdAt"
       FROM recorded_sessions
       WHERE organization_id = $1 AND id = $2 LIMIT 1`,
      [org, id]
    );
    if (!row) throw new NotFoundException('Recording not found');
    await this.access.classScope(manager, org, actor, role, row.sectionId, row.subjectId, staff);
    if (role === 'student' && row.status !== 'published') throw new NotFoundException('Recording not found');
    return row;
  }

  list(org: string, actor: User, query: AssignmentQuery) {
    return this.access.forFeature('recordings')(org, actor, null, null, null,
      (manager, role) => this.access.classScope(manager, org, actor, role, query.sectionId, query.subjectId), async (manager, role) => {
        const params: any[] = [org, query.sectionId, query.subjectId];
        let studentFilter = '';
        if (role === 'student') {
          studentFilter = " AND status = 'published'";
        }
        const where = `organization_id = $1 AND section_id = $2 AND subject_id = $3${studentFilter}`;
        const [countRes] = await manager.query(`SELECT count(*)::int AS total FROM recorded_sessions WHERE ${where}`, params);
        const items = await manager.query(
          `SELECT id, organization_id AS "organizationId", section_id AS "sectionId", subject_id AS "subjectId",
                  uploaded_by AS "uploadedBy", title, recorded_at AS "recordedAt", duration_seconds AS "durationSeconds",
                  content_type AS "contentType", size_bytes AS "sizeBytes", status, published_at AS "publishedAt",
                  created_at AS "createdAt"
           FROM recorded_sessions
           WHERE ${where} ORDER BY recorded_at DESC, id DESC LIMIT $4 OFFSET $5`,
          [...params, query.limit, query.offset]
        );
        return { items: items.map(recordingView), total: countRes.total, limit: query.limit, offset: query.offset };
      });
  }

  create(org: string, actor: User, dto: CreateRecordingDto, key?: string) {
    return this.access.forFeature('recordings')(org, actor, 'recording.created', dto, key,
      (manager, role) => this.access.classScope(manager, org, actor, role, dto.sectionId, dto.subjectId, true), async (manager) => {
        if (new Date(dto.recordedAt).getTime() > Date.now()) throw new BadRequestException('recordedAt cannot be in the future');
        const id = randomUUID();
        const objectKey = `${org.toLowerCase()}/recordings/${id}.${dto.contentType === 'video/mp4' ? 'mp4' : 'webm'}`;
        const [row] = await manager.query(
          `INSERT INTO recorded_sessions (id, organization_id, section_id, subject_id, uploaded_by, title,
            recorded_at, duration_seconds, content_type, size_bytes, checksum_sha256, object_key, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'uploading') RETURNING *`,
          [id, org, dto.sectionId, dto.subjectId, actor.id, dto.title, new Date(dto.recordedAt),
           dto.durationSeconds, dto.contentType, dto.sizeBytes, dto.checksumSha256, objectKey]
        );
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.created', details: { recordingId: id } });
        return recordingView(row);
      });
  }

  get(org: string, actor: User, id: string) {
    let row: any;
    return this.access.forFeature('recordings')(org, actor, null, null, null, async (manager, role) => { row = await this.authorized(manager, org, actor, role, id); }, async () => recordingView(row));
  }

  update(org: string, actor: User, id: string, dto: UpdateRecordingDto) {
    let row: any;
    return this.access.forFeature('recordings')(org, actor, 'recording.updated', { id, ...dto }, null,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (!['uploading','ready'].includes(row.status)) throw new ConflictException('Only unpublished recordings can be edited');
        const fields = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
        if (!Object.keys(fields).length) throw new BadRequestException('Provide at least one field');
        if (dto.recordedAt && new Date(dto.recordedAt).getTime() > Date.now()) throw new BadRequestException('recordedAt cannot be in the future');
        const setClauses: string[] = [];
        const params: any[] = [org, id];
        let idx = 3;
        if (fields.title !== undefined) { setClauses.push(`title = $${idx++}`); params.push(fields.title); }
        if (fields.recordedAt !== undefined) { setClauses.push(`recorded_at = $${idx++}`); params.push(new Date(fields.recordedAt)); }
        if (fields.durationSeconds !== undefined) { setClauses.push(`duration_seconds = $${idx++}`); params.push(fields.durationSeconds); }
        const [updated] = await manager.query(
          `UPDATE recorded_sessions SET ${setClauses.join(', ')} WHERE organization_id = $1 AND id = $2 RETURNING *`,
          params
        );
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.updated', details: { recordingId: id, fields: Object.keys(fields) } });
        return recordingView(updated);
      });
  }

  upload(org: string, actor: User, id: string) {
    let row: any;
    return this.access.forFeature('recordings')(org, actor, 'recording.upload_authorized', { id }, null,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (row.status !== 'uploading') throw new ConflictException('Recording is not awaiting upload');
        const result = await this.storage.upload(row);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.upload_authorized', details: { recordingId: id } });
        return result;
      });
  }

  complete(org: string, actor: User, id: string, dto: CompleteRecordingDto, key?: string) {
    let row: any;
    return this.access.forFeature('recordings')(org, actor, 'recording.completed', { id, ...dto }, key,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (row.status !== 'uploading') throw new ConflictException('Recording is not awaiting upload');
        await this.storage.verify(row, dto.versionId);
        const [updated] = await manager.query(
          "UPDATE recorded_sessions SET object_version = $1, status = 'ready' WHERE organization_id = $2 AND id = $3 RETURNING *",
          [dto.versionId, org, id]
        );
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.completed', details: { recordingId: id } });
        return recordingView(updated);
      });
  }

  publish(org: string, actor: User, id: string, key?: string) {
    let row: any;
    return this.access.forFeature('recordings')(org, actor, 'recording.published', { id }, key,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (row.status !== 'ready') throw new ConflictException('Complete a valid upload before publication');
        const [updated] = await manager.query(
          "UPDATE recorded_sessions SET status = 'published', published_at = now() WHERE organization_id = $1 AND id = $2 RETURNING *",
          [org, id]
        );
        const secId = row.section_id || row.sectionId;
        const subjId = row.subject_id || row.subjectId;
        await this.outbox.append(manager, org, actor.id, 'recording.published', id, secId, subjId);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.published', details: { recordingId: id } });
        return recordingView(updated);
      });
  }

  archive(org: string, actor: User, id: string) {
    let row: any;
    return this.access.forFeature('recordings')(org, actor, 'recording.archived', { id }, null,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (row.status === 'archived') return recordingView(row);
        const [updated] = await manager.query(
          "UPDATE recorded_sessions SET status = 'archived' WHERE organization_id = $1 AND id = $2 RETURNING *",
          [org, id]
        );
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.archived', details: { recordingId: id } });
        return recordingView(updated);
      });
  }

  playback(org: string, actor: User, id: string) {
    let row: any;
    return this.access.forFeature('recordings')(org, actor, null, null, null,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id); }, async () => {
        const status = row.status;
        const version = row.object_version || row.objectVersion;
        if (!['ready','published'].includes(status) || !version) throw new ConflictException('Recording is not available for playback');
        return this.storage.playback(row, version);
      });
  }
}
