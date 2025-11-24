import { defineStore } from 'pinia';
import { computed } from 'vue';
import type { Round, CreateRoundRequest, UpdateRoundRequest } from '@app/types/round';
import * as roundService from '@app/services/roundService';
import { useCrudStore } from '@app/composables/useCrudStore';

export const useRoundStore = defineStore('round', () => {
  // Use CRUD composable
  const crud = useCrudStore<Round>();
  const {
    items: rounds,
    currentItem: currentRound,
    loading,
    error,
    setLoading,
    setError,
    setCurrentItem,
    addItem,
    updateItemInList,
    removeItemFromList,
    clearError,
    resetStore: resetCrudStore,
  } = crud;

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
    setLoading(true);
    setError(null);
    try {
      const data = await roundService.getRounds(seasonId);
      // Replace rounds for this season
      rounds.value = [...rounds.value.filter((r) => r.season_id !== seasonId), ...data];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rounds');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function fetchRound(roundId: number): Promise<Round> {
    setLoading(true);
    setError(null);
    try {
      const data = await roundService.getRound(roundId);
      setCurrentItem(data);
      // Update in rounds array if exists
      const index = rounds.value.findIndex((r) => r.id === roundId);
      if (index !== -1) {
        rounds.value[index] = data;
      } else {
        rounds.value.push(data);
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch round');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function createNewRound(seasonId: number, data: CreateRoundRequest): Promise<Round> {
    setLoading(true);
    setError(null);
    try {
      const newRound = await roundService.createRound(seasonId, data);
      addItem(newRound);
      return newRound;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create round');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateExistingRound(roundId: number, data: UpdateRoundRequest): Promise<Round> {
    setLoading(true);
    setError(null);
    try {
      const updatedRound = await roundService.updateRound(roundId, data);
      updateItemInList(updatedRound);
      return updatedRound;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update round');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function deleteExistingRound(roundId: number): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      await roundService.deleteRound(roundId);
      removeItemFromList(roundId);
      // Clear current round if it's the one being deleted
      if (currentRound.value?.id === roundId) {
        setCurrentItem(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete round');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function fetchNextRoundNumber(seasonId: number): Promise<number> {
    try {
      return await roundService.getNextRoundNumber(seasonId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch next round number');
      throw err;
    }
  }

  async function completeRound(roundId: number): Promise<Round> {
    setLoading(true);
    setError(null);
    try {
      const updatedRound = await roundService.completeRound(roundId);
      updateItemInList(updatedRound);
      return updatedRound;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete round');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function uncompleteRound(roundId: number): Promise<Round> {
    setLoading(true);
    setError(null);
    try {
      const updatedRound = await roundService.uncompleteRound(roundId);
      updateItemInList(updatedRound);
      return updatedRound;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to uncomplete round');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function clearCurrentRound(): void {
    setCurrentItem(null);
  }

  function $reset(): void {
    resetCrudStore();
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
    completeRound,
    uncompleteRound,
    clearError,
    clearCurrentRound,
    $reset,
  };
});
