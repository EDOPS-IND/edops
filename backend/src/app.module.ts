import { Controller, DynamicModule, Get, Global, Module, ServiceUnavailableException } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { APP_CONFIG, AppConfig } from './config';
import { AuthGuard, Public } from './common/auth.guard';
import { databaseOptions } from './database/data-source';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ApiErrors } from './common/api-docs';
import { AcademicsModule } from './modules/academics/academics.module';
import { TeachingModule } from './modules/assignments/teaching.module';
import { CommunicationModule } from './modules/content/communication.controller';
import { ArenaModule } from './modules/arena/arena.controller';
import { BillingModule } from './modules/billing/billing.controller';
import { SchoolAdminModule } from './modules/school-admin/school-admin.module';
import { PrincipalModule } from './modules/principal/principal.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { StudentModule } from './modules/student/student.module';

@Global()
@Module({})
export class ConfigurationModule {
  static register(config: AppConfig): DynamicModule {
    return { module: ConfigurationModule, providers: [{ provide: APP_CONFIG, useValue: config }], exports: [APP_CONFIG] };
  }
}

@ApiTags('Health')
@Public()
@Controller('health')
class HealthController {
  constructor(private readonly source: DataSource) {}

  @Get()
  @ApiOperation({
    summary: 'Check API and database connectivity', security: [],
    description: 'Public. Runs SELECT 1 through the application database connection. Returns 503 if that query fails. Does not check migrations, mail delivery, billing or every application table; makes no domain changes. Limit: 120 requests/minute per IP.',
  })
  @ApiOkResponse({ description: 'Database query succeeded.', schema: {
    type: 'object', required: ['status', 'database'],
    properties: { status: { type: 'string', enum: ['ok'] }, database: { type: 'string', enum: ['up'] } },
  } })
  @ApiErrors(429, 500, 503)
  async health() {
    try {
      await this.source.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}

@Module({})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigurationModule.register(config),
        TypeOrmModule.forRoot({ ...databaseOptions(config), retryAttempts: 3, retryDelay: 2000 }),
        // ponytail: one API process; use shared throttler storage before deploying multiple replicas.
        ThrottlerModule.forRoot([{
          ttl: 60_000,
          limit: config.throttleLimit,
          // ponytail: throttle by user if signed in so one student on school WiFi doesn't block everyone
          getTracker: (req) => (req.session?.userId ? `user:${req.session.userId}` : (req.ip ?? '127.0.0.1')),
        }]),
        AuthModule,
        TenantsModule,
        AcademicsModule,
        TeachingModule,
        CommunicationModule,
        ArenaModule,
        BillingModule,
        SchoolAdminModule,
        PrincipalModule,
        TeacherModule,
        StudentModule,
      ],
      controllers: [HealthController],
      providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    };
  }
}
