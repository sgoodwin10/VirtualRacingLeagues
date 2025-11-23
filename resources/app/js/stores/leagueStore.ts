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
  const timezones = ref<Timezone[]>([]);
  const currentStep = ref(0);

  // Platform configuration state
  const platformColumns = ref<PlatformColumn[]>([]);
  const platformFormFields = ref<PlatformFormField[]>([]);
  const platformCsvHeaders = ref<PlatformCsvHeader[]>([]);

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
   * Fetch all platforms from the API
   */
  async function fetchPlatforms(): Promise<void> {
    if (platforms.value.length > 0) {
      // Already loaded
      return;
    }

    setLoading(true);
    setError(null);

    try {
      platforms.value = await getPlatforms();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load platforms';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch all timezones from the API
   */
  async function fetchTimezones(): Promise<void> {
    if (timezones.value.length > 0) {
      // Already loaded
      return;
    }

    setLoading(true);
    setError(null);

    try {
      timezones.value = await getTimezones();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load timezones';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Check if a league slug is available
   * @param name - The league name to check
   * @param leagueId - Optional league ID to exclude from the check (for edit mode)
   * @returns SlugCheckResponse with availability status, generated slug, and suggestion if unavailable
   */
  async function checkSlug(
    name: string,
    leagueId?: number,
  ): Promise<{ available: boolean; slug: string; suggestion: string | null }> {
    if (!name.trim()) {
      return { available: false, slug: '', suggestion: null };
    }

    try {
      const result = await checkSlugAvailability(name, leagueId);
      return {
        available: result.available,
        slug: result.slug,
        suggestion: result.suggestion,
      };
    } catch (err: unknown) {
      console.error('Slug check error:', err);
      return { available: false, slug: '', suggestion: null };
    }
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to create league';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leagues';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load league';
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
      // Get original league for comparison
      const originalLeague = leagues.value.find((l) => l.id === leagueId);
      if (!originalLeague) {
        throw new Error('League not found');
      }

      const formData = buildUpdateLeagueFormData(form, originalLeague);
      const updatedLeague = await updateLeague(leagueId, formData);
      updateItemInList(updatedLeague);
      return updatedLeague;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update league';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete league';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Set the current wizard step
   * @param step - Step index (0-based)
   */
  function setCurrentStep(step: number): void {
    currentStep.value = step;
  }

  /**
   * Reset wizard to first step
   */
  function resetWizard(): void {
    currentStep.value = 0;
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
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load driver columns configuration';
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
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load driver form fields configuration';
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
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load CSV headers configuration';
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
    currentStep,
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
    setCurrentStep,
    resetWizard,
    fetchDriverColumnsForLeague,
    fetchDriverFormFieldsForLeague,
    fetchDriverCsvHeadersForLeague,

    // Utility
    clearError,
    resetStore,
  };
});
