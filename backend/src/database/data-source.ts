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
import { PlatformControlCenter1789344000000 } from './migrations/1789344000000-PlatformControlCenter';
import { SchoolAdminControlCenter1789430400000 } from './migrations/1789430400000-SchoolAdminControlCenter';
import { PrincipalControlCenter1789516800000 } from './migrations/1789516800000-PrincipalControlCenter';
import { TeacherControlCenter1789603200000 } from './migrations/1789603200000-TeacherControlCenter';
import { StudentControlCenter1789689600000 } from './migrations/1789689600000-StudentControlCenter';
import { PrincipalPeople1789776000000 } from './migrations/1789776000000-PrincipalPeople';
import { PrincipalObservationClassName1789862400000 } from './migrations/1789862400000-PrincipalObservationClassName';
import { PrincipalTimetableSubstitutions1789948800000 } from './migrations/1789948800000-PrincipalTimetableSubstitutions';
import { RoleFeatureOverrides1790035200000 } from './migrations/1790035200000-RoleFeatureOverrides';
import { PrincipalExamPlans1790121600000 } from './migrations/1790121600000-PrincipalExamPlans';
import { PrincipalExamTermScope1790208000000 } from './migrations/1790208000000-PrincipalExamTermScope';
import { DashboardNavigation1790294400000 } from './migrations/1790294400000-DashboardNavigation';
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
    migrations: [
      InitialSchema1788825600000,
      Academics1788912000000,
      Teaching1788998400000,
      Communication1789084800000,
      Arena1789171200000,
      Billing1789257600000,
      PlatformControlCenter1789344000000,
      SchoolAdminControlCenter1789430400000,
      PrincipalControlCenter1789516800000,
      TeacherControlCenter1789603200000,
      StudentControlCenter1789689600000,
      PrincipalPeople1789776000000,
      PrincipalObservationClassName1789862400000,
      PrincipalTimetableSubstitutions1789948800000,
      RoleFeatureOverrides1790035200000,
      PrincipalExamPlans1790121600000,
      PrincipalExamTermScope1790208000000,
      DashboardNavigation1790294400000,
    ],
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
