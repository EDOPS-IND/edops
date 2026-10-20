import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AppConfig, InjectConfig } from '../../config';
import { AuditService } from '../audit/audit.service';
import { User } from './user.entity';
import { hashPassword, verifyPassword, tokenHash } from './password';
import { DrizzleService } from '../../database/drizzle.service';
import { MailService } from '../notifications/mail.service';

@Injectable()
export class AuthService {
  constructor(
    public readonly drizzle: DrizzleService,
    private readonly audit: AuditService,
    @InjectConfig() private readonly config: AppConfig,
    private readonly mail: MailService,
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

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        isPlatformAdmin: Boolean(payload.isPlatformAdmin),
        isActive: true,
        createdAt: new Date(),
        ...(payload.roles ? { roles: payload.roles } : {}),
      } as unknown as User;
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

    const userProfile = await this.profile(user);
    const rolesMap: Record<string, string> = {};
    for (const org of userProfile.organizations) {
      if (org.id && org.role) rolesMap[org.id] = org.role;
    }

    const newRefreshToken = await this.createRefreshToken(user.id);
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      isPlatformAdmin: user.isPlatformAdmin,
      roles: rolesMap,
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

  async requestPasswordReset(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const [user] = await this.drizzle.query(
      `SELECT id, email, name, is_active AS "isActive" FROM users WHERE email = $1 LIMIT 1`,
      [normalized],
    );

    if (!user) {
      throw new NotFoundException('No account found with this email address');
    }

    if (!user.isActive) {
      throw new BadRequestException('This account is inactive. Please contact support or your school administrator.');
    }

    const { randomBytes } = await import('node:crypto');
    const rawToken = randomBytes(32).toString('hex');
    const hash = tokenHash(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.drizzle.transaction(async (manager) => {
      // Invalidate any previously issued unused tokens for this user
      await manager.query(
        `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
        [user.id],
      );
      await manager.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [user.id, hash, expiresAt],
      );
      await this.audit.record(manager, {
        organizationId: null,
        actorId: user.id,
        action: 'auth.forgot_password_requested',
      });
    });

    await this.mail.sendPasswordResetEmail(user.email, rawToken, user.name);
  }

  async verifyResetToken(token: string): Promise<{ valid: boolean; email: string }> {
    const trimmed = (token || '').trim();
    if (!trimmed || trimmed.length < 32) {
      throw new BadRequestException('Invalid or missing password reset token');
    }
    const hash = tokenHash(trimmed);
    const [record] = await this.drizzle.query(
      `SELECT t.id, t.user_id, t.expires_at AS "expiresAt", t.used_at AS "usedAt", u.email, u.is_active AS "isActive"
       FROM password_reset_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = $1
       LIMIT 1`,
      [hash],
    );

    if (!record || record.usedAt || new Date(record.expiresAt) <= new Date() || !record.isActive) {
      throw new BadRequestException('This password reset link is invalid or has expired. Please request a new one.');
    }

    const [localPart, domain] = record.email.split('@');
    const masked = localPart.length > 2
      ? `${localPart[0]}***${localPart.slice(-1)}@${domain}`
      : `***@${domain}`;

    return { valid: true, email: masked };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const trimmedToken = (token || '').trim();
    if (!trimmedToken || trimmedToken.length < 32) {
      throw new BadRequestException('Invalid or missing password reset token');
    }
    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      throw new BadRequestException('Password must be between 8 and 128 characters');
    }

    const hash = tokenHash(trimmedToken);
    const newPasswordHash = await hashPassword(newPassword);

    await this.drizzle.transaction(async (manager) => {
      const [record] = await manager.query(
        `SELECT t.id, t.user_id, t.expires_at AS "expiresAt", t.used_at AS "usedAt", u.email, u.is_active AS "isActive"
         FROM password_reset_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = $1 AND t.used_at IS NULL AND t.expires_at > NOW() AND u.is_active = true
         LIMIT 1 FOR UPDATE`,
        [hash],
      );

      if (!record) {
        throw new BadRequestException('This password reset link is invalid or has expired. Please request a new one.');
      }

      await manager.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [newPasswordHash, record.user_id]);
      await manager.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [record.id]);
      await manager.query(`UPDATE user_refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`, [record.user_id]);
      await this.audit.record(manager, { organizationId: null, actorId: record.user_id, action: 'auth.password_reset' });
    });
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

export async function resetUserPassword(drizzle: DrizzleService, email: string, newPassword: string, audit = new AuditService()): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const passwordHash = await hashPassword(newPassword);
  return drizzle.transaction(async (manager) => {
    const [user] = await manager.query('SELECT id, email FROM users WHERE email = $1 LIMIT 1', [normalized]);
    if (!user) throw new BadRequestException(`No account found with email '${normalized}'`);
    await manager.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);
    await manager.query('UPDATE user_refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [user.id]);
    await audit.record(manager, { organizationId: null, actorId: user.id, action: 'auth.cli_password_reset' });
    return user.id;
  });
}
