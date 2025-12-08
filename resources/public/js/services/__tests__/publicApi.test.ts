import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import type { PublicLeague, Platform } from '@public/types/public';

vi.mock('axios');

describe('PublicApiService', () => {
  const mockedAxios = vi.mocked(axios, true);
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockGet = vi.fn();
    (mockedAxios.create as ReturnType<typeof vi.fn>).mockReturnValue({
      get: mockGet,
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      defaults: {},
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchLeagues', () => {
    it('fetches leagues with default parameters', async () => {
      const mockResponse = {
        data: {
          data: {
            data: [
              {
                id: 1,
                name: 'Test League',
                slug: 'test-league',
                tagline: 'Test tagline',
                description: 'Test description',
                logo_url: null,
                header_image_url: null,
                platforms: [{ id: 1, name: 'GT7', slug: 'gt7' }],
                discord_url: null,
                website_url: null,
                twitter_handle: null,
                instagram_handle: null,
                youtube_url: null,
                twitch_url: null,
                visibility: 'public' as const,
                competitions_count: 3,
                drivers_count: 24,
              },
            ],
            meta: {
              current_page: 1,
              last_page: 1,
              per_page: 12,
              total: 1,
            },
          },
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const { publicApi } = await import('../publicApi');
      const result = await publicApi.fetchLeagues();

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0]?.name).toBe('Test League');
    });

    it('fetches leagues with search parameter', async () => {
      const mockResponse = {
        data: {
          data: {
            data: [] as PublicLeague[],
            meta: {
              current_page: 1,
              last_page: 1,
              per_page: 12,
              total: 0,
            },
          },
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const { publicApi } = await import('../publicApi');
      await publicApi.fetchLeagues({ search: 'GT7' });

      expect(mockGet).toHaveBeenCalledWith('/leagues', {
        params: {
          page: 1,
          per_page: 12,
          search: 'GT7',
          platform_id: undefined,
        },
      });
    });

    it('fetches leagues with platform filter', async () => {
      const mockResponse = {
        data: {
          data: {
            data: [] as PublicLeague[],
            meta: {
              current_page: 1,
              last_page: 1,
              per_page: 12,
              total: 0,
            },
          },
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const { publicApi } = await import('../publicApi');
      await publicApi.fetchLeagues({ platform_id: 1 });

      expect(mockGet).toHaveBeenCalledWith('/leagues', {
        params: {
          page: 1,
          per_page: 12,
          search: undefined,
          platform_id: 1,
        },
      });
    });

    it('fetches leagues with pagination parameters', async () => {
      const mockResponse = {
        data: {
          data: {
            data: [] as PublicLeague[],
            meta: {
              current_page: 2,
              last_page: 5,
              per_page: 24,
              total: 100,
            },
          },
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const { publicApi } = await import('../publicApi');
      await publicApi.fetchLeagues({ page: 2, per_page: 24 });

      expect(mockGet).toHaveBeenCalledWith('/leagues', {
        params: {
          page: 2,
          per_page: 24,
          search: undefined,
          platform_id: undefined,
        },
      });
    });

    it('handles API errors gracefully', async () => {
      const mockError = new Error('Network error');
      mockGet.mockRejectedValue(mockError);

      const { publicApi } = await import('../publicApi');
      await expect(publicApi.fetchLeagues()).rejects.toThrow('Network error');
    });
  });

  describe('fetchPlatforms', () => {
    it('fetches all platforms', async () => {
      const mockPlatforms: Platform[] = [
        { id: 1, name: 'GT7', slug: 'gt7' },
        { id: 2, name: 'iRacing', slug: 'iracing' },
        { id: 3, name: 'ACC', slug: 'acc' },
      ];

      const mockResponse = {
        data: {
          data: mockPlatforms,
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const { publicApi } = await import('../publicApi');
      const result = await publicApi.fetchPlatforms();

      expect(result).toHaveLength(3);
      expect(result[0]?.name).toBe('GT7');
      expect(mockGet).toHaveBeenCalledWith('/platforms');
    });

    it('handles API errors gracefully', async () => {
      const mockError = new Error('Failed to fetch platforms');
      mockGet.mockRejectedValue(mockError);

      const { publicApi } = await import('../publicApi');
      await expect(publicApi.fetchPlatforms()).rejects.toThrow('Failed to fetch platforms');
    });
  });
});
