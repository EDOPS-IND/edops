import path from 'node:path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate as migrateDrizzle } from 'drizzle-orm/node-postgres/migrator';
import { loadConfig } from '../config';
import { createDataSource } from './data-source';

async function main() {
  const source = createDataSource(loadConfig());
  await source.initialize();
  try {
    // TypeORM is retained only to finish the historical migration chain.
    const appliedLegacy = await source.runMigrations();
    const config = loadConfig();
    const pool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
      max: 1,
    });
    try {
      await migrateDrizzle(drizzle(pool), {
        migrationsFolder: path.resolve(__dirname, '../../drizzle'),
      });
      const columns = await pool.query<{ column_name: string }>(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = $1
           AND table_name = 'teacher_messages'
           AND column_name IN ('conversation_id', 'status')`,
        [config.databaseSchema],
      );
      const found = new Set(columns.rows.map((row) => row.column_name));
      if (!found.has('conversation_id') || !found.has('status')) {
        throw new Error(`Drizzle migration verification failed in schema ${config.databaseSchema}`);
      }
    } finally {
      await pool.end();
    }
    console.log(`Applied ${appliedLegacy.length} legacy migration(s); Drizzle schema verified.`);
  } finally {
    await source.destroy();
  }
}

main().catch(() => {
  console.error('Migration failed. Verify database connectivity, permissions and the migration schema.');
  process.exitCode = 1;
});
