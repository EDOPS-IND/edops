import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EntityManager } from 'typeorm';
import { User } from '../auth/user.entity';
import { SchoolRole } from '../tenants/tenant.entity';
import { TeachingAccess } from '../assignments/teaching-access.service';
import { AssignmentQuery } from '../assignments/teaching.dto';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../notifications/outbox.service';
import { Recording, recordingView } from './recording.entity';
import { CompleteRecordingDto, CreateRecordingDto, UpdateRecordingDto } from './recording.dto';
import { StorageService } from './storage.service';

@Injectable()
export class RecordingsService {
  constructor(private readonly access: TeachingAccess, private readonly audit: AuditService, private readonly storage: StorageService, private readonly outbox: OutboxService) {}

  private async authorized(manager: EntityManager, org: string, actor: User, role: SchoolRole, id: string, staff = false) {
    const row = await manager.getRepository(Recording).createQueryBuilder('r').addSelect(['r.objectKey','r.objectVersion','r.checksumSha256'])
      .where('r.organization_id=:org AND r.id=:id', { org, id }).getOne();
    if (!row) throw new NotFoundException('Recording not found');
    await this.access.classScope(manager, org, actor, role, row.sectionId, row.subjectId, staff);
    if (role === 'student' && row.status !== 'published') throw new NotFoundException('Recording not found');
    return row;
  }

  list(org: string, actor: User, query: AssignmentQuery) {
    return this.access.forFeature('recordings')(org, actor, null, null, null,
      (manager, role) => this.access.classScope(manager, org, actor, role, query.sectionId, query.subjectId), async (manager, role) => {
        const [items, total] = await manager.getRepository(Recording).findAndCount({ where: { organizationId: org, sectionId: query.sectionId, subjectId: query.subjectId,
          ...(role === 'student' ? { status: 'published' } : {}) }, order: { recordedAt: 'DESC', id: 'DESC' }, take: query.limit, skip: query.offset });
        return { items: items.map(recordingView), total, limit: query.limit, offset: query.offset };
      });
  }

  create(org: string, actor: User, dto: CreateRecordingDto, key?: string) {
    return this.access.forFeature('recordings')(org, actor, 'recording.created', dto, key,
      (manager, role) => this.access.classScope(manager, org, actor, role, dto.sectionId, dto.subjectId, true), async (manager) => {
        if (new Date(dto.recordedAt).getTime() > Date.now()) throw new BadRequestException('recordedAt cannot be in the future');
        const id = randomUUID();
        const row = await manager.getRepository(Recording).save({ ...dto, recordedAt: new Date(dto.recordedAt), id, organizationId: org, uploadedBy: actor.id,
          objectKey: `${org.toLowerCase()}/recordings/${id}.${dto.contentType === 'video/mp4' ? 'mp4' : 'webm'}` });
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.created', details: { recordingId: id } });
        return recordingView(row);
      });
  }

  get(org: string, actor: User, id: string) {
    let row: Recording;
    return this.access.forFeature('recordings')(org, actor, null, null, null, async (manager, role) => { row = await this.authorized(manager, org, actor, role, id); }, async () => recordingView(row));
  }

  update(org: string, actor: User, id: string, dto: UpdateRecordingDto) {
    let row: Recording;
    return this.access.forFeature('recordings')(org, actor, 'recording.updated', { id, ...dto }, null,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (!['uploading','ready'].includes(row.status)) throw new ConflictException('Only unpublished recordings can be edited');
        const fields = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
        if (!Object.keys(fields).length) throw new BadRequestException('Provide at least one field');
        if (dto.recordedAt && new Date(dto.recordedAt).getTime() > Date.now()) throw new BadRequestException('recordedAt cannot be in the future');
        const updated = await manager.getRepository(Recording).save({ ...row, ...fields, recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : row.recordedAt });
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.updated', details: { recordingId: id, fields: Object.keys(fields) } });
        return recordingView(updated);
      });
  }

  upload(org: string, actor: User, id: string) {
    let row: Recording;
    return this.access.forFeature('recordings')(org, actor, 'recording.upload_authorized', { id }, null,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (row.status !== 'uploading') throw new ConflictException('Recording is not awaiting upload');
        const result = await this.storage.upload(row);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.upload_authorized', details: { recordingId: id } });
        return result;
      });
  }

  complete(org: string, actor: User, id: string, dto: CompleteRecordingDto, key?: string) {
    let row: Recording;
    return this.access.forFeature('recordings')(org, actor, 'recording.completed', { id, ...dto }, key,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (row.status !== 'uploading') throw new ConflictException('Recording is not awaiting upload');
        await this.storage.verify(row, dto.versionId);
        const updated = await manager.getRepository(Recording).save({ ...row, objectVersion: dto.versionId, status: 'ready' });
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.completed', details: { recordingId: id } });
        return recordingView(updated);
      });
  }

  publish(org: string, actor: User, id: string, key?: string) {
    let row: Recording;
    return this.access.forFeature('recordings')(org, actor, 'recording.published', { id }, key,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (row.status !== 'ready') throw new ConflictException('Complete a valid upload before publication');
        const updated = await manager.getRepository(Recording).save({ ...row, status: 'published', publishedAt: new Date() });
        await this.outbox.append(manager, org, actor.id, 'recording.published', id, row.sectionId, row.subjectId);
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.published', details: { recordingId: id } });
        return recordingView(updated);
      });
  }

  archive(org: string, actor: User, id: string) {
    let row: Recording;
    return this.access.forFeature('recordings')(org, actor, 'recording.archived', { id }, null,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id, true); }, async (manager) => {
        if (row.status === 'archived') return recordingView(row);
        const updated = await manager.getRepository(Recording).save({ ...row, status: 'archived' });
        await this.audit.record(manager, { organizationId: org, actorId: actor.id, action: 'recording.archived', details: { recordingId: id } });
        return recordingView(updated);
      });
  }

  playback(org: string, actor: User, id: string) {
    let row: Recording;
    return this.access.forFeature('recordings')(org, actor, null, null, null,
      async (manager, role) => { row = await this.authorized(manager, org, actor, role, id); }, async () => {
        if (!['ready','published'].includes(row.status) || !row.objectVersion) throw new ConflictException('Recording is not available for playback');
        return this.storage.playback(row, row.objectVersion);
      });
  }
}
