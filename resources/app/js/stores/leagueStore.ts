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

export const useLeagueStore = defineStore('league', () => {
  // State
  const leagues = ref<League[]>([]);
  const platforms = ref<Platform[]>([]);
  const timezones = ref<Timezone[]>([]);
  const currentLeague = ref<League | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
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

    loading.value = true;
    error.value = null;

    try {
      platforms.value = await getPlatforms();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load platforms';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
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

    loading.value = true;
    error.value = null;

    try {
      timezones.value = await getTimezones();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load timezones';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
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
    loading.value = true;
    error.value = null;

    try {
      const formData = buildLeagueFormData(form);
      const league = await createLeague(formData);
      leagues.value.push(league);
      currentLeague.value = league;
      return league;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create league';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch all leagues for the current user
   */
  async function fetchLeagues(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      leagues.value = await getUserLeagues();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leagues';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a specific league by ID
   * @param id - League ID
   */
  async function fetchLeague(id: number): Promise<League> {
    loading.value = true;
    error.value = null;

    try {
      const league = await getLeague(id);
      currentLeague.value = league;
      return league;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load league';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing league
   * @param leagueId - League ID
   * @param form - Update form data
   */
  async function updateExistingLeague(leagueId: number, form: UpdateLeagueForm): Promise<League> {
    loading.value = true;
    error.value = null;

    try {
      // Get original league for comparison
      const originalLeague = leagues.value.find((l) => l.id === leagueId);
      if (!originalLeague) {
        throw new Error('League not found');
      }

      const formData = buildUpdateLeagueFormData(form, originalLeague);
      const updatedLeague = await updateLeague(leagueId, formData);

      // Update in local state
      const index = leagues.value.findIndex((l) => l.id === leagueId);
      if (index !== -1) {
        leagues.value[index] = updatedLeague;
      }

      // Update current league if it's the one being edited
      if (currentLeague.value?.id === leagueId) {
        currentLeague.value = updatedLeague;
      }

      return updatedLeague;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update league';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a league by ID
   * @param id - League ID
   */
  async function removeLeague(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await deleteLeague(id);
      leagues.value = leagues.value.filter((l) => l.id !== id);

      if (currentLeague.value?.id === id) {
        currentLeague.value = null;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete league';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
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
   * Clear error message
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Fetch driver columns configuration for a league's platforms
   * @param leagueId - League ID
   */
  async function fetchDriverColumnsForLeague(leagueId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      platformColumns.value = await getDriverColumns(leagueId);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load driver columns configuration';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch driver form fields configuration for a league's platforms
   * @param leagueId - League ID
   */
  async function fetchDriverFormFieldsForLeague(leagueId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      platformFormFields.value = await getDriverFormFields(leagueId);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load driver form fields configuration';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch CSV headers for driver import for a league's platforms
   * @param leagueId - League ID
   */
  async function fetchDriverCsvHeadersForLeague(leagueId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      platformCsvHeaders.value = await getDriverCsvHeaders(leagueId);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load CSV headers configuration';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
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
    clearError,
    fetchDriverColumnsForLeague,
    fetchDriverFormFieldsForLeague,
    fetchDriverCsvHeadersForLeague,
  };
});
