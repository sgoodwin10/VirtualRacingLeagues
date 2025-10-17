/**
 * Error handler utility for standardized error handling across services
 * Provides consistent error transformation and handling patterns
 */

import {
  isAxiosError,
  hasValidationErrors,
  isRequestCancelled,
  getErrorMessage,
  ApplicationError,
} from '@admin/types/errors';

/**
 * Handles service errors with standardized error transformation
 *
 * Error handling strategy:
 * - Request cancellations: Silent ignore (returns without throwing)
 * - Axios validation errors (422): Preserves full error object for form handling
 * - Other axios errors: Converts to ApplicationError with message and status
 * - Generic Error objects: Re-throws as-is
 * - Unknown errors: Wraps in ApplicationError with generic message
 *
 * @param error - Unknown error object from service call
 * @throws {AxiosError} - For validation errors (preserves original structure)
 * @throws {ApplicationError} - For API errors and unknown errors
 * @throws {Error} - For generic Error objects
 * @returns Never returns (always throws, except for cancelled requests)
 *
 * @example
 * ```typescript
 * try {
 *   await api.post('users', data);
 * } catch (error) {
 *   handleServiceError(error);
 * }
 * ```
 */
export function handleServiceError(error: unknown): never {
  // Silently ignore cancelled requests
  if (isRequestCancelled(error)) {
    // Request was cancelled, don't treat as error
    // This is expected behavior when component unmounts or request is aborted
    return undefined as never;
  }

  // Handle axios errors
  if (isAxiosError(error)) {
    // For validation errors, preserve the full error object
    // This allows form components to extract field-level errors
    if (hasValidationErrors(error)) {
      throw error; // Keep original AxiosError for validation error handling
    }

    // For other API errors, throw a clean ApplicationError with message
    const message = getErrorMessage(error, 'An API error occurred');
    const statusCode = error.response?.status;
    throw new ApplicationError(message, 'API_ERROR', statusCode);
  }

  // Handle generic Error objects by re-throwing
  if (error instanceof Error) {
    throw error;
  }

  // Handle unknown error types
  throw new ApplicationError('An unexpected error occurred', 'UNKNOWN_ERROR');
}
