import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

const uuid: SchemaObject = { type: 'string', format: 'uuid', example: '11111111-1111-4111-8111-111111111111' };
const date: SchemaObject = { type: 'string', format: 'date-time', example: '2026-09-08T09:00:00.000Z' };
const csrfToken: SchemaObject = { type: 'string', description: 'Opaque session-bound token. Send in X-CSRF-Token; replace after login.', example: 'example-only-csrf-token' };
const status: SchemaObject = { type: 'string', enum: ['active', 'suspended'], example: 'active' };

export const csrfSchema: SchemaObject = {
  type: 'object', required: ['csrfToken'], properties: { csrfToken },
};

export const profileSchema: SchemaObject = {
  type: 'object', required: ['user', 'organizations'],
  properties: {
    user: {
      type: 'object', required: ['id', 'email', 'isPlatformAdmin'],
      properties: {
        id: uuid,
        email: { type: 'string', format: 'email', example: 'admin@school.example' },
        isPlatformAdmin: { type: 'boolean', example: false, description: 'Platform privilege, independent of school memberships.' },
      },
    },
    organizations: {
      type: 'array', description: 'Active memberships, sorted by school name. Suspended schools remain listed. May be empty.',
      items: {
        type: 'object', required: ['id', 'name', 'slug', 'status', 'role'],
        properties: {
          id: uuid, name: { type: 'string', example: 'Example School' },
          slug: { type: 'string', example: 'example-school' }, status,
          role: { type: 'string', enum: ['school_admin', 'teacher', 'student', 'parent'], example: 'school_admin' },
        },
      },
    },
  },
};

export const loginSchema: SchemaObject = {
  ...profileSchema, required: ['user', 'organizations', 'csrfToken'],
  properties: { ...profileSchema.properties, csrfToken },
};

export const organizationSchema: SchemaObject = {
  type: 'object', required: ['id', 'name', 'slug', 'timeZone', 'locale', 'status', 'createdAt', 'updatedAt'],
  properties: {
    id: uuid, name: { type: 'string', example: 'Example School' },
    slug: { type: 'string', example: 'example-school' },
    timeZone: { type: 'string', example: 'Asia/Kolkata' },
    locale: { type: 'string', enum: ['en-IN', 'hi-IN', 'en-US'], example: 'en-IN' },
    status, createdAt: date, updatedAt: date,
  },
};

export const provisionSchema: SchemaObject = {
  type: 'object', required: ['organization', 'invitation'],
  properties: {
    organization: organizationSchema,
    invitation: {
      type: 'object', required: ['token', 'email', 'expiresAt'],
      properties: {
        token: { type: 'string', pattern: '^[a-f0-9]{64}$', example: 'a'.repeat(64), description: 'Example only. Real secret returned once; deliver privately. Stored only as a hash.' },
        email: { type: 'string', format: 'email', example: 'admin@school.example' },
        expiresAt: { ...date, description: '48 hours after invitation creation.', example: '2026-09-10T09:00:00.000Z' },
      },
    },
  },
};

export const acceptedInvitationSchema: SchemaObject = {
  type: 'object', required: ['userId', 'organizationId'], properties: { userId: uuid, organizationId: uuid },
};

const errorDescriptions = {
  400: 'Invalid JSON, UUID, fields or business input. See the operation description for specific validation rules.',
  401: 'Missing, expired or revoked authentication; inactive user; or invalid login credentials.',
  403: 'Missing/mismatched CSRF token, untrusted Origin, or access denied by this operation.',
  404: 'Organization does not exist or the caller has no active membership. These cases are intentionally indistinguishable on school routes.',
  409: 'A unique database constraint conflicts with existing data, such as a duplicate school slug or membership.',
  413: 'JSON body exceeds the 16 KB limit.',
  429: 'Per-IP route limit exceeded. Respect the Retry-After header; login and invitation acceptance allow 10 requests/minute, other controller routes 120/minute.',
  500: 'Unexpected server or storage failure. Internal details are not returned; do not blindly retry a write.',
  503: 'Required service unavailable: database health query failed, or recording storage is unconfigured or unavailable.',
};

export function ApiErrors(...statuses: (keyof typeof errorDescriptions)[]) {
  return applyDecorators(...statuses.map((code) => ApiResponse({
    status: code, description: errorDescriptions[code],
    schema: {
      type: 'object', required: ['statusCode', 'message'],
      properties: {
        statusCode: { type: 'integer', example: code },
        message: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
        error: { type: 'string', description: 'Optional NestJS error label; not present for all errors.' },
      },
    },
  })));
}
