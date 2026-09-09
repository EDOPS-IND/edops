import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { APP_CONFIG, AppConfig } from '../../config';
import { User } from '../auth/user.entity';
import { TenantsService } from './tenants.service';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

@Injectable()
export class SchoolWork {
  private readonly encryptionKey: Buffer;
  constructor(private readonly source: DataSource, private readonly tenants: TenantsService, @Inject(APP_CONFIG) config: AppConfig) {
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
    key: string | undefined | null, work: (manager: EntityManager) => Promise<T>): Promise<T> {
    if (key !== null && (!key || !isUUID(key))) throw new BadRequestException('Idempotency-Key must be a UUID for creation requests');
    if (key) key = key.toLowerCase();
    return this.source.transaction(async (manager) => {
      // ponytail: serialize writes per school for pilot-sized rosters; narrow locks if measured throughput requires it.
      const organization = await this.tenants.authorizedOrganization(manager, organizationId, actor, action !== null);
      organizationId = organization.id;
      await manager.query("SELECT set_config('app.current_org_id', $1, true)", [organizationId]);
      const context = `${organizationId}:${actor.id}:${key}`;
      const hash = createHash('sha256').update(JSON.stringify(canonical({ action, payload }))).digest('hex');
      if (key) {
        await manager.query('DELETE FROM idempotency_records WHERE organization_id = $1 AND expires_at <= now()', [organizationId]);
        const [previous] = await manager.query('SELECT request_hash, response_ciphertext FROM idempotency_records WHERE organization_id = $1 AND actor_id = $2 AND key = $3', [organizationId, actor.id, key]);
        if (previous) {
          if (previous.request_hash !== hash) throw new ConflictException('Idempotency-Key was already used with a different request');
          try { return this.decrypt<T>(previous.response_ciphertext, context); }
          catch { throw new ConflictException('Stored replay is unavailable; verify the previous outcome before creating another request'); }
        }
      }
      const result = await work(manager);
      if (key) await manager.query(`INSERT INTO idempotency_records
        (organization_id, actor_id, key, request_hash, response_ciphertext, expires_at)
        VALUES ($1, $2, $3, $4, $5, now() + interval '24 hours')`,
      [organizationId, actor.id, key, hash, this.encrypt(result, context)]);
      return result;
    });
  }
}
