import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type { PlatformRaceSettings } from '@app/types/race';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// GET race settings for platform
export async function getRaceSettings(platformId: number): Promise<PlatformRaceSettings> {
  const response: AxiosResponse<ApiResponse<PlatformRaceSettings>> = await apiClient.get(
    API_ENDPOINTS.platforms.raceSettings(platformId),
  );
  return response.data.data;
}
