import { apiClient } from '@public/services/api';
import { API_ENDPOINTS } from '@public/constants/apiEndpoints';
import type {
  PublicLeague,
  PublicLeagueDetailResponse,
  PublicSeasonDetailResponse,
  Platform,
  RoundResultsResponse,
} from '@public/types/public';

/**
 * League list query parameters
 */
export interface LeagueListParams {
  search?: string;
  platform?: string | number | null;
  sort?: 'popular' | 'recent' | 'name';
  page?: number;
  perPage?: number;
}

/**
 * Paginated league list response
 */
export interface LeagueListResponse {
  data: PublicLeague[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

/**
 * API Response wrapper from Laravel ApiResponse helper
 */
interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * League Service
 * Handles all API calls related to public leagues browsing
 */
export const leagueService = {
  /**
   * Get paginated list of public leagues with filters
   */
  async getLeagues(
    params: LeagueListParams = {},
    signal?: AbortSignal,
  ): Promise<LeagueListResponse> {
    const response = await apiClient.get<ApiResponseWrapper<LeagueListResponse>>(
      API_ENDPOINTS.PUBLIC.LEAGUES,
      { params, signal },
    );
    // Extract from ApiResponse wrapper
    return response.data.data;
  },

  /**
   * Get detailed information about a specific league by slug
   */
  async getLeagueDetail(slug: string, signal?: AbortSignal): Promise<PublicLeagueDetailResponse> {
    const response = await apiClient.get<ApiResponseWrapper<PublicLeagueDetailResponse>>(
      API_ENDPOINTS.PUBLIC.LEAGUE_DETAIL(slug),
      { signal },
    );
    // Extract from ApiResponse wrapper
    return response.data.data;
  },

  /**
   * Get season detail with standings and rounds
   */
  async getSeasonDetail(
    leagueSlug: string,
    seasonSlug: string,
    signal?: AbortSignal,
  ): Promise<PublicSeasonDetailResponse> {
    const response = await apiClient.get<ApiResponseWrapper<PublicSeasonDetailResponse>>(
      API_ENDPOINTS.PUBLIC.SEASON_DETAIL(leagueSlug, seasonSlug),
      { signal },
    );
    // Extract from ApiResponse wrapper
    return response.data.data;
  },

  /**
   * Get list of available platforms for filtering
   */
  async getPlatforms(): Promise<Platform[]> {
    const response = await apiClient.get<ApiResponseWrapper<Platform[]>>(
      API_ENDPOINTS.PUBLIC.PLATFORMS,
    );
    // Extract from ApiResponse wrapper
    return response.data.data;
  },

  /**
   * Get round results with race events and standings
   */
  async getRoundResults(roundId: number): Promise<RoundResultsResponse> {
    const response = await apiClient.get<ApiResponseWrapper<RoundResultsResponse>>(
      API_ENDPOINTS.PUBLIC.ROUND_RESULTS(roundId),
    );
    // Extract from ApiResponse wrapper
    return response.data.data;
  },
};
