import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { AppConfig, InjectConfig } from '../config';
import * as schema from './schema';

export type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  public readonly db: DrizzleDB;
  public readonly pool: pg.Pool;

  constructor(@InjectConfig() private readonly config: AppConfig) {
    this.pool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });

    this.db = drizzle(this.pool, { schema });
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const res = await this.pool.query(sql, params);
    return res.rows as T[];
  }

  async transaction<T>(callback: (client: { query: <R = any>(sql: string, params?: any[]) => Promise<R[]>; rawClient: pg.PoolClient }) => Promise<T>): Promise<T> {
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

  async onModuleDestroy() {
    await this.pool.end();
  }
}
