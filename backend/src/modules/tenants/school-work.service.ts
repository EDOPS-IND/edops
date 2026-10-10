import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { DrizzleService } from '../../database/drizzle.service';
import { Queryable } from '../billing/entitlements';
import { AppConfig, InjectConfig } from '../../config';
import { User } from '../auth/user.entity';
import { TenantsService } from './tenants.service';
import { Organization, SchoolRole } from './tenant.entity';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

@Injectable()
export class SchoolWork {
  private readonly encryptionKey: Buffer;
  constructor(private readonly drizzle: DrizzleService, private readonly tenants: TenantsService, @InjectConfig() config: AppConfig) {
    this.encryptionKey = Buffer.from(hkdfSync('sha256', config.sessionSecret, 'edops', 'idempotency-response-v1', 32));
  }

  private encrypt(value: unknown, context: string) {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, nonce);
    cipher.setAAD(Buffer.from(context));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString('base64');
  }

  private decrypt<T>(encoded: string, context: string): T {
    const bytes = Buffer.from(encoded, 'base64');
    const cipher = createDecipheriv('aes-256-gcm', this.encryptionKey, bytes.subarray(0, 12));
    cipher.setAAD(Buffer.from(context));
    cipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('utf8')) as T;
  }

  async run<T>(organizationId: string, actor: User, action: string | null, payload: unknown,
    key: string | undefined | null, work: (manager: Queryable) => Promise<T>,
    access?: { roles: readonly SchoolRole[]; authorize: (manager: Queryable) => Promise<void>; platform?: boolean; lockOrg?: boolean }): Promise<T> {
    if (key !== null && (!key || !isUUID(key))) throw new BadRequestException('Idempotency-Key must be a UUID for creation requests');
    if (key) key = key.toLowerCase();
    return this.drizzle.transaction(async (manager) => {
      // ponytail: serialize writes per school for pilot-sized rosters; narrow locks if measured throughput requires it.
      if (access?.platform) {
        const [admin] = await manager.query('SELECT id FROM users WHERE id = $1 AND is_active = true AND is_platform_admin = true LIMIT 1', [actor.id]);
        if (!admin) throw new ForbiddenException('Platform administrator access required');
      }
      const shouldLock = action !== null && access?.lockOrg !== false;
      let organization: any;
      if (access?.platform) {
        const lockClause = shouldLock ? ' FOR UPDATE' : '';
        const [org] = await manager.query(`SELECT * FROM organizations WHERE id = $1${lockClause} LIMIT 1`, [organizationId]);
        organization = org;
      } else {
        organization = await this.tenants.authorizedOrganization(manager, organizationId, actor, shouldLock, access?.roles);
      }
      if (!organization) throw new NotFoundException('Organization not found');
      organizationId = organization.id;
      await manager.query("SELECT set_config('app.current_org_id', $1, true)", [organizationId]);
      // Resource authorization must run even when returning a previously stored response.
      if (access) await access.authorize(manager);
      const context = `${organizationId}:${actor.id}:${key}`;
      const hash = createHash('sha256').update(JSON.stringify(canonical({ action, payload }))).digest('hex');
      if (key) {
        // Prune expired records probabilistically (1 in 20 writes) to avoid table bloat and lock contention on every write.
        if (Math.random() < 0.05) {
          await manager.query('DELETE FROM idempotency_records WHERE organization_id = $1 AND expires_at <= now()', [organizationId]);
        }
        const [previous] = await manager.query('SELECT request_hash, response_ciphertext FROM idempotency_records WHERE organization_id = $1 AND actor_id = $2 AND key = $3 AND expires_at > now()', [organizationId, actor.id, key]);
        if (previous) {
          if (previous.request_hash !== hash) throw new ConflictException('Idempotency-Key was already used with a different request');
          try { return this.decrypt<T>(previous.response_ciphertext, context); }
          catch { throw new ConflictException('Stored replay is unavailable; verify the previous outcome before creating another request'); }
        }
      }
      const result = await work(manager);
      if (key) await manager.query(`INSERT INTO idempotency_records
        (organization_id, actor_id, key, request_hash, response_ciphertext, expires_at)
        VALUES ($1, $2, $3, $4, $5, now() + interval '24 hours')
        ON CONFLICT (organization_id, actor_id, key) DO UPDATE SET
        request_hash = excluded.request_hash, response_ciphertext = excluded.response_ciphertext, expires_at = excluded.expires_at`,
      [organizationId, actor.id, key, hash, this.encrypt(result, context)]);
      return result;
    });
  }
}
