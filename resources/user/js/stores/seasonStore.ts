/**
 * Season Store
 * Manages season state and operations
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Season,
  SeasonQueryParams,
  CreateSeasonRequest,
  UpdateSeasonRequest,
  SeasonStatus,
} from '@user/types/season';
import {
  getSeasons,
  getSeasonById,
  createSeason,
  updateSeason,
  archiveSeason,
  activateSeason,
  completeSeason,
  deleteSeason,
  restoreSeason,
  buildCreateSeasonFormData,
  buildUpdateSeasonFormData,
} from '@user/services/seasonService';

export const useSeasonStore = defineStore('season', () => {
  // State
  const seasons = ref<Season[]>([]);
  const currentSeason = ref<Season | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Pagination
  const currentPage = ref(1);
  const perPage = ref(10);
  const totalSeasons = ref(0);
  const lastPage = ref(1);

  // Filters
  const searchQuery = ref('');
  const statusFilter = ref<SeasonStatus | 'all'>('all');

  // Getters
  const activeSeasons = computed(() =>
    seasons.value.filter((s) => s.status === 'active' || s.is_active),
  );

  const archivedSeasons = computed(() => seasons.value.filter((s) => s.is_archived));

  const seasonsByStatus = computed(() => {
    const grouped: Record<SeasonStatus, Season[]> = {
      setup: [],
      active: [],
      completed: [],
      archived: [],
    };
    seasons.value.forEach((season) => {
      grouped[season.status].push(season);
    });
    return grouped;
  });

  const hasNextPage = computed(() => currentPage.value < lastPage.value);
  const hasPreviousPage = computed(() => currentPage.value > 1);

  /**
   * Get the current page of seasons (client-side pagination)
   */
  const paginatedSeasons = computed(() => {
    const start = (currentPage.value - 1) * perPage.value;
    const end = start + perPage.value;
    return seasons.value.slice(start, end);
  });

  // Actions

  /**
   * Fetch all seasons for a competition
   * Note: Backend returns all seasons (not paginated). Pagination is done client-side.
   */
  async function fetchSeasons(competitionId: number, params?: SeasonQueryParams): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const queryParams: SeasonQueryParams = {
        search: params?.search || searchQuery.value || undefined,
        status: params?.status || (statusFilter.value !== 'all' ? statusFilter.value : undefined),
      };

      // Backend returns all seasons as a simple array
      const allSeasons: Season[] = await getSeasons(competitionId, queryParams);

      // Store all seasons
      seasons.value = allSeasons;

      // Client-side pagination calculations
      totalSeasons.value = allSeasons.length;
      lastPage.value = Math.ceil(allSeasons.length / perPage.value) || 1;

      // Ensure current page is valid
      if (currentPage.value > lastPage.value) {
        currentPage.value = lastPage.value;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load seasons';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a specific season
   */
  async function fetchSeason(seasonId: number): Promise<Season> {
    loading.value = true;
    error.value = null;

    try {
      const season = await getSeasonById(seasonId);
      currentSeason.value = season;
      return season;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load season';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new season
   */
  async function createNewSeason(
    competitionId: number,
    data: CreateSeasonRequest,
  ): Promise<Season> {
    loading.value = true;
    error.value = null;

    try {
      const formData = buildCreateSeasonFormData(data);
      const season = await createSeason(competitionId, formData);
      seasons.value.push(season);
      currentSeason.value = season;
      return season;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create season';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing season
   */
  async function updateExistingSeason(
    seasonId: number,
    data: UpdateSeasonRequest,
  ): Promise<Season> {
    loading.value = true;
    error.value = null;

    try {
      const formData = buildUpdateSeasonFormData(data);
      const updatedSeason = await updateSeason(seasonId, formData);

      // Update in local state
      const index = seasons.value.findIndex((s) => s.id === seasonId);
      if (index !== -1) {
        seasons.value[index] = updatedSeason;
      }

      if (currentSeason.value?.id === seasonId) {
        currentSeason.value = updatedSeason;
      }

      return updatedSeason;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update season';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Archive a season
   */
  async function archiveExistingSeason(seasonId: number): Promise<Season> {
    loading.value = true;
    error.value = null;

    try {
      const archivedSeason = await archiveSeason(seasonId);

      // Update local state
      const index = seasons.value.findIndex((s) => s.id === seasonId);
      if (index !== -1) {
        seasons.value[index] = archivedSeason;
      }

      if (currentSeason.value?.id === seasonId) {
        currentSeason.value = archivedSeason;
      }

      return archivedSeason;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive season';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Activate a season
   */
  async function activateExistingSeason(seasonId: number): Promise<Season> {
    loading.value = true;
    error.value = null;

    try {
      const activatedSeason = await activateSeason(seasonId);

      // Update local state
      const index = seasons.value.findIndex((s) => s.id === seasonId);
      if (index !== -1) {
        seasons.value[index] = activatedSeason;
      }

      if (currentSeason.value?.id === seasonId) {
        currentSeason.value = activatedSeason;
      }

      return activatedSeason;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate season';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Complete a season
   */
  async function completeExistingSeason(seasonId: number): Promise<Season> {
    loading.value = true;
    error.value = null;

    try {
      const completedSeason = await completeSeason(seasonId);

      // Update local state
      const index = seasons.value.findIndex((s) => s.id === seasonId);
      if (index !== -1) {
        seasons.value[index] = completedSeason;
      }

      if (currentSeason.value?.id === seasonId) {
        currentSeason.value = completedSeason;
      }

      return completedSeason;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete season';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a season (soft delete)
   */
  async function deleteExistingSeason(seasonId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await deleteSeason(seasonId);

      // Remove from local state
      seasons.value = seasons.value.filter((s) => s.id !== seasonId);

      if (currentSeason.value?.id === seasonId) {
        currentSeason.value = null;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete season';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Restore a deleted season
   */
  async function restoreDeletedSeason(seasonId: number): Promise<Season> {
    loading.value = true;
    error.value = null;

    try {
      const restoredSeason = await restoreSeason(seasonId);

      // Add back to local state
      seasons.value.push(restoredSeason);

      return restoredSeason;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore season';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Filters and pagination
  function setSearchQuery(query: string): void {
    searchQuery.value = query;
    currentPage.value = 1; // Reset to first page on search
  }

  function setStatusFilter(status: SeasonStatus | 'all'): void {
    statusFilter.value = status;
    currentPage.value = 1; // Reset to first page on filter
  }

  function nextPage(): void {
    if (hasNextPage.value) {
      currentPage.value += 1;
    }
  }

  function previousPage(): void {
    if (hasPreviousPage.value) {
      currentPage.value -= 1;
    }
  }

  function goToPage(page: number): void {
    if (page >= 1 && page <= lastPage.value) {
      currentPage.value = page;
    }
  }

  // Utility
  function resetFilters(): void {
    searchQuery.value = '';
    statusFilter.value = 'all';
    currentPage.value = 1;
  }

  function clearError(): void {
    error.value = null;
  }

  function resetStore(): void {
    seasons.value = [];
    currentSeason.value = null;
    loading.value = false;
    error.value = null;
    currentPage.value = 1;
    perPage.value = 10;
    totalSeasons.value = 0;
    lastPage.value = 1;
    searchQuery.value = '';
    statusFilter.value = 'all';
  }

  return {
    // State
    seasons,
    currentSeason,
    loading,
    error,
    currentPage,
    perPage,
    totalSeasons,
    lastPage,
    searchQuery,
    statusFilter,

    // Getters
    activeSeasons,
    archivedSeasons,
    seasonsByStatus,
    paginatedSeasons,
    hasNextPage,
    hasPreviousPage,

    // Actions
    fetchSeasons,
    fetchSeason,
    createNewSeason,
    updateExistingSeason,
    archiveExistingSeason,
    activateExistingSeason,
    completeExistingSeason,
    deleteExistingSeason,
    restoreDeletedSeason,

    // Filters
    setSearchQuery,
    setStatusFilter,
    nextPage,
    previousPage,
    goToPage,

    // Utility
    resetFilters,
    clearError,
    resetStore,
  };
});
