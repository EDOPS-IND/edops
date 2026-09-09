export const APP_CONFIG = Symbol('APP_CONFIG');

export interface AppConfig {
  environment: 'development' | 'test' | 'production';
  host: string;
  port: number;
  databaseUrl: string;
  databaseSchema: string;
  databaseSsl: boolean;
  sessionSecret: string;
  cookieName: string;
  sessionMaxAge: number;
  corsOrigins: string[];
  trustProxy: false | string[];
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const environment = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(environment)) throw new Error('Invalid NODE_ENV');
  const port = Number(env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  try {
    const url = new URL(env.DATABASE_URL ?? '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.pathname.length < 2) throw new Error();
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL with a database name');
  }
  const databaseSchema = env.DATABASE_SCHEMA ?? 'public';
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(databaseSchema)) throw new Error('Invalid DATABASE_SCHEMA');
  const sessionSecret = env.SESSION_SECRET ?? '';
  if (sessionSecret.length < 32 || /change.?me|replace.?me/i.test(sessionSecret)) {
    throw new Error('SESSION_SECRET must be a randomly generated secret of at least 32 characters');
  }
  const corsOrigins = (env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!corsOrigins.length) throw new Error('CORS_ORIGINS must list exact trusted origins');
  for (const origin of corsOrigins) {
    try {
      const url = new URL(origin);
      if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) throw new Error();
      if (environment === 'production' && url.protocol !== 'https:') throw new Error();
    } catch {
      throw new Error('CORS_ORIGINS must contain exact HTTP origins (HTTPS in production)');
    }
  }
  if (env.DATABASE_SSL && !['true', 'false'].includes(env.DATABASE_SSL)) throw new Error('Invalid DATABASE_SSL');
  const trustProxy = env.TRUST_PROXY?.trim() ? env.TRUST_PROXY.split(',').map((value) => value.trim()) : undefined;
  if (trustProxy?.some((value) => !value || ['true', 'false', '*'].includes(value) || /^\d+$/.test(value))) {
    throw new Error('TRUST_PROXY must list trusted proxy IPs or CIDRs, not a boolean or hop count');
  }
  return {
    environment: environment as AppConfig['environment'],
    host: env.HOST ?? '127.0.0.1',
    port,
    databaseUrl: env.DATABASE_URL!,
    databaseSchema,
    databaseSsl: env.DATABASE_SSL === 'true',
    sessionSecret,
    cookieName: environment === 'production' ? '__Host-edops_session' : 'edops_session',
    sessionMaxAge: 8 * 60 * 60 * 1000,
    corsOrigins,
    trustProxy: trustProxy ?? false,
  };
}
