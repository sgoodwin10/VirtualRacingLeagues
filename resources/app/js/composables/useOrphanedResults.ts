import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import { getRoundResults } from '@app/services/roundService';
import type { Race } from '@app/types/race';

/**
 * Composable to manage orphaned results state for rounds
 *
 * Orphaned results occur when a season has race_divisions_enabled but some results
 * have NULL division_id values. This composable tracks which rounds have orphaned
 * results and provides utilities to check individual races.
 */
export function useOrphanedResults() {
  // Map of roundId -> has_orphaned_results
  const orphanedResultsMap = ref<Map<number, boolean>>(new Map());
  const loading = ref(false);

  /**
   * Fetch orphaned results status for a round
   * @param roundId - The round ID to check
   */
  async function fetchOrphanedResultsStatus(roundId: number): Promise<boolean> {
    // Check cache first
    if (orphanedResultsMap.value.has(roundId)) {
      return orphanedResultsMap.value.get(roundId) || false;
    }

    loading.value = true;
    try {
      const response = await getRoundResults(roundId);
      const hasOrphaned = response.has_orphaned_results || false;

      // Cache the result
      orphanedResultsMap.value.set(roundId, hasOrphaned);

      return hasOrphaned;
    } catch {
      // If error (e.g., round not completed), assume no orphaned results
      orphanedResultsMap.value.set(roundId, false);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Batch fetch orphaned results status for multiple rounds
   * @param roundIds - Array of round IDs to check
   */
  async function fetchBatchOrphanedResults(roundIds: number[]): Promise<void> {
    const uncachedRounds = roundIds.filter((id) => !orphanedResultsMap.value.has(id));

    if (uncachedRounds.length === 0) {
      return;
    }

    loading.value = true;
    try {
      // Fetch all in parallel
      await Promise.all(
        uncachedRounds.map(async (roundId) => {
          try {
            const response = await getRoundResults(roundId);
            orphanedResultsMap.value.set(roundId, response.has_orphaned_results || false);
          } catch {
            // If error, assume no orphaned results
            orphanedResultsMap.value.set(roundId, false);
          }
        }),
      );
    } finally {
      loading.value = false;
    }
  }

  /**
   * Check if a race has orphaned results
   * Uses the round-level flag since orphaned results are a round-level concern
   *
   * @param race - The race to check
   */
  function hasOrphanedResults(race: Race): boolean {
    // First check if race itself has the flag (if populated)
    if (race.has_orphaned_results !== undefined) {
      return race.has_orphaned_results;
    }

    // Otherwise check the round-level cache
    return orphanedResultsMap.value.get(race.round_id) || false;
  }

  /**
   * Manually set orphaned results status for a round
   * Useful when the status is known from other API calls
   */
  function setOrphanedResultsStatus(roundId: number, hasOrphaned: boolean): void {
    orphanedResultsMap.value.set(roundId, hasOrphaned);
  }

  /**
   * Clear cached orphaned results for a round
   * Call this when round results change
   */
  function clearOrphanedResultsCache(roundId?: number): void {
    if (roundId !== undefined) {
      orphanedResultsMap.value.delete(roundId);
    } else {
      orphanedResultsMap.value.clear();
    }
  }

  /**
   * Get a reactive ref for a specific race's orphaned results status
   */
  function useRaceOrphanedResults(race: Ref<Race>): Ref<boolean> {
    return computed(() => hasOrphanedResults(race.value));
  }

  return {
    orphanedResultsMap,
    loading,
    fetchOrphanedResultsStatus,
    fetchBatchOrphanedResults,
    hasOrphanedResults,
    setOrphanedResultsStatus,
    clearOrphanedResultsCache,
    useRaceOrphanedResults,
  };
}
