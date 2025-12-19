/**
 * League Store
 * Manages league-related state, including platforms, timezones, and league CRUD operations
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  League,
  Platform,
  Timezone,
  CreateLeagueForm,
  UpdateLeagueForm,
  PlatformColumn,
  PlatformFormField,
  PlatformCsvHeader,
} from '@app/types/league';
import {
  getPlatforms,
  getTimezones,
  checkSlugAvailability,
  createLeague,
  getUserLeagues,
  getLeague,
  updateLeague,
  deleteLeague,
  buildLeagueFormData,
  buildUpdateLeagueFormData,
  getDriverColumns,
  getDriverFormFields,
  getDriverCsvHeaders,
} from '@app/services/leagueService';
import { useCrudStore } from '@app/composables/useCrudStore';
import { logError } from '@app/utils/logger';
import { getErrorMessage } from '@app/types/errors';

export const useLeagueStore = defineStore('league', () => {
  // Use CRUD composable for league management
  const crud = useCrudStore<League>();
  const {
    items: leagues,
    currentItem: currentLeague,
    loading,
    error,
    setLoading,
    setError,
    setItems,
    setCurrentItem,
    addItem,
    updateItemInList,
    removeItemFromList,
    clearError,
    resetStore,
  } = crud;

  // Additional state specific to league store
  const platforms = ref<Platform[]>([]);
  const platformsLoaded = ref(false);
  const timezones = ref<Timezone[]>([]);

  // Platform configuration state
  const platformColumns = ref<PlatformColumn[]>([]);
  const platformFormFields = ref<PlatformFormField[]>([]);
  const platformCsvHeaders = ref<PlatformCsvHeader[]>([]);

  // Debounce state for checkSlug
  let checkSlugTimeout: ReturnType<typeof setTimeout> | null = null;

  // Getters
  const hasReachedFreeLimit = computed(() => {
    // Free tier allows 1 league
    return leagues.value.length >= 1;
  });

  const leagueCount = computed(() => leagues.value.length);

  const activePlatforms = computed(() => {
    return platforms.value.filter((p) => p.id);
  });

  // Actions

  /**
   * Retry helper for API calls
   * Only retries on network errors or 5xx server errors
   * Does NOT retry on 400/401/403/404 (client errors)
   * @param fn - Function to retry
   * @param maxRetries - Maximum number of retries (default: 3)
   * @param delay - Delay between retries in ms (default: 1000)
   */
  async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
    const MAX_DELAY = 30000; // Cap delay at 30 seconds
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: unknown) {
        lastError = err;

        // Check if error is retryable (network error or 5xx server error)
        const isRetryable = (() => {
          // Network errors (TypeError, fetch failures)
          if (err instanceof TypeError) return true;

          // Check for HTTP status in error object with proper type guard
          if (err && typeof err === 'object' && 'status' in err) {
            const errorWithStatus = err as { status: unknown };
            if (typeof errorWithStatus.status === 'number') {
              // Only retry on 5xx server errors, not 4xx client errors
              return errorWithStatus.status >= 500 && errorWithStatus.status < 600;
            }
          }

          // If we can't determine the error type, don't retry
          return false;
        })();

        // Only retry if error is retryable and we have attempts left
        if (isRetryable && attempt < maxRetries) {
          // Wait before retrying (exponential backoff: delay * 2^(attempt-1))
          // Cap the delay to prevent overflow
          const backoffDelay = Math.min(delay * Math.pow(2, attempt - 1), MAX_DELAY);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        } else {
          // Non-retryable error or out of attempts - throw immediately
          throw err;
        }
      }
    }

    // This line is now reachable if all retries fail with retryable errors
    // TypeScript knows lastError is defined here because the loop executed at least once
    throw lastError;
  }

  /**
   * Fetch all platforms from the API
   * @param forceRefresh - Force refresh even if already loaded
   */
  async function fetchPlatforms(forceRefresh = false): Promise<void> {
    if ((platformsLoaded.value || platforms.value.length > 0) && !forceRefresh) {
      // Already loaded and not forcing refresh
      return;
    }

    setLoading(true);
    setError(null);

    try {
      platforms.value = await withRetry(() => getPlatforms());
      platformsLoaded.value = true;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load platforms');
      setError(errorMessage);
      logError('Failed to load platforms after retries', { context: 'leagueStore', data: err });
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch all timezones from the API
   * @param forceRefresh - Force refresh even if already loaded
   */
  async function fetchTimezones(forceRefresh = false): Promise<void> {
    if (timezones.value.length > 0 && !forceRefresh) {
      // Already loaded and not forcing refresh
      return;
    }

    setLoading(true);
    setError(null);

    try {
      timezones.value = await withRetry(() => getTimezones());
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load timezones');
      setError(errorMessage);
      logError('Failed to load timezones after retries', { context: 'leagueStore', data: err });
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Check if a league slug is available (debounced to reduce API calls)
   * @param name - The league name to check
   * @param leagueId - Optional league ID to exclude from the check (for edit mode)
   * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
   * @returns SlugCheckResponse with availability status, generated slug, suggestion, and error state
   */
  async function checkSlug(
    name: string,
    leagueId?: number,
    debounceMs = 300,
  ): Promise<{
    available: boolean;
    slug: string;
    suggestion: string | null;
    error?: 'network' | 'validation';
  }> {
    if (!name.trim()) {
      return { available: false, slug: '', suggestion: null };
    }

    // Clear any pending slug check
    if (checkSlugTimeout) {
      clearTimeout(checkSlugTimeout);
      checkSlugTimeout = null;
    }

    // Debounce the slug check
    return new Promise((resolve) => {
      checkSlugTimeout = setTimeout(async () => {
        try {
          const result = await checkSlugAvailability(name, leagueId);
          resolve({
            available: result.available,
            slug: result.slug,
            suggestion: result.suggestion,
          });
        } catch (err: unknown) {
          // Differentiate between network errors and validation errors
          // Network errors should be logged and return unavailable with error state
          // Validation errors (422) are expected and should be handled gracefully
          if (err && typeof err === 'object' && 'status' in err) {
            const errorWithStatus = err as { status: unknown };
            if (typeof errorWithStatus.status === 'number' && errorWithStatus.status === 422) {
              // Validation error - expected, don't log as error
              resolve({ available: false, slug: '', suggestion: null, error: 'validation' });
              return;
            }
          }

          // Network or server error - log it and return distinct error state
          logError('Slug check network error', { context: 'leagueStore', data: err });
          resolve({ available: false, slug: '', suggestion: null, error: 'network' });
        }
      }, debounceMs);
    });
  }

  /**
   * Create a new league
   * @param form - League form data
   */
  async function createNewLeague(form: CreateLeagueForm): Promise<League> {
    setLoading(true);
    setError(null);

    try {
      const formData = buildLeagueFormData(form);
      const league = await createLeague(formData);
      addItem(league);
      setCurrentItem(league);
      return league;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to create league');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch all leagues for the current user
   */
  async function fetchLeagues(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const fetchedLeagues = await getUserLeagues();
      setItems(fetchedLeagues);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load leagues');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch a specific league by ID
   * @param id - League ID
   */
  async function fetchLeague(id: number): Promise<League> {
    setLoading(true);
    setError(null);

    try {
      const league = await getLeague(id);
      setCurrentItem(league);
      return league;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load league');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update an existing league
   * @param leagueId - League ID
   * @param form - Update form data
   */
  async function updateExistingLeague(leagueId: number, form: UpdateLeagueForm): Promise<League> {
    setLoading(true);
    setError(null);

    try {
      // Get original league for comparison - check both leagues list and currentLeague
      let originalLeague = leagues.value.find((l) => l.id === leagueId);
      if (!originalLeague && currentLeague.value?.id === leagueId) {
        originalLeague = currentLeague.value;
      }
      if (!originalLeague) {
        throw new Error('League not found');
      }

      const formData = buildUpdateLeagueFormData(form, originalLeague);
      const updatedLeague = await updateLeague(leagueId, formData);
      updateItemInList(updatedLeague);
      return updatedLeague;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to update league');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete a league by ID
   * @param id - League ID
   */
  async function removeLeague(id: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      await deleteLeague(id);
      removeItemFromList(id);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to delete league');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch driver columns configuration for a league's platforms
   * @param leagueId - League ID
   */
  async function fetchDriverColumnsForLeague(leagueId: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      platformColumns.value = await getDriverColumns(leagueId);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load driver columns configuration');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch driver form fields configuration for a league's platforms
   * @param leagueId - League ID
   */
  async function fetchDriverFormFieldsForLeague(leagueId: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      platformFormFields.value = await getDriverFormFields(leagueId);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load driver form fields configuration');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch CSV headers for driver import for a league's platforms
   * @param leagueId - League ID
   */
  async function fetchDriverCsvHeadersForLeague(leagueId: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      platformCsvHeaders.value = await getDriverCsvHeaders(leagueId);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load CSV headers configuration');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    // State
    leagues,
    platforms,
    timezones,
    currentLeague,
    loading,
    error,
    platformColumns,
    platformFormFields,
    platformCsvHeaders,

    // Getters
    hasReachedFreeLimit,
    leagueCount,
    activePlatforms,

    // Actions
    fetchPlatforms,
    fetchTimezones,
    checkSlug,
    createNewLeague,
    fetchLeagues,
    fetchLeague,
    updateExistingLeague,
    removeLeague,
    fetchDriverColumnsForLeague,
    fetchDriverFormFieldsForLeague,
    fetchDriverCsvHeadersForLeague,

    // Utility
    clearError,
    resetStore,
  };
});
