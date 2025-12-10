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

    it('throws NotFoundError for 404 status', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Leagues not found' },
        },
      };
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      mockGet.mockRejectedValue(mockError);

      const { publicApi, NotFoundError } = await import('../publicApi');
      await expect(publicApi.fetchLeagues()).rejects.toThrow(NotFoundError);
      await expect(publicApi.fetchLeagues()).rejects.toThrow('Leagues not found');
    });

    it('throws NetworkError when no response received', async () => {
      const mockError = {
        isAxiosError: true,
        response: undefined,
      };
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      mockGet.mockRejectedValue(mockError);

      const { publicApi, NetworkError } = await import('../publicApi');
      await expect(publicApi.fetchLeagues()).rejects.toThrow(NetworkError);
      await expect(publicApi.fetchLeagues()).rejects.toThrow(
        'Network error occurred. Please check your connection.',
      );
    });

    it('throws ApiError for 500 status with status code', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      mockGet.mockRejectedValue(mockError);

      const { publicApi, ApiError } = await import('../publicApi');
      try {
        await publicApi.fetchLeagues();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).statusCode).toBe(500);
        expect((error as InstanceType<typeof ApiError>).message).toBe('Internal server error');
      }
    });

    it('throws ApiError for unexpected errors', async () => {
      const mockError = new Error('Unexpected error');
      vi.mocked(axios.isAxiosError).mockReturnValue(false);
      mockGet.mockRejectedValue(mockError);

      const { publicApi, ApiError } = await import('../publicApi');
      try {
        await publicApi.fetchLeagues();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as InstanceType<typeof ApiError>).message).toBe(
          'Unexpected error while trying to fetch leagues',
        );
        expect((error as InstanceType<typeof ApiError>).statusCode).toBeUndefined();
        expect((error as InstanceType<typeof ApiError>).originalError).toBe(mockError);
      }
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

    it('throws NotFoundError for 404 status', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Platforms not found' },
        },
      };
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      mockGet.mockRejectedValue(mockError);

      const { publicApi, NotFoundError } = await import('../publicApi');
      await expect(publicApi.fetchPlatforms()).rejects.toThrow(NotFoundError);
    });

    it('uses default error message when API does not provide one', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
      };
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      mockGet.mockRejectedValue(mockError);

      const { publicApi } = await import('../publicApi');
      await expect(publicApi.fetchPlatforms()).rejects.toThrow('Failed to fetch platforms');
    });
  });

  describe('fetchLeague', () => {
    it('throws NotFoundError with correct context when league not found', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {},
        },
      };
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      mockGet.mockRejectedValue(mockError);

      const { publicApi } = await import('../publicApi');
      await expect(publicApi.fetchLeague('test-slug')).rejects.toThrow(
        'Failed to fetch league details',
      );
    });
  });

  describe('fetchSeasonDetail', () => {
    it('throws NotFoundError with correct context when season not found', async () => {
      const mockError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            message: 'Season not found',
          },
        },
      };
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      mockGet.mockRejectedValue(mockError);

      const { publicApi, NotFoundError } = await import('../publicApi');
      await expect(publicApi.fetchSeasonDetail('league-slug', 'season-slug')).rejects.toThrow(
        NotFoundError,
      );
      await expect(publicApi.fetchSeasonDetail('league-slug', 'season-slug')).rejects.toThrow(
        'Season not found',
      );
    });
  });
});
