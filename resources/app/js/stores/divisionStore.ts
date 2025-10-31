/**
 * Division Store
 * Manages division state and operations for a season
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Division,
  CreateDivisionPayload,
  UpdateDivisionPayload,
  AssignDriverDivisionPayload,
} from '@app/types/division';
import {
  getDivisions,
  createDivision as createDivisionApi,
  updateDivision as updateDivisionApi,
  deleteDivision as deleteDivisionApi,
  assignDriverDivision as assignDriverDivisionApi,
  getDriverCount as getDriverCountApi,
  buildCreateDivisionFormData,
  buildUpdateDivisionFormData,
} from '@app/services/divisionService';

export const useDivisionStore = defineStore('division', () => {
  // State
  const divisions = ref<Division[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const getDivisionById = computed(() => {
    return (divisionId: number): Division | undefined => {
      return divisions.value.find((division) => division.id === divisionId);
    };
  });

  const getDivisionsBySeasonId = computed(() => {
    return (seasonId: number): Division[] => {
      return divisions.value.filter((division) => division.season_id === seasonId);
    };
  });

  const divisionCount = computed(() => divisions.value.length);

  const hasDivisions = computed(() => divisions.value.length > 0);

  // Actions

  /**
   * Fetch all divisions for a season
   */
  async function fetchDivisions(seasonId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      divisions.value = await getDivisions(seasonId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load divisions';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new division
   */
  async function createDivision(
    seasonId: number,
    payload: CreateDivisionPayload,
  ): Promise<Division> {
    loading.value = true;
    error.value = null;

    try {
      const formData = buildCreateDivisionFormData(payload);
      const division = await createDivisionApi(seasonId, formData);
      divisions.value.push(division);
      return division;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create division';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update division
   */
  async function updateDivision(
    seasonId: number,
    divisionId: number,
    payload: UpdateDivisionPayload,
  ): Promise<Division> {
    loading.value = true;
    error.value = null;

    try {
      const formData = buildUpdateDivisionFormData(payload);
      const updatedDivision = await updateDivisionApi(seasonId, divisionId, formData);

      // Update in local state
      const index = divisions.value.findIndex((division) => division.id === divisionId);
      if (index !== -1) {
        divisions.value[index] = updatedDivision;
      }

      return updatedDivision;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update division';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete division
   */
  async function deleteDivision(seasonId: number, divisionId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await deleteDivisionApi(seasonId, divisionId);

      // Remove from local state
      divisions.value = divisions.value.filter((division) => division.id !== divisionId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete division';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get driver count for a division
   */
  async function getDriverCount(seasonId: number, divisionId: number): Promise<number> {
    try {
      return await getDriverCountApi(seasonId, divisionId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get driver count';
      error.value = errorMessage;
      throw err;
    }
  }

  /**
   * Assign driver to division
   */
  async function assignDriverDivision(
    seasonId: number,
    seasonDriverId: number,
    payload: AssignDriverDivisionPayload,
  ): Promise<void> {
    error.value = null;

    try {
      await assignDriverDivisionApi(seasonId, seasonDriverId, payload);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to assign driver to division';
      error.value = errorMessage;
      throw err;
    }
  }

  // Utility
  function clearError(): void {
    error.value = null;
  }

  function resetStore(): void {
    divisions.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    divisions,
    loading,
    error,

    // Getters
    getDivisionById,
    getDivisionsBySeasonId,
    divisionCount,
    hasDivisions,

    // Actions
    fetchDivisions,
    createDivision,
    updateDivision,
    deleteDivision,
    getDriverCount,
    assignDriverDivision,

    // Utility
    clearError,
    resetStore,
  };
});
