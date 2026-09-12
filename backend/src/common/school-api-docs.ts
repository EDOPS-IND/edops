import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiHeader, ApiOperation, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiErrors } from './api-docs';

export function SchoolEndpoint(summary: string, mode: 'read' | 'create' | 'update', model: Type<unknown>, list = false, description = '', access = 'Requires an active school_admin membership in the active organization.') {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOperation({ summary, description: `${description} ${access} Cross-school records return 404. Writes and audit records commit together.`,
      security: mode === 'read' ? [{ cookie: [] }] : [{ cookie: [], csrf: [] }] }),
    ApiResponse({ status: mode === 'create' ? 201 : 200, description: mode === 'create' ? 'Created, or replayed for the same Idempotency-Key within 24 hours.' : 'Successful operation.',
      schema: list ? { type: 'object', required: ['items', 'total', 'limit', 'offset'], properties: {
        items: { type: 'array', items: { $ref: getSchemaPath(model) } }, total: { type: 'integer' }, limit: { type: 'integer' }, offset: { type: 'integer' },
      } } : { $ref: getSchemaPath(model) } }),
    ApiErrors(400, 401, 403, 404, 409, 429, 500, ...(mode === 'read' ? [] : [413 as const])),
    ...(mode === 'create' ? [ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' },
      description: 'Generate once per logical create; reuse with the same body on retry. Conflicting reuse returns 409. Encrypted replay is retained for 24 hours.' })] : []),
  );
}
