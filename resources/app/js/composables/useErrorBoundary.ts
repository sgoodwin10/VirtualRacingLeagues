/**
 * useErrorBoundary Composable
 * Provides error boundary functionality for capturing and handling component errors
 */

import { ref, readonly, onErrorCaptured, type Ref } from 'vue';

export interface UseErrorBoundaryReturn {
  error: Readonly<Ref<Error | null>>;
  errorInfo: Readonly<Ref<string | null>>;
  resetError: () => void;
}

/**
 * Composable for implementing error boundary pattern in Vue components
 * Captures errors from child components and provides graceful error handling
 *
 * @returns Object containing error state and reset method
 *
 * @example
 * // In a parent component
 * const { error, errorInfo, resetError } = useErrorBoundary();
 *
 * // Error will be populated if any child component throws
 * // Use v-if="error" to show error UI
 * // Call resetError() to clear error and retry
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const error = ref<Error | null>(null);
  const errorInfo = ref<string | null>(null);

  /**
   * Capture errors from child components
   */
  onErrorCaptured((err, instance, info) => {
    error.value = err;
    errorInfo.value = info;

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Error captured:', err);
      console.error('[ErrorBoundary] Component:', instance);
      console.error('[ErrorBoundary] Error info:', info);
    }

    // TODO: In production, you might want to send errors to a logging service
    // Example: logErrorToService(err, instance, info);

    // Prevent error from propagating further up the component tree
    return false;
  });

  /**
   * Reset error state to allow retry
   */
  function resetError(): void {
    error.value = null;
    errorInfo.value = null;
  }

  return {
    error: readonly(error),
    errorInfo: readonly(errorInfo),
    resetError,
  };
}
