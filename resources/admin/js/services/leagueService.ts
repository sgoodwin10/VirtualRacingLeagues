import { apiService } from './api';
import type {
  League,
  LeagueDetails,
  LeagueListParams,
  PaginatedResponse,
  ApiResponse,
} from '@admin/types/league';
import { handleServiceError } from '@admin/utils/errorHandler';

/**
 * League Service
 * Handles league management operations
 */
class LeagueService {
  /**
   * Get leagues with pagination
   * @param params - Optional filters for league list
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<PaginatedResponse<League>>
   */
  async getLeagues(
    params?: LeagueListParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<League>> {
    try {
      // Backend returns: { success: true, data: [...leagues], meta: {...pagination} }
      const response = await apiService.get<{
        success: boolean;
        data: League[];
        meta: {
          current_page: number;
          from: number;
          last_page: number;
          path: string;
          per_page: number;
          to: number;
          total: number;
        };
      }>('/leagues', {
        params,
        signal,
      });

      // Transform backend response into PaginatedResponse format
      if (response.success && response.data) {
        return {
          current_page: response.meta.current_page,
          data: response.data, // Leagues array from response.data
          first_page_url: `${response.meta.path}?page=1`,
          from: response.meta.from,
          last_page: response.meta.last_page,
          last_page_url: `${response.meta.path}?page=${response.meta.last_page}`,
          links: [], // Backend doesn't provide links, can be computed if needed
          next_page_url:
            response.meta.current_page < response.meta.last_page
              ? `${response.meta.path}?page=${response.meta.current_page + 1}`
              : null,
          path: response.meta.path,
          per_page: response.meta.per_page,
          prev_page_url:
            response.meta.current_page > 1
              ? `${response.meta.path}?page=${response.meta.current_page - 1}`
              : null,
          to: response.meta.to,
          total: response.meta.total,
        };
      }

      // Return empty paginated response if no data
      return {
        current_page: 1,
        data: [],
        first_page_url: '',
        from: 0,
        last_page: 1,
        last_page_url: '',
        links: [],
        next_page_url: null,
        path: '',
        per_page: 15,
        prev_page_url: null,
        to: 0,
        total: 0,
      };
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }

  /**
   * Get a single league by ID
   * @param id - League ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<League>
   */
  async getLeague(id: number, signal?: AbortSignal): Promise<League> {
    try {
      const response = await apiService.get<ApiResponse<League>>(`/leagues/${id}`, { signal });
      // Return the league from the response
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch league');
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }

  /**
   * Get detailed league information including competitions and stats
   * @param id - League ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<LeagueDetails>
   */
  async getLeagueDetails(id: number, signal?: AbortSignal): Promise<LeagueDetails> {
    try {
      const response = await apiService.get<ApiResponse<LeagueDetails>>(`/leagues/${id}/details`, {
        signal,
      });
      // Return the detailed league from the response
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch league details');
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }

  /**
   * Archive a league
   * @param id - League ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async archiveLeague(id: number, signal?: AbortSignal): Promise<void> {
    try {
      await apiService.post<ApiResponse<null>>(`/leagues/${id}/archive`, {}, { signal });
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }

  /**
   * Delete a league (placeholder - not implemented)
   * @param id - League ID
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<void>
   */
  async deleteLeague(id: number, signal?: AbortSignal): Promise<void> {
    try {
      // Placeholder - does nothing for now
      await apiService.delete<ApiResponse<null>>(`/leagues/${id}`, { signal });
    } catch (error) {
      handleServiceError(error);
      throw error;
    }
  }
}

// Export singleton instance
export const leagueService = new LeagueService();
export default leagueService;
