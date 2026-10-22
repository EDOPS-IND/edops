import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { AppConfig, InjectConfig } from '../config';
import * as schema from './schema';

export type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private readonly context = new AsyncLocalStorage<{ query:<R = any>(sql:string,params?:any[])=>Promise<R[]>;rawClient:pg.PoolClient }>();
  public readonly db: DrizzleDB;
  public readonly pool: pg.Pool;

  constructor(@InjectConfig() private readonly config: AppConfig) {
    const isPooler = config.databaseUrl.includes('-pooler');
    const dbOptions = isPooler || config.databaseSchema === 'public'
      ? undefined
      : `-c search_path=${config.databaseSchema} -c timezone=UTC`;

    this.pool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
      ...(dbOptions ? { options: dbOptions } : {}),
      max: Number(process.env.DB_POOL_MAX ?? 10),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });

    this.pool.on('error', (err) => {
      console.warn('Postgres pool idle connection notice:', err?.message);
    });

    this.db = drizzle(this.pool, { schema });
  }

  async onModuleInit() {
    try {
      await this.pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS phone varchar(32);`);
      await this.pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS specialty varchar(100);`);
      await this.pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS section_id uuid;`);
      await this.pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS child_student_ids jsonb;`);
      await this.pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS employee_id varchar(50);`);
      await this.pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS employment_type varchar(50);`);
      await this.pool.query(`ALTER TABLE invitations ADD COLUMN IF NOT EXISTS raw_token varchar(128);`);
      await this.pool.query(`ALTER TABLE memberships ADD COLUMN IF NOT EXISTS employee_id varchar(50);`);
      await this.pool.query(`ALTER TABLE memberships ADD COLUMN IF NOT EXISTS employment_type varchar(50);`);
      await this.pool.query(`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES school_departments(id) ON DELETE SET NULL;`);
      await this.pool.query(`ALTER TABLE school_departments ADD COLUMN IF NOT EXISTS location varchar(120);`);
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS parent_student_relationships (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          school_id uuid NOT NULL,
          parent_id uuid NOT NULL,
          student_id uuid NOT NULL,
          relationship varchar(50) DEFAULT 'Guardian',
          verification_status varchar(32) DEFAULT 'verified',
          status varchar(32) DEFAULT 'active',
          created_at timestamptz DEFAULT NOW(),
          CONSTRAINT uq_parent_student_rel UNIQUE (school_id, parent_id, student_id)
        );
      `);
      await this.pool.query(`
        ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_role_check;
        ALTER TABLE invitations ADD CONSTRAINT invitations_role_check CHECK (role IN ('school_admin', 'principal', 'teacher', 'student', 'staff', 'parent'));
      `);
      await this.pool.query(`
        ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_role_check;
        ALTER TABLE memberships ADD CONSTRAINT memberships_role_check CHECK (role IN ('school_admin', 'principal', 'teacher', 'student', 'staff', 'parent'));
      `);
      await this.pool.query(`
        UPDATE users u
        SET phone = o.official_phone
        FROM memberships m
        JOIN organizations o ON o.id = m.organization_id
        WHERE m.user_id = u.id AND (u.phone IS NULL OR u.phone = '') AND o.official_phone IS NOT NULL AND o.official_phone != '';
      `);
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash varchar(64) NOT NULL UNIQUE,
          expires_at timestamptz NOT NULL,
          used_at timestamptz,
          created_at timestamptz DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_lookup ON password_reset_tokens(token_hash);
      `);
      // Cleanup legacy session table: authentication is now fully stateless JWT
      await this.pool.query('DROP TABLE IF EXISTS sessions CASCADE;');
    } catch {
      // Non-blocking schema guard
    }
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const scoped = this.context.getStore();
    if (scoped) return scoped.query<T>(sql, params);
    const res = await this.pool.query(sql, params);
    return res.rows as T[];
  }

  async transaction<T>(callback: (client: { query: <R = any>(sql: string, params?: any[]) => Promise<R[]>; rawClient: pg.PoolClient }) => Promise<T>): Promise<T> {
    const scoped = this.context.getStore();
    if (scoped) return callback(scoped);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const wrapped = {
        rawClient: client,
        query: async <R = any>(sql: string, params?: any[]): Promise<R[]> => {
          const res = await client.query(sql, params);
          return res.rows as R[];
        },
      };
      const result = await callback(wrapped);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async forOrganization<T>(organizationId:string, work:()=>Promise<T>):Promise<T> {
    return this.transaction(async manager=>{
      await manager.query("SELECT set_config('app.current_org_id',$1,true)",[organizationId]);
      return this.context.run(manager,work);
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
