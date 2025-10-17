/**
 * Pagination constants for consistent pagination across the application
 */

/**
 * Pagination configuration
 * Contains default values and options for data tables and lists
 */
export const PAGINATION = {
  /** Default number of items per page */
  DEFAULT_PAGE_SIZE: 15,

  /** Available page size options for user selection */
  PAGE_SIZE_OPTIONS: [10, 15, 25, 50, 100],

  /** Maximum page size allowed for "get all" operations */
  MAX_PAGE_SIZE: 1000,

  /** Default starting page (1-indexed) */
  DEFAULT_PAGE: 1,
} as const;

/**
 * Type-safe export of pagination configuration
 * Use this for TypeScript type inference
 */
export type PaginationConfig = typeof PAGINATION;

export default PAGINATION;
