import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leagueService } from './leagueService';
import { apiService } from './api';
import { createMockLeague } from '@admin/__tests__/helpers/mockFactories';
import type { LeagueDetails, LeagueListParams } from '@admin/types/league';

vi.mock('./api');
vi.mock('@admin/utils/errorHandler');

describe('leagueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeagues', () => {
    it('fetches leagues successfully', async () => {
      const mockLeagues = [createMockLeague(), createMockLeague()];
      const mockResponse = {
        success: true,
        data: mockLeagues,
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          path: '/admin/api/leagues',
          per_page: 15,
          to: 2,
          total: 2,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await leagueService.getLeagues();

      expect(apiService.get).toHaveBeenCalledWith('/leagues', {
        params: undefined,
        signal: undefined,
      });
      expect(result.data).toEqual(mockLeagues);
      expect(result.total).toBe(2);
      expect(result.current_page).toBe(1);
    });

    it('passes query parameters correctly', async () => {
      const params: LeagueListParams = {
        page: 2,
        per_page: 25,
        search: 'test',
        visibility: 'public',
        status: 'active',
        platform_ids: [1, 2],
        sort_by: 'name',
        sort_direction: 'asc',
      };

      const mockResponse = {
        success: true,
        data: [],
        meta: {
          current_page: 2,
          from: 26,
          last_page: 3,
          path: '/admin/api/leagues',
          per_page: 25,
          to: 50,
          total: 75,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await leagueService.getLeagues(params);

      expect(apiService.get).toHaveBeenCalledWith('/leagues', {
        params,
        signal: undefined,
      });
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const mockResponse = {
        success: true,
        data: [],
        meta: {
          current_page: 1,
          from: 0,
          last_page: 1,
          path: '/admin/api/leagues',
          per_page: 15,
          to: 0,
          total: 0,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await leagueService.getLeagues(undefined, abortController.signal);

      expect(apiService.get).toHaveBeenCalledWith('/leagues', {
        params: undefined,
        signal: abortController.signal,
      });
    });

    it('transforms backend pagination metadata correctly', async () => {
      const mockResponse = {
        success: true,
        data: [createMockLeague()],
        meta: {
          current_page: 2,
          from: 16,
          last_page: 5,
          path: '/admin/api/leagues',
          per_page: 15,
          to: 30,
          total: 75,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await leagueService.getLeagues();

      expect(result.current_page).toBe(2);
      expect(result.last_page).toBe(5);
      expect(result.per_page).toBe(15);
      expect(result.total).toBe(75);
      expect(result.from).toBe(16);
      expect(result.to).toBe(30);
      expect(result.first_page_url).toBe('/admin/api/leagues?page=1');
      expect(result.last_page_url).toBe('/admin/api/leagues?page=5');
      expect(result.next_page_url).toBe('/admin/api/leagues?page=3');
      expect(result.prev_page_url).toBe('/admin/api/leagues?page=1');
    });

    it('returns null for next_page_url on last page', async () => {
      const mockResponse = {
        success: true,
        data: [createMockLeague()],
        meta: {
          current_page: 5,
          from: 61,
          last_page: 5,
          path: '/admin/api/leagues',
          per_page: 15,
          to: 75,
          total: 75,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await leagueService.getLeagues();

      expect(result.next_page_url).toBeNull();
    });

    it('returns null for prev_page_url on first page', async () => {
      const mockResponse = {
        success: true,
        data: [createMockLeague()],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 5,
          path: '/admin/api/leagues',
          per_page: 15,
          to: 15,
          total: 75,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await leagueService.getLeagues();

      expect(result.prev_page_url).toBeNull();
    });

    it('returns empty paginated response when no data', async () => {
      const mockResponse = {
        success: false,
        data: undefined,
        meta: undefined,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await leagueService.getLeagues();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.current_page).toBe(1);
      expect(result.last_page).toBe(1);
    });

    it('handles API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(leagueService.getLeagues()).rejects.toThrow('Network error');
    });
  });

  describe('getLeague', () => {
    it('fetches single league successfully', async () => {
      const mockLeague = createMockLeague({ id: 123 });
      const mockResponse = {
        success: true,
        data: mockLeague,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await leagueService.getLeague(123);

      expect(apiService.get).toHaveBeenCalledWith('/leagues/123', { signal: undefined });
      expect(result).toEqual(mockLeague);
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const mockLeague = createMockLeague();
      const mockResponse = {
        success: true,
        data: mockLeague,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await leagueService.getLeague(123, abortController.signal);

      expect(apiService.get).toHaveBeenCalledWith('/leagues/123', {
        signal: abortController.signal,
      });
    });

    it('throws error when response is not successful', async () => {
      const mockResponse = {
        success: false,
        data: null,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await expect(leagueService.getLeague(123)).rejects.toThrow('Failed to fetch league');
    });

    it('handles API errors', async () => {
      const error = new Error('Not found');
      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(leagueService.getLeague(123)).rejects.toThrow('Not found');
    });
  });

  describe('getLeagueDetails', () => {
    it('fetches league details successfully', async () => {
      const mockLeagueDetails: LeagueDetails = {
        ...createMockLeague({ id: 123 }),
        competitions: [
          {
            id: 1,
            name: 'Test Competition',
            slug: 'test-competition',
            status: 'active',
            platform_id: 1,
            platform_name: 'PlayStation',
            platform_slug: 'playstation',
            season_count: 3,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        seasons_summary: {
          total: 10,
          active: 3,
          completed: 7,
        },
        stats: {
          total_drivers: 50,
          total_races: 120,
          total_competitions: 5,
        },
      };

      const mockResponse = {
        success: true,
        data: mockLeagueDetails,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      const result = await leagueService.getLeagueDetails(123);

      expect(apiService.get).toHaveBeenCalledWith('/leagues/123/details', { signal: undefined });
      expect(result).toEqual(mockLeagueDetails);
      expect(result.competitions).toBeDefined();
      expect(result.seasons_summary).toBeDefined();
      expect(result.stats).toBeDefined();
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const mockLeagueDetails: LeagueDetails = createMockLeague();
      const mockResponse = {
        success: true,
        data: mockLeagueDetails,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await leagueService.getLeagueDetails(123, abortController.signal);

      expect(apiService.get).toHaveBeenCalledWith('/leagues/123/details', {
        signal: abortController.signal,
      });
    });

    it('throws error when response is not successful', async () => {
      const mockResponse = {
        success: false,
        data: null,
      };

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      await expect(leagueService.getLeagueDetails(123)).rejects.toThrow(
        'Failed to fetch league details',
      );
    });

    it('handles API errors', async () => {
      const error = new Error('Server error');
      vi.mocked(apiService.get).mockRejectedValue(error);

      await expect(leagueService.getLeagueDetails(123)).rejects.toThrow('Server error');
    });
  });

  describe('archiveLeague', () => {
    it('archives league successfully', async () => {
      const mockResponse = {
        success: true,
        data: null,
      };

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      await leagueService.archiveLeague(123);

      expect(apiService.post).toHaveBeenCalledWith(
        '/leagues/123/archive',
        {},
        { signal: undefined },
      );
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const mockResponse = {
        success: true,
        data: null,
      };

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      await leagueService.archiveLeague(123, abortController.signal);

      expect(apiService.post).toHaveBeenCalledWith(
        '/leagues/123/archive',
        {},
        {
          signal: abortController.signal,
        },
      );
    });

    it('handles API errors', async () => {
      const error = new Error('Archive failed');
      vi.mocked(apiService.post).mockRejectedValue(error);

      await expect(leagueService.archiveLeague(123)).rejects.toThrow('Archive failed');
    });
  });

  describe('deleteLeague', () => {
    it('deletes league successfully', async () => {
      const mockResponse = {
        success: true,
        data: null,
      };

      vi.mocked(apiService.delete).mockResolvedValue(mockResponse);

      await leagueService.deleteLeague(123);

      expect(apiService.delete).toHaveBeenCalledWith('/leagues/123', { signal: undefined });
    });

    it('passes abort signal when provided', async () => {
      const abortController = new AbortController();
      const mockResponse = {
        success: true,
        data: null,
      };

      vi.mocked(apiService.delete).mockResolvedValue(mockResponse);

      await leagueService.deleteLeague(123, abortController.signal);

      expect(apiService.delete).toHaveBeenCalledWith('/leagues/123', {
        signal: abortController.signal,
      });
    });

    it('handles API errors', async () => {
      const error = new Error('Delete failed');
      vi.mocked(apiService.delete).mockRejectedValue(error);

      await expect(leagueService.deleteLeague(123)).rejects.toThrow('Delete failed');
    });
  });

  describe('Service Singleton', () => {
    it('exports a singleton instance', () => {
      expect(leagueService).toBeDefined();
      expect(typeof leagueService.getLeagues).toBe('function');
      expect(typeof leagueService.getLeague).toBe('function');
      expect(typeof leagueService.getLeagueDetails).toBe('function');
      expect(typeof leagueService.archiveLeague).toBe('function');
      expect(typeof leagueService.deleteLeague).toBe('function');
    });
  });
});
