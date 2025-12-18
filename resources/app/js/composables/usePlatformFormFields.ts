/**
 * usePlatformFormFields Composable
 * Provides platform form fields data fetching logic
 */

import { onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useLeagueStore } from '@app/stores/leagueStore';

export interface UsePlatformFormFieldsOptions {
  leagueId: number;
  onSuccess?: () => void;
}

export interface UsePlatformFormFieldsReturn {
  fetchPlatformFormFields: () => Promise<void>;
}

/**
 * Composable for fetching platform form fields for a league
 * Automatically fetches on mount and shows user-facing error messages
 * @param options - Configuration options
 * @returns Object containing fetch method
 *
 * @example
 * const { fetchPlatformFormFields } = usePlatformFormFields({
 *   leagueId: 123,
 *   onSuccess: () => {
 *     console.log('Form fields loaded');
 *   }
 * });
 */
export function usePlatformFormFields(
  options: UsePlatformFormFieldsOptions,
): UsePlatformFormFieldsReturn {
  const leagueStore = useLeagueStore();
  const toast = useToast();

  /**
   * Fetch platform form fields for the league
   */
  async function fetchPlatformFormFields(): Promise<void> {
    try {
      await leagueStore.fetchDriverFormFieldsForLeague(options.leagueId);
      if (options.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      console.error('Failed to fetch platform form fields:', error);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load form configuration. Please refresh the page.',
        life: 5000,
      });
      throw error;
    }
  }

  // Automatically fetch on mount
  onMounted(() => {
    fetchPlatformFormFields();
  });

  return {
    fetchPlatformFormFields,
  };
}
