/**
 * Standardized API Response Types
 * Defines common response structures for consistency across all services
 */

/**
 * Generic API Response wrapper
 * Backend wraps all responses with { success: true, data: ... }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Pagination metadata following Laravel's standard structure
 */
export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

/**
 * Pagination links for navigation
 */
export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

/**
 * Link object in Laravel's paginated response links array
 */
export interface PaginationLinkItem {
  url: string | null;
  label: string;
  active: boolean;
}

/**
 * Standardized paginated response structure
 * This is the common structure returned by Laravel's pagination
 *
 * Two flavors:
 * 1. Admin API style: { data: T[], meta: PaginationMeta, links: PaginationLinks }
 * 2. Laravel resource style: Full Laravel paginator structure
 *
 * @template T - The type of data items in the paginated response
 */
export interface PaginatedResponse<T> {
  /** Current page number */
  current_page: number;

  /** Array of data items for the current page */
  data: T[];

  /** URL for the first page */
  first_page_url: string;

  /** Index of the first item on the current page */
  from: number;

  /** Total number of pages */
  last_page: number;

  /** URL for the last page */
  last_page_url: string;

  /** Array of pagination links */
  links: PaginationLinkItem[];

  /** URL for the next page (null if on last page) */
  next_page_url: string | null;

  /** Base URL path for pagination */
  path: string;

  /** Number of items per page */
  per_page: number;

  /** URL for the previous page (null if on first page) */
  prev_page_url: string | null;

  /** Index of the last item on the current page */
  to: number;

  /** Total number of items across all pages */
  total: number;
}

/**
 * Simplified paginated response with separated meta and links
 * Used by some API endpoints for cleaner structure
 *
 * @template T - The type of data items in the paginated response
 */
export interface SimplePaginatedResponse<T> {
  /** Array of data items for the current page */
  data: T[];

  /** Pagination metadata */
  meta: PaginationMeta;

  /** Navigation links */
  links: PaginationLinks;
}

/**
 * Common filter parameters for list endpoints
 */
export interface ListFilterParams {
  /** Page number (1-based) */
  page?: number;

  /** Items per page */
  per_page?: number;

  /** Search query */
  search?: string;

  /** Sort field */
  sort_field?: string;

  /** Sort direction */
  sort_order?: 'asc' | 'desc';
}

/**
 * Error response structure from Laravel API
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Success response with no data
 */
export interface ApiSuccessResponse {
  success: boolean;
  message: string;
}

/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'current_page' in response &&
    'total' in response &&
    'per_page' in response
  );
}

/**
 * Type guard to check if response is simple paginated
 */
export function isSimplePaginatedResponse<T>(
  response: unknown
): response is SimplePaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'meta' in response &&
    'links' in response
  );
}

/**
 * Helper to extract data from various response formats
 */
export function extractPaginatedData<T>(
  response: PaginatedResponse<T> | SimplePaginatedResponse<T> | ApiResponse<PaginatedResponse<T>>
): T[] {
  if ('success' in response && response.data) {
    // ApiResponse wrapper
    if (isPaginatedResponse<T>(response.data)) {
      return response.data.data;
    }
  }

  if (isPaginatedResponse<T>(response)) {
    return response.data;
  }

  if (isSimplePaginatedResponse<T>(response)) {
    return response.data;
  }

  return [];
}

/**
 * Helper to convert SimplePaginatedResponse to PaginatedResponse
 * Useful for normalizing different API response formats
 */
export function normalizePaginatedResponse<T>(
  response: SimplePaginatedResponse<T>
): PaginatedResponse<T> {
  return {
    current_page: response.meta.current_page,
    data: response.data,
    first_page_url: response.links.first || '',
    from: response.meta.from,
    last_page: response.meta.last_page,
    last_page_url: response.links.last || '',
    links: [
      {
        url: response.links.prev,
        label: 'Previous',
        active: false,
      },
      {
        url: null,
        label: String(response.meta.current_page),
        active: true,
      },
      {
        url: response.links.next,
        label: 'Next',
        active: false,
      },
    ],
    next_page_url: response.links.next,
    path: '',
    per_page: response.meta.per_page,
    prev_page_url: response.links.prev,
    to: response.meta.to,
    total: response.meta.total,
  };
}
