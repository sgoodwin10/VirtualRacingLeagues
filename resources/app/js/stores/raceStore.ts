import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Race, CreateRaceRequest, UpdateRaceRequest } from '@app/types/race';
import * as raceService from '@app/services/raceService';

export const useRaceStore = defineStore('race', () => {
  // State
  const races = ref<Race[]>([]);
  const currentRace = ref<Race | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

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
    loading.value = true;
    error.value = null;
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
      error.value = err instanceof Error ? err.message : 'Failed to fetch races';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRace(raceId: number): Promise<Race> {
    loading.value = true;
    error.value = null;
    try {
      const data = await raceService.getRace(raceId);
      currentRace.value = data;
      // Update in races array if exists
      const index = races.value.findIndex((r) => r.id === raceId);
      if (index !== -1) {
        races.value[index] = data;
      } else {
        races.value.push(data);
      }
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch race';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createNewRace(roundId: number, data: CreateRaceRequest): Promise<Race> {
    loading.value = true;
    error.value = null;
    try {
      const newRace = await raceService.createRace(roundId, data);
      races.value.push(newRace);
      return newRace;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create race';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateExistingRace(raceId: number, data: UpdateRaceRequest): Promise<Race> {
    loading.value = true;
    error.value = null;
    try {
      const updatedRace = await raceService.updateRace(raceId, data);
      const index = races.value.findIndex((r) => r.id === raceId);
      if (index !== -1) {
        races.value[index] = updatedRace;
      }
      if (currentRace.value?.id === raceId) {
        currentRace.value = updatedRace;
      }
      return updatedRace;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update race';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteExistingRace(raceId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await raceService.deleteRace(raceId);
      races.value = races.value.filter((r) => r.id !== raceId);
      if (currentRace.value?.id === raceId) {
        currentRace.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete race';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function clearCurrentRace(): void {
    currentRace.value = null;
  }

  function $reset(): void {
    races.value = [];
    currentRace.value = null;
    loading.value = false;
    error.value = null;
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
