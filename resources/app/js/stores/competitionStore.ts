/**
 * Competition Store
 * Manages competition state and operations
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Competition, CompetitionForm, CompetitionFilters } from '@app/types/competition';
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

export const useCompetitionStore = defineStore('competition', () => {
  // State
  const competitions = ref<Competition[]>([]);
  const currentCompetition = ref<Competition | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

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
    loading.value = true;
    error.value = null;

    try {
      competitions.value = await getLeagueCompetitions(leagueId, filters);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load competitions';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a specific competition
   */
  async function fetchCompetition(id: number): Promise<Competition> {
    loading.value = true;
    error.value = null;

    try {
      const competition = await getCompetition(id);
      currentCompetition.value = competition;
      return competition;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load competition';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
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

    loading.value = true;
    error.value = null;

    try {
      const formData = buildCompetitionFormData({
        name: form.name,
        description: form.description,
        platform_id: form.platform_id,
        logo: form.logo,
      });

      const competition = await createCompetition(leagueId, formData);
      competitions.value.push(competition);
      currentCompetition.value = competition;
      return competition;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create competition';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing competition
   */
  async function updateExistingCompetition(
    id: number,
    form: Partial<CompetitionForm>,
  ): Promise<Competition> {
    loading.value = true;
    error.value = null;

    try {
      const formData = buildUpdateCompetitionFormData({
        name: form.name,
        description: form.description,
        logo: form.logo,
      });

      const updatedCompetition = await updateCompetition(id, formData);

      // Update in local state
      const index = competitions.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        competitions.value[index] = updatedCompetition;
      }

      if (currentCompetition.value?.id === id) {
        currentCompetition.value = updatedCompetition;
      }

      return updatedCompetition;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update competition';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Archive a competition
   */
  async function archiveExistingCompetition(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

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
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a competition permanently
   */
  async function deleteExistingCompetition(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await deleteCompetition(id);

      // Remove from local state
      competitions.value = competitions.value.filter((c) => c.id !== id);

      if (currentCompetition.value?.id === id) {
        currentCompetition.value = null;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete competition';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear error
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Clear current competition
   */
  function clearCurrentCompetition(): void {
    currentCompetition.value = null;
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
    clearError,
    clearCurrentCompetition,
  };
});
