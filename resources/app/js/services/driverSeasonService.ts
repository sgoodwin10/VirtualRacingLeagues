/**
 * Driver Season API Service
 * Handles all HTTP requests related to driver season participation
 */

import { apiClient } from './api';
import type { LeagueDriverSeasonData } from '@app/types/driver';
import type { AxiosResponse } from 'axios';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';
import type { ApiResponse } from '@app/types/api';

/**
 * Get all seasons a driver is participating in
 * @param leagueId - League ID
 * @param leagueDriverId - League driver ID
 * @returns Promise resolving to array of league driver season data
 */
export async function getLeagueDriverSeasons(
  leagueId: number,
  leagueDriverId: number,
): Promise<LeagueDriverSeasonData[]> {
  const response: AxiosResponse<ApiResponse<LeagueDriverSeasonData[]>> = await apiClient.get(
    API_ENDPOINTS.leagues.driverSeasons(leagueId, leagueDriverId),
  );
  return response.data.data;
}
