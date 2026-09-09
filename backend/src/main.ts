import { createApp } from './app';
import { loadConfig } from './config';

async function main() {
  const config = loadConfig();
  const app = await createApp(config);
  app.enableShutdownHooks();
  try {
    await app.listen(config.port, config.host);
  } catch (error) {
    await app.close();
    throw error;
  }
  console.log(`EDOPS API: http://${config.host}:${config.port}/api/health`);
  if (config.environment !== 'production') console.log(`Swagger: http://${config.host}:${config.port}/api/docs`);
}

main().catch(() => {
  console.error('Backend startup failed. Check environment settings and database availability.');
  process.exitCode = 1;
});
