import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type { PlatformRaceSettings } from '@user/types/race';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// GET race settings for platform
export async function getRaceSettings(platformId: number): Promise<PlatformRaceSettings> {
  const response: AxiosResponse<ApiResponse<PlatformRaceSettings>> = await apiClient.get(
    `/platforms/${platformId}/race-settings`,
  );
  return response.data.data;
}
