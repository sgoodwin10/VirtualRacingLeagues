/**
 * useDebouncedSearch Composable
 * Provides reusable search debouncing with automatic request cancellation
 */

import { ref, readonly, watch, onUnmounted, type Ref } from 'vue';

export interface UseDebouncedSearchReturn {
  isSearching: Readonly<Ref<boolean>>;
  cancelSearch: () => void;
}

/**
 * Composable for debouncing search queries with automatic request cancellation
 * @param searchQuery - Reactive search query string
 * @param onSearch - Async function to execute when search query changes (receives query and AbortSignal)
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Object containing isSearching state and cancelSearch method
 *
 * @example
 * const searchQuery = ref('');
 * const { isSearching } = useDebouncedSearch(
 *   searchQuery,
 *   async (query, signal) => {
 *     await driverStore.searchDrivers(leagueId, query, signal);
 *   },
 *   300
 * );
 */
export function useDebouncedSearch(
  searchQuery: Ref<string>,
  onSearch: (query: string, signal: AbortSignal) => Promise<void>,
  delay = 300,
): UseDebouncedSearchReturn {
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;

  const isSearching = ref(false);

  /**
   * Cancel any pending search operation
   */
  function cancelSearch(): void {
    // Clear pending timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }

    // Abort in-flight request
    if (abortController) {
      abortController.abort();
      abortController = null;
    }

    isSearching.value = false;
  }

  // Watch search query and debounce search execution
  watch(searchQuery, (newValue) => {
    // Cancel any pending/in-flight operations
    cancelSearch();

    // Debounce the search
    searchTimeout = setTimeout(async () => {
      abortController = new AbortController();
      isSearching.value = true;

      try {
        await onSearch(newValue, abortController.signal);
      } catch (error) {
        // Ignore AbortError - it's expected when cancelling
        // All other errors are silently ignored to prevent unhandled rejections
        // The calling component should handle errors through its own error state
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      } finally {
        isSearching.value = false;
        abortController = null;
      }
    }, delay);
  });

  // Cleanup on component unmount
  onUnmounted(() => {
    cancelSearch();
  });

  return {
    isSearching: readonly(isSearching),
    cancelSearch,
  };
}
