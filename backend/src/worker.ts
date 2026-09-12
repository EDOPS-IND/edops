import { setTimeout } from 'node:timers/promises';
import { isUUID } from 'class-validator';
import { loadConfig } from './config';
import { createDataSource } from './database/data-source';
import { OutboxService } from './modules/notifications/outbox.service';

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 2 || (args.length && !['--once', '--retry-failed'].includes(args[0])) ||
    (args[0] === '--retry-failed' ? !isUUID(args[1] ?? '') : args.length > 1)) throw new Error('Usage: worker [--once | --retry-failed ORGANIZATION_UUID]');
  const config = loadConfig();
  const source = createDataSource(config);
  await source.initialize();
  let stopping = false;
  const stop = () => { stopping = true; };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  try {
    const [role] = await source.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user');
    if (config.environment === 'production' && (role.rolsuper || role.rolbypassrls)) throw new Error('Production worker requires a non-superuser, non-BYPASSRLS database role');
    const outbox = new OutboxService(source);
    if (args[0] === '--retry-failed') {
      console.log(JSON.stringify({ reset: await outbox.retryFailed(args[1]) }));
      return;
    }
    do {
      let cursor = '00000000-0000-0000-0000-000000000000';
      let processed = 0, failed = 0;
      while (!stopping) {
        // ponytail: bounded tenant sweep with a PostgreSQL queue; dedicated dispatch if tenant count makes polling costly.
        const schools = await source.query("SELECT id FROM organizations WHERE status='active' AND id>$1 ORDER BY id LIMIT 100", [cursor]);
        if (!schools.length) break;
        for (const school of schools) {
          if (stopping) break;
          const count = await outbox.drain(school.id);
          processed += count.processed; failed += count.failed;
        }
        cursor = schools[schools.length - 1].id;
      }
      if (processed || failed || args[0] === '--once') console.log(JSON.stringify({ processed, failed }));
      if (failed && args[0] === '--once') process.exitCode = 1;
      if (!stopping && args[0] !== '--once') await setTimeout(1000);
    } while (!stopping && args[0] !== '--once');
  } finally {
    process.off('SIGINT', stop); process.off('SIGTERM', stop);
    await source.destroy();
  }
}
main().catch(() => { console.error('Worker failed; verify database availability, migrations and runtime permissions'); process.exitCode = 1; });
