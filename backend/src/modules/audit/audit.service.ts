import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { auditEvents } from '../../database/schema';

export class AuditEvent {
  id!: string;
  organizationId!: string | null;
  actorId!: string | null;
  action!: string;
  details!: Record<string, unknown>;
  createdAt!: Date;
}

export interface AuditEventData {
  id?: string;
  organizationId: string | null;
  actorId: string | null;
  action: string;
  details?: Record<string, unknown>;
  createdAt?: Date;
}

@Injectable()
export class AuditService {
  constructor(private readonly drizzle?: DrizzleService) {}

  async record(
    clientOrManager: any,
    event: { organizationId: string | null; actorId: string | null; action: string; details?: Record<string, unknown> }
  ) {
    if (clientOrManager && typeof clientOrManager.query === 'function') {
      const res = await clientOrManager.query(
        `INSERT INTO audit_events (organization_id, actor_id, action, details) VALUES ($1, $2, $3, $4) RETURNING *`,
        [event.organizationId, event.actorId, event.action, JSON.stringify(event.details ?? {})]
      );
      return res?.rows ? res.rows[0] : (Array.isArray(res) ? res[0] : res);
    }
    if (this.drizzle?.db) {
      const [inserted] = await this.drizzle.db.insert(auditEvents).values({
        organizationId: event.organizationId,
        actorId: event.actorId,
        action: event.action,
        details: event.details ?? {},
      }).returning();
      return inserted;
    }
    return event;
  }
}
