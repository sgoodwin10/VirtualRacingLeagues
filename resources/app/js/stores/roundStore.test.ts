import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRoundStore } from './roundStore';
import * as roundService from '@app/services/roundService';
import type { Round, CreateRoundRequest, UpdateRoundRequest } from '@app/types/round';

vi.mock('@app/services/roundService');

describe('roundStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockRound: Round = {
    id: 1,
    season_id: 1,
    round_number: 1,
    name: 'Test Round',
    slug: 'test-round',
    scheduled_at: '2025-01-15 14:00:00',
    timezone: 'UTC',
    platform_track_id: 1,
    track_layout: 'GP Circuit',
    track_conditions: 'Dry',
    technical_notes: 'Test notes',
    stream_url: 'https://stream.example.com',
    internal_notes: 'Internal notes',
    fastest_lap: null,
    fastest_lap_top_10: false,
    qualifying_pole: null,
    qualifying_pole_top_10: false,
    points_system: null,
    round_points: false,
    status: 'scheduled',
    status_label: 'Scheduled',
    created_by_user_id: 1,
    created_at: '2025-01-01 10:00:00',
    updated_at: '2025-01-01 10:00:00',
    deleted_at: null,
  };

  describe('fetchRounds', () => {
    it('should fetch rounds for a season', async () => {
      const store = useRoundStore();
      vi.mocked(roundService.getRounds).mockResolvedValue([mockRound]);

      await store.fetchRounds(1);

      expect(roundService.getRounds).toHaveBeenCalledWith(1);
      expect(store.rounds).toHaveLength(1);
      expect(store.rounds[0]).toEqual(mockRound);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const store = useRoundStore();
      const error = new Error('Fetch failed');
      vi.mocked(roundService.getRounds).mockRejectedValue(error);

      await expect(store.fetchRounds(1)).rejects.toThrow('Fetch failed');
      expect(store.error).toBe('Fetch failed');
      expect(store.loading).toBe(false);
    });

    it('should replace rounds for the same season', async () => {
      const store = useRoundStore();
      const round2 = { ...mockRound, id: 2, season_id: 1 };

      vi.mocked(roundService.getRounds).mockResolvedValue([mockRound]);
      await store.fetchRounds(1);

      vi.mocked(roundService.getRounds).mockResolvedValue([round2]);
      await store.fetchRounds(1);

      expect(store.rounds).toHaveLength(1);
      expect(store.rounds[0]?.id).toBe(2);
    });
  });

  describe('fetchRound', () => {
    it('should fetch a single round', async () => {
      const store = useRoundStore();
      vi.mocked(roundService.getRound).mockResolvedValue(mockRound);

      const result = await store.fetchRound(1);

      expect(roundService.getRound).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRound);
      expect(store.currentRound).toEqual(mockRound);
      expect(store.rounds).toContainEqual(mockRound);
    });

    it('should handle fetch round error', async () => {
      const store = useRoundStore();
      const error = new Error('Fetch failed');
      vi.mocked(roundService.getRound).mockRejectedValue(error);

      await expect(store.fetchRound(1)).rejects.toThrow('Fetch failed');
      expect(store.error).toBe('Fetch failed');
    });
  });

  describe('createNewRound', () => {
    it('should create a new round', async () => {
      const store = useRoundStore();
      const createData: CreateRoundRequest = {
        round_number: 1,
        name: 'Test Round',
        scheduled_at: '2025-01-15 14:00:00',
        platform_track_id: 1,
      };
      vi.mocked(roundService.createRound).mockResolvedValue(mockRound);

      const result = await store.createNewRound(1, createData);

      expect(roundService.createRound).toHaveBeenCalledWith(1, createData);
      expect(result).toEqual(mockRound);
      expect(store.rounds).toContainEqual(mockRound);
    });

    it('should handle create error', async () => {
      const store = useRoundStore();
      const error = new Error('Create failed');
      vi.mocked(roundService.createRound).mockRejectedValue(error);

      await expect(store.createNewRound(1, {} as CreateRoundRequest)).rejects.toThrow(
        'Create failed',
      );
      expect(store.error).toBe('Create failed');
    });
  });

  describe('updateExistingRound', () => {
    it('should update an existing round', async () => {
      const store = useRoundStore();
      store.rounds = [mockRound];
      const updatedRound = { ...mockRound, name: 'Updated Round' };
      vi.mocked(roundService.updateRound).mockResolvedValue(updatedRound);

      const updateData: UpdateRoundRequest = { name: 'Updated Round' };
      const result = await store.updateExistingRound(1, updateData);

      expect(roundService.updateRound).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updatedRound);
      expect(store.rounds[0]?.name).toBe('Updated Round');
    });

    it('should handle update error', async () => {
      const store = useRoundStore();
      const error = new Error('Update failed');
      vi.mocked(roundService.updateRound).mockRejectedValue(error);

      await expect(store.updateExistingRound(1, {} as UpdateRoundRequest)).rejects.toThrow(
        'Update failed',
      );
      expect(store.error).toBe('Update failed');
    });
  });

  describe('deleteExistingRound', () => {
    it('should delete a round', async () => {
      const store = useRoundStore();
      store.rounds = [mockRound];
      vi.mocked(roundService.deleteRound).mockResolvedValue();

      await store.deleteExistingRound(1);

      expect(roundService.deleteRound).toHaveBeenCalledWith(1);
      expect(store.rounds).toHaveLength(0);
    });

    it('should clear currentRound if it is the deleted round', async () => {
      const store = useRoundStore();
      store.rounds = [mockRound];
      store.currentRound = mockRound;
      vi.mocked(roundService.deleteRound).mockResolvedValue();

      await store.deleteExistingRound(1);

      expect(store.currentRound).toBeNull();
    });

    it('should handle delete error', async () => {
      const store = useRoundStore();
      const error = new Error('Delete failed');
      vi.mocked(roundService.deleteRound).mockRejectedValue(error);

      await expect(store.deleteExistingRound(1)).rejects.toThrow('Delete failed');
      expect(store.error).toBe('Delete failed');
    });
  });

  describe('fetchNextRoundNumber', () => {
    it('should fetch next round number', async () => {
      const store = useRoundStore();
      vi.mocked(roundService.getNextRoundNumber).mockResolvedValue(2);

      const result = await store.fetchNextRoundNumber(1);

      expect(roundService.getNextRoundNumber).toHaveBeenCalledWith(1);
      expect(result).toBe(2);
    });

    it('should handle error', async () => {
      const store = useRoundStore();
      const error = new Error('Fetch failed');
      vi.mocked(roundService.getNextRoundNumber).mockRejectedValue(error);

      await expect(store.fetchNextRoundNumber(1)).rejects.toThrow('Fetch failed');
      expect(store.error).toBe('Fetch failed');
    });
  });

  describe('getters', () => {
    it('should filter rounds by season ID', () => {
      const store = useRoundStore();
      const round1 = { ...mockRound, id: 1, season_id: 1 };
      const round2 = { ...mockRound, id: 2, season_id: 2 };
      store.rounds = [round1, round2];

      const filtered = store.roundsBySeasonId(1);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe(1);
    });

    it('should get round by ID', () => {
      const store = useRoundStore();
      store.rounds = [mockRound];

      const round = store.getRoundById(1);

      expect(round).toEqual(mockRound);
    });

    it('should return undefined for non-existent round', () => {
      const store = useRoundStore();
      store.rounds = [mockRound];

      const round = store.getRoundById(999);

      expect(round).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    it('should clear error', () => {
      const store = useRoundStore();
      store.error = 'Test error';

      store.clearError();

      expect(store.error).toBeNull();
    });

    it('should clear current round', () => {
      const store = useRoundStore();
      store.currentRound = mockRound;

      store.clearCurrentRound();

      expect(store.currentRound).toBeNull();
    });

    it('should reset store', () => {
      const store = useRoundStore();
      store.rounds = [mockRound];
      store.currentRound = mockRound;
      store.loading = true;
      store.error = 'Test error';

      store.$reset();

      expect(store.rounds).toHaveLength(0);
      expect(store.currentRound).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });
});
