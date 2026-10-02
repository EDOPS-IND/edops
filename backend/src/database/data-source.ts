import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AppConfig } from '../config';
import { User } from '../modules/auth/user.entity';
import { Invitation, Membership, Organization } from '../modules/tenants/tenant.entity';
import { AuditEvent } from '../modules/audit/audit.service';
import { InitialSchema1788825600000 } from './migrations/1788825600000-InitialSchema';
import { Academics1788912000000 } from './migrations/1788912000000-Academics';
import { Teaching1788998400000 } from './migrations/1788998400000-Teaching';
import { Communication1789084800000 } from './migrations/1789084800000-Communication';
import { Arena1789171200000 } from './migrations/1789171200000-Arena';
import { Billing1789257600000 } from './migrations/1789257600000-Billing';
import { ArenaAttempt, ArenaQuestion } from '../modules/arena/arena.entity';
import { Recording } from '../modules/content/recording.entity';
import { Assignment, AttendanceSession, ExamEvaluation, Submission } from '../modules/assignments/teaching.entity';
import { AcademicYear, Program, Subject, Section, ClassSubjectAssignment, Enrollment } from '../modules/academics/academic.entity';

export function databaseOptions(config: AppConfig): DataSourceOptions {
  return {
    type: 'postgres',
    installExtensions: false,
    url: config.databaseUrl,
    schema: config.databaseSchema,
    ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
    entities: [User, Organization, Membership, Invitation, AuditEvent, AcademicYear, Program, Subject, Section, ClassSubjectAssignment, Enrollment, Assignment, Submission, AttendanceSession, Recording, ArenaQuestion, ArenaAttempt, ExamEvaluation],
    migrations: [InitialSchema1788825600000, Academics1788912000000, Teaching1788998400000, Communication1789084800000, Arena1789171200000, Billing1789257600000],
    migrationsTransactionMode: 'all',
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
    extra: {
      options: `-c search_path=${config.databaseSchema} -c timezone=UTC`,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    },
  };
}

export function createDataSource(config: AppConfig): DataSource {
  return new DataSource(databaseOptions(config));
}
