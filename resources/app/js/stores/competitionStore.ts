/**
 * Competition Store
 * Manages competition state and operations
 */

import { defineStore } from 'pinia';
import { computed, onScopeDispose } from 'vue';
import type {
  Competition,
  CompetitionForm,
  CompetitionFilters,
  CompetitionSeason,
} from '@app/types/competition';
import {
  getLeagueCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  archiveCompetition,
  deleteCompetition,
  buildCompetitionFormData,
  buildUpdateCompetitionFormData,
} from '@app/services/competitionService';
import { useStoreEvents } from '@app/composables/useStoreEvents';
import { useCrudStore } from '@app/composables/useCrudStore';
import { getErrorMessage } from '@app/types/errors';

// Import EventHandler type from useStoreEvents for compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (...args: any[]) => void;

export const useCompetitionStore = defineStore('competition', () => {
  // Use CRUD composable for competition management
  const crud = useCrudStore<Competition>();
  const {
    items: competitions,
    currentItem: currentCompetition,
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

  // Set up event listeners for season events with cleanup
  // Using a flag to ensure event handlers are only registered once per store instance
  const events = useStoreEvents();
  let listenersRegistered = false;

  // Track all registered handlers so we can clean them up properly
  const registeredHandlers = new Map<string, EventHandler[]>();

  /**
   * Register event listeners for season events
   * This function is idempotent - it will only register listeners once
   */
  function setupEventListeners(): void {
    if (listenersRegistered) {
      return;
    }

    // Define all event handlers
    const seasonCreatedHandler = (competitionId: number, season: CompetitionSeason) => {
      addSeasonToCompetition(competitionId, season);
    };
    const seasonUpdatedHandler = (competitionId: number, season: CompetitionSeason) => {
      updateSeasonInCompetition(competitionId, season);
    };
    const seasonDeletedHandler = (competitionId: number, seasonId: number) => {
      removeSeasonFromCompetition(competitionId, seasonId);
    };
    const seasonArchivedHandler = (competitionId: number, season: CompetitionSeason) => {
      updateSeasonInCompetition(competitionId, season);
    };
    const seasonUnarchivedHandler = (competitionId: number, season: CompetitionSeason) => {
      updateSeasonInCompetition(competitionId, season);
    };
    const seasonActivatedHandler = (competitionId: number, season: CompetitionSeason) => {
      updateSeasonInCompetition(competitionId, season);
    };
    const seasonCompletedHandler = (competitionId: number, season: CompetitionSeason) => {
      updateSeasonInCompetition(competitionId, season);
    };
    const seasonRestoredHandler = (competitionId: number, season: CompetitionSeason) => {
      addSeasonToCompetition(competitionId, season);
    };

    // Register all season event handlers
    events.on('season:created', seasonCreatedHandler);
    events.on('season:updated', seasonUpdatedHandler);
    events.on('season:deleted', seasonDeletedHandler);
    events.on('season:archived', seasonArchivedHandler);
    events.on('season:unarchived', seasonUnarchivedHandler);
    events.on('season:activated', seasonActivatedHandler);
    events.on('season:completed', seasonCompletedHandler);
    events.on('season:restored', seasonRestoredHandler);

    // Store references to all handlers for cleanup
    registeredHandlers.set('season:created', [seasonCreatedHandler]);
    registeredHandlers.set('season:updated', [seasonUpdatedHandler]);
    registeredHandlers.set('season:deleted', [seasonDeletedHandler]);
    registeredHandlers.set('season:archived', [seasonArchivedHandler]);
    registeredHandlers.set('season:unarchived', [seasonUnarchivedHandler]);
    registeredHandlers.set('season:activated', [seasonActivatedHandler]);
    registeredHandlers.set('season:completed', [seasonCompletedHandler]);
    registeredHandlers.set('season:restored', [seasonRestoredHandler]);

    listenersRegistered = true;

    // Clean up only this store's event listeners when store scope is disposed
    onScopeDispose(() => {
      registeredHandlers.forEach((handlers, eventName) => {
        handlers.forEach((handler) => {
          events.off(eventName, handler);
        });
      });
      registeredHandlers.clear();
      listenersRegistered = false;
    });
  }

  // Register listeners immediately
  setupEventListeners();

  // Getters
  const activeCompetitions = computed(() => competitions.value.filter((c) => c.is_active));

  const archivedCompetitions = computed(() => competitions.value.filter((c) => c.is_archived));

  const competitionsByPlatform = computed(() => {
    const grouped: Record<number, Competition[]> = {};
    competitions.value.forEach((comp) => {
      if (!grouped[comp.platform_id]) {
        grouped[comp.platform_id] = [];
      }
      // Non-null assertion: platformGroup will always exist after the check above
      grouped[comp.platform_id]!.push(comp);
    });
    return grouped;
  });

  // Actions

  /**
   * Fetch all competitions for a league
   */
  async function fetchCompetitions(leagueId: number, filters?: CompetitionFilters): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const fetchedCompetitions = await getLeagueCompetitions(leagueId, filters);
      setItems(fetchedCompetitions);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load competitions');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetch a specific competition
   */
  async function fetchCompetition(id: number): Promise<Competition> {
    setLoading(true);
    setError(null);

    try {
      const competition = await getCompetition(id);
      setCurrentItem(competition);
      return competition;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to load competition');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new competition
   */
  async function createNewCompetition(
    leagueId: number,
    form: CompetitionForm,
  ): Promise<Competition> {
    if (!form.platform_id) {
      throw new Error('Platform is required');
    }

    setLoading(true);
    setError(null);

    try {
      const formData = buildCompetitionFormData({
        name: form.name,
        description: form.description,
        platform_id: form.platform_id,
        logo: form.logo,
        competition_colour: form.competition_colour
          ? JSON.stringify(form.competition_colour)
          : null,
      });

      const competition = await createCompetition(leagueId, formData);
      addItem(competition);
      setCurrentItem(competition);
      return competition;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to create competition');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update an existing competition
   */
  async function updateExistingCompetition(
    id: number,
    form: Partial<CompetitionForm>,
  ): Promise<Competition> {
    setLoading(true);
    setError(null);

    try {
      const formData = buildUpdateCompetitionFormData({
        name: form.name,
        description: form.description,
        logo: form.logo,
        competition_colour:
          form.competition_colour !== undefined
            ? form.competition_colour
              ? JSON.stringify(form.competition_colour)
              : null
            : undefined,
      });

      const updatedCompetition = await updateCompetition(id, formData);
      updateItemInList(updatedCompetition);
      return updatedCompetition;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to update competition');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Archive a competition
   */
  async function archiveExistingCompetition(id: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      await archiveCompetition(id);

      // Update local state using updateItemInList for consistency
      const comp = competitions.value.find((c) => c.id === id);
      if (comp) {
        const updatedComp: Competition = {
          ...comp,
          is_archived: true,
          is_active: false,
          status: 'archived',
          archived_at: new Date().toISOString(),
        };
        updateItemInList(updatedComp);
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to archive competition');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete a competition permanently
   */
  async function deleteExistingCompetition(id: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      await deleteCompetition(id);
      removeItemFromList(id);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to delete competition');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Clear current competition
   */
  function clearCurrentCompetition(): void {
    setCurrentItem(null);
  }

  /**
   * Add a season to a specific competition (reactive update)
   * This is called when a season is created to update the local competition state
   */
  function addSeasonToCompetition(competitionId: number, season: CompetitionSeason): void {
    // Update competition in the list
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (competition) {
      if (!competition.seasons) {
        competition.seasons = [];
      }

      // Validate season doesn't already exist before adding
      const seasonExists = competition.seasons.some((s) => s.id === season.id);
      if (!seasonExists) {
        competition.seasons.push(season);

        // Increment total_seasons count and reassign entire stats object to ensure reactivity
        // We increment rather than using array length because the backend stats may differ
        // from the locally loaded seasons (e.g., pagination, lazy loading)
        if (competition.stats) {
          competition.stats = {
            ...competition.stats,
            total_seasons: (competition.stats.total_seasons || 0) + 1,
          };
        }
      }

      // If currentCompetition points to the same object reference, we're done
      // No need to update it separately as they share the same reference
      if (currentCompetition.value === competition) {
        return;
      }
    }

    // Only update currentCompetition if it's a DIFFERENT object reference
    // This prevents duplicate additions when both point to the same object
    if (
      currentCompetition.value?.id === competitionId &&
      currentCompetition.value !== competition
    ) {
      if (!currentCompetition.value.seasons) {
        currentCompetition.value.seasons = [];
      }

      // Validate season doesn't already exist before adding
      const seasonExists = currentCompetition.value.seasons.some((s) => s.id === season.id);
      if (!seasonExists) {
        currentCompetition.value.seasons.push(season);
        if (currentCompetition.value.stats) {
          currentCompetition.value.stats = {
            ...currentCompetition.value.stats,
            total_seasons: (currentCompetition.value.stats.total_seasons || 0) + 1,
          };
        }
      }
    }
  }

  /**
   * Update a season in a specific competition (reactive update)
   * This is called when a season is updated to update the local competition state
   */
  function updateSeasonInCompetition(competitionId: number, season: CompetitionSeason): void {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (competition?.seasons) {
      const index = competition.seasons.findIndex((s) => s.id === season.id);
      if (index !== -1) {
        // Use splice for guaranteed reactivity
        competition.seasons.splice(index, 1, season);
      }
    }

    // Also update currentCompetition if it matches AND it's a different object reference
    if (
      currentCompetition.value?.id === competitionId &&
      currentCompetition.value !== competition &&
      currentCompetition.value.seasons
    ) {
      const index = currentCompetition.value.seasons.findIndex((s) => s.id === season.id);
      if (index !== -1) {
        // Use splice for guaranteed reactivity
        currentCompetition.value.seasons.splice(index, 1, season);
      }
    }
  }

  /**
   * Remove a season from a specific competition (reactive update)
   * This is called when a season is deleted to update the local competition state
   */
  function removeSeasonFromCompetition(competitionId: number, seasonId: number): void {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (competition?.seasons) {
      // Filter out the deleted season (creates new array reference for better reactivity)
      competition.seasons = competition.seasons.filter((s) => s.id !== seasonId);
      // Derive stats from actual data instead of manual decrement
      // Reassign entire stats object to ensure reactivity
      if (competition.stats) {
        competition.stats = {
          ...competition.stats,
          total_seasons: competition.seasons.length,
        };
      }
    }

    // Also update currentCompetition if it matches AND it's a different object reference
    if (
      currentCompetition.value?.id === competitionId &&
      currentCompetition.value !== competition &&
      currentCompetition.value.seasons
    ) {
      currentCompetition.value.seasons = currentCompetition.value.seasons.filter(
        (s) => s.id !== seasonId,
      );
      if (currentCompetition.value.stats) {
        currentCompetition.value.stats = {
          ...currentCompetition.value.stats,
          total_seasons: currentCompetition.value.seasons.length,
        };
      }
    }
  }

  return {
    // State
    competitions,
    currentCompetition,
    loading,
    error,

    // Getters
    activeCompetitions,
    archivedCompetitions,
    competitionsByPlatform,

    // Actions
    fetchCompetitions,
    fetchCompetition,
    createNewCompetition,
    updateExistingCompetition,
    archiveExistingCompetition,
    deleteExistingCompetition,
    clearCurrentCompetition,

    // Season management (for reactive updates)
    addSeasonToCompetition,
    updateSeasonInCompetition,
    removeSeasonFromCompetition,

    // Utility
    clearError,
    resetStore,

    // Test helpers (for mocking in tests)
    setLoading,
    setItems,
    setError,
  };
});
