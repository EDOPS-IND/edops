import 'reflect-metadata';
import { ForbiddenException, ValidationPipe, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { DrizzleService } from './database/drizzle.service';
import { AppModule } from './app.module';
import { AppConfig } from './config';
import { HttpErrorFilter } from './common/http-error.filter';

export async function createApp(config: AppConfig) {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.register(config), {
    bodyParser: false, abortOnError: false, logger: config.environment === 'test' ? false : ['error', 'warn', 'log'],
  });
  if (config.environment === 'production') {
    try {
      const [role] = await app.get(DrizzleService).query('SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user');
      if (!role || role.rolsuper || role.rolbypassrls) throw new Error('Production API requires a non-superuser, non-BYPASSRLS database role');
    } catch (error) {
      await app.close();
      throw error;
    }
  }
  app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  app.enableCors({
    origin: config.corsOrigins, credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'authorization', 'X-CSRF-Token', 'x-csrf-token', 'Idempotency-Key', 'idempotency-key', 'Accept', 'X-Requested-With'],
  });
  app.use((request: Request, response: Response, next: NextFunction) => {
    const origin = request.get('origin');
    if (origin && config.corsOrigins.includes(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, authorization, X-CSRF-Token, x-csrf-token, Idempotency-Key, Accept, X-Requested-With');
    if (request.method === 'OPTIONS') {
      return response.sendStatus(204);
    }
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use((request: Request, _response: Response, next: NextFunction) => {
    const origin = request.get('origin');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && origin && !config.corsOrigins.includes(origin)) {
      return next(new ForbiddenException('Origin is not allowed'));
    }
    next();
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: ['1', VERSION_NEUTRAL] });
  app.useGlobalPipes(new ValidationPipe({
    transform: true, whitelist: true, forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
  }));
  app.useGlobalFilters(new HttpErrorFilter());
  if (config.environment !== 'production') {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder()
      .setTitle('EDOPS School API')
      .setDescription([
        'B2B multi-tenant school SaaS. Milestones 1-6: onboarding, roster, teaching, scorecards, communication, recordings, objective Arena, school subscriptions, manual billing and platform statistics. Canonical prefix: /api/v1. Original /api M1 routes remain compatibility aliases; newer routes are v1 only.',
        '**Start:** GET /api/auth/csrf, authorize the returned value under **csrf**, then POST /api/auth/login. Replace the authorized CSRF value with the token returned by login. The browser manages the HTTP-only cookie; do not paste cookies or use a Bearer token.',
        '**Write requests:** Both the session cookie (anonymous before login) and X-CSRF-Token are required, including login and invite acceptance. A supplied Origin must match CORS_ORIGINS. Use one hostname throughout; browser fetch calls need credentials: "include".',
        '**Onboarding:** Bootstrap the first super admin through the local CLI, log in, create a school, privately deliver its one-time invite, then accept it from the school admin session. No public signup or email delivery is implemented.',
        '**Permissions:** Platform admins provision and suspend schools; school admins manage only their own active school. IDs and slugs are not authorization. Sessions last at most 8 hours.',
        '**Errors and limits:** JSON bodies up to 16 KB. Login and invite acceptance: 10 requests/minute per IP per route; other controller routes: 120. Errors contain statusCode and message (string or validation array), with an optional error label. Responses are not wrapped in a data object. Logout returns no body.',
        'M2 POST requests require a UUID Idempotency-Key. Same actor/school/key and normalized payload replay the encrypted result for 24 hours; conflicting reuse returns 409. Bulk invitations support JSON or CSV text with atomic validation. Lists return {items,total,limit,offset}.',
        'M3 teaching routes enforce current teacher section/subject assignments and student enrollment/ownership. All M3 POSTs require Idempotency-Key; resource permissions are checked before replay. Submissions are plain text; scorecards refresh transactionally on qualifying writes.',
        'M4 adds an outbox-driven timeline and personal inbox. Run the separate worker to project events. Private recordings require configured versioned S3 storage; URLs are short-lived capabilities. Recording upload-url POST returns 200 without replay; create/complete/publish POSTs require Idempotency-Key.',
        'M5 adds objective Arena practice without LLMs. M6 adds platform-only immutable plans, subscription periods, manual invoice/payment records, effective feature overrides and seat enforcement. No gateway or automatic charges. New schools receive a 30-day trial. See backend/docs/MILESTONE-6.md before deployment.',
        'Walkthroughs and limitations: backend/docs/API.md (M1), backend/docs/MILESTONE-2.md (academics/roster), backend/docs/MILESTONE-3.md (teaching). OpenAPI JSON: /api/docs-json. Swagger is disabled in production.',
      ].join('\n\n'))
      .setVersion('0.6.0')
      .addTag('Health', 'Public API/database connectivity check.')
      .addTag('Authentication', 'Session login/logout, current profile, CSRF and administrator invite acceptance.')
      .addTag('Platform', 'Explicit platform-super-admin operations for school provisioning and suspension.')
      .addTag('Schools', 'Settings scoped to the current active school administrator membership.')
      .addTag('Academics', 'Academic years, grades, subjects, sections, teacher assignments and enrollment lifecycle.')
      .addTag('School Roster', 'Teacher/student invitations, atomic CSV imports, batch status and memberships.')
      .addTag('Teaching', 'Teacher/student class access, assignments, submissions, attendance and stored scorecards.')
      .addTag('Communication and Recordings', 'Outbox-driven class timeline, personal in-app inbox and private versioned recordings. See backend/docs/MILESTONE-4.md.')
      .addTag('Arena', 'Class-scoped objective question bank, private attempts and deterministic auto-grading. No LLM. See backend/docs/MILESTONE-5.md.')
      .addTag('Platform Billing', 'Platform-only plans, subscription ledger, entitlements and aggregate statistics. See backend/docs/MILESTONE-6.md.')
      .addTag('School Billing', 'Read-only billing information for the active school administrator.')
      .addCookieAuth(config.cookieName, { type: 'apiKey', in: 'cookie', description: 'HTTP-only session cookie managed by the browser. Can be anonymous for login/invite acceptance; protected operations require a signed-in user.' })
      .addApiKey({ type: 'apiKey', in: 'header', name: 'X-CSRF-Token' }, 'csrf')
      .build());
    SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { withCredentials: true, persistAuthorization: false } });
  }
  return app;
}
