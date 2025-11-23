import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type { Track, TrackLocationGroup, TrackSearchParams } from '@app/types/track';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export async function getTracks(params: TrackSearchParams): Promise<TrackLocationGroup[]> {
  const response: AxiosResponse<ApiResponse<TrackLocationGroup[]>> = await apiClient.get(
    API_ENDPOINTS.tracks.list(),
    {
      params,
    },
  );
  return response.data.data;
}

export async function getTrack(trackId: number): Promise<Track> {
  const response: AxiosResponse<ApiResponse<Track>> = await apiClient.get(
    API_ENDPOINTS.tracks.detail(trackId),
  );
  return response.data.data;
}
