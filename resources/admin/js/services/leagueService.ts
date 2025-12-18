import { apiService } from './api';
import type {
  League,
  LeagueDetails,
  LeagueListParams,
  PaginatedResponse,
  ApiResponse,
} from '@admin/types/league';
import { handleServiceError } from '@admin/utils/errorHandler';
import { transformPaginatedResponse, type BackendPaginatedResponse } from '@admin/utils/pagination';

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
      const response = await apiService.get<BackendPaginatedResponse<League>>('/leagues', {
        params,
        signal,
      });

      // Transform backend response using utility function
      return transformPaginatedResponse(response);
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
