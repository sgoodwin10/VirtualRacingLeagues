import { useToast } from 'primevue/usetoast';
import type { AxiosError } from 'axios';

/**
 * Error response structure from Laravel API
 */
interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Options for customizing error toast behavior
 */
export interface ErrorToastOptions {
  /**
   * Custom error message to display instead of the default
   */
  customMessage?: string;
  /**
   * Toast life duration in milliseconds
   * @default 5000
   */
  life?: number;
  /**
   * Whether to show validation errors individually
   * @default false
   */
  showValidationErrors?: boolean;
}

/**
 * Composable for displaying error toasts with consistent formatting
 *
 * This composable provides a centralized way to handle error messages from API calls,
 * validation errors, and generic exceptions.
 *
 * @example
 * ```typescript
 * const { showErrorToast } = useErrorToast();
 *
 * try {
 *   await userService.createUser(data);
 * } catch (error) {
 *   showErrorToast(error, 'Failed to create user');
 * }
 * ```
 *
 * @example Handle validation errors
 * ```typescript
 * const { showErrorToast } = useErrorToast();
 *
 * try {
 *   await userService.updateUser(id, data);
 * } catch (error) {
 *   showErrorToast(error, 'Failed to update user', {
 *     showValidationErrors: true
 *   });
 * }
 * ```
 */
export function useErrorToast() {
  const toast = useToast();

  /**
   * Extracts error message from various error types
   *
   * @param error - The error object to extract message from
   * @returns Extracted error message or default message
   */
  const extractErrorMessage = (error: unknown): string => {
    // Handle AxiosError (API errors)
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      // Check for Laravel validation error message
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }

      // Check for generic response message
      if (axiosError.message) {
        return axiosError.message;
      }
    }

    // Handle Error instances
    if (error instanceof Error) {
      return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }

    // Default fallback
    return 'An unexpected error occurred';
  };

  /**
   * Extracts validation errors from Laravel API response
   *
   * @param error - The error object to extract validation errors from
   * @returns Record of field names to error messages, or null if no validation errors
   */
  const extractValidationErrors = (error: unknown): Record<string, string[]> | null => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data?.errors) {
        return axiosError.response.data.errors;
      }
    }

    return null;
  };

  /**
   * Checks if the error contains Laravel validation errors
   *
   * @param error - The error object to check
   * @returns True if error contains validation errors
   */
  const hasValidationErrors = (error: unknown): boolean => {
    return extractValidationErrors(error) !== null;
  };

  /**
   * Shows an error toast with appropriate message based on error type
   *
   * Handles:
   * - Axios errors with API responses
   * - Laravel validation errors
   * - Generic Error instances
   * - String error messages
   *
   * @param error - The error to display
   * @param fallbackMessage - Custom message to show (used as title when validation errors present)
   * @param options - Additional options for toast customization
   */
  const showErrorToast = (
    error: unknown,
    fallbackMessage?: string,
    options: ErrorToastOptions = {},
  ): void => {
    const { customMessage, life = 5000, showValidationErrors = false } = options;

    // Extract validation errors if present
    const validationErrors = extractValidationErrors(error);

    // If validation errors exist and should be shown individually
    if (validationErrors && showValidationErrors) {
      // Show a summary error first
      toast.add({
        severity: 'error',
        summary: fallbackMessage || 'Validation Error',
        detail: 'Please correct the errors in the form',
        life,
      });

      // Optionally show individual validation errors
      Object.entries(validationErrors).forEach(([field, messages]) => {
        toast.add({
          severity: 'error',
          summary: field.charAt(0).toUpperCase() + field.slice(1),
          detail: messages.join(', '),
          life: life + 1000, // Show validation errors slightly longer
        });
      });

      return;
    }

    // Show single error toast
    const errorMessage = customMessage || extractErrorMessage(error);
    const summary = fallbackMessage || 'Error';

    toast.add({
      severity: 'error',
      summary,
      detail: errorMessage,
      life,
    });
  };

  /**
   * Shows a success toast (convenience method)
   *
   * @param message - Success message to display
   * @param summary - Toast summary/title
   * @param life - Toast duration in milliseconds
   */
  const showSuccessToast = (message: string, summary = 'Success', life = 3000): void => {
    toast.add({
      severity: 'success',
      summary,
      detail: message,
      life,
    });
  };

  /**
   * Shows a warning toast (convenience method)
   *
   * @param message - Warning message to display
   * @param summary - Toast summary/title
   * @param life - Toast duration in milliseconds
   */
  const showWarningToast = (message: string, summary = 'Warning', life = 4000): void => {
    toast.add({
      severity: 'warn',
      summary,
      detail: message,
      life,
    });
  };

  /**
   * Shows an info toast (convenience method)
   *
   * @param message - Info message to display
   * @param summary - Toast summary/title
   * @param life - Toast duration in milliseconds
   */
  const showInfoToast = (message: string, summary = 'Info', life = 3000): void => {
    toast.add({
      severity: 'info',
      summary,
      detail: message,
      life,
    });
  };

  return {
    showErrorToast,
    showSuccessToast,
    showWarningToast,
    showInfoToast,
    hasValidationErrors,
    extractValidationErrors,
  };
}
