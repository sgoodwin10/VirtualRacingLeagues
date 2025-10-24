/**
 * Team Store
 * Manages team state and operations for a season
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Team,
  CreateTeamPayload,
  UpdateTeamPayload,
  AssignDriverTeamPayload,
} from '@user/types/team';
import {
  getTeams,
  createTeam as createTeamApi,
  updateTeam as updateTeamApi,
  deleteTeam as deleteTeamApi,
  assignDriverToTeam as assignDriverToTeamApi,
  buildCreateTeamFormData,
  buildUpdateTeamFormData,
} from '@user/services/teamService';

export const useTeamStore = defineStore('team', () => {
  // State
  const teams = ref<Team[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const getTeamById = computed(() => {
    return (teamId: number): Team | undefined => {
      return teams.value.find((team) => team.id === teamId);
    };
  });

  const getTeamsBySeasonId = computed(() => {
    return (seasonId: number): Team[] => {
      return teams.value.filter((team) => team.season_id === seasonId);
    };
  });

  const teamCount = computed(() => teams.value.length);

  const hasTeams = computed(() => teams.value.length > 0);

  // Actions

  /**
   * Fetch all teams for a season
   */
  async function fetchTeams(seasonId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      teams.value = await getTeams(seasonId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teams';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new team
   */
  async function createTeam(seasonId: number, payload: CreateTeamPayload): Promise<Team> {
    loading.value = true;
    error.value = null;

    try {
      const formData = buildCreateTeamFormData(payload);
      const team = await createTeamApi(seasonId, formData);
      teams.value.push(team);
      return team;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update team
   */
  async function updateTeam(
    seasonId: number,
    teamId: number,
    payload: UpdateTeamPayload,
  ): Promise<Team> {
    loading.value = true;
    error.value = null;

    try {
      const formData = buildUpdateTeamFormData(payload);
      const updatedTeam = await updateTeamApi(seasonId, teamId, formData);

      // Update in local state
      const index = teams.value.findIndex((team) => team.id === teamId);
      if (index !== -1) {
        teams.value[index] = updatedTeam;
      }

      return updatedTeam;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete team
   */
  async function deleteTeam(seasonId: number, teamId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await deleteTeamApi(seasonId, teamId);

      // Remove from local state
      teams.value = teams.value.filter((team) => team.id !== teamId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Assign driver to team
   */
  async function assignDriverToTeam(
    seasonId: number,
    seasonDriverId: number,
    payload: AssignDriverTeamPayload,
  ): Promise<void> {
    error.value = null;

    try {
      await assignDriverToTeamApi(seasonId, seasonDriverId, payload);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign driver to team';
      error.value = errorMessage;
      throw err;
    }
  }

  // Utility
  function clearError(): void {
    error.value = null;
  }

  function resetStore(): void {
    teams.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    teams,
    loading,
    error,

    // Getters
    getTeamById,
    getTeamsBySeasonId,
    teamCount,
    hasTeams,

    // Actions
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    assignDriverToTeam,

    // Utility
    clearError,
    resetStore,
  };
});
