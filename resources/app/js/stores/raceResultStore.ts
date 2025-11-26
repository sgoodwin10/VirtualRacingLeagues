import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import raceResultService from '@app/services/raceResultService';
import type { RaceResult, BulkRaceResultsPayload } from '@app/types/raceResult';

export const useRaceResultStore = defineStore('raceResult', () => {
  // State
  const results = ref<RaceResult[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);
  const currentRaceId = ref<number | null>(null);

  // Getters
  const resultsByPosition = computed(() => {
    return [...results.value].sort((a, b) => {
      const posA = a.position ?? Infinity;
      const posB = b.position ?? Infinity;
      return posA - posB;
    });
  });

  const hasResults = computed(() => results.value.length > 0);

  // Actions
  async function fetchResults(raceId: number): Promise<void> {
    isLoading.value = true;
    error.value = null;
    currentRaceId.value = raceId;

    try {
      results.value = await raceResultService.getResults(raceId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch results';
      results.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function saveResults(
    raceId: number,
    payload: BulkRaceResultsPayload,
  ): Promise<RaceResult[]> {
    isSaving.value = true;
    error.value = null;

    try {
      const savedResults = await raceResultService.saveResults(raceId, payload);
      results.value = savedResults;
      return savedResults;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save results';
      throw err;
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteResults(raceId: number): Promise<void> {
    isSaving.value = true;
    error.value = null;

    try {
      await raceResultService.deleteResults(raceId);
      results.value = [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete results';
      throw err;
    } finally {
      isSaving.value = false;
    }
  }

  function clearResults(): void {
    results.value = [];
    currentRaceId.value = null;
    error.value = null;
  }

  return {
    // State
    results,
    isLoading,
    isSaving,
    error,
    currentRaceId,
    // Getters
    resultsByPosition,
    hasResults,
    // Actions
    fetchResults,
    saveResults,
    deleteResults,
    clearResults,
  };
});
