/**
 * Error message sanitization utility
 * Prevents technical error details from being exposed to end users
 */

import { getErrorMessage } from '@admin/types/errors';
import { ERROR_MESSAGES } from '@admin/constants/messages';

/**
 * Regular expressions for detecting technical error patterns
 * These patterns indicate errors that should not be shown to users
 */
const TECHNICAL_ERROR_PATTERNS = [
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /ECONNRESET/i,
  /ENETUNREACH/i,
  /SQL/i,
  /database/i,
  /query/i,
  /server error/i,
  /internal error/i,
  /500/,
  /502/,
  /503/,
  /504/,
  /stack trace/i,
  /exception/i,
  /undefined method/i,
  /cannot read property/i,
  /is not a function/i,
] as const;

/**
 * Map of technical error patterns to user-friendly messages
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Network errors
  ECONNREFUSED: ERROR_MESSAGES.NETWORK_ERROR,
  ETIMEDOUT: ERROR_MESSAGES.NETWORK_ERROR,
  ENOTFOUND: ERROR_MESSAGES.NETWORK_ERROR,
  ECONNRESET: ERROR_MESSAGES.NETWORK_ERROR,
  ENETUNREACH: ERROR_MESSAGES.NETWORK_ERROR,

  // Database errors
  SQL: 'A database error occurred. Please try again or contact support.',
  database: 'A database error occurred. Please try again or contact support.',
  query: 'A database error occurred. Please try again or contact support.',

  // Server errors
  '500': ERROR_MESSAGES.SERVER_ERROR,
  '502': 'Service temporarily unavailable. Please try again later.',
  '503': 'Service temporarily unavailable. Please try again later.',
  '504': 'Request timed out. Please try again.',
  'server error': ERROR_MESSAGES.SERVER_ERROR,
  'internal error': ERROR_MESSAGES.SERVER_ERROR,
} as const;

/**
 * Checks if an error message contains technical details that should be hidden
 * @param message - Error message to check
 * @returns True if message contains technical details
 */
function isTechnicalError(message: string): boolean {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Gets a user-friendly error message for a technical error
 * @param message - Technical error message
 * @returns User-friendly error message
 */
function getUserFriendlyMessage(message: string): string {
  // Check each pattern and return mapped message
  for (const [pattern, userMessage] of Object.entries(ERROR_MESSAGE_MAP)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(message)) {
      return userMessage;
    }
  }

  // Generic fallback for unrecognized technical errors
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Sanitizes error messages to prevent exposing technical details to users
 *
 * Converts technical error messages (SQL errors, network errors, stack traces)
 * into user-friendly messages while preserving legitimate user-facing errors
 * like validation messages or business logic errors.
 *
 * @param error - Unknown error object
 * @param defaultMessage - Default message if no error message found
 * @returns Sanitized user-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await api.createUser(data);
 * } catch (error) {
 *   const message = getSafeErrorMessage(error);
 *   toast.add({ severity: 'error', detail: message });
 *   // Shows: "Unable to connect to server..." instead of "ECONNREFUSED"
 * }
 * ```
 */
export function getSafeErrorMessage(
  error: unknown,
  defaultMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR,
): string {
  // Get the raw error message
  const message = getErrorMessage(error, defaultMessage);

  // Check if message contains technical details
  if (isTechnicalError(message)) {
    return getUserFriendlyMessage(message);
  }

  // Return original message if it's already user-friendly
  // This includes validation errors, business logic errors, etc.
  return message;
}

/**
 * Type guard to check if an error should be shown to users
 * @param error - Unknown error object
 * @returns True if error is safe to display to users
 */
export function isUserFacingError(error: unknown): boolean {
  const message = getErrorMessage(error, '');
  return !isTechnicalError(message);
}

export default getSafeErrorMessage;
