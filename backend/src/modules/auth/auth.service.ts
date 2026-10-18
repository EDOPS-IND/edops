import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AppConfig, InjectConfig } from '../../config';
import { AuditService } from '../audit/audit.service';
import { User } from './user.entity';
import { hashPassword, verifyPassword } from './password';
import { DrizzleService } from '../../database/drizzle.service';

@Injectable()
export class AuthService {
  constructor(
    public readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  async verifyCredentials(email: string, password: string): Promise<User> {
    const [user] = await this.drizzle.query(
      `SELECT id, email, name, phone, password_hash AS "passwordHash", is_platform_admin AS "isPlatformAdmin", is_active AS "isActive", created_at AS "createdAt"
       FROM users WHERE email = $1 LIMIT 1`, [email.trim().toLowerCase()]);
    const valid = await verifyPassword(password, user?.passwordHash);
    if (!valid || !user?.isActive) throw new UnauthorizedException('Invalid email or password');
    return user;
  }

  async recordLogin(user: User) {
    await this.audit.record(this.drizzle, { organizationId: null, actorId: user.id, action: 'auth.login' });
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

  async userFromRequest(request: Request): Promise<User | null> {
    const authHeader = request.headers?.['authorization'] || request.headers?.['Authorization'];
    const authString = typeof authHeader === 'string' ? authHeader : '';
    if (authString.startsWith('Bearer ')) {
      return this.userFromJwt(authString.substring(7).trim());
    }
    const rawCookie = request.cookies?.[this.config.cookieName];
    if (rawCookie) {
      const sid = typeof rawCookie === 'string' && rawCookie.startsWith('s:')
        ? rawCookie.slice(2).split('.')[0]
        : rawCookie;
      const [session] = await this.drizzle.query(
        `SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW() LIMIT 1`,
        [sid]
      );
      const userId = session?.sess?.userId;
      if (userId) {
        const [user] = await this.drizzle.query(
          `SELECT id, email, name, phone, password_hash AS "passwordHash", is_platform_admin AS "isPlatformAdmin", is_active AS "isActive", created_at AS "createdAt"
           FROM users WHERE id = $1 AND is_active = true LIMIT 1`,
          [userId]
        );
        if (user) return user;
      }
    }
    return null;
  }

  async createRefreshToken(userId: string): Promise<string> {
    const { generateRefreshToken } = await import('./jwt.util');
    const { token, hash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    await this.drizzle.query(
      `INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, hash, expiresAt]
    );
    return token;
  }

  async revokeRefreshToken(token: string, userId: string): Promise<void> {
    const { hashToken } = await import('./jwt.util');
    await this.drizzle.query(
      `UPDATE user_refresh_tokens SET revoked_at = NOW()
       WHERE token_hash = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [hashToken(token), userId],
    );
  }

  async rotateRefreshToken(oldToken: string): Promise<{ user: User; newRefreshToken: string; accessToken: string } | null> {
    const { hashToken, signAccessToken } = await import('./jwt.util');
    const hash = hashToken(oldToken);
    const [record] = await this.drizzle.query(
      `SELECT user_id FROM user_refresh_tokens WHERE token_hash = $1 AND expires_at > NOW() AND revoked_at IS NULL LIMIT 1`,
      [hash]
    );
    if (!record?.user_id) return null;

    // Revoke old token
    await this.drizzle.query(
      `UPDATE user_refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
      [hash]
    );

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
    const { entitlements } = await import('../billing/entitlements');
    const orgsWithFeatures = await Promise.all(organizations.map(async (org: any) => {
      const ent = await entitlements(this.drizzle, org.id, org.role);
      const enabledFeatures = ent?.features ? Object.keys(ent.features).filter(k => ent.features[k]) : [];
      return { ...org, features: enabledFeatures };
    }));
    return { user: { id: user.id, email: user.email, name: user.name || '', phone: user.phone || null, isPlatformAdmin: user.isPlatformAdmin }, organizations: orgsWithFeatures };
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
