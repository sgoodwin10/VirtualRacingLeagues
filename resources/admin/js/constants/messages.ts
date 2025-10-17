/**
 * Standardized messages for toast notifications and user feedback
 * Provides consistent error and success messages across the application
 */

/**
 * Error message templates
 * Functions that take an entity name and return a formatted error message
 */
export const ERROR_MESSAGES = {
  /** Failed to load data */
  LOAD_FAILED: (entity: string) => `Failed to load ${entity}`,

  /** Failed to create new record */
  CREATE_FAILED: (entity: string) => `Failed to create ${entity}`,

  /** Failed to update existing record */
  UPDATE_FAILED: (entity: string) => `Failed to update ${entity}`,

  /** Failed to delete/deactivate record */
  DELETE_FAILED: (entity: string) => `Failed to delete ${entity}`,

  /** Failed to restore soft-deleted record */
  RESTORE_FAILED: (entity: string) => `Failed to restore ${entity}`,

  /** Generic unknown error occurred */
  UNKNOWN_ERROR: 'An unexpected error occurred',

  /** Validation errors in form */
  VALIDATION_ERROR: 'Please correct the errors in the form',

  /** Network connection error */
  NETWORK_ERROR: 'Unable to connect to server. Please check your connection and try again.',

  /** Unauthorized access */
  UNAUTHORIZED: 'You are not authorized to perform this action',

  /** Server error */
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
} as const;

/**
 * Success message templates
 * Functions that take an entity name and return a formatted success message
 */
export const SUCCESS_MESSAGES = {
  /** Successfully created new record */
  CREATED: (entity: string) => `${entity} created successfully`,

  /** Successfully updated existing record */
  UPDATED: (entity: string) => `${entity} updated successfully`,

  /** Successfully deleted/deactivated record */
  DELETED: (entity: string) => `${entity} deleted successfully`,

  /** Successfully restored soft-deleted record */
  RESTORED: (entity: string) => `${entity} restored successfully`,

  /** Generic success operation */
  SUCCESS: (action: string) => `${action} completed successfully`,
} as const;

/**
 * Toast notification summaries
 * Common toast summary/title text
 */
export const TOAST_SUMMARIES = {
  /** Error summary */
  ERROR: 'Error',

  /** Success summary */
  SUCCESS: 'Success',

  /** Warning summary */
  WARNING: 'Warning',

  /** Info summary */
  INFO: 'Information',

  /** Validation error summary */
  VALIDATION_ERROR: 'Validation Error',
} as const;

/**
 * Toast life durations (in milliseconds)
 * Standard durations for different types of notifications
 */
export const TOAST_LIFE = {
  /** Short duration for success messages */
  SHORT: 3000,

  /** Standard duration for most messages */
  STANDARD: 5000,

  /** Long duration for important error messages */
  LONG: 7000,
} as const;

/**
 * Type-safe export of error messages
 */
export type ErrorMessages = typeof ERROR_MESSAGES;

/**
 * Type-safe export of success messages
 */
export type SuccessMessages = typeof SUCCESS_MESSAGES;

export default {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  TOAST_SUMMARIES,
  TOAST_LIFE,
};
