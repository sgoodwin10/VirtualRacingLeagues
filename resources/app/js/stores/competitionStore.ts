/**
 * Competition Store
 * Manages competition state and operations
 */

import { defineStore } from 'pinia';
import { computed } from 'vue';
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

  // Set up event listeners for season events
  const events = useStoreEvents();

  events.on('season:created', (competitionId: number, season: CompetitionSeason) => {
    addSeasonToCompetition(competitionId, season);
  });

  events.on('season:updated', (competitionId: number, season: CompetitionSeason) => {
    updateSeasonInCompetition(competitionId, season);
  });

  events.on('season:deleted', (competitionId: number, seasonId: number) => {
    removeSeasonFromCompetition(competitionId, seasonId);
  });

  events.on('season:archived', (competitionId: number, season: CompetitionSeason) => {
    updateSeasonInCompetition(competitionId, season);
  });

  events.on('season:unarchived', (competitionId: number, season: CompetitionSeason) => {
    updateSeasonInCompetition(competitionId, season);
  });

  events.on('season:activated', (competitionId: number, season: CompetitionSeason) => {
    updateSeasonInCompetition(competitionId, season);
  });

  events.on('season:completed', (competitionId: number, season: CompetitionSeason) => {
    updateSeasonInCompetition(competitionId, season);
  });

  events.on('season:restored', (competitionId: number, season: CompetitionSeason) => {
    addSeasonToCompetition(competitionId, season);
  });

  // Getters
  const activeCompetitions = computed(() => competitions.value.filter((c) => c.is_active));

  const archivedCompetitions = computed(() => competitions.value.filter((c) => c.is_archived));

  const competitionsByPlatform = computed(() => {
    const grouped: Record<number, Competition[]> = {};
    competitions.value.forEach((comp) => {
      if (!grouped[comp.platform_id]) {
        grouped[comp.platform_id] = [];
      }
      const platformGroup = grouped[comp.platform_id];
      if (platformGroup) {
        platformGroup.push(comp);
      }
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load competitions';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load competition';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to create competition';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to update competition';
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

      // Update local state
      const index = competitions.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        const comp = competitions.value[index];
        if (comp) {
          comp.is_archived = true;
          comp.is_active = false;
          comp.status = 'archived';
          comp.archived_at = new Date().toISOString();
        }
      }

      if (currentCompetition.value?.id === id) {
        currentCompetition.value.is_archived = true;
        currentCompetition.value.is_active = false;
        currentCompetition.value.status = 'archived';
        currentCompetition.value.archived_at = new Date().toISOString();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive competition';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete competition';
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
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (competition) {
      if (!competition.seasons) {
        competition.seasons = [];
      }
      competition.seasons.push(season);

      // Update stats
      competition.stats.total_seasons += 1;
    }

    // Also update currentCompetition if it matches AND it's a different object reference
    // (to avoid duplicate additions when currentCompetition is the same reference as the one in competitions array)
    if (
      currentCompetition.value?.id === competitionId &&
      currentCompetition.value !== competition
    ) {
      if (!currentCompetition.value.seasons) {
        currentCompetition.value.seasons = [];
      }
      currentCompetition.value.seasons.push(season);
      currentCompetition.value.stats.total_seasons += 1;
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
        competition.seasons[index] = season;
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
        currentCompetition.value.seasons[index] = season;
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
      competition.seasons = competition.seasons.filter((s) => s.id !== seasonId);
      competition.stats.total_seasons = Math.max(0, competition.stats.total_seasons - 1);
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
      currentCompetition.value.stats.total_seasons = Math.max(
        0,
        currentCompetition.value.stats.total_seasons - 1,
      );
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
