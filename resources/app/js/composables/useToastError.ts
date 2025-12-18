import { useToast } from 'primevue/usetoast';
import type { ToastMessageOptions } from 'primevue/toast';

// Constants for toast durations
export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 7000,
} as const;

export const TOAST_SEVERITY = {
  SUCCESS: 'success',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

export interface ToastErrorOptions {
  summary?: string;
  life?: number;
}

/**
 * Composable for standardized error handling with toast notifications
 */
export function useToastError() {
  const toast = useToast();

  /**
   * Shows an error toast notification
   * @param error - Error object or error message string
   * @param options - Optional configuration for the toast
   */
  function showError(error: unknown, options: ToastErrorOptions = {}): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const { summary = 'Error', life = TOAST_DURATION.MEDIUM } = options;

    toast.add({
      severity: TOAST_SEVERITY.ERROR,
      summary,
      detail: errorMessage,
      life,
    });
  }

  /**
   * Shows a success toast notification
   * @param message - Success message to display
   * @param options - Optional configuration for the toast
   */
  function showSuccess(message: string, options: ToastErrorOptions = {}): void {
    const { summary = 'Success', life = TOAST_DURATION.SHORT } = options;

    toast.add({
      severity: TOAST_SEVERITY.SUCCESS,
      summary,
      detail: message,
      life,
    });
  }

  /**
   * Shows a warning toast notification
   * @param message - Warning message to display
   * @param options - Optional configuration for the toast
   */
  function showWarning(message: string, options: ToastErrorOptions = {}): void {
    const { summary = 'Warning', life = TOAST_DURATION.MEDIUM } = options;

    toast.add({
      severity: TOAST_SEVERITY.WARN,
      summary,
      detail: message,
      life,
    });
  }

  /**
   * Shows an info toast notification
   * @param message - Info message to display
   * @param options - Optional configuration for the toast
   */
  function showInfo(message: string, options: ToastErrorOptions = {}): void {
    const { summary = 'Information', life = TOAST_DURATION.MEDIUM } = options;

    toast.add({
      severity: TOAST_SEVERITY.INFO,
      summary,
      detail: message,
      life,
    });
  }

  /**
   * Shows a custom toast notification
   * @param options - Full toast configuration
   */
  function showToast(options: ToastMessageOptions): void {
    toast.add(options);
  }

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showToast,
  };
}
