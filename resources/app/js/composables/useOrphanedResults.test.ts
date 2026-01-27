import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOrphanedResults } from './useOrphanedResults';
import * as roundService from '@app/services/roundService';
import type { Race } from '@app/types/race';
import type { RoundResultsResponse } from '@app/types/roundResult';
import { F1_STANDARD_POINTS } from '@app/types/race';

vi.mock('@app/services/roundService');

describe('useOrphanedResults', () => {
  const mockRace: Race = {
    id: 1,
    round_id: 1,
    race_number: 1,
    race_type: 'feature',
    name: 'Feature Race',
    qualifying_format: 'standard',
    qualifying_length: null,
    qualifying_tire: null,
    grid_source: 'qualifying',
    grid_source_race_id: null,
    length_type: 'laps',
    length_value: 20,
    extra_lap_after_time: false,
    weather: null,
    tire_restrictions: null,
    fuel_usage: null,
    damage_model: null,
    track_limits_enforced: true,
    false_start_detection: true,
    collision_penalties: true,
    mandatory_pit_stop: false,
    minimum_pit_time: null,
    assists_restrictions: null,
    race_points: true,
    points_system: F1_STANDARD_POINTS,
    fastest_lap: 1,
    fastest_lap_top_10: false,
    qualifying_pole: null,
    qualifying_pole_top_10: false,
    dnf_points: 0,
    dns_points: 0,
    race_notes: null,
    is_qualifier: false,
    status: 'completed',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockRoundResultsResponse: RoundResultsResponse = {
    round: {
      id: 1,
      round_number: 1,
      name: 'Round 1',
      status: 'completed',
      round_results: null,
      qualifying_results: null,
      race_time_results: null,
      fastest_lap_results: null,
    },
    divisions: [],
    race_events: [],
    has_orphaned_results: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchOrphanedResultsStatus', () => {
    it('fetches and caches orphaned results status', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const { fetchOrphanedResultsStatus, orphanedResultsMap } = useOrphanedResults();

      const result = await fetchOrphanedResultsStatus(1);

      expect(result).toBe(true);
      expect(orphanedResultsMap.value.get(1)).toBe(true);
      expect(roundService.getRoundResults).toHaveBeenCalledWith(1);
    });

    it('returns cached value on subsequent calls', async () => {
      vi.mocked(roundService.getRoundResults).mockResolvedValue(mockRoundResultsResponse);

      const { fetchOrphanedResultsStatus, orphanedResultsMap } = useOrphanedResults();

      // First call - should fetch
      await fetchOrphanedResultsStatus(1);
      expect(roundService.getRoundResults).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result = await fetchOrphanedResultsStatus(1);
      expect(result).toBe(true);
      expect(roundService.getRoundResults).toHaveBeenCalledTimes(1);
      expect(orphanedResultsMap.value.get(1)).toBe(true);
    });

    it('handles API errors gracefully', async () => {
      vi.mocked(roundService.getRoundResults).mockRejectedValue(new Error('API Error'));

      const { fetchOrphanedResultsStatus, orphanedResultsMap } = useOrphanedResults();

      const result = await fetchOrphanedResultsStatus(1);

      expect(result).toBe(false);
      expect(orphanedResultsMap.value.get(1)).toBe(false);
    });

    it('handles undefined has_orphaned_results in response', async () => {
      const responseWithoutFlag: RoundResultsResponse = {
        ...mockRoundResultsResponse,
        has_orphaned_results: undefined,
      };
      vi.mocked(roundService.getRoundResults).mockResolvedValue(responseWithoutFlag);

      const { fetchOrphanedResultsStatus } = useOrphanedResults();

      const result = await fetchOrphanedResultsStatus(1);

      expect(result).toBe(false);
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: RoundResultsResponse) => void;
      const promise = new Promise<RoundResultsResponse>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(roundService.getRoundResults).mockReturnValue(promise);

      const { fetchOrphanedResultsStatus, loading } = useOrphanedResults();

      expect(loading.value).toBe(false);

      const fetchPromise = fetchOrphanedResultsStatus(1);

      expect(loading.value).toBe(true);

      resolvePromise!(mockRoundResultsResponse);
      await fetchPromise;

      expect(loading.value).toBe(false);
    });
  });

  describe('fetchBatchOrphanedResults', () => {
    it('fetches multiple rounds in parallel', async () => {
      const response1 = { ...mockRoundResultsResponse, has_orphaned_results: true };
      const response2 = { ...mockRoundResultsResponse, has_orphaned_results: false };
      const response3 = { ...mockRoundResultsResponse, has_orphaned_results: true };

      vi.mocked(roundService.getRoundResults)
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2)
        .mockResolvedValueOnce(response3);

      const { fetchBatchOrphanedResults, orphanedResultsMap } = useOrphanedResults();

      await fetchBatchOrphanedResults([1, 2, 3]);

      expect(roundService.getRoundResults).toHaveBeenCalledTimes(3);
      expect(orphanedResultsMap.value.get(1)).toBe(true);
      expect(orphanedResultsMap.value.get(2)).toBe(false);
      expect(orphanedResultsMap.value.get(3)).toBe(true);
    });

    it('skips already cached rounds', async () => {
      const response = { ...mockRoundResultsResponse, has_orphaned_results: true };
      vi.mocked(roundService.getRoundResults).mockResolvedValue(response);

      const { fetchBatchOrphanedResults, orphanedResultsMap } = useOrphanedResults();

      // Pre-populate cache for round 1
      orphanedResultsMap.value.set(1, false);

      await fetchBatchOrphanedResults([1, 2, 3]);

      // Should only fetch rounds 2 and 3
      expect(roundService.getRoundResults).toHaveBeenCalledTimes(2);
      expect(roundService.getRoundResults).not.toHaveBeenCalledWith(1);
      expect(orphanedResultsMap.value.get(1)).toBe(false); // Unchanged
      expect(orphanedResultsMap.value.get(2)).toBe(true);
      expect(orphanedResultsMap.value.get(3)).toBe(true);
    });

    it('handles partial failures gracefully', async () => {
      const response = { ...mockRoundResultsResponse, has_orphaned_results: true };
      vi.mocked(roundService.getRoundResults)
        .mockResolvedValueOnce(response)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(response);

      const { fetchBatchOrphanedResults, orphanedResultsMap } = useOrphanedResults();

      await fetchBatchOrphanedResults([1, 2, 3]);

      expect(orphanedResultsMap.value.get(1)).toBe(true);
      expect(orphanedResultsMap.value.get(2)).toBe(false); // Error defaults to false
      expect(orphanedResultsMap.value.get(3)).toBe(true);
    });

    it('does nothing when all rounds are cached', async () => {
      const { fetchBatchOrphanedResults, orphanedResultsMap } = useOrphanedResults();

      // Pre-populate cache
      orphanedResultsMap.value.set(1, true);
      orphanedResultsMap.value.set(2, false);

      await fetchBatchOrphanedResults([1, 2]);

      expect(roundService.getRoundResults).not.toHaveBeenCalled();
    });

    it('does nothing for empty array', async () => {
      const { fetchBatchOrphanedResults } = useOrphanedResults();

      await fetchBatchOrphanedResults([]);

      expect(roundService.getRoundResults).not.toHaveBeenCalled();
    });
  });

  describe('hasOrphanedResults', () => {
    it('returns true when race has orphaned results flag set', () => {
      const { hasOrphanedResults } = useOrphanedResults();

      const raceWithFlag: Race = { ...mockRace, has_orphaned_results: true };

      expect(hasOrphanedResults(raceWithFlag)).toBe(true);
    });

    it('returns false when race has orphaned results flag set to false', () => {
      const { hasOrphanedResults } = useOrphanedResults();

      const raceWithFlag: Race = { ...mockRace, has_orphaned_results: false };

      expect(hasOrphanedResults(raceWithFlag)).toBe(false);
    });

    it('checks round-level cache when race flag is undefined', () => {
      const { hasOrphanedResults, orphanedResultsMap } = useOrphanedResults();

      orphanedResultsMap.value.set(1, true);

      const raceWithoutFlag: Race = { ...mockRace, has_orphaned_results: undefined };

      expect(hasOrphanedResults(raceWithoutFlag)).toBe(true);
    });

    it('returns false when neither race nor round has flag', () => {
      const { hasOrphanedResults } = useOrphanedResults();

      const raceWithoutFlag: Race = { ...mockRace, has_orphaned_results: undefined };

      expect(hasOrphanedResults(raceWithoutFlag)).toBe(false);
    });
  });

  describe('setOrphanedResultsStatus', () => {
    it('manually sets orphaned results status', () => {
      const { setOrphanedResultsStatus, orphanedResultsMap } = useOrphanedResults();

      setOrphanedResultsStatus(1, true);

      expect(orphanedResultsMap.value.get(1)).toBe(true);
    });

    it('overwrites existing status', () => {
      const { setOrphanedResultsStatus, orphanedResultsMap } = useOrphanedResults();

      orphanedResultsMap.value.set(1, true);
      setOrphanedResultsStatus(1, false);

      expect(orphanedResultsMap.value.get(1)).toBe(false);
    });
  });

  describe('clearOrphanedResultsCache', () => {
    it('clears cache for specific round', () => {
      const { clearOrphanedResultsCache, orphanedResultsMap } = useOrphanedResults();

      orphanedResultsMap.value.set(1, true);
      orphanedResultsMap.value.set(2, false);

      clearOrphanedResultsCache(1);

      expect(orphanedResultsMap.value.has(1)).toBe(false);
      expect(orphanedResultsMap.value.has(2)).toBe(true);
    });

    it('clears entire cache when no round ID provided', () => {
      const { clearOrphanedResultsCache, orphanedResultsMap } = useOrphanedResults();

      orphanedResultsMap.value.set(1, true);
      orphanedResultsMap.value.set(2, false);
      orphanedResultsMap.value.set(3, true);

      clearOrphanedResultsCache();

      expect(orphanedResultsMap.value.size).toBe(0);
    });
  });

  describe('useRaceOrphanedResults', () => {
    it('returns reactive ref for race orphaned results', async () => {
      const { useRaceOrphanedResults, orphanedResultsMap } = useOrphanedResults();
      const { ref } = await import('vue');

      const raceRef = ref<Race>(mockRace);
      orphanedResultsMap.value.set(1, true);

      const orphanedRef = useRaceOrphanedResults(raceRef);

      expect(orphanedRef.value).toBe(true);
    });

    it('updates when race changes', async () => {
      const { useRaceOrphanedResults, orphanedResultsMap } = useOrphanedResults();
      const { ref } = await import('vue');

      const raceRef = ref<Race>(mockRace);
      orphanedResultsMap.value.set(1, true);
      orphanedResultsMap.value.set(2, false);

      const orphanedRef = useRaceOrphanedResults(raceRef);

      expect(orphanedRef.value).toBe(true);

      // Change race to round 2
      raceRef.value = { ...mockRace, round_id: 2 };

      expect(orphanedRef.value).toBe(false);
    });
  });
});
