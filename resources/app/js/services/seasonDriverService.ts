/**
 * Season-Driver API Service
 * Handles all HTTP requests for season-driver assignment management
 */

import { apiClient } from './api';
import type {
  SeasonDriver,
  AddDriverToSeasonRequest,
  UpdateSeasonDriverRequest,
  SeasonDriverQueryParams,
  PaginatedSeasonDriversResponse,
  SeasonDriverStats,
  AvailableDriver,
  PaginatedAvailableDriversResponse,
} from '@app/types/seasonDriver';
import type { LeagueDriversQueryParams } from '@app/types/driver';
import type { AxiosResponse } from 'axios';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

// API response wrapper
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Paginated API response wrapper for season drivers
interface PaginatedApiResponse {
  success: true;
  data: SeasonDriver[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

// Paginated API response wrapper for available drivers
interface PaginatedAvailableDriversApiResponse {
  success: true;
  data: AvailableDriver[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

/**
 * Get all season-driver assignments for a season
 */
export async function getSeasonDrivers(
  seasonId: number,
  params?: SeasonDriverQueryParams,
): Promise<PaginatedSeasonDriversResponse> {
  const response: AxiosResponse<PaginatedApiResponse> = await apiClient.get(
    API_ENDPOINTS.seasons.seasonDrivers(seasonId),
    { params },
  );
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}

/**
 * Get available league drivers (not in season)
 */
export async function getAvailableDrivers(
  seasonId: number,
  leagueId: number,
  params?: LeagueDriversQueryParams,
): Promise<PaginatedAvailableDriversResponse> {
  const response: AxiosResponse<PaginatedAvailableDriversApiResponse> = await apiClient.get(
    API_ENDPOINTS.seasons.availableDrivers(seasonId),
    {
      params: {
        ...params,
        league_id: leagueId,
      },
    },
  );
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}

/**
 * Add driver to season
 */
export async function addDriverToSeason(
  seasonId: number,
  data: AddDriverToSeasonRequest,
): Promise<SeasonDriver> {
  const response: AxiosResponse<ApiResponse<SeasonDriver>> = await apiClient.post(
    API_ENDPOINTS.seasons.seasonDrivers(seasonId),
    data,
  );
  return response.data.data;
}

/**
 * Update season-driver metadata
 */
export async function updateSeasonDriver(
  seasonId: number,
  seasonDriverId: number,
  data: UpdateSeasonDriverRequest,
): Promise<SeasonDriver> {
  const response: AxiosResponse<ApiResponse<SeasonDriver>> = await apiClient.put(
    API_ENDPOINTS.seasons.seasonDriverDetail(seasonId, seasonDriverId),
    data,
  );
  return response.data.data;
}

/**
 * Remove driver from season
 */
export async function removeDriverFromSeason(
  seasonId: number,
  leagueDriverId: number,
): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.seasons.seasonDriverDetail(seasonId, leagueDriverId));
}

/**
 * Get season-driver statistics
 */
export async function getSeasonDriverStats(seasonId: number): Promise<SeasonDriverStats> {
  const response: AxiosResponse<ApiResponse<SeasonDriverStats>> = await apiClient.get(
    API_ENDPOINTS.seasons.seasonDriverStats(seasonId),
  );
  return response.data.data;
}
