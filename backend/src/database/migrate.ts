import { loadConfig } from '../config';
import { createDataSource } from './data-source';

async function main() {
  const source = createDataSource(loadConfig());
  await source.initialize();
  try {
    const applied = await source.runMigrations();
    console.log(`Applied ${applied.length} migration(s).`);
  } finally {
    await source.destroy();
  }
}

main().catch(() => {
  console.error('Migration failed. Verify database connectivity, permissions and the migration schema.');
  process.exitCode = 1;
});
