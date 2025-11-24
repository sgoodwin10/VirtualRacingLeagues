import { defineStore } from 'pinia';
import { computed } from 'vue';
import type { Race, CreateRaceRequest, UpdateRaceRequest } from '@app/types/race';
import * as raceService from '@app/services/raceService';
import { useCrudStore } from '@app/composables/useCrudStore';

export const useRaceStore = defineStore('race', () => {
  // Use CRUD composable
  const crud = useCrudStore<Race>();
  const {
    items: races,
    currentItem: currentRace,
    loading,
    error,
    setLoading,
    setError,
    setCurrentItem,
    addItem,
    updateItemInList,
    removeItemFromList,
    clearError,
    resetStore,
  } = crud;

  // Getters
  const racesByRoundId = computed(() => {
    return (roundId: number) => races.value.filter((race) => race.round_id === roundId);
  });

  const getRaceById = computed(() => {
    return (raceId: number) => races.value.find((race) => race.id === raceId);
  });

  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);

  // Actions
  async function fetchRaces(roundId: number): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      // Fetch both regular races and qualifier
      const [regularRaces, qualifier] = await Promise.all([
        raceService.getRaces(roundId),
        raceService.getQualifier(roundId),
      ]);

      // Combine races and qualifier (if exists)
      const allRaces = qualifier ? [...regularRaces, qualifier] : regularRaces;

      // Replace races for this round
      const existingRaces = races.value.filter((r) => r.round_id !== roundId);
      races.value = [...existingRaces, ...allRaces];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch races');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function fetchRace(raceId: number): Promise<Race> {
    setLoading(true);
    setError(null);
    try {
      const data = await raceService.getRace(raceId);
      setCurrentItem(data);
      // Update in races array if exists
      const index = races.value.findIndex((r) => r.id === raceId);
      if (index !== -1) {
        races.value[index] = data;
      } else {
        races.value.push(data);
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch race');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function createNewRace(roundId: number, data: CreateRaceRequest): Promise<Race> {
    setLoading(true);
    setError(null);
    try {
      const newRace = await raceService.createRace(roundId, data);
      addItem(newRace);
      return newRace;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create race');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateExistingRace(
    raceId: number,
    data: UpdateRaceRequest,
    isQualifier = false,
  ): Promise<Race> {
    setLoading(true);
    setError(null);
    try {
      const updatedRace = isQualifier
        ? await raceService.updateQualifier(raceId, data)
        : await raceService.updateRace(raceId, data);
      updateItemInList(updatedRace);
      return updatedRace;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to update ${isQualifier ? 'qualifier' : 'race'}`,
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function deleteExistingRace(raceId: number, isQualifier = false): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      if (isQualifier) {
        await raceService.deleteQualifier(raceId);
      } else {
        await raceService.deleteRace(raceId);
      }
      removeItemFromList(raceId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to delete ${isQualifier ? 'qualifier' : 'race'}`,
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function clearCurrentRace(): void {
    setCurrentItem(null);
  }

  function $reset(): void {
    resetStore();
  }

  return {
    // State
    races,
    currentRace,
    loading,
    error,
    // Getters
    racesByRoundId,
    getRaceById,
    isLoading,
    hasError,
    // Actions
    fetchRaces,
    fetchRace,
    createNewRace,
    updateExistingRace,
    deleteExistingRace,
    clearError,
    clearCurrentRace,
    $reset,
  };
});
