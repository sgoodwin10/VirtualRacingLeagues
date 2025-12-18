import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useLeaguePlatforms } from '../useLeaguePlatforms';
import { useLeagueStore } from '@app/stores/leagueStore';
import type { League, Platform } from '@app/types/league';

describe('useLeaguePlatforms', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mockPlatforms: Platform[] = [
    { id: 1, name: 'iRacing', slug: 'iracing' },
    { id: 2, name: 'Gran Turismo 7', slug: 'gran-turismo-7' },
    { id: 3, name: 'Assetto Corsa Competizione', slug: 'acc' },
  ];

  const mockLeague: League = {
    id: 1,
    name: 'Test League',
    slug: 'test-league',
    tagline: null,
    description: null,
    logo_url: null,
    banner_url: null,
    header_image_url: null,
    platform_ids: [1, 3],
    platforms: undefined,
    discord_url: null,
    website_url: null,
    twitter_handle: null,
    instagram_handle: null,
    youtube_url: null,
    twitch_url: null,
    visibility: 'public',
    timezone: 'UTC',
    owner_user_id: 1,
    contact_email: 'test@example.com',
    organizer_name: 'Test Organizer',
    status: 'active',
    competitions_count: 0,
    drivers_count: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  describe('leaguePlatforms', () => {
    it('should return empty array if league not found', () => {
      const leagueStore = useLeagueStore();
      leagueStore.platforms = mockPlatforms;

      const { leaguePlatforms } = useLeaguePlatforms(() => 999);

      expect(leaguePlatforms.value).toEqual([]);
    });

    it('should return empty array if league has no platform_ids', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [{ ...mockLeague, platform_ids: [] }];
      leagueStore.platforms = mockPlatforms;

      const { leaguePlatforms } = useLeaguePlatforms(() => 1);

      expect(leaguePlatforms.value).toEqual([]);
    });

    it('should filter platforms to only those in league platform_ids', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = mockPlatforms;

      const { leaguePlatforms } = useLeaguePlatforms(() => 1);

      expect(leaguePlatforms.value).toHaveLength(2);
      expect(leaguePlatforms.value.map((p) => p.id)).toEqual([1, 3]);
      expect(leaguePlatforms.value.find((p) => p.id === 2)).toBeUndefined();
    });

    it('should use currentLeague when available', () => {
      const leagueStore = useLeagueStore();
      leagueStore.currentLeague = mockLeague;
      leagueStore.platforms = mockPlatforms;

      const { leaguePlatforms } = useLeaguePlatforms(() => 1);

      expect(leaguePlatforms.value).toHaveLength(2);
      expect(leaguePlatforms.value.map((p) => p.id)).toEqual([1, 3]);
    });

    it('should prioritize currentLeague over leagues array', () => {
      const leagueStore = useLeagueStore();
      // Set up leagues array with different platform_ids
      leagueStore.leagues = [{ ...mockLeague, platform_ids: [2] }];
      // Set currentLeague with different platform_ids
      leagueStore.currentLeague = mockLeague; // platform_ids: [1, 3]
      leagueStore.platforms = mockPlatforms;

      const { leaguePlatforms } = useLeaguePlatforms(() => 1);

      // Should use currentLeague's platform_ids [1, 3], not leagues array [2]
      expect(leaguePlatforms.value).toHaveLength(2);
      expect(leaguePlatforms.value.map((p) => p.id)).toEqual([1, 3]);
    });

    it('should fallback to leagues array if currentLeague does not match', () => {
      const leagueStore = useLeagueStore();
      leagueStore.currentLeague = { ...mockLeague, id: 2 }; // Different ID
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = mockPlatforms;

      const { leaguePlatforms } = useLeaguePlatforms(() => 1);

      expect(leaguePlatforms.value).toHaveLength(2);
      expect(leaguePlatforms.value.map((p) => p.id)).toEqual([1, 3]);
    });

    it('should react to leagueId changes', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = mockPlatforms;

      const leagueId = ref(999);
      const { platformOptions } = useLeaguePlatforms(leagueId);

      expect(platformOptions.value).toEqual([]);

      leagueId.value = 1;
      expect(platformOptions.value).toHaveLength(2);
    });
  });

  describe('platformOptions', () => {
    it('should return formatted options for PrimeVue Select', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = mockPlatforms;

      const { platformOptions } = useLeaguePlatforms(() => 1);

      expect(platformOptions.value).toHaveLength(2);
      expect(platformOptions.value[0]).toEqual({
        id: 1,
        name: 'iRacing',
        slug: 'iracing',
      });
      expect(platformOptions.value[1]).toEqual({
        id: 3,
        name: 'Assetto Corsa Competizione',
        slug: 'acc',
      });
    });

    it('should return empty array if no platforms available', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = [];

      const { platformOptions } = useLeaguePlatforms(() => 1);

      expect(platformOptions.value).toEqual([]);
    });
  });

  describe('isPlatformAvailable', () => {
    it('should return true for available platforms', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = mockPlatforms;

      const { isPlatformAvailable } = useLeaguePlatforms(() => 1);

      expect(isPlatformAvailable(1)).toBe(true);
      expect(isPlatformAvailable(3)).toBe(true);
    });

    it('should return false for unavailable platforms', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = mockPlatforms;

      const { isPlatformAvailable } = useLeaguePlatforms(() => 1);

      expect(isPlatformAvailable(2)).toBe(false);
      expect(isPlatformAvailable(999)).toBe(false);
    });
  });

  describe('getPlatformById', () => {
    it('should return platform if available', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = mockPlatforms;

      const { getPlatformById } = useLeaguePlatforms(() => 1);

      const platform = getPlatformById(1);
      expect(platform).toEqual({ id: 1, name: 'iRacing', slug: 'iracing' });
    });

    it('should return undefined if platform not available', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = mockPlatforms;

      const { getPlatformById } = useLeaguePlatforms(() => 1);

      const platform = getPlatformById(2);
      expect(platform).toBeUndefined();
    });

    it('should return undefined if platform does not exist', () => {
      const leagueStore = useLeagueStore();
      leagueStore.leagues = [mockLeague];
      leagueStore.platforms = mockPlatforms;

      const { getPlatformById } = useLeaguePlatforms(() => 1);

      const platform = getPlatformById(999);
      expect(platform).toBeUndefined();
    });
  });
});
