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
  ReorderDivisionsPayload,
} from '@app/types/division';
import {
  getDivisions,
  createDivision as createDivisionApi,
  updateDivision as updateDivisionApi,
  deleteDivision as deleteDivisionApi,
  assignDriverDivision as assignDriverDivisionApi,
  getDriverCount as getDriverCountApi,
  reorderDivisions as reorderDivisionsApi,
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

  const sortedDivisions = computed(() => {
    return [...divisions.value].sort((a, b) => a.order - b.order);
  });

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
      // Preserve original error context while providing user-friendly message
      const errorMessage =
        err instanceof Error && err.message
          ? `Failed to load divisions: ${err.message}`
          : 'Failed to load divisions';
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
      // Preserve original error context while providing user-friendly message
      const errorMessage =
        err instanceof Error && err.message
          ? `Failed to create division: ${err.message}`
          : 'Failed to create division';
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
      // Preserve original error context while providing user-friendly message
      const errorMessage =
        err instanceof Error && err.message
          ? `Failed to update division: ${err.message}`
          : 'Failed to update division';
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
      // Preserve original error context while providing user-friendly message
      const errorMessage =
        err instanceof Error && err.message
          ? `Failed to delete division: ${err.message}`
          : 'Failed to delete division';
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
      // Preserve original error context while providing user-friendly message
      const errorMessage =
        err instanceof Error && err.message
          ? `Failed to get driver count: ${err.message}`
          : 'Failed to get driver count';
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
      // Preserve original error context while providing user-friendly message
      const errorMessage =
        err instanceof Error && err.message
          ? `Failed to assign driver to division: ${err.message}`
          : 'Failed to assign driver to division';
      setError(errorMessage);
      throw err;
    }
  }

  /**
   * Reorder divisions
   * Note: Loading state is NOT set here because we use optimistic updates
   * and the component tracks reordering state locally for better UX
   */
  async function reorderDivisions(
    seasonId: number,
    newOrder: Array<{ id: number; order: number }>,
  ): Promise<void> {
    // Deep clone previous state for reliable rollback
    const previousDivisions = divisions.value.map((division) => ({ ...division }));

    setError(null);

    try {
      // Optimistic update - apply the new order to current divisions
      const updatedDivisions = divisions.value.map((division) => {
        const update = newOrder.find((u) => u.id === division.id);
        return update ? { ...division, order: update.order } : division;
      });
      setItems(updatedDivisions);

      // API call - use server response as source of truth
      const payload: ReorderDivisionsPayload = { divisions: newOrder };
      const serverDivisions = await reorderDivisionsApi(seasonId, payload);

      // Always use server response to ensure consistency
      setItems(serverDivisions);
    } catch (err: unknown) {
      // Rollback to exact previous state on any error
      setItems(previousDivisions);
      // Preserve original error context while providing user-friendly message
      const errorMessage =
        err instanceof Error && err.message
          ? `Failed to reorder divisions: ${err.message}`
          : 'Failed to reorder divisions';
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
    sortedDivisions,

    // Actions
    fetchDivisions,
    createDivision,
    updateDivision,
    deleteDivision,
    getDriverCount,
    assignDriverDivision,
    reorderDivisions,

    // Utility
    clearError,
    resetStore,
  };
});
