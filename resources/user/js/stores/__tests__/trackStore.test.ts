import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTrackStore } from '../trackStore';
import * as trackService from '@user/services/trackService';
import type { Track, TrackLocationGroup, TrackSearchParams } from '@user/types/track';

vi.mock('@user/services/trackService');

describe('trackStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockTrack: Track = {
    id: 1,
    platform_id: 1,
    platform_track_location_id: 1,
    name: 'Spa-Francorchamps',
    slug: 'spa-francorchamps',
    is_reverse: false,
    image_path: '/images/spa.jpg',
    length_meters: 7004,
    is_active: true,
    sort_order: 1,
    created_at: '2025-01-01 10:00:00',
    updated_at: '2025-01-01 10:00:00',
  };

  const mockTrackRev: Track = {
    id: 2,
    platform_id: 1,
    platform_track_location_id: 1,
    name: 'Spa-Francorchamps',
    slug: 'spa-francorchamps',
    is_reverse: true,
    image_path: '/images/spa.jpg',
    length_meters: 7004,
    is_active: true,
    sort_order: 2,
    created_at: '2025-01-01 10:00:00',
    updated_at: '2025-01-01 10:00:00',
  };

  const mockLocationGroup: TrackLocationGroup = {
    id: 1,
    name: 'Spa-Francorchamps',
    slug: 'spa-francorchamps',
    country: 'Belgium',
    is_active: true,
    sort_order: 1,
    tracks: [mockTrack, mockTrackRev],
  };

  describe('fetchTracks', () => {
    it('should fetch track location groups and flatten tracks', async () => {
      const store = useTrackStore();
      const params: TrackSearchParams = {
        platform_id: 1,
        is_active: true,
      };
      vi.mocked(trackService.getTracks).mockResolvedValue([mockLocationGroup]);

      const result = await store.fetchTracks(params);

      expect(trackService.getTracks).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockLocationGroup]);
      expect(store.trackLocations).toEqual([mockLocationGroup]);
      expect(store.tracks).toHaveLength(2);
      expect(store.tracks[0]).toEqual(mockTrack);
      expect(store.tracks[1]).toEqual(mockTrackRev);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      const store = useTrackStore();
      const error = new Error('Fetch failed');
      vi.mocked(trackService.getTracks).mockRejectedValue(error);

      await expect(store.fetchTracks({ platform_id: 1 })).rejects.toThrow('Fetch failed');
      expect(store.error).toBe('Fetch failed');
      expect(store.loading).toBe(false);
    });

    it('should replace tracks for the same platform', async () => {
      const store = useTrackStore();
      const newTrack = { ...mockTrack, id: 3, platform_id: 1 };
      const newLocationGroup: TrackLocationGroup = {
        ...mockLocationGroup,
        tracks: [newTrack],
      };

      vi.mocked(trackService.getTracks).mockResolvedValue([mockLocationGroup]);
      await store.fetchTracks({ platform_id: 1 });

      expect(store.tracks).toHaveLength(2);

      vi.mocked(trackService.getTracks).mockResolvedValue([newLocationGroup]);
      await store.fetchTracks({ platform_id: 1 });

      expect(store.tracks).toHaveLength(1);
      expect(store.tracks[0]?.id).toBe(3);
    });
  });

  describe('searchTracks', () => {
    it('should search tracks by platform and query', async () => {
      const store = useTrackStore();
      vi.mocked(trackService.getTracks).mockResolvedValue([mockLocationGroup]);

      const result = await store.searchTracks(1, 'Spa');

      expect(trackService.getTracks).toHaveBeenCalledWith({
        platform_id: 1,
        search: 'Spa',
        is_active: true,
      });
      expect(result).toEqual([mockLocationGroup]);
    });
  });

  describe('fetchTrack', () => {
    it('should fetch a single track', async () => {
      const store = useTrackStore();
      vi.mocked(trackService.getTrack).mockResolvedValue(mockTrack);

      const result = await store.fetchTrack(1);

      expect(trackService.getTrack).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTrack);
      expect(store.currentTrack).toEqual(mockTrack);
      expect(store.tracks).toContainEqual(mockTrack);
    });

    it('should handle fetch track error', async () => {
      const store = useTrackStore();
      const error = new Error('Fetch failed');
      vi.mocked(trackService.getTrack).mockRejectedValue(error);

      await expect(store.fetchTrack(1)).rejects.toThrow('Fetch failed');
      expect(store.error).toBe('Fetch failed');
    });
  });

  describe('getters', () => {
    it('should filter tracks by platform ID', () => {
      const store = useTrackStore();
      const track1 = { ...mockTrack, id: 1, platform_id: 1 };
      const track2 = { ...mockTrack, id: 2, platform_id: 2 };
      store.tracks = [track1, track2];

      const filtered = store.tracksByPlatformId(1);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe(1);
    });

    it('should get track by ID', () => {
      const store = useTrackStore();
      store.tracks = [mockTrack];

      const track = store.getTrackById(1);

      expect(track).toEqual(mockTrack);
    });

    it('should return undefined for non-existent track', () => {
      const store = useTrackStore();
      store.tracks = [mockTrack];

      const track = store.getTrackById(999);

      expect(track).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    it('should clear error', () => {
      const store = useTrackStore();
      store.error = 'Test error';

      store.clearError();

      expect(store.error).toBeNull();
    });

    it('should clear current track', () => {
      const store = useTrackStore();
      store.currentTrack = mockTrack;

      store.clearCurrentTrack();

      expect(store.currentTrack).toBeNull();
    });

    it('should reset store', () => {
      const store = useTrackStore();
      store.tracks = [mockTrack];
      store.trackLocations = [mockLocationGroup];
      store.currentTrack = mockTrack;
      store.loading = true;
      store.error = 'Test error';

      store.$reset();

      expect(store.tracks).toHaveLength(0);
      expect(store.trackLocations).toHaveLength(0);
      expect(store.currentTrack).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });
});
