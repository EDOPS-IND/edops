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
  storage?: { bucket: string; region: string; endpoint?: string; accessKeyId?: string; secretAccessKey?: string };
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
  let storage: AppConfig['storage'];
  if (env.S3_BUCKET) {
    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(env.S3_BUCKET) || !env.S3_REGION) throw new Error('S3_BUCKET and S3_REGION must identify a private versioned bucket');
    if (Boolean(env.S3_ACCESS_KEY_ID) !== Boolean(env.S3_SECRET_ACCESS_KEY)) throw new Error('Supply both S3 credentials or use the default AWS credential chain');
    if (env.S3_ENDPOINT) {
      const endpoint = new URL(env.S3_ENDPOINT);
      if (endpoint.origin !== env.S3_ENDPOINT || endpoint.username || endpoint.password ||
        (endpoint.protocol !== 'https:' && !(environment !== 'production' && endpoint.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname)))) {
        throw new Error('S3_ENDPOINT must be an HTTPS origin (loopback HTTP allowed outside production)');
      }
    }
    storage = { bucket: env.S3_BUCKET, region: env.S3_REGION, endpoint: env.S3_ENDPOINT,
      accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY };
  } else if (env.S3_REGION || env.S3_ENDPOINT || env.S3_ACCESS_KEY_ID || env.S3_SECRET_ACCESS_KEY) {
    throw new Error('S3_BUCKET is required when configuring recording storage');
  }
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
    storage,
  };
}
