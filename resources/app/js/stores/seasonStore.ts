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
} from '@app/types/season';
import type { CompetitionSeason } from '@app/types/competition';
import {
  getSeasons,
  getSeasonById,
  createSeason,
  updateSeason,
  archiveSeason,
  unarchiveSeason,
  activateSeason,
  completeSeason,
  deleteSeason,
  restoreSeason,
  buildCreateSeasonFormData,
  buildUpdateSeasonFormData,
} from '@app/services/seasonService';
import { useStoreEvents } from '@app/composables/useStoreEvents';
import { useCrudStore } from '@app/composables/useCrudStore';
import { getErrorMessage } from '@app/types/errors';

export const useSeasonStore = defineStore('season', () => {
  // Use CRUD composable for season management
  const crud = useCrudStore<Season>();
  const {
    items: seasons,
    currentItem: currentSeason,
    loading,
    error,
    setLoading,
    setError,
    setItems,
    setCurrentItem,
    addItem,
    updateItemInList,
    removeItemFromList,
    clearError: clearCrudError,
  } = crud;

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
    // Prevent division by zero and validate page number
    if (perPage.value <= 0) {
      return seasons.value;
    }

    // Ensure currentPage is at least 1
    const validPage = Math.max(1, currentPage.value);
    const start = (validPage - 1) * perPage.value;
    const end = start + perPage.value;
    return seasons.value.slice(start, end);
  });

  // Helpers

  /**
   * Convert a Season to CompetitionSeason format
   * This is used to update the competition store when seasons change
   */
  function toCompetitionSeason(season: Season): CompetitionSeason {
    return {
      id: season.id,
      name: season.name,
      slug: season.slug,
      status: season.status,
      is_active: season.is_active,
      is_archived: season.is_archived,
      created_at: season.created_at,
      stats: {
        driver_count: season.stats?.total_drivers || 0,
        // Use fallback to 0 to ensure stats are always numbers
        round_count: season.stats?.total_rounds || 0,
        race_count: season.stats?.total_races || 0,
      },
    };
  }

  // Actions

  /**
   * Fetch all seasons for a competition
   * Note: Backend returns all seasons (not paginated). Pagination is done client-side.
   */
  async function fetchSeasons(competitionId: number, params?: SeasonQueryParams): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const queryParams: SeasonQueryParams = {
        search: params?.search || searchQuery.value || undefined,
        status: params?.status || (statusFilter.value !== 'all' ? statusFilter.value : undefined),
      };

      // Backend returns all seasons as a simple array
      const allSeasons: Season[] = await getSeasons(competitionId, queryParams);

      // Store all seasons
      setItems(allSeasons);

      // Client-side pagination calculations with validation
      totalSeasons.value = allSeasons.length;
      lastPage.value = perPage.value > 0 ? Math.ceil(allSeasons.length / perPage.value) || 1 : 1;

      // Ensure current page is valid
      if (currentPage.value > lastPage.value) {
        currentPage.value = lastPage.value;
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load seasons');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch a specific season
   */
  async function fetchSeason(seasonId: number): Promise<Season> {
    setLoading(true);
    setError(null);

    try {
      const season = await getSeasonById(seasonId);
      setCurrentItem(season);
      return season;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load season');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new season
   */
  async function createNewSeason(
    competitionId: number,
    data: CreateSeasonRequest,
  ): Promise<Season> {
    setLoading(true);
    setError(null);

    try {
      const formData = buildCreateSeasonFormData(data);
      const season = await createSeason(competitionId, formData);
      addItem(season);
      setCurrentItem(season);

      // Emit event for competition store to listen to (after successful API call)
      const events = useStoreEvents();
      events.emit('season:created', competitionId, toCompetitionSeason(season));

      return season;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to create season');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update an existing season
   */
  async function updateExistingSeason(
    seasonId: number,
    data: UpdateSeasonRequest,
  ): Promise<Season> {
    setLoading(true);
    setError(null);

    try {
      const formData = buildUpdateSeasonFormData(data);
      const updatedSeason = await updateSeason(seasonId, formData);

      // Update in local state
      updateItemInList(updatedSeason);

      // Emit event for competition store to listen to
      const events = useStoreEvents();
      events.emit(
        'season:updated',
        updatedSeason.competition_id,
        toCompetitionSeason(updatedSeason),
      );

      return updatedSeason;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to update season');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Archive a season
   */
  async function archiveExistingSeason(seasonId: number): Promise<Season> {
    setLoading(true);
    setError(null);

    try {
      const archivedSeason = await archiveSeason(seasonId);

      // Update local state using consistent CRUD method
      updateItemInList(archivedSeason);

      // Emit event for competition store to listen to
      const events = useStoreEvents();
      events.emit(
        'season:archived',
        archivedSeason.competition_id,
        toCompetitionSeason(archivedSeason),
      );

      return archivedSeason;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to archive season');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Activate a season
   */
  async function activateExistingSeason(seasonId: number): Promise<Season> {
    setLoading(true);
    setError(null);

    try {
      const activatedSeason = await activateSeason(seasonId);

      // Update local state using consistent CRUD method
      updateItemInList(activatedSeason);

      // Emit event for competition store to listen to
      const events = useStoreEvents();
      events.emit(
        'season:activated',
        activatedSeason.competition_id,
        toCompetitionSeason(activatedSeason),
      );

      return activatedSeason;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to activate season');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Complete a season
   */
  async function completeExistingSeason(seasonId: number): Promise<Season> {
    setLoading(true);
    setError(null);

    try {
      const completedSeason = await completeSeason(seasonId);

      // Update local state using consistent CRUD method
      updateItemInList(completedSeason);

      // Emit event for competition store to listen to
      const events = useStoreEvents();
      events.emit(
        'season:completed',
        completedSeason.competition_id,
        toCompetitionSeason(completedSeason),
      );

      return completedSeason;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to complete season');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete a season (soft delete)
   * @param seasonId - The ID of the season to delete
   * @param competitionId - Competition ID (optional, will try to get from store if not provided)
   */
  async function deleteExistingSeason(seasonId: number, competitionId?: number): Promise<void> {
    // Try to get competitionId from the season in the store if not provided
    let finalCompetitionId = competitionId;
    if (!finalCompetitionId) {
      const season = seasons.value.find((s) => s.id === seasonId);
      if (season) {
        finalCompetitionId = season.competition_id;
      }
    }

    if (!finalCompetitionId) {
      throw new Error(
        'competitionId is required for deleteExistingSeason to maintain UI consistency. ' +
          'Provide it as a parameter or ensure the season exists in the store.',
      );
    }

    setLoading(true);
    setError(null);

    try {
      await deleteSeason(seasonId);

      // Remove from local state
      removeItemFromList(seasonId);

      // Emit event for competition store to listen to
      const events = useStoreEvents();
      events.emit('season:deleted', finalCompetitionId, seasonId);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to delete season');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Unarchive a season (restore from archived state)
   */
  async function unarchiveExistingSeason(seasonId: number): Promise<Season> {
    setLoading(true);
    setError(null);

    try {
      const unarchivedSeason = await unarchiveSeason(seasonId);

      // Update local state using consistent CRUD method
      updateItemInList(unarchivedSeason);

      // Emit event for competition store to listen to
      const events = useStoreEvents();
      events.emit(
        'season:unarchived',
        unarchivedSeason.competition_id,
        toCompetitionSeason(unarchivedSeason),
      );

      return unarchivedSeason;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to unarchive season');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Restore a deleted season
   */
  async function restoreDeletedSeason(seasonId: number): Promise<Season> {
    setLoading(true);
    setError(null);

    try {
      const restoredSeason = await restoreSeason(seasonId);

      // Add back to local state
      addItem(restoredSeason);

      // Emit event for competition store to listen to
      const events = useStoreEvents();
      events.emit(
        'season:restored',
        restoredSeason.competition_id,
        toCompetitionSeason(restoredSeason),
      );

      return restoredSeason;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to restore season');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
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
    // Validate that page is an integer
    if (!Number.isInteger(page)) {
      throw new Error(`Page must be an integer, received: ${page}`);
    }

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
    clearCrudError();
  }

  function resetStore(): void {
    crud.resetStore();
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
    unarchiveExistingSeason,
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
