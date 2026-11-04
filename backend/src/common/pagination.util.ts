export interface PaginationQuery {
  page?: number | string;
  limit?: number | string;
  offset?: number | string;
}

export interface NormalizedPagination {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Standardized pagination parser with safe bounds.
 * Clamps limit between minLimit (default 1) and maxLimit (default 100).
 */
export function parsePagination(
  query?: PaginationQuery,
  defaultLimit = 50,
  maxLimit = 100
): NormalizedPagination {
  const page = Math.max(Number(query?.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query?.limit) || defaultLimit, 1), maxLimit);
  const explicitOffset = query?.offset !== undefined ? Number(query.offset) : undefined;
  const offset = explicitOffset !== undefined && !isNaN(explicitOffset) && explicitOffset >= 0
    ? explicitOffset
    : (page - 1) * limit;

  return { page, limit, offset };
}
