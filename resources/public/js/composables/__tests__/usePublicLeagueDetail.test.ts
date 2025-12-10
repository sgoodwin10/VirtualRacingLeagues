import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { usePublicLeagueDetail } from '../usePublicLeagueDetail';
import { publicApi } from '@public/services/publicApi';
import type { PublicLeagueDetailResponse } from '@public/types/public';

// Mock the publicApi
vi.mock('@public/services/publicApi', () => ({
  publicApi: {
    fetchLeague: vi.fn(),
  },
}));

describe('usePublicLeagueDetail', () => {
  const mockLeagueSlug = 'test-league';

  const mockResponse: PublicLeagueDetailResponse = {
    league: {
      id: 1,
      name: 'Test League',
      slug: 'test-league',
      tagline: 'A test league',
      description: 'This is a test league description',
      logo_url: 'https://example.com/logo.png',
      header_image_url: 'https://example.com/header.jpg',
      platforms: [
        { id: 1, name: 'PC', slug: 'pc' },
        { id: 2, name: 'PlayStation', slug: 'playstation' },
      ],
      visibility: 'public',
      discord_url: 'https://discord.gg/test',
      website_url: 'https://example.com',
      twitter_handle: 'testleague',
      youtube_url: 'https://youtube.com/testleague',
      twitch_url: 'https://twitch.tv/testleague',
      created_at: '2025-01-01T00:00:00.000000Z',
    },
    stats: {
      competitions_count: 5,
      active_seasons_count: 3,
      drivers_count: 42,
    },
    competitions: [
      {
        id: 1,
        name: 'Test Competition',
        slug: 'test-competition',
        description: 'A test competition',
        logo_url: 'https://example.com/comp-logo.png',
        competition_colour: '{"r":255,"g":0,"b":0}',
        platform: { id: 1, name: 'PC', slug: 'pc' },
        stats: {
          total_seasons: 3,
          active_seasons: 1,
          total_drivers: 20,
        },
        seasons: [
          {
            id: 1,
            name: 'Season 1',
            slug: 'season-1',
            car_class: 'GT3',
            status: 'active',
            stats: {
              total_drivers: 20,
              active_drivers: 18,
              total_rounds: 10,
              completed_rounds: 5,
            },
          },
        ],
      },
    ],
    recent_activity: [
      {
        type: 'race_completed',
        title: 'Race Completed',
        subtitle: 'Monza Sprint',
        timestamp: '2h ago',
        icon_type: 'success',
      },
    ],
    upcoming_races: [
      {
        id: 1,
        track_name: 'Spa-Francorchamps',
        season_name: 'Season 1',
        competition_name: 'Test Competition',
        scheduled_at: '2025-02-15T18:00:00.000000Z',
        drivers_registered: 22,
        is_next: true,
      },
    ],
    championship_leaders: [
      {
        position: 1,
        driver_name: 'John Doe',
        season_name: 'Season 1',
        points: 125,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const composable = usePublicLeagueDetail(mockLeagueSlug);

      expect(composable.isLoading.value).toBe(false);
      expect(composable.error.value).toBe(null);
      expect(composable.league.value).toBe(null);
      expect(composable.stats.value).toBe(null);
      expect(composable.competitions.value).toEqual([]);
      expect(composable.recentActivity.value).toEqual([]);
      expect(composable.upcomingRaces.value).toEqual([]);
      expect(composable.championshipLeaders.value).toEqual([]);
    });
  });

  describe('fetchLeague', () => {
    it('should fetch league data successfully', async () => {
      vi.mocked(publicApi.fetchLeague).mockResolvedValue(mockResponse);

      const composable = usePublicLeagueDetail(mockLeagueSlug);

      expect(composable.isLoading.value).toBe(false);

      const fetchPromise = composable.fetchLeague();

      // Should be loading
      expect(composable.isLoading.value).toBe(true);
      expect(composable.error.value).toBe(null);

      await fetchPromise;
      await nextTick();

      // Should have loaded data
      expect(composable.isLoading.value).toBe(false);
      expect(composable.error.value).toBe(null);
      expect(composable.league.value).toEqual(mockResponse.league);
      expect(composable.stats.value).toEqual(mockResponse.stats);
      expect(composable.competitions.value).toEqual(mockResponse.competitions);
      expect(composable.recentActivity.value).toEqual(mockResponse.recent_activity);
      expect(composable.upcomingRaces.value).toEqual(mockResponse.upcoming_races);
      expect(composable.championshipLeaders.value).toEqual(mockResponse.championship_leaders);

      expect(publicApi.fetchLeague).toHaveBeenCalledWith(mockLeagueSlug);
      expect(publicApi.fetchLeague).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors with Error instance', async () => {
      const errorMessage = 'League not found';
      vi.mocked(publicApi.fetchLeague).mockRejectedValue(new Error(errorMessage));

      const composable = usePublicLeagueDetail(mockLeagueSlug);

      await composable.fetchLeague();
      await nextTick();

      expect(composable.isLoading.value).toBe(false);
      expect(composable.error.value).toBe(errorMessage);
      expect(composable.league.value).toBe(null);
    });

    it('should handle fetch errors with unknown error type', async () => {
      vi.mocked(publicApi.fetchLeague).mockRejectedValue('Unknown error');

      const composable = usePublicLeagueDetail(mockLeagueSlug);

      await composable.fetchLeague();
      await nextTick();

      expect(composable.isLoading.value).toBe(false);
      expect(composable.error.value).toBe('Failed to fetch league details');
      expect(composable.league.value).toBe(null);
    });

    it('should reset error state on new fetch attempt', async () => {
      vi.mocked(publicApi.fetchLeague).mockRejectedValueOnce(new Error('First error'));

      const composable = usePublicLeagueDetail(mockLeagueSlug);

      await composable.fetchLeague();
      expect(composable.error.value).toBe('First error');

      // Second fetch succeeds
      vi.mocked(publicApi.fetchLeague).mockResolvedValue(mockResponse);
      await composable.fetchLeague();
      await nextTick();

      expect(composable.error.value).toBe(null);
      expect(composable.league.value).toEqual(mockResponse.league);
    });
  });

  describe('computed properties', () => {
    describe('hasSocialLinks', () => {
      it('should return true when league has social links', async () => {
        vi.mocked(publicApi.fetchLeague).mockResolvedValue(mockResponse);

        const composable = usePublicLeagueDetail(mockLeagueSlug);
        await composable.fetchLeague();
        await nextTick();

        expect(composable.hasSocialLinks.value).toBe(true);
      });

      it('should return false when league has no social links', async () => {
        const noSocialLinksResponse: PublicLeagueDetailResponse = {
          ...mockResponse,
          league: {
            ...mockResponse.league,
            discord_url: null,
            website_url: null,
            twitter_handle: null,
            youtube_url: null,
            twitch_url: null,
          },
        };

        vi.mocked(publicApi.fetchLeague).mockResolvedValue(noSocialLinksResponse);

        const composable = usePublicLeagueDetail(mockLeagueSlug);
        await composable.fetchLeague();
        await nextTick();

        expect(composable.hasSocialLinks.value).toBe(false);
      });

      it('should return false when league is null', () => {
        const composable = usePublicLeagueDetail(mockLeagueSlug);
        expect(composable.hasSocialLinks.value).toBe(false);
      });

      it('should return true when at least one social link exists', async () => {
        const oneSocialLinkResponse: PublicLeagueDetailResponse = {
          ...mockResponse,
          league: {
            ...mockResponse.league,
            discord_url: null,
            website_url: 'https://example.com',
            twitter_handle: null,
            youtube_url: null,
            twitch_url: null,
          },
        };

        vi.mocked(publicApi.fetchLeague).mockResolvedValue(oneSocialLinkResponse);

        const composable = usePublicLeagueDetail(mockLeagueSlug);
        await composable.fetchLeague();
        await nextTick();

        expect(composable.hasSocialLinks.value).toBe(true);
      });
    });

    describe('totalSeasons', () => {
      it('should calculate total seasons across all competitions', async () => {
        const comp0 = mockResponse.competitions[0]!;
        const multiCompetitionResponse: PublicLeagueDetailResponse = {
          ...mockResponse,
          competitions: [
            {
              id: comp0.id,
              name: comp0.name,
              slug: comp0.slug,
              description: comp0.description,
              logo_url: comp0.logo_url,
              competition_colour: comp0.competition_colour,
              platform: comp0.platform,
              stats: comp0.stats,
              seasons: [
                {
                  id: 1,
                  name: 'S1',
                  slug: 's1',
                  car_class: 'GT3',
                  status: 'active',
                  stats: {
                    total_drivers: 10,
                    active_drivers: 10,
                    total_rounds: 5,
                    completed_rounds: 2,
                  },
                },
                {
                  id: 2,
                  name: 'S2',
                  slug: 's2',
                  car_class: 'GT3',
                  status: 'completed',
                  stats: {
                    total_drivers: 8,
                    active_drivers: 0,
                    total_rounds: 5,
                    completed_rounds: 5,
                  },
                },
              ],
            },
            {
              id: 2,
              name: 'Competition 2',
              slug: 'comp-2',
              description: null,
              logo_url: null,
              competition_colour: null,
              platform: { id: 1, name: 'PC', slug: 'pc' },
              stats: { total_seasons: 3, active_seasons: 1, total_drivers: 15 },
              seasons: [
                {
                  id: 3,
                  name: 'S1',
                  slug: 's1',
                  car_class: 'GT4',
                  status: 'active',
                  stats: {
                    total_drivers: 15,
                    active_drivers: 15,
                    total_rounds: 8,
                    completed_rounds: 3,
                  },
                },
                {
                  id: 4,
                  name: 'S2',
                  slug: 's2',
                  car_class: 'GT4',
                  status: 'setup',
                  stats: {
                    total_drivers: 0,
                    active_drivers: 0,
                    total_rounds: 8,
                    completed_rounds: 0,
                  },
                },
                {
                  id: 5,
                  name: 'S3',
                  slug: 's3',
                  car_class: 'GT4',
                  status: 'archived',
                  stats: {
                    total_drivers: 12,
                    active_drivers: 0,
                    total_rounds: 10,
                    completed_rounds: 10,
                  },
                },
              ],
            },
          ],
        };

        vi.mocked(publicApi.fetchLeague).mockResolvedValue(multiCompetitionResponse);

        const composable = usePublicLeagueDetail(mockLeagueSlug);
        await composable.fetchLeague();
        await nextTick();

        // 2 seasons + 3 seasons = 5 total
        expect(composable.totalSeasons.value).toBe(5);
      });

      it('should return 0 when no competitions exist', () => {
        const composable = usePublicLeagueDetail(mockLeagueSlug);
        expect(composable.totalSeasons.value).toBe(0);
      });

      it('should return 0 when competitions have no seasons', async () => {
        const comp0 = mockResponse.competitions[0]!;
        const noSeasonsResponse: PublicLeagueDetailResponse = {
          ...mockResponse,
          competitions: [
            {
              id: comp0.id,
              name: comp0.name,
              slug: comp0.slug,
              description: comp0.description,
              logo_url: comp0.logo_url,
              competition_colour: comp0.competition_colour,
              platform: comp0.platform,
              stats: comp0.stats,
              seasons: [],
            },
          ],
        };

        vi.mocked(publicApi.fetchLeague).mockResolvedValue(noSeasonsResponse);

        const composable = usePublicLeagueDetail(mockLeagueSlug);
        await composable.fetchLeague();
        await nextTick();

        expect(composable.totalSeasons.value).toBe(0);
      });
    });

    describe('platformsList', () => {
      it('should return platforms array when league exists', async () => {
        vi.mocked(publicApi.fetchLeague).mockResolvedValue(mockResponse);

        const composable = usePublicLeagueDetail(mockLeagueSlug);
        await composable.fetchLeague();
        await nextTick();

        expect(composable.platformsList.value).toEqual([
          { id: 1, name: 'PC', slug: 'pc' },
          { id: 2, name: 'PlayStation', slug: 'playstation' },
        ]);
      });

      it('should return empty array when league is null', () => {
        const composable = usePublicLeagueDetail(mockLeagueSlug);
        expect(composable.platformsList.value).toEqual([]);
      });

      it('should return empty array when platforms is empty', async () => {
        const noPlatformsResponse: PublicLeagueDetailResponse = {
          ...mockResponse,
          league: {
            ...mockResponse.league,
            platforms: [],
          },
        };

        vi.mocked(publicApi.fetchLeague).mockResolvedValue(noPlatformsResponse);

        const composable = usePublicLeagueDetail(mockLeagueSlug);
        await composable.fetchLeague();
        await nextTick();

        expect(composable.platformsList.value).toEqual([]);
      });
    });
  });

  describe('error handling and edge cases', () => {
    it('should log error to console when fetch fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Network error');

      vi.mocked(publicApi.fetchLeague).mockRejectedValue(testError);

      const composable = usePublicLeagueDetail(mockLeagueSlug);
      await composable.fetchLeague();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching league:', testError);

      consoleErrorSpy.mockRestore();
    });

    it('should be callable multiple times', async () => {
      vi.mocked(publicApi.fetchLeague).mockResolvedValue(mockResponse);

      const composable = usePublicLeagueDetail(mockLeagueSlug);

      await composable.fetchLeague();
      await composable.fetchLeague();
      await composable.fetchLeague();

      expect(publicApi.fetchLeague).toHaveBeenCalledTimes(3);
      expect(composable.league.value).toEqual(mockResponse.league);
    });

    it('should maintain reactivity after multiple fetches', async () => {
      const firstResponse = { ...mockResponse };
      const secondResponse: PublicLeagueDetailResponse = {
        ...mockResponse,
        league: {
          ...mockResponse.league,
          name: 'Updated League Name',
        },
      };

      vi.mocked(publicApi.fetchLeague).mockResolvedValueOnce(firstResponse);

      const composable = usePublicLeagueDetail(mockLeagueSlug);

      await composable.fetchLeague();
      expect(composable.league.value?.name).toBe('Test League');

      vi.mocked(publicApi.fetchLeague).mockResolvedValueOnce(secondResponse);
      await composable.fetchLeague();
      await nextTick();

      expect(composable.league.value?.name).toBe('Updated League Name');
    });
  });
});
