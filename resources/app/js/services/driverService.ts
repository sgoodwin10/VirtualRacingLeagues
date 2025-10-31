/**
 * Driver API Service
 * Handles all HTTP requests related to driver management within leagues
 */

import { apiClient } from './api';
import type {
  LeagueDriver,
  CreateDriverRequest,
  UpdateDriverRequest,
  UpdateLeagueDriverRequest,
  ImportDriversRequest,
  ImportDriversBackendResponse,
  ImportDriversResponse,
  PaginatedDriversResponse,
  LeagueDriversQueryParams,
} from '@app/types/driver';
import type { AxiosResponse } from 'axios';

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Paginated API response wrapper
 */
interface PaginatedApiResponse {
  success: boolean;
  data: LeagueDriver[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  message?: string;
}

/**
 * Get all drivers for a specific league with optional filters
 * @param leagueId - League ID
 * @param params - Query parameters (pagination, search, status filter)
 */
export async function getLeagueDrivers(
  leagueId: number,
  params?: LeagueDriversQueryParams,
): Promise<PaginatedDriversResponse> {
  const response: AxiosResponse<PaginatedApiResponse> = await apiClient.get(
    `/leagues/${leagueId}/drivers`,
    { params },
  );

  // Check if the response has the expected structure
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Invalid API response structure');
  }

  // Transform the API response to match the expected structure
  const meta = response.data.meta || {
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 0,
  };

  return {
    data: response.data.data || [],
    meta: {
      ...meta,
      from: null,
      to: null,
    },
  };
}

/**
 * Create a new driver and add to league
 * @param leagueId - League ID
 * @param data - Driver creation data
 */
export async function createDriver(
  leagueId: number,
  data: CreateDriverRequest,
): Promise<LeagueDriver> {
  const response: AxiosResponse<ApiResponse<LeagueDriver>> = await apiClient.post(
    `/leagues/${leagueId}/drivers`,
    data,
  );
  return response.data.data;
}

/**
 * Get a specific driver in a league
 * @param leagueId - League ID
 * @param driverId - Driver ID
 */
export async function getLeagueDriver(leagueId: number, driverId: number): Promise<LeagueDriver> {
  const response: AxiosResponse<ApiResponse<LeagueDriver>> = await apiClient.get(
    `/leagues/${leagueId}/drivers/${driverId}`,
  );
  return response.data.data;
}

/**
 * Update driver and league-specific settings
 * @param leagueId - League ID
 * @param driverId - Driver ID
 * @param data - Update data (driver fields and league settings)
 */
export async function updateDriver(
  leagueId: number,
  driverId: number,
  data: UpdateDriverRequest,
): Promise<LeagueDriver> {
  const response: AxiosResponse<ApiResponse<LeagueDriver>> = await apiClient.put(
    `/leagues/${leagueId}/drivers/${driverId}`,
    data,
  );
  return response.data.data;
}

/**
 * Update league-specific driver settings only
 * @param leagueId - League ID
 * @param driverId - Driver ID
 * @param data - Update data (number, status, notes)
 * @deprecated Use updateDriver instead for full driver updates
 */
export async function updateLeagueDriver(
  leagueId: number,
  driverId: number,
  data: UpdateLeagueDriverRequest,
): Promise<LeagueDriver> {
  const response: AxiosResponse<ApiResponse<LeagueDriver>> = await apiClient.put(
    `/leagues/${leagueId}/drivers/${driverId}`,
    data,
  );
  return response.data.data;
}

/**
 * Remove a driver from a league
 * @param leagueId - League ID
 * @param driverId - Driver ID
 */
export async function removeDriverFromLeague(leagueId: number, driverId: number): Promise<void> {
  await apiClient.delete(`/leagues/${leagueId}/drivers/${driverId}`);
}

/**
 * Import drivers from CSV data
 * @param leagueId - League ID
 * @param csvData - CSV string data
 */
export async function importDriversFromCSV(
  leagueId: number,
  csvData: string,
): Promise<ImportDriversResponse> {
  const payload: ImportDriversRequest = { csv_data: csvData };
  const response: AxiosResponse<ApiResponse<ImportDriversBackendResponse>> = await apiClient.post(
    `/leagues/${leagueId}/drivers/import-csv`,
    payload,
  );

  // Backend now returns the correct format directly
  return response.data.data;
}
