/**
 * Shared API Types
 * Common types used across all API services
 */

/**
 * Standard API response wrapper
 * Used by all backend endpoints to wrap response data
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Paginated API response structure
 * Used for endpoints that return paginated data
 */
export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
  message?: string;
}
