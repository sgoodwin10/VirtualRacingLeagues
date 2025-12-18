import type { PaginatedResponse } from '@admin/types/api';

/**
 * Backend pagination metadata structure
 * This is what Laravel returns in the 'meta' field
 */
export interface BackendPaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

/**
 * Backend API response structure for paginated data
 */
export interface BackendPaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: BackendPaginationMeta;
}

/**
 * Transform backend pagination response to frontend PaginatedResponse format
 *
 * @param response - Backend API response with pagination metadata
 * @returns PaginatedResponse in the format expected by the frontend
 *
 * @example
 * ```typescript
 * const response = await apiService.get<BackendPaginatedResponse<User>>('/users');
 * const paginatedUsers = transformPaginatedResponse(response);
 * ```
 */
export function transformPaginatedResponse<T>(
  response: BackendPaginatedResponse<T>,
): PaginatedResponse<T> {
  if (response.success && response.data) {
    return {
      current_page: response.meta.current_page,
      data: response.data,
      first_page_url: `${response.meta.path}?page=1`,
      from: response.meta.from,
      last_page: response.meta.last_page,
      last_page_url: `${response.meta.path}?page=${response.meta.last_page}`,
      links: [], // Backend doesn't provide links, can be computed if needed
      next_page_url:
        response.meta.current_page < response.meta.last_page
          ? `${response.meta.path}?page=${response.meta.current_page + 1}`
          : null,
      path: response.meta.path,
      per_page: response.meta.per_page,
      prev_page_url:
        response.meta.current_page > 1
          ? `${response.meta.path}?page=${response.meta.current_page - 1}`
          : null,
      to: response.meta.to,
      total: response.meta.total,
    };
  }

  // Return empty paginated response if no data
  return createEmptyPaginatedResponse<T>();
}

/**
 * Create an empty paginated response
 * Useful for error handling and initial states
 *
 * @returns Empty PaginatedResponse
 */
export function createEmptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    current_page: 1,
    data: [],
    first_page_url: '',
    from: 0,
    last_page: 1,
    last_page_url: '',
    links: [],
    next_page_url: null,
    path: '',
    per_page: 15,
    prev_page_url: null,
    to: 0,
    total: 0,
  };
}
