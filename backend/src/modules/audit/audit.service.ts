import { Injectable } from '@nestjs/common';
import { Column, CreateDateColumn, Entity, EntityManager, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'organization_id', type: 'uuid', nullable: true }) organizationId!: string | null;
  @Column({ name: 'actor_id', type: 'uuid', nullable: true }) actorId!: string | null;
  @Column({ type: 'varchar', length: 80 }) action!: string;
  @Column({ type: 'jsonb', default: {} }) details!: Record<string, unknown>;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
}

@Injectable()
export class AuditService {
  record(manager: EntityManager, event: Pick<AuditEvent, 'organizationId' | 'actorId' | 'action'> & { details?: Record<string, unknown> }) {
    const repository = manager.getRepository(AuditEvent);
    return repository.save(repository.create({ ...event, details: event.details ?? {} }));
  }
}
