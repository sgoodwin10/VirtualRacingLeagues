import { ref, onUnmounted } from 'vue';
import { publicApi } from '@public/services/publicApi';
import type { PublicDriverProfile } from '@public/types/public';

/**
 * Composable for fetching and managing driver profile data
 *
 * @example
 * ```ts
 * const { driver, isLoading, error, fetchDriver } = useDriverInfo();
 *
 * await fetchDriver(seasonDriverId);
 * ```
 */
export function useDriverInfo() {
  const driver = ref<PublicDriverProfile | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const abortController = ref<AbortController | null>(null);

  /**
   * Fetch driver profile by season driver ID
   */
  async function fetchDriver(seasonDriverId: number): Promise<void> {
    // Abort any pending request
    if (abortController.value) {
      abortController.value.abort();
    }

    // Create new abort controller for this request
    abortController.value = new AbortController();

    isLoading.value = true;
    error.value = null;
    driver.value = null;

    try {
      const result = await publicApi.fetchDriverProfile(
        seasonDriverId,
        abortController.value.signal,
      );
      driver.value = result;
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      error.value = err instanceof Error ? err.message : 'Failed to fetch driver profile';
      driver.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Reset state
   */
  function reset(): void {
    if (abortController.value) {
      abortController.value.abort();
    }
    driver.value = null;
    isLoading.value = false;
    error.value = null;
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (abortController.value) {
      abortController.value.abort();
    }
  });

  return {
    driver,
    isLoading,
    error,
    fetchDriver,
    reset,
  };
}
