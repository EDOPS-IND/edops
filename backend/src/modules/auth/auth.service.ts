import { ConflictException, Injectable, Logger, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import session, { Session, SessionData } from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { AppConfig, InjectConfig } from '../../config';
import { AuditService } from '../audit/audit.service';
import { User } from './user.entity';
import { hashPassword, verifyPassword } from './password';
import { DrizzleService } from '../../database/drizzle.service';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    authenticatedAt?: number;
  }
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  readonly sessionStore: connectPgSimple.PGStore;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    public readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
    @InjectConfig() private readonly config: AppConfig,
  ) {
    const PgStore = connectPgSimple(session);
    this.sessionStore = new PgStore({
      conObject: {
        connectionString: config.databaseUrl,
        ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
        options: '-c timezone=UTC',
        max: 5,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
      schemaName: config.databaseSchema,
      tableName: 'sessions',
      createTableIfMissing: false,
      disableTouch: true,
      errorLog: () => this.logger.error('Session store unavailable'),
    });
  }

  async onModuleDestroy() {
    await this.sessionStore.close();
  }

  async verifyCredentials(email: string, password: string): Promise<User> {
    const [user] = await this.drizzle.query(
      `SELECT id, email, name, phone, password_hash AS "passwordHash", is_platform_admin AS "isPlatformAdmin", is_active AS "isActive", created_at AS "createdAt"
       FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    const valid = await verifyPassword(password, user?.passwordHash);
    if (!valid || !user?.isActive) throw new UnauthorizedException('Invalid email or password');
    return user;
  }

  async recordLogin(user: User) {
    await this.audit.record(this.drizzle, { organizationId: null, actorId: user.id, action: 'auth.login' });
  }

  async currentUser(currentSession: Session & Partial<SessionData>): Promise<User | null> {
    if (!currentSession.userId || !currentSession.authenticatedAt ||
        currentSession.authenticatedAt + this.config.sessionMaxAge <= Date.now()) return null;
    const [user] = await this.drizzle.query(
      `SELECT id, email, name, phone, is_platform_admin AS "isPlatformAdmin", is_active AS "isActive", created_at AS "createdAt"
       FROM users WHERE id = $1 AND is_active = true LIMIT 1`,
      [currentSession.userId]
    );
    return user ?? null;
  }

  async userFromJwt(token: string): Promise<User | null> {
    try {
      const { verifyAccessToken } = await import('./jwt.util');
      const payload = verifyAccessToken(token);
      if (!payload?.sub) return null;
      const [user] = await this.drizzle.query(
        `SELECT id, email, name, phone, is_platform_admin AS "isPlatformAdmin", is_active AS "isActive", created_at AS "createdAt"
         FROM users WHERE id = $1 AND is_active = true LIMIT 1`,
        [payload.sub]
      );
      return user ?? null;
    } catch {
      return null;
    }
  }

  async createRefreshToken(userId: string): Promise<string> {
    const { generateRefreshToken } = await import('./jwt.util');
    const { token, hash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    await this.drizzle.query(
      `INSERT INTO identity.user_refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, hash, expiresAt]
    ).catch(() => null); // graceful fallback if table not yet migrated
    return token;
  }

  async rotateRefreshToken(oldToken: string): Promise<{ user: User; newRefreshToken: string; accessToken: string } | null> {
    const { hashToken, signAccessToken } = await import('./jwt.util');
    const hash = hashToken(oldToken);
    const [record] = await this.drizzle.query(
      `SELECT user_id FROM identity.user_refresh_tokens WHERE token_hash = $1 AND expires_at > NOW() AND revoked_at IS NULL LIMIT 1`,
      [hash]
    ).catch(() => []);
    if (!record?.user_id) return null;

    // Revoke old token
    await this.drizzle.query(
      `UPDATE identity.user_refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
      [hash]
    ).catch(() => null);

    const [user] = await this.drizzle.query(
      `SELECT id, email, name, phone, is_platform_admin AS "isPlatformAdmin", is_active AS "isActive", created_at AS "createdAt"
       FROM users WHERE id = $1 AND is_active = true LIMIT 1`,
      [record.user_id]
    );
    if (!user) return null;

    const newRefreshToken = await this.createRefreshToken(user.id);
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
    });
    return { user, newRefreshToken, accessToken };
  }

  async profile(user: User) {
    const organizations = await this.drizzle.query(
      `SELECT o.id AS id, o.name AS name, o.slug AS slug, o.status AS status, m.role AS role
       FROM organizations o
       JOIN memberships m ON m.organization_id = o.id
       WHERE m.user_id = $1 AND m.status = 'active'
       ORDER BY o.name ASC`,
      [user.id]
    );
    return { user: { id: user.id, email: user.email, name: user.name || '', phone: user.phone || null, isPlatformAdmin: user.isPlatformAdmin }, organizations };
  }

  async recordLogout(user: User) {
    await this.audit.record(this.drizzle, { organizationId: null, actorId: user.id, action: 'auth.logout' });
  }
}

export async function bootstrapAdmin(drizzle: DrizzleService, email: string, password: string, audit = new AuditService()): Promise<string> {
  const passwordHash = await hashPassword(password);
  return drizzle.transaction(async (manager) => {
    await manager.query('SELECT pg_advisory_xact_lock(9546001)');
    const [existingAdmin] = await manager.query('SELECT 1 FROM users WHERE is_platform_admin = true LIMIT 1');
    if (existingAdmin) {
      throw new ConflictException('A platform administrator already exists; bootstrap does not create additional admins');
    }
    const [existingEmail] = await manager.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existingEmail) throw new ConflictException('Bootstrap cannot promote an existing account');
    const [user] = await manager.query(
      `INSERT INTO users (email, password_hash, is_platform_admin)
       VALUES ($1, $2, true)
       RETURNING id`,
      [email, passwordHash]
    );
    await audit.record(manager, { organizationId: null, actorId: user.id, action: 'user.bootstrap' });
    return user.id;
  });
}
