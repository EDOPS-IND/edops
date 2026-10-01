import { ConflictException, Inject, Injectable, Logger, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import session, { Session, SessionData } from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { AppConfig, InjectConfig } from '../../config';
import { AuditService } from '../audit/audit.service';
import { User } from './user.entity';
import { Organization, Membership } from '../tenants/tenant.entity';
import { hashPassword, verifyPassword } from './password';

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
    private readonly source: DataSource,
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
    const user = await this.source.getRepository(User).createQueryBuilder('user')
      .addSelect('user.passwordHash').where('user.email = :email', { email }).getOne();
    const valid = await verifyPassword(password, user?.passwordHash);
    if (!valid || !user?.isActive) throw new UnauthorizedException('Invalid email or password');
    return user;
  }

  async recordLogin(user: User) {
    await this.audit.record(this.source.manager, { organizationId: null, actorId: user.id, action: 'auth.login' });
  }

  async currentUser(currentSession: Session & Partial<SessionData>): Promise<User | null> {
    if (!currentSession.userId || !currentSession.authenticatedAt ||
        currentSession.authenticatedAt + this.config.sessionMaxAge <= Date.now()) return null;
    return this.source.getRepository(User).findOneBy({ id: currentSession.userId, isActive: true });
  }

  async profile(user: User) {
    const organizations = await this.source.getRepository(Organization).createQueryBuilder('organization')
      .innerJoin(Membership, 'membership', 'membership.organization_id = organization.id')
      .where('membership.user_id = :userId AND membership.status = :active', { userId: user.id, active: 'active' })
      .select(['organization.id AS id', 'organization.name AS name', 'organization.slug AS slug',
        'organization.status AS status', 'membership.role AS role'])
      .orderBy('organization.name', 'ASC').getRawMany();
    return { user: { id: user.id, email: user.email, isPlatformAdmin: user.isPlatformAdmin }, organizations };
  }

  async recordLogout(user: User) {
    await this.audit.record(this.source.manager, { organizationId: null, actorId: user.id, action: 'auth.logout' });
  }
}

export async function bootstrapAdmin(source: DataSource, email: string, password: string, audit = new AuditService()): Promise<string> {
  const passwordHash = await hashPassword(password);
  return source.transaction(async (manager) => {
    await manager.query('SELECT pg_advisory_xact_lock(9546001)');
    const users = manager.getRepository(User);
    if (await users.existsBy({ isPlatformAdmin: true })) {
      throw new ConflictException('A platform administrator already exists; bootstrap does not create additional admins');
    }
    if (await users.existsBy({ email })) throw new ConflictException('Bootstrap cannot promote an existing account');
    const user = await users.save(users.create({ email, passwordHash, isPlatformAdmin: true }));
    await audit.record(manager, { organizationId: null, actorId: user.id, action: 'user.bootstrap' });
    return user.id;
  });
}
