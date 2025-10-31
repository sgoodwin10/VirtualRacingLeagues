import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Round, CreateRoundRequest, UpdateRoundRequest } from '@app/types/round';
import * as roundService from '@app/services/roundService';

export const useRoundStore = defineStore('round', () => {
  // State
  const rounds = ref<Round[]>([]);
  const currentRound = ref<Round | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const roundsBySeasonId = computed(() => {
    return (seasonId: number) => rounds.value.filter((round) => round.season_id === seasonId);
  });

  const getRoundById = computed(() => {
    return (roundId: number) => rounds.value.find((round) => round.id === roundId);
  });

  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);

  // Actions
  async function fetchRounds(seasonId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const data = await roundService.getRounds(seasonId);
      // Replace rounds for this season
      rounds.value = [...rounds.value.filter((r) => r.season_id !== seasonId), ...data];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch rounds';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRound(roundId: number): Promise<Round> {
    loading.value = true;
    error.value = null;
    try {
      const data = await roundService.getRound(roundId);
      currentRound.value = data;
      // Update in rounds array if exists
      const index = rounds.value.findIndex((r) => r.id === roundId);
      if (index !== -1) {
        rounds.value[index] = data;
      } else {
        rounds.value.push(data);
      }
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch round';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createNewRound(seasonId: number, data: CreateRoundRequest): Promise<Round> {
    loading.value = true;
    error.value = null;
    try {
      const newRound = await roundService.createRound(seasonId, data);
      rounds.value.push(newRound);
      return newRound;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create round';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateExistingRound(roundId: number, data: UpdateRoundRequest): Promise<Round> {
    loading.value = true;
    error.value = null;
    try {
      const updatedRound = await roundService.updateRound(roundId, data);
      const index = rounds.value.findIndex((r) => r.id === roundId);
      if (index !== -1) {
        rounds.value[index] = updatedRound;
      }
      if (currentRound.value?.id === roundId) {
        currentRound.value = updatedRound;
      }
      return updatedRound;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update round';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteExistingRound(roundId: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await roundService.deleteRound(roundId);
      rounds.value = rounds.value.filter((r) => r.id !== roundId);
      if (currentRound.value?.id === roundId) {
        currentRound.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete round';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchNextRoundNumber(seasonId: number): Promise<number> {
    try {
      return await roundService.getNextRoundNumber(seasonId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch next round number';
      throw err;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function clearCurrentRound(): void {
    currentRound.value = null;
  }

  function $reset(): void {
    rounds.value = [];
    currentRound.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    rounds,
    currentRound,
    loading,
    error,
    // Getters
    roundsBySeasonId,
    getRoundById,
    isLoading,
    hasError,
    // Actions
    fetchRounds,
    fetchRound,
    createNewRound,
    updateExistingRound,
    deleteExistingRound,
    fetchNextRoundNumber,
    clearError,
    clearCurrentRound,
    $reset,
  };
});
