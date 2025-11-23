/**
 * useAsyncData Composable
 * Provides generic async loading/error handling patterns for data fetching operations
 */

import { ref, readonly, type Ref } from 'vue';

export interface UseAsyncDataReturn<T> {
  data: Readonly<Ref<T | null>>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  execute: (fn: () => Promise<T>) => Promise<T>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Composable for managing async data operations
 * @param defaultErrorMessage - Default error message to use when error doesn't have a message
 * @returns Object containing reactive state and methods for async operations
 *
 * @example
 * const { data, loading, error, execute } = useAsyncData<User>('Failed to load user');
 *
 * async function loadUser() {
 *   await execute(() => authService.checkAuth());
 * }
 */
export function useAsyncData<T>(defaultErrorMessage = 'An error occurred'): UseAsyncDataReturn<T> {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Execute an async function with automatic loading and error handling
   * @param fn - Async function to execute
   * @returns Promise resolving to the result
   * @throws Re-throws the error after capturing it in state
   */
  async function execute(fn: () => Promise<T>): Promise<T> {
    loading.value = true;
    error.value = null;
    try {
      const result = await fn();
      data.value = result;
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : defaultErrorMessage;
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear the error state
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Reset all state to initial values
   */
  function reset(): void {
    data.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    data: readonly(data) as Readonly<Ref<T | null>>,
    loading: readonly(loading),
    error: readonly(error),
    execute,
    clearError,
    reset,
  };
}
