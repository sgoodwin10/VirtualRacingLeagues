/**
 * Error types for the admin dashboard application
 * Provides type-safe error handling for API and application errors
 */

import axios, { type AxiosError } from 'axios';

/**
 * API error interface for axios errors with response data
 * Represents errors returned from HTTP requests
 */
export interface ApiError {
  /** Error message */
  message: string;
  /** HTTP response data */
  response?: {
    /** Response data payload */
    data?: {
      /** Error message from server */
      message?: string;
      /** Validation errors keyed by field name */
      errors?: Record<string, string[]>;
    };
    /** HTTP status code */
    status?: number;
  };
}

/**
 * Validation error interface for form validation errors
 * Contains field-level error messages
 */
export interface ValidationError {
  /** Validation errors keyed by field name */
  errors: Record<string, string[]>;
  /** General error message */
  message: string;
}

/**
 * Validation error response interface from Laravel
 * Contains the full response structure for 422 validation errors
 */
export interface ValidationErrorResponse {
  /** Error message from server */
  message: string;
  /** Field-level validation errors */
  errors: Record<string, string[]>;
}

/**
 * Custom application error class
 * Extends native Error with additional context
 */
export class ApplicationError extends Error {
  /**
   * Creates a new ApplicationError instance
   * @param message - Error message
   * @param code - Optional error code for categorization
   * @param statusCode - Optional HTTP status code
   */
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ApplicationError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }
}

/**
 * Type guard to check if an error is an axios error
 * Uses axios.isAxiosError for accurate detection
 * @param error - Unknown error object to check
 * @returns True if error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

/**
 * Type guard to check if an axios error has validation errors
 * Checks for 422 status and properly structured validation errors
 * @param error - Unknown error object to check
 * @returns True if error is an AxiosError with validation errors
 */
export function hasValidationErrors(error: unknown): error is AxiosError<ValidationErrorResponse> {
  return (
    isAxiosError(error) &&
    error.response?.status === 422 &&
    typeof error.response?.data === 'object' &&
    error.response?.data !== null &&
    'errors' in error.response.data &&
    typeof error.response.data.errors === 'object' &&
    error.response.data.errors !== null
  );
}

/**
 * Extract error message safely from any error type
 * Provides fallback messages for various error scenarios
 * @param error - Unknown error object
 * @param defaultMessage - Default message if no error message found
 * @returns Extracted error message or default
 */
export function getErrorMessage(error: unknown, defaultMessage = 'An error occurred'): string {
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle Axios errors
  if (isAxiosError(error)) {
    // Try to get message from response data
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as Record<string, unknown>;
      if (typeof data.message === 'string') {
        return data.message;
      }
    }
    // Fall back to axios error message
    return error.message || defaultMessage;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle objects with message property
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  // Return default message for unknown error types
  return defaultMessage;
}

/**
 * Check if error is a request cancellation
 * Uses axios.isCancel for accurate detection
 * @param error - Unknown error object
 * @returns True if error is a cancellation
 */
export function isRequestCancelled(error: unknown): boolean {
  return axios.isCancel(error);
}

/**
 * Check if error is a network error (no response from server)
 * @param error - Unknown error object
 * @returns True if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response && error.message === 'Network Error';
}

/**
 * Check if error is a timeout error
 * @param error - Unknown error object
 * @returns True if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return isAxiosError(error) && error.code === 'ECONNABORTED';
}

/**
 * Extract validation errors from error object
 * Returns null if error doesn't contain validation errors
 * @param error - Unknown error object
 * @returns Validation errors or null
 */
export function getValidationErrors(error: unknown): Record<string, string[]> | null {
  if (hasValidationErrors(error)) {
    return error.response?.data.errors ?? null;
  }
  return null;
}

/**
 * Get HTTP status code from error
 * Returns null if error doesn't have a status code
 * @param error - Unknown error object
 * @returns HTTP status code or null
 */
export function getStatusCode(error: unknown): number | null {
  if (isAxiosError(error) && error.response?.status) {
    return error.response.status;
  }
  return null;
}
