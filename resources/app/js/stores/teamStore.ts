/**
 * Team Store
 * Manages team state and operations for a season
 */

import { defineStore } from 'pinia';
import { computed } from 'vue';
import type {
  Team,
  CreateTeamPayload,
  UpdateTeamPayload,
  AssignDriverTeamPayload,
} from '@app/types/team';
import {
  getTeams,
  createTeam as createTeamApi,
  updateTeam as updateTeamApi,
  deleteTeam as deleteTeamApi,
  assignDriverToTeam as assignDriverToTeamApi,
  buildCreateTeamFormData,
  buildUpdateTeamFormData,
} from '@app/services/teamService';
import { useCrudStore } from '@app/composables/useCrudStore';

export const useTeamStore = defineStore('team', () => {
  // Use CRUD composable
  const crud = useCrudStore<Team>();
  const {
    items: teams,
    loading,
    error,
    setLoading,
    setError,
    setItems,
    addItem,
    updateItemInList,
    removeItemFromList,
    clearError,
    resetStore,
  } = crud;

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
    setLoading(true);
    setError(null);

    try {
      const fetchedTeams = await getTeams(seasonId);
      setItems(fetchedTeams);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teams';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new team
   */
  async function createTeam(seasonId: number, payload: CreateTeamPayload): Promise<Team> {
    setLoading(true);
    setError(null);

    try {
      const formData = buildCreateTeamFormData(payload);
      const team = await createTeamApi(seasonId, formData);
      addItem(team);
      return team;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
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
    setLoading(true);
    setError(null);

    try {
      const formData = buildUpdateTeamFormData(payload);
      const updatedTeam = await updateTeamApi(seasonId, teamId, formData);
      updateItemInList(updatedTeam);
      return updatedTeam;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete team
   */
  async function deleteTeam(seasonId: number, teamId: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      await deleteTeamApi(seasonId, teamId);
      removeItemFromList(teamId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
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
    setError(null);

    try {
      await assignDriverToTeamApi(seasonId, seasonDriverId, payload);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign driver to team';
      setError(errorMessage);
      throw err;
    }
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
