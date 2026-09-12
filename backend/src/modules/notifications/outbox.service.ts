import { Injectable, Module } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

export type EventType = 'assignment.published' | 'submission.graded' | 'attendance.finalized' | 'recording.published';

@Injectable()
export class OutboxService {
  constructor(private readonly source: DataSource) {}

  async append(manager: EntityManager, org: string, actorId: string, type: EventType, resourceId: string, sectionId: string, subjectId: string | null) {
    const [event] = await manager.query(`INSERT INTO domain_events (organization_id,section_id,subject_id,actor_id,event_type,resource_id)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [org, sectionId, subjectId, actorId, type, resourceId]);
    const audience = {
      'assignment.published': 'SELECT student_id AS user_id FROM submissions WHERE organization_id=$1 AND assignment_id=$3',
      'submission.graded': 'SELECT student_id AS user_id FROM submissions WHERE organization_id=$1 AND id=$3',
      'attendance.finalized': 'SELECT student_id AS user_id FROM attendance_records WHERE organization_id=$1 AND attendance_session_id=$3',
      'recording.published': `SELECT e.student_user_id AS user_id FROM enrollments e JOIN recorded_sessions r ON r.organization_id=e.organization_id AND r.section_id=e.section_id
        WHERE e.organization_id=$1 AND r.id=$3 AND e.status='active'`,
    }[type];
    await manager.query(`INSERT INTO event_recipients (organization_id,event_id,user_id)
      SELECT $1,$2,a.user_id FROM (${audience}) a JOIN memberships m ON m.organization_id=$1 AND m.user_id=a.user_id
      JOIN users u ON u.id=a.user_id WHERE m.role='student' AND m.status='active' AND u.is_active ON CONFLICT DO NOTHING`, [org, event.id, resourceId]);
  }

  async drain(org: string, limit = 50) {
    let processed = 0, failed = 0;
    for (let i = 0; i < limit; i++) {
      const outcome = await this.source.transaction(async (manager) => {
        // No organization write privileges needed; suspension stops new claims, not an already running projection.
        const [school] = await manager.query("SELECT id FROM organizations WHERE id=$1 AND status='active'", [org]);
        if (!school) return 'empty';
        await manager.query("SELECT set_config('app.current_org_id',$1,true)", [org]);
        const [event] = await manager.query(`SELECT id,attempts FROM domain_events WHERE organization_id=$1 AND processed_at IS NULL
          AND failed_at IS NULL AND available_at <= now() ORDER BY occurred_at,id FOR UPDATE SKIP LOCKED LIMIT 1`, [org]);
        if (!event) return 'empty';
        await manager.query('SAVEPOINT project_event');
        try {
          await manager.query('INSERT INTO timeline_events (organization_id,event_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [org, event.id]);
          await manager.query(`INSERT INTO notifications (organization_id,event_id,user_id)
            SELECT r.organization_id,r.event_id,r.user_id FROM event_recipients r
            JOIN memberships m ON m.organization_id=r.organization_id AND m.user_id=r.user_id JOIN users u ON u.id=r.user_id
            WHERE r.organization_id=$1 AND r.event_id=$2 AND m.status='active' AND m.role='student' AND u.is_active ON CONFLICT DO NOTHING`, [org, event.id]);
          await manager.query('UPDATE domain_events SET processed_at=clock_timestamp(),last_error=NULL WHERE organization_id=$1 AND id=$2', [org, event.id]);
          await manager.query('RELEASE SAVEPOINT project_event');
          return 'processed';
        } catch {
          await manager.query('ROLLBACK TO SAVEPOINT project_event');
          await manager.query(`UPDATE domain_events SET attempts=attempts+1,last_error='projection_failed',
            available_at=clock_timestamp()+($3::int*interval '1 second'),
            failed_at=CASE WHEN attempts+1>=5 THEN clock_timestamp() ELSE NULL END WHERE organization_id=$1 AND id=$2`, [org, event.id, Math.min(3600, 2 ** (event.attempts + 1))]);
          return 'failed';
        }
      });
      if (outcome === 'empty') break;
      if (outcome === 'processed') processed++; else failed++;
    }
    return { processed, failed };
  }

  async retryFailed(org: string) {
    return this.source.transaction(async (manager) => {
      await manager.query("SELECT set_config('app.current_org_id',$1,true)", [org]);
      const [row] = await manager.query(`WITH reset AS (UPDATE domain_events SET attempts=0,failed_at=NULL,last_error=NULL,available_at=now()
        WHERE organization_id=$1 AND failed_at IS NOT NULL AND processed_at IS NULL RETURNING id) SELECT count(*)::int AS count FROM reset`, [org]);
      return row.count as number;
    });
  }
}

@Module({ providers: [OutboxService], exports: [OutboxService] })
export class OutboxModule {}
