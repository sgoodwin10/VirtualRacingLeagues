import { describe, it, expect, beforeEach, vi } from 'vitest';
import { leagueService } from './leagueService';
import { apiClient } from './api';
import { API_ENDPOINTS } from '@public/constants/apiEndpoints';
import type {
  PublicLeagueDetailResponse,
  PublicSeasonDetailResponse,
  Platform,
  RoundResultsResponse,
} from '@public/types/public';
import type { LeagueListResponse } from './leagueService';

// Mock dependencies
vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('leagueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeagues', () => {
    const mockLeaguesData: LeagueListResponse = {
      data: [
        {
          id: 1,
          name: 'Test League',
          slug: 'test-league',
          description: 'A test league',
          platform: { id: 1, name: 'PC', abbreviation: 'PC' },
          logo_url: 'https://example.com/logo.png',
          featured_image_url: null,
          is_active: true,
        },
      ],
      meta: {
        total: 1,
        per_page: 20,
        current_page: 1,
        last_page: 1,
      },
    };

    it('should fetch leagues without params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      const result = await leagueService.getLeagues();

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, { params: {} });
      expect(result).toEqual(mockLeaguesData);
    });

    it('should fetch leagues with search query', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      await leagueService.getLeagues({ search: 'test' });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, {
        params: { search: 'test' },
      });
    });

    it('should fetch leagues with platform filter', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      await leagueService.getLeagues({ platform: 1 });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, {
        params: { platform: 1 },
      });
    });

    it('should fetch leagues with platform string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      await leagueService.getLeagues({ platform: 'PC' });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, {
        params: { platform: 'PC' },
      });
    });

    it('should fetch leagues with null platform', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      await leagueService.getLeagues({ platform: null });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, {
        params: { platform: null },
      });
    });

    it('should fetch leagues with popular sort', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      await leagueService.getLeagues({ sort: 'popular' });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, {
        params: { sort: 'popular' },
      });
    });

    it('should fetch leagues with recent sort', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      await leagueService.getLeagues({ sort: 'recent' });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, {
        params: { sort: 'recent' },
      });
    });

    it('should fetch leagues with name sort', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      await leagueService.getLeagues({ sort: 'name' });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, {
        params: { sort: 'name' },
      });
    });

    it('should fetch leagues with pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      await leagueService.getLeagues({ page: 2, perPage: 10 });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, {
        params: { page: 2, perPage: 10 },
      });
    });

    it('should fetch leagues with all params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      await leagueService.getLeagues({
        search: 'formula',
        platform: 1,
        sort: 'popular',
        page: 2,
        perPage: 15,
      });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUES, {
        params: {
          search: 'formula',
          platform: 1,
          sort: 'popular',
          page: 2,
          perPage: 15,
        },
      });
    });

    it('should unwrap ApiResponse wrapper', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeaguesData },
      });

      const result = await leagueService.getLeagues();

      expect(result).toEqual(mockLeaguesData);
      expect(result).not.toHaveProperty('success');
    });

    it('should propagate API errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(leagueService.getLeagues()).rejects.toEqual(error);
    });
  });

  describe('getLeagueDetail', () => {
    const mockLeagueDetail: PublicLeagueDetailResponse = {
      id: 1,
      name: 'Test League',
      slug: 'test-league',
      description: 'A test league',
      platform: { id: 1, name: 'PC', abbreviation: 'PC' },
      logo_url: 'https://example.com/logo.png',
      featured_image_url: null,
      is_active: true,
      seasons: [
        {
          id: 1,
          name: 'Season 1',
          slug: 'season-1',
          status: 'active',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
        },
      ],
    };

    it('should fetch league detail by slug', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeagueDetail },
      });

      const result = await leagueService.getLeagueDetail('test-league');

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.LEAGUE_DETAIL('test-league'));
      expect(result).toEqual(mockLeagueDetail);
    });

    it('should unwrap ApiResponse wrapper', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockLeagueDetail },
      });

      const result = await leagueService.getLeagueDetail('test-league');

      expect(result).toEqual(mockLeagueDetail);
      expect(result).not.toHaveProperty('success');
    });

    it('should handle 404 not found', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'League not found' },
        },
      };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(leagueService.getLeagueDetail('non-existent')).rejects.toEqual(error);
    });

    it('should propagate API errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(leagueService.getLeagueDetail('test-league')).rejects.toEqual(error);
    });
  });

  describe('getSeasonDetail', () => {
    const mockSeasonDetail: PublicSeasonDetailResponse = {
      id: 1,
      name: 'Season 1',
      slug: 'season-1',
      status: 'active',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      league: {
        id: 1,
        name: 'Test League',
        slug: 'test-league',
      },
      standings: [],
      rounds: [],
    };

    it('should fetch season detail by league and season slug', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockSeasonDetail },
      });

      const result = await leagueService.getSeasonDetail('test-league', 'season-1');

      expect(apiClient.get).toHaveBeenCalledWith(
        API_ENDPOINTS.PUBLIC.SEASON_DETAIL('test-league', 'season-1'),
      );
      expect(result).toEqual(mockSeasonDetail);
    });

    it('should unwrap ApiResponse wrapper', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockSeasonDetail },
      });

      const result = await leagueService.getSeasonDetail('test-league', 'season-1');

      expect(result).toEqual(mockSeasonDetail);
      expect(result).not.toHaveProperty('success');
    });

    it('should propagate API errors', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Season not found' },
        },
      };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(leagueService.getSeasonDetail('test-league', 'season-1')).rejects.toEqual(error);
    });
  });

  describe('getPlatforms', () => {
    const mockPlatforms: Platform[] = [
      { id: 1, name: 'PC', abbreviation: 'PC' },
      { id: 2, name: 'PlayStation', abbreviation: 'PS' },
      { id: 3, name: 'Xbox', abbreviation: 'XB' },
    ];

    it('should fetch platforms list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockPlatforms },
      });

      const result = await leagueService.getPlatforms();

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.PLATFORMS);
      expect(result).toEqual(mockPlatforms);
    });

    it('should unwrap ApiResponse wrapper', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockPlatforms },
      });

      const result = await leagueService.getPlatforms();

      expect(result).toEqual(mockPlatforms);
      expect(result).not.toHaveProperty('success');
    });

    it('should propagate API errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(leagueService.getPlatforms()).rejects.toEqual(error);
    });
  });

  describe('getRoundResults', () => {
    const mockRoundResults: RoundResultsResponse = {
      round: {
        id: 1,
        number: 1,
        name: 'Round 1',
        date: '2024-01-15',
      },
      races: [],
      standings: [],
    };

    it('should fetch round results by round id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockRoundResults },
      });

      const result = await leagueService.getRoundResults(1);

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.ROUND_RESULTS(1));
      expect(result).toEqual(mockRoundResults);
    });

    it('should unwrap ApiResponse wrapper', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockRoundResults },
      });

      const result = await leagueService.getRoundResults(1);

      expect(result).toEqual(mockRoundResults);
      expect(result).not.toHaveProperty('success');
    });

    it('should handle numeric round id', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, data: mockRoundResults },
      });

      await leagueService.getRoundResults(123);

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC.ROUND_RESULTS(123));
    });

    it('should propagate API errors', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Round not found' },
        },
      };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(leagueService.getRoundResults(999)).rejects.toEqual(error);
    });
  });
});
