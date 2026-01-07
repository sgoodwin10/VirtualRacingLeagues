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
 * Type-safe export of error messages
 */
export type ErrorMessages = typeof ERROR_MESSAGES;
