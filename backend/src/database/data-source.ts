import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AppConfig } from '../config';
import { User } from '../modules/auth/user.entity';
import { Invitation, Membership, Organization } from '../modules/tenants/tenant.entity';
import { AuditEvent } from '../modules/audit/audit.service';
import { InitialSchema1788825600000 } from './migrations/1788825600000-InitialSchema';
import { Academics1788912000000 } from './migrations/1788912000000-Academics';
import { AcademicYear, Program, Subject, Section, ClassSubjectAssignment, Enrollment } from '../modules/academics/academic.entity';

export function databaseOptions(config: AppConfig): DataSourceOptions {
  return {
    type: 'postgres',
    installExtensions: false,
    url: config.databaseUrl,
    schema: config.databaseSchema,
    ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
    entities: [User, Organization, Membership, Invitation, AuditEvent, AcademicYear, Program, Subject, Section, ClassSubjectAssignment, Enrollment],
    migrations: [InitialSchema1788825600000, Academics1788912000000],
    migrationsTransactionMode: 'all',
    synchronize: false,
    logging: false,
    extra: { options: `-c search_path=${config.databaseSchema} -c timezone=UTC`, max: 10 },
  };
}

export function createDataSource(config: AppConfig): DataSource {
  return new DataSource(databaseOptions(config));
}
