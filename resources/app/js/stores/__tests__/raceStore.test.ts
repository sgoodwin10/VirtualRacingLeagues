import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRaceStore } from '../raceStore';
import * as raceService from '@app/services/raceService';
import type { Race, CreateRaceRequest, UpdateRaceRequest } from '@app/types/race';
import { F1_STANDARD_POINTS } from '@app/types/race';

vi.mock('@app/services/raceService');

describe('raceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockRace: Race = {
    id: 1,
    round_id: 1,
    race_number: 1,
    name: 'Sprint Race',
    race_type: 'sprint',
    qualifying_format: 'standard',
    qualifying_length: 15,
    qualifying_tire: 'Soft',
    grid_source: 'qualifying',
    grid_source_race_id: null,
    length_type: 'laps',
    length_value: 20,
    extra_lap_after_time: false,
    weather: 'clear',
    tire_restrictions: 'none',
    fuel_usage: 'standard',
    damage_model: 'realistic',
    track_limits_enforced: true,
    false_start_detection: true,
    collision_penalties: true,
    mandatory_pit_stop: false,
    minimum_pit_time: null,
    assists_restrictions: 'none',
    race_points: false,
    points_system: { ...F1_STANDARD_POINTS },
    bonus_points: { pole: 1, fastest_lap: 1, fastest_lap_top_10_only: true },
    dnf_points: 0,
    dns_points: 0,
    race_notes: 'Test notes',
    is_qualifier: false,
    status: 'scheduled',
    created_at: '2025-01-01 10:00:00',
    updated_at: '2025-01-01 10:00:00',
  };

  describe('fetchRaces', () => {
    it('should fetch races for a round', async () => {
      const store = useRaceStore();
      vi.mocked(raceService.getRaces).mockResolvedValue([mockRace]);

      await store.fetchRaces(1);

      expect(raceService.getRaces).toHaveBeenCalledWith(1);
      expect(store.races).toHaveLength(1);
      expect(store.races[0]).toEqual(mockRace);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const store = useRaceStore();
      const error = new Error('Fetch failed');
      vi.mocked(raceService.getRaces).mockRejectedValue(error);

      await expect(store.fetchRaces(1)).rejects.toThrow('Fetch failed');
      expect(store.error).toBe('Fetch failed');
      expect(store.loading).toBe(false);
    });

    it('should replace races for the same round', async () => {
      const store = useRaceStore();
      const race2 = { ...mockRace, id: 2, round_id: 1 };

      vi.mocked(raceService.getRaces).mockResolvedValue([mockRace]);
      await store.fetchRaces(1);

      vi.mocked(raceService.getRaces).mockResolvedValue([race2]);
      await store.fetchRaces(1);

      expect(store.races).toHaveLength(1);
      expect(store.races[0]?.id).toBe(2);
    });
  });

  describe('fetchRace', () => {
    it('should fetch a single race', async () => {
      const store = useRaceStore();
      vi.mocked(raceService.getRace).mockResolvedValue(mockRace);

      const result = await store.fetchRace(1);

      expect(raceService.getRace).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRace);
      expect(store.currentRace).toEqual(mockRace);
      expect(store.races).toContainEqual(mockRace);
    });

    it('should handle fetch race error', async () => {
      const store = useRaceStore();
      const error = new Error('Fetch failed');
      vi.mocked(raceService.getRace).mockRejectedValue(error);

      await expect(store.fetchRace(1)).rejects.toThrow('Fetch failed');
      expect(store.error).toBe('Fetch failed');
    });
  });

  describe('createNewRace', () => {
    it('should create a new race', async () => {
      const store = useRaceStore();
      const createData: CreateRaceRequest = {
        race_number: 1,
        name: 'Sprint Race',
        qualifying_format: 'standard',
        grid_source: 'qualifying',
        length_type: 'laps',
        length_value: 20,
        extra_lap_after_time: false,
        track_limits_enforced: true,
        false_start_detection: true,
        collision_penalties: true,
        mandatory_pit_stop: false,
        race_points: false,
        points_system: { ...F1_STANDARD_POINTS },
        dnf_points: 0,
        dns_points: 0,
      };
      vi.mocked(raceService.createRace).mockResolvedValue(mockRace);

      const result = await store.createNewRace(1, createData);

      expect(raceService.createRace).toHaveBeenCalledWith(1, createData);
      expect(result).toEqual(mockRace);
      expect(store.races).toContainEqual(mockRace);
    });

    it('should handle create error', async () => {
      const store = useRaceStore();
      const error = new Error('Create failed');
      vi.mocked(raceService.createRace).mockRejectedValue(error);

      await expect(store.createNewRace(1, {} as CreateRaceRequest)).rejects.toThrow(
        'Create failed',
      );
      expect(store.error).toBe('Create failed');
    });
  });

  describe('updateExistingRace', () => {
    it('should update an existing race', async () => {
      const store = useRaceStore();
      store.races = [mockRace];
      const updatedRace = { ...mockRace, name: 'Feature Race' };
      vi.mocked(raceService.updateRace).mockResolvedValue(updatedRace);

      const updateData: UpdateRaceRequest = { name: 'Feature Race' };
      const result = await store.updateExistingRace(1, updateData);

      expect(raceService.updateRace).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updatedRace);
      expect(store.races[0]?.name).toBe('Feature Race');
    });

    it('should handle update error', async () => {
      const store = useRaceStore();
      const error = new Error('Update failed');
      vi.mocked(raceService.updateRace).mockRejectedValue(error);

      await expect(store.updateExistingRace(1, {} as UpdateRaceRequest)).rejects.toThrow(
        'Update failed',
      );
      expect(store.error).toBe('Update failed');
    });
  });

  describe('deleteExistingRace', () => {
    it('should delete a race', async () => {
      const store = useRaceStore();
      store.races = [mockRace];
      vi.mocked(raceService.deleteRace).mockResolvedValue();

      await store.deleteExistingRace(1);

      expect(raceService.deleteRace).toHaveBeenCalledWith(1);
      expect(store.races).toHaveLength(0);
    });

    it('should clear currentRace if it is the deleted race', async () => {
      const store = useRaceStore();
      store.races = [mockRace];
      store.currentRace = mockRace;
      vi.mocked(raceService.deleteRace).mockResolvedValue();

      await store.deleteExistingRace(1);

      expect(store.currentRace).toBeNull();
    });

    it('should handle delete error', async () => {
      const store = useRaceStore();
      const error = new Error('Delete failed');
      vi.mocked(raceService.deleteRace).mockRejectedValue(error);

      await expect(store.deleteExistingRace(1)).rejects.toThrow('Delete failed');
      expect(store.error).toBe('Delete failed');
    });
  });

  describe('getters', () => {
    it('should filter races by round ID', () => {
      const store = useRaceStore();
      const race1 = { ...mockRace, id: 1, round_id: 1 };
      const race2 = { ...mockRace, id: 2, round_id: 2 };
      store.races = [race1, race2];

      const filtered = store.racesByRoundId(1);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe(1);
    });

    it('should get race by ID', () => {
      const store = useRaceStore();
      store.races = [mockRace];

      const race = store.getRaceById(1);

      expect(race).toEqual(mockRace);
    });

    it('should return undefined for non-existent race', () => {
      const store = useRaceStore();
      store.races = [mockRace];

      const race = store.getRaceById(999);

      expect(race).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    it('should clear error', () => {
      const store = useRaceStore();
      store.error = 'Test error';

      store.clearError();

      expect(store.error).toBeNull();
    });

    it('should clear current race', () => {
      const store = useRaceStore();
      store.currentRace = mockRace;

      store.clearCurrentRace();

      expect(store.currentRace).toBeNull();
    });

    it('should reset store', () => {
      const store = useRaceStore();
      store.races = [mockRace];
      store.currentRace = mockRace;
      store.loading = true;
      store.error = 'Test error';

      store.$reset();

      expect(store.races).toHaveLength(0);
      expect(store.currentRace).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });
});
