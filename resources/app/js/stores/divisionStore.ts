/**
 * Division Store
 * Manages division state and operations for a season
 */

import { defineStore } from 'pinia';
import { computed } from 'vue';
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
import { useCrudStore } from '@app/composables/useCrudStore';

export const useDivisionStore = defineStore('division', () => {
  // Use CRUD composable
  const crud = useCrudStore<Division>();
  const {
    items: divisions,
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
    setLoading(true);
    setError(null);

    try {
      const fetchedDivisions = await getDivisions(seasonId);
      setItems(fetchedDivisions);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load divisions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new division
   */
  async function createDivision(
    seasonId: number,
    payload: CreateDivisionPayload,
  ): Promise<Division> {
    setLoading(true);
    setError(null);

    try {
      const formData = buildCreateDivisionFormData(payload);
      const division = await createDivisionApi(seasonId, formData);
      addItem(division);
      return division;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create division';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
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
    setLoading(true);
    setError(null);

    try {
      const formData = buildUpdateDivisionFormData(payload);
      const updatedDivision = await updateDivisionApi(seasonId, divisionId, formData);
      updateItemInList(updatedDivision);
      return updatedDivision;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update division';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete division
   */
  async function deleteDivision(seasonId: number, divisionId: number): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      await deleteDivisionApi(seasonId, divisionId);
      removeItemFromList(divisionId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete division';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
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
      setError(errorMessage);
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
    setError(null);

    try {
      await assignDriverDivisionApi(seasonId, seasonDriverId, payload);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to assign driver to division';
      setError(errorMessage);
      throw err;
    }
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
